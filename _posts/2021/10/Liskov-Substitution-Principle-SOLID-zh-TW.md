---
title: "里氏替換原則：不可違背的契約"
date: 2021-10-01
lang: zh-TW
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "子類型必須能夠替換其基礎類型而不破壞程式正確性。這一原則確保繼承層次結構保持健全，但開發者經常透過看似無害的設計決策違反它。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

里氏替換原則（LSP）以1987年提出該原則的Barbara Liskov命名，是SOLID設計中的第三個原則。它指出：「超類別的物件應該可以被子類別的物件替換而不破壞應用程式。」雖然這聽起來很簡單，但LSP違規是物件導向系統中最常見和最微妙的錯誤之一。一個看起來正確的子類別可能會悄悄地破壞假設，導致遠離繼承層次結構本身的故障。

本文透過繼承出錯的實際場景來探討里氏替換原則。從不是正方形的矩形到不會飛的鳥，我們將剖析可替換性的真正含義、如何檢測違規，以及為什麼組合通常在繼承失敗的地方取得成功。透過生產環境的錯誤和重構經驗，我們揭示了為什麼LSP是多型性的守護者。

## 理解里氏替換

在深入研究違規之前，理解可替換性的含義至關重要。LSP關注的是行為契約，而不僅僅是類型相容性。

### 可替換性意味著什麼？

該原則要求子類別遵守其基礎類別建立的契約：

!!!anote "📚 里氏替換定義"
    **行為可替換性**
    - 子類別可以替換基礎類別
    - 程式正確性得以保持
    - 沒有意外的行為變化
    - 客戶端不知道替換
    
    **契約要求**
    - 前置條件不能加強
    - 後置條件不能削弱
    - 不變量必須保持
    - 歷史約束得以維護
    
    **測試方法**
    - 如果S是T的子類型
    - 那麼類型T的物件
    - 可以被類型S的物件替換
    - 而不改變程式正確性

LSP確保多型性正確工作。當程式碼依賴於基礎類別時，任何子類別都應該在沒有意外的情況下工作。

### 為什麼LSP很重要

違反LSP會破壞繼承的基本承諾：

!!!warning "⚠️ 違反LSP的代價"
    **多型性被破壞**
    - 子類別不按預期工作
    - 使用物件前需要類型檢查
    - 違背繼承的目的
    - 多型程式碼變得脆弱
    
    **隱藏的錯誤**
    - 故障發生在遠離違規點的地方
    - 難以追蹤根本原因
    - 測試通過但生產環境失敗
    - 邊緣情況暴露違規
    
    **維護負擔**
    - 必須知道具體類型
    - 無法信任抽象
    - 需要防禦性程式設計
    - 程式碼變得脆弱和複雜

這些違規破壞了整個繼承層次結構，使多型程式碼不可靠。

## 經典違規：矩形-正方形問題

最著名的LSP違規展示了數學關係如何不總是轉化為程式碼。

### 看似合理的繼承

考慮這個看似正確的繼承層次結構：

```python
class Rectangle:
    def __init__(self, width, height):
        self._width = width
        self._height = height
    
    def set_width(self, width):
        self._width = width
    
    def set_height(self, height):
        self._height = height
    
    def get_width(self):
        return self._width
    
    def get_height(self):
        return self._height
    
    def area(self):
        return self._width * self._height

# 正方形是一個矩形，對吧？
class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)
    
    def set_width(self, width):
        self._width = width
        self._height = width  # 保持正方形屬性
    
    def set_height(self, height):
        self._width = height  # 保持正方形屬性
        self._height = height
```

這違反了LSP，因為：

!!!error "🚫 識別出的LSP違規"
    **行為契約被破壞**
    - Rectangle允許獨立更改寬度/高度
    - Square耦合了寬度和高度的更改
    - 子類別加強了前置條件
    - 發生意外的副作用
    
    **替換失敗**
    - 期望Rectangle行為的程式碼被破壞
    - 設定寬度意外地改變了高度
    - 不變量被違反
    - 程式正確性受損

使用多型時違規變得明顯：

```python
def test_rectangle_area(rect):
    rect.set_width(5)
    rect.set_height(4)
    assert rect.area() == 20  # 期望 5 * 4 = 20

# 對Rectangle有效
rectangle = Rectangle(0, 0)
test_rectangle_area(rectangle)  # ✓ 通過

# 對Square失敗
square = Square(0)
test_rectangle_area(square)  # ✗ 失敗！area() 返回 16，而不是 20
```

Square違反了Rectangle的行為契約。獨立設定寬度和高度是矩形的預期行為，但Square同時更改兩個維度。

### 重構以遵循LSP

移除繼承關係並使用組合或獨立的層次結構：

```python
# 選項1：具有公共介面的獨立層次結構
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self._width = width
        self._height = height
    
    def set_width(self, width):
        self._width = width
    
    def set_height(self, height):
        self._height = height
    
    def area(self):
        return self._width * self._height

class Square(Shape):
    def __init__(self, side):
        self._side = side
    
    def set_side(self, side):
        self._side = side
    
    def area(self):
        return self._side * self._side

# 選項2：不可變形狀
class ImmutableRectangle:
    def __init__(self, width, height):
        self._width = width
        self._height = height
    
    def with_width(self, width):
        return ImmutableRectangle(width, self._height)
    
    def with_height(self, height):
        return ImmutableRectangle(self._width, height)
    
    def area(self):
        return self._width * self._height

class ImmutableSquare:
    def __init__(self, side):
        self._side = side
    
    def with_side(self, side):
        return ImmutableSquare(side)
    
    def area(self):
        return self._side * self._side
```

現在程式碼遵循LSP：

!!!success "✅ LSP的好處"
    **行為一致性**
    - 每個類別都有明確的契約
    - 沒有意外的副作用
    - 替換正確工作
    - 多型性可靠
    
    **清晰的語義**
    - Rectangle和Square是不同的
    - 每個都有適當的操作
    - 沒有強制的繼承關係
    - 設計中的意圖明確
    
    **可維護性**
    - 易於推理行為
    - 沒有隱藏的耦合
    - 測試簡單直接
    - 擴充可預測

## 微妙的違規：不會飛的鳥

另一個常見的LSP違規來自過度泛化的基礎類別，這些類別不適合所有子類別。

### 有缺陷的鳥類層次結構

考慮這個鳥類層次結構：

```java
public class Bird {
    private String name;
    private double altitude = 0;
    
    public Bird(String name) {
        this.name = name;
    }
    
    public void fly() {
        altitude += 10;
        System.out.println(name + " is flying at " + altitude + " meters");
    }
    
    public double getAltitude() {
        return altitude;
    }
}

public class Sparrow extends Bird {
    public Sparrow() {
        super("Sparrow");
    }
}

public class Penguin extends Bird {
    public Penguin() {
        super("Penguin");
    }
    
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Penguins cannot fly!");
    }
}
```

這違反了LSP，因為：

!!!error "🚫 識別出的LSP違規"
    **契約被破壞**
    - 基礎類別承諾fly()有效
    - 子類別拋出例外
    - 後置條件被削弱
    - 替換失敗
    
    **需要類型檢查**
    - 必須檢查鳥是否是企鵝
    - 無法信任Bird抽象
    - 違背多型性
    - 客戶端程式碼脆弱

使用多型時違規浮出水面：

```java
public class BirdMigration {
    public void migrateAll(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.fly();  // 如果鳥是企鵝就會崩潰！
        }
    }
}

// 使用
List<Bird> birds = Arrays.asList(
    new Sparrow(),
    new Penguin(),  // 這會導致遷移崩潰！
    new Sparrow()
);

BirdMigration migration = new BirdMigration();
migration.migrateAll(birds);  // ✗ 拋出UnsupportedOperationException
```


### 重構以遵循LSP

重新設計層次結構以反映實際能力：

```java
// 具有公共行為的基礎類別
public abstract class Bird {
    private String name;
    
    public Bird(String name) {
        this.name = name;
    }
    
    public String getName() {
        return name;
    }
    
    public abstract void move();
}

// 飛行能力的介面
public interface Flyable {
    void fly();
    double getAltitude();
}

// 會飛的鳥實作兩者
public class Sparrow extends Bird implements Flyable {
    private double altitude = 0;
    
    public Sparrow() {
        super("Sparrow");
    }
    
    @Override
    public void fly() {
        altitude += 10;
        System.out.println(getName() + " is flying at " + altitude + " meters");
    }
    
    @Override
    public double getAltitude() {
        return altitude;
    }
    
    @Override
    public void move() {
        fly();
    }
}

// 不會飛的鳥不實作Flyable
public class Penguin extends Bird {
    public Penguin() {
        super("Penguin");
    }
    
    @Override
    public void move() {
        System.out.println(getName() + " is swimming");
    }
}

// 遷移現在使用正確的抽象
public class BirdMigration {
    public void migrateFlyingBirds(List<Flyable> birds) {
        for (Flyable bird : birds) {
            bird.fly();  // 安全——所有Flyable鳥都能飛
        }
    }
    
    public void moveAllBirds(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.move();  // 安全——所有鳥都能移動
        }
    }
}
```

現在程式碼遵循LSP：

!!!success "✅ LSP的好處"
    **正確的抽象**
    - Bird代表所有鳥類
    - Flyable代表飛行能力
    - 沒有違背的承諾
    - 替換正確工作
    
    **類型安全**
    - 編譯時保證
    - 沒有執行時例外
    - 不需要類型檢查
    - 多型性可靠
    
    **靈活性**
    - 易於新增新的鳥類類型
    - 清晰的能力契約
    - 可組合的行為
    - 可維護的設計

## 檢測LSP違規

識別LSP違規需要理解行為契約，而不僅僅是類型關係。

### 警告信號

注意這些LSP違規的指標：

!!!warning "🔍 LSP違規指標"
    **拋出例外**
    - 子類別拋出基礎類別不拋出的例外
    - 重寫中的UnsupportedOperationException
    - NotImplementedException模式
    - 空方法實作
    
    **類型檢查**
    - 使用物件前的instanceof檢查
    - 特定類型的行為分支
    - 轉換為具體類型
    - 圍繞子類型的防禦性程式設計
    
    **加強的前置條件**
    - 子類別要求比基礎類別更多
    - 子類別中的額外驗證
    - 更窄的輸入接受
    - 更嚴格的參數
    
    **削弱的後置條件**
    - 子類別返回比基礎類別少
    - 子類別中的較弱保證
    - 部分實作
    - 功能降級

### 替換測試

應用此測試來驗證LSP合規性：

```typescript
// 測試：子類別能否替換基礎類別？
interface PaymentProcessor {
    processPayment(amount: number): boolean;
    refund(transactionId: string): boolean;
}

class CreditCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        // 處理信用卡支付
        return true;
    }
    
    refund(transactionId: string): boolean {
        // 處理退款
        return true;
    }
}

// LSP違規：加強前置條件
class GiftCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        if (amount > 500) {
            throw new Error("Gift cards limited to $500");  // ✗ 違規！
        }
        return true;
    }
    
    refund(transactionId: string): boolean {
        throw new Error("Gift cards cannot be refunded");  // ✗ 違規！
    }
}

// 客戶端程式碼在使用GiftCardProcessor時被破壞
function checkout(processor: PaymentProcessor, amount: number) {
    if (processor.processPayment(amount)) {
        console.log("Payment successful");
    }
}

checkout(new CreditCardProcessor(), 1000);  // ✓ 有效
checkout(new GiftCardProcessor(), 1000);    // ✗ 拋出例外
```

GiftCardProcessor透過新增介面契約中不存在的限制來違反LSP。

### 修復違規

使契約明確並遵守它：

```typescript
interface PaymentProcessor {
    processPayment(amount: number): PaymentResult;
    refund(transactionId: string): RefundResult;
    getMaxAmount(): number;
    supportsRefunds(): boolean;
}

class PaymentResult {
    constructor(
        public success: boolean,
        public message: string
    ) {}
}

class RefundResult {
    constructor(
        public success: boolean,
        public message: string
    ) {}
}

class CreditCardProcessor implements PaymentProcessor {
    processPayment(amount: number): PaymentResult {
        // 處理支付
        return new PaymentResult(true, "Payment processed");
    }
    
    refund(transactionId: string): RefundResult {
        // 處理退款
        return new RefundResult(true, "Refund processed");
    }
    
    getMaxAmount(): number {
        return Number.MAX_VALUE;
    }
    
    supportsRefunds(): boolean {
        return true;
    }
}

class GiftCardProcessor implements PaymentProcessor {
    processPayment(amount: number): PaymentResult {
        if (amount > this.getMaxAmount()) {
            return new PaymentResult(false, "Amount exceeds gift card limit");
        }
        return new PaymentResult(true, "Payment processed");
    }
    
    refund(transactionId: string): RefundResult {
        if (!this.supportsRefunds()) {
            return new RefundResult(false, "Gift cards cannot be refunded");
        }
        return new RefundResult(true, "Refund processed");
    }
    
    getMaxAmount(): number {
        return 500;
    }
    
    supportsRefunds(): boolean {
        return false;
    }
}

// 客戶端程式碼現在正確工作
function checkout(processor: PaymentProcessor, amount: number) {
    if (amount > processor.getMaxAmount()) {
        console.log(`Amount exceeds limit of ${processor.getMaxAmount()}`);
        return;
    }
    
    const result = processor.processPayment(amount);
    if (result.success) {
        console.log("Payment successful");
    } else {
        console.log(`Payment failed: ${result.message}`);
    }
}

checkout(new CreditCardProcessor(), 1000);  // ✓ 有效
checkout(new GiftCardProcessor(), 1000);    // ✓ 有效——優雅地處理限制
```

現在兩個處理器都遵守契約，可以相互替換。

## 當繼承失敗時：優先使用組合

許多LSP違規表明繼承是錯誤的工具。

### 組合替代方案

不要強制繼承，使用組合：

```python
# 不使用繼承層次結構
class Vehicle:
    def start_engine(self):
        pass

class ElectricCar(Vehicle):
    def start_engine(self):
        raise NotImplementedError("Electric cars don't have engines!")  # ✗ LSP違規

# 使用具有能力的組合
class Engine:
    def start(self):
        print("Engine started")

class ElectricMotor:
    def start(self):
        print("Motor started")

class Vehicle:
    def __init__(self, power_source):
        self.power_source = power_source
    
    def start(self):
        self.power_source.start()

# 使用
gas_car = Vehicle(Engine())
electric_car = Vehicle(ElectricMotor())

gas_car.start()      # ✓ Engine started
electric_car.start() # ✓ Motor started
```

組合透過消除不適當的繼承關係來避免LSP違規。

!!!tip "💡 組合優於繼承"
    **何時使用組合**
    - 子類別不完全支援基礎類別行為
    - 關係是「有一個」而不是「是一個」
    - 需要混合多種能力
    - 行為獨立變化
    
    **好處**
    - 沒有LSP違規
    - 更靈活
    - 更易於測試
    - 意圖更清晰

## 結論

里氏替換原則確保繼承層次結構保持健全，多型性正確工作。違規破壞了物件導向設計的基本承諾：子類別可以在沒有意外的情況下替換基礎類別。

關鍵要點：

!!!success "🎯 LSP指南"
    **為可替換性設計**
    - 子類別必須遵守基礎類別契約
    - 不要加強前置條件
    - 不要削弱後置條件
    - 保持不變量
    
    **識別違規**
    - 重寫中拋出例外
    - 使用物件前的類型檢查
    - 空或部分實作
    - 防禦性程式設計模式
    
    **選擇正確的工具**
    - 對真正的「是一個」關係使用繼承
    - 對「有一個」關係使用組合
    - 對能力契約使用介面
    - 不要在不適合的地方強制繼承
    
    **測試可替換性**
    - 子類別能否替換基礎類別？
    - 行為是否保持一致？
    - 契約是否得到遵守？
    - 多型性是否正確工作？

里氏替換原則守護著繼承層次結構的完整性。遵循它時，它能實現可靠的多型性和可維護的物件導向系統。違反它時，它會建立破壞整個設計的微妙錯誤。下次建立子類別時，問問自己：它真的可以在不破壞任何東西的情況下替換其基礎類別嗎？如果不能，請重新考慮繼承關係。
