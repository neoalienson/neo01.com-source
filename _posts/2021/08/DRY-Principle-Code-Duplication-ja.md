---
title: "DRY 原則：コードの重複が技術的負債になるとき"
date: 2021-08-08
lang: ja
categories: Development
tags: [Best Practices, Software Design, Code Quality]
excerpt: "Don't Repeat Yourself はシンプルに聞こえますが、いつ適用すべきかを知るには判断力が必要です。重複が有害な場合、許容される場合、そして早すぎる抽象化が重複よりも悪い場合を理解しましょう。"
thumbnail: /assets/coding/2.png
---

DRY（Don't Repeat Yourself、自分自身を繰り返すな）原則は、ソフトウェア開発で最もよく引用される格言の一つです。Andy Hunt と Dave Thomas が『達人プログラマー』で提唱したこの原則は、よりクリーンなコード、容易なメンテナンス、そしてバグの削減を約束します。しかし、この一見シンプルな原則——コードの重複を避ける——は、実践では驚くほど複雑になります。開発者は次のような疑問に悩まされます：いつ重複は許容されるのか？どれだけの抽象化が多すぎるのか？DRY に従うことで実際にコードが悪化することはあるのか？

本記事では、明白なコピー＆ペーストの違反から微妙な知識の重複まで、実際のシナリオを通じて DRY 原則を検証します。重複をいつ排除すべきか、いつ一時的に許容すべきか、そして早すぎる抽象化がいつより多くの問題を引き起こすかを分析します。本番環境のコードベースとリファクタリングの経験から、DRY がなぜ不可欠であり、同時に危険でもあるのかを明らかにします。

## DRY 原則の理解

DRY をいつ、どのように適用するかに入る前に、この原則が実際に何を意味するのかを理解することが重要です。DRY は単にコピー＆ペーストを避けることではなく、知識の表現に関するものです。

### 核となる概念

DRY 原則は次のように述べています：「すべての知識は、システム内で単一の、明確な、権威ある表現を持たなければならない。」これは単なるコードの重複を超えています：

!!!anote "📚 DRY の範囲"
    **コードの重複**
    - 同一または類似のコードブロックの繰り返し
    - 同じロジックが複数回実装される
    - コピー＆ペーストのプログラミングパターン
    - 最も目に見える DRY 違反の形態
    
    **知識の重複**
    - ビジネスルールが複数の場所にエンコードされる
    - 検証ロジックが層をまたいで散在
    - 定数と設定が重複
    - データベーススキーマがコード構造にミラーリング
    
    **ドキュメントの重複**
    - コメントがコードの動作を繰り返す
    - API ドキュメントが実装を複製
    - 同じ情報に対する複数の真実の源
    - ドキュメントソース間の不整合

この原則が「コード」ではなく「知識」を強調するのは、真の問題がテキストの類似性ではなく、複数の場所で同じ概念を維持することだからです。ビジネスルールが変更されたとき、10 の異なる場所でコードを更新する必要があってはなりません。

### なぜ DRY が重要なのか

重複はメンテナンスの負担を生み出し、バグを引き起こします：

!!!warning "⚠️ 重複のコスト"
    **メンテナンスのオーバーヘッド**
    - 変更には複数の場所での更新が必要
    - 更新時に一つのインスタンスを見逃しやすい
    - 開発者の認知負荷が増加
    - コードベースの理解が困難になる
    
    **バグの増殖**
    - バグがすべてのコピーに複製される
    - 修正をすべての場所に適用する必要がある
    - 不整合な修正が微妙なバグを生む
    - テストの負担が倍増
    
    **不整合のリスク**
    - コピーが時間とともに分岐
    - 異なるコンテキストでの異なる動作
    - 正しいバージョンの判断が困難
    - 混乱とエラーを生む

これらのコストは時間とともに複利的に増大します。今日の小さな重複は、コードベースが進化するにつれてメンテナンスの悪夢になります。

## 明白な重複：コピー＆ペーストプログラミング

最も露骨な DRY 違反は、コピー＆ペーストプログラミングから生じます——コードブロック全体を複製し、わずかな変更を加えることです。

### 典型的なコピー＆ペースト違反

ウェブアプリケーションでよく見られるパターンを考えてみましょう：

```python
# ユーザー登録エンドポイント
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    
    # 検証
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # ユーザー作成
    user = User(username=username, email=email, password=hash_password(password))
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

# プロフィール更新エンドポイント - 重複した検証
@app.route('/profile/update', methods=['POST'])
def update_profile():
    user_id = get_current_user_id()
    username = request.form.get('username')
    email = request.form.get('email')
    
    # 同じ検証ロジックが重複
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    
    # ユーザー更新
    user = User.query.get(user_id)
    user.username = username
    user.email = email
    db.session.commit()
    
    return jsonify({'message': 'Profile updated successfully'}), 200
```

検証ロジックが重複しています。要件が変更されたとき——例えば、ユーザー名の最小長が 5 文字に増加した場合——両方の場所を更新する必要があります。一つを見逃すと、不整合な動作になります。

これは[コピー＆ペーストプログラミングのアンチパターン](/ja/2022/04/Software-Development-Anti-Patterns/)——再利用可能なコンポーネントを抽出する代わりにコードを複製し、ロジックを変更する必要があるときにメンテナンスの悪夢を生み出します。

### DRY へのリファクタリング

重複した検証を再利用可能な関数に抽出します：

```python
# 検証関数 - 単一の真実の源
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

# 登録エンドポイント - 検証関数を使用
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

# プロフィール更新エンドポイント - 同じ検証を再利用
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

これで検証ルールは一箇所にのみ存在します。変更はすべての使用箇所に自動的に伝播します。

### メンテナンスの勝利

リファクタリング後のバージョンは DRY の価値を示しています：

!!!success "✅ DRY の利点"
    **単一の真実の源**
    - 検証ルールは一度だけ定義
    - 変更がすべてのエンドポイントを自動的に更新
    - 不整合な検証のリスクがない
    
    **テストの容易さ**
    - 検証関数を独立してテスト
    - エンドポイントのテストはビジネスロジックに集中
    - テストの重複を削減
    
    **可読性の向上**
    - エンドポイントのコードはワークフローに集中
    - 検証の詳細が抽象化される
    - 繰り返しコードなしで意図が明確

これは DRY の最良の状態です：目的のない明白な重複を排除することです。

## 微妙な重複：散在するビジネスロジック

コピー＆ペーストの重複よりも陰湿なのは、コードベース全体に散在するビジネスロジックです——同じ概念が複数の場所で異なる方法で実装されています。

### 散在する計算の問題

注文合計を計算する e コマースシステムを考えてみましょう：

```javascript
// ショッピングカートコンポーネント内
function calculateCartTotal(items) {
    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    // $100 を超える注文に 10% 割引を適用
    if (total > 100) {
        total = total * 0.9;
    }
    return total;
}

// 注文確認コンポーネント内 - 重複したロジック
function calculateOrderTotal(order) {
    let subtotal = 0;
    for (const item of order.items) {
        subtotal += item.price * item.quantity;
    }
    // 同じ割引ロジックが重複
    if (subtotal > 100) {
        subtotal = subtotal * 0.9;
    }
    return subtotal;
}

// 請求書生成器内 - 再び重複
function generateInvoice(order) {
    let amount = 0;
    order.items.forEach(item => {
        amount += item.price * item.quantity;
    });
    // 割引ロジックが3回目の重複
    if (amount > 100) {
        amount = amount - (amount * 0.1);
    }
    return {
        orderId: order.id,
        total: amount,
        // ... その他のフィールド
    };
}
```

同じビジネスルールの3つの異なる実装です。割引が $150 を超える注文に 15% に変更されたとき、3つすべての場所を見つけて更新する必要があります。一つを見逃すと、顧客はアプリケーションの異なる部分で異なる合計を見ることになります。

### ビジネスロジックの集中化

ビジネスルールを単一の権威ある実装に抽出します：

```javascript
// ビジネスロジック層 - 単一の真実の源
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

// ショッピングカート - 集中化されたロジックを使用
function calculateCartTotal(items) {
    return OrderCalculator.calculateTotal(items);
}

// 注文確認 - 同じロジックを使用
function calculateOrderTotal(order) {
    return OrderCalculator.calculateTotal(order.items);
}

// 請求書生成器 - 同じロジックを使用
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

ビジネスルールは今や一箇所にのみ存在します。割引の閾値と率は設定可能な定数です。すべてのコンポーネントが同じ計算ロジックを使用し、一貫性を保証します。

!!!tip "🎯 ビジネスロジックの集中化"
    **ビジネスルールの識別**
    - ビジネス要件を実装する計算
    - ビジネス制約を強制する検証ルール
    - ビジネスプロセスを表すワークフロー
    - ビジネス上の決定に基づいて変更される可能性のあるロジック
    
    **ドメイン層の作成**
    - ビジネスロジックをプレゼンテーションとインフラストラクチャから分離
    - ビジネスルールを明示的でテスト可能にする
    - コード内でドメイン固有の言語を使用
    - ビジネスルールのソース（要件、規制）を文書化
    
    **単一ソースの強制**
    - すべてのコンポーネントが集中化されたビジネスロジックを使用
    - ビジネスルールの再実装なし
    - 重複よりも設定を優先
    - コードレビューで散在するロジックを捕捉

## 重複が許容される場合

すべての重複が有害なわけではありません。時には重複が正しい選択であり、少なくとも一時的にはそうです。

### 偶然の重複

似ているように見えても異なる概念を表すコードは、重複を排除すべきではありません：

```python
# ユーザー認証
def validate_user_password(password):
    if len(password) < 8:
        raise ValueError('Password too short')
    return True

# WiFi パスワード設定
def validate_wifi_password(password):
    if len(password) < 8:
        raise ValueError('Password too short')
    return True
```

これらの関数は同一に見えますが、異なるものを検証しています。ユーザーパスワードはすぐに特殊文字が必要になるかもしれませんが、WiFi パスワードは異なるルールが必要かもしれません。それらを結合すると、無関係な概念間に結合が生まれます：

```python
# 悪い例：早すぎる抽象化
def validate_password(password, password_type):
    if password_type == 'user':
        if len(password) < 8:
            raise ValueError('Password too short')
        # 将来：特殊文字をチェック
    elif password_type == 'wifi':
        if len(password) < 8:
            raise ValueError('Password too short')
        # 将来：異なるルール
    return True
```

この抽象化は重複よりも悪いです。無関係な概念を結合し、将来の変更を困難にします。

!!!anote "🔍 偶然の重複 vs. 真の重複"
    **偶然の重複（分離を維持）**
    - コードが今たまたま似ている
    - 異なるドメイン概念を表す
    - 将来分岐する可能性が高い
    - 異なる理由で変更される
    
    **真の重複（排除）**
    - 同じ概念が複数回実装される
    - 同じ理由で一緒に変更される
    - 単一の知識の断片を表す
    - 分岐はバグを示す

「三回ルール」が役立ちます：3つのインスタンスができるまで重複を許容し、その後抽象化を検討します。これにより、偶然の類似性に基づく早すぎる抽象化を防ぎます。

### 境界を越えた重複

アーキテクチャの境界を越えた重複は、しばしば許容されます：

```python
# データベースモデル
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False)

# API レスポンスモデル
class UserResponse:
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

# フロントエンド TypeScript インターフェース
interface User {
    id: number;
    username: string;
    email: string;
}
```

User 構造はデータベース、バックエンド、フロントエンド間で重複しています。この重複は意図的です——層を分離します。データベースモデルは API 契約に影響を与えずに変更できます。API はフロントエンドの変更を強制せずに進化できます。

!!!tip "🏗️ アーキテクチャの境界"
    **重複が分離する場合**
    - 層間（データベース、ビジネスロジック、プレゼンテーション）
    - マイクロサービスアーキテクチャのサービス間
    - 内部 API と外部 API 間
    - 異なるライフサイクルを持つモジュール間
    
    **境界重複の利点**
    - 層が独立して進化できる
    - 変更が境界を越えてカスケードしない
    - コンポーネント間の明確な契約
    - 独立したテストが容易

## 早すぎる抽象化の危険性

DRY の過度な適用は早すぎる抽象化につながります——問題を十分に理解する前に抽象化を作成することです。

### 過度に抽象化された混乱

開発者が2つの類似した関数を見て、すぐに抽象化します：

```javascript
// 元の関数
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

// 早すぎる抽象化
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
    // ... さらに多くのメールタイプ
    
    sendEmail(user.email, subject, body);
}
```

この抽象化は元の重複よりも悪いです：

!!!error "🚫 早すぎる抽象化の問題"
    **複雑性の増加**
    - 単一の関数が複数の無関係なケースを処理
    - 条件ロジックが各メールタイプとともに成長
    - 各メールタイプが何をするのか理解が困難
    - すべてのブランチをテストするのが難しい
    
    **脆弱な設計**
    - メールタイプの追加には中央関数の変更が必要
    - 変更が既存のメールタイプを壊すリスク
    - extraData パラメータがフィールドの寄せ集めになる
    - 型安全性の喪失（extraData にはどのフィールドが必要？）
    
    **変更の困難さ**
    - 他のタイプに影響を与えずに一つのメールタイプを変更できない
    - リファクタリングにはすべてのメールタイプの理解が必要
    - 既存機能を壊すことへの恐れ
    - 皮肉にも重複よりもメンテナンスが困難

### より良いアプローチ

早すぎる抽象化の代わりに、コンポジションと明確なインターフェースを使用します：

```javascript
// メールテンプレートインターフェース
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

// 特定のメールタイプ
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

// 使用方法
new WelcomeEmail(user).send();
new PasswordResetEmail(user, resetLink).send();
```

この設計は重複（メール送信ロジック）を排除しながら、メールタイプを独立させ、変更を容易にします。

!!!success "✅ 良い抽象化の原則"
    **パターンが現れるのを待つ**
    - 最初の重複で抽象化しない
    - 3つ以上のインスタンスができるまで待つ
    - 抽象化する前にコードがどのように変化するかを理解
    
    **条件よりもコンポジションを優先**
    - 継承またはコンポジションを使用
    - 大きな条件ブロックを避ける
    - 各バリアントは独立
    
    **抽象化をシンプルに保つ**
    - 単一責任の原則
    - 明確で焦点を絞ったインターフェース
    - 理解とテストが容易

## 実世界のリファクタリングストーリー

私はかつて、深刻な重複問題を抱えたコードベースを引き継ぎました。アプリケーションは有機的に成長し、開発者は締め切りに間に合わせるためにコードをコピー＆ペーストしていました。結果：同じビジネスロジックが数十のファイルで異なる方法で実装されていました。

### 発見

日常的なバグ修正中に、割引計算がアプリケーション内のどこで呼び出されるかによって異なる結果を生成することを発見しました。ショッピングカートは一つの合計を表示し、チェックアウトページは別の合計を、請求書はさらに別の合計を表示していました。すべてわずかに異なっていました。

!!!error "🔍 重複の災害"
    **発見したこと**
    - 割引ロジックが 12 の異なるファイルで重複
    - 各実装がわずかに異なる
    - 一部は税を含み、他は含まない
    - 異なる丸め戦略
    - エッジケースの処理が不整合
    
    **影響**
    - 顧客が変化する合計について苦情
    - サポートチームが不一致を説明できない
    - 会計の照合が悪夢
    - 計算エラーによる収益損失
    - 顧客の信頼を損なう

### リファクタリング

私は2週間かけてビジネスロジックを抽出し、集中化しました：

```python
# 以前：12 のファイルに散在し、様々なバリエーション
# ファイル 1:
total = sum(item.price * item.qty for item in items)
if total > 100:
    total = total * 0.9

# ファイル 2:
subtotal = 0
for item in items:
    subtotal += item.price * item.qty
discount = subtotal * 0.1 if subtotal > 100 else 0
total = subtotal - discount

# ファイル 3:
amount = sum([i.price * i.qty for i in items])
if amount >= 100:
    amount = amount - (amount * 0.1)
# ... さらに 9 つのバリエーション

# 以後：単一の真実の源
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

リファクタリングにより、12 の実装のうち 8 つにバグがあることが明らかになりました。一部は浮動小数点演算を使用し（丸めエラーを引き起こす）、他は閾値チェックでオフバイワンエラーがあり、いくつかは空のカートの処理を忘れていました。

### 結果

集中化された価格設定エンジンをデプロイした後：

!!!success "✅ リファクタリングの成果"
    **即座の改善**
    - アプリケーション全体で一貫した合計
    - 顧客の苦情がゼロに減少
    - 会計の照合が簡素化
    - 収益が増加（バグがお金を失わせていた）
    
    **長期的な利点**
    - 新しい価格設定ルールを一箇所で実装
    - 価格設定戦略の A/B テストが可能に
    - 価格設定ロジックの包括的なテストスイート
    - 価格設定変更を行う自信
    
    **学んだ教訓**
    - 重複はバグを隠す
    - 不整合はユーザーの信頼を損なう
    - リファクタリングはすぐに元が取れる
    - DRY は保守性だけでなく正確性に関するもの

この経験は、DRY が単にコードを減らすことではなく、単一の真実の源を通じて正確性を確保することであることを強化しました。

## DRY の適用：実用的なガイドライン

DRY をいつ、どのように適用するかを知るには判断力が必要です。これらのガイドラインが意思決定をナビゲートするのに役立ちます：

!!!tip "🎯 DRY 意思決定フレームワーク"
    **重複を排除する場合：**
    - 複数の場所に同じビジネスロジック
    - 変更に複数の場所での更新が必要
    - 不整合がバグや混乱を引き起こす
    - 重複がアーキテクチャ上の目的を果たさない
    
    **重複を許容する場合：**
    - コードが偶然似ている
    - 重複がアーキテクチャ層を分離
    - 抽象化が早すぎる
    - 3つ未満のインスタンス
    
    **慎重にリファクタリング：**
    - 抽象化する前に問題を理解
    - 複雑なものよりもシンプルな抽象化を優先
    - 条件ロジックよりもコンポジションを使用
    - リファクタリング後に徹底的にテスト
    - 抽象化の目的を文書化

## 結論

DRY 原則——Don't Repeat Yourself（自分自身を繰り返すな）——はソフトウェア品質の礎石ですが、その適用には繊細さと判断力が必要です。その核心において、DRY は似たように見えるコードのすべてのインスタンスを排除することではなく、各知識の断片がシステム内で単一の権威ある表現を持つことを保証することです。

コピー＆ペーストプログラミングによる明白な重複は、即座のメンテナンス負担を生み出します。検証ロジック、計算、またはビジネスルールが複数のファイルに散在している場合、変更はエラーが発生しやすくなり、不整合は避けられません。この重複を再利用可能な関数やクラスに抽出することで、明確な利点が得られます：単一の真実の源、テストの容易さ、そしてバグの増殖の削減。

微妙な重複——コンポーネント全体に散在するビジネスロジック——は、検出が困難であるため、より大きな危険をもたらします。同じ概念が複数の場所で異なる方法で実装されている場合、コードベースは不整合の地雷原になります。ビジネスロジックをドメイン層に集中化することで、一貫性が保証され、ビジネスルールが明示的でテスト可能になります。

しかし、すべての重複が有害なわけではありません。偶然の重複——たまたま似ているように見えても異なる概念を表すコード——は分離したままにすべきです。表面的な類似性に基づく早すぎる抽象化は、無関係な概念間に結合を生み出し、将来の変更を困難にします。三回ルールがガイダンスを提供します：3つのインスタンスができるまで重複を許容し、その後抽象化が正当化されるかどうかを検討します。

アーキテクチャの境界を越えた重複は、しばしば目的を果たします。データベースモデル、API 契約、フロントエンドインターフェース間でデータ構造を重複させることで、層が分離され、独立した進化が可能になります。この意図的な重複は、柔軟性とコンポーネント間の明確な契約を提供します。

早すぎる抽象化の危険性は過小評価できません。DRY の過度な適用は、元の重複よりも理解とメンテナンスが困難な、複雑で条件に満ちた関数につながります。良い抽象化は、複数のインスタンスにわたるパターンを理解することから生まれるのであって、最初に見た重複を排除することからではありません。条件ロジックやパラメータ駆動の動作よりも、コンポジションと明確なインターフェースを優先してください。

実世界の経験は、重複がバグを隠し、ユーザーの信頼を損なう不整合を生み出すことを示しています。重複したビジネスロジックを単一の真実の源にリファクタリングすることは、保守性を向上させるだけでなく、散在する実装に存在していたバグを明らかにし、修正することがよくあります。リファクタリングへの投資は、正確性の向上と変更を行う自信を通じて元が取れます。

DRY を効果的に適用する鍵は、有害な重複と許容される類似性を区別することにあります。自問してください：この重複は同じ知識を表していますか？これらの断片は同じ理由で一緒に変更されますか？この重複を排除することで、無関係な概念間に結合が生まれますか？答えが、リファクタリングすべきか重複を許容すべきかを導きます。

DRY は最終的に保守性と正確性に関するものです。ビジネスルールが複数の場所に存在する場合、変更はリスクが高く、不整合は避けられません。知識が単一の権威ある表現を持つ場合、変更は自動的に伝播し、正確性の検証が容易になります。しかし、これを達成するには判断力が必要です——いつ抽象化するか、いつ待つか、そしていつ重複が目的を果たすかを知ることです。

似たようなコードのすべてのインスタンスを反射的に排除する前に、有害な重複を取り除いているのか、早すぎる抽象化を作成しているのかを考えてください。目標はゼロ重複ではなく、知識が一度、明確に、権威を持って表現され、同時に進化する柔軟性を維持するコードベースです。
