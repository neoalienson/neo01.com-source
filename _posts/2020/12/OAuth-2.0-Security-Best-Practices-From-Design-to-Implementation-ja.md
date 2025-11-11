---
title: OAuth 2.0 セキュリティベストプラクティス - 設計から実装まで
date: 2020-12-25
categories:
  - Cybersecurity
tags:
  - Security
  - Best Practices
  - Authentication
lang: ja
excerpt: "OAuth 2.0はアクセストークンを取得するだけではありません。攻撃者に悪用される前に、ユーザーデータを保護し、一般的な脆弱性を防ぐ安全な認可フローの設計方法を学びましょう。"
thumbnail: /assets/security/lock.png
series: authentication
---

チュートリアルを見たことがあるでしょう。このコードをコピーして、クライアントIDを追加すれば、ユーザーはGoogleでログインできます。開発環境では完璧に動作します。達成感を持って本番環境にデプロイします。

そして、セキュリティチームの誰かが何気なく言います。「ねえ、なぜアクセストークンがサーバーログに表示されているの？」さらに悪いことに、ペネトレーションテスターがリフレッシュトークンがlocalStorageに保存されており、ページ上のあらゆるスクリプトからアクセス可能だと指摘します。突然、そのチュートリアルコードはもはや信頼できないように感じられます。

安全なOAuth 2.0は、ライブラリを統合するときに始まるのではありません。アプリケーション設計時に始まります。コードを書く前に行う決定が、認可フローがユーザーを保護するか、攻撃にさらすかを決定します。

これはOAuthライブラリやIDプロバイダーについてではなく、戦略についてです。後でパッチを当てるのではなく、脆弱性を防ぐ認可フローを設計することです。

## なぜOAuth 2.0セキュリティ戦略が重要なのか

**侵害テスト**：攻撃者があなたのアプリケーションを標的にしたとき、トークンを盗んだり、ユーザーになりすましたり、未承認のリソースにアクセスしたりできますか？それとも、攻撃を非現実的にする防御を設計しましたか？

**安全でないOAuthのコスト**：
- **アカウント乗っ取り**：攻撃者がトークンを盗み、ユーザーアカウントにアクセス
- **データ漏洩**：漏洩したトークンが機密ユーザーデータを露出
- **コンプライアンス違反**：不十分なセキュリティによるGDPR、HIPAA罰金
- **評判の損害**：セキュリティインシデント後にユーザーが信頼を失う

**安全なOAuthの価値**：
- **ユーザー保護**：トークンは短命で、適切にスコープされ、保護されている
- **攻撃防止**：PKCE、状態検証、安全なストレージが一般的な攻撃を防ぐ
- **コンプライアンス**：規制のセキュリティ要件を満たす
- **信頼**：ユーザーはデータが保護されていることに自信を持つ

!!!warning "⚠️ デプロイ後にOAuthセキュリティを修正することはできません"
    トークンが侵害されたとき、遡及的に保護することはできません。すべてのトークンを取り消し、脆弱性を修正し、ユーザーに再認証を強制する必要があります。最初から正しくセキュリティを設計してください。

## OAuth 2.0の基礎

OAuth 2.0は認可フレームワークであり、認証プロトコルではありません。アプリケーションが資格情報を公開せずに、ユーザーに代わってリソースにアクセスできるようにします。

### 主要な概念

**リソースオーナー（Resource Owner）**：データを所有するユーザー。

**クライアント（Client）**：ユーザーデータへのアクセスを要求するアプリケーション。

**認可サーバー（Authorization Server）**：ユーザーを認証した後、アクセストークンを発行（例：Auth0、Okta、AWS Cognito）。

**リソースサーバー（Resource Server）**：保護されたリソースをホストするAPI（例：バックエンドAPI）。

**アクセストークン（Access Token）**：リソースへのアクセスを許可する短命な資格情報。

**リフレッシュトークン（Refresh Token）**：新しいアクセストークンを取得するために使用される長命な資格情報。

**スコープ（Scope）**：クライアントがアクセスできるリソースを定義（例：`read:profile`、`write:posts`）。

### OAuth 2.0フロータイプ

**認可コードフロー（Authorization Code Flow）**：Webアプリケーションに最も安全。ユーザーが認証し、認可コードを受け取り、コードをトークンと交換。

**PKCEを使用した認可コードフロー（Authorization Code Flow with PKCE）**：モバイルおよびシングルページアプリケーションの強化されたセキュリティ。認可コードの傍受を防ぐ。

**インプリシットフロー（Implicit Flow）**：非推奨。トークンがURLフラグメントで直接返される。トークン漏洩に脆弱。

**クライアント資格情報フロー（Client Credentials Flow）**：マシン間通信用。ユーザーは関与しない。

**リソースオーナーパスワード資格情報フロー（Resource Owner Password Credentials Flow）**：非推奨。クライアントがユーザー名/パスワードを直接収集。絶対に必要でない限り避ける。

!!!warning "⚠️ インプリシットフローは絶対に使用しない"
    インプリシットフローはURLフラグメントでトークンを返すため、ログに記録されたり、キャッシュされたり、Refererヘッダーを通じて漏洩したりする可能性があります。常にPKCEを使用した認可コードフローを使用してください。

## 設計時のOAuthセキュリティ戦略

安全なOAuthには、実装前の計画、標準、アーキテクチャの決定が必要です。

### 適切なフローを選択する

**Webアプリケーション（サーバーサイド）**：認可コードフロー

```
ユーザー → ログイン → 認可サーバー → 認可コード → バックエンド
バックエンド → コードをトークンと交換 → 認可サーバー → アクセストークン + リフレッシュトークン
バックエンド → トークンを安全に保存 → データベース（暗号化）
```

**シングルページアプリケーション（SPA）**：PKCEを使用した認可コードフロー

```
ユーザー → ログイン → 認可サーバー → 認可コード
SPA → コード + コード検証子を交換 → 認可サーバー → アクセストークン
SPA → トークンをメモリに保存（localStorageではない）
```

**モバイルアプリケーション**：PKCEを使用した認可コードフロー

```
ユーザー → ログイン → 認可サーバー → 認可コード
アプリ → コード + コード検証子を交換 → 認可サーバー → アクセストークン + リフレッシュトークン
アプリ → リフレッシュトークンを安全なストレージに保存（Keychain/Keystore）
```

**バックエンドサービス（ユーザーなし）**：クライアント資格情報フロー

```
サービス → クライアントID + シークレットでトークンを要求 → 認可サーバー → アクセストークン
サービス → トークンを使用してAPI呼び出し → リソースサーバー
```

### PKCE（Proof Key for Code Exchange）を実装する

PKCEは認可コード傍受攻撃を防ぎます。モバイルおよびSPAアプリケーションに必須です。

**PKCEの動作方法**：

1. クライアントがランダムな`code_verifier`を生成（43-128文字）
2. クライアントが`code_challenge` = BASE64URL(SHA256(code_verifier))を作成
3. クライアントが認可リクエストで`code_challenge`を送信
4. 認可サーバーが`code_challenge`を保存
5. クライアントが認可コード + `code_verifier`をトークンと交換
6. 認可サーバーがSHA256(code_verifier)が保存された`code_challenge`と一致することを検証

**なぜPKCEが重要か**：攻撃者が認可コードを傍受しても、`code_verifier`なしではトークンと交換できません。

```javascript
// PKCEパラメータを生成
function generatePKCE() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

// 認可リクエスト
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

// トークン交換
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

### 状態パラメータを検証する

`state`パラメータはOAuthフロー中のCSRF攻撃を防ぎます。

**状態検証の動作方法**：

1. クライアントが認可リクエスト前にランダムな`state`値を生成
2. クライアントが`state`をセッションに保存
3. クライアントが認可リクエストに`state`を含める
4. 認可サーバーが認可コードと共に`state`を返す
5. クライアントが返された`state`が保存された値と一致することを検証

**なぜ状態が重要か**：攻撃者がユーザーを騙して悪意のあるアプリケーションを承認させることを防ぎます。

```javascript
// 状態を生成して保存
const state = generateRandomString(32);
sessionStorage.setItem('oauth_state', state);

// 認可リクエストに状態を含める
window.location.href = `https://auth.neo01.com/authorize?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  response_type=code&
  scope=openid profile email&
  state=${state}`;

// コールバックで状態を検証
const returnedState = new URLSearchParams(window.location.search).get('state');
const storedState = sessionStorage.getItem('oauth_state');

if (returnedState !== storedState) {
  throw new Error('State validation failed - possible CSRF attack');
}

sessionStorage.removeItem('oauth_state');
```

### スコープ戦略を定義する

スコープはトークンがアクセスできるリソースを制限します。最小権限の原則に従います。

**スコープの命名規則**：

```
read:profile     - ユーザープロファイルを読み取る
write:profile    - ユーザープロファイルを更新する
read:posts       - ユーザー投稿を読み取る
write:posts      - 投稿を作成/更新する
delete:posts     - 投稿を削除する
admin:users      - すべてのユーザーを管理（管理者のみ）
```

**スコープ設計の原則**：

- **細粒度**：読み取りと書き込みの権限を分離
- **リソースベース**：リソースタイプごとのスコープ（プロファイル、投稿、コメント）
- **階層的**：`admin:*`はすべての権限を意味する
- **最小限**：現在の操作に必要なスコープのみを要求

```javascript
// 悪い：すべてのスコープを事前に要求
const scopes = 'read:profile write:profile read:posts write:posts delete:posts admin:users';

// 良い：最小限のスコープを要求し、必要に応じてさらに要求
const scopes = 'read:profile read:posts';

// 後で、ユーザーが投稿を作成したいとき
const additionalScopes = 'write:posts';
```

### トークンストレージ戦略

トークンを保存する場所がセキュリティを決定します。

**Webアプリケーション（サーバーサイド）**：

- **アクセストークン**：サーバーサイドセッションまたは暗号化データベース
- **リフレッシュトークン**：暗号化データベース、ブラウザには送信しない
- **絶対に使用しない**：localStorage、sessionStorage、JavaScriptからアクセス可能なクッキー

**シングルページアプリケーション**：

- **アクセストークン**：メモリのみ（JavaScript変数）
- **リフレッシュトークン**：SPAには推奨されない；サイレントリフレッシュで短命なアクセストークンを使用
- **絶対に使用しない**：localStorage（XSSに脆弱）、sessionStorage（XSSに脆弱）

**モバイルアプリケーション**：

- **アクセストークン**：メモリのみ
- **リフレッシュトークン**：安全なストレージ（iOS Keychain、Android Keystore）
- **絶対に使用しない**：共有設定、UserDefaults、プレーンファイル

```javascript
// 悪い：localStorageにトークンを保存（XSSに脆弱）
localStorage.setItem('access_token', accessToken);

// 良い：メモリのみに保存
let accessToken = null;

function setAccessToken(token) {
  accessToken = token;
}

function getAccessToken() {
  return accessToken;
}

// ログアウトまたはページアンロード時にクリア
window.addEventListener('beforeunload', () => {
  accessToken = null;
});
```

### トークンライフタイム戦略

セキュリティとユーザーエクスペリエンスのバランスを取ります。

**アクセストークン**：
- **ライフタイム**：15分から1時間
- **なぜ短いか**：トークンが侵害された場合の損害を制限
- **リフレッシュ**：リフレッシュトークンを使用して新しいアクセストークンを取得

**リフレッシュトークン**：
- **ライフタイム**：7-90日（または取り消されるまで）
- **なぜ長いか**：ユーザーに頻繁に再認証を強制することを避ける
- **ローテーション**：使用するたびに新しいリフレッシュトークンを発行し、古いものを取り消す

**IDトークン**（OpenID Connect）：
- **ライフタイム**：5-15分
- **目的**：ユーザー認証、認可ではない
- **検証**：署名、発行者、オーディエンス、有効期限を検証

```json
{
  "access_token_lifetime": 900,
  "refresh_token_lifetime": 2592000,
  "id_token_lifetime": 300,
  "refresh_token_rotation": true,
  "refresh_token_reuse_detection": true
}
```

### リフレッシュトークンローテーション

リフレッシュトークンローテーションはトークンリプレイ攻撃を防ぎます。

**ローテーションの動作方法**：

1. クライアントがリフレッシュトークンを使用して新しいアクセストークンを要求
2. 認可サーバーが新しいアクセストークン + 新しいリフレッシュトークンを発行
3. 認可サーバーが古いリフレッシュトークンを取り消す
4. 古いリフレッシュトークンが再度使用された場合、トークンファミリー全体を取り消す（侵害を示す）

**なぜローテーションが重要か**：リフレッシュトークンが盗まれても、一度しか使用できません。その後の使用はすべてのトークンの取り消しをトリガーします。

```javascript
// ローテーション付きトークンリフレッシュ
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
  
  // 新しいトークンを保存
  setAccessToken(data.access_token);
  await secureStorage.set('refresh_token', data.refresh_token);
  
  // 古いリフレッシュトークンは無効
  return data.access_token;
}
```

## 一般的なOAuth 2.0の脆弱性

### 認可コード傍受

**攻撃**：攻撃者が認可コードを傍受してトークンと交換。

**防止**：PKCEを使用。コードが傍受されても、code_verifierなしでは攻撃者はトークンと交換できません。

### URLでのトークン漏洩

**攻撃**：URLパラメータのトークンがログに記録されたり、キャッシュされたり、Refererヘッダーを通じて漏洩したりする。

**防止**：インプリシットフローを絶対に使用しない。POSTリクエストでトークンを交換する認可コードフローを使用。

### クロスサイトスクリプティング（XSS）

**攻撃**：攻撃者がJavaScriptを注入してlocalStorageまたはクッキーからトークンを盗む。

**防止**：トークンをメモリのみ（SPA）またはサーバーサイド（Webアプリ）に保存。コンテンツセキュリティポリシー（CSP）を使用。

### クロスサイトリクエストフォージェリ（CSRF）

**攻撃**：攻撃者がユーザーを騙して悪意のあるアプリケーションを承認させる。

**防止**：`state`パラメータを検証。状態がランダムで予測不可能であり、ユーザーセッションに紐付けられていることを確認。

### リフレッシュトークン盗難

**攻撃**：攻撃者がリフレッシュトークンを盗み、無制限のアクセストークンを取得。

**防止**：リフレッシュトークンローテーションを実装。再利用を検出してトークンファミリーを取り消す。

### オープンリダイレクト

**攻撃**：攻撃者が`redirect_uri`を操作して認可コードを盗む。

**防止**：認可サーバーで正確なリダイレクトURIをホワイトリストに登録。ワイルドカードや部分一致を許可しない。

```javascript
// 悪い：任意のredirect_uriを許可
const redirectUri = req.query.redirect_uri; // 攻撃者がこれを制御

// 良い：正確なURIをホワイトリストに登録
const allowedRedirectUris = [
  'https://app.neo01.com/callback',
  'https://app.neo01.com/auth/callback'
];

if (!allowedRedirectUris.includes(redirectUri)) {
  throw new Error('Invalid redirect_uri');
}
```

## OAuth 2.0実装チェックリスト

**認可フロー**：
- ✅ 認可コードフローを使用（インプリシットフローではない）
- ✅ モバイルおよびSPAアプリケーションにPKCEを実装
- ✅ CSRFを防ぐために`state`パラメータを検証
- ✅ 正確なリダイレクトURIをホワイトリストに登録（ワイルドカードなし）

**トークン管理**：
- ✅ アクセストークンは15-60分で期限切れ
- ✅ リフレッシュトークンは7-90日で期限切れ
- ✅ リフレッシュトークンローテーションを実装
- ✅ 再利用されたリフレッシュトークンを検出して取り消す

**トークンストレージ**：
- ✅ アクセストークンをメモリ（SPA）またはサーバーサイド（Webアプリ）に保存
- ✅ リフレッシュトークンを安全なストレージ（モバイル）またはサーバーサイド（Webアプリ）に保存
- ✅ localStorageまたはsessionStorageにトークンを保存しない

**スコープ管理**：
- ✅ 必要な最小限のスコープを要求
- ✅ リソースサーバーでスコープを検証
- ✅ 細粒度でリソースベースのスコープを使用

**セキュリティヘッダー**：
- ✅ コンテンツセキュリティポリシー（CSP）を実装
- ✅ すべてのOAuthエンドポイントでHTTPSを使用
- ✅ クッキーにSecureおよびHttpOnlyフラグを設定

**監視**：
- ✅ 認証イベントをログに記録（ログイン、ログアウト、トークンリフレッシュ）
- ✅ 疑わしいパターンにアラート（複数回のログイン失敗、トークン再利用）
- ✅ トークンの使用と有効期限を監視

## OAuth 2.0 vs OpenID Connect

**OAuth 2.0**：認可フレームワーク。「このアプリケーションは何にアクセスできるか？」に答える。

**OpenID Connect**：OAuth 2.0の上の認証レイヤー。「このユーザーは誰か？」に答える。

**OAuth 2.0を使用する場合**：リソース（API、データ）へのアクセスを許可。

**OpenID Connectを使用する場合**：ユーザー認証とID検証。

**主な違い**：OpenID Connectはユーザーのアイデンティティ情報を含むIDトークン（JWT）を追加。

```javascript
// OAuth 2.0：アクセストークンのみ
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:profile read:posts"
}

// OpenID Connect：アクセストークン + IDトークン
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

## OAuth 2.0セキュリティベストプラクティス

### すべての場所でHTTPSを使用

すべてのOAuthエンドポイントはHTTPSを使用する必要があります。HTTP経由で送信されたトークンは傍受される可能性があります。

### JWT署名を検証

アクセストークンとしてJWTを使用する場合、常に署名、発行者、オーディエンス、有効期限を検証します。

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

### レート制限を実装

トークンエンドポイントへのブルートフォース攻撃を防ぎます。

```
POST /token: IPごとに1分あたり5リクエスト
POST /authorize: ユーザーごとに1分あたり10リクエスト
```

### ログアウト時にトークンを取り消す

ユーザーがログアウトしたら、すべてのトークン（アクセスとリフレッシュ）を取り消します。

```javascript
async function logout(userId, refreshToken) {
  // リフレッシュトークンを取り消す
  await revokeRefreshToken(refreshToken);
  
  // ユーザーのすべてのアクティブセッションを取り消す
  await revokeAllUserSessions(userId);
  
  // クライアント側のトークンをクリア
  setAccessToken(null);
  await secureStorage.remove('refresh_token');
}
```

### トークン使用を監視

セキュリティ分析のためにトークン関連イベントをログに記録して監視します。

```
INFO [SECURITY.AUTH]: ユーザーログイン成功 | user_id={id} ip={ip}
WARNING [SECURITY.AUTH]: トークンリフレッシュ失敗 | user_id={id} reason={expired}
ALERT [SECURITY.AUTH]: リフレッシュトークン再利用検出 | user_id={id} token_id={id}
CRITICAL [SECURITY.AUTH]: トークン取り消しトリガー | user_id={id} reason={reuse_detected}
```

## 選択をする

OAuth 2.0セキュリティはオプションではありません—必須です。問題は、最初から適切に設計するか、セキュリティインシデント後に改造するかです。

適切なフローから始めましょう：最新のアプリケーションにはPKCEを使用した認可コード。状態検証、リフレッシュトークンローテーション、安全なストレージを実装します。最小限のスコープと短いトークンライフタイムを定義します。

覚えておいてください：OAuth 2.0はアプリケーションの認可フレームワークです。正しく実装されれば、ユーザーを保護し、不正アクセスを防ぎます。不適切に実装されれば、セキュリティの最も弱いリンクになります。

最初から正しくOAuthセキュリティを設計してください。ユーザー、そしてセキュリティチームが感謝するでしょう。
