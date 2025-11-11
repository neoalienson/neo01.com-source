---
title: OAuth 2.0 安全最佳實踐 - 從設計到實作
date: 2020-12-25
categories:
  - Cybersecurity
tags:
  - Security
  - Best Practices
  - Authentication
lang: zh-TW
excerpt: "OAuth 2.0 不只是取得存取權杖。學習如何設計安全的授權流程，在攻擊者利用漏洞之前，保護使用者資料並防止常見漏洞。"
thumbnail: /assets/security/lock.png
series: authentication
---

你看過那些教學文章。複製這段程式碼，加入你的 client ID，然後砰——使用者就能用 Google 登入了。在開發環境中運作得很完美。你滿懷成就感地部署到正式環境。

然後你的資安團隊某個人隨口提到：「嘿，為什麼存取權杖會出現在我們的伺服器日誌裡？」或者更糟的是，滲透測試人員指出你的更新權杖存放在 localStorage 中，任何頁面上的腳本都能存取。突然間，那些教學程式碼感覺不再那麼可靠了。

安全的 OAuth 2.0 不是從整合函式庫時開始。它從應用程式設計時就開始了。你在撰寫程式碼之前做的決定，決定了你的授權流程是保護使用者還是讓他們暴露在攻擊之下。

這不是關於 OAuth 函式庫或身分提供者——而是關於策略。這是關於設計能預防漏洞的授權流程，而不是事後修補。

## 為什麼 OAuth 2.0 安全策略很重要

**入侵測試**：當攻擊者鎖定你的應用程式時，他們能竊取權杖、冒充使用者或存取未授權的資源嗎？還是你已經設計了讓攻擊變得不切實際的防禦機制？

**不安全 OAuth 的代價**：
- **帳號接管**：攻擊者竊取權杖並存取使用者帳號
- **資料外洩**：洩漏的權杖暴露敏感使用者資料
- **合規違規**：GDPR、HIPAA 因安全不足而罰款
- **聲譽損害**：使用者在安全事件後失去信任

**安全 OAuth 的價值**：
- **使用者保護**：權杖生命週期短、適當限定範圍且安全
- **攻擊預防**：PKCE、狀態驗證和安全儲存防止常見攻擊
- **合規性**：符合法規的安全要求
- **信任**：使用者對資料受到保護感到有信心

!!!warning "⚠️ 部署後無法修復 OAuth 安全問題"
    當權杖被洩露時，你無法追溯性地保護它們。你必須撤銷所有權杖、修復漏洞並強制使用者重新驗證。從一開始就設計好安全性。

## OAuth 2.0 基礎

OAuth 2.0 是授權框架，不是驗證協定。它允許應用程式代表使用者存取資源，而不暴露憑證。

### 核心概念

**資源擁有者（Resource Owner）**：擁有資料的使用者。

**客戶端（Client）**：請求存取使用者資料的應用程式。

**授權伺服器（Authorization Server）**：在驗證使用者後發放存取權杖（例如 Auth0、Okta、AWS Cognito）。

**資源伺服器（Resource Server）**：託管受保護資源的 API（例如你的後端 API）。

**存取權杖（Access Token）**：授予資源存取權限的短期憑證。

**更新權杖（Refresh Token）**：用於取得新存取權杖的長期憑證。

**範圍（Scope）**：定義客戶端可以存取哪些資源（例如 `read:profile`、`write:posts`）。

### OAuth 2.0 流程類型

**授權碼流程（Authorization Code Flow）**：網頁應用程式最安全的方式。使用者驗證、接收授權碼、交換授權碼以取得權杖。

**授權碼流程搭配 PKCE（Authorization Code Flow with PKCE）**：行動裝置和單頁應用程式的增強安全性。防止授權碼攔截。

**隱式流程（Implicit Flow）**：已棄用。權杖直接在 URL 片段中回傳。容易發生權杖洩漏。

**客戶端憑證流程（Client Credentials Flow）**：用於機器對機器通訊。不涉及使用者。

**資源擁有者密碼憑證流程（Resource Owner Password Credentials Flow）**：已棄用。客戶端直接收集使用者名稱/密碼。除非絕對必要，否則避免使用。

!!!warning "⚠️ 絕不使用隱式流程"
    隱式流程在 URL 片段中回傳權杖，可能被記錄、快取或透過 Referer 標頭洩漏。永遠使用授權碼流程搭配 PKCE。

## 設計階段的 OAuth 安全策略

安全的 OAuth 需要在實作前進行規劃、標準化和架構決策。

### 選擇正確的流程

**網頁應用程式（伺服器端）**：授權碼流程

```
使用者 → 登入 → 授權伺服器 → 授權碼 → 後端
後端 → 交換授權碼取得權杖 → 授權伺服器 → 存取權杖 + 更新權杖
後端 → 安全儲存權杖 → 資料庫（加密）
```

**單頁應用程式（SPA）**：授權碼流程搭配 PKCE

```
使用者 → 登入 → 授權伺服器 → 授權碼
SPA → 交換授權碼 + 程式碼驗證器 → 授權伺服器 → 存取權杖
SPA → 將權杖儲存在記憶體中（不是 localStorage）
```

**行動應用程式**：授權碼流程搭配 PKCE

```
使用者 → 登入 → 授權伺服器 → 授權碼
應用程式 → 交換授權碼 + 程式碼驗證器 → 授權伺服器 → 存取權杖 + 更新權杖
應用程式 → 將更新權杖儲存在安全儲存中（Keychain/Keystore）
```

**後端服務（無使用者）**：客戶端憑證流程

```
服務 → 使用客戶端 ID + 密鑰請求權杖 → 授權伺服器 → 存取權杖
服務 → 使用權杖進行 API 呼叫 → 資源伺服器
```

### 實作 PKCE（程式碼交換證明金鑰）

PKCE 防止授權碼攔截攻擊。行動裝置和 SPA 應用程式必須使用。

**PKCE 運作方式**：

1. 客戶端產生隨機 `code_verifier`（43-128 個字元）
2. 客戶端建立 `code_challenge` = BASE64URL(SHA256(code_verifier))
3. 客戶端在授權請求中傳送 `code_challenge`
4. 授權伺服器儲存 `code_challenge`
5. 客戶端交換授權碼 + `code_verifier` 以取得權杖
6. 授權伺服器驗證 SHA256(code_verifier) 符合儲存的 `code_challenge`

**為什麼 PKCE 重要**：即使攻擊者攔截授權碼，沒有 `code_verifier` 也無法交換權杖。

```javascript
// 產生 PKCE 參數
function generatePKCE() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

// 授權請求
const { codeVerifier, codeChallenge } = generatePKCE();
sessionStorage.setItem('code_verifier', codeVerifier);

window.location.href = `https://auth.neo01.com/authorize?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  response_type=code&
  scope=openid profile email&
  code_challenge=${codeChallenge}&
  code_challenge_method=S256&
  state=${state}`;

// 權杖交換
const codeVerifier = sessionStorage.getItem('code_verifier');
const response = await fetch('https://auth.neo01.com/token', {
  method: 'POST',
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  })
});
```

### 驗證狀態參數

`state` 參數防止 OAuth 流程中的 CSRF 攻擊。

**狀態驗證運作方式**：

1. 客戶端在授權請求前產生隨機 `state` 值
2. 客戶端將 `state` 儲存在 session 中
3. 客戶端在授權請求中包含 `state`
4. 授權伺服器與授權碼一起回傳 `state`
5. 客戶端驗證回傳的 `state` 符合儲存的值

**為什麼狀態重要**：防止攻擊者誘騙使用者授權惡意應用程式。

```javascript
// 產生並儲存狀態
const state = generateRandomString(32);
sessionStorage.setItem('oauth_state', state);

// 授權請求包含狀態
window.location.href = `https://auth.neo01.com/authorize?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  response_type=code&
  scope=openid profile email&
  state=${state}`;

// 在回呼中驗證狀態
const returnedState = new URLSearchParams(window.location.search).get('state');
const storedState = sessionStorage.getItem('oauth_state');

if (returnedState !== storedState) {
  throw new Error('State validation failed - possible CSRF attack');
}

sessionStorage.removeItem('oauth_state');
```

### 定義範圍策略

範圍限制權杖可以存取的資源。遵循最小權限原則。

**範圍命名慣例**：

```
read:profile     - 讀取使用者個人資料
write:profile    - 更新使用者個人資料
read:posts       - 讀取使用者貼文
write:posts      - 建立/更新貼文
delete:posts     - 刪除貼文
admin:users      - 管理所有使用者（僅限管理員）
```

**範圍設計原則**：

- **細粒度**：分離讀取和寫入權限
- **基於資源**：每種資源類型的範圍（個人資料、貼文、留言）
- **階層式**：`admin:*` 意味著所有權限
- **最小化**：僅請求當前操作所需的範圍

```javascript
// 不好：預先請求所有範圍
const scopes = 'read:profile write:profile read:posts write:posts delete:posts admin:users';

// 好：請求最小範圍，需要時再請求更多
const scopes = 'read:profile read:posts';

// 稍後，當使用者想建立貼文時
const additionalScopes = 'write:posts';
```

### 權杖儲存策略

你儲存權杖的位置決定了安全性。

**網頁應用程式（伺服器端）**：

- **存取權杖**：伺服器端 session 或加密資料庫
- **更新權杖**：加密資料庫，絕不傳送到瀏覽器
- **絕不**：localStorage、sessionStorage、JavaScript 可存取的 cookies

**單頁應用程式**：

- **存取權杖**：僅記憶體（JavaScript 變數）
- **更新權杖**：不建議用於 SPA；使用短期存取權杖搭配靜默更新
- **絕不**：localStorage（容易受 XSS 攻擊）、sessionStorage（容易受 XSS 攻擊）

**行動應用程式**：

- **存取權杖**：僅記憶體
- **更新權杖**：安全儲存（iOS Keychain、Android Keystore）
- **絕不**：共享偏好設定、UserDefaults、純文字檔案

```javascript
// 不好：將權杖儲存在 localStorage（容易受 XSS 攻擊）
localStorage.setItem('access_token', accessToken);

// 好：僅儲存在記憶體中
let accessToken = null;

function setAccessToken(token) {
  accessToken = token;
}

function getAccessToken() {
  return accessToken;
}

// 登出或頁面卸載時清除
window.addEventListener('beforeunload', () => {
  accessToken = null;
});
```

### 權杖生命週期策略

平衡安全性和使用者體驗。

**存取權杖**：
- **生命週期**：15 分鐘到 1 小時
- **為什麼短**：限制權杖被洩露時的損害
- **更新**：使用更新權杖取得新的存取權杖

**更新權杖**：
- **生命週期**：7-90 天（或直到撤銷）
- **為什麼長**：避免頻繁強制使用者重新驗證
- **輪換**：每次使用時發放新的更新權杖，撤銷舊的

**ID 權杖**（OpenID Connect）：
- **生命週期**：5-15 分鐘
- **目的**：使用者驗證，不是授權
- **驗證**：驗證簽章、發行者、受眾、過期時間

```json
{
  "access_token_lifetime": 900,
  "refresh_token_lifetime": 2592000,
  "id_token_lifetime": 300,
  "refresh_token_rotation": true,
  "refresh_token_reuse_detection": true
}
```

### 更新權杖輪換

更新權杖輪換防止權杖重放攻擊。

**輪換運作方式**：

1. 客戶端使用更新權杖請求新的存取權杖
2. 授權伺服器發放新的存取權杖 + 新的更新權杖
3. 授權伺服器撤銷舊的更新權杖
4. 如果舊的更新權杖再次被使用，撤銷整個權杖家族（表示洩露）

**為什麼輪換重要**：如果更新權杖被竊取，只能使用一次。後續使用會觸發所有權杖的撤銷。

```javascript
// 帶輪換的權杖更新
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://auth.neo01.com/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId
    })
  });

  const data = await response.json();
  
  // 儲存新權杖
  setAccessToken(data.access_token);
  await secureStorage.set('refresh_token', data.refresh_token);
  
  // 舊的更新權杖現在無效
  return data.access_token;
}
```

## 常見的 OAuth 2.0 漏洞

### 授權碼攔截

**攻擊**：攻擊者攔截授權碼並交換權杖。

**預防**：使用 PKCE。即使授權碼被攔截，沒有 code_verifier 攻擊者也無法交換權杖。

### URL 中的權杖洩漏

**攻擊**：URL 參數中的權杖被記錄、快取或透過 Referer 標頭洩漏。

**預防**：絕不使用隱式流程。使用授權碼流程，透過 POST 請求交換權杖。

### 跨站腳本攻擊（XSS）

**攻擊**：攻擊者注入 JavaScript 從 localStorage 或 cookies 竊取權杖。

**預防**：僅將權杖儲存在記憶體中（SPA）或伺服器端（網頁應用程式）。使用內容安全政策（CSP）。

### 跨站請求偽造（CSRF）

**攻擊**：攻擊者誘騙使用者授權惡意應用程式。

**預防**：驗證 `state` 參數。確保狀態是隨機的、不可預測的，並與使用者 session 綁定。

### 更新權杖竊取

**攻擊**：攻擊者竊取更新權杖並取得無限的存取權杖。

**預防**：實作更新權杖輪換。偵測重複使用並撤銷權杖家族。

### 開放重新導向

**攻擊**：攻擊者操縱 `redirect_uri` 以竊取授權碼。

**預防**：在授權伺服器中將確切的重新導向 URI 加入白名單。絕不允許萬用字元或部分符合。

```javascript
// 不好：允許任何 redirect_uri
const redirectUri = req.query.redirect_uri; // 攻擊者控制這個

// 好：將確切的 URI 加入白名單
const allowedRedirectUris = [
  'https://app.neo01.com/callback',
  'https://app.neo01.com/auth/callback'
];

if (!allowedRedirectUris.includes(redirectUri)) {
  throw new Error('Invalid redirect_uri');
}
```

## OAuth 2.0 實作檢查清單

**授權流程**：
- ✅ 使用授權碼流程（不是隱式流程）
- ✅ 為行動裝置和 SPA 應用程式實作 PKCE
- ✅ 驗證 `state` 參數以防止 CSRF
- ✅ 將確切的重新導向 URI 加入白名單（無萬用字元）

**權杖管理**：
- ✅ 存取權杖在 15-60 分鐘後過期
- ✅ 更新權杖在 7-90 天後過期
- ✅ 實作更新權杖輪換
- ✅ 偵測並撤銷重複使用的更新權杖

**權杖儲存**：
- ✅ 將存取權杖儲存在記憶體中（SPA）或伺服器端（網頁應用程式）
- ✅ 將更新權杖儲存在安全儲存中（行動裝置）或伺服器端（網頁應用程式）
- ✅ 絕不將權杖儲存在 localStorage 或 sessionStorage

**範圍管理**：
- ✅ 請求所需的最小範圍
- ✅ 在資源伺服器上驗證範圍
- ✅ 使用細粒度、基於資源的範圍

**安全標頭**：
- ✅ 實作內容安全政策（CSP）
- ✅ 所有 OAuth 端點使用 HTTPS
- ✅ 在 cookies 上設定 Secure 和 HttpOnly 旗標

**監控**：
- ✅ 記錄驗證事件（登入、登出、權杖更新）
- ✅ 對可疑模式發出警報（多次登入失敗、權杖重複使用）
- ✅ 監控權杖使用和過期

## OAuth 2.0 vs OpenID Connect

**OAuth 2.0**：授權框架。回答「這個應用程式可以存取什麼？」

**OpenID Connect**：OAuth 2.0 之上的驗證層。回答「這個使用者是誰？」

**何時使用 OAuth 2.0**：授予資源存取權限（API、資料）。

**何時使用 OpenID Connect**：使用者驗證和身分確認。

**關鍵差異**：OpenID Connect 新增包含使用者身分資訊的 ID 權杖（JWT）。

```javascript
// OAuth 2.0：僅存取權杖
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:profile read:posts"
}

// OpenID Connect：存取權杖 + ID 權杖
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

## OAuth 2.0 安全最佳實踐

### 全面使用 HTTPS

所有 OAuth 端點都必須使用 HTTPS。透過 HTTP 傳輸的權杖可能被攔截。

### 驗證 JWT 簽章

如果使用 JWT 作為存取權杖，務必驗證簽章、發行者、受眾和過期時間。

```javascript
const jwt = require('jsonwebtoken');

function validateAccessToken(token) {
  try {
    const decoded = jwt.verify(token, publicKey, {
      issuer: 'https://auth.neo01.com',
      audience: 'https://api.neo01.com'
    });
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 實作速率限制

防止對權杖端點的暴力攻擊。

```
POST /token: 每個 IP 每分鐘 5 次請求
POST /authorize: 每個使用者每分鐘 10 次請求
```

### 登出時撤銷權杖

當使用者登出時，撤銷所有權杖（存取和更新）。

```javascript
async function logout(userId, refreshToken) {
  // 撤銷更新權杖
  await revokeRefreshToken(refreshToken);
  
  // 撤銷使用者的所有活動 session
  await revokeAllUserSessions(userId);
  
  // 清除客戶端權杖
  setAccessToken(null);
  await secureStorage.remove('refresh_token');
}
```

### 監控權杖使用

記錄並監控與權杖相關的事件以進行安全分析。

```
INFO [SECURITY.AUTH]: 使用者登入成功 | user_id={id} ip={ip}
WARNING [SECURITY.AUTH]: 權杖更新失敗 | user_id={id} reason={expired}
ALERT [SECURITY.AUTH]: 偵測到更新權杖重複使用 | user_id={id} token_id={id}
CRITICAL [SECURITY.AUTH]: 觸發權杖撤銷 | user_id={id} reason={reuse_detected}
```

## 做出選擇

OAuth 2.0 安全不是選項——它是必要的。問題在於你是從一開始就正確設計，還是在安全事件後才進行改造。

從正確的流程開始：現代應用程式使用授權碼搭配 PKCE。實作狀態驗證、更新權杖輪換和安全儲存。定義最小範圍和短權杖生命週期。

記住：OAuth 2.0 是你應用程式的授權框架。正確實作時，它保護使用者並防止未授權存取。實作不當時，它成為你安全性中最薄弱的環節。

從一開始就正確設計 OAuth 安全。你的使用者——以及你的資安團隊——會感謝你。
