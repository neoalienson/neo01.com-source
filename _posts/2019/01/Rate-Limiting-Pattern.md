---
title: "Rate Limiting Pattern: Efficiently Managing Throttled Services"
date: 2019-01-28
lang: en
categories:
  - Architecture
series: architecture_pattern
excerpt: "Learn how the rate limiting pattern helps you avoid throttling errors and improve throughput when working with services that impose usage limits."
thumbnail: thumbnail.png
thumbnail_80: thumbnail_80.png
comments: true
---

![](banner.png)

Many services use throttling to control resource consumption, imposing limits on the rate at which applications can access them. The rate limiting pattern helps you avoid throttling errors and accurately predict throughput, especially for large-scale repetitive tasks like batch processing.

## Context and Problem

Performing large numbers of operations against a throttled service can result in increased traffic and reduced efficiency. You'll need to track rejected requests and retry operations, potentially requiring multiple passes to complete your work.

Consider this example of ingesting data into a database:

- Your application needs to ingest 10,000 records. Each record costs 10 Request Units (RUs), requiring 100,000 RUs total.
- Your database instance has 20,000 RUs provisioned capacity.
- You send all 10,000 records. 2,000 succeed, 8,000 are rejected.
- You retry with 8,000 records. 2,000 succeed, 6,000 are rejected.
- You retry with 6,000 records. 2,000 succeed, 4,000 are rejected.
- You retry with 4,000 records. 2,000 succeed, 2,000 are rejected.
- You retry with 2,000 records. All succeed.

The job completed, but only after sending 30,000 records—three times the actual dataset size.

Additional problems with this naive approach:

- **Error handling overhead**: 20,000 errors need logging and processing, consuming memory and storage.
- **Unpredictable completion time**: Without knowing throttling limits, you can't estimate how long processing will take.

## Solution

Rate limiting reduces traffic and improves throughput by controlling the number of records sent to a service over time.

Services throttle based on different metrics:

- **Number of operations** (e.g., 20 requests per second)
- **Amount of data** (e.g., 2 GiB per minute)
- **Relative cost of operations** (e.g., 20,000 RUs per second)

Your rate limiting implementation must control operations sent to the service, optimizing usage without exceeding capacity.

### Using a Durable Messaging System

When your APIs can handle requests faster than throttled services allow, you need to manage ingestion speed. Simply buffering requests is risky—if your application crashes, you lose buffered data.

Instead, send records to a durable messaging system that can handle your full ingestion rate. Use job processors to read records at a controlled rate within the throttled service's limits.

Durable messaging options include:

- Message queues (e.g., RabbitMQ, ActiveMQ)
- Event streaming platforms (e.g., Apache Kafka)
- Cloud-based queue services

{% mermaid %}graph LR
    A["API<br/>(High Rate)"] --> B["Durable<br/>Message Queue"]
    B --> C["Job Processor 1"]
    B --> D["Job Processor 2"]
    B --> E["Job Processor 3"]
    C --> F["Throttled Service<br/>(Limited Rate)"]
    D --> F
    E --> F
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style F fill:#ffe1e1
{% endmermaid %}

### Granular Time Intervals

Services often throttle based on comprehensible timespans (per second or per minute), but computers process much faster. Rather than batching releases once per second, send smaller amounts more frequently to:

- Keep resource consumption (memory, CPU, network) flowing evenly
- Prevent bottlenecks from sudden request bursts

For example, if a service allows 100 operations per second, release 20 operations every 200 milliseconds:

{% echarts %}
{
  "title": {
    "text": "Rate Limiting: Smooth vs Burst Traffic"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["Burst (100/sec)", "Smooth (20/200ms)"]
  },
  "xAxis": {
    "type": "category",
    "data": ["0ms", "200ms", "400ms", "600ms", "800ms", "1000ms"]
  },
  "yAxis": {
    "type": "value",
    "name": "Operations"
  },
  "series": [
    {
      "name": "Burst (100/sec)",
      "type": "bar",
      "data": [100, 0, 0, 0, 0, 100],
      "itemStyle": {
        "color": "#ff6b6b"
      }
    },
    {
      "name": "Smooth (20/200ms)",
      "type": "bar",
      "data": [20, 20, 20, 20, 20, 20],
      "itemStyle": {
        "color": "#51cf66"
      }
    }
  ]
}
{% endecharts %}

### Managing Multiple Uncoordinated Processes

When multiple processes share a throttled service, logically partition the service's capacity and use a distributed mutual exclusion system to manage locks on those partitions.

**Example:**

If a throttled system allows 500 requests per second:

1. Create 20 partitions worth 25 requests per second each
2. A process needing 100 requests asks for four partitions
3. The system grants two partitions for 10 seconds
4. The process rate limits to 50 requests per second, completes in 2 seconds, and releases the lock

**Implementation approach:**

Use blob storage to create one small file per logical partition. Applications obtain exclusive leases on these files for short periods (e.g., 15 seconds). For each lease granted, the application can use that partition's capacity.

{% mermaid %}block-beta
columns 3
  block:processes:3
    columns 3
    P1["Process 1"]
    P2["Process 2"]
    P3["Process 3"]
  end
  space:3
  block:leases:3
    columns 3
    L1["Lease 1<br/>25 req/s"]
    L2["Lease 2<br/>25 req/s"]
    L3["Lease 3<br/>25 req/s"]
  end
  space:3
  block:service:3
    S["Throttled Service<br/>500 req/s total"]
  end
  
  P1 --> L1
  P2 --> L2
  P3 --> L3
  L1 --> S
  L2 --> S
  L3 --> S
  
  style processes fill:#e1f5ff
  style leases fill:#fff4e1
  style service fill:#ffe1e1
{% endmermaid %}

To reduce latency, allocate a small amount of exclusive capacity for each process. Processes only seek shared capacity leases when exceeding their reserved capacity.

Alternative technologies for lease management include Zookeeper, Consul, etcd, and Redis/Redsync.

## Issues and Considerations

!!!anote "💡 Key Considerations"
    **Handle throttling errors**: Rate limiting reduces errors but doesn't eliminate them. Your application must still handle any throttling errors that occur.
    
    **Multiple workstreams**: If your application has multiple workstreams accessing the same throttled service (e.g., bulk loading and querying), integrate all into your rate limiting strategy or reserve separate capacity pools for each.
    
    **Multi-application usage**: When multiple applications use the same throttled service, increased throttling errors might indicate contention. Consider temporarily reducing throughput until usage from other applications decreases.
!!!

## When to Use This Pattern

Use this pattern to:

- Reduce throttling errors from throttle-limited services
- Reduce traffic compared to naive retry-on-error approaches
- Reduce memory consumption by dequeuing records only when there's capacity to process them
- Improve predictability of batch processing completion times

## Example Architecture

Consider an application where users submit records of various types to an API. Each record type has a unique job processor that performs validation, enrichment, and database insertion.

All components (API, job processors) are separate processes that scale independently and don't directly communicate.

{% mermaid %}graph TB
    U1["User"] --> API["API"]
    U2["User"] --> API
    
    API --> QA["Queue A<br/>(Type A Records)"]
    API --> QB["Queue B<br/>(Type B Records)"]
    
    QA --> JPA["Job Processor A"]
    QB --> JPB["Job Processor B"]
    
    JPA --> LS["Lease Storage<br/>(Blob 0-9)"]
    JPB --> LS
    
    JPA --> DB["Database<br/>(1000 req/s limit)"]
    JPB --> DB
    
    style API fill:#e1f5ff
    style QA fill:#fff4e1
    style QB fill:#fff4e1
    style LS fill:#f0e1ff
    style DB fill:#ffe1e1
{% endmermaid %}

**Workflow:**

1. User submits 10,000 records of type A to the API
2. API enqueues records in Queue A
3. User submits 5,000 records of type B to the API
4. API enqueues records in Queue B
5. Job Processor A attempts to lease blob 2
6. Job Processor B attempts to lease blob 2
7. Job Processor A fails; Job Processor B obtains the lease for 15 seconds (100 req/s capacity)
8. Job Processor B dequeues and writes 100 records
9. After 1 second, both processors attempt additional leases
10. Job Processor A obtains blob 6 (100 req/s); Job Processor B obtains blob 3 (now 200 req/s total)
11. Processors continue competing for leases and processing records at their granted rates
12. As leases expire (after 15 seconds), processors reduce their request rates accordingly

## Related Patterns

**Throttling**: Rate limiting is typically implemented in response to a throttled service.

**Retry**: When requests result in throttling errors, retry after an appropriate interval.

**Queue-Based Load Leveling**: Similar but broader than rate limiting. Key differences:

- Rate limiting doesn't necessarily require queues but needs durable messaging
- Rate limiting introduces distributed mutual exclusion on partitions for managing capacity across uncoordinated processes
- Queue-based load leveling applies to any performance mismatch between services; rate limiting specifically addresses throttled services

## References

- [Rate Limiting Pattern - Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern)
