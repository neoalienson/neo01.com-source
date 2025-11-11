---
title: "介面隔離原則：不應強迫客戶端依賴未使用的方法"
date: 2021-11-01
lang: zh-TW
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "不應強迫客戶端依賴它們不使用的介面。這一原則防止臃腫介面給實作者帶來不必要方法的負擔，但開發者經常創建違反它的臃腫抽象。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

介面隔離原則（ISP）是SOLID設計中的第四個原則，它指出：「不應強迫客戶端依賴它們不使用的方法。」由Robert C. Martin提出，ISP解決了「臃腫介面」的問題——捆綁了太多職責的抽象，迫使實作者提供樁方法或為它們不支援的功能拋出例外。雖然這聽起來很簡單，但ISP違規在程式碼庫中普遍存在，因為便利性勝過了適當的抽象。

本文透過介面變得過大的實際場景來探討介面隔離原則。從全能工作者介面到廚房水槽API，我們將剖析什麼使介面具有內聚性、如何檢測臃腫，以及為什麼更小、更專注的介面會導致更可維護的系統。透過生產環境範例和重構模式，我們揭示了為什麼ISP是清晰抽象的守護者。

## 理解介面隔離

在深入研究違規之前，理解介面隔離的含義以及為什麼它很重要至關重要。

### 隔離意味著什麼？

該原則要求將大型介面拆分為更小、更具體的介面：

!!!anote "📚 介面隔離定義"
    **客戶端特定介面**
    - 介面針對客戶端需求定製
    - 沒有未使用的方法依賴
    - 客戶端僅依賴它們使用的內容
    - 多個小介面優於一個大介面
    
    **內聚性要求**
    - 方法屬於一起
    - 單一、專注的目的
    - 相關操作分組
    - 最小介面表面
    
    **實作自由**
    - 類別僅實作需要的介面
    - 沒有強制的樁方法
    - 沒有UnsupportedOperationException
    - 自然、完整的實作

ISP確保抽象不會給客戶端帶來不必要的複雜性負擔。

### 為什麼ISP很重要

違反ISP會在整個程式碼庫中產生級聯問題：

!!!warning "⚠️ 違反ISP的代價"
    **實作負擔**
    - 被迫實作未使用的方法
    - 樁方法使程式碼混亂
    - 為不支援的操作拋出例外
    - 違反里氏替換原則
    
    **緊密耦合**
    - 客戶端依賴它們不使用的方法
    - 對未使用方法的更改強制重新編譯
    - 介面更改破壞不相關的客戶端
    - 整個程式碼庫的連鎖反應
    
    **維護複雜性**
    - 難以理解實際使用的內容
    - 難以安全地演化介面
    - 測試變得複雜
    - 文件具有誤導性

這些違規使程式碼變得僵化、脆弱且難以維護。

## 經典違規：臃腫的工作者介面

最常見的ISP違規之一發生在單個介面試圖服務多種客戶端類型時。

### 全能介面

考慮這個過於寬泛的工作者介面：

```python
from abc import ABC, abstractmethod

class Worker(ABC):
    @abstractmethod
    def work(self):
        pass
    
    @abstractmethod
    def eat(self):
        pass
    
    @abstractmethod
    def sleep(self):
        pass
    
    @abstractmethod
    def get_paid(self):
        pass

class HumanWorker(Worker):
    def work(self):
        print("Human working")
    
    def eat(self):
        print("Human eating lunch")
    
    def sleep(self):
        print("Human sleeping")
    
    def get_paid(self):
        print("Human receiving salary")

# 機器人工作者不吃飯也不睡覺！
class RobotWorker(Worker):
    def work(self):
        print("Robot working")
    
    def eat(self):
        raise NotImplementedError("Robots don't eat")  # ✗ 違規！
    
    def sleep(self):
        raise NotImplementedError("Robots don't sleep")  # ✗ 違規！
    
    def get_paid(self):
        print("Robot maintenance scheduled")
```

這違反了ISP，因為：

!!!error "🚫 識別出的ISP違規"
    **強制依賴**
    - RobotWorker被迫實作eat()和sleep()
    - 方法拋出例外
    - 介面對所有實作者來說太寬泛
    - 客戶端依賴它們不應該依賴的方法
    
    **契約被破壞**
    - 違反里氏替換原則
    - 替換在執行時失敗
    - 意外的例外
    - 不可靠的多型性
    
    **內聚性差**
    - 生物和機械關注點混合
    - 介面服務多種客戶端類型
    - 沒有單一、專注的目的
    - 難以擴充

使用多型時違規變得明顯：

```python
def manage_workers(workers):
    for worker in workers:
        worker.work()
        worker.eat()   # ✗ 對機器人崩潰！
        worker.sleep() # ✗ 對機器人崩潰！

workers = [HumanWorker(), RobotWorker()]
manage_workers(workers)  # ✗ 拋出NotImplementedError
```


### 使用隔離介面重構

將臃腫介面拆分為專注、內聚的介面：

```python
from abc import ABC, abstractmethod

# 所有工作者共享的核心介面
class Workable(ABC):
    @abstractmethod
    def work(self):
        pass

# 生物需求介面
class Biological(ABC):
    @abstractmethod
    def eat(self):
        pass
    
    @abstractmethod
    def sleep(self):
        pass

# 薪酬介面
class Payable(ABC):
    @abstractmethod
    def get_paid(self):
        pass

# 人類工作者實作所有相關介面
class HumanWorker(Workable, Biological, Payable):
    def work(self):
        print("Human working")
    
    def eat(self):
        print("Human eating lunch")
    
    def sleep(self):
        print("Human sleeping")
    
    def get_paid(self):
        print("Human receiving salary")

# 機器人工作者僅實作它們需要的
class RobotWorker(Workable, Payable):
    def work(self):
        print("Robot working")
    
    def get_paid(self):
        print("Robot maintenance scheduled")

# 客戶端程式碼使用特定介面
def manage_work(workers: list[Workable]):
    for worker in workers:
        worker.work()  # ✓ 對所有工作者安全

def manage_breaks(biologicals: list[Biological]):
    for bio in biologicals:
        bio.eat()
        bio.sleep()  # ✓ 僅對生物工作者安全

def process_payroll(payables: list[Payable]):
    for payable in payables:
        payable.get_paid()  # ✓ 對所有可支付實體安全
```

現在程式碼遵循ISP：

!!!success "✅ ISP的好處"
    **專注的介面**
    - 每個介面都有單一目的
    - 方法自然地屬於一起
    - 沒有強制實作
    - 清晰、內聚的契約
    
    **靈活的組合**
    - 類別僅實作需要的介面
    - 易於新增新的工作者類型
    - 沒有樁方法或例外
    - 自然、完整的實作
    
    **客戶端獨立性**
    - 客戶端僅依賴它們使用的內容
    - 更改不影響不相關的客戶端
    - 類型安全的多型性
    - 可靠的替換

## 微妙的違規：廚房水槽API

另一個常見的ISP違規發生在API增長以適應每個可能的用例時。

### 臃腫的文件介面

考慮這個過於全面的文件介面：

```java
public interface Document {
    // 基本操作
    String getContent();
    void setContent(String content);
    
    // 格式化
    void applyBold();
    void applyItalic();
    void setFontSize(int size);
    void setFontColor(String color);
    
    // 持久化
    void save();
    void load();
    void export(String format);
    
    // 協作
    void share(String email);
    void addComment(String comment);
    void trackChanges(boolean enabled);
    
    // 分析
    int getWordCount();
    int getReadingTime();
    void logAccess(String userId);
}

// 簡單文字文件不需要大多數這些
public class PlainTextDocument implements Document {
    private String content;
    
    @Override
    public String getContent() { return content; }
    
    @Override
    public void setContent(String content) { this.content = content; }
    
    // 被迫實作格式化方法
    @Override
    public void applyBold() {
        throw new UnsupportedOperationException("Plain text doesn't support formatting");
    }
    
    @Override
    public void applyItalic() {
        throw new UnsupportedOperationException("Plain text doesn't support formatting");
    }
    
    @Override
    public void setFontSize(int size) {
        throw new UnsupportedOperationException("Plain text doesn't support formatting");
    }
    
    @Override
    public void setFontColor(String color) {
        throw new UnsupportedOperationException("Plain text doesn't support formatting");
    }
    
    // 被迫實作協作方法
    @Override
    public void share(String email) {
        throw new UnsupportedOperationException("Plain text doesn't support sharing");
    }
    
    @Override
    public void addComment(String comment) {
        throw new UnsupportedOperationException("Plain text doesn't support comments");
    }
    
    @Override
    public void trackChanges(boolean enabled) {
        throw new UnsupportedOperationException("Plain text doesn't support change tracking");
    }
    
    // 基本實作
    @Override
    public void save() { /* save to file */ }
    
    @Override
    public void load() { /* load from file */ }
    
    @Override
    public void export(String format) { /* basic export */ }
    
    @Override
    public int getWordCount() { return content.split("\\s+").length; }
    
    @Override
    public int getReadingTime() { return getWordCount() / 200; }
    
    @Override
    public void logAccess(String userId) { /* log access */ }
}
```

這違反了ISP，因為：

!!!error "🚫 識別出的ISP違規"
    **過度的介面**
    - 單個介面有14個方法
    - 多個不相關的職責
    - 大多數實作者只需要子集
    - 強制樁實作
    
    **客戶端困惑**
    - 不清楚支援哪些方法
    - 執行時例外而不是編譯時安全
    - 文件與現實不符
    - 不可靠的多型性
    
    **維護負擔**
    - 介面更改影響所有實作者
    - 難以新增新的文件類型
    - 未使用的方法使測試複雜化
    - 跨功能的緊密耦合


### 使用角色介面重構

根據客戶端角色和能力拆分介面：

```java
// 核心文件介面
public interface Readable {
    String getContent();
}

public interface Writable {
    void setContent(String content);
}

// 格式化能力
public interface Formattable {
    void applyBold();
    void applyItalic();
    void setFontSize(int size);
    void setFontColor(String color);
}

// 持久化能力
public interface Persistable {
    void save();
    void load();
    void export(String format);
}

// 協作能力
public interface Shareable {
    void share(String email);
    void addComment(String comment);
    void trackChanges(boolean enabled);
}

// 分析能力
public interface Analyzable {
    int getWordCount();
    int getReadingTime();
    void logAccess(String userId);
}

// 純文字僅實作它需要的
public class PlainTextDocument implements Readable, Writable, Persistable, Analyzable {
    private String content;
    
    @Override
    public String getContent() { return content; }
    
    @Override
    public void setContent(String content) { this.content = content; }
    
    @Override
    public void save() { /* save to file */ }
    
    @Override
    public void load() { /* load from file */ }
    
    @Override
    public void export(String format) { /* basic export */ }
    
    @Override
    public int getWordCount() { return content.split("\\s+").length; }
    
    @Override
    public int getReadingTime() { return getWordCount() / 200; }
    
    @Override
    public void logAccess(String userId) { /* log access */ }
}

// 富文字文件實作所有能力
public class RichTextDocument implements Readable, Writable, Formattable, 
                                         Persistable, Shareable, Analyzable {
    // 所有介面的完整實作
}

// 客戶端僅依賴它們需要的
public class DocumentViewer {
    public void display(Readable document) {
        System.out.println(document.getContent());
    }
}

public class DocumentEditor {
    public void edit(Readable & Writable document, String newContent) {
        document.setContent(newContent);
    }
}

public class FormattingToolbar {
    public void formatSelection(Formattable document) {
        document.applyBold();
    }
}
```

現在程式碼遵循ISP：

!!!success "✅ ISP的好處"
    **內聚的介面**
    - 每個介面專注於單一能力
    - 方法自然相關
    - 清晰的目的和職責
    - 易於理解
    
    **實作自由**
    - 類別僅實作需要的能力
    - 沒有強制的樁方法
    - 沒有執行時例外
    - 完整、自然的實作
    
    **客戶端清晰性**
    - 客戶端宣告確切的依賴
    - 編譯時安全
    - 清晰的能力要求
    - 可靠的多型性

## 檢測ISP違規

識別ISP違規需要檢查介面內聚性和客戶端使用模式。

### 警告信號

注意這些ISP違規的指標：

!!!warning "🔍 ISP違規指標"
    **實作異味**
    - 空方法實作
    - 拋出UnsupportedOperationException的方法
    - NotImplementedException模式
    - 帶有TODO註解的樁方法
    
    **介面特徵**
    - 大量方法（>7-10）
    - 不相關的方法組
    - 不同客戶端使用的方法
    - 多個更改原因
    
    **客戶端模式**
    - 客戶端僅使用介面的子集
    - 方法呼叫前的類型檢查
    - 文件警告不支援的方法
    - 圍繞介面的防禦性程式設計
    
    **演化問題**
    - 新增方法破壞許多實作者
    - 難以新增新實作
    - 介面更改廣泛傳播
    - 頻繁的破壞性更改

### 介面內聚性測試

應用此測試來評估介面內聚性：

```typescript
// 測試：所有方法是否屬於一起？
interface Printer {
    print(document: string): void;
    scan(document: string): string;
    fax(document: string, number: string): void;
    staple(pages: number): void;
}

// 分析：多個職責
// - 列印：print()
// - 掃描：scan()
// - 傳真：fax()
// - 裝訂：staple()

// ISP違規：並非所有印表機都支援所有操作
class SimplePrinter implements Printer {
    print(document: string): void {
        console.log("Printing:", document);
    }
    
    scan(document: string): string {
        throw new Error("Scanning not supported");  // ✗ 違規！
    }
    
    fax(document: string, number: string): void {
        throw new Error("Faxing not supported");  // ✗ 違規！
    }
    
    staple(pages: number): void {
        throw new Error("Stapling not supported");  // ✗ 違規！
    }
}

// 重構：隔離的介面
interface Printable {
    print(document: string): void;
}

interface Scannable {
    scan(document: string): string;
}

interface Faxable {
    fax(document: string, number: string): void;
}

interface Finishable {
    staple(pages: number): void;
}

// 簡單印表機僅實作它支援的
class SimplePrinter implements Printable {
    print(document: string): void {
        console.log("Printing:", document);
    }
}

// 多功能印表機實作所有能力
class MultiFunctionPrinter implements Printable, Scannable, Faxable, Finishable {
    print(document: string): void { /* implementation */ }
    scan(document: string): string { /* implementation */ return ""; }
    fax(document: string, number: string): void { /* implementation */ }
    staple(pages: number): void { /* implementation */ }
}

// 客戶端僅依賴需要的能力
function printDocument(printer: Printable, doc: string): void {
    printer.print(doc);  // ✓ 對所有Printable裝置安全
}

function digitizeDocument(scanner: Scannable, doc: string): string {
    return scanner.scan(doc);  // ✓ 對所有Scannable裝置安全
}
```


## 何時應用ISP

知道何時隔離介面與知道如何隔離同樣重要。

### 應用ISP的時機

在這些情況下隔離介面：

!!!tip "✅ 何時隔離介面"
    **多種客戶端類型**
    - 不同的客戶端使用不同的方法
    - 客戶端有不同的需求
    - 使用模式明確分離
    - 出現自然分組
    
    **實作差異**
    - 某些實作者無法支援所有方法
    - 出現樁方法
    - 為不支援的操作拋出例外
    - 部分實作很常見
    
    **演化壓力**
    - 介面隨時間增長
    - 頻繁新增新方法
    - 更改影響不相關的客戶端
    - 破壞性更改很常見
    
    **清晰的職責**
    - 方法分組為不同的能力
    - 多個更改原因
    - 混合不相關的關注點
    - 缺乏內聚性

### 避免過早隔離

不要過早地過度隔離介面：

!!!warning "⚠️ 何時不隔離"
    **穩定、內聚的介面**
    - 所有方法自然地屬於一起
    - 所有實作者支援所有方法
    - 單一、清晰的目的
    - 沒有強制實作
    
    **單一客戶端類型**
    - 只有一種類型的客戶端
    - 所有客戶端使用所有方法
    - 沒有使用模式差異
    - 沒有實作問題
    
    **過早最佳化**
    - 沒有當前問題
    - 推測未來需求
    - 過度工程化抽象
    - 增加複雜性而無益處
    
    **原子操作**
    - 方法必須一起使用
    - 拆分破壞語義
    - 操作形成交易
    - 會失去內聚性

從內聚的介面開始，當問題出現時再隔離。

## 結論

介面隔離原則保護客戶端免於依賴它們不使用的方法。透過將臃腫介面拆分為專注、內聚的抽象，ISP減少了耦合，消除了強制實作，並使系統更加靈活和可維護。

關鍵要點：

!!!success "🎯 ISP指南"
    **設計專注的介面**
    - 保持介面小而內聚
    - 將相關方法分組在一起
    - 服務特定的客戶端需求
    - 避免廚房水槽抽象
    
    **啟用靈活的組合**
    - 允許類別實作多個介面
    - 優先選擇多個小介面而不是少數大介面
    - 讓客戶端僅依賴它們使用的內容
    - 支援自然、完整的實作
    
    **識別違規**
    - 注意樁方法和例外
    - 注意客戶端僅使用子集時
    - 識別不相關的方法組
    - 檢測實作負擔
    
    **深思熟慮地重構**
    - 當問題出現時隔離
    - 不要過早地過度工程化
    - 在介面內保持內聚性
    - 平衡粒度與實用性

ISP與其他SOLID原則協同工作：它透過保持介面專注來支援單一職責，透過允許透過新介面擴充來啟用開閉原則，並透過防止強制實作來加強里氏替換。這些原則共同創建了既強大又可維護的抽象。

本系列的下一篇文章將探討依賴反轉原則，它透過解決高層和低層模組應如何透過抽象關聯來完成SOLID。
