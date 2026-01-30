---
title: "使用 Rust 建構 PostgreSQL 相容資料庫：頁面式儲存與緩衝池"
date: 2026-03-01
categories:
  - Development
tags:
  - PostgreSQL
  - Rust
  - Database Internals
excerpt: "為何我要用 Rust 建構 Vaultgres——一個 PostgreSQL 相容資料庫——來探索資料庫內部機制。深入探討頁面式儲存、緩衝池管理，以及在 AI 輔助開發下實作 WAL 相容儲存的挑戰。"
lang: zh-TW
available_langs: []
thumbnail: /assets/architecture/vaultgres_thumbnail.jpg
thumbnail_80: /assets/architecture/vaultgres_thumbnail_80.jpg
series: vaultgres-journey
canonical_lang: en
comments: true
---

簡單的網站已無法滿足我對知識的渴望。

多年來，我一直在建構 Web 應用程式——REST API、GraphQL 服務、帶有 AI 和 Agentic AI 的微服務——但我遇到了瓶頸。我能流利地*使用*資料庫，卻無法*建構*一個。內部機制對我來說仍是個黑盒子：PostgreSQL 究竟如何將資料儲存在磁碟上？緩衝池如何管理記憶體？WAL 如何確保持久性？

因此，我開始建構 **[Vaultgres](https://github.com/neoalienson/Vaultgres)**——一個用 Rust 實作的 PostgreSQL 相容資料庫。

這不是另一個玩具級的鍵值儲存。我們的目標是 PostgreSQL 相容性：通訊協定、查詢語言，最終還包括儲存格式。為什麼？因為 PostgreSQL 的架構經過實戰驗證，相容性意味著真正的應用程式可以（理論上）無需修改就能連接。

這個系列記錄了這段旅程：設計決策、錯誤、那些「啊哈！」的頓悟時刻，以及我如何利用 AI 加速學習，同時仍然親自完成艱苦的工作。

今天的主題：**頁面式儲存和緩衝池**——每個資料庫建立的基礎。

---

## 1 為什麼需要頁面式儲存？

### 問題：原始位元組很混亂

想像一下將資料作為連續串流直接儲存到磁碟：

```
Table: users
┌────────────────────────────────────────────────────────────┐
│ id=1,name=Alice,id=2,name=Bob,id=3,name=Charlie...         │
└────────────────────────────────────────────────────────────┘

Table: orders
┌────────────────────────────────────────────────────────────┐
│ id=101,user_id=1,amount=99.99,id=102,user_id=2,amount=...  │
└────────────────────────────────────────────────────────────┘
```

**問題：**

| 問題 | 為什麼重要 |
|-------|----------------|
| **沒有結構** | 無法找到第 N 列，必須從頭開始掃描 |
| **沒有併發性** | 一個寫入者鎖定整個檔案 |
| **沒有崩潰恢復** | 部分寫入會破壞所有內容 |
| **沒有快取** | 必須讀取整個檔案才能存取一列 |

---

### 解決方案：固定大小頁面

PostgreSQL 將資料劃分為**固定大小的頁面**（通常為 8KB）：

```
┌─────────────────────────────────────────────────────────────┐
│  Page 0 (8KB)  │  Page 1 (8KB)  │  Page 2 (8KB)  │  ...    │
└─────────────────────────────────────────────────────────────┘
```

**每個頁面包含：**

```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader (24 bytes)                                       │
├─────────────────────────────────────────────────────────────┤
│ ItemId array (4 bytes each)                                 │
├─────────────────────────────────────────────────────────────┤
│ Free space                                                  │
├─────────────────────────────────────────────────────────────┤
│ Items (actual row data, grows upward)                       │
└─────────────────────────────────────────────────────────────┘
```

**優勢：**

| 優勢 | 為什麼重要 |
|---------|----------------|
| **隨機存取** | 直接讀取第 N 頁：`seek(N * 8KB)` |
| **細粒度鎖定** | 鎖定單個頁面，而非整個表 |
| **高效快取** | 將熱門頁面快取在記憶體中（緩衝池） |
| **崩潰恢復** | WAL 記錄參考特定頁面 |
| **標準化** | 所有頁面大小相同——簡化記憶體管理 |

!!! info "📌 為什麼是 8KB？"
    PostgreSQL 預設使用 8KB 頁面（編譯時可用 `BLCKSZ` 配置）。

    **權衡：**

| 頁面大小 | 優點 | 缺點 |
|-----------|------|------|
| 小 (4KB) | 較少內部碎片，更細的鎖定 | 更多頁面需管理，更大的標頭 |
| 中 (8KB) | 平衡 | 預設值是有原因的 |
| 大 (32KB+) | 更少頁面，更好的順序掃描 | 每個頁面浪費更多空間 |

Vaultgres 使用 8KB 以匹配 PostgreSQL——相容性優先於最佳化。

---

## 2 頁面佈局：8KB 頁面內部

### PostgreSQL PageHeader

每個頁面都以標頭開始：

```c
/* Simplified from PostgreSQL src/include/storage/bufpage.h */
typedef struct PageHeaderData {
    uint16      pd_lower;     /* Offset to start of free space */
    uint16      pd_upper;     /* Offset to end of free space */
    uint16      pd_special;   /* Offset to start of special space */
    uint16      pd_pagesize_version;  /* Page size and version */
    uint32      pd_checksum;  /* Page checksum (optional) */
    /* ... more fields ... */
} PageHeaderData;
```

**視覺佈局：**

```
┌─────────────────────────────────────────────────────────────┐
│ 0                   PageHeader (24 bytes)                   │
│ ├── pd_lower ──┐                                            │
│ │              ▼                                            │
│ ├── ItemId[0]  │                                            │
│ ├── ItemId[1]  │  ItemId array (4 bytes each)               │
│ ├── ItemId[2]  │  (points to actual items below)            │
│ │              │                                            │
│ │         pd_upper ──┐                                      │
│ │                    ▼                                      │
│ │              ┌─────────────┐                              │
│ │              │  Free Space │  (grows/shrinks)             │
│ │              └─────────────┘                              │
│ │                    ▲                                      │
│ │              pd_special ──┘                               │
│ │                                                           │
│ │    ┌─────────────────────────────────┐                    │
│ └─►  │  Item 2 (row data)              │  Items grow UP     │
│      ├─────────────────────────────────┤                    │
│      │  Item 1 (row data)              │                    │
│      ├─────────────────────────────────┤                    │
│      │  Item 0 (row data)              │                    │
│      └─────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

**關鍵洞察：** 項目從底部**向上**增長，ItemId 陣列從頂部**向下**增長。空閒空間在中間。這最大化了空間利用率。

---

### ItemId：指向列資料的指標

每個 `ItemId` 是一個 4 位元組的指標：

```c
typedef struct ItemIdData {
    uint16      lp_off;     /* Offset to item (from page start) */
    uint16      lp_len;     /* Length of item (including header) */
    /* ... flags ... */
} ItemIdData;
```

**為什麼需要間接？**

| 原因 | 解釋 |
|--------|-------------|
| **移動項目而不改變參考** | 當項目移動時更新 `lp_off` |
| **標記項目為已刪除** | 設定 `lp_len = 0` 而不覆蓋資料 |
| **支援 HOT (Heap Only Tuple)** | 對 PostgreSQL 效能至關重要 |

---

### Rust 實作：Page 結構體

以下是 Vaultgres 表示頁面的方式：

```rust
// src/storage/page.rs
use std::mem;

pub const PAGE_SIZE: usize = 8192;  // 8KB
pub const PAGE_HEADER_SIZE: usize = 24;
pub const ITEM_ID_SIZE: usize = 4;

#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct ItemId {
    pub offset: u16,  // Offset to item data
    pub length: u16,  // Length of item
}

impl ItemId {
    pub const fn new(offset: u16, length: u16) -> Self {
        Self { offset, length }
    }

    pub const fn is_unused(&self) -> bool {
        self.length == 0
    }
}

#[repr(C)]
pub struct PageHeader {
    pub pd_lower: u16,      // Start of free space (after ItemIds)
    pub pd_upper: u16,      // End of free space (before items)
    pub pd_special: u16,    // Start of special space (usually PAGE_SIZE)
    pub version: u16,
    pub checksum: u32,
    // Padding to reach 24 bytes
    _padding: [u8; 12],
}

pub struct Page {
    data: [u8; PAGE_SIZE],
}

impl Page {
    pub fn new() -> Self {
        let mut data = [0u8; PAGE_SIZE];

        // Initialize header
        let header = PageHeader {
            pd_lower: (PAGE_HEADER_SIZE) as u16,
            pd_upper: PAGE_SIZE as u16,
            pd_special: PAGE_SIZE as u16,
            version: 1,
            checksum: 0,
            _padding: [0; 12],
        };

        // Write header to data
        unsafe {
            std::ptr::write_unaligned(
                data.as_mut_ptr() as *mut PageHeader,
                header,
            );
        }

        Self { data }
    }

    pub fn header(&self) -> &PageHeader {
        unsafe { &*(self.data.as_ptr() as *const PageHeader) }
    }

    pub fn header_mut(&mut self) -> &mut PageHeader {
        unsafe { &mut *(self.data.as_mut_ptr() as *mut PageHeader) }
    }

    pub fn free_space(&self) -> usize {
        let header = self.header();
        header.pd_upper as usize - header.pd_lower as usize
    }

    pub fn insert(&mut self, item_data: &[u8]) -> Option<u16> {
        // Check if we have enough space
        let required = item_data.len() + ITEM_ID_SIZE;
        if self.free_space() < required {
            return None;  // Page full
        }

        let header = self.header_mut();

        // Calculate where to place the item (from bottom, growing up)
        let item_offset = header.pd_upper - item_data.len() as u16;

        // Write item data
        self.data[item_offset as usize..item_offset as usize + item_data.len()]
            .copy_from_slice(item_data);

        // Create ItemId
        let item_id_offset = header.pd_lower as usize;
        let item_id = ItemId::new(item_offset, item_data.len() as u16);

        unsafe {
            std::ptr::write_unaligned(
                self.data[item_id_offset..].as_mut_ptr() as *mut ItemId,
                item_id,
            );
        }

        // Update header
        header.pd_lower += ITEM_ID_SIZE as u16;
        header.pd_upper = item_offset;

        // Return ItemId index (0-based)
        Some((item_id_offset - PAGE_HEADER_SIZE) / ITEM_ID_SIZE as usize as u16)
    }
}
```

!!! warning "⚠️ 為了效能使用 Unsafe Rust"
    是的，這裡使用了 `unsafe`。為什麼？

    - **零拷貝存取** 頁面資料
    - **精確的記憶體佈局** 匹配 PostgreSQL 的磁碟上格式
    - **效能** 至關重要——頁面被存取數百萬次

    **安全保證：**

    - `#[repr(C)]` 確保可預測的佈局
    - 所有存取都在範圍內（由 `free_space()` 檢查）
    - 頁面在使用前總是已初始化

    這就是 AI 輔助無價的地方：我可以問「這個 `unsafe` 區塊是否可靠？」並得到詳細分析。

---

## 3 緩衝池：在記憶體中快取頁面

### 問題：磁碟很慢

| 儲存 | 延遲 | 相對速度 |
|---------|---------|----------------|
| CPU 快取 (L1) | ~1ns | 1x |
| RAM | ~100ns | 100x 更慢 |
| NVMe SSD | ~100μs | 100,000x 更慢 |
| HDD | ~10ms | 10,000,000x 更慢 |

**沒有緩衝池：**

```
Query: SELECT * FROM users WHERE id = 42

1. Read page containing id=42 from disk (100μs on NVMe)
2. Parse page, find row
3. Return result

Next query: SELECT * FROM users WHERE id = 42

1. Read page from disk AGAIN (100μs)  ← Wasteful!
2. Parse page, find row
3. Return result
```

---

### 解決方案：緩衝池

**緩衝池** 將經常存取的頁面快取在 RAM 中：

```
┌─────────────────────────────────────────────────────────────┐
│                    Buffer Pool (RAM)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Page 0  │ │ Page 5  │ │ Page 3  │ │ Page 7  │  ...       │
│  │ (dirty) │ │ (clean) │ │ (dirty) │ │ (clean) │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ Disk    │    │ Disk    │    │ Disk    │
    │ Page 0  │    │ Page 5  │    │ Page 3  │
    └─────────┘    └─────────┘    └─────────┘
```

**使用緩衝池：**

```
Query: SELECT * FROM users WHERE id = 42

1. Check buffer pool for page containing id=42
2. If hit: Return from RAM (~100ns)  ← 1000x faster!
3. If miss: Read from disk, cache in pool, return

Next query: SELECT * FROM users WHERE id = 42

1. Check buffer pool (HIT!)
2. Return from RAM (~100ns)  ← Cached!
```

---

### 緩衝池架構

```mermaid
flowchart BT
    subgraph "Buffer Pool Manager"
        A[Page Request] --> B{In Pool?}
        B -->|Hit| C[Return Cached Page]
        B -->|Miss| D[Find Victim Page]
        D --> E{Dirty?}
        E -->|Yes| F[Write to Disk]
        E -->|No| G[Skip Write]
        F --> H[Read New Page]
        G --> H
        H --> I[Update LRU List]
        I --> J[Return New Page]
    end

    subgraph "Memory"
        C --> K[Buffer Frame]
        J --> K
    end

    subgraph "Disk"
        F --> L[Write Page]
        H --> M[Read Page]
    end

    style B fill:#fff3e0,stroke:#f57c00
    style E fill:#fff3e0,stroke:#f57c00
    style K fill:#e3f2fd,stroke:#1976d2
```

**元件：**

| 元件 | 目的 |
|-----------|---------|
| **緩衝幀 (Buffer Frames)** | 固定大小的槽位持有頁面（例如 1024 幀 × 8KB = 8MB） |
| **頁面表 (Page Table)** | 映射頁面 ID → 緩衝幀（雜湊表） |
| **LRU 串列** | 追蹤存取順序以進行淘汰 |
| **髒位元 (Dirty Bit)** | 標記需要寫回的頁面 |
| **釘選計數 (Pin Count)** | 防止使用中頁面被淘汰 |

---

### Rust 實作：緩衝池

```rust
// src/storage/buffer_pool.rs
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use crate::storage::page::{Page, PAGE_SIZE};

pub struct BufferFrame {
    page: Option<Page>,
    page_id: Option<u64>,
    pin_count: u32,
    is_dirty: bool,
    last_accessed: u64,  // For LRU
}

pub struct BufferPool {
    frames: Vec<Mutex<BufferFrame>>,
    page_table: Mutex<HashMap<u64, usize>>,  // page_id → frame_index
    lru_list: Mutex<Vec<usize>>,  // frame indices, front = MRU
    disk: Arc<DiskManager>,
    access_counter: Mutex<u64>,
}

impl BufferPool {
    pub fn new(num_frames: usize, disk: Arc<DiskManager>) -> Self {
        let frames = (0..num_frames)
            .map(|_| Mutex::new(BufferFrame {
                page: None,
                page_id: None,
                pin_count: 0,
                is_dirty: false,
                last_accessed: 0,
            }))
            .collect();

        Self {
            frames,
            page_table: Mutex::new(HashMap::new()),
            lru_list: Mutex::new(Vec::new()),
            disk,
            access_counter: Mutex::new(0),
        }
    }

    pub fn get_page(&self, page_id: u64) -> Option<Arc<Mutex<Page>>> {
        // Check if page is in pool
        let mut page_table = self.page_table.lock().unwrap();

        if let Some(&frame_idx) = page_table.get(&page_id) {
            // Cache hit
            let mut frame = self.frames[frame_idx].lock().unwrap();
            frame.pin_count += 1;
            frame.last_accessed = *self.access_counter.lock().unwrap();

            // Move to front of LRU
            let mut lru = self.lru_list.lock().unwrap();
            if let Some(pos) = lru.iter().position(|&x| x == frame_idx) {
                lru.remove(pos);
                lru.push_front(frame_idx);
            }

            return Some(Arc::clone(&frame.page.as_ref().unwrap()));
        }

        drop(page_table);

        // Cache miss - need to load from disk
        self.load_page(page_id)
    }

    fn load_page(&self, page_id: u64) -> Option<Arc<Mutex<Page>>> {
        // Find victim frame using LRU
        let victim_idx = self.find_victim()?;

        let mut frame = self.frames[victim_idx].lock().unwrap();

        // Write back if dirty
        if frame.is_dirty {
            if let Some(old_page_id) = frame.page_id {
                self.disk.write_page(old_page_id, frame.page.as_ref().unwrap())
                    .ok()?;
            }
            frame.is_dirty = false;
        }

        // Read new page from disk
        let new_page = self.disk.read_page(page_id).ok()?;

        // Update frame
        frame.page = Some(new_page);
        frame.page_id = Some(page_id);
        frame.pin_count = 1;
        frame.last_accessed = *self.access_counter.lock().unwrap();

        // Update page table
        let mut page_table = self.page_table.lock().unwrap();
        page_table.insert(page_id, victim_idx);

        // Update LRU
        let mut lru = self.lru_list.lock().unwrap();
        lru.push_front(victim_idx);

        Some(Arc::clone(&frame.page.as_ref().unwrap()))
    }

    fn find_victim(&self) -> Option<usize> {
        let mut lru = self.lru_list.lock().unwrap();

        // Find unpinned page from back (LRU)
        for i in (0..lru.len()).rev() {
            let frame_idx = lru[i];
            let frame = self.frames[frame_idx].lock().unwrap();

            if frame.pin_count == 0 {
                lru.remove(i);
                return Some(frame_idx);
            }
        }

        // All pages pinned - need to wait or allocate more frames
        None
    }

    pub fn mark_dirty(&self, page_id: u64) {
        let page_table = self.page_table.lock().unwrap();
        if let Some(&frame_idx) = page_table.get(&page_id) {
            let mut frame = self.frames[frame_idx].lock().unwrap();
            frame.is_dirty = true;
        }
    }

    pub fn unpin_page(&self, page_id: u64) {
        let page_table = self.page_table.lock().unwrap();
        if let Some(&frame_idx) = page_table.get(&page_id) {
            let mut frame = self.frames[frame_idx].lock().unwrap();
            frame.pin_count = frame.pin_count.saturating_sub(1);
        }
    }

    pub fn flush_all(&self) -> std::io::Result<()> {
        for frame in &self.frames {
            let mut f = frame.lock().unwrap();
            if f.is_dirty {
                if let Some(page_id) = f.page_id {
                    self.disk.write_page(page_id, f.page.as_ref().unwrap())?;
                }
                f.is_dirty = false;
            }
        }
        Ok(())
    }
}
```

!!! tip "💡 關鍵設計決策"
    **1. 細粒度鎖定：** 每個 `BufferFrame` 都有自己的 `Mutex`，而不是整個池只有一把鎖。

    **2. ARC 用於共享存取：** `Arc<Mutex<Page>>` 允許多個執行緒持有同一頁面。

    **3. 釘選計數：** 防止執行緒使用頁面時被淘汰。

    **4. LRU 淘汰：** 最近最少使用的頁面優先被淘汰。

    這些決策來自於詢問 AI：「如何在 Rust 中設計執行緒安全的緩衝池？」然後根據 PostgreSQL 的實際實作迭代答案。

---

## 4 磁碟管理員：抽象化檔案 I/O

### 單一檔案 vs. 多個檔案

PostgreSQL 將每個表/索引儲存在單獨的檔案中：

```
$PGDATA/base/16384/      # Database OID
├── 16385                # Table: users
├── 16386                # Table: orders
├── 16387_idx            # Index: users_email_idx
└── ...
```

Vaultgres 遵循相同的模式：

```rust
// src/storage/disk.rs
use std::collections::HashMap;
use std::fs::{File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct DiskManager {
    data_dir: PathBuf,
    files: Mutex<HashMap<u64, File>>,  # table_id → File
}

impl DiskManager {
    pub fn new(data_dir: &str) -> std::io::Result<Self> {
        std::fs::create_dir_all(data_dir)?;
        Ok(Self {
            data_dir: PathBuf::from(data_dir),
            files: Mutex::new(HashMap::new()),
        })
    }

    fn get_file(&self, table_id: u64) -> std::io::Result<std::fs::File> {
        let mut files = self.files.lock().unwrap();

        if let Some(file) = files.get(&table_id) {
            // File already open - need to handle this differently
            // (simplified for example)
        }

        let path = self.data_dir.join(table_id.to_string());
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(&path)?;

        files.insert(table_id, file.try_clone()?);
        Ok(file)
    }

    pub fn read_page(&self, page_id: u64) -> std::io::Result<Page> {
        let table_id = page_id >> 32;  # High 32 bits
        let page_num = page_id as u32;  # Low 32 bits

        let mut file = self.get_file(table_id)?;
        let mut data = [0u8; PAGE_SIZE];

        file.seek(SeekFrom::Start(page_num as u64 * PAGE_SIZE as u64))?;
        file.read_exact(&mut data)?;

        Ok(Page::from_data(data))
    }

    pub fn write_page(&self, page_id: u64, page: &Page) -> std::io::Result<()> {
        let table_id = page_id >> 32;
        let page_num = page_id as u32;

        let mut file = self.get_file(table_id)?;

        file.seek(SeekFrom::Start(page_num as u64 * PAGE_SIZE as u64))?;
        file.write_all(page.as_bytes())?;
        file.sync_all()?;  # Force to disk

        Ok(())
    }
}
```

---

### 頁面 ID 編碼

Vaultgres 將表 ID 和頁面編號編碼為單個 `u64`：

```
┌─────────────────────────────────────────────────────────────┐
│  Page ID (u64)                                              │
│  ┌─────────────────┬─────────────────┐                      │
│  │  Table ID (32)  │  Page Num (32)  │                      │
│  └─────────────────┴─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘

Example: page_id = 0x0000000100000005
  Table ID: 1
  Page Number: 5
```

**為什麼？**

| 原因 | 解釋 |
|--------|-------------|
| **單一識別符** | 簡化緩衝池和頁面表 |
| **高效雜湊** | `u64` 比 `(u32, u32)` 元組更快 |
| **PostgreSQL 相容** | 類似於 PostgreSQL 的 `BlockId` |

---

## 5 預寫日誌 (WAL)：確保持久性

### 問題：崩潰會破壞資料

沒有 WAL：

```
1. Buffer pool modifies page in memory
2. Before page is written to disk... CRASH!
3. Data lost forever
```

**更糟的是：**

```
1. Write page to disk (50% complete)... CRASH!
2. Page is now corrupted (torn page)
```

---

### 解決方案：預寫日誌

**WAL 原則：** 在修改頁面之前，先將變更寫入日誌：

```
Transaction: UPDATE users SET balance = 100 WHERE id = 42

1. Write WAL record: "Page X, Offset Y, Old Value Z, New Value W"
2. Flush WAL to disk (fsync)
3. Modify page in buffer pool (mark dirty)
4. ACK to client
5. Later: Checkpoint writes dirty pages to disk
```

**崩潰後：**

```
1. Read last checkpoint position
2. Replay WAL records from checkpoint to end
3. Database is consistent
```

---

### WAL 記錄格式

```rust
// src/storage/wal.rs
#[derive(Debug, Clone)]
pub struct WalRecord {
    pub lsn: u64,              // Log Sequence Number
    pub table_id: u64,
    pub page_num: u32,
    pub offset: u16,           // Offset within page
    pub old_data: Vec<u8>,     // Before image (for undo)
    pub new_data: Vec<u8>,     // After image (for redo)
    pub transaction_id: u64,
    pub record_type: WalRecordType,
}

#[derive(Debug, Clone)]
pub enum WalRecordType {
    Insert,
    Update,
    Delete,
    Checkpoint,
    Commit,
    Abort,
}

pub struct WalManager {
    wal_dir: PathBuf,
    current_lsn: u64,
    current_file: File,
    flush_lsn: u64,  // Last flushed LSN
}

impl WalManager {
    pub fn log_change(&mut self, record: WalRecord) -> std::io::Result<u64> {
        // Serialize record
        let mut data = Vec::new();
        data.extend_from_slice(&record.lsn.to_le_bytes());
        data.extend_from_slice(&(record.table_id.to_le_bytes()));
        // ... more fields

        // Write to WAL file
        self.current_file.write_all(&data)?;

        // Update LSN
        self.current_lsn += 1;

        Ok(record.lsn)
    }

    pub fn flush(&mut self) -> std::io::Result<()> {
        self.current_file.sync_all()?;
        self.flush_lsn = self.current_lsn;
        Ok(())
    }

    pub fn replay_from(&mut self, lsn: u64, buffer_pool: &BufferPool) -> std::io::Result<()> {
        // Seek to LSN
        // Read records
        // For each record:
        //   - Get page from buffer pool
        //   - Apply new_data to page
        //   - Mark page dirty
        Ok(())
    }
}
```

!!! warning "⚠️ WAL 很難"
    正確實作 WAL 是建構資料庫最困難的部分之一：

    - **邏輯 vs. 實體 WAL：** 記錄操作（INSERT 列）還是頁面變更（位元組 X→Y）？
    - **AR... [截斷]
    - **檢查點：** 多久一次？模糊還是清晰？
    - **日誌截斷：** 何時可以刪除舊的 WAL 檔案？

    Vaultgres 將從簡單的實體 WAL（頁面映像）開始，然後逐步演進。AI 對於理解這裡的權衡取捨非常有幫助。

---

## 6 用 Rust 建構的挑戰

### 挑戰 1：所有權 vs. 共享存取

**問題：** 緩衝池需要在執行緒間共享頁面，但 Rust 的所有權系統與此相抗。

```rust
// ❌ Doesn't work
pub fn get_page(&self, page_id: u64) -> Page {
    // Can't return owned Page - buffer pool needs to keep it
}

// ✅ Solution: Arc<Mutex<T>>
pub fn get_page(&self, page_id: u64) -> Arc<Mutex<Page>> {
    // Shared ownership, interior mutability
}
```

**權衡：**

| 方法 | 優點 | 缺點 |
|----------|------|------|
| `Arc<Mutex<T>>` | 安全、熟悉 | 鎖定競爭 |
| `RwLock<T>` | 更適合讀取負載 | 寫入飢餓 |
| Lock-free (unsafe) | 最大效能 | 複雜、易出錯 |

---

### 挑戰 2：零拷貝 vs. 安全

**問題：** PostgreSQL 使用原始指標進行頁面存取。Rust 想要邊界檢查。

```rust
// PostgreSQL (C)
Page page = buffer_pool->pages[frame_id];
Item item = (Item)(page + item_offset);  // No bounds check!

// Rust (safe)
let item = &page.data[item_offset..item_offset + item_len];  // Bounds checked

// Rust (unsafe, zero-copy)
let item = unsafe {
    &*(page.data.as_ptr().add(item_offset) as *const Item)
};  // Fast but requires safety analysis
```

**Vaultgres 方法：** 從安全開始，在效能分析後用 `unsafe` 最佳化熱點路徑。

---

### 挑戰 3：錯誤處理

**問題：** PostgreSQL 使用 `elog(ERROR, ...)`。Rust 使用 `Result<T, E>`。

```rust
// PostgreSQL
if (page_full) {
    elog(ERROR, "page is full");  // Longjmp out
}

// Rust
if (page_full) {
    return Err(PageError::Full);  // Propagate up
}
```

**影響：** 每個函數簽名都改變了。呼叫鏈變成 `Result` 金字塔。

**解決方案：** 大量使用 `?` 運算符，定義明確的錯誤類型：

```rust
#[derive(Debug)]
pub enum StorageError {
    PageFull,
    PageNotFound(u64),
    IoError(std::io::Error),
    CorruptedPage(u64),
}

impl From<std::io::Error> for StorageError {
    fn from(err: std::io::Error) -> Self {
        StorageError::IoError(err)
    }
}

pub fn insert(&mut self, data: &[u8]) -> Result<u16, StorageError> {
    if self.free_space() < data.len() {
        return Err(StorageError::PageFull);
    }
    // ...
    Ok(item_id)
}
```

---

## 7 AI 如何加速學習

### AI 擅長什麼

| 任務 | 我如何使用 AI |
|------|--------------|
| **解釋概念** | 「解釋 PostgreSQL 的緩衝池替換策略」 |
| **程式碼審查** | 「這個 unsafe 區塊是否可靠？什麼可能出錯？」 |
| **產生樣板** | 「為 PostgreSQL PageHeader 產生 Rust 結構體」 |
| **除錯協助** |「為什麼會死結？這是我的鎖定順序...」 |
| **比較方法** | 「LRU vs. Clock vs. FIFO 用於緩衝池淘汰」 |

---

### AI 無法替代什麼

| 技能 | 為什麼仍取決於我 |
|-------|----------------------|
| **系統設計** | AI 無法決定整體架構 |
| **權衡分析** | 「我應該優先考慮相容性還是效能？」 |
| **測試** | AI 無法執行基準測試或尋找競爭條件 |
| **除錯** | AI 無法附加 gdb 或讀取核心轉儲 |
| **學習** | 我仍然必須理解 AI 產生的每一行程式碼 |

---

### 範例：學習緩衝池淘汰

**我問 AI 的問題：**

> "PostgreSQL 使用 clock-sweep 演算法進行緩衝池淘汰，而不是純 LRU。為什麼？有什麼權衡取捨？"

**我學到的：**

1. **LRU 問題：** 順序掃描會淘汰所有內容（掃描抵抗）
2. **Clock-sweep：** 近似 LRU 但更便宜（不需要鏈結串列更新）
3. **使用計數：** 頁面在淘汰前獲得多次機會
4. **PostgreSQL 的變體：** 還考慮釘選計數和髒頁狀態

**結果：** 我在 Vaultgres 中實作了 clock-sweep 而不是 LRU：

```rust
pub fn find_victim(&self) -> Option<usize> {
    let mut clock_hand = self.clock_hand.lock().unwrap();
    let frames = self.frames.len();

    for _ in 0..frames * 2 {  // Sweep at most twice
        let idx = *clock_hand as usize;
        let mut frame = self.frames[idx].lock().unwrap();

        if frame.pin_count == 0 {
            if frame.usage_count > 0 {
                frame.usage_count -= 1;  // Second chance
            } else {
                *clock_hand = (*clock_hand + 1) % frames as u32;
                return Some(idx);  // Evict this one
            }
        }

        drop(frame);
        *clock_hand = (*clock_hand + 1) % frames as u32;
    }

    None  // All pages pinned
}
```

這就是模式：AI 解釋，我實作，我測試，我學習。

## 總結：頁面式儲存一張圖

```mermaid
flowchart BT
    subgraph "Buffer Pool RAM"
        A[Frame 0: Page 5] --> B[Frame 1: Page 3]
        B --> C[Frame 2: Page 7]
        C --> D[...]
    end

    subgraph "Page Structure"
        E[PageHeader 24B] --> F[ItemId array]
        F --> G[Free space]
        G --> H[Items grow up]
    end

    subgraph "Disk"
        I[Table 1 / Page 0] --> J[Table 1 / Page 1]
        J --> K[Table 2 / Page 0]
    end

    subgraph "WAL"
        L[WAL Record 1] --> M[WAL Record 2]
        M --> N[WAL Record 3]
    end

    B --> E
    E --> I
    N --> B

    style E fill:#e3f2fd,stroke:#1976d2
    style L fill:#fff3e0,stroke:#f57c00
    style A fill:#e8f5e9,stroke:#388e3c
```

**關鍵要點：**

| 概念 | 為什麼重要 |
|---------|----------------|
| **頁面式儲存** | 隨機存取、細粒度鎖定、高效快取 |
| **緩衝池** | 熱門頁面比磁碟存取快 1000 倍 |
| **LRU/Clock 淘汰** | 保留常用頁面，淘汰冷頁面 |
| **WAL** | 不犧牲效能的持久性 |
| **Rust 挑戰** | 所有權、安全、零拷貝——到處都是權衡取捨 |

---

**進一步閱讀：**

- PostgreSQL Source: [`src/include/storage/bufpage.h`](https://github.com/postgres/postgres/blob/master/src/include/storage/bufpage.h)
- PostgreSQL Source: [`src/backend/storage/buffer/`](https://github.com/postgres/postgres/tree/master/src/backend/storage/buffer)
- "Database Management Systems" by Ramakrishnan & Gehrke (Ch. 9: Storage and Indexing)
- "Readings in Database Systems" (Red Book) - Buffer Pool chapter
- Vaultgres Repository: [github.com/neoalienson/Vaultgres](https://github.com/neoalienson/Vaultgres)
