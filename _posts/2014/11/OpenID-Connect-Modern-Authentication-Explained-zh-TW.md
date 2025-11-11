---
title: "OpenID Connect：現代身份驗證詳解"
date: 2014-11-11
lang: zh-TW
categories: Cybersecurity
tags: [Security, Authentication, OIDC, OAuth, SSO, JWT]
excerpt: "OpenID Connect 基於 OAuth 2.0 建構，為現代應用程式提供標準化的身份驗證。了解 OIDC 如何統一身份驗證和授權、何時使用它而不是 SAML，以及如何安全實作。"
thumbnail: /assets/security/lock.png
series: authentication
---

OAuth 2.0 革新了 API 授權，但開發人員誤用它進行身份驗證，造成了安全漏洞。OpenID Connect（OIDC）於 2014 年出現，透過在 OAuth 2.0 之上新增標準化的身分層來解決這個問題。OIDC 提供了開發人員真正需要的：一個在統一流程中處理身份驗證（你是誰）和授權（你可以存取什麼）的現代協定。

這種混淆是可以理解的。開發人員看到 OAuth 在「使用 Google 登入」中的成功，並假設 OAuth 是一個身份驗證協定。他們會取得存取權杖並將其視為身分證明。這造成了安全問題——存取權杖不是為證明身分而設計的，它們授予對資源的存取權限。不同的提供者以不同的方式實作使用者資訊端點，導致實作不一致且不安全。

OIDC 透過引入 ID 權杖解決了這個問題——一個專門設計用於證明使用者身分的 JWT。當你使用 OIDC 進行身份驗證時，你會同時收到 ID 權杖（證明你是誰）和存取權杖（授予 API 存取權限）。這種明確的分離消除了混淆並提供了安全的身份驗證和標準化的使用者資訊。

本文涵蓋 OIDC 基礎、架構、身份驗證流程、實際實作、安全性考量，以及何時選擇 OIDC 而不是 SAML 等替代方案。

## OIDC 基礎

OpenID Connect 透過身分層擴展 OAuth 2.0，提供標準化的身份驗證。

### 核心概念

OIDC 建立在 OAuth 2.0 的基礎之上：

!!!anote "🆔 OIDC 核心概念"
    **基於 OAuth 2.0**
    - 使用 OAuth 流程
    - 新增 ID 權杖
    - 標準化使用者資訊
    - 結合身份驗證和授權
    
    **ID 權杖**
    - JWT（JSON Web Token）
    - 包含使用者身分宣告
    - 數位簽章
    - 可由客戶端驗證
    
    **標準端點**
    - 授權端點
    - 權杖端點
    - 使用者資訊端點
    - 探索端點

ID 權杖是 OIDC 的關鍵創新。它是一個包含使用者 ID、電子郵件和姓名等身分宣告的 JWT。權杖由授權伺服器數位簽章，允許客戶端驗證其真實性而無需回呼伺服器。這提供了安全、高效的身份驗證。

### OIDC vs OAuth

理解 OIDC 和 OAuth 之間的區別至關重要：

!!!tip "🎯 OIDC vs OAuth"
    **OAuth 2.0**
    - 授權協定
    - 授予對資源的存取權限
    - API 的存取權杖
    - 不證明身分
    
    **OpenID Connect**
    - 身份驗證協定
    - 證明使用者身分
    - 身份驗證的 ID 權杖
    - 基於 OAuth 2.0
    
    **關鍵區別**
    - OAuth：「你可以存取什麼？」
    - OIDC：「你是誰？」 + 「你可以存取什麼？」

OAuth 回答「你可以存取什麼？」OIDC 回答「你是誰？」和「你可以存取什麼？」如果你需要身份驗證，使用 OIDC。如果你只需要 API 授權而不需要使用者身分，使用 OAuth。

## OIDC 架構

OIDC 定義了實體及其互動：

### 實體

OIDC 涉及四個主要實體：

!!!anote "🏗️ OIDC 實體"
    **最終使用者**
    - 進行身份驗證的人
    - 擁有資源
    - 授予權限
    
    **依賴方（RP）**
    - 客戶端應用程式
    - 請求身份驗證
    - 使用 ID 權杖
    - Web 應用、行動應用或 SPA
    
    **OpenID 提供者（OP）**
    - 授權伺服器
    - 驗證使用者身分
    - 頒發 ID 權杖和存取權杖
    - 範例：Auth0、Okta、Azure AD
    
    **資源伺服器**
    - 託管受保護的 API
    - 驗證存取權杖
    - 傳回受保護的資源

依賴方（RP）是請求身份驗證的應用程式——你的 Web 應用、行動應用或單頁應用程式。OpenID 提供者（OP）是驗證使用者身分並頒發權杖的授權伺服器。資源伺服器託管接受存取權杖的 API。

### 架構圖

{% mermaid %}---
title: OpenID Connect 架構
---
flowchart TD
    User([使用者])
    Client[客戶端應用程式<br/>Web/行動]
    AuthServer[授權伺服器<br/>Auth0/Okta]
    API1[資源伺服器<br/>使用者 API]
    API2[資源伺服器<br/>支付 API]
    API3[資源伺服器<br/>資料 API]
    
    User -->|登入| Client
    Client <-->|1. 身份驗證請求<br/>2. ID 權杖 + 存取權杖| AuthServer
    Client -->|存取權杖| API1
    Client -->|存取權杖| API2
    Client -->|存取權杖| API3
    API1 -.->|驗證權杖| AuthServer
    API2 -.->|驗證權杖| AuthServer
    API3 -.->|驗證權杖| AuthServer
    
    style AuthServer fill:#f96,stroke:#333,stroke-width:3px
    style Client fill:#9cf,stroke:#333,stroke-width:2px
{% endmermaid %}

客戶端透過授權伺服器驗證使用者身分，接收 ID 權杖和存取權杖。客戶端使用 ID 權杖建立使用者身分。資源伺服器驗證存取權杖以授權 API 請求。

## 身份驗證流程

OIDC 支援多種身份驗證流程以適應不同場景。

### 授權碼流程

授權碼流程是最安全且推薦的流程：

!!!anote "🔄 授權碼流程"
    **使用案例**
    - 帶後端的 Web 應用程式
    - 行動應用程式
    - 最安全的選項
    - 建議用於所有機密客戶端
    
    **流程步驟**
    1. 使用者點選「登入」
    2. 客戶端重新導向到授權端點
    3. 使用者在 OP 進行身份驗證
    4. OP 重新導向回授權碼
    5. 客戶端交換碼以取得權杖（後端）
    6. 客戶端接收 ID 權杖和存取權杖
    7. 客戶端驗證 ID 權杖
    8. 客戶端提取使用者身分
    9. 客戶端使用存取權杖進行 API 呼叫
    
    **安全特性**
    - 權杖永不暴露給瀏覽器
    - 客戶端密鑰保護權杖交換
    - 授權碼是一次性的
    - 短期碼

此流程透過在後端使用客戶端密鑰將授權碼交換為權杖來保持權杖安全。授權碼透過瀏覽器傳遞，但權杖不會，從而保護它們免受基於瀏覽器的攻擊。

{% mermaid %}---
title: OpenID Connect 身份驗證流程
---
sequenceDiagram
    participant User as 使用者
    participant Client as 客戶端
    participant AuthServer as 授權伺服器
    participant API as 資源伺服器
    
    User->>Client: 點選「登入」
    Client->>AuthServer: 授權請求
    AuthServer->>User: 登入頁面
    User->>AuthServer: 憑證
    AuthServer->>Client: 授權碼
    Client->>AuthServer: 交換碼 + 客戶端密鑰
    AuthServer->>Client: ID 權杖 + 存取權杖
    Note over Client: 驗證 ID 權杖簽章
    Client->>Client: 提取使用者身分
    Client->>API: API 請求 + 存取權杖
    API->>API: 驗證存取權杖
    API->>Client: 受保護的資源
{% endmermaid %}

### 帶 PKCE 的授權碼流程

PKCE（代碼交換證明金鑰）為公共客戶端增加了安全性：

!!!anote "🔐 PKCE 擴充"
    **目的**
    - 保護公共客戶端
    - 行動應用
    - 單頁應用程式
    - 無客戶端密鑰
    
    **運作原理**
    1. 客戶端產生代碼驗證器（隨機字串）
    2. 客戶端建立代碼挑戰（驗證器的雜湊）
    3. 客戶端在身份驗證請求中傳送代碼挑戰
    4. OP 儲存代碼挑戰
    5. 客戶端交換碼 + 代碼驗證器以取得權杖
    6. OP 驗證驗證器與挑戰符合
    
    **安全優勢**
    - 防止授權碼攔截
    - 無需客戶端密鑰即可運作
    - 行動裝置和 SPA 必需

PKCE 防止授權碼攔截攻擊。即使攻擊者攔截了授權碼，他們也無法在沒有代碼驗證器的情況下將其交換為權杖，而代碼驗證器永遠不會離開客戶端。

### 隱式流程（已棄用）

隱式流程是為基於瀏覽器的應用設計的，但現在已棄用：

!!!error "🚫 隱式流程 - 已棄用"
    **為何存在**
    - 基於瀏覽器的應用
    - 無後端伺服器
    - URL 片段中的權杖
    
    **為何棄用**
    - 權杖在瀏覽器中暴露
    - URL 片段洩漏風險
    - 無重新整理權杖
    - 安全漏洞
    
    **改用**
    - 帶 PKCE 的授權碼流程
    - 提供更好的安全性
    - 適用於 SPA

不要在新應用程式中使用隱式流程。即使對於單頁應用程式，也使用帶 PKCE 的授權碼流程。現代瀏覽器和函式庫安全地支援這一點。

### 客戶端憑證流程

用於機器對機器身份驗證：

!!!anote "🤖 客戶端憑證流程"
    **使用案例**
    - 後端服務
    - 微服務
    - 排程作業
    - 無使用者互動
    
    **流程**
    1. 服務使用客戶端 ID 和密鑰進行身份驗證
    2. OP 頒發存取權杖
    3. 服務使用權杖進行 API 呼叫
    
    **特徵**
    - 不涉及使用者
    - 服務帳戶身份驗證
    - 無 ID 權杖（無使用者身分）
    - 僅存取權杖

此流程用於不涉及使用者的服務對服務身份驗證。後端服務使用其憑證進行身份驗證並接收存取權杖以呼叫 API。

## ID 權杖深入探討

ID 權杖是 OIDC 的核心創新。

### ID 權杖結構

ID 權杖是具有三個部分的 JWT：

!!!anote "🎫 ID 權杖結構"
    **標頭**
    - 權杖類型（JWT）
    - 簽章演算法（RS256 等）
    - 驗證的金鑰 ID
    
    **承載（宣告）**
    - iss：頒發者（OP URL）
    - sub：主體（使用者 ID）
    - aud：受眾（客戶端 ID）
    - exp：過期時間
    - iat：頒發時間
    - nonce：重播保護
    - email、name 等：使用者屬性
    
    **簽章**
    - 數位簽章
    - 驗證權杖真實性
    - 防止竄改

範例 ID 權杖承載：

    {
      "iss": "https://auth.example.com",
      "sub": "user123",
      "aud": "client_abc",
      "exp": 1699999999,
      "iat": 1699996399,
      "nonce": "random_nonce",
      "email": "user@example.com",
      "name": "John Doe",
      "email_verified": true
    }

### ID 權杖驗證

客戶端必須正確驗證 ID 權杖：

!!!warning "⚠️ ID 權杖驗證要求"
    **必需檢查**
    1. 使用 OP 的公開金鑰驗證簽章
    2. 檢查頒發者（iss）與預期 OP 符合
    3. 檢查受眾（aud）與客戶端 ID 符合
    4. 檢查過期時間（exp）未過期
    5. 驗證 nonce 與請求符合
    6. 檢查頒發時間（iat）合理
    
    **安全影響**
    - 跳過驗證會造成漏洞
    - 攻擊者可以偽造權杖
    - 權杖替換攻擊
    - 始終完全驗證

永遠不要跳過 ID 權杖驗證。每個檢查都防止特定的攻擊。簽章驗證防止偽造。受眾檢查防止權杖替換。過期檢查防止重播攻擊。

### 標準宣告

OIDC 為使用者資訊定義了標準宣告：

!!!anote "📋 標準宣告"
    **個人資料宣告**
    - name：全名
    - given_name：名字
    - family_name：姓氏
    - middle_name：中間名
    - nickname：暱稱
    - picture：個人資料照片 URL
    - website：網頁 URL
    
    **聯絡宣告**
    - email：電子郵件地址
    - email_verified：電子郵件驗證狀態
    - phone_number：電話號碼
    - phone_number_verified：電話驗證狀態
    
    **地址宣告**
    - address：結構化地址物件
    
    **其他宣告**
    - birthdate：出生日期
    - gender：性別
    - locale：區域設定/語言
    - zoneinfo：時區

客戶端使用範圍請求特定宣告。openid 範圍是必需的。profile、email 和 phone 等附加範圍請求附加宣告。

## 使用者資訊端點

使用者資訊端點提供額外的使用者資訊。

### 目的和用法

!!!anote "ℹ️ 使用者資訊端點"
    **目的**
    - 擷取額外的使用者屬性
    - 補充 ID 權杖宣告
    - 標準化端點
    
    **用法**
    1. 客戶端取得存取權杖
    2. 客戶端使用權杖呼叫使用者資訊端點
    3. OP 以 JSON 形式傳回使用者宣告
    
    **何時使用**
    - 需要比 ID 權杖包含的更多宣告
    - ID 權杖大小限制
    - 動態使用者資訊

使用者資訊端點以 JSON 格式傳回使用者宣告。它使用存取權杖呼叫，並根據權杖的範圍傳回宣告。

範例使用者資訊回應：

    {
      "sub": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "picture": "https://example.com/photo.jpg",
      "email_verified": true
    }

## 探索和中繼資料

OIDC 提供自動設定探索。

### 探索端點

探索端點傳回 OP 設定：

!!!anote "🔍 OIDC 探索"
    **端點**
    - `/.well-known/openid-configuration`
    - 傳回 JSON 中繼資料
    - 自動設定
    
    **中繼資料包括**
    - 授權端點 URL
    - 權杖端點 URL
    - 使用者資訊端點 URL
    - 支援的範圍
    - 支援的回應類型
    - 簽章演算法
    - JWKS URI（公開金鑰）

範例探索 URL：`https://auth.example.com/.well-known/openid-configuration`

這使得客戶端可以自動設定。客戶端擷取探索文件並自行設定，無需手動端點設定。

## OIDC 實務

實際 OIDC 實作考量。

### 提供者選擇

選擇 OIDC 提供者：

!!!tip "🎯 OIDC 提供者選擇"
    **託管提供者**
    - Auth0：開發者友善，功能廣泛
    - Okta：企業重點，強大支援
    - Azure AD：Microsoft 生態系統整合
    - Google Identity：消費者和企業
    - AWS Cognito：AWS 生態系統整合
    
    **自託管**
    - Keycloak：開源，功能豐富
    - ORY Hydra：雲原生，輕量級
    - Authelia：自託管，注重隱私
    
    **考量因素**
    - 合規要求
    - 可擴展性需求
    - 成本結構
    - 開發者體驗
    - 支援要求

託管提供者提供更簡單的設定和維護。自託管選項提供更多控制和資料隱私。根據你的要求、團隊能力和預算進行選擇。

### 整合函式庫

使用標準函式庫進行 OIDC 整合：

!!!success "✅ OIDC 函式庫"
    **JavaScript/Node.js**
    - oidc-client-ts：瀏覽器和 Node.js
    - passport-openidconnect：Node.js 中介軟體
    - next-auth：Next.js 整合
    
    **Python**
    - authlib：全面的 OAuth/OIDC
    - python-jose：JWT 處理
    - flask-oidc：Flask 整合
    
    **Java**
    - Spring Security OAuth：Spring 整合
    - pac4j：多協定支援
    
    **C#/.NET**
    - IdentityModel：OIDC 客戶端函式庫
    - Microsoft.Identity.Web：ASP.NET Core
    
    **行動裝置**
    - AppAuth：iOS 和 Android
    - React Native AppAuth：React Native

不要從頭實作 OIDC。使用維護良好的函式庫來處理協定細節、權杖驗證和安全最佳實務。

### 實作範例

基本 OIDC 流程實作：

    // 1. 重新導向到授權端點
    const authUrl = `${issuer}/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=openid profile email&` +
      `state=${state}&` +
      `nonce=${nonce}`;
    
    window.location.href = authUrl;
    
    // 2. 處理回呼（後端）
    const tokenResponse = await fetch(`${issuer}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    
    const { id_token, access_token } = await tokenResponse.json();
    
    // 3. 驗證 ID 權杖
    const decoded = jwt.verify(id_token, publicKey, {
      issuer: issuer,
      audience: clientId
    });
    
    // 4. 提取使用者身分
    const userId = decoded.sub;
    const email = decoded.email;

這顯示了基本流程：重新導向到授權端點，交換碼以取得權杖，驗證 ID 權杖，提取使用者身分。

## 安全性考量

OIDC 安全最佳實務。

### 權杖安全

小心保護權杖：

!!!warning "⚠️ 權杖安全最佳實務"
    **儲存**
    - 永不在 localStorage 中儲存權杖
    - 儘可能使用 httpOnly cookie
    - 靜態加密權杖
    - 登出時清除權杖
    
    **傳輸**
    - 始終使用 HTTPS
    - 驗證 TLS 憑證
    - 避免在 URL 中使用權杖
    - 使用安全標頭
    
    **驗證**
    - 驗證權杖簽章
    - 檢查過期時間
    - 驗證頒發者
    - 驗證受眾
    - 檢查 nonce
    
    **輪換**
    - 短期存取權杖（15 分鐘）
    - 重新整理權杖輪換
    - 撤銷機制
    - 監控濫用

權杖是持有者憑證——任何擁有權杖的人都可以使用它。在 localStorage 中儲存權杖會使其暴露於 XSS 攻擊。在信任權杖之前，始終完全驗證權杖。

### 公共客戶端的 PKCE

始終對公共客戶端使用 PKCE：

!!!tip "🔐 PKCE 最佳實務"
    **何時使用**
    - 行動應用程式
    - 單頁應用程式
    - 任何公共客戶端
    - 即使對機密客戶端（縱深防禦）
    
    **實作**
    - 產生加密隨機驗證器
    - 使用 S256 挑戰方法（SHA-256）
    - 永不重用驗證器
    - 在伺服器端驗證

PKCE 現在建議用於所有 OAuth/OIDC 流程，不僅僅是公共客戶端。它提供了針對授權碼攔截的縱深防禦。

### State 和 Nonce

使用 state 和 nonce 參數：

!!!warning "⚠️ State 和 Nonce 參數"
    **State 參數**
    - 防止 CSRF 攻擊
    - 隨機、不可預測的值
    - 在回呼時驗證
    - 安全必需
    
    **Nonce 參數**
    - 防止重播攻擊
    - 包含在 ID 權杖中
    - 由客戶端驗證
    - 將權杖繫結到工作階段

這兩個參數對安全至關重要。State 防止 CSRF 攻擊，攻擊者誘騙使用者使用攻擊者控制的帳戶進行身份驗證。Nonce 防止權杖重播攻擊。

## OIDC vs SAML

在 OIDC 和 SAML 之間選擇。

### 比較

!!!tip "🎯 OIDC vs SAML 決策"
    **選擇 SAML 當：**
    - 與舊版企業應用整合
    - 供應商僅支援 SAML
    - 現有 SAML 基礎設施
    - 法規要求指定 SAML
    
    **選擇 OIDC 當：**
    - 建構新應用程式
    - 行動應用身份驗證
    - 需要 API 授權
    - 現代架構
    - 開發者體驗重要
    
    **技術差異**
    - SAML：基於 XML，瀏覽器重新導向
    - OIDC：基於 JSON，RESTful API
    - SAML：僅瀏覽器流程
    - OIDC：行動裝置、Web、API 支援

SAML 不會消失——太多企業應用程式依賴它。但新專案應該使用 OIDC。它更簡單、更靈活，更適合現代架構。

### 遷移路徑

許多組織同時執行兩種協定：

!!!anote "🔄 SAML 到 OIDC 遷移"
    **混合方法**
    - 保留 SAML 用於舊版應用
    - 新開發使用 OIDC
    - IdP 支援兩種協定
    - 逐步遷移
    
    **遷移步驟**
    1. 部署支援 OIDC 的 IdP
    2. 為現有應用維護 SAML
    3. 使用 OIDC 建構新應用
    4. 在可行時遷移應用
    5. 最終棄用 SAML

大多數企業 IdP 同時支援 SAML 和 OIDC。這允許逐步遷移而不會中斷現有整合。

## 常見錯誤

避免這些 OIDC 陷阱：

!!!error "🚫 OIDC 反模式"
    **不完整的權杖驗證**
    - 跳過簽章驗證
    - 不檢查過期時間
    - 忽略受眾宣告
    - 缺少 nonce 驗證
    
    **不安全的權杖儲存**
    - 儲存在 localStorage 中
    - 長期權杖
    - 無權杖輪換
    - 在日誌中暴露權杖
    
    **使用隱式流程**
    - 已棄用且不安全
    - 使用授權碼 + PKCE
    - 即使對 SPA
    
    **從頭實作**
    - 複雜的協定細節
    - 安全漏洞
    - 使用標準函式庫
    
    **混淆 OAuth 和 OIDC**
    - OAuth 是授權
    - OIDC 是身份驗證
    - 使用 OIDC 進行登入

最常見的錯誤是不完整的權杖驗證。每個驗證步驟都防止特定的攻擊。跳過任何步驟都會造成漏洞。

## 結論

OpenID Connect 解決了 OAuth 2.0 未設計解決的身份驗證問題。透過新增 ID 權杖和標準化使用者資訊端點，OIDC 提供了適用於 Web 應用程式、行動應用和 API 的安全、現代身份驗證。

OIDC 的成功來自於在 OAuth 2.0 經過驗證的基礎上建構，同時新增了缺失的身份驗證層。該協定比 SAML 更簡單，比自訂實作更安全，比舊版協定更適合現代架構。

關鍵要點：

- OIDC 用於身份驗證，OAuth 用於授權
- 對所有客戶端使用帶 PKCE 的授權碼流程
- 始終完全驗證 ID 權杖
- 使用標準函式庫，不要從頭實作
- 新專案選擇 OIDC，保留 SAML 用於舊版整合
- 小心保護權杖——它們是持有者憑證
- 使用 state 和 nonce 參數以確保安全

在建構現代應用程式時，OIDC 應該是你身份驗證的預設選擇。它提供了當今 Web、行動裝置和 API 驅動架構所需的安全性、靈活性和開發者體驗。該協定處理複雜的安全細節，讓你專注於建構功能而不是身份驗證基礎設施。

無論你使用 Auth0 或 Okta 等託管提供者，還是使用 Keycloak 自託管，OIDC 都提供了跨平台和使用案例運作的標準化身份驗證。這種標準化是 OIDC 最大的優勢——一個在任何地方都能運作的協定，實作一致，具有強大的安全屬性。
