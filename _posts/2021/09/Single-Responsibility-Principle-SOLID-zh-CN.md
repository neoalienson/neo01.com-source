---
title: "单一职责原则：SOLID 设计的基石"
date: 2021-09-09
lang: zh-CN
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "一个类应该只有一个改变的理由。这个简单的陈述构成了 SOLID 设计的基础，但开发者却在什么是'单一职责'以及何时拆分类的问题上挣扎。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

单一职责原则（SRP）是 SOLID 设计中第一个也可以说是最基础的原则。由 Robert C. Martin 提出，它指出："一个类应该只有一个改变的理由。"这个看似简单的陈述引发了无数关于什么是"单一职责"、何时拆分类以及多细粒度才算过度的争论。开发者在创建无所不包的上帝类和将代码过度分割成数十个模糊整体设计的微小类之间摇摆不定。

本文通过实际场景探讨单一职责原则，从明显的违规到微妙的设计决策。我们将剖析"职责"的真正含义、何时拆分类以及何时合并更有意义。借鉴生产代码库和重构经验，我们揭示为什么 SRP 既至关重要又容易被误解。

## 理解单一职责

在深入了解何时以及如何应用 SRP 之前，理解这个原则的真正含义至关重要。"单一职责"这个术语经常被误解为"只做一件事"。

### 什么是职责？

职责不是方法或函数——它是改变的理由：

!!!anote "📚 职责定义"
    **不是关于方法数量**
    - 一个类可以有多个方法
    - 多个方法可以服务于一个职责
    - 单个方法不能保证单一职责
    
    **关于改变的理由**
    - 业务逻辑变化
    - 数据格式变化
    - 外部系统集成变化
    - 每个都代表不同的职责
    
    **关于参与者**
    - 谁请求更改这段代码？
    - 不同的利益相关者 = 不同的职责
    - CFO 想要财务报告，CTO 想要系统指标
    - 同一个类服务于两者 = 多重职责

该原则强调"改变的理由"，因为这是维护痛苦的来源。当一个类有多个职责时，为一个理由做的改变可能会破坏另一个理由的功能。

### 为什么 SRP 重要

违反 SRP 会造成维护负担并引入错误：

!!!warning "⚠️ 多重职责的代价"
    **耦合和脆弱性**
    - 一个职责的改变会影响其他职责
    - 破坏不相关功能的风险
    - 难以在没有副作用的情况下修改
    
    **测试复杂性**
    - 必须一起测试所有职责
    - 无法单独测试职责
    - 测试设置变得复杂
    - 模拟变得困难
    
    **可重用性问题**
    - 无法在不带上其他职责的情况下重用一个职责
    - 强制不必要的依赖
    - 导致代码重复

这些成本随着时间推移而累积。具有多个职责的类随着代码库的演进变得越来越难以维护。

## 明显的违规：上帝类

最明显的 SRP 违规来自上帝类——处理多个不相关职责的类。

### 经典的上帝类

考虑 Web 应用程序中的这种常见模式：

```python
class UserManager:
    def __init__(self, db_connection, email_service, logger):
        self.db = db_connection
        self.email = email_service
        self.logger = logger
    
    # 用户 CRUD 操作
    def create_user(self, username, email, password):
        hashed_password = self._hash_password(password)
        user_id = self.db.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, hashed_password)
        )
        self.logger.info(f"User created: {username}")
        return user_id
    
    def get_user(self, user_id):
        return self.db.query("SELECT * FROM users WHERE id = ?", (user_id,))
    
    def update_user(self, user_id, **kwargs):
        # 更新逻辑
        self.logger.info(f"User updated: {user_id}")
    
    def delete_user(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        self.logger.info(f"User deleted: {user_id}")
    
    # 密码管理
    def _hash_password(self, password):
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, user_id, password):
        user = self.get_user(user_id)
        return self._hash_password(password) == user['password']
    
    def reset_password(self, user_id):
        new_password = self._generate_random_password()
        self.update_user(user_id, password=self._hash_password(new_password))
        user = self.get_user(user_id)
        self.send_password_reset_email(user['email'], new_password)
    
    # 邮件操作
    def send_welcome_email(self, user_id):
        user = self.get_user(user_id)
        self.email.send(
            to=user['email'],
            subject="Welcome!",
            body=f"Welcome {user['username']}!"
        )
        self.logger.info(f"Welcome email sent to {user['email']}")
    
    def send_password_reset_email(self, email, new_password):
        self.email.send(
            to=email,
            subject="Password Reset",
            body=f"Your new password is: {new_password}"
        )
        self.logger.info(f"Password reset email sent to {email}")
    
    # 验证
    def validate_email(self, email):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def validate_username(self, username):
        return len(username) >= 3 and username.isalnum()
    
    # 工具方法
    def _generate_random_password(self):
        import random
        import string
        return ''.join(random.choices(string.ascii_letters + string.digits, k=12))
```

这个类至少有五个不同的职责：

!!!error "🚫 识别出的多重职责"
    **数据库操作**
    - 用户的 CRUD 操作
    - SQL 查询构造
    - 数据库连接管理
    
    **密码管理**
    - 密码哈希
    - 密码验证
    - 密码生成
    
    **邮件操作**
    - 欢迎邮件的编写和发送
    - 密码重置邮件的编写和发送
    
    **验证**
    - 邮箱格式验证
    - 用户名验证
    
    **日志记录**
    - 记录用户操作
    - 记录邮件操作

每个职责代表不同的改变理由。如果邮件模板改变，你修改 UserManager。如果密码哈希算法改变，你修改 UserManager。如果验证规则改变，你修改 UserManager。每次改变都有破坏不相关功能的风险。

这是[上帝对象反模式](/zh-CN/2022/04/Software-Development-Anti-Patterns/)的经典例子——一个类累积了太多职责并变得无法维护。

### 重构为单一职责

将上帝类拆分为专注的类，每个类都有单一职责：

```python
# 职责：密码安全
class PasswordService:
    def hash_password(self, password):
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password, hashed_password):
        return self.hash_password(password) == hashed_password
    
    def generate_random_password(self):
        import random
        import string
        return ''.join(random.choices(string.ascii_letters + string.digits, k=12))

# 职责：用户数据验证
class UserValidator:
    def validate_email(self, email):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
    
    def validate_username(self, username):
        if len(username) < 3 or not username.isalnum():
            raise ValueError("Username must be at least 3 alphanumeric characters")

# 职责：用户相关的邮件操作
class UserEmailService:
    def __init__(self, email_service):
        self.email = email_service
    
    def send_welcome_email(self, user):
        self.email.send(
            to=user.email,
            subject="Welcome!",
            body=f"Welcome {user.username}!"
        )
    
    def send_password_reset_email(self, user, new_password):
        self.email.send(
            to=user.email,
            subject="Password Reset",
            body=f"Your new password is: {new_password}"
        )

# 职责：用户数据持久化
class UserRepository:
    def __init__(self, db_connection):
        self.db = db_connection
    
    def create(self, username, email, hashed_password):
        return self.db.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, hashed_password)
        )
    
    def find_by_id(self, user_id):
        return self.db.query("SELECT * FROM users WHERE id = ?", (user_id,))
    
    def update(self, user_id, **kwargs):
        # 更新逻辑
        pass
    
    def delete(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))

# 职责：用户业务操作（编排）
class UserService:
    def __init__(self, repository, password_service, validator, email_service):
        self.repository = repository
        self.password_service = password_service
        self.validator = validator
        self.email_service = email_service
    
    def register_user(self, username, email, password):
        self.validator.validate_username(username)
        self.validator.validate_email(email)
        
        hashed_password = self.password_service.hash_password(password)
        user_id = self.repository.create(username, email, hashed_password)
        
        user = self.repository.find_by_id(user_id)
        self.email_service.send_welcome_email(user)
        
        return user_id
    
    def reset_password(self, user_id):
        new_password = self.password_service.generate_random_password()
        hashed_password = self.password_service.hash_password(new_password)
        
        self.repository.update(user_id, password=hashed_password)
        user = self.repository.find_by_id(user_id)
        
        self.email_service.send_password_reset_email(user, new_password)
```

现在每个类都有一个单一、明确定义的职责：

!!!success "✅ 单一职责的好处"
    **专注的类**
    - PasswordService：密码安全操作
    - UserValidator：用户数据验证规则
    - UserEmailService：用户相关的邮件操作
    - UserRepository：用户数据持久化
    - UserService：编排用户业务操作
    
    **清晰的改变理由**
    - 密码算法改变 → PasswordService
    - 验证规则改变 → UserValidator
    - 邮件模板改变 → UserEmailService
    - 数据库模式改变 → UserRepository
    - 业务工作流改变 → UserService
    
    **改进的可测试性**
    - 独立测试密码哈希
    - 隔离测试验证规则
    - 为用户操作模拟邮件服务
    - 在没有业务逻辑的情况下测试仓储

每个类现在可以独立演进。密码哈希的改变不会破坏邮件功能的风险。验证的改变不会影响数据库操作。

## 微妙的违规：混合关注点

比上帝类更隐蔽的是以微妙方式混合关注点的类——看起来很专注，但实际上处理多个职责。

### 报告生成器问题

考虑一个生成销售报告的类：

```java
public class SalesReportGenerator {
    private DatabaseConnection db;
    
    public String generateReport(Date startDate, Date endDate) {
        // 从数据库获取数据
        List<Sale> sales = db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
        
        // 计算统计数据
        double totalRevenue = 0;
        Map<String, Double> revenueByProduct = new HashMap<>();
        
        for (Sale sale : sales) {
            totalRevenue += sale.getAmount();
            revenueByProduct.merge(
                sale.getProductName(),
                sale.getAmount(),
                Double::sum
            );
        }
        
        // 格式化为 HTML
        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h1>Sales Report</h1>");
        html.append("<p>Period: ").append(startDate).append(" to ").append(endDate).append("</p>");
        html.append("<p>Total Revenue: $").append(totalRevenue).append("</p>");
        html.append("<h2>Revenue by Product</h2>");
        html.append("<ul>");
        
        for (Map.Entry<String, Double> entry : revenueByProduct.entrySet()) {
            html.append("<li>")
                .append(entry.getKey())
                .append(": $")
                .append(entry.getValue())
                .append("</li>");
        }
        
        html.append("</ul></body></html>");
        return html.toString();
    }
}
```

这个类看起来很专注——它生成销售报告。但它实际上有三个不同的职责：

!!!warning "⚠️ 隐藏的多重职责"
    **数据检索**
    - 查询数据库获取销售数据
    - 构造 SQL 查询
    - 处理数据库连接
    
    **业务逻辑**
    - 计算总收入
    - 按产品聚合收入
    - 计算统计数据
    
    **展示**
    - 将数据格式化为 HTML
    - 定义报告结构
    - 处理 HTML 转义

当需求改变时会发生什么？如果你需要 PDF 格式的报告，你修改这个类。如果数据库模式改变，你修改这个类。如果计算逻辑改变，你修改这个类。三个不同的参与者（UI 团队、DBA、业务分析师）都有理由改变这个单一的类。

### 重构为分离关注点

将职责拆分为专注的类：

```java
// 职责：检索销售数据
public class SalesRepository {
    private DatabaseConnection db;
    
    public List<Sale> findByDateRange(Date startDate, Date endDate) {
        return db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
    }
}

// 职责：计算销售统计数据
public class SalesAnalyzer {
    public SalesStatistics analyze(List<Sale> sales) {
        double totalRevenue = 0;
        Map<String, Double> revenueByProduct = new HashMap<>();
        
        for (Sale sale : sales) {
            totalRevenue += sale.getAmount();
            revenueByProduct.merge(
                sale.getProductName(),
                sale.getAmount(),
                Double::sum
            );
        }
        
        return new SalesStatistics(totalRevenue, revenueByProduct);
    }
}

// 职责：将销售数据格式化为 HTML
public class HtmlSalesReportFormatter {
    public String format(Date startDate, Date endDate, SalesStatistics stats) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h1>Sales Report</h1>");
        html.append("<p>Period: ").append(startDate).append(" to ").append(endDate).append("</p>");
        html.append("<p>Total Revenue: $").append(stats.getTotalRevenue()).append("</p>");
        html.append("<h2>Revenue by Product</h2>");
        html.append("<ul>");
        
        for (Map.Entry<String, Double> entry : stats.getRevenueByProduct().entrySet()) {
            html.append("<li>")
                .append(entry.getKey())
                .append(": $")
                .append(entry.getValue())
                .append("</li>");
        }
        
        html.append("</ul></body></html>");
        return html.toString();
    }
}

// 职责：编排报告生成
public class SalesReportService {
    private SalesRepository repository;
    private SalesAnalyzer analyzer;
    private SalesReportFormatter formatter;
    
    public String generateReport(Date startDate, Date endDate, ReportFormat format) {
        List<Sale> sales = repository.findByDateRange(startDate, endDate);
        SalesStatistics stats = analyzer.analyze(sales);
        return formatter.format(startDate, endDate, stats);
    }
}
```

现在每个类都有一个单一、专注的职责：

!!!success "✅ 分离的好处"
    **独立演进**
    - 添加 PDF 格式化器而不触及数据检索
    - 改变数据库而不影响计算
    - 修改计算而不影响展示
    
    **可重用性**
    - 为不同的报告类型使用 SalesAnalyzer
    - 为其他销售操作使用 SalesRepository
    - 创建多个格式化器（PDF、Excel、JSON）
    
    **可测试性**
    - 使用模拟数据测试计算
    - 在没有数据库的情况下测试格式化
    - 独立测试数据检索

重构后的设计允许每个职责独立演进。添加 PDF 报告只需要一个新的格式化器类。改变计算逻辑只影响 SalesAnalyzer。

## 粒度陷阱：过多的类

虽然 SRP 防止了上帝类，但过度热衷的应用会产生相反的问题——过度分割成数十个微小的类。

### 过度分割示例

考虑这个过度细粒度的设计：

```typescript
// 每个验证规则一个单独的类
class EmailValidator {
    validate(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

class PasswordLengthValidator {
    validate(password: string): boolean {
        return password.length >= 8;
    }
}

class PasswordComplexityValidator {
    validate(password: string): boolean {
        return /[A-Z]/.test(password) && /[0-9]/.test(password);
    }
}

class UsernameValidator {
    validate(username: string): boolean {
        return username.length >= 3 && /^[a-zA-Z0-9]+$/.test(username);
    }
}

// 每个字段提取一个单独的类
class EmailExtractor {
    extract(request: Request): string {
        return request.body.email;
    }
}

class PasswordExtractor {
    extract(request: Request): string {
        return request.body.password;
    }
}

class UsernameExtractor {
    extract(request: Request): string {
        return request.body.username;
    }
}

// 注册需要协调许多微小的类
class UserRegistrationService {
    constructor(
        private emailValidator: EmailValidator,
        private passwordLengthValidator: PasswordLengthValidator,
        private passwordComplexityValidator: PasswordComplexityValidator,
        private usernameValidator: UsernameValidator,
        private emailExtractor: EmailExtractor,
        private passwordExtractor: PasswordExtractor,
        private usernameExtractor: UsernameExtractor
    ) {}
    
    register(request: Request): void {
        const email = this.emailExtractor.extract(request);
        const password = this.passwordExtractor.extract(request);
        const username = this.usernameExtractor.extract(request);
        
        if (!this.emailValidator.validate(email)) throw new Error("Invalid email");
        if (!this.passwordLengthValidator.validate(password)) throw new Error("Password too short");
        if (!this.passwordComplexityValidator.validate(password)) throw new Error("Password not complex");
        if (!this.usernameValidator.validate(username)) throw new Error("Invalid username");
        
        // 实际注册用户...
    }
}
```

这个设计走得太远了：

!!!error "🚫 过度分割的问题"
    **过度间接**
    - 简单操作被埋在类层次结构中
    - 难以理解整体流程
    - 在类之间导航变得繁琐
    
    **人为边界**
    - 验证规则自然地属于一起
    - 字段提取很简单，不需要类
    - 为了类而创建类
    
    **维护负担**
    - 更多文件需要导航
    - 更多依赖需要管理
    - 更多样板代码

### 找到合适的粒度

更平衡的方法是将相关操作分组：

```typescript
// 按内聚性分组的验证规则
class UserValidator {
    validateEmail(email: string): void {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ValidationError("Invalid email format");
        }
    }
    
    validatePassword(password: string): void {
        if (password.length < 8) {
            throw new ValidationError("Password must be at least 8 characters");
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            throw new ValidationError("Password must contain uppercase and numbers");
        }
    }
    
    validateUsername(username: string): void {
        if (username.length < 3 || !/^[a-zA-Z0-9]+$/.test(username)) {
            throw new ValidationError("Username must be at least 3 alphanumeric characters");
        }
    }
}

class UserRegistrationService {
    constructor(
        private validator: UserValidator,
        private repository: UserRepository
    ) {}
    
    register(request: Request): void {
        const { email, password, username } = request.body;
        
        this.validator.validateEmail(email);
        this.validator.validatePassword(password);
        this.validator.validateUsername(username);
        
        this.repository.create(username, email, password);
    }
}
```

这个平衡的设计：

!!!success "✅ 适当的粒度"
    **内聚的分组**
    - 相关的验证规则在一起
    - 清晰的类目的：用户验证
    - 易于理解和导航
    
    **合理的抽象**
    - 类代表有意义的概念
    - 不为琐碎的操作创建类
    - 平衡 SRP 与实用主义
    
    **可维护**
    - 更少的文件需要管理
    - 清晰的依赖
    - 易于测试和修改

关键见解：SRP 不意味着"每个类一个方法"。它意味着"一个改变的理由"。所有用户验证规则因相同的理由而改变（业务规则改变），所以它们属于一起。

## 识别职责：参与者测试

如何确定一个类是否有多个职责？应用参与者测试：谁请求更改这段代码？

### 参与者测试实践

考虑一个处理用户认证的类：

```python
class AuthenticationService:
    def authenticate(self, username, password):
        # 验证凭据
        user = self.db.find_user(username)
        if not user or not self.verify_password(password, user.password_hash):
            return None
        
        # 生成会话令牌
        token = self.generate_token(user.id)
        self.db.save_session(token, user.id)
        
        # 记录认证
        self.logger.info(f"User {username} authenticated")
        
        # 发送通知
        self.email.send(user.email, "New login detected")
        
        return token
```

应用参与者测试：

!!!anote "👥 识别参与者"
    **安全团队**
    - 想要改变密码验证算法
    - 想要修改令牌生成
    - 想要调整会话管理
    
    **运维团队**
    - 想要改变日志格式
    - 想要添加指标
    - 想要修改日志级别
    
    **产品团队**
    - 想要改变通知行为
    - 想要添加通知偏好
    - 想要修改邮件模板

三个不同的参与者有理由改变这个类。这表明应该分离多个职责。

### 基于参与者的重构

根据参与者拆分类：

```python
# 安全团队的职责
class CredentialVerifier:
    def verify(self, username, password):
        user = self.db.find_user(username)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user

class SessionManager:
    def create_session(self, user_id):
        token = self.generate_token(user_id)
        self.db.save_session(token, user_id)
        return token

# 运维团队的职责
class AuthenticationLogger:
    def log_success(self, username):
        self.logger.info(f"User {username} authenticated successfully")
    
    def log_failure(self, username):
        self.logger.warning(f"Failed authentication attempt for {username}")

# 产品团队的职责
class LoginNotificationService:
    def notify_login(self, user):
        self.email.send(user.email, "New login detected")

# 编排
class AuthenticationService:
    def __init__(self, verifier, session_manager, logger, notifier):
        self.verifier = verifier
        self.session_manager = session_manager
        self.logger = logger
        self.notifier = notifier
    
    def authenticate(self, username, password):
        user = self.verifier.verify(username, password)
        
        if not user:
            self.logger.log_failure(username)
            return None
        
        token = self.session_manager.create_session(user.id)
        self.logger.log_success(username)
        self.notifier.notify_login(user)
        
        return token
```

现在每个参与者都有自己的类来修改：

!!!success "✅ 基于参与者的分离"
    **清晰的所有权**
    - 安全团队修改 CredentialVerifier 和 SessionManager
    - 运维团队修改 AuthenticationLogger
    - 产品团队修改 LoginNotificationService
    
    **独立的改变**
    - 改变日志不影响安全
    - 改变通知不影响会话
    - 每个团队独立工作
    
    **减少冲突**
    - 不同团队修改不同文件
    - 更少的合并冲突
    - 更清晰的代码审查所有权

参与者测试提供了一种实用的方法来识别职责：如果不同的人因不同的理由请求改变，你可能有多个职责。

## 何时应用 SRP：时机很重要

SRP 不意味着预先拆分每个类。过早的抽象可能和上帝类一样有害。

### 三次规则

在有证据表明存在多个职责之前不要拆分类：

!!!tip "🎯 何时拆分类"
    **等待证据**
    - 不要投机性地拆分
    - 等到你实际需要改变类时
    - 观察哪些部分一起改变
    
    **三次规则**
    - 第一次：编写代码
    - 第二次：注意重复或混合关注点
    - 第三次：重构和分离
    
    **是时候拆分的迹象**
    - 不同的人请求改变不同的部分
    - 对一部分的改变有破坏另一部分的风险
    - 测试需要模拟不相关的依赖
    - 类已经增长到超出舒适的大小

过早拆分会产生不必要的复杂性。等到你有真正的证据表明职责应该被分离。

### 重构现有代码

当重构现有代码以遵循 SRP 时：

!!!anote "🔧 重构策略"
    **从测试开始**
    - 为现有行为编写测试
    - 确保在重构前测试通过
    - 测试防止破坏性改变
    
    **一次提取一个职责**
    - 不要试图一次重构所有内容
    - 提取一个清晰的职责
    - 验证测试仍然通过
    - 对下一个职责重复
    
    **保持向后兼容性**
    - 如果需要，保留原始类作为外观
    - 逐步迁移调用者
    - 迁移完成后删除外观

增量重构降低风险并允许你验证每一步。

## 结论

单一职责原则通过确保类具有专注、明确定义的目的，构成了 SOLID 设计的基础。通过将每个类限制为单一的改变理由，SRP 减少了耦合，提高了可测试性，并使代码更易于理解和维护。然而，应用 SRP 需要判断力——它不是关于最小化方法数量或为每个琐碎操作创建类。

有效应用 SRP 的关键是理解什么构成"职责"。职责不是方法或函数——它是改变的理由，通常由不同的参与者或利益相关者驱动。参与者测试提供了一种实用的方法来识别多个职责：如果不同的人因不同的理由请求改变，你可能需要拆分类。

上帝类代表最明显的 SRP 违规，处理多个不相关的职责，如数据库操作、业务逻辑、验证和邮件发送。这些类随着每次改变都有破坏不相关功能的风险而成为维护噩梦。将上帝类重构为专注的类——每个类处理单一职责——显著提高了可维护性和可测试性。

微妙的违规更隐蔽，看起来很专注但实际上混合了关注点。一个检索数据、执行计算和格式化输出的报告生成器有三个不同的职责应该被分离。这种分离允许每个关注点独立演进，并实现跨不同上下文的重用。

然而，过度热衷地应用 SRP 会产生相反的问题——过度分割成数十个微小的类。为每个验证规则或字段提取创建单独的类走得太远，引入了不必要的间接和复杂性。解决方案是通过将因相同理由而改变的内聚操作分组来找到适当的粒度。

应用 SRP 时时机很重要。过早拆分会产生不必要的复杂性。三次规则建议在重构前等待证据：编写代码，注意重复或混合关注点，然后在第三次出现时重构。这种方法在 SRP 的好处和过早抽象的成本之间取得平衡。

单一职责原则既简单又微妙。"一个类应该只有一个改变的理由"这个陈述很容易理解，但需要判断力才能有效应用。通过关注参与者、改变的理由和内聚性，你可以创建既可维护又实用的设计——避免上帝类和过度分割。
