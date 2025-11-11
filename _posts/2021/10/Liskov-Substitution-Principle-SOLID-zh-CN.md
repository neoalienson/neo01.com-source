---
title: "里氏替换原则：不可违背的契约"
date: 2021-10-01
lang: zh-CN
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "子类型必须能够替换其基类型而不破坏程序正确性。这一原则确保继承层次结构保持健全，但开发者经常通过看似无害的设计决策违反它。"
series: solid
thumbnail: /assets/solid/thumbnail.png
---

里氏替换原则（LSP）以1987年提出该原则的Barbara Liskov命名，是SOLID设计中的第三个原则。它指出："超类的对象应该可以被子类的对象替换而不破坏应用程序。"虽然这听起来很简单，但LSP违规是面向对象系统中最常见和最微妙的错误之一。一个看起来正确的子类可能会悄悄地破坏假设，导致远离继承层次结构本身的故障。

本文通过继承出错的实际场景来探讨里氏替换原则。从不是正方形的矩形到不会飞的鸟，我们将剖析可替换性的真正含义、如何检测违规，以及为什么组合通常在继承失败的地方取得成功。通过生产环境的错误和重构经验，我们揭示了为什么LSP是多态性的守护者。

## 理解里氏替换

在深入研究违规之前，理解可替换性的含义至关重要。LSP关注的是行为契约，而不仅仅是类型兼容性。

### 可替换性意味着什么？

该原则要求子类遵守其基类建立的契约：

!!!anote "📚 里氏替换定义"
    **行为可替换性**
    - 子类可以替换基类
    - 程序正确性得以保持
    - 没有意外的行为变化
    - 客户端不知道替换
    
    **契约要求**
    - 前置条件不能加强
    - 后置条件不能削弱
    - 不变量必须保持
    - 历史约束得以维护
    
    **测试方法**
    - 如果S是T的子类型
    - 那么类型T的对象
    - 可以被类型S的对象替换
    - 而不改变程序正确性

LSP确保多态性正确工作。当代码依赖于基类时，任何子类都应该在没有意外的情况下工作。

### 为什么LSP很重要

违反LSP会破坏继承的基本承诺：

!!!warning "⚠️ 违反LSP的代价"
    **多态性被破坏**
    - 子类不按预期工作
    - 使用对象前需要类型检查
    - 违背继承的目的
    - 多态代码变得脆弱
    
    **隐藏的错误**
    - 故障发生在远离违规点的地方
    - 难以追踪根本原因
    - 测试通过但生产环境失败
    - 边缘情况暴露违规
    
    **维护负担**
    - 必须知道具体类型
    - 无法信任抽象
    - 需要防御性编程
    - 代码变得脆弱和复杂

这些违规破坏了整个继承层次结构，使多态代码不可靠。

## 经典违规：矩形-正方形问题

最著名的LSP违规展示了数学关系如何不总是转化为代码。

### 看似合理的继承

考虑这个看似正确的继承层次结构：

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

# 正方形是一个矩形，对吧？
class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)
    
    def set_width(self, width):
        self._width = width
        self._height = width  # 保持正方形属性
    
    def set_height(self, height):
        self._width = height  # 保持正方形属性
        self._height = height
```

这违反了LSP，因为：

!!!error "🚫 识别出的LSP违规"
    **行为契约被破坏**
    - Rectangle允许独立更改宽度/高度
    - Square耦合了宽度和高度的更改
    - 子类加强了前置条件
    - 发生意外的副作用
    
    **替换失败**
    - 期望Rectangle行为的代码被破坏
    - 设置宽度意外地改变了高度
    - 不变量被违反
    - 程序正确性受损

使用多态时违规变得明显：

```python
def test_rectangle_area(rect):
    rect.set_width(5)
    rect.set_height(4)
    assert rect.area() == 20  # 期望 5 * 4 = 20

# 对Rectangle有效
rectangle = Rectangle(0, 0)
test_rectangle_area(rectangle)  # ✓ 通过

# 对Square失败
square = Square(0)
test_rectangle_area(square)  # ✗ 失败！area() 返回 16，而不是 20
```

Square违反了Rectangle的行为契约。独立设置宽度和高度是矩形的预期行为，但Square同时更改两个维度。

### 重构以遵循LSP

移除继承关系并使用组合或独立的层次结构：

```python
# 选项1：具有公共接口的独立层次结构
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

# 选项2：不可变形状
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

现在代码遵循LSP：

!!!success "✅ LSP的好处"
    **行为一致性**
    - 每个类都有明确的契约
    - 没有意外的副作用
    - 替换正确工作
    - 多态性可靠
    
    **清晰的语义**
    - Rectangle和Square是不同的
    - 每个都有适当的操作
    - 没有强制的继承关系
    - 设计中的意图明确
    
    **可维护性**
    - 易于推理行为
    - 没有隐藏的耦合
    - 测试简单直接
    - 扩展可预测

## 微妙的违规：不会飞的鸟

另一个常见的LSP违规来自过度泛化的基类，这些基类不适合所有子类。

### 有缺陷的鸟类层次结构

考虑这个鸟类层次结构：

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

这违反了LSP，因为：

!!!error "🚫 识别出的LSP违规"
    **契约被破坏**
    - 基类承诺fly()有效
    - 子类抛出异常
    - 后置条件被削弱
    - 替换失败
    
    **需要类型检查**
    - 必须检查鸟是否是企鹅
    - 无法信任Bird抽象
    - 违背多态性
    - 客户端代码脆弱

使用多态时违规浮出水面：

```java
public class BirdMigration {
    public void migrateAll(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.fly();  // 如果鸟是企鹅就会崩溃！
        }
    }
}

// 使用
List<Bird> birds = Arrays.asList(
    new Sparrow(),
    new Penguin(),  // 这会导致迁移崩溃！
    new Sparrow()
);

BirdMigration migration = new BirdMigration();
migration.migrateAll(birds);  // ✗ 抛出UnsupportedOperationException
```


### 重构以遵循LSP

重新设计层次结构以反映实际能力：

```java
// 具有公共行为的基类
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

// 飞行能力的接口
public interface Flyable {
    void fly();
    double getAltitude();
}

// 会飞的鸟实现两者
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

// 不会飞的鸟不实现Flyable
public class Penguin extends Bird {
    public Penguin() {
        super("Penguin");
    }
    
    @Override
    public void move() {
        System.out.println(getName() + " is swimming");
    }
}

// 迁移现在使用正确的抽象
public class BirdMigration {
    public void migrateFlyingBirds(List<Flyable> birds) {
        for (Flyable bird : birds) {
            bird.fly();  // 安全——所有Flyable鸟都能飞
        }
    }
    
    public void moveAllBirds(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.move();  // 安全——所有鸟都能移动
        }
    }
}
```

现在代码遵循LSP：

!!!success "✅ LSP的好处"
    **正确的抽象**
    - Bird代表所有鸟类
    - Flyable代表飞行能力
    - 没有违背的承诺
    - 替换正确工作
    
    **类型安全**
    - 编译时保证
    - 没有运行时异常
    - 不需要类型检查
    - 多态性可靠
    
    **灵活性**
    - 易于添加新的鸟类类型
    - 清晰的能力契约
    - 可组合的行为
    - 可维护的设计

## 检测LSP违规

识别LSP违规需要理解行为契约，而不仅仅是类型关系。

### 警告信号

注意这些LSP违规的指标：

!!!warning "🔍 LSP违规指标"
    **抛出异常**
    - 子类抛出基类不抛出的异常
    - 重写中的UnsupportedOperationException
    - NotImplementedException模式
    - 空方法实现
    
    **类型检查**
    - 使用对象前的instanceof检查
    - 特定类型的行为分支
    - 转换为具体类型
    - 围绕子类型的防御性编程
    
    **加强的前置条件**
    - 子类要求比基类更多
    - 子类中的额外验证
    - 更窄的输入接受
    - 更严格的参数
    
    **削弱的后置条件**
    - 子类返回比基类少
    - 子类中的较弱保证
    - 部分实现
    - 功能降级

### 替换测试

应用此测试来验证LSP合规性：

```typescript
// 测试：子类能否替换基类？
interface PaymentProcessor {
    processPayment(amount: number): boolean;
    refund(transactionId: string): boolean;
}

class CreditCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        // 处理信用卡支付
        return true;
    }
    
    refund(transactionId: string): boolean {
        // 处理退款
        return true;
    }
}

// LSP违规：加强前置条件
class GiftCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        if (amount > 500) {
            throw new Error("Gift cards limited to $500");  // ✗ 违规！
        }
        return true;
    }
    
    refund(transactionId: string): boolean {
        throw new Error("Gift cards cannot be refunded");  // ✗ 违规！
    }
}

// 客户端代码在使用GiftCardProcessor时被破坏
function checkout(processor: PaymentProcessor, amount: number) {
    if (processor.processPayment(amount)) {
        console.log("Payment successful");
    }
}

checkout(new CreditCardProcessor(), 1000);  // ✓ 有效
checkout(new GiftCardProcessor(), 1000);    // ✗ 抛出异常
```

GiftCardProcessor通过添加接口契约中不存在的限制来违反LSP。

### 修复违规

使契约明确并遵守它：

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
        // 处理支付
        return new PaymentResult(true, "Payment processed");
    }
    
    refund(transactionId: string): RefundResult {
        // 处理退款
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

// 客户端代码现在正确工作
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
checkout(new GiftCardProcessor(), 1000);    // ✓ 有效——优雅地处理限制
```

现在两个处理器都遵守契约，可以相互替换。

## 当继承失败时：优先使用组合

许多LSP违规表明继承是错误的工具。

### 组合替代方案

不要强制继承，使用组合：

```python
# 不使用继承层次结构
class Vehicle:
    def start_engine(self):
        pass

class ElectricCar(Vehicle):
    def start_engine(self):
        raise NotImplementedError("Electric cars don't have engines!")  # ✗ LSP违规

# 使用具有能力的组合
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

组合通过消除不适当的继承关系来避免LSP违规。

!!!tip "💡 组合优于继承"
    **何时使用组合**
    - 子类不完全支持基类行为
    - 关系是"有一个"而不是"是一个"
    - 需要混合多种能力
    - 行为独立变化
    
    **好处**
    - 没有LSP违规
    - 更灵活
    - 更易于测试
    - 意图更清晰

## 结论

里氏替换原则确保继承层次结构保持健全，多态性正确工作。违规破坏了面向对象设计的基本承诺：子类可以在没有意外的情况下替换基类。

关键要点：

!!!success "🎯 LSP指南"
    **为可替换性设计**
    - 子类必须遵守基类契约
    - 不要加强前置条件
    - 不要削弱后置条件
    - 保持不变量
    
    **识别违规**
    - 重写中抛出异常
    - 使用对象前的类型检查
    - 空或部分实现
    - 防御性编程模式
    
    **选择正确的工具**
    - 对真正的"是一个"关系使用继承
    - 对"有一个"关系使用组合
    - 对能力契约使用接口
    - 不要在不适合的地方强制继承
    
    **测试可替换性**
    - 子类能否替换基类？
    - 行为是否保持一致？
    - 契约是否得到遵守？
    - 多态性是否正确工作？

里氏替换原则守护着继承层次结构的完整性。遵循它时，它能实现可靠的多态性和可维护的面向对象系统。违反它时，它会创建破坏整个设计的微妙错误。下次创建子类时，问问自己：它真的可以在不破坏任何东西的情况下替换其基类吗？如果不能，请重新考虑继承关系。
