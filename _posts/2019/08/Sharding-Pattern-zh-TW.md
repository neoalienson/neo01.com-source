---
title: "分片模式：水平擴展資料儲存"
date: 2019-08-17
categories:
  - Architecture
series: architecture_pattern
excerpt: "將資料儲存分割成水平分區以提升可擴展性和效能。了解分片如何將資料分散到多個伺服器以處理大量資料。"
lang: zh-TW
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

想像一個圖書館已經成長到單一建築物無法容納所有書籍的規模。與其建造一個不可能的巨大建築，你建立了多個圖書館分館——每個分館存放按特定類別或範圍組織的書籍。讀者根據他們要找的內容知道該去哪個分館。這就是分片的本質：將資料分散到多個儲存系統以克服單一伺服器的限制。

## 圖書館類比

就像一個有多個分館的圖書館系統：
- 將書籍分散到各個地點
- 允許多位讀者同時存取
- 減少任何單一地點的擁擠
- 實現地理位置上更接近使用者

分片資料儲存：
- 將資料分散到多個伺服器
- 允許平行查詢和寫入
- 減少任何單一資料庫的競爭
- 實現資料局部性以獲得更好的效能

{% mermaid %}
graph TB
    A[應用程式] --> B[分片邏輯]
    B --> C[分片 1<br/>使用者 A-H]
    B --> D[分片 2<br/>使用者 I-P]
    B --> E[分片 3<br/>使用者 Q-Z]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 問題：單一伺服器的限制

託管在單一伺服器上的資料儲存面臨不可避免的限制：

### 儲存空間限制

```javascript
// 隨著資料增長，單一伺服器會耗盡空間
class UserDatabase {
  constructor() {
    this.storage = new DiskStorage('/data');
    // 當我們達到 10TB？100TB？1PB 時會發生什麼？
  }
  
  async addUser(user) {
    try {
      await this.storage.write(user.id, user);
    } catch (error) {
      if (error.code === 'ENOSPC') {
        // 磁碟已滿 - 現在怎麼辦？
        throw new Error('Storage capacity exceeded');
      }
    }
  }
}
```

### 運算資源限制

```javascript
// 單一伺服器處理數百萬並發使用者
class OrderDatabase {
  async processQuery(query) {
    // CPU 處理查詢達到上限
    // 記憶體快取結果耗盡
    // 查詢開始逾時
    const result = await this.executeQuery(query);
    return result;
  }
}
```

### 網路頻寬瓶頸

```javascript
// 所有流量都通過一個網路介面
class DataStore {
  async handleRequest(request) {
    // 網路介面在 10Gbps 時飽和
    // 請求開始被丟棄
    // 回應時間大幅增加
    return await this.processRequest(request);
  }
}
```

### 地理分佈挑戰

```javascript
// 全球使用者存取單一資料中心
class GlobalApplication {
  async getUserData(userId) {
    // 東京的使用者存取維吉尼亞州的資料
    // 僅網路往返就需要 200ms 延遲
    // 在美國儲存歐盟資料的合規問題
    return await this.database.query({ userId });
  }
}
```

!!!warning "⚠️ 垂直擴展的限制"
    **暫時解決方案**：向單一伺服器添加更多 CPU、記憶體或磁碟
    
    **物理限制**：最終你無法添加更多資源
    
    **成本效率低**：高階伺服器變得指數級昂貴
    
    **單點故障**：一個伺服器故障影響所有使用者

## 解決方案：水平分區（分片）

將資料儲存分割成稱為分片的水平分區。每個分片：
- 具有相同的架構
- 包含不同的資料子集
- 在獨立的儲存節點上執行
- 獨立運作

{% mermaid %}
graph TB
    A[應用程式層] --> B[分片映射/路由器]
    B --> C[分片 A<br/>訂單 0-999]
    B --> D[分片 B<br/>訂單 1000-1999]
    B --> E[分片 C<br/>訂單 2000-2999]
    B --> F[分片 D<br/>訂單 3000+]
    
    C --> C1[(資料庫<br/>伺服器 1)]
    D --> D1[(資料庫<br/>伺服器 2)]
    E --> E1[(資料庫<br/>伺服器 3)]
    F --> F1[(資料庫<br/>伺服器 4)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
    style F fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 分片策略

### 1. 查找策略

使用映射表將請求路由到適當的分片：

```javascript
class LookupShardRouter {
  constructor() {
    // 分片映射儲存在快速快取或資料庫中
    this.shardMap = new Map([
      ['tenant-1', 'shard-a'],
      ['tenant-2', 'shard-a'],
      ['tenant-3', 'shard-b'],
      ['tenant-4', 'shard-c']
    ]);
    
    this.shardConnections = {
      'shard-a': 'db1.neo01.com',
      'shard-b': 'db2.neo01.com',
      'shard-c': 'db3.neo01.com'
    };
  }
  
  getShardForTenant(tenantId) {
    const shardKey = this.shardMap.get(tenantId);
    return this.shardConnections[shardKey];
  }
  
  async queryTenantData(tenantId, query) {
    const shardUrl = this.getShardForTenant(tenantId);
    const connection = await this.connect(shardUrl);
    return await connection.query(query);
  }
}
```

{% mermaid %}
graph LR
    A[請求:<br/>Tenant-3] --> B[查找<br/>分片映射]
    B --> C{Tenant-3<br/>→ 分片 B}
    C --> D[(分片 B<br/>資料庫)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style D fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 查找策略的優點"
    **靈活性**：透過更新映射輕鬆重新平衡
    
    **虛擬分片**：將邏輯分片映射到較少的實體伺服器
    
    **控制**：將高價值租戶分配到專用分片

### 2. 範圍策略

根據連續的分片鍵將相關項目分組在一起：

```javascript
class RangeShardRouter {
  constructor() {
    this.shardRanges = [
      { min: '2019-01-01', max: '2019-03-31', shard: 'db-q1-2019.neo01.com' },
      { min: '2019-04-01', max: '2019-06-30', shard: 'db-q2-2019.neo01.com' },
      { min: '2019-07-01', max: '2019-09-30', shard: 'db-q3-2019.neo01.com' },
      { min: '2019-10-01', max: '2019-12-31', shard: 'db-q4-2019.neo01.com' }
    ];
  }
  
  getShardForDate(date) {
    const range = this.shardRanges.find(r => 
      date >= r.min && date <= r.max
    );
    return range ? range.shard : null;
  }
  
  async queryOrdersByDateRange(startDate, endDate) {
    // 高效：僅查詢相關分片
    const relevantShards = this.shardRanges
      .filter(r => r.max >= startDate && r.min <= endDate)
      .map(r => r.shard);
    
    // 對多個分片進行平行查詢
    const results = await Promise.all(
      relevantShards.map(shard => 
        this.queryShardByDateRange(shard, startDate, endDate)
      )
    );
    
    return results.flat();
  }
}
```

{% mermaid %}
graph TB
    A[查詢:<br/>2019 年第二季訂單] --> B[範圍路由器]
    B --> C[分片 Q2<br/>2019 年 4-6 月]
    
    D[查詢:<br/>2019 年 4-7 月訂單] --> B
    B --> C
    B --> E[分片 Q3<br/>2019 年 7-9 月]
    
    style A fill:#4dabf7,stroke:#1971c2
    style D fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 範圍策略的優點"
    **範圍查詢**：有效檢索連續資料
    
    **自然排序**：資料以邏輯順序儲存
    
    **基於時間的歸檔**：輕鬆歸檔舊分片

!!!warning "⚠️ 範圍策略的風險"
    **熱點**：最近的資料通常被更頻繁地存取
    
    **不均勻分佈**：某些範圍可能比其他範圍增長得更大

### 3. 雜湊策略

使用雜湊函數均勻分佈資料：

```javascript
class HashShardRouter {
  constructor() {
    this.shards = [
      'db-shard-0.neo01.com',
      'db-shard-1.neo01.com',
      'db-shard-2.neo01.com',
      'db-shard-3.neo01.com'
    ];
  }
  
  hashUserId(userId) {
    // 簡單的雜湊函數（生產環境使用更好的雜湊）
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // 轉換為 32 位元整數
    }
    return Math.abs(hash);
  }
  
  getShardForUser(userId) {
    const hash = this.hashUserId(userId);
    const shardIndex = hash % this.shards.length;
    return this.shards[shardIndex];
  }
  
  async getUserData(userId) {
    const shard = this.getShardForUser(userId);
    const connection = await this.connect(shard);
    return await connection.query({ userId });
  }
}

// 分佈範例
const router = new HashShardRouter();
console.log(router.getShardForUser('user-123')); // db-shard-2
console.log(router.getShardForUser('user-124')); // db-shard-0
console.log(router.getShardForUser('user-125')); // db-shard-3
// 使用者分散到各個分片
```

{% mermaid %}
graph TB
    A[使用者 ID] --> B[雜湊函數]
    B --> C[user-55 → 雜湊: 2]
    B --> D[user-56 → 雜湊: 0]
    B --> E[user-57 → 雜湊: 1]
    
    C --> F[(分片 2)]
    D --> G[(分片 0)]
    E --> H[(分片 1)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style F fill:#51cf66,stroke:#2f9e44
    style G fill:#51cf66,stroke:#2f9e44
    style H fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 雜湊策略的優點"
    **均勻分佈**：防止熱點
    
    **無需查找表**：直接計算分片位置
    
    **可擴展**：適用於許多分片

!!!warning "⚠️ 雜湊策略的挑戰"
    **範圍查詢**：難以有效查詢範圍
    
    **重新平衡**：添加分片需要重新雜湊資料

## 策略比較

{% echarts %}
{
  "title": {
    "text": "分片策略權衡"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["查找", "範圍", "雜湊"]
  },
  "radar": {
    "indicator": [
      { "name": "靈活性", "max": 10 },
      { "name": "均勻分佈", "max": 10 },
      { "name": "範圍查詢效能", "max": 10 },
      { "name": "簡單性", "max": 10 },
      { "name": "重新平衡容易度", "max": 10 }
    ]
  },
  "series": [{
    "type": "radar",
    "data": [
      {
        "value": [9, 6, 5, 6, 9],
        "name": "查找"
      },
      {
        "value": [5, 4, 10, 8, 3],
        "name": "範圍"
      },
      {
        "value": [6, 10, 3, 9, 4],
        "name": "雜湊"
      }
    ]
  }]
}
{% endecharts %}

## 實際實作範例

這是一個電子商務平台的完整分片實作：

```javascript
class ShardedOrderDatabase {
  constructor() {
    // 使用雜湊策略實現均勻分佈
    this.shards = [
      { id: 0, connection: 'orders-db-0.neo01.com' },
      { id: 1, connection: 'orders-db-1.neo01.com' },
      { id: 2, connection: 'orders-db-2.neo01.com' },
      { id: 3, connection: 'orders-db-3.neo01.com' }
    ];
  }
  
  getShardForOrder(orderId) {
    // 從訂單 ID 中提取數字部分
    const numericId = parseInt(orderId.replace(/\D/g, ''));
    const shardIndex = numericId % this.shards.length;
    return this.shards[shardIndex];
  }
  
  async createOrder(order) {
    const shard = this.getShardForOrder(order.id);
    const connection = await this.connectToShard(shard);
    
    try {
      await connection.query(
        'INSERT INTO orders (id, user_id, total, items) VALUES (?, ?, ?, ?)',
        [order.id, order.userId, order.total, JSON.stringify(order.items)]
      );
      return { success: true, shard: shard.id };
    } catch (error) {
      console.error(`Failed to create order on shard ${shard.id}:`, error);
      throw error;
    }
  }
  
  async getOrder(orderId) {
    const shard = this.getShardForOrder(orderId);
    const connection = await this.connectToShard(shard);
    
    const result = await connection.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    return result[0];
  }
  
  async getUserOrders(userId) {
    // 使用者訂單分散在各個分片 - 需要扇出查詢
    const results = await Promise.all(
      this.shards.map(async (shard) => {
        const connection = await this.connectToShard(shard);
        return await connection.query(
          'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
          [userId]
        );
      })
    );
    
    // 合併並排序來自所有分片的結果
    return results
      .flat()
      .sort((a, b) => b.created_at - a.created_at);
  }
  
  async connectToShard(shard) {
    // 每個分片的連線池
    if (!this.connections) {
      this.connections = new Map();
    }
    
    if (!this.connections.has(shard.id)) {
      const connection = await createDatabaseConnection(shard.connection);
      this.connections.set(shard.id, connection);
    }
    
    return this.connections.get(shard.id);
  }
}
```

## 關鍵考量

### 1. 選擇分片鍵

分片鍵決定資料分佈和查詢效能：

```javascript
// 好：靜態、均勻分佈
const shardKey = user.id; // UUID，永不改變

// 壞：可能隨時間改變
const shardKey = user.email; // 使用者可能更改電子郵件

// 壞：不均勻分佈
const shardKey = user.country; // 某些國家的使用者多得多
```

!!!anote "📝 分片鍵最佳實踐"
    **不可變**：選擇永不改變的鍵
    
    **高基數**：許多唯一值以實現均勻分佈
    
    **查詢對齊**：支援最常見的查詢模式
    
    **避免熱點**：如果使用雜湊策略，避免連續鍵

### 2. 跨分片查詢

最小化跨越多個分片的查詢：

```javascript
class OptimizedShardedDatabase {
  // 好：單一分片查詢
  async getOrderById(orderId) {
    const shard = this.getShardForOrder(orderId);
    return await this.queryShardById(shard, orderId);
  }
  
  // 可接受：帶快取的扇出
  async getUserOrderCount(userId) {
    // 快取結果以避免重複的扇出查詢
    const cached = await this.cache.get(`order_count:${userId}`);
    if (cached) return cached;
    
    const counts = await Promise.all(
      this.shards.map(shard => this.countUserOrders(shard, userId))
    );
    
    const total = counts.reduce((sum, count) => sum + count, 0);
    await this.cache.set(`order_count:${userId}`, total, 300); // 5 分鐘 TTL
    return total;
  }
  
  // 更好：反正規化以避免跨分片查詢
  async getUserOrderCountOptimized(userId) {
    // 在使用者分片中儲存計數
    const userShard = this.getShardForUser(userId);
    return await this.queryUserOrderCount(userShard, userId);
  }
}
```

### 3. 重新平衡分片

規劃增長和重新平衡：

```javascript
class RebalancingShardManager {
  async addNewShard(newShardConnection) {
    // 1. 將新分片添加到配置
    this.shards.push({
      id: this.shards.length,
      connection: newShardConnection
    });
    
    // 2. 逐步遷移資料
    await this.migrateDataToNewShard();
    
    // 3. 更新分片映射
    await this.updateShardMap();
  }
  
  async migrateDataToNewShard() {
    // 使用虛擬分片以便更容易重新平衡
    const virtualShards = 1000; // 許多虛擬分片
    const physicalShards = this.shards.length;
    
    // 將虛擬分片重新映射到實體分片
    for (let i = 0; i < virtualShards; i++) {
      const newPhysicalShard = i % physicalShards;
      await this.remapVirtualShard(i, newPhysicalShard);
    }
  }
}
```

### 4. 處理故障

實作彈性策略：

```javascript
class ResilientShardedDatabase {
  async queryWithRetry(shard, query, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.queryShard(shard, query);
      } catch (error) {
        if (attempt === maxRetries) {
          // 如果可用，嘗試副本
          if (shard.replica) {
            return await this.queryShard(shard.replica, query);
          }
          throw error;
        }
        
        // 指數退避
        await this.sleep(Math.pow(2, attempt) * 100);
      }
    }
  }
  
  async queryShard(shard, query) {
    const connection = await this.connectToShard(shard);
    return await connection.query(query);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 何時使用分片

!!!success "✅ 使用分片的時機"
    **大規模**：資料量超過單一伺服器容量
    
    **高吞吐量**：需要處理數百萬並發操作
    
    **地理分佈**：使用者分散在多個地區
    
    **成本優化**：多個商用伺服器比一個高階伺服器便宜

!!!warning "⚠️ 避免分片的時機"
    **小規模**：資料可以舒適地放在一個伺服器上
    
    **複雜聯結**：應用程式嚴重依賴跨表聯結
    
    **資源有限**：團隊缺乏管理分散式系統的專業知識
    
    **過早優化**：垂直擴展仍然可行

## 優點總結

- **可擴展性**：隨著資料增長添加更多分片
- **效能**：跨分片平行處理
- **成本效率**：使用商用硬體而非昂貴的伺服器
- **地理接近性**：將資料放置在靠近使用者的位置
- **故障隔離**：一個分片的故障不會影響其他分片

## 挑戰總結

- **複雜性**：需要管理更多的活動部件
- **跨分片查詢**：昂貴的扇出操作
- **重新平衡**：難以重新分配資料
- **參照完整性**：難以跨分片維護
- **營運開銷**：監控、備份和維護成倍增加

## 參考資料

- [資料分區指南](https://learn.microsoft.com/en-us/azure/architecture/best-practices/data-partitioning)
- [分片模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)
