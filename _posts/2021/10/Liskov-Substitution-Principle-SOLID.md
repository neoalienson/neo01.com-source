---
title: "Liskov Substitution Principle: The Contract You Can't Break"
date: 2021-10-01
lang: en
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "Subtypes must be substitutable for their base types without breaking program correctness. This principle ensures inheritance hierarchies remain sound, yet developers routinely violate it with seemingly innocent design decisions."
series: solid
thumbnail: /assets/solid/thumbnail.png
---

The Liskov Substitution Principle (LSP), named after Barbara Liskov who introduced it in 1987, is the third principle in SOLID design. It states: "Objects of a superclass should be replaceable with objects of a subclass without breaking the application." While this sounds straightforward, LSP violations are among the most common and subtle bugs in object-oriented systems. A subclass that looks correct can silently break assumptions, causing failures far from the inheritance hierarchy itself.

This exploration examines the Liskov Substitution Principle through real-world scenarios where inheritance goes wrong. From rectangles that aren't squares to birds that can't fly, we'll dissect what substitutability actually means, how to detect violations, and why composition often succeeds where inheritance fails. Drawing from production bugs and refactoring experiences, we uncover why LSP is the guardian of polymorphism.

## Understanding Liskov Substitution

Before diving into violations, understanding what substitutability means is essential. LSP is about behavioral contracts, not just type compatibility.

### What Does Substitutability Mean?

The principle requires that subclasses honor the contracts established by their base classes:

!!!anote "📚 Liskov Substitution Definition"
    **Behavioral Substitutability**
    - Subclass can replace base class
    - Program correctness preserved
    - No unexpected behavior changes
    - Clients unaware of substitution
    
    **Contract Requirements**
    - Preconditions cannot be strengthened
    - Postconditions cannot be weakened
    - Invariants must be preserved
    - History constraints maintained
    
    **The Test**
    - If S is a subtype of T
    - Then objects of type T
    - Can be replaced with objects of type S
    - Without altering program correctness

LSP ensures that polymorphism works correctly. When code depends on a base class, any subclass should work without surprises.

### Why LSP Matters

Violating LSP breaks the fundamental promise of inheritance:

!!!warning "⚠️ Costs of Violating LSP"
    **Broken Polymorphism**
    - Subclasses don't work as expected
    - Type checks required before using objects
    - Defeats purpose of inheritance
    - Polymorphic code becomes fragile
    
    **Hidden Bugs**
    - Failures occur far from violation point
    - Difficult to trace root cause
    - Tests pass but production fails
    - Edge cases expose violations
    
    **Maintenance Burden**
    - Must know concrete types
    - Cannot trust abstractions
    - Defensive programming required
    - Code becomes brittle and complex

These violations undermine the entire inheritance hierarchy, making polymorphic code unreliable.

## Classic Violation: The Rectangle-Square Problem

The most famous LSP violation demonstrates how mathematical relationships don't always translate to code.

### The Seemingly Logical Inheritance

Consider this seemingly correct inheritance hierarchy:

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

# A square IS-A rectangle, right?
class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)
    
    def set_width(self, width):
        self._width = width
        self._height = width  # Keep square property
    
    def set_height(self, height):
        self._width = height  # Keep square property
        self._height = height
```

This violates LSP because:

!!!error "🚫 LSP Violations Identified"
    **Broken Behavioral Contract**
    - Rectangle allows independent width/height changes
    - Square couples width and height changes
    - Subclass strengthens preconditions
    - Unexpected side effects occur
    
    **Substitution Fails**
    - Code expecting Rectangle behavior breaks
    - Setting width unexpectedly changes height
    - Invariants violated
    - Program correctness compromised

The violation becomes obvious when using polymorphism:

```python
def test_rectangle_area(rect):
    rect.set_width(5)
    rect.set_height(4)
    assert rect.area() == 20  # Expects 5 * 4 = 20

# Works with Rectangle
rectangle = Rectangle(0, 0)
test_rectangle_area(rectangle)  # ✓ Passes

# Fails with Square
square = Square(0)
test_rectangle_area(square)  # ✗ Fails! area() returns 16, not 20
```

The Square violates the Rectangle's behavioral contract. Setting width and height independently is expected behavior for rectangles, but Square changes both dimensions together.

### Refactoring to Follow LSP

Remove the inheritance relationship and use composition or separate hierarchies:

```python
# Option 1: Separate hierarchies with common interface
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

# Option 2: Immutable shapes
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

Now the code follows LSP:

!!!success "✅ LSP Benefits"
    **Behavioral Consistency**
    - Each class has clear contract
    - No unexpected side effects
    - Substitution works correctly
    - Polymorphism reliable
    
    **Clear Semantics**
    - Rectangle and Square are distinct
    - Each has appropriate operations
    - No forced inheritance relationship
    - Intent explicit in design
    
    **Maintainability**
    - Easy to reason about behavior
    - No hidden coupling
    - Tests straightforward
    - Extensions predictable

## Subtle Violation: The Bird That Can't Fly

Another common LSP violation comes from overgeneralized base classes that don't fit all subclasses.

### The Flawed Bird Hierarchy

Consider this bird class hierarchy:

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

This violates LSP because:

!!!error "🚫 LSP Violations Identified"
    **Broken Contract**
    - Base class promises fly() works
    - Subclass throws exception instead
    - Postcondition weakened
    - Substitution fails
    
    **Type Checking Required**
    - Must check if bird is Penguin
    - Cannot trust Bird abstraction
    - Defeats polymorphism
    - Fragile client code

The violation surfaces when using polymorphism:

```java
public class BirdMigration {
    public void migrateAll(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.fly();  // Crashes if bird is a Penguin!
        }
    }
}

// Usage
List<Bird> birds = Arrays.asList(
    new Sparrow(),
    new Penguin(),  // This will crash the migration!
    new Sparrow()
);

BirdMigration migration = new BirdMigration();
migration.migrateAll(birds);  // ✗ Throws UnsupportedOperationException
```

### Refactoring to Follow LSP

Redesign the hierarchy to reflect actual capabilities:

```java
// Base class with common behavior
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

// Interface for flying capability
public interface Flyable {
    void fly();
    double getAltitude();
}

// Flying birds implement both
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

// Non-flying birds don't implement Flyable
public class Penguin extends Bird {
    public Penguin() {
        super("Penguin");
    }
    
    @Override
    public void move() {
        System.out.println(getName() + " is swimming");
    }
}

// Migration now works with correct abstraction
public class BirdMigration {
    public void migrateFlyingBirds(List<Flyable> birds) {
        for (Flyable bird : birds) {
            bird.fly();  // Safe—all Flyable birds can fly
        }
    }
    
    public void moveAllBirds(List<Bird> birds) {
        for (Bird bird : birds) {
            bird.move();  // Safe—all birds can move
        }
    }
}
```

Now the code follows LSP:

!!!success "✅ LSP Benefits"
    **Correct Abstractions**
    - Bird represents all birds
    - Flyable represents flying capability
    - No broken promises
    - Substitution works correctly
    
    **Type Safety**
    - Compile-time guarantees
    - No runtime exceptions
    - No type checking needed
    - Polymorphism reliable
    
    **Flexibility**
    - Easy to add new bird types
    - Clear capability contracts
    - Composable behaviors
    - Maintainable design

## Detecting LSP Violations

Recognizing LSP violations requires understanding behavioral contracts, not just type relationships.

### Warning Signs

Watch for these indicators of LSP violations:

!!!warning "🔍 LSP Violation Indicators"
    **Exception Throwing**
    - Subclass throws exceptions base class doesn't
    - UnsupportedOperationException in overrides
    - NotImplementedException patterns
    - Empty method implementations
    
    **Type Checking**
    - instanceof checks before using objects
    - Type-specific behavior branches
    - Casting to concrete types
    - Defensive programming around subtypes
    
    **Strengthened Preconditions**
    - Subclass requires more than base class
    - Additional validation in subclass
    - Narrower input acceptance
    - More restrictive parameters
    
    **Weakened Postconditions**
    - Subclass returns less than base class
    - Weaker guarantees in subclass
    - Partial implementation
    - Degraded functionality

### The Substitution Test

Apply this test to verify LSP compliance:

```typescript
// Test: Can subclass replace base class?
interface PaymentProcessor {
    processPayment(amount: number): boolean;
    refund(transactionId: string): boolean;
}

class CreditCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        // Process credit card payment
        return true;
    }
    
    refund(transactionId: string): boolean {
        // Process refund
        return true;
    }
}

// LSP Violation: Strengthens preconditions
class GiftCardProcessor implements PaymentProcessor {
    processPayment(amount: number): boolean {
        if (amount > 500) {
            throw new Error("Gift cards limited to $500");  // ✗ Violation!
        }
        return true;
    }
    
    refund(transactionId: string): boolean {
        throw new Error("Gift cards cannot be refunded");  // ✗ Violation!
    }
}

// Client code breaks with GiftCardProcessor
function checkout(processor: PaymentProcessor, amount: number) {
    if (processor.processPayment(amount)) {
        console.log("Payment successful");
    }
}

checkout(new CreditCardProcessor(), 1000);  // ✓ Works
checkout(new GiftCardProcessor(), 1000);    // ✗ Throws exception
```

The GiftCardProcessor violates LSP by adding restrictions not present in the interface contract.

### Fixing the Violation

Make the contract explicit and honor it:

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
        // Process payment
        return new PaymentResult(true, "Payment processed");
    }
    
    refund(transactionId: string): RefundResult {
        // Process refund
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

// Client code now works correctly
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

checkout(new CreditCardProcessor(), 1000);  // ✓ Works
checkout(new GiftCardProcessor(), 1000);    // ✓ Works—handles limit gracefully
```

Now both processors honor the contract and can substitute for each other.

## When Inheritance Fails: Favor Composition

Many LSP violations indicate that inheritance is the wrong tool for the job.

### The Composition Alternative

Instead of forcing inheritance, use composition:

```python
# Instead of inheritance hierarchy
class Vehicle:
    def start_engine(self):
        pass

class ElectricCar(Vehicle):
    def start_engine(self):
        raise NotImplementedError("Electric cars don't have engines!")  # ✗ LSP violation

# Use composition with capabilities
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

# Usage
gas_car = Vehicle(Engine())
electric_car = Vehicle(ElectricMotor())

gas_car.start()      # ✓ Engine started
electric_car.start() # ✓ Motor started
```

Composition avoids LSP violations by eliminating inappropriate inheritance relationships.

!!!tip "💡 Composition Over Inheritance"
    **When to Use Composition**
    - Subclass doesn't fully support base class behavior
    - Relationship is "has-a" not "is-a"
    - Need to mix multiple capabilities
    - Behavior varies independently
    
    **Benefits**
    - No LSP violations
    - More flexible
    - Easier to test
    - Clearer intent

## Conclusion

The Liskov Substitution Principle ensures that inheritance hierarchies remain sound and polymorphism works correctly. Violations break the fundamental promise of object-oriented design: that subclasses can replace base classes without surprises.

Key takeaways:

!!!success "🎯 LSP Guidelines"
    **Design for Substitutability**
    - Subclasses must honor base class contracts
    - Don't strengthen preconditions
    - Don't weaken postconditions
    - Preserve invariants
    
    **Recognize Violations**
    - Exception throwing in overrides
    - Type checking before using objects
    - Empty or partial implementations
    - Defensive programming patterns
    
    **Choose the Right Tool**
    - Use inheritance for true "is-a" relationships
    - Use composition for "has-a" relationships
    - Use interfaces for capability contracts
    - Don't force inheritance where it doesn't fit
    
    **Test Substitutability**
    - Can subclass replace base class?
    - Does behavior remain consistent?
    - Are contracts honored?
    - Does polymorphism work correctly?

The Liskov Substitution Principle guards the integrity of inheritance hierarchies. When followed, it enables reliable polymorphism and maintainable object-oriented systems. When violated, it creates subtle bugs that undermine the entire design. The next time you create a subclass, ask: can it truly substitute for its base class without breaking anything? If not, reconsider the inheritance relationship.
