---
title: "開閉原則：在不破壞的情況下擴展"
date: 2021-09-12
lang: zh-TW
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "軟體實體應該對擴展開放，對修改關閉。這個原則承諾在不破壞的情況下提供靈活性，但開發者在何時應用抽象以及何時會變成過度工程方面掙扎。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

開閉原則（OCP）是 SOLID 設計中的第二個原則，但它可能是最容易被誤解的。由 Bertrand Meyer 提出並由 Robert C. Martin 推廣，它指出：「軟體實體應該對擴展開放，對修改關閉。」這個看似矛盾的陳述承諾能夠在不改變現有程式碼的情況下新增新功能。然而，開發者在以下問題上掙扎：我應該何時建立抽象？多少靈活性才算過度？遵循 OCP 實際上會讓程式碼更複雜嗎？

本文透過實際場景探討開閉原則，從僵化的 switch 陳述式到過度工程的外掛架構。我們將剖析「對擴展開放」的真正含義、何時抽象增加價值以及何時它創造不必要的複雜性。借鑑生產程式碼庫和重構經驗，我們揭示為什麼 OCP 既強大又容易被誤用。

## 理解開閉原則

在深入了解何時以及如何應用 OCP 之前，理解這個原則的真正含義至關重要。「對擴展開放，對修改關閉」這個術語乍一看似乎是矛盾的。

### 開閉是什麼意思？

該原則有兩個相互配合的部分：

!!!anote "📚 開閉定義"
    **對擴展開放**
    - 可以新增新功能
    - 可以引入新行為
    - 可以支援新需求
    - 無需觸及現有程式碼
    
    **對修改關閉**
    - 現有程式碼保持不變
    - 已測試的程式碼保持已測試狀態
    - 工作的程式碼保持工作狀態
    - 減少破壞性改變的風險
    
    **機制**
    - 抽象使擴展成為可能
    - 多型提供靈活性
    - 繼承或組合新增行為
    - 介面定義契約

該原則強調保護穩定程式碼免受改變。當需求演進時，你擴展系統而不是修改現有的、工作的程式碼。這減少了向已測試功能引入錯誤的風險。

### 為什麼 OCP 重要

違反 OCP 會建立脆弱的程式碼，每次改變都會破壞：

!!!warning "⚠️ 違反 OCP 的代價"
    **修改的漣漪效應**
    - 每個新功能都需要改變現有程式碼
    - 改變在系統中傳播
    - 破壞工作功能的風險
    - 回歸測試負擔增加
    
    **耦合和僵化**
    - 新需求強制到處修改
    - 程式碼變得抗拒改變
    - 對破壞事物的恐懼抑制演進
    - 技術債務累積
    
    **測試開銷**
    - 必須重新測試所有修改的程式碼
    - 整合測試可能會破壞
    - 對改變的信心下降
    - 部署風險增加

這些成本隨著時間推移而累積。每個新功能都需要修改的程式碼變得越來越難以改變且風險越來越大。

## 明顯的違規：Switch 陳述式

最明顯的 OCP 違規來自 switch 陳述式或 if-else 鏈，每個新情況都必須修改它們。

### 經典的 Switch 陳述式違規

考慮這個計算運費的常見模式：

```java
public class ShippingCalculator {
    public double calculateShipping(Order order, String shippingMethod) {
        double cost = 0;
        
        switch (shippingMethod) {
            case "STANDARD":
                cost = order.getWeight() * 0.5;
                break;
            case "EXPRESS":
                cost = order.getWeight() * 1.5 + 10;
                break;
            case "OVERNIGHT":
                cost = order.getWeight() * 3.0 + 25;
                break;
            default:
                throw new IllegalArgumentException("Unknown shipping method");
        }
        
        return cost;
    }
}
```

這段程式碼違反了 OCP，因為：

!!!error "🚫 識別出的 OCP 違規"
    **擴展需要修改**
    - 新增新的運輸方式需要改變這個類別
    - 必須修改 switch 陳述式
    - 必須重新編譯和重新測試現有程式碼
    
    **分散的邏輯**
    - 運輸計算邏輯嵌入在 switch 中
    - 無法獨立測試運輸方式
    - 無法在其他地方重用運輸邏輯
    
    **脆弱性**
    - 容易忘記更新所有 switch 陳述式
    - 破壞現有運輸方式的風險
    - 新方法沒有編譯時安全性

當你需要新增「INTERNATIONAL」運輸時會發生什麼？你修改這個類別。當你新增「SAME_DAY」運輸時？再次修改。每個新的運輸方式都需要改變已測試的、工作的程式碼。

### 重構以遵循 OCP

應用抽象使程式碼對擴展開放：

```java
// 抽象：定義契約
public interface ShippingStrategy {
    double calculateCost(Order order);
    String getName();
}

// 具體實作：每個運輸方式是一個單獨的類別
public class StandardShipping implements ShippingStrategy {
    @Override
    public double calculateCost(Order order) {
        return order.getWeight() * 0.5;
    }
    
    @Override
    public String getName() {
        return "STANDARD";
    }
}

public class ExpressShipping implements ShippingStrategy {
    @Override
    public double calculateCost(Order order) {
        return order.getWeight() * 1.5 + 10;
    }
    
    @Override
    public String getName() {
        return "EXPRESS";
    }
}

public class OvernightShipping implements ShippingStrategy {
    @Override
    public double calculateCost(Order order) {
        return order.getWeight() * 3.0 + 25;
    }
    
    @Override
    public String getName() {
        return "OVERNIGHT";
    }
}

// 計算器現在使用抽象
public class ShippingCalculator {
    private Map<String, ShippingStrategy> strategies = new HashMap<>();
    
    public ShippingCalculator() {
        // 註冊可用的策略
        registerStrategy(new StandardShipping());
        registerStrategy(new ExpressShipping());
        registerStrategy(new OvernightShipping());
    }
    
    public void registerStrategy(ShippingStrategy strategy) {
        strategies.put(strategy.getName(), strategy);
    }
    
    public double calculateShipping(Order order, String shippingMethod) {
        ShippingStrategy strategy = strategies.get(shippingMethod);
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown shipping method: " + shippingMethod);
        }
        return strategy.calculateCost(order);
    }
}
```

現在程式碼遵循 OCP：

!!!success "✅ OCP 的好處"
    **對擴展開放**
    - 透過建立新類別新增新的運輸方式
    - 不修改現有的運輸方式
    - 不修改計算器
    - 註冊新策略就可以工作
    
    **對修改關閉**
    - 現有的運輸方式不變
    - 計算器邏輯不變
    - 已測試的程式碼保持已測試狀態
    - 對工作功能沒有風險
    
    **額外的好處**
    - 每個運輸方式可獨立測試
    - 運輸邏輯可重用
    - 清晰的關注點分離
    - 編譯時類型安全

現在新增「INTERNATIONAL」運輸只需要建立一個新類別：

```java
public class InternationalShipping implements ShippingStrategy {
    @Override
    public double calculateCost(Order order) {
        return order.getWeight() * 5.0 + 50;
    }
    
    @Override
    public String getName() {
        return "INTERNATIONAL";
    }
}

// 註冊它就可以工作——不修改現有程式碼
calculator.registerStrategy(new InternationalShipping());
```

現有程式碼保持不變。不需要重新測試標準、快遞或隔夜運輸。

## 微妙的違規：硬編碼行為

比 switch 陳述式更隱蔽的是具有硬編碼行為的類別，它們在不修改的情況下抗拒擴展。

### 報告產生器問題

考慮一個產生不同格式的報告產生器：

```python
class ReportGenerator:
    def generate_report(self, data, format_type):
        if format_type == "PDF":
            # PDF 產生邏輯
            pdf_content = "<PDF>"
            for item in data:
                pdf_content += f"<p>{item['name']}: {item['value']}</p>"
            pdf_content += "</PDF>"
            return pdf_content
            
        elif format_type == "HTML":
            # HTML 產生邏輯
            html_content = "<html><body>"
            for item in data:
                html_content += f"<div>{item['name']}: {item['value']}</div>"
            html_content += "</body></html>"
            return html_content
            
        elif format_type == "CSV":
            # CSV 產生邏輯
            csv_content = "Name,Value\n"
            for item in data:
                csv_content += f"{item['name']},{item['value']}\n"
            return csv_content
            
        else:
            raise ValueError(f"Unsupported format: {format_type}")
```

這違反了 OCP，因為：

!!!warning "⚠️ 隱藏的 OCP 違規"
    **格式邏輯嵌入**
    - 所有格式邏輯在一個方法中
    - 無法在不修改類別的情況下新增格式
    - 無法獨立測試格式
    
    **不斷增長的複雜性**
    - 每個新格式都會增長方法
    - 變得更難理解
    - 增加錯誤的風險
    
    **緊密耦合**
    - 報告產生器知道所有格式
    - 無法重用格式邏輯
    - 無法組合格式

新增 Excel 格式需要修改這個方法，重新測試所有格式，並有破壞現有功能的風險。

### 使用策略模式重構

應用策略模式以遵循 OCP：

```python
# 抽象：定義契約
from abc import ABC, abstractmethod

class ReportFormatter(ABC):
    @abstractmethod
    def format(self, data):
        pass
    
    @abstractmethod
    def get_name(self):
        pass

# 具體實作
class PDFFormatter(ReportFormatter):
    def format(self, data):
        pdf_content = "<PDF>"
        for item in data:
            pdf_content += f"<p>{item['name']}: {item['value']}</p>"
        pdf_content += "</PDF>"
        return pdf_content
    
    def get_name(self):
        return "PDF"

class HTMLFormatter(ReportFormatter):
    def format(self, data):
        html_content = "<html><body>"
        for item in data:
            html_content += f"<div>{item['name']}: {item['value']}</div>"
        html_content += "</body></html>"
        return html_content
    
    def get_name(self):
        return "HTML"

class CSVFormatter(ReportFormatter):
    def format(self, data):
        csv_content = "Name,Value\n"
        for item in data:
            csv_content += f"{item['name']},{item['value']}\n"
        return csv_content
    
    def get_name(self):
        return "CSV"

# 產生器使用抽象
class ReportGenerator:
    def __init__(self):
        self.formatters = {}
    
    def register_formatter(self, formatter):
        self.formatters[formatter.get_name()] = formatter
    
    def generate_report(self, data, format_type):
        formatter = self.formatters.get(format_type)
        if not formatter:
            raise ValueError(f"Unsupported format: {format_type}")
        return formatter.format(data)

# 使用
generator = ReportGenerator()
generator.register_formatter(PDFFormatter())
generator.register_formatter(HTMLFormatter())
generator.register_formatter(CSVFormatter())

# 新增 Excel 格式——不修改現有程式碼
class ExcelFormatter(ReportFormatter):
    def format(self, data):
        # Excel 產生邏輯
        return "Excel content"
    
    def get_name(self):
        return "EXCEL"

generator.register_formatter(ExcelFormatter())
```

重構後的設計：

!!!success "✅ 無需修改的擴展"
    **新格式作為新類別**
    - 每個格式都是獨立的
    - 新增格式而不觸及現有程式碼
    - 單獨測試新格式
    
    **產生器不變**
    - 與任何格式化器一起工作
    - 不知道特定格式
    - 委託給抽象
    
    **靈活性**
    - 可以組合格式化器
    - 可以裝飾格式化器
    - 可以在執行時設定

## 過度工程陷阱：過早抽象

雖然 OCP 防止僵化，但過度熱衷的應用透過過早抽象創造不必要的複雜性。

### 過度抽象的範例

考慮這個簡單計算器的過度靈活設計：

```typescript
// 抽象操作
interface Operation {
    execute(a: number, b: number): number;
    getName(): string;
}

// 具體操作
class AddOperation implements Operation {
    execute(a: number, b: number): number {
        return a + b;
    }
    getName(): string {
        return "add";
    }
}

class SubtractOperation implements Operation {
    execute(a: number, b: number): number {
        return a - b;
    }
    getName(): string {
        return "subtract";
    }
}

class MultiplyOperation implements Operation {
    execute(a: number, b: number): number {
        return a * b;
    }
    getName(): string {
        return "multiply";
    }
}

class DivideOperation implements Operation {
    execute(a: number, b: number): number {
        if (b === 0) throw new Error("Division by zero");
        return a / b;
    }
    getName(): string {
        return "divide";
    }
}

// 具有外掛架構的計算器
class Calculator {
    private operations: Map<string, Operation> = new Map();
    
    registerOperation(operation: Operation): void {
        this.operations.set(operation.getName(), operation);
    }
    
    calculate(operationName: string, a: number, b: number): number {
        const operation = this.operations.get(operationName);
        if (!operation) {
            throw new Error(`Unknown operation: ${operationName}`);
        }
        return operation.execute(a, b);
    }
}

// 使用需要儀式
const calc = new Calculator();
calc.registerOperation(new AddOperation());
calc.registerOperation(new SubtractOperation());
calc.registerOperation(new MultiplyOperation());
calc.registerOperation(new DivideOperation());

const result = calc.calculate("add", 5, 3);
```

這個設計走得太遠了：

!!!error "🚫 過度工程問題"
    **不必要的複雜性**
    - 簡單操作被埋在抽象中
    - 基本算術需要四個類別
    - 標準操作的註冊儀式
    
    **不太可能的擴展**
    - 你多久新增一次新的算術操作？
    - 基本數學操作是穩定的
    - 抽象解決了不存在的問題
    
    **降低的清晰度**
    - 更難理解程式碼做什麼
    - 更多檔案需要導覽
    - 間接性模糊了簡單邏輯

### 找到正確的平衡

穩定需求的更簡單設計：

```typescript
class Calculator {
    add(a: number, b: number): number {
        return a + b;
    }
    
    subtract(a: number, b: number): number {
        return a - b;
    }
    
    multiply(a: number, b: number): number {
        return a * b;
    }
    
    divide(a: number, b: number): number {
        if (b === 0) throw new Error("Division by zero");
        return a / b;
    }
}

// 使用很直接
const calc = new Calculator();
const result = calc.add(5, 3);
```

這個更簡單的設計：

!!!success "✅ 適當的簡單性"
    **清晰和直接**
    - 每個方法做什麼很明顯
    - 沒有不必要的間接性
    - 易於理解和使用
    
    **滿足需求**
    - 基本操作很少改變
    - 沒有需要擴展的證據
    - YAGNI：你不會需要它
    
    **以後易於重構**
    - 如果擴展變得必要，那時再重構
    - 不要預先支付複雜性成本
    - 等待實際需求

關鍵見解：當你有證據表明需要擴展時應用 OCP，而不是投機性地。

## 何時應用 OCP：變化點測試

如何確定何時應用 OCP？尋找變化點——需求可能改變或擴展的地方。

### 識別變化點

考慮一個支付處理系統：

```java
public class PaymentProcessor {
    public void processPayment(Payment payment) {
        // 驗證支付
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Invalid amount");
        }
        
        // 根據類型處理
        if (payment.getType().equals("CREDIT_CARD")) {
            processCreditCard(payment);
        } else if (payment.getType().equals("PAYPAL")) {
            processPayPal(payment);
        } else if (payment.getType().equals("BANK_TRANSFER")) {
            processBankTransfer(payment);
        }
        
        // 記錄交易
        logTransaction(payment);
    }
    
    private void processCreditCard(Payment payment) {
        // 信用卡處理邏輯
    }
    
    private void processPayPal(Payment payment) {
        // PayPal 處理邏輯
    }
    
    private void processBankTransfer(Payment payment) {
        // 銀行轉帳處理邏輯
    }
    
    private void logTransaction(Payment payment) {
        System.out.println("Processed: " + payment);
    }
}
```

應用變化點測試：

!!!anote "🔍 變化點分析"
    **支付方式（高變化）**
    - 經常新增新的支付方式
    - 每種方式都有獨特的處理邏輯
    - 業務希望支援更多提供商
    - **結論：在這裡應用 OCP**
    
    **驗證邏輯（低變化）**
    - 金額驗證是穩定的
    - 很少改變
    - 對所有支付類型相同
    - **結論：保持簡單**
    
    **日誌記錄（低變化）**
    - 日誌格式是穩定的
    - 在支付類型之間一致
    - 沒有需要變化的證據
    - **結論：保持簡單**

### 選擇性應用 OCP

只重構變化點：

```java
// 對支付方式應用 OCP
public interface PaymentMethod {
    void process(Payment payment);
    String getType();
}

public class CreditCardPayment implements PaymentMethod {
    @Override
    public void process(Payment payment) {
        // 信用卡處理邏輯
    }
    
    @Override
    public String getType() {
        return "CREDIT_CARD";
    }
}

public class PayPalPayment implements PaymentMethod {
    @Override
    public void process(Payment payment) {
        // PayPal 處理邏輯
    }
    
    @Override
    public String getType() {
        return "PAYPAL";
    }
}

// 處理器僅對變化點使用抽象
public class PaymentProcessor {
    private Map<String, PaymentMethod> paymentMethods = new HashMap<>();
    
    public void registerPaymentMethod(PaymentMethod method) {
        paymentMethods.put(method.getType(), method);
    }
    
    public void processPayment(Payment payment) {
        // 驗證保持簡單——沒有變化
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Invalid amount");
        }
        
        // 支付處理使用抽象——高變化
        PaymentMethod method = paymentMethods.get(payment.getType());
        if (method == null) {
            throw new IllegalArgumentException("Unsupported payment type");
        }
        method.process(payment);
        
        // 日誌記錄保持簡單——沒有變化
        logTransaction(payment);
    }
    
    private void logTransaction(Payment payment) {
        System.out.println("Processed: " + payment);
    }
}
```

這種選擇性方法：

!!!success "✅ 平衡的設計"
    **需要的地方抽象**
    - 支付方式是可擴展的
    - 新方式不修改現有程式碼
    - 每種方式可獨立測試
    
    **適當的地方簡單**
    - 驗證邏輯保持直接
    - 日誌邏輯保持直接
    - 沒有不必要的抽象
    
    **實用的權衡**
    - 只在增加價值的地方增加複雜性
    - 易於理解整體流程
    - 如果以後需要可以重構其他部分

## 實際應用：外掛架構

OCP 在外掛架構中大放異彩，其中可擴展性是核心需求。

### 外掛系統

考慮一個支援外掛的文字編輯器：

```python
# 核心抽象
class EditorPlugin(ABC):
    @abstractmethod
    def get_name(self):
        pass
    
    @abstractmethod
    def execute(self, context):
        pass

# 核心編輯器——對修改關閉
class TextEditor:
    def __init__(self):
        self.plugins = {}
        self.text = ""
    
    def register_plugin(self, plugin):
        self.plugins[plugin.get_name()] = plugin
    
    def execute_plugin(self, plugin_name):
        plugin = self.plugins.get(plugin_name)
        if not plugin:
            raise ValueError(f"Plugin not found: {plugin_name}")
        
        context = {"text": self.text, "editor": self}
        result = plugin.execute(context)
        if result:
            self.text = result.get("text", self.text)
    
    def get_text(self):
        return self.text
    
    def set_text(self, text):
        self.text = text

# 外掛——對擴展開放
class UpperCasePlugin(EditorPlugin):
    def get_name(self):
        return "uppercase"
    
    def execute(self, context):
        text = context["text"]
        return {"text": text.upper()}

class WordCountPlugin(EditorPlugin):
    def get_name(self):
        return "wordcount"
    
    def execute(self, context):
        text = context["text"]
        count = len(text.split())
        print(f"Word count: {count}")
        return None

class ReversePlugin(EditorPlugin):
    def get_name(self):
        return "reverse"
    
    def execute(self, context):
        text = context["text"]
        return {"text": text[::-1]}

# 使用
editor = TextEditor()
editor.register_plugin(UpperCasePlugin())
editor.register_plugin(WordCountPlugin())
editor.register_plugin(ReversePlugin())

editor.set_text("Hello World")
editor.execute_plugin("uppercase")
print(editor.get_text())  # HELLO WORLD

# 第三方外掛——不修改編輯器
class SpellCheckPlugin(EditorPlugin):
    def get_name(self):
        return "spellcheck"
    
    def execute(self, context):
        # 拼字檢查邏輯
        print("Spell check complete")
        return None

editor.register_plugin(SpellCheckPlugin())
editor.execute_plugin("spellcheck")
```

這個架構展示了 OCP 的最佳狀態：

!!!success "✅ 真正的可擴展性"
    **核心穩定性**
    - 編輯器程式碼永不改變
    - 已測試的功能保持已測試狀態
    - 對現有功能沒有風險
    
    **無限擴展**
    - 任何人都可以建立外掛
    - 外掛彼此不知道
    - 可以在沒有原始碼存取的情況下新增功能
    
    **真正的業務價值**
    - 第三方外掛生態系統
    - 使用者根據需要自訂
    - 平台在沒有供應商努力的情況下成長

## 結論

開閉原則提供了一個強大的機制來建構可以在不破壞的情況下演進的靈活系統。透過使程式碼對擴展開放但對修改關閉，OCP 減少了向已測試功能引入錯誤的風險，同時啟用新功能。然而，應用 OCP 需要判斷力——它不是關於到處建立抽象，而是關於識別真正的變化點。

有效應用 OCP 的關鍵是識別何時可能需要擴展。處理不同情況的 switch 陳述式和 if-else 鏈代表明顯的違規——每個新情況都需要修改現有程式碼。這些是透過介面和多型進行抽象的主要候選者。策略模式提供了一種直接的方法來消除這些違規，使每個情況成為可以在不修改現有程式碼的情況下新增的單獨類別。

微妙的違規更隱蔽，表現為隨著每個新需求而增長的方法。嵌入格式邏輯的報告產生器、硬編碼支付方式的支付處理器以及知道所有傳遞管道的通知系統都違反了 OCP。這些類別隨著需求的演進變得越來越複雜和脆弱。重構為抽象允許將新格式、支付方式和管道作為新類別新增。

然而，過早的抽象會創造不必要的複雜性。具有基本算術操作外掛架構的計算器是過度工程的——操作是穩定的，不太可能改變。YAGNI 原則（你不會需要它）適用：不要為假設的未來需求建立抽象。在有證據表明需要擴展之前，等待，然後再支付抽象的複雜性成本。

變化點測試提供了一種實用的方法來識別 OCP 增加價值的地方。分析系統的每個部分：這可能會改變嗎？我們經常在這裡新增新情況嗎？這是需要靈活性的業務差異化因素嗎？高變化點受益於 OCP；穩定的、低變化的程式碼應該保持簡單。這種選擇性應用平衡了靈活性和清晰度。

外掛架構展示了 OCP 的最佳狀態。文字編輯器、IDE、Web 瀏覽器和內容管理系統都受益於允許無限擴展而不修改核心程式碼的外掛系統。這些系統提供真正的業務價值——第三方擴充的生態系統在沒有供應商努力的情況下成長平台。當可擴展性是核心需求時，OCP 是必不可少的。

開閉原則既強大又容易被誤用。「對擴展開放，對修改關閉」的陳述很簡單，但知道何時應用它需要判斷力。透過關注變化點、等待需求的證據以及避免過早抽象，你可以建立既靈活又可維護的設計——在不破壞現有功能的情況下優雅地擴展。
