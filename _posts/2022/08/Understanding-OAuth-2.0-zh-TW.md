---
title: "理解 OAuth 2.0：驅動現代 API 的授權框架"
date: 2022-08-16
lang: zh-TW
categories: Development
tags: [Security, OAuth, Authentication]
excerpt: "OAuth 2.0 實現安全的委託存取而無需共享密碼。了解授權流程如何運作、常見陷阱，以及為什麼 OAuth 不是身份驗證。"
thumbnail: /assets/security/lock.png
---

OAuth 2.0 已成為 API 授權的事實標準，從社群媒體登入到企業 API 存取無所不在。然而儘管如此普及，OAuth 仍被廣泛誤解。開發者經常混淆授權與身份驗證、錯誤實作流程，或以危害安全的方式誤用存取權杖。

本文透過檢視核心概念、授權流程和安全考量來揭開 OAuth 2.0 的神秘面紗。我們將追蹤權杖在不同授權類型中的旅程，理解各方角色，並識別常見的實作錯誤。透過圖表和真實場景，您將獲得對 OAuth 如何在提供無縫使用者體驗的同時保護資源的實用理解。

## OAuth 2.0 實際解決的問題

在 OAuth 之前，需要存取第三方服務上使用者資料的應用程式面臨一個根本問題：它們需要使用者分享密碼。這造成了多重安全性和可用性問題。

### OAuth 之前的問題

考慮一個需要存取您儲存在雲端儲存平台上照片的照片列印服務：

!!!error "🚫 密碼分享問題"
    **傳統方法**
    - 使用者向列印服務提供雲端儲存的使用者名稱和密碼
    - 列印服務儲存憑證（安全風險）
    - 列印服務擁有對所有使用者資料的完整存取權
    - 無法限制存取範圍或持續時間
    - 密碼變更會中斷所有整合服務
    - 無法稽核哪個服務存取了什麼
    
    **安全影響**
    - 憑證暴露給第三方
    - 無細粒度權限控制
    - 無法在不變更密碼的情況下撤銷存取權
    - 違反最小權限原則
    - 顯著增加攻擊面

OAuth 2.0 透過引入委託授權來解決這個問題：使用者可以在不分享憑證的情況下授予對其資源的有限存取權。

### OAuth 的核心創新

OAuth 將身份驗證（證明您是誰）與授權（授予資源存取權）分離：

!!!success "✅ OAuth 授權模型"
    **委託存取**
    - 使用者直接向資源擁有者進行身份驗證（例如雲端儲存）
    - 使用者為第三方應用程式授權特定權限
    - 應用程式接收有時限的存取權杖
    - 權杖僅授予請求的權限
    - 使用者可隨時撤銷存取權而無需變更密碼
    
    **主要優勢**
    - 無需密碼分享
    - 細粒度權限範圍
    - 有時限的存取權杖
    - 每個應用程式獨立撤銷
    - 清楚的存取授權稽核軌跡

這個模型實現了現代 API 生態系統，讓應用程式能夠無縫整合同時維持安全邊界。
 
## OAuth 2.0 角色和組件

OAuth 定義了四個參與授權流程的不同角色：

!!!anote "🎭 OAuth 角色"
    **資源擁有者**
    - 擁有資料的使用者
    - 授權存取其資源
    - 範例：您，授權列印服務存取您的照片
    
    **客戶端**
    - 請求存取資源的應用程式
    - 必須向授權伺服器註冊
    - 範例：照片列印服務應用程式
    
    **授權伺服器**
    - 在驗證資源擁有者身份後發行存取權杖
    - 驗證授權許可
    - 範例：雲端儲存提供商的 OAuth 伺服器
    
    **資源伺服器**
    - 託管受保護的資源
    - 驗證存取權杖並提供請求服務
    - 範例：提供照片檔案的雲端儲存 API

這些角色透過一系列明確定義的流程互動，每個流程都針對不同的應用程式類型和安全需求進行最佳化。

## 授權碼流程：黃金標準

授權碼流程是最安全的 OAuth 流程，建議用於能夠安全儲存客戶端密鑰的應用程式。

### 流程概覽

```mermaid
sequenceDiagram
    participant User as 👤 資源擁有者
    participant Browser as 🌐 瀏覽器
    participant Client as 📱 客戶端應用程式
    participant AuthServer as 🔐 授權伺服器
    participant ResourceServer as 💾 資源伺服器

    User->>Browser: 1. 點擊「連接帳戶」
    Browser->>AuthServer: 2. 授權請求<br/>(client_id, redirect_uri, scope)
    AuthServer->>User: 3. 顯示登入和同意畫面
    User->>AuthServer: 4. 驗證身份並核准
    AuthServer->>Browser: 5. 重新導向並附帶授權碼
    Browser->>Client: 6. 授權碼
    Client->>AuthServer: 7. 交換授權碼取得權杖<br/>(code, client_id, client_secret)
    AuthServer->>Client: 8. 存取權杖 + 重新整理權杖
    Client->>ResourceServer: 9. 使用存取權杖的 API 請求
    ResourceServer->>Client: 10. 受保護的資源資料
```

### 逐步分解

!!!anote "📋 授權碼流程步驟"
    **1. 使用者啟動授權**
    - 使用者在客戶端應用程式中點擊「使用 [服務] 連接」
    - 客戶端將使用者重新導向至授權伺服器
    
    **2. 授權請求**
    - response_type=code：請求授權碼
    - client_id：識別客戶端應用程式
    - redirect_uri：發送授權碼的位置
    - scope：請求的權限
    - state：CSRF 保護權杖
    
    **3. 使用者身份驗證和同意**
    - 授權伺服器驗證使用者身份（登入畫面）
    - 顯示包含請求權限的同意畫面
    - 使用者核准或拒絕存取
    
    **4. 發行授權碼**
    - 短期授權碼（通常 10 分鐘）
    - 透過瀏覽器重新導向回傳
    - 僅限單次使用
    
    **5. 權杖交換**
    - 客戶端交換授權碼取得權杖
    - 包含客戶端密鑰（伺服器對伺服器）
    - 授權碼被消耗並失效
    
    **6. 存取權杖回應**
    - 用於 API 請求的存取權杖
    - 用於取得新存取權杖的重新整理權杖
    - 以秒為單位的過期時間
    
    **7. API 存取**
    - 客戶端在請求中包含存取權杖
    - 資源伺服器驗證權杖
    - 回傳受保護的資源

**授權請求範例：**
```
GET /authorize?
  response_type=code&
  client_id=CLIENT_ID&
  redirect_uri=https://client.app/callback&
  scope=read:photos&
  state=RANDOM_STRING
```

**授權碼回應：**
```
HTTP/1.1 302 Found
Location: https://client.app/callback?
  code=AUTHORIZATION_CODE&
  state=RANDOM_STRING
```

**權杖交換請求：**
```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=https://client.app/callback&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET
```

**存取權杖回應：**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "read:photos"
}
```

**API 存取範例：**
```
GET /api/photos
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### 為什麼這個流程是安全的

授權碼流程提供多層安全保護：

!!!success "🔒 安全功能"
    **關注點分離**
    - 授權碼暴露給瀏覽器（較不敏感）
    - 存取權杖從不暴露給瀏覽器
    - 客戶端密鑰僅用於伺服器對伺服器通訊
    
    **短期憑證**
    - 授權碼快速過期（10 分鐘）
    - 授權碼僅限單次使用
    - 存取權杖有時限（通常 1 小時）
    
    **CSRF 保護**
    - state 參數防止跨站請求偽造
    - 客戶端驗證 state 符合原始請求
    
    **客戶端身份驗證**
    - 客戶端密鑰在權杖交換期間證明客戶端身份
    - 防止授權碼攔截攻擊

這個流程適用於網路應用程式、具有後端伺服器的行動應用程式，以及任何能夠保護客戶端密鑰的場景。

## 隱式流程：已棄用且危險

隱式流程是為無法安全儲存客戶端密鑰的瀏覽器應用程式設計的。然而，由於安全漏洞，它已被棄用。

### 隱式流程如何運作

```mermaid
sequenceDiagram
    participant User as 👤 資源擁有者
    participant Browser as 🌐 瀏覽器/SPA
    participant AuthServer as 🔐 授權伺服器
    participant ResourceServer as 💾 資源伺服器

    User->>Browser: 1. 點擊「登入」
    Browser->>AuthServer: 2. 授權請求<br/>(response_type=token)
    AuthServer->>User: 3. 驗證身份並同意
    AuthServer->>Browser: 4. 重新導向並附帶存取權杖<br/>(在 URL 片段中)
    Browser->>Browser: 5. 從 URL 提取權杖
    Browser->>ResourceServer: 6. 使用權杖的 API 請求
    ResourceServer->>Browser: 7. 受保護的資源
```

### 為什麼隱式流程被棄用

!!!error "🚫 隱式流程安全問題"
    **存取權杖暴露**
    - 權杖在 URL 片段中回傳
    - 在瀏覽器歷史記錄中可見
    - 記錄在伺服器存取日誌中
    - 暴露給瀏覽器擴充功能
    - 容易受到 XSS 攻擊
    
    **無客戶端身份驗證**
    - 無客戶端密鑰驗證
    - 無法驗證客戶端身份
    - 更容易偽裝客戶端
    
    **無重新整理權杖**
    - 無法安全發行重新整理權杖
    - 權杖過期時使用者必須重新驗證
    - 使用者體驗不佳
    
    **權杖洩漏途徑**
    - Referrer 標頭可能洩漏權杖
    - 瀏覽器歷史記錄儲存權杖
    - 共用電腦暴露權杖
    - 無安全儲存機制

現代應用程式應該使用帶有 PKCE 的授權碼流程。

## PKCE：保護公開客戶端

代碼交換證明金鑰（PKCE，發音為「pixie」）擴展了授權碼流程，以保護無法儲存密鑰的公開客戶端。

### 公開客戶端問題

行動應用程式和單頁應用程式面臨根本挑戰：

!!!warning "⚠️ 公開客戶端挑戰"
    **無法安全儲存密鑰**
    - 行動應用程式代碼可以被反編譯
    - JavaScript 原始碼在瀏覽器中可見
    - 無客戶端密鑰的安全儲存
    - 密鑰會暴露給所有使用者
    
    **授權碼攔截**
    - 惡意應用程式可以註冊相同的重新導向 URI
    - 授權碼被攻擊者攔截
    - 攻擊者交換授權碼取得權杖
    - 無客戶端密鑰來防止這種情況

PKCE 透過添加無法預先提取的動態、每次請求密鑰來解決這個問題。

### PKCE 流程

```mermaid
sequenceDiagram
    participant User as 👤 資源擁有者
    participant Client as 📱 行動應用程式/SPA
    participant AuthServer as 🔐 授權伺服器
    participant ResourceServer as 💾 資源伺服器

    Client->>Client: 1. 產生 code_verifier<br/>(隨機字串)
    Client->>Client: 2. 建立 code_challenge<br/>(驗證器的 SHA256 雜湊)
    User->>Client: 3. 啟動登入
    Client->>AuthServer: 4. 授權請求<br/>(code_challenge, method)
    AuthServer->>User: 5. 驗證身份並同意
    AuthServer->>Client: 6. 授權碼
    Client->>AuthServer: 7. 權杖請求<br/>(code, code_verifier)
    AuthServer->>AuthServer: 8. 驗證 code_challenge<br/>符合 code_verifier
    AuthServer->>Client: 9. 存取權杖
    Client->>ResourceServer: 10. API 請求
    ResourceServer->>Client: 11. 受保護的資源
```

### PKCE 實作細節

!!!anote "🔐 PKCE 參數"
    **代碼驗證器**
    - 隨機字串：43-128 個字元
    - 密碼學隨機
    - 每次授權請求都重新產生
    - 範例：dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    
    **代碼挑戰**
    - 代碼驗證器的 SHA256 雜湊（建議）
    - 或純文字代碼驗證器（不建議）
    - 在授權請求中發送
    - 範例：E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    
    **伺服器驗證過程**
    - 授權伺服器將 code_challenge 與授權碼一起儲存
    - 在權杖交換期間驗證 code_verifier 符合
    - 防止授權碼攔截攻擊
    - 公式：SHA256(code_verifier) == stored_code_challenge

**PKCE 授權請求：**
```
GET /authorize?
  response_type=code&
  client_id=CLIENT_ID&
  redirect_uri=https://app.example.com/callback&
  scope=read:photos&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

**PKCE 權杖請求：**
```
POST /token

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=https://app.example.com/callback&
client_id=CLIENT_ID&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### 為什麼 PKCE 有效

!!!success "✅ PKCE 安全優勢"
    **動態密鑰**
    - 每次請求產生代碼驗證器
    - 無法從應用程式預先提取
    - 攻擊者無法預測或重複使用驗證器
    
    **授權碼綁定**
    - 代碼挑戰將授權碼綁定到客戶端實例
    - 被攔截的授權碼在沒有代碼驗證器的情況下無用
    - 只有啟動流程的客戶端才能交換授權碼
    
    **無需儲存密鑰**
    - 不需要客戶端密鑰
    - 對行動應用程式和 SPA 安全
    - 在不儲存密鑰的情況下維持安全性
    
    **向後相容**
    - 與現有 OAuth 伺服器相容（如果支援）
    - 可與客戶端密鑰一起使用
    - 現在建議所有 OAuth 客戶端使用

PKCE 現在建議所有 OAuth 客戶端使用，包括能夠儲存密鑰的機密客戶端，作為額外的安全層。
## 客戶端憑證流程：服務對服務

客戶端憑證流程是為不涉及使用者的機器對機器通訊設計的。

### 何時使用客戶端憑證

!!!anote "🤖 客戶端憑證使用案例"
    **後端服務**
    - 微服務之間的通訊
    - 存取 API 的排程作業
    - 伺服器對伺服器整合
    - 不需要使用者上下文
    
    **特徵**
    - 客戶端代表自己行動
    - 不涉及資源擁有者
    - 客戶端憑證就是授權
    - 通常是長期或快取的權杖

### 客戶端憑證流程

```mermaid
sequenceDiagram
    participant Client as 🖥️ 客戶端服務
    participant AuthServer as 🔐 授權伺服器
    participant ResourceServer as 💾 資源伺服器

    Client->>AuthServer: 1. 權杖請求<br/>(client_id, client_secret, scope)
    AuthServer->>AuthServer: 2. 驗證客戶端憑證
    AuthServer->>Client: 3. 存取權杖
    Client->>ResourceServer: 4. 使用權杖的 API 請求
    ResourceServer->>Client: 5. 受保護的資源
```

### 實作

!!!anote "📋 客戶端憑證實作"
    **權杖請求過程**
    - 向授權伺服器發送客戶端憑證
    - 包含請求的範圍
    - 直接接收存取權杖
    
    **權杖回應內容**
    - 用於 API 請求的存取權杖
    - 權杖類型（通常為 Bearer）
    - 以秒為單位的過期時間
    - 授予的範圍
    
    **API 請求使用**
    - 在 Authorization 標頭中包含存取權杖
    - 使用 Bearer 權杖格式
    - 資源伺服器驗證權杖

**客戶端憑證權杖請求：**
```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET&
scope=api:read api:write
```

**權杖回應：**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read api:write"
}
```

**API 請求：**
```
GET /api/resources
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

這個流程很直接，但需要安全儲存客戶端憑證，且應該只用於服務對服務通訊。

## 常見的 OAuth 誤解

OAuth 經常被誤解，導致安全漏洞和實作錯誤。

### OAuth 不是身份驗證

最常見的誤解是 OAuth 提供身份驗證。它並不提供。

!!!error "🚫 OAuth ≠ 身份驗證"
    **OAuth 提供什麼**
    - 授權：存取資源的權限
    - 委託的 API 存取
    - 範圍權限
    
    **OAuth 不提供什麼**
    - 使用者身份驗證
    - 使用者身份驗證
    - 身份資訊
    
    **問題**
    - 存取權杖證明授權，不是身份
    - 權杖可能發行給不同使用者
    - 沒有標準方式取得使用者資訊
    - 容易受到權杖替換攻擊

### 「使用 OAuth 登入」反模式

許多應用程式僅使用 OAuth 實作「使用 [服務] 登入」：

**不安全的實作示例：**
```javascript
// 不安全：不要這樣做
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const token = await exchangeCodeForToken(code);
  
  // 假設權杖屬於合法使用者
  const user = await getUserFromToken(token);
  req.session.userId = user.id; // 有漏洞
});
```

!!!warning "⚠️ 不安全的 OAuth 登入模式"
    **有缺陷的實作**
    - 應用程式交換授權碼取得存取權杖
    - 假設權杖屬於合法使用者
    - 直接使用權杖設定工作階段（有漏洞）
    
    **攻擊場景**
    - 攻擊者取得其帳戶的有效存取權杖
    - 攻擊者誘騙受害者使用攻擊者的權杖
    - 受害者以攻擊者身份登入
    - 受害者的行動歸因於攻擊者的帳戶
    - 資料洩漏和帳戶混淆

### 使用 OpenID Connect 進行身份驗證

OpenID Connect (OIDC) 擴展 OAuth 2.0 以提供身份驗證：

!!!success "✅ OpenID Connect 解決方案"
    **OIDC 添加什麼**
    - ID 權杖：包含使用者身份聲明的 JWT
    - UserInfo 端點：標準化的使用者資訊
    - 身份驗證驗證
    - 標準化聲明（sub、name、email 等）

**安全實作：**
```javascript
// 安全：使用 OpenID Connect
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const tokens = await exchangeCodeForTokens(code);
  
  // 驗證 ID 權杖簽名和聲明
  const idToken = await verifyIdToken(tokens.id_token);
  
  // ID 權杖包含已驗證的使用者身份
  req.session.userId = idToken.sub;
  req.session.email = idToken.email;
});
```

**ID 權杖結構：**
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

使用 OAuth 2.0 進行 API 授權。使用 OpenID Connect 進行使用者身份驗證。
## 權杖安全最佳實務

存取權杖是持有者權杖——任何擁有權杖的人都可以使用它。適當的權杖處理至關重要。

!!!anote "🔒 權杖安全指南"
    **儲存**
    - 永遠不要將權杖儲存在 localStorage（容易受到 XSS 攻擊）
    - 對網路應用程式使用 httpOnly cookies
    - 在行動裝置上使用安全儲存 API（Keychain、KeyStore）
    - 如果儲存在資料庫中，請加密權杖
    
    **傳輸**
    - 始終使用 HTTPS/TLS
    - 在 Authorization 標頭中包含權杖，不要在 URL 中
    - 永遠不要在應用程式日誌中記錄權杖
    - 避免在查詢參數中發送權杖
    
    **驗證**
    - 驗證權杖簽名（對於 JWT）
    - 檢查權杖過期
    - 驗證權杖受眾和發行者
    - 驗證權杖範圍符合所需權限
    
    **生命週期管理**
    - 使用短期存取權杖（通常 1 小時）
    - 實作重新整理權杖輪換
    - 登出時撤銷權杖
    - 監控權杖重複使用嘗試
    
    **範圍原則**
    - 請求最少必要的範圍
    - 在資源伺服器上驗證範圍
    - 不要授予過多權限
    - 實作基於範圍的存取控制

## 重新整理權杖：延長存取

重新整理權杖實現長期存取，而無需使用者頻繁重新驗證。

### 重新整理權杖流程

```mermaid
sequenceDiagram
    participant Client as 📱 客戶端應用程式
    participant AuthServer as 🔐 授權伺服器
    participant ResourceServer as 💾 資源伺服器

    Client->>ResourceServer: 1. 使用存取權杖的 API 請求
    ResourceServer->>Client: 2. 401 未授權（權杖過期）
    Client->>AuthServer: 3. 重新整理權杖請求<br/>(refresh_token, client_id)
    AuthServer->>AuthServer: 4. 驗證重新整理權杖
    AuthServer->>Client: 5. 新存取權杖 + 新重新整理權杖
    Client->>ResourceServer: 6. 使用新權杖的 API 請求
    ResourceServer->>Client: 7. 受保護的資源
```

### 重新整理權杖安全

!!!warning "⚠️ 重新整理權杖風險"
    **高價值目標**
    - 長期憑證（數天到數月）
    - 可以產生新的存取權杖
    - 對攻擊者比存取權杖更有價值
    - 需要更強的保護
    
    **安全措施**
    - 重新整理權杖輪換：每次使用時發行新的重新整理權杖
    - 偵測重新整理權杖重複使用（表示被盜）
    - 將重新整理權杖綁定到客戶端
    - 在可疑活動時撤銷權杖系列
    - 安全儲存重新整理權杖（加密）
    - 實作重新整理權杖過期
    
    **重新整理權杖輪換**
    ```
    請求：  refresh_token=OLD_TOKEN
    回應：   access_token=NEW_ACCESS
            refresh_token=NEW_REFRESH
    
    舊重新整理權杖立即失效
    重複使用舊權杖觸發安全警報
    ```

重新整理權杖輪換現在被認為是最佳實務，防止權杖重放攻擊並限制權杖被盜的損害。

## 結論

OAuth 2.0 提供了一個強大的委託授權框架，使應用程式能夠在不分享密碼的情況下存取使用者資源。透過將授權與身份驗證分離，OAuth 創建了清楚的安全邊界，同時實現了現代 API 生態系統。

帶有 PKCE 的授權碼流程代表了大多數應用程式的當前最佳實務，為機密和公開客戶端提供強大的安全性。已棄用的隱式流程應該完全避免。客戶端憑證流程服務於不涉及使用者的機器對機器場景。每個流程都解決特定的安全需求和應用程式架構。

理解 OAuth 提供授權而非身份驗證是至關重要的。需要使用者身份驗證的應用程式應該使用 OpenID Connect，它以標準化身份驗證擴展 OAuth。將 OAuth 存取權杖視為身份證明會造成嚴重的安全漏洞。

權杖安全需要仔細注意儲存、傳輸、驗證和生命週期管理。存取權杖應該是短期的，透過 HTTPS 傳輸，並安全儲存。重新整理權杖作為長期且強大的憑證，需要更強的保護，包括輪換和重複使用偵測。

OAuth 2.0 不是單一協定，而是為不同場景提供多種流程的框架。選擇適當的流程、正確實作，並遵循安全最佳實務，對於建構安全、使用者友善的應用程式至關重要。OAuth 的複雜性反映了它所解決的安全問題的複雜性——在不分享憑證的情況下進行委託存取本質上是具有挑戰性的，而 OAuth 為這些挑戰提供了經過實戰考驗的解決方案。