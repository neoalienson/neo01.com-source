---
title: "單一職責原則：SOLID 設計的基石"
date: 2021-09-09
lang: zh-TW
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "一個類別應該只有一個改變的理由。這個簡單的陳述構成了 SOLID 設計的基礎，但開發者卻在什麼是「單一職責」以及何時拆分類別的問題上掙扎。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

單一職責原則（SRP）是 SOLID 設計中第一個也可以說是最基礎的原則。由 Robert C. Martin 提出，它指出：「一個類別應該只有一個改變的理由。」這個看似簡單的陳述引發了無數關於什麼是「單一職責」、何時拆分類別以及多細粒度才算過度的爭論。開發者在建立無所不包的上帝類別和將程式碼過度分割成數十個模糊整體設計的微小類別之間搖擺不定。

本文透過實際場景探討單一職責原則，從明顯的違規到微妙的設計決策。我們將剖析「職責」的真正含義、何時拆分類別以及何時合併更有意義。借鑑生產程式碼庫和重構經驗，我們揭示為什麼 SRP 既至關重要又容易被誤解。

## 理解單一職責

在深入了解何時以及如何應用 SRP 之前，理解這個原則的真正含義至關重要。「單一職責」這個術語經常被誤解為「只做一件事」。

### 什麼是職責？

職責不是方法或函式——它是改變的理由：

!!!anote "📚 職責定義"
    **不是關於方法數量**
    - 一個類別可以有多個方法
    - 多個方法可以服務於一個職責
    - 單個方法不能保證單一職責
    
    **關於改變的理由**
    - 業務邏輯變化
    - 資料格式變化
    - 外部系統整合變化
    - 每個都代表不同的職責
    
    **關於參與者**
    - 誰請求更改這段程式碼？
    - 不同的利益相關者 = 不同的職責
    - CFO 想要財務報告，CTO 想要系統指標
    - 同一個類別服務於兩者 = 多重職責

該原則強調「改變的理由」，因為這是維護痛苦的來源。當一個類別有多個職責時，為一個理由做的改變可能會破壞另一個理由的功能。

### 為什麼 SRP 重要

違反 SRP 會造成維護負擔並引入錯誤：

!!!warning "⚠️ 多重職責的代價"
    **耦合和脆弱性**
    - 一個職責的改變會影響其他職責
    - 破壞不相關功能的風險
    - 難以在沒有副作用的情況下修改
    
    **測試複雜性**
    - 必須一起測試所有職責
    - 無法單獨測試職責
    - 測試設定變得複雜
    - 模擬變得困難
    
    **可重用性問題**
    - 無法在不帶上其他職責的情況下重用一個職責
    - 強制不必要的依賴
    - 導致程式碼重複

這些成本隨著時間推移而累積。具有多個職責的類別隨著程式碼庫的演進變得越來越難以維護。

## 明顯的違規：上帝類別

最明顯的 SRP 違規來自上帝類別——處理多個不相關職責的類別。

### 經典的上帝類別

考慮 Web 應用程式中的這種常見模式：

```python
class UserManager:
    def __init__(self, db_connection, email_service, logger):
        self.db = db_connection
        self.email = email_service
        self.logger = logger
    
    # 使用者 CRUD 操作
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
        # 更新邏輯
        self.logger.info(f"User updated: {user_id}")
    
    def delete_user(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        self.logger.info(f"User deleted: {user_id}")
    
    # 密碼管理
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
    
    # 郵件操作
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
    
    # 驗證
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

這個類別至少有五個不同的職責：

!!!error "🚫 識別出的多重職責"
    **資料庫操作**
    - 使用者的 CRUD 操作
    - SQL 查詢建構
    - 資料庫連線管理
    
    **密碼管理**
    - 密碼雜湊
    - 密碼驗證
    - 密碼產生
    
    **郵件操作**
    - 歡迎郵件的編寫和發送
    - 密碼重設郵件的編寫和發送
    
    **驗證**
    - 電子郵件格式驗證
    - 使用者名稱驗證
    
    **日誌記錄**
    - 記錄使用者操作
    - 記錄郵件操作

每個職責代表不同的改變理由。如果郵件範本改變，你修改 UserManager。如果密碼雜湊演算法改變，你修改 UserManager。如果驗證規則改變，你修改 UserManager。每次改變都有破壞不相關功能的風險。

這是[上帝物件反模式](/zh-TW/2022/04/Software-Development-Anti-Patterns/)的經典例子——一個類別累積了太多職責並變得無法維護。

### 重構為單一職責

將上帝類別拆分為專注的類別，每個類別都有單一職責：

```python
# 職責：密碼安全
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

# 職責：使用者資料驗證
class UserValidator:
    def validate_email(self, email):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
    
    def validate_username(self, username):
        if len(username) < 3 or not username.isalnum():
            raise ValueError("Username must be at least 3 alphanumeric characters")

# 職責：使用者相關的郵件操作
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

# 職責：使用者資料持久化
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
        # 更新邏輯
        pass
    
    def delete(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))

# 職責：使用者業務操作（編排）
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

現在每個類別都有一個單一、明確定義的職責：

!!!success "✅ 單一職責的好處"
    **專注的類別**
    - PasswordService：密碼安全操作
    - UserValidator：使用者資料驗證規則
    - UserEmailService：使用者相關的郵件操作
    - UserRepository：使用者資料持久化
    - UserService：編排使用者業務操作
    
    **清晰的改變理由**
    - 密碼演算法改變 → PasswordService
    - 驗證規則改變 → UserValidator
    - 郵件範本改變 → UserEmailService
    - 資料庫結構描述改變 → UserRepository
    - 業務工作流程改變 → UserService
    
    **改進的可測試性**
    - 獨立測試密碼雜湊
    - 隔離測試驗證規則
    - 為使用者操作模擬郵件服務
    - 在沒有業務邏輯的情況下測試儲存庫

每個類別現在可以獨立演進。密碼雜湊的改變不會破壞郵件功能的風險。驗證的改變不會影響資料庫操作。

## 微妙的違規：混合關注點

比上帝類別更隱蔽的是以微妙方式混合關注點的類別——看起來很專注，但實際上處理多個職責。

### 報告產生器問題

考慮一個產生銷售報告的類別：

```java
public class SalesReportGenerator {
    private DatabaseConnection db;
    
    public String generateReport(Date startDate, Date endDate) {
        // 從資料庫取得資料
        List<Sale> sales = db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
        
        // 計算統計資料
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
        
        // 格式化為 HTML
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

這個類別看起來很專注——它產生銷售報告。但它實際上有三個不同的職責：

!!!warning "⚠️ 隱藏的多重職責"
    **資料檢索**
    - 查詢資料庫取得銷售資料
    - 建構 SQL 查詢
    - 處理資料庫連線
    
    **業務邏輯**
    - 計算總收入
    - 按產品彙總收入
    - 計算統計資料
    
    **展示**
    - 將資料格式化為 HTML
    - 定義報告結構
    - 處理 HTML 轉義

當需求改變時會發生什麼？如果你需要 PDF 格式的報告，你修改這個類別。如果資料庫結構描述改變，你修改這個類別。如果計算邏輯改變，你修改這個類別。三個不同的參與者（UI 團隊、DBA、業務分析師）都有理由改變這個單一的類別。

### 重構為分離關注點

將職責拆分為專注的類別：

```java
// 職責：檢索銷售資料
public class SalesRepository {
    private DatabaseConnection db;
    
    public List<Sale> findByDateRange(Date startDate, Date endDate) {
        return db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
    }
}

// 職責：計算銷售統計資料
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

// 職責：將銷售資料格式化為 HTML
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

// 職責：編排報告產生
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

現在每個類別都有一個單一、專注的職責：

!!!success "✅ 分離的好處"
    **獨立演進**
    - 新增 PDF 格式化器而不觸及資料檢索
    - 改變資料庫而不影響計算
    - 修改計算而不影響展示
    
    **可重用性**
    - 為不同的報告類型使用 SalesAnalyzer
    - 為其他銷售操作使用 SalesRepository
    - 建立多個格式化器（PDF、Excel、JSON）
    
    **可測試性**
    - 使用模擬資料測試計算
    - 在沒有資料庫的情況下測試格式化
    - 獨立測試資料檢索

重構後的設計允許每個職責獨立演進。新增 PDF 報告只需要一個新的格式化器類別。改變計算邏輯只影響 SalesAnalyzer。

## 粒度陷阱：過多的類別

雖然 SRP 防止了上帝類別，但過度熱衷的應用會產生相反的問題——過度分割成數十個微小的類別。

### 過度分割範例

考慮這個過度細粒度的設計：

```typescript
// 每個驗證規則一個單獨的類別
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

// 每個欄位提取一個單獨的類別
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

// 註冊需要協調許多微小的類別
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
        
        // 實際註冊使用者...
    }
}
```

這個設計走得太遠了：

!!!error "🚫 過度分割的問題"
    **過度間接**
    - 簡單操作被埋在類別層次結構中
    - 難以理解整體流程
    - 在類別之間導覽變得繁瑣
    
    **人為邊界**
    - 驗證規則自然地屬於一起
    - 欄位提取很簡單，不需要類別
    - 為了類別而建立類別
    
    **維護負擔**
    - 更多檔案需要導覽
    - 更多依賴需要管理
    - 更多樣板程式碼

### 找到合適的粒度

更平衡的方法是將相關操作分組：

```typescript
// 按內聚性分組的驗證規則
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

這個平衡的設計：

!!!success "✅ 適當的粒度"
    **內聚的分組**
    - 相關的驗證規則在一起
    - 清晰的類別目的：使用者驗證
    - 易於理解和導覽
    
    **合理的抽象**
    - 類別代表有意義的概念
    - 不為瑣碎的操作建立類別
    - 平衡 SRP 與實用主義
    
    **可維護**
    - 更少的檔案需要管理
    - 清晰的依賴
    - 易於測試和修改

關鍵見解：SRP 不意味著「每個類別一個方法」。它意味著「一個改變的理由」。所有使用者驗證規則因相同的理由而改變（業務規則改變），所以它們屬於一起。

## 識別職責：參與者測試

如何確定一個類別是否有多個職責？應用參與者測試：誰請求更改這段程式碼？

### 參與者測試實踐

考慮一個處理使用者認證的類別：

```python
class AuthenticationService:
    def authenticate(self, username, password):
        # 驗證憑證
        user = self.db.find_user(username)
        if not user or not self.verify_password(password, user.password_hash):
            return None
        
        # 產生會話權杖
        token = self.generate_token(user.id)
        self.db.save_session(token, user.id)
        
        # 記錄認證
        self.logger.info(f"User {username} authenticated")
        
        # 發送通知
        self.email.send(user.email, "New login detected")
        
        return token
```

應用參與者測試：

!!!anote "👥 識別參與者"
    **安全團隊**
    - 想要改變密碼驗證演算法
    - 想要修改權杖產生
    - 想要調整會話管理
    
    **維運團隊**
    - 想要改變日誌格式
    - 想要新增指標
    - 想要修改日誌級別
    
    **產品團隊**
    - 想要改變通知行為
    - 想要新增通知偏好
    - 想要修改郵件範本

三個不同的參與者有理由改變這個類別。這表明應該分離多個職責。

### 基於參與者的重構

根據參與者拆分類別：

```python
# 安全團隊的職責
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

# 維運團隊的職責
class AuthenticationLogger:
    def log_success(self, username):
        self.logger.info(f"User {username} authenticated successfully")
    
    def log_failure(self, username):
        self.logger.warning(f"Failed authentication attempt for {username}")

# 產品團隊的職責
class LoginNotificationService:
    def notify_login(self, user):
        self.email.send(user.email, "New login detected")

# 編排
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

現在每個參與者都有自己的類別來修改：

!!!success "✅ 基於參與者的分離"
    **清晰的所有權**
    - 安全團隊修改 CredentialVerifier 和 SessionManager
    - 維運團隊修改 AuthenticationLogger
    - 產品團隊修改 LoginNotificationService
    
    **獨立的改變**
    - 改變日誌不影響安全
    - 改變通知不影響會話
    - 每個團隊獨立工作
    
    **減少衝突**
    - 不同團隊修改不同檔案
    - 更少的合併衝突
    - 更清晰的程式碼審查所有權

參與者測試提供了一種實用的方法來識別職責：如果不同的人因不同的理由請求改變，你可能有多個職責。

## 何時應用 SRP：時機很重要

SRP 不意味著預先拆分每個類別。過早的抽象可能和上帝類別一樣有害。

### 三次規則

在有證據表明存在多個職責之前不要拆分類別：

!!!tip "🎯 何時拆分類別"
    **等待證據**
    - 不要投機性地拆分
    - 等到你實際需要改變類別時
    - 觀察哪些部分一起改變
    
    **三次規則**
    - 第一次：編寫程式碼
    - 第二次：注意重複或混合關注點
    - 第三次：重構和分離
    
    **是時候拆分的跡象**
    - 不同的人請求改變不同的部分
    - 對一部分的改變有破壞另一部分的風險
    - 測試需要模擬不相關的依賴
    - 類別已經增長到超出舒適的大小

過早拆分會產生不必要的複雜性。等到你有真正的證據表明職責應該被分離。

### 重構現有程式碼

當重構現有程式碼以遵循 SRP 時：

!!!anote "🔧 重構策略"
    **從測試開始**
    - 為現有行為編寫測試
    - 確保在重構前測試通過
    - 測試防止破壞性改變
    
    **一次提取一個職責**
    - 不要試圖一次重構所有內容
    - 提取一個清晰的職責
    - 驗證測試仍然通過
    - 對下一個職責重複
    
    **保持向後相容性**
    - 如果需要，保留原始類別作為外觀
    - 逐步遷移呼叫者
    - 遷移完成後移除外觀

增量重構降低風險並允許你驗證每一步。

## 結論

單一職責原則透過確保類別具有專注、明確定義的目的，構成了 SOLID 設計的基礎。透過將每個類別限制為單一的改變理由，SRP 減少了耦合，提高了可測試性，並使程式碼更易於理解和維護。然而，應用 SRP 需要判斷力——它不是關於最小化方法數量或為每個瑣碎操作建立類別。

有效應用 SRP 的關鍵是理解什麼構成「職責」。職責不是方法或函式——它是改變的理由，通常由不同的參與者或利益相關者驅動。參與者測試提供了一種實用的方法來識別多個職責：如果不同的人因不同的理由請求改變，你可能需要拆分類別。

上帝類別代表最明顯的 SRP 違規，處理多個不相關的職責，如資料庫操作、業務邏輯、驗證和郵件發送。這些類別隨著每次改變都有破壞不相關功能的風險而成為維護噩夢。將上帝類別重構為專注的類別——每個類別處理單一職責——顯著提高了可維護性和可測試性。

微妙的違規更隱蔽，看起來很專注但實際上混合了關注點。一個檢索資料、執行計算和格式化輸出的報告產生器有三個不同的職責應該被分離。這種分離允許每個關注點獨立演進，並實現跨不同情境的重用。

然而，過度熱衷地應用 SRP 會產生相反的問題——過度分割成數十個微小的類別。為每個驗證規則或欄位提取建立單獨的類別走得太遠，引入了不必要的間接和複雜性。解決方案是透過將因相同理由而改變的內聚操作分組來找到適當的粒度。

應用 SRP 時時機很重要。過早拆分會產生不必要的複雜性。三次規則建議在重構前等待證據：編寫程式碼，注意重複或混合關注點，然後在第三次出現時重構。這種方法在 SRP 的好處和過早抽象的成本之間取得平衡。

單一職責原則既簡單又微妙。「一個類別應該只有一個改變的理由」這個陳述很容易理解，但需要判斷力才能有效應用。透過關注參與者、改變的理由和內聚性，你可以建立既可維護又實用的設計——避免上帝類別和過度分割。
