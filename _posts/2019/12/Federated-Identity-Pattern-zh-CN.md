---
title: "联合身份识别：一次登录，畅行无阻"
date: 2019-12-15
categories:
  - Architecture
series: architecture_pattern
excerpt: "将身份验证委托给外部身份识别提供者，简化开发流程、降低管理负担，并改善跨多个应用程序和组织的用户体验。"
lang: zh-CN
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

想象一下，你需要为每栋建筑物携带不同的钥匙——办公室、健身房、图书馆、公寓。现在想象你有一把万能钥匙可以通行所有地方，但每栋建筑物仍然控制谁可以进入。这就是联合身份识别的本质：一组凭证，在多个系统间受信任，而每个系统仍保有控制权限的能力。

## 挑战：太多密码，太多问题

在当今互联的世界中，用户需要使用来自多个组织的应用程序——他们的雇主、业务合作伙伴、云服务提供者和第三方工具。传统上，每个应用程序都需要自己的身份验证系统。

### 传统做法：到处都是独立凭证

```javascript
// 每个应用程序管理自己的用户
class TraditionalAuthSystem {
  constructor() {
    this.users = new Map();
  }
  
  async register(username, password, email) {
    // 将凭证存储在应用程序数据库中
    const hashedPassword = await this.hashPassword(password);
    this.users.set(username, {
      password: hashedPassword,
      email: email,
      createdAt: new Date()
    });
  }
  
  async login(username, password) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('找不到用户');
    }
    
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('密码无效');
    }
    
    return this.createSession(username);
  }
}
```

!!!warning "⚠️ 传统身份验证的问题"
    **用户体验不连贯**：管理多个账号时，用户容易忘记凭证
    
    **安全漏洞**：离职员工的账号可能无法及时停用
    
    **管理负担**：需要跨系统管理用户、密码和权限
    
    **开发负担**：构建和维护身份验证基础设施

## 解决方案：联合身份识别

将身份验证委托给受信任的外部身份识别提供者。用户只需在身份识别提供者进行一次验证，即可访问多个应用程序，无需重新输入凭证。

{% mermaid %}
graph LR
    User([用户]) -->|1. 访问应用程序| App[应用程序]
    App -->|2. 重定向至 IdP| IdP[身份识别提供者]
    User -->|3. 验证| IdP
    IdP -->|4. 发行令牌| STS[安全令牌服务]
    STS -->|5. 返回包含声明的令牌| App
    App -->|6. 授予访问权| User
    
    style User fill:#4dabf7,stroke:#1971c2
    style App fill:#51cf66,stroke:#2f9e44
    style IdP fill:#ffd43b,stroke:#f59f00
    style STS fill:#ff8787,stroke:#c92a2a
{% endmermaid %}

### 运作方式

1. **用户尝试访问应用程序**：应用程序检测到用户未经验证
2. **重定向至身份识别提供者**：应用程序将用户重定向至受信任的身份识别提供者
3. **用户验证**：用户向身份识别提供者提供凭证
4. **发行令牌**：身份识别提供者发行包含用户声明的安全令牌
5. **令牌验证**：应用程序验证令牌并提取用户信息
6. **授予访问权**：用户无需创建新凭证即可访问应用程序

## 核心组件

### 1. 身份识别提供者 (IdP)

验证用户并发行令牌的受信任机构：

```javascript
class IdentityProvider {
  constructor(userDirectory) {
    this.userDirectory = userDirectory;
    this.trustedApplications = new Set();
  }
  
  async authenticate(username, password, applicationId) {
    // 验证应用程序是否受信任
    if (!this.trustedApplications.has(applicationId)) {
      throw new Error('不受信任的应用程序');
    }
    
    // 对目录验证用户
    const user = await this.userDirectory.validateCredentials(
      username, 
      password
    );
    
    if (!user) {
      throw new Error('验证失败');
    }
    
    // 发行包含声明的令牌
    return this.issueToken(user, applicationId);
  }
  
  issueToken(user, applicationId) {
    const claims = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      department: user.department,
      issuer: 'corporate-idp',
      audience: applicationId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (3600 * 1000) // 1 小时
    };
    
    // 签署令牌
    return this.signToken(claims);
  }
}
```

### 2. 安全令牌服务 (STS)

转换和增强令牌，在身份识别提供者和应用程序之间建立信任：

```javascript
class SecurityTokenService {
  constructor(trustedIdPs) {
    this.trustedIdPs = trustedIdPs;
    this.claimMappings = new Map();
  }
  
  async transformToken(incomingToken, targetApplication) {
    // 验证令牌来自受信任的 IdP
    const tokenInfo = await this.validateToken(incomingToken);
    
    if (!this.trustedIdPs.has(tokenInfo.issuer)) {
      throw new Error('来自不受信任发行者的令牌');
    }
    
    // 为目标应用程序转换声明
    const transformedClaims = this.transformClaims(
      tokenInfo.claims,
      targetApplication
    );
    
    // 为目标应用程序发行新令牌
    return this.issueToken(transformedClaims, targetApplication);
  }
  
  transformClaims(claims, targetApplication) {
    const mapping = this.claimMappings.get(targetApplication);
    
    if (!mapping) {
      return claims; // 不需要转换
    }
    
    const transformed = {};
    
    for (const [sourceClaim, targetClaim] of mapping.entries()) {
      if (claims[sourceClaim]) {
        transformed[targetClaim] = claims[sourceClaim];
      }
    }
    
    // 添加应用程序特定的声明
    transformed.applicationId = targetApplication;
    transformed.transformedAt = Date.now();
    
    return transformed;
  }
}
```

### 3. 基于声明的访问控制

应用程序根据令牌中的声明授权访问：

```javascript
class ClaimsBasedAuthorization {
  constructor() {
    this.policies = new Map();
  }
  
  definePolicy(resource, requiredClaims) {
    this.policies.set(resource, requiredClaims);
  }
  
  async authorize(token, resource) {
    // 从令牌提取声明
    const claims = await this.extractClaims(token);
    
    // 获取资源所需的声明
    const required = this.policies.get(resource);
    
    if (!required) {
      return true; // 未定义策略，允许访问
    }
    
    // 检查用户是否具有所需的声明
    return this.evaluateClaims(claims, required);
  }
  
  evaluateClaims(userClaims, requiredClaims) {
    for (const [claimType, requiredValue] of Object.entries(requiredClaims)) {
      const userValue = userClaims[claimType];
      
      if (!userValue) {
        return false; // 缺少必要的声明
      }
      
      if (Array.isArray(requiredValue)) {
        // 检查用户是否具有任何所需的值
        if (!requiredValue.includes(userValue)) {
          return false;
        }
      } else if (userValue !== requiredValue) {
        return false;
      }
    }
    
    return true;
  }
}

// 使用示例
const authz = new ClaimsBasedAuthorization();

// 定义访问策略
authz.definePolicy('/admin', {
  role: ['admin', 'superuser']
});

authz.definePolicy('/reports/financial', {
  role: 'manager',
  department: 'finance'
});

// 检查授权
const canAccess = await authz.authorize(userToken, '/admin');
```

## 实现示例

完整的联合身份验证流程：

```javascript
class FederatedApplication {
  constructor(identityProviderUrl, applicationId, secretKey) {
    this.identityProviderUrl = identityProviderUrl;
    this.applicationId = applicationId;
    this.secretKey = secretKey;
    this.authorization = new ClaimsBasedAuthorization();
  }
  
  // 保护路由的中间件
  requireAuthentication() {
    return async (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        // 重定向至身份识别提供者
        const redirectUrl = this.buildAuthenticationUrl(req.originalUrl);
        return res.redirect(redirectUrl);
      }
      
      try {
        // 验证令牌
        const claims = await this.validateToken(token);
        
        // 将用户信息附加到请求
        req.user = claims;
        next();
      } catch (error) {
        res.status(401).json({ error: '无效的令牌' });
      }
    };
  }
  
  buildAuthenticationUrl(returnUrl) {
    const params = new URLSearchParams({
      client_id: this.applicationId,
      return_url: returnUrl,
      response_type: 'token'
    });
    
    return `${this.identityProviderUrl}/authenticate?${params}`;
  }
  
  async handleCallback(req, res) {
    const { token } = req.query;
    
    try {
      // 验证来自 IdP 的令牌
      const claims = await this.validateToken(token);
      
      // 创建应用程序会话
      const sessionToken = await this.createSession(claims);
      
      // 重定向至原始目的地
      const returnUrl = req.query.return_url || '/';
      res.redirect(`${returnUrl}?token=${sessionToken}`);
    } catch (error) {
      res.status(401).json({ error: '验证失败' });
    }
  }
  
  async validateToken(token) {
    // 验证令牌签名
    const payload = await this.verifySignature(token, this.secretKey);
    
    // 检查过期时间
    if (payload.expiresAt < Date.now()) {
      throw new Error('令牌已过期');
    }
    
    // 验证对象
    if (payload.audience !== this.applicationId) {
      throw new Error('令牌不适用于此应用程序');
    }
    
    return payload;
  }
}

// 设置应用程序
const app = express();
const federatedApp = new FederatedApplication(
  'https://idp.company.com',
  'my-application-id',
  process.env.SECRET_KEY
);

// IdP 的回调端点
app.get('/auth/callback', (req, res) => {
  federatedApp.handleCallback(req, res);
});

// 受保护的路由
app.get('/dashboard', 
  federatedApp.requireAuthentication(),
  (req, res) => {
    res.json({
      message: '欢迎来到仪表板',
      user: req.user
    });
  }
);
```

## 主领域发现

当有多个身份识别提供者可用时，系统必须决定使用哪一个：

```javascript
class HomeRealmDiscovery {
  constructor() {
    this.providerMappings = new Map();
    this.defaultProvider = null;
  }
  
  registerProvider(identifier, providerUrl) {
    this.providerMappings.set(identifier, providerUrl);
  }
  
  setDefaultProvider(providerUrl) {
    this.defaultProvider = providerUrl;
  }
  
  discoverProvider(userIdentifier) {
    // 从电子邮件提取域名
    if (userIdentifier.includes('@')) {
      const domain = userIdentifier.split('@')[1];
      
      // 检查域名是否有对应的提供者
      if (this.providerMappings.has(domain)) {
        return this.providerMappings.get(domain);
      }
    }
    
    // 检查基于子域名的发现
    const subdomain = this.extractSubdomain(userIdentifier);
    if (subdomain && this.providerMappings.has(subdomain)) {
      return this.providerMappings.get(subdomain);
    }
    
    // 返回默认提供者
    return this.defaultProvider;
  }
  
  async promptUserSelection(availableProviders) {
    // 向用户呈现身份识别提供者列表
    return {
      providers: Array.from(this.providerMappings.entries()).map(
        ([name, url]) => ({ name, url })
      )
    };
  }
}

// 使用方式
const discovery = new HomeRealmDiscovery();

// 将域名映射到身份识别提供者
discovery.registerProvider('company.com', 'https://idp.company.com');
discovery.registerProvider('partner.com', 'https://sso.partner.com');
discovery.registerProvider('social', 'https://social-idp.com');

// 为用户发现提供者
const provider = discovery.discoverProvider('user@company.com');
// 返回：https://idp.company.com
```

## 联合身份识别的优势

### 1. 单点登录 (SSO)

用户验证一次即可访问多个应用程序：

{% mermaid %}
sequenceDiagram
    participant User as 用户
    participant App1 as 应用程序 1
    participant App2 as 应用程序 2
    participant IdP as 身份识别提供者
    
    User->>App1: 访问应用程序 1
    App1->>IdP: 重定向进行验证
    User->>IdP: 提供凭证
    IdP->>App1: 返回令牌
    App1->>User: 授予访问权
    
    Note over User,App2: 稍后，用户访问应用程序 2
    
    User->>App2: 访问应用程序 2
    App2->>IdP: 检查验证
    IdP->>App2: 返回现有令牌
    App2->>User: 授予访问权（无需登录）
{% endmermaid %}

### 2. 集中式身份管理

身份识别提供者管理所有用户账号：

```javascript
class CentralizedIdentityManagement {
  async onboardEmployee(employee) {
    // 在身份识别提供者中创建账号
    await this.identityProvider.createUser({
      username: employee.email,
      name: employee.name,
      department: employee.department,
      roles: employee.roles
    });
    
    // 员工自动拥有所有应用程序的访问权
    // 无需在每个应用程序中创建账号
  }
  
  async offboardEmployee(employeeId) {
    // 在身份识别提供者中停用账号
    await this.identityProvider.disableUser(employeeId);
    
    // 员工立即失去所有应用程序的访问权
    // 无需在每个应用程序中停用账号
  }
  
  async updateEmployeeRole(employeeId, newRole) {
    // 在身份识别提供者中更新角色
    await this.identityProvider.updateUser(employeeId, {
      roles: [newRole]
    });
    
    // 角色变更传播到所有应用程序
  }
}
```

### 3. 降低开发负担

应用程序无需实现身份验证：

```javascript
// 之前：复杂的身份验证逻辑
class ApplicationWithAuth {
  async register(user) { /* ... */ }
  async login(credentials) { /* ... */ }
  async resetPassword(email) { /* ... */ }
  async verifyEmail(token) { /* ... */ }
  async enable2FA(userId) { /* ... */ }
  // ... 数百行验证代码
}

// 之后：委托给身份识别提供者
class ApplicationWithFederation {
  constructor(identityProvider) {
    this.identityProvider = identityProvider;
  }
  
  async authenticate(token) {
    // 只需验证令牌
    return await this.identityProvider.validateToken(token);
  }
}
```

## 设计考量

### 1. 单点故障

身份识别提供者的可用性至关重要：

!!!warning "🔒 可靠性考量"
    **跨多个数据中心部署**：确保身份识别提供者具有高可用性
    
    **实现缓存**：缓存令牌和验证结果以处理临时性中断
    
    **优雅降级**：当 IdP 无法使用时允许有限的功能
    
    **监控健康状态**：持续监控身份识别提供者的可用性

```javascript
class ResilientTokenValidation {
  constructor(identityProvider, cache) {
    this.identityProvider = identityProvider;
    this.cache = cache;
  }
  
  async validateToken(token) {
    // 先检查缓存
    const cached = await this.cache.get(`token:${token}`);
    if (cached) {
      return cached;
    }
    
    try {
      // 使用身份识别提供者验证
      const claims = await this.identityProvider.validate(token);
      
      // 缓存成功的验证
      await this.cache.set(`token:${token}`, claims, 300); // 5 分钟
      
      return claims;
    } catch (error) {
      // 如果 IdP 无法使用，检查是否有缓存的验证
      const fallback = await this.cache.get(`token:fallback:${token}`);
      if (fallback) {
        console.warn('由于 IdP 无法使用，使用缓存的令牌验证');
        return fallback;
      }
      
      throw error;
    }
  }
}
```

### 2. 社交身份识别提供者

社交提供者提供的用户信息有限：

```javascript
class SocialIdentityIntegration {
  async handleSocialLogin(socialToken, provider) {
    // 从社交提供者提取声明
    const socialClaims = await this.validateSocialToken(socialToken, provider);
    
    // 社交提供者通常只提供：
    // - 唯一标识符
    // - 电子邮件（有时）
    // - 名称（有时）
    
    // 检查用户是否存在于应用程序中
    let user = await this.findUserBySocialId(
      provider,
      socialClaims.id
    );
    
    if (!user) {
      // 首次登录 - 需要注册
      user = await this.registerSocialUser({
        socialProvider: provider,
        socialId: socialClaims.id,
        email: socialClaims.email,
        name: socialClaims.name
      });
    }
    
    // 使用应用程序特定的信息增强声明
    return {
      ...socialClaims,
      userId: user.id,
      roles: user.roles,
      preferences: user.preferences
    };
  }
}
```

### 3. 令牌生命周期和更新

管理令牌过期和更新：

```javascript
class TokenLifecycleManager {
  constructor(identityProvider) {
    this.identityProvider = identityProvider;
  }
  
  async issueTokenPair(user) {
    // 短期访问令牌
    const accessToken = await this.createToken(user, {
      type: 'access',
      expiresIn: 900 // 15 分钟
    });
    
    // 长期刷新令牌
    const refreshToken = await this.createToken(user, {
      type: 'refresh',
      expiresIn: 2592000 // 30 天
    });
    
    return { accessToken, refreshToken };
  }
  
  async refreshAccessToken(refreshToken) {
    // 验证刷新令牌
    const claims = await this.validateToken(refreshToken);
    
    if (claims.type !== 'refresh') {
      throw new Error('无效的令牌类型');
    }
    
    // 发行新的访问令牌
    return await this.createToken(claims, {
      type: 'access',
      expiresIn: 900
    });
  }
}
```

## 何时使用此模式

!!!tip "✅ 理想场景"
    **企业单点登录**：员工访问多个企业应用程序
    
    **多合作伙伴协作**：业务合作伙伴需要访问但没有企业账号
    
    **SaaS 应用程序**：多租户应用程序，每个租户使用自己的身份识别提供者
    
    **消费者应用程序**：允许用户使用社交身份识别提供者登录

!!!warning "❌ 不适用的情况"
    **单一身份识别提供者**：所有用户使用应用程序可访问的一个系统进行验证
    
    **旧系统**：应用程序无法处理现代身份验证协议
    
    **高度隔离的系统**：安全要求禁止外部身份验证

## 实际示例：多租户 SaaS

```javascript
class MultiTenantSaaS {
  constructor() {
    this.tenants = new Map();
    this.sts = new SecurityTokenService();
  }
  
  async registerTenant(tenantId, identityProviderConfig) {
    // 注册租户的身份识别提供者
    this.tenants.set(tenantId, {
      id: tenantId,
      identityProvider: identityProviderConfig,
      users: new Set()
    });
    
    // 配置 STS 信任租户的 IdP
    await this.sts.addTrustedProvider(
      identityProviderConfig.issuer,
      identityProviderConfig.publicKey
    );
  }
  
  async authenticateUser(token) {
    // 使用 STS 验证令牌
    const claims = await this.sts.validateToken(token);
    
    // 从令牌确定租户
    const tenantId = claims.tenantId;
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      throw new Error('未知的租户');
    }
    
    // 验证用户属于租户
    if (!tenant.users.has(claims.userId)) {
      // 首次用户 - 添加到租户
      tenant.users.add(claims.userId);
    }
    
    return {
      user: claims,
      tenant: tenant
    };
  }
}
```

## 总结

联合身份识别将身份验证从负担转变为助力。通过将身份验证委托给受信任的身份识别提供者，您可以：

- **改善用户体验**，提供单点登录
- **增强安全性**，实现集中式身份管理
- **降低开发工作量**，避免自定义身份验证
- **促进协作**，跨越组织界限

此模式在企业和多租户场景中特别强大，用户需要无缝访问多个应用程序，同时保持安全性和控制。

## 参考资料

- [联合身份识别模式 - Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/federated-identity)
