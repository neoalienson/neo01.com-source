---
title: 醜陋的單元測試 - 測試恐怖故事集
date: 2025-01-16
categories:
  - Development
tags:
  - Testing
  - Best Practices
thumbnail: thumbnail.jpeg
thumbnail_80: thumbnail_80.jpeg
lang: zh-TW
excerpt: 從一次測試所有東西的怪物到睡眠並祈禱的方法,探索真實世界中最醜陋的單元測試以及如何修復它們。
comments: true
---

![](/2025/01/Ugly-Unit-Tests-A-Collection-of-Testing-Horrors/banner.jpeg)

我們都經歷過這種情況。你打開一個測試檔案，期待能理解程式碼的功能，結果卻看到一個讓你質疑一切的怪物。單元測試本應讓我們的生活更輕鬆——它們記錄行為、捕捉回歸問題，並讓我們有信心進行重構。但有時候，它們卻變成了它們本該防止的東西：無法維護的噩夢。

讓我分享一些我在實際工作中遇到的最醜陋的單元測試。名字已經改變以保護有罪者，但恐怖是真實的。

## 「一次測試所有東西」怪物

```java
@Test
public void testUserService() {
    // 測試使用者建立
    User user = new User("john", "password123");
    userService.save(user);
    assertNotNull(user.getId());
    
    // 測試使用者登入
    boolean loggedIn = userService.login("john", "password123");
    assertTrue(loggedIn);
    
    // 測試使用者更新
    user.setEmail("john@neo01.com");
    userService.update(user);
    assertEquals("john@neo01.com", userService.findById(user.getId()).getEmail());
    
    // 測試使用者刪除
    userService.delete(user.getId());
    assertNull(userService.findById(user.getId()));
    
    // 測試密碼重設
    User user2 = new User("jane", "password456");
    userService.save(user2);
    userService.resetPassword(user2.getId(), "newpassword");
    assertTrue(userService.login("jane", "newpassword"));
}
```

!!!danger "🔥 問題所在"
    這個測試違反了基本原則：一個測試，一個關注點。當這個測試失敗時，五種不同行為中的哪一個壞了？你需要除錯整個方法才能找出答案。測試變得相互依賴——如果使用者建立失敗，其他所有東西也會失敗，隱藏了其他潛在的錯誤。

**應該怎麼做**：五個獨立的測試，每個都有清楚的名稱描述它驗證什麼。當 testUserDeletion 失敗時，你確切知道該看哪裡。

## 「睡眠並祈禱」方法

```python
def test_async_processing():
    job_id = queue.submit_job(data)
    time.sleep(5)  # 等待工作完成
    result = queue.get_result(job_id)
    assert result.status == "completed"
```

!!!warning "⏰ 問題所在"
    基於時間的測試是不穩定的噩夢。在快速的機器上，5 秒可能足夠。在負載下的慢速 CI 伺服器上，可能不夠。測試在本地通過但在生產環境中隨機失敗。開發人員開始忽略測試失敗，因為「又是那個不穩定的測試」。

**應該怎麼做**：使用適當的同步機制——回呼、promise 或帶超時的輪詢。如果可能的話，模擬非同步行為。永遠不要依賴任意的睡眠時間。

## 「複製貼上天堂」

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

!!!bug "📋 問題所在"
    大量重複使維護成為噩夢。需要改變使用者物件結構？在 50 個地方更新它。設定程式碼比實際測試邏輯還長，將重要部分埋在雜訊中。

**應該怎麼做**：提取測試固件，使用工廠函數，或利用測試設定方法。測試應該專注於使其獨特的東西，而不是重複樣板程式碼。

## 「魔術數字盛宴」

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

!!!question "❓ 問題所在"
    這些數字是什麼意思？為什麼 315 是預期結果？折扣是 10% 還是 0.1%？當這個測試失敗時，你會花 10 分鐘用計算機算數學，然後才能開始除錯。

**應該怎麼做**：使用命名常數或變數來解釋計算。`const decimal ITEM_PRICE = 100m; const int QUANTITY = 2; const decimal DISCOUNT_PERCENT = 10m;` 現在測試自己記錄自己。

## 「測試框架」傑作

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

!!!info "🤦 問題所在"
    這些測試驗證 Java 的標準函式庫是否正常工作。劇透：它確實正常。Oracle 已經廣泛測試了 ArrayList 和 HashMap。這些測試增加零價值，同時增加維護負擔和建置時間。

**應該怎麼做**：測試你的程式碼，而不是框架。如果你沒有添加任何業務邏輯，你不需要測試。

## 「註解驅動開發」方法

```python
def test_user_registration():
    # 建立使用者
    user = User()
    # 設定使用者名稱
    user.username = "testuser"
    # 設定密碼
    user.password = "password123"
    # 設定電子郵件
    user.email = "test@neo01.com"
    # 儲存使用者
    db.save(user)
    # 檢索使用者
    saved_user = db.get_user("testuser")
    # 檢查使用者是否存在
    assert saved_user is not None
    # 檢查使用者名稱是否匹配
    assert saved_user.username == "testuser"
    # 檢查電子郵件是否匹配
    assert saved_user.email == "test@neo01.com"
```

!!!tip "💬 問題所在"
    只是重複程式碼所做的事情的註解是雜訊。它們不增加清晰度——它們增加混亂。如果你的測試需要這麼多註解才能理解，測試本身寫得很差。

**應該怎麼做**：編寫具有清楚變數名稱和結構的自我記錄程式碼。使用測試名稱來描述正在測試什麼。註解應該解釋為什麼，而不是什麼。

## 「什麼都不斷言」信心增強器

```javascript
test('process payment', async () => {
    const payment = { amount: 100, currency: 'USD' };
    await paymentService.process(payment);
    // 測試通過！
});
```

!!!failure "✅ 問題所在"
    這個測試總是通過，因為它沒有斷言任何東西。這是一種虛假的安全感。付款可能失敗、拋出內部捕獲的異常或返回錯誤——測試仍然是綠色的。

**應該怎麼做**：斷言預期結果。付款成功了嗎？資料庫更新了嗎？使用者收到確認了嗎？沒有斷言的測試不是測試。

## 「模擬所有東西」模擬器

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

!!!warning "🎭 問題所在"
    你正在測試模擬返回你告訴它們返回的東西。這個測試對實際業務邏輯沒有驗證任何東西。它與現實如此隔離，以至於在生產程式碼完全損壞時它可能通過。

**應該怎麼做**：模擬外部依賴（資料庫、API、檔案系統），但不要模擬所有東西。盡可能用真實物件測試真實邏輯。整合測試補充單元測試——兩者都使用。

## 「忽略失敗」策略

```python
@pytest.mark.skip(reason="Flaky test, will fix later")
def test_concurrent_access():
    # 測試實作
    pass

@unittest.skip("Fails on CI, works locally")
def test_file_upload():
    # 測試實作
    pass
```

!!!danger "🚫 問題所在"
    跳過的測試是永遠不會償還的技術債務。「稍後修復」變成「永遠不修復」。這些測試腐爛，隨著時間的推移變得更過時、更難修復。最終，沒有人記得為什麼它們被跳過或它們應該測試什麼。

**應該怎麼做**：修復測試或刪除它。如果它真的不穩定，使其確定性。如果它測試的東西不再重要，刪除它。跳過的測試比沒有測試更糟——它們給予虛假的信心。

## 教訓

使這些測試醜陋的不僅僅是糟糕的風格——而是它們在測試的基本目的上失敗了：提供程式碼正確工作的信心和它應該如何行為的文件。

好的測試有共同的特徵：

**專注**：一個測試，一個行為。當它失敗時，你確切知道什麼壞了。

**可讀**：測試名稱和結構清楚地傳達正在測試什麼以及為什麼。

**確定性**：相同的輸入，相同的輸出，每次都是。沒有不穩定性，沒有隨機性，沒有時間依賴性。

**快速**：測試應該在毫秒內運行，而不是秒。慢速測試不會被運行。

**獨立**：測試不依賴彼此或共享狀態。它們可以以任何順序運行。

**可維護**：當需求改變時，測試易於更新。重複最小化。

## 前進之路

如果你在這些例子中認出自己的程式碼，不要感到難過——我們都寫過醜陋的測試。重要的是學習和改進。

當你寫下一個測試時，問問自己：

- 如果這個測試在六個月後失敗，我會理解為什麼嗎？
- 我是在測試我的程式碼還是框架？
- 我能刪除一半的設定程式碼並仍然有一個有效的測試嗎？
- 這個測試給我信心程式碼能工作嗎？

單元測試是一項隨著實踐而提高的技能。我們今天寫的醜陋測試教會我們明天寫更好的測試。與你的團隊分享你的測試恐怖故事。嘲笑它們。從中學習。最重要的是，重構它們。

因為唯一比醜陋測試更糟的是根本沒有測試。

!!!success "✨ 一線希望"
    每個醜陋的測試都是學習的機會。程式碼審查捕捉這些問題。重構改進它們。分享這些故事幫助整個社群寫更好的測試。我們都在一起。
