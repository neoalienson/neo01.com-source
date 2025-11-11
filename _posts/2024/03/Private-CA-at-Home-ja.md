---
title: "自宅でプライベート証明機関を構築する"
date: 2024-03-15
tags:
  - Cybersecurity
  - Homelab
  - PKI
categories:
  - Cybersecurity
excerpt: "ホームラボサービスのブラウザ警告にうんざりしていませんか？内部サービス用の信頼されたSSL証明書を発行するために、独自の証明機関を設定する方法を学びましょう。"
thumbnail_80: /2024/03/Private-CA-at-Home/thumbnail_80.png
thumbnail: /2024/03/Private-CA-at-Home/thumbnail.png
lang: ja
---

![](/2024/03/Private-CA-at-Home/banner.png)

複数のサービス（Nextcloud、Home Assistant、Plex、NASなど）を備えた美しいホームラボを構築しました。すべてが素晴らしく機能していますが、1つだけ厄介なことがあります。HTTPSでこれらのサービスにアクセスするたびに、ブラウザが「接続がプライベートではありません！」と警告します。

確かに、毎回「詳細設定」をクリックして「続行」することもできます。しかし、もっと良い方法があるとしたらどうでしょうか？プライベート証明機関の世界へようこそ。

## プライベートCAが必要な理由

**問題点：**

`https://192.168.1.100`や`https://homeserver.local`にアクセスすると、ブラウザは次の理由で接続を信頼しません：
- 自己署名証明書はデフォルトで信頼されていない
- パブリックCA（Let's Encrypt、DigiCertなど）はプライベートIPアドレスや`.local`ドメインの証明書を発行しない
- セキュリティ警告をクリックすることはHTTPSの目的を無効にする

**解決策：**

次のような独自の証明機関（CA）を作成します：
- 内部サービスの証明書を発行
- インストールされると、すべてのデバイスから信頼される
- 外部依存関係なしでオフラインで動作
- 証明書のライフサイクルを完全に制御

## 基本を理解する

### 証明機関とは？

CAはデジタル証明書を発行するエンティティです。ブラウザがCAを信頼すると、そのCAによって署名された証明書を自動的に信頼します。

**信頼チェーン：**

{% mermaid %}flowchart TD
    A["🏛️ ルートCA<br/>(プライベートCA)"] --> B["📜 中間CA<br/>(オプション)"]
    B --> C["🔒 サーバー証明書<br/>(homeserver.local)"]
    B --> D["🔒 サーバー証明書<br/>(nas.local)"]
    B --> E["🔒 サーバー証明書<br/>(192.168.1.100)"]
    
    F["💻 デバイス"] -.->|"信頼"| A
    F -->|"自動的に信頼"| C
    F -->|"自動的に信頼"| D
    F -->|"自動的に信頼"| E
    
    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#e8f5e9
    style D fill:#e8f5e9
    style E fill:#e8f5e9
    style F fill:#fff3e0
{% endmermaid %}

### ルートCA vs 中間CA

- **ルートCA：** 最上位の機関。オフラインで安全に保管します。
- **中間CA：** 実際の証明書に署名します。ルートに影響を与えずに取り消すことができます。
- **サーバー証明書：** サービスがHTTPSに使用するもの。

!!!tip "💡 ベストプラクティス"
    2層階層を使用します：ルートCA → 中間CA → サーバー証明書。これにより、中間CAが侵害された場合、すべてのデバイスでルートを再信頼することなく取り消すことができます。

## プライベートCAの設定

### 方法1：OpenSSLを使用（手動制御）

**ステップ1：ルートCAの作成**

```bash
# ルートCAの秘密鍵を生成（非常に安全に保管してください！）
openssl genrsa -aes256 -out root-ca.key 4096

# ルートCA証明書を作成（10年間有効）
openssl req -x509 -new -nodes -key root-ca.key -sha256 -days 3650 \
  -out root-ca.crt \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=Home Lab Root CA"
```

**ステップ2：中間CAの作成**

```bash
# 中間CAの秘密鍵を生成
openssl genrsa -aes256 -out intermediate-ca.key 4096

# 証明書署名要求（CSR）を作成
openssl req -new -key intermediate-ca.key -out intermediate-ca.csr \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=Home Lab Intermediate CA"

# ルートCAで中間CAに署名
openssl x509 -req -in intermediate-ca.csr -CA root-ca.crt -CAkey root-ca.key \
  -CAcreateserial -out intermediate-ca.crt -days 1825 -sha256 \
  -extfile <(echo "basicConstraints=CA:TRUE")
```

**ステップ3：サーバー証明書の発行**

```bash
# サーバーの秘密鍵を生成
openssl genrsa -out homeserver.key 2048

# サーバーのCSRを作成
openssl req -new -key homeserver.key -out homeserver.csr \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=homeserver.local"

# SAN（サブジェクト代替名）設定を作成
cat > san.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = homeserver.local
DNS.2 = homeserver
IP.1 = 192.168.1.100
EOF

# 中間CAでサーバー証明書に署名
openssl x509 -req -in homeserver.csr -CA intermediate-ca.crt \
  -CAkey intermediate-ca.key -CAcreateserial -out homeserver.crt \
  -days 365 -sha256 -extfile san.cnf -extensions v3_req
```

### 方法2：easy-rsaを使用（簡略化）

```bash
# easy-rsaをインストール
git clone https://github.com/OpenVPN/easy-rsa.git
cd easy-rsa/easyrsa3

# PKIを初期化
./easyrsa init-pki

# CAを構築
./easyrsa build-ca

# サーバー証明書を生成
./easyrsa gen-req homeserver nopass
./easyrsa sign-req server homeserver
```

### 方法3：step-caを使用（モダンなアプローチ - 推奨）

[step-ca](https://smallstep.com/docs/step-ca)は、証明書管理を簡素化する最新の自動化されたCAです。「ホームラボ用のLet's Encrypt」と考えてください。

**step-caが優れている理由：**

- **自動証明書管理** ACMEプロトコルサポート付き
- **組み込みの証明書更新** - 手動スクリプト不要
- **OAuth/OIDC統合** SSH証明書用
- **シンプルなCLI** - 複雑なOpenSSLコマンド不要
- **Webベースのワークフロー** 証明書リクエスト用
- **デフォルトで短期証明書**（セキュリティ向上）
- **リモート管理**機能

**インストール：**

```bash
# macOS
brew install step

# Ubuntu/Debian
curl -fsSL https://packages.smallstep.com/keys/apt/repo-signing-key.gpg -o /etc/apt/trusted.gpg.d/smallstep.asc
echo 'deb [signed-by=/etc/apt/trusted.gpg.d/smallstep.asc] https://packages.smallstep.com/stable/debian debs main' | sudo tee /etc/apt/sources.list.d/smallstep.list
sudo apt update && sudo apt install step-cli step-ca

# RHEL/Fedora
sudo dnf install step-cli step-ca

# Windows (Winget)
winget install Smallstep.step-ca

# Docker
docker pull smallstep/step-ca
```

**CAの初期化：**

```bash
# 対話型セットアップ
step ca init

# 次の項目の入力を求められます：
# - PKI名（例：「Home Lab」）
# - DNS名（例：「ca.homelab.local」）
# - リスンアドレス（例：「127.0.0.1:8443」）
# - 最初のプロビジョナーメール（例：「admin@homelab.local」）
# - CAキーのパスワード

# 出力例：
✔ What would you like to name your new PKI? Home Lab
✔ What DNS names or IP addresses would you like to add to your new CA? ca.homelab.local
✔ What address will your new CA listen at? 127.0.0.1:8443
✔ What would you like to name the first provisioner? admin@homelab.local
✔ What do you want your password to be? ********

✔ Root certificate: /home/user/.step/certs/root_ca.crt
✔ Root fingerprint: 702a094e239c9eec6f0dcd0a5f65e595bf7ed6614012825c5fe3d1ae1b2fd6ee
```

**高度な初期化オプション：**

```bash
# ACMEサポート付き（自動証明書管理用）
step ca init --acme

# SSH証明書サポート付き
step ca init --ssh

# Kubernetesデプロイメント用
step ca init --helm

# リモート管理有効
step ca init --remote-management
```

**CAサーバーの起動：**

```bash
# CAを起動
step-ca $(step path)/config/ca.json

# またはsystemdサービスとして実行
sudo systemctl enable step-ca
sudo systemctl start step-ca
```

**最初の証明書の発行：**

```bash
# シンプルな証明書発行
step ca certificate homeserver.local homeserver.crt homeserver.key

# プロビジョナーパスワードの入力を求められます
✔ Key ID: rQxROEr7Kx9TNjSQBTETtsu3GKmuW9zm02dMXZ8GUEk
✔ Please enter the password to decrypt the provisioner key: ********
✔ CA: https://ca.homelab.local:8443/1.0/sign
✔ Certificate: homeserver.crt
✔ Private Key: homeserver.key

# サブジェクト代替名（SAN）付き
step ca certificate homeserver.local homeserver.crt homeserver.key \
  --san homeserver \
  --san 192.168.1.100

# カスタム有効期間付き
step ca certificate homeserver.local homeserver.crt homeserver.key \
  --not-after 8760h  # 1年
```

**クライアントマシンでCAを信頼：**

```bash
# ブートストラップ信頼（ルートCAをダウンロードしてstepを設定）
step ca bootstrap --ca-url https://ca.homelab.local:8443 \
  --fingerprint 702a094e239c9eec6f0dcd0a5f65e595bf7ed6614012825c5fe3d1ae1b2fd6ee

# システム信頼ストアにルートCAをインストール
step certificate install $(step path)/certs/root_ca.crt
```

**自動証明書更新：**

step-caは更新を簡単にします：

```bash
# 証明書を更新（有効期限前）
step ca renew homeserver.crt homeserver.key
✔ Would you like to overwrite homeserver.crt [y/n]: y
Your certificate has been saved in homeserver.crt.

# 自動更新デーモン（証明書の有効期間の2/3で更新）
step ca renew homeserver.crt homeserver.key --daemon

# 強制更新
step ca renew homeserver.crt homeserver.key --force
```

!!!warning "⏰ 更新タイミング"
    証明書が期限切れになると、CAは更新しません。証明書の有効期間の約2/3で自動更新を実行するように設定してください。`--daemon`フラグはこれを自動的に処理します。

**証明書の有効期間を調整：**

```bash
# 5分間の証明書（機密アクセス用）
step ca certificate localhost localhost.crt localhost.key --not-after=5m

# 90日間の証明書（サーバー用）
step ca certificate homeserver.local homeserver.crt homeserver.key --not-after=2160h

# 今から5分後に有効な証明書
step ca certificate localhost localhost.crt localhost.key --not-before=5m --not-after=240h
```

グローバルデフォルトを変更するには、`$(step path)/config/ca.json`を編集します：

```json
"authority": {
  "claims": {
    "minTLSCertDuration": "5m",
    "maxTLSCertDuration": "2160h",
    "defaultTLSCertDuration": "24h"
  }
}
```

**高度：単一使用トークン（コンテナ/VM用）：**

委任された証明書発行用の短期トークンを生成：

```bash
# トークンを生成（5分で期限切れ）
TOKEN=$(step ca token homeserver.local)
✔ Provisioner: admin@homelab.local (JWK)
✔ Please enter the password to decrypt the provisioner key: ********

# コンテナ/VM内：CSRを作成
step certificate create --csr homeserver.local homeserver.csr homeserver.key

# コンテナ/VM内：トークンを使用して証明書を取得
step ca sign --token $TOKEN homeserver.csr homeserver.crt
✔ CA: https://ca.homelab.local:8443
✔ Certificate: homeserver.crt
```

これは次の用途に最適です：
- 起動時に証明書が必要なDockerコンテナ
- VMプロビジョニングワークフロー
- CI/CDパイプライン
- CA認証情報を共有せずに証明書発行を委任

**ACME統合（Let's Encryptのように）：**

ACME（Automated Certificate Management Environment）は、Let's Encryptが使用するプロトコルです。step-caは完全に自動化された証明書発行と更新のためにACMEをサポートしています。

**ACMEを有効化：**

```bash
# ACMEプロビジョナーを追加（初期化時に行われていない場合）
step ca provisioner add acme --type ACME

# 変更を適用するためにstep-caを再起動
sudo systemctl restart step-ca
```

**ACMEチャレンジタイプ：**

| チャレンジ | ポート | 用途 | 難易度 |
|-----------|------|----------|--------------|
| **http-01** | 80 | 汎用、Webサーバー | 簡単 |
| **dns-01** | 53 | ワイルドカード証明書、ファイアウォール内サーバー | 中程度 |
| **tls-alpn-01** | 443 | TLS専用環境 | 中程度 |

**stepをACMEクライアントとして使用：**

```bash
# HTTP-01チャレンジ（ポート80でWebサーバーを起動）
step ca certificate --provisioner acme neo01.com example.crt example.key

✔ Provisioner: acme (ACME)
Using Standalone Mode HTTP challenge to validate neo01.com .. done!
Waiting for Order to be 'ready' for finalization .. done!
Finalizing Order .. done!
✔ Certificate: example.crt
✔ Private Key: example.key
```

**certbotを使用：**

```bash
# HTTP-01チャレンジ
certbot certonly --standalone \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local \
  --register-unsafely-without-email

# DNS-01チャレンジ（ワイルドカード証明書用）
certbot certonly --manual --preferred-challenges dns \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d '*.homelab.local'

# 自動更新
certbot renew --server https://ca.homelab.local:8443/acme/acme/directory
```

**acme.shを使用：**

```bash
# HTTP-01チャレンジ
acme.sh --issue --standalone \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local

# CloudflareでDNS-01
export CF_Token="your-cloudflare-api-token"
acme.sh --issue --dns dns_cf \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local

# 自動更新（毎日実行）
acme.sh --cron
```

**ACMEフロー図：**

{% mermaid %}sequenceDiagram
    participant Client as ACMEクライアント
    participant CA as step-ca
    participant Web as Webサーバー
    
    Client->>CA: 1. アカウント作成と証明書注文
    CA->>Client: 2. チャレンジを返す (http-01, dns-01, tls-alpn-01)
    Client->>Web: 3. /.well-known/acme-challenge/にチャレンジレスポンスを配置
    Client->>CA: 4. 検証準備完了
    CA->>Web: 5. チャレンジレスポンスを検証
    CA->>Client: 6. チャレンジ検証完了
    Client->>CA: 7. CSRを送信
    CA->>Client: 8. 証明書を発行
    
    Note over Client,CA: 証明書が自動的に発行されました！
{% endmermaid %}

**ACMEが優れている理由：**

- **人間の介入ゼロ** - 完全に自動化された証明書ライフサイクル
- **自動更新** - 期限切れの証明書なし
- **業界標準** - 任意のACMEクライアントで動作
- **大規模で実証済み** - Let's Encryptを支える（数十億の証明書）
- **組み込み検証** - ドメイン/IP所有権を自動的に証明

**Traefikとの統合：**

```yaml
# traefik.yml
entryPoints:
  websecure:
    address: ":443"

certificatesResolvers:
  homelab:
    acme:
      caServer: https://ca.homelab.local:8443/acme/acme/directory
      storage: /acme.json
      tlsChallenge: {}

# docker-compose.yml
services:
  whoami:
    image: traefik/whoami
    labels:
      - "traefik.http.routers.whoami.rule=Host(`whoami.homelab.local`)"
      - "traefik.http.routers.whoami.tls.certresolver=homelab"
```

**Docker Composeセットアップ：**

```yaml
version: '3'
services:
  step-ca:
    image: smallstep/step-ca
    ports:
      - "8443:8443"
    volumes:
      - step-ca-data:/home/step
    environment:
      - DOCKER_STEPCA_INIT_NAME=Home Lab
      - DOCKER_STEPCA_INIT_DNS_NAMES=ca.homelab.local
      - DOCKER_STEPCA_INIT_PROVISIONER_NAME=admin@homelab.local
    restart: unless-stopped

volumes:
  step-ca-data:
```

**比較：OpenSSL vs step-ca**

| タスク | OpenSSL | step-ca |
|------|---------|------------|
| **CA作成** | 複数のコマンド、設定ファイル | `step ca init` |
| **証明書発行** | 5つ以上のコマンドと設定 | `step ca certificate` |
| **更新** | 手動スクリプト | `step ca renew --daemon` |
| **ACMEサポート** | 組み込みなし | 組み込み |
| **学習曲線** | 急勾配 | 緩やか |
| **自動化** | DIY | 組み込み |
| **SSH証明書** | 複雑 | `step ssh`コマンド |

!!!tip "💡 step-caを使用すべき場合"
    次の場合はstep-caを使用してください：
    - 自動証明書管理が必要
    - ACMEプロトコルサポートが必要
    - 最新ツール（Traefik、Kubernetes）との統合が必要
    - 複雑なOpenSSLコマンドよりシンプルなCLIを好む
    - SSH証明書管理が必要
    - 組み込みの更新自動化が必要
    
    次の場合はOpenSSLを使用してください：
    - すべての詳細を最大限に制御する必要がある
    - 既存のOpenSSLベースのワークフローがある
    - step-caバイナリのないエアギャップ環境で作業
    - step-caでサポートされていない特定の証明書拡張が必要

## CA証明書のインストール

### Windows

1. `root-ca.crt`をダブルクリック
2. 「証明書のインストール」をクリック
3. 「ローカルマシン」を選択
4. 「証明書をすべて次のストアに配置する」を選択
5. 「信頼されたルート証明機関」を選択
6. 「完了」をクリック

### macOS

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain root-ca.crt
```

### Linux (Ubuntu/Debian)

```bash
sudo cp root-ca.crt /usr/local/share/ca-certificates/homelab-root-ca.crt
sudo update-ca-certificates
```

### iOS/iPadOS

1. `root-ca.crt`を自分にメールで送信するか、Webサーバーでホスト
2. デバイスでファイルを開く
3. 設定 → 一般 → VPNとデバイス管理に移動
4. プロファイルをインストール
5. 設定 → 一般 → 情報 → 証明書信頼設定に移動
6. 証明書の完全な信頼を有効化

### Android

1. `root-ca.crt`をデバイスにコピー
2. 設定 → セキュリティ → 暗号化と認証情報 → 証明書のインストール
3. 「CA証明書」を選択
4. 証明書を参照して選択

## サービスの設定

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name homeserver.local;

    ssl_certificate /path/to/homeserver.crt;
    ssl_certificate_key /path/to/homeserver.key;
    
    # オプション：中間CAを含める
    # ssl_certificateには次を含める必要があります：サーバー証明書 + 中間証明書
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:8080;
    }
}
```

### Apache

```apache
<VirtualHost *:443>
    ServerName homeserver.local
    
    SSLEngine on
    SSLCertificateFile /path/to/homeserver.crt
    SSLCertificateKeyFile /path/to/homeserver.key
    SSLCertificateChainFile /path/to/intermediate-ca.crt
    
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/
</VirtualHost>
```

### Docker Compose

```yaml
version: '3'
services:
  web:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./homeserver.crt:/etc/nginx/ssl/cert.crt
      - ./homeserver.key:/etc/nginx/ssl/cert.key
```

## 証明書管理

### 証明書ライフサイクル

{% mermaid %}flowchart TD
    A["📝 証明書作成"] --> B["🚀 サーバーにデプロイ"]
    B --> C["👁️ 有効期限を監視"]
    C --> D{"⏰ 有効期限が近い？"}
    D -->|"いいえ"| C
    D -->|"はい（有効期間の2/3）"| E["🔄 証明書を更新"]
    E --> F["🚀 サーバーに再デプロイ"]
    F --> C
    
    style A fill:#e3f2fd
    style B fill:#e8f5e9
    style C fill:#fff3e0
    style D fill:#fff9c4
    style E fill:#f3e5f5
    style F fill:#e8f5e9
{% endmermaid %}

### 更新スクリプト

```bash
#!/bin/bash
# renew-cert.sh

DOMAIN="homeserver.local"
CERT_DIR="/etc/ssl/homelab"

# 新しいキーとCSRを生成
openssl genrsa -out ${CERT_DIR}/${DOMAIN}.key 2048
openssl req -new -key ${CERT_DIR}/${DOMAIN}.key \
  -out ${CERT_DIR}/${DOMAIN}.csr \
  -subj "/CN=${DOMAIN}"

# 中間CAで署名
openssl x509 -req -in ${CERT_DIR}/${DOMAIN}.csr \
  -CA ${CERT_DIR}/intermediate-ca.crt \
  -CAkey ${CERT_DIR}/intermediate-ca.key \
  -CAcreateserial -out ${CERT_DIR}/${DOMAIN}.crt \
  -days 365 -sha256

# nginxをリロード
systemctl reload nginx

echo "Certificate renewed for ${DOMAIN}"
```

### Cronによる自動化

```bash
# crontabに追加：有効期限の30日前に更新
0 0 1 * * /path/to/renew-cert.sh
```

## セキュリティのベストプラクティス

!!!danger "⚠️ 重要なセキュリティ対策"
    **ルートCAの秘密鍵を保護：**
    - 暗号化されたUSBドライブにオフラインで保存
    - ネットワークに公開しない
    - 強力なパスフレーズを使用（AES-256）
    - 複数の暗号化バックアップを保持
    - 本番環境ではハードウェアセキュリティモジュール（HSM）を検討

**主要なセキュリティ対策：**

1. **ルートCAと中間CAを分離**
   - ルートCA：オフライン、中間CAの署名のみ
   - 中間CA：オンライン、サーバー証明書に署名

2. **強力な鍵サイズを使用**
   - ルートCA：4096ビットRSAまたはEC P-384
   - 中間CA：4096ビットRSAまたはEC P-384
   - サーバー証明書：最低2048ビットRSA

3. **適切な有効期間を設定**
   - ルートCA：10〜20年
   - 中間CA：5年
   - サーバー証明書：1年（ローテーションが容易）

4. **証明書失効を実装**
   - 証明書失効リスト（CRL）を維持
   - またはオンライン証明書状態プロトコル（OCSP）を使用

5. **監査と監視**
   - すべての証明書発行をログに記録
   - 不正な証明書を監視
   - 定期的なセキュリティ監査

## 一般的な問題と解決策

### 問題：ブラウザがまだ警告を表示

**原因：**
- CA証明書が正しくインストールされていない
- 証明書に正しいSAN（サブジェクト代替名）が含まれていない
- IPでアクセスしているが、証明書にはDNS名のみ

**解決策：**
```bash
# 証明書のSANを確認
openssl x509 -in homeserver.crt -text -noout | grep -A1 "Subject Alternative Name"

# 証明書にすべてのアクセス方法が含まれていることを確認
DNS.1 = homeserver.local
DNS.2 = homeserver
IP.1 = 192.168.1.100
```

### 問題：証明書チェーンが不完全

**解決策：**
証明書バンドルを作成：
```bash
cat homeserver.crt intermediate-ca.crt > homeserver-bundle.crt
```

サーバー設定でバンドルを使用します。

### 問題：秘密鍵のアクセス許可

```bash
# 正しいアクセス許可を設定
chmod 600 homeserver.key
chown root:root homeserver.key
```

## 高度：自動証明書管理

### step-caでSSH証明書

`--ssh`で初期化した場合、step-caはパスワードなし認証用のSSH証明書も発行できます。

**SSHユーザー認証の設定：**

```bash
# SSHサーバー上：ユーザーCAを信頼
step ssh config --roots > /etc/ssh/ssh_user_ca.pub

echo 'TrustedUserCAKeys /etc/ssh/ssh_user_ca.pub' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd

# クライアント上：SSHユーザー証明書を取得
step ssh certificate alice@homelab.local id_ecdsa
✔ Provisioner: admin@homelab.local (JWK)
✔ Please enter the password to decrypt the provisioner key: ********
✔ CA: https://ca.homelab.local:8443
✔ Private Key: id_ecdsa
✔ Certificate: id_ecdsa-cert.pub
✔ SSH Agent: yes

# 証明書を検査
cat id_ecdsa-cert.pub | step ssh inspect
```

**SSHホスト認証の設定：**

```bash
# SSHサーバー上：ホスト証明書を取得
cd /etc/ssh
sudo step ssh certificate --host --sign server.homelab.local ssh_host_ecdsa_key.pub

# 証明書を使用するようにSSHDを設定
echo 'HostCertificate /etc/ssh/ssh_host_ecdsa_key-cert.pub' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd

# クライアント上：ホストCAを信頼
step ssh config --host --roots >> ~/.ssh/known_hosts
# 先頭に追加：@cert-authority *
```

**SSHホスト証明書の自動更新：**

```bash
# 週次更新cronを作成
cat <<EOF | sudo tee /etc/cron.weekly/renew-ssh-cert
#!/bin/sh
export STEPPATH=/root/.step
cd /etc/ssh && step ssh renew ssh_host_ecdsa_key-cert.pub ssh_host_ecdsa_key --force
exit 0
EOF
sudo chmod 755 /etc/cron.weekly/renew-ssh-cert
```

### nginx-proxy-managerでstep-caを使用

```bash
# 1. step-caから証明書を取得
step ca certificate npm.homelab.local npm.crt npm.key

# 2. nginx-proxy-manager UIで：
#    - SSL証明書 → SSL証明書を追加 → カスタム
#    - npm.crtとnpm.keyをアップロード
#    - step ca renew --daemonで自動更新を設定
```

### Home Assistantでstep-caを使用

```yaml
# configuration.yaml
http:
  ssl_certificate: /ssl/homeassistant.crt
  ssl_key: /ssl/homeassistant.key

# 証明書を取得
# step ca certificate homeassistant.local /ssl/homeassistant.crt /ssl/homeassistant.key
```

### 監視と管理

```bash
# 証明書の有効期限を確認
step certificate inspect homeserver.crt --short
X.509v3 TLS Certificate (ECDSA P-256) [Serial: 7720...1576]
  Subject:     homeserver.local
  Issuer:      Home Lab Intermediate CA
  Valid from:  2025-05-15T00:59:37Z
          to:  2025-05-16T01:00:37Z

# 証明書を失効（パッシブ失効 - 更新をブロック）
step ca revoke --cert homeserver.crt --key homeserver.key
✔ CA: https://ca.homelab.local:8443
Certificate with Serial Number 30671613121311574910895916201205874495 has been revoked.

# プロビジョナーをリスト
step ca provisioner list
```

## 比較：プライベートCA vs Let's Encrypt

| 機能 | プライベートCA | Let's Encrypt |
|---------|-----------|-----------------|
| **コスト** | 無料 | 無料 |
| **内部IP** | ✅ はい | ❌ いいえ |
| **`.local`ドメイン** | ✅ はい | ❌ いいえ |
| **オフライン動作** | ✅ はい | ❌ いいえ |
| **自動更新** | 手動/カスタム | ✅ 組み込み |
| **パブリック信頼** | ❌ いいえ | ✅ はい |
| **セットアップの複雑さ** | 中程度 | 低 |
| **メンテナンス** | 手動 | 自動化 |

**プライベートCAを使用すべき場合：**
- 内部サービスのみ
- プライベートIPアドレス
- `.local`またはカスタムTLD
- エアギャップネットワーク
- 完全な制御が必要

**Let's Encryptを使用すべき場合：**
- 公開サービス
- パブリックドメイン名
- 自動更新が必要
- CAインフラストラクチャを管理したくない

## リソース

- **[OpenSSLドキュメント](https://www.openssl.org/docs/)：** 完全なOpenSSLリファレンス
- **[easy-rsa](https://github.com/OpenVPN/easy-rsa)：** 簡略化されたCA管理
- **[step-ca](https://smallstep.com/docs/step-ca)：** ACMEサポート付きモダンCA
- **[PKIチュートリアル](https://pki-tutorial.readthedocs.io/)：** 包括的なPKIガイド

## 結論

プライベートCAの設定は最初は困難に思えるかもしれませんが、一度設定すれば、厄介なブラウザ警告を排除し、ホームラボサービスに適切な暗号化を提供します。初期の時間投資は、よりプロフェッショナルで安全なホームネットワークで報われます。

**重要なポイント：**
- プライベートCAは内部サービスに信頼されたHTTPSを可能にする
- **step-caが推奨** モダンで自動化された証明書管理のため
- 2層階層（ルート + 中間）がより良いセキュリティを提供
- すべてのデバイスにルートCA証明書を一度インストール
- 有効期限の問題を避けるために証明書更新を自動化（step-caはこれを簡単にします）
- ルートCAの秘密鍵をオフラインで安全に保管
- SSH証明書はパスワード認証を排除し、セキュリティを向上

**クイックスタート推奨：**

ほとんどのホームラボでは、step-caを使用してください：
1. `step ca init --acme --ssh`（1コマンドセットアップ）
2. `step certificate install $(step path)/certs/root_ca.crt`（すべてのデバイスで信頼）
3. `step ca certificate service.local service.crt service.key`（証明書を取得）
4. `step ca renew service.crt service.key --daemon`（自動更新）

単一のサービスから小さく始め、プロセスに慣れてから、ホームラボ全体に拡張してください。セキュリティ警告をクリックしなくなったとき、未来の自分に感謝するでしょう！🔒
