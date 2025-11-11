---
title: 丑陋的单元测试 - 测试恐怖故事集
date: 2025-01-16
categories:
  - Development
tags:
  - Testing
  - Best Practices
thumbnail: thumbnail.jpeg
thumbnail_80: thumbnail_80.jpeg
lang: zh-CN
excerpt: 从一次测试所有东西的怪物到睡眠并祈祷的方法,探索真实世界中最丑陋的单元测试以及如何修复它们。
comments: true
---

![](/2025/01/Ugly-Unit-Tests-A-Collection-of-Testing-Horrors/banner.jpeg)

我们都经历过这种情况。你打开一个测试文件，期待能理解代码的功能，结果却看到一个让你质疑一切的怪物。单元测试本应让我们的生活更轻松——它们记录行为、捕捉回归问题，并让我们有信心进行重构。但有时候，它们却变成了它们本该防止的东西：无法维护的噩梦。

让我分享一些我在实际工作中遇到的最丑陋的单元测试。名字已经改变以保护有罪者，但恐怖是真实的。

## "一次测试所有东西"怪物

```java
@Test
public void testUserService() {
    // 测试用户创建
    User user = new User("john", "password123");
    userService.save(user);
    assertNotNull(user.getId());
    
    // 测试用户登录
    boolean loggedIn = userService.login("john", "password123");
    assertTrue(loggedIn);
    
    // 测试用户更新
    user.setEmail("john@neo01.com");
    userService.update(user);
    assertEquals("john@neo01.com", userService.findById(user.getId()).getEmail());
    
    // 测试用户删除
    userService.delete(user.getId());
    assertNull(userService.findById(user.getId()));
    
    // 测试密码重置
    User user2 = new User("jane", "password456");
    userService.save(user2);
    userService.resetPassword(user2.getId(), "newpassword");
    assertTrue(userService.login("jane", "newpassword"));
}
```

!!!danger "🔥 问题所在"
    这个测试违反了基本原则：一个测试，一个关注点。当这个测试失败时，五种不同行为中的哪一个坏了？你需要调试整个方法才能找出答案。测试变得相互依赖——如果用户创建失败，其他所有东西也会失败，隐藏了其他潜在的错误。

**应该怎么做**：五个独立的测试，每个都有清楚的名称描述它验证什么。当 testUserDeletion 失败时，你确切知道该看哪里。

## "睡眠并祈祷"方法

```python
def test_async_processing():
    job_id = queue.submit_job(data)
    time.sleep(5)  # 等待工作完成
    result = queue.get_result(job_id)
    assert result.status == "completed"
```

!!!warning "⏰ 问题所在"
    基于时间的测试是不稳定的噩梦。在快速的机器上，5 秒可能足够。在负载下的慢速 CI 服务器上，可能不够。测试在本地通过但在生产环境中随机失败。开发人员开始忽略测试失败，因为"又是那个不稳定的测试"。

**应该怎么做**：使用适当的同步机制——回调、promise 或带超时的轮询。如果可能的话，模拟异步行为。永远不要依赖任意的睡眠时间。

## "复制粘贴天堂"

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

!!!bug "📋 问题所在"
    大量重复使维护成为噩梦。需要改变用户对象结构？在 50 个地方更新它。设置代码比实际测试逻辑还长，将重要部分埋在噪音中。

**应该怎么做**：提取测试固件，使用工厂函数，或利用测试设置方法。测试应该专注于使其独特的东西，而不是重复样板代码。

## "魔术数字盛宴"

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

!!!question "❓ 问题所在"
    这些数字是什么意思？为什么 315 是预期结果？折扣是 10% 还是 0.1%？当这个测试失败时，你会花 10 分钟用计算器算数学，然后才能开始调试。

**应该怎么做**：使用命名常量或变量来解释计算。`const decimal ITEM_PRICE = 100m; const int QUANTITY = 2; const decimal DISCOUNT_PERCENT = 10m;` 现在测试自己记录自己。

## "测试框架"杰作

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

!!!info "🤦 问题所在"
    这些测试验证 Java 的标准库是否正常工作。剧透：它确实正常。Oracle 已经广泛测试了 ArrayList 和 HashMap。这些测试增加零价值，同时增加维护负担和构建时间。

**应该怎么做**：测试你的代码，而不是框架。如果你没有添加任何业务逻辑，你不需要测试。

## "注释驱动开发"方法

```python
def test_user_registration():
    # 创建用户
    user = User()
    # 设置用户名
    user.username = "testuser"
    # 设置密码
    user.password = "password123"
    # 设置电子邮件
    user.email = "test@neo01.com"
    # 保存用户
    db.save(user)
    # 检索用户
    saved_user = db.get_user("testuser")
    # 检查用户是否存在
    assert saved_user is not None
    # 检查用户名是否匹配
    assert saved_user.username == "testuser"
    # 检查电子邮件是否匹配
    assert saved_user.email == "test@neo01.com"
```

!!!tip "💬 问题所在"
    只是重复代码所做的事情的注释是噪音。它们不增加清晰度——它们增加混乱。如果你的测试需要这么多注释才能理解，测试本身写得很差。

**应该怎么做**：编写具有清楚变量名称和结构的自我记录代码。使用测试名称来描述正在测试什么。注释应该解释为什么，而不是什么。

## "什么都不断言"信心增强器

```javascript
test('process payment', async () => {
    const payment = { amount: 100, currency: 'USD' };
    await paymentService.process(payment);
    // 测试通过！
});
```

!!!failure "✅ 问题所在"
    这个测试总是通过，因为它没有断言任何东西。这是一种虚假的安全感。付款可能失败、抛出内部捕获的异常或返回错误——测试仍然是绿色的。

**应该怎么做**：断言预期结果。付款成功了吗？数据库更新了吗？用户收到确认了吗？没有断言的测试不是测试。

## "模拟所有东西"模拟器

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

!!!warning "🎭 问题所在"
    你正在测试模拟返回你告诉它们返回的东西。这个测试对实际业务逻辑没有验证任何东西。它与现实如此隔离，以至于在生产代码完全损坏时它可能通过。

**应该怎么做**：模拟外部依赖（数据库、API、文件系统），但不要模拟所有东西。尽可能用真实对象测试真实逻辑。集成测试补充单元测试——两者都使用。

## "忽略失败"策略

```python
@pytest.mark.skip(reason="Flaky test, will fix later")
def test_concurrent_access():
    # 测试实现
    pass

@unittest.skip("Fails on CI, works locally")
def test_file_upload():
    # 测试实现
    pass
```

!!!danger "🚫 问题所在"
    跳过的测试是永远不会偿还的技术债务。"稍后修复"变成"永远不修复"。这些测试腐烂，随着时间的推移变得更过时、更难修复。最终，没有人记得为什么它们被跳过或它们应该测试什么。

**应该怎么做**：修复测试或删除它。如果它真的不稳定，使其确定性。如果它测试的东西不再重要，删除它。跳过的测试比没有测试更糟——它们给予虚假的信心。

## 教训

使这些测试丑陋的不仅仅是糟糕的风格——而是它们在测试的基本目的上失败了：提供代码正确工作的信心和它应该如何行为的文档。

好的测试有共同的特征：

**专注**：一个测试，一个行为。当它失败时，你确切知道什么坏了。

**可读**：测试名称和结构清楚地传达正在测试什么以及为什么。

**确定性**：相同的输入，相同的输出，每次都是。没有不稳定性，没有随机性，没有时间依赖性。

**快速**：测试应该在毫秒内运行，而不是秒。慢速测试不会被运行。

**独立**：测试不依赖彼此或共享状态。它们可以以任何顺序运行。

**可维护**：当需求改变时，测试易于更新。重复最小化。

## 前进之路

如果你在这些例子中认出自己的代码，不要感到难过——我们都写过丑陋的测试。重要的是学习和改进。

当你写下一个测试时，问问自己：

- 如果这个测试在六个月后失败，我会理解为什么吗？
- 我是在测试我的代码还是框架？
- 我能删除一半的设置代码并仍然有一个有效的测试吗？
- 这个测试给我信心代码能工作吗？

单元测试是一项随着实践而提高的技能。我们今天写的丑陋测试教会我们明天写更好的测试。与你的团队分享你的测试恐怖故事。嘲笑它们。从中学习。最重要的是，重构它们。

因为唯一比丑陋测试更糟的是根本没有测试。

!!!success "✨ 一线希望"
    每个丑陋的测试都是学习的机会。代码审查捕捉这些问题。重构改进它们。分享这些故事帮助整个社区写更好的测试。我们都在一起。
