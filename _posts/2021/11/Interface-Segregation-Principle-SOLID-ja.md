---
title: "インターフェース分離の原則：クライアントに未使用のメソッドへの依存を強制してはならない"
date: 2021-11-01
lang: ja
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "クライアントは使用しないインターフェースに依存することを強制されるべきではありません。この原則は、実装者に不要なメソッドの負担をかける肥大化したインターフェースを防ぎますが、開発者はしばしばこれに違反する肥大化した抽象化を作成します。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

インターフェース分離の原則（ISP）は、SOLIDデザインの4番目の原則であり、「クライアントは使用しないメソッドに依存することを強制されるべきではない」と述べています。Robert C. Martinによって提唱されたISPは、「肥大化したインターフェース」の問題に対処します。これは、あまりにも多くの責任をバンドルした抽象化であり、実装者にスタブメソッドを提供するか、サポートしていない機能に対して例外をスローすることを強制します。単純に聞こえますが、ISP違反は、利便性が適切な抽象化に勝るコードベースで蔓延しています。

この記事では、インターフェースが大きくなりすぎる実際のシナリオを通じて、インターフェース分離の原則を探ります。オールインワンのワーカーインターフェースからキッチンシンクAPIまで、インターフェースを凝集性のあるものにするもの、肥大化を検出する方法、そしてなぜより小さく焦点を絞ったインターフェースがより保守可能なシステムにつながるのかを分析します。本番環境の例とリファクタリングパターンを通じて、ISPがクリーンな抽象化の守護者である理由を明らかにします。

## インターフェース分離の理解

違反に深く入る前に、インターフェース分離が何を意味し、なぜ重要なのかを理解することが重要です。

### 分離とは何を意味するか？

この原則は、大きなインターフェースをより小さく、より具体的なインターフェースに分割することを要求します：

!!!anote "📚 インターフェース分離の定義"
    **クライアント固有のインターフェース**
    - クライアントのニーズに合わせたインターフェース
    - 未使用のメソッド依存関係がない
    - クライアントは使用するものだけに依存
    - 1つの大きなインターフェースより複数の小さなインターフェース
    
    **凝集性の要件**
    - メソッドが一緒に属する
    - 単一の焦点を絞った目的
    - 関連する操作がグループ化
    - 最小限のインターフェース表面
    
    **実装の自由**
    - クラスは必要なインターフェースのみを実装
    - 強制されたスタブメソッドがない
    - UnsupportedOperationExceptionがない
    - 自然で完全な実装

ISPは、抽象化がクライアントに不必要な複雑さの負担をかけないことを保証します。

### なぜISPが重要か

ISPに違反すると、コードベース全体に連鎖的な問題が発生します：

!!!warning "⚠️ ISP違反のコスト"
    **実装の負担**
    - 未使用のメソッドの実装を強制される
    - スタブメソッドがコードを乱雑にする
    - サポートされていない操作に対して例外をスロー
    - リスコフの置換原則に違反
    
    **密結合**
    - クライアントは使用しないメソッドに依存
    - 未使用のメソッドへの変更が再コンパイルを強制
    - インターフェースの変更が無関係なクライアントを破壊
    - コードベース全体への波及効果
    
    **保守の複雑さ**
    - 実際に使用されているものを理解するのが難しい
    - インターフェースを安全に進化させるのが難しい
    - テストが複雑になる
    - ドキュメントが誤解を招く

これらの違反により、コードが硬直し、脆弱で、保守が困難になります。

## 古典的な違反：肥大化したワーカーインターフェース

最も一般的なISP違反の1つは、単一のインターフェースが複数のクライアントタイプにサービスを提供しようとするときに発生します。

### オールインワンインターフェース

この過度に広範なワーカーインターフェースを考えてみましょう：

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

# ロボットワーカーは食べたり眠ったりしない！
class RobotWorker(Worker):
    def work(self):
        print("Robot working")
    
    def eat(self):
        raise NotImplementedError("Robots don't eat")  # ✗ 違反！
    
    def sleep(self):
        raise NotImplementedError("Robots don't sleep")  # ✗ 違反！
    
    def get_paid(self):
        print("Robot maintenance scheduled")
```

これはISPに違反しています。なぜなら：

!!!error "🚫 識別されたISP違反"
    **強制された依存関係**
    - RobotWorkerはeat()とsleep()の実装を強制される
    - メソッドが例外をスロー
    - すべての実装者にとってインターフェースが広すぎる
    - クライアントは依存すべきでないメソッドに依存
    
    **契約の破綻**
    - リスコフの置換原則に違反
    - 実行時に置換が失敗
    - 予期しない例外
    - 信頼できないポリモーフィズム
    
    **凝集性の欠如**
    - 生物学的および機械的な関心事が混在
    - インターフェースが複数のクライアントタイプにサービス
    - 単一の焦点を絞った目的がない
    - 拡張が困難

ポリモーフィズムを使用すると違反が明らかになります：

```python
def manage_workers(workers):
    for worker in workers:
        worker.work()
        worker.eat()   # ✗ ロボットでクラッシュ！
        worker.sleep() # ✗ ロボットでクラッシュ！

workers = [HumanWorker(), RobotWorker()]
manage_workers(workers)  # ✗ NotImplementedErrorをスロー
```


### 分離されたインターフェースでリファクタリング

肥大化したインターフェースを焦点を絞った凝集性のあるインターフェースに分割します：

```python
from abc import ABC, abstractmethod

# すべてのワーカーが共有するコアインターフェース
class Workable(ABC):
    @abstractmethod
    def work(self):
        pass

# 生物学的ニーズのインターフェース
class Biological(ABC):
    @abstractmethod
    def eat(self):
        pass
    
    @abstractmethod
    def sleep(self):
        pass

# 報酬インターフェース
class Payable(ABC):
    @abstractmethod
    def get_paid(self):
        pass

# 人間のワーカーはすべての関連インターフェースを実装
class HumanWorker(Workable, Biological, Payable):
    def work(self):
        print("Human working")
    
    def eat(self):
        print("Human eating lunch")
    
    def sleep(self):
        print("Human sleeping")
    
    def get_paid(self):
        print("Human receiving salary")

# ロボットワーカーは必要なものだけを実装
class RobotWorker(Workable, Payable):
    def work(self):
        print("Robot working")
    
    def get_paid(self):
        print("Robot maintenance scheduled")

# クライアントコードは特定のインターフェースを使用
def manage_work(workers: list[Workable]):
    for worker in workers:
        worker.work()  # ✓ すべてのワーカーに安全

def manage_breaks(biologicals: list[Biological]):
    for bio in biologicals:
        bio.eat()
        bio.sleep()  # ✓ 生物学的ワーカーのみに安全

def process_payroll(payables: list[Payable]):
    for payable in payables:
        payable.get_paid()  # ✓ すべての支払い可能なエンティティに安全
```

これでコードはISPに従います：

!!!success "✅ ISPの利点"
    **焦点を絞ったインターフェース**
    - 各インターフェースには単一の目的がある
    - メソッドが自然に一緒に属する
    - 強制された実装がない
    - 明確で凝集性のある契約
    
    **柔軟な構成**
    - クラスは必要なインターフェースのみを実装
    - 新しいワーカータイプの追加が容易
    - スタブメソッドや例外がない
    - 自然で完全な実装
    
    **クライアントの独立性**
    - クライアントは使用するものだけに依存
    - 変更が無関係なクライアントに影響しない
    - 型安全なポリモーフィズム
    - 信頼できる置換

## 微妙な違反：キッチンシンクAPI

もう1つの一般的なISP違反は、APIがすべての可能なユースケースに対応するために成長するときに発生します。

### 肥大化したドキュメントインターフェース

この過度に包括的なドキュメントインターフェースを考えてみましょう：

```java
public interface Document {
    // 基本操作
    String getContent();
    void setContent(String content);
    
    // フォーマット
    void applyBold();
    void applyItalic();
    void setFontSize(int size);
    void setFontColor(String color);
    
    // 永続化
    void save();
    void load();
    void export(String format);
    
    // コラボレーション
    void share(String email);
    void addComment(String comment);
    void trackChanges(boolean enabled);
    
    // 分析
    int getWordCount();
    int getReadingTime();
    void logAccess(String userId);
}

// シンプルなテキストドキュメントはこれらのほとんどを必要としない
public class PlainTextDocument implements Document {
    private String content;
    
    @Override
    public String getContent() { return content; }
    
    @Override
    public void setContent(String content) { this.content = content; }
    
    // フォーマットメソッドの実装を強制される
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
    
    // コラボレーションメソッドの実装を強制される
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
    
    // 基本的な実装
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

これはISPに違反しています。なぜなら：

!!!error "🚫 識別されたISP違反"
    **過剰なインターフェース**
    - 単一のインターフェースに14のメソッド
    - 複数の無関係な責任
    - ほとんどの実装者はサブセットのみを必要とする
    - 強制されたスタブ実装
    
    **クライアントの混乱**
    - どのメソッドがサポートされているか不明確
    - コンパイル時の安全性ではなく実行時例外
    - ドキュメントが現実と一致しない
    - 信頼できないポリモーフィズム
    
    **保守の負担**
    - インターフェースの変更がすべての実装者に影響
    - 新しいドキュメントタイプの追加が困難
    - 未使用のメソッドがテストを複雑にする
    - 機能間の密結合


### ロールインターフェースでリファクタリング

クライアントのロールと機能に基づいてインターフェースを分割します：

```java
// コアドキュメントインターフェース
public interface Readable {
    String getContent();
}

public interface Writable {
    void setContent(String content);
}

// フォーマット機能
public interface Formattable {
    void applyBold();
    void applyItalic();
    void setFontSize(int size);
    void setFontColor(String color);
}

// 永続化機能
public interface Persistable {
    void save();
    void load();
    void export(String format);
}

// コラボレーション機能
public interface Shareable {
    void share(String email);
    void addComment(String comment);
    void trackChanges(boolean enabled);
}

// 分析機能
public interface Analyzable {
    int getWordCount();
    int getReadingTime();
    void logAccess(String userId);
}

// プレーンテキストは必要なものだけを実装
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

// リッチテキストドキュメントはすべての機能を実装
public class RichTextDocument implements Readable, Writable, Formattable, 
                                         Persistable, Shareable, Analyzable {
    // すべてのインターフェースの完全な実装
}

// クライアントは必要なものだけに依存
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

これでコードはISPに従います：

!!!success "✅ ISPの利点"
    **凝集性のあるインターフェース**
    - 各インターフェースは単一の機能に焦点
    - メソッドが自然に関連
    - 明確な目的と責任
    - 理解しやすい
    
    **実装の自由**
    - クラスは必要な機能のみを実装
    - 強制されたスタブメソッドがない
    - 実行時例外がない
    - 完全で自然な実装
    
    **クライアントの明確性**
    - クライアントは正確な依存関係を宣言
    - コンパイル時の安全性
    - 明確な機能要件
    - 信頼できるポリモーフィズム

## ISP違反の検出

ISP違反を識別するには、インターフェースの凝集性とクライアントの使用パターンを調べる必要があります。

### 警告サイン

これらのISP違反の指標に注意してください：

!!!warning "🔍 ISP違反の指標"
    **実装の臭い**
    - 空のメソッド実装
    - UnsupportedOperationExceptionをスローするメソッド
    - NotImplementedExceptionパターン
    - TODOコメント付きのスタブメソッド
    
    **インターフェースの特性**
    - 多数のメソッド（>7-10）
    - 無関係なメソッドグループ
    - 異なるクライアントが使用するメソッド
    - 複数の変更理由
    
    **クライアントパターン**
    - クライアントがインターフェースのサブセットのみを使用
    - メソッド呼び出し前の型チェック
    - サポートされていないメソッドについて警告するドキュメント
    - インターフェース周辺の防御的プログラミング
    
    **進化の問題**
    - メソッドの追加が多くの実装者を破壊
    - 新しい実装の追加が困難
    - インターフェースの変更が広く波及
    - 頻繁な破壊的変更

### インターフェース凝集性テスト

このテストを適用してインターフェースの凝集性を評価します：

```typescript
// テスト：すべてのメソッドが一緒に属するか？
interface Printer {
    print(document: string): void;
    scan(document: string): string;
    fax(document: string, number: string): void;
    staple(pages: number): void;
}

// 分析：複数の責任
// - 印刷：print()
// - スキャン：scan()
// - ファックス：fax()
// - ステープル：staple()

// ISP違反：すべてのプリンターがすべての操作をサポートするわけではない
class SimplePrinter implements Printer {
    print(document: string): void {
        console.log("Printing:", document);
    }
    
    scan(document: string): string {
        throw new Error("Scanning not supported");  // ✗ 違反！
    }
    
    fax(document: string, number: string): void {
        throw new Error("Faxing not supported");  // ✗ 違反！
    }
    
    staple(pages: number): void {
        throw new Error("Stapling not supported");  // ✗ 違反！
    }
}

// リファクタリング：分離されたインターフェース
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

// シンプルなプリンターはサポートするものだけを実装
class SimplePrinter implements Printable {
    print(document: string): void {
        console.log("Printing:", document);
    }
}

// 多機能プリンターはすべての機能を実装
class MultiFunctionPrinter implements Printable, Scannable, Faxable, Finishable {
    print(document: string): void { /* implementation */ }
    scan(document: string): string { /* implementation */ return ""; }
    fax(document: string, number: string): void { /* implementation */ }
    staple(pages: number): void { /* implementation */ }
}

// クライアントは必要な機能のみに依存
function printDocument(printer: Printable, doc: string): void {
    printer.print(doc);  // ✓ すべてのPrintableデバイスに安全
}

function digitizeDocument(scanner: Scannable, doc: string): string {
    return scanner.scan(doc);  // ✓ すべてのScannableデバイスに安全
}
```


## ISPを適用するタイミング

インターフェースをいつ分離するかを知ることは、どのように分離するかを知ることと同じくらい重要です。

### ISPを適用する場合

これらの状況でインターフェースを分離します：

!!!tip "✅ インターフェースを分離するタイミング"
    **複数のクライアントタイプ**
    - 異なるクライアントが異なるメソッドを使用
    - クライアントに異なるニーズがある
    - 使用パターンが明確に分離
    - 自然なグループ化が現れる
    
    **実装の差異**
    - 一部の実装者がすべてのメソッドをサポートできない
    - スタブメソッドが現れる
    - サポートされていない操作に対して例外がスロー
    - 部分的な実装が一般的
    
    **進化の圧力**
    - インターフェースが時間とともに成長
    - 新しいメソッドが頻繁に追加される
    - 変更が無関係なクライアントに影響
    - 破壊的変更が一般的
    
    **明確な責任**
    - メソッドが異なる機能にグループ化
    - 複数の変更理由
    - 無関係な関心事が混在
    - 凝集性の欠如

### 早すぎる分離を避ける

インターフェースを早すぎて過度に分離しないでください：

!!!warning "⚠️ 分離しないタイミング"
    **安定した凝集性のあるインターフェース**
    - すべてのメソッドが自然に一緒に属する
    - すべての実装者がすべてのメソッドをサポート
    - 単一の明確な目的
    - 強制された実装がない
    
    **単一のクライアントタイプ**
    - 1つのタイプのクライアントのみ
    - すべてのクライアントがすべてのメソッドを使用
    - 使用パターンの差異がない
    - 実装の問題がない
    
    **早すぎる最適化**
    - 現在の問題がない
    - 将来のニーズを推測
    - 抽象化の過剰エンジニアリング
    - 利益なしに複雑さを追加
    
    **アトミック操作**
    - メソッドを一緒に使用する必要がある
    - 分割がセマンティクスを破壊
    - 操作がトランザクションを形成
    - 凝集性が失われる

凝集性のあるインターフェースから始め、問題が現れたときに分離します。

## 結論

インターフェース分離の原則は、クライアントが使用しないメソッドに依存することから保護します。肥大化したインターフェースを焦点を絞った凝集性のある抽象化に分割することで、ISPは結合を減らし、強制された実装を排除し、システムをより柔軟で保守可能にします。

重要なポイント：

!!!success "🎯 ISPガイドライン"
    **焦点を絞ったインターフェースを設計**
    - インターフェースを小さく凝集性のあるものに保つ
    - 関連するメソッドを一緒にグループ化
    - 特定のクライアントニーズにサービス
    - キッチンシンク抽象化を避ける
    
    **柔軟な構成を可能にする**
    - クラスが複数のインターフェースを実装できるようにする
    - 少数の大きなインターフェースより多数の小さなインターフェースを優先
    - クライアントが使用するものだけに依存できるようにする
    - 自然で完全な実装をサポート
    
    **違反を認識**
    - スタブメソッドと例外に注意
    - クライアントがサブセットのみを使用する場合に注意
    - 無関係なメソッドグループを識別
    - 実装の負担を検出
    
    **慎重にリファクタリング**
    - 問題が現れたときに分離
    - 早すぎて過剰エンジニアリングしない
    - インターフェース内で凝集性を維持
    - 粒度と実用性のバランスを取る

ISPは他のSOLID原則と連携して機能します：インターフェースを焦点を絞ったものに保つことで単一責任をサポートし、新しいインターフェースを通じた拡張を許可することでオープン・クローズドを可能にし、強制された実装を防ぐことでリスコフの置換を強化します。これらの原則が一緒になって、強力で保守可能な抽象化を作成します。

このシリーズの次の記事では、依存性逆転の原則を探ります。これは、高レベルモジュールと低レベルモジュールが抽象化を通じてどのように関連すべきかに対処することでSOLIDを完成させます。
