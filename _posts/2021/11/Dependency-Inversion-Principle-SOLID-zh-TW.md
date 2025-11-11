---
title: "依賴反轉原則：高層模組不應依賴低層模組"
date: 2021-11-30
lang: zh-TW
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "高層模組不應依賴低層模組。兩者都應依賴抽象。這一原則顛倒了傳統的依賴結構，但開發者經常創建違反它的僵化架構。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

依賴反轉原則（DIP）是SOLID設計中的第五個也是最後一個原則，它指出：「高層模組不應依賴低層模組。兩者都應依賴抽象。抽象不應依賴細節。細節應依賴抽象。」由Robert C. Martin提出，DIP解決了僵化架構的根本問題，即業務邏輯與實作細節緊密耦合。雖然聽起來很抽象，但DIP違規無處不在——從嵌入在業務邏輯中的資料庫查詢到直接實例化具體類別的UI程式碼。

本文透過依賴流向錯誤方向的實際場景來探討依賴反轉原則。從緊密耦合的資料庫存取到硬編碼的服務依賴，我們將剖析依賴反轉的含義、如何檢測違規，以及為什麼抽象是靈活、可測試架構的關鍵。透過生產環境範例和重構模式，我們揭示了為什麼DIP是可維護軟體設計的基礎。

## 理解依賴反轉

在深入研究違規之前，理解依賴反轉的含義以及為什麼它很重要至關重要。

### 反轉意味著什麼？

該原則要求顛倒傳統的依賴流：

!!!anote "📚 依賴反轉定義"
    **傳統依賴**
    - 高層模組依賴低層模組
    - 業務邏輯依賴實作細節
    - 變化向上層波及
    - 難以測試和修改
    
    **反轉的依賴**
    - 兩者都依賴抽象（介面）
    - 高層定義它需要什麼
    - 低層實作抽象
    - 依賴指向抽象
    
    **關鍵概念**
    - 抽象：介面或抽象類別
    - 高層：業務邏輯、策略
    - 低層：實作細節、I/O
    - 反轉：依賴流向抽象

DIP確保業務邏輯保持獨立於實作細節。

### 為什麼DIP很重要

違反DIP會創建僵化、脆弱的架構：

!!!warning "⚠️ 違反DIP的代價"
    **緊密耦合**
    - 業務邏輯綁定到實作
    - 無法輕鬆更改實作
    - 難以交換依賴
    - 修改需要大量更改
    
    **測試困難**
    - 無法隔離測試
    - 需要真實的資料庫、服務
    - 緩慢、脆弱的測試
    - 難以模擬依賴
    
    **缺乏靈活性**
    - 無法重用高層邏輯
    - 鎖定在特定技術
    - 難以適應變化
    - 架構變得僵化

這些違規使系統難以測試、修改和演化。

## 經典違規：直接資料庫依賴

最常見的DIP違規之一發生在業務邏輯直接依賴資料庫實作時。

### 緊密耦合的資料存取

考慮這個嵌入了資料庫存取的業務邏輯：

```python
import mysql.connector

class OrderService:
    def __init__(self):
        self.db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="password",
            database="orders"
        )
    
    def create_order(self, customer_id, items):
        cursor = self.db.cursor()
        
        # 計算總額
        total = sum(item['price'] * item['quantity'] for item in items)
        
        # 插入訂單
        cursor.execute(
            "INSERT INTO orders (customer_id, total) VALUES (%s, %s)",
            (customer_id, total)
        )
        order_id = cursor.lastrowid
        
        # 插入訂單項目
        for item in items:
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (order_id, item['product_id'], item['quantity'], item['price'])
            )
        
        self.db.commit()
        return order_id
    
    def get_order(self, order_id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        return cursor.fetchone()
```

這違反了DIP，因為：

!!!error "🚫 識別出的DIP違規"
    **直接依賴**
    - OrderService直接依賴MySQL
    - 業務邏輯與資料存取混合
    - 無法在不修改服務的情況下更改資料庫
    - 高層依賴低層
    
    **測試問題**
    - 無法在沒有資料庫的情況下測試
    - 需要MySQL執行
    - 緩慢的整合測試
    - 無法模擬資料存取
    
    **缺乏靈活性**
    - 鎖定在MySQL
    - 無法切換到PostgreSQL、MongoDB
    - 無法使用不同儲存重用邏輯
    - 難以新增快取層

業務邏輯與MySQL實作細節緊密耦合。

### 使用依賴反轉重構

引入抽象並反轉依賴：

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Optional

# 由高層模組定義的抽象
class OrderRepository(ABC):
    @abstractmethod
    def save_order(self, customer_id: int, items: List[Dict], total: float) -> int:
        pass
    
    @abstractmethod
    def find_order(self, order_id: int) -> Optional[Dict]:
        pass

# 高層業務邏輯依賴抽象
class OrderService:
    def __init__(self, repository: OrderRepository):
        self.repository = repository
    
    def create_order(self, customer_id: int, items: List[Dict]) -> int:
        # 業務邏輯
        total = sum(item['price'] * item['quantity'] for item in items)
        
        # 委託給抽象
        return self.repository.save_order(customer_id, items, total)
    
    def get_order(self, order_id: int) -> Optional[Dict]:
        return self.repository.find_order(order_id)

# 低層實作依賴抽象
class MySQLOrderRepository(OrderRepository):
    def __init__(self, connection):
        self.db = connection
    
    def save_order(self, customer_id: int, items: List[Dict], total: float) -> int:
        cursor = self.db.cursor()
        cursor.execute(
            "INSERT INTO orders (customer_id, total) VALUES (%s, %s)",
            (customer_id, total)
        )
        order_id = cursor.lastrowid
        
        for item in items:
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (order_id, item['product_id'], item['quantity'], item['price'])
            )
        
        self.db.commit()
        return order_id
    
    def find_order(self, order_id: int) -> Optional[Dict]:
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        return cursor.fetchone()

# 替代實作
class MongoDBOrderRepository(OrderRepository):
    def __init__(self, collection):
        self.collection = collection
    
    def save_order(self, customer_id: int, items: List[Dict], total: float) -> int:
        order = {
            'customer_id': customer_id,
            'items': items,
            'total': total
        }
        result = self.collection.insert_one(order)
        return result.inserted_id
    
    def find_order(self, order_id: int) -> Optional[Dict]:
        return self.collection.find_one({'_id': order_id})

# 使用依賴注入
import mysql.connector

db = mysql.connector.connect(host="localhost", user="root", password="password", database="orders")
repository = MySQLOrderRepository(db)
service = OrderService(repository)

order_id = service.create_order(123, [
    {'product_id': 1, 'quantity': 2, 'price': 10.00}
])
```

現在程式碼遵循DIP：

!!!success "✅ DIP的好處"
    **反轉的依賴**
    - OrderService依賴抽象
    - MySQLOrderRepository實作抽象
    - 依賴指向抽象
    - 高層獨立於低層
    
    **可測試性**
    - 可以使用模擬儲存庫測試
    - 單元測試不需要資料庫
    - 快速、隔離的測試
    - 易於驗證業務邏輯
    
    **靈活性**
    - 可以將MySQL換成MongoDB
    - 可以新增快取層
    - 可以使用記憶體進行測試
    - 業務邏輯可重用


## 微妙的違規：硬編碼的服務依賴

另一個常見的DIP違規發生在類別直接實例化它們的依賴時。

### 緊密耦合的服務

考慮這個具有硬編碼依賴的通知系統：

```java
public class EmailService {
    private String smtpHost;
    private int smtpPort;
    
    public EmailService(String smtpHost, int smtpPort) {
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
    }
    
    public void sendEmail(String to, String subject, String body) {
        // 透過SMTP發送電子郵件
        System.out.println("Sending email to " + to);
    }
}

public class UserService {
    private EmailService emailService;
    
    public UserService() {
        // 直接實例化 - DIP違規！
        this.emailService = new EmailService("smtp.example.com", 587);
    }
    
    public void registerUser(String email, String password) {
        // 註冊使用者邏輯
        System.out.println("Registering user: " + email);
        
        // 發送歡迎郵件
        emailService.sendEmail(
            email,
            "Welcome!",
            "Thank you for registering."
        );
    }
    
    public void resetPassword(String email) {
        // 重設密碼邏輯
        System.out.println("Resetting password for: " + email);
        
        // 發送重設郵件
        emailService.sendEmail(
            email,
            "Password Reset",
            "Click here to reset your password."
        );
    }
}
```

這違反了DIP，因為：

!!!error "🚫 識別出的DIP違規"
    **直接實例化**
    - UserService直接建立EmailService
    - 硬編碼的SMTP設定
    - 無法更改通知方法
    - 高層依賴具體類別
    
    **測試問題**
    - 無法在不發送電子郵件的情況下測試
    - 無法輕鬆驗證電子郵件內容
    - 測試需要SMTP伺服器
    - 難以模擬
    
    **缺乏靈活性**
    - 鎖定在電子郵件通知
    - 無法新增簡訊、推播通知
    - 無法切換電子郵件提供商
    - 設定硬編碼

### 使用抽象重構

引入抽象並使用依賴注入：

```java
// 由高層需求定義的抽象
public interface NotificationService {
    void sendNotification(String recipient, String subject, String message);
}

// 高層業務邏輯依賴抽象
public class UserService {
    private NotificationService notificationService;
    
    // 透過建構函式注入依賴
    public UserService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    
    public void registerUser(String email, String password) {
        System.out.println("Registering user: " + email);
        
        notificationService.sendNotification(
            email,
            "Welcome!",
            "Thank you for registering."
        );
    }
    
    public void resetPassword(String email) {
        System.out.println("Resetting password for: " + email);
        
        notificationService.sendNotification(
            email,
            "Password Reset",
            "Click here to reset your password."
        );
    }
}

// 低層實作
public class EmailNotificationService implements NotificationService {
    private String smtpHost;
    private int smtpPort;
    
    public EmailNotificationService(String smtpHost, int smtpPort) {
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
    }
    
    @Override
    public void sendNotification(String recipient, String subject, String message) {
        System.out.println("Sending email to " + recipient);
        // SMTP實作
    }
}

public class SMSNotificationService implements NotificationService {
    private String apiKey;
    
    public SMSNotificationService(String apiKey) {
        this.apiKey = apiKey;
    }
    
    @Override
    public void sendNotification(String recipient, String subject, String message) {
        System.out.println("Sending SMS to " + recipient);
        // SMS API實作
    }
}

public class CompositeNotificationService implements NotificationService {
    private List<NotificationService> services;
    
    public CompositeNotificationService(List<NotificationService> services) {
        this.services = services;
    }
    
    @Override
    public void sendNotification(String recipient, String subject, String message) {
        for (NotificationService service : services) {
            service.sendNotification(recipient, subject, message);
        }
    }
}

// 使用依賴注入
NotificationService emailService = new EmailNotificationService("smtp.example.com", 587);
UserService userService = new UserService(emailService);

// 或使用多個管道
List<NotificationService> services = Arrays.asList(
    new EmailNotificationService("smtp.example.com", 587),
    new SMSNotificationService("api-key-123")
);
NotificationService compositeService = new CompositeNotificationService(services);
UserService multiChannelUserService = new UserService(compositeService);
```

現在程式碼遵循DIP：

!!!success "✅ DIP的好處"
    **適當的抽象**
    - UserService依賴介面
    - 實作依賴介面
    - 依賴正確反轉
    - 業務邏輯解耦
    
    **易於測試**
    - 可以注入模擬服務
    - 無需發送即可驗證通知
    - 快速單元測試
    - 沒有外部依賴
    
    **靈活性**
    - 可以切換到簡訊、推播通知
    - 可以使用多個管道
    - 可以輕鬆更改提供商
    - 設定外部化


## 檢測DIP違規

識別DIP違規需要檢查依賴方向和耦合。

### 警告信號

注意這些DIP違規的指標：

!!!warning "🔍 DIP違規指標"
    **直接實例化**
    - 業務邏輯中的new關鍵字
    - 建構函式中的具體類別
    - 建立具體類型的工廠方法
    - 對實作的靜態方法呼叫
    
    **匯入陳述式**
    - 高層匯入低層套件
    - 業務邏輯匯入資料庫套件
    - 核心匯入基礎設施
    - 向上的依賴流
    
    **測試困難**
    - 無法在沒有外部系統的情況下測試
    - 需要資料庫、API、檔案系統
    - 需要緩慢的整合測試
    - 無法隔離業務邏輯
    
    **缺乏靈活性**
    - 難以更改實作
    - 鎖定在特定技術
    - 無法重用業務邏輯
    - 設定硬編碼

### 依賴方向測試

應用此測試來驗證DIP合規性：

```typescript
// 測試：依賴是否指向抽象？

// ✗ 違規：高層依賴低層
class ReportGenerator {
    private pdfGenerator: PDFGenerator;  // 具體類別
    
    constructor() {
        this.pdfGenerator = new PDFGenerator();  // 直接實例化
    }
    
    generateReport(data: any): void {
        const content = this.formatData(data);
        this.pdfGenerator.createPDF(content);  // 依賴實作
    }
    
    private formatData(data: any): string {
        // 業務邏輯
        return "formatted data";
    }
}

// ✓ 正確：兩者都依賴抽象
interface DocumentGenerator {
    generate(content: string): void;
}

class ReportGenerator {
    private generator: DocumentGenerator;  // 抽象
    
    constructor(generator: DocumentGenerator) {  // 依賴注入
        this.generator = generator;
    }
    
    generateReport(data: any): void {
        const content = this.formatData(data);
        this.generator.generate(content);  // 依賴抽象
    }
    
    private formatData(data: any): string {
        return "formatted data";
    }
}

class PDFDocumentGenerator implements DocumentGenerator {
    generate(content: string): void {
        console.log("Generating PDF");
        // PDF實作
    }
}

class HTMLDocumentGenerator implements DocumentGenerator {
    generate(content: string): void {
        console.log("Generating HTML");
        // HTML實作
    }
}

// 使用
const pdfGenerator = new PDFDocumentGenerator();
const reportGen = new ReportGenerator(pdfGenerator);
reportGen.generateReport({ sales: 1000 });

// 易於切換
const htmlGenerator = new HTMLDocumentGenerator();
const htmlReportGen = new ReportGenerator(htmlGenerator);
```

## 何時應用DIP

知道何時應用依賴反轉與知道如何應用同樣重要。

### 應用DIP的時機

在這些情況下反轉依賴：

!!!tip "✅ 何時應用DIP"
    **業務邏輯層**
    - 核心業務規則
    - 領域邏輯
    - 用例和工作流程
    - 策略決策
    
    **外部依賴**
    - 資料庫存取
    - 外部API
    - 檔案系統操作
    - 第三方服務
    
    **測試要求**
    - 需要隔離的單元測試
    - 想要快速測試執行
    - 需要模擬依賴
    - 測試驅動開發
    
    **靈活性需求**
    - 可能有多個實作
    - 技術可能改變
    - 需要交換依賴
    - 設定因環境而異

### 避免過度抽象

不要建立不必要的抽象：

!!!warning "⚠️ 何時不應用DIP"
    **穩定的依賴**
    - 標準函式庫函式
    - 語言內建功能
    - 穩定的框架
    - 不太可能改變
    
    **簡單工具**
    - 純函式
    - 無狀態輔助程式
    - 數學運算
    - 字串操作
    
    **效能關鍵**
    - 需要最佳化的熱路徑
    - 需要直接呼叫
    - 抽象開銷顯著
    - 效能分析顯示影響
    
    **過度工程化**
    - 可能只有單一實作
    - 沒有測試好處
    - 增加複雜性而無價值
    - YAGNI適用

在提供明確好處的地方應用DIP，而不是到處應用。

## 結論

依賴反轉原則透過解決軟體系統中依賴的基本結構來完成SOLID。透過確保高層模組依賴抽象而不是低層細節，DIP創建了靈活、可測試和可維護的架構。

關鍵要點：

!!!success "🎯 DIP指南"
    **反轉依賴**
    - 高層定義抽象
    - 低層實作抽象
    - 依賴指向抽象
    - 業務邏輯獨立於細節
    
    **使用依賴注入**
    - 透過建構函式注入依賴
    - 避免直接實例化
    - 使用工廠或容器
    - 在組合根設定
    
    **設計抽象**
    - 基於需求定義介面
    - 保持抽象專注
    - 避免洩漏實作細節
    - 穩定、最小的介面
    
    **啟用測試**
    - 輕鬆模擬依賴
    - 隔離測試業務邏輯
    - 快速、可靠的單元測試
    - 不需要外部依賴

DIP與其他SOLID原則協同工作：它透過分離關注點來支援單一職責，透過抽象啟用開閉原則，透過適當的介面加強里氏替換，並透過專注的抽象補充介面隔離。這些原則共同創建了健壯、靈活和可維護的軟體。

這結束了我們的SOLID系列。透過應用這五個原則——單一職責、開閉原則、里氏替換、介面隔離和依賴反轉——你可以建構經得起時間考驗、適應不斷變化的需求並保持工作樂趣的軟體系統。
