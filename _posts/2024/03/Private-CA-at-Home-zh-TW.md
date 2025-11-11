---
title: "在家中建立私有憑證授權中心"
date: 2024-03-15
lang: zh-TW
tags:
  - Cybersecurity
  - Homelab
  - PKI
categories:
  - Cybersecurity
excerpt: "厭倦了家庭實驗室服務的瀏覽器警告？學習如何建立自己的憑證授權中心，為內部服務簽發受信任的 SSL 憑證。"
thumbnail_80: /2024/03/Private-CA-at-Home/thumbnail_80.png
thumbnail: /2024/03/Private-CA-at-Home/thumbnail.png
---

![](/2024/03/Private-CA-at-Home/banner.png)

你已經建立了一個漂亮的家庭實驗室，包含多個服務——Nextcloud、Home Assistant、Plex，也許還有 NAS。一切運作良好，除了一件煩人的事：每次透過 HTTPS 存取這些服務時，瀏覽器都會大喊「你的連線不是私人連線！」

當然，你可以每次都點擊「進階」和「繼續前往」。但如果我告訴你有更好的方法呢？歡迎來到私有憑證授權中心的世界。

## 為什麼需要私有 CA

**問題所在：**

當你存取 `https://192.168.1.100` 或 `https://homeserver.local` 時，瀏覽器不信任該連線，因為：
- 自簽憑證預設不受信任
- 公開 CA（Let's Encrypt、DigiCert）不會為私有 IP 位址或 `.local` 網域簽發憑證
- 每次點擊略過安全警告會失去 HTTPS 的意義

**解決方案：**

建立你自己的憑證授權中心（CA），它可以：
- 為你的內部服務簽發憑證
- 安裝後被你所有裝置信任
- 離線運作，無需外部依賴
- 讓你完全控制憑證生命週期

## 理解基礎概念

### 什麼是憑證授權中心？

CA 是簽發數位憑證的實體。當你的瀏覽器信任某個 CA 時，它會自動信任該 CA 簽署的任何憑證。

**信任鏈：**

{% mermaid %}flowchart TD
    A["🏛️ 根 CA<br/>(你的私有 CA)"] --> B["📜 中繼 CA<br/>(選用)"]
    B --> C["🔒 伺服器憑證<br/>(homeserver.local)"]
    B --> D["🔒 伺服器憑證<br/>(nas.local)"]
    B --> E["🔒 伺服器憑證<br/>(192.168.1.100)"]
    
    F["💻 你的裝置"] -.->|"信任"| A
    F -->|"自動信任"| C
    F -->|"自動信任"| D
    F -->|"自動信任"| E
    
    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#e8f5e9
    style D fill:#e8f5e9
    style E fill:#e8f5e9
    style F fill:#fff3e0
{% endmermaid %}

### 根 CA vs 中繼 CA

- **根 CA：** 最高層級的授權中心。保持離線並確保安全。
- **中繼 CA：** 簽署實際憑證。可以撤銷而不影響根 CA。
- **伺服器憑證：** 你的服務用於 HTTPS 的憑證。

!!!tip "💡 最佳實務"
    使用兩層架構：根 CA → 中繼 CA → 伺服器憑證。這樣，如果中繼 CA 被入侵，你可以撤銷它而無需在所有裝置上重新信任根 CA。

## 建立你的私有 CA

### 方法 1：使用 OpenSSL（手動控制）

**步驟 1：建立根 CA**

```bash
# 產生根 CA 私鑰（務必妥善保管！）
openssl genrsa -aes256 -out root-ca.key 4096

# 建立根 CA 憑證（有效期 10 年）
openssl req -x509 -new -nodes -key root-ca.key -sha256 -days 3650 \
  -out root-ca.crt \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=Home Lab Root CA"
```

**步驟 2：建立中繼 CA**

```bash
# 產生中繼 CA 私鑰
openssl genrsa -aes256 -out intermediate-ca.key 4096

# 建立憑證簽署請求（CSR）
openssl req -new -key intermediate-ca.key -out intermediate-ca.csr \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=Home Lab Intermediate CA"

# 使用根 CA 簽署中繼 CA
openssl x509 -req -in intermediate-ca.csr -CA root-ca.crt -CAkey root-ca.key \
  -CAcreateserial -out intermediate-ca.crt -days 1825 -sha256 \
  -extfile <(echo "basicConstraints=CA:TRUE")
```

**步驟 3：簽發伺服器憑證**

```bash
# 產生伺服器私鑰
openssl genrsa -out homeserver.key 2048

# 為伺服器建立 CSR
openssl req -new -key homeserver.key -out homeserver.csr \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=homeserver.local"

# 建立 SAN（主體別名）設定
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

# 使用中繼 CA 簽署伺服器憑證
openssl x509 -req -in homeserver.csr -CA intermediate-ca.crt \
  -CAkey intermediate-ca.key -CAcreateserial -out homeserver.crt \
  -days 365 -sha256 -extfile san.cnf -extensions v3_req
```

### 方法 2：使用 easy-rsa（簡化版）

```bash
# 安裝 easy-rsa
git clone https://github.com/OpenVPN/easy-rsa.git
cd easy-rsa/easyrsa3

# 初始化 PKI
./easyrsa init-pki

# 建立 CA
./easyrsa build-ca

# 產生伺服器憑證
./easyrsa gen-req homeserver nopass
./easyrsa sign-req server homeserver
```

### 方法 3：使用 step-ca（現代化方法 - 推薦）

[step-ca](https://smallstep.com/docs/step-ca) 是一個現代化的自動化 CA，簡化了憑證管理。可以把它想像成「家庭實驗室的 Let's Encrypt」。

**為什麼 step-ca 更好：**

- **自動化憑證管理**，支援 ACME 協定
- **內建憑證更新** - 無需手動腳本
- **OAuth/OIDC 整合**，用於 SSH 憑證
- **簡單的 CLI** - 無需複雜的 OpenSSL 指令
- **網頁式工作流程**，用於憑證請求
- **預設短期憑證**（更好的安全性）
- **遠端管理**功能

**安裝：**

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

**初始化你的 CA：**

```bash
# 互動式設定
step ca init

# 系統會提示你輸入：
# - PKI 名稱（例如：「Home Lab」）
# - DNS 名稱（例如：「ca.homelab.local」）
# - 監聽位址（例如：「127.0.0.1:8443」）
# - 第一個佈建者電子郵件（例如：「admin@homelab.local」）
# - CA 金鑰密碼

# 範例輸出：
✔ What would you like to name your new PKI? Home Lab
✔ What DNS names or IP addresses would you like to add to your new CA? ca.homelab.local
✔ What address will your new CA listen at? 127.0.0.1:8443
✔ What would you like to name the first provisioner? admin@homelab.local
✔ What do you want your password to be? ********

✔ Root certificate: /home/user/.step/certs/root_ca.crt
✔ Root fingerprint: 702a094e239c9eec6f0dcd0a5f65e595bf7ed6614012825c5fe3d1ae1b2fd6ee
```

**進階初始化選項：**

```bash
# 支援 ACME（用於自動憑證管理）
step ca init --acme

# 支援 SSH 憑證
step ca init --ssh

# 用於 Kubernetes 部署
step ca init --helm

# 啟用遠端管理
step ca init --remote-management
```

**啟動 CA 伺服器：**

```bash
# 啟動 CA
step-ca $(step path)/config/ca.json

# 或作為 systemd 服務執行
sudo systemctl enable step-ca
sudo systemctl start step-ca
```

**簽發你的第一個憑證：**

```bash
# 簡單的憑證簽發
step ca certificate homeserver.local homeserver.crt homeserver.key

# 系統會提示你輸入佈建者密碼
✔ Key ID: rQxROEr7Kx9TNjSQBTETtsu3GKmuW9zm02dMXZ8GUEk
✔ Please enter the password to decrypt the provisioner key: ********
✔ CA: https://ca.homelab.local:8443/1.0/sign
✔ Certificate: homeserver.crt
✔ Private Key: homeserver.key

# 使用主體別名（SAN）
step ca certificate homeserver.local homeserver.crt homeserver.key \
  --san homeserver \
  --san 192.168.1.100

# 自訂有效期
step ca certificate homeserver.local homeserver.crt homeserver.key \
  --not-after 8760h  # 1 年
```

**在客戶端機器上信任你的 CA：**

```bash
# 啟動信任（下載根 CA 並設定 step）
step ca bootstrap --ca-url https://ca.homelab.local:8443 \
  --fingerprint 702a094e239c9eec6f0dcd0a5f65e595bf7ed6614012825c5fe3d1ae1b2fd6ee

# 將根 CA 安裝到系統信任儲存區
step certificate install $(step path)/certs/root_ca.crt
```

**自動憑證更新：**

step-ca 讓更新變得簡單：

```bash
# 更新憑證（到期前）
step ca renew homeserver.crt homeserver.key
✔ Would you like to overwrite homeserver.crt [y/n]: y
Your certificate has been saved in homeserver.crt.

# 自動更新守護程序（在憑證生命週期的 2/3 時更新）
step ca renew homeserver.crt homeserver.key --daemon

# 強制更新
step ca renew homeserver.crt homeserver.key --force
```

!!!warning "⏰ 更新時機"
    憑證一旦過期，CA 將不會更新它。設定自動更新在憑證生命週期的三分之二左右執行。`--daemon` 旗標會自動處理這個問題。

**調整憑證有效期：**

```bash
# 5 分鐘憑證（用於敏感存取）
step ca certificate localhost localhost.crt localhost.key --not-after=5m

# 90 天憑證（用於伺服器）
step ca certificate homeserver.local homeserver.crt homeserver.key --not-after=2160h

# 從現在起 5 分鐘後開始有效的憑證
step ca certificate localhost localhost.crt localhost.key --not-before=5m --not-after=240h
```

要變更全域預設值，編輯 `$(step path)/config/ca.json`：

```json
"authority": {
  "claims": {
    "minTLSCertDuration": "5m",
    "maxTLSCertDuration": "2160h",
    "defaultTLSCertDuration": "24h"
  }
}
```

**進階：單次使用權杖（用於容器/虛擬機）：**

產生短期權杖用於委派憑證簽發：

```bash
# 產生權杖（5 分鐘後過期）
TOKEN=$(step ca token homeserver.local)
✔ Provisioner: admin@homelab.local (JWK)
✔ Please enter the password to decrypt the provisioner key: ********

# 在容器/虛擬機中：建立 CSR
step certificate create --csr homeserver.local homeserver.csr homeserver.key

# 在容器/虛擬機中：使用權杖取得憑證
step ca sign --token $TOKEN homeserver.csr homeserver.crt
✔ CA: https://ca.homelab.local:8443
✔ Certificate: homeserver.crt
```

這非常適合：
- 啟動時需要憑證的 Docker 容器
- 虛擬機佈建工作流程
- CI/CD 管線
- 在不共享 CA 憑證的情況下委派憑證簽發

**ACME 整合（類似 Let's Encrypt）：**

ACME（自動化憑證管理環境）是 Let's Encrypt 使用的協定。step-ca 支援 ACME，實現完全自動化的憑證簽發和更新。

**啟用 ACME：**

```bash
# 新增 ACME 佈建者（如果初始化時未完成）
step ca provisioner add acme --type ACME

# 重新啟動 step-ca 以套用變更
sudo systemctl restart step-ca
```

**ACME 挑戰類型：**

| 挑戰 | 連接埠 | 使用情境 | 難度 |
|-----------|------|----------|--------------|
| **http-01** | 80 | 通用目的、網頁伺服器 | 簡單 |
| **dns-01** | 53 | 萬用字元憑證、防火牆後的伺服器 | 中等 |
| **tls-alpn-01** | 443 | 僅 TLS 環境 | 中等 |

**使用 step 作為 ACME 客戶端：**

```bash
# HTTP-01 挑戰（在連接埠 80 啟動網頁伺服器）
step ca certificate --provisioner acme neo01.com example.crt example.key

✔ Provisioner: acme (ACME)
Using Standalone Mode HTTP challenge to validate neo01.com .. done!
Waiting for Order to be 'ready' for finalization .. done!
Finalizing Order .. done!
✔ Certificate: example.crt
✔ Private Key: example.key
```

**使用 certbot：**

```bash
# HTTP-01 挑戰
certbot certonly --standalone \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local \
  --register-unsafely-without-email

# DNS-01 挑戰（用於萬用字元憑證）
certbot certonly --manual --preferred-challenges dns \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d '*.homelab.local'

# 自動更新
certbot renew --server https://ca.homelab.local:8443/acme/acme/directory
```

**使用 acme.sh：**

```bash
# HTTP-01 挑戰
acme.sh --issue --standalone \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local

# 使用 Cloudflare 的 DNS-01
export CF_Token="your-cloudflare-api-token"
acme.sh --issue --dns dns_cf \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local

# 自動更新（每日執行）
acme.sh --cron
```

**ACME 流程圖：**

{% mermaid %}sequenceDiagram
    participant Client as ACME 客戶端
    participant CA as step-ca
    participant Web as 網頁伺服器
    
    Client->>CA: 1. 建立帳戶並訂購憑證
    CA->>Client: 2. 回傳挑戰（http-01、dns-01、tls-alpn-01）
    Client->>Web: 3. 在 /.well-known/acme-challenge/ 放置挑戰回應
    Client->>CA: 4. 準備驗證
    CA->>Web: 5. 驗證挑戰回應
    CA->>Client: 6. 挑戰已驗證
    Client->>CA: 7. 提交 CSR
    CA->>Client: 8. 簽發憑證
    
    Note over Client,CA: 憑證自動簽發！
{% endmermaid %}

**為什麼 ACME 更好：**

- **零人工介入** - 完全自動化的憑證生命週期
- **自動更新** - 不會有過期的憑證
- **業界標準** - 適用於任何 ACME 客戶端
- **大規模驗證** - 支援 Let's Encrypt（數十億憑證）
- **內建驗證** - 自動證明網域/IP 所有權

**與 Traefik 整合：**

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

**Docker Compose 設定：**

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

| 任務 | OpenSSL | step-ca |
|------|---------|----------|
| **建立 CA** | 多個指令、設定檔 | `step ca init` |
| **簽發憑證** | 5+ 個指令加設定 | `step ca certificate` |
| **更新** | 手動腳本 | `step ca renew --daemon` |
| **ACME 支援** | 未內建 | 內建 |
| **學習曲線** | 陡峭 | 平緩 |
| **自動化** | DIY | 內建 |
| **SSH 憑證** | 複雜 | `step ssh` 指令 |

!!!tip "💡 何時使用 step-ca"
    如果你符合以下情況，請使用 step-ca：
    - 想要自動化憑證管理
    - 需要 ACME 協定支援
    - 想與現代工具整合（Traefik、Kubernetes）
    - 偏好簡單的 CLI 而非複雜的 OpenSSL 指令
    - 需要 SSH 憑證管理
    - 想要內建的更新自動化
    
    如果你符合以下情況，請堅持使用 OpenSSL：
    - 需要對每個細節的最大控制
    - 有現有的基於 OpenSSL 的工作流程
    - 在無法取得 step-ca 二進位檔的隔離環境中工作
    - 需要 step-ca 不支援的特定憑證擴充功能

## 安裝你的 CA 憑證

### Windows

1. 雙擊 `root-ca.crt`
2. 點擊「安裝憑證」
3. 選擇「本機電腦」
4. 選擇「將所有憑證放入以下的存放區」
5. 選擇「受信任的根憑證授權單位」
6. 點擊「完成」

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

1. 將 `root-ca.crt` 寄給自己或放在網頁伺服器上
2. 在裝置上開啟檔案
3. 前往「設定」→「一般」→「VPN 與裝置管理」
4. 安裝描述檔
5. 前往「設定」→「一般」→「關於本機」→「憑證信任設定」
6. 為該憑證啟用完全信任

### Android

1. 將 `root-ca.crt` 複製到裝置
2. 「設定」→「安全性」→「加密與憑證」→「安裝憑證」
3. 選擇「CA 憑證」
4. 瀏覽並選擇你的憑證

## 設定服務

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name homeserver.local;

    ssl_certificate /path/to/homeserver.crt;
    ssl_certificate_key /path/to/homeserver.key;
    
    # 選用：包含中繼 CA
    # ssl_certificate 應包含：伺服器憑證 + 中繼憑證
    
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

## 憑證管理

### 憑證生命週期

{% mermaid %}flowchart TD
    A["📝 建立憑證"] --> B["🚀 部署到伺服器"]
    B --> C["👁️ 監控到期日"]
    C --> D{"⏰ 即將到期？"}
    D -->|"否"| C
    D -->|"是（生命週期的 2/3）"| E["🔄 更新憑證"]
    E --> F["🚀 重新部署到伺服器"]
    F --> C
    
    style A fill:#e3f2fd
    style B fill:#e8f5e9
    style C fill:#fff3e0
    style D fill:#fff9c4
    style E fill:#f3e5f5
    style F fill:#e8f5e9
{% endmermaid %}

### 更新腳本

```bash
#!/bin/bash
# renew-cert.sh

DOMAIN="homeserver.local"
CERT_DIR="/etc/ssl/homelab"

# 產生新的金鑰和 CSR
openssl genrsa -out ${CERT_DIR}/${DOMAIN}.key 2048
openssl req -new -key ${CERT_DIR}/${DOMAIN}.key \
  -out ${CERT_DIR}/${DOMAIN}.csr \
  -subj "/CN=${DOMAIN}"

# 使用中繼 CA 簽署
openssl x509 -req -in ${CERT_DIR}/${DOMAIN}.csr \
  -CA ${CERT_DIR}/intermediate-ca.crt \
  -CAkey ${CERT_DIR}/intermediate-ca.key \
  -CAcreateserial -out ${CERT_DIR}/${DOMAIN}.crt \
  -days 365 -sha256

# 重新載入 nginx
systemctl reload nginx

echo "Certificate renewed for ${DOMAIN}"
```

### 使用 Cron 自動化

```bash
# 新增到 crontab：在到期前 30 天更新
0 0 1 * * /path/to/renew-cert.sh
```

## 安全最佳實務

!!!danger "⚠️ 關鍵安全措施"
    **保護你的根 CA 私鑰：**
    - 儲存在加密的 USB 隨身碟上並離線保存
    - 絕不暴露於網路
    - 使用強密碼（AES-256）
    - 保留多個加密備份
    - 生產環境考慮使用硬體安全模組（HSM）

**關鍵安全措施：**

1. **分離根 CA 和中繼 CA**
   - 根 CA：離線，僅用於簽署中繼 CA
   - 中繼 CA：線上，簽署伺服器憑證

2. **使用強金鑰大小**
   - 根 CA：4096 位元 RSA 或 EC P-384
   - 中繼 CA：4096 位元 RSA 或 EC P-384
   - 伺服器憑證：最少 2048 位元 RSA

3. **設定適當的有效期**
   - 根 CA：10-20 年
   - 中繼 CA：5 年
   - 伺服器憑證：1 年（更容易輪換）

4. **實施憑證撤銷**
   - 維護憑證撤銷清單（CRL）
   - 或使用線上憑證狀態協定（OCSP）

5. **稽核和監控**
   - 記錄所有憑證簽發
   - 監控未授權的憑證
   - 定期安全稽核

## 常見問題與解決方案

### 問題：瀏覽器仍顯示警告

**原因：**
- CA 憑證未正確安裝
- 憑證未包含正確的 SAN（主體別名）
- 透過 IP 存取但憑證只有 DNS 名稱

**解決方案：**
```bash
# 檢查憑證 SAN
openssl x509 -in homeserver.crt -text -noout | grep -A1 "Subject Alternative Name"

# 確保憑證包含所有存取方式
DNS.1 = homeserver.local
DNS.2 = homeserver
IP.1 = 192.168.1.100
```

### 問題：憑證鏈不完整

**解決方案：**
建立憑證組合：
```bash
cat homeserver.crt intermediate-ca.crt > homeserver-bundle.crt
```

在伺服器設定中使用組合檔。

### 問題：私鑰權限

```bash
# 設定正確的權限
chmod 600 homeserver.key
chown root:root homeserver.key
```

## 進階：自動化憑證管理

### 使用 step-ca 的 SSH 憑證

如果你使用 `--ssh` 初始化，step-ca 也可以簽發 SSH 憑證以實現無密碼驗證。

**設定 SSH 使用者驗證：**

```bash
# 在 SSH 伺服器上：信任使用者 CA
step ssh config --roots > /etc/ssh/ssh_user_ca.pub

echo 'TrustedUserCAKeys /etc/ssh/ssh_user_ca.pub' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd

# 在客戶端：取得 SSH 使用者憑證
step ssh certificate alice@homelab.local id_ecdsa
✔ Provisioner: admin@homelab.local (JWK)
✔ Please enter the password to decrypt the provisioner key: ********
✔ CA: https://ca.homelab.local:8443
✔ Private Key: id_ecdsa
✔ Certificate: id_ecdsa-cert.pub
✔ SSH Agent: yes

# 檢查憑證
cat id_ecdsa-cert.pub | step ssh inspect
```

**設定 SSH 主機驗證：**

```bash
# 在 SSH 伺服器上：取得主機憑證
cd /etc/ssh
sudo step ssh certificate --host --sign server.homelab.local ssh_host_ecdsa_key.pub

# 設定 SSHD 使用憑證
echo 'HostCertificate /etc/ssh/ssh_host_ecdsa_key-cert.pub' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd

# 在客戶端：信任主機 CA
step ssh config --host --roots >> ~/.ssh/known_hosts
# 前面加上：@cert-authority *
```

**自動化 SSH 主機憑證更新：**

```bash
# 建立每週更新 cron
cat <<EOF | sudo tee /etc/cron.weekly/renew-ssh-cert
#!/bin/sh
export STEPPATH=/root/.step
cd /etc/ssh && step ssh renew ssh_host_ecdsa_key-cert.pub ssh_host_ecdsa_key --force
exit 0
EOF
sudo chmod 755 /etc/cron.weekly/renew-ssh-cert
```

### 使用 step-ca 與 nginx-proxy-manager

```bash
# 1. 從 step-ca 取得憑證
step ca certificate npm.homelab.local npm.crt npm.key

# 2. 在 nginx-proxy-manager UI 中：
#    - SSL 憑證 → 新增 SSL 憑證 → 自訂
#    - 上傳 npm.crt 和 npm.key
#    - 使用 step ca renew --daemon 設定自動更新
```

### 使用 step-ca 與 Home Assistant

```yaml
# configuration.yaml
http:
  ssl_certificate: /ssl/homeassistant.crt
  ssl_key: /ssl/homeassistant.key

# 取得憑證
# step ca certificate homeassistant.local /ssl/homeassistant.crt /ssl/homeassistant.key
```

### 監控和管理

```bash
# 檢查憑證到期日
step certificate inspect homeserver.crt --short
X.509v3 TLS Certificate (ECDSA P-256) [Serial: 7720...1576]
  Subject:     homeserver.local
  Issuer:      Home Lab Intermediate CA
  Valid from:  2025-05-15T00:59:37Z
          to:  2025-05-16T01:00:37Z

# 撤銷憑證（被動撤銷 - 阻止更新）
step ca revoke --cert homeserver.crt --key homeserver.key
✔ CA: https://ca.homelab.local:8443
Certificate with Serial Number 30671613121311574910895916201205874495 has been revoked.

# 列出佈建者
step ca provisioner list
```

## 比較：私有 CA vs Let's Encrypt

| 功能 | 私有 CA | Let's Encrypt |
|---------|-----------|---------------|
| **成本** | 免費 | 免費 |
| **內部 IP** | ✅ 是 | ❌ 否 |
| **`.local` 網域** | ✅ 是 | ❌ 否 |
| **離線運作** | ✅ 是 | ❌ 否 |
| **自動更新** | 手動/自訂 | ✅ 內建 |
| **公開信任** | ❌ 否 | ✅ 是 |
| **設定複雜度** | 中等 | 低 |
| **維護** | 手動 | 自動化 |

**何時使用私有 CA：**
- 僅限內部服務
- 私有 IP 位址
- `.local` 或自訂 TLD
- 隔離網路
- 需要完全控制

**何時使用 Let's Encrypt：**
- 公開服務
- 公開網域名稱
- 想要自動更新
- 不想管理 CA 基礎設施

## 資源

- **[OpenSSL 文件](https://www.openssl.org/docs/)：** 完整的 OpenSSL 參考
- **[easy-rsa](https://github.com/OpenVPN/easy-rsa)：** 簡化的 CA 管理
- **[step-ca](https://smallstep.com/docs/step-ca)：** 支援 ACME 的現代化 CA
- **[PKI 教學](https://pki-tutorial.readthedocs.io/)：** 全面的 PKI 指南

## 結論

建立私有 CA 一開始可能看起來令人生畏，但一旦設定完成，它就能消除那些煩人的瀏覽器警告，並為你的家庭實驗室服務提供適當的加密。初期的時間投資會帶來更專業、更安全的家庭網路。

**重點摘要：**
- 私有 CA 為內部服務啟用受信任的 HTTPS
- **推薦使用 step-ca** 進行現代化的自動憑證管理
- 兩層架構（根 + 中繼）提供更好的安全性
- 在所有裝置上安裝一次根 CA 憑證
- 自動化憑證更新以避免到期問題（step-ca 讓這變得簡單）
- 保持根 CA 私鑰離線並確保安全
- SSH 憑證消除密碼驗證並提高安全性

**快速入門建議：**

對於大多數家庭實驗室，使用 step-ca：
1. `step ca init --acme --ssh`（一個指令設定）
2. `step certificate install $(step path)/certs/root_ca.crt`（在所有裝置上信任）
3. `step ca certificate service.local service.crt service.key`（取得憑證）
4. `step ca renew service.crt service.key --daemon`（自動更新）

從單一服務開始，熟悉流程後，再擴展到整個家庭實驗室。當你不再需要點擊安全警告時，未來的你會感謝現在的自己！🔒
