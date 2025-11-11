---
title: "单点登录的演进：从 Kerberos 到 OIDC"
date: 2010-01-22
lang: zh-CN
categories: Cybersecurity
tags: [Security, Authentication, SSO, OAuth, OIDC, SAML, Kerberos]
excerpt: "单点登录承诺一次登录即可访问所有系统，但从 Windows 身份验证到现代 OAuth 流程的演进揭示了数十年的安全演变。了解何时使用每种协议，避免身份验证陷阱。"
thumbnail: /assets/security/lock.png
series: authentication
---

用户讨厌密码。他们忘记密码、重复使用密码、把密码写在便签上，并在被迫创建新密码时抱怨。组织也讨厌密码——它们产生服务台工单、造成安全漏洞、让用户感到沮丧。单点登录（SSO）作为解决方案应运而生：一次身份验证，访问所有系统。

这个承诺听起来很简单，但现实却很复杂。几十年来，出现了多种 SSO 技术，每种都在不同的场景中解决不同的问题。Windows 集成身份验证（WIA）在企业网络内工作。Kerberos 为分布式系统提供安全身份验证。SPNEGO 连接了 Windows 和 Web 应用程序。SAML 实现了企业联合。OAuth 革新了 API 授权。OpenID Connect（OIDC）最终统一了现代应用程序的身份验证和授权。

本文追溯 SSO 从 1980 年代网络身份验证到当今云原生协议的演进。理解这段历史揭示了为什么我们有这么多 SSO 标准、何时使用每一种，以及如何避免危及安全的常见身份验证错误。

### SSO 演进时间线

{% mermaid %}timeline
    title 单点登录演进
    section 1980年代
        1988 : Kerberos v4
             : MIT 开发基于票据的认证
             : 网络身份验证
    section 1990年代
        1993 : Kerberos v5
             : 增强安全性
        2000 : Windows 2000
             : 带 Kerberos 的 Active Directory
             : Web 的 SPNEGO
    section 2000年代
        2002 : SAML 1.0
             : 企业联合
        2005 : SAML 2.0
             : 成熟的企业 SSO
        2006 : OAuth 1.0
             : API 授权
    section 2010年代
        2012 : OAuth 2.0
             : 现代授权
        2014 : OpenID Connect
             : 身份验证 + 授权
             : 云原生 SSO
{% endmermaid %}

## 密码问题

在研究 SSO 解决方案之前，理解它们要解决的问题至关重要。密码在每个系统中都会产生摩擦和风险。

### 密码为何失败

密码最初似乎是个好主意：

!!!error "🚫 密码问题"
    **用户负担**
    - 记住数十个密码
    - 不同的复杂度要求
    - 频繁的过期策略
    - 密码重置摩擦
    
    **安全风险**
    - 跨系统重复使用密码
    - 为便于记忆使用弱密码
    - 钓鱼攻击窃取凭据
    - 凭据填充攻击
    
    **运营成本**
    - 服务台密码重置工单
    - 账户锁定问题
    - 配置复杂性
    - 审计跟踪缺口

典型的企业员工需要管理电子邮件、文件共享、数据库、Web 应用程序、VPN 和无数 SaaS 工具的密码。每个系统都有不同的要求——最小长度、特殊字符、过期期限。用户的反应是可预测的：他们重复使用密码、写下密码，或使用简单的模式，如"Password1"、"Password2"、"Password3"。

### SSO 愿景

单点登录解决了这些问题：

!!!success "✅ SSO 优势"
    **用户体验**
    - 每个会话只需验证一次
    - 访问所有授权系统
    - 减少密码疲劳
    - 更快的应用程序访问
    
    **安全改进**
    - 集中式身份验证
    - 更强的身份验证方法
    - 一致的安全策略
    - 更好的审计跟踪
    
    **运营效率**
    - 更少的服务台工单
    - 简化配置
    - 集中式访问控制
    - 减少管理开销

这个愿景很有吸引力：用户早上验证一次，然后无缝访问电子邮件、文件共享、数据库和 Web 应用程序，无需额外登录。安全性得到改善，因为身份验证在一个地方进行，具有强大的控制。运营简化，因为访问管理集中化。

## 早期 SSO：Kerberos 和 Windows

第一批实用的 SSO 实现出现在 1980 年代和 1990 年代，专为企业网络设计。

### Kerberos：网络身份验证协议

Kerberos 由 MIT 在 1980 年代开发，为分布式系统提供安全身份验证：

!!!anote "🎫 Kerberos 基础"
    **核心概念**
    - 基于票据的身份验证
    - 可信第三方（KDC）
    - 不通过网络发送密码
    - 相互身份验证
    
    **工作原理**
    1. 用户向 KDC 进行身份验证
    2. KDC 颁发票据授予票据（TGT）
    3. 用户使用 TGT 请求服务票据
    4. 用户向应用程序出示服务票据
    5. 应用程序通过 KDC 验证票据

Kerberos 解决了一个关键问题：如何在不发送密码的情况下跨网络验证用户身份。该协议使用对称密钥加密和可信的密钥分发中心（KDC）。"Kerberos"这个名字来自希腊神话——守卫冥界的三头犬，代表客户端、服务器和 KDC，它们共同保护身份验证的安全。

{% mermaid %}---
title: Kerberos 架构
---
flowchart TD
    User([用户])
    Client[客户端工作站]
    KDC[(密钥分发中心)]
    Service1[服务 A]
    Service2[服务 B]
    
    User -->|登录| Client
    Client <-->|1. 身份验证<br/>2. 获取 TGT| KDC
    Client <-->|请求服务票据| KDC
    Client -->|出示票据| Service1
    Client -->|出示票据| Service2
    Service1 -.->|验证| KDC
    Service2 -.->|验证| KDC
    
    style KDC fill:#f96,stroke:#333,stroke-width:3px
    style Client fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

!!!tip "📖 深入了解：Kerberos"
    有关 Kerberos 架构、身份验证流程、票据结构、安全考虑和实施指南的详细内容，请参阅[理解 Kerberos：网络身份验证详解](/zh-CN/2010/03/Understanding-Kerberos-Network-Authentication-Explained/)。

### Windows 集成身份验证

Microsoft 基于 Kerberos 构建了 Windows 域身份验证：

!!!anote "🪟 Windows 身份验证演进"
    **NTLM（NT LAN Manager）**
    - 挑战-响应协议
    - 无可信第三方
    - 易受中继攻击
    - 遗留协议，仍受支持
    
    **Active Directory 中的 Kerberos**
    - 自 Windows 2000 起默认使用
    - Active Directory 作为 KDC
    - 无缝桌面 SSO
    - 适用于 Windows 应用程序

Windows 集成身份验证（WIA）在企业网络内提供透明的 SSO。当你使用域凭据登录 Windows 工作站时，你使用 Kerberos 向 Active Directory 进行身份验证。你的工作站缓存票据。当你访问文件共享、内网网站或其他 Windows 集成应用程序时，你的工作站会自动出示相应的票据。你永远不会看到另一个登录提示——它就是这样工作的。

这种无缝体验为 SSO 设定了用户期望。员工想知道为什么他们的桌面应用程序无需额外身份验证就能工作，而 Web 应用程序却需要单独登录。

### SPNEGO：连接 Windows 和 Web

SPNEGO（简单和受保护的 GSSAPI 协商机制）将 Windows 身份验证扩展到 Web 浏览器：

!!!anote "🌐 SPNEGO 用于 Web SSO"
    **目的**
    - 将 Kerberos 扩展到 HTTP
    - 浏览器协商身份验证
    - 对用户透明
    - 内网 SSO
    
    **工作原理**
    1. 浏览器请求受保护的资源
    2. 服务器响应 WWW-Authenticate: Negotiate
    3. 浏览器请求 Kerberos 票据
    4. 浏览器在 Authorization 头中发送票据
    5. 服务器验证票据并授予访问权限
    
    **要求**
    - 加入域的工作站
    - 启用 Kerberos 的浏览器
    - 受信任区域中的服务器
    - 正确的 DNS/SPN 配置

SPNEGO 使内网 Web 应用程序能够使用 Windows 身份验证。员工访问公司门户时不会看到登录页面——浏览器使用他们的 Windows 凭据自动进行身份验证。这在企业网络内运行良好，但在网络外失败。远程员工、移动设备和外部合作伙伴无法使用 Windows 身份验证，这造成了后续协议将填补的空白。


## 企业联合：SAML

随着组织采用 Web 应用程序和云服务，他们需要超越企业网络的 SSO。SAML 成为企业联合标准。

### SAML 概述

安全断言标记语言（SAML）实现跨组织边界的 SSO：

!!!anote "🔐 SAML 核心概念"
    **实体**
    - 身份提供者（IdP）：验证用户身份
    - 服务提供者（SP）：提供应用程序
    - 用户：访问应用程序
    
    **关键特性**
    - 数字签名的 XML 断言
    - 基于浏览器的重定向流程
    - 跨组织边界工作
    - 成熟的企业标准


{% mermaid %}---
title: SAML 架构
---
flowchart TD
    User([用户])
    Browser[Web 浏览器]
    IdP[身份提供者<br/>ADFS/Okta]
    SP1[服务提供者 A]
    SP2[服务提供者 B]
    
    User -->|访问| Browser
    Browser <-->|1. 重定向到 IdP<br/>2. SAML 断言| IdP
    Browser -->|SAML 断言| SP1
    Browser -->|SAML 断言| SP2
    
    style IdP fill:#f96,stroke:#333,stroke-width:3px
    style Browser fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

SAML 将身份验证与应用程序访问分离。身份提供者（IdP）处理身份验证——验证你是谁。服务提供者（SP）信任 IdP 关于你身份的断言。当你访问启用 SAML 的应用程序时，它会将你重定向到组织的 IdP。你在 IdP 进行一次身份验证，IdP 会颁发 SAML 断言——一个数字签名的 XML 文档，说明你是谁以及你拥有哪些属性。

{% mermaid %}---
title: SAML 架构
---
flowchart TD
    User([用户])
    Browser[Web 浏览器]
    IdP[身份提供者<br/>ADFS/Okta]
    SP1[服务提供者 A]
    SP2[服务提供者 B]
    
    User -->|访问| Browser
    Browser <-->|1. 重定向到 IdP<br/>2. SAML 断言| IdP
    Browser -->|SAML 断言| SP1
    Browser -->|SAML 断言| SP2
    
    style IdP fill:#f96,stroke:#333,stroke-width:3px
    style Browser fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

### SAML 实践

SAML 成为企业 SSO 的标准：

!!!success "✅ SAML 优势"
    **企业采用**
    - 主要 SaaS 供应商支持
    - 跨组织边界工作
    - 成熟、广为理解的协议
    - 强大的安全属性
    
    **用例**
    - 员工访问 SaaS 应用程序
    - 合作伙伴联合
    - 客户联合（B2B）
    - 学术联合（Shibboleth）

组织部署 SAML 为员工提供对数十个 SaaS 应用程序的无缝访问。员工向企业 IdP（通常是 Active Directory Federation Services 或 Okta）进行一次身份验证，然后访问 Salesforce、Workday、ServiceNow 和其他应用程序，无需额外登录。

### SAML 局限性

尽管广泛采用，SAML 仍有局限性：

!!!error "🚫 SAML 挑战"
    **技术复杂性**
    - 基于 XML，冗长
    - 复杂的配置
    - 证书管理开销
    - 难以调试
    
    **移动和 API 局限性**
    - 专为基于浏览器的流程设计
    - 移动应用支持差
    - 不是为 API 授权设计
    - 需要浏览器重定向

SAML 适用于基于浏览器的企业应用程序，但在现代用例中遇到困难。移动应用无法轻松处理浏览器重定向。API 需要无需用户交互的授权。单页应用程序需要 JSON，而不是 XML。这些局限性为新协议创造了空间。

!!!tip "📖 深入了解：SAML"
    有关 SAML 架构、身份验证流程、安全最佳实践和实施指南的详细内容，请参阅[理解 SAML：企业联合���份验证详解](/zh-CN/2010/02/Understanding-SAML-Enterprise-Federation-Explained/)。


## API 革命：OAuth

随着 Web 应用程序演变为 API 驱动的架构，出现了一个新问题：如何在不共享密码的情况下授予第三方应用程序对用户资源的有限访问权限。

### 委托问题

在 OAuth 之前，应用程序使用密码共享：

!!!error "🚫 密码反模式"
    **问题**
    - 用户将密码提供给第三方应用
    - 应用拥有账户的完全访问权限
    - 无法在不更改密码的情况下撤销访问权限
    - 密码暴露给多方
    
    **示例**
    - 照片打印服务需要访问照片
    - 用户提供电子邮件密码
    - 服务下载所有电子邮件
    - 服务存储密码
    - 用户无法选择性撤销访问权限

这种模式很常见但很危险。用户与多个服务共享密码，每个服务都获得完全的账户访问权限。如果一个服务被攻破，所有服务都面临风险。用户无法在不更改密码并更新所有服务的情况下撤销对一个服务的访问权限。

### OAuth 2.0 解决方案

OAuth 2.0 解决了委托问题：

!!!anote "🔑 OAuth 核心概念"
    **实体**
    - 资源所有者：拥有数据的用户
    - 客户端：请求访问的应用程序
    - 授权服务器：颁发令牌
    - 资源服务器：托管受保护的资源
    
    **令牌**
    - 访问令牌：授予 API 访问权限
    - 刷新令牌：获取新的访问令牌
    - 范围：限制权限
    - 过期：限时访问
    
    **关键原则**
    - 永不共享密码
    - 授予有限访问权限
    - 可撤销的权限
    - 限时令牌

OAuth 实现了无需密码共享的委托。当照片打印服务需要访问你的照片时，它会将你重定向到照片服务的授权服务器。你进行身份验证并批准特定权限——"允许读取照片"。授权服务器向打印服务颁发访问令牌。此令牌授予有限访问权限（仅照片，不包括电子邮件）且时间有限。你可以随时撤销令牌，无需更改密码。

### OAuth 流程

OAuth 为不同场景定义了多种流程：

!!!anote "🔄 OAuth 授权类型"
    **授权码流程**
    - 用于带后端的 Web 应用程序
    - 最安全的流程
    - 使用客户端密钥
    - 推荐用于机密客户端
    
    **隐式流程**
    - 用于基于浏览器的应用（已弃用）
    - 无客户端密钥
    - URL 片段中的令牌
    - 安全问题导致弃用
    
    **客户端凭据流程**
    - 用于机器对机器
    - 无用户交互
    - 服务账户身份验证
    - 后端服务
    
    **资源所有者密码流程**
    - 用户向客户端提供凭据
    - 遗留迁移路径
    - 不推荐
    - 违背 OAuth 目的

授权码流程是黄金标准。客户端将用户重定向到授权服务器，接收授权码，然后使用其客户端密钥将该码交换为访问令牌。此流程使令牌远离浏览器并提供强大的安全性。

### OAuth 实践

OAuth 变得无处不在：

!!!success "✅ OAuth 采用"
    **消费者应用程序**
    - "使用 Google 登录"
    - "连接到 Facebook"
    - "授权 Twitter 访问"
    - 第三方集成
    
    **API 授权**
    - 微服务身份验证
    - 移动应用后端访问
    - 合作伙伴 API 访问
    - IoT 设备授权

OAuth 为网络上的"使用 Google 登录"按钮提供支持。它使 Spotify 能够发布到 Facebook，健身应用能够与健康平台同步，以及服务之间的无数集成。OAuth 的成功来自于用实用的解决方案解决真实问题——安全委托。

### OAuth 局限性

OAuth 解决了授权问题，但造成了身份验证混淆：

!!!error "🚫 OAuth 身份验证混淆"
    **OAuth 不是身份验证**
    - OAuth 授予对资源的访问权限
    - 不验证用户身份
    - 访问令牌不标识用户
    - 使用 OAuth 进行身份验证有风险
    
    **问题**
    - 开发人员误用 OAuth 进行登录
    - 出现安全漏洞
    - 没有标准的用户信息端点
    - 实现不一致

开发人员看到 OAuth 的成功并尝试将其用于身份验证。他们会获取访问令牌并假设它标识了用户。这造成了安全问题——访问令牌不是为证明身份而设计的。不同的提供者以不同的方式实现用户信息端点。生态系统需要在 OAuth 之上的标准身份验证层。


## 现代 SSO：OpenID Connect

OpenID Connect（OIDC）基于 OAuth 2.0 构建，提供标准化的身份验证。

### OIDC 概述

OpenID Connect 解决了 OAuth 未设计解决的身份验证问题：

!!!anote "🆔 OIDC 核心创新"
    **问题**
    - 开发人员误用 OAuth 进行身份验证
    - 访问令牌不是身份证明
    - 用户信息实现不一致
    - 安全漏洞
    
    **OIDC 解决方案**
    - 向 OAuth 添加 ID 令牌（JWT）
    - ID 令牌证明用户身份
    - 标准化用户信息
    - 结合身份验证 + 授权
    
    **关键优势**
    - JSON 而不是 XML
    - 移动和 API 友好
    - 简单的开发者体验
    - 现代架构支持

OIDC 通过添加 ID 令牌扩展了 OAuth——一个包含身份声明的 JWT。当你使用 OIDC 进行身份验证时，你会同时收到 ID 令牌（证明你是谁）和访问令牌（授予 API 访问权限）。这种明确的分离消除了混淆并提供了安全的身份验证。

{% mermaid %}---
title: OpenID Connect 架构
---
flowchart TD
    User([用户])
    Client[客户端应用程序<br/>Web/移动]
    AuthServer[授权服务器<br/>Auth0/Okta]
    API1[资源服务器<br/>用户 API]
    API2[资源服务器<br/>支付 API]
    API3[资源服务器<br/>数据 API]
    
    User -->|登录| Client
    Client <-->|1. 身份验证请求<br/>2. ID 令牌 + 访问令牌| AuthServer
    Client -->|访问令牌| API1
    Client -->|访问令牌| API2
    Client -->|访问令牌| API3
    API1 -.->|验证令牌| AuthServer
    API2 -.->|验证令牌| AuthServer
    API3 -.->|验证令牌| AuthServer
    
    style AuthServer fill:#f96,stroke:#333,stroke-width:3px
    style Client fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

### OIDC 实践

OIDC 成为现代 SSO 标准：

!!!success "✅ OIDC 采用"
    **用例**
    - Web 应用程序登录
    - 移动应用身份验证
    - API 授权
    - 微服务安全
    
    **提供者**
    - Auth0、Okta、Azure AD
    - Google Identity Platform
    - AWS Cognito
    - 自托管：Keycloak、ORY Hydra

OIDC 为跨 Web 应用、移动应用和 API 的现代身份验证提供支持。开发人员使用标准库进行集成，避免自定义身份验证代码。

### OIDC vs SAML

!!!tip "🎯 OIDC vs SAML 决策"
    **选择 SAML 当：**
    - 遗留企业应用集成
    - 供应商仅支持 SAML
    - 现有 SAML 基础设施
    
    **选择 OIDC 当：**
    - 构建新应用程序
    - 移动应用身份验证
    - 需要 API 授权
    - 现代架构
    
    **现实：**
    - 许多 IdP 同时支持两者
    - 新项目使用 OIDC
    - 保留 SAML 用于遗留集成

SAML 不会消失，但新项目应该使用 OIDC。它更简单、更灵活，更适合现代架构。

!!!tip "📖 深入了解：OpenID Connect"
    有关 OIDC 架构、身份验证流程、ID 令牌、安全最佳实践和实施指南的详细内容，请参阅[OpenID Connect：现代身份验证详解](/zh-CN/2014/11/OpenID-Connect-Modern-Authentication-Explained/)。


## 选择正确的 SSO 技术

有多种 SSO 技术可用，如何选择？

### 决策框架

使用此框架指导你的选择：

!!!tip "🎯 SSO 技术选择"
    **Kerberos/WIA 适用于：**
    - 纯 Windows 环境
    - 企业网络访问
    - 桌面应用程序
    - 内网网站
    - 无需外部访问
    
    **SPNEGO 适用于：**
    - 将 Kerberos 扩展到 Web
    - 内网应用程序
    - Windows 集成身份验证
    - 加入域的设备
    
    **SAML 适用于：**
    - 企业 SaaS 集成
    - 供应商要求 SAML
    - B2B 联合
    - 遗留应用程序支持
    - 仅基于浏览器的流程
    
    **OAuth 适用于：**
    - API 授权
    - 第三方集成
    - 委托访问
    - 不需要身份验证
    
    **OIDC 适用于：**
    - 现代 Web 应用程序
    - 移动应用程序
    - API 授权 + 身份验证
    - 微服务
    - 新开发

决策取决于你的环境。企业内网可能使用 Kerberos。企业 SaaS 集成使用 SAML。现代 Web 应用程序使用 OIDC。API 集成使用 OAuth。

### 常见错误

团队在 SSO 方面犯了可预测的错误：

!!!error "🚫 SSO 反模式"
    **使用 OAuth 进行身份验证**
    - OAuth 用于授权
    - 不是为证明身份而设计
    - 安全漏洞
    - 改用 OIDC
    
    **实现自定义 SSO**
    - "我们自己构建"
    - 安全漏洞
    - 维护负担
    - 使用标准协议
    
    **忽略令牌安全**
    - 在 localStorage 中存储令牌
    - 长期令牌
    - 无令牌轮换
    - 验证不足
    
    **会话管理不当**
    - 无注销功能
    - 会话固定漏洞
    - 会话生命周期不一致
    - 无单点注销

最常见的错误是使用 OAuth 进行身份验证而不是 OIDC。开发人员看到 OAuth 的流行并尝试使用访问令牌验证用户身份。这会造成安全问题。使用 OIDC 进行身份验证——它是为此目的而设计的。

## 真实案例

看看组织如何实际实现 SSO 可以澄清差异：

### 企业内网：Kerberos

一家大型公司的内网使用 Kerberos：

!!!anote "🏢 企业内网"
    **环境**
    - 10,000 名员工
    - Windows 域环境
    - 内网应用程序
    - 文件共享和数据库
    - 桌面应用程序
    
    **实现**
    - Active Directory 作为 KDC
    - Windows 集成身份验证
    - Web 应用程序的 SPNEGO
    - 无缝桌面 SSO
    - 无需额外登录
    
    **为何有效**
    - 同质 Windows 环境
    - 企业网络访问
    - 以桌面为中心的工作流程
    - 现有 AD 基础设施
    - 对用户透明

员工登录工作站一次。他们访问文件共享、内网站点和桌面应用程序，无需额外身份验证。Kerberos 透明地处理一切。这之所以有效，是因为环境受控——Windows 设备、企业网络、受信任的应用程序。

### SaaS 集成：SAML

一家企业集成 SaaS 应用程序使用 SAML：

!!!anote "☁️ SaaS 集成"
    **环境**
    - 5,000 名员工
    - 50+ SaaS 应用程序
    - Salesforce、Workday、ServiceNow 等
    - 需要集中访问控制
    - 合规要求
    
    **实现**
    - Okta 作为 SAML IdP
    - 与每个 SaaS 应用的 SAML 联合
    - 员工门户用于应用访问
    - 集中配置
    - 审计日志
    
    **为何有效**
    - SaaS 供应商支持 SAML
    - 基于浏览器的应用程序
    - 集中式身份验证
    - 简化访问管理
    - 满足合规要求

员工向 Okta 进行一次身份验证，然后访问所有 SaaS 应用程序，无需额外登录。IT 集中管理访问——配置新员工、取消配置离职员工、执行安全策略。SAML 实现了跨组织边界的联合。

### 现代 Web 应用：OIDC

一家初创公司构建 Web 应用程序使用 OIDC：

!!!anote "🚀 现代 Web 应用程序"
    **环境**
    - 面向企业的 SaaS 产品
    - Web 和移动应用程序
    - RESTful API 后端
    - 微服务架构
    - 需要身份验证和 API 授权
    
    **实现**
    - Auth0 作为 OIDC 提供者
    - 带 PKCE 的授权码流程
    - API 的 JWT 访问令牌
    - 刷新令牌轮换
    - 标准 OIDC 库
    
    **为何有效**
    - 现代架构
    - 移动和 Web 支持
    - 内置 API 授权
    - 开发者友好
    - 安全最佳实践

用户使用 OIDC 进行身份验证，接收 ID 令牌和访问令牌。Web 应用验证 ID 令牌进行身份验证。移动应用使用访问令牌进行 API 调用。微服务验证 JWT 令牌。OIDC 在一个协议中提供身份验证和授权，完美适合现代架构。

## 安全考虑

SSO 提高了安全性，但也引入了新风险：

### 令牌安全

令牌需要小心处理：

!!!warning "⚠️ 令牌安全最佳实践"
    **存储**
    - 永不在 localStorage 中存储令牌
    - 尽可能使用 httpOnly cookie
    - 静态加密令牌
    - 注销时清除令牌
    
    **传输**
    - 始终使用 HTTPS
    - 验证 TLS 证书
    - 避免在 URL 中使用令牌
    - 使用安全头
    
    **验证**
    - 验证令牌签名
    - 检查过期时间
    - 验证颁发者
    - 验证受众
    
    **轮换**
    - 短期访问令牌
    - 刷新令牌轮换
    - 撤销机制
    - 监控滥用

令牌是持有者凭据——任何拥有令牌的人都可以使用它。在 localStorage 中存储令牌会使其暴露于 XSS 攻击。长期令牌在被攻破时会增加风险。始终正确验证令牌——检查签名、过期时间、颁发者和受众。

### 单点故障

SSO 创建了单点故障：

!!!warning "⚠️ SSO 可用性风险"
    **问题**
    - IdP 中断阻止所有访问
    - 无后备身份验证
    - 业务连续性风险
    - 依赖外部服务
    
    **缓解**
    - 高可用性 IdP 部署
    - 灾难恢复计划
    - 紧急访问程序
    - SLA 监控
    - 考虑多 IdP 设置

当你的 IdP 宕机时，用户无法访问任何内容。这使得 IdP 可用性至关重要。部署具有高可用性的 IdP，规划灾难，并建立紧急访问程序。一些组织部署多个 IdP 以实现冗余。

### 会话管理

SSO 使会话管理复杂化：

!!!warning "⚠️ 会话管理挑战"
    **多个会话**
    - IdP 会话
    - 应用程序会话
    - 不同的生命周期
    - 注销复杂性
    
    **单点注销**
    - 从一个应用注销
    - 应该从所有应用注销
    - 需要协调
    - 通常不完整
    
    **最佳实践**
    - 实现单点注销
    - 一致的会话生命周期
    - 浏览器关闭时清除会话
    - 监控活动会话

用户期望从一个应用程序注销会从所有应用程序注销。实现这一点需要 IdP 和所有应用程序之间的协调。许多 SSO 实现处理登录很好，但注销很差，在用户认为已注销后仍保持会话活动。

## 结论

单点登录在三十年间从企业网络身份验证演变为云原生协议。Kerberos 在 1980 年代提供了安全的网络身份验证。Windows 集成身份验证将其扩展到桌面环境。SPNEGO 将 Windows 身份验证桥接到 Web 浏览器。SAML 实现了跨组织边界的企业联合。OAuth 解决了 API 授权和委托。OpenID Connect 统一了现代应用程序的身份验证和授权。

每种技术都是为了解决特定环境中的特定问题而出现的。Kerberos 适用于具有 Windows 基础设施的企业网络。SAML 适用于具有基于浏览器流程的企业 SaaS 集成。OAuth 适用于 API 授权和第三方集成。OIDC 适用于需要身份验证和授权的现代 Web 和移动应用程序。

常见错误包括使用 OAuth 进行身份验证而不是 OIDC、实现自定义 SSO 而不是使用标准协议、令牌安全实践不当以及会话管理不足。这些错误会危及安全性并造成维护负担。

SSO 技术之间的决策取决于你的环境。企业内网使用 Kerberos。企业 SaaS 集成使用 SAML。现代 Web 应用程序使用 OIDC。API 集成使用 OAuth。许多组织使用多种协议——对遗留应用程序使用 SAML，对新开发使用 OIDC。

安全考虑包括令牌安全、单点故障风险和会话管理复杂性。令牌需要小心存储、传输、验证和轮换。SSO 创建了需要缓解的可用性依赖关系。跨多个应用程序的会话管理需要协调。

真实案例显示 Kerberos 在企业内网中成功、SAML 在企业 SaaS 集成中成功、OIDC 在现代 Web 应用程序中成功。每种技术在其适当的环境中都表现出色。

在选择 SSO 技术之前，了解你的需求。你有什么类型的应用程序？用户在哪里访问它们？存在哪些安全要求？已经存在什么基础设施？这些问题的答案比关于哪种协议更好的意见更重要。

目标不是完美遵守一种协议。目标是实现业务目标的安全、可用的身份验证。将协议用作工具，而不是目标。根据你的环境进行选择，实施安全最佳实践，并专注于用户体验。

无论你选择 Kerberos、SAML、OAuth 还是 OIDC，请记住：SSO 是解决身份验证问题的工具，而不是目的本身。专注于结果——安全访问、良好的用户体验、运营效率。如果协议有助于实现这些结果，就使用它。如果没有，就选择不同的。这才是良好安全架构的真正含义。
