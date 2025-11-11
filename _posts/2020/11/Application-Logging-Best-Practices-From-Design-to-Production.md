---
title: Application Logging Best Practices - From Design to Production
date: 2020-11-03
categories:
  - Development
tags:
  - Logging
  - Best Practices
  - DevOps
excerpt: "Logs are your application's black box recorder. Learn how to design logging strategies that turn debugging nightmares into five-minute fixes—before you write a single line of code."
thumbnail: /assets/log/thumbnail.png
---

Most teams treat logging as an afterthought. They sprinkle `console.log()` and `print()` statements throughout their code, hoping they'll capture enough information when things break. Then production fails at 3 AM, and they realize their logs are useless—inconsistent formats, missing context, no structure.

Effective logging doesn't start when you deploy. It starts during application design. The decisions you make before writing code determine whether logs will save you hours of debugging or waste your time with noise.

This isn't about logging frameworks or tools—it's about strategy. It's about designing logs that answer questions, not create more confusion.

## Why Logging Strategy Matters

**The 3 AM test**: When your application breaks at 3 AM, can you diagnose the problem from logs alone? Or do you need to add more logging, redeploy, and wait for the issue to happen again?

**The cost of bad logging**:
- **Extended outages**: Spending hours debugging because logs don't show what failed
- **Repeated incidents**: Same issue happens again because logs didn't capture root cause
- **Alert fatigue**: Too much noise, can't find the signal
- **Storage costs**: Logging everything costs thousands per month with no value

**The value of good logging**:
- **Fast debugging**: Find root cause in minutes, not hours
- **Proactive detection**: Catch issues before users complain
- **Audit trails**: Know who did what and when
- **Business insights**: Track transactions, user behavior, system health

!!!warning "⚠️ You Can't Add Logging After the Fact"
    When production is down, you can't add logging and redeploy. You work with what you have. Design logging right from the start.

## Design-Time Logging Strategy

Effective logging requires standards, structure, and planning before you write code.

### Define Logging Standards Early

**Log level standards**: Document when to use each level across your organization. Without standards, one developer's ERROR is another's WARNING.

```
DEBUG: Variable values, function entry/exit (development only)
INFO: User actions, business events ("User 123 logged in")
WARNING: Recoverable issues ("API slow, retrying", "Cache miss")
ERROR: Operation failed but app continues ("Payment failed", "Email not sent")
CRITICAL: Service degraded or down ("Database unreachable", "Out of memory")
```

**When to use each level**:

**DEBUG**: Detailed diagnostic information. Disabled in production. Use for troubleshooting during development.

**INFO**: Normal application behavior. User logged in, order created, batch job started. Helps understand application flow.

**WARNING**: Something unexpected but handled. API timeout with retry, cache miss with fallback, deprecated feature used. Investigate but not urgent.

**ERROR**: Operation failed but application continues. Payment declined, email failed to send, file not found. Requires attention.

**CRITICAL**: Application cannot continue. Database unreachable, out of memory, configuration missing. Immediate action required.

### Error Categorization

Define error categories that align with your monitoring and alerting needs.

```
# Infrastructure errors
ERROR [INFRA.DATABASE]: Connection pool exhausted
ERROR [INFRA.NETWORK]: Timeout connecting to payment-service
ERROR [INFRA.STORAGE]: Disk write failed

# Application errors  
ERROR [APP.VALIDATION]: Invalid email format
ERROR [APP.BUSINESS]: Insufficient inventory for order
ERROR [APP.INTEGRATION]: Third-party API returned 500

# Security events
WARNING [SECURITY.AUTH]: Failed login attempt
CRITICAL [SECURITY.ACCESS]: Unauthorized admin access attempt
ALERT [SECURITY.INJECTION]: SQL injection detected
```

**Why categorize**:
- **Route alerts**: `[SECURITY.*]` goes to security team, `[INFRA.DATABASE]` goes to database team
- **Filter logs**: Search all infrastructure errors across services
- **Aggregate metrics**: Count errors by category, track trends
- **Prioritize fixes**: Focus on categories with highest error rates

### Structured Logging Schema

Define required fields for all logs. Consistency enables automated processing.

```json
{
  "timestamp": "2020-11-01T10:30:00Z",
  "level": "ERROR",
  "category": "INFRA.DATABASE",
  "message": "Connection pool exhausted",
  "service": "payment-service",
  "request_id": "req-abc-123",
  "user_id": "user-456",
  "error_code": "DB_POOL_EXHAUSTED",
  "context": {
    "pool_size": 100,
    "active_connections": 100,
    "wait_time_ms": 5000
  }
}
```

**Required fields**:
- **timestamp**: ISO8601 format for consistent parsing
- **level**: ERROR, WARNING, INFO, DEBUG, CRITICAL
- **category**: Error category for routing and filtering
- **message**: Human-readable description
- **service**: Which service generated this log (critical for microservices)
- **request_id**: Trace ID for following requests across services
- **user_id**: Understand user impact (if applicable)
- **error_code**: Application-specific code for programmatic handling

**Optional context**: Additional fields specific to the event type. Database errors include connection pool stats. Payment errors include amount and gateway.

### Security Event Standards

Define what constitutes a security event and how to log it.

```
# Authentication events
WARNING [SECURITY.AUTH]: Failed login | user={username} ip={ip} attempts={count}
INFO [SECURITY.AUTH]: Successful login | user={username} ip={ip}
ALERT [SECURITY.AUTH]: Account locked | user={username} reason={too_many_attempts}

# Authorization events
WARNING [SECURITY.AUTHZ]: Unauthorized access attempt | user={username} resource={path}
CRITICAL [SECURITY.AUTHZ]: Privilege escalation attempt | user={username} action={attempted_action}

# Data access events
INFO [SECURITY.DATA]: Sensitive data accessed | user={username} resource={customer_records}
ALERT [SECURITY.DATA]: Bulk data export | user={username} records={count}
```

**Why security logging matters**:
- **Compliance**: PCI-DSS, HIPAA, SOC2 require security event logging
- **Incident response**: Understand attack patterns, identify compromised accounts
- **Forensics**: Reconstruct what happened during security incidents
- **Deterrence**: Knowing actions are logged discourages malicious behavior

### Business Event Standards

Define critical business events that need logging and monitoring.

```
# Transaction events
INFO [BUSINESS.PAYMENT]: Payment successful | amount={amount} user={user_id}
ERROR [BUSINESS.PAYMENT]: Payment failed | amount={amount} reason={reason}
ALERT [BUSINESS.PAYMENT]: High-value payment | amount={amount} threshold={10000}

# Inventory events
WARNING [BUSINESS.INVENTORY]: Low stock | product={sku} quantity={count}
ERROR [BUSINESS.INVENTORY]: Out of stock | product={sku}
ALERT [BUSINESS.INVENTORY]: Inventory mismatch | expected={100} actual={95}

# Order events
INFO [BUSINESS.ORDER]: Order created | order_id={id} total={amount}
ERROR [BUSINESS.ORDER]: Order failed | order_id={id} reason={reason}
ALERT [BUSINESS.ORDER]: Refund processed | order_id={id} amount={amount}
```

**Why log business events**:
- **Revenue tracking**: Monitor transaction success rates, identify revenue loss
- **Customer support**: Investigate customer complaints with complete transaction history
- **Business intelligence**: Analyze patterns, optimize processes
- **Fraud detection**: Identify suspicious patterns in transactions

!!!tip "📝 Logging Standards Document"
    Create a "Logging Standards" document during design phase. Include: log levels, categories, required fields, security event definitions, business event definitions, and examples. Make it part of code review checklist.

### Design Monitoring-Friendly Error Handling

Structure error handling to produce useful logs.

```python
# Bad: Generic error, hard to monitor
try:
    process_payment()
except Exception as e:
    log.error(f"Error: {e}")

# Good: Categorized, structured, monitorable
try:
    process_payment()
except PaymentGatewayTimeout as e:
    log.error(
        "Payment gateway timeout",
        extra={
            "category": "INFRA.INTEGRATION",
            "gateway": "stripe",
            "amount": payment.amount,
            "retry_count": payment.retries,
            "error_code": "PAYMENT_TIMEOUT"
        }
    )
except InsufficientFunds as e:
    log.warning(
        "Payment declined: insufficient funds",
        extra={
            "category": "BUSINESS.PAYMENT",
            "amount": payment.amount,
            "error_code": "INSUFFICIENT_FUNDS"
        }
    )
```

**Why this matters**:
- **Specific alerts**: Alert on `category=INFRA.INTEGRATION AND error_code=PAYMENT_TIMEOUT`
- **Context**: Know which gateway, how much, how many retries
- **Categorization**: Route infrastructure errors to ops, business errors to product team
- **Actionable**: Clear error codes enable automated responses

### Include Monitoring Requirements in User Stories

Make logging a first-class requirement, not an afterthought.

```
User Story: Process payment
Acceptance Criteria:
- Payment is processed via Stripe API
- User receives confirmation email
- Monitoring: Log ERROR [BUSINESS.PAYMENT] on failure with amount and reason
- Monitoring: Alert if payment failures > 5% in 5 minutes
- Monitoring: Alert if any payment > $10,000 fails
```

**Benefits**:
- **Logging is tested**: QA verifies logs are generated correctly
- **Complete from day one**: No need to add logging later
- **Consistent**: All features follow same logging standards
- **Monitored**: Alerts are configured before deployment

!!!warning "⚠️ Retrofitting Logging is Expensive"
    Adding proper logging after deployment means: analyzing existing code, updating hundreds of log statements, redeploying all services, updating monitoring rules. Design it right from the start.

## What to Log

Not everything deserves a log entry. Focus on events that help debugging, security, and business analysis.

### Error Patterns

```
ERROR: Database connection failed
ERROR: OutOfMemoryError
ERROR: NullPointerException in PaymentService
FATAL: Application startup failed
```

**Alert when**: Error count exceeds threshold (>10 errors/minute) or specific critical errors appear once.

### Security Events

```
WARNING: Failed login attempt for user admin (5 attempts in 1 minute)
ALERT: Unauthorized API access from IP 192.168.1.100
CRITICAL: SQL injection attempt detected
```

**Alert when**: Any security event occurs. Zero tolerance for security issues.

### Business Anomalies

```
ERROR: Payment declined: insufficient funds
WARNING: Order total mismatch: expected $100, got $1
ALERT: Refund amount exceeds $10,000
```

**Alert when**: High-value transactions fail or anomalous patterns detected.

### Integration Failures

```
ERROR: Third-party API timeout: payment-gateway
WARNING: Email service unavailable, queuing messages
ERROR: S3 upload failed: access denied
```

**Alert when**: Critical integrations fail repeatedly.

## Log Monitoring Patterns

Log monitoring patterns are reusable alert strategies that define how to detect problems from log data. Instead of manually watching logs, these patterns automatically trigger alerts when specific conditions occur.

Each pattern answers three questions:
1. **What to look for**: Which log messages or conditions indicate a problem
2. **When to alert**: The threshold or condition that triggers the alert
3. **What action to take**: Who gets notified and how urgently

### Pattern 1: Error Rate Threshold

```
ALERT: count("ERROR") > 50 in last 5 minutes
Action: Page on-call engineer
Context: Error rate spike indicates systemic issue
```

**Use case**: Detect sudden increase in errors across the application.

### Pattern 2: Specific Error Detection

```
ALERT: any("OutOfMemoryError") in last 1 minute
Action: Immediate page + auto-restart service
Context: OOM means imminent crash
```

**Use case**: Critical errors that require immediate action.

### Pattern 3: Error Rate Change

```
ALERT: count("ERROR", 5m) > 2x count("ERROR", 1h average)
Action: Slack notification to team
Context: Error rate doubled compared to baseline
```

**Use case**: Detect abnormal error patterns compared to historical baseline.

### Pattern 4: Absence of Expected Logs

```
ALERT: count("Batch job completed") == 0 in last 24 hours
Action: Email to ops team
Context: Daily batch job didn't run
```

**Use case**: Detect silent failures where expected events don't occur.

### Pattern 5: Correlated Log Patterns

```
ALERT: count("Database timeout") > 10 AND count("Connection pool exhausted") > 5
Action: Page database team
Context: Database connection issue affecting multiple services
```

**Use case**: Detect cascading failures by correlating related errors.

## Structured vs Unstructured Logging

Structured logs make monitoring, searching, and analysis dramatically easier.

### Unstructured (Hard to Monitor)

```
ERROR: Payment failed for user john@neo01.com amount 99.99 reason card_declined
```

**Why unstructured is hard**:

**Requires regex parsing**: To extract the amount, you need regex like `amount (\d+\.\d+)`. Different log formats need different regex patterns. One typo breaks everything.

**Inconsistent formats**: Developer A writes "amount 99.99", Developer B writes "$99.99", Developer C writes "amount: 99.99 USD". Your monitoring breaks.

**Can't query efficiently**: Want all payments over $1000? You must scan every log line, parse text, convert to numbers, then filter. Slow and expensive.

**Difficult to aggregate**: Calculating average payment amount requires parsing millions of text strings. Structured fields let databases do this efficiently.

**Fragile alerts**: Alert on `amount > 1000` requires parsing "amount 99.99" from text. If format changes to "total 99.99", alerts stop working silently.

### Structured (Easy to Monitor)

```json
{
  "level": "ERROR",
  "message": "Payment failed",
  "user_email": "john@neo01.com",
  "amount": 99.99,
  "reason": "card_declined",
  "timestamp": "2020-11-01T10:30:00Z"
}
```

**Why structured is better**:

**Direct field access**: Query `amount > 1000` directly. No parsing, no regex, no breaking.

**Type safety**: `amount` is a number, not text. Database knows how to compare, aggregate, and calculate.

**Consistent format**: Every log has the same fields. Monitoring rules work reliably across all services.

**Fast queries**: Database indexes on `amount` field. Queries run in milliseconds, not minutes.

**Easy aggregation**: `AVG(amount)`, `SUM(amount)`, `MAX(amount)` work instantly. No text parsing needed.

Now you can alert on: `level=ERROR AND reason=card_declined AND amount > 1000`

And it works reliably, forever, regardless of who writes the log or when.

## Log Monitoring Tools

Choose tools that fit your scale and budget.

### CloudWatch Logs Insights

AWS-native, integrates seamlessly with AWS services. Query logs with SQL-like syntax.

```sql
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
```

**Pros**: Easy AWS integration, no infrastructure to manage
**Cons**: Limited search capabilities, expensive at scale
**Best for**: AWS-heavy environments, small to medium scale

### ELK Stack (Elasticsearch, Logstash, Kibana)

Powerful search and visualization. Industry standard for log aggregation.

**Pros**: Powerful search, rich visualization, large ecosystem
**Cons**: Resource-intensive, complex to operate, expensive at scale
**Best for**: Large organizations, complex search requirements

### Splunk

Enterprise-grade log management and analytics.

**Pros**: Powerful analytics, excellent support, comprehensive features
**Cons**: Very expensive, complex licensing
**Best for**: Enterprises with budget, compliance requirements

### Loki + Grafana

Lightweight alternative to ELK. Designed for Kubernetes environments.

**Pros**: Lightweight, integrates with Prometheus and Grafana, cost-effective
**Cons**: Less powerful search than Elasticsearch
**Best for**: Kubernetes environments, cost-conscious teams

!!!tip "💡 Log Sampling for High Volume"
    If you're logging millions of events per minute, sample non-critical logs (keep 1%, discard 99%). Always keep ERROR and CRITICAL logs. This reduces costs while maintaining visibility into problems.

## Logging Best Practices

### Use Log Levels Correctly

- **DEBUG**: Detailed information for debugging (disabled in production)
- **INFO**: General informational messages ("User logged in")
- **WARNING**: Something unexpected but handled ("API slow, retrying")
- **ERROR**: Something failed but application continues ("Payment failed")
- **CRITICAL/FATAL**: Application cannot continue ("Database unreachable")

### Include Context

Every log should answer: who, what, when, where, why.

- **Request ID**: Trace requests across services
- **User ID**: Understand user impact
- **Service name**: Identify source in microservices
- **Timestamp**: Correlate events
- **Error details**: Stack traces, error codes, relevant variables

### Avoid Log Spam

- **Don't log in tight loops**: Logging inside a loop processing millions of items creates noise
- **Rate-limit repetitive errors**: Log "Database timeout occurred 50 times" not 50 separate logs
- **Aggregate similar errors**: Group related errors, don't repeat the same message
- **Use appropriate log levels**: Don't log INFO messages at DEBUG level

### Secure Sensitive Data

- **Never log passwords, tokens, credit cards**: Obvious but often violated
- **Mask PII**: Redact email addresses, phone numbers, SSNs
- **Redact sensitive fields**: In structured logs, mask sensitive values
- **Comply with regulations**: GDPR, HIPAA, PCI-DSS have strict logging requirements

```python
# Bad: Logging sensitive data
log.info(f"User login: {username} password: {password}")

# Good: Masking sensitive data
log.info(f"User login: {username} password: ****")

# Better: Don't log passwords at all
log.info(f"User login: {username}")
```

!!!warning "⚠️ Log Volume vs Cost"
    Logging everything is expensive. A medium-sized application can generate terabytes of logs monthly. CloudWatch Logs costs $0.50/GB ingested + $0.03/GB stored. Balance visibility with budget.

## Application Log Retention Strategy

How long should you keep application logs? Balance debugging needs, post-mortem analysis, and storage costs.

### Retention Tiers for Application Logs

**Hot storage (7-30 days)**: Immediately searchable, expensive, for active debugging.

- **What**: All application logs at full detail (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **Why**: Most bugs are detected and debugged within days of deployment
- **Cost**: High ($0.50/GB ingested + $0.03/GB stored in CloudWatch)
- **Use case**: Active debugging, recent deployment issues, performance troubleshooting

**Warm storage (30-90 days)**: Slower access, cheaper, for post-mortem analysis.

- **What**: ERROR and CRITICAL logs at full detail, sampled INFO/WARNING (10%)
- **Why**: Post-mortem investigations often happen weeks after incidents
- **Cost**: Medium (S3 Standard: $0.023/GB/month)
- **Use case**: Post-mortem analysis, pattern identification, comparing behavior over time

**Cold storage (90 days - 1 year)**: Archive only, cheapest, for rare investigations.

- **What**: ERROR and CRITICAL logs only, compressed
- **Why**: Rare cases need historical context for recurring issues
- **Cost**: Low (S3 Glacier: $0.004/GB/month)
- **Use case**: Long-term pattern analysis, rare bug investigations

{% mermaid %}graph LR
    A["Application Logs"] --> B["Hot Storage<br/>7-30 days<br/>$0.50/GB"]
    B --> C["Warm Storage<br/>30-90 days<br/>$0.023/GB"]
    C --> D["Cold Storage<br/>90 days - 1 year<br/>$0.004/GB"]
    D --> E["Delete"]
    
    style A fill:#4dabf7,stroke:#1971c2,color:#fff
    style B fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style C fill:#ffd43b,stroke:#f59f00,color:#000
    style D fill:#51cf66,stroke:#2f9e44,color:#fff
    style E fill:#868e96,stroke:#495057,color:#fff
{% endmermaid %}

### Retention by Application Log Level

**DEBUG logs**:
- **Retention**: 7 days hot, then delete
- **Why**: Extremely verbose, rarely needed after initial debugging
- **Volume**: 40-50% of total log volume
- **Cost impact**: Deleting DEBUG logs saves 40-50% of storage costs

**INFO logs**:
- **Retention**: 30 days hot, then delete (or sample 10% for warm storage)
- **Why**: Useful for understanding application flow during debugging
- **Volume**: 30-40% of total log volume
- **Sampling**: Keep 10% randomly for trend analysis if needed

**WARNING logs**:
- **Retention**: 30 days hot, 60 days warm
- **Why**: Warnings often precede errors; useful for post-mortem analysis
- **Volume**: 5-10% of total log volume
- **Pattern analysis**: Review warnings to prevent future errors

**ERROR logs**:
- **Retention**: 90 days hot, 1 year warm
- **Why**: Critical for debugging, post-mortems, and identifying recurring issues
- **Volume**: 5-10% of total log volume
- **Always keep**: Never sample or delete ERROR logs prematurely

**CRITICAL logs**:
- **Retention**: 90 days hot, 1 year warm, 7 years cold (if compliance required)
- **Why**: Service-impacting events need long-term retention for pattern analysis
- **Volume**: <1% of total log volume
- **Immutable**: Consider write-once storage for critical incidents

### Cost Optimization

**Sample non-critical logs**: Keep 100% of ERROR logs, 10% of INFO logs, 1% of DEBUG logs.

```
# Before sampling: 1TB/day = $15,000/month
# After sampling: 100GB/day = $1,500/month
# Savings: $13,500/month = $162,000/year
```

{% echarts %}
{
  "title": {
    "text": "Log Storage Cost by Level (Before vs After Optimization)",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis",
    "axisPointer": {
      "type": "shadow"
    }
  },
  "legend": {
    "data": ["Before Optimization", "After Optimization"],
    "top": "10%"
  },
  "grid": {
    "left": "3%",
    "right": "4%",
    "bottom": "3%",
    "containLabel": true
  },
  "xAxis": {
    "type": "category",
    "data": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
  },
  "yAxis": {
    "type": "value",
    "name": "Cost ($1000s/month)"
  },
  "series": [
    {
      "name": "Before Optimization",
      "type": "bar",
      "data": [7.5, 6.0, 1.0, 0.75, 0.25],
      "itemStyle": {
        "color": "#ff6b6b"
      }
    },
    {
      "name": "After Optimization",
      "type": "bar",
      "data": [0.5, 0.6, 0.5, 0.75, 0.25],
      "itemStyle": {
        "color": "#51cf66"
      }
    }
  ]
}
{% endecharts %}

**Compress before archiving**: Logs compress 5-10x. 1TB becomes 100-200GB.

**Delete DEBUG logs aggressively**: DEBUG logs are 80% of volume but rarely needed after 7 days.

**Use lifecycle policies**: Automate transitions from hot → warm → cold → delete.

```yaml
# S3 Lifecycle Policy Example
Rules:
  - Id: "LogRetention"
    Status: Enabled
    Transitions:
      - Days: 30
        StorageClass: STANDARD_IA  # Warm storage
      - Days: 90
        StorageClass: GLACIER      # Cold storage
    Expiration:
      Days: 2555  # 7 years
```

### Compliance Requirements

**PCI-DSS**: 1 year minimum for audit logs, 3 months for system logs.

**HIPAA**: 6 years minimum for healthcare data access logs.

**SOC 2**: 1 year minimum, but auditors often request 2-3 years.

**GDPR**: No specific retention requirement, but must delete on request. Don't keep logs longer than necessary.

**Financial services**: 7 years typical for transaction records.

!!!warning "⚠️ Compliance Trumps Cost"
    If regulations require 7 years, you must keep logs for 7 years. Non-compliance fines far exceed storage costs. A single HIPAA violation can cost $50,000+.

### Practical Application Log Retention Policies

**Startup/Small business**:
```
DEBUG: 7 days
INFO: 14 days
WARNING: 30 days
ERROR/CRITICAL: 90 days
Post-mortem: Extend to 90 days as needed
Cost: $200-1,000/month
```

**Mid-sized company**:
```
DEBUG: 7 days hot
INFO: 30 days hot
WARNING: 30 days hot, 60 days warm
ERROR: 90 days hot, 1 year warm
CRITICAL: 90 days hot, 1 year warm
Post-mortem: Automatic 90-day extension
Cost: $2,000-10,000/month
```

**Enterprise**:
```
DEBUG: 7 days hot (sampled 1% in production)
INFO: 30 days hot, 10% sampled for 90 days warm
WARNING: 90 days hot, 1 year warm
ERROR: 90 days hot, 1 year warm
CRITICAL: 1 year hot, 7 years cold
Post-mortem: Automatic extension with approval workflow
Cost: $10,000-50,000/month
```

### When to Keep Application Logs Longer

**Post-mortem investigations**: Extend retention when conducting detailed post-mortem analysis.

```
# Scenario: Major outage on October 15
# Normal retention: 30 days
# Extended retention: Keep all logs from October 1-31 for 90 days
# Why: Post-mortem may take weeks; need complete context
```

**Recurring issues**: Keep logs longer when debugging intermittent problems.

```
# Scenario: Memory leak appears every 2-3 weeks
# Normal retention: 30 days
# Extended retention: Keep ERROR/WARNING logs for 90 days
# Why: Need multiple occurrences to identify pattern
```

**Pattern analysis**: Retain logs longer for performance optimization or capacity planning.

```
# Scenario: Analyzing seasonal traffic patterns
# Normal retention: 30 days
# Extended retention: Keep sampled INFO logs (1%) for 1 year
# Why: Compare behavior across seasons
```

**Deployment correlation**: Keep logs before and after major deployments.

```
# Scenario: Major architecture change deployed
# Normal retention: 30 days
# Extended retention: Keep all logs 7 days before/after for 90 days
# Why: Compare behavior before/after change
```

!!!tip "🔍 Post-Mortem Retention"
    When a major incident occurs, immediately extend log retention for the affected time period. Post-mortems often take 2-4 weeks to complete, and you'll need logs from before, during, and after the incident.

### When to Delete Application Logs Sooner

**GDPR right to erasure**: Delete user data on request, including application logs containing PII.

```python
# Implement log deletion for specific users
def delete_user_logs(user_id):
    # Delete from hot storage
    delete_logs_where(user_id=user_id, storage="hot")
    # Delete from warm storage
    delete_logs_where(user_id=user_id, storage="warm")
    # Mark for deletion in cold storage
    mark_for_deletion(user_id=user_id, storage="cold")
```

**Storage costs exceeding value**: If DEBUG/INFO logs are never searched, reduce retention.

```
# Analysis: DEBUG logs cost $5,000/month, searched 0 times in 90 days
# Action: Reduce DEBUG retention from 30 days to 7 days
# Savings: $3,750/month = $45,000/year
```

**Development/staging environments**: Much shorter retention than production.

```
Production: 30 days hot, 90 days warm
Staging: 7 days hot, then delete
Development: 3 days hot, then delete
```

!!!tip "💡 Start Conservative, Adjust Down"
    Begin with longer retention (90 days), monitor how often you access old logs, then reduce retention if you're never searching beyond 30 days. It's easier to reduce retention than explain why you deleted logs needed for an investigation.

### Application Log Retention Policy Template

Document your application log retention policy:

```markdown
# Application Log Retention Policy

## Standard Retention

### Production Application Logs
- DEBUG: 7 days (hot), then delete
- INFO: 30 days (hot), then delete
- WARNING: 30 days (hot), 60 days (warm)
- ERROR: 90 days (hot), 1 year (warm)
- CRITICAL: 90 days (hot), 1 year (warm)

### Non-Production Application Logs
- Staging: 7 days (hot), then delete
- Development: 3 days (hot), then delete
- Testing: 1 day (hot), then delete

## Extended Retention Triggers

### Post-Mortem Investigations
- Trigger: Major incident (P0/P1)
- Action: Extend retention to 90 days for incident time period ± 7 days
- Duration: Until post-mortem complete + 30 days
- Approval: Engineering manager

### Recurring Issues
- Trigger: Same error occurs 3+ times in 30 days
- Action: Extend ERROR/WARNING retention to 90 days
- Duration: Until root cause identified and fixed
- Approval: Team lead

### Major Deployments
- Trigger: Architecture changes, major releases
- Action: Keep all logs 7 days before/after deployment for 90 days
- Duration: 90 days post-deployment
- Approval: Automatic

## Cost Management

### Monthly Review
- Review storage costs vs. search frequency
- Identify unused log levels or services
- Adjust retention if logs never searched

### Quarterly Optimization
- Analyze DEBUG/INFO log value
- Implement sampling if appropriate
- Update retention based on actual usage

## GDPR Compliance
- User data deletion: Within 30 days of request
- Automated deletion: Implemented via user_id field
- Verification: Monthly audit of deletion requests

## Exceptions
- Post-mortem investigations: Extend as needed
- Recurring bugs: Extend until resolved
- Performance analysis: Sample and extend
- GDPR requests: Delete immediately
```

## Common Logging Mistakes

**Logging too much**: DEBUG logs in production create noise and cost money. Use appropriate log levels.

**Logging too little**: "Error occurred" without context is useless. Include relevant details.

**Inconsistent formats**: Every developer using different log formats makes searching impossible. Use structured logging.

**Logging sensitive data**: Passwords, tokens, credit cards in logs create security risks and compliance violations.

**No log rotation**: Logs filling up disk space crash applications. Implement log rotation and retention policies.

**Ignoring log volume**: Logging millions of events per minute costs thousands per month. Sample non-critical logs.

## Building a Logging Culture

**Make logging a requirement**: Include logging in acceptance criteria, code review checklists, and definition of done.

**Review logs regularly**: Don't wait for incidents. Regularly review logs to identify patterns and improve logging.

**Learn from incidents**: Every incident reveals logging gaps. What information was missing? Add it.

**Share knowledge**: Document logging standards, share examples, train new team members.

**Celebrate good logging**: When good logging saves hours of debugging, recognize it. Make logging a valued skill.

## Making the Choice

Logging isn't optional—it's essential. The question is whether you design it properly from the start or retrofit it after production failures.

Start with standards: log levels, categories, structured formats. Make logging a first-class requirement in user stories. Choose tools that fit your scale and budget. Implement retention policies that balance cost and compliance.

Remember: logs are your application's black box recorder. When things go wrong—and they will—logs are often your only way to understand what happened.

Design logging right from the start. Your future self—debugging at 3 AM—will thank you.
