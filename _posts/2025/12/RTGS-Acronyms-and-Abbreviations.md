---
title: "RTGS Reference: Complete Acronyms and Abbreviations Guide"
date: 2025-12-30
categories:
  - Misc
tags:
  - RTGS
  - Reference
  - Acronyms
  - Glossary
excerpt: "Comprehensive reference guide for all acronyms and abbreviations used in the RTGS series, from payment systems to security and architecture."
lang: en
available_langs: []
thumbnail: /assets/rtgs/thumbnail.jpg
thumbnail_80: /assets/rtgs/thumbnail_80.jpg
series: rtgs
canonical_lang: en
comments: true
---

This reference guide consolidates all acronyms and abbreviations used throughout the RTGS (Real-Time Gross Settlement) series. Use this as a quick lookup when reading the other articles.

## 1 Payment Systems & Financial Institutions

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **RTGS** | Real-Time Gross Settlement | System for immediate settlement of individual transactions |
| **ACH** | Automated Clearing House | US electronic network for processing financial transactions |
| **DNS** | Deferred Net Settlement | System that settles transactions in batches at intervals |
| **FX** | Foreign Exchange | Trading of currencies between nations |
| **CLS** | Continuous Linked Settlement | Multi-currency cash settlement system for FX transactions |
| **DTC** | Depository Trust Company | US securities depository and clearinghouse |
| **ECB** | European Central Bank | Central bank for the Eurozone |
| **PBOC** | People's Bank of China | Central bank of the People's Republic of China |
| **CHAPS** | Clearing House Automated Payment System | UK same-day sterling payment system |
| **Fedwire** | Federal Reserve Wire Network | US real-time gross settlement funds transfer system |
| **TARGET2** | Trans-European Automated Real-time Gross settlement Express Transfer system | Eurozone RTGS system |
| **BOJ-NET** | Bank of Japan Financial Network Network | Japanese RTGS system |
| **CNAPS** | China National Advanced Payment System | Chinese payment system including HVPS (RTGS) |
| **RITS** | Reserve Bank Information and Transfer System | Australian RTGS system |
| **LVTS** | Large Value Transfer System | Canadian RTGS system (now replaced by Lynx) |
| **SIC** | Swiss Interbank Clearing | Swiss RTGS system |
| **SEPA** | Single Euro Payments Area | EU payment integration initiative |
| **FPS** | Faster Payments Service | UK instant payment system |

## 2 Standards Organizations & Messaging

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **ISO** | International Organization for Standardization | Develops international standards including ISO 20022 |
| **SWIFT** | Society for Worldwide Interbank Financial Telecommunication | Global messaging network for financial institutions |
| **BIC** | Bank Identifier Code | Standard format for identifying banks (also called SWIFT code) |
| **IBAN** | International Bank Account Number | International standard for identifying bank accounts |
| **ISO 20022** | ISO Standard 20022 | International standard for financial services messaging |
| **pacs** | Payments Clearing and Settlement | ISO 20022 message category for payments |
| **FIToFI** | Financial Institution to Financial Institution | Messages between banks |
| **CstmrCdtTrf** | Customer Credit Transfer | Customer payment message type |
| **MT** | Message Type | SWIFT's legacy message format (e.g., MT103, MT202) |
| **UML** | Unified Modeling Language | Standard modeling language used in ISO 20022 |
| **XSD** | XML Schema Definition | Schema language for validating XML messages |

## 3 ISO 20022 Message Elements

| Acronym/Code | Full Name | Description |
|--------------|-----------|-------------|
| **pacs.008** | Payment Clearing and Settlement - Customer Credit Transfer | Message for customer payments |
| **pacs.009** | Payment Clearing and Settlement - Financial Institution Transfer | Message for bank-to-bank transfers |
| **pacs.002** | Payment Clearing and Settlement - Payment Status Report | Message for payment status |
| **pacs.004** | Payment Clearing and Settlement - Return/Payment Cancellation | Message for returns and cancellations |
| **PmtId** | Payment Identification | Unique identifier for payments |
| **UltmtDbtr** | Ultimate Debtor | Original payer in a transaction |
| **UltmtCdtr** | Ultimate Creditor | Final recipient of funds |
| **RmtInf** | Remittance Information | Payment reference/details |
| **IntrBkSttlmAmt** | Interbank Settlement Amount | Settlement amount in interbank transactions |
| **IntrBkSttlmDt** | Interbank Settlement Date | Date of interbank settlement |
| **DbtrAgt** | Debtor Agent | Bank representing the payer |
| **CdtrAgt** | Creditor Agent | Bank representing the payee |
| **ACSC** | Accepted Settlement Completed | Payment status code for successful settlement |
| **ACCP** | Accepted Customer Profile | Payment status code for customer validated |
| **ACSP** | Accepted Settlement in Process | Payment status code for being processed |
| **RJCT** | Rejected | Payment status code for rejected payments |
| **PDNG** | Pending | Payment status code for awaiting processing |
| **ACTC** | Accepted Technical Validation | Payment status code for technically valid |

## 4 Data Formats & Technologies

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **XML** | Extensible Markup Language | Markup language for encoding documents (used in ISO 20022) |
| **JSON** | JavaScript Object Notation | Lightweight data interchange format |
| **API** | Application Programming Interface | Interface for software components to communicate |
| **SQL** | Structured Query Language | Database query language |
| **RDBMS** | Relational Database Management System | Traditional relational database |
| **CDC** | Change Data Capture | Process of identifying and capturing data changes |
| **IoT** | Internet of Things | Network of physical devices with embedded connectivity |

## 5 Security & Cryptography

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **HSM** | Hardware Security Module | Physical device for managing digital keys and cryptographic operations |
| **PKI** | Public Key Infrastructure | Framework for managing digital certificates and encryption |
| **TLS** | Transport Layer Security | Cryptographic protocol for secure communications |
| **mTLS** | Mutual TLS | TLS where both parties authenticate each other |
| **IPSec** | Internet Protocol Security | Suite of protocols for securing IP communications |
| **VPN** | Virtual Private Network | Secure tunnel over public networks |
| **AES** | Advanced Encryption Standard | Symmetric encryption algorithm |
| **RSA** | Rivest-Shamir-Adleman | Asymmetric encryption algorithm |
| **ECC** | Elliptic Curve Cryptography | Public-key cryptography approach |
| **ECDSA** | Elliptic Curve Digital Signature Algorithm | Digital signature algorithm |
| **ECDH** | Elliptic Curve Diffie-Hellman | Key agreement protocol |
| **SHA** | Secure Hash Algorithm | Cryptographic hash functions |
| **FIPS** | Federal Information Processing Standards | US government security standards |
| **MFA** | Multi-Factor Authentication | Authentication requiring multiple proofs |

## 6 Network Security

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **DDoS** | Distributed Denial of Service | Attack that overwhelms systems with traffic |
| **IDS** | Intrusion Detection System | Monitors for malicious activity |
| **IPS** | Intrusion Prevention System | Blocks detected threats in real-time |
| **VLAN** | Virtual Local Area Network | Logically segmented network |
| **SIEM** | Security Information and Event Management | Real-time security monitoring |
| **RBAC** | Role-Based Access Control | Access control based on user roles |
| **LDAP** | Lightweight Directory Access Protocol | Protocol for accessing directory services |

## 7 High Availability & Performance

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **HA** | High Availability | System design for minimal downtime |
| **RTO** | Recovery Time Objective | Maximum acceptable downtime after a failure |
| **RPO** | Recovery Point Objective | Maximum acceptable data loss measured in time |
| **WRT** | Work Recovery Time | Time to resume operations |
| **MTD** | Maximum Tolerable Downtime | Business impact threshold |
| **MTBF** | Mean Time Between Failures | Average time between system failures |
| **MTTR** | Mean Time To Repair | Average time to fix a failed system |
| **MTTF** | Mean Time To Failure | Average time until a system fails |
| **SLA** | Service Level Agreement | Contractual service commitment |
| **SLO** | Service Level Objective | Internal service target |
| **TPS** | Transactions Per Second | Measure of system throughput |
| **P50** | 50th Percentile | Median response time (50% of requests faster) |
| **P99** | 99th Percentile | 99% of requests complete within this time |
| **L1/L2/L3** | Level 1/2/3 Cache | Cache hierarchy levels |
| **Redis** | Remote Dictionary Server | In-memory data structure store |
| **Memcached** | Memory Cached | Distributed memory caching system |
| **DNS** | Domain Name System | Translates domain names to IP addresses |
| **VIP** | Virtual IP Address | Shared IP for load balancing |

## 8 Infrastructure & Operations

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **DR** | Disaster Recovery | Strategies and procedures for recovering from disasters |
| **DC** | Data Center | Facility housing computer systems and network infrastructure |
| **ACID** | Atomicity, Consistency, Isolation, Durability | Properties guaranteeing reliable database transactions |

## 9 Regulations & Compliance

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **GDPR** | General Data Protection Regulation | EU data protection regulation |
| **PSD2** | Payment Services Directive 2 | EU payment services regulation |
| **SOX** | Sarbanes-Oxley Act | US financial reporting regulation |
| **PCI DSS** | Payment Card Industry Data Security Standard | Card data security standard |
| **ISO 27001** | ISO Standard 27001 | Information security management standard |

## 10 General IT & Architecture

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **CIA** | Confidentiality, Integrity, Availability | Three pillars of information security |
| **DR** | Disaster Recovery | Strategies for recovering from disasters |
| **DC** | Data Center | Facility housing computer systems and network infrastructure |