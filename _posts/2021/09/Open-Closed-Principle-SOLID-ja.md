---
title: "開閉原則：壊さずに拡張する"
date: 2021-09-12
lang: ja
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "ソフトウェアエンティティは拡張に対して開いており、修正に対して閉じているべきである。この原則は脆弱性なしに柔軟性を約束するが、開発者は抽象化をいつ適用すべきか、いつそれが過剰設計になるかで苦労している。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

開閉原則（OCP）はSOLID設計における2番目の原則ですが、最も誤解されやすい原則かもしれません。Bertrand Meyerによって提唱され、Robert C. Martinによって普及されたこの原則は、「ソフトウェアエンティティは拡張に対して開いており、修正に対して閉じているべきである」と述べています。この一見矛盾した原則は、既存のコードを変更せずに新しい機能を追加する能力を約束します。しかし、開発者は次のような疑問に直面します：いつ抽象化を作成すべきか？どの程度の柔軟性が過剰か？OCPに従うことで実際にコードがより複雑になる可能性はあるか？

本稿では、硬直したswitch文から過剰設計されたプラグインアーキテクチャまで、実際のシナリオを通じて開閉原則を検証します。「拡張に対して開いている」が実際に何を意味するのか、抽象化がいつ価値を追加するのか、いつ不要な複雑さを生み出すのかを解剖します。本番コードベースとリファクタリングの経験から、OCPがなぜ強力でありながら誤用されやすいのかを明らかにします。

## 開閉原則の理解

OCPをいつ、どのように適用するかに入る前に、この原則が実際に何を意味するのかを理解することが不可欠です。「拡張に対して開いており、修正に対して閉じている」という用語は、最初は矛盾しているように聞こえます。

### 開閉とは何を意味するか？

この原則には、連携する2つの部分があります：

!!!anote "📚 開閉の定義"
    **拡張に対して開いている**
    - 新しい機能を追加できる
    - 新しい動作を導入できる
    - 新しい要件をサポートできる
    - 既存のコードに触れずに
    
    **修正に対して閉じている**
    - 既存のコードは変更されない
    - テスト済みのコードはテスト済みのまま
    - 動作するコードは動作し続ける
    - 破壊的変更のリスクを減らす
    
    **メカニズム**
    - 抽象化が拡張を可能にする
    - ポリモーフィズムが柔軟性を提供する
    - 継承または合成が動作を追加する
    - インターフェースが契約を定義する

この原則は、安定したコードを変更から保護することを強調しています。要件が進化するとき、既存の動作するコードを修正するのではなく、システムを拡張します。これにより、テスト済み機能にバグを導入するリスクが減少します。

### なぜOCPが重要か

OCPに違反すると、変更のたびに壊れる脆弱なコードが生まれます：

!!!warning "⚠️ OCPに違反するコスト"
    **修正の波及効果**
    - すべての新機能が既存コードの変更を必要とする
    - 変更がシステム全体に伝播する
    - 動作する機能を壊すリスク
    - 回帰テストの負担が増加する
    
    **結合と硬直性**
    - 新しい要件があらゆる場所での修正を強制する
    - コードが変更に抵抗するようになる
    - 物事を壊すことへの恐れが進化を阻害する
    - 技術的負債が蓄積する
    
    **テストのオーバーヘッド**
    - 修正されたすべてのコードを再テストする必要がある
    - 統合テストが壊れる可能性がある
    - 変更への信頼が低下する
    - デプロイメントリスクが増加する

これらのコストは時間とともに複合します。すべての新機能に対して修正が必要なコードは、変更がますます困難でリスクが高くなります。

## 明白な違反：Switch文

最も露骨なOCP違反は、すべての新しいケースに対して修正が必要なswitch文やif-elseチェーンから生じます。

### 典型的なSwitch文の違反

配送料を計算する一般的なパターンを考えてみましょう：

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

このコードはOCPに違反しています：

!!!error "🚫 特定されたOCP違反"
    **拡張に修正が必要**
    - 新しい配送方法を追加するにはこのクラスを変更する必要がある
    - switch文を修正する必要がある
    - 既存のコードを再コンパイルして再テストする必要がある
    
    **分散したロジック**
    - 配送計算ロジックがswitchに埋め込まれている
    - 配送方法を独立してテストできない
    - 配送ロジックを他の場所で再利用できない
    
    **脆弱性**
    - すべてのswitch文の更新を忘れやすい
    - 既存の配送方法を壊すリスク
    - 新しい方法のコンパイル時安全性がない

「INTERNATIONAL」配送を追加する必要がある場合はどうなりますか？このクラスを修正します。「SAME_DAY」配送を追加する場合は？再度修正します。すべての新しい配送方法は、テスト済みの動作するコードの変更を必要とします。

### OCPに従うためのリファクタリング

抽象化を適用してコードを拡張に対して開きます：

```java
// 抽象化：契約を定義
public interface ShippingStrategy {
    double calculateCost(Order order);
    String getName();
}

// 具体的な実装：各配送方法は別々のクラス
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

// 計算機は抽象化で動作する
public class ShippingCalculator {
    private Map<String, ShippingStrategy> strategies = new HashMap<>();
    
    public ShippingCalculator() {
        // 利用可能な戦略を登録
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

これでコードはOCPに従います：

!!!success "✅ OCPの利点"
    **拡張に対して開いている**
    - 新しいクラスを作成して新しい配送方法を追加
    - 既存の配送方法への修正なし
    - 計算機への修正なし
    - 新しい戦略を登録すれば動作する
    
    **修正に対して閉じている**
    - 既存の配送方法は変更されない
    - 計算機のロジックは変更されない
    - テスト済みのコードはテスト済みのまま
    - 動作する機能へのリスクなし
    
    **追加の利点**
    - 各配送方法を独立してテスト可能
    - 配送ロジックが再利用可能
    - 明確な関心の分離
    - コンパイル時の型安全性

「INTERNATIONAL」配送の追加には、新しいクラスの作成のみが必要です：

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

// 登録すれば動作する——既存コードへの修正なし
calculator.registerStrategy(new InternationalShipping());
```

既存のコードは手つかずのままです。標準、速達、翌日配送の再テストは不要です。

## 微妙な違反：ハードコードされた動作

switch文よりも陰湿なのは、修正なしに拡張に抵抗するハードコードされた動作を持つクラスです。

### レポートジェネレーターの問題

異なる形式を生成するレポートジェネレーターを考えてみましょう：

```python
class ReportGenerator:
    def generate_report(self, data, format_type):
        if format_type == "PDF":
            # PDF生成ロジック
            pdf_content = "<PDF>"
            for item in data:
                pdf_content += f"<p>{item['name']}: {item['value']}</p>"
            pdf_content += "</PDF>"
            return pdf_content
            
        elif format_type == "HTML":
            # HTML生成ロジック
            html_content = "<html><body>"
            for item in data:
                html_content += f"<div>{item['name']}: {item['value']}</div>"
            html_content += "</body></html>"
            return html_content
            
        elif format_type == "CSV":
            # CSV生成ロジック
            csv_content = "Name,Value\n"
            for item in data:
                csv_content += f"{item['name']},{item['value']}\n"
            return csv_content
            
        else:
            raise ValueError(f"Unsupported format: {format_type}")
```

これはOCPに違反しています：

!!!warning "⚠️ 隠れたOCP違反"
    **フォーマットロジックが埋め込まれている**
    - すべてのフォーマットロジックが1つのメソッドに
    - クラスを修正せずにフォーマットを追加できない
    - フォーマットを独立してテストできない
    
    **増大する複雑さ**
    - 新しいフォーマットごとにメソッドが成長する
    - 理解が難しくなる
    - バグのリスクが増加する
    
    **密結合**
    - レポートジェネレーターがすべてのフォーマットを知っている
    - フォーマットロジックを再利用できない
    - フォーマットを組み合わせることができない

Excel形式を追加するには、このメソッドを修正し、すべてのフォーマットを再テストし、既存の機能を壊すリスクがあります。

### ストラテジーパターンでリファクタリング

OCPに従うためにストラテジーパターンを適用します：

```python
# 抽象化：契約を定義
from abc import ABC, abstractmethod

class ReportFormatter(ABC):
    @abstractmethod
    def format(self, data):
        pass
    
    @abstractmethod
    def get_name(self):
        pass

# 具体的な実装
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

# ジェネレーターは抽象化を使用
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

# Excel形式を追加——既存コードへの修正なし
class ExcelFormatter(ReportFormatter):
    def format(self, data):
        # Excel生成ロジック
        return "Excel content"
    
    def get_name(self):
        return "EXCEL"

generator.register_formatter(ExcelFormatter())
```

リファクタリングされた設計：

!!!success "✅ 修正なしの拡張"
    **新しいクラスとしての新しいフォーマット**
    - 各フォーマットは独立している
    - 既存のコードに触れずにフォーマットを追加
    - 新しいフォーマットを単独でテスト
    
    **ジェネレーターは変更されない**
    - 任意のフォーマッターで動作する
    - 特定のフォーマットを知らない
    - 抽象化に委譲する
    
    **柔軟性**
    - フォーマッターを組み合わせることができる
    - フォーマッターを装飾できる
    - 実行時に設定できる

## 過剰設計の罠：早すぎる抽象化

OCPは硬直性を防ぎますが、過度な適用は早すぎる抽象化を通じて不要な複雑さを生み出します。

### 過剰に抽象化された例

シンプルな計算機の過度に柔軟な設計を考えてみましょう：

```typescript
// 抽象操作
interface Operation {
    execute(a: number, b: number): number;
    getName(): string;
}

// 具体的な操作
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

// プラグインアーキテクチャを持つ計算機
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

// 使用には儀式が必要
const calc = new Calculator();
calc.registerOperation(new AddOperation());
calc.registerOperation(new SubtractOperation());
calc.registerOperation(new MultiplyOperation());
calc.registerOperation(new DivideOperation());

const result = calc.calculate("add", 5, 3);
```

この設計は行き過ぎています：

!!!error "🚫 過剰設計の問題"
    **不要な複雑さ**
    - 単純な操作が抽象化に埋もれている
    - 基本的な算術に4つのクラスが必要
    - 標準操作の登録儀式
    
    **ありそうもない拡張**
    - 新しい算術操作をどのくらいの頻度で追加しますか？
    - 基本的な数学操作は安定している
    - 抽象化は存在しない問題を解決している
    
    **低下した明瞭性**
    - コードが何をするのか理解するのが難しい
    - ナビゲートするファイルが増える
    - 間接性が単純なロジックを曖昧にする

### 適切なバランスを見つける

安定した要件のためのよりシンプルな設計：

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

// 使用は簡単
const calc = new Calculator();
const result = calc.add(5, 3);
```

このよりシンプルな設計：

!!!success "✅ 適切なシンプルさ"
    **明確で直接的**
    - 各メソッドが何をするか明白
    - 不要な間接性がない
    - 理解と使用が容易
    
    **要件に十分**
    - 基本操作はめったに変わらない
    - 拡張が必要な証拠がない
    - YAGNI：それは必要ない
    
    **後でリファクタリングしやすい**
    - 拡張が必要になったら、その時リファクタリング
    - 複雑さのコストを前払いしない
    - 実際の要件を待つ

重要な洞察：拡張が必要な証拠がある場合にOCPを適用し、投機的にではありません。

## OCPを適用するタイミング：変動点テスト

OCPをいつ適用するかをどのように判断しますか？変動点を探します——要件が変更または拡張される可能性がある場所です。

### 変動点の特定

支払い処理システムを考えてみましょう：

```java
public class PaymentProcessor {
    public void processPayment(Payment payment) {
        // 支払いを検証
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Invalid amount");
        }
        
        // タイプに基づいて処理
        if (payment.getType().equals("CREDIT_CARD")) {
            processCreditCard(payment);
        } else if (payment.getType().equals("PAYPAL")) {
            processPayPal(payment);
        } else if (payment.getType().equals("BANK_TRANSFER")) {
            processBankTransfer(payment);
        }
        
        // トランザクションをログ記録
        logTransaction(payment);
    }
    
    private void processCreditCard(Payment payment) {
        // クレジットカード処理ロジック
    }
    
    private void processPayPal(Payment payment) {
        // PayPal処理ロジック
    }
    
    private void processBankTransfer(Payment payment) {
        // 銀行振込処理ロジック
    }
    
    private void logTransaction(Payment payment) {
        System.out.println("Processed: " + payment);
    }
}
```

変動点テストを適用します：

!!!anote "🔍 変動点分析"
    **支払い方法（高変動）**
    - 新しい支払い方法が頻繁に追加される
    - 各方法には独自の処理ロジックがある
    - ビジネスはより多くのプロバイダーをサポートしたい
    - **結論：ここでOCPを適用**
    
    **検証ロジック（低変動）**
    - 金額検証は安定している
    - めったに変わらない
    - すべての支払いタイプで同じ
    - **結論：シンプルに保つ**
    
    **ログ記録（低変動）**
    - ログ形式は安定している
    - 支払いタイプ間で一貫している
    - 変動が必要な証拠がない
    - **結論：シンプルに保つ**

### OCPの選択的適用

変動点のみをリファクタリングします：

```java
// 支払い方法にOCPを適用
public interface PaymentMethod {
    void process(Payment payment);
    String getType();
}

public class CreditCardPayment implements PaymentMethod {
    @Override
    public void process(Payment payment) {
        // クレジットカード処理ロジック
    }
    
    @Override
    public String getType() {
        return "CREDIT_CARD";
    }
}

public class PayPalPayment implements PaymentMethod {
    @Override
    public void process(Payment payment) {
        // PayPal処理ロジック
    }
    
    @Override
    public String getType() {
        return "PAYPAL";
    }
}

// プロセッサは変動点のみに抽象化を使用
public class PaymentProcessor {
    private Map<String, PaymentMethod> paymentMethods = new HashMap<>();
    
    public void registerPaymentMethod(PaymentMethod method) {
        paymentMethods.put(method.getType(), method);
    }
    
    public void processPayment(Payment payment) {
        // 検証はシンプルに保つ——変動なし
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Invalid amount");
        }
        
        // 支払い処理は抽象化を使用——高変動
        PaymentMethod method = paymentMethods.get(payment.getType());
        if (method == null) {
            throw new IllegalArgumentException("Unsupported payment type");
        }
        method.process(payment);
        
        // ログ記録はシンプルに保つ——変動なし
        logTransaction(payment);
    }
    
    private void logTransaction(Payment payment) {
        System.out.println("Processed: " + payment);
    }
}
```

この選択的アプローチ：

!!!success "✅ バランスの取れた設計"
    **必要な場所での抽象化**
    - 支払い方法は拡張可能
    - 新しい方法は既存のコードを修正しない
    - 各方法を独立してテスト可能
    
    **適切な場所でのシンプルさ**
    - 検証ロジックは直接的なまま
    - ログロジックは直接的なまま
    - 不要な抽象化がない
    
    **実用的なトレードオフ**
    - 価値を追加する場所でのみ複雑さを追加
    - 全体的な流れを理解しやすい
    - 後で必要に応じて他の部分をリファクタリング可能

## 実世界での応用：プラグインアーキテクチャ

OCPは、拡張性がコア要件であるプラグインアーキテクチャで輝きます。

### プラグインシステム

プラグインサポートを持つテキストエディタを考えてみましょう：

```python
# コア抽象化
class EditorPlugin(ABC):
    @abstractmethod
    def get_name(self):
        pass
    
    @abstractmethod
    def execute(self, context):
        pass

# コアエディタ——修正に対して閉じている
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

# プラグイン——拡張に対して開いている
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

# サードパーティプラグイン——エディタを修正しない
class SpellCheckPlugin(EditorPlugin):
    def get_name(self):
        return "spellcheck"
    
    def execute(self, context):
        # スペルチェックロジック
        print("Spell check complete")
        return None

editor.register_plugin(SpellCheckPlugin())
editor.execute_plugin("spellcheck")
```

このアーキテクチャはOCPの最良の状態を示しています：

!!!success "✅ 真の拡張性"
    **コアの安定性**
    - エディタコードは決して変更されない
    - テスト済み機能はテスト済みのまま
    - 既存機能へのリスクなし
    
    **無限の拡張**
    - 誰でもプラグインを作成できる
    - プラグインは互いを知らない
    - ソースコードアクセスなしで機能を追加できる
    
    **真のビジネス価値**
    - サードパーティプラグインのエコシステム
    - ユーザーがニーズに合わせてカスタマイズ
    - ベンダーの努力なしでプラットフォームが成長

## 結論

開閉原則は、壊すことなく進化できる柔軟なシステムを構築するための強力なメカニズムを提供します。コードを拡張に対して開き、修正に対して閉じることで、OCPはテスト済み機能にバグを導入するリスクを減らしながら、新機能を可能にします。しかし、OCPの適用には判断が必要です——それはどこでも抽象化を作成することではなく、真の変動点を特定することです。

OCPを効果的に適用する鍵は、拡張が必要になる可能性が高い時期を認識することです。異なるケースを処理するswitch文やif-elseチェーンは明白な違反を表します——各新しいケースは既存のコードの修正を必要とします。これらは、インターフェースとポリモーフィズムを通じた抽象化の主要な候補です。ストラテジーパターンは、これらの違反を排除する直接的な方法を提供し、各ケースを既存のコードを修正せずに追加できる別々のクラスにします。

微妙な違反はより陰湿で、各新しい要件とともに成長するメソッドとして現れます。フォーマットロジックを埋め込むレポートジェネレーター、支払い方法をハードコードする支払いプロセッサー、すべての配信チャネルを知る通知システムはすべてOCPに違反しています。これらのクラスは、要件が進化するにつれてますます複雑で脆弱になります。抽象化へのリファクタリングにより、新しいフォーマット、支払い方法、チャネルを新しいクラスとして追加できます。

しかし、早すぎる抽象化は不要な複雑さを生み出します。基本的な算術操作のためのプラグインアーキテクチャを持つ計算機は過剰設計です——操作は安定しており、変更される可能性は低いです。YAGNI原則（それは必要ない）が適用されます：仮想的な将来の要件のために抽象化を作成しないでください。拡張が必要な証拠が得られるまで待ってから、抽象化の複雑さのコストを支払います。

変動点テストは、OCPが価値を追加する場所を特定する実用的な方法を提供します。システムの各部分を分析します：これは変更される可能性がありますか？ここで頻繁に新しいケースを追加しますか？これは柔軟性を必要とするビジネス差別化要因ですか？高変動点はOCPから利益を得ます；安定した低変動のコードはシンプルに保つべきです。この選択的適用は、柔軟性と明瞭性のバランスを取ります。

プラグインアーキテクチャは、OCPの最良の状態を示しています。テキストエディタ、IDE、Webブラウザ、コンテンツ管理システムはすべて、コアコードを修正せずに無限の拡張を可能にするプラグインシステムから利益を得ています。これらのシステムは真のビジネス価値を提供します——ベンダーの努力なしでプラットフォームを成長させるサードパーティ拡張のエコシステムです。拡張性がコア要件である場合、OCPは不可欠です。

開閉原則は強力でありながら誤用されやすいです。「拡張に対して開き、修正に対して閉じている」という原則はシンプルですが、いつ適用するかを知るには判断が必要です。変動点に焦点を当て、必要性の証拠を待ち、早すぎる抽象化を避けることで、柔軟で保守可能な設計を作成できます——既存の機能を壊すことなく優雅に拡張します。
