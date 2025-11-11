---
title: "単一責任原則：SOLID設計の基盤"
date: 2021-09-09
lang: ja
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "クラスは変更する理由を1つだけ持つべきである。このシンプルな原則がSOLID設計の基盤を形成するが、開発者は「単一責任」とは何か、いつクラスを分割すべきかで苦労している。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

単一責任原則（SRP）は、SOLID設計における最初の、そしておそらく最も基本的な原則です。Robert C. Martinによって提唱され、「クラスは変更する理由を1つだけ持つべきである」と述べています。この一見シンプルな原則は、「単一責任」とは何か、いつクラスを分割すべきか、どの程度の粒度が適切かについて、数え切れないほどの議論を引き起こしてきました。開発者は、すべてを行う神クラスの作成と、全体的な設計を曖昧にする数十の小さなクラスへの過度な分割の間で揺れ動いています。

本稿では、明白な違反から微妙な設計決定まで、実際のシナリオを通じて単一責任原則を検証します。「責任」が実際に何を意味するのか、いつクラスを分割すべきか、いつ統合がより理にかなっているのかを解剖します。本番コードベースとリファクタリングの経験から、SRPがなぜ不可欠でありながら誤解されやすいのかを明らかにします。

## 単一責任の理解

SRPをいつ、どのように適用するかに入る前に、この原則が実際に何を意味するのかを理解することが不可欠です。「単一責任」という用語は、しばしば「1つのことだけを行う」と誤解されます。

### 責任とは何か？

責任はメソッドや関数ではありません——それは変更する理由です：

!!!anote "📚 責任の定義"
    **メソッド数についてではない**
    - クラスは複数のメソッドを持つことができる
    - 複数のメソッドが1つの責任に貢献できる
    - 単一のメソッドは単一責任を保証しない
    
    **変更する理由について**
    - ビジネスロジックの変更
    - データフォーマットの変更
    - 外部システム統合の変更
    - それぞれが異なる責任を表す
    
    **アクターについて**
    - 誰がこのコードの変更を要求するか？
    - 異なるステークホルダー = 異なる責任
    - CFOは財務レポートを、CTOはシステムメトリクスを求める
    - 同じクラスが両方に対応 = 複数の責任

この原則が「変更する理由」を強調するのは、そこに保守の苦痛が生じるからです。クラスが複数の責任を持つ場合、ある理由による変更が別の理由の機能を壊す可能性があります。

### なぜSRPが重要か

SRPに違反すると、保守負担が生じ、バグが発生します：

!!!warning "⚠️ 複数責任のコスト"
    **結合と脆弱性**
    - 1つの責任の変更が他に影響する
    - 無関係な機能を壊すリスク
    - 副作用なしに変更することが困難
    
    **テストの複雑性**
    - すべての責任を一緒にテストする必要がある
    - 責任を単独でテストできない
    - テストのセットアップが複雑になる
    - モックが困難になる
    
    **再利用性の問題**
    - 他の責任なしに1つの責任を再利用できない
    - 不要な依存関係を強制する
    - コードの重複につながる

これらのコストは時間とともに複合します。複数の責任を持つクラスは、コードベースが進化するにつれて保守がますます困難になります。

## 明白な違反：神クラス

最も露骨なSRP違反は、複数の無関係な責任を処理する神クラスから生じます。

### 典型的な神クラス

Webアプリケーションでよく見られるパターンを考えてみましょう：

```python
class UserManager:
    def __init__(self, db_connection, email_service, logger):
        self.db = db_connection
        self.email = email_service
        self.logger = logger
    
    # ユーザーCRUD操作
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
        # 更新ロジック
        self.logger.info(f"User updated: {user_id}")
    
    def delete_user(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        self.logger.info(f"User deleted: {user_id}")
    
    # パスワード管理
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
    
    # メール操作
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
    
    # バリデーション
    def validate_email(self, email):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def validate_username(self, username):
        return len(username) >= 3 and username.isalnum()
    
    # ユーティリティメソッド
    def _generate_random_password(self):
        import random
        import string
        return ''.join(random.choices(string.ascii_letters + string.digits, k=12))
```

このクラスには少なくとも5つの異なる責任があります：

!!!error "🚫 特定された複数の責任"
    **データベース操作**
    - ユーザーのCRUD操作
    - SQLクエリの構築
    - データベース接続管理
    
    **パスワード管理**
    - パスワードのハッシュ化
    - パスワードの検証
    - パスワードの生成
    
    **メール操作**
    - ウェルカムメールの作成と送信
    - パスワードリセットメールの作成と送信
    
    **バリデーション**
    - メールフォーマットの検証
    - ユーザー名の検証
    
    **ログ記録**
    - ユーザー操作のログ記録
    - メール操作のログ記録

各責任は異なる変更理由を表します。メールテンプレートが変更されれば、UserManagerを修正します。パスワードハッシュアルゴリズムが変更されれば、UserManagerを修正します。バリデーションルールが変更されれば、UserManagerを修正します。すべての変更が無関係な機能を壊すリスクを伴います。

これは[神オブジェクトアンチパターン](/ja/2022/04/Software-Development-Anti-Patterns/)の古典的な例です——クラスが多くの責任を累積し、保守不可能になります。

### 単一責任へのリファクタリング

神クラスを、それぞれが単一の責任を持つ焦点を絞ったクラスに分割します：

```python
# 責任：パスワードセキュリティ
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

# 責任：ユーザーデータのバリデーション
class UserValidator:
    def validate_email(self, email):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
    
    def validate_username(self, username):
        if len(username) < 3 or not username.isalnum():
            raise ValueError("Username must be at least 3 alphanumeric characters")

# 責任：ユーザー関連のメール操作
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

# 責任：ユーザーデータの永続化
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
        # 更新ロジック
        pass
    
    def delete(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))

# 責任：ユーザービジネス操作（オーケストレーション）
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

これで各クラスは単一の明確に定義された責任を持ちます：

!!!success "✅ 単一責任の利点"
    **焦点を絞ったクラス**
    - PasswordService：パスワードセキュリティ操作
    - UserValidator：ユーザーデータバリデーションルール
    - UserEmailService：ユーザー関連のメール操作
    - UserRepository：ユーザーデータの永続化
    - UserService：ユーザービジネス操作のオーケストレーション
    
    **明確な変更理由**
    - パスワードアルゴリズムの変更 → PasswordService
    - バリデーションルールの変更 → UserValidator
    - メールテンプレートの変更 → UserEmailService
    - データベーススキーマの変更 → UserRepository
    - ビジネスワークフローの変更 → UserService
    
    **改善されたテスト可能性**
    - パスワードハッシュを独立してテスト
    - バリデーションルールを分離してテスト
    - ユーザー操作のためにメールサービスをモック
    - ビジネスロジックなしでリポジトリをテスト

各クラスは独立して進化できるようになりました。パスワードハッシュの変更がメール機能を壊すリスクはありません。バリデーションの変更はデータベース操作に影響しません。

## 微妙な違反：関心事の混在

神クラスよりも陰湿なのは、微妙な方法で関心事を混在させるクラスです——焦点を絞っているように見えますが、実際には複数の責任を処理しています。

### レポートジェネレーターの問題

販売レポートを生成するクラスを考えてみましょう：

```java
public class SalesReportGenerator {
    private DatabaseConnection db;
    
    public String generateReport(Date startDate, Date endDate) {
        // データベースからデータを取得
        List<Sale> sales = db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
        
        // 統計を計算
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
        
        // HTMLとしてフォーマット
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

このクラスは焦点を絞っているように見えます——販売レポートを生成します。しかし、実際には3つの異なる責任があります：

!!!warning "⚠️ 隠れた複数の責任"
    **データ取得**
    - 販売データのデータベースクエリ
    - SQLクエリの構築
    - データベース接続の処理
    
    **ビジネスロジック**
    - 総収益の計算
    - 製品別収益の集計
    - 統計の計算
    
    **プレゼンテーション**
    - データをHTMLとしてフォーマット
    - レポート構造の定義
    - HTMLエスケープの処理

要件が変更されたらどうなるでしょうか？PDF形式のレポートが必要な場合、このクラスを修正します。データベーススキーマが変更された場合、このクラスを修正します。計算ロジックが変更された場合、このクラスを修正します。3つの異なるアクター（UIチーム、DBA、ビジネスアナリスト）がすべてこの単一のクラスを変更する理由を持っています。

### 関心事の分離へのリファクタリング

責任を焦点を絞ったクラスに分割します：

```java
// 責任：販売データの取得
public class SalesRepository {
    private DatabaseConnection db;
    
    public List<Sale> findByDateRange(Date startDate, Date endDate) {
        return db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
    }
}

// 責任：販売統計の計算
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

// 責任：販売データをHTMLとしてフォーマット
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

// 責任：レポート生成のオーケストレーション
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

これで各クラスは単一の焦点を絞った責任を持ちます：

!!!success "✅ 分離の利点"
    **独立した進化**
    - データ取得に触れずにPDFフォーマッターを追加
    - 計算に影響を与えずにデータベースを変更
    - プレゼンテーションに影響を与えずに計算を修正
    
    **再利用性**
    - 異なるレポートタイプにSalesAnalyzerを使用
    - 他の販売操作にSalesRepositoryを使用
    - 複数のフォーマッター（PDF、Excel、JSON）を作成
    
    **テスト可能性**
    - モックデータで計算をテスト
    - データベースなしでフォーマットをテスト
    - データ取得を独立してテスト

リファクタリングされた設計により、各責任が独立して進化できます。PDFレポートの追加には新しいフォーマッタークラスのみが必要です。計算ロジックの変更はSalesAnalyzerのみに影響します。

## 粒度の罠：過剰なクラス

SRPは神クラスを防ぎますが、過度な適用は逆の問題を引き起こします——数十の小さなクラスへの過度な断片化です。

### 過度な断片化の例

この過度に細かい粒度の設計を考えてみましょう：

```typescript
// 各バリデーションルールに個別のクラス
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

// 各フィールド抽出に個別のクラス
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

// 登録には多くの小さなクラスの調整が必要
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
        
        // 実際にユーザーを登録...
    }
}
```

この設計は行き過ぎています：

!!!error "🚫 過度な断片化の問題"
    **過度な間接化**
    - 単純な操作がクラス階層に埋もれている
    - 全体的な流れを理解するのが困難
    - クラス間のナビゲーションが面倒になる
    
    **人為的な境界**
    - バリデーションルールは自然に一緒に属する
    - フィールド抽出は些細で、クラスは不要
    - クラスのためにクラスを作成している
    
    **保守負担**
    - ナビゲートするファイルが増える
    - 管理する依存関係が増える
    - ボイラープレートコードが増える

### 適切な粒度を見つける

よりバランスの取れたアプローチは、関連する操作をグループ化することです：

```typescript
// 凝集性によってグループ化されたバリデーションルール
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

このバランスの取れた設計：

!!!success "✅ 適切な粒度"
    **凝集的なグループ化**
    - 関連するバリデーションルールが一緒
    - 明確なクラスの目的：ユーザーバリデーション
    - 理解とナビゲートが容易
    
    **合理的な抽象化**
    - クラスは意味のある概念を表す
    - 些細な操作のためにクラスを作成しない
    - SRPと実用主義のバランス
    
    **保守可能**
    - 管理するファイルが少ない
    - 明確な依存関係
    - テストと修正が容易

重要な洞察：SRPは「クラスごとに1つのメソッド」を意味しません。「変更する理由が1つ」を意味します。すべてのユーザーバリデーションルールは同じ理由（ビジネスルールの変更）で変更されるため、一緒に属します。

## 責任の特定：アクターテスト

クラスが複数の責任を持っているかどうかをどのように判断しますか？アクターテストを適用します：誰がこのコードの変更を要求しますか？

### アクターテストの実践

ユーザー認証を処理するクラスを考えてみましょう：

```python
class AuthenticationService:
    def authenticate(self, username, password):
        # 認証情報を検証
        user = self.db.find_user(username)
        if not user or not self.verify_password(password, user.password_hash):
            return None
        
        # セッショントークンを生成
        token = self.generate_token(user.id)
        self.db.save_session(token, user.id)
        
        # 認証をログ記録
        self.logger.info(f"User {username} authenticated")
        
        # 通知を送信
        self.email.send(user.email, "New login detected")
        
        return token
```

アクターテストを適用します：

!!!anote "👥 アクターの特定"
    **セキュリティチーム**
    - パスワード検証アルゴリズムを変更したい
    - トークン生成を修正したい
    - セッション管理を調整したい
    
    **運用チーム**
    - ログフォーマットを変更したい
    - メトリクスを追加したい
    - ログレベルを修正したい
    
    **プロダクトチーム**
    - 通知動作を変更したい
    - 通知設定を追加したい
    - メールテンプレートを修正したい

3つの異なるアクターがこのクラスを変更する理由を持っています。これは分離すべき複数の責任を示しています。

### アクターに基づくリファクタリング

アクターに基づいてクラスを分割します：

```python
# セキュリティチームの責任
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

# 運用チームの責任
class AuthenticationLogger:
    def log_success(self, username):
        self.logger.info(f"User {username} authenticated successfully")
    
    def log_failure(self, username):
        self.logger.warning(f"Failed authentication attempt for {username}")

# プロダクトチームの責任
class LoginNotificationService:
    def notify_login(self, user):
        self.email.send(user.email, "New login detected")

# オーケストレーション
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

これで各アクターは修正する独自のクラスを持ちます：

!!!success "✅ アクターベースの分離"
    **明確な所有権**
    - セキュリティチームはCredentialVerifierとSessionManagerを修正
    - 運用チームはAuthenticationLoggerを修正
    - プロダクトチームはLoginNotificationServiceを修正
    
    **独立した変更**
    - ログの変更はセキュリティに影響しない
    - 通知の変更はセッションに影響しない
    - 各チームが独立して作業
    
    **衝突の削減**
    - 異なるチームが異なるファイルを修正
    - マージ競合が少ない
    - コードレビューの所有権が明確

アクターテストは責任を特定する実用的な方法を提供します：異なる人々が異なる理由で変更を要求する場合、複数の責任がある可能性があります。

## SRPを適用するタイミング：タイミングが重要

SRPは事前にすべてのクラスを分割することを意味しません。早すぎる抽象化は神クラスと同じくらい有害です。

### 三回ルール

複数の責任の証拠が得られるまでクラスを分割しないでください：

!!!tip "🎯 クラスを分割するタイミング"
    **証拠を待つ**
    - 投機的に分割しない
    - 実際にクラスを変更する必要が生じるまで待つ
    - どの部分が一緒に変更されるかを観察
    
    **三回ルール**
    - 一回目：コードを書く
    - 二回目：重複や混在した関心事に注意
    - 三回目：リファクタリングして分離
    
    **分割すべき兆候**
    - 異なる人々が異なる部分の変更を要求
    - 一部の変更が別の部分を壊すリスク
    - テストが無関係な依存関係のモックを必要とする
    - クラスが快適なサイズを超えて成長

早すぎる分割は不要な複雑さを生み出します。責任を分離すべき真の証拠が得られるまで待ちましょう。

### 既存コードのリファクタリング

SRPに従うために既存コードをリファクタリングする場合：

!!!anote "🔧 リファクタリング戦略"
    **テストから始める**
    - 既存の動作のテストを書く
    - リファクタリング前にテストが通ることを確認
    - テストが破壊的変更を防ぐ
    
    **一度に1つの責任を抽出**
    - すべてを一度にリファクタリングしようとしない
    - 1つの明確な責任を抽出
    - テストがまだ通ることを確認
    - 次の責任について繰り返す
    
    **後方互換性を維持**
    - 必要に応じて元のクラスをファサードとして保持
    - 呼び出し元を徐々に移行
    - 移行完了後にファサードを削除

段階的なリファクタリングはリスクを減らし、各ステップを検証できます。

## 結論

単一責任原則は、クラスが焦点を絞った明確に定義された目的を持つことを保証することで、SOLID設計の基盤を形成します。各クラスを単一の変更理由に制限することで、SRPは結合を減らし、テスト可能性を向上させ、コードを理解しやすく保守しやすくします。しかし、SRPの適用には判断が必要です——メソッド数を最小化したり、些細な操作ごとにクラスを作成したりすることではありません。

SRPを効果的に適用する鍵は、「責任」が何を構成するかを理解することです。責任はメソッドや関数ではありません——それは変更する理由であり、通常は異なるアクターやステークホルダーによって駆動されます。アクターテストは複数の責任を特定する実用的な方法を提供します：異なる人々が異なる理由で変更を要求する場合、クラスを分割する必要がある可能性があります。

神クラスは最も明白なSRP違反を表し、データベース操作、ビジネスロジック、バリデーション、メール送信などの複数の無関係な責任を処理します。これらのクラスは、すべての変更が無関係な機能を壊すリスクを伴うため、保守の悪夢となります。神クラスを焦点を絞ったクラス——それぞれが単一の責任を処理——にリファクタリングすることで、保守性とテスト可能性が劇的に向上します。

微妙な違反はより陰湿で、焦点を絞っているように見えますが、実際には関心事を混在させています。データを取得し、計算を実行し、出力をフォーマットするレポートジェネレーターには、分離すべき3つの異なる責任があります。この分離により、各関心事が独立して進化でき、異なるコンテキスト間での再利用が可能になります。

しかし、SRPの過度な適用は逆の問題を引き起こします——数十の小さなクラスへの過度な断片化です。各バリデーションルールやフィールド抽出に個別のクラスを作成することは行き過ぎで、不要な間接化と複雑さを導入します。解決策は、同じ理由で変更される凝集的な操作をグループ化することで適切な粒度を見つけることです。

SRPを適用する際にはタイミングが重要です。早すぎる分割は不要な複雑さを生み出します。三回ルールはリファクタリング前に証拠を待つことを提案します：コードを書き、重複や混在した関心事に注意し、三回目の出現時にリファクタリングします。このアプローチはSRPの利点と早すぎる抽象化のコストのバランスを取ります。

単一責任原則はシンプルでありながら微妙です。「クラスは変更する理由を1つだけ持つべきである」という原則は理解しやすいですが、効果的に適用するには判断が必要です。アクター、変更する理由、凝集性に焦点を当てることで、保守可能で実用的な設計を作成できます——神クラスと過度な断片化の両方を避けることができます。
