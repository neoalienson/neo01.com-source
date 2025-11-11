---
title: "Architecture Patterns Quick Reference"
date: 2020-05-13
categories: Architecture
series: architecture_pattern
sticky: 100
tags:
  - Architecture
  - Best Practices
  - Design Patterns
excerpt: "A comprehensive quick reference guide to cloud architecture patterns. Find the right pattern for your challenge with decision trees, comparison tables, and practical selection criteria."
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

Building resilient, scalable distributed systems requires choosing the right architectural patterns for your specific challenges. This guide provides a quick reference to help you select the most appropriate pattern based on your problem domain, with links to detailed explanations of each pattern.

## Pattern Selection Quick Reference

Use this table to quickly identify which pattern addresses your specific challenge:

| Your Challenge | Recommended Pattern | When to Use |
|----------------|---------------------|-------------|
| Service calls timing out | [Asynchronous Request-Reply](/2020/04/Asynchronous-Request-Reply-Pattern/) | Operations take longer than HTTP timeout limits |
| Service keeps failing | [Circuit Breaker](/2020/01/Circuit-Breaker-Pattern/) | Prevent cascading failures from unavailable services |
| Temporary network glitches | [Retry](/2019/03/Retry-Pattern/) | Handle transient failures that resolve quickly |
| One service affecting others | [Bulkhead](/2020/03/Bulkhead-Pattern/) | Isolate resources to contain failures |
| API throttling errors | [Rate Limiting](/2019/01/Rate-Limiting-Pattern/) | Control request rate to throttled services |
| Legacy system integration | [Anti-Corruption Layer](/2019/02/Anti-Corruption-Layer-Pattern/) | Protect clean architecture from legacy systems |
| Slow query performance | [Materialized View](/2019/05/Materialized-View-Pattern/) | Pre-compute complex queries for faster reads |
| Large message payloads | [Claim Check](/2019/04/Claim-Check-Pattern/) | Reduce message size by storing data externally |
| Migrating legacy systems | [Strangler Fig](/2019/06/Strangler-Fig-Pattern/) | Gradually replace legacy with modern systems |
| Cross-cutting concerns | [Sidecar](/2019/07/Sidecar-Pattern/) | Add functionality without modifying applications |
| Database scalability | [Sharding](/2019/08/Sharding-Pattern/) | Distribute data across multiple databases |
| Multiple API calls | [Gateway Aggregation](/2019/09/Gateway-Aggregation-Pattern/) | Combine multiple backend calls into one |
| Event distribution | [Publisher-Subscriber](/2019/10/Publisher-Subscriber-Pattern/) | Decouple event producers from consumers |
| Service health monitoring | [Health Endpoint Monitoring](/2019/11/Health-Endpoint-Monitoring-Pattern/) | Proactively detect service failures |
| Authentication across services | [Federated Identity](/2019/12/Federated-Identity-Pattern/) | Centralize authentication and authorization |

## Pattern Categories

Architecture patterns can be grouped by the problems they solve:

### 🛡️ Resilience Patterns

Patterns that help systems handle failures gracefully:

**[Circuit Breaker](/2020/01/Circuit-Breaker-Pattern/)**: Prevents cascading failures by temporarily blocking calls to failing services. Like an electrical circuit breaker, it "trips" when failures exceed a threshold, allowing the system to fail fast and recover gracefully.

**[Retry](/2019/03/Retry-Pattern/)**: Automatically retries failed operations to handle transient failures. Uses strategies like exponential backoff to avoid overwhelming already-stressed services.

**[Bulkhead](/2020/03/Bulkhead-Pattern/)**: Isolates resources into separate pools to prevent one failing component from consuming all resources. Named after ship compartments that contain flooding.

!!!tip "💡 Combining Resilience Patterns"
    These patterns work best together: Retry handles transient failures, Circuit Breaker prevents overwhelming failing services, and Bulkhead contains the blast radius of failures.

### ⚡ Performance Patterns

Patterns that optimize system performance and responsiveness:

**[Asynchronous Request-Reply](/2020/04/Asynchronous-Request-Reply-Pattern/)**: Decouples long-running operations from immediate responses, preventing timeouts and improving user experience.

**[Materialized View](/2019/05/Materialized-View-Pattern/)**: Pre-computes and stores query results to avoid expensive computations at read time. Ideal for complex aggregations and reports.

**[Claim Check](/2019/04/Claim-Check-Pattern/)**: Reduces message payload size by storing large data externally and passing only a reference. Improves messaging system performance and reduces costs.

**[Sharding](/2019/08/Sharding-Pattern/)**: Distributes data across multiple databases to improve scalability and performance. Each shard handles a subset of the total data.

### 🔄 Integration Patterns

Patterns that facilitate communication between systems:

**[Anti-Corruption Layer](/2019/02/Anti-Corruption-Layer-Pattern/)**: Provides a translation layer between systems with different semantics, protecting your clean architecture from legacy system quirks.

**[Gateway Aggregation](/2019/09/Gateway-Aggregation-Pattern/)**: Combines multiple backend service calls into a single request, reducing client complexity and network overhead.

**[Publisher-Subscriber](/2019/10/Publisher-Subscriber-Pattern/)**: Enables asynchronous event-driven communication where publishers don't need to know about subscribers.

**[Federated Identity](/2019/12/Federated-Identity-Pattern/)**: Delegates authentication to external identity providers, enabling single sign-on across multiple systems.

### 🎯 Operational Patterns

Patterns that improve system operations and management:

**[Rate Limiting](/2019/01/Rate-Limiting-Pattern/)**: Controls the rate of requests sent to services to avoid throttling errors and optimize throughput.

**[Health Endpoint Monitoring](/2019/11/Health-Endpoint-Monitoring-Pattern/)**: Exposes health check endpoints for proactive monitoring and automated recovery.

**[Sidecar](/2019/07/Sidecar-Pattern/)**: Deploys helper components alongside applications to handle cross-cutting concerns like logging, monitoring, and configuration.

### 🏗️ Migration Patterns

Patterns that support system modernization:

**[Strangler Fig](/2019/06/Strangler-Fig-Pattern/)**: Gradually replaces legacy systems by incrementally migrating functionality to new implementations. Named after a fig tree that grows around and eventually replaces its host.

## Decision Flowchart: Choosing the Right Pattern

Use this flowchart to navigate to the most appropriate pattern for your situation:

{% mermaid %}
graph TD
    Start[What's your challenge?] --> Q1{Service<br/>availability?}
    
    Q1 -->|Failing repeatedly| CB[Circuit Breaker]
    Q1 -->|Temporary failures| Retry[Retry Pattern]
    Q1 -->|One affects others| Bulkhead[Bulkhead]
    
    Q1 -->|Performance| Q2{What type?}
    Q2 -->|Long operations| Async[Asynchronous Request-Reply]
    Q2 -->|Slow queries| MV[Materialized View]
    Q2 -->|Large messages| CC[Claim Check]
    Q2 -->|Database scale| Shard[Sharding]
    
    Q1 -->|Integration| Q3{What need?}
    Q3 -->|Legacy system| ACL[Anti-Corruption Layer]
    Q3 -->|Multiple calls| GA[Gateway Aggregation]
    Q3 -->|Event distribution| PubSub[Publisher-Subscriber]
    Q3 -->|Authentication| FI[Federated Identity]
    
    Q1 -->|Operations| Q4{What aspect?}
    Q4 -->|Throttling| RL[Rate Limiting]
    Q4 -->|Monitoring| HEM[Health Endpoint]
    Q4 -->|Cross-cutting| Sidecar[Sidecar]
    
    Q1 -->|Migration| SF[Strangler Fig]
    
    style CB fill:#ff6b6b
    style Retry fill:#ff6b6b
    style Bulkhead fill:#ff6b6b
    style Async fill:#51cf66
    style MV fill:#51cf66
    style CC fill:#51cf66
    style Shard fill:#51cf66
    style ACL fill:#4dabf7
    style GA fill:#4dabf7
    style PubSub fill:#4dabf7
    style FI fill:#4dabf7
    style RL fill:#ffd43b
    style HEM fill:#ffd43b
    style Sidecar fill:#ffd43b
    style SF fill:#a78bfa
{% endmermaid %}

## Pattern Comparison Matrix

Compare patterns across key dimensions:

{% echarts %}
{
  "title": {
    "text": "Pattern Complexity vs Impact"
  },
  "tooltip": {
    "trigger": "item",
    "formatter": "{b}<br/>Complexity: {c0}<br/>Impact: {c1}"
  },
  "xAxis": {
    "type": "value",
    "name": "Implementation Complexity",
    "min": 0,
    "max": 10
  },
  "yAxis": {
    "type": "value",
    "name": "System Impact",
    "min": 0,
    "max": 10
  },
  "series": [{
    "type": "scatter",
    "symbolSize": 20,
    "data": [
      {"name": "Retry", "value": [2, 7]},
      {"name": "Circuit Breaker", "value": [4, 8]},
      {"name": "Bulkhead", "value": [5, 8]},
      {"name": "Rate Limiting", "value": [6, 7]},
      {"name": "Anti-Corruption Layer", "value": [7, 9]},
      {"name": "Async Request-Reply", "value": [6, 8]},
      {"name": "Materialized View", "value": [5, 7]},
      {"name": "Claim Check", "value": [3, 6]},
      {"name": "Strangler Fig", "value": [8, 9]},
      {"name": "Sidecar", "value": [4, 6]},
      {"name": "Sharding", "value": [9, 9]},
      {"name": "Gateway Aggregation", "value": [5, 7]},
      {"name": "Pub-Sub", "value": [6, 8]},
      {"name": "Health Endpoint", "value": [2, 6]},
      {"name": "Federated Identity", "value": [7, 8]}
    ],
    "label": {
      "show": true,
      "position": "top",
      "formatter": "{b}"
    }
  }]
}
{% endecharts %}

## Pattern Combinations

Many real-world systems combine multiple patterns for comprehensive solutions:

### Resilient Microservices Stack

```
Circuit Breaker + Retry + Bulkhead + Health Endpoint
```

- **Circuit Breaker**: Prevents cascading failures
- **Retry**: Handles transient failures
- **Bulkhead**: Isolates resources
- **Health Endpoint**: Enables monitoring

### High-Performance API Gateway

```
Gateway Aggregation + Rate Limiting + Async Request-Reply
```

- **Gateway Aggregation**: Reduces client calls
- **Rate Limiting**: Prevents overwhelming backends
- **Async Request-Reply**: Handles long operations

### Legacy System Modernization

```
Strangler Fig + Anti-Corruption Layer + Federated Identity
```

- **Strangler Fig**: Gradual migration strategy
- **Anti-Corruption Layer**: Protects new code from legacy
- **Federated Identity**: Unified authentication

## Pattern Selection Criteria

Consider these factors when choosing patterns:

### System Requirements

!!!anote "📋 Functional Requirements"
    - **Availability**: How much downtime is acceptable?
    - **Performance**: What are your latency requirements?
    - **Scalability**: How much growth do you expect?
    - **Consistency**: What consistency guarantees do you need?

### Technical Constraints

!!!anote "🔧 Technical Factors"
    - **Existing infrastructure**: What systems are already in place?
    - **Team expertise**: What patterns does your team know?
    - **Technology stack**: What frameworks and libraries are available?
    - **Budget**: What resources can you allocate?

### Operational Considerations

!!!anote "⚙️ Operations"
    - **Monitoring**: Can you observe the pattern's behavior?
    - **Maintenance**: How complex is ongoing maintenance?
    - **Testing**: Can you effectively test the implementation?
    - **Documentation**: Is the pattern well-documented?

## Common Anti-Patterns

Avoid these common mistakes when applying patterns:

!!!warning "⚠️ Pattern Misuse"
    **Over-engineering**: Don't apply complex patterns to simple problems. Start simple and add patterns as needed.
    
    **Pattern stacking**: Avoid combining too many patterns without clear justification. Each pattern adds complexity.
    
    **Ignoring trade-offs**: Every pattern has costs. Consider performance overhead, operational complexity, and maintenance burden.
    
    **Cargo cult implementation**: Don't copy patterns without understanding why they work. Adapt patterns to your specific context.

For a comprehensive guide to code-level anti-patterns like God Objects, Cargo Cult Programming, and Copy-Paste Programming, see [Software Development Anti-Patterns](/2022/04/Software-Development-Anti-Patterns/).

## Getting Started

Follow this approach when implementing patterns:

### 1. Identify the Problem

Clearly define the challenge you're trying to solve:
- What symptoms are you experiencing?
- What are the root causes?
- What are your success criteria?

### 2. Research Patterns

Use this guide to identify candidate patterns:
- Review the quick reference table
- Follow the decision flowchart
- Read detailed pattern articles

### 3. Evaluate Options

Compare patterns against your requirements:
- Implementation complexity
- Operational overhead
- Team expertise
- Budget constraints

### 4. Start Small

Begin with a pilot implementation:
- Choose a non-critical component
- Implement the pattern
- Monitor and measure results
- Iterate based on learnings

### 5. Scale Gradually

Expand successful implementations:
- Document lessons learned
- Train team members
- Apply to additional components
- Refine based on experience

## Pattern Maturity Model

Assess your organization's pattern adoption maturity:

{% mermaid %}
graph LR
    L1[Level 1:<br/>Ad-hoc] --> L2[Level 2:<br/>Aware]
    L2 --> L3[Level 3:<br/>Defined]
    L3 --> L4[Level 4:<br/>Managed]
    L4 --> L5[Level 5:<br/>Optimizing]
    
    style L1 fill:#ff6b6b
    style L2 fill:#ffd43b
    style L3 fill:#4dabf7
    style L4 fill:#51cf66
    style L5 fill:#a78bfa
{% endmermaid %}

**Level 1 - Ad-hoc**: No consistent pattern usage, reactive problem-solving

**Level 2 - Aware**: Team knows patterns exist, occasional usage

**Level 3 - Defined**: Documented pattern guidelines, consistent application

**Level 4 - Managed**: Metrics-driven pattern selection, regular reviews

**Level 5 - Optimizing**: Continuous improvement, pattern innovation

## Complete Pattern Index

Here's the complete list of patterns covered in this series:

1. **[Rate Limiting Pattern](/2019/01/Rate-Limiting-Pattern/)** (January) - Control request rates to throttled services
2. **[Anti-Corruption Layer Pattern](/2019/02/Anti-Corruption-Layer-Pattern/)** (February) - Protect architecture from legacy systems
3. **[Retry Pattern](/2019/03/Retry-Pattern/)** (March) - Handle transient failures gracefully
4. **[Claim Check Pattern](/2019/04/Claim-Check-Pattern/)** (April) - Reduce message payload sizes
5. **[Materialized View Pattern](/2019/05/Materialized-View-Pattern/)** (May) - Pre-compute complex queries
6. **[Strangler Fig Pattern](/2019/06/Strangler-Fig-Pattern/)** (June) - Gradually migrate legacy systems
7. **[Sidecar Pattern](/2019/07/Sidecar-Pattern/)** (July) - Add functionality via helper components
8. **[Sharding Pattern](/2019/08/Sharding-Pattern/)** (August) - Distribute data for scalability
9. **[Gateway Aggregation Pattern](/2019/09/Gateway-Aggregation-Pattern/)** (September) - Combine multiple API calls
10. **[Publisher-Subscriber Pattern](/2019/10/Publisher-Subscriber-Pattern/)** (October) - Event-driven communication
11. **[Health Endpoint Monitoring Pattern](/2019/11/Health-Endpoint-Monitoring-Pattern/)** (November) - Proactive health checks
12. **[Federated Identity Pattern](/2019/12/Federated-Identity-Pattern/)** (December) - Centralized authentication
13. **[Circuit Breaker Pattern](/2020/01/Circuit-Breaker-Pattern/)** (January) - Prevent cascading failures
14. **[Bulkhead Pattern](/2020/03/Bulkhead-Pattern/)** (March) - Isolate resources to contain failures
15. **[Asynchronous Request-Reply Pattern](/2020/04/Asynchronous-Request-Reply-Pattern/)** (April) - Handle long-running operations

## Additional Resources

### Books

- **"Cloud Design Patterns"** by Microsoft - Comprehensive pattern catalog
- **"Release It!"** by Michael Nygard - Production-ready software patterns
- **"Building Microservices"** by Sam Newman - Microservices architecture patterns
- **"Domain-Driven Design"** by Eric Evans - Strategic design patterns

### Online Resources

- [Microsoft Azure Architecture Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/)
- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [Martin Fowler's Architecture Patterns](https://martinfowler.com/architecture/)

### Practice

!!!tip "💡 Learning by Doing"
    The best way to learn patterns is through hands-on practice:
    - Build sample applications implementing each pattern
    - Contribute to open-source projects using these patterns
    - Conduct architecture reviews with your team
    - Share knowledge through blog posts and presentations

## Conclusion

Architecture patterns are powerful tools for solving common distributed systems challenges. This quick reference guide helps you:

- **Quickly identify** the right pattern for your problem
- **Compare patterns** across multiple dimensions
- **Understand relationships** between patterns
- **Avoid common pitfalls** in pattern application
- **Plan your learning** journey through the pattern catalog

Remember: patterns are guidelines, not rigid rules. Adapt them to your specific context, measure their impact, and iterate based on results. Start with simple patterns like Retry and Health Endpoint Monitoring, then gradually adopt more complex patterns as your system evolves.
