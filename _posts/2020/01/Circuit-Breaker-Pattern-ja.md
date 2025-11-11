---
title: "Circuit Breakerパターン：カスケード障害の防止"
date: 2020-01-20
categories:
  - Architecture
series: architecture_pattern
excerpt: "Circuit Breakerパターンが、障害が発生しているサービスへの呼び出しを一時的にブロックし、回復の時間を与えることで、分散システムをカスケード障害から保護する方法を学びます。"
lang: ja
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

家の電気回路を想像してください。ワイヤーに過剰な電流が流れると——おそらくショートサーキットや過負荷のコンセントから——サーキットブレーカーがトリップし、損傷や火災を防ぐために電力を遮断します。ブレーカーは危険な状況に電気を強制的に流し続けようとはしません。代わりに、高速で失敗し、システム全体を保護します。問題が修正された後、ブレーカーをリセットして電力を復元できます。

この同じ原則が分散システムに適用されます。リモートサービスが失敗すると、Circuit Breakerパターンは、アプリケーションが失敗する運命にある操作を繰り返し試みることを防ぎ、システムリソースを保護し、優雅な劣化を可能にします。

## 電気回路の比喩

電気サーキットブレーカーと同様に：
- 電流の流れを監視（リクエストの失敗）
- しきい値を超えるとトリップ（失敗が多すぎる）
- 開いている間はさらなる試みをブロック（カスケード障害を防ぐ）
- クールダウン後にテストを許可（半開状態）
- サービスが回復するとリセット（閉状態）

ソフトウェアサーキットブレーカー：
- サービス呼び出しの失敗を監視
- 失敗しきい値に達すると開く
- 開いている間はリクエストを即座に拒否
- タイムアウト後に限定的なテストリクエストを許可
- サービスが回復を示すと閉じる

{% mermaid %}
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: 失敗しきい値に達した
    Open --> HalfOpen: タイムアウトが期限切れ
    HalfOpen --> Closed: 成功しきい値に達した
    HalfOpen --> Open: 失敗が発生
    
    note right of Closed
        通常動作
        リクエストが通過
        失敗がカウントされる
    end note
    
    note right of Open
        高速失敗
        リクエストが拒否される
        タイマーが実行中
    end note
    
    note right of HalfOpen
        限定的なテスト
        試行リクエストが許可される
        回復を評価中
    end note
{% endmermaid %}

## 問題：分散システムにおけるカスケード障害

分散環境では、リモートサービス呼び出しはさまざまな理由で失敗する可能性があります：

### 一時的な障害

```javascript
// 自己解決する一時的な問題
class PaymentService {
  async processPayment(orderId, amount) {
    try {
      // ネットワークの一時的な問題 - リトライが成功する可能性
      return await this.paymentGateway.charge(amount);
    } catch (error) {
      if (error.code === 'NETWORK_TIMEOUT') {
        // 一時的 - リトライで機能する可能性
        return await this.retry(() => 
          this.paymentGateway.charge(amount)
        );
      }
    }
  }
}
```

### 永続的な障害

```javascript
// サービスが完全にダウン - リトライは役に立たない
class InventoryService {
  async checkStock(productId) {
    try {
      return await this.inventoryApi.getStock(productId);
    } catch (error) {
      if (error.code === 'SERVICE_UNAVAILABLE') {
        // サービスがクラッシュ - リトライはリソースを浪費
        // 各リトライがスレッド、メモリ、接続を保持
        // タイムアウト期間が他の操作をブロック
        throw new Error('Inventory service unavailable');
      }
    }
  }
}
```

!!!warning "⚠️ カスケード障害の問題"
    **初期障害**：1つのサービスが遅くなるか利用不可になる
    
    **リソースブロッキング**：呼び出し元がタイムアウトを待ち、スレッドと接続を保持
    
    **リソース枯渇**：システムがスレッド、メモリ、または接続を使い果たす
    
    **カスケード影響**：リソース不足により他の無関係な操作が失敗
    
    **システム全体の停止**：アプリケーション全体が応答しなくなる

## 解決策：Circuit Breakerパターン

Circuit Breakerは、障害を監視し、障害が発生しているサービスへの呼び出しを防ぐプロキシとして機能します：

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 60秒
    
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
      // タイムアウトが期限切れ、半開を試す
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
        console.log('Circuit breaker CLOSED - service recovered');
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log('Circuit breaker OPEN - service still failing');
    }
    
    if (this.state === 'CLOSED' && 
        this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log('Circuit breaker OPEN - threshold reached');
    }
  }
}
```

## Circuit Breakerの状態

### Closed状態：通常動作

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
      // 通常動作 - リクエストが通過
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
```

### Open状態：高速失敗

```javascript
class OrderService {
  constructor() {
    this.inventoryClient = new InventoryServiceClient();
    this.defaultStock = { available: false, quantity: 0 };
  }
  
  async processOrder(order) {
    try {
      // サーキットが開いている - 即座に失敗
      const stock = await this.inventoryClient.checkStock(order.productId);
      return this.completeOrder(order, stock);
    } catch (error) {
      if (error.message === 'Circuit breaker is OPEN') {
        // 優雅な劣化
        console.log('Inventory service unavailable, using default');
        return this.completeOrder(order, this.defaultStock);
      }
      throw error;
    }
  }
}
```

### Half-Open状態：回復のテスト

```javascript
class CircuitBreakerWithHalfOpen extends CircuitBreaker {
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      
      // 半開状態に入る
      this.state = 'HALF_OPEN';
      this.successCount = 0;
      console.log('Circuit breaker HALF-OPEN - testing service');
    }
    
    if (this.state === 'HALF_OPEN') {
      // 半開状態で同時リクエストを制限
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

## 実世界の例：eコマースプラットフォーム

```javascript
class RecommendationService {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 30000
    });
    
    this.cache = new Map();
  }
  
  async getRecommendations(userId) {
    const fallback = async () => {
      // キャッシュされたレコメンデーションを返す
      if (this.cache.has(userId)) {
        return {
          recommendations: this.cache.get(userId),
          source: 'cache'
        };
      }
      
      // フォールバックとして人気アイテムを返す
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
        
        // 成功時にキャッシュを更新
        this.cache.set(userId, data.recommendations);
        
        return {
          recommendations: data.recommendations,
          source: 'live'
        };
      },
      fallback
    );
  }
}
```

## 主な考慮事項

!!!anote "💡 例外処理"
    アプリケーションはサーキットブレーカーの例外を優雅に処理する必要があります：
    - フォールバックレスポンスを提供
    - ユーザーフレンドリーなメッセージを表示
    - 監視とアラートのためにログ記録

!!!warning "⚠️ 監視が重要"
    サーキットブレーカーのメトリクスを追跡：
    - 状態遷移（closed → open → half-open）
    - リクエストの成功/失敗率
    - 各状態で費やした時間
    - サーキットが頻繁に開くときにアラート

!!!tip "💡 フォールバック戦略"
    サーキットが開いているときに意味のあるフォールバックを提供：
    - キャッシュされたデータ
    - デフォルト値
    - 劣化した機能
    - ユーザー通知

## Circuit Breakerを使用するタイミング

このパターンを使用する場合：

✅ **カスケード障害の防止**：障害がサービス全体に広がるのを止める

✅ **共有リソースの保護**：障害が発生している依存関係からのリソース枯渇を防ぐ

✅ **優雅な劣化**：サービスが失敗したときに部分的な機能を維持

✅ **高速失敗**：既知の障害でタイムアウトを待つことを回避

このパターンを使用しない場合：

❌ **ローカルリソース**：インメモリ操作にはサーキットブレーカーは不要

❌ **ビジネスロジックの例外**：ビジネスルールではなく、インフラストラクチャ障害に使用

❌ **シンプルなリトライで十分**：迅速な回復を伴う一時的な障害

❌ **メッセージキュー**：デッドレターキューが障害をより適切に処理

## まとめ

Circuit Breakerパターンは、回復力のある分散システムを構築するために不可欠です：

- 障害が発生しているサービスへの呼び出しを停止することで**カスケード障害を防ぐ**
- 停止中に**システムリソースを枯渇から保護**
- フォールバックレスポンスで**優雅な劣化を可能にする**
- タイムアウトを待つ代わりに**高速失敗を提供**
- **サービスの健全性を監視**し、回復を自動的に検出

家を保護する電気サーキットブレーカーのように、このパターンは障害が発生している依存関係によって引き起こされる損傷から分散システムを保護します。障害を防ぐことではなく、優雅に失敗し、迅速に回復することです。

## 参考文献

- [Microsoft Azure Architecture Patterns - Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Martin Fowler - CircuitBreaker](https://martinfowler.com/bliki/CircuitBreaker.html)
