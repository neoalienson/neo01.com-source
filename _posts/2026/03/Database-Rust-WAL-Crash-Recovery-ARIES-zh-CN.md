---
title: "使用 Rust 构建 PostgreSQL 兼容数据库：WAL 与 ARIES 崩溃恢复"
date: 2026-03-04
categories:
  - Development
tags:
  - PostgreSQL
  - Rust
  - Database Internals
excerpt: "Vaultgres 旅程第四部分：实现预写日志和 ARIES 恢复算法。深入探讨持久性、检查点，以及让数据库从崩溃中恢复的三阶段恢复。"
lang: zh-CN
available_langs: []
thumbnail: /assets/architecture/vaultgres_thumbnail.jpg
thumbnail_80: /assets/architecture/vaultgres_thumbnail_80.jpg
series: vaultgres-journey
canonical_lang: en
comments: true
---

在 [第三部分](/zh-CN/2026/03/Building-PostgreSQL-Compatible-Database-Rust-MVCC-Transaction-Manager/) 中，我们构建了用于并发事务的 MVCC。但有一个可怕的问题我们还没有回答。

**停电时会发生什么？**

```
Transaction: UPDATE accounts SET balance = 1000 WHERE id = 1

1. Read page into buffer pool
2. Modify page in memory (balance = 1000)
3. Mark page as dirty
4. ACK to client: "Done!"
5. ⚡ POWER FAILURE ⚡
6. Dirty page never written to disk
7. Client's money: GONE 💸
```

这就是数据库使用 **WAL：预写日志** 的原因。

今天：在 Rust 中实现 WAL 和 ARIES 恢复算法。这就是确保你的数据在崩溃、停电和核心恐慌中存活的代码。

---

## 1 WAL 原则

### 基本规则

**预写日志：** 在修改任何数据页面前，你**必须**将变更写入 WAL。

```rust
// ❌ WRONG - data modification before WAL
pub fn update(&self, row_id: RowId, new_data: &[u8]) -> Result<(), Error> {
    let mut page = self.buffer_pool.get_page(row_id.page_id)?;
    page.write(row_id.offset, new_data);  // Modified in memory!
    page.mark_dirty();

    // WAL comes too late
    self.wal.log_update(row_id, new_data)?;  // Too late!

    Ok(())
}

// ✅ CORRECT - WAL first
pub fn update(&self, row_id: RowId, new_data: &[u8]) -> Result<(), Error> {
    // 1. Generate LSN (Log Sequence Number)
    let lsn = self.wal.log_update(row_id, new_data)?;

    // 2. Flush WAL to disk (fsync)
    self.wal.flush(lsn)?;

    // 3. NOW safe to modify page
    let mut page = self.buffer_pool.get_page(row_id.page_id)?;
    page.write(row_id.offset, new_data);
    page.set_lsn(lsn);  // Track which LSN modified this page
    page.mark_dirty();

    Ok(())
}
```

**为什么这样有效：**

```
Crash at different points:

After WAL write, before page modify:
→ Recovery replays WAL, data is restored ✓

After page modify, before flush:
→ WAL on disk, recovery ensures durability ✓

After flush to disk:
→ Data is durable ✓
```

---

### 日志序列号 (LSN)

每个 WAL 记录获得一个独特的、单调递增的标识符：

```rust
// src/wal/lsn.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Lsn(u64);

impl Lsn {
    pub const INVALID: Lsn = Lsn(0);
    pub const fn new(value: u64) -> Self {
        Self(value)
    }

    pub const fn invalid(&self) -> bool {
        self.0 == 0
    }

    // LSN encoding: segment_id (high 32) + offset (low 32)
    pub const fn from_segment_offset(segment: u32, offset: u32) -> Self {
        Self(((segment as u64) << 32) | (offset as u64))
    }

    pub const fn segment(&self) -> u32 {
        (self.0 >> 32) as u32
    }

    pub const fn offset(&self) -> u32 {
        (self.0 & 0xFFFFFFFF) as u32
    }
}
```

**LSN 顺序保证：**

```
LSN 100: BEGIN txn 1
LSN 101: INSERT row A (txn 1)
LSN 102: INSERT row B (txn 1)
LSN 103: COMMIT txn 1
LSN 104: BEGIN txn 2
LSN 105: UPDATE row A (txn 2)
...

LSN 100 < LSN 101 < LSN 102 < ...  (strictly increasing)
```

---

## 2 WAL 记录格式

### 记录结构

```rust
// src/wal/record.rs
use crate::storage::PageId;
use crate::transaction::TransactionId;

#[derive(Debug, Clone)]
pub struct WalRecord {
    pub lsn: Lsn,
    pub prev_lsn: Lsn,  // Link to previous record from same transaction
    pub transaction_id: TransactionId,
    pub record_type: WalRecordType,
    pub page_id: PageId,
    pub offset: u16,
    pub data: WalData,
    pub checksum: u32,
}

#[derive(Debug, Clone)]
pub enum WalRecordType {
    Begin,
    Insert,
    Update { before_image: Vec<u8>, after_image: Vec<u8> },
    Delete { before_image: Vec<u8> },
    Commit,
    Abort,
    CheckpointBegin,
    CheckpointEnd,
    Compensation { undo_next_lsn: Lsn },  // For aborts
}

#[derive(Debug, Clone)]
pub enum WalData {
    PageImage(Vec<u8>),      // Full page image (for checkpoints)
    RowData(Vec<u8>),        // Row-level change
    IndexEntry { key: Vec<u8>, value: Vec<u8> },
}
```

**磁盘上的实体布局：**

```
┌─────────────────────────────────────────────────────────────┐
│ WAL Segment File (e.g., 000000010000000000000001)           │
├─────────────────────────────────────────────────────────────┤
│ PageHeader (16 bytes)                                       │
├─────────────────────────────────────────────────────────────┤
│ Record 1:                                                   │
│   ├─ Length (4 bytes)                                       │
│   ├─ LSN (8 bytes)                                          │
│   ├─ Prev LSN (8 bytes)                                     │
│   ├─ Transaction ID (4 bytes)                               │
│   ├─ Record Type (1 byte)                                   │
│   ├─ Page ID (8 bytes)                                      │
│   ├─ Offset (2 bytes)                                       │
│   ├─ Data Length (4 bytes)                                  │
│   ├─ Data (variable)                                        │
│   └─ Checksum (4 bytes)                                     │
├─────────────────────────────────────────────────────────────┤
│ Record 2:                                                   │
│   ...                                                       │
└─────────────────────────────────────────────────────────────┘
```

---

### 实体 vs. 逻辑 WAL

**PostgreSQL 使用实体 WAL**（页面级别变更）：

| 类型 | 记录内容 | 优点 | 缺点 |
|------|---------------|------|------|
| **实体** | 页面上的字节范围 | 简单的 replay，精确的变更 | 较大的日志，依赖页面格式 |
| **逻辑** | SQL 操作 (INSERT/UPDATE) | 较小的日志，格式独立 | 复杂的 replay，必须重新执行 |

**Vaultgres 方法：** 实体 WAL 以简化（匹配 PostgreSQL）：

```rust
pub struct PhysicalWalRecord {
    pub page_id: PageId,
    pub offset: u16,
    pub length: u16,
    pub before_image: Option<Vec<u8>>,  // For undo
    pub after_image: Vec<u8>,            // For redo
}
```

---

## 3 WAL 管理器实现

### 写入 WAL 记录

```rust
// src/wal/manager.rs
use std::fs::{File, OpenOptions};
use std::io::{Write, Seek, SeekFrom};
use std::path::PathBuf;
use parking_lot::Mutex;

pub struct WalManager {
    wal_dir: PathBuf,
    current_segment: u32,
    current_file: Mutex<File>,
    current_offset: Mutex<u32>,
    flush_lsn: Mutex<Lsn>,
    last_lsn: AtomicU64,
}

impl WalManager {
    pub fn new(wal_dir: &str) -> Result<Self, WalError> {
        std::fs::create_dir_all(wal_dir)?;

        let mut manager = Self {
            wal_dir: PathBuf::from(wal_dir),
            current_segment: 0,
            current_file: Mutex::new(File::create("")?),  // Placeholder
            current_offset: Mutex::new(0),
            flush_lsn: Mutex::new(Lsn::INVALID),
            last_lsn: AtomicU64::new(0),
        };

        manager.open_or_create_segment(0)?;
        Ok(manager)
    }

    fn open_or_create_segment(&mut self, segment: u32) -> Result<(), WalError> {
        let path = self.wal_dir.join(format!("{:024X}", segment));

        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(&path)?;

        *self.current_file.lock() = file;
        self.current_segment = segment;
        *self.current_offset.lock() = 0;

        Ok(())
    }

    pub fn append(&self, record: WalRecord) -> Result<Lsn, WalError> {
        // Assign new LSN
        let lsn = Lsn::new(self.last_lsn.fetch_add(1, Ordering::SeqCst) + 1);

        // Serialize record
        let mut buffer = Vec::new();
        self.serialize_record(&record, lsn, &mut buffer)?;

        // Check if we need a new segment
        let mut offset = self.current_offset.lock();
        if *offset + buffer.len() as u32 > SEGMENT_SIZE {
            drop(offset);
            self.rotate_segment()?;
            offset = self.current_offset.lock();
        }

        // Write to file
        let mut file = self.current_file.lock();
        file.seek(SeekFrom::Start(*offset as u64))?;
        file.write_all(&buffer)?;

        *offset += buffer.len() as u32;

        Ok(lsn)
    }

    pub fn flush(&self, target_lsn: Lsn) -> Result<(), WalError> {
        let mut flush_lsn = self.flush_lsn.lock();

        // Already flushed?
        if *flush_lsn >= target_lsn {
            return Ok(());
        }

        // Sync to disk
        self.current_file.lock().sync_all()?;
        *flush_lsn = target_lsn;

        Ok(())
    }
}
```

---

### 读取 WAL 记录

```rust
impl WalManager {
    pub fn read_from(&self, start_lsn: Lsn) -> Result<WalIterator, WalError> {
        let segment = start_lsn.segment();
        let offset = start_lsn.offset();

        let path = self.wal_dir.join(format!("{:024X}", segment));
        let file = File::open(&path)?;

        Ok(WalIterator {
            current_file: file,
            current_segment: segment,
            current_offset: offset,
            wal_dir: self.wal_dir.clone(),
        })
    }
}

pub struct WalIterator {
    current_file: File,
    current_segment: u32,
    current_offset: u32,
    wal_dir: PathBuf,
}

impl Iterator for WalIterator {
    type Item = Result<WalRecord, WalError>;

    fn next(&mut self) -> Option<Self::Item> {
        // Try to read record at current position
        match self.read_record() {
            Ok(Some(record)) => Some(Ok(record)),
            Ok(None) => {
                // End of segment, try next segment
                self.current_segment += 1;
                self.current_offset = 0;

                let path = self.wal_dir.join(format!("{:024X}", self.current_segment));
                self.current_file = File::open(&path).ok()?;

                self.read_record().map(|r| r.ok()).flatten()
            }
            Err(e) => Some(Err(e)),
        }
    }
}
```

---

## 4 检查点：限制恢复时间

### 问题：无边界的 replay

**没有检查点：**

```
Day 1: Database created
Day 30: Crash!
Recovery: Replay 30 days of WAL records 😱
```

**解决方案：** 定期检查点。

---

### 检查点流程

```mermaid
sequenceDiagram
    participant DB as Database
    participant WAL as WAL Manager
    participant BP as Buffer Pool
    participant CKPT as Checkpoint File

    DB->>DB: 1. Write CHECKPOINT_BEGIN record
    DB->>BP: 2. Flush all dirty pages
    BP-->>DB: Pages written to disk
    DB->>DB: 3. Write CHECKPOINT_END record
    DB->>WAL: 4. Flush WAL to disk
    DB->>CKPT: 5. Save checkpoint LSN
    CKPT-->>DB: Checkpoint complete
```

```rust
// src/wal/checkpoint.rs
pub struct Checkpoint {
    pub checkpoint_lsn: Lsn,
    pub active_transactions: Vec<TransactionId>,
    pub dirty_pages: Vec<(PageId, Lsn)>,  // page_id → page_lsn
}

impl WalManager {
    pub fn create_checkpoint(&self, buffer_pool: &BufferPool) -> Result<Checkpoint, WalError> {
        // 1. Log checkpoint begin
        let begin_lsn = self.append(WalRecord::checkpoint_begin())?;

        // 2. Flush all dirty pages (this is the expensive part!)
        buffer_pool.flush_all()?;

        // 3. Get current state
        let checkpoint = Checkpoint {
            checkpoint_lsn: begin_lsn,
            active_transactions: self.get_active_transactions(),
            dirty_pages: buffer_pool.get_dirty_pages(),
        };

        // 4. Log checkpoint end
        let end_lsn = self.append(WalRecord::checkpoint_end(&checkpoint))?;

        // 5. Flush WAL
        self.flush(end_lsn)?;

        // 6. Save checkpoint to known location
        self.save_checkpoint_record(&checkpoint)?;

        Ok(checkpoint)
    }
}
```

---

### Fuzzy 检查点 (PostgreSQL 风格)

**Sharp 检查点：** 检查点期间阻塞所有写入。简单但会造成停顿。

**Fuzzy 检查点：** 检查点期间允许写入。复杂但无停顿。

```rust
// Fuzzy checkpoint approach
pub fn create_fuzzy_checkpoint(&self, buffer_pool: &BufferPool) -> Result<Checkpoint, WalError> {
    // 1. Record checkpoint start LSN
    let start_lsn = self.current_lsn();

    // 2. Write CHECKPOINT_BEGIN (don't block)
    self.append(WalRecord::checkpoint_begin())?;

    // 3. Get list of dirty pages (snapshot)
    let dirty_pages = buffer_pool.get_dirty_pages_snapshot();

    // 4. Flush dirty pages in background (don't block new writes)
    let checkpoint_lsn = self.current_lsn();

    for (page_id, page_lsn) in dirty_pages {
        if page_lsn < checkpoint_lsn {
            buffer_pool.flush_page(page_id)?;
        }
    }

    // 5. Write CHECKPOINT_END with final LSN
    let end_lsn = self.current_lsn();
    self.append(WalRecord::checkpoint_end_at(end_lsn))?;
    self.flush(end_lsn)?;

    Ok(Checkpoint {
        checkpoint_lsn: end_lsn,
        // ...
    })
}
```

---

## 5 ARIES：恢复算法

### 三个阶段

ARIES = **A**lgorithm for **R**ecovery and **I**solation **E**xploiting **S**emantics

```
┌─────────────────────────────────────────────────────────────┐
│                    ARIES Recovery                           │
├─────────────────────────────────────────────────────────────┤
│ Phase 1: ANALYSIS                                           │
│ - Scan WAL from last checkpoint                             │
│ - Determine which transactions were active at crash         │
│ - Build dirty page table                                    │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: REDO                                               │
│ - Replay ALL logged changes from analysis end               │
│ - Bring database to exact crash state                       │
│ - Skip pages already on disk (using page LSN)               │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: UNDO                                               │
│ - Roll back all uncommitted transactions                    │
│ - Write Compensation Log Records (CLRs)                     │
│ - Database is now consistent                                │
└─────────────────────────────────────────────────────────────┘
```

---

### 第一阶段：Analysis

```rust
// src/recovery/analysis.rs
pub struct AnalysisResult {
    pub transactions_at_crash: HashMap<TransactionId, TxnStatus>,
    pub dirty_page_table: HashMap<PageId, Lsn>,  // page → first LSN that dirtied it
    pub redo_start_lsn: Lsn,
}

pub fn analyze(wal: &WalManager, checkpoint: &Checkpoint) -> Result<AnalysisResult, RecoveryError> {
    let mut txn_status: HashMap<TransactionId, TxnStatus> = HashMap::new();
    let mut dirty_page_table: HashMap<PageId, Lsn> = HashMap::new();

    // Initialize from checkpoint
    for txn in &checkpoint.active_transactions {
        txn_status.insert(*txn, TxnStatus::Active);
    }
    for (page_id, page_lsn) in &checkpoint.dirty_pages {
        dirty_page_table.insert(*page_id, *page_lsn);
    }

    // Scan WAL from checkpoint
    let mut iterator = wal.read_from(checkpoint.checkpoint_lsn)?;

    for record_result in iterator {
        let record = record_result?;

        match record.record_type {
            WalRecordType::Begin => {
                txn_status.insert(record.transaction_id, TxnStatus::Active);
            }
            WalRecordType::Commit => {
                txn_status.insert(record.transaction_id, TxnStatus::Committed);
            }
            WalRecordType::Abort => {
                txn_status.insert(record.transaction_id, TxnStatus::Aborted);
            }
            WalRecordType::Insert | WalRecordType::Update | WalRecordType::Delete => {
                // Track first LSN that dirtied each page
                dirty_page_table.entry(record.page_id)
                    .or_insert(record.lsn);
            }
            _ => {}
        }
    }

    // Find minimum redo LSN
    let redo_start_lsn = dirty_page_table.values()
        .min()
        .copied()
        .unwrap_or(checkpoint.checkpoint_lsn);

    Ok(AnalysisResult {
        transactions_at_crash: txn_status,
        dirty_page_table,
        redo_start_lsn,
    })
}
```

---

### 第二阶段：Redo

```rust
// src/recovery/redo.rs
pub fn redo(
    wal: &WalManager,
    buffer_pool: &BufferPool,
    analysis: &AnalysisResult,
) -> Result<(), RecoveryError> {
    let mut iterator = wal.read_from(analysis.redo_start_lsn)?;

    for record_result in iterator {
        let record = record_result?;

        // Only redo committed transactions' changes
        // (We redo ALL changes first, undo uncommitted later)
        match &record.record_type {
            WalRecordType::Insert | WalRecordType::Update | WalRecordType::Delete => {
                // Check if page needs redo
                let page = buffer_pool.get_page(record.page_id)?;
                let page_lsn = page.get_lsn();

                // Only apply if page is older than this LSN
                if page_lsn < record.lsn {
                    apply_redo(&record, &page)?;
                    page.set_lsn(record.lsn);
                }
                // Else: page already has this change (written before crash)
            }
            _ => {}
        }
    }

    Ok(())
}

fn apply_redo(record: &WalRecord, page: &Page) -> Result<(), RecoveryError> {
    match &record.data {
        WalData::PageImage(image) => {
            // Full page image (from checkpoint)
            page.copy_from_slice(image);
        }
        WalData::RowData(data) => {
            // Partial page update
            page.write(record.offset, data);
        }
        _ => {}
    }
    Ok(())
}
```

**关键洞察：** Redo 是**幂等的**。多次执行产生相同的结果。

---

### 第三阶段：Undo

```rust
// src/recovery/undo.rs
pub fn undo(
    wal: &mut WalManager,
    buffer_pool: &BufferPool,
    analysis: &AnalysisResult,
) -> Result<(), RecoveryError> {
    // Find transactions to undo (active at crash, not committed)
    let losers: Vec<TransactionId> = analysis.transactions_at_crash
        .iter()
        .filter(|(_, status)| **status == TxnStatus::Active)
        .map(|(txn, _)| *txn)
        .collect();

    // Undo in reverse order (LIFO - Last Committed, First Undone)
    for txn_id in losers.into_iter().rev() {
        undo_transaction(wal, buffer_pool, txn_id)?;
    }

    Ok(())
}

fn undo_transaction(
    wal: &mut WalManager,
    buffer_pool: &BufferPool,
    txn_id: TransactionId,
) -> Result<(), RecoveryError> {
    // Find all records for this transaction (in reverse)
    let records = wal.get_transaction_records(txn_id)?;

    for record in records.iter().rev() {
        // Write Compensation Log Record (CLR)
        let clr = WalRecord {
            lsn: wal.next_lsn(),
            prev_lsn: record.lsn,
            transaction_id: txn_id,
            record_type: WalRecordType::Compensation {
                undo_next_lsn: record.prev_lsn,
            },
            page_id: record.page_id,
            offset: record.offset,
            data: WalData::RowData(record.before_image.clone().unwrap_or_default()),
            checksum: 0,  // Calculate checksum
        };

        let clr_lsn = wal.append(clr)?;

        // Apply undo (restore before_image)
        if let Some(before_image) = &record.before_image {
            let page = buffer_pool.get_page(record.page_id)?;
            page.write(record.offset, before_image);
            page.set_lsn(clr_lsn);
        }
    }

    // Log transaction abort
    wal.append(WalRecord::abort(txn_id))?;
    wal.flush_all()?;

    Ok(())
}
```

---

### 完整的恢复流程

```rust
// src/recovery/mod.rs
pub fn recover(
    wal: &mut WalManager,
    buffer_pool: &BufferPool,
    data_dir: &str,
) -> Result<RecoveryStats, RecoveryError> {
    // 1. Find last checkpoint
    let checkpoint = find_last_checkpoint(wal, data_dir)?;

    println!("Starting recovery from checkpoint LSN {}", checkpoint.checkpoint_lsn);

    // 2. Phase 1: Analysis
    println!("Phase 1: Analysis...");
    let analysis = analyze(wal, &checkpoint)?;
    println!("  Found {} active transactions at crash",
             analysis.transactions_at_crash.len());
    println!("  Redo will start from LSN {}", analysis.redo_start_lsn);

    // 3. Phase 2: Redo
    println!("Phase 2: Redo...");
    redo(wal, buffer_pool, &analysis)?;
    println!("  Redo complete");

    // 4. Phase 3: Undo
    println!("Phase 3: Undo...");
    undo(wal, buffer_pool, &analysis)?;
    println!("  Undo complete");

    // 5. Truncate old WAL (optional)
    truncate_wal_before(wal, checkpoint.checkpoint_lsn)?;

    Ok(RecoveryStats {
        checkpoint_lsn: checkpoint.checkpoint_lsn,
        redo_start_lsn: analysis.redo_start_lsn,
        transactions_aborted: analysis.transactions_at_crash
            .iter()
            .filter(|(_, s)| **s == TxnStatus::Active)
            .count(),
    })
}
```

---

## 6 恢复示例：逐步说明

### 崩溃情景

```
Time    LSN    Transaction    Action
─────────────────────────────────────────────────────
10:00   100    CKPT           Checkpoint created
10:01   101    T1 (xid=1)     BEGIN
10:02   102    T1             INSERT row A (balance=100)
10:03   103    T2 (xid=2)     BEGIN
10:04   104    T2             INSERT row B (balance=200)
10:05   105    T1             COMMIT
10:06   106    T2             UPDATE row B (balance=250)
10:07   ─────  ⚡ CRASH ⚡
```

**崩溃时的状态：**
- T1: Committed (LSN 105)
- T2: Active (not committed)
- Dirty pages: A (LSN 102), B (LSN 106)

---

### 恢复执行

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: ANALYSIS                                           │
├─────────────────────────────────────────────────────────────┤
│ Start from checkpoint LSN 100                               │
│ Scan records 100-106                                        │
│                                                             │
│ Result:                                                     │
│   - T1: Committed (LSN 105)                                 │
│   - T2: Active (loser!)                                     │
│   - Dirty pages: A→102, B→106                               │
│   - Redo start: LSN 102                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Phase 2: REDO                                               │
├─────────────────────────────────────────────────────────────┤
│ Replay from LSN 102:                                        │
│                                                             │
│ LSN 102: INSERT row A                                       │
│   → Check page A LSN                                        │
│   → If page LSN < 102: apply insert                         │
│   → Else: skip (already on disk)                            │
│                                                             │
│ LSN 104: INSERT row B                                       │
│   → Apply if needed                                         │
│                                                             │
│ LSN 106: UPDATE row B                                       │
│   → Apply if needed                                         │
│                                                             │
│ Result: Database at exact crash state                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Phase 3: UNDO                                               │
├─────────────────────────────────────────────────────────────┤
│ Loser transactions: T2                                      │
│                                                             │
│ Undo T2 (in reverse order):                                 │
│   1. Undo LSN 106 (UPDATE B: 200→250)                       │
│      → Write CLR: undo_next_lsn = 104                       │
│      → Restore B to balance=200                             │
│                                                             │
│   2. Undo LSN 104 (INSERT B)                                │
│      → Write CLR: undo_next_lsn = 103                       │
│      → Delete row B                                         │
│                                                             │
│   3. Log T2 ABORT                                           │
│                                                             │
│ Result: T2's changes rolled back, T1's changes preserved    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7 WAL 归档和时间点恢复

### WAL 归档

**连续归档：** 在重用前将 WAL 段复制到安全存储。

```rust
// src/wal/archiver.rs
pub struct WalArchiver {
    wal_dir: PathBuf,
    archive_dir: PathBuf,
    archive_timeout: Duration,
    last_archived_segment: u32,
}

impl WalArchiver {
    pub fn archive_ready_segments(&mut self) -> Result<(), WalError> {
        // Find completed segments (can't be overwritten)
        for segment in self.get_ready_segments() {
            let src = self.wal_dir.join(format!("{:024X}", segment));
            let dst = self.archive_dir.join(format!("{:024X}.backup", segment));

            // Copy to archive (could be remote storage like S3)
            std::fs::copy(&src, &dst)?;

            self.last_archived_segment = segment;
        }

        Ok(())
    }
}
```

---

### 时间点恢复 (PITR)

```
Goal: Restore database to state at 2026-03-22 14:30:00

1. Restore base backup from 2026-03-22 00:00:00
2. Replay WAL segments from archive
3. Stop replay at target time (14:30:00)
4. Database restored to exact point in time
```

```rust
// src/recovery/pitr.rs
pub fn recover_to_point_in_time(
    base_backup: &str,
    archive_dir: &str,
    target_time: chrono::DateTime<chrono::Utc>,
) -> Result<(), RecoveryError> {
    // 1. Restore base backup
    restore_base_backup(base_backup)?;

    // 2. Find WAL segments to replay
    let segments = find_wal_segments_for_time_range(archive_dir, target_time)?;

    // 3. Replay WAL up to target time
    for segment in segments {
        let records = read_wal_segment(&segment)?;

        for record in records {
            // Check if we've passed target time
            if record.timestamp > target_time {
                println!("Reached target time, stopping recovery");
                return Ok(());
            }

            apply_redo_record(&record)?;
        }
    }

    Ok(())
}
```

---

## 8 用 Rust 构建的挑战

### 挑战 1：fsync 和持久性

**问题：** Rust 的 `File::sync_all()` 是正确的，但容易忘记。

```rust
// ❌ Missing fsync - data NOT durable!
pub fn commit(&self, txn_id: TransactionId) -> Result<(), Error> {
    let record = WalRecord::commit(txn_id);
    self.wal.append(record)?;
    // Forgot to flush!
    Ok(())
}

// ✅ Correct
pub fn commit(&self, txn_id: TransactionId) -> Result<(), Error> {
    let record = WalRecord::commit(txn_id);
    let lsn = self.wal.append(record)?;
    self.wal.flush(lsn)?;  // fsync!
    Ok(())
}
```

**教训：** 将 WAL 操作包装在强制刷新的安全抽象中。

---

### 挑战 2：LSN 顺序和并发

**问题：** 多个线程附加 WAL 记录必须获得单调递增的 LSN。

```rust
// ❌ Race condition - LSNs not ordered!
pub fn append(&self, record: WalRecord) -> Lsn {
    let lsn = self.current_lsn + 1;  // Not atomic!
    self.current_lsn = lsn;
    // ...
}

// ✅ Correct - atomic LSN allocation
pub fn append(&self, record: WalRecord) -> Result<Lsn, WalError> {
    let lsn = Lsn::new(self.last_lsn.fetch_add(1, Ordering::SeqCst) + 1);
    // ...
}
```

---

### 挑战 3：部分写入和校验和

**问题：** WAL 写入期间崩溃 = 磁盘上的部分记录。

```rust
// Solution: Checksums + length prefix
pub fn serialize_record(record: &WalRecord, buffer: &mut Vec<u8>) {
    let data_start = buffer.len();

    // Write placeholder for length (fill in later)
    buffer.extend_from_slice(&[0u8; 4]);

    // Write record fields
    buffer.extend_from_slice(&record.lsn.to_le_bytes());
    // ... more fields ...
    buffer.extend_from_slice(&record.data);

    // Calculate checksum over everything except checksum field
    let checksum = crc32::calculate(&buffer[data_start + 4..]);
    buffer.extend_from_slice(&checksum.to_le_bytes());

    // Fill in length
    let total_len = buffer.len() - data_start;
    buffer[data_start..data_start + 4]
        .copy_from_slice(&(total_len as u32).to_le_bytes());
}

pub fn deserialize_record(buffer: &[u8]) -> Result<WalRecord, WalError> {
    // Read length
    let length = u32::from_le_bytes(buffer[0..4].try_into()?) as usize;

    // Verify we have enough data
    if buffer.len() < length {
        return Err(WalError::PartialWrite);
    }

    // Verify checksum
    let stored_checksum = u32::from_le_bytes(
        buffer[length - 4..length].try_into()?
    );
    let calculated = crc32::calculate(&buffer[4..length - 4]);

    if stored_checksum != calculated {
        return Err(WalError::ChecksumMismatch);
    }

    // ... parse record ...
}
```

---

## 9 AI 如何加速这项工作

### AI 做对了什么

| 任务 | AI 贡献 |
|------|-----------------|
| **ARIES 阶段** | 清楚解释 analysis/redo/undo |
| **LSN 结构** | 建议段/偏移编码 |
| **检查点设计** | 概述 fuzzy vs. sharp 权衡 |
| **CLR 记录** | 解释补偿日志记录目的 |

---

### AI 做错了什么

| 问题 | 发生了什么 |
|-------|---------------|
| **Redo 逻辑** | 初稿只 redo 已提交事务（错误！Redo ALL，然后 undo） |
| **Undo 顺序** | 建议正向顺序而不是反向（LIFO） |
| **Page LSN** | 忽略了 page LSN 用于跳过冗余 redo |

**模式：** ARIES 很微妙。「redo all, undo some」的洞察是反直觉的。

---

### 示例：理解 Redo 哲学

**我问 AI 的问题：**

> "为什么 ARIES redo 未提交的事务？我们不应该只 redo 已提交的吗？"

**我学到的：**

1. **Redo 阶段：** 将数据库带到精确的崩溃状态（包括未提交的变更）
2. **Undo 阶段：** 回滚未提交事务
3. **为什么？** 比在 redo 期间追踪依赖关系更简单
4. **关键洞察：** Redo 是幂等的，undo 必须记录（CLRs）

**结果：** 正确的 redo 实现：

```rust
// Redo ALL records, not just committed
if page_lsn < record.lsn {
    apply_redo(&record, &page)?;  // Apply regardless of txn status
}
// Undo phase will handle uncommitted transactions
```

---

## 总结：WAL 和 ARIES 一张图

```mermaid
flowchart TD
    subgraph "Normal Operation"
        A[Transaction] --> B[Write WAL Record]
        B --> C[Flush WAL fsync]
        C --> D[Modify Page]
        D --> E[Mark Dirty]
        E --> F[ACK to Client]
        F --> G[Checkpoint Later]
    end

    subgraph "Crash Recovery"
        H[⚡ CRASH ⚡] --> I[Restart Database]
        I --> J[Phase 1: Analysis]
        J --> K[Find Active Transactions]
        K --> L[Phase 2: Redo]
        L --> M[Replay All WAL from Checkpoint]
        M --> N[Phase 3: Undo]
        N --> O[Rollback Loser Transactions]
        O --> P[Database Consistent]
    end

    subgraph "WAL Structure"
        Q[WAL Segment 1] --> R[WAL Segment 2]
        R --> S[WAL Segment 3]
        T[Checkpoint Record] -.-> Q
    end

    style C fill:#fff3e0,stroke:#f57c00
    style J fill:#e3f2fd,stroke:#1976d2
    style L fill:#e3f2fd,stroke:#1976d2
    style N fill:#e3f2fd,stroke:#1976d2
    style P fill:#e8f5e9,stroke:#388e3c
```

**关键要点：**

| 概念 | 为什么重要 |
|---------|----------------|
| **WAL** | 不牺牲性能的持久性 |
| **LSN** | 所有变更的总顺序 |
| **检查点** | 限制恢复时间 |
| **ARIES Analysis** | 确定需要恢复的内容 |
| **ARIES Redo** | replay 到精确崩溃状态 |
| **ARIES Undo** | 回滚未提交的工作 |
| **CLRs** | 幂等的 undo，防止重复 undo |

---

**进一步阅读：**

- "ARIES: A Transaction Recovery Method Supporting Fine Granularity Locking" by Mohan et al. (1992)
- PostgreSQL Source: [`src/backend/access/transam/xlog.c`](https://github.com/postgres/postgres/blob/master/src/backend/access/transam/xlog.c)
- PostgreSQL Source: [`src/backend/access/transam/xlogfuncs.c`](https://github.com/postgres/postgres/blob/master/src/backend/access/transam/xlogfuncs.c)
- "Database Management Systems" by Ramakrishnan (Ch. 17: Recovery)
- "Readings in Database Systems" (Red Book) - ARIES chapter
- Vaultgres Repository: [github.com/neoalienson/Vaultgres](https://github.com/neoalienson/Vaultgres)
