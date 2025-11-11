---
title: "Single Responsibility Principle: The Foundation of SOLID Design"
date: 2021-09-09
lang: en
categories: Development
tags: [Architecture, Best Practices, Software Design]
excerpt: "A class should have only one reason to change. This simple statement forms the foundation of SOLID design, yet developers struggle with what constitutes a 'single responsibility' and when to split classes."
series: solid
thumbnail: /assets/solid/thumbnail.png
---

The Single Responsibility Principle (SRP) stands as the first and arguably most fundamental principle in SOLID design. Coined by Robert C. Martin, it states: "A class should have only one reason to change." This deceptively simple statement has sparked countless debates about what constitutes a "single responsibility," when to split classes, and how granular is too granular. Developers oscillate between creating god classes that do everything and over-fragmenting code into dozens of tiny classes that obscure the overall design.

This exploration examines the Single Responsibility Principle through real-world scenarios, from obvious violations to subtle design decisions. We'll dissect what "responsibility" actually means, when to split classes, and when consolidation makes more sense. Drawing from production codebases and refactoring experiences, we uncover why SRP is both essential and easily misunderstood.

## Understanding Single Responsibility

Before diving into when and how to apply SRP, understanding what the principle actually means is essential. The term "single responsibility" is often misinterpreted as "does only one thing."

### What is a Responsibility?

A responsibility is not a method or a function—it's a reason to change:

!!!anote "📚 Responsibility Definition"
    **Not About Method Count**
    - A class can have multiple methods
    - Multiple methods can serve one responsibility
    - Single method doesn't guarantee single responsibility
    
    **About Reasons to Change**
    - Business logic changes
    - Data format changes
    - External system integration changes
    - Each represents a different responsibility
    
    **About Actors**
    - Who requests changes to this code?
    - Different stakeholders = different responsibilities
    - CFO wants financial reports, CTO wants system metrics
    - Same class serving both = multiple responsibilities

The principle emphasizes "reason to change" because that's where maintenance pain emerges. When a class has multiple responsibilities, changes for one reason can break functionality for another reason.

### Why SRP Matters

Violating SRP creates maintenance burden and introduces bugs:

!!!warning "⚠️ Costs of Multiple Responsibilities"
    **Coupling and Fragility**
    - Changes for one responsibility affect others
    - Risk of breaking unrelated functionality
    - Difficult to modify without side effects
    
    **Testing Complexity**
    - Must test all responsibilities together
    - Cannot test responsibilities in isolation
    - Test setup becomes complex
    - Mocking becomes difficult
    
    **Reusability Problems**
    - Cannot reuse one responsibility without others
    - Forces unnecessary dependencies
    - Leads to code duplication

These costs compound over time. A class with multiple responsibilities becomes increasingly difficult to maintain as the codebase evolves.

## Obvious Violations: The God Class

The most blatant SRP violations come from god classes—classes that handle multiple unrelated responsibilities.

### The Classic God Class

Consider this common pattern in web applications:

```python
class UserManager:
    def __init__(self, db_connection, email_service, logger):
        self.db = db_connection
        self.email = email_service
        self.logger = logger
    
    # User CRUD operations
    def create_user(self, username, email, password):
        hashed_password = self._hash_password(password)
        user_id = self.db.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, hashed_password)
        )
        self.logger.info(f"User created: {username}")
        return user_id
    
    def get_user(self, user_id):
        return self.db.query("SELECT * FROM users WHERE id = ?", (user_id,))
    
    def update_user(self, user_id, **kwargs):
        # Update logic
        self.logger.info(f"User updated: {user_id}")
    
    def delete_user(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        self.logger.info(f"User deleted: {user_id}")
    
    # Password management
    def _hash_password(self, password):
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, user_id, password):
        user = self.get_user(user_id)
        return self._hash_password(password) == user['password']
    
    def reset_password(self, user_id):
        new_password = self._generate_random_password()
        self.update_user(user_id, password=self._hash_password(new_password))
        user = self.get_user(user_id)
        self.send_password_reset_email(user['email'], new_password)
    
    # Email operations
    def send_welcome_email(self, user_id):
        user = self.get_user(user_id)
        self.email.send(
            to=user['email'],
            subject="Welcome!",
            body=f"Welcome {user['username']}!"
        )
        self.logger.info(f"Welcome email sent to {user['email']}")
    
    def send_password_reset_email(self, email, new_password):
        self.email.send(
            to=email,
            subject="Password Reset",
            body=f"Your new password is: {new_password}"
        )
        self.logger.info(f"Password reset email sent to {email}")
    
    # Validation
    def validate_email(self, email):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def validate_username(self, username):
        return len(username) >= 3 and username.isalnum()
    
    # Utility methods
    def _generate_random_password(self):
        import random
        import string
        return ''.join(random.choices(string.ascii_letters + string.digits, k=12))
```

This class has at least five distinct responsibilities:

!!!error "🚫 Multiple Responsibilities Identified"
    **Database Operations**
    - CRUD operations for users
    - SQL query construction
    - Database connection management
    
    **Password Management**
    - Password hashing
    - Password verification
    - Password generation
    
    **Email Operations**
    - Welcome email composition and sending
    - Password reset email composition and sending
    
    **Validation**
    - Email format validation
    - Username validation
    
    **Logging**
    - Logging user operations
    - Logging email operations

Each responsibility represents a different reason to change. If email templates change, you modify UserManager. If password hashing algorithm changes, you modify UserManager. If validation rules change, you modify UserManager. Every change risks breaking unrelated functionality.

This is a classic example of the [God Object anti-pattern](/2022/04/Software-Development-Anti-Patterns/)—a class that accumulates too many responsibilities and becomes unmaintainable.

### Refactoring to Single Responsibilities

Split the god class into focused classes, each with a single responsibility:

```python
# Responsibility: Password security
class PasswordService:
    def hash_password(self, password):
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password, hashed_password):
        return self.hash_password(password) == hashed_password
    
    def generate_random_password(self):
        import random
        import string
        return ''.join(random.choices(string.ascii_letters + string.digits, k=12))

# Responsibility: User data validation
class UserValidator:
    def validate_email(self, email):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
    
    def validate_username(self, username):
        if len(username) < 3 or not username.isalnum():
            raise ValueError("Username must be at least 3 alphanumeric characters")

# Responsibility: User-related email operations
class UserEmailService:
    def __init__(self, email_service):
        self.email = email_service
    
    def send_welcome_email(self, user):
        self.email.send(
            to=user.email,
            subject="Welcome!",
            body=f"Welcome {user.username}!"
        )
    
    def send_password_reset_email(self, user, new_password):
        self.email.send(
            to=user.email,
            subject="Password Reset",
            body=f"Your new password is: {new_password}"
        )

# Responsibility: User data persistence
class UserRepository:
    def __init__(self, db_connection):
        self.db = db_connection
    
    def create(self, username, email, hashed_password):
        return self.db.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, hashed_password)
        )
    
    def find_by_id(self, user_id):
        return self.db.query("SELECT * FROM users WHERE id = ?", (user_id,))
    
    def update(self, user_id, **kwargs):
        # Update logic
        pass
    
    def delete(self, user_id):
        self.db.execute("DELETE FROM users WHERE id = ?", (user_id,))

# Responsibility: User business operations (orchestration)
class UserService:
    def __init__(self, repository, password_service, validator, email_service):
        self.repository = repository
        self.password_service = password_service
        self.validator = validator
        self.email_service = email_service
    
    def register_user(self, username, email, password):
        self.validator.validate_username(username)
        self.validator.validate_email(email)
        
        hashed_password = self.password_service.hash_password(password)
        user_id = self.repository.create(username, email, hashed_password)
        
        user = self.repository.find_by_id(user_id)
        self.email_service.send_welcome_email(user)
        
        return user_id
    
    def reset_password(self, user_id):
        new_password = self.password_service.generate_random_password()
        hashed_password = self.password_service.hash_password(new_password)
        
        self.repository.update(user_id, password=hashed_password)
        user = self.repository.find_by_id(user_id)
        
        self.email_service.send_password_reset_email(user, new_password)
```

Now each class has a single, well-defined responsibility:

!!!success "✅ Single Responsibility Benefits"
    **Focused Classes**
    - PasswordService: password security operations
    - UserValidator: user data validation rules
    - UserEmailService: user-related email operations
    - UserRepository: user data persistence
    - UserService: orchestrates user business operations
    
    **Clear Reasons to Change**
    - Password algorithm changes → PasswordService
    - Validation rules change → UserValidator
    - Email templates change → UserEmailService
    - Database schema changes → UserRepository
    - Business workflow changes → UserService
    
    **Improved Testability**
    - Test password hashing independently
    - Test validation rules in isolation
    - Mock email service for user operations
    - Test repository without business logic

Each class can now evolve independently. Changes to password hashing don't risk breaking email functionality. Changes to validation don't affect database operations.

## Subtle Violations: Mixed Concerns

More insidious than god classes are classes that mix concerns in subtle ways—appearing focused but actually handling multiple responsibilities.

### The Report Generator Problem

Consider a class that generates sales reports:

```java
public class SalesReportGenerator {
    private DatabaseConnection db;
    
    public String generateReport(Date startDate, Date endDate) {
        // Fetch data from database
        List<Sale> sales = db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
        
        // Calculate statistics
        double totalRevenue = 0;
        Map<String, Double> revenueByProduct = new HashMap<>();
        
        for (Sale sale : sales) {
            totalRevenue += sale.getAmount();
            revenueByProduct.merge(
                sale.getProductName(),
                sale.getAmount(),
                Double::sum
            );
        }
        
        // Format as HTML
        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h1>Sales Report</h1>");
        html.append("<p>Period: ").append(startDate).append(" to ").append(endDate).append("</p>");
        html.append("<p>Total Revenue: $").append(totalRevenue).append("</p>");
        html.append("<h2>Revenue by Product</h2>");
        html.append("<ul>");
        
        for (Map.Entry<String, Double> entry : revenueByProduct.entrySet()) {
            html.append("<li>")
                .append(entry.getKey())
                .append(": $")
                .append(entry.getValue())
                .append("</li>");
        }
        
        html.append("</ul></body></html>");
        return html.toString();
    }
}
```

This class appears focused—it generates sales reports. But it actually has three distinct responsibilities:

!!!warning "⚠️ Hidden Multiple Responsibilities"
    **Data Retrieval**
    - Queries database for sales data
    - Constructs SQL queries
    - Handles database connection
    
    **Business Logic**
    - Calculates total revenue
    - Aggregates revenue by product
    - Computes statistics
    
    **Presentation**
    - Formats data as HTML
    - Defines report structure
    - Handles HTML escaping

What happens when requirements change? If you need reports in PDF format, you modify this class. If the database schema changes, you modify this class. If calculation logic changes, you modify this class. Three different actors (UI team, DBA, business analysts) all have reasons to change this single class.

### Refactoring to Separate Concerns

Split the responsibilities into focused classes:

```java
// Responsibility: Retrieve sales data
public class SalesRepository {
    private DatabaseConnection db;
    
    public List<Sale> findByDateRange(Date startDate, Date endDate) {
        return db.query(
            "SELECT * FROM sales WHERE date BETWEEN ? AND ?",
            startDate, endDate
        );
    }
}

// Responsibility: Calculate sales statistics
public class SalesAnalyzer {
    public SalesStatistics analyze(List<Sale> sales) {
        double totalRevenue = 0;
        Map<String, Double> revenueByProduct = new HashMap<>();
        
        for (Sale sale : sales) {
            totalRevenue += sale.getAmount();
            revenueByProduct.merge(
                sale.getProductName(),
                sale.getAmount(),
                Double::sum
            );
        }
        
        return new SalesStatistics(totalRevenue, revenueByProduct);
    }
}

// Responsibility: Format sales data as HTML
public class HtmlSalesReportFormatter {
    public String format(Date startDate, Date endDate, SalesStatistics stats) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h1>Sales Report</h1>");
        html.append("<p>Period: ").append(startDate).append(" to ").append(endDate).append("</p>");
        html.append("<p>Total Revenue: $").append(stats.getTotalRevenue()).append("</p>");
        html.append("<h2>Revenue by Product</h2>");
        html.append("<ul>");
        
        for (Map.Entry<String, Double> entry : stats.getRevenueByProduct().entrySet()) {
            html.append("<li>")
                .append(entry.getKey())
                .append(": $")
                .append(entry.getValue())
                .append("</li>");
        }
        
        html.append("</ul></body></html>");
        return html.toString();
    }
}

// Responsibility: Orchestrate report generation
public class SalesReportService {
    private SalesRepository repository;
    private SalesAnalyzer analyzer;
    private SalesReportFormatter formatter;
    
    public String generateReport(Date startDate, Date endDate, ReportFormat format) {
        List<Sale> sales = repository.findByDateRange(startDate, endDate);
        SalesStatistics stats = analyzer.analyze(sales);
        return formatter.format(startDate, endDate, stats);
    }
}
```

Now each class has a single, focused responsibility:

!!!success "✅ Separation Benefits"
    **Independent Evolution**
    - Add PDF formatter without touching data retrieval
    - Change database without affecting calculations
    - Modify calculations without affecting presentation
    
    **Reusability**
    - Use SalesAnalyzer for different report types
    - Use SalesRepository for other sales operations
    - Create multiple formatters (PDF, Excel, JSON)
    
    **Testability**
    - Test calculations with mock data
    - Test formatting without database
    - Test data retrieval independently

The refactored design allows each responsibility to evolve independently. Adding PDF reports requires only a new formatter class. Changing calculation logic affects only SalesAnalyzer.

## The Granularity Trap: Too Many Classes

While SRP prevents god classes, overzealous application creates the opposite problem—excessive fragmentation into dozens of tiny classes.

### Over-Fragmentation Example

Consider this overly granular design:

```typescript
// Separate class for each validation rule
class EmailValidator {
    validate(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

class PasswordLengthValidator {
    validate(password: string): boolean {
        return password.length >= 8;
    }
}

class PasswordComplexityValidator {
    validate(password: string): boolean {
        return /[A-Z]/.test(password) && /[0-9]/.test(password);
    }
}

class UsernameValidator {
    validate(username: string): boolean {
        return username.length >= 3 && /^[a-zA-Z0-9]+$/.test(username);
    }
}

// Separate class for each field extraction
class EmailExtractor {
    extract(request: Request): string {
        return request.body.email;
    }
}

class PasswordExtractor {
    extract(request: Request): string {
        return request.body.password;
    }
}

class UsernameExtractor {
    extract(request: Request): string {
        return request.body.username;
    }
}

// Registration requires coordinating many tiny classes
class UserRegistrationService {
    constructor(
        private emailValidator: EmailValidator,
        private passwordLengthValidator: PasswordLengthValidator,
        private passwordComplexityValidator: PasswordComplexityValidator,
        private usernameValidator: UsernameValidator,
        private emailExtractor: EmailExtractor,
        private passwordExtractor: PasswordExtractor,
        private usernameExtractor: UsernameExtractor
    ) {}
    
    register(request: Request): void {
        const email = this.emailExtractor.extract(request);
        const password = this.passwordExtractor.extract(request);
        const username = this.usernameExtractor.extract(request);
        
        if (!this.emailValidator.validate(email)) throw new Error("Invalid email");
        if (!this.passwordLengthValidator.validate(password)) throw new Error("Password too short");
        if (!this.passwordComplexityValidator.validate(password)) throw new Error("Password not complex");
        if (!this.usernameValidator.validate(username)) throw new Error("Invalid username");
        
        // Actually register user...
    }
}
```

This design has gone too far:

!!!error "🚫 Over-Fragmentation Problems"
    **Excessive Indirection**
    - Simple operations buried in class hierarchies
    - Difficult to understand overall flow
    - Navigation between classes becomes tedious
    
    **Artificial Boundaries**
    - Validation rules naturally belong together
    - Field extraction is trivial, doesn't need classes
    - Creating classes for the sake of classes
    
    **Maintenance Burden**
    - More files to navigate
    - More dependencies to manage
    - More boilerplate code

### Finding the Right Granularity

A more balanced approach groups related operations:

```typescript
// Validation rules grouped by cohesion
class UserValidator {
    validateEmail(email: string): void {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ValidationError("Invalid email format");
        }
    }
    
    validatePassword(password: string): void {
        if (password.length < 8) {
            throw new ValidationError("Password must be at least 8 characters");
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            throw new ValidationError("Password must contain uppercase and numbers");
        }
    }
    
    validateUsername(username: string): void {
        if (username.length < 3 || !/^[a-zA-Z0-9]+$/.test(username)) {
            throw new ValidationError("Username must be at least 3 alphanumeric characters");
        }
    }
}

class UserRegistrationService {
    constructor(
        private validator: UserValidator,
        private repository: UserRepository
    ) {}
    
    register(request: Request): void {
        const { email, password, username } = request.body;
        
        this.validator.validateEmail(email);
        this.validator.validatePassword(password);
        this.validator.validateUsername(username);
        
        this.repository.create(username, email, password);
    }
}
```

This balanced design:

!!!success "✅ Appropriate Granularity"
    **Cohesive Grouping**
    - Related validation rules together
    - Clear class purpose: user validation
    - Easy to understand and navigate
    
    **Reasonable Abstraction**
    - Classes represent meaningful concepts
    - Not creating classes for trivial operations
    - Balances SRP with pragmatism
    
    **Maintainable**
    - Fewer files to manage
    - Clear dependencies
    - Easy to test and modify

The key insight: SRP doesn't mean "one method per class." It means "one reason to change." All user validation rules change for the same reason (business rule changes), so they belong together.

## Identifying Responsibilities: The Actor Test

How do you determine if a class has multiple responsibilities? Apply the actor test: who requests changes to this code?

### The Actor Test in Practice

Consider a class that handles user authentication:

```python
class AuthenticationService:
    def authenticate(self, username, password):
        # Verify credentials
        user = self.db.find_user(username)
        if not user or not self.verify_password(password, user.password_hash):
            return None
        
        # Generate session token
        token = self.generate_token(user.id)
        self.db.save_session(token, user.id)
        
        # Log authentication
        self.logger.info(f"User {username} authenticated")
        
        # Send notification
        self.email.send(user.email, "New login detected")
        
        return token
```

Apply the actor test:

!!!anote "👥 Identifying Actors"
    **Security Team**
    - Wants to change password verification algorithm
    - Wants to modify token generation
    - Wants to adjust session management
    
    **Operations Team**
    - Wants to change logging format
    - Wants to add metrics
    - Wants to modify log levels
    
    **Product Team**
    - Wants to change notification behavior
    - Wants to add notification preferences
    - Wants to modify email templates

Three different actors have reasons to change this class. This indicates multiple responsibilities that should be separated.

### Refactoring Based on Actors

Split the class based on actors:

```python
# Security team's responsibility
class CredentialVerifier:
    def verify(self, username, password):
        user = self.db.find_user(username)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user

class SessionManager:
    def create_session(self, user_id):
        token = self.generate_token(user_id)
        self.db.save_session(token, user_id)
        return token

# Operations team's responsibility
class AuthenticationLogger:
    def log_success(self, username):
        self.logger.info(f"User {username} authenticated successfully")
    
    def log_failure(self, username):
        self.logger.warning(f"Failed authentication attempt for {username}")

# Product team's responsibility
class LoginNotificationService:
    def notify_login(self, user):
        self.email.send(user.email, "New login detected")

# Orchestration
class AuthenticationService:
    def __init__(self, verifier, session_manager, logger, notifier):
        self.verifier = verifier
        self.session_manager = session_manager
        self.logger = logger
        self.notifier = notifier
    
    def authenticate(self, username, password):
        user = self.verifier.verify(username, password)
        
        if not user:
            self.logger.log_failure(username)
            return None
        
        token = self.session_manager.create_session(user.id)
        self.logger.log_success(username)
        self.notifier.notify_login(user)
        
        return token
```

Now each actor has their own class to modify:

!!!success "✅ Actor-Based Separation"
    **Clear Ownership**
    - Security team modifies CredentialVerifier and SessionManager
    - Operations team modifies AuthenticationLogger
    - Product team modifies LoginNotificationService
    
    **Independent Changes**
    - Changing logging doesn't affect security
    - Changing notifications doesn't affect sessions
    - Each team works independently
    
    **Reduced Conflicts**
    - Different teams modify different files
    - Fewer merge conflicts
    - Clearer code review ownership

The actor test provides a practical way to identify responsibilities: if different people request changes for different reasons, you likely have multiple responsibilities.

## When to Apply SRP: Timing Matters

SRP doesn't mean preemptively splitting every class. Premature abstraction can be as harmful as god classes.

### The Rule of Three

Don't split classes until you have evidence of multiple responsibilities:

!!!tip "🎯 When to Split Classes"
    **Wait for Evidence**
    - Don't split speculatively
    - Wait until you actually need to change the class
    - Observe which parts change together
    
    **The Rule of Three**
    - First time: write the code
    - Second time: note the duplication or mixed concerns
    - Third time: refactor and separate
    
    **Signs It's Time to Split**
    - Different people request changes to different parts
    - Changes to one part risk breaking another
    - Testing requires mocking unrelated dependencies
    - Class has grown beyond comfortable size

Premature splitting creates unnecessary complexity. Wait until you have real evidence that responsibilities should be separated.

### Refactoring Existing Code

When refactoring existing code to follow SRP:

!!!anote "🔧 Refactoring Strategy"
    **Start with Tests**
    - Write tests for existing behavior
    - Ensure tests pass before refactoring
    - Tests protect against breaking changes
    
    **Extract One Responsibility at a Time**
    - Don't try to refactor everything at once
    - Extract one clear responsibility
    - Verify tests still pass
    - Repeat for next responsibility
    
    **Maintain Backward Compatibility**
    - Keep original class as facade if needed
    - Gradually migrate callers
    - Remove facade once migration complete

Incremental refactoring reduces risk and allows you to validate each step.

## Conclusion

The Single Responsibility Principle forms the foundation of SOLID design by ensuring classes have focused, well-defined purposes. By limiting each class to a single reason to change, SRP reduces coupling, improves testability, and makes code easier to understand and maintain. However, applying SRP requires judgment—it's not about minimizing method count or creating classes for every trivial operation.

The key to applying SRP effectively is understanding what constitutes a "responsibility." A responsibility is not a method or function—it's a reason to change, typically driven by different actors or stakeholders. The actor test provides a practical way to identify multiple responsibilities: if different people request changes for different reasons, you likely need to split the class.

God classes represent the most obvious SRP violations, handling multiple unrelated responsibilities like database operations, business logic, validation, and email sending. These classes become maintenance nightmares as every change risks breaking unrelated functionality. Refactoring god classes into focused classes—each handling a single responsibility—dramatically improves maintainability and testability.

Subtle violations are more insidious, appearing focused while actually mixing concerns. A report generator that retrieves data, performs calculations, and formats output has three distinct responsibilities that should be separated. This separation allows each concern to evolve independently and enables reuse across different contexts.

However, overzealous application of SRP creates the opposite problem—excessive fragmentation into dozens of tiny classes. Creating separate classes for each validation rule or field extraction goes too far, introducing unnecessary indirection and complexity. The solution is finding appropriate granularity by grouping cohesive operations that change for the same reason.

Timing matters when applying SRP. Premature splitting creates unnecessary complexity. The rule of three suggests waiting for evidence before refactoring: write the code, note the duplication or mixed concerns, then refactor on the third occurrence. This approach balances the benefits of SRP against the costs of premature abstraction.

The Single Responsibility Principle is both simple and subtle. The statement "a class should have only one reason to change" is easy to understand but requires judgment to apply effectively. By focusing on actors, reasons to change, and cohesion, you can create designs that are both maintainable and pragmatic—avoiding both god classes and excessive fragmentation.
