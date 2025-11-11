---
title: "Sidecar 模式：在不觸碰程式碼的情況下擴展應用程式"
date: 2019-07-20
categories:
  - Architecture
series: architecture_pattern
excerpt: "將支援元件部署在應用程式旁邊的獨立容器中。了解 Sidecar 模式如何實現隔離、封裝和異構技術堆疊。"
lang: zh-TW
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

想像一下在摩托車上安裝邊車。邊車與摩托車共享旅程，提供額外功能，但仍然是一個獨立的單元。這正是 Sidecar 模式在軟體架構中的運作方式——一種強大的方法，可以在不修改核心應用程式程式碼的情況下擴展應用程式功能。

## 摩托車類比

這個模式的名稱來自摩托車邊車。就像邊車：
- 附加在摩托車上
- 共享相同的旅程
- 提供額外容量
- 可以獨立添加或移除

軟體中的 sidecar 元件：
- 部署在主應用程式旁邊
- 共享相同的生命週期
- 提供支援功能
- 獨立運作

{% mermaid %}
graph LR
    A[客戶端] --> B[負載平衡器]
    B --> C[應用程式實例 1]
    B --> D[應用程式實例 2]
    C --- C1[Sidecar 1]
    D --- D1[Sidecar 2]
    C1 --> E[監控服務]
    D1 --> E
    C1 --> F[日誌聚合器]
    D1 --> F
    
    style C fill:#4dabf7,stroke:#1971c2
    style D fill:#4dabf7,stroke:#1971c2
    style C1 fill:#ffd43b,stroke:#fab005
    style D1 fill:#ffd43b,stroke:#fab005
{% endmermaid %}

## 問題：橫切關注點

現代應用程式需要各種支援功能：
- 日誌記錄和監控
- 配置管理
- 服務發現
- 網路代理
- 安全性和身份驗證

### 傳統方法及其限制

**方法 1：將所有內容嵌入應用程式**

```javascript
class Application {
  constructor() {
    this.logger = new Logger();
    this.metrics = new MetricsCollector();
    this.config = new ConfigManager();
    this.healthCheck = new HealthChecker();
  }
  
  async processRequest(request) {
    // 業務邏輯與基礎設施關注點混合
    this.logger.log('Processing request');
    this.metrics.increment('requests');
    
    const config = await this.config.get('settings');
    const result = await this.businessLogic(request, config);
    
    this.metrics.recordLatency(Date.now() - request.startTime);
    return result;
  }
}
```

!!!warning "⚠️ 嵌入式方法的問題"
    **緊密耦合**：基礎設施程式碼與業務邏輯混合
    
    **語言鎖定**：所有元件必須使用相同語言
    
    **更新困難**：更新日誌記錄需要更改應用程式程式碼
    
    **資源共享**：日誌記錄中的錯誤可能導致整個應用程式崩潰

**方法 2：獨立服務**

```javascript
// 應用程式對獨立服務進行網路呼叫
class Application {
  async processRequest(request) {
    await fetch('http://logging-service/log', {
      method: 'POST',
      body: JSON.stringify({ message: 'Processing request' })
    });
    
    const result = await this.businessLogic(request);
    
    await fetch('http://metrics-service/record', {
      method: 'POST',
      body: JSON.stringify({ metric: 'request_processed' })
    });
    
    return result;
  }
}
```

!!!warning "⚠️ 獨立服務的問題"
    **網路延遲**：每個日誌或指標都需要網路呼叫
    
    **複雜性**：管理多個服務端點
    
    **故障處理**：如果日誌服務停機怎麼辦？

## 解決方案：Sidecar 模式

將支援元件部署為與主應用程式一起運行的獨立程序或容器：

```yaml
# 容器編排配置
services:
  main-app:
    image: my-application:latest
    ports:
      - "8080:8080"
    
  logging-sidecar:
    image: log-collector:latest
    volumes:
      - /var/log/app:/logs
    
  monitoring-sidecar:
    image: metrics-exporter:latest
    environment:
      - METRICS_PORT=9090
```

應用程式保持簡單：

```javascript
// 應用程式純粹專注於業務邏輯
class Application {
  async processRequest(request) {
    // 只寫入 stdout - sidecar 處理收集
    console.log('Processing request');
    
    // 僅業務邏輯
    const result = await this.businessLogic(request);
    
    return result;
  }
}
```

Sidecar 處理基礎設施關注點：

```javascript
// 日誌 sidecar（獨立程序）
class LoggingSidecar {
  constructor() {
    this.logAggregator = new LogAggregator();
  }
  
  async start() {
    // 監視應用程式日誌
    const logStream = fs.createReadStream('/var/log/app/stdout');
    
    logStream.on('data', (chunk) => {
      const logs = this.parseLogEntries(chunk);
      
      // 使用元資料豐富
      logs.forEach(log => {
        log.hostname = os.hostname();
        log.timestamp = new Date().toISOString();
        log.environment = process.env.ENVIRONMENT;
      });
      
      // 發送到集中式日誌記錄
      this.logAggregator.send(logs);
    });
  }
}
```

## 主要優勢

### 1. 語言獨立性

不同元件可以使用不同語言：

```yaml
services:
  # Node.js 中的主應用程式
  app:
    image: node:18
    command: node server.js
    
  # Go 中的監控 sidecar（為了效能）
  metrics:
    image: golang:1.20
    command: ./metrics-collector
    
  # Python 中的日誌處理器（用於 ML 分析）
  logs:
    image: python:3.11
    command: python log_analyzer.py
```

### 2. 隔離和容錯

Sidecar 中的崩潰不會終止主應用程式：

```javascript
// 主應用程式繼續運行
class Application {
  async processRequest(request) {
    try {
      // 嘗試記錄（sidecar 可能停機）
      await this.notifySidecar('request_received');
    } catch (error) {
      // Sidecar 不可用，但我們繼續
      console.error('Sidecar unavailable:', error.message);
    }
    
    // 無論如何業務邏輯都會繼續
    return await this.businessLogic(request);
  }
}
```

### 3. 資源管理

獨立控制資源：

```yaml
services:
  app:
    image: my-app:latest
    resources:
      limits:
        memory: 2G
        cpu: "2.0"
      
  sidecar:
    image: log-collector:latest
    resources:
      limits:
        memory: 512M
        cpu: "0.5"
```

### 4. 獨立更新

在不觸碰應用程式的情況下更新 sidecar：

```bash
# 將監控 sidecar 更新到新版本
kubectl set image deployment/my-app \
  monitoring-sidecar=metrics-collector:v2.0

# 應用程式繼續運行不變
```

## 常見使用案例

### 使用案例 1：服務網格代理

Sidecar 代理處理所有網路通訊：

{% mermaid %}
graph LR
    A[服務 A] --> A1[代理 Sidecar]
    B[服務 B] --> B1[代理 Sidecar]
    A1 -->|加密| B1
    A1 --> C[服務發現]
    B1 --> C
    A1 --> D[指標]
    B1 --> D
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#4dabf7,stroke:#1971c2
    style A1 fill:#ffd43b,stroke:#fab005
    style B1 fill:#ffd43b,stroke:#fab005
{% endmermaid %}

```javascript
// 應用程式進行簡單的 HTTP 呼叫
class ServiceA {
  async callServiceB(data) {
    // 代理 sidecar 處理：
    // - 服務發現
    // - 負載平衡
    // - 重試邏輯
    // - 斷路器
    // - TLS 加密
    // - 指標收集
    return await fetch('http://localhost:15001/service-b', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
```

### 使用案例 2：配置管理

Sidecar 監視配置變更：

```javascript
// 配置 sidecar
class ConfigSidecar {
  constructor() {
    this.configStore = new ConfigStore();
    this.sharedVolume = '/config';
  }
  
  async start() {
    // 監視配置變更
    this.configStore.watch('app-config', async (newConfig) => {
      // 寫入共享卷
      await fs.writeFile(
        `${this.sharedVolume}/config.json`,
        JSON.stringify(newConfig)
      );
      
      // 通知應用程式（透過訊號或 API）
      await this.notifyApplication('config_updated');
    });
  }
}

// 應用程式從共享卷讀取
class Application {
  loadConfig() {
    return JSON.parse(
      fs.readFileSync('/config/config.json', 'utf8')
    );
  }
}
```

### 使用案例 3：日誌聚合

在不更改應用程式的情況下收集和轉發日誌：

```javascript
// 應用程式只寫入 stdout/stderr
console.log('User logged in:', userId);
console.error('Payment failed:', error);

// Sidecar 收集和處理
class LogAggregationSidecar {
  async collectLogs() {
    const logs = await this.readApplicationLogs();
    
    // 解析和豐富
    const enrichedLogs = logs.map(log => ({
      ...log,
      service: 'payment-service',
      version: process.env.APP_VERSION,
      region: process.env.REGION,
      timestamp: new Date().toISOString()
    }));
    
    // 轉發到日誌聚合服務
    await this.forwardToLogService(enrichedLogs);
  }
}
```

### 使用案例 4：安全性和身份驗證

在 sidecar 層級處理身份驗證：

```javascript
// 身份驗證 sidecar 攔截請求
class AuthSidecar {
  async handleRequest(req) {
    // 驗證 JWT 令牌
    const token = req.headers.authorization;
    const user = await this.validateToken(token);
    
    if (!user) {
      return { status: 401, body: 'Unauthorized' };
    }
    
    // 將使用者上下文添加到請求
    req.headers['X-User-Id'] = user.id;
    req.headers['X-User-Roles'] = user.roles.join(',');
    
    // 轉發到應用程式
    return await this.forwardToApp(req);
  }
}

// 應用程式接收已驗證的請求
class Application {
  async handleRequest(req) {
    // 使用者已由 sidecar 驗證
    const userId = req.headers['X-User-Id'];
    const roles = req.headers['X-User-Roles'].split(',');
    
    // 專注於業務邏輯
    return await this.processBusinessLogic(userId, roles);
  }
}
```

## 實作模式

### 模式 1：共享卷

Sidecar 透過共享檔案系統通訊：

```yaml
services:
  app:
    volumes:
      - shared-data:/data
      
  sidecar:
    volumes:
      - shared-data:/data

volumes:
  shared-data:
```

### 模式 2：本地主機網路

Sidecar 透過 localhost 通訊：

```javascript
// 應用程式公開指標端點
app.get('/metrics', (req, res) => {
  res.json({
    requests: requestCount,
    errors: errorCount
  });
});

// Sidecar 抓取指標
class MetricsSidecar {
  async collectMetrics() {
    const response = await fetch('http://localhost:8080/metrics');
    const metrics = await response.json();
    
    await this.exportToMonitoring(metrics);
  }
}
```

### 模式 3：程序間通訊

使用訊號或套接字進行通訊：

```javascript
// 應用程式監聽訊號
process.on('SIGUSR1', () => {
  console.log('Reloading configuration...');
  this.reloadConfig();
});

// Sidecar 發送訊號
class ConfigSidecar {
  async notifyConfigChange() {
    const appPid = await this.getApplicationPid();
    process.kill(appPid, 'SIGUSR1');
  }
}
```

## 何時使用 Sidecar 模式

### 理想場景

!!!success "✅ 完美使用案例"
    **異構應用程式**：多個不同語言的服務需要相同功能
    
    **橫切關注點**：適用於所有服務的日誌記錄、監控、配置
    
    **第三方整合**：為您無法控制的應用程式添加功能
    
    **獨立擴展**：Sidecar 和應用程式有不同的資源需求

### 真實世界範例

**微服務平台**
- 服務網格代理（Envoy、Linkerd）
- 日誌收集器（Fluentd、Filebeat）
- 指標匯出器（Prometheus 匯出器）
- 秘密管理器

**舊版應用程式現代化**
- 為舊版應用程式添加監控
- 實作現代身份驗證
- 啟用服務發現
- 添加斷路器

### 何時避免

!!!danger "❌ 不適合的情況"
    **嚴格的效能要求**：程序間通訊開銷不可接受
    
    **簡單應用程式**：管理 sidecar 的開銷超過好處
    
    **需要深度整合**：Sidecar 需要存取應用程式內部
    
    **需要獨立擴展**：Sidecar 和應用程式需要不同的擴展策略

## 考量和權衡

### 部署複雜性

管理每個應用程式實例的多個容器：

```yaml
# 之前：簡單部署
docker run my-app:latest

# 之後：協調部署
docker-compose up
# 或
kubectl apply -f deployment.yaml
```

!!!anote "📝 複雜性管理"
    使用容器編排平台（Kubernetes、Docker Swarm）自動管理 sidecar 生命週期。

### 資源開銷

每個應用程式實例現在運行多個程序：

{% echarts %}
{
  "title": {
    "text": "資源使用：獨立 vs Sidecar"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["獨立應用程式", "應用程式 + Sidecar"]
  },
  "xAxis": {
    "type": "category",
    "data": ["CPU", "記憶體", "網路"]
  },
  "yAxis": {
    "type": "value",
    "name": "資源單位"
  },
  "series": [
    {
      "name": "獨立應用程式",
      "type": "bar",
      "data": [100, 100, 100],
      "itemStyle": {
        "color": "#4dabf7"
      }
    },
    {
      "name": "應用程式 + Sidecar",
      "type": "bar",
      "data": [120, 130, 110],
      "itemStyle": {
        "color": "#ffd43b"
      }
    }
  ]
}
{% endecharts %}

### 通訊延遲

程序間通訊增加開銷：

```javascript
// 直接函式呼叫：約 1 微秒
this.logger.log('message');

// HTTP 到 sidecar：約 1 毫秒
await fetch('http://localhost:9090/log', {
  method: 'POST',
  body: JSON.stringify({ message: 'message' })
});

// 共享卷：約 100 微秒
await fs.appendFile('/logs/app.log', 'message\n');
```

!!!tip "💡 最佳化策略"
    **使用 Localhost**：最小化網路開銷
    
    **批次操作**：聚合多個呼叫
    
    **非同步通訊**：不等待 sidecar 回應
    
    **共享記憶體**：對高頻率資料使用記憶體映射檔案

## 完整實作範例

這是一個包含應用程式和監控 sidecar 的全面範例：

```javascript
// main-app.js - 應用程式
const express = require('express');
const app = express();

class Application {
  constructor() {
    this.requestCount = 0;
    this.errorCount = 0;
  }
  
  // 業務邏輯端點
  setupRoutes() {
    app.post('/api/orders', async (req, res) => {
      this.requestCount++;
      
      try {
        const order = await this.processOrder(req.body);
        console.log('Order processed:', order.id);
        res.json(order);
      } catch (error) {
        this.errorCount++;
        console.error('Order failed:', error.message);
        res.status(500).json({ error: error.message });
      }
    });
    
    // 供 sidecar 使用的指標端點
    app.get('/internal/metrics', (req, res) => {
      res.json({
        requests: this.requestCount,
        errors: this.errorCount,
        uptime: process.uptime()
      });
    });
  }
  
  async processOrder(orderData) {
    // 業務邏輯在這裡
    return { id: Date.now(), ...orderData };
  }
  
  start() {
    this.setupRoutes();
    app.listen(8080, () => {
      console.log('Application running on port 8080');
    });
  }
}

new Application().start();
```

```javascript
// monitoring-sidecar.js - 監控 Sidecar
const fetch = require('node-fetch');

class MonitoringSidecar {
  constructor() {
    this.metricsEndpoint = 'http://localhost:8080/internal/metrics';
    this.exportEndpoint = process.env.METRICS_EXPORT_URL;
  }
  
  async collectMetrics() {
    try {
      const response = await fetch(this.metricsEndpoint);
      const metrics = await response.json();
      
      // 使用環境資料豐富
      const enrichedMetrics = {
        ...metrics,
        hostname: require('os').hostname(),
        timestamp: new Date().toISOString(),
        environment: process.env.ENVIRONMENT,
        version: process.env.APP_VERSION
      };
      
      // 匯出到監控系統
      await this.exportMetrics(enrichedMetrics);
      
      console.log('Metrics collected:', enrichedMetrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error.message);
    }
  }
  
  async exportMetrics(metrics) {
    if (!this.exportEndpoint) return;
    
    await fetch(this.exportEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    });
  }
  
  start() {
    console.log('Monitoring sidecar started');
    
    // 每 10 秒收集指標
    setInterval(() => this.collectMetrics(), 10000);
  }
}

new MonitoringSidecar().start();
```

```yaml
# docker-compose.yml - 部署配置
version: '3.8'

services:
  app:
    build: ./app
    ports:
      - "8080:8080"
    environment:
      - ENVIRONMENT=production
      - APP_VERSION=1.0.0
    networks:
      - app-network
    
  monitoring-sidecar:
    build: ./monitoring-sidecar
    environment:
      - METRICS_EXPORT_URL=http://metrics-server:9090/api/metrics
      - ENVIRONMENT=production
      - APP_VERSION=1.0.0
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## 與其他模式的關係

### Ambassador 模式

Ambassador 模式是用於網路通訊的專門 sidecar：

```javascript
// Ambassador sidecar 處理所有出站請求
class AmbassadorSidecar {
  async proxyRequest(target, request) {
    // 服務發現
    const endpoint = await this.discover(target);
    
    // 斷路器
    if (this.isCircuitOpen(target)) {
      throw new Error('Circuit breaker open');
    }
    
    // 重試邏輯
    return await this.retryWithBackoff(() =>
      fetch(endpoint, request)
    );
  }
}
```

### Adapter 模式

Adapter 模式是轉換介面的 sidecar：

```javascript
// Adapter sidecar 將舊版協定轉換為現代 API
class AdapterSidecar {
  async translateRequest(legacyRequest) {
    // 將舊版格式轉換為現代格式
    const modernRequest = {
      method: legacyRequest.action,
      data: this.transformData(legacyRequest.payload)
    };
    
    // 轉發到現代服務
    return await this.forwardToModernService(modernRequest);
  }
}
```

## 結論

Sidecar 模式提供了一種強大的方式來擴展應用程式功能，而無需修改應用程式程式碼。透過將支援元件部署為獨立的程序或容器，您可以獲得：

- **語言獨立性** - 為每項工作使用最佳工具
- **隔離** - 故障不會級聯
- **靈活性** - 獨立更新元件
- **可重用性** - 在多個應用程式中使用相同的 sidecar

雖然它引入了部署複雜性和資源開銷，但好處通常超過成本，特別是在微服務架構和容器化環境中。

當您需要為多個應用程式添加橫切關注點、現代化舊版系統或建構支援異構技術堆疊的平台時，這種模式表現出色。

## 參考資料

- [Microsoft Azure Architecture - Sidecar Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar)
