---
title: "断路器模式：防止连锁故障"
date: 2020-01-20
categories:
  - Architecture
series: architecture_pattern
excerpt: "了解断路器模式如何通过暂时阻挡对故障服务的调用来保护分布式系统免于连锁故障，让系统有时间恢复。"
lang: zh-CN
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

想象你家中的电路系统。当过多电流流经电线时——可能是短路或插座过载——断路器会跳闸，切断电源以防止损坏或火灾。断路器不会持续尝试将电力强制通过危险的情况。相反地，它会快速失败，保护整个系统。问题修复后，你可以重置断路器并恢复供电。

同样的原理适用于分布式系统。当远程服务故障时，断路器模式可防止应用程序重复尝试注定失败的操作，保护系统资源并实现优雅降级。

## 电路断路器类比

就像电路断路器：
- 监控电流（请求失败）
- 超过阈值时跳闸（过多失败）
- 开启时阻挡进一步尝试（防止连锁故障）
- 冷却后允许测试（半开状态）
- 服务恢复时重置（关闭状态）

软件断路器：
- 监控服务调用失败
- 达到失败阈值时开启
- 开启时立即拒绝请求
- 超时后允许有限的测试请求
- 服务展现恢复时关闭

{% mermaid %}
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: 达到失败阈值
    Open --> HalfOpen: 超时到期
    HalfOpen --> Closed: 达到成功阈值
    HalfOpen --> Open: 发生任何失败
    
    note right of Closed
        正常运作
        请求通过
        计算失败次数
    end note
    
    note right of Open
        快速失败
        请求被拒绝
        计时器运行中
    end note
    
    note right of HalfOpen
        有限测试
        允许试探请求
        评估恢复状况
    end note
{% endmermaid %}

## 问题：分布式系统中的连锁故障

在分布式环境中，远程服务调用可能因各种原因失败：

### 暂时性故障

```javascript
// 会自行解决的临时问题
class PaymentService {
  async processPayment(orderId, amount) {
    try {
      // 网络短暂中断 - 重试可能成功
      return await this.paymentGateway.charge(amount);
    } catch (error) {
      if (error.code === 'NETWORK_TIMEOUT') {
        // 暂时性 - 重试可能有效
        return await this.retry(() => 
          this.paymentGateway.charge(amount)
        );
      }
    }
  }
}
```

### 持续性故障

```javascript
// 服务完全宕机 - 重试无济于事
class InventoryService {
  async checkStock(productId) {
    try {
      return await this.inventoryApi.getStock(productId);
    } catch (error) {
      if (error.code === 'SERVICE_UNAVAILABLE') {
        // 服务崩溃 - 重试浪费资源
        // 每次重试都会占用线程、内存、连接
        // 超时期间会阻挡其他操作
        throw new Error('Inventory service unavailable');
      }
    }
  }
}
```

### 资源耗尽

```javascript
// 失败的服务消耗关键资源
class OrderProcessor {
  async processOrder(order) {
    // 每次失败的调用都会占用资源直到超时
    const promises = [
      this.inventoryService.reserve(order.items),    // 30秒超时
      this.paymentService.charge(order.total),       // 30秒超时
      this.shippingService.schedule(order.address)   // 30秒超时
    ];
    
    try {
      await Promise.all(promises);
    } catch (error) {
      // 如果库存服务宕机：
      // - 100个并发订单 = 100个线程被阻挡
      // - 每个等待30秒超时
      // - 数据库连接被占用
      // - 待处理请求消耗内存
      // - 其他服务无法获取资源
    }
  }
}
```

!!!warning "⚠️ 连锁故障问题"
    **初始故障**：一个服务变慢或无法使用
    
    **资源阻塞**：调用者等待超时，占用线程和连接
    
    **资源耗尽**：系统耗尽线程、内存或连接
    
    **连锁影响**：其他不相关的操作因资源匮乏而失败
    
    **全系统中断**：整个应用程序变得无响应

## 解决方案：断路器模式

断路器作为代理监控失败并防止调用故障服务：

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 60秒
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10秒
    
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // 超时到期，尝试半开
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        console.log('断路器关闭 - 服务已恢复');
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log('断路器开启 - 服务仍在故障中');
    }
    
    if (this.state === 'CLOSED' && 
        this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log('断路器开启 - 达到阈值');
    }
  }
  
  getState() {
    return this.state;
  }
}
```

## 断路器状态

{% mermaid %}
graph TB
    subgraph Closed["🟢 关闭状态"]
        C1[请求到达]
        C2[传递给服务]
        C3{成功？}
        C4[增加失败计数器]
        C5{达到<br/>阈值？}
        C6[返回结果]
        
        C1 --> C2
        C2 --> C3
        C3 -->|是| C6
        C3 -->|否| C4
        C4 --> C5
        C5 -->|否| C6
    end
    
    subgraph Open["🔴 开启状态"]
        O1[请求到达]
        O2[立即失败]
        O3[返回缓存/默认值]
        O4{超时<br/>到期？}
        
        O1 --> O2
        O2 --> O3
        O3 --> O4
    end
    
    subgraph HalfOpen["🟡 半开状态"]
        H1[有限请求]
        H2[传递给服务]
        H3{成功？}
        H4[增加成功计数器]
        H5{成功<br/>阈值？}
        
        H1 --> H2
        H2 --> H3
        H3 -->|是| H4
        H4 --> H5
    end
    
    C5 -->|是| Open
    O4 -->|是| HalfOpen
    H5 -->|是| Closed
    H3 -->|否| Open
    
    style Closed fill:#d3f9d8,stroke:#2f9e44
    style Open fill:#ffe3e3,stroke:#c92a2a
    style HalfOpen fill:#fff3bf,stroke:#f59f00
{% endmermaid %}

### 关闭状态：正常运作

```javascript
class InventoryServiceClient {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      timeout: 60000
    });
  }
  
  async checkStock(productId) {
    return await this.circuitBreaker.execute(async () => {
      // 正常运作 - 请求通过
      const response = await fetch(
        `https://inventory-api.neo01.com/stock/${productId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    });
  }
}

// 使用方式
const client = new InventoryServiceClient();

// 前4次失败 - 断路器保持关闭
for (let i = 0; i < 4; i++) {
  try {
    await client.checkStock('product-123');
  } catch (error) {
    console.log(`尝试 ${i + 1} 失败`);
  }
}

// 第5次失败 - 断路器开启
try {
  await client.checkStock('product-123');
} catch (error) {
  console.log('断路器开启');
}
```

### 开启状态：快速失败

```javascript
class OrderService {
  constructor() {
    this.inventoryClient = new InventoryServiceClient();
    this.defaultStock = { available: false, quantity: 0 };
  }
  
  async processOrder(order) {
    try {
      // 断路器开启 - 立即失败
      const stock = await this.inventoryClient.checkStock(order.productId);
      return this.completeOrder(order, stock);
    } catch (error) {
      if (error.message === 'Circuit breaker is OPEN') {
        // 优雅降级
        console.log('库存服务无法使用，使用默认值');
        return this.completeOrder(order, this.defaultStock);
      }
      throw error;
    }
  }
  
  completeOrder(order, stock) {
    if (!stock.available) {
      return {
        status: 'PENDING',
        message: '库存检查无法使用。订单将很快被验证。'
      };
    }
    
    return {
      status: 'CONFIRMED',
      message: '订单已确认'
    };
  }
}
```

### 半开状态：测试恢复

```javascript
class CircuitBreakerWithHalfOpen extends CircuitBreaker {
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      
      // 进入半开状态
      this.state = 'HALF_OPEN';
      this.successCount = 0;
      console.log('断路器半开 - 测试服务');
    }
    
    if (this.state === 'HALF_OPEN') {
      // 在半开状态限制并发请求
      if (this.pendingRequests >= 3) {
        throw new Error('Circuit breaker is HALF_OPEN - limiting requests');
      }
    }
    
    try {
      this.pendingRequests++;
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    } finally {
      this.pendingRequests--;
    }
  }
}
```

## 实际实现

这是一个生产就绪的断路器，具有监控功能：

```javascript
class ProductionCircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastStateChange = Date.now();
    
    // 指标
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0
    };
    
    // 定期重置失败计数
    this.resetInterval = setInterval(() => {
      if (this.state === 'CLOSED') {
        this.failureCount = 0;
      }
    }, this.monitoringPeriod);
  }
  
  async execute(operation, fallback = null) {
    this.metrics.totalRequests++;
    
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        this.metrics.rejectedRequests++;
        
        if (fallback) {
          return await fallback();
        }
        
        throw new CircuitBreakerOpenError(
          `Circuit breaker is OPEN for ${this.serviceName}`
        );
      }
      
      this.transitionTo('HALF_OPEN');
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      this.metrics.successfulRequests++;
      return result;
    } catch (error) {
      this.onFailure(error);
      this.metrics.failedRequests++;
      
      if (fallback && this.state === 'OPEN') {
        return await fallback();
      }
      
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }
  
  onFailure(error) {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED' && 
               this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN');
    }
    
    this.logError(error);
  }
  
  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    if (newState === 'OPEN') {
      this.nextAttempt = Date.now() + this.timeout;
    }
    
    this.emitStateChange(oldState, newState);
  }
  
  emitStateChange(oldState, newState) {
    console.log(
      `[${this.serviceName}] 断路器：${oldState} → ${newState}`
    );
    
    // 发送指标供监控
    this.publishMetrics({
      service: this.serviceName,
      state: newState,
      timestamp: Date.now(),
      metrics: this.metrics
    });
  }
  
  logError(error) {
    console.error(
      `[${this.serviceName}] 请求失败：`,
      error.message
    );
  }
  
  publishMetrics(data) {
    // 发送到监控系统
    // 示例：CloudWatch、Prometheus、Datadog
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount
    };
  }
  
  destroy() {
    clearInterval(this.resetInterval);
  }
}

class CircuitBreakerOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}
```

## 真实世界示例：电子商务平台

```javascript
class RecommendationService {
  constructor() {
    this.circuitBreaker = new ProductionCircuitBreaker(
      'recommendation-service',
      {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000
      }
    );
    
    this.cache = new Map();
  }
  
  async getRecommendations(userId) {
    const fallback = async () => {
      // 返回缓存的推荐
      if (this.cache.has(userId)) {
        return {
          recommendations: this.cache.get(userId),
          source: 'cache'
        };
      }
      
      // 返回热门商品作为备用
      return {
        recommendations: await this.getPopularItems(),
        source: 'fallback'
      };
    };
    
    return await this.circuitBreaker.execute(
      async () => {
        const response = await fetch(
          `https://recommendations-api.neo01.com/users/${userId}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // 成功时更新缓存
        this.cache.set(userId, data.recommendations);
        
        return {
          recommendations: data.recommendations,
          source: 'live'
        };
      },
      fallback
    );
  }
  
  async getPopularItems() {
    // 返回静态热门商品
    return [
      { id: 'item-1', name: '热门商品 1' },
      { id: 'item-2', name: '热门商品 2' },
      { id: 'item-3', name: '热门商品 3' }
    ];
  }
}

// 使用方式
const recommendationService = new RecommendationService();

async function displayRecommendations(userId) {
  try {
    const result = await recommendationService.getRecommendations(userId);
    
    if (result.source === 'cache') {
      console.log('显示缓存的推荐');
    } else if (result.source === 'fallback') {
      console.log('显示热门商品（服务无法使用）');
    } else {
      console.log('显示个性化推荐');
    }
    
    return result.recommendations;
  } catch (error) {
    console.error('无法获取推荐：', error);
    return [];
  }
}
```

## 断路器与重试模式结合

结合断路器与重试以处理暂时性故障：

```javascript
class ResilientServiceClient {
  constructor(serviceName) {
    this.circuitBreaker = new ProductionCircuitBreaker(serviceName, {
      failureThreshold: 3,
      timeout: 60000
    });
  }
  
  async callWithRetry(operation, maxRetries = 3) {
    return await this.circuitBreaker.execute(async () => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          
          // 某些错误不重试
          if (this.isNonRetryableError(error)) {
            throw error;
          }
          
          if (attempt < maxRetries) {
            // 指数退避
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await this.sleep(delay);
          }
        }
      }
      
      throw lastError;
    });
  }
  
  isNonRetryableError(error) {
    // 不重试客户端错误（4xx）
    return error.status >= 400 && error.status < 500;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 监控与指标

{% echarts %}
{
  "title": {
    "text": "断路器状态随时间变化"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["请求", "失败", "断路器状态"]
  },
  "xAxis": {
    "type": "category",
    "data": ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30"]
  },
  "yAxis": [
    {
      "type": "value",
      "name": "请求数"
    },
    {
      "type": "value",
      "name": "状态",
      "max": 2,
      "axisLabel": {
        "formatter": function(value) {
          return ["关闭", "半开", "开启"][value] || "";
        }
      }
    }
  ],
  "series": [
    {
      "name": "请求",
      "type": "line",
      "data": [100, 95, 90, 20, 25, 80, 100]
    },
    {
      "name": "失败",
      "type": "line",
      "data": [2, 5, 15, 18, 10, 3, 1]
    },
    {
      "name": "断路器状态",
      "type": "line",
      "yAxisIndex": 1,
      "data": [0, 0, 2, 2, 1, 0, 0],
      "itemStyle": {
        "color": "#f59f00"
      }
    }
  ]
}
{% endecharts %}

## 关键考量

!!!anote "💡 异常处理"
    应用程序必须优雅地处理断路器异常：
    - 提供备用响应
    - 显示用户友好的消息
    - 记录以供监控和警报

!!!anote "💡 超时配置"
    平衡超时时间与恢复模式：
    - 太短：服务恢复前断路器重新开启
    - 太长：用户不必要地等待
    - 根据历史数据使用自适应超时

!!!warning "⚠️ 监控至关重要"
    跟踪断路器指标：
    - 状态转换（关闭 → 开启 → 半开）
    - 请求成功/失败率
    - 在每个状态花费的时间
    - 断路器频繁开启时发出警报

!!!tip "💡 备用策略"
    断路器开启时提供有意义的备用：
    - 缓存数据
    - 默认值
    - 降级功能
    - 用户通知

## 何时使用断路器

使用此模式当：

✅ **防止连锁故障**：阻止故障在服务间扩散

✅ **保护共享资源**：防止故障依赖性造成资源耗尽

✅ **优雅降级**：服务故障时维持部分功能

✅ **快速失败**：避免在已知故障上等待超时

不要使用此模式当：

❌ **本地资源**：内存内操作不需要断路器

❌ **业务逻辑异常**：用于基础设施故障，而非业务规则

❌ **简单重试就足够**：快速恢复的暂时性故障

❌ **消息队列**：死信队列能更好地处理故障

## 与重试模式比较

| 方面 | 断路器 | 重试模式 |
|--------|----------------|---------------|
| **目的** | 防止调用故障服务 | 从暂时性故障恢复 |
| **何时使用** | 持续性故障 | 临时故障 |
| **行为** | 达到阈值后快速失败 | 持续尝试并延迟 |
| **资源使用** | 最小（立即拒绝） | 较高（等待重试） |
| **恢复检测** | 主动（半开测试） | 被动（重试成功） |

!!!tip "💡 最佳实践：结合两种模式"
    在断路器内使用重试模式：
    1. 断路器包装操作
    2. 重试处理暂时性故障
    3. 断路器防止过度重试
    4. 系统获得两种方法的优点

## 总结

断路器模式对于构建弹性分布式系统至关重要：

- **防止连锁故障**通过停止对故障服务的调用
- **保护系统资源**免于在中断期间耗尽
- **实现优雅降级**通过备用响应
- **提供快速失败**而非等待超时
- **监控服务健康**并自动检测恢复

就像电路断路器保护你的家一样，这个模式保护你的分布式系统免受故障依赖性造成的损害。它不是为了防止故障——而是为了优雅地失败并快速恢复。

## 参考资料

- [Microsoft Azure Architecture Patterns - Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Martin Fowler - CircuitBreaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Release It! by Michael Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/)
