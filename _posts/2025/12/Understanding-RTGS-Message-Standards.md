---
title: "Understanding RTGS: Message Standards and Protocols"
date: 2025-12-10
categories:
  - Misc
tags:
  - RTGS
  - ISO 20022
  - Payment Messages
  - SWIFT
excerpt: "Comprehensive guide to RTGS message standards, focusing on ISO 20022, SWIFT MT migration, and message structure for payment settlement systems."
lang: en
available_langs: []
thumbnail: /assets/rtgs/thumbnail.jpg
thumbnail_80: /assets/rtgs/thumbnail_80.jpg
series: rtgs
canonical_lang: en
comments: true
---

Message standards are the language of RTGS systems. This article explores the message formats, protocols, and standards that enable interoperability between financial institutions in real-time gross settlement networks.

## 1 Evolution of Payment Message Standards

### 1.1 Historical Context

```mermaid
timeline
    title Payment Message Standards Evolution
    1973 : SWIFT Founded
           : First standards developed
    1977 : SWIFT MT Messages
           : Category 1 (Customer Transfers)
    2004 : ISO 20022 Published
           : XML-based standard
    2018 : RTGS Migration Begins
           : TARGET2, Fedwire adopt ISO 20022
    2023 : SWIFT MT Migration
           : Coexistence period begins
    2025 : ISO 20022 Dominance
           : Most major systems migrated
```

### 1.2 Standards Comparison

| Standard | Format | Era | Status |
|----------|--------|-----|--------|
| **SWIFT MT** | Fixed-length text | 1977-2025 | Legacy (phasing out) |
| **ISO 20022** | XML/JSON | 2004-present | Current standard |
| **Fedwire** | Proprietary | 1918-present | US-specific |
| **CHIPS** | Proprietary | 1971-present | US clearing only |

## 2 ISO 20022 Fundamentals

### 2.1 What is ISO 20022?

!!!anote "📋 ISO 20022 Overview"
    **ISO 20022** is an international standard for financial services messaging that provides:

    ✅ **Common Platform**
    - Unified methodology for message development
    - Standardized data dictionary
    - Consistent modeling approach (UML)

    ✅ **Rich Data Structure**
    - XML-based format (primary)
    - JSON support (emerging)
    - Extensible data model

    ✅ **Global Adoption**
    - Used by 70+ countries
    - Major RTGS systems migrated
    - SWIFT migration underway

### 2.2 ISO 20022 Message Structure

```mermaid
graph TB
    A["ISO 20022 Message"]
    
    A --> B["Message Header"]
    A --> C["Message Body (Payload)"]
    A --> D["Message Trailer"]
    
    B --> B1["Message Definition Identifier"]
    B --> B2["Business Application Header"]
    B --> B3["Security Elements"]
    
    C --> C1["Transaction Information"]
    C --> C2["Party Information"]
    C --> C3["Amount & Currency"]
    C --> C4["Dates & Times"]
    C --> C5["Remittance Information"]
    
    D --> D1["Security Trailer"]
    D --> D2["Validation Data"]
    
    style A fill:#1976d2,stroke:#0d47a1,color:#fff
    style B fill:#e3f2fd,stroke:#1976d2
    style C fill:#fff3e0,stroke:#f57c00
```

### 2.3 Message Naming Convention

ISO 20022 uses a standardized naming pattern:

```
<BusinessArea><Function><SubFunction><Variant>

Example: pacs.008.001.08
├── pacs  = Payments Clearing and Settlement
├── 008   = Customer Credit Transfer
├── 001   = Message variant
└── 08    = Version number
```

**Common RTGS Message Types:**

| Message Type | Code | Usage |
|--------------|------|-------|
| **Customer Credit Transfer** | pacs.008 | High-value customer payments |
| **Financial Institution Transfer** | pacs.009 | Bank-to-bank transfers |
| **Payment Status Report** | pacs.002 | Payment status notification |
| **Cancel Request** | pacs.004 | Payment cancellation |
| **Return** | pacs.004 | Payment return |

## 3 Key ISO 20022 Messages for RTGS

### 3.1 pacs.008 - Customer Credit Transfer

The primary message for customer payments:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <!-- Group Header -->
    <GrpHdr>
      <MsgId>MSG-12345-2025</MsgId>
      <CreDtTm>2025-12-10T10:30:00Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    
    <!-- Credit Transfer Transaction -->
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>INSTRUCTION-001</InstrId>
        <TxId>TRANSACTION-001</TxId>
      </PmtId>
      
      <!-- Payment Type Information -->
      <PmtTpInf>
        <InstrPrty>URGT</InstrPrty>
        <SvcLvl>
          <Cd>URGP</Cd>
        </SvcLvl>
      </PmtTpInf>
      
      <!-- Amount -->
      <IntrBkSttlmAmt Ccy="USD">1000000.00</IntrBkSttlmAmt>
      
      <!-- Settlement Information -->
      <IntrBkSttlmDt>2025-12-10</IntrBkSttlmDt>
      
      <!-- Debtor Institution -->
      <DbtrAgt>
        <FinInstnId>
          <BICFI>BANKUS33XXX</BICFI>
        </FinInstnId>
      </DbtrAgt>
      
      <!-- Creditor Institution -->
      <CdtrAgt>
        <FinInstnId>
          <BICFI>BANKGB2LXXX</BICFI>
        </FinInstnId>
      </CdtrAgt>
      
      <!-- Ultimate Debtor -->
      <UltmtDbtr>
        <Nm>ABC Corporation</Nm>
        <PstlAdr>
          <StrtNm>Wall Street</StrtNm>
          <BldgNb>100</BldgNb>
          <PstCd>10005</PstCd>
          <TwnNm>New York</TwnNm>
          <Ctry>US</Ctry>
        </PstlAdr>
      </UltmtDbtr>
      
      <!-- Ultimate Creditor -->
      <UltmtCdtr>
        <Nm>XYZ Limited</Nm>
        <PstlAdr>
          <StrtNm>City Road</StrtNm>
          <BldgNb>50</BldgNb>
          <PstCd>EC1V</PstCd>
          <TwnNm>London</TwnNm>
          <Ctry>GB</Ctry>
        </PstlAdr>
      </UltmtCdtr>
      
      <!-- Remittance Information -->
      <RmtInf>
        <Ustrd>Invoice INV-2025-001 Payment</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
```

### 3.2 pacs.009 - Financial Institution Transfer

Used for interbank transfers (own account transfers):

```mermaid
graph LR
    subgraph "pacs.008 (Customer Payment)"
        A1[Customer A] --> A2[Bank A]
        A2 --> A3[RTGS System]
        A3 --> A4[Bank B]
        A4 --> A5[Customer B]
    end
    
    subgraph "pacs.009 (Bank Transfer)"
        B1[Bank A] --> B2[RTGS System]
        B2 --> B3[Bank B]
        B2 -.-> B4[Own Account]
    end
    
    style A3 fill:#1976d2,stroke:#0d47a1,color:#fff
    style B2 fill:#1976d2,stroke:#0d47a1,color:#fff
```

**Key Differences:**

| Aspect | pacs.008 | pacs.009 |
|--------|----------|----------|
| **Purpose** | Customer payments | Interbank transfers |
| **Ultimate Parties** | Customer to Customer | Bank to Bank |
| **Remittance Info** | Required | Optional |
| **Use Case** | Commercial payments | Liquidity transfers |

### 3.3 pacs.002 - Payment Status Report

Provides status updates on payments:

```xml
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.10">
  <FIToFIPmtStsRpt>
    <GrpHdr>
      <MsgId>STATUS-12345</MsgId>
      <CreDtTm>2025-12-10T10:31:00Z</CreDtTm>
    </GrpHdr>
    
    <OrgnlGrpInf>
      <OrgnlMsgId>MSG-12345-2025</OrgnlMsgId>
      <OrgnlMsgNmId>pacs.008.001.08</OrgnlMsgNmId>
    </OrgnlGrpInf>
    
    <TxInfAndSts>
      <OrgnlTxId>TRANSACTION-001</OrgnlTxId>
      
      <!-- Transaction Status -->
      <TxSts>ACSC</TxSts>
      <!-- ACSC = Accepted Settlement Completed -->
      
      <StsRsnInf>
        <Rsn>
          <Cd>SETC</Cd>
          <!-- SETC = Settlement Completed -->
        </Rsn>
      </StsRsnInf>
      
      <SttlmInf>
        <SttlmSts>STLD</SttlmSts>
        <!-- STLD = Settled -->
      </SttlmInf>
    </TxInfAndSts>
  </FIToFIPmtStsRpt>
</Document>
```

**Status Codes:**

| Code | Meaning | Description |
|------|---------|-------------|
| **ACSC** | Accepted Settlement Completed | Successfully settled |
| **ACCP** | Accepted Customer Profile | Customer validated |
| **ACSP** | Accepted Settlement in Process | Being processed |
| **RJCT** | Rejected | Payment rejected |
| **PDNG** | Pending | Awaiting processing |
| **ACTC** | Accepted Technical Validation | Technically valid |

## 4 SWIFT MT to ISO 20022 Migration

### 4.1 MT Message Categories

```mermaid
graph TB
    A["SWIFT MT Messages"]
    
    A --> B["Category 1: Customer"]
    A --> C["Category 2: Financial"]
    A --> D["Category 9: Confirmations"]
    
    B --> B1[MT103: Customer Transfer]
    B --> B2[MT103+: Enhanced]
    
    C --> C1[MT202: Bank Transfer]
    C --> C2[MT202COV: Cover Payment]
    
    D --> D1[MT910: Credit Confirm]
    D --> D2[MT900: Debit Confirm]
    
    style A fill:#1976d2,stroke:#0d47a1,color:#fff
    style B1 fill:#ffebee,stroke:#c62828
    style C1 fill:#ffebee,stroke:#c62828
```

### 4.2 MT to ISO 20022 Mapping

**MT103 to pacs.008:**

| MT103 Field | ISO 20022 Element | Notes |
|-------------|-------------------|-------|
| :20 (TRN) | PmtId.TxId | Transaction ID |
| :32A (Value Date/Currency/Amount) | IntrBkSttlmAmt + IntrBkSttlmDt | Amount and date |
| :50 (Ordering Customer) | UltmtDbtr | Ultimate debtor |
| :52 (Ordering Institution) | DbtrAgt | Debtor agent |
| :59 (Beneficiary Customer) | UltmtCdtr | Ultimate creditor |
| :57 (Account With Institution) | CdtrAgt | Creditor agent |
| :70 (Remittance Info) | RmtInf.Ustrd | Remittance details |

**MT202 to pacs.009:**

| MT202 Field | ISO 20022 Element | Notes |
|-------------|-------------------|-------|
| :20 (TRN) | PmtId.TxId | Transaction ID |
| :32A (Value Date/Currency/Amount) | IntrBkSttlmAmt | Settlement amount |
| :52 (Ordering Institution) | DbtrAgt | Debtor agent |
| :57 (Account With Institution) | CdtrAgt | Creditor agent |

### 4.3 Migration Timeline

```mermaid
gantt
    title SWIFT MT to ISO 20022 Migration
    dateFormat YYYY-MM
    axisFormat %Y-%m
    
    section Coexistence
    MT & ISO Parallel :active, coex, 2022-11, 2025-11
    
    section Migration
    Phase 1: Readiness :done, phase1, 2022-11, 2023-06
    Phase 2: Testing :done, phase2, 2023-06, 2024-06
    Phase 3: Migration :active, phase3, 2024-06, 2025-06
    Phase 4: Completion :phase4, 2025-06, 2025-11
    
    section End of MT
    MT Shutdown :crit, shutdown, 2025-11, 1m
```

## 5 Message Validation and Processing

### 5.1 Validation Layers

```mermaid
flowchart TD
    A[Incoming Message] --> B[Syntax Validation]
    B --> C{Valid Syntax?}
    C -->|No| Reject1[Reject: Syntax Error]
    C -->|Yes| D[Schema Validation]
    
    D --> E{Valid Schema?}
    E -->|No| Reject2[Reject: Schema Error]
    E -->|Yes| F[Business Rules Validation]
    
    F --> G{Valid Business Rules?}
    G -->|No| Reject3[Reject: Business Rule]
    G -->|Yes| H[Signature Verification]
    
    H --> I{Valid Signature?}
    I -->|No| Reject4[Reject: Security]
    I -->|Yes| J[Processing Queue]
    
    Reject1 --> End
    Reject2 --> End
    Reject3 --> End
    Reject4 --> End
    J --> End([Validated])
    
    style A fill:#e3f2fd,stroke:#1976d2
    style J fill:#e8f5e9,stroke:#388e3c
    style End fill:#e8f5e9,stroke:#388e3c
```

### 5.2 Validation Rules

```java
// Conceptual validation framework
interface MessageValidator {
    
    /**
     * Validate message syntax (XML/JSON well-formed)
     */
    ValidationResult validateSyntax(Message message);
    
    /**
     * Validate against XSD schema
     */
    ValidationResult validateSchema(Message message, String schemaVersion);
    
    /**
     * Validate business rules
     */
    ValidationResult validateBusinessRules(Message message);
    
    /**
     * Validate digital signature
     */
    ValidationResult validateSignature(Message message, Certificate cert);
    
    /**
     * Validate against sanctions lists
     */
    ComplianceResult validateCompliance(Message message);
}
```

### 5.3 Error Handling

**Error Response Structure:**

```xml
<Document>
  <pacs.004>
    <TxInfAndSts>
      <OrgnlTxId>TRANSACTION-001</OrgnlTxId>
      
      <!-- Rejection Status -->
      <TxSts>RJCT</TxSts>
      
      <!-- Rejection Reason -->
      <StsRsnInf>
        <Rsn>
          <Cd>AM04</Cd>
          <!-- AM04 = Incorrect Amount -->
        </Rsn>
        <AddtlInf>
          Amount exceeds transaction limit
        </AddtlInf>
      </StsRsnInf>
      
      <!-- Original Message Reference -->
      <OrgnlGrpInf>
        <OrgnlMsgId>MSG-12345-2025</OrgnlMsgId>
        <OrgnlMsgNmId>pacs.008.001.08</OrgnlMsgNmId>
      </OrgnlGrpInf>
    </TxInfAndSts>
  </pacs.004>
</Document>
```

**Common Error Codes:**

| Code Category | Range | Examples |
|---------------|-------|----------|
| **Amount (AM)** | AM01-AM99 | AM04: Incorrect amount |
| **Customer (CU)** | CU01-CU99 | CU02: Invalid customer |
| **Technical (TE)** | TE01-TE99 | TE01: System error |
| **Settlement (SA)** | SA01-SA99 | SA01: Invalid account |
| **Regulatory (RV)** | RV01-RV99 | RV01: Sanctions check |

## 6 Communication Protocols

### 6.1 Transport Layer Security

```mermaid
sequenceDiagram
    participant P as Participant
    participant LB as Load Balancer
    participant GW as API Gateway
    participant S as RTGS System
    
    P->>LB: TLS 1.3 Handshake
    LB->>GW: Forward Connection
    GW->>GW: mTLS Verification
    GW->>S: Authenticated Connection
    
    Note over P,S: All communication encrypted
    Note over GW,S: Mutual authentication
```

### 6.2 API Standards

**RESTful API for RTGS:**

```yaml
# OpenAPI Specification Example
openapi: 3.0.0
info:
  title: RTGS Payment API
  version: 1.0.0

paths:
  /payments:
    post:
      summary: Submit Payment
      requestBody:
        content:
          application/xml:
            schema:
              $ref: '#/components/schemas/Pacs008'
      responses:
        '202':
          description: Accepted for Processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentResponse'
  
  /payments/{transactionId}/status:
    get:
      summary: Get Payment Status
      parameters:
        - name: transactionId
          in: path
          required: true
      responses:
        '200':
          description: Status Retrieved
          content:
            application/xml:
              schema:
                $ref: '#/components/schemas/Pacs002'
```

### 6.3 Message Queue Integration

```mermaid
graph TB
    subgraph "Participant Side"
        A[Payment System] --> B[Message Queue]
    end
    
    subgraph "Network"
        B --> C[Secure Channel]
        C --> D[Message Queue]
    end
    
    subgraph "RTGS Side"
        D --> E[Message Consumer]
        E --> F[Processor]
        F --> G[Response Queue]
        G --> H[Secure Channel]
        H --> I[Response Consumer]
        I --> A
    end
    
    style A fill:#e3f2fd,stroke:#1976d2
    style F fill:#1976d2,stroke:#0d47a1,color:#fff
    style B fill:#fff3e0,stroke:#f57c00
    style D fill:#fff3e0,stroke:#f57c00
```

## 7 Testing and Certification

### 7.1 Testing Levels

| Level | Description | Tools |
|-------|-------------|-------|
| **Unit Testing** | Individual message validation | XML validators, Schema checkers |
| **Integration Testing** | End-to-end message flow | Test harnesses, Mock systems |
| **Conformance Testing** | Standard compliance | ISO certification tools |
| **Performance Testing** | Throughput and latency | Load testing tools |
| **Security Testing** | Encryption and authentication | Penetration testing |

### 7.2 Test Scenarios

```mermaid
graph LR
    subgraph "Positive Tests"
        A1[Valid Payment]
        A2[Status Request]
        A3[Cancel Request]
    end
    
    subgraph "Negative Tests"
        B1[Invalid Amount]
        B2[Missing Fields]
        B3[Invalid Signature]
        B4[Sanctions Hit]
    end
    
    subgraph "Edge Cases"
        C1[Maximum Amount]
        C2[Cut-off Time]
        C3[High Volume]
        C4[System Failover]
    end
    
    style A1 fill:#e8f5e9,stroke:#388e3c
    style B1 fill:#ffebee,stroke:#c62828
    style C1 fill:#fff3e0,stroke:#f57c00
```

## 8 Summary

!!!anote "📋 Key Takeaways"
    **Essential message standards knowledge:**

    ✅ **ISO 20022 Dominance**
    - Global standard for RTGS messaging
    - XML-based with rich data structure
    - Replacing legacy SWIFT MT formats

    ✅ **Key Message Types**
    - pacs.008: Customer credit transfers
    - pacs.009: Financial institution transfers
    - pacs.002: Payment status reports

    ✅ **Migration from MT**
    - SWIFT MT sunset November 2025
    - Mapping between MT and ISO 20022
    - Coexistence period ending

    ✅ **Validation is Critical**
    - Multiple validation layers
    - Syntax, schema, business rules
    - Security and compliance checks

    ✅ **IT Implementation**
    - RESTful APIs for integration
    - Message queues for reliability
    - Comprehensive testing required

---

**Footnotes for this article:**

[^1]: **ISO** - International Organization for Standardization: Develops international standards including ISO 20022
[^2]: **SWIFT** - Society for Worldwide Interbank Financial Telecommunication: Global messaging network for financial institutions
[^3]: **MT** - Message Type: SWIFT's legacy message format (e.g., MT103, MT202)
[^4]: **XML** - Extensible Markup Language: Markup language used for ISO 20022 messages
[^5]: **JSON** - JavaScript Object Notation: Lightweight data interchange format, emerging support in ISO 20022
[^6]: **BIC** - Bank Identifier Code: Standard format for identifying banks (also called SWIFT code)
[^7]: **API** - Application Programming Interface: Interface for software components to communicate
[^8]: **TLS** - Transport Layer Security: Cryptographic protocol for secure communications
[^9]: **mTLS** - Mutual TLS: TLS where both parties authenticate each other
[^10]: **HSM** - Hardware Security Module: Physical device for managing digital keys and cryptographic operations

> **Note:** For a complete list of all acronyms used in the RTGS series, see the [RTGS Acronyms and Abbreviations Reference](/2025/12/RTGS-Acronyms-and-Abbreviations/).
