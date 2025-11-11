---
title: "DRY 原則：當程式碼重複成為技術債"
date: 2021-08-08
lang: zh-TW
categories: Development
tags: [Best Practices, Software Design, Code Quality]
excerpt: "Don't Repeat Yourself 聽起來簡單，但知道何時應用它需要判斷力。了解何時重複是有害的、何時可接受，以及過早抽象如何比重複更糟。"
thumbnail: /assets/coding/2.png
---

DRY（Don't Repeat Yourself，不要重複自己）原則是軟體開發中最常被引用的準則之一。由 Andy Hunt 和 Dave Thomas 在《程式設計師修煉之道》中提出，它承諾更乾淨的程式碼、更容易的維護和更少的錯誤。然而這個看似簡單的原則——避免重複程式碼——在實踐中變得出乎意料地複雜。開發者掙扎於這些問題：何時重複是可接受的？多少抽象才算太多？遵循 DRY 真的會讓程式碼變得更糟嗎？

本文透過真實場景探討 DRY 原則，從明顯的複製貼上違規到微妙的知識重複。我們將剖析何時應該消除重複、何時暫時容忍它，以及何時過早抽象會造成更多問題。從生產環境程式碼庫和重構經驗中，我們揭示為什麼 DRY 既是必要的又是危險的。

## 理解 DRY 原則

在深入探討何時以及如何應用 DRY 之前，理解這個原則實際上的意義是必要的。DRY 不僅僅是避免複製貼上——它關乎知識的表示。

### 核心概念

DRY 原則指出：「每一項知識在系統中都必須有單一、明確、權威的表示。」這超越了單純的程式碼重複：

!!!anote "📚 DRY 範圍"
    **程式碼重複**
    - 相同或相似的程式碼區塊重複出現
    - 相同邏輯被實作多次
    - 複製貼上的程式設計模式
    - 最明顯的 DRY 違規形式
    
    **知識重複**
    - 業務規則在多處編碼
    - 驗證邏輯分散在各層
    - 常數和配置重複
    - 資料庫結構在程式碼中鏡像
    
    **文件重複**
    - 註解重複程式碼的功能
    - API 文件重複實作內容
    - 相同資訊有多個真相來源
    - 文件來源之間的不一致

這個原則強調「知識」而非「程式碼」，因為真正的問題不是文字相似性——而是在多個地方維護相同的概念。當業務規則改變時，你不應該需要在十個不同的位置更新程式碼。

### 為什麼 DRY 很重要

重複會造成維護負擔並引入錯誤：

!!!warning "⚠️ 重複的成本"
    **維護負擔**
    - 變更需要在多個位置更新
    - 更新時容易遺漏某個實例
    - 增加開發者的認知負荷
    - 使程式碼庫更難理解
    
    **錯誤倍增**
    - 錯誤在所有副本中重複
    - 修復必須套用到所有地方
    - 不一致的修復造成微妙的錯誤
    - 測試負擔倍增
    
    **不一致風險**
    - 副本隨時間分歧
    - 不同情境中的不同行為
    - 難以確定正確版本
    - 造成混淆和錯誤

這些成本隨時間累積。今天的小重複會隨著程式碼庫演進成為維護噩夢。

## 明顯的重複：複製貼上程式設計

最明目張膽的 DRY 違規來自複製貼上程式設計——複製整個程式碼區塊並稍作修改。

### 經典的複製貼上違規

考慮這個網頁應用程式中的常見模式：

```python
# 使用者註冊端點
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    
    # 驗證
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # 建立使用者
    user = User(username=username, email=email, password=hash_password(password))
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

# 個人資料更新端點 - 重複的驗證
@app.route('/profile/update', methods=['POST'])
def update_profile():
    user_id = get_current_user_id()
    username = request.form.get('username')
    email = request.form.get('email')
    
    # 相同的驗證邏輯重複了
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    
    # 更新使用者
    user = User.query.get(user_id)
    user.username = username
    user.email = email
    db.session.commit()
    
    return jsonify({'message': 'Profile updated successfully'}), 200
```

驗證邏輯被重複了。當需求改變時——比如說，使用者名稱最小長度增加到 5 個字元——你必須更新兩個位置。遺漏一個，你就會有不一致的行為。

這是[複製貼上程式設計反模式](/zh-TW/2022/04/Software-Development-Anti-Patterns/)——複製程式碼而不是提取可重用元件，當邏輯需要改變時就會造成維護噩夢。

### 重構為 DRY

將重複的驗證提取為可重用的函式：

```python
# 驗證函式 - 單一真相來源
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

# 註冊端點 - 使用驗證函式
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

# 個人資料更新端點 - 重用相同的驗證
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

現在驗證規則只存在於一個地方。變更會自動傳播到所有使用點。

### 維護的勝利

重構後的版本展示了 DRY 的價值：

!!!success "✅ DRY 的好處"
    **單一真相來源**
    - 驗證規則只定義一次
    - 變更自動更新所有端點
    - 沒有不一致驗證的風險
    
    **更容易測試**
    - 獨立測試驗證函式
    - 端點測試專注於業務邏輯
    - 減少測試重複
    
    **更好的可讀性**
    - 端點程式碼專注於工作流程
    - 驗證細節被抽象化
    - 沒有重複程式碼，意圖更清晰

這是 DRY 最好的狀態：消除沒有任何目的的明顯重複。

## 微妙的重複：分散的業務邏輯

比複製貼上重複更隱蔽的是分散在程式碼庫中的業務邏輯——相同的概念在多個地方以不同方式實作。

### 分散的計算問題

考慮一個電子商務系統計算訂單總額：

```javascript
// 在購物車元件中
function calculateCartTotal(items) {
    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    // 對超過 $100 的訂單套用 10% 折扣
    if (total > 100) {
        total = total * 0.9;
    }
    return total;
}

// 在訂單確認元件中 - 重複的邏輯
function calculateOrderTotal(order) {
    let subtotal = 0;
    for (const item of order.items) {
        subtotal += item.price * item.quantity;
    }
    // 相同的折扣邏輯重複了
    if (subtotal > 100) {
        subtotal = subtotal * 0.9;
    }
    return subtotal;
}

// 在發票產生器中 - 再次重複
function generateInvoice(order) {
    let amount = 0;
    order.items.forEach(item => {
        amount += item.price * item.quantity;
    });
    // 折扣邏輯第三次重複
    if (amount > 100) {
        amount = amount - (amount * 0.1);
    }
    return {
        orderId: order.id,
        total: amount,
        // ... 其他欄位
    };
}
```

相同業務規則的三種不同實作。當折扣改為超過 $150 的訂單 15% 折扣時，你必須找到並更新所有三個位置。遺漏一個，客戶就會在應用程式的不同部分看到不同的總額。

### 集中化業務邏輯

將業務規則提取為單一、權威的實作：

```javascript
// 業務邏輯層 - 單一真相來源
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

// 購物車 - 使用集中化的邏輯
function calculateCartTotal(items) {
    return OrderCalculator.calculateTotal(items);
}

// 訂單確認 - 使用相同的邏輯
function calculateOrderTotal(order) {
    return OrderCalculator.calculateTotal(order.items);
}

// 發票產生器 - 使用相同的邏輯
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

業務規則現在只存在於一個地方。折扣門檻和比率是可配置的常數。所有元件使用相同的計算邏輯，保證一致性。

!!!tip "🎯 業務邏輯集中化"
    **識別業務規則**
    - 實作業務需求的計算
    - 強制業務約束的驗證規則
    - 代表業務流程的工作流程
    - 任何可能基於業務決策而改變的邏輯
    
    **建立領域層**
    - 將業務邏輯與展示和基礎設施分離
    - 使業務規則明確且可測試
    - 在程式碼中使用領域特定語言
    - 記錄業務規則來源（需求、法規）
    
    **強制單一來源**
    - 所有元件使用集中化的業務邏輯
    - 不重新實作業務規則
    - 配置優於重複
    - 程式碼審查捕捉分散的邏輯

## 何時重複是可接受的

並非所有重複都是有害的。有時重複是正確的選擇，至少暫時如此。

### 巧合的重複

看起來相似但代表不同概念的程式碼不應該去重複化：

```python
# 使用者身份驗證
def validate_user_password(password):
    if len(password) < 8:
        raise ValueError('Password too short')
    return True

# WiFi 密碼配置
def validate_wifi_password(password):
    if len(password) < 8:
        raise ValueError('Password too short')
    return True
```

這些函式看起來相同，但它們驗證的是不同的東西。使用者密碼可能很快就需要特殊字元，而 WiFi 密碼可能需要不同的規則。將它們合併會在不相關的概念之間建立耦合：

```python
# 不好：過早抽象
def validate_password(password, password_type):
    if password_type == 'user':
        if len(password) < 8:
            raise ValueError('Password too short')
        # 未來：檢查特殊字元
    elif password_type == 'wifi':
        if len(password) < 8:
            raise ValueError('Password too short')
        # 未來：不同的規則
    return True
```

這個抽象比重複更糟。它耦合了不相關的概念，使未來的變更更困難。

!!!anote "🔍 巧合 vs. 真實重複"
    **巧合的重複（保持分離）**
    - 程式碼現在碰巧看起來相似
    - 代表不同的領域概念
    - 未來可能會分歧
    - 因不同原因而改變
    
    **真實的重複（消除）**
    - 相同概念實作多次
    - 因相同原因一起改變
    - 代表單一知識片段
    - 分歧表示錯誤

「三次法則」有幫助：容忍重複直到你有三個實例，然後考慮抽象。這可以防止基於巧合相似性的過早抽象。

### 跨邊界的重複

跨架構邊界的重複通常是可接受的：

```python
# 資料庫模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False)

# API 回應模型
class UserResponse:
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

# 前端 TypeScript 介面
interface User {
    id: number;
    username: string;
    email: string;
}
```

User 結構在資料庫、後端和前端之間重複。這種重複是有意的——它解耦了各層。資料庫模型可以改變而不影響 API 契約。API 可以演進而不強制前端改變。

!!!tip "🏗️ 架構邊界"
    **何時重複解耦**
    - 層之間（資料庫、業務邏輯、展示）
    - 微服務架構中的服務之間
    - 內部和外部 API 之間
    - 具有不同生命週期的模組之間
    
    **邊界重複的好處**
    - 各層可以獨立演進
    - 變更不會跨邊界級聯
    - 元件之間的清晰契約
    - 更容易獨立測試

## 過早抽象的危險

過度熱衷地應用 DRY 會導致過早抽象——在充分理解問題之前就建立抽象。

### 過度抽象的混亂

開發者看到兩個相似的函式就立即抽象：

```javascript
// 原始函式
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

// 過早抽象
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
    // ... 更多電子郵件類型
    
    sendEmail(user.email, subject, body);
}
```

這個抽象比原始的重複更糟：

!!!error "🚫 過早抽象的問題"
    **增加的複雜性**
    - 單一函式處理多個不相關的情況
    - 條件邏輯隨每個電子郵件類型增長
    - 難以理解每個電子郵件類型的作用
    - 難以測試所有分支
    
    **脆弱的設計**
    - 新增電子郵件類型需要修改中央函式
    - 變更有破壞現有電子郵件類型的風險
    - extraData 參數變成欄位的大雜燴
    - 失去類型安全（extraData 需要哪些欄位？）
    
    **更難改變**
    - 無法修改一個電子郵件類型而不影響其他類型
    - 重構需要理解所有電子郵件類型
    - 害怕破壞現有功能
    - 諷刺的是比重複更難維護

### 更好的方法

與其過早抽象，不如使用組合和清晰的介面：

```javascript
// 電子郵件範本介面
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

// 特定的電子郵件類型
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

這個設計消除了重複（電子郵件發送邏輯），同時保持電子郵件類型獨立且易於修改。

!!!success "✅ 良好抽象原則"
    **等待模式浮現**
    - 不要在第一次重複時就抽象
    - 等到你有 3 個以上的實例
    - 在抽象之前理解程式碼如何變化
    
    **偏好組合而非條件**
    - 使用繼承或組合
    - 避免大型條件區塊
    - 每個變體都是獨立的
    
    **保持抽象簡單**
    - 單一職責原則
    - 清晰、專注的介面
    - 易於理解和測試

## 真實世界的重構故事

我曾經接手一個有嚴重重複問題的程式碼庫。應用程式有機地成長，開發者為了趕上截止日期而複製貼上程式碼。結果：相同的業務邏輯在數十個檔案中以不同方式實作。

### 發現問題

在一次例行的錯誤修復中，我發現折扣計算會根據應用程式中呼叫的位置產生不同的結果。購物車顯示一個總額，結帳頁面顯示另一個，發票又顯示第三個。全都略有不同。

!!!error "🔍 重複災難"
    **我發現的問題**
    - 折扣邏輯在 12 個不同檔案中重複
    - 每個實作略有不同
    - 有些包含稅金，有些沒有
    - 不同的四捨五入策略
    - 邊緣情況處理不一致
    
    **影響**
    - 客戶抱怨總額不斷變化
    - 支援團隊無法解釋差異
    - 會計對帳噩夢
    - 計算錯誤導致收入損失
    - 損害客戶信任

### 重構過程

我花了兩週時間提取和集中化業務邏輯：

```python
# 之前：分散在 12 個檔案中，有各種變化
# 檔案 1:
total = sum(item.price * item.qty for item in items)
if total > 100:
    total = total * 0.9

# 檔案 2:
subtotal = 0
for item in items:
    subtotal += item.price * item.qty
discount = subtotal * 0.1 if subtotal > 100 else 0
total = subtotal - discount

# 檔案 3:
amount = sum([i.price * i.qty for i in items])
if amount >= 100:
    amount = amount - (amount * 0.1)
# ... 還有 9 個變化

# 之後：單一真相來源
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

重構揭示了 12 個實作中有 8 個有錯誤。有些使用浮點運算（造成四捨五入錯誤），其他有門檻檢查的差一錯誤，還有幾個忘記處理空購物車。

### 結果

部署集中化的定價引擎後：

!!!success "✅ 重構成果"
    **立即改善**
    - 整個應用程式的總額一致
    - 客戶投訴降至零
    - 會計對帳簡化
    - 收入增加（錯誤正在損失金錢）
    
    **長期好處**
    - 新的定價規則在一個地方實作
    - A/B 測試定價策略變得可能
    - 定價邏輯的全面測試套件
    - 對進行定價變更有信心
    
    **學到的教訓**
    - 重複隱藏錯誤
    - 不一致損害使用者信任
    - 重構很快就能回本
    - DRY 關乎正確性，不只是可維護性

這次經驗強化了 DRY 不僅僅是減少程式碼——它是透過單一真相來源確保正確性。

## 應用 DRY：實用指南

知道何時以及如何應用 DRY 需要判斷力。這些指南有助於導航決策：

!!!tip "🎯 DRY 決策框架"
    **何時消除重複：**
    - 多個地方有相同的業務邏輯
    - 變更需要在多個位置更新
    - 不一致造成錯誤或混淆
    - 重複沒有架構目的
    
    **何時容忍重複：**
    - 程式碼巧合相似
    - 重複解耦架構層
    - 抽象會是過早的
    - 你有少於 3 個實例
    
    **謹慎重構：**
    - 在抽象之前理解問題
    - 偏好簡單的抽象而非複雜的
    - 使用組合而非條件邏輯
    - 重構後徹底測試
    - 記錄抽象的目的

## 結論

DRY 原則——Don't Repeat Yourself（不要重複自己）——是軟體品質的基石，但其應用需要細膩和判斷力。其核心在於，DRY 不是要消除每一個看起來相似的程式碼實例；而是確保每一項知識在系統中都有單一、權威的表示。

透過複製貼上程式設計的明顯重複會造成立即的維護負擔。當驗證邏輯、計算或業務規則分散在多個檔案中時，變更變得容易出錯，不一致不可避免。將這種重複提取為可重用的函式或類別提供了明確的好處：單一真相來源、更容易測試，以及減少錯誤倍增。

微妙的重複——分散在元件中的業務邏輯——構成更大的危險，因為它更難檢測。當相同的概念在多個地方以不同方式實作時，程式碼庫就成為不一致的雷區。將業務邏輯集中到領域層確保一致性，並使業務規則明確且可測試。

然而，並非所有重複都是有害的。巧合的重複——碰巧看起來相似但代表不同概念的程式碼——應該保持分離。基於表面相似性的過早抽象會在不相關的概念之間建立耦合，使未來的變更更困難。三次法則提供了指導：容忍重複直到你有三個實例，然後考慮抽象是否合理。

跨架構邊界的重複通常有其目的。在資料庫模型、API 契約和前端介面之間重複資料結構可以解耦各層，並允許獨立演進。這種有意的重複提供了靈活性和元件之間的清晰契約。

過早抽象的危險不容小覷。過度熱衷地應用 DRY 會導致複雜的、充滿條件的函式，比原始的重複更難理解和維護。良好的抽象來自理解多個實例的模式，而不是消除你看到的第一個重複。偏好組合和清晰的介面，而非條件邏輯和參數驅動的行為。

真實世界的經驗表明，重複隱藏錯誤並造成損害使用者信任的不一致。將重複的業務邏輯重構為單一真相來源不僅改善可維護性，還經常揭示並修復存在於分散實作中的錯誤。重構的投資透過增加的正確性和進行變更的信心而回本。

有效應用 DRY 的關鍵在於區分有害的重複和可接受的相似性。問問自己：這個重複代表相同的知識嗎？這些片段會因相同原因一起改變嗎？消除這個重複會在不相關的概念之間建立耦合嗎？答案會指導你是否應該重構或容忍重複。

DRY 最終關乎可維護性和正確性。當業務規則存在於多個地方時，變更是有風險的，不一致是不可避免的。當知識有單一權威的表示時，變更會自動傳播，正確性更容易驗證。但實現這一點需要判斷力——知道何時抽象、何時等待，以及何時重複有其目的。

在反射性地消除每一個相似程式碼的實例之前，考慮你是在移除有害的重複還是在建立過早的抽象。目標不是零重複——而是一個知識被清晰、權威地表示一次，同時保持演進的靈活性的程式碼庫。
