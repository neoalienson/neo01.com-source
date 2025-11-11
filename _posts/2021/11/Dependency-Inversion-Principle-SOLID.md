---
title: "Dependency Inversion Principle: High-Level Modules Should Not Depend on Low-Level Modules"
date: 2021-11-30
lang: en
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "High-level modules should not depend on low-level modules. Both should depend on abstractions. This principle inverts traditional dependency structures, yet developers routinely create rigid architectures that violate it."
series: solid
thumbnail: /assets/solid/thumbnail.png
---

The Dependency Inversion Principle (DIP), the fifth and final principle in SOLID design, states: "High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions." Introduced by Robert C. Martin, DIP addresses the fundamental problem of rigid architectures where business logic becomes tightly coupled to implementation details. While it sounds abstract, DIP violations are everywhere—from database queries embedded in business logic to UI code directly instantiating concrete classes.

This article explores the Dependency Inversion Principle through real-world scenarios where dependencies flow in the wrong direction. From tightly coupled database access to hardcoded service dependencies, we'll dissect what dependency inversion means, how to detect violations, and why abstractions are the key to flexible, testable architectures. Through production examples and refactoring patterns, we reveal why DIP is the foundation of maintainable software design.

## Understanding Dependency Inversion

Before diving into violations, it's crucial to understand what dependency inversion means and why it matters.

### What Does Inversion Mean?

The principle requires inverting the traditional dependency flow:

!!!anote "📚 Dependency Inversion Definition"
    **Traditional Dependencies**
    - High-level modules depend on low-level modules
    - Business logic depends on implementation details
    - Changes ripple upward through layers
    - Difficult to test and modify
    
    **Inverted Dependencies**
    - Both depend on abstractions (interfaces)
    - High-level defines what it needs
    - Low-level implements abstractions
    - Dependencies point toward abstractions
    
    **Key Concepts**
    - Abstractions: Interfaces or abstract classes
    - High-level: Business logic, policies
    - Low-level: Implementation details, I/O
    - Inversion: Dependencies flow toward abstractions

DIP ensures that business logic remains independent of implementation details.

### Why DIP Matters

Violating DIP creates rigid, fragile architectures:

!!!warning "⚠️ Cost of DIP Violations"
    **Tight Coupling**
    - Business logic tied to implementation
    - Cannot change implementations easily
    - Difficult to swap dependencies
    - Modifications require extensive changes
    
    **Testing Difficulties**
    - Cannot test in isolation
    - Requires real databases, services
    - Slow, brittle tests
    - Hard to mock dependencies
    
    **Inflexibility**
    - Cannot reuse high-level logic
    - Locked into specific technologies
    - Difficult to adapt to changes
    - Architecture becomes rigid

These violations make systems difficult to test, modify, and evolve.

## Classic Violation: Direct Database Dependency

One of the most common DIP violations occurs when business logic directly depends on database implementations.

### Tightly Coupled Data Access

Consider this business logic with embedded database access:

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
        
        # Calculate total
        total = sum(item['price'] * item['quantity'] for item in items)
        
        # Insert order
        cursor.execute(
            "INSERT INTO orders (customer_id, total) VALUES (%s, %s)",
            (customer_id, total)
        )
        order_id = cursor.lastrowid
        
        # Insert order items
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

This violates DIP because:

!!!error "🚫 Identified DIP Violation"
    **Direct Dependency**
    - OrderService depends on MySQL directly
    - Business logic mixed with data access
    - Cannot change database without modifying service
    - High-level depends on low-level
    
    **Testing Problems**
    - Cannot test without database
    - Requires MySQL running
    - Slow integration tests
    - Cannot mock data access
    
    **Inflexibility**
    - Locked into MySQL
    - Cannot switch to PostgreSQL, MongoDB
    - Cannot reuse logic with different storage
    - Difficult to add caching layer

The business logic is tightly coupled to MySQL implementation details.

### Refactoring with Dependency Inversion

Introduce an abstraction and invert the dependency:

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Optional

# Abstraction defined by high-level module
class OrderRepository(ABC):
    @abstractmethod
    def save_order(self, customer_id: int, items: List[Dict], total: float) -> int:
        pass
    
    @abstractmethod
    def find_order(self, order_id: int) -> Optional[Dict]:
        pass

# High-level business logic depends on abstraction
class OrderService:
    def __init__(self, repository: OrderRepository):
        self.repository = repository
    
    def create_order(self, customer_id: int, items: List[Dict]) -> int:
        # Business logic
        total = sum(item['price'] * item['quantity'] for item in items)
        
        # Delegate to abstraction
        return self.repository.save_order(customer_id, items, total)
    
    def get_order(self, order_id: int) -> Optional[Dict]:
        return self.repository.find_order(order_id)

# Low-level implementation depends on abstraction
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

# Alternative implementation
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

# Usage with dependency injection
import mysql.connector

db = mysql.connector.connect(host="localhost", user="root", password="password", database="orders")
repository = MySQLOrderRepository(db)
service = OrderService(repository)

order_id = service.create_order(123, [
    {'product_id': 1, 'quantity': 2, 'price': 10.00}
])
```

Now the code follows DIP:

!!!success "✅ Benefits of DIP"
    **Inverted Dependencies**
    - OrderService depends on abstraction
    - MySQLOrderRepository implements abstraction
    - Dependencies point toward abstraction
    - High-level independent of low-level
    
    **Testability**
    - Can test with mock repository
    - No database required for unit tests
    - Fast, isolated tests
    - Easy to verify business logic
    
    **Flexibility**
    - Can swap MySQL for MongoDB
    - Can add caching layer
    - Can use in-memory for testing
    - Business logic reusable

## Subtle Violation: Hardcoded Service Dependencies

Another common DIP violation occurs when classes directly instantiate their dependencies.

### Tightly Coupled Services

Consider this notification system with hardcoded dependencies:

```java
public class EmailService {
    private String smtpHost;
    private int smtpPort;
    
    public EmailService(String smtpHost, int smtpPort) {
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
    }
    
    public void sendEmail(String to, String subject, String body) {
        // Send email via SMTP
        System.out.println("Sending email to " + to);
    }
}

public class UserService {
    private EmailService emailService;
    
    public UserService() {
        // Direct instantiation - DIP violation!
        this.emailService = new EmailService("smtp.example.com", 587);
    }
    
    public void registerUser(String email, String password) {
        // Register user logic
        System.out.println("Registering user: " + email);
        
        // Send welcome email
        emailService.sendEmail(
            email,
            "Welcome!",
            "Thank you for registering."
        );
    }
    
    public void resetPassword(String email) {
        // Reset password logic
        System.out.println("Resetting password for: " + email);
        
        // Send reset email
        emailService.sendEmail(
            email,
            "Password Reset",
            "Click here to reset your password."
        );
    }
}
```

This violates DIP because:

!!!error "🚫 Identified DIP Violation"
    **Direct Instantiation**
    - UserService creates EmailService directly
    - Hardcoded SMTP configuration
    - Cannot change notification method
    - High-level depends on concrete class
    
    **Testing Problems**
    - Cannot test without sending emails
    - Cannot verify email content easily
    - Requires SMTP server for tests
    - Difficult to mock
    
    **Inflexibility**
    - Locked into email notifications
    - Cannot add SMS, push notifications
    - Cannot switch email providers
    - Configuration hardcoded

### Refactoring with Abstractions

Introduce an abstraction and use dependency injection:

```java
// Abstraction defined by high-level needs
public interface NotificationService {
    void sendNotification(String recipient, String subject, String message);
}

// High-level business logic depends on abstraction
public class UserService {
    private NotificationService notificationService;
    
    // Dependency injected via constructor
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

// Low-level implementations
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
        // SMTP implementation
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
        // SMS API implementation
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

// Usage with dependency injection
NotificationService emailService = new EmailNotificationService("smtp.example.com", 587);
UserService userService = new UserService(emailService);

// Or use multiple channels
List<NotificationService> services = Arrays.asList(
    new EmailNotificationService("smtp.example.com", 587),
    new SMSNotificationService("api-key-123")
);
NotificationService compositeService = new CompositeNotificationService(services);
UserService multiChannelUserService = new UserService(compositeService);
```

Now the code follows DIP:

!!!success "✅ Benefits of DIP"
    **Proper Abstraction**
    - UserService depends on interface
    - Implementations depend on interface
    - Dependencies inverted correctly
    - Business logic decoupled
    
    **Easy Testing**
    - Can inject mock service
    - Verify notifications without sending
    - Fast unit tests
    - No external dependencies
    
    **Flexibility**
    - Can switch to SMS, push notifications
    - Can use multiple channels
    - Can change providers easily
    - Configuration externalized

## Detecting DIP Violations

Identifying DIP violations requires examining dependency directions and coupling.

### Warning Signs

Watch for these indicators of DIP violations:

!!!warning "🔍 DIP Violation Indicators"
    **Direct Instantiation**
    - new keyword in business logic
    - Concrete classes in constructors
    - Factory methods creating concrete types
    - Static method calls to implementations
    
    **Import Statements**
    - High-level imports low-level packages
    - Business logic imports database packages
    - Core imports infrastructure
    - Upward dependency flow
    
    **Testing Difficulties**
    - Cannot test without external systems
    - Requires databases, APIs, file systems
    - Slow integration tests required
    - Cannot isolate business logic
    
    **Inflexibility**
    - Difficult to change implementations
    - Locked into specific technologies
    - Cannot reuse business logic
    - Configuration hardcoded

### Dependency Direction Test

Apply this test to verify DIP compliance:

```typescript
// Test: Do dependencies point toward abstractions?

// ✗ Violation: High-level depends on low-level
class ReportGenerator {
    private pdfGenerator: PDFGenerator;  // Concrete class
    
    constructor() {
        this.pdfGenerator = new PDFGenerator();  // Direct instantiation
    }
    
    generateReport(data: any): void {
        const content = this.formatData(data);
        this.pdfGenerator.createPDF(content);  // Depends on implementation
    }
    
    private formatData(data: any): string {
        // Business logic
        return "formatted data";
    }
}

// ✓ Correct: Both depend on abstraction
interface DocumentGenerator {
    generate(content: string): void;
}

class ReportGenerator {
    private generator: DocumentGenerator;  // Abstraction
    
    constructor(generator: DocumentGenerator) {  // Dependency injection
        this.generator = generator;
    }
    
    generateReport(data: any): void {
        const content = this.formatData(data);
        this.generator.generate(content);  // Depends on abstraction
    }
    
    private formatData(data: any): string {
        return "formatted data";
    }
}

class PDFDocumentGenerator implements DocumentGenerator {
    generate(content: string): void {
        console.log("Generating PDF");
        // PDF implementation
    }
}

class HTMLDocumentGenerator implements DocumentGenerator {
    generate(content: string): void {
        console.log("Generating HTML");
        // HTML implementation
    }
}

// Usage
const pdfGenerator = new PDFDocumentGenerator();
const reportGen = new ReportGenerator(pdfGenerator);
reportGen.generateReport({ sales: 1000 });

// Easy to switch
const htmlGenerator = new HTMLDocumentGenerator();
const htmlReportGen = new ReportGenerator(htmlGenerator);
```

## When to Apply DIP

Knowing when to apply dependency inversion is as important as knowing how.

### Apply DIP When

Invert dependencies in these situations:

!!!tip "✅ When to Apply DIP"
    **Business Logic Layer**
    - Core business rules
    - Domain logic
    - Use cases and workflows
    - Policy decisions
    
    **External Dependencies**
    - Database access
    - External APIs
    - File system operations
    - Third-party services
    
    **Testing Requirements**
    - Need isolated unit tests
    - Want fast test execution
    - Require mock dependencies
    - Test-driven development
    
    **Flexibility Needs**
    - Multiple implementations possible
    - Technology might change
    - Need to swap dependencies
    - Configuration varies by environment

### Avoid Over-Abstraction

Don't create unnecessary abstractions:

!!!warning "⚠️ When Not to Apply DIP"
    **Stable Dependencies**
    - Standard library functions
    - Language built-ins
    - Stable frameworks
    - Unlikely to change
    
    **Simple Utilities**
    - Pure functions
    - Stateless helpers
    - Mathematical operations
    - String manipulation
    
    **Performance Critical**
    - Hot paths requiring optimization
    - Direct calls needed
    - Abstraction overhead significant
    - Profiling shows impact
    
    **Over-Engineering**
    - Single implementation likely
    - No testing benefits
    - Adds complexity without value
    - YAGNI applies

Apply DIP where it provides clear benefits, not everywhere.

## Conclusion

The Dependency Inversion Principle completes SOLID by addressing the fundamental structure of dependencies in software systems. By ensuring that high-level modules depend on abstractions rather than low-level details, DIP creates flexible, testable, and maintainable architectures.

Key takeaways:

!!!success "🎯 DIP Guidelines"
    **Invert Dependencies**
    - High-level defines abstractions
    - Low-level implements abstractions
    - Dependencies point toward abstractions
    - Business logic independent of details
    
    **Use Dependency Injection**
    - Inject dependencies via constructors
    - Avoid direct instantiation
    - Use factories or containers
    - Configure at composition root
    
    **Design Abstractions**
    - Define interfaces based on needs
    - Keep abstractions focused
    - Avoid leaking implementation details
    - Stable, minimal interfaces
    
    **Enable Testing**
    - Mock dependencies easily
    - Test business logic in isolation
    - Fast, reliable unit tests
    - No external dependencies required

DIP works synergistically with other SOLID principles: it supports Single Responsibility by separating concerns, enables Open-Closed through abstraction, reinforces Liskov Substitution with proper interfaces, and complements Interface Segregation with focused abstractions. Together, these principles create software that is robust, flexible, and maintainable.

This concludes our SOLID series. By applying these five principles—Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion—you can build software systems that stand the test of time, adapt to changing requirements, and remain a joy to work with.
