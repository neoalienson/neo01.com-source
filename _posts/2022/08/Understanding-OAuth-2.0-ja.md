---
title: "OAuth 2.0 を理解する：現代 API を支える認可フレームワーク"
date: 2022-08-16
lang: ja
categories: Development
tags: [Security, OAuth, API, Authentication]
excerpt: "OAuth 2.0 はパスワード共有なしで安全な委任アクセスを実現します。認可フローの仕組み、よくある落とし穴、OAuth が認証ではない理由を学びましょう。"
thumbnail: /assets/security/lock.png
---

OAuth 2.0 は API 認可の事実上の標準となり、ソーシャルメディアログインから企業 API アクセスまで、あらゆる場面で使用されています。しかし、その普及にもかかわらず、OAuth は広く誤解されています。開発者はしばしば認可と認証を混同し、フローを間違って実装したり、セキュリティを損なう方法でアクセストークンを誤用したりします。

この記事では、コア概念、認可フロー、セキュリティ考慮事項を検証することで OAuth 2.0 の謎を解き明かします。異なる許可タイプでのトークンの旅路を追跡し、様々な当事者の役割を理解し、一般的な実装ミスを特定します。図表と実世界のシナリオを通じて、OAuth がシームレスなユーザー体験を提供しながらリソースを保護する方法について実用的な理解を得られるでしょう。

## OAuth 2.0 が実際に解決する問題

OAuth 以前、第三者サービス上のユーザーデータにアクセスする必要があるアプリケーションは根本的な問題に直面していました：ユーザーにパスワードを共有してもらう必要があったのです。これは複数のセキュリティと使いやすさの問題を引き起こしました。

### OAuth 以前の問題

クラウドストレージプラットフォームに保存されたあなたの写真にアクセスする必要がある写真印刷サービスを考えてみましょう：

!!!error "🚫 パスワード共有問題"
    **従来のアプローチ**
    - ユーザーが印刷サービスにクラウドストレージのユーザー名とパスワードを提供
    - 印刷サービスが認証情報を保存（セキュリティリスク）
    - 印刷サービスがすべてのユーザーデータへの完全なアクセス権を持つ
    - アクセス範囲や期間を制限する方法がない
    - パスワード変更により統合されたすべてのサービスが中断
    - どのサービスが何にアクセスしたかの監査証跡がない
    
    **セキュリティへの影響**
    - 認証情報が第三者に露出
    - 細かい権限制御がない
    - パスワード変更なしにアクセスを取り消せない
    - 最小権限の原則に違反
    - 攻撃面が大幅に増加

OAuth 2.0 は委任認可を導入することでこれを解決します：ユーザーは認証情報を共有することなく、リソースへの限定的なアクセスを許可できます。

### OAuth のコアイノベーション

OAuth は認証（あなたが誰であるかを証明）と認可（リソースへのアクセスを許可）を分離します：

!!!success "✅ OAuth 認可モデル"
    **委任アクセス**
    - ユーザーがリソース所有者（例：クラウドストレージ）で直接認証
    - ユーザーが第三者アプリケーションに特定の権限を認可
    - アプリケーションが時間制限付きアクセストークンを受信
    - トークンは要求された権限のみを付与
    - ユーザーはパスワード変更なしにいつでもアクセスを取り消し可能
    
    **主な利点**
    - パスワード共有が不要
    - 細かい権限スコープ
    - 時間制限付きアクセストークン
    - アプリケーションごとの独立した取り消し
    - アクセス許可の明確な監査証跡

このモデルにより、アプリケーションがセキュリティ境界を維持しながらシームレスに統合できる現代の API エコシステムが実現されます。

## OAuth 2.0 の役割とコンポーネント

OAuth は認可フローに参加する 4 つの異なる役割を定義します：

!!!anote "🎭 OAuth の役割"
    **リソース所有者**
    - データを所有するユーザー
    - リソースへのアクセスを認可
    - 例：あなた、印刷サービスに写真へのアクセスを許可
    
    **クライアント**
    - リソースへのアクセスを要求するアプリケーション
    - 認可サーバーに登録されている必要がある
    - 例：写真印刷サービスアプリケーション
    
    **認可サーバー**
    - リソース所有者を認証後、アクセストークンを発行
    - 認可許可を検証
    - 例：クラウドストレージプロバイダーの OAuth サーバー
    
    **リソースサーバー**
    - 保護されたリソースをホスト
    - アクセストークンを検証してリクエストを処理
    - 例：写真ファイルを提供するクラウドストレージ API

これらの役割は、異なるアプリケーションタイプとセキュリティ要件に最適化された、明確に定義されたフローシリーズを通じて相互作用します。
## 認可コードフロー：ゴールドスタンダード

認可コードフローは最も安全な OAuth フローで、クライアントシークレットを安全に保存できるアプリケーションに推奨されます。

### フロー概要

```mermaid
sequenceDiagram
    participant User as 👤 リソース所有者
    participant Browser as 🌐 ブラウザ
    participant Client as 📱 クライアントアプリケーション
    participant AuthServer as 🔐 認可サーバー
    participant ResourceServer as 💾 リソースサーバー

    User->>Browser: 1. 「アカウント接続」をクリック
    Browser->>AuthServer: 2. 認可リクエスト<br/>(client_id, redirect_uri, scope)
    AuthServer->>User: 3. ログインと同意画面を表示
    User->>AuthServer: 4. 認証して承認
    AuthServer->>Browser: 5. 認可コード付きでリダイレクト
    Browser->>Client: 6. 認可コード
    Client->>AuthServer: 7. コードをトークンに交換<br/>(code, client_id, client_secret)
    AuthServer->>Client: 8. アクセストークン + リフレッシュトークン
    Client->>ResourceServer: 9. アクセストークン付き API リクエスト
    ResourceServer->>Client: 10. 保護されたリソースデータ
```

### ステップバイステップの詳細

!!!anote "📋 認可コードフローのステップ"
    **1. ユーザーが認可を開始**
    - ユーザーがクライアントアプリケーションで「[サービス]で接続」をクリック
    - クライアントがユーザーを認可サーバーにリダイレクト
    
    **2. 認可リクエスト**
    ```
    GET /authorize?
      response_type=code&
      client_id=CLIENT_ID&
      redirect_uri=https://client.app/callback&
      scope=read:photos&
      state=RANDOM_STRING
    ```
    - `response_type=code`：認可コードを要求
    - `client_id`：クライアントアプリケーションを識別
    - `redirect_uri`：認可コードを送信する場所
    - `scope`：要求される権限
    - `state`：CSRF 保護トークン
    
    **3. ユーザー認証と同意**
    - 認可サーバーがユーザーを認証（ログイン画面）
    - 要求された権限を含む同意画面を表示
    - ユーザーがアクセスを承認または拒否
    
    **4. 認可コード発行**
    ```
    HTTP/1.1 302 Found
    Location: https://client.app/callback?
      code=AUTHORIZATION_CODE&
      state=RANDOM_STRING
    ```
    - 短期間の認可コード（通常 10 分）
    - ブラウザリダイレクトで返される
    - 一回限りの使用
    
    **5. トークン交換**
    ```
    POST /token
    Content-Type: application/x-www-form-urlencoded
    
    grant_type=authorization_code&
    code=AUTHORIZATION_CODE&
    redirect_uri=https://client.app/callback&
    client_id=CLIENT_ID&
    client_secret=CLIENT_SECRET
    ```
    - クライアントがコードをトークンに交換
    - クライアントシークレットを含む（サーバー間通信）
    - 認可コードが消費され無効化
    
    **6. アクセストークンレスポンス**
    ```json
    {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "token_type": "Bearer",
      "expires_in": 3600,
      "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
      "scope": "read:photos"
    }
    ```
    - API リクエスト用のアクセストークン
    - 新しいアクセストークン取得用のリフレッシュトークン
    - 秒単位の有効期限
    
    **7. API アクセス**
    ```
    GET /api/photos
    Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
    ```
    - クライアントがリクエストにアクセストークンを含める
    - リソースサーバーがトークンを検証
    - 保護されたリソースを返す

### なぜこのフローが安全なのか

認可コードフローは複数のセキュリティ層を提供します：

!!!success "🔒 セキュリティ機能"
    **関心の分離**
    - 認可コードがブラウザに露出（あまり機密ではない）
    - アクセストークンがブラウザに露出されない
    - クライアントシークレットはサーバー間通信でのみ使用
    
    **短期間の認証情報**
    - 認可コードが迅速に期限切れ（10 分）
    - 認可コードは一回限りの使用
    - アクセストークンに時間制限（通常 1 時間）
    
    **CSRF 保護**
    - state パラメータがクロスサイトリクエストフォージェリを防止
    - クライアントが state が元のリクエストと一致することを検証
    
    **クライアント認証**
    - クライアントシークレットがトークン交換時にクライアント身元を証明
    - 認可コード傍受攻撃を防止

このフローは、ウェブアプリケーション、バックエンドサーバーを持つモバイルアプリ、クライアントシークレットを保護できるあらゆるシナリオに適しています。

## インプリシットフロー：非推奨で危険

インプリシットフローは、クライアントシークレットを安全に保存できないブラウザベースアプリケーション用に設計されました。しかし、セキュリティ脆弱性により非推奨となっています。

### インプリシットフローの仕組み

```mermaid
sequenceDiagram
    participant User as 👤 リソース所有者
    participant Browser as 🌐 ブラウザ/SPA
    participant AuthServer as 🔐 認可サーバー
    participant ResourceServer as 💾 リソースサーバー

    User->>Browser: 1. 「ログイン」をクリック
    Browser->>AuthServer: 2. 認可リクエスト<br/>(response_type=token)
    AuthServer->>User: 3. 認証して同意
    AuthServer->>Browser: 4. アクセストークン付きでリダイレクト<br/>(URL フラグメント内)
    Browser->>Browser: 5. URL からトークンを抽出
    Browser->>ResourceServer: 6. トークン付き API リクエスト
    ResourceServer->>Browser: 7. 保護されたリソース
```

### なぜインプリシットフローが非推奨なのか

!!!error "🚫 インプリシットフローのセキュリティ問題"
    **アクセストークンの露出**
    - トークンが URL フラグメントで返される
    - ブラウザ履歴で見える
    - サーバーアクセスログに記録される
    - ブラウザ拡張機能に露出
    - XSS 攻撃に脆弱
    
    **クライアント認証なし**
    - クライアントシークレット検証なし
    - クライアント身元を検証できない
    - クライアントの偽装が容易
    
    **リフレッシュトークンなし**
    - リフレッシュトークンを安全に発行できない
    - トークン期限切れ時にユーザーが再認証必要
    - ユーザー体験が悪い
    
    **トークン漏洩経路**
    - Referrer ヘッダーがトークンを漏洩する可能性
    - ブラウザ履歴がトークンを保存
    - 共有コンピューターがトークンを露出
    - 安全な保存メカニズムがない

現代のアプリケーションは PKCE 付き認可コードフローを使用すべきです。

## PKCE：パブリッククライアントの保護

Proof Key for Code Exchange（PKCE、「ピクシー」と発音）は、シークレットを保存できないパブリッククライアントを保護するために認可コードフローを拡張します。

### パブリッククライアントの問題

モバイルアプリとシングルページアプリケーションは根本的な課題に直面します：

!!!warning "⚠️ パブリッククライアントの課題"
    **シークレットを安全に保存できない**
    - モバイルアプリのコードは逆コンパイル可能
    - JavaScript ソースコードがブラウザで見える
    - クライアントシークレットの安全な保存がない
    - シークレットがすべてのユーザーに露出される
    
    **認可コード傍受**
    - 悪意のあるアプリが同じリダイレクト URI を登録可能
    - 認可コードが攻撃者に傍受される
    - 攻撃者がコードをトークンに交換
    - これを防ぐクライアントシークレットがない

PKCE は、事前に抽出できない動的な、リクエストごとのシークレットを追加することでこれを解決します。
### PKCE フロー

```mermaid
sequenceDiagram
    participant User as 👤 リソース所有者
    participant Client as 📱 モバイルアプリ/SPA
    participant AuthServer as 🔐 認可サーバー
    participant ResourceServer as 💾 リソースサーバー

    Client->>Client: 1. code_verifier を生成<br/>(ランダム文字列)
    Client->>Client: 2. code_challenge を作成<br/>(検証器の SHA256 ハッシュ)
    User->>Client: 3. ログインを開始
    Client->>AuthServer: 4. 認可リクエスト<br/>(code_challenge, method)
    AuthServer->>User: 5. 認証して同意
    AuthServer->>Client: 6. 認可コード
    Client->>AuthServer: 7. トークンリクエスト<br/>(code, code_verifier)
    AuthServer->>AuthServer: 8. code_challenge が<br/>code_verifier と一致することを検証
    AuthServer->>Client: 9. アクセストークン
    Client->>ResourceServer: 10. API リクエスト
    ResourceServer->>Client: 11. 保護されたリソース
```

### PKCE 実装詳細

!!!anote "🔐 PKCE パラメータ"
    **コード検証器**
    - ランダム文字列：43-128 文字
    - 暗号学的にランダム
    - 認可リクエストごとに新しく生成
    - 例：`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`
    
    **コードチャレンジ**
    - コード検証器の SHA256 ハッシュ（推奨）
    - またはプレーンなコード検証器（非推奨）
    - 認可リクエストで送信
    - 例：`E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`
    
    **認可リクエスト**
    ```
    GET /authorize?
      response_type=code&
      client_id=CLIENT_ID&
      redirect_uri=https://app.example.com/callback&
      scope=read:photos&
      code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
      code_challenge_method=S256
    ```
    
    **トークンリクエスト**
    ```
    POST /token
    
    grant_type=authorization_code&
    code=AUTHORIZATION_CODE&
    redirect_uri=https://app.example.com/callback&
    client_id=CLIENT_ID&
    code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    ```
    
    **サーバー検証**
    ```
    SHA256(code_verifier) == stored_code_challenge
    ```
    - 認可サーバーが code_challenge を認可コードと一緒に保存
    - トークン交換時に code_verifier が一致することを検証
    - 認可コード傍受攻撃を防止

### なぜ PKCE が機能するのか

!!!success "✅ PKCE のセキュリティ利点"
    **動的シークレット**
    - リクエストごとにコード検証器を生成
    - アプリケーションから事前抽出不可能
    - 攻撃者が検証器を予測または再利用不可能
    
    **認可コードバインディング**
    - コードチャレンジが認可コードをクライアントインスタンスにバインド
    - 傍受された認可コードはコード検証器なしでは無用
    - フローを開始したクライアントのみがコードを交換可能
    
    **シークレット保存不要**
    - クライアントシークレット不要
    - モバイルアプリと SPA に安全
    - シークレット保存なしでセキュリティを維持
    
    **後方互換性**
    - 既存の OAuth サーバーと互換（サポートされている場合）
    - クライアントシークレットと併用可能
    - 現在すべての OAuth クライアントに推奨

PKCE は現在、シークレットを保存できる機密クライアントを含むすべての OAuth クライアントに、追加のセキュリティ層として推奨されています。

## クライアント認証情報フロー：サービス間通信

クライアント認証情報フローは、ユーザーが関与しないマシン間通信用に設計されています。

### クライアント認証情報を使用する場合

!!!anote "🤖 クライアント認証情報の使用例"
    **バックエンドサービス**
    - マイクロサービス間の通信
    - API にアクセスするスケジュールジョブ
    - サーバー間統合
    - ユーザーコンテキスト不要
    
    **特徴**
    - クライアントが自身の代理で行動
    - リソース所有者が関与しない
    - クライアント認証情報が認可
    - 通常は長期間またはキャッシュされたトークン

### クライアント認証情報フロー

```mermaid
sequenceDiagram
    participant Client as 🖥️ クライアントサービス
    participant AuthServer as 🔐 認可サーバー
    participant ResourceServer as 💾 リソースサーバー

    Client->>AuthServer: 1. トークンリクエスト<br/>(client_id, client_secret, scope)
    AuthServer->>AuthServer: 2. クライアント認証情報を検証
    AuthServer->>Client: 3. アクセストークン
    Client->>ResourceServer: 4. トークン付き API リクエスト
    ResourceServer->>Client: 5. 保護されたリソース
```

### 実装

!!!anote "📋 クライアント認証情報リクエスト"
    **トークンリクエスト**
    ```
    POST /token
    Content-Type: application/x-www-form-urlencoded
    
    grant_type=client_credentials&
    client_id=CLIENT_ID&
    client_secret=CLIENT_SECRET&
    scope=api:read api:write
    ```
    
    **トークンレスポンス**
    ```json
    {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "token_type": "Bearer",
      "expires_in": 3600,
      "scope": "api:read api:write"
    }
    ```
    
    **API リクエスト**
    ```
    GET /api/resources
    Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
    ```

このフローは単純ですが、クライアント認証情報の安全な保存が必要で、サービス間通信にのみ使用すべきです。

## よくある OAuth の誤解

OAuth はしばしば誤解され、セキュリティ脆弱性と実装エラーにつながります。

### OAuth は認証ではない

最も一般的な誤解は、OAuth が認証を提供するというものです。そうではありません。

!!!error "🚫 OAuth ≠ 認証"
    **OAuth が提供するもの**
    - 認可：リソースへのアクセス許可
    - API への委任アクセス
    - スコープ権限
    
    **OAuth が提供しないもの**
    - ユーザー身元確認
    - ユーザー認証
    - 身元情報
    
    **問題**
    - アクセストークンは認可を証明、身元ではない
    - トークンは異なるユーザーに発行される可能性
    - ユーザー情報を取得する標準的な方法がない
    - トークン置換攻撃に脆弱

### 「OAuth でログイン」アンチパターン

多くのアプリケーションが OAuth のみを使用して「[サービス]でログイン」を実装します：

!!!warning "⚠️ 安全でない OAuth ログインパターン"
    **欠陥のある実装**
    ```javascript
    // 安全でない：これをしてはいけません
    app.get('/callback', async (req, res) => {
      const { code } = req.query;
      const token = await exchangeCodeForToken(code);
      
      // トークンが正当なユーザーのものと仮定
      const user = await getUserFromToken(token);
      req.session.userId = user.id; // 脆弱
    });
    ```
    
    **攻撃シナリオ**
    - 攻撃者が自分のアカウントの有効なアクセストークンを取得
    - 攻撃者が被害者を騙して攻撃者のトークンを使用させる
    - 被害者が攻撃者としてログイン
    - 被害者の行動が攻撃者のアカウントに帰属
    - データ漏洩とアカウント混乱

### 認証には OpenID Connect を使用

OpenID Connect (OIDC) は OAuth 2.0 を拡張して認証を提供します：

!!!success "✅ OpenID Connect ソリューション"
    **OIDC が追加するもの**
    - ID トークン：ユーザー身元クレームを含む JWT
    - UserInfo エンドポイント：標準化されたユーザー情報
    - 認証検証
    - 標準化されたクレーム（sub、name、email など）
    
    **安全な実装**
    ```javascript
    // 安全：OpenID Connect を使用
    app.get('/callback', async (req, res) => {
      const { code } = req.query;
      const tokens = await exchangeCodeForTokens(code);
      
      // ID トークンの署名とクレームを検証
      const idToken = await verifyIdToken(tokens.id_token);
      
      // ID トークンには検証されたユーザー身元が含まれる
      req.session.userId = idToken.sub;
      req.session.email = idToken.email;
    });
    ```
    
    **ID トークン構造**
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

API 認可には OAuth 2.0 を使用。ユーザー認証には OpenID Connect を使用。
## トークンセキュリティのベストプラクティス

アクセストークンはベアラートークンです—トークンを所有する誰もがそれを使用できます。適切なトークン処理が重要です。

!!!anote "🔒 トークンセキュリティガイドライン"
    **保存**
    - localStorage にトークンを保存しない（XSS 攻撃に脆弱）
    - ウェブアプリケーションには httpOnly クッキーを使用
    - モバイルでは安全な保存 API を使用（Keychain、KeyStore）
    - データベースに保存する場合はトークンを暗号化
    
    **送信**
    - 常に HTTPS/TLS を使用
    - Authorization ヘッダーにトークンを含める、URL には含めない
    - アプリケーションログにトークンを記録しない
    - クエリパラメータでトークンを送信しない
    
    **検証**
    - トークン署名を検証（JWT の場合）
    - トークンの有効期限をチェック
    - トークンのオーディエンスと発行者を検証
    - トークンスコープが必要な権限と一致することを検証
    
    **ライフサイクル管理**
    - 短期間のアクセストークンを使用（通常 1 時間）
    - リフレッシュトークンローテーションを実装
    - ログアウト時にトークンを取り消し
    - トークン再利用試行を監視
    
    **スコープ原則**
    - 最小限必要なスコープを要求
    - リソースサーバーでスコープを検証
    - 過度な権限を付与しない
    - スコープベースのアクセス制御を実装

## リフレッシュトークン：アクセスの延長

リフレッシュトークンは、ユーザーが頻繁に再認証することなく長期間のアクセスを可能にします。

### リフレッシュトークンフロー

```mermaid
sequenceDiagram
    participant Client as 📱 クライアントアプリケーション
    participant AuthServer as 🔐 認可サーバー
    participant ResourceServer as 💾 リソースサーバー

    Client->>ResourceServer: 1. アクセストークン付き API リクエスト
    ResourceServer->>Client: 2. 401 未認証（トークン期限切れ）
    Client->>AuthServer: 3. リフレッシュトークンリクエスト<br/>(refresh_token, client_id)
    AuthServer->>AuthServer: 4. リフレッシュトークンを検証
    AuthServer->>Client: 5. 新しいアクセストークン + 新しいリフレッシュトークン
    Client->>ResourceServer: 6. 新しいトークン付き API リクエスト
    ResourceServer->>Client: 7. 保護されたリソース
```

### リフレッシュトークンセキュリティ

!!!warning "⚠️ リフレッシュトークンのリスク"
    **高価値ターゲット**
    - 長期間の認証情報（数日から数ヶ月）
    - 新しいアクセストークンを生成可能
    - 攻撃者にとってアクセストークンより価値が高い
    - より強い保護が必要
    
    **セキュリティ対策**
    - リフレッシュトークンローテーション：使用のたびに新しいリフレッシュトークンを発行
    - リフレッシュトークン再利用を検出（盗難を示す）
    - リフレッシュトークンをクライアントにバインド
    - 疑わしい活動時にトークンファミリーを取り消し
    - リフレッシュトークンを安全に保存（暗号化）
    - リフレッシュトークンの有効期限を実装
    
    **リフレッシュトークンローテーション**
    ```
    リクエスト：  refresh_token=OLD_TOKEN
    レスポンス：   access_token=NEW_ACCESS
                refresh_token=NEW_REFRESH
    
    古いリフレッシュトークンは即座に無効化
    古いトークンの再利用はセキュリティアラートをトリガー
    ```

リフレッシュトークンローテーションは現在ベストプラクティスと考えられており、トークンリプレイ攻撃を防ぎ、トークン盗難による損害を制限します。

## 結論

OAuth 2.0 は、アプリケーションがパスワード共有なしでユーザーリソースにアクセスできる堅牢な委任認可フレームワークを提供します。認可と認証を分離することで、OAuth は現代の API エコシステムを可能にしながら明確なセキュリティ境界を作成します。

PKCE 付き認可コードフローは、ほとんどのアプリケーションの現在のベストプラクティスを表し、機密クライアントとパブリッククライアントの両方に強力なセキュリティを提供します。非推奨のインプリシットフローは完全に避けるべきです。クライアント認証情報フローは、ユーザーが関与しないマシン間シナリオに対応します。各フローは特定のセキュリティ要件とアプリケーションアーキテクチャに対処します。

OAuth が認証ではなく認可を提供することを理解することが重要です。ユーザー認証が必要なアプリケーションは、標準化された身元確認で OAuth を拡張する OpenID Connect を使用すべきです。OAuth アクセストークンを身元の証明として扱うことは、深刻なセキュリティ脆弱性を生み出します。

トークンセキュリティには、保存、送信、検証、ライフサイクル管理への注意深い配慮が必要です。アクセストークンは短期間で、HTTPS で送信し、安全に保存すべきです。リフレッシュトークンは、長期間で強力な認証情報として、ローテーションと再利用検出を含むより強い保護が必要です。

OAuth 2.0 は単一のプロトコルではなく、異なるシナリオに複数のフローを提供するフレームワークです。適切なフローを選択し、正しく実装し、セキュリティベストプラクティスに従うことは、安全でユーザーフレンドリーなアプリケーションを構築するために不可欠です。OAuth の複雑さは、それが解決するセキュリティ問題の複雑さを反映しています—認証情報共有なしの委任アクセスは本質的に困難であり、OAuth はこれらの課題に対する実戦でテストされたソリューションを提供します。