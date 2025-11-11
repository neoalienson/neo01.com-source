---
title: "The Evolution of Single Sign-On: From Kerberos to OIDC"
date: 2010-01-22
categories: Cybersecurity
tags: [Security, Authentication, SSO, OAuth, OIDC, SAML, Kerberos]
excerpt: "Single Sign-On promises one login for everything, but the path from Windows authentication to modern OAuth flows reveals decades of security evolution. Understand when to use each protocol and avoid authentication pitfalls."
thumbnail: /assets/security/lock.png
series: authentication
---

Users hate passwords. They forget them, reuse them, write them on sticky notes, and complain when forced to create new ones. Organizations hate passwords too—they generate helpdesk tickets, create security vulnerabilities, and frustrate users. Single Sign-On (SSO) emerged as the solution: authenticate once, access everything.

The promise sounds simple, but the reality is complex. Over decades, multiple SSO technologies emerged, each solving different problems in different contexts. Windows Integrated Authentication (WIA) worked within corporate networks. Kerberos provided secure authentication for distributed systems. SPNEGO bridged Windows and web applications. SAML enabled enterprise federation. OAuth revolutionized API authorization. OpenID Connect (OIDC) finally unified authentication and authorization for modern applications.

This exploration traces SSO's evolution from 1980s network authentication to today's cloud-native protocols. Understanding this history reveals why we have so many SSO standards, when to use each one, and how to avoid common authentication mistakes that compromise security.

### SSO Evolution Timeline

{% mermaid %}timeline
    title Single Sign-On Evolution
    section 1980s
        1988 : Kerberos v4
             : MIT develops ticket-based auth
             : Network authentication
    section 1990s
        1993 : Kerberos v5
             : Enhanced security
        2000 : Windows 2000
             : Active Directory with Kerberos
             : SPNEGO for web
    section 2000s
        2002 : SAML 1.0
             : Enterprise federation
        2005 : SAML 2.0
             : Mature enterprise SSO
        2006 : OAuth 1.0
             : API authorization
    section 2010s
        2012 : OAuth 2.0
             : Modern authorization
        2014 : OpenID Connect
             : Authentication + Authorization
             : Cloud-native SSO
{% endmermaid %}

## The Password Problem

Before examining SSO solutions, understanding the problem they solve is essential. Passwords create friction and risk in every system.

### Why Passwords Fail

Passwords seemed like a good idea initially:

!!!error "🚫 Password Problems"
    **User Burden**
    - Remember dozens of passwords
    - Different complexity requirements
    - Frequent expiration policies
    - Password reset friction
    
    **Security Risks**
    - Password reuse across systems
    - Weak passwords to aid memory
    - Phishing attacks steal credentials
    - Credential stuffing attacks
    
    **Operational Costs**
    - Helpdesk password reset tickets
    - Account lockout issues
    - Provisioning complexity
    - Audit trail gaps

A typical enterprise employee manages passwords for email, file shares, databases, web applications, VPN, and countless SaaS tools. Each system has different requirements—minimum length, special characters, expiration periods. Users respond predictably: they reuse passwords, write them down, or use simple patterns like "Password1", "Password2", "Password3".

### The SSO Vision

Single Sign-On addresses these problems:

!!!success "✅ SSO Benefits"
    **User Experience**
    - Authenticate once per session
    - Access all authorized systems
    - Reduced password fatigue
    - Faster application access
    
    **Security Improvements**
    - Centralized authentication
    - Stronger authentication methods
    - Consistent security policies
    - Better audit trails
    
    **Operational Efficiency**
    - Fewer helpdesk tickets
    - Simplified provisioning
    - Centralized access control
    - Reduced administrative overhead

The vision is compelling: users authenticate once in the morning, then seamlessly access email, file shares, databases, and web applications without additional logins. Security improves because authentication happens in one place with strong controls. Operations simplify because access management centralizes.

## Early SSO: Kerberos and Windows

The first practical SSO implementations emerged in the 1980s and 1990s, designed for corporate networks.

### Kerberos: Network Authentication Protocol

Kerberos, developed at MIT in the 1980s, provided secure authentication for distributed systems:

!!!anote "🎫 Kerberos Fundamentals"
    **Core Concept**
    - Ticket-based authentication
    - Trusted third party (KDC)
    - No passwords sent over network
    - Mutual authentication
    
    **How It Works**
    1. User authenticates to KDC
    2. KDC issues Ticket Granting Ticket (TGT)
    3. User requests service ticket using TGT
    4. User presents service ticket to application
    5. Application validates ticket with KDC

Kerberos solved a critical problem: how to authenticate users across a network without sending passwords. The protocol uses symmetric key cryptography and a trusted Key Distribution Center (KDC). The name "Kerberos" comes from Greek mythology—the three-headed dog guarding the underworld, representing the client, server, and KDC working together.

{% mermaid %}---
title: Kerberos Architecture
---
flowchart TD
    User([User])
    Client[Client Workstation]
    KDC[(Key Distribution Center)]
    Service1[Service A]
    Service2[Service B]
    
    User -->|Login| Client
    Client <-->|1. Authenticate<br/>2. Get TGT| KDC
    Client <-->|Request Service Ticket| KDC
    Client -->|Present Ticket| Service1
    Client -->|Present Ticket| Service2
    Service1 -.->|Validate| KDC
    Service2 -.->|Validate| KDC
    
    style KDC fill:#f96,stroke:#333,stroke-width:3px
    style Client fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

!!!tip "📖 Deep Dive: Kerberos"
    For detailed coverage of Kerberos architecture, authentication flows, ticket structure, security considerations, and implementation guidance, see [Understanding Kerberos: Network Authentication Explained](/2010/03/Understanding-Kerberos-Network-Authentication-Explained/).

### Windows Integrated Authentication

Microsoft built on Kerberos for Windows domain authentication:

!!!anote "🪟 Windows Authentication Evolution"
    **NTLM (NT LAN Manager)**
    - Challenge-response protocol
    - No trusted third party
    - Vulnerable to relay attacks
    - Legacy protocol, still supported
    
    **Kerberos in Active Directory**
    - Default since Windows 2000
    - Active Directory as KDC
    - Seamless desktop SSO
    - Works with Windows applications

Windows Integrated Authentication (WIA) provides transparent SSO within corporate networks. When you log into your Windows workstation with domain credentials, you authenticate to Active Directory using Kerberos. Your workstation caches tickets. When you access a file share, intranet website, or other Windows-integrated application, your workstation automatically presents the appropriate ticket. You never see another login prompt—it just works.

This seamless experience set user expectations for SSO. Employees wondered why they needed separate logins for web applications when their desktop applications worked without additional authentication.

### SPNEGO: Bridging Windows and Web

SPNEGO (Simple and Protected GSSAPI Negotiation Mechanism) extended Windows authentication to web browsers:

!!!anote "🌐 SPNEGO for Web SSO"
    **Purpose**
    - Extend Kerberos to HTTP
    - Browser negotiates authentication
    - Transparent to users
    - Intranet SSO
    
    **How It Works**
    1. Browser requests protected resource
    2. Server responds with WWW-Authenticate: Negotiate
    3. Browser requests Kerberos ticket
    4. Browser sends ticket in Authorization header
    5. Server validates ticket and grants access
    
    **Requirements**
    - Domain-joined workstation
    - Kerberos-enabled browser
    - Server in trusted zone
    - Proper DNS/SPN configuration

SPNEGO enabled intranet web applications to use Windows authentication. An employee accessing the company portal wouldn't see a login page—the browser automatically authenticated using their Windows credentials. This worked beautifully within corporate networks but failed outside them. Remote employees, mobile devices, and external partners couldn't use Windows authentication, creating a gap that later protocols would fill.

## Enterprise Federation: SAML

As organizations adopted web applications and cloud services, they needed SSO beyond corporate networks. SAML emerged as the enterprise federation standard.

### SAML Overview

Security Assertion Markup Language (SAML) enables SSO across organizational boundaries:

!!!anote "🔐 SAML Core Concepts"
    **Entities**
    - Identity Provider (IdP): Authenticates users
    - Service Provider (SP): Provides applications
    - User: Accesses applications
    
    **Key Features**
    - Digitally signed XML assertions
    - Browser-based redirect flows
    - Works across organizational boundaries
    - Mature enterprise standard

SAML separates authentication from application access. The Identity Provider (IdP) handles authentication—verifying who you are. Service Providers (SPs) trust the IdP's assertions about your identity. When you access a SAML-enabled application, it redirects you to your organization's IdP. You authenticate once at the IdP, which issues a SAML assertion—a digitally signed XML document stating who you are and what attributes you have.

{% mermaid %}---
title: SAML Architecture
---
flowchart TD
    User([User])
    Browser[Web Browser]
    IdP[Identity Provider<br/>ADFS/Okta]
    SP1[Service Provider A]
    SP2[Service Provider B]
    
    User -->|Access| Browser
    Browser <-->|1. Redirect to IdP<br/>2. SAML Assertion| IdP
    Browser -->|SAML Assertion| SP1
    Browser -->|SAML Assertion| SP2
    
    style IdP fill:#f96,stroke:#333,stroke-width:3px
    style Browser fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

### SAML in Practice

SAML became the standard for enterprise SSO:

!!!success "✅ SAML Strengths"
    **Enterprise Adoption**
    - Supported by major SaaS vendors
    - Works across organizational boundaries
    - Mature, well-understood protocol
    - Strong security properties
    
    **Use Cases**
    - Employee access to SaaS applications
    - Partner federation
    - Customer federation (B2B)
    - Academic federation (Shibboleth)

Organizations deploy SAML to provide employees seamless access to dozens of SaaS applications. An employee authenticates to their corporate IdP (often Active Directory Federation Services or Okta), then accesses Salesforce, Workday, ServiceNow, and other applications without additional logins.

### SAML Limitations

Despite widespread adoption, SAML has limitations:

!!!error "🚫 SAML Challenges"
    **Technical Complexity**
    - XML-based, verbose
    - Complex configuration
    - Certificate management overhead
    - Difficult to debug
    
    **Mobile and API Limitations**
    - Designed for browser-based flows
    - Poor mobile app support
    - Not designed for API authorization
    - Requires browser redirects

SAML works well for browser-based enterprise applications but struggles with modern use cases. Mobile apps can't easily handle browser redirects. APIs need authorization without user interaction. Single-page applications want JSON, not XML. These limitations created space for new protocols.

!!!tip "📖 Deep Dive: SAML"
    For detailed coverage of SAML architecture, authentication flows, security best practices, and implementation guidance, see [Understanding SAML: Enterprise Federation Explained](/2010/02/Understanding-SAML-Enterprise-Federation-Explained/).

## The API Revolution: OAuth

As web applications evolved into API-driven architectures, a new problem emerged: how to grant third-party applications limited access to user resources without sharing passwords.

### The Delegation Problem

Before OAuth, applications used password sharing:

!!!error "🚫 Password Anti-Pattern"
    **The Problem**
    - User gives password to third-party app
    - App has full access to account
    - No way to revoke access without changing password
    - Password exposed to multiple parties
    
    **Example**
    - Photo printing service needs access to photos
    - User provides email password
    - Service downloads all emails
    - Service stores password
    - User can't revoke access selectively

This pattern was common but dangerous. Users shared passwords with multiple services, each gaining full account access. If one service was compromised, all services were at risk. Users couldn't revoke access to one service without changing their password and updating all services.

### OAuth 2.0 Solution

OAuth 2.0 solved the delegation problem:

!!!anote "🔑 OAuth Core Concepts"
    **Entities**
    - Resource Owner: User who owns data
    - Client: Application requesting access
    - Authorization Server: Issues tokens
    - Resource Server: Hosts protected resources
    
    **Tokens**
    - Access Token: Grants API access
    - Refresh Token: Obtains new access tokens
    - Scope: Limits permissions
    - Expiration: Time-limited access
    
    **Key Principle**
    - Never share passwords
    - Grant limited access
    - Revocable permissions
    - Time-limited tokens

OAuth enables delegation without password sharing. When a photo printing service needs access to your photos, it redirects you to your photo service's authorization server. You authenticate and approve specific permissions—"allow read access to photos." The authorization server issues an access token to the printing service. This token grants limited access (only photos, not emails) for a limited time. You can revoke the token anytime without changing your password.

### OAuth Flows

OAuth defines multiple flows for different scenarios:

!!!anote "🔄 OAuth Grant Types"
    **Authorization Code Flow**
    - For web applications with backend
    - Most secure flow
    - Uses client secret
    - Recommended for confidential clients
    
    **Implicit Flow**
    - For browser-based apps (deprecated)
    - No client secret
    - Token in URL fragment
    - Security concerns led to deprecation
    
    **Client Credentials Flow**
    - For machine-to-machine
    - No user interaction
    - Service account authentication
    - Backend services
    
    **Resource Owner Password Flow**
    - User provides credentials to client
    - Legacy migration path
    - Not recommended
    - Defeats OAuth purpose

The Authorization Code Flow is the gold standard. The client redirects the user to the authorization server, receives an authorization code, then exchanges that code for an access token using its client secret. This flow keeps tokens away from the browser and provides strong security.

### OAuth in Practice

OAuth became ubiquitous:

!!!success "✅ OAuth Adoption"
    **Consumer Applications**
    - "Sign in with Google"
    - "Connect to Facebook"
    - "Authorize Twitter access"
    - Third-party integrations
    
    **API Authorization**
    - Microservices authentication
    - Mobile app backend access
    - Partner API access
    - IoT device authorization

OAuth powers the "Sign in with Google" buttons across the web. It enables Spotify to post to Facebook, fitness apps to sync with health platforms, and countless integrations between services. OAuth's success came from solving a real problem—secure delegation—with a practical solution.

### OAuth Limitations

OAuth solved authorization but created confusion about authentication:

!!!error "🚫 OAuth Authentication Confusion"
    **OAuth is NOT Authentication**
    - OAuth grants access to resources
    - Doesn't verify user identity
    - Access token doesn't identify user
    - Using OAuth for authentication is risky
    
    **The Problem**
    - Developers misused OAuth for login
    - Security vulnerabilities emerged
    - No standard user info endpoint
    - Inconsistent implementations

Developers saw OAuth's success and tried using it for authentication. They'd get an access token and assume it identified the user. This created security problems—access tokens aren't designed to prove identity. Different providers implemented user info endpoints differently. The ecosystem needed a standard authentication layer on top of OAuth.

## Modern SSO: OpenID Connect

OpenID Connect (OIDC) built on OAuth 2.0 to provide standardized authentication.

### OIDC Overview

OpenID Connect solved the authentication problem OAuth wasn't designed for:

!!!anote "🆔 OIDC Core Innovation"
    **The Problem**
    - Developers misused OAuth for authentication
    - Access tokens aren't identity proof
    - Inconsistent user info implementations
    - Security vulnerabilities
    
    **OIDC Solution**
    - Adds ID Token (JWT) to OAuth
    - ID Token proves user identity
    - Standardizes user information
    - Combines authentication + authorization
    
    **Key Benefits**
    - JSON instead of XML
    - Mobile and API friendly
    - Simple developer experience
    - Modern architecture support

OIDC extends OAuth by adding an ID Token—a JWT containing identity claims. When you authenticate with OIDC, you receive both an ID Token (proving who you are) and an access token (granting API access). This clear separation eliminates confusion and provides secure authentication.

{% mermaid %}---
title: OpenID Connect Architecture
---
flowchart TD
    User([User])
    Client[Client Application<br/>Web/Mobile]
    AuthServer[Authorization Server<br/>Auth0/Okta]
    API1[Resource Server<br/>User API]
    API2[Resource Server<br/>Payment API]
    API3[Resource Server<br/>Data API]
    
    User -->|Login| Client
    Client <-->|1. Auth Request<br/>2. ID Token + Access Token| AuthServer
    Client -->|Access Token| API1
    Client -->|Access Token| API2
    Client -->|Access Token| API3
    API1 -.->|Validate Token| AuthServer
    API2 -.->|Validate Token| AuthServer
    API3 -.->|Validate Token| AuthServer
    
    style AuthServer fill:#f96,stroke:#333,stroke-width:3px
    style Client fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

### OIDC in Practice

OIDC became the modern SSO standard:

!!!success "✅ OIDC Adoption"
    **Use Cases**
    - Web application login
    - Mobile app authentication
    - API authorization
    - Microservices security
    
    **Providers**
    - Auth0, Okta, Azure AD
    - Google Identity Platform
    - AWS Cognito
    - Self-hosted: Keycloak, ORY Hydra

OIDC powers modern authentication across web apps, mobile apps, and APIs. Developers integrate using standard libraries, avoiding custom authentication code.

### OIDC vs SAML

!!!tip "🎯 OIDC vs SAML Decision"
    **Choose SAML When:**
    - Legacy enterprise app integration
    - Vendor only supports SAML
    - Existing SAML infrastructure
    
    **Choose OIDC When:**
    - Building new applications
    - Mobile app authentication
    - API authorization needed
    - Modern architecture
    
    **Reality:**
    - Many IdPs support both
    - Use OIDC for new projects
    - Keep SAML for legacy integrations

SAML isn't going away, but new projects should use OIDC. It's simpler, more flexible, and better suited to modern architectures.

!!!tip "📖 Deep Dive: OpenID Connect"
    For detailed coverage of OIDC architecture, authentication flows, ID tokens, security best practices, and implementation guidance, see [OpenID Connect: Modern Authentication Explained](/2014/11/OpenID-Connect-Modern-Authentication-Explained/).

## Choosing the Right SSO Technology

With multiple SSO technologies available, how do you choose?

### Decision Framework

Use this framework to guide your choice:

!!!tip "🎯 SSO Technology Selection"
    **Kerberos/WIA When:**
    - Windows-only environment
    - Corporate network access
    - Desktop applications
    - Intranet websites
    - No external access needed
    
    **SPNEGO When:**
    - Extending Kerberos to web
    - Intranet applications
    - Windows-integrated auth
    - Domain-joined devices
    
    **SAML When:**
    - Enterprise SaaS integration
    - Vendor requires SAML
    - B2B federation
    - Legacy application support
    - Browser-based flows only
    
    **OAuth When:**
    - API authorization
    - Third-party integrations
    - Delegated access
    - No authentication needed
    
    **OIDC When:**
    - Modern web applications
    - Mobile applications
    - API authorization + authentication
    - Microservices
    - New development

The decision depends on your context. A corporate intranet might use Kerberos. An enterprise SaaS integration uses SAML. A modern web application uses OIDC. An API integration uses OAuth.

### Common Mistakes

Teams make predictable mistakes with SSO:

!!!error "🚫 SSO Anti-Patterns"
    **Using OAuth for Authentication**
    - OAuth is for authorization
    - Not designed to prove identity
    - Security vulnerabilities
    - Use OIDC instead
    
    **Implementing Custom SSO**
    - "We'll build our own"
    - Security vulnerabilities
    - Maintenance burden
    - Use standard protocols
    
    **Ignoring Token Security**
    - Storing tokens in localStorage
    - Long-lived tokens
    - No token rotation
    - Inadequate validation
    
    **Poor Session Management**
    - No logout functionality
    - Session fixation vulnerabilities
    - Inconsistent session lifetimes
    - No single logout

The most common mistake is using OAuth for authentication instead of OIDC. Developers see OAuth's popularity and try to authenticate users with access tokens. This creates security problems. Use OIDC for authentication—it's designed for that purpose.

## Real-World Examples

Seeing how organizations actually implement SSO clarifies the differences:

### Enterprise Intranet: Kerberos

A large corporation's intranet uses Kerberos:

!!!anote "🏢 Corporate Intranet"
    **Context**
    - 10,000 employees
    - Windows domain environment
    - Intranet applications
    - File shares and databases
    - Desktop applications
    
    **Implementation**
    - Active Directory as KDC
    - Windows Integrated Authentication
    - SPNEGO for web applications
    - Seamless desktop SSO
    - No additional logins
    
    **Why It Works**
    - Homogeneous Windows environment
    - Corporate network access
    - Desktop-focused workflows
    - Existing AD infrastructure
    - Transparent to users

Employees log into their workstations once. They access file shares, intranet sites, and desktop applications without additional authentication. Kerberos handles everything transparently. This works because the environment is controlled—Windows devices, corporate network, trusted applications.

### SaaS Integration: SAML

An enterprise integrating SaaS applications uses SAML:

!!!anote "☁️ SaaS Integration"
    **Context**
    - 5,000 employees
    - 50+ SaaS applications
    - Salesforce, Workday, ServiceNow, etc.
    - Need centralized access control
    - Compliance requirements
    
    **Implementation**
    - Okta as SAML IdP
    - SAML federation with each SaaS app
    - Employee portal for app access
    - Centralized provisioning
    - Audit logging
    
    **Why It Works**
    - SaaS vendors support SAML
    - Browser-based applications
    - Centralized authentication
    - Simplified access management
    - Compliance requirements met

Employees authenticate to Okta once, then access all SaaS applications without additional logins. IT manages access centrally—provision new employees, deprovision departing employees, enforce security policies. SAML enables this federation across organizational boundaries.

### Modern Web App: OIDC

A startup building a web application uses OIDC:

!!!anote "🚀 Modern Web Application"
    **Context**
    - SaaS product for businesses
    - Web and mobile applications
    - RESTful API backend
    - Microservices architecture
    - Need authentication and API authorization
    
    **Implementation**
    - Auth0 as OIDC provider
    - Authorization Code Flow with PKCE
    - JWT access tokens for API
    - Refresh token rotation
    - Standard OIDC libraries
    
    **Why It Works**
    - Modern architecture
    - Mobile and web support
    - API authorization built-in
    - Developer-friendly
    - Security best practices

Users authenticate with OIDC, receiving an ID Token and access token. The web app validates the ID Token for authentication. The mobile app uses the access token for API calls. Microservices validate JWT tokens. OIDC provides authentication and authorization in one protocol, fitting modern architectures perfectly.

## Security Considerations

SSO improves security but introduces new risks:

### Token Security

Tokens require careful handling:

!!!warning "⚠️ Token Security Best Practices"
    **Storage**
    - Never store tokens in localStorage
    - Use httpOnly cookies when possible
    - Encrypt tokens at rest
    - Clear tokens on logout
    
    **Transmission**
    - Always use HTTPS
    - Validate TLS certificates
    - Avoid tokens in URLs
    - Use secure headers
    
    **Validation**
    - Verify token signatures
    - Check expiration
    - Validate issuer
    - Verify audience
    
    **Rotation**
    - Short-lived access tokens
    - Refresh token rotation
    - Revocation mechanisms
    - Monitor for abuse

Tokens are bearer credentials—anyone with the token can use it. Storing tokens in localStorage exposes them to XSS attacks. Long-lived tokens increase risk if compromised. Always validate tokens properly—check signatures, expiration, issuer, and audience.

### Single Point of Failure

SSO creates a single point of failure:

!!!warning "⚠️ SSO Availability Risks"
    **The Problem**
    - IdP outage blocks all access
    - No fallback authentication
    - Business continuity risk
    - Dependency on external service
    
    **Mitigation**
    - High availability IdP deployment
    - Disaster recovery planning
    - Emergency access procedures
    - SLA monitoring
    - Consider multi-IdP setup

When your IdP goes down, users can't access anything. This makes IdP availability critical. Deploy IdPs with high availability, plan for disasters, and establish emergency access procedures. Some organizations deploy multiple IdPs for redundancy.

### Session Management

SSO complicates session management:

!!!warning "⚠️ Session Management Challenges"
    **Multiple Sessions**
    - IdP session
    - Application sessions
    - Different lifetimes
    - Logout complexity
    
    **Single Logout**
    - Logging out of one app
    - Should log out of all apps
    - Requires coordination
    - Often incomplete
    
    **Best Practices**
    - Implement single logout
    - Consistent session lifetimes
    - Clear session on browser close
    - Monitor active sessions

Users expect that logging out of one application logs them out of everything. Implementing this requires coordination between the IdP and all applications. Many SSO implementations handle login well but logout poorly, leaving sessions active after users think they've logged out.

## Conclusion

Single Sign-On evolved from corporate network authentication to cloud-native protocols over three decades. Kerberos provided secure network authentication in the 1980s. Windows Integrated Authentication extended this to desktop environments. SPNEGO bridged Windows authentication to web browsers. SAML enabled enterprise federation across organizational boundaries. OAuth solved API authorization and delegation. OpenID Connect unified authentication and authorization for modern applications.

Each technology emerged to solve specific problems in specific contexts. Kerberos works for corporate networks with Windows infrastructure. SAML works for enterprise SaaS integration with browser-based flows. OAuth works for API authorization and third-party integrations. OIDC works for modern web and mobile applications needing both authentication and authorization.

Common mistakes include using OAuth for authentication instead of OIDC, implementing custom SSO instead of using standard protocols, poor token security practices, and inadequate session management. These mistakes compromise security and create maintenance burdens.

The decision between SSO technologies depends on your context. Corporate intranets use Kerberos. Enterprise SaaS integrations use SAML. Modern web applications use OIDC. API integrations use OAuth. Many organizations use multiple protocols—SAML for legacy applications, OIDC for new development.

Security considerations include token security, single point of failure risks, and session management complexity. Tokens require careful storage, transmission, validation, and rotation. SSO creates availability dependencies that need mitigation. Session management across multiple applications requires coordination.

Real-world examples show Kerberos succeeding in corporate intranets, SAML succeeding in enterprise SaaS integration, and OIDC succeeding in modern web applications. Each technology excels in its appropriate context.

Before choosing an SSO technology, understand your requirements. What kind of applications do you have? Where do users access them? What security requirements exist? What infrastructure already exists? The answers to these questions matter more than opinions about which protocol is better.

The goal isn't perfect adherence to one protocol. The goal is secure, usable authentication that enables business objectives. Use protocols as tools, not goals. Choose based on your context, implement security best practices, and focus on user experience.

Whether you choose Kerberos, SAML, OAuth, or OIDC, remember: SSO is a tool for solving authentication problems, not an end in itself. Focus on outcomes—secure access, good user experience, operational efficiency. If the protocol helps achieve these outcomes, use it. If it doesn't, choose differently. That's what good security architecture actually means.
