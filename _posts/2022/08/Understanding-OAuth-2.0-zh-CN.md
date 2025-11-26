---
title: "理解 OAuth 2.0：驱动现代 API 的授权框架"
date: 2022-08-16
lang: zh-CN
categories: Development
tags: [Security, OAuth, API, Authentication]
excerpt: "OAuth 2.0 实现安全的委托访问而无需共享密码。了解授权流程如何运作、常见陷阱，以及为什么 OAuth 不是身份验证。"
thumbnail: /assets/security/lock.png
---

OAuth 2.0 已成为 API 授权的事实标准，从社交媒体登录到企业 API 访问无所不在。然而尽管如此普及，OAuth 仍被广泛误解。开发者经常混淆授权与身份验证、错误实现流程，或以危害安全的方式误用访问令牌。

本文通过检视核心概念、授权流程和安全考量来揭开 OAuth 2.0 的神秘面纱。我们将追踪令牌在不同授权类型中的旅程，理解各方角色，并识别常见的实现错误。通过图表和真实场景，您将获得对 OAuth 如何在提供无缝用户体验的同时保护资源的实用理解。

## OAuth 2.0 实际解决的问题

在 OAuth 之前，需要访问第三方服务上用户数据的应用程序面临一个根本问题：它们需要用户分享密码。这造成了多重安全性和可用性问题。

### OAuth 之前的问题

考虑一个需要访问您存储在云端存储平台上照片的照片打印服务：

!!!error "🚫 密码分享问题"
    **传统方法**
    - 用户向打印服务提供云端存储的用户名和密码
    - 打印服务存储凭证（安全风险）
    - 打印服务拥有对所有用户数据的完整访问权
    - 无法限制访问范围或持续时间
    - 密码更改会中断所有集成服务
    - 无法审计哪个服务访问了什么
    
    **安全影响**
    - 凭证暴露给第三方
    - 无细粒度权限控制
    - 无法在不更改密码的情况下撤销访问权
    - 违反最小权限原则
    - 显著增加攻击面

OAuth 2.0 通过引入委托授权来解决这个问题：用户可以在不分享凭证的情况下授予对其资源的有限访问权。

### OAuth 的核心创新

OAuth 将身份验证（证明您是谁）与授权（授予资源访问权）分离：

!!!success "✅ OAuth 授权模型"
    **委托访问**
    - 用户直接向资源拥有者进行身份验证（例如云端存储）
    - 用户为第三方应用程序授权特定权限
    - 应用程序接收有时限的访问令牌
    - 令牌仅授予请求的权限
    - 用户可随时撤销访问权而无需更改密码
    
    **主要优势**
    - 无需密码分享
    - 细粒度权限范围
    - 有时限的访问令牌
    - 每个应用程序独立撤销
    - 清楚的访问授权审计轨迹

这个模型实现了现代 API 生态系统，让应用程序能够无缝集成同时维持安全边界。

## OAuth 2.0 角色和组件

OAuth 定义了四个参与授权流程的不同角色：

!!!anote "🎭 OAuth 角色"
    **资源拥有者**
    - 拥有数据的用户
    - 授权访问其资源
    - 示例：您，授权打印服务访问您的照片
    
    **客户端**
    - 请求访问资源的应用程序
    - 必须向授权服务器注册
    - 示例：照片打印服务应用程序
    
    **授权服务器**
    - 在验证资源拥有者身份后发行访问令牌
    - 验证授权许可
    - 示例：云端存储提供商的 OAuth 服务器
    
    **资源服务器**
    - 托管受保护的资源
    - 验证访问令牌并提供请求服务
    - 示例：提供照片文件的云端存储 API

这些角色通过一系列明确定义的流程互动，每个流程都针对不同的应用程序类型和安全需求进行优化。
## 授权码流程：黄金标准

授权码流程是最安全的 OAuth 流程，建议用于能够安全存储客户端密钥的应用程序。

### 流程概览

```mermaid
sequenceDiagram
    participant User as 👤 资源拥有者
    participant Browser as 🌐 浏览器
    participant Client as 📱 客户端应用程序
    participant AuthServer as 🔐 授权服务器
    participant ResourceServer as 💾 资源服务器

    User->>Browser: 1. 点击「连接账户」
    Browser->>AuthServer: 2. 授权请求<br/>(client_id, redirect_uri, scope)
    AuthServer->>User: 3. 显示登录和同意画面
    User->>AuthServer: 4. 验证身份并批准
    AuthServer->>Browser: 5. 重定向并附带授权码
    Browser->>Client: 6. 授权码
    Client->>AuthServer: 7. 交换授权码获得令牌<br/>(code, client_id, client_secret)
    AuthServer->>Client: 8. 访问令牌 + 刷新令牌
    Client->>ResourceServer: 9. 使用访问令牌的 API 请求
    ResourceServer->>Client: 10. 受保护的资源数据
```

### 逐步分解

!!!anote "📋 授权码流程步骤"
    **1. 用户启动授权**
    - 用户在客户端应用程序中点击「使用 [服务] 连接」
    - 客户端将用户重定向至授权服务器
    
    **2. 授权请求**
    - response_type=code：请求授权码
    - client_id：识别客户端应用程序
    - redirect_uri：发送授权码的位置
    - scope：请求的权限
    - state：CSRF 保护令牌
    
    **3. 用户身份验证和同意**
    - 授权服务器验证用户身份（登录画面）
    - 显示包含请求权限的同意画面
    - 用户批准或拒绝访问
    
    **4. 发行授权码**
    - 短期授权码（通常 10 分钟）
    - 通过浏览器重定向返回
    - 仅限单次使用
    
    **5. 令牌交换**
    - 客户端交换授权码获得令牌
    - 包含客户端密钥（服务器对服务器）
    - 授权码被消耗并失效
    
    **6. 访问令牌响应**
    - 用于 API 请求的访问令牌
    - 用于获得新访问令牌的刷新令牌
    - 以秒为单位的过期时间
    
    **7. API 访问**
    - 客户端在请求中包含访问令牌
    - 资源服务器验证令牌
    - 返回受保护的资源

**授权请求示例：**
```
GET /authorize?
  response_type=code&
  client_id=CLIENT_ID&
  redirect_uri=https://client.app/callback&
  scope=read:photos&
  state=RANDOM_STRING
```

**授权码响应：**
```
HTTP/1.1 302 Found
Location: https://client.app/callback?
  code=AUTHORIZATION_CODE&
  state=RANDOM_STRING
```

**令牌交换请求：**
```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=https://client.app/callback&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET
```

**访问令牌响应：**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "read:photos"
}
```

**API 访问示例：**
```
GET /api/photos
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### 为什么这个流程是安全的

授权码流程提供多层安全保护：

!!!success "🔒 安全功能"
    **关注点分离**
    - 授权码暴露给浏览器（较不敏感）
    - 访问令牌从不暴露给浏览器
    - 客户端密钥仅用于服务器对服务器通信
    
    **短期凭证**
    - 授权码快速过期（10 分钟）
    - 授权码仅限单次使用
    - 访问令牌有时限（通常 1 小时）
    
    **CSRF 保护**
    - state 参数防止跨站请求伪造
    - 客户端验证 state 符合原始请求
    
    **客户端身份验证**
    - 客户端密钥在令牌交换期间证明客户端身份
    - 防止授权码拦截攻击

这个流程适用于网络应用程序、具有后端服务器的移动应用程序，以及任何能够保护客户端密钥的场景。

## 隐式流程：已弃用且危险

隐式流程是为无法安全存储客户端密钥的浏览器应用程序设计的。然而，由于安全漏洞，它已被弃用。

### 隐式流程如何运作

```mermaid
sequenceDiagram
    participant User as 👤 资源拥有者
    participant Browser as 🌐 浏览器/SPA
    participant AuthServer as 🔐 授权服务器
    participant ResourceServer as 💾 资源服务器

    User->>Browser: 1. 点击「登录」
    Browser->>AuthServer: 2. 授权请求<br/>(response_type=token)
    AuthServer->>User: 3. 验证身份并同意
    AuthServer->>Browser: 4. 重定向并附带访问令牌<br/>(在 URL 片段中)
    Browser->>Browser: 5. 从 URL 提取令牌
    Browser->>ResourceServer: 6. 使用令牌的 API 请求
    ResourceServer->>Browser: 7. 受保护的资源
```

### 为什么隐式流程被弃用

!!!error "🚫 隐式流程安全问题"
    **访问令牌暴露**
    - 令牌在 URL 片段中返回
    - 在浏览器历史记录中可见
    - 记录在服务器访问日志中
    - 暴露给浏览器扩展
    - 容易受到 XSS 攻击
    
    **无客户端身份验证**
    - 无客户端密钥验证
    - 无法验证客户端身份
    - 更容易伪装客户端
    
    **无刷新令牌**
    - 无法安全发行刷新令牌
    - 令牌过期时用户必须重新验证
    - 用户体验不佳
    
    **令牌泄漏途径**
    - Referrer 标头可能泄漏令牌
    - 浏览器历史记录存储令牌
    - 共用计算机暴露令牌
    - 无安全存储机制

现代应用程序应该使用带有 PKCE 的授权码流程。

## PKCE：保护公开客户端

代码交换证明密钥（PKCE，发音为「pixie」）扩展了授权码流程，以保护无法存储密钥的公开客户端。

### 公开客户端问题

移动应用程序和单页应用程序面临根本挑战：

!!!warning "⚠️ 公开客户端挑战"
    **无法安全存储密钥**
    - 移动应用程序代码可以被反编译
    - JavaScript 源代码在浏览器中可见
    - 无客户端密钥的安全存储
    - 密钥会暴露给所有用户
    
    **授权码拦截**
    - 恶意应用程序可以注册相同的重定向 URI
    - 授权码被攻击者拦截
    - 攻击者交换授权码获得令牌
    - 无客户端密钥来防止这种情况

PKCE 通过添加无法预先提取的动态、每次请求密钥来解决这个问题。
### PKCE 流程

```mermaid
sequenceDiagram
    participant User as 👤 资源拥有者
    participant Client as 📱 移动应用程序/SPA
    participant AuthServer as 🔐 授权服务器
    participant ResourceServer as 💾 资源服务器

    Client->>Client: 1. 生成 code_verifier<br/>(随机字符串)
    Client->>Client: 2. 创建 code_challenge<br/>(验证器的 SHA256 哈希)
    User->>Client: 3. 启动登录
    Client->>AuthServer: 4. 授权请求<br/>(code_challenge, method)
    AuthServer->>User: 5. 验证身份并同意
    AuthServer->>Client: 6. 授权码
    Client->>AuthServer: 7. 令牌请求<br/>(code, code_verifier)
    AuthServer->>AuthServer: 8. 验证 code_challenge<br/>符合 code_verifier
    AuthServer->>Client: 9. 访问令牌
    Client->>ResourceServer: 10. API 请求
    ResourceServer->>Client: 11. 受保护的资源
```

### PKCE 实现细节

!!!anote "🔐 PKCE 参数"
    **代码验证器**
    - 随机字符串：43-128 个字符
    - 密码学随机
    - 每次授权请求都重新生成
    - 示例：dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    
    **代码挑战**
    - 代码验证器的 SHA256 哈希（建议）
    - 或纯文本代码验证器（不建议）
    - 在授权请求中发送
    - 示例：E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    
    **服务器验证过程**
    - 授权服务器将 code_challenge 与授权码一起存储
    - 在令牌交换期间验证 code_verifier 符合
    - 防止授权码拦截攻击
    - 公式：SHA256(code_verifier) == stored_code_challenge

**PKCE 授权请求：**
```
GET /authorize?
  response_type=code&
  client_id=CLIENT_ID&
  redirect_uri=https://app.example.com/callback&
  scope=read:photos&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

**PKCE 令牌请求：**
```
POST /token

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=https://app.example.com/callback&
client_id=CLIENT_ID&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### 为什么 PKCE 有效

!!!success "✅ PKCE 安全优势"
    **动态密钥**
    - 每次请求生成代码验证器
    - 无法从应用程序预先提取
    - 攻击者无法预测或重复使用验证器
    
    **授权码绑定**
    - 代码挑战将授权码绑定到客户端实例
    - 被拦截的授权码在没有代码验证器的情况下无用
    - 只有启动流程的客户端才能交换授权码
    
    **无需存储密钥**
    - 不需要客户端密钥
    - 对移动应用程序和 SPA 安全
    - 在不存储密钥的情况下维持安全性
    
    **向后兼容**
    - 与现有 OAuth 服务器兼容（如果支持）
    - 可与客户端密钥一起使用
    - 现在建议所有 OAuth 客户端使用

PKCE 现在建议所有 OAuth 客户端使用，包括能够存储密钥的机密客户端，作为额外的安全层。

## 客户端凭证流程：服务对服务

客户端凭证流程是为不涉及用户的机器对机器通信设计的。

### 何时使用客户端凭证

!!!anote "🤖 客户端凭证使用案例"
    **后端服务**
    - 微服务之间的通信
    - 访问 API 的计划作业
    - 服务器对服务器集成
    - 不需要用户上下文
    
    **特征**
    - 客户端代表自己行动
    - 不涉及资源拥有者
    - 客户端凭证就是授权
    - 通常是长期或缓存的令牌

### 客户端凭证流程

```mermaid
sequenceDiagram
    participant Client as 🖥️ 客户端服务
    participant AuthServer as 🔐 授权服务器
    participant ResourceServer as 💾 资源服务器

    Client->>AuthServer: 1. 令牌请求<br/>(client_id, client_secret, scope)
    AuthServer->>AuthServer: 2. 验证客户端凭证
    AuthServer->>Client: 3. 访问令牌
    Client->>ResourceServer: 4. 使用令牌的 API 请求
    ResourceServer->>Client: 5. 受保护的资源
```

### 实现

!!!anote "📋 客户端凭证实现"
    **令牌请求过程**
    - 向授权服务器发送客户端凭证
    - 包含请求的范围
    - 直接接收访问令牌
    
    **令牌响应内容**
    - 用于 API 请求的访问令牌
    - 令牌类型（通常为 Bearer）
    - 以秒为单位的过期时间
    - 授予的范围
    
    **API 请求使用**
    - 在 Authorization 标头中包含访问令牌
    - 使用 Bearer 令牌格式
    - 资源服务器验证令牌

**客户端凭证令牌请求：**
```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET&
scope=api:read api:write
```

**令牌响应：**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read api:write"
}
```

**API 请求：**
```
GET /api/resources
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

这个流程很直接，但需要安全存储客户端凭证，且应该只用于服务对服务通信。

## 常见的 OAuth 误解

OAuth 经常被误解，导致安全漏洞和实现错误。

### OAuth 不是身份验证

最常见的误解是 OAuth 提供身份验证。它并不提供。

!!!error "🚫 OAuth ≠ 身份验证"
    **OAuth 提供什么**
    - 授权：访问资源的权限
    - 委托的 API 访问
    - 范围权限
    
    **OAuth 不提供什么**
    - 用户身份验证
    - 用户身份验证
    - 身份信息
    
    **问题**
    - 访问令牌证明授权，不是身份
    - 令牌可能发行给不同用户
    - 没有标准方式获得用户信息
    - 容易受到令牌替换攻击

### 「使用 OAuth 登录」反模式

许多应用程序仅使用 OAuth 实现「使用 [服务] 登录」：

**不安全的实现示例：**
```javascript
// 不安全：不要这样做
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const token = await exchangeCodeForToken(code);
  
  // 假设令牌属于合法用户
  const user = await getUserFromToken(token);
  req.session.userId = user.id; // 有漏洞
});
```

!!!warning "⚠️ 不安全的 OAuth 登录模式"
    **有缺陷的实现**
    - 应用程序交换授权码获得访问令牌
    - 假设令牌属于合法用户
    - 直接使用令牌设置会话（有漏洞）
    
    **攻击场景**
    - 攻击者获得其账户的有效访问令牌
    - 攻击者诱骗受害者使用攻击者的令牌
    - 受害者以攻击者身份登录
    - 受害者的行动归因于攻击者的账户
    - 数据泄漏和账户混淆

### 使用 OpenID Connect 进行身份验证

OpenID Connect (OIDC) 扩展 OAuth 2.0 以提供身份验证：

!!!success "✅ OpenID Connect 解决方案"
    **OIDC 添加什么**
    - ID 令牌：包含用户身份声明的 JWT
    - UserInfo 端点：标准化的用户信息
    - 身份验证验证
    - 标准化声明（sub、name、email 等）

**安全实现：**
```javascript
// 安全：使用 OpenID Connect
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const tokens = await exchangeCodeForTokens(code);
  
  // 验证 ID 令牌签名和声明
  const idToken = await verifyIdToken(tokens.id_token);
  
  // ID 令牌包含已验证的用户身份
  req.session.userId = idToken.sub;
  req.session.email = idToken.email;
});
```

**ID 令牌结构：**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user123",
  "aud": "client_id",
  "exp": 1661529600,
  "iat": 1661526000,
  "email": "user@example.com",
  "email_verified": true
}
```

使用 OAuth 2.0 进行 API 授权。使用 OpenID Connect 进行用户身份验证。
## 令牌安全最佳实践

访问令牌是持有者令牌——任何拥有令牌的人都可以使用它。适当的令牌处理至关重要。

!!!anote "🔒 令牌安全指南"
    **存储**
    - 永远不要将令牌存储在 localStorage（容易受到 XSS 攻击）
    - 对网络应用程序使用 httpOnly cookies
    - 在移动设备上使用安全存储 API（Keychain、KeyStore）
    - 如果存储在数据库中，请加密令牌
    
    **传输**
    - 始终使用 HTTPS/TLS
    - 在 Authorization 标头中包含令牌，不要在 URL 中
    - 永远不要在应用程序日志中记录令牌
    - 避免在查询参数中发送令牌
    
    **验证**
    - 验证令牌签名（对于 JWT）
    - 检查令牌过期
    - 验证令牌受众和发行者
    - 验证令牌范围符合所需权限
    
    **生命周期管理**
    - 使用短期访问令牌（通常 1 小时）
    - 实现刷新令牌轮换
    - 登出时撤销令牌
    - 监控令牌重复使用尝试
    
    **范围原则**
    - 请求最少必要的范围
    - 在资源服务器上验证范围
    - 不要授予过多权限
    - 实现基于范围的访问控制

## 刷新令牌：延长访问

刷新令牌实现长期访问，而无需用户频繁重新验证。

### 刷新令牌流程

```mermaid
sequenceDiagram
    participant Client as 📱 客户端应用程序
    participant AuthServer as 🔐 授权服务器
    participant ResourceServer as 💾 资源服务器

    Client->>ResourceServer: 1. 使用访问令牌的 API 请求
    ResourceServer->>Client: 2. 401 未授权（令牌过期）
    Client->>AuthServer: 3. 刷新令牌请求<br/>(refresh_token, client_id)
    AuthServer->>AuthServer: 4. 验证刷新令牌
    AuthServer->>Client: 5. 新访问令牌 + 新刷新令牌
    Client->>ResourceServer: 6. 使用新令牌的 API 请求
    ResourceServer->>Client: 7. 受保护的资源
```

### 刷新令牌安全

!!!warning "⚠️ 刷新令牌风险"
    **高价值目标**
    - 长期凭证（数天到数月）
    - 可以生成新的访问令牌
    - 对攻击者比访问令牌更有价值
    - 需要更强的保护
    
    **安全措施**
    - 刷新令牌轮换：每次使用时发行新的刷新令牌
    - 检测刷新令牌重复使用（表示被盗）
    - 将刷新令牌绑定到客户端
    - 在可疑活动时撤销令牌系列
    - 安全存储刷新令牌（加密）
    - 实现刷新令牌过期
    
    **刷新令牌轮换**
    ```
    请求：  refresh_token=OLD_TOKEN
    响应：   access_token=NEW_ACCESS
            refresh_token=NEW_REFRESH
    
    旧刷新令牌立即失效
    重复使用旧令牌触发安全警报
    ```

刷新令牌轮换现在被认为是最佳实践，防止令牌重放攻击并限制令牌被盗的损害。

## 结论

OAuth 2.0 提供了一个强大的委托授权框架，使应用程序能够在不分享密码的情况下访问用户资源。通过将授权与身份验证分离，OAuth 创建了清楚的安全边界，同时实现了现代 API 生态系统。

带有 PKCE 的授权码流程代表了大多数应用程序的当前最佳实践，为机密和公开客户端提供强大的安全性。已弃用的隐式流程应该完全避免。客户端凭证流程服务于不涉及用户的机器对机器场景。每个流程都解决特定的安全需求和应用程序架构。

理解 OAuth 提供授权而非身份验证是至关重要的。需要用户身份验证的应用程序应该使用 OpenID Connect，它以标准化身份验证扩展 OAuth。将 OAuth 访问令牌视为身份证明会造成严重的安全漏洞。

令牌安全需要仔细注意存储、传输、验证和生命周期管理。访问令牌应该是短期的，通过 HTTPS 传输，并安全存储。刷新令牌作为长期且强大的凭证，需要更强的保护，包括轮换和重复使用检测。

OAuth 2.0 不是单一协议，而是为不同场景提供多种流程的框架。选择适当的流程、正确实现，并遵循安全最佳实践，对于构建安全、用户友好的应用程序至关重要。OAuth 的复杂性反映了它所解决的安全问题的复杂性——在不分享凭证的情况下进行委托访问本质上是具有挑战性的，而 OAuth 为这些挑战提供了经过实战考验的解决方案。