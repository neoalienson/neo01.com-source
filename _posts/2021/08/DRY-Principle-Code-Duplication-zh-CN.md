---
title: "DRY 原则：当代码重复成为技术债"
date: 2021-08-08
lang: zh-CN
categories: Development
tags: [Best Practices, Software Design, Code Quality]
excerpt: "Don't Repeat Yourself 听起来简单，但知道何时应用它需要判断力。了解何时重复是有害的、何时可接受，以及过早抽象如何比重复更糟。"
thumbnail: /assets/coding/2.png
---

DRY（Don't Repeat Yourself，不要重复自己）原则是软件开发中最常被引用的准则之一。由 Andy Hunt 和 Dave Thomas 在《程序员修炼之道》中提出，它承诺更干净的代码、更容易的维护和更少的错误。然而这个看似简单的原则——避免重复代码——在实践中变得出乎意料地复杂。开发者挣扎于这些问题：何时重复是可接受的？多少抽象才算太多？遵循 DRY 真的会让代码变得更糟吗？

本文通过真实场景探讨 DRY 原则，从明显的复制粘贴违规到微妙的知识重复。我们将剖析何时应该消除重复、何时暂时容忍它，以及何时过早抽象会造成更多问题。从生产环境代码库和重构经验中，我们揭示为什么 DRY 既是必要的又是危险的。

## 理解 DRY 原则

在深入探讨何时以及如何应用 DRY 之前，理解这个原则实际上的意义是必要的。DRY 不仅仅是避免复制粘贴——它关乎知识的表示。

### 核心概念

DRY 原则指出：「每一项知识在系统中都必须有单一、明确、权威的表示。」这超越了单纯的代码重复：

!!!anote "📚 DRY 范围"
    **代码重复**
    - 相同或相似的代码块重复出现
    - 相同逻辑被实现多次
    - 复制粘贴的编程模式
    - 最明显的 DRY 违规形式
    
    **知识重复**
    - 业务规则在多处编码
    - 验证逻辑分散在各层
    - 常量和配置重复
    - 数据库结构在代码中镜像
    
    **文档重复**
    - 注释重复代码的功能
    - API 文档重复实现内容
    - 相同信息有多个真相来源
    - 文档来源之间的不一致

这个原则强调「知识」而非「代码」，因为真正的问题不是文字相似性——而是在多个地方维护相同的概念。当业务规则改变时，你不应该需要在十个不同的位置更新代码。

### 为什么 DRY 很重要

重复会造成维护负担并引入错误：

!!!warning "⚠️ 重复的成本"
    **维护负担**
    - 变更需要在多个位置更新
    - 更新时容易遗漏某个实例
    - 增加开发者的认知负荷
    - 使代码库更难理解
    
    **错误倍增**
    - 错误在所有副本中重复
    - 修复必须应用到所有地方
    - 不一致的修复造成微妙的错误
    - 测试负担倍增
    
    **不一致风险**
    - 副本随时间分歧
    - 不同情境中的不同行为
    - 难以确定正确版本
    - 造成混淆和错误

这些成本随时间累积。今天的小重复会随着代码库演进成为维护噩梦。

## 明显的重复：复制粘贴编程

最明目张胆的 DRY 违规来自复制粘贴编程——复制整个代码块并稍作修改。

### 经典的复制粘贴违规

考虑这个网页应用程序中的常见模式：

```python
# 用户注册端点
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    
    # 验证
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # 创建用户
    user = User(username=username, email=email, password=hash_password(password))
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

# 个人资料更新端点 - 重复的验证
@app.route('/profile/update', methods=['POST'])
def update_profile():
    user_id = get_current_user_id()
    username = request.form.get('username')
    email = request.form.get('email')
    
    # 相同的验证逻辑重复了
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    
    # 更新用户
    user = User.query.get(user_id)
    user.username = username
    user.email = email
    db.session.commit()
    
    return jsonify({'message': 'Profile updated successfully'}), 200
```

验证逻辑被重复了。当需求改变时——比如说，用户名最小长度增加到 5 个字符——你必须更新两个位置。遗漏一个，你就会有不一致的行为。

这是[复制粘贴编程反模式](/zh-CN/2022/04/Software-Development-Anti-Patterns/)——复制代码而不是提取可重用组件，当逻辑需要改变时就会造成维护噩梦。

### 重构为 DRY

将重复的验证提取为可重用的函数：

```python
# 验证函数 - 单一真相来源
def validate_username(username):
    if not username or len(username) < 3:
        raise ValueError('Username must be at least 3 characters')
    return username

def validate_email(email):
    if not email or '@' not in email:
        raise ValueError('Invalid email address')
    return email

def validate_password(password):
    if not password or len(password) < 8:
        raise ValueError('Password must be at least 8 characters')
    return password

# 注册端点 - 使用验证函数
@app.route('/register', methods=['POST'])
def register():
    try:
        username = validate_username(request.form.get('username'))
        email = validate_email(request.form.get('email'))
        password = validate_password(request.form.get('password'))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    
    user = User(username=username, email=email, password=hash_password(password))
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

# 个人资料更新端点 - 重用相同的验证
@app.route('/profile/update', methods=['POST'])
def update_profile():
    user_id = get_current_user_id()
    
    try:
        username = validate_username(request.form.get('username'))
        email = validate_email(request.form.get('email'))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    
    user = User.query.get(user_id)
    user.username = username
    user.email = email
    db.session.commit()
    
    return jsonify({'message': 'Profile updated successfully'}), 200
```

现在验证规则只存在于一个地方。变更会自动传播到所有使用点。

### 维护的胜利

重构后的版本展示了 DRY 的价值：

!!!success "✅ DRY 的好处"
    **单一真相来源**
    - 验证规则只定义一次
    - 变更自动更新所有端点
    - 没有不一致验证的风险
    
    **更容易测试**
    - 独立测试验证函数
    - 端点测试专注于业务逻辑
    - 减少测试重复
    
    **更好的可读性**
    - 端点代码专注于工作流程
    - 验证细节被抽象化
    - 没有重复代码，意图更清晰

这是 DRY 最好的状态：消除没有任何目的的明显重复。

## 微妙的重复：分散的业务逻辑

比复制粘贴重复更隐蔽的是分散在代码库中的业务逻辑——相同的概念在多个地方以不同方式实现。

### 分散的计算问题

考虑一个电子商务系统计算订单总额：

```javascript
// 在购物车组件中
function calculateCartTotal(items) {
    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    // 对超过 $100 的订单应用 10% 折扣
    if (total > 100) {
        total = total * 0.9;
    }
    return total;
}

// 在订单确认组件中 - 重复的逻辑
function calculateOrderTotal(order) {
    let subtotal = 0;
    for (const item of order.items) {
        subtotal += item.price * item.quantity;
    }
    // 相同的折扣逻辑重复了
    if (subtotal > 100) {
        subtotal = subtotal * 0.9;
    }
    return subtotal;
}

// 在发票生成器中 - 再次重复
function generateInvoice(order) {
    let amount = 0;
    order.items.forEach(item => {
        amount += item.price * item.quantity;
    });
    // 折扣逻辑第三次重复
    if (amount > 100) {
        amount = amount - (amount * 0.1);
    }
    return {
        orderId: order.id,
        total: amount,
        // ... 其他字段
    };
}
```

相同业务规则的三种不同实现。当折扣改为超过 $150 的订单 15% 折扣时，你必须找到并更新所有三个位置。遗漏一个，客户就会在应用程序的不同部分看到不同的总额。

### 集中化业务逻辑

将业务规则提取为单一、权威的实现：

```javascript
// 业务逻辑层 - 单一真相来源
class OrderCalculator {
    static DISCOUNT_THRESHOLD = 100;
    static DISCOUNT_RATE = 0.1;
    
    static calculateSubtotal(items) {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    static calculateDiscount(subtotal) {
        if (subtotal > this.DISCOUNT_THRESHOLD) {
            return subtotal * this.DISCOUNT_RATE;
        }
        return 0;
    }
    
    static calculateTotal(items) {
        const subtotal = this.calculateSubtotal(items);
        const discount = this.calculateDiscount(subtotal);
        return subtotal - discount;
    }
}

// 购物车 - 使用集中化的逻辑
function calculateCartTotal(items) {
    return OrderCalculator.calculateTotal(items);
}

// 订单确认 - 使用相同的逻辑
function calculateOrderTotal(order) {
    return OrderCalculator.calculateTotal(order.items);
}

// 发票生成器 - 使用相同的逻辑
function generateInvoice(order) {
    return {
        orderId: order.id,
        subtotal: OrderCalculator.calculateSubtotal(order.items),
        discount: OrderCalculator.calculateDiscount(
            OrderCalculator.calculateSubtotal(order.items)
        ),
        total: OrderCalculator.calculateTotal(order.items),
    };
}
```

业务规则现在只存在于一个地方。折扣门槛和比率是可配置的常量。所有组件使用相同的计算逻辑，保证一致性。

!!!tip "🎯 业务逻辑集中化"
    **识别业务规则**
    - 实现业务需求的计算
    - 强制业务约束的验证规则
    - 代表业务流程的工作流程
    - 任何可能基于业务决策而改变的逻辑
    
    **创建领域层**
    - 将业务逻辑与展示和基础设施分离
    - 使业务规则明确且可测试
    - 在代码中使用领域特定语言
    - 记录业务规则来源（需求、法规）
    
    **强制单一来源**
    - 所有组件使用集中化的业务逻辑
    - 不重新实现业务规则
    - 配置优于重复
    - 代码审查捕捉分散的逻辑

## 何时重复是可接受的

并非所有重复都是有害的。有时重复是正确的选择，至少暂时如此。

### 巧合的重复

看起来相似但代表不同概念的代码不应该去重复化：

```python
# 用户身份验证
def validate_user_password(password):
    if len(password) < 8:
        raise ValueError('Password too short')
    return True

# WiFi 密码配置
def validate_wifi_password(password):
    if len(password) < 8:
        raise ValueError('Password too short')
    return True
```

这些函数看起来相同，但它们验证的是不同的东西。用户密码可能很快就需要特殊字符，而 WiFi 密码可能需要不同的规则。将它们合并会在不相关的概念之间建立耦合：

```python
# 不好：过早抽象
def validate_password(password, password_type):
    if password_type == 'user':
        if len(password) < 8:
            raise ValueError('Password too short')
        # 未来：检查特殊字符
    elif password_type == 'wifi':
        if len(password) < 8:
            raise ValueError('Password too short')
        # 未来：不同的规则
    return True
```

这个抽象比重复更糟。它耦合了不相关的概念，使未来的变更更困难。

!!!anote "🔍 巧合 vs. 真实重复"
    **巧合的重复（保持分离）**
    - 代码现在碰巧看起来相似
    - 代表不同的领域概念
    - 未来可能会分歧
    - 因不同原因而改变
    
    **真实的重复（消除）**
    - 相同概念实现多次
    - 因相同原因一起改变
    - 代表单一知识片段
    - 分歧表示错误

「三次法则」有帮助：容忍重复直到你有三个实例，然后考虑抽象。这可以防止基于巧合相似性的过早抽象。

### 跨边界的重复

跨架构边界的重复通常是可接受的：

```python
# 数据库模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False)

# API 响应模型
class UserResponse:
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

# 前端 TypeScript 接口
interface User {
    id: number;
    username: string;
    email: string;
}
```

User 结构在数据库、后端和前端之间重复。这种重复是有意的——它解耦了各层。数据库模型可以改变而不影响 API 契约。API 可以演进而不强制前端改变。

!!!tip "🏗️ 架构边界"
    **何时重复解耦**
    - 层之间（数据库、业务逻辑、展示）
    - 微服务架构中的服务之间
    - 内部和外部 API 之间
    - 具有不同生命周期的模块之间
    
    **边界重复的好处**
    - 各层可以独立演进
    - 变更不会跨边界级联
    - 组件之间的清晰契约
    - 更容易独立测试

## 过早抽象的危险

过度热衷地应用 DRY 会导致过早抽象——在充分理解问题之前就创建抽象。

### 过度抽象的混乱

开发者看到两个相似的函数就立即抽象：

```javascript
// 原始函数
function sendWelcomeEmail(user) {
    const subject = 'Welcome to Our Service!';
    const body = `Hello ${user.name}, welcome aboard!`;
    sendEmail(user.email, subject, body);
}

function sendPasswordResetEmail(user, resetLink) {
    const subject = 'Password Reset Request';
    const body = `Hello ${user.name}, click here to reset: ${resetLink}`;
    sendEmail(user.email, subject, body);
}

// 过早抽象
function sendUserEmail(user, emailType, extraData = {}) {
    let subject, body;
    
    if (emailType === 'welcome') {
        subject = 'Welcome to Our Service!';
        body = `Hello ${user.name}, welcome aboard!`;
    } else if (emailType === 'password_reset') {
        subject = 'Password Reset Request';
        body = `Hello ${user.name}, click here to reset: ${extraData.resetLink}`;
    } else if (emailType === 'order_confirmation') {
        subject = 'Order Confirmation';
        body = `Hello ${user.name}, your order ${extraData.orderId} is confirmed!`;
    } else if (emailType === 'shipping_notification') {
        subject = 'Your Order Has Shipped';
        body = `Hello ${user.name}, order ${extraData.orderId} shipped via ${extraData.carrier}!`;
    }
    // ... 更多电子邮件类型
    
    sendEmail(user.email, subject, body);
}
```

这个抽象比原始的重复更糟：

!!!error "🚫 过早抽象的问题"
    **增加的复杂性**
    - 单一函数处理多个不相关的情况
    - 条件逻辑随每个电子邮件类型增长
    - 难以理解每个电子邮件类型的作用
    - 难以测试所有分支
    
    **脆弱的设计**
    - 新增电子邮件类型需要修改中央函数
    - 变更有破坏现有电子邮件类型的风险
    - extraData 参数变成字段的大杂烩
    - 失去类型安全（extraData 需要哪些字段？）
    
    **更难改变**
    - 无法修改一个电子邮件类型而不影响其他类型
    - 重构需要理解所有电子邮件类型
    - 害怕破坏现有功能
    - 讽刺的是比重复更难维护

### 更好的方法

与其过早抽象，不如使用组合和清晰的接口：

```javascript
// 电子邮件模板接口
class EmailTemplate {
    constructor(user) {
        this.user = user;
    }
    
    getSubject() {
        throw new Error('Must implement getSubject');
    }
    
    getBody() {
        throw new Error('Must implement getBody');
    }
    
    send() {
        sendEmail(this.user.email, this.getSubject(), this.getBody());
    }
}

// 特定的电子邮件类型
class WelcomeEmail extends EmailTemplate {
    getSubject() {
        return 'Welcome to Our Service!';
    }
    
    getBody() {
        return `Hello ${this.user.name}, welcome aboard!`;
    }
}

class PasswordResetEmail extends EmailTemplate {
    constructor(user, resetLink) {
        super(user);
        this.resetLink = resetLink;
    }
    
    getSubject() {
        return 'Password Reset Request';
    }
    
    getBody() {
        return `Hello ${this.user.name}, click here to reset: ${this.resetLink}`;
    }
}

// 使用方式
new WelcomeEmail(user).send();
new PasswordResetEmail(user, resetLink).send();
```

这个设计消除了重复（电子邮件发送逻辑），同时保持电子邮件类型独立且易于修改。

!!!success "✅ 良好抽象原则"
    **等待模式浮现**
    - 不要在第一次重复时就抽象
    - 等到你有 3 个以上的实例
    - 在抽象之前理解代码如何变化
    
    **偏好组合而非条件**
    - 使用继承或组合
    - 避免大型条件块
    - 每个变体都是独立的
    
    **保持抽象简单**
    - 单一职责原则
    - 清晰、专注的接口
    - 易于理解和测试

## 真实世界的重构故事

我曾经接手一个有严重重复问题的代码库。应用程序有机地成长，开发者为了赶上截止日期而复制粘贴代码。结果：相同的业务逻辑在数十个文件中以不同方式实现。

### 发现问题

在一次例行的错误修复中，我发现折扣计算会根据应用程序中调用的位置产生不同的结果。购物车显示一个总额，结账页面显示另一个，发票又显示第三个。全都略有不同。

!!!error "🔍 重复灾难"
    **我发现的问题**
    - 折扣逻辑在 12 个不同文件中重复
    - 每个实现略有不同
    - 有些包含税金，有些没有
    - 不同的四舍五入策略
    - 边缘情况处理不一致
    
    **影响**
    - 客户抱怨总额不断变化
    - 支持团队无法解释差异
    - 会计对账噩梦
    - 计算错误导致收入损失
    - 损害客户信任

### 重构过程

我花了两周时间提取和集中化业务逻辑：

```python
# 之前：分散在 12 个文件中，有各种变化
# 文件 1:
total = sum(item.price * item.qty for item in items)
if total > 100:
    total = total * 0.9

# 文件 2:
subtotal = 0
for item in items:
    subtotal += item.price * item.qty
discount = subtotal * 0.1 if subtotal > 100 else 0
total = subtotal - discount

# 文件 3:
amount = sum([i.price * i.qty for i in items])
if amount >= 100:
    amount = amount - (amount * 0.1)
# ... 还有 9 个变化

# 之后：单一真相来源
class PricingEngine:
    DISCOUNT_THRESHOLD = Decimal('100.00')
    DISCOUNT_RATE = Decimal('0.10')
    
    @classmethod
    def calculate_subtotal(cls, items):
        return sum(
            Decimal(str(item.price)) * item.quantity 
            for item in items
        )
    
    @classmethod
    def calculate_discount(cls, subtotal):
        if subtotal >= cls.DISCOUNT_THRESHOLD:
            return (subtotal * cls.DISCOUNT_RATE).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        return Decimal('0.00')
    
    @classmethod
    def calculate_total(cls, items):
        subtotal = cls.calculate_subtotal(items)
        discount = cls.calculate_discount(subtotal)
        return subtotal - discount
```

重构揭示了 12 个实现中有 8 个有错误。有些使用浮点运算（造成四舍五入错误），其他有门槛检查的差一错误，还有几个忘记处理空购物车。

### 结果

部署集中化的定价引擎后：

!!!success "✅ 重构成果"
    **立即改善**
    - 整个应用程序的总额一致
    - 客户投诉降至零
    - 会计对账简化
    - 收入增加（错误正在损失金钱）
    
    **长期好处**
    - 新的定价规则在一个地方实现
    - A/B 测试定价策略变得可能
    - 定价逻辑的全面测试套件
    - 对进行定价变更有信心
    
    **学到的教训**
    - 重复隐藏错误
    - 不一致损害用户信任
    - 重构很快就能回本
    - DRY 关乎正确性，不只是可维护性

这次经验强化了 DRY 不仅仅是减少代码——它是通过单一真相来源确保正确性。

## 应用 DRY：实用指南

知道何时以及如何应用 DRY 需要判断力。这些指南有助于导航决策：

!!!tip "🎯 DRY 决策框架"
    **何时消除重复：**
    - 多个地方有相同的业务逻辑
    - 变更需要在多个位置更新
    - 不一致造成错误或混淆
    - 重复没有架构目的
    
    **何时容忍重复：**
    - 代码巧合相似
    - 重复解耦架构层
    - 抽象会是过早的
    - 你有少于 3 个实例
    
    **谨慎重构：**
    - 在抽象之前理解问题
    - 偏好简单的抽象而非复杂的
    - 使用组合而非条件逻辑
    - 重构后彻底测试
    - 记录抽象的目的

## 结论

DRY 原则——Don't Repeat Yourself（不要重复自己）——是软件质量的基石，但其应用需要细腻和判断力。其核心在于，DRY 不是要消除每一个看起来相似的代码实例；而是确保每一项知识在系统中都有单一、权威的表示。

通过复制粘贴编程的明显重复会造成立即的维护负担。当验证逻辑、计算或业务规则分散在多个文件中时，变更变得容易出错，不一致不可避免。将这种重复提取为可重用的函数或类提供了明确的好处：单一真相来源、更容易测试，以及减少错误倍增。

微妙的重复——分散在组件中的业务逻辑——构成更大的危险，因为它更难检测。当相同的概念在多个地方以不同方式实现时，代码库就成为不一致的雷区。将业务逻辑集中到领域层确保一致性，并使业务规则明确且可测试。

然而，并非所有重复都是有害的。巧合的重复——碰巧看起来相似但代表不同概念的代码——应该保持分离。基于表面相似性的过早抽象会在不相关的概念之间建立耦合，使未来的变更更困难。三次法则提供了指导：容忍重复直到你有三个实例，然后考虑抽象是否合理。

跨架构边界的重复通常有其目的。在数据库模型、API 契约和前端接口之间重复数据结构可以解耦各层，并允许独立演进。这种有意的重复提供了灵活性和组件之间的清晰契约。

过早抽象的危险不容小觑。过度热衷地应用 DRY 会导致复杂的、充满条件的函数，比原始的重复更难理解和维护。良好的抽象来自理解多个实例的模式，而不是消除你看到的第一个重复。偏好组合和清晰的接口，而非条件逻辑和参数驱动的行为。

真实世界的经验表明，重复隐藏错误并造成损害用户信任的不一致。将重复的业务逻辑重构为单一真相来源不仅改善可维护性，还经常揭示并修复存在于分散实现中的错误。重构的投资通过增加的正确性和进行变更的信心而回本。

有效应用 DRY 的关键在于区分有害的重复和可接受的相似性。问问自己：这个重复代表相同的知识吗？这些片段会因相同原因一起改变吗？消除这个重复会在不相关的概念之间建立耦合吗？答案会指导你是否应该重构或容忍重复。

DRY 最终关乎可维护性和正确性。当业务规则存在于多个地方时，变更是有风险的，不一致是不可避免的。当知识有单一权威的表示时，变更会自动传播，正确性更容易验证。但实现这一点需要判断力——知道何时抽象、何时等待，以及何时重复有其目的。

在反射性地消除每一个相似代码的实例之前，考虑你是在移除有害的重复还是在创建过早的抽象。目标不是零重复——而是一个知识被清晰、权威地表示一次，同时保持演进的灵活性的代码库。
