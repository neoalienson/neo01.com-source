---
title: "バルクヘッドパターン：分散システムにおける障害の隔離"
date: 2020-03-15
categories: Architecture
tags:
  - Architecture
  - Design Patterns
  - Resilience
series: architecture_pattern
excerpt: "バルクヘッドパターンがリソースを隔離し、分散システムでコンポーネントが障害を起こした際の影響範囲を制限することで、連鎖的な障害を防ぐ方法を解説します。"
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
lang: ja
comments: true
---

船が防水隔壁によって水密区画に分割されている様子を想像してください。船体に穴が開いても、一つの区画だけが浸水し、他の区画は乾いたままで、船は浮いたままです。この海事安全の原則が、回復力のある分散システムを構築するための重要なパターンであるバルクヘッドパターンにインスピレーションを与えました。

## 問題：連鎖的な障害

分散システムでは、コンポーネントがスレッドプール、データベース接続、メモリ、ネットワーク帯域幅などのリソースを共有します。一つのコンポーネントが障害を起こしたり遅くなったりすると、利用可能なすべてのリソースを消費し、システム全体をダウンさせるドミノ効果を引き起こす可能性があります。

次のようなシナリオを考えてみましょう：

- **スレッドプールの枯渇**：遅い外部APIがすべてのスレッドを消費し、他の操作をブロックする
- **接続プールの枯渇**：一つのデータベースクエリがすべての接続をロックし、他のサービスがデータベースにアクセスできなくなる
- **メモリの飽和**：一つのコンポーネントのメモリリークがアプリケーション全体をクラッシュさせる
- **ネットワーク帯域幅**：大きなファイル転送が他のネットワーク操作を枯渇させる

!!!warning "⚠️ 実世界への影響"
    利用可能なすべてのスレッドを消費する単一の遅いマイクロサービスが、完全なシステム停止に連鎖し、数千人のユーザーと複数のビジネス機能に同時に影響を与える可能性があります。

## 解決策：リソースの隔離

バルクヘッドパターンは、リソースを隔離されたプールに分割することでこの問題を解決します。各コンポーネントまたはサービスは専用のリソースを取得し、障害がシステム全体に広がるのを防ぎます。

主要な原則：

1. **リソースを分割**して隔離されたプール（スレッドプール、接続プールなど）にする
2. **リソースを割り当て**る際は、重要度と予想される負荷に基づく
3. **障害を封じ込め**て、指定されたパーティション内に留める
4. **サービスを維持**する、影響を受けていないコンポーネントのために

{% mermaid %}block-beta
columns 1
  block:WITHOUT["バルクヘッドなし"]:3
    A1["サービスA"]
    B1["サービスB"]
    C1["サービスC"]
    SP["共有プール<br/>100スレッド"]
    X1["完全停止"]
  end
  space
  block:WITH["バルクヘッドあり"]:3
    A2["サービスA"]
    B2["サービスB"]
    C2["サービスC"]
    PA["プールA<br/>40スレッド"]
    PB["プールB<br/>30スレッド"]
    PC["プールC<br/>30スレッド"]
    X2["サービスBダウン"]
    OK1["サービスA正常"]
    OK2["サービスC正常"]
  end
  
  A1 --> SP
  B1 --> SP
  C1 --> SP
  SP -.->|"障害が拡散"| X1
  
  A2 --> PA
  B2 --> PB
  C2 --> PC
  PB -.->|"障害を封じ込め"| X2
  PA --> OK1
  PC --> OK2
{% endmermaid %}

## 仕組み：リソースの隔離

異なるリソースタイプのバルクヘッドを実装する方法を見ていきましょう：

### スレッドプールの隔離

分離されたスレッドプールは、一つの遅い操作が他の操作をブロックするのを防ぎます：

```javascript
// バルクヘッドなし - 共有スレッドプール
const sharedExecutor = new ThreadPoolExecutor(100);

app.get('/api/orders', async (req, res) => {
  await sharedExecutor.execute(() => fetchOrders());
});

app.get('/api/inventory', async (req, res) => {
  await sharedExecutor.execute(() => fetchInventory());
});

// 問題：遅いfetchOrders()がfetchInventory()をブロックする
```

```javascript
// バルクヘッドあり - 隔離されたスレッドプール
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

// メリット：遅い注文処理が在庫や支払いに影響しない
```

### 接続プールの隔離

異なるサービス用に分離されたデータベース接続プール：

```javascript
// 隔離された接続プールを設定
const orderDbPool = createPool({
  host: 'db.neo01.com',
  database: 'orders',
  max: 20,  // 最大20接続
  min: 5
});

const analyticsDbPool = createPool({
  host: 'db.neo01.com',
  database: 'analytics',
  max: 10,  // 分析用の別プール
  min: 2
});

// 重い分析クエリが注文処理を枯渇させない
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
    return await conn.query('SELECT /* 複雑な分析クエリ */');
  } finally {
    conn.release();
  }
}
```

### サーキットブレーカーとの統合

バルクヘッドとサーキットブレーカーを組み合わせて、回復力を強化：

```javascript
const CircuitBreaker = require('opossum');

// 各サービス用に隔離されたサーキットブレーカーを作成
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

// 各サービスは独自の障害処理を持つ
async function processOrder(order) {
  try {
    const orderResult = await orderServiceBreaker.fire(order);
    const inventoryResult = await inventoryServiceBreaker.fire(order.items);
    return { orderResult, inventoryResult };
  } catch (error) {
    // 障害を適切に処理
    return { error: error.message };
  }
}
```

## 実装戦略

### 1. サービスベースのパーティショニング

サービス境界に基づいてリソースを割り当てる：

```javascript
class BulkheadManager {
  constructor() {
    this.pools = {
      critical: new ThreadPool(50),    // 重要な操作
      standard: new ThreadPool(30),    // 標準的な操作
      background: new ThreadPool(20)   // バックグラウンドタスク
    };
  }
  
  async execute(priority, task) {
    const pool = this.pools[priority] || this.pools.standard;
    return pool.execute(task);
  }
}

const bulkhead = new BulkheadManager();

// ユーザー向けの重要な操作
app.post('/api/checkout', async (req, res) => {
  const result = await bulkhead.execute('critical', () => 
    processCheckout(req.body)
  );
  res.json(result);
});

// バックグラウンド操作
app.post('/api/analytics', async (req, res) => {
  await bulkhead.execute('background', () => 
    logAnalytics(req.body)
  );
  res.status(202).send();
});
```

### 2. テナントベースのパーティショニング

マルチテナントシステムでテナントごとにリソースを隔離：

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

// テナントAの高負荷がテナントBに影響しない
const tenantBulkhead = new TenantBulkhead();

app.get('/api/data', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  const result = await tenantBulkhead.execute(tenantId, () =>
    fetchTenantData(tenantId)
  );
  res.json(result);
});
```

### 3. 負荷ベースのパーティショニング

高負荷操作と低負荷操作を分離：

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

// 高スループットエンドポイント
app.get('/api/search', rateLimiter(bulkheadConfig.highThroughput), 
  async (req, res) => {
    // 検索リクエストを処理
  }
);

// 低スループットだがリソース集約的
app.post('/api/reports', rateLimiter(bulkheadConfig.lowThroughput),
  async (req, res) => {
    // 複雑なレポートを生成
  }
);
```

## バルクヘッドパターンを使用するタイミング

### 主な使用ケース

!!!success "✅ 理想的なシナリオ"
    **共有リソースの競合**：複数のサービスがスレッド、接続、メモリなどの限られたリソースを競合する場合。
    
    **重要なサービスの保護**：他のコンポーネントの障害に関係なく、優先度の高いサービスの可用性を保証する必要がある場合。
    
    **マルチテナントシステム**：テナントを隔離することで、一つのテナントの負荷が他のテナントに影響するのを防ぐ場合。

### 二次的な使用ケース

!!!info "📋 追加のメリット"
    **パフォーマンスの隔離**：遅い操作を速い操作から分離して、システム全体の応答性を維持する。
    
    **障害の封じ込め**：障害の影響範囲を特定のパーティションに制限する。
    
    **リソースの最適化**：実際の使用パターンと優先度に基づいてリソースを割り当てる。

{% mermaid %}graph TD
    A["リソース分析"] --> B{"共有リソース？"}
    B -->|"はい"| C{"重要なサービス？"}
    B -->|"いいえ"| D["使用状況を監視"]
    C -->|"はい"| E["バルクヘッドを使用"]
    C -->|"いいえ"| F{"マルチテナント？"}
    F -->|"はい"| E
    F -->|"いいえ"| G{"パフォーマンス問題？"}
    G -->|"はい"| E
    G -->|"いいえ"| D
    
    style E fill:#51cf66,stroke:#2f9e44
    style D fill:#4dabf7,stroke:#1971c2
{% endmermaid %}

## アーキテクチャ品質属性

バルクヘッドパターンはシステム品質に大きな影響を与えます：

### 回復力

バルクヘッドは次のように回復力を強化します：
- **障害の隔離**：特定のパーティション内に障害を封じ込める
- **段階的な劣化**：障害時に部分的な機能を維持する
- **影響範囲の制限**：システム全体への連鎖的な障害を防ぐ

### 可用性

可用性の向上には次のものが含まれます：
- **サービスの継続性**：他の障害にもかかわらず重要なサービスが利用可能なままである
- **ダウンタイムの削減**：隔離された障害が完全な停止を引き起こさない
- **より速い回復**：より小さな障害ドメインがより迅速に回復する

### パフォーマンス

パフォーマンスのメリットは次から生じます：
- **リソースの最適化**：専用リソースが競合を防ぐ
- **予測可能なレイテンシ**：隔離により遅い操作が速い操作に影響しない
- **より良いスループット**：干渉なしの並列処理

### スケーラビリティ

スケーラビリティの利点には次のものが含まれます：
- **独立したスケーリング**：需要に基づいて特定のパーティションのリソースをスケールする
- **負荷分散**：隔離されたリソースプール全体に負荷を分散する
- **容量計画**：隔離されたコンポーネントの容量計画が容易になる

## トレードオフと考慮事項

他のパターンと同様に、バルクヘッドにはトレードオフがあります：

!!!warning "⚠️ 潜在的な欠点"
    **リソースのオーバーヘッド**：複数のプールを維持すると、より多くの総リソースを消費する
    
    **複雑性**：追加の設定と管理のオーバーヘッド
    
    **リソースの無駄**：使用率の低いプールは無駄な容量を表す
    
    **チューニングの課題**：最適なパーティションサイズを決定するには慎重な分析が必要

### バルクヘッドのサイジング

各パーティションの適切なサイズを決定することは重要です：

```javascript
// サイジング時にこれらの要因を考慮
const bulkheadSize = {
  // 予想される同時リクエスト
  expectedLoad: 100,
  
  // 平均応答時間（ミリ秒）
  avgResponseTime: 200,
  
  // 安全マージン（20%）
  safetyMargin: 1.2,
  
  // プールサイズを計算
  calculate() {
    // リトルの法則：L = λ × W
    // L = 同時リクエスト
    // λ = 到着率（リクエスト/秒）
    // W = システム内の平均時間（秒）
    const arrivalRate = this.expectedLoad / 1;
    const timeInSystem = this.avgResponseTime / 1000;
    return Math.ceil(arrivalRate * timeInSystem * this.safetyMargin);
  }
};

console.log(`推奨プールサイズ: ${bulkheadSize.calculate()}`);
```

## 監視と可観測性

効果的なバルクヘッド実装には監視が必要です：

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
      throw new Error(`バルクヘッド ${this.name} が容量に達しました`);
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
      
      // メトリクスを送信
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

監視すべき主要なメトリクス：

- **使用率**：使用中のプール容量の割合
- **拒否率**：容量不足によりリクエストが拒否される頻度
- **キューの深さ**：待機中のリクエスト数
- **応答時間**：各パーティション内のレイテンシ
- **エラー率**：各バルクヘッド内の障害

## 実世界の実装パターン

### パターン1：マイクロサービスアーキテクチャ

各マイクロサービスは隔離されたリソースを持つ：

```javascript
// サービスA - 注文サービス
const orderService = {
  threadPool: new ThreadPool(50),
  dbPool: createPool({ max: 20 }),
  cachePool: createPool({ max: 10 })
};

// サービスB - 在庫サービス
const inventoryService = {
  threadPool: new ThreadPool(30),
  dbPool: createPool({ max: 15 }),
  cachePool: createPool({ max: 5 })
};

// サービス間の完全な隔離
```

### パターン2：バルクヘッド付きAPIゲートウェイ

APIゲートウェイがバックエンドサービス用のバルクヘッドを実装：

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
    res.status(503).json({ error: 'サービス利用不可' });
  }
});
```

## まとめ

バルクヘッドパターンは、回復力のある分散システムを構築するために不可欠です。リソースを隔離し障害を封じ込めることで、システムは次のことが可能になります：

- 連鎖的な障害を防ぐ
- 停止時に部分的な機能を維持する
- 重要なサービスを保護する
- リソース使用率を最適化する

追加の複雑性とリソースのオーバーヘッドを導入しますが、回復力と可用性の向上というメリットにより、本番システムにとって非常に価値があります。共有リソースが競合を引き起こす場合、または重要なサービスの可用性を保証する必要がある場合に、バルクヘッドを実装してください。

## 関連パターン

- **サーキットブレーカー**：障害しているサービスへの呼び出しを防ぐことでバルクヘッドを補完する
- **リトライパターン**：一時的な障害を処理するためにバルクヘッドと連携する
- **スロットリング**：リソース枯渇を防ぐためにリクエスト率を制御する
- **キューベースの負荷平準化**：バルクヘッドを圧倒する可能性のある負荷スパイクを平滑化する

## 参考文献

- [Microsoft Azure Architecture Patterns: Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead)
- [Release It! Design and Deploy Production-Ready Software](https://pragprog.com/titles/mnee2/release-it-second-edition/)
- [Netflix Hystrix: Bulkhead Pattern](https://github.com/Netflix/Hystrix/wiki/How-it-Works#bulkheads)
