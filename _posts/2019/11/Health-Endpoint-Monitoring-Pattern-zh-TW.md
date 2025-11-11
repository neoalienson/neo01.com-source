---
title: "健康端點監控：保持服務的活力與健康"
date: 2019-11-15
categories:
  - Architecture
series: architecture_pattern
excerpt: "透過專用端點實作健康檢查，監控應用程式的可用性和效能。學習如何在使用者發現問題之前，驗證服務是否正常運作。"
lang: zh-TW
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

想像一間診所，病人可以隨時走進去做快速健康檢查——量體溫、血壓、心跳——幾分鐘內就能測量完畢。醫生不需要進行手術就能知道是否有問題；這些簡單的生命徵象就能揭示病人的健康狀態。這正是健康端點監控模式為應用程式所做的事：它提供一種快速、非侵入式的方法來檢查服務是否健康。

## 挑戰：在問題發生時及時發現

在現代分散式系統中，應用程式依賴多個元件：
- 資料庫和儲存系統
- 外部 API 和服務
- 訊息佇列
- 快取層
- 網路基礎設施

這些元件都可能故障，當它們故障時，你需要立即知道——在使用者發現之前。

### 傳統方法：等待抱怨

```javascript
// 應用程式盲目運行
class PaymentService {
  async processPayment(order) {
    try {
      // 希望資料庫可用
      await this.database.save(order);
      
      // 希望支付閘道正常
      await this.paymentGateway.charge(order.amount);
      
      return { success: true };
    } catch (error) {
      // 使用者首先發現問題
      console.error('Payment failed:', error);
      return { success: false, error: error.message };
    }
  }
}
```

!!!warning "⚠️ 被動監控的問題"
    **延遲偵測**：當使用者抱怨時才知道故障
    
    **糟糕的使用者體驗**：使用者在關鍵操作時遇到錯誤
    
    **難以診斷**：很難確定什麼故障以及何時故障
    
    **無法主動行動**：無法預防問題或重新路由流量

## 解決方案：健康端點監控

公開專用端點，讓外部監控工具可以定期檢查以驗證應用程式的健康狀態。

{% mermaid %}
graph TB
    A[監控工具] -->|HTTP GET /health| B[負載平衡器]
    B --> C[應用程式實例 1]
    B --> D[應用程式實例 2]
    B --> E[應用程式實例 3]
    
    C --> C1[健康檢查]
    D --> D1[健康檢查]
    E --> E1[健康檢查]
    
    C1 --> C2[資料庫]
    C1 --> C3[快取]
    C1 --> C4[外部 API]
    
    D1 --> C2
    D1 --> C3
    D1 --> C4
    
    E1 --> C2
    E1 --> C3
    E1 --> C4
    
    C1 -->|200 OK| B
    D1 -->|200 OK| B
    E1 -->|503 Error| B
    
    B -->|從池中移除| E
    
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#ff6b6b,stroke:#c92a2a
    style C1 fill:#51cf66,stroke:#2f9e44
    style D1 fill:#51cf66,stroke:#2f9e44
    style E1 fill:#ff6b6b,stroke:#c92a2a
{% endmermaid %}

### 基本實作

```javascript
// 簡單的健康端點
class HealthCheckController {
  async checkHealth(req, res) {
    try {
      // 驗證應用程式正在運行
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
      
      res.status(200).json(status);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }
}

// 註冊端點
app.get('/health', (req, res) => {
  healthCheck.checkHealth(req, res);
});
```

### 全面的健康檢查

強健的健康端點會驗證關鍵依賴項：

```javascript
class ComprehensiveHealthCheck {
  constructor(database, cache, externalService) {
    this.database = database;
    this.cache = cache;
    this.externalService = externalService;
  }
  
  async checkHealth(req, res) {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // 檢查資料庫連線
    try {
      await this.database.ping();
      checks.checks.database = {
        status: 'healthy',
        responseTime: await this.measureResponseTime(
          () => this.database.ping()
        )
      };
    } catch (error) {
      checks.status = 'unhealthy';
      checks.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // 檢查快取可用性
    try {
      await this.cache.set('health_check', 'ok', 10);
      const value = await this.cache.get('health_check');
      
      checks.checks.cache = {
        status: value === 'ok' ? 'healthy' : 'degraded',
        responseTime: await this.measureResponseTime(
          () => this.cache.get('health_check')
        )
      };
    } catch (error) {
      checks.status = 'degraded';
      checks.checks.cache = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // 檢查外部服務
    try {
      const response = await this.externalService.healthCheck();
      checks.checks.externalService = {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: response.time
      };
    } catch (error) {
      checks.status = 'degraded';
      checks.checks.externalService = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // 回傳適當的狀態碼
    const statusCode = checks.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(checks);
  }
  
  async measureResponseTime(operation) {
    const start = Date.now();
    await operation();
    return Date.now() - start;
  }
}
```

## 健康檢查層級

不同目的使用不同端點：

### 1. 存活探測

回答：「應用程式是否正在運行？」

```javascript
// 最小檢查 - 只驗證程序是否存活
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});
```

### 2. 就緒探測

回答：「應用程式是否準備好處理請求？」

```javascript
// 檢查依賴項是否可用
app.get('/health/ready', async (req, res) => {
  try {
    // 驗證關鍵依賴項
    await database.ping();
    await cache.ping();
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    // 尚未準備好服務流量
    res.status(503).json({ 
      status: 'not_ready',
      reason: error.message 
    });
  }
});
```

### 3. 詳細健康檢查

回答：「每個元件的狀態如何？」

```javascript
app.get('/health/detailed', async (req, res) => {
  const health = await comprehensiveHealthCheck.checkAll();
  
  res.status(health.status === 'healthy' ? 200 : 503).json({
    status: health.status,
    components: {
      database: health.database,
      cache: health.cache,
      messageQueue: health.messageQueue,
      externalAPIs: health.externalAPIs
    },
    metrics: {
      requestsPerSecond: metrics.getRequestRate(),
      averageResponseTime: metrics.getAverageResponseTime(),
      errorRate: metrics.getErrorRate()
    }
  });
});
```

## 回應碼及其含義

使用 HTTP 狀態碼來傳達健康狀態：

```javascript
class HealthStatusCodes {
  static OK = 200;              // 一切健康
  static DEGRADED = 200;        // 運作中但有問題
  static SERVICE_UNAVAILABLE = 503;  // 關鍵故障
  static TIMEOUT = 504;         // 健康檢查耗時過長
  
  static determineStatusCode(checks) {
    const hasCriticalFailure = checks.some(
      check => check.critical && check.status === 'unhealthy'
    );
    
    if (hasCriticalFailure) {
      return this.SERVICE_UNAVAILABLE;
    }
    
    const hasNonCriticalFailure = checks.some(
      check => !check.critical && check.status === 'unhealthy'
    );
    
    if (hasNonCriticalFailure) {
      return this.DEGRADED;
    }
    
    return this.OK;
  }
}
```

## 安全性考量

健康端點可能會暴露敏感資訊。適當地保護它們：

### 1. 對詳細檢查使用身份驗證

```javascript
// 公開端點 - 最少資訊
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 受保護端點 - 詳細資訊
app.get('/health/detailed', authenticateMonitoring, async (req, res) => {
  const health = await detailedHealthCheck();
  res.json(health);
});

function authenticateMonitoring(req, res, next) {
  const token = req.headers['x-monitoring-token'];
  
  if (token !== process.env.MONITORING_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}
```

### 2. 使用隱晦的路徑

```javascript
// 不使用 /health，使用較不明顯的路徑
const healthPath = process.env.HEALTH_CHECK_PATH || '/health';
app.get(healthPath, healthCheckHandler);
```

### 3. 速率限制

```javascript
const rateLimit = require('express-rate-limit');

const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 60, // 每分鐘 60 個請求
  message: 'Too many health check requests'
});

app.get('/health', healthCheckLimiter, healthCheckHandler);
```

## 快取健康狀態

避免健康檢查壓垮系統：

```javascript
class CachedHealthCheck {
  constructor(ttlSeconds = 10) {
    this.ttl = ttlSeconds * 1000;
    this.cache = null;
    this.lastCheck = 0;
  }
  
  async getHealth() {
    const now = Date.now();
    
    // 如果仍然有效，回傳快取結果
    if (this.cache && (now - this.lastCheck) < this.ttl) {
      return this.cache;
    }
    
    // 執行實際的健康檢查
    this.cache = await this.performHealthCheck();
    this.lastCheck = now;
    
    return this.cache;
  }
  
  async performHealthCheck() {
    // 實際的健康檢查邏輯
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: await this.runAllChecks()
    };
  }
}

// 使用快取的健康檢查
const cachedHealth = new CachedHealthCheck(10);

app.get('/health', async (req, res) => {
  const health = await cachedHealth.getHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

## 與負載平衡器整合

負載平衡器使用健康檢查將流量僅路由到健康的實例：

```nginx
# Nginx 設定
upstream backend {
    server app1.neo01.com:8080;
    server app2.neo01.com:8080;
    server app3.neo01.com:8080;
}

server {
    location / {
        proxy_pass http://backend;
        
        # 健康檢查設定
        health_check interval=10s
                     fails=3
                     passes=2
                     uri=/health/ready
                     match=health_ok;
    }
}

# 定義「健康」的含義
match health_ok {
    status 200;
    body ~ "\"status\":\"ready\"";
}
```

## 從多個位置監控

從不同地理位置檢查應用程式：

{% mermaid %}
graph TB
    A[監控服務 美東] -->|每 30 秒檢查| B[應用程式]
    C[監控服務 歐洲西部] -->|每 30 秒檢查| B
    D[監控服務 亞太地區] -->|每 30 秒檢查| B
    
    B --> E[警報系統]
    
    E -->|如果 2+ 位置故障| F[發送警報]
    E -->|如果 1 位置故障| G[記錄警告]
    
    style B fill:#4dabf7,stroke:#1971c2
    style F fill:#ff6b6b,stroke:#c92a2a
    style G fill:#ffd43b,stroke:#fab005
{% endmermaid %}

```javascript
class MultiLocationMonitor {
  constructor(locations) {
    this.locations = locations;
    this.results = new Map();
  }
  
  async checkAllLocations(endpoint) {
    const checks = this.locations.map(location => 
      this.checkFromLocation(location, endpoint)
    );
    
    const results = await Promise.allSettled(checks);
    
    // 分析結果
    const failures = results.filter(r => 
      r.status === 'rejected' || r.value.status !== 200
    );
    
    if (failures.length >= 2) {
      // 多個位置故障 - 關鍵問題
      await this.sendAlert('critical', endpoint, failures);
    } else if (failures.length === 1) {
      // 單一位置故障 - 可能的網路問題
      await this.sendAlert('warning', endpoint, failures);
    }
    
    return results;
  }
  
  async checkFromLocation(location, endpoint) {
    const start = Date.now();
    const response = await fetch(`${location.url}${endpoint}`);
    const duration = Date.now() - start;
    
    return {
      location: location.name,
      status: response.status,
      duration,
      timestamp: new Date().toISOString()
    };
  }
}
```

## 最佳實踐

!!!tip "💡 健康檢查指南"
    **保持快速**：健康檢查應在 1 秒內完成
    
    **檢查依賴項**：驗證關鍵元件如資料庫
    
    **使用適當的逾時**：不要讓健康檢查無限期掛起
    
    **回傳有意義的狀態**：使用適當的 HTTP 狀態碼
    
    **快取結果**：避免檢查壓垮系統
    
    **保護敏感端點**：保護詳細的健康資訊
    
    **監控監控器**：確保監控系統正常運作

## 要避免的常見陷阱

!!!warning "⚠️ 不該做的事"
    **不要讓健康檢查太複雜**：它們應該快速且簡單
    
    **不要暴露敏感資料**：避免揭示內部架構細節
    
    **不要跳過關鍵依賴項**：如果資料庫故障，要報告
    
    **不要忽略回應時間**：緩慢的回應表示有問題
    
    **不要對所有事情使用相同端點**：將存活與就緒分開

## 何時使用此模式

此模式對以下情況至關重要：

✅ **Web 應用程式**：驗證可用性和正確操作

✅ **微服務**：監控分散式系統中個別服務的健康狀態

✅ **負載平衡應用程式**：啟用自動流量路由到健康實例

✅ **自動擴展系統**：決定何時新增或移除實例

✅ **高可用性系統**：快速偵測故障以進行容錯移轉

## 實際範例：電子商務平台

```javascript
class ECommerceHealthCheck {
  constructor(dependencies) {
    this.database = dependencies.database;
    this.cache = dependencies.cache;
    this.paymentGateway = dependencies.paymentGateway;
    this.inventoryService = dependencies.inventoryService;
  }
  
  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkPaymentGateway(),
      this.checkInventoryService()
    ]);
    
    const [database, cache, payment, inventory] = checks;
    
    // 決定整體健康狀態
    const criticalFailures = [database, payment].filter(
      check => check.status === 'rejected'
    );
    
    const status = criticalFailures.length > 0 ? 'unhealthy' : 'healthy';
    
    return {
      status,
      timestamp: new Date().toISOString(),
      components: {
        database: this.formatCheck(database, true),
        cache: this.formatCheck(cache, false),
        paymentGateway: this.formatCheck(payment, true),
        inventoryService: this.formatCheck(inventory, false)
      }
    };
  }
  
  async checkDatabase() {
    const start = Date.now();
    await this.database.query('SELECT 1');
    return { responseTime: Date.now() - start };
  }
  
  async checkCache() {
    const start = Date.now();
    await this.cache.ping();
    return { responseTime: Date.now() - start };
  }
  
  async checkPaymentGateway() {
    const start = Date.now();
    const response = await this.paymentGateway.healthCheck();
    return { 
      responseTime: Date.now() - start,
      available: response.status === 'operational'
    };
  }
  
  async checkInventoryService() {
    const start = Date.now();
    const response = await fetch('http://inventory-service/health');
    return {
      responseTime: Date.now() - start,
      status: response.status
    };
  }
  
  formatCheck(check, critical) {
    if (check.status === 'fulfilled') {
      return {
        status: 'healthy',
        critical,
        ...check.value
      };
    } else {
      return {
        status: 'unhealthy',
        critical,
        error: check.reason.message
      };
    }
  }
}
```

## 結論

健康端點監控模式是應用程式的生命徵象監測器。就像醫生使用簡單的檢查來評估病人健康一樣，監控工具使用健康端點來驗證應用程式是否正常運作。透過實作適當的健康檢查，你可以：

- 在使用者遇到故障之前偵測到它們
- 啟用自動流量路由到健康實例
- 提供系統健康狀態的可見性
- 支援自動擴展和自我修復系統

從簡單的存活檢查開始，然後隨著系統成長逐漸新增更全面的健康驗證。記住：健康的應用程式是知道自己何時生病的應用程式。

## 參考資料

- [健康端點監控模式 - Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring)
- 相關模式：[斷路器模式](/zh-TW/2020/01/Circuit-Breaker-Pattern/)、[Sidecar 模式](/zh-TW/2019/07/Sidecar-Pattern/)
