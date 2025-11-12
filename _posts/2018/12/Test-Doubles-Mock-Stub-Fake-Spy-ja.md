---
title: "テストダブル：Mock、Stub、Fake、Spyを理解する"
date: 2018-12-02
lang: ja
categories: Development
tags: [Testing, Unit Testing, Software Engineering, Best Practices]
excerpt: "mock、stub、fake、spyの違いを理解してテストダブルの技術を習得しましょう。効果的で保守可能な単体テストを書くための必須パターンです。"
thumbnail: /assets/coding/1.png
---

## はじめに

テスト可能なコードを書くには、テスト対象のユニットをその依存関係から分離する必要があります。データベースを呼び出したり、メールを送信したり、HTTPリクエストを行う関数はテストが困難です。テストは遅くなり、不安定になり、外部システムに依存してしまいます。実際にクレジットカードに課金せずに決済処理をテストするにはどうすればよいでしょうか？本番サービスをクラッシュさせずにエラー処理を検証するにはどうすればよいでしょうか？

テストダブルは、実際の依存関係を制御された代替物に置き換えることで、この問題を解決します。スタントダブルが危険なシーンで俳優の代わりを務めるように、テストダブルはテストで実際のオブジェクトの代わりを務めます。しかし、すべてのテストダブルが同じではありません。mock、stub、fake、spyは異なる目的を果たし、異なるパターンに従います。

これらの違いを理解することで、テストの書き方が変わります。間違ったタイプを使用すると、テストは脆弱で不明瞭、または無効になります。適切なタイプを使用すると、テストは正確で保守可能、かつ価値のあるものになります。このガイドでは、各テストダブルが何をするのか、いつ使用するのか、そして効果的に実装する方法を明確にします。

## テストダブルの分類

Gerard Meszarosは著書「xUnitテストパターン」で「テストダブル」という用語を導入し、テストで実際の依存関係を置き換えるあらゆるオブジェクトの総称としました。Martin Fowlerはこれらの概念、特にmockとstubの違いを広めました。

### 5つのタイプ

テストダブルは5つのカテゴリに分類され、それぞれ異なる特性を持っています：

1. **Dummy（ダミー）**：渡されるが使用されない（パラメータリストを埋める）
2. **Stub（スタブ）**：呼び出しに対して事前定義された応答を提供する
3. **Spy（スパイ）**：どのように呼び出されたかの情報を記録する
4. **Mock（モック）**：期待値で動作を検証する
5. **Fake（フェイク）**：ショートカットを使った動作する実装

このガイドでは、最もよく使用される4つのタイプに焦点を当てます：Mock、Stub、Fake、Spy。

## Stub：出力の制御

Stubはテスト中の呼び出しに対して事前定義された答えを提供します。どのように呼び出されるかは気にせず、単に設定された応答を返します。Stubは状態検証を可能にします：「この入力が与えられたとき、システムは正しい出力を生成するか？」

### 特徴

- ハードコードされた応答を返す
- 呼び出し方法を検証しない
- 状態検証に焦点を当てる
- 最もシンプルなテストダブルの形式

### Stubを使用するタイミング

依存関係が返す内容を制御する必要がある場合にstubを使用します：

- 異なる応答シナリオのテスト
- エラー条件のシミュレーション
- テストデータの提供
- 遅い操作の置き換え（データベースクエリ、API呼び出し）

### 実装例

**JavaScript (Jest):**
```javascript
// 常に成功を返すStub
const paymentStub = {
  processPayment: jest.fn().mockReturnValue({
    status: 'success',
    transactionId: 'txn_12345'
  })
};

test('successful checkout creates order', () => {
  const order = checkout(cart, paymentStub);
  
  expect(order.status).toBe('completed');
  expect(order.transactionId).toBe('txn_12345');
});
```

**Python:**
```python
class PaymentServiceStub:
    def process_payment(self, amount, currency):
        return {
            'status': 'success',
            'transaction_id': 'txn_12345'
        }

def test_successful_checkout():
    service = PaymentServiceStub()
    order = checkout(cart, service)
    
    assert order.status == 'completed'
    assert order.transaction_id == 'txn_12345'
```

**Java (Mockito):**
```java
@Test
public void testSuccessfulCheckout() {
    PaymentService stub = mock(PaymentService.class);
    when(stub.processPayment(any(), any()))
        .thenReturn(new PaymentResult("success", "txn_12345"));
    
    Order order = checkout(cart, stub);
    
    assertEquals("completed", order.getStatus());
    assertEquals("txn_12345", order.getTransactionId());
}
```

### Stubのバリエーション

**エラーStub：**
```javascript
const failingStub = {
  processPayment: jest.fn().mockRejectedValue(
    new Error('Insufficient funds')
  )
};

test('failed payment shows error message', async () => {
  await expect(checkout(cart, failingStub))
    .rejects.toThrow('Insufficient funds');
});
```

**条件付きStub：**
```python
class ConditionalPaymentStub:
    def process_payment(self, amount, currency):
        if amount > 1000:
            raise PaymentError('Amount exceeds limit')
        return {'status': 'success'}

def test_large_payment_rejected():
    service = ConditionalPaymentStub()
    with pytest.raises(PaymentError):
        checkout(large_cart, service)
```

**シーケンスStub：**
```javascript
// 連続した呼び出しで異なる値を返す
const sequenceStub = {
  getNextId: jest.fn()
    .mockReturnValueOnce(1)
    .mockReturnValueOnce(2)
    .mockReturnValueOnce(3)
};

test('generates sequential IDs', () => {
  expect(sequenceStub.getNextId()).toBe(1);
  expect(sequenceStub.getNextId()).toBe(2);
  expect(sequenceStub.getNextId()).toBe(3);
});
```

!!!tip "💡 Stubのベストプラクティス"
    - stubはシンプルに保つ—データを返すだけ
    - stubにロジックを追加しない（代わりにfakeを使用）
    - stubを明確に命名する：`successfulPaymentStub`、`failingPaymentStub`
    - テスト間で共通のstubを再利用する

## Mock：動作の検証

Mockは、どのように呼び出されるべきかについての期待値を持つテストダブルです。返す内容に焦点を当てるstubとは異なり、mockはどのように使用されるかに焦点を当てます。Mockは動作検証を可能にします：「このメソッドは正しいパラメータで呼び出されたか？」

### 特徴

- メソッド呼び出しとパラメータを検証する
- 期待値が満たされない場合、テストが失敗する
- 動作検証に焦点を当てる
- stubより複雑

### Mockを使用するタイミング

相互作用自体がテストしたい内容である場合にmockを使用します：

- メソッドが呼び出されたことを検証する
- 呼び出し順序をチェックする
- 渡されたパラメータを検証する
- 正しい呼び出し回数を確認する

### 実装例

**JavaScript (Jest):**
```javascript
test('checkout calls payment service with correct amount', () => {
  const paymentMock = {
    processPayment: jest.fn().mockResolvedValue({ status: 'success' })
  };
  
  checkout(cart, paymentMock);
  
  // 相互作用を検証
  expect(paymentMock.processPayment).toHaveBeenCalledWith({
    amount: 99.99,
    currency: 'USD'
  });
  expect(paymentMock.processPayment).toHaveBeenCalledTimes(1);
});
```

**Python (unittest.mock):**
```python
from unittest.mock import Mock

def test_checkout_calls_payment_service():
    payment_mock = Mock()
    payment_mock.process_payment.return_value = {'status': 'success'}
    
    checkout(cart, payment_mock)
    
    # 相互作用を検証
    payment_mock.process_payment.assert_called_once_with(
        amount=99.99,
        currency='USD'
    )
```

**Java (Mockito):**
```java
@Test
public void testCheckoutCallsPaymentService() {
    PaymentService mock = mock(PaymentService.class);
    when(mock.processPayment(any(), any()))
        .thenReturn(new PaymentResult("success"));
    
    checkout(cart, mock);
    
    // 相互作用を検証
    verify(mock).processPayment(
        argThat(amount -> amount.equals(99.99)),
        eq("USD")
    );
    verify(mock, times(1)).processPayment(any(), any());
}
```

### 高度なMockパターン

**呼び出し順序の検証：**
```javascript
test('operations happen in correct order', () => {
  const logger = { log: jest.fn() };
  const db = { save: jest.fn() };
  
  processOrder(order, logger, db);
  
  const logCall = logger.log.mock.invocationCallOrder[0];
  const saveCall = db.save.mock.invocationCallOrder[0];
  
  expect(logCall).toBeLessThan(saveCall);
});
```

**引数マッチャー：**
```python
from unittest.mock import Mock, ANY

def test_sends_email_with_user_data():
    email_mock = Mock()
    
    register_user('alice@example.com', email_mock)
    
    email_mock.send.assert_called_with(
        to='alice@example.com',
        subject=ANY,  # 件名は気にしない
        body=ANY
    )
```

!!!warning "⚠️ Mockの過度な使用"
    **mockの過度な使用の症状：**
    - 実装の詳細を反映するテスト
    - 動作の変更なしにリファクタリングするとテストが壊れる
    - 実際のテストロジックよりもmockのセットアップが多い
    - 何をテストしているのか不明確
    
    **解決策：** mockは控えめに使用する。可能な限り状態検証（stub）を優先する。アーキテクチャの境界でのみmockを使用する。

## Fake：動作する実装

Fakeは本番環境には適さないショートカットを使用した動作する実装です。実際のオブジェクトのように動作しますが、よりシンプルで高速なアプローチを使用します。Fakeはstubより複雑ですが、より現実的な動作を提供します。

### 特徴

- 実際に動作する実装
- ショートカットを使用（メモリ vs. データベース）
- 操作間で状態を維持する
- stubより現実的

### Fakeを使用するタイミング

本番環境の複雑さなしに現実的な動作が必要な場合にfakeを使用します：

- テスト用のインメモリデータベース
- クラウドストレージの代わりにローカルファイルシステム
- 簡略化された認証
- 遅い操作の高速な代替手段

### 実装例

**インメモリリポジトリ：**
```javascript
class FakeUserRepository {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }
  
  save(user) {
    const id = this.nextId++;
    const savedUser = { ...user, id };
    this.users.set(id, savedUser);
    return savedUser;
  }
  
  findById(id) {
    return this.users.get(id) || null;
  }
  
  findByEmail(email) {
    return Array.from(this.users.values())
      .find(u => u.email === email) || null;
  }
  
  delete(id) {
    return this.users.delete(id);
  }
}

test('user registration and retrieval', () => {
  const repo = new FakeUserRepository();
  
  const user = repo.save({ email: 'alice@example.com', name: 'Alice' });
  expect(user.id).toBe(1);
  
  const found = repo.findById(1);
  expect(found.email).toBe('alice@example.com');
  
  const foundByEmail = repo.findByEmail('alice@example.com');
  expect(foundByEmail.id).toBe(1);
});
```

**インメモリキャッシュ：**
```python
class FakeCache:
    def __init__(self):
        self.store = {}
    
    def get(self, key):
        return self.store.get(key)
    
    def set(self, key, value, ttl=None):
        self.store[key] = value
    
    def delete(self, key):
        self.store.pop(key, None)
    
    def clear(self):
        self.store.clear()

def test_caching_behavior():
    cache = FakeCache()
    service = DataService(cache)
    
    # 最初の呼び出しはソースから取得
    data1 = service.get_user(123)
    
    # 2回目の呼び出しはキャッシュを使用
    data2 = service.get_user(123)
    
    assert data1 == data2
    assert cache.get('user:123') is not None
```

**フェイクファイルシステム：**
```java
public class FakeFileSystem implements FileSystem {
    private Map<String, byte[]> files = new HashMap<>();
    
    @Override
    public void write(String path, byte[] content) {
        files.put(path, content);
    }
    
    @Override
    public byte[] read(String path) throws FileNotFoundException {
        if (!files.containsKey(path)) {
            throw new FileNotFoundException(path);
        }
        return files.get(path);
    }
    
    @Override
    public boolean exists(String path) {
        return files.containsKey(path);
    }
    
    @Override
    public void delete(String path) {
        files.remove(path);
    }
}

@Test
public void testFileOperations() {
    FileSystem fs = new FakeFileSystem();
    
    fs.write("/test.txt", "Hello".getBytes());
    assertTrue(fs.exists("/test.txt"));
    
    byte[] content = fs.read("/test.txt");
    assertEquals("Hello", new String(content));
    
    fs.delete("/test.txt");
    assertFalse(fs.exists("/test.txt"));
}
```

!!!tip "💡 Fakeのベストプラクティス"
    - fakeはシンプルだが現実的に保つ
    - fake自体をテストして正確性を確保する
    - テストスイート間でfakeを共有する
    - 実際の実装との違いを文書化する
    - 実際の実装とfake実装のためのインターフェースの抽出を検討する

## Spy：相互作用の記録

Spyは実際のオブジェクトをラップし、どのように呼び出されたかを記録しながら、実際の実装に委譲します。実際の動作と検証機能を組み合わせ、置き換えることなく観察を可能にします。

### 特徴

- 実際のオブジェクトをラップする
- 実際の実装に委譲する
- すべての相互作用を記録する
- 実際の動作の検証を可能にする

### Spyを使用するタイミング

実際のオブジェクトとの相互作用を検証する必要がある場合にspyを使用します：

- キャッシュ動作の検証
- 最適化のチェック（メソッド呼び出し回数が少ない）
- 実際のオブジェクトの使用状況の監視
- 部分的なモック（一部のメソッドをspy、他は実際）

### 実装例

**JavaScript (Sinon):**
```javascript
const sinon = require('sinon');

test('caching reduces database calls', () => {
  const realDb = new Database();
  const dbSpy = sinon.spy(realDb);
  
  const service = new UserService(dbSpy);
  
  // 最初の呼び出しはデータベースにアクセス
  service.getUser(123);
  expect(dbSpy.query.calledOnce).toBe(true);
  
  // 2回目の呼び出しはキャッシュを使用
  service.getUser(123);
  expect(dbSpy.query.calledOnce).toBe(true); // まだ1回だけの呼び出し
});
```

**Python (unittest.mock):**
```python
from unittest.mock import spy

def test_cache_reduces_api_calls():
    real_api = ExternalAPI()
    api_spy = spy(real_api)
    
    service = DataService(api_spy)
    
    # 最初の呼び出しはAPIにアクセス
    service.get_data('key1')
    assert api_spy.fetch.call_count == 1
    
    # 2回目の呼び出しはキャッシュを使用
    service.get_data('key1')
    assert api_spy.fetch.call_count == 1  # 追加の呼び出しなし
```

**Java (Mockito):**
```java
@Test
public void testCachingReducesDatabaseCalls() {
    Database realDb = new Database();
    Database dbSpy = spy(realDb);
    
    UserService service = new UserService(dbSpy);
    
    // 最初の呼び出しはデータベースにアクセス
    service.getUser(123);
    verify(dbSpy, times(1)).query(any());
    
    // 2回目の呼び出しはキャッシュを使用
    service.getUser(123);
    verify(dbSpy, times(1)).query(any()); // まだ1回だけの呼び出し
}
```

### 部分的なSpy

Spyは選択的にメソッドをオーバーライドしながら、他のメソッドを実際のままにできます：

```javascript
test('spy with partial override', () => {
  const realService = new PaymentService();
  const spy = sinon.spy(realService);
  
  // 1つのメソッドをオーバーライド
  spy.validateCard = sinon.stub().returns(true);
  
  // 他のメソッドは実際の実装を使用
  const result = spy.processPayment(card, amount);
  
  expect(spy.validateCard.called).toBe(true);
  expect(result).toBeDefined(); // 実際のprocessPaymentが実行された
});
```

!!!warning "⚠️ Spyの制限"
    **Spyがうまく機能しない場合：**
    - 実際のオブジェクトに副作用がある（メール送信、課金）
    - 実際のオブジェクトが遅い（データベースクエリ、API呼び出し）
    - 実際のオブジェクトが複雑なセットアップを必要とする
    - エラー条件のテスト（実際のオブジェクトはオンデマンドで失敗しない）
    
    **解決策：** 実際の動作が問題になる場合は、代わりにmockまたはstubを使用する。

## 適切なテストダブルの選択

適切なテストダブルの選択は、何をテストするか、何を検証する必要があるかによって異なります。

### 決定フレームワーク

{% mermaid %}graph TD
    A["依存関係を置き換える必要がある？"]
    A -->|はい| B["相互作用を検証する必要がある？"]
    A -->|いいえ| Z["実際のオブジェクトを使用"]
    
    B -->|はい| C["実際の動作が必要？"]
    B -->|いいえ| D["現実的な動作が必要？"]
    
    C -->|はい| E["Spyを使用"]
    C -->|いいえ| F["Mockを使用"]
    
    D -->|はい| G["Fakeを使用"]
    D -->|いいえ| H["Stubを使用"]
    
    style E fill:#e8f5e9,stroke:#388e3c
    style F fill:#e3f2fd,stroke:#1976d2
    style G fill:#fff3e0,stroke:#f57c00
    style H fill:#f3e5f5,stroke:#7b1fa2
{% endmermaid %}

### 比較マトリックス

| 側面 | Stub | Mock | Fake | Spy |
|--------|------|------|------|-----|
| **複雑さ** | 低 | 中 | 高 | 低 |
| **呼び出しを検証** | いいえ | はい | いいえ | はい |
| **実際の実装** | いいえ | いいえ | 簡略化 | はい |
| **状態を維持** | いいえ | いいえ | はい | はい（実際） |
| **セットアップの労力** | 最小 | 中程度 | 高 | 最小 |
| **テストの明確さ** | 高 | 中 | 高 | 中 |
| **脆弱性** | 低 | 高 | 低 | 中 |

### 実用的なガイドライン

!!!anote "📋 各タイプを使用するタイミング"
    **Stubを使用する場合：**
    - 戻り値を制御する必要がある
    - 異なるシナリオをテストする（成功、失敗）
    - 遅い操作を置き換える
    - 状態検証で十分
    
    **Mockを使用する場合：**
    - メソッドが呼び出されたことを検証する
    - 渡されたパラメータをチェックする
    - 呼び出し順序を検証する
    - 相互作用が重要
    
    **Fakeを使用する場合：**
    - 現実的な動作が必要
    - 複雑な相互作用をテストする
    - 操作間で状態が持続する
    - 実際の実装が遅すぎる/複雑すぎる
    
    **Spyを使用する場合：**
    - 実際の動作が必要
    - 最適化を検証したい
    - 部分的なモックが必要
    - 実際のオブジェクトの使用状況を監視する

## よくある落とし穴とアンチパターン

テストダブルを理解するだけでは不十分です。テストの品質を損なう一般的な間違いを避ける必要があります。

### 過度なモック

**問題：** シンプルなオブジェクトを含むすべてをモックする。

```javascript
// 悪い：過度なモック
test('calculates total', () => {
  const item1 = { getPrice: jest.fn().mockReturnValue(10) };
  const item2 = { getPrice: jest.fn().mockReturnValue(20) };
  
  const total = calculateTotal([item1, item2]);
  expect(total).toBe(30);
});

// 良い：シンプルな場合は実際のオブジェクトを使用
test('calculates total', () => {
  const items = [
    { price: 10 },
    { price: 20 }
  ];
  
  const total = calculateTotal(items);
  expect(total).toBe(30);
});
```

### 実装の詳細のテスト

**問題：** 動作ではなく内部実装を検証するmock。

```javascript
// 悪い：実装をテスト
test('processes order', () => {
  const validator = { validate: jest.fn().mockReturnValue(true) };
  const calculator = { calculate: jest.fn().mockReturnValue(100) };
  const logger = { log: jest.fn() };
  
  processOrder(order, validator, calculator, logger);
  
  expect(validator.validate).toHaveBeenCalled();
  expect(calculator.calculate).toHaveBeenCalled();
  expect(logger.log).toHaveBeenCalledTimes(3);
});

// 良い：動作をテスト
test('processes valid order', () => {
  const result = processOrder(validOrder);
  
  expect(result.status).toBe('completed');
  expect(result.total).toBe(100);
});
```

### 脆弱なテスト

**問題：** 動作の変更なしにリファクタリングするとテストが壊れる。

```python
# 悪い：脆弱なテスト
def test_user_registration():
    db_mock = Mock()
    email_mock = Mock()
    logger_mock = Mock()
    
    register_user('alice@example.com', db_mock, email_mock, logger_mock)
    
    # 内部実装が変更されると壊れる
    logger_mock.info.assert_called_with('Starting registration')
    db_mock.save.assert_called_once()
    logger_mock.info.assert_called_with('User saved')
    email_mock.send.assert_called_once()
    logger_mock.info.assert_called_with('Email sent')

# 良い：回復力のあるテスト
def test_user_registration():
    result = register_user('alice@example.com')
    
    assert result.success is True
    assert result.user_id is not None
    assert email_was_sent_to('alice@example.com')
```

### 不明確なテストの意図

**問題：** 何を検証しているのか明確に伝えないテスト。

```java
// 悪い：意図が不明確
@Test
public void testCheckout() {
    PaymentService mock = mock(PaymentService.class);
    when(mock.processPayment(any(), any())).thenReturn(result);
    
    checkout(cart, mock);
    
    verify(mock).processPayment(any(), any());
}

// 良い：意図が明確
@Test
public void checkoutProcessesPaymentWithCartTotal() {
    PaymentService mock = mock(PaymentService.class);
    when(mock.processPayment(99.99, "USD")).thenReturn(successResult);
    
    Order order = checkout(cart, mock);
    
    verify(mock).processPayment(99.99, "USD");
    assertEquals("completed", order.getStatus());
}
```

## ベストプラクティス

テストダブルを使用した効果的なテストを書くために、これらのプラクティスに従ってください。

### 動作検証より状態検証を優先する

状態検証（stubを使用）は動作検証（mockを使用）より脆弱性が低いです。システムがどのように生成するかではなく、何を生成するかをテストします。

```javascript
// これを優先（状態検証）
test('checkout creates completed order', () => {
  const paymentStub = { processPayment: () => ({ status: 'success' }) };
  
  const order = checkout(cart, paymentStub);
  
  expect(order.status).toBe('completed');
});

// これより（動作検証）
test('checkout calls payment service', () => {
  const paymentMock = { processPayment: jest.fn() };
  
  checkout(cart, paymentMock);
  
  expect(paymentMock.processPayment).toHaveBeenCalled();
});
```

### アーキテクチャの境界でモックする

外部依存関係（データベース、API、ファイルシステム）をモックし、内部オブジェクトはモックしません。

```python
# 良い：境界でモック
def test_user_service():
    db_stub = FakeDatabase()
    service = UserService(db_stub)
    
    user = service.create_user('alice@example.com')
    
    assert user.id is not None

# 悪い：内部オブジェクトをモック
def test_user_service():
    validator_mock = Mock()
    formatter_mock = Mock()
    service = UserService(validator_mock, formatter_mock)
    
    # テストが内部実装と結合される
```

### テストダブルをシンプルに保つ

複雑なテストダブルは設計上の問題を示しています。テストダブルの作成が難しい場合、実際のオブジェクトがおそらく複雑すぎます。

```javascript
// これがモックしにくい場合...
class ComplexService {
  constructor(db, cache, logger, metrics, config, validator) {
    // 依存関係が多すぎる
  }
}

// ...設計を簡略化する
class SimpleService {
  constructor(repository) {
    // アーキテクチャの境界での単一の依存関係
  }
}
```

### テストダブルを明確に命名する

ダブルの目的を示す説明的な名前を使用します。

```python
# 良い名前
successful_payment_stub = PaymentStub(status='success')
failing_payment_stub = PaymentStub(status='failed')
empty_repository_fake = FakeRepository()
payment_service_spy = spy(PaymentService())

# 悪い名前
stub1 = PaymentStub()
mock = Mock()
fake = FakeRepository()
```

## まとめ

テストダブルは効果的な単体テストを書くための必須ツールです。mock、stub、fake、spyの違いを理解することで、各テストシナリオに適したツールを選択できるようになります。

**重要なポイント：**

- **Stub** は出力を制御する—状態検証に使用
- **Mock** は動作を検証する—アーキテクチャの境界で慎重に使用
- **Fake** は動作する実装を提供する—複雑な依存関係に使用
- **Spy** は実際のオブジェクトを観察する—実際の動作が重要な場合に使用

{% mermaid %}graph LR
    A["テストダブル"]
    
    B["Stub<br/>（出力制御）"]
    C["Mock<br/>（動作検証）"]
    D["Fake<br/>（動作実装）"]
    E["Spy<br/>（実オブジェクト観察）"]
    
    A --> B
    A --> C
    A --> D
    A --> E
    
    B --> B1["シンプル"]
    B --> B2["状態検証"]
    
    C --> C1["複雑"]
    C --> C2["動作検証"]
    
    D --> D1["現実的"]
    D --> D2["ステートフル"]
    
    E --> E1["実際の動作"]
    E --> E2["記録"]
    
    style A fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style B fill:#f3e5f5,stroke:#7b1fa2
    style C fill:#e3f2fd,stroke:#1976d2
    style D fill:#fff3e0,stroke:#f57c00
    style E fill:#e8f5e9,stroke:#388e3c
{% endmermaid %}

最良のテストは、ニーズを満たす最もシンプルなテストダブルを使用します。mockよりstubを、テストダブルより実際のオブジェクトを、動作検証より状態検証を優先します。内部実装の詳細ではなく、アーキテクチャの境界でモックします。テストダブルをシンプルに保ちます—複雑なダブルは設計上の問題を示しています。

これらのパターンをマスターすれば、テストはより明確で、保守しやすく、価値のあるものになります。リファクタリング中に壊れることなくバグをキャッチし、ロジックを曖昧にすることなく意図を伝え、信頼性を犠牲にすることなく高速に実行されます。

テストダブルは単なるテストツールではありません—設計フィードバックメカニズムです。テストダブルの作成が困難な場合、設計上の問題が明らかになります：依存関係が多すぎる、境界が不明確、または過度な結合。このフィードバックに耳を傾ければ、コードはよりモジュール化され、テスト可能で、保守しやすくなります。

今日からこれらのパターンを適用し始めましょう。次のmockをstubに置き換えてください。データベーステスト用にfakeを抽出してください。最適化を検証するためにspyを使用してください。適切に使用されたテストダブルと不適切に使用されたテストダブルの違いを体験してください。あなたのテスト—そしてあなたのコード—はあなたに感謝するでしょう。

## 参考資料

- **Martin Fowler - Mocks Aren't Stubs**: [https://martinfowler.com/articles/mocksArentStubs.html](https://martinfowler.com/articles/mocksArentStubs.html)
- **xUnit Test Patterns** by Gerard Meszaros
- **Growing Object-Oriented Software, Guided by Tests** by Steve Freeman and Nat Pryce
- **Jest Documentation**: [https://jestjs.io/docs/mock-functions](https://jestjs.io/docs/mock-functions)
- **Mockito Documentation**: [https://site.mockito.org/](https://site.mockito.org/)
- **Python unittest.mock**: [https://docs.python.org/3/library/unittest.mock.html](https://docs.python.org/3/library/unittest.mock.html)
- **Sinon.JS**: [https://sinonjs.org/](https://sinonjs.org/)
