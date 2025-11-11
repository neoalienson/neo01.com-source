---
title: "隔艙模式：在分散式系統中隔離故障"
date: 2020-03-18
categories: Architecture
tags:
  - Architecture
  - Design Patterns
  - Resilience
lang: zh-TW
series: architecture_pattern
excerpt: "探索隔艙模式如何透過隔離資源和限制故障影響範圍，防止分散式系統中的連鎖故障。"
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

想像一艘被隔艙分隔成多個水密艙室的船。如果船體破裂，只有一個艙室會進水，其他艙室保持乾燥，讓船隻保持漂浮。這個海事安全原則啟發了建構彈性分散式系統的關鍵模式：隔艙模式。

## 問題：連鎖故障

在分散式系統中，元件共享資源，如執行緒池、資料庫連線、記憶體和網路頻寬。當一個元件故障或變慢時，它可能會耗盡所有可用資源，造成骨牌效應，導致整個系統崩潰。

考慮以下情境：

- **執行緒池耗盡**：緩慢的外部 API 消耗所有執行緒，阻塞其他操作
- **連線池耗盡**：一個資料庫查詢鎖定所有連線，阻止其他服務存取資料庫
- **記憶體飽和**：一個元件的記憶體洩漏導致整個應用程式崩潰
- **網路頻寬**：大型檔案傳輸佔用其他網路操作的頻寬

!!!warning "⚠️ 實際影響"
    單一緩慢的微服務消耗所有可用執行緒，可能連鎖導致完全的系統中斷，影響數千名使用者和多個業務功能。

## 解決方案：隔離資源

隔艙模式透過將資源分割成隔離的池來解決這個問題。每個元件或服務獲得自己的專用資源，防止故障在系統中擴散。

關鍵原則：

1. **分割資源**成隔離的池（執行緒池、連線池等）
2. **分配資源**基於關鍵性和預期負載
3. **包含故障**在其指定的分區內
4. **維持服務**對未受影響的元件

{% mermaid %}
graph TB
    subgraph "沒有隔艙"
        A1[服務 A] --> SP[共享池<br/>100 執行緒]
        B1[服務 B] --> SP
        C1[服務 C] --> SP
        SP -.->|故障擴散| X1[完全中斷]
    end
    
    subgraph "使用隔艙"
        A2[服務 A] --> PA[池 A<br/>40 執行緒]
        B2[服務 B] --> PB[池 B<br/>30 執行緒]
        C2[服務 C] --> PC[池 C<br/>30 執行緒]
        PB -.->|故障被包含| X2[服務 B 停止]
        PA --> OK1[服務 A 正常]
        PC --> OK2[服務 C 正常]
    end
    
    style X1 fill:#ff6b6b,stroke:#c92a2a
    style X2 fill:#ffd43b,stroke:#f59f00
    style OK1 fill:#51cf66,stroke:#2f9e44
    style OK2 fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 運作方式：資源隔離

讓我們探索如何為不同的資源類型實作隔艙：

### 執行緒池隔離

分離的執行緒池防止一個緩慢的操作阻塞其他操作：

```javascript
// 沒有隔艙 - 共享執行緒池
const sharedExecutor = new ThreadPoolExecutor(100);

app.get('/api/orders', async (req, res) => {
  await sharedExecutor.execute(() => fetchOrders());
});

app.get('/api/inventory', async (req, res) => {
  await sharedExecutor.execute(() => fetchInventory());
});

// 問題：緩慢的 fetchOrders() 阻塞 fetchInventory()
```

```javascript
// 使用隔艙 - 隔離的執行緒池
const orderExecutor = new ThreadPoolExecutor(40);
const inventoryExecutor = new ThreadPoolExecutor(30);
const paymentExecutor = new ThreadPoolExecutor(30);

app.get('/api/orders', async (req, res) => {
  await orderExecutor.execute(() => fetchOrders());
});

app.get('/api/inventory', async (req, res) => {
  await inventoryExecutor.execute(() => fetchInventory());
});

app.get('/api/payment', async (req, res) => {
  await paymentExecutor.execute(() => processPayment());
});

// 好處：緩慢的訂單不會影響庫存或付款
```

### 連線池隔離

為不同服務分離資料庫連線池：

```javascript
// 配置隔離的連線池
const orderDbPool = createPool({
  host: 'db.neo01.com',
  database: 'orders',
  max: 20,  // 最多 20 個連線
  min: 5
});

const analyticsDbPool = createPool({
  host: 'db.neo01.com',
  database: 'analytics',
  max: 10,  // 分析的獨立池
  min: 2
});

// 繁重的分析查詢不會影響訂單處理
async function getOrderDetails(orderId) {
  const conn = await orderDbPool.getConnection();
  try {
    return await conn.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  } finally {
    conn.release();
  }
}

async function runAnalytics() {
  const conn = await analyticsDbPool.getConnection();
  try {
    return await conn.query('SELECT /* 複雜的分析查詢 */');
  } finally {
    conn.release();
  }
}
```

### 斷路器整合

結合隔艙與斷路器以增強彈性：

```javascript
const CircuitBreaker = require('opossum');

// 為每個服務建立隔離的斷路器
const orderServiceBreaker = new CircuitBreaker(callOrderService, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

const inventoryServiceBreaker = new CircuitBreaker(callInventoryService, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

// 每個服務有自己的故障處理
async function processOrder(order) {
  try {
    const orderResult = await orderServiceBreaker.fire(order);
    const inventoryResult = await inventoryServiceBreaker.fire(order.items);
    return { orderResult, inventoryResult };
  } catch (error) {
    // 優雅地處理故障
    return { error: error.message };
  }
}
```

## 實作策略

### 1. 基於服務的分割

根據服務邊界分配資源：

```javascript
class BulkheadManager {
  constructor() {
    this.pools = {
      critical: new ThreadPool(50),    // 關鍵操作
      standard: new ThreadPool(30),    // 標準操作
      background: new ThreadPool(20)   // 背景任務
    };
  }
  
  async execute(priority, task) {
    const pool = this.pools[priority] || this.pools.standard;
    return pool.execute(task);
  }
}

const bulkhead = new BulkheadManager();

// 關鍵的面向使用者操作
app.post('/api/checkout', async (req, res) => {
  const result = await bulkhead.execute('critical', () => 
    processCheckout(req.body)
  );
  res.json(result);
});

// 背景操作
app.post('/api/analytics', async (req, res) => {
  await bulkhead.execute('background', () => 
    logAnalytics(req.body)
  );
  res.status(202).send();
});
```

### 2. 基於租戶的分割

在多租戶系統中為每個租戶隔離資源：

```javascript
class TenantBulkhead {
  constructor() {
    this.tenantPools = new Map();
  }
  
  getPool(tenantId) {
    if (!this.tenantPools.has(tenantId)) {
      this.tenantPools.set(tenantId, new ThreadPool(10));
    }
    return this.tenantPools.get(tenantId);
  }
  
  async execute(tenantId, task) {
    const pool = this.getPool(tenantId);
    return pool.execute(task);
  }
}

// 租戶 A 的繁重負載不會影響租戶 B
const tenantBulkhead = new TenantBulkhead();

app.get('/api/data', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  const result = await tenantBulkhead.execute(tenantId, () =>
    fetchTenantData(tenantId)
  );
  res.json(result);
});
```

### 3. 基於負載的分割

分離高負載和低負載操作：

```javascript
const bulkheadConfig = {
  highThroughput: {
    maxConcurrent: 100,
    queue: 1000
  },
  lowThroughput: {
    maxConcurrent: 20,
    queue: 100
  }
};

// 高吞吐量端點
app.get('/api/search', rateLimiter(bulkheadConfig.highThroughput), 
  async (req, res) => {
    // 處理搜尋請求
  }
);

// 低吞吐量但資源密集
app.post('/api/reports', rateLimiter(bulkheadConfig.lowThroughput),
  async (req, res) => {
    // 生成複雜報告
  }
);
```

## 何時使用隔艙模式

### 主要使用案例

!!!success "✅ 理想情境"
    **共享資源競爭**：當多個服務競爭有限資源（如執行緒、連線或記憶體）時。
    
    **關鍵服務保護**：當您需要保證高優先級服務的可用性，無論其他元件故障如何。
    
    **多租戶系統**：當隔離租戶可防止一個租戶的負載影響其他租戶時。

### 次要使用案例

!!!info "📋 額外好處"
    **效能隔離**：將緩慢操作與快速操作分離，以維持整體系統回應性。
    
    **故障包含**：將故障的影響範圍限制在特定分區。
    
    **資源最佳化**：根據實際使用模式和優先級分配資源。

{% mermaid %}
graph TD
    A[資源分析] --> B{共享資源？}
    B -->|是| C{關鍵服務？}
    B -->|否| D[監控使用]
    C -->|是| E[使用隔艙]
    C -->|否| F{多租戶？}
    F -->|是| E
    F -->|否| G{效能問題？}
    G -->|是| E
    G -->|否| D
    
    style E fill:#51cf66,stroke:#2f9e44
    style D fill:#4dabf7,stroke:#1971c2
{% endmermaid %}

## 架構品質屬性

隔艙模式顯著影響系統品質：

### 彈性

隔艙透過以下方式增強彈性：
- **故障隔離**：將故障包含在特定分區內
- **優雅降級**：在故障期間維持部分功能
- **影響範圍限制**：防止系統中的連鎖故障

### 可用性

可用性改進包括：
- **服務連續性**：關鍵服務在其他故障時保持可用
- **減少停機時間**：隔離的故障不會導致完全中斷
- **更快恢復**：較小的故障域恢復更快

### 效能

效能優勢來自：
- **資源最佳化**：專用資源防止競爭
- **可預測的延遲**：隔離防止緩慢操作影響快速操作
- **更好的吞吐量**：平行處理而不互相干擾

### 可擴展性

可擴展性優勢包括：
- **獨立擴展**：根據需求為特定分區擴展資源
- **負載分配**：在隔離的資源池之間分配負載
- **容量規劃**：更容易為隔離元件規劃容量

## 權衡與考量

像任何模式一樣，隔艙引入了權衡：

!!!warning "⚠️ 潛在缺點"
    **資源開銷**：維護多個池消耗更多總資源
    
    **複雜性**：額外的配置和管理開銷
    
    **資源浪費**：未充分利用的池代表浪費的容量
    
    **調整挑戰**：確定最佳分區大小需要仔細分析

### 調整隔艙大小

確定每個分區的正確大小至關重要：

```javascript
// 調整大小時考慮這些因素
const bulkheadSize = {
  // 預期並發請求
  expectedLoad: 100,
  
  // 平均回應時間（毫秒）
  avgResponseTime: 200,
  
  // 安全邊際（20%）
  safetyMargin: 1.2,
  
  // 計算池大小
  calculate() {
    // Little's Law: L = λ × W
    // L = 並發請求
    // λ = 到達率（請求/秒）
    // W = 系統中的平均時間（秒）
    const arrivalRate = this.expectedLoad / 1;
    const timeInSystem = this.avgResponseTime / 1000;
    return Math.ceil(arrivalRate * timeInSystem * this.safetyMargin);
  }
};

console.log(`建議的池大小：${bulkheadSize.calculate()}`);
```

## 監控與可觀察性

有效的隔艙實作需要監控：

```javascript
class MonitoredBulkhead {
  constructor(name, maxConcurrent) {
    this.name = name;
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
    this.rejected = 0;
    this.completed = 0;
  }
  
  async execute(task) {
    if (this.active >= this.maxConcurrent) {
      this.rejected++;
      throw new Error(`隔艙 ${this.name} 已達容量`);
    }
    
    this.active++;
    const startTime = Date.now();
    
    try {
      const result = await task();
      this.completed++;
      return result;
    } finally {
      this.active--;
      const duration = Date.now() - startTime;
      
      // 發送指標
      metrics.gauge(`bulkhead.${this.name}.active`, this.active);
      metrics.counter(`bulkhead.${this.name}.completed`, 1);
      metrics.histogram(`bulkhead.${this.name}.duration`, duration);
    }
  }
  
  getMetrics() {
    return {
      name: this.name,
      active: this.active,
      utilization: (this.active / this.maxConcurrent) * 100,
      rejected: this.rejected,
      completed: this.completed
    };
  }
}
```

要監控的關鍵指標：

- **使用率**：使用中的池容量百分比
- **拒絕率**：由於容量而拒絕請求的頻率
- **佇列深度**：等待中的請求數量
- **回應時間**：每個分區內的延遲
- **錯誤率**：每個隔艙內的故障

## 實際實作模式

### 模式 1：微服務架構

每個微服務都有隔離的資源：

```javascript
// 服務 A - 訂單服務
const orderService = {
  threadPool: new ThreadPool(50),
  dbPool: createPool({ max: 20 }),
  cachePool: createPool({ max: 10 })
};

// 服務 B - 庫存服務
const inventoryService = {
  threadPool: new ThreadPool(30),
  dbPool: createPool({ max: 15 }),
  cachePool: createPool({ max: 5 })
};

// 服務之間完全隔離
```

### 模式 2：具有隔艙的 API 閘道

API 閘道為後端服務實作隔艙：

```javascript
const gateway = {
  routes: {
    '/api/orders': {
      bulkhead: new Bulkhead(40),
      backend: 'http://orders-service'
    },
    '/api/inventory': {
      bulkhead: new Bulkhead(30),
      backend: 'http://inventory-service'
    },
    '/api/analytics': {
      bulkhead: new Bulkhead(10),
      backend: 'http://analytics-service'
    }
  }
};

app.use(async (req, res) => {
  const route = gateway.routes[req.path];
  if (!route) return res.status(404).send();
  
  try {
    await route.bulkhead.execute(async () => {
      const response = await fetch(route.backend + req.path);
      res.json(await response.json());
    });
  } catch (error) {
    res.status(503).json({ error: '服務不可用' });
  }
});
```

## 結論

隔艙模式對於建構彈性分散式系統至關重要。透過隔離資源和包含故障，它使系統能夠：

- 防止連鎖故障
- 在中斷期間維持部分功能
- 保護關鍵服務
- 最佳化資源利用

雖然它引入了額外的複雜性和資源開銷，但改進的彈性和可用性使其對生產系統來說非常寶貴。當共享資源造成競爭或當您需要保證關鍵服務的可用性時，請實作隔艙。

## 相關模式

- **斷路器**：透過防止呼叫故障服務來補充隔艙
- **重試模式**：與隔艙一起處理暫時性故障
- **節流**：控制請求速率以防止資源耗盡
- **基於佇列的負載平衡**：平滑可能壓垮隔艙的負載峰值

## 參考資料

- [Microsoft Azure Architecture Patterns: Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead)
- [Release It! Design and Deploy Production-Ready Software](https://pragprog.com/titles/mnee2/release-it-second-edition/)
- [Netflix Hystrix: Bulkhead Pattern](https://github.com/Netflix/Hystrix/wiki/How-it-Works#bulkheads)
