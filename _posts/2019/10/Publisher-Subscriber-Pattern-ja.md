---
title: "Publisher-Subscriberパターン：大規模な通信の分離"
date: 2019-10-16
categories:
  - Architecture
series: architecture_pattern
excerpt: "アプリケーションが送信者と受信者を結合せずに、複数のコンシューマーに非同期でイベントを通知できるようにします。pub/subメッセージングがスケーラビリティと信頼性を向上させる方法を学びます。"
lang: ja
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

新聞発行者を想像してください。彼らはニュースを一度印刷し、何千人もの購読者がそれを受け取りますが、発行者は彼らが誰であるか、どこに住んでいるかを知りません。発行者は各購読者が新聞を読むのを待ってから次の版を印刷することはありません。これがPublisher-Subscriberパターンの本質です——分散システムにおける通信を分離する強力なアプローチです。

## 新聞の比喩

新聞が機能するように：
- 発行者はコンテンツを一度作成
- 複数の購読者が同じコンテンツを受信
- 発行者は個々の購読者を知らない
- 配信は非同期で行われる
- 購読者は自由に来たり去ったりできる

ソフトウェアでは、pub/subパターンは：
- 送信者はメッセージを一度公開
- 複数のコンシューマーがメッセージを受信
- 送信者はコンシューマーの身元を知らない
- 通信は非同期
- コンシューマーは動的にサブスクライブ/アンサブスクライブできる

{% mermaid %}
graph TB
    P[パブリッシャー] --> IC[入力チャネル]
    IC --> MB{メッセージブローカー}
    MB --> OC1[出力チャネル1]
    MB --> OC2[出力チャネル2]
    MB --> OC3[出力チャネル3]
    OC1 --> S1[サブスクライバー1]
    OC2 --> S2[サブスクライバー2]
    OC3 --> S3[サブスクライバー3]
    
    style P fill:#4dabf7,stroke:#1971c2
    style MB fill:#ffd43b,stroke:#fab005
    style S1 fill:#51cf66,stroke:#2f9e44
    style S2 fill:#51cf66,stroke:#2f9e44
    style S3 fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 問題：イベント配信における密結合

分散アプリケーションでは、イベントが発生したときにコンポーネントが他のコンポーネントに通知する必要があることがよくあります。従来のアプローチは密結合とスケーラビリティの問題を生み出します。

### 従来のアプローチ：直接通信

```javascript
class OrderService {
  async createOrder(orderData) {
    const order = await this.saveOrder(orderData);
    
    // 各依存サービスを直接呼び出し
    await this.inventoryService.reserveItems(order.items);
    await this.paymentService.processPayment(order.payment);
    await this.shippingService.scheduleDelivery(order.address);
    await this.notificationService.sendConfirmation(order.email);
    await this.analyticsService.trackOrder(order.id);
    
    return order;
  }
}
```

!!!warning "⚠️ 直接通信の問題"
    **密結合**：OrderServiceはすべての依存サービスを知っている必要がある
    
    **ブロッキング**：送信者は各サービスの応答を待つ
    
    **脆弱性**：いずれかのサービスがダウンすると、注文作成が失敗
    
    **スケーラビリティ**：新しいコンシューマーを追加するには送信者の変更が必要
    
    **パフォーマンス**：順次呼び出しが応答時間を増加

### 専用キューアプローチ

```javascript
class OrderService {
  async createOrder(orderData) {
    const order = await this.saveOrder(orderData);
    
    // 個別のキューに送信
    await this.inventoryQueue.send(order);
    await this.paymentQueue.send(order);
    await this.shippingQueue.send(order);
    await this.notificationQueue.send(order);
    await this.analyticsQueue.send(order);
    
    return order;
  }
}
```

!!!warning "⚠️ 専用キューの問題"
    **キューの増殖**：コンシューマーごとに1つのキューはスケールしない
    
    **依然として結合**：送信者はすべてのキュー名を知っている必要がある
    
    **メンテナンス負担**：コンシューマーを追加するにはコード変更が必要
    
    **重複メッセージ**：同じメッセージが複数回送信される

## 解決策：Publisher-Subscriberパターン

パブリッシャーとサブスクライバーを分離するメッセージングサブシステムを導入：

```javascript
class OrderService {
  constructor(messageBroker) {
    this.broker = messageBroker;
  }
  
  async createOrder(orderData) {
    const order = await this.saveOrder(orderData);
    
    // 一度公開 - ブローカーが配信を処理
    await this.broker.publish('orders', {
      type: 'OrderCreated',
      data: order,
      timestamp: new Date().toISOString()
    });
    
    return order;
  }
}
```

サブスクライバーは独立して関心を登録：

```javascript
// 在庫サービス
class InventoryService {
  constructor(messageBroker) {
    this.broker = messageBroker;
  }
  
  async start() {
    await this.broker.subscribe('orders', async (message) => {
      if (message.type === 'OrderCreated') {
        await this.reserveItems(message.data.items);
      }
    });
  }
}

// 支払いサービス
class PaymentService {
  async start() {
    await this.broker.subscribe('orders', async (message) => {
      if (message.type === 'OrderCreated') {
        await this.processPayment(message.data.payment);
      }
    });
  }
}

// 分析サービス（OrderServiceを変更せずに後で追加）
class AnalyticsService {
  async start() {
    await this.broker.subscribe('orders', async (message) => {
      if (message.type === 'OrderCreated') {
        await this.trackOrder(message.data.id);
      }
    });
  }
}
```

## 主要コンポーネント

### 1. パブリッシャー

メッセージを送信するコンポーネント：

```javascript
class Publisher {
  constructor(broker) {
    this.broker = broker;
  }
  
  async publishEvent(topic, eventType, data) {
    const message = {
      id: this.generateMessageId(),
      type: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      source: 'order-service'
    };
    
    await this.broker.publish(topic, message);
    console.log(`Published ${eventType} to ${topic}`);
  }
}
```

### 2. メッセージブローカー

メッセージをルーティングする仲介者：

```javascript
class MessageBroker {
  constructor() {
    this.topics = new Map();
  }
  
  async publish(topic, message) {
    const subscribers = this.topics.get(topic) || [];
    
    // すべてのサブスクライバーにメッセージをコピー
    const deliveryPromises = subscribers.map(subscriber =>
      this.deliverMessage(subscriber, message)
    );
    
    await Promise.all(deliveryPromises);
  }
  
  async subscribe(topic, handler) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
    
    this.topics.get(topic).push({
      id: this.generateSubscriberId(),
      handler: handler
    });
  }
  
  async deliverMessage(subscriber, message) {
    try {
      await subscriber.handler(message);
    } catch (error) {
      console.error(`Delivery failed to ${subscriber.id}:`, error);
      // リトライロジック、デッドレターキューなどを処理
    }
  }
}
```

### 3. サブスクライバー

メッセージを受信するコンポーネント：

```javascript
class Subscriber {
  constructor(broker, subscriptionConfig) {
    this.broker = broker;
    this.config = subscriptionConfig;
  }
  
  async start() {
    await this.broker.subscribe(
      this.config.topic,
      this.handleMessage.bind(this)
    );
  }
  
  async handleMessage(message) {
    // タイプでメッセージをフィルタリング
    if (this.config.messageTypes.includes(message.type)) {
      await this.processMessage(message);
    }
  }
  
  async processMessage(message) {
    // ビジネスロジックを実装
  }
}
```

## 主な利点

### 1. 分離

パブリッシャーとサブスクライバーは独立して動作：

{% mermaid %}
graph LR
    P1[注文サービス] --> MB{メッセージブローカー}
    P2[ユーザーサービス] --> MB
    P3[支払いサービス] --> MB
    MB --> S1[メールサービス]
    MB --> S2[分析]
    MB --> S3[監査ログ]
    MB --> S4[レポート]
    
    style MB fill:#ffd43b,stroke:#fab005
    style P1 fill:#4dabf7,stroke:#1971c2
    style P2 fill:#4dabf7,stroke:#1971c2
    style P3 fill:#4dabf7,stroke:#1971c2
    style S1 fill:#51cf66,stroke:#2f9e44
    style S2 fill:#51cf66,stroke:#2f9e44
    style S3 fill:#51cf66,stroke:#2f9e44
    style S4 fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

```javascript
// パブリッシャーはサブスクライバーを知らない
class OrderService {
  async createOrder(order) {
    await this.saveOrder(order);
    await this.broker.publish('orders', { type: 'OrderCreated', data: order });
    // 完了！誰が聞いているかの知識なし
  }
}

// パブリッシャーを変更せずに新しいサブスクライバーを追加
class FraudDetectionService {
  async start() {
    // 既存のトピックにサブスクライブ
    await this.broker.subscribe('orders', async (message) => {
      if (message.type === 'OrderCreated') {
        await this.checkForFraud(message.data);
      }
    });
  }
}
```

### 2. スケーラビリティ

サブスクライバーを独立してスケーリングして負荷増加を処理：

```javascript
// 負荷に基づいて特定のサブスクライバーをスケールアウト
class MessageBroker {
  async subscribe(topic, handler, options = {}) {
    const subscription = {
      id: this.generateSubscriberId(),
      handler: handler,
      concurrency: options.concurrency || 1
    };
    
    // 複数のインスタンスが同じトピックにサブスクライブ可能
    this.topics.get(topic).push(subscription);
  }
}

// 遅いサービスの複数インスタンスをデプロイ
for (let i = 0; i < 5; i++) {
  const emailService = new EmailService(broker);
  await emailService.start(); // メールを処理する5つのインスタンス
}
```

### 3. 信頼性

コンポーネントが失敗してもシステムは動作を継続：

```javascript
class ResilientSubscriber {
  async handleMessage(message) {
    try {
      await this.processMessage(message);
      await this.acknowledgeMessage(message.id);
    } catch (error) {
      console.error('Processing failed:', error);
      
      // メッセージはリトライのためにキューに残る
      if (message.retryCount < 3) {
        await this.requeueMessage(message);
      } else {
        // 調査のためにデッドレターキューに移動
        await this.moveToDeadLetter(message);
      }
    }
  }
}
```

### 4. 非同期処理

パブリッシャーは待機せずに即座に戻る：

```javascript
class OrderService {
  async createOrder(orderData) {
    const order = await this.saveOrder(orderData);
    
    // 公開して即座に戻る
    await this.broker.publish('orders', {
      type: 'OrderCreated',
      data: order
    });
    
    // 処理を待たずにユーザーに戻る
    return { orderId: order.id, status: 'processing' };
  }
}

// サブスクライバーは自分のペースで処理
class SlowEmailService {
  async handleMessage(message) {
    // メール送信に数分かかる可能性
    await this.sendEmail(message.data.email);
    // パブリッシャーはすでにユーザーに戻っている
  }
}
```

## 高度なパターン

### トピックベースのルーティング

トピックごとにメッセージを整理：

```javascript
class TopicBasedBroker {
  // パブリッシャーは特定のトピックに送信
  async publishToTopic(topic, message) {
    await this.broker.publish(topic, message);
  }
}

// サブスクライバーはトピックを選択
await broker.subscribe('orders.created', handleOrderCreated);
await broker.subscribe('orders.cancelled', handleOrderCancelled);
await broker.subscribe('payments.processed', handlePaymentProcessed);
```

### コンテンツベースのフィルタリング

サブスクライバーはメッセージコンテンツでフィルタリング：

```javascript
class FilteringSubscriber {
  async start() {
    await this.broker.subscribe('orders', async (message) => {
      // 高額注文のみを処理
      if (message.data.total > 1000) {
        await this.processHighValueOrder(message.data);
      }
    });
  }
}

// 異なるフィルターを持つ別のサブスクライバー
class RegionalSubscriber {
  async start() {
    await this.broker.subscribe('orders', async (message) => {
      // 特定地域からの注文のみを処理
      if (message.data.region === 'US-WEST') {
        await this.processRegionalOrder(message.data);
      }
    });
  }
}
```

### ワイルドカードサブスクリプション

複数の関連トピックにサブスクライブ：

```javascript
// すべての注文関連イベントにサブスクライブ
await broker.subscribe('orders.*', handleOrderEvent);

// サービスからのすべてのイベントにサブスクライブ
await broker.subscribe('payment-service.*', handlePaymentEvent);

// すべてにサブスクライブ（監視/ロギング）
await broker.subscribe('*', logAllEvents);
```

## 重要な考慮事項

### メッセージの順序

メッセージは順不同で到着する可能性：

```javascript
class OrderAwareSubscriber {
  constructor() {
    this.processedMessages = new Set();
  }
  
  async handleMessage(message) {
    // 処理を冪等にする
    if (this.processedMessages.has(message.id)) {
      console.log('Already processed:', message.id);
      return;
    }
    
    await this.processMessage(message);
    this.processedMessages.add(message.id);
  }
}
```

### 重複メッセージ

複数回到着するメッセージを処理：

```javascript
class IdempotentSubscriber {
  async handleMessage(message) {
    // すでに処理されているかチェック
    const exists = await this.db.findOne({ messageId: message.id });
    if (exists) {
      return; // 重複をスキップ
    }
    
    // 処理して記録
    await this.processMessage(message);
    await this.db.insert({ messageId: message.id, processedAt: new Date() });
  }
}
```

### ポイズンメッセージ

不正な形式または問題のあるメッセージを処理：

```javascript
class SafeSubscriber {
  async handleMessage(message) {
    try {
      await this.validateMessage(message);
      await this.processMessage(message);
    } catch (error) {
      if (this.isUnrecoverable(error)) {
        // デッドレターキューに移動
        await this.deadLetterQueue.send(message);
        console.error('Poison message detected:', message.id);
      } else {
        // 後でリトライ
        throw error;
      }
    }
  }
}
```

### メッセージの有効期限

時間に敏感なメッセージを処理：

```javascript
class ExpirationAwareSubscriber {
  async handleMessage(message) {
    const expiresAt = new Date(message.expiresAt);
    
    if (Date.now() > expiresAt) {
      console.log('Message expired:', message.id);
      return; // 期限切れメッセージを破棄
    }
    
    await this.processMessage(message);
  }
}
```

## このパターンを使用するタイミング

!!!tip "✅ Publisher-Subscriberを使用する場合"
    **ブロードキャスト**：複数のコンシューマーに情報を送信する必要がある
    
    **分離**：サービスを独立して開発したい
    
    **スケーラビリティ**：異なるコンポーネントで変動する負荷を処理する必要がある
    
    **非同期**：コンシューマーからの即座の応答が不要
    
    **拡張性**：パブリッシャーを変更せずに新しいコンシューマーを追加したい
    
    **イベント駆動**：イベント駆動アーキテクチャを構築

!!!warning "❌ Publisher-Subscriberを避ける場合"
    **少数のコンシューマー**：非常に異なるニーズを持つ1〜2のコンシューマーのみ
    
    **リアルタイムが必要**：即座の同期応答が必要
    
    **シンプルな通信**：直接呼び出しの方がシンプルで十分
    
    **順序保証**：厳密なメッセージ順序が重要
    
    **トランザクション**：パブリッシャーとサブスクライバー間でアトミック操作が必要

## 実世界の例：eコマース注文処理

```javascript
// 注文サービスがイベントを公開
class OrderService {
  async createOrder(orderData) {
    const order = await this.db.orders.create(orderData);
    
    await this.broker.publish('orders', {
      type: 'OrderCreated',
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      total: order.total,
      timestamp: new Date().toISOString()
    });
    
    return order;
  }
}

// 複数のサブスクライバーが異なる側面を処理
class InventoryService {
  async start() {
    await this.broker.subscribe('orders', async (msg) => {
      if (msg.type === 'OrderCreated') {
        await this.reserveInventory(msg.items);
      }
    });
  }
}

class PaymentService {
  async start() {
    await this.broker.subscribe('orders', async (msg) => {
      if (msg.type === 'OrderCreated') {
        await this.chargeCustomer(msg.customerId, msg.total);
      }
    });
  }
}

class NotificationService {
  async start() {
    await this.broker.subscribe('orders', async (msg) => {
      if (msg.type === 'OrderCreated') {
        await this.sendConfirmationEmail(msg.customerId, msg.orderId);
      }
    });
  }
}

class AnalyticsService {
  async start() {
    await this.broker.subscribe('orders', async (msg) => {
      if (msg.type === 'OrderCreated') {
        await this.trackSale(msg.total, msg.items);
      }
    });
  }
}

// OrderServiceを変更せずに後で追加された新しいサービス
class LoyaltyService {
  async start() {
    await this.broker.subscribe('orders', async (msg) => {
      if (msg.type === 'OrderCreated') {
        await this.awardPoints(msg.customerId, msg.total);
      }
    });
  }
}
```

## 関連パターンとの比較

### Publisher-Subscriber vs Observerパターン

pub/subパターンはObserverパターンをベースにしていますが、非同期メッセージングとブローカー仲介を追加し、より良い分離とスケーラビリティを提供します。

### Publisher-Subscriber vs メッセージキュー

メッセージキューは通常、各メッセージを1つのコンシューマーに配信します（競合コンシューマー）が、pub/subは各メッセージをすべての関心のあるサブスクライバーに配信します。

## 結論

Publisher-Subscriberパターンは、スケーラブルで疎結合な分散システムを構築するために不可欠です。パブリッシャーとサブスクライバーの間にメッセージブローカーを導入することで、次のことが得られます：

- 開発とデプロイの独立性
- コンポーネントを個別にスケールする能力
- コンポーネント障害に対する回復力
- 既存のコードを変更せずに新しい機能を追加する柔軟性

複数のコンシューマーにイベントをブロードキャストする必要があるシステム、特に分散環境を構築する場合、Publisher-Subscriberパターンは非同期でイベント駆動の通信のための堅牢な基盤を提供します。

## 参考文献

- [Asynchronous Messaging Primer](https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply)
- [Event-driven architecture style](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven)
- [Enterprise integration using message queues and events](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/enterprise-integration/queues-events)
