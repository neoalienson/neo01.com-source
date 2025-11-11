---
title: "在家中建立单点登录系统"
date: 2025-01-15
lang: zh-CN
tags:
  - Authentication
  - Cybersecurity
  - Homelab
categories:
  - Cybersecurity
comments: true
excerpt: "厌倦了管理家庭实验室服务的数十个密码？学习如何建立单点登录系统，只需一次登录即可访问所有服务。"
thumbnail: /assets/security/lock.png
---

你已经建立了一个令人印象深刻的家庭实验室——Nextcloud、Jellyfin、Home Assistant、Portainer、Grafana，以及十几个其他服务。每个都很棒。每个也都有自己的登录页面。以及自己的密码。以及自己的会话超时。

听起来很熟悉吗？欢迎来到密码疲劳的世界。

如果你可以登录一次就访问所有内容呢？这就是单点登录（SSO），它不再只是企业专用。

## 为什么在家中需要 SSO？

**问题所在：**

- 15+ 个服务 = 15+ 个要记住的密码（或重复使用 😱）
- 分别登录每个服务浪费时间
- 没有集中式用户管理
- 需要时难以撤销访问权限
- 密码重置是一场噩梦

**解决方案：**

SSO 提供：
- **一次登录**适用于所有服务
- **集中式身份验证** - 在一个地方管理用户
- **更好的安全性** - 一次强制执行 MFA，适用于所有地方
- **更容易的入职** - 一次将家人/朋友加入所有服务
- **快速撤销** - 停用一个账户，锁定所有地方

## 理解 SSO 基础

### 什么是单点登录？

SSO 是一种身份验证方案，允许用户登录一次并访问多个应用程序，无需重新验证。

**简单示例：**
- 没有 SSO：登录 Nextcloud → 登录 Grafana → 登录 Jellyfin（3 次登录）
- 有 SSO：登录一次 → 访问所有三个服务（1 次登录）

### 关键组件说明

将 SSO 想象成一个有多个 VIP 房间的夜店。让我们分解每个组件：

#### 1. 身份提供者（IdP）- 保安

**它的作用：**验证你是谁的中央身份验证机构。

**现实世界类比：**就像夜店入口的保安，检查你的身份证并给你一个手环。

**在你的家庭实验室中：**
- **Authelia、Authentik 或 Keycloak** 充当保安
- 当你尝试访问任何服务时，你会先被重定向到这里
- 它检查你的用户名/密码和 MFA
- 一旦验证，它会给你一个「令牌」（就像手环）

**示例流程：**
```
你 → 尝试访问 Nextcloud
Nextcloud → "我不认识你，去问保安"
你 → 重定向到 Authelia 登录页面
Authelia → "出示你的凭证"
你 → 输入密码 + MFA 代码
Authelia → "已验证！这是你的令牌"
```

#### 2. 服务提供者（SP）- VIP 房间

**它的作用：**信任 IdP 验证用户的实际应用程序。

**现实世界类比：**就像夜店中的 VIP 房间。他们不检查你的身份证——他们只看保安给的手环。

**在你的家庭实验室中：**
- **你的应用程序：**Nextcloud、Grafana、Jellyfin、Home Assistant
- 它们不自己处理密码
- 它们信任 IdP 的决定
- 它们只检查："你有来自 Authelia 的有效令牌吗？"

**示例：**
```
你 → 访问 Grafana（带有来自 Authelia 的令牌）
Grafana → "我看到你有来自 Authelia 的有效令牌"
Grafana → "Authelia 说你是 'alice'，在 'admins' 组中"
Grafana → "欢迎！"
```

#### 3. 用户目录 - 宾客名单

**它的作用：**存储用户信息（用户名、密码、组）。

**现实世界类比：**保安检查的宾客名单。

**在你的家庭实验室中：**
- **简单：**包含用户名和哈希密码的 YAML 文件
- **高级：**LDAP 服务器（就像用户的数据库）
- 包含：用户名、密码、电子邮件、组成员资格

**示例结构：**
```yaml
users:
  alice:
    password: (哈希)
    email: alice@home.local
    groups: [admins, users]
  bob:
    password: (哈希)
    email: bob@home.local
    groups: [users]
```

#### 4. 身份验证 vs 授权

**身份验证：**证明你是谁（"你是 Alice 吗？"）
**授权：**决定你可以做什么（"Alice 可以访问管理面板吗？"）

**现实世界类比：**
- **身份验证** = 出示身份证证明你已满 21 岁
- **授权** = 保安决定你是否可以进入 VIP 区

**在 SSO 中：**
- **IdP 处理身份验证：**"是的，这是 Alice，密码正确"
- **应用程序处理授权：**"Alice 在 'admins' 组中，授予管理员访问权限"

#### 5. 身份验证协议 - 语言

**它们的作用：**IdP 和应用程序通信的标准化方式。

**现实世界类比：**就像保安和 VIP 房间用来沟通的不同语言。

**OIDC（OpenID Connect）- 现代且推荐：**
- **身份验证：**"你是谁？"
- **授权：**"你在哪些组中？"
- 使用 JSON（易于阅读）
- 建立在 OAuth2 之上
- 大多数现代应用程序支持
- **尽可能使用此协议**

**OIDC 令牌示例：**
```json
{
  "sub": "alice",
  "email": "alice@homelab.local",
  "groups": ["admins", "users"],
  "exp": 1705334400
}
```

**SAML - 企业标准：**
- 就像说正式的法律语言
- 使用 XML（冗长）
- 较旧的企业应用程序使用它
- 更复杂但广泛支持
- 在企业环境中常见

**Windows 集成身份验证（WIA）- 仅限 Windows：**
- 使用 Kerberos/NTLM
- Windows 域用户自动登录
- 在域上无需密码提示
- **仅适用于：**Active Directory + Windows 客户端
- **非联合** - 无法与外部 SaaS 应用程序集成
- **不适合家庭实验室**，除非你运行 Windows Server 域

#### 6. 联合 vs 非联合身份验证

**什么是联合？**

联合允许不同组织/系统相互信任彼此的身份验证。

**现实世界类比：**
- **非联合：**你的健身房会员资格只在你的健身房有效
- **联合：**你的护照在多个国家有效（它们相互信任）

**非联合身份验证（WIA、基本验证）：**
```
你的家庭实验室 IdP → 仅适用于你的家庭实验室服务
❌ 无法向外部 SaaS（GitHub、AWS 等）进行身份验证
```

**联合身份验证（OIDC、SAML）：**
```
你的家庭实验室 IdP ↔ 外部 SaaS（如果它们支持）
✅ 可以向信任你的 IdP 的服务进行身份验证
```

**示例场景：**

**非联合（WIA）：**
```
你 → Windows 域控制器 → 家庭实验室应用程序 ✅
你 → Windows 域控制器 → GitHub ❌（GitHub 不信任你的 DC）
```

**联合（OIDC/SAML）：**
```
你 → Authentik → 家庭实验室应用程序 ✅
你 → Authentik → GitHub Enterprise ✅（如果已配置）
你 → Authentik → AWS ✅（如果已配置）
```

**家庭实验室的陷阱：**

大多数 SaaS 提供者仅支持**企业订阅**的联合：

| 服务 | 免费/个人 | 企业 |
|---------|---------------|------------|
| **GitHub** | 无 SSO | 使用 SAML 的 SSO |
| **AWS** | 无 SSO | 使用 SAML 的 SSO |
| **Google Workspace** | 无 SSO | 使用 SAML 的 SSO |
| **Microsoft 365** | 无 SSO | 使用 SAML 的 SSO |
| **Slack** | 无 SSO | 使用 SAML 的 SSO |

**成本现实：**
- GitHub Enterprise：$21/用户/月
- AWS SSO：需要 AWS Organizations
- Google Workspace：$12-18/用户/月（SSO）
- Microsoft 365：$22/用户/月（SSO）

!!!warning "⚠️ 家庭实验室 SSO 限制"
    **你的家庭实验室 SSO 将适用于：**
    - ✅ 自托管服务（Nextcloud、Grafana、Jellyfin）
    - ✅ 你控制的服务
    - ✅ 支持 OIDC/SAML 且无限制的应用程序
    
    **你的家庭实验室 SSO 将不适用于：**
    - ❌ 免费层 SaaS（GitHub、Gmail、Slack）
    - ❌ 需要企业订阅的服务
    - ❌ 不支持自定义 IdP 的服务
    
    **这将家庭实验室 SSO 限制为仅内部服务**，但对于管理 10-20 个自托管应用程序仍然很有价值！

**比较：**

| 协议 | 最适合 | 复杂度 | 联合 | 家庭实验室友好 |
|----------|----------|------------|-----------|------------------|
| **OIDC** | 现代应用程序 | 低 | ✅ 是 | ✅ 是 |
| **SAML** | 企业应用程序 | 高 | ✅ 是 | ⚠️ 如果需要 |
| **WIA** | Windows 域 | 中 | ❌ 否 | ❌ 过度 |

!!!tip "💡 协议选择"
    对于家庭实验室：
    - **使用 OIDC** 适用于支持它的应用程序（Grafana、Nextcloud、Portainer）
    - **使用转发验证**（Authelia）适用于不支持 OIDC 的应用程序
    - **跳过 WIA**，除非你已经运行 Active Directory（而且它无法与 SaaS 一起使用）
    - **仅在特定应用程序需要时使用 SAML**
    - **接受限制：**你的 SSO 无法与免费层 SaaS（GitHub、Gmail 等）一起使用

!!!anote "🎯 关键要点"
    - **IdP（Authelia）** = 你登录的唯一地方
    - **服务提供者（你的应用程序）** = 信任 IdP 的决定
    - **用户目录** = 存储用户名/密码的地方
    - **协议（OIDC/SAML）** = 它们如何相互通信
    
    你在 IdP 登录一次，你的所有应用程序都信任该登录。

## 资源

- **[Authelia 文档](https://www.authelia.com/)：**完整的 Authelia 指南
- **[Authentik 文档](https://goauthentik.io/docs/)：**Authentik 设置和配置
- **[Keycloak 文档](https://www.keycloak.org/documentation)：**企业 SSO 指南
- **[OIDC 说明](https://openid.net/connect/)：**理解 OpenID Connect

## 结论

在家中设置 SSO 将你的家庭实验室从一系列独立服务转变为统一平台。初始设置投资立即通过便利性和改进的安全性得到回报。

**关键要点：**

- SSO 消除了多个服务的密码疲劳
- **Authelia 最适合简单设置**，配合反向代理
- **Authentik 提供完整功能**，配有美观的 UI
- 转发验证保护任何服务
- MFA 添加关键安全层
- LDAP 集成可扩展用于更大的部署
- 定期备份至关重要（SSO 是单点故障）
- **家庭实验室 SSO 限于自托管服务** - SaaS 集成需要昂贵的企业计划
- 联合（OIDC/SAML）实现跨系统 SSO，但 WIA 是非联合的

**快速入门建议：**

对于大多数家庭实验室：
1. 从 **Authelia** + Traefik 开始（最简单的路径）
2. 最初使用基于文件的身份验证
3. 为管理员账户添加 MFA
4. 逐步将服务迁移到 SSO
5. 如果以后需要 OIDC/SAML，考虑 Authentik

从 2-3 个服务开始，熟悉流程，然后扩展。当你不再需要处理数十个密码时，未来的你会感谢你！🔐


## 设置 Authelia

### 架构

{% mermaid %}flowchart TD
  User["👤 用户"]
  Proxy["🚪 反向代理 (Traefik/nginx)"]
  Authelia["🔐 Authelia"]
  LDAP["📚 用户目录 (YAML/LDAP)"]
  
  subgraph Services[" "]
    App1["📦 Nextcloud"]
    App2["🎬 Jellyfin"]
    App3["📊 Grafana"]
  end
  
  User --> Proxy
  Proxy --> Authelia
  Proxy --> Services
  Authelia -.-> LDAP
  
  style Authelia fill:#e3f2fd
  style Proxy fill:#fff3e0
  style LDAP fill:#f3e5f5
  style Services fill:#e8f5e9
{% endmermaid %}

### 先决条件

- Docker 和 Docker Compose
- 反向代理（Traefik 或 nginx）
- 域名（或本地 DNS）

### 步骤 1：创建目录结构

```bash
mkdir -p authelia/{config,secrets}
cd authelia
```

### 步骤 2：生成密钥

```bash
# JWT 密钥
tr -cd '[:alnum:]' < /dev/urandom | fold -w "64" | head -n 1 > secrets/jwt_secret

# 会话密钥
tr -cd '[:alnum:]' < /dev/urandom | fold -w "64" | head -n 1 > secrets/session_secret

# 存储加密密钥
tr -cd '[:alnum:]' < /dev/urandom | fold -w "64" | head -n 1 > secrets/storage_encryption_key
```

### 步骤 3：创建配置

```yaml
# config/configuration.yml
---
theme: dark
default_2fa_method: "totp"

server:
  host: 0.0.0.0
  port: 9091

log:
  level: info

totp:
  issuer: homelab.local
  period: 30
  skew: 1

authentication_backend:
  file:
    path: /config/users_database.yml
    password:
      algorithm: argon2id
      iterations: 1
      salt_length: 16
      parallelism: 8
      memory: 64

access_control:
  default_policy: deny
  rules:
    - domain: "*.homelab.local"
      policy: two_factor

session:
  name: authelia_session
  domain: homelab.local
  expiration: 1h
  inactivity: 5m
  remember_me_duration: 1M

regulation:
  max_retries: 3
  find_time: 2m
  ban_time: 5m

storage:
  encryption_key_secret_file: /secrets/storage_encryption_key
  local:
    path: /config/db.sqlite3

notifier:
  filesystem:
    filename: /config/notification.txt
```

### 步骤 4：创建用户

```yaml
# config/users_database.yml
users:
  alice:
    displayname: "Alice Smith"
    password: "$argon2id$v=19$m=65536,t=3,p=4$..."
    email: alice@homelab.local
    groups:
      - admins
      - users
  
  bob:
    displayname: "Bob Jones"
    password: "$argon2id$v=19$m=65536,t=3,p=4$..."
    email: bob@homelab.local
    groups:
      - users
```

**生成密码哈希：**

```bash
docker run --rm authelia/authelia:latest authelia crypto hash generate argon2 --password 'yourpassword'
```

### 步骤 5：Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  authelia:
    image: authelia/authelia:latest
    container_name: authelia
    volumes:
      - ./config:/config
      - ./secrets:/secrets
    ports:
      - 9091:9091
    environment:
      - TZ=America/New_York
    restart: unless-stopped
```

### 步骤 6：与 Traefik 集成

```yaml
# docker-compose.yml（添加到现有的 Traefik 设置）
services:
  authelia:
    image: authelia/authelia:latest
    container_name: authelia
    volumes:
      - ./authelia/config:/config
      - ./authelia/secrets:/secrets
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.authelia.rule=Host(`auth.homelab.local`)"
      - "traefik.http.routers.authelia.entrypoints=websecure"
      - "traefik.http.routers.authelia.tls=true"
      - "traefik.http.services.authelia.loadbalancer.server.port=9091"
      
      # Authelia 中间件
      - "traefik.http.middlewares.authelia.forwardauth.address=http://authelia:9091/api/verify?rd=https://auth.homelab.local"
      - "traefik.http.middlewares.authelia.forwardauth.trustForwardHeader=true"
      - "traefik.http.middlewares.authelia.forwardauth.authResponseHeaders=Remote-User,Remote-Groups,Remote-Name,Remote-Email"
    restart: unless-stopped

  # 受保护服务示例
  nextcloud:
    image: nextcloud:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nextcloud.rule=Host(`nextcloud.homelab.local`)"
      - "traefik.http.routers.nextcloud.entrypoints=websecure"
      - "traefik.http.routers.nextcloud.tls=true"
      - "traefik.http.routers.nextcloud.middlewares=authelia@docker"
    restart: unless-stopped
```

### 步骤 7：启动服务

```bash
docker-compose up -d
```

访问 `https://auth.homelab.local` 查看登录页面。

### 理解身份验证流程

现在你已经设置好 Authelia，让我们看看当你访问受保护的服务时到底发生了什么：

{% mermaid %}sequenceDiagram
    participant User
    participant App as 应用程序 (Nextcloud)
    participant SSO as SSO 提供者 (Authelia)
    participant LDAP as 用户目录 (YAML/LDAP)
    
    User->>App: 1. 访问应用程序
    App->>User: 2. 重定向到 SSO 登录
    User->>SSO: 3. 输入凭证 + MFA
    SSO->>LDAP: 4. 验证凭证
    LDAP->>SSO: 5. 用户已验证
    SSO->>App: 6. 返回验证令牌
    App->>User: 7. 授予访问权限
    
    Note over User,App: 用户现在已登录！
    
    User->>App: 8. 访问另一个应用程序 (Jellyfin)
    App->>SSO: 9. 检查现有会话
    SSO->>App: 10. 有效会话存在
    App->>User: 11. 授予访问权限（无需登录）
{% endmermaid %}

**幕后发生的事情：**

1. **首次访问：**你访问 `nextcloud.homelab.local`
2. **Traefik 拦截：**向 Authelia 检查 - "这个用户已验证吗？"
3. **未验证：**Authelia 将你重定向到 `auth.homelab.local`
4. **你登录：**输入用户名、密码和 MFA 代码
5. **Authelia 验证：**对照用户数据库检查凭证
6. **创建会话：**Authelia 创建会话 cookie
7. **重定向回来：**你被送回 Nextcloud
8. **授予访问权限：**Traefik 看到有效会话，允许访问

**第二个服务访问：**

1. 你访问 `grafana.homelab.local`
2. Traefik 向 Authelia 检查 - "这个用户已验证吗？"
3. Authelia 看到现有会话 cookie - "是的，是 Alice！"
4. 立即授予访问权限 - **无需登录**

这就是 SSO 的魔法 - 一次登录，到处访问！

## 添加多因素验证

### MFA 选项概览

| 方法 | 安全性 | 便利性 | 成本 | 防钓鱼 |
|--------|----------|-------------|------|-------------------|
| **Passkey (WebAuthn)** | 最高 | 高 | 免费 | ✅ 是 |
| **硬件密钥** | 最高 | 中 | $25-50 | ✅ 是 |
| **TOTP（验证器应用程序）** | 高 | 中 | 免费 | ❌ 否 |
| **SMS** | 低 | 高 | 需要 SMS 网关 | ❌ 否 |

### 1. Passkey（WebAuthn）- 推荐

**什么是 Passkey？**

Passkey 是使用生物识别验证（指纹、面部、PIN）的密码现代替代品。

**现实世界类比：**就像使用指纹解锁手机，而不是输入密码。

**工作方式：**
- 你的设备存储加密密钥
- 你使用生物识别（指纹/面部）或设备 PIN 进行验证
- 没有密码可以被窃取或钓鱼
- 通过云同步跨设备工作（iCloud 钥匙串、Google 密码管理器）

**Authentik 设置：**

1. 用户菜单 → 设置
2. MFA 设备 → 注册
3. 选择 **WebAuthn** 或 **Passkey**
4. 按照浏览器提示：
   - **移动设备：**使用指纹/Face ID
   - **笔记本电脑：**使用 Touch ID/Windows Hello
   - **台式机：**使用手机作为 passkey 或硬件密钥

**Authelia 设置：**

1. 登录任何受保护的服务
2. 点击「注册安全密钥」
3. 选择 passkey 选项
4. 使用生物识别进行验证

**支持的平台：**
- ✅ iPhone/iPad（iOS 16+）- Face ID/Touch ID
- ✅ Android（9+）- 指纹/面部解锁
- ✅ macOS（Ventura+）- Touch ID
- ✅ Windows（10+）- Windows Hello
- ✅ Chrome/Edge/Safari - 内置支持

### 2. 硬件安全密钥

**用于验证的物理设备：**

**Authentik：**

1. 用户菜单 → 设置
2. MFA 设备 → 注册
3. 选择 WebAuthn
4. 插入安全密钥（YubiKey 等）
5. 提示时触摸密钥

**热门硬件密钥：**
- **YubiKey 5**（$45-50）- USB-A/C、NFC
- **YubiKey 5C Nano**（$55）- 留在 USB-C 端口
- **Google Titan**（$30）- USB-A/C、蓝牙
- **Feitian**（$20-30）- 预算选项

### 3. TOTP（验证器应用程序）

**来自应用程序的基于时间的代码：**

**Authelia（内置）：**

1. 登录任何受保护的服务
2. 点击「注册设备」
3. 使用验证器应用程序扫描 QR 码
4. 输入 6 位数代码进行验证

**Authentik：**

1. 用户菜单 → 设置
2. MFA 设备 → 注册
3. 选择 TOTP
4. 扫描 QR 码

**推荐的验证器应用程序：**
- **Aegis**（Android）- 开源、加密备份
- **Raivo OTP**（iOS）- 开源、iCloud 同步
- **2FAS**（iOS/Android）- 免费、云备份
- **Authy**（iOS/Android）- 多设备同步
- **Google Authenticator**（iOS/Android）- 简单、云备份

!!!tip "💡 MFA 最佳实践"
    **优先顺序：**
    1. **Passkeys** - 最安全且方便（使用生物识别）
    2. **硬件密钥** - 非常安全，需要物理设备
    3. **TOTP 应用程序** - 安全，但可能被钓鱼
    4. **避免 SMS** - 容易受到 SIM 卡交换攻击
    
    **建议：**
    - **管理员始终需要 MFA**（使用 passkeys 或硬件密钥）
    - **家人可选**（减少摩擦，passkeys 很容易）
    - **备份代码** - 生成并安全存储
    - **多种方法** - 注册 passkey + TOTP 作为备份
    - **Passkeys 同步** - 使用 iCloud/Google 从所有设备访问

## 启用 SSO 后是否应保留本地账户？

**简短答案：是的，始终保留本地账户作为备份。**

### 为什么保留本地账户？

**SSO 是单点故障。**如果你的 SSO 系统故障，你将被锁定在所有内容之外。

**SSO 故障的现实世界场景：**

1. **SSO 容器崩溃** - Docker/Kubernetes 问题
2. **数据库损坏** - Authelia/Authentik 数据库问题
3. **配置错误** - 配置中的错字破坏验证
4. **证书过期** - HTTPS 证书过期，SSO 无法访问
5. **网络问题** - DNS 问题、反向代理故障
6. **意外删除** - 哎呀，删除了错误的容器

**没有本地账户会发生什么：**
```
SSO 故障 → 无法登录任何内容 → 甚至无法访问 SSO 进行修复 → 被锁定
```

**有本地账户作为备份：**
```
SSO 故障 → 使用本地管理员账户 → 修复 SSO → 恢复正常
```

### 本地账户的最佳实践

!!!danger "🔒 关键：保护你的本地账户"
    本地账户绕过 SSO，因此必须受到保护：
    - **强密码** - 使用密码管理器，20+ 个字符
    - **在本地账户上启用 MFA** - 许多服务支持此功能
    - **限制本地账户** - 仅为管理员/紧急访问创建
    - **不同的密码** - 不要重复使用 SSO 密码
    - **记录凭证** - 安全存储（密码管理器、加密文件）

### 支持本地账户 MFA 的服务

**Proxmox：**
```bash
# 为本地 root 账户启用 TOTP
# 数据中心 → 权限 → 双因素
# 为用户 root@pam 添加 TOTP
```

**Nextcloud：**
- 设置 → 安全性 → 双因素验证
- 即使对本地管理员账户也启用 TOTP

**Grafana：**
```ini
# grafana.ini
[auth]
login_maximum_inactive_lifetime_duration = 7d
login_maximum_lifetime_duration = 30d

# 本地管理员仍可通过验证器应用程序使用 MFA
```

**Home Assistant：**
```yaml
# configuration.yaml
auth_providers:
  - type: homeassistant  # 本地账户
  - type: command_line   # SSO 集成

# 在 UI 中为本地账户启用 MFA：
# 个人资料 → 安全性 → 多因素验证
```

### 配置策略

**选项 1：双重验证（推荐）**

允许 SSO 和本地登录：

```php
// Nextcloud - 不隐藏密码表单
'oidc_login_hide_password_form' => false,  // 保持本地登录可见
'oidc_login_auto_redirect' => false,       // 不强制 SSO
```

**选项 2：隐藏本地登录**

隐藏本地登录但通过直接 URL 保持可访问：

```php
// Nextcloud - 隐藏但保持功能
'oidc_login_hide_password_form' => true,   // 隐藏本地登录
// 访问本地登录：https://nextcloud.local/login?direct=1
```

**选项 3：仅 SSO 加紧急账户**

对所有人强制 SSO，除了一个紧急管理员：

```yaml
# Authelia - 紧急访问绕过 SSO
access_control:
  rules:
    - domain: "*.homelab.local"
      policy: bypass
      subject:
        - "user:emergency-admin"
      resources:
        - "^/admin/emergency.*$"
```

### 紧急访问检查清单

- [ ] **每个关键服务上都存在本地管理员账户**
- [ ] **所有本地账户都有强唯一密码**
- [ ] **在支持的本地账户上启用 MFA**
- [ ] **凭证记录在安全位置**（密码管理器）
- [ ] **每月测试本地登录**以确保其工作
- [ ] **记录恢复程序** - 如何修复 SSO
- [ ] **SSO 配置的备份** - 可以快速恢复

!!!tip "💡 黄金法则"
    **始终维护安全的后门：**
    - SSO 是你的前门（方便、安全）
    - 本地账户是你的紧急出口（很少使用，始终可用）
    - 两者都应使用 MFA 保护
    - 定期测试两者
    
    把它想象成在房子外面藏一把备用钥匙 - 你很少需要它，但当你需要时，你会很高兴它在那里！

## 资源

- **[Authelia 文档](https://www.authelia.com/)：**完整的 Authelia 指南
- **[Authentik 文档](https://goauthentik.io/docs/)：**Authentik 设置和配置
- **[Keycloak 文档](https://www.keycloak.org/documentation)：**企业 SSO 指南
- **[OIDC 说明](https://openid.net/connect/)：**理解 OpenID Connect

## 结论

在家中设置 SSO 将你的家庭实验室从一系列独立服务转变为统一平台。初始设置投资立即通过便利性和改进的安全性得到回报。

**关键要点：**

- SSO 消除了多个服务的密码疲劳
- **Authelia 最适合简单设置**，配合反向代理
- **Authentik 提供完整功能**，配有美观的 UI
- 转发验证保护任何服务
- MFA 添加关键安全层
- LDAP 集成可扩展用于更大的部署
- 定期备份至关重要（SSO 是单点故障）
- **家庭实验室 SSO 限于自托管服务** - SaaS 集成需要昂贵的企业计划
- 联合（OIDC/SAML）实现跨系统 SSO，但 WIA 是非联合的

**快速入门建议：**

对于大多数家庭实验室：
1. 从 **Authelia** + Traefik 开始（最简单的路径）
2. 最初使用基于文件的身份验证
3. 为管理员账户添加 MFA
4. 逐步将服务迁移到 SSO
5. 如果以后需要 OIDC/SAML，考虑 Authentik

从 2-3 个服务开始，熟悉流程，然后扩展。当你不再需要处理数十个密码时，未来的你会感谢你！🔐
