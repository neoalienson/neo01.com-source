---
title: "リスコフの置換原則：破ってはならない契約"
date: 2021-10-01
lang: ja
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "サブタイプは、プログラムの正確性を損なうことなく基本タイプと置換可能でなければなりません。この原則は継承階層の健全性を保証しますが、開発者は一見無害な設計決定でこれを日常的に違反しています。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

リスコフの置換原則（LSP）は、1987年にBarbara Liskovによって提唱された原則にちなんで名付けられ、SOLID設計の第3の原則です。「スーパークラスのオブジェクトは、アプリケーションを壊すことなくサブクラスのオブジェクトで置き換えられるべきである」と述べています。これは単純に聞こえますが、LSP違反はオブジェクト指向システムで最も一般的で微妙なバグの1つです。正しく見えるサブクラスが静かに仮定を破り、継承階層自体から遠く離れた場所で障害を引き起こす可能性があります。

本稿では、継承が間違った方向に進む実際のシナリオを通じて、リスコフの置換原則を検証します。正方形ではない長方形から飛べない鳥まで、置換可能性が実際に何を意味するのか、違反をどのように検出するのか、そしてなぜ継承が失敗する場所でコンポジションがしばしば成功するのかを解剖します。本番環境のバグとリファクタリングの経験から、なぜLSPがポリモーフィズムの守護者であるかを明らかにします。

## リスコフの置換を理解する

違反に入る前に、置換可能性が何を意味するかを理解することが不可欠です。LSPは型の互換性だけでなく、動作の契約に関するものです。

### 置換可能性とは何か？

この原則は、サブクラスが基底クラスによって確立された契約を尊重することを要求します：

!!!anote "📚 リスコフの置換の定義"
    **動作の置換可能性**
    - サブクラスは基底クラスを置き換えることができる
    - プログラムの正確性が保持される
    - 予期しない動作の変更がない
    - クライアントは置換に気づかない
    
    **契約の要件**
    - 事前条件を強化してはならない
    - 事後条件を弱めてはならない
    - 不変条件を保持しなければならない
    - 履歴制約を維持する
    
    **テスト**
    - SがTのサブタイプである場合
    - 型Tのオブジェクトは
    - 型Sのオブジェクトで置き換えることができる
    - プログラムの正確性を変更することなく

LSPは、ポリモーフィズムが正しく機能することを保証します。コードが基底クラスに依存している場合、どのサブクラスも驚きなく機能するはずです。

### なぜLSPが重要なのか

LSPに違反すると、継承の基本的な約束が破られます：

!!!warning "⚠️ LSP違反のコスト"
    **ポリモーフィズムの破壊**
    - サブクラスが期待通りに動作しない
    - オブジェクトを使用する前に型チェックが必要
    - 継承の目的を損なう
    - ポリモーフィックなコードが脆弱になる
    
    **隠れたバグ**
    - 違反点から遠く離れた場所で障害が発生
    - 根本原因の追跡が困難
    - テストは通過するが本番環境で失敗
    - エッジケースが違反を露呈
    
    **メンテナンスの負担**
    - 具体的な型を知る必要がある
    - 抽象化を信頼できない
    - 防御的プログラミングが必要
    - コードが脆弱で複雑になる

これらの違反は継承階層全体を損ない、ポリモーフィックなコードを信頼できないものにします。

## 古典的な違反：長方形-正方形問題

最も有名なLSP違反は、数学的関係が常にコードに変換されるわけではないことを示しています。

### 一見論理的な継承

この一見正しい継承階層を考えてみましょう：

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

# 正方形は長方形ですよね？
class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)
    
    def set_width(self, width):
        self._width = width
        self._height = width  # 正方形の性質を保つ
    
    def set_height(self, height):
        self._width = height  # 正方形の性質を保つ
        self._height = height
```

これがLSPに違反する理由：

!!!error "🚫 識別されたLSP違反"
    **動作契約の破壊**
    - Rectangleは幅/高さの独立した変更を許可
    - Squareは幅と高さの変更を結合
    - サブクラスが事前条件を強化
    - 予期しない副作用が発生
    
    **置換の失敗**
    - Rectangleの動作を期待するコードが壊れる
    - 幅を設定すると予期せず高さが変更される
    - 不変条件が違反される
    - プログラムの正確性が損なわれる

ポリモーフィズムを使用すると違反が明らかになります：

```python
def test_rectangle_area(rect):
    rect.set_width(5)
    rect.set_height(4)
    assert rect.area() == 20  # 5 * 4 = 20を期待

# Rectangleで動作
rectangle = Rectangle(0, 0)
test_rectangle_area(rectangle)  # ✓ 成功

# Squareで失敗
square = Square(0)
test_rectangle_area(square)  # ✗ 失敗！area()は16を返し、20ではない
```

SquareはRectangleの動作契約に違反しています。幅と高さを独立して設定することは長方形の期待される動作ですが、Squareは両方の次元を同時に変更します。

### LSPに従うためのリファクタリング

継承関係を削除し、コンポジションまたは別の階層を使用します：

```python
# オプション1：共通インターフェースを持つ別の階層
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

# オプション2：不変の図形
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

これでコードはLSPに従います：

!!!success "✅ LSPの利点"
    **動作の一貫性**
    - 各クラスに明確な契約がある
    - 予期しない副作用がない
    - 置換が正しく機能する
    - ポリモーフィズムが信頼できる
    
    **明確なセマンティクス**
    - RectangleとSquareは異なる
    - それぞれに適切な操作がある
    - 強制的な継承関係がない
    - 設計の意図が明確
    
    **保守性**
    - 動作について推論しやすい
    - 隠れた結合がない
    - テストが簡単
    - 拡張が予測可能

## 微妙な違反：飛べない鳥

もう1つの一般的なLSP違反は、すべてのサブクラスに適合しない過度に一般化された基底クラスから生じます。

### 欠陥のある鳥の階層

この鳥のクラス階層を考えてみましょう：

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

これがLSPに違反する理由：

!!!error "🚫 識別されたLSP違反"
    **契約の破壊**
    - 基底クラスはfly()が機能することを約束
    - サブクラスは代わりに例外をスロー
    - 事後条件が弱められる
    - 置換が失敗
    
    **型チェックが必要**
    - 鳥がペンギンかどうかをチェックする必要がある
    - Bird抽象化を信頼できない
    - ポリモーフィズムを損なう
    - クライアントコードが脆弱

ポリモーフィズムを使用すると違反が表面化します：

```java
public class BirdMigration {
    public void migrateAll(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.fly();  // 鳥がペンギンの場合クラッシュ！
        }
    }
}

// 使用
List<Bird> birds = Arrays.asList(
    new Sparrow(),
    new Penguin(),  // これが移動をクラッシュさせる！
    new Sparrow()
);

BirdMigration migration = new BirdMigration();
migration.migrateAll(birds);  // ✗ UnsupportedOperationExceptionをスロー
```


### LSPに従うためのリファクタリング

実際の能力を反映するように階層を再設計します：

```java
// 共通の動作を持つ基底クラス
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

// 飛行能力のインターフェース
public interface Flyable {
    void fly();
    double getAltitude();
}

// 飛べる鳥は両方を実装
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

// 飛べない鳥はFlyableを実装しない
public class Penguin extends Bird {
    public Penguin() {
        super("Penguin");
    }
    
    @Override
    public void move() {
        System.out.println(getName() + " is swimming");
    }
}

// 移動は正しい抽象化で機能
public class BirdMigration {
    public void migrateFlyingBirds(List<Flyable> birds) {
        for (Flyable bird : birds) {
            bird.fly();  // 安全——すべてのFlyable鳥は飛べる
        }
    }
    
    public void moveAllBirds(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.move();  // 安全——すべての鳥は移動できる
        }
    }
}
```

これでコードはLSPに従います：

!!!success "✅ LSPの利点"
    **正しい抽象化**
    - Birdはすべての鳥を表す
    - Flyableは飛行能力を表す
    - 破られた約束がない
    - 置換が正しく機能する
    
    **型安全性**
    - コンパイル時の保証
    - 実行時例外がない
    - 型チェックが不要
    - ポリモーフィズムが信頼できる
    
    **柔軟性**
    - 新しい鳥のタイプを追加しやすい
    - 明確な能力契約
    - 組み合わせ可能な動作
    - 保守可能な設計

## LSP違反の検出

LSP違反を認識するには、型関係だけでなく動作契約を理解する必要があります。

### 警告サイン

これらのLSP違反の指標に注意してください：

!!!warning "🔍 LSP違反の指標"
    **例外のスロー**
    - サブクラスが基底クラスがスローしない例外をスロー
    - オーバーライドでのUnsupportedOperationException
    - NotImplementedExceptionパターン
    - 空のメソッド実装
    
    **型チェック**
    - オブジェクトを使用する前のinstanceofチェック
    - 型固有の動作分岐
    - 具体的な型へのキャスト
    - サブタイプ周辺の防御的プログラミング
    
    **強化された事前条件**
    - サブクラスが基底クラスより多くを要求
    - サブクラスでの追加検証
    - より狭い入力受け入れ
    - より厳格なパラメータ
    
    **弱められた事後条件**
    - サブクラスが基底クラスより少なく返す
    - サブクラスでのより弱い保証
    - 部分的な実装
    - 機能の低下

### 置換テスト

このテストを適用してLSPコンプライアンスを検証します：

```typescript
// テスト：サブクラスは基底クラスを置き換えられるか？
interface PaymentProcessor {
    processPayment(amount: number): boolean;
    refund(transactionId: string): boolean;
}

class CreditCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        // クレジットカード決済を処理
        return true;
    }
    
    refund(transactionId: string): boolean {
        // 返金を処理
        return true;
    }
}

// LSP違反：事前条件を強化
class GiftCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        if (amount > 500) {
            throw new Error("Gift cards limited to $500");  // ✗ 違反！
        }
        return true;
    }
    
    refund(transactionId: string): boolean {
        throw new Error("Gift cards cannot be refunded");  // ✗ 違反！
    }
}

// GiftCardProcessorを使用するとクライアントコードが壊れる
function checkout(processor: PaymentProcessor, amount: number) {
    if (processor.processPayment(amount)) {
        console.log("Payment successful");
    }
}

checkout(new CreditCardProcessor(), 1000);  // ✓ 動作
checkout(new GiftCardProcessor(), 1000);    // ✗ 例外をスロー
```

GiftCardProcessorは、インターフェース契約に存在しない制限を追加することでLSPに違反しています。

### 違反の修正

契約を明示的にし、それを守ります：

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
        // 決済を処理
        return new PaymentResult(true, "Payment processed");
    }
    
    refund(transactionId: string): RefundResult {
        // 返金を処理
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

// クライアントコードが正しく動作
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

checkout(new CreditCardProcessor(), 1000);  // ✓ 動作
checkout(new GiftCardProcessor(), 1000);    // ✓ 動作——制限を優雅に処理
```

これで両方のプロセッサが契約を守り、相互に置換可能になります。

## 継承が失敗するとき：コンポジションを優先

多くのLSP違反は、継承が間違ったツールであることを示しています。

### コンポジションの代替案

継承を強制せず、コンポジションを使用します：

```python
# 継承階層を使用しない
class Vehicle:
    def start_engine(self):
        pass

class ElectricCar(Vehicle):
    def start_engine(self):
        raise NotImplementedError("Electric cars don't have engines!")  # ✗ LSP違反

# 能力を持つコンポジションを使用
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

コンポジションは、不適切な継承関係を排除することでLSP違反を回避します。

!!!tip "💡 継承よりコンポジション"
    **コンポジションを使用するとき**
    - サブクラスが基底クラスの動作を完全にサポートしない
    - 関係が「has-a」であり「is-a」ではない
    - 複数の能力を混合する必要がある
    - 動作が独立して変化する
    
    **利点**
    - LSP違反がない
    - より柔軟
    - テストしやすい
    - 意図がより明確

## 結論

リスコフの置換原則は、継承階層が健全であり、ポリモーフィズムが正しく機能することを保証します。違反は、オブジェクト指向設計の基本的な約束を破ります：サブクラスは驚きなく基底クラスを置き換えることができるということです。

重要なポイント：

!!!success "🎯 LSPガイドライン"
    **置換可能性のための設計**
    - サブクラスは基底クラスの契約を守る必要がある
    - 事前条件を強化しない
    - 事後条件を弱めない
    - 不変条件を保持する
    
    **違反の認識**
    - オーバーライドでの例外のスロー
    - オブジェクトを使用する前の型チェック
    - 空または部分的な実装
    - 防御的プログラミングパターン
    
    **適切なツールの選択**
    - 真の「is-a」関係には継承を使用
    - 「has-a」関係にはコンポジションを使用
    - 能力契約にはインターフェースを使用
    - 適合しない場所で継承を強制しない
    
    **置換可能性のテスト**
    - サブクラスは基底クラスを置き換えられるか？
    - 動作は一貫しているか？
    - 契約は守られているか？
    - ポリモーフィズムは正しく機能するか？

リスコフの置換原則は、継承階層の整合性を守ります。それに従うと、信頼できるポリモーフィズムと保守可能なオブジェクト指向システムが実現します。それに違反すると、設計全体を損なう微妙なバグが生まれます。次にサブクラスを作成するときは、自問してください：それは本当に何も壊すことなく基底クラスを置き換えることができるか？できない場合は、継承関係を再考してください。
