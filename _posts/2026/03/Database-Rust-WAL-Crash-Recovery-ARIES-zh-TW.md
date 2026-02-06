---
title: "使用 Rust 建構 PostgreSQL 相容資料庫：WAL 與 ARIES 崩潰恢復"
date: 2026-03-04
categories:
  - Development
tags:
  - PostgreSQL
  - Rust
  - Database Internals
excerpt: "Vaultgres 旅程第四部分：實作預寫日誌和 ARIES 恢復演算法。深入探討持久性、檢查點，以及讓資料庫從崩潰中恢復的三階段恢復。"
lang: zh-TW
available_langs: []
thumbnail: /assets/architecture/vaultgres_thumbnail.jpg
thumbnail_80: /assets/architecture/vaultgres_thumbnail_80.jpg
series: vaultgres-journey
canonical_lang: en
comments: true
---

在 [第三部分](/zh-TW/2026/03/Building-PostgreSQL-Compatible-Database-Rust-MVCC-Transaction-Manager/) 中，我們建構了用於併發交易的 MVCC。但有一個可怕的問題我們還沒有回答。

**停電時會發生什麼？**

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

這就是資料庫使用 **WAL：預寫日誌** 的原因。

今天：在 Rust 中實作 WAL 和 ARIES 恢復演算法。這就是確保你的資料在崩潰、停電和核心恐慌中存活的程式碼。

---

## 1 WAL 原則

### 基本規則

**預寫日誌：** 在修改任何資料頁面前，你**必須**將變更寫入 WAL。

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

**為什麼這樣有效：**

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

### 日誌序列號 (LSN)

每個 WAL 記錄獲得一個獨特的、單調遞增的識別符：

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

**LSN 順序保證：**

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

## 2 WAL 記錄格式

### 記錄結構

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

**磁碟上的實體佈局：**

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

### 實體 vs. 邏輯 WAL

**PostgreSQL 使用實體 WAL**（頁面級別變更）：

| 類型 | 記錄內容 | 優點 | 缺點 |
|------|---------------|------|------|
| **實體** | 頁面上的位元組範圍 | 簡單的 replay，精確的變更 | 較大的日誌，依賴頁面格式 |
| **邏輯** | SQL 操作 (INSERT/UPDATE) | 較小的日誌，格式獨立 | 複雜的 replay，必須重新執行 |

**Vaultgres 方法：** 實體 WAL 以簡單化（匹配 PostgreSQL）：

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

## 3 WAL 管理員實作

### 寫入 WAL 記錄

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

### 讀取 WAL 記錄

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

## 4 檢查點：限制恢復時間

### 問題：無邊界的 replay

**沒有檢查點：**

```
Day 1: Database created
Day 30: Crash!
Recovery: Replay 30 days of WAL records 😱
```

**解決方案：** 定期檢查點。

---

### 檢查點流程

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

### Fuzzy 檢查點 (PostgreSQL 風格)

**Sharp 檢查點：** 檢查點期間阻塞所有寫入。簡單但會造成停頓。

**Fuzzy 檢查點：** 檢查點期間允許寫入。複雜但無停頓。

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

## 5 ARIES：恢復演算法

### 三個階段

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

### 第一階段：Analysis

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

### 第二階段：Redo

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

**關鍵洞察：** Redo 是**冪等的**。多次執行產生相同的結果。

---

### 第三階段：Undo

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

### 完整的恢復流程

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

## 6 恢復範例：逐步說明

### 崩潰情境

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

**崩潰時的狀態：**
- T1: Committed (LSN 105)
- T2: Active (not committed)
- Dirty pages: A (LSN 102), B (LSN 106)

---

### 恢復執行

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

## 7 WAL 歸檔和時間點恢復

### WAL 歸檔

**連續歸檔：** 在重用前將 WAL 區段複製到安全儲存。

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

### 時間點恢復 (PITR)

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

## 8 用 Rust 建構的挑戰

### 挑戰 1：fsync 和持久性

**問題：** Rust 的 `File::sync_all()` 是正確的，但容易忘記。

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

**教訓：** 將 WAL 操作包裝在強制刷新的安全抽象中。

---

### 挑戰 2：LSN 順序和併發

**問題：** 多個執行緒附加 WAL 記錄必須獲得單調遞增的 LSN。

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

### 挑戰 3：部分寫入和校驗和

**問題：** WAL 寫入期間崩潰 = 磁碟上的部分記錄。

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

## 9 AI 如何加速這項工作

### AI 做對了什麼

| 任務 | AI 貢獻 |
|------|-----------------|
| **ARIES 階段** | 清楚解釋 analysis/redo/undo |
| **LSN 結構** | 建議區段/偏移編碼 |
| **檢查點設計** | 概述 fuzzy vs. sharp 權衡 |
| **CLR 記錄** | 解釋補償日誌記錄目的 |

---

### AI 做錯了什麼

| 問題 | 發生什麼事 |
|-------|---------------|
| **Redo 邏輯** | 初稿只 redo 已提交交易（錯誤！Redo ALL，然後 undo） |
| **Undo 順序** | 建議正向順序而不是反向（LIFO） |
| **Page LSN** | 忽略了 page LSN 用於跳過冗餘 redo |

**模式：** ARIES 很微妙。「redo all, undo some」的洞察是反直覺的。

---

### 範例：理解 Redo 哲學

**我問 AI 的問題：**

> "為什麼 ARIES redo 未提交的交易？我們不應該只 redo 已提交的嗎？"

**我學到的：**

1. **Redo 階段：** 將資料庫帶到精確的崩潰狀態（包括未提交的變更）
2. **Undo 階段：** 回滾未提交交易
3. **為什麼？** 比在 redo 期間追蹤依賴關係更簡單
4. **關鍵洞察：** Redo 是冪等的，undo 必須記錄（CLRs）

**結果：** 正確的 redo 實作：

```rust
// Redo ALL records, not just committed
if page_lsn < record.lsn {
    apply_redo(&record, &page)?;  // Apply regardless of txn status
}
// Undo phase will handle uncommitted transactions
```

---

## 總結：WAL 和 ARIES 一張圖

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

**關鍵要點：**

| 概念 | 為什麼重要 |
|---------|----------------|
| **WAL** | 不犧牲效能的持久性 |
| **LSN** | 所有變更的總順序 |
| **檢查點** | 限制恢復時間 |
| **ARIES Analysis** | 確定需要恢復的內容 |
| **ARIES Redo** | replay 到精確崩潰狀態 |
| **ARIES Undo** | 回滾未提交的工作 |
| **CLRs** | 冪等的 undo，防止重複 undo |

---

**進一步閱讀：**

- "ARIES: A Transaction Recovery Method Supporting Fine Granularity Locking" by Mohan et al. (1992)
- PostgreSQL Source: [`src/backend/access/transam/xlog.c`](https://github.com/postgres/postgres/blob/master/src/backend/access/transam/xlog.c)
- PostgreSQL Source: [`src/backend/access/transam/xlogfuncs.c`](https://github.com/postgres/postgres/blob/master/src/backend/access/transam/xlogfuncs.c)
- "Database Management Systems" by Ramakrishnan (Ch. 17: Recovery)
- "Readings in Database Systems" (Red Book) - ARIES chapter
- Vaultgres Repository: [github.com/neoalienson/Vaultgres](https://github.com/neoalienson/Vaultgres)

---

**系列下一篇：** 查詢執行——解析 SQL、建構查詢計劃，以及使用我們所有的儲存基礎設施來實際回答查詢。
