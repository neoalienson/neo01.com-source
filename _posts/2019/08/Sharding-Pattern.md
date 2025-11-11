---
title: "The Sharding Pattern: Scaling Data Stores Horizontally"
date: 2019-08-17
categories:
  - Architecture
series: architecture_pattern
excerpt: "Divide your data store into horizontal partitions to improve scalability and performance. Learn how sharding distributes data across multiple servers to handle massive volumes."
lang: en
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

Imagine a library that has grown so large that a single building can no longer hold all the books. Instead of building one impossibly large structure, you create multiple library branches—each holding books organized by a specific category or range. Patrons know which branch to visit based on what they're looking for. This is the essence of sharding: dividing data across multiple stores to overcome the limitations of a single server.

## The Library Analogy

Just as a library system with multiple branches:
- Distributes books across locations
- Allows parallel access by many patrons
- Reduces crowding at any single location
- Enables geographic proximity to users

A sharded data store:
- Distributes data across multiple servers
- Allows parallel queries and writes
- Reduces contention on any single database
- Enables data locality for better performance

{% mermaid %}
graph TB
    A[Application] --> B[Sharding Logic]
    B --> C[Shard 1<br/>Users A-H]
    B --> D[Shard 2<br/>Users I-P]
    B --> E[Shard 3<br/>Users Q-Z]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## The Problem: Single Server Limitations

A data store hosted on a single server faces inevitable constraints:

### Storage Space Limitations

```javascript
// As data grows, a single server runs out of space
class UserDatabase {
  constructor() {
    this.storage = new DiskStorage('/data');
    // What happens when we reach 10TB? 100TB? 1PB?
  }
  
  async addUser(user) {
    try {
      await this.storage.write(user.id, user);
    } catch (error) {
      if (error.code === 'ENOSPC') {
        // Disk full - now what?
        throw new Error('Storage capacity exceeded');
      }
    }
  }
}
```

### Computing Resource Constraints

```javascript
// Single server handling millions of concurrent users
class OrderDatabase {
  async processQuery(query) {
    // CPU maxed out processing queries
    // Memory exhausted caching results
    // Queries start timing out
    const result = await this.executeQuery(query);
    return result;
  }
}
```

### Network Bandwidth Bottlenecks

```javascript
// All traffic flows through one network interface
class DataStore {
  async handleRequest(request) {
    // Network interface saturated at 10Gbps
    // Requests start getting dropped
    // Response times increase dramatically
    return await this.processRequest(request);
  }
}
```

### Geographic Distribution Challenges

```javascript
// Users worldwide accessing a single data center
class GlobalApplication {
  async getUserData(userId) {
    // User in Tokyo accessing data in Virginia
    // 200ms latency just for network round trip
    // Compliance issues storing EU data in US
    return await this.database.query({ userId });
  }
}
```

!!!warning "⚠️ Vertical Scaling Limitations"
    **Temporary Solution**: Adding more CPU, memory, or disk to a single server
    
    **Physical Limits**: Eventually you can't add more resources
    
    **Cost Inefficiency**: High-end servers become exponentially expensive
    
    **Single Point of Failure**: One server failure affects all users

## The Solution: Horizontal Partitioning (Sharding)

Divide the data store into horizontal partitions called shards. Each shard:
- Has the same schema
- Contains a distinct subset of data
- Runs on a separate storage node
- Operates independently

{% mermaid %}
graph TB
    A[Application Layer] --> B[Shard Map/Router]
    B --> C[Shard A<br/>Orders 0-999]
    B --> D[Shard B<br/>Orders 1000-1999]
    B --> E[Shard C<br/>Orders 2000-2999]
    B --> F[Shard D<br/>Orders 3000+]
    
    C --> C1[(Database<br/>Server 1)]
    D --> D1[(Database<br/>Server 2)]
    E --> E1[(Database<br/>Server 3)]
    F --> F1[(Database<br/>Server 4)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
    style F fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## Sharding Strategies

### 1. Lookup Strategy

Use a mapping table to route requests to the appropriate shard:

```javascript
class LookupShardRouter {
  constructor() {
    // Shard map stored in fast cache or database
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
    A[Request:<br/>Tenant-3] --> B[Lookup<br/>Shard Map]
    B --> C{Tenant-3<br/>→ Shard B}
    C --> D[(Shard B<br/>Database)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style D fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 Lookup Strategy Benefits"
    **Flexibility**: Easy to rebalance by updating the map
    
    **Virtual Shards**: Map logical shards to fewer physical servers
    
    **Control**: Assign high-value tenants to dedicated shards

### 2. Range Strategy

Group related items together based on sequential shard keys:

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
    // Efficient: Query only relevant shards
    const relevantShards = this.shardRanges
      .filter(r => r.max >= startDate && r.min <= endDate)
      .map(r => r.shard);
    
    // Parallel queries to multiple shards
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
    A[Query:<br/>Orders in Q2 2019] --> B[Range Router]
    B --> C[Shard Q2<br/>Apr-Jun 2019]
    
    D[Query:<br/>Orders Apr-Jul 2019] --> B
    B --> C
    B --> E[Shard Q3<br/>Jul-Sep 2019]
    
    style A fill:#4dabf7,stroke:#1971c2
    style D fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 Range Strategy Benefits"
    **Range Queries**: Efficiently retrieve sequential data
    
    **Natural Ordering**: Data stored in logical order
    
    **Time-Based Archival**: Easy to archive old shards

!!!warning "⚠️ Range Strategy Risks"
    **Hotspots**: Recent data often accessed more frequently
    
    **Uneven Distribution**: Some ranges may grow larger than others

### 3. Hash Strategy

Distribute data evenly using a hash function:

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
    // Simple hash function (use better hash in production)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
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

// Example distribution
const router = new HashShardRouter();
console.log(router.getShardForUser('user-123')); // db-shard-2
console.log(router.getShardForUser('user-124')); // db-shard-0
console.log(router.getShardForUser('user-125')); // db-shard-3
// Users distributed across shards
```

{% mermaid %}
graph TB
    A[User IDs] --> B[Hash Function]
    B --> C[user-55 → Hash: 2]
    B --> D[user-56 → Hash: 0]
    B --> E[user-57 → Hash: 1]
    
    C --> F[(Shard 2)]
    D --> G[(Shard 0)]
    E --> H[(Shard 1)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style F fill:#51cf66,stroke:#2f9e44
    style G fill:#51cf66,stroke:#2f9e44
    style H fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

!!!tip "💡 Hash Strategy Benefits"
    **Even Distribution**: Prevents hotspots
    
    **No Lookup Table**: Direct computation of shard location
    
    **Scalable**: Works well with many shards

!!!warning "⚠️ Hash Strategy Challenges"
    **Range Queries**: Difficult to query ranges efficiently
    
    **Rebalancing**: Adding shards requires rehashing data

## Strategy Comparison

{% echarts %}
{
  "title": {
    "text": "Sharding Strategy Trade-offs"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["Lookup", "Range", "Hash"]
  },
  "radar": {
    "indicator": [
      { "name": "Flexibility", "max": 10 },
      { "name": "Even Distribution", "max": 10 },
      { "name": "Range Query Performance", "max": 10 },
      { "name": "Simplicity", "max": 10 },
      { "name": "Rebalancing Ease", "max": 10 }
    ]
  },
  "series": [{
    "type": "radar",
    "data": [
      {
        "value": [9, 6, 5, 6, 9],
        "name": "Lookup"
      },
      {
        "value": [5, 4, 10, 8, 3],
        "name": "Range"
      },
      {
        "value": [6, 10, 3, 9, 4],
        "name": "Hash"
      }
    ]
  }]
}
{% endecharts %}

## Practical Implementation Example

Here's a complete sharding implementation for an e-commerce platform:

```javascript
class ShardedOrderDatabase {
  constructor() {
    // Use hash strategy for even distribution
    this.shards = [
      { id: 0, connection: 'orders-db-0.neo01.com' },
      { id: 1, connection: 'orders-db-1.neo01.com' },
      { id: 2, connection: 'orders-db-2.neo01.com' },
      { id: 3, connection: 'orders-db-3.neo01.com' }
    ];
  }
  
  getShardForOrder(orderId) {
    // Extract numeric part from order ID
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
    // User orders spread across shards - need fan-out query
    const results = await Promise.all(
      this.shards.map(async (shard) => {
        const connection = await this.connectToShard(shard);
        return await connection.query(
          'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
          [userId]
        );
      })
    );
    
    // Merge and sort results from all shards
    return results
      .flat()
      .sort((a, b) => b.created_at - a.created_at);
  }
  
  async connectToShard(shard) {
    // Connection pooling per shard
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

## Key Considerations

### 1. Choosing the Shard Key

The shard key determines data distribution and query performance:

```javascript
// Good: Static, evenly distributed
const shardKey = user.id; // UUID, never changes

// Bad: Can change over time
const shardKey = user.email; // User might change email

// Bad: Uneven distribution
const shardKey = user.country; // Some countries have many more users
```

!!!anote "📝 Shard Key Best Practices"
    **Immutable**: Choose keys that never change
    
    **High Cardinality**: Many unique values for even distribution
    
    **Query Aligned**: Support your most common query patterns
    
    **Avoid Hotspots**: Prevent sequential keys if using hash strategy

### 2. Cross-Shard Queries

Minimize queries that span multiple shards:

```javascript
class OptimizedShardedDatabase {
  // Good: Single shard query
  async getOrderById(orderId) {
    const shard = this.getShardForOrder(orderId);
    return await this.queryShardById(shard, orderId);
  }
  
  // Acceptable: Fan-out with caching
  async getUserOrderCount(userId) {
    // Cache the result to avoid repeated fan-out queries
    const cached = await this.cache.get(`order_count:${userId}`);
    if (cached) return cached;
    
    const counts = await Promise.all(
      this.shards.map(shard => this.countUserOrders(shard, userId))
    );
    
    const total = counts.reduce((sum, count) => sum + count, 0);
    await this.cache.set(`order_count:${userId}`, total, 300); // 5 min TTL
    return total;
  }
  
  // Better: Denormalize to avoid cross-shard queries
  async getUserOrderCountOptimized(userId) {
    // Store count in user shard
    const userShard = this.getShardForUser(userId);
    return await this.queryUserOrderCount(userShard, userId);
  }
}
```

### 3. Rebalancing Shards

Plan for growth and rebalancing:

```javascript
class RebalancingShardManager {
  async addNewShard(newShardConnection) {
    // 1. Add new shard to configuration
    this.shards.push({
      id: this.shards.length,
      connection: newShardConnection
    });
    
    // 2. Gradually migrate data
    await this.migrateDataToNewShard();
    
    // 3. Update shard map
    await this.updateShardMap();
  }
  
  async migrateDataToNewShard() {
    // Use virtual shards for easier rebalancing
    const virtualShards = 1000; // Many virtual shards
    const physicalShards = this.shards.length;
    
    // Remap virtual shards to physical shards
    for (let i = 0; i < virtualShards; i++) {
      const newPhysicalShard = i % physicalShards;
      await this.remapVirtualShard(i, newPhysicalShard);
    }
  }
}
```

### 4. Handling Failures

Implement resilience strategies:

```javascript
class ResilientShardedDatabase {
  async queryWithRetry(shard, query, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.queryShard(shard, query);
      } catch (error) {
        if (attempt === maxRetries) {
          // Try replica if available
          if (shard.replica) {
            return await this.queryShard(shard.replica, query);
          }
          throw error;
        }
        
        // Exponential backoff
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

## When to Use Sharding

!!!success "✅ Use Sharding When"
    **Massive Scale**: Data volume exceeds single server capacity
    
    **High Throughput**: Need to handle millions of concurrent operations
    
    **Geographic Distribution**: Users spread across multiple regions
    
    **Cost Optimization**: Multiple commodity servers cheaper than one high-end server

!!!warning "⚠️ Avoid Sharding When"
    **Small Scale**: Data fits comfortably on one server
    
    **Complex Joins**: Application relies heavily on cross-table joins
    
    **Limited Resources**: Team lacks expertise to manage distributed systems
    
    **Premature Optimization**: Vertical scaling still viable

## Benefits Summary

- **Scalability**: Add more shards as data grows
- **Performance**: Parallel processing across shards
- **Cost Efficiency**: Use commodity hardware instead of expensive servers
- **Geographic Proximity**: Place data close to users
- **Fault Isolation**: Failure in one shard doesn't affect others

## Challenges Summary

- **Complexity**: More moving parts to manage
- **Cross-Shard Queries**: Expensive fan-out operations
- **Rebalancing**: Difficult to redistribute data
- **Referential Integrity**: Hard to maintain across shards
- **Operational Overhead**: Monitoring, backup, and maintenance multiply

## References

- [Data Partitioning Guidance](https://learn.microsoft.com/en-us/azure/architecture/best-practices/data-partitioning)
- [Sharding Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)
