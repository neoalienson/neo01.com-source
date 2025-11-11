---
title: 醜いユニットテスト - テストの恐怖コレクション
date: 2025-01-16
lang: ja
categories:
  - Development
tags:
  - Testing
  - Best Practices
thumbnail: /2025/01/Ugly-Unit-Tests-A-Collection-of-Testing-Horrors/thumbnail.jpeg
thumbnail_80: /2025/01/Ugly-Unit-Tests-A-Collection-of-Testing-Horrors/thumbnail_80.jpeg
excerpt: "すべてをテストするモンスターからスリープ＆プレイアプローチまで、実際のテストの悪夢を探り、本当に自信を与える保守可能なテストの書き方を学びます。"
---

![](/2025/01/Ugly-Unit-Tests-A-Collection-of-Testing-Horrors/banner.jpeg)

誰もが経験したことがあるでしょう。テストファイルを開いて、コードが何をするのか理解しようとしたら、すべてを疑問視させるような怪物に出会ってしまう。ユニットテストは私たちの生活を楽にするはずです。動作を文書化し、リグレッションを捕捉し、リファクタリングに自信を与えてくれます。しかし時には、防ぐはずだったものそのものになってしまいます：保守不可能な悪夢です。

実際に遭遇した最も醜いユニットテストをいくつか共有させてください。名前は変更して罪人を保護していますが、恐怖は本物です。

## 「すべてを一つでテスト」モンスター

```java
@Test
public void testUserService() {
    // Test user creation
    User user = new User("john", "password123");
    userService.save(user);
    assertNotNull(user.getId());
    
    // Test user login
    boolean loggedIn = userService.login("john", "password123");
    assertTrue(loggedIn);
    
    // Test user update
    user.setEmail("john@neo01.com");
    userService.update(user);
    assertEquals("john@neo01.com", userService.findById(user.getId()).getEmail());
    
    // Test user deletion
    userService.delete(user.getId());
    assertNull(userService.findById(user.getId()));
    
    // Test password reset
    User user2 = new User("jane", "password456");
    userService.save(user2);
    userService.resetPassword(user2.getId(), "newpassword");
    assertTrue(userService.login("jane", "newpassword"));
}
```

!!!danger "🔥 問題点"
    このテストは基本原則に違反しています：一つのテスト、一つの関心事。このテストが失敗したとき、5つの異なる動作のうちどれが壊れたのでしょうか？原因を見つけるには、メソッド全体をデバッグする必要があります。テストが相互依存になります。ユーザー作成が失敗すると、他のすべても失敗し、他の潜在的なバグを隠してしまいます。

**あるべき姿**：5つの別々のテスト、それぞれが検証する内容を明確に説明する名前を持つ。testUserDeletionが失敗したら、どこを見ればいいか正確にわかります。

## 「スリープ＆プレイ」アプローチ

```python
def test_async_processing():
    job_id = queue.submit_job(data)
    time.sleep(5)  # Wait for job to complete
    result = queue.get_result(job_id)
    assert result.status == "completed"
```

!!!warning "⏰ 問題点"
    タイミングベースのテストは不安定な悪夢です。高速なマシンでは5秒で十分かもしれません。負荷のかかった遅いCIサーバーでは足りないかもしれません。テストはローカルでは成功しますが、本番環境でランダムに失敗します。開発者は「またあの不安定なテストか」とテストの失敗を無視し始めます。

**あるべき姿**：適切な同期メカニズムを使用する—コールバック、プロミス、またはタイムアウト付きポーリング。可能であれば非同期動作をモックする。任意のスリープ時間に依存しない。

## 「コピー＆ペースト天国」

```javascript
test('user can add item to cart', () => {
    const user = { id: 1, name: 'John', email: 'john@test.com', address: '123 Main St', phone: '555-1234' };
    const cart = { id: 1, userId: 1, items: [], total: 0, tax: 0, shipping: 0 };
    const item = { id: 101, name: 'Widget', price: 29.99, quantity: 1, category: 'tools' };
    
    addToCart(user, cart, item);
    expect(cart.items.length).toBe(1);
});

test('user can remove item from cart', () => {
    const user = { id: 1, name: 'John', email: 'john@test.com', address: '123 Main St', phone: '555-1234' };
    const cart = { id: 1, userId: 1, items: [{ id: 101, name: 'Widget', price: 29.99, quantity: 1, category: 'tools' }], total: 29.99, tax: 2.50, shipping: 5.00 };
    const item = { id: 101, name: 'Widget', price: 29.99, quantity: 1, category: 'tools' };
    
    removeFromCart(user, cart, item);
    expect(cart.items.length).toBe(0);
});

test('user can update item quantity', () => {
    const user = { id: 1, name: 'John', email: 'john@test.com', address: '123 Main St', phone: '555-1234' };
    const cart = { id: 1, userId: 1, items: [{ id: 101, name: 'Widget', price: 29.99, quantity: 1, category: 'tools' }], total: 29.99, tax: 2.50, shipping: 5.00 };
    const item = { id: 101, name: 'Widget', price: 29.99, quantity: 2, category: 'tools' };
    
    updateCartItem(user, cart, item);
    expect(cart.items[0].quantity).toBe(2);
});
```

!!!bug "📋 問題点"
    大量の重複により保守が悪夢になります。ユーザーオブジェクトの構造を変更する必要がある？50箇所で更新してください。セットアップコードが実際のテストロジックよりも長く、重要な部分がノイズに埋もれています。

**あるべき姿**：テストフィクスチャを抽出し、ファクトリ関数を使用するか、テストセットアップメソッドを活用する。テストはそれを独自にするものに焦点を当て、定型文を繰り返さない。

## 「マジックナンバー祭り」

```csharp
[Test]
public void TestOrderCalculation()
{
    var order = new Order();
    order.AddItem(100, 2);
    order.AddItem(50, 3);
    order.ApplyDiscount(0.1);
    
    Assert.AreEqual(315, order.GetTotal());
}
```

!!!question "❓ 問題点"
    これらの数字は何を意味するのでしょうか？なぜ315が期待される結果なのでしょうか？割引は10%ですか、それとも0.1%ですか？このテストが失敗したら、デバッグを始める前に計算機で10分間計算することになります。

**あるべき姿**：計算を説明する名前付き定数または変数を使用する。`const decimal ITEM_PRICE = 100m; const int QUANTITY = 2; const decimal DISCOUNT_PERCENT = 10m;` これでテストが自己文書化されます。

## 「フレームワークをテスト」傑作

```java
@Test
public void testListAdd() {
    List<String> list = new ArrayList<>();
    list.add("test");
    assertEquals(1, list.size());
    assertEquals("test", list.get(0));
}

@Test
public void testMapPut() {
    Map<String, Integer> map = new HashMap<>();
    map.put("key", 42);
    assertEquals(42, map.get("key"));
}
```

!!!info "🤦 問題点"
    これらのテストはJavaの標準ライブラリが正しく動作することを検証しています。ネタバレ：動作します。OracleはすでにArrayListとHashMapを広範囲にテストしています。これらのテストは価値をゼロ追加しながら、保守負担とビルド時間を増やします。

**あるべき姿**：フレームワークではなく、自分のコードをテストする。ビジネスロジックを追加していない場合、テストは必要ありません。

## 「コメント駆動開発」アプローチ

```python
def test_user_registration():
    # Create a user
    user = User()
    # Set the username
    user.username = "testuser"
    # Set the password
    user.password = "password123"
    # Set the email
    user.email = "test@neo01.com"
    # Save the user
    db.save(user)
    # Retrieve the user
    saved_user = db.get_user("testuser")
    # Check if the user exists
    assert saved_user is not None
    # Check if the username matches
    assert saved_user.username == "testuser"
    # Check if the email matches
    assert saved_user.email == "test@neo01.com"
```

!!!tip "💬 問題点"
    コードが行うことを単に繰り返すコメントはノイズです。明確さを追加せず、雑然さを追加します。テストがこれほど多くのコメントを必要とするなら、テスト自体が不適切に書かれています。

**あるべき姿**：明確な変数名と構造で自己文書化コードを書く。テスト名を使用してテストされている内容を説明する。コメントは何をではなく、なぜを説明すべきです。

## 「何もアサートしない」自信ブースター

```javascript
test('process payment', async () => {
    const payment = { amount: 100, currency: 'USD' };
    await paymentService.process(payment);
    // Test passes!
});
```

!!!failure "✅ 問題点"
    このテストは何もアサートしないため、常に成功します。これは誤った安心感です。支払いが失敗したり、内部でキャッチされる例外をスローしたり、エラーを返したりしても、テストは緑のままです。

**あるべき姿**：期待される結果をアサートする。支払いは成功しましたか？データベースは更新されましたか？ユーザーは確認を受け取りましたか？アサーションのないテストはテストではありません。

## 「すべてをモック」シミュレーター

```java
@Test
public void testUserService() {
    UserRepository mockRepo = mock(UserRepository.class);
    EmailService mockEmail = mock(EmailService.class);
    Logger mockLogger = mock(Logger.class);
    Config mockConfig = mock(Config.class);
    TimeProvider mockTime = mock(TimeProvider.class);
    
    when(mockRepo.findById(1)).thenReturn(new User("john"));
    when(mockConfig.get("feature.enabled")).thenReturn("true");
    when(mockTime.now()).thenReturn(Instant.parse("2025-01-01T00:00:00Z"));
    
    UserService service = new UserService(mockRepo, mockEmail, mockLogger, mockConfig, mockTime);
    User user = service.getUser(1);
    
    assertEquals("john", user.getName());
    verify(mockLogger).info("User retrieved: john");
}
```

!!!warning "🎭 問題点"
    モックが返すように指示したものを返すことをテストしています。このテストは実際のビジネスロジックについて何も検証しません。現実から非常に隔離されているため、本番コードが完全に壊れていてもテストは成功する可能性があります。

**あるべき姿**：外部依存関係（データベース、API、ファイルシステム）をモックしますが、すべてをモックしない。可能な場合は実際のオブジェクトで実際のロジックをテストする。統合テストはユニットテストを補完します—両方を使用してください。

## 「失敗を無視」戦略

```python
@pytest.mark.skip(reason="Flaky test, will fix later")
def test_concurrent_access():
    # Test implementation
    pass

@unittest.skip("Fails on CI, works locally")
def test_file_upload():
    # Test implementation
    pass
```

!!!danger "🚫 問題点"
    スキップされたテストは決して支払われない技術的負債です。「後で修正する」は「決して修正しない」になります。これらのテストは腐敗し、時間とともにより古くなり、修正が困難になります。最終的に、なぜスキップされたのか、何をテストするはずだったのか誰も覚えていません。

**あるべき姿**：テストを修正するか削除する。本当に不安定な場合は、決定論的にする。もはや重要でないものをテストしている場合は、削除する。スキップされたテストはテストがないよりも悪いです—誤った自信を与えます。

## 教訓

これらのテストを醜くしているのは、単に不適切なスタイルだけではありません。テストの基本的な目的である、コードが正しく動作するという自信と、どのように動作すべきかの文書化に失敗していることです。

良いテストは共通の特性を共有しています：

**焦点を絞った**：一つのテスト、一つの動作。失敗したとき、何が壊れたか正確にわかります。

**読みやすい**：テスト名と構造が、何がテストされているか、なぜテストされているかを明確に伝えます。

**決定論的**：同じ入力、同じ出力、毎回。不安定さなし、ランダム性なし、タイミング依存性なし。

**高速**：テストはミリ秒で実行されるべきで、秒ではありません。遅いテストは実行されません。

**独立**：テストは互いに依存せず、共有状態にも依存しません。任意の順序で実行できます。

**保守可能**：要件が変更されたとき、テストは簡単に更新できます。重複は最小限に抑えられます。

## 前進への道

これらの例で自分のコードを認識しても、気にしないでください—私たちは皆、醜いテストを書いたことがあります。重要なのは学び、改善することです。

次のテストを書くとき、自問してください：

- このテストが6ヶ月後に失敗したら、なぜ失敗したか理解できるでしょうか？
- 自分のコードをテストしているのか、それともフレームワークをテストしているのか？
- このセットアップコードの半分を削除しても、有効なテストになるでしょうか？
- このテストはコードが動作するという自信を与えてくれるでしょうか？

ユニットテストは練習で向上するスキルです。今日書く醜いテストは、明日より良いテストを書くことを教えてくれます。チームとテストの恐怖体験を共有してください。それについて笑ってください。そこから学んでください。そして最も重要なことは、リファクタリングしてください。

なぜなら、醜いテストよりも悪いのは、テストがまったくないことだけだからです。

!!!success "✨ 希望の光"
    すべての醜いテストは学ぶ機会です。コードレビューがこれらの問題を捕捉します。リファクタリングがそれらを改善します。そして、これらの物語を共有することは、コミュニティ全体がより良いテストを書くのに役立ちます。私たちは皆、一緒にいます。
