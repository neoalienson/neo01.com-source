---
title: "軟體開發反模式：當良好意圖導致糟糕程式碼"
date: 2022-04-01
categories: Development
tags: [Software Engineering, Best Practices, Code Quality]
excerpt: "反模式是看似合理但會製造更多問題的常見解決方案。學會識別並避免這些陷阱，防止它們破壞你的程式碼庫。"
lang: zh-TW
thumbnail: /assets/coding/1.png
---

反模式具有誘惑性。它們看起來像是常見問題的解決方案，通常源於良好的意圖和看似合理的推理。與立即崩潰的錯誤不同，反模式是有效的——至少在最初是這樣。它們通過程式碼審查，滿足即時需求，並發布到生產環境。問題會在後期出現：維護噩夢、效能下降，以及使未來變更成本呈指數級增長的架構僵化。

本文探討軟體開發中普遍存在的反模式，從程式碼層級錯誤到架構決策。我們將剖析這些模式為何出現、如何識別它們，以及應該採取什麼替代方案。借鑑真實程式碼庫和產業經驗，我們揭示良好意圖如何以微妙的方式導致糟糕程式碼。

## 反模式即技術債務

你引入的每個反模式都會產生[技術債務](/zh-TW/2020/07/Technical-Debt-The-Hidden-Cost-of-Moving-Fast/)——一種隨時間複利的隱性成本。就像金融債務一樣，反模式最初看似無害，但會隨著每次互動累積利息：

!!!warning "💸 複利成本"
    **初始實作**
    - 反模式預先節省時間
    - 程式碼工作並發布到生產環境
    - 滿足即時需求
    
    **利息支付開始**
    - 下一個開發者花費額外時間理解程式碼
    - 由於複雜性，錯誤修復需要更長時間
    - 新功能需要變通方法
    - 測試變得更加困難
    
    **債務複利**
    - 更多程式碼建立在反模式之上
    - 變更變得更有風險且更昂貴
    - 隨著複雜性增長，團隊速度減慢
    - 最終需要大規模重構

今天節省幾小時的上帝物件，在其生命週期內會花費數週的開發者時間。快速發布功能的複製貼上程式碼，會在多個位置建立維護負擔。每個反模式都是一種捷徑，用短期便利換取長期痛苦。

與戰略性採取的刻意技術債務不同，反模式代表意外或魯莽的債務——在不了解真實成本的情況下採取的捷徑。及早識別反模式並重構它們，可以防止這種債務複利成危機。

## 上帝物件：一個類別做所有事情

當單個類別累積太多職責時，就會出現上帝物件反模式，成為一個知道並做所有事情的龐然大物。

### 上帝物件的剖析

上帝物件通常表現出以下特徵：

!!!warning "⚠️ 上帝物件警告訊號"
    **過多職責**
    - 處理業務邏輯、資料存取、驗證和展示
    - 單個類別中有數千行程式碼
    - 跨越多個抽象層次的方法
    - 難以理解類別實際做什麼
    
    **高耦合**
    - 被系統中大多數其他類別引用
    - 變更波及整個程式碼庫
    - 無法在不破壞某些東西的情況下修改
    - 測試需要模擬半個應用程式
    
    **低內聚**
    - 方法之間幾乎沒有關係
    - 類別名稱模糊（Manager、Handler、Utility、Helper）
    - 新增新功能總是意味著修改這個類別
    - 沒有明確的單一目的

### 程式碼範例：上帝物件

```java
public class OrderManager {
    private Database db;
    private EmailService email;
    private PaymentGateway payment;
    private InventorySystem inventory;
    private ShippingService shipping;
    private TaxCalculator tax;
    private Logger logger;
    
    public void processOrder(Order order) {
        // 驗證
        if (order.getItems().isEmpty()) {
            throw new ValidationException("Empty order");
        }
        
        // 計算總額
        double subtotal = 0;
        for (Item item : order.getItems()) {
            subtotal += item.getPrice() * item.getQuantity();
        }
        double taxAmount = tax.calculate(subtotal, order.getShippingAddress());
        double total = subtotal + taxAmount;
        
        // 處理支付
        PaymentResult result = payment.charge(order.getCustomer(), total);
        if (!result.isSuccessful()) {
            logger.error("Payment failed: " + result.getError());
            email.send(order.getCustomer(), "Payment Failed", result.getError());
            return;
        }
        
        // 更新庫存
        for (Item item : order.getItems()) {
            inventory.decrementStock(item.getId(), item.getQuantity());
        }
        
        // 儲存到資料庫
        db.execute("INSERT INTO orders VALUES (?, ?, ?)", 
            order.getId(), order.getCustomer().getId(), total);
        
        // 安排發貨
        shipping.schedule(order);
        
        // 發送確認
        email.send(order.getCustomer(), "Order Confirmed", 
            "Your order #" + order.getId() + " has been confirmed.");
        
        logger.info("Order processed: " + order.getId());
    }
    
    public List<Order> getCustomerOrders(int customerId) { /* ... */ }
    public void cancelOrder(int orderId) { /* ... */ }
    public void refundOrder(int orderId) { /* ... */ }
    public void updateShippingAddress(int orderId, Address address) { /* ... */ }
    public void applyDiscount(int orderId, String couponCode) { /* ... */ }
    public Report generateSalesReport(Date start, Date end) { /* ... */ }
    // ... 還有50多個方法
}
```

這個類別災難性地違反了[單一職責原則](/zh-TW/2021/09/Single-Responsibility-Principle-SOLID/)。它處理驗證、計算、支付處理、庫存管理、資料庫操作、發貨、電子郵件通知和日誌記錄。

### 更好的方法：關注點分離

```java
public class OrderService {
    private final OrderValidator validator;
    private final OrderCalculator calculator;
    private final PaymentProcessor paymentProcessor;
    private final InventoryManager inventoryManager;
    private final OrderRepository repository;
    private final NotificationService notificationService;
    
    public OrderResult processOrder(Order order) {
        validator.validate(order);
        
        OrderTotal total = calculator.calculateTotal(order);
        PaymentResult payment = paymentProcessor.process(order.getCustomer(), total);
        
        if (!payment.isSuccessful()) {
            notificationService.notifyPaymentFailure(order.getCustomer(), payment);
            return OrderResult.failed(payment.getError());
        }
        
        inventoryManager.reserveItems(order.getItems());
        Order savedOrder = repository.save(order);
        notificationService.notifyOrderConfirmation(savedOrder);
        
        return OrderResult.success(savedOrder);
    }
}
```

現在每個類別都有單一、明確的職責。測試變得簡單——模擬依賴項並驗證行為。對支付處理的變更不需要觸及庫存管理程式碼。

## 貨物崇拜程式設計：不理解就複製

當開發者在不理解模式存在原因的情況下複製程式碼模式時，就會出現貨物崇拜程式設計，導致不必要的複雜性和不適當的解決方案。

### 模式

```javascript
// 開發者在React教學中看到這個模式
class SimpleCounter extends React.Component {
    constructor(props) {
        super(props);
        this.state = { count: 0 };
        this.increment = this.increment.bind(this);
        this.decrement = this.decrement.bind(this);
        this.reset = this.reset.bind(this);
    }
    
    increment() {
        this.setState({ count: this.state.count + 1 });
    }
    
    decrement() {
        this.setState({ count: this.state.count - 1 });
    }
    
    reset() {
        this.setState({ count: 0 });
    }
    
    render() {
        return (
            <div>
                <p>Count: {this.state.count}</p>
                <button onClick={this.increment}>+</button>
                <button onClick={this.decrement}>-</button>
                <button onClick={this.reset}>Reset</button>
            </div>
        );
    }
}
```

這可以工作，但開發者不理解為什麼需要綁定，或者現代React提供了更簡單的替代方案。

### 貨物崇拜版本

```javascript
// 開發者在任何地方應用這個模式，即使不必要
class StaticDisplay extends React.Component {
    constructor(props) {
        super(props);
        // 不需要狀態，但建構函式存在因為「React就是這樣工作的」
        this.renderContent = this.renderContent.bind(this);
        this.renderHeader = this.renderHeader.bind(this);
        this.renderFooter = this.renderFooter.bind(this);
    }
    
    renderContent() {
        return <div>{this.props.content}</div>;
    }
    
    renderHeader() {
        return <h1>{this.props.title}</h1>;
    }
    
    renderFooter() {
        return <footer>© 2022</footer>;
    }
    
    render() {
        return (
            <div>
                {this.renderHeader()}
                {this.renderContent()}
                {this.renderFooter()}
            </div>
        );
    }
}
```

這個元件沒有狀態，沒有事件處理程式，沒有理由成為類別元件。綁定是不必要的——這些方法不作為回呼傳遞。開發者在不理解何時適用的情況下複製了模式。

### 適當的解決方案

```javascript
// 函式元件 - 更簡單且更合適
function StaticDisplay({ title, content }) {
    return (
        <div>
            <h1>{title}</h1>
            <div>{content}</div>
            <footer>© 2022</footer>
        </div>
    );
}

// 或者如果需要狀態，使用hooks
function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>+</button>
            <button onClick={() => setCount(count - 1)}>-</button>
            <button onClick={() => setCount(0)}>Reset</button>
        </div>
    );
}
```

!!!tip "🎯 避免貨物崇拜程式設計"
    **複製前先理解**
    - 研究模式存在的原因
    - 理解它解決的問題
    - 驗證它是否適用於你的情況
    - 不要盲目複製樣板程式碼
    
    **質疑複雜性**
    - 如果程式碼看起來不必要地複雜，它可能確實如此
    - 通常存在更簡單的解決方案
    - 框架演進使舊模式過時
    - 現代替代方案可能更好

## 魔法數字和字串：維護噩夢

魔法數字和字串是嵌入在程式碼中沒有解釋的字面值，使程式碼難以理解和維護。

### 反模式

```python
def calculate_shipping(weight, distance):
    if weight < 5:
        base_cost = 4.99
    elif weight < 20:
        base_cost = 9.99
    else:
        base_cost = 14.99
    
    if distance < 50:
        distance_cost = distance * 0.10
    elif distance < 200:
        distance_cost = distance * 0.08
    else:
        distance_cost = distance * 0.06
    
    total = base_cost + distance_cost
    
    # 對超過$100的訂單應用折扣
    if total > 100:
        total = total * 0.9
    
    # 新增燃油附加費
    total = total * 1.15
    
    return round(total, 2)
```

這些數字是什麼意思？為什麼重量閾值是5和20？1.15乘數是什麼？為什麼折扣是0.9？未來的維護者必須從字面值反向工程業務邏輯。

### 更好的方法

```python
# 具有清晰名稱的設定常數
WEIGHT_THRESHOLD_LIGHT = 5  # 磅
WEIGHT_THRESHOLD_MEDIUM = 20  # 磅

SHIPPING_COST_LIGHT = 4.99
SHIPPING_COST_MEDIUM = 9.99
SHIPPING_COST_HEAVY = 14.99

DISTANCE_THRESHOLD_LOCAL = 50  # 英里
DISTANCE_THRESHOLD_REGIONAL = 200  # 英里

RATE_PER_MILE_LOCAL = 0.10
RATE_PER_MILE_REGIONAL = 0.08
RATE_PER_MILE_NATIONAL = 0.06

BULK_ORDER_THRESHOLD = 100  # 美元
BULK_ORDER_DISCOUNT = 0.10  # 10%折扣

FUEL_SURCHARGE = 0.15  # 15%附加費

def calculate_shipping(weight, distance):
    base_cost = _calculate_base_cost(weight)
    distance_cost = _calculate_distance_cost(distance)
    total = base_cost + distance_cost
    
    if total > BULK_ORDER_THRESHOLD:
        total = total * (1 - BULK_ORDER_DISCOUNT)
    
    total = total * (1 + FUEL_SURCHARGE)
    
    return round(total, 2)

def _calculate_base_cost(weight):
    if weight < WEIGHT_THRESHOLD_LIGHT:
        return SHIPPING_COST_LIGHT
    elif weight < WEIGHT_THRESHOLD_MEDIUM:
        return SHIPPING_COST_MEDIUM
    else:
        return SHIPPING_COST_HEAVY

def _calculate_distance_cost(distance):
    if distance < DISTANCE_THRESHOLD_LOCAL:
        return distance * RATE_PER_MILE_LOCAL
    elif distance < DISTANCE_THRESHOLD_REGIONAL:
        return distance * RATE_PER_MILE_REGIONAL
    else:
        return distance * RATE_PER_MILE_NATIONAL
```

現在業務邏輯是自文件化的。當需求變更時（它們會變更），你確切知道要修改什麼。

## 過早最佳化：萬惡之源

當開發者在理解效能問題實際存在之前就最佳化程式碼時，就會發生過早最佳化，通常為了微不足道的收益而犧牲可讀性和可維護性。

### 反模式

```java
// 開發者「最佳化」字串連接
public String generateReport(List<Transaction> transactions) {
    StringBuilder sb = new StringBuilder();
    int size = transactions.size();
    
    // 預先計算StringBuilder容量以避免調整大小
    int estimatedSize = size * 100;  // 假設每個交易100個字元
    sb = new StringBuilder(estimatedSize);
    
    // 使用陣列而不是增強for迴圈（據說更快）
    Transaction[] txArray = transactions.toArray(new Transaction[size]);
    for (int i = 0; i < size; i++) {
        Transaction tx = txArray[i];
        
        // 內聯方法呼叫以避免開銷
        sb.append(tx.getId());
        sb.append(",");
        sb.append(tx.getAmount());
        sb.append(",");
        sb.append(tx.getDate());
        sb.append("\n");
    }
    
    return sb.toString();
}
```

這段程式碼更難閱讀和維護。「最佳化」提供的好處微不足道——現代JVM會自動最佳化這些模式。開發者花時間最佳化不是瓶頸的程式碼。

### 更好的方法

```java
public String generateReport(List<Transaction> transactions) {
    return transactions.stream()
        .map(tx -> String.format("%d,%s,%s", 
            tx.getId(), tx.getAmount(), tx.getDate()))
        .collect(Collectors.joining("\n"));
}
```

這段程式碼清晰、簡潔且可維護。如果效能分析顯示這個方法是瓶頸（不太可能），那麼再最佳化。在此之前，優先考慮可讀性。

!!!anote "📊 何時最佳化"
    **先進行效能分析**
    - 測量實際效能
    - 識別真正的瓶頸
    - 理解變更的影響
    - 不要猜測問題在哪裡
    
    **戰略性最佳化**
    - 專注於演算法，而不是微最佳化
    - O(n²)到O(n log n)比迴圈樣式更重要
    - 資料庫查詢通常遠超程式碼效能
    - 網路延遲通常佔主導地位
    
    **保持可讀性**
    - 只最佳化已證實的瓶頸
    - 記錄為什麼需要最佳化
    - 考慮可維護性成本
    - 可讀的程式碼是可除錯的程式碼

## 複製貼上程式設計：重複陷阱

當開發者複製程式碼而不是提取可重用元件時，就會發生複製貼上程式設計，當邏輯需要變更時會導致維護噩夢。

### 反模式

```javascript
// 使用者註冊
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    // 驗證電子郵件
    if (!email || email.length === 0) {
        return res.status(400).json({ error: 'Email required' });
    }
    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    
    // 驗證密碼
    if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be 8+ characters' });
    }
    
    // 雜湊密碼
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 儲存使用者
    await db.users.insert({ email, password: hashedPassword });
    res.json({ success: true });
});

// 密碼重設
app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    
    // 驗證電子郵件（從上面複製）
    if (!email || email.length === 0) {
        return res.status(400).json({ error: 'Email required' });
    }
    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    
    // 驗證密碼（從上面複製）
    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be 8+ characters' });
    }
    
    // 雜湊密碼（從上面複製）
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 更新使用者
    await db.users.update({ email }, { password: hashedPassword });
    res.json({ success: true });
});

// 更新個人資料
app.post('/update-profile', async (req, res) => {
    const { email, newEmail, password } = req.body;
    
    // 驗證電子郵件（再次複製）
    if (!email || email.length === 0) {
        return res.status(400).json({ error: 'Email required' });
    }
    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    
    // 如果變更電子郵件，驗證新電子郵件（再次複製）
    if (newEmail) {
        if (!newEmail.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }
    }
    
    // 如果變更密碼，驗證並雜湊（再次複製）
    if (password) {
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be 8+ characters' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await db.users.update({ email }, { password: hashedPassword });
    }
    
    if (newEmail) {
        await db.users.update({ email }, { email: newEmail });
    }
    
    res.json({ success: true });
});
```

現在想像密碼要求變更為12個字元。你必須更新三個（或更多）位置。漏掉一個，你就會有不一致的驗證。

### 更好的方法

```javascript
// 提取的驗證函式
function validateEmail(email) {
    if (!email || email.length === 0) {
        throw new ValidationError('Email required');
    }
    if (!email.includes('@')) {
        throw new ValidationError('Invalid email');
    }
}

function validatePassword(password) {
    if (!password || password.length < 8) {
        throw new ValidationError('Password must be 8+ characters');
    }
}

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// 使用提取函式的清晰端點
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        validateEmail(email);
        validatePassword(password);
        
        const hashedPassword = await hashPassword(password);
        await db.users.insert({ email, password: hashedPassword });
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        validateEmail(email);
        validatePassword(newPassword);
        
        const hashedPassword = await hashPassword(newPassword);
        await db.users.update({ email }, { password: hashedPassword });
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

現在密碼要求在一個地方變更。[DRY（不要重複自己）原則](/zh-TW/2021/08/DRY-Principle-Code-Duplication/)不是關於減少程式碼行數——而是關於為每段邏輯擁有單一真實來源。

## 結論

反模式源於良好的意圖：試圖最佳化效能、遵循教學中的模式，或快速解決即時問題。它們最初是有效的，這使它們變得危險——問題會在程式碼更難變更時出現。

上帝物件反模式展示了累積職責如何建立不可維護的龐然大物。關注點分離不是學術理論——它是使程式碼可測試、可理解和可變更的實用工程。當一個類別做所有事情時，變更任何東西都會變得有風險。

貨物崇拜程式設計顯示了不理解就複製的危險。模式存在於特定原因和情境中。盲目應用它們會建立不必要的複雜性。現代框架在演進，使舊模式過時。理解模式存在的原因有助於你識別它們何時不適用。

魔法數字和字串使程式碼變得神秘。未來的維護者不應該需要從字面值反向工程業務邏輯。命名常數記錄意圖並集中設定。當需求變更時，你確切知道要修改什麼。

過早最佳化為了微不足道的收益而犧牲可讀性。先進行效能分析，最佳化瓶頸，並優先考慮可維護性。大多數效能問題來自演算法和架構，而不是微最佳化。可讀的程式碼是可除錯的程式碼。

複製貼上程式設計建立維護噩夢。重複的邏輯意味著當需求變更時要更新多個地方。DRY原則提供單一真實來源，使變更可預測且安全。

識別反模式需要經驗和警惕。它們在當下感覺是對的——這就是為什麼它們是模式。關鍵是質疑複雜性，理解權衡，並優先考慮長期可維護性而不是短期便利。好的程式碼不是聰明的；它是清晰、簡單且易於變更的。
