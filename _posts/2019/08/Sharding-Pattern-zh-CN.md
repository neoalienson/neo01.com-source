---
title: "分片模式：水平扩展数据存储"
date: 2019-08-17
categories:
  - Architecture
series: architecture_pattern
excerpt: "将数据存储分割成水平分区以提升可扩展性和性能。了解分片如何将数据分散到多个服务器以处理大量数据。"
lang: zh-CN
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

想象一个图书馆已经成长到单一建筑物无法容纳所有书籍的规模。与其建造一个不可能的巨大建筑，你建立了多个图书馆分馆——每个分馆存放按特定类别或范围组织的书籍。读者根据他们要找的内容知道该去哪个分馆。这就是分片的本质：将数据分散到多个存储系统以克服单一服务器的限制。

## 图书馆类比

就像一个有多个分馆的图书馆系统：
- 将书籍分散到各个地点
- 允许多位读者同时访问
- 减少任何单一地点的拥挤
- 实现地理位置上更接近用户

分片数据存储：
- 将数据分散到多个服务器
- 允许并行查询和写入
- 减少任何单一数据库的竞争
- 实现数据局部性以获得更好的性能

{% mermaid %}
graph TB
    A[应用程序] --> B[分片逻辑]
    B --> C[分片 1<br/>用户 A-H]
    B --> D[分片 2<br/>用户 I-P]
    B --> E[分片 3<br/>用户 Q-Z]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 问题：单一服务器的限制

托管在单一服务器上的数据存储面临不可避免的限制：

### 存储空间限制

```javascript
// 随着数据增长，单一服务器会耗尽空间
class UserDatabase {
  constructor() {
    this.storage = new DiskStorage('/data');
    // 当我们达到 10TB？100TB？1PB 时会发生什么？
  }
  
  async addUser(user) {
    try {
      await this.storage.write(user.id, user);
    } catch (error) {
      if (error.code === 'ENOSPC') {
        // 磁盘已满 - 现在怎么办？
        throw new Error('Storage capacity exceeded');
      }
    }
  }
}
```

### 计算资源限制

```javascript
// 单一服务器处理数百万并发用户
class OrderDatabase {
  async processQuery(query) {
    // CPU 处理查询达到上限
    // 内存缓存结果耗尽
    // 查询开始超时
    const result = await this.executeQuery(query);
    return result;
  }
}
```

### 网络带宽瓶颈

```javascript
// 所有流量都通过一个网络接口
class DataStore {
  async handleRequest(request) {
    // 网络接口在 10Gbps 时饱和
    // 请求开始被丢弃
    // 响应时间大幅增加
    return await this.processRequest(request);
  }
}
```

### 地理分布挑战

```javascript
// 全球用户访问单一数据中心
class GlobalApplication {
  async getUserData(userId) {
    // 东京的用户访问弗吉尼亚州的数据
    // 仅网络往返就需要 200ms 延迟
    // 在美国存储欧盟数据的合规问题
    return await this.database.query({ userId });
  }
}
```

!!!warning "⚠️ 垂直扩展的限制"
    **暂时解决方案**：向单一服务器添加更多 CPU、内存或磁盘
    
    **物理限制**：最终你无法添加更多资源
    
    **成本效率低**：高端服务器变得指数级昂贵
    
    **单点故障**：一个服务器故障影响所有用户

## 解决方案：水平分区（分片）

将数据存储分割成称为分片的水平分区。每个分片：
- 具有相同的架构
- 包含不同的数据子集
- 在独立的存储节点上运行
- 独立运作

{% mermaid %}
graph TB
    A[应用程序层] --> B[分片映射/路由器]
    B --> C[分片 A<br/>订单 0-999]
    B --> D[分片 B<br/>订单 1000-1999]
    B --> E[分片 C<br/>订单 2000-2999]
    B --> F[分片 D<br/>订单 3000+]
    
    C --> C1[(数据库<br/>服务器 1)]
    D --> D1[(数据库<br/>服务器 2)]
    E --> E1[(数据库<br/>服务器 3)]
    F --> F1[(数据库<br/>服务器 4)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
    style F fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 分片策略

### 1. 查找策略

使用映射表将请求路由到适当的分片：

```javascript
class LookupShardRouter {
  constructor() {
    // 分片映射存储在快速缓存或数据库中
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
    A[请求:<br/>Tenant-3] --> B[查找<br/>分片映射]
    B --> C{Tenant-3<br/>→ 分片 B}
    C --> D[(分片 B<br/>数据库)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style D fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 查找策略的优点"
    **灵活性**：通过更新映射轻松重新平衡
    
    **虚拟分片**：将逻辑分片映射到较少的物理服务器
    
    **控制**：将高价值租户分配到专用分片

### 2. 范围策略

根据连续的分片键将相关项目分组在一起：

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
    // 高效：仅查询相关分片
    const relevantShards = this.shardRanges
      .filter(r => r.max >= startDate && r.min <= endDate)
      .map(r => r.shard);
    
    // 对多个分片进行并行查询
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
    A[查询:<br/>2019 年第二季订单] --> B[范围路由器]
    B --> C[分片 Q2<br/>2019 年 4-6 月]
    
    D[查询:<br/>2019 年 4-7 月订单] --> B
    B --> C
    B --> E[分片 Q3<br/>2019 年 7-9 月]
    
    style A fill:#4dabf7,stroke:#1971c2
    style D fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 范围策略的优点"
    **范围查询**：有效检索连续数据
    
    **自然排序**：数据以逻辑顺序存储
    
    **基于时间的归档**：轻松归档旧分片

!!!warning "⚠️ 范围策略的风险"
    **热点**：最近的数据通常被更频繁地访问
    
    **不均匀分布**：某些范围可能比其他范围增长得更大

### 3. 哈希策略

使用哈希函数均匀分布数据：

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
    // 简单的哈希函数（生产环境使用更好的哈希）
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // 转换为 32 位整数
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

// 分布示例
const router = new HashShardRouter();
console.log(router.getShardForUser('user-123')); // db-shard-2
console.log(router.getShardForUser('user-124')); // db-shard-0
console.log(router.getShardForUser('user-125')); // db-shard-3
// 用户分散到各个分片
```

{% mermaid %}
graph TB
    A[用户 ID] --> B[哈希函数]
    B --> C[user-55 → 哈希: 2]
    B --> D[user-56 → 哈希: 0]
    B --> E[user-57 → 哈希: 1]
    
    C --> F[(分片 2)]
    D --> G[(分片 0)]
    E --> H[(分片 1)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style F fill:#51cf66,stroke:#2f9e44
    style G fill:#51cf66,stroke:#2f9e44
    style H fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 哈希策略的优点"
    **均匀分布**：防止热点
    
    **无需查找表**：直接计算分片位置
    
    **可扩展**：适用于许多分片

!!!warning "⚠️ 哈希策略的挑战"
    **范围查询**：难以有效查询范围
    
    **重新平衡**：添加分片需要重新哈希数据

## 策略比较

{% echarts %}
{
  "title": {
    "text": "分片策略权衡"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["查找", "范围", "哈希"]
  },
  "radar": {
    "indicator": [
      { "name": "灵活性", "max": 10 },
      { "name": "均匀分布", "max": 10 },
      { "name": "范围查询性能", "max": 10 },
      { "name": "简单性", "max": 10 },
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
        "name": "范围"
      },
      {
        "value": [6, 10, 3, 9, 4],
        "name": "哈希"
      }
    ]
  }]
}
{% endecharts %}

## 实际实现示例

这是一个电子商务平台的完整分片实现：

```javascript
class ShardedOrderDatabase {
  constructor() {
    // 使用哈希策略实现均匀分布
    this.shards = [
      { id: 0, connection: 'orders-db-0.neo01.com' },
      { id: 1, connection: 'orders-db-1.neo01.com' },
      { id: 2, connection: 'orders-db-2.neo01.com' },
      { id: 3, connection: 'orders-db-3.neo01.com' }
    ];
  }
  
  getShardForOrder(orderId) {
    // 从订单 ID 中提取数字部分
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
    // 用户订单分散在各个分片 - 需要扇出查询
    const results = await Promise.all(
      this.shards.map(async (shard) => {
        const connection = await this.connectToShard(shard);
        return await connection.query(
          'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
          [userId]
        );
      })
    );
    
    // 合并并排序来自所有分片的结果
    return results
      .flat()
      .sort((a, b) => b.created_at - a.created_at);
  }
  
  async connectToShard(shard) {
    // 每个分片的连接池
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

## 关键考量

### 1. 选择分片键

分片键决定数据分布和查询性能：

```javascript
// 好：静态、均匀分布
const shardKey = user.id; // UUID，永不改变

// 坏：可能随时间改变
const shardKey = user.email; // 用户可能更改电子邮件

// 坏：不均匀分布
const shardKey = user.country; // 某些国家的用户多得多
```

!!!anote "📝 分片键最佳实践"
    **不可变**：选择永不改变的键
    
    **高基数**：许多唯一值以实现均匀分布
    
    **查询对齐**：支持最常见的查询模式
    
    **避免热点**：如果使用哈希策略，避免连续键

### 2. 跨分片查询

最小化跨越多个分片的查询：

```javascript
class OptimizedShardedDatabase {
  // 好：单一分片查询
  async getOrderById(orderId) {
    const shard = this.getShardForOrder(orderId);
    return await this.queryShardById(shard, orderId);
  }
  
  // 可接受：带缓存的扇出
  async getUserOrderCount(userId) {
    // 缓存结果以避免重复的扇出查询
    const cached = await this.cache.get(`order_count:${userId}`);
    if (cached) return cached;
    
    const counts = await Promise.all(
      this.shards.map(shard => this.countUserOrders(shard, userId))
    );
    
    const total = counts.reduce((sum, count) => sum + count, 0);
    await this.cache.set(`order_count:${userId}`, total, 300); // 5 分钟 TTL
    return total;
  }
  
  // 更好：反规范化以避免跨分片查询
  async getUserOrderCountOptimized(userId) {
    // 在用户分片中存储计数
    const userShard = this.getShardForUser(userId);
    return await this.queryUserOrderCount(userShard, userId);
  }
}
```

### 3. 重新平衡分片

规划增长和重新平衡：

```javascript
class RebalancingShardManager {
  async addNewShard(newShardConnection) {
    // 1. 将新分片添加到配置
    this.shards.push({
      id: this.shards.length,
      connection: newShardConnection
    });
    
    // 2. 逐步迁移数据
    await this.migrateDataToNewShard();
    
    // 3. 更新分片映射
    await this.updateShardMap();
  }
  
  async migrateDataToNewShard() {
    // 使用虚拟分片以便更容易重新平衡
    const virtualShards = 1000; // 许多虚拟分片
    const physicalShards = this.shards.length;
    
    // 将虚拟分片重新映射到物理分片
    for (let i = 0; i < virtualShards; i++) {
      const newPhysicalShard = i % physicalShards;
      await this.remapVirtualShard(i, newPhysicalShard);
    }
  }
}
```

### 4. 处理故障

实现弹性策略：

```javascript
class ResilientShardedDatabase {
  async queryWithRetry(shard, query, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.queryShard(shard, query);
      } catch (error) {
        if (attempt === maxRetries) {
          // 如果可用，尝试副本
          if (shard.replica) {
            return await this.queryShard(shard.replica, query);
          }
          throw error;
        }
        
        // 指数退避
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

## 何时使用分片

!!!success "✅ 使用分片的时机"
    **大规模**：数据量超过单一服务器容量
    
    **高吞吐量**：需要处理数百万并发操作
    
    **地理分布**：用户分散在多个地区
    
    **成本优化**：多个商用服务器比一个高端服务器便宜

!!!warning "⚠️ 避免分片的时机"
    **小规模**：数据可以舒适地放在一个服务器上
    
    **复杂联结**：应用程序严重依赖跨表联结
    
    **资源有限**：团队缺乏管理分布式系统的专业知识
    
    **过早优化**：垂直扩展仍然可行

## 优点总结

- **可扩展性**：随着数据增长添加更多分片
- **性能**：跨分片并行处理
- **成本效率**：使用商用硬件而非昂贵的服务器
- **地理接近性**：将数据放置在靠近用户的位置
- **故障隔离**：一个分片的故障不会影响其他分片

## 挑战总结

- **复杂性**：需要管理更多的活动部件
- **跨分片查询**：昂贵的扇出操作
- **重新平衡**：难以重新分配数据
- **引用完整性**：难以跨分片维护
- **运营开销**：监控、备份和维护成倍增加

## 参考资料

- [数据分区指南](https://learn.microsoft.com/en-us/azure/architecture/best-practices/data-partitioning)
- [分片模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)
