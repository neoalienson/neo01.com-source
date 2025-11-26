---
title: "在 Git 中防止憑證：分層防禦策略"
date: 2022-03-21
categories: Development
tags: [Security, Git, Credentials, DevOps]
lang: zh-TW
excerpt: "預防勝於補救。遵循 OWASP DevSecOps 原則，透過預提交鉤子、密鑰掃描、程式碼檢查和自動偵測建構多層防禦。"
thumbnail: /assets/git/thumbnail.png
---

在探討[如何從憑證洩露中復原](/zh-TW/2022/02/Managing-Credentials-Committed-to-Git/)之後,顯而易見的問題出現了：我們如何一開始就防止憑證進入 Git？答案不是單一工具或技術——而是在多個階段捕捉錯誤的分層防禦策略,在它們成為事件之前。

預防比補救有效得多。從 Git 歷史中刪除憑證需要重寫提交、與團隊成員協調,並接受分支和鏡像可能永久保留洩露。相比之下,防止初始提交只需幾秒鐘,並消除所有下游複雜性。本文探討形成全面憑證保護策略的實用工具和技術。

## 防禦層次

有效的憑證保護需要多個重疊的防禦：

!!!anote "🛡️ 深度防禦"
    **第 1 層：設定**
    - `.gitignore` 防止追蹤憑證檔案
    - 全域模式捕捉常見錯誤
    - 範本檔案指導正確結構
    
    **第 2 層：程式碼實踐**
    - 環境變數將設定與程式碼分離
    - 設定函式庫強制執行模式
    - 程式碼審查捕捉硬編碼密鑰
    
    **第 3 層：自動掃描**
    - 預提交鉤子阻止包含憑證的提交
    - CI/CD 管線掃描捕捉繞過的鉤子
    - 儲存庫掃描偵測歷史洩露
    
    **第 4 層：密鑰管理**
    - 集中式憑證儲存
    - 執行時密鑰注入
    - 自動輪換功能
    
    **第 5 層：監控**
    - 平台提供的掃描（GitHub、GitLab）
    - 自訂模式偵測
    - 快速回應的警報系統

每一層捕捉不同類型的錯誤,並在其他層失敗時提供冗餘。


## 第 1 層：Gitignore 設定

第一道防線防止 Git 追蹤憑證檔案。

### 必要的 Gitignore 模式

設定 `.gitignore` 以排除常見的憑證位置：

```gitignore
# 環境檔案
.env
.env.local
.env.*.local
.env.development
.env.production

# 設定檔案
config/secrets.yml
config/database.yml
config/credentials.yml
secrets.json
secrets.yaml

# 金鑰檔案
*.key
*.pem
*.p12
*.pfx
*.cer
*.crt
id_rsa
id_dsa

# 雲端供應商憑證
.aws/credentials
.azure/credentials
gcloud-service-key.json

# 可能包含憑證的 IDE 檔案
.vscode/settings.json
.idea/workspace.xml
.idea/dataSources.xml
```

!!!tip "📝 Gitignore 最佳實踐"
    **儲存庫層級模式**
    - 在第一次提交前新增模式
    - 包含專案特定的憑證檔案
    - 記錄為什麼檔案被忽略
    - 將 `.gitignore` 提交到儲存庫
    
    **全域 Gitignore**
    - 全域設定個人模式
    - 涵蓋 IDE 特定檔案
    - 套用到所有儲存庫
    
    ```bash
    # 設定全域 gitignore
    git config --global core.excludesfile ~/.gitignore_global
    
    # 新增常見模式
    cat >> ~/.gitignore_global << EOF
    .env
    *.key
    *.pem
    .DS_Store
    EOF
    ```

### 指導用的範本檔案

提供 `.env.example` 檔案顯示所需結構,但不包含實際憑證：

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_KEY=your_api_key_here
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
STRIPE_SECRET_KEY=sk_test_your_key_here
```

```bash
# .gitignore
.env
.env.local

# README.md 說明
# 複製 .env.example 到 .env 並填入實際值
```

範本檔案引導開發者採用正確的憑證管理方式,而不暴露實際密鑰。


## 第 2 層：環境變數和設定

透過環境變數和設定管理將憑證與程式碼分離。

### 環境變數模式

將憑證儲存在環境變數中,絕不在程式碼中：

```python
# config.py - 不良：硬編碼憑證
DATABASE_URL = "postgresql://user:pass123@localhost/db"
API_KEY = "sk_live_abc123xyz789"

# config.py - 良好：環境變數
import os

DATABASE_URL = os.environ["DATABASE_URL"]
API_KEY = os.environ["API_KEY"]

# config.py - 更好：帶驗證和預設值
import os

def get_required_env(key):
    value = os.environ.get(key)
    if not value:
        raise ValueError(f"Required environment variable {key} is not set")
    return value

DATABASE_URL = get_required_env("DATABASE_URL")
API_KEY = get_required_env("API_KEY")
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
```

```javascript
// config.js - 不良：硬編碼憑證
const config = {
  apiKey: "sk_live_abc123xyz789",
  dbPassword: "password123"
};

// config.js - 良好：環境變數
const config = {
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD
};

// config.js - 更好：帶驗證
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

const config = {
  apiKey: requireEnv("API_KEY"),
  dbPassword: requireEnv("DB_PASSWORD"),
  debug: process.env.DEBUG === "true"
};
```

!!!success "✅ 環境變數的優勢"
    **優點**
    - 憑證永遠不在原始碼中
    - 每個環境不同的值
    - 無需變更程式碼即可輕鬆輪換
    - 跨語言和平台的標準
    - 部署系統支援
    
    **實施指南**
    - 在啟動時驗證必要變數
    - 如果憑證缺失則快速失敗
    - 記錄所有必要變數
    - 為非密鑰提供合理預設值
    - 使用一致的命名慣例

### 設定函式庫

使用強制執行環境變數模式的設定函式庫：

```python
# 使用 python-decouple
from decouple import config

DATABASE_URL = config("DATABASE_URL")
API_KEY = config("API_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
```

```javascript
// 使用 dotenv
require('dotenv').config();

const config = {
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD
};
```

設定函式庫提供一致的模式並減少樣板程式碼。


## 第 3 層：預提交鉤子

自動掃描在憑證進入 Git 歷史之前捕捉它們。根據 [OWASP DevSecOps 指南](https://owasp.org/www-project-devsecops-guideline/latest/01-Pre-commit),預提交階段至關重要,因為它在安全問題到達中央儲存庫之前就予以防止。此階段專注於兩個關鍵領域：密鑰管理和程式碼檢查,透過早期偵測確保更高品質的程式碼。

### 為什麼預提交很重要

預提交階段作為第一道防線：

!!!anote "🎯 預提交的優勢"
    **早期偵測**
    - 在問題進入儲存庫之前捕捉
    - 防止密鑰到達中央 Git 伺服器
    - 在開發者工作站立即阻止提交
    - 大幅降低補救成本
    
    **品質強制執行**
    - 透過檢查工具強制執行編碼標準
    - 驗證程式碼格式一致性
    - 檢查安全漏洞
    - 確保符合團隊指南
    
    **開發者回饋**
    - 即時回饋循環
    - 教育開發者安全實踐
    - 防止尷尬的公開洩露
    - 建立安全意識

### 基本預提交鉤子

建立簡單的鉤子來偵測常見的憑證模式：

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 取得暫存的變更
STAGED_DIFF=$(git diff --cached)

# 檢查常見的憑證模式
if echo "$STAGED_DIFF" | grep -qE "(password|api_key|secret|token)\s*=\s*['\"][^'\"]+['\"]"; then
  echo "❌ 錯誤：在提交中偵測到潛在憑證"
  echo "請移除憑證並使用環境變數"
  exit 1
fi

# 檢查 AWS 存取金鑰
if echo "$STAGED_DIFF" | grep -qE "AKIA[0-9A-Z]{16}"; then
  echo "❌ 錯誤：偵測到 AWS 存取金鑰"
  exit 1
fi

# 檢查私鑰
if echo "$STAGED_DIFF" | grep -qE "BEGIN.*PRIVATE KEY"; then
  echo "❌ 錯誤：偵測到私鑰"
  exit 1
fi

# 檢查高熵字串（潛在密鑰）
if echo "$STAGED_DIFF" | grep -qE "['\"][a-zA-Z0-9]{32,}['\"]"; then
  echo "⚠️  警告：偵測到高熵字串（可能是密鑰）"
  echo "提交前請仔細審查"
fi

exit 0
```

### 使用 git-secrets

AWS 的 git-secrets 提供全面的憑證偵測：

```bash
# 安裝 git-secrets
brew install git-secrets  # macOS
# 或
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# 在儲存庫中安裝鉤子
cd /path/to/your/repo
git secrets --install

# 註冊 AWS 模式
git secrets --register-aws

# 新增自訂模式
git secrets --add 'password\s*=\s*["\'][^"\']+["\']'
git secrets --add 'api[_-]?key\s*=\s*["\'][^"\']+["\']'
git secrets --add '["\'][a-zA-Z0-9]{32,}["\']'

# 掃描儲存庫歷史
git secrets --scan-history
```

!!!tip "🔧 git-secrets 設定"
    **全域安裝**
    - 在所有儲存庫中安裝鉤子：`git secrets --install ~/.git-templates/git-secrets`
    - 設定全域範本目錄：`git config --global init.templateDir ~/.git-templates/git-secrets`
    
    **自訂模式**
    - 新增組織特定模式：`git secrets --add 'MYCOMPANY_[A-Z_]+\s*=\s*["\'][^"\']+["\']'`
    - 新增內部權杯模式：`git secrets --add 'internal[_-]token\s*:\s*["\'][^"\']+["\']'`
    
    **允許的模式**
    - 將誤報加入白名單：`git secrets --add --allowed 'example_password'`
    - 允許測試金鑰：`git secrets --add --allowed 'test_api_key'`

### 使用 detect-secrets

Yelp 的 detect-secrets 提供進階的基於熵的偵測：

```bash
# 安裝 detect-secrets
pip install detect-secrets

# 建立基準線
detect-secrets scan > .secrets.baseline

# 提交基準線
git add .secrets.baseline
git commit -m "Add secrets baseline"

# 安裝預提交鉤子
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
detect-secrets-hook --baseline .secrets.baseline $(git diff --cached --name-only)
EOF
chmod +x .git/hooks/pre-commit
```

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

!!!success "✅ detect-secrets 功能"
    **進階偵測**
    - 基於熵的密鑰偵測
    - 自訂偵測器的外掛系統
    - 管理誤報的基準線
    - 支援多種密鑰類型
    
    **管理誤報**
    - 稽核基準線：`detect-secrets audit .secrets.baseline`
    - 更新基準線：`detect-secrets scan --baseline .secrets.baseline`

### 使用 pre-commit 框架

pre-commit 框架管理多個鉤子：

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
      
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.16.1
    hooks:
      - id: gitleaks
```

```bash
# 安裝 pre-commit
pip install pre-commit

# 安裝鉤子
pre-commit install

# 手動執行
pre-commit run --all-files
```

pre-commit 框架在專案間提供一致的鉤子管理。

### 程式碼檢查整合

除了密鑰偵測,預提交鉤子應強制執行程式碼品質：

```yaml
# .pre-commit-config.yaml - 全面設定
repos:
  # 安全：密鑰偵測
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
  
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: trailing-whitespace
      - id: end-of-file-fixer
  
  # 程式碼品質：檢查
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3
  
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=88']
  
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.40.0
    hooks:
      - id: eslint
        files: \.[jt]sx?$
        types: [file]
```

!!!tip "🔧 檢查最佳實踐"
    **Python 專案**
    - **Black**：程式碼格式化
    - **Flake8**：風格指南強制執行
    - **Pylint**：程式碼分析
    - **mypy**：型別檢查
    
    **JavaScript/TypeScript 專案**
    - **ESLint**：程式碼品質和風格
    - **Prettier**：程式碼格式化
    - **TSLint**：TypeScript 特定規則
    
    **檢查的優勢**
    - 團隊間一致的程式碼風格
    - 早期捕捉常見錯誤
    - 強制執行安全最佳實踐
    - 減少程式碼審查摩擦
    - 提高程式碼可維護性

結合密鑰偵測與程式碼檢查建立了全面的預提交防禦,同時解決安全和品質問題。


## 第 4 層：CI/CD 管線掃描

透過 CI/CD 掃描捕捉繞過預提交鉤子的憑證。

### GitHub Actions 整合

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI 整合

```yaml
# .gitlab-ci.yml
secret-detection:
  stage: test
  image: python:3.9
  before_script:
    - pip install detect-secrets
  script:
    - detect-secrets scan --baseline .secrets.baseline
  only:
    - merge_requests
    - main
```

### 自訂掃描腳本

```python
# scripts/scan_secrets.py
import re
import sys
import subprocess

PATTERNS = [
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key'),
    (r'password\s*=\s*["\'][^"\']+["\']', 'Password'),
    (r'api[_-]?key\s*=\s*["\'][^"\']+["\']', 'API Key'),
    (r'BEGIN.*PRIVATE KEY', 'Private Key'),
]

def scan_commit(commit_hash):
    diff = subprocess.check_output(
        ['git', 'show', commit_hash],
        text=True
    )
    
    findings = []
    for pattern, name in PATTERNS:
        matches = re.findall(pattern, diff, re.IGNORECASE)
        if matches:
            findings.append({
                'type': name,
                'pattern': pattern,
                'count': len(matches)
            })
    
    return findings

if __name__ == '__main__':
    commit = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'],
        text=True
    ).strip()
    
    findings = scan_commit(commit)
    if findings:
        print("❌ 在提交中偵測到憑證！")
        for finding in findings:
            print(f"  - {finding['type']}: {finding['count']} 個符合")
        sys.exit(1)
    
    print("✅ 未偵測到憑證")
```

CI/CD 掃描在開發者繞過本機鉤子時提供安全網。


## 第 5 層：密鑰管理系統

在生產環境中用集中式密鑰管理取代環境變數。

### AWS Secrets Manager

```python
# 在執行時取得密鑰
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# 在應用程式中使用
secrets = get_secret('production/app/credentials')
DATABASE_URL = secrets['database_url']
API_KEY = secrets['api_key']
```

### HashiCorp Vault

```python
# 使用 hvac 函式庫
import hvac

client = hvac.Client(url='https://vault.example.com')
client.auth.approle.login(
    role_id=os.environ['VAULT_ROLE_ID'],
    secret_id=os.environ['VAULT_SECRET_ID']
)

secrets = client.secrets.kv.v2.read_secret_version(
    path='production/app'
)
DATABASE_URL = secrets['data']['data']['database_url']
```

### Kubernetes Secrets

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0BkYi9uYW1l
  api-key: c2tfbGl2ZV9hYmMxMjN4eXo3ODk=
```

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

!!!anote "🔐 密鑰管理的優勢"
    **優點**
    - 集中式憑證儲存
    - 自動輪換功能
    - 存取控制和稽核
    - 靜態和傳輸中的加密
    - 與雲端平台整合
    - 短期憑證減少暴露視窗
    
    **何時使用**
    - 生產環境
    - 多服務架構
    - 合規要求
    - 需要自動憑證輪換
    - 團隊範圍的憑證共享

### 短期憑證

密鑰管理系統啟用自動過期的短期憑證：

```python
# AWS STS 臨時憑證
import boto3

sts = boto3.client('sts')
response = sts.assume_role(
    RoleArn='arn:aws:iam::123456789012:role/AppRole',
    RoleSessionName='app-session',
    DurationSeconds=3600  # 1 小時
)

credentials = response['Credentials']
# 使用臨時憑證
```

```python
# Vault 動態密鑰
import hvac

client = hvac.Client(url='https://vault.example.com')
client.auth.approle.login(
    role_id=os.environ['VAULT_ROLE_ID'],
    secret_id=os.environ['VAULT_SECRET_ID']
)

# 產生短期資料庫憑證
db_creds = client.secrets.database.generate_credentials(
    name='my-role',
    ttl='1h'
)

username = db_creds['data']['username']
password = db_creds['data']['password']
# 憑證在 1 小時後自動過期
```

!!!success "✅ 短期憑證的優勢"
    **安全優勢**
    - 憑證自動過期
    - 減少憑證洩露的視窗
    - 無需手動輪換
    - 洩露的憑證快速失效
    - 限制憑證暴露的影響範圍
    
    **實施模式**
    - AWS STS 用於臨時 AWS 憑證（15 分鐘 - 12 小時）
    - Vault 動態密鑰用於資料庫（幾分鐘到幾小時）
    - 具有短過期時間的 OAuth 權杖（幾分鐘到幾小時）
    - 具有 TTL 的服務帳戶權杖
    - 具有短有效期的憑證式驗證
    
    **最佳實踐**
    - 為憑證設定最短實用 TTL
    - 實施自動憑證更新
    - 監控憑證使用模式
    - 在應用程式關閉時撤銷憑證
    - 使用憑證快取以最小化請求


## 第 6 層：使用 GitProxy 的推送保護

對於需要核准工作流程的組織,[GitProxy](https://git-proxy.finos.org/) 在 Git 之上提供自訂推送保護和政策。

### 什麼是 GitProxy？

GitProxy 是一個高度可設定的框架,在維持開發者體驗的同時強制執行推送保護：

!!!anote "🛡️ GitProxy 功能"
    **開發者優先設計**
    - 在到達遠端儲存庫之前攔截推送
    - 在 CLI/終端機中呈現補救說明
    - 最小化摩擦和採用障礙
    - 讓開發者專注於提交程式碼
    
    **核准工作流程**
    - 將推送保持在暫停狀態
    - 需要明確核准才能推送到上游
    - 提供 Web UI、REST API 和 CLI 進行核准
    - 產生可共享的推送審查連結
    
    **可設定的政策**
    - 自訂推送保護規則
    - 組織特定的安全態勢
    - 風險偏好對齊
    - 與現有工作流程整合

### 快速設定

```bash
# 安裝 GitProxy
npm install -g @finos/git-proxy

# 建立設定
cat > proxy.config.json << EOF
{
  "authorisedList": [
    {
      "project": "your-org",
      "name": "your-repo",
      "url": "https://github.com/your-org/your-repo.git"
    }
  ]
}
EOF

# 執行 GitProxy
npx @finos/git-proxy --config ./proxy.config.json

# 設定儲存庫使用 GitProxy
git remote set-url origin http://localhost:8000/your-org/your-repo.git
```

### 核准工作流程

當開發者推送程式碼時：

```bash
$ git push
remote:
remote: GitProxy has received your push ✅
remote:
remote: 🔗 Shareable Link
remote: http://localhost:8080/dashboard/push/000000__b12557
```

透過 CLI 核准：

```bash
# 登入
npx @finos/git-proxy-cli login --username admin --password admin

# 核准推送
npx @finos/git-proxy-cli authorise --id 000000__b12557

# 開發者重新推送
git push  # 現在成功
```

!!!tip "🎯 GitProxy 使用案例"
    **何時使用 GitProxy**
    - 需要核准工作流程的受監管產業
    - 具有嚴格變更控制的組織
    - 需要在生產前審查推送的團隊
    - 程式碼變更的合規要求
    - 預提交鉤子之外的額外層次
    
    **優勢**
    - 集中式推送控制
    - 所有推送的稽核軌跡
    - 組織層級的政策強制執行
    - 開發者無法繞過
    - 補充預提交鉤子


## 第 7 層：平台掃描和監控

利用平台提供的掃描進行持續監控。

### GitHub 密鑰掃描

GitHub 自動掃描公開儲存庫：

!!!anote "🔍 GitHub 密鑰掃描"
    **自動偵測**
    - 掃描公開儲存庫中的所有提交
    - 偵測 100 多種憑證模式
    - 通知儲存庫管理員
    - 警告憑證提供者（AWS、Azure 等）
    
    **GitHub Advanced Security**
    - 適用於私有儲存庫
    - 自訂模式支援
    - 推送保護（阻止提交）
    - 與安全公告整合
    
    **啟用推送保護**
    - Settings → Code security and analysis → Push protection → Enable

### GitLab 密鑰偵測

```yaml
# .gitlab-ci.yml
include:
  - template: Security/Secret-Detection.gitlab-ci.yml

secret_detection:
  variables:
    SECRET_DETECTION_HISTORIC_SCAN: "true"
```

### 自訂監控

```python
# 監控新提交
import requests
import re

def check_commit(repo, commit_sha):
    url = f"https://api.github.com/repos/{repo}/commits/{commit_sha}"
    response = requests.get(url)
    commit_data = response.json()
    
    patterns = [
        r'AKIA[0-9A-Z]{16}',
        r'password\s*=\s*["\'][^"\']+["\']',
    ]
    
    for file in commit_data.get('files', []):
        patch = file.get('patch', '')
        for pattern in patterns:
            if re.search(pattern, patch):
                alert_security_team(repo, commit_sha, pattern)
```

持續監控捕捉滑過其他層次的憑證。


## 實施策略

遵循 OWASP DevSecOps 原則逐步推出憑證保護：

!!!tip "📋 實施路線圖"
    **階段 1：基礎（第 1 週）**
    - 新增全面的 `.gitignore` 模式
    - 建立 `.env.example` 範本
    - 記錄環境變數要求
    - 稽核現有程式碼中的硬編碼憑證
    
    **階段 2：預提交保護（第 2 週）**
    - 安裝 git-secrets 或 detect-secrets
    - 設定密鑰偵測的預提交鉤子
    - 新增程式碼檢查鉤子（Black、ESLint 等）
    - 訓練團隊預提交工作流程
    - 建立程式碼審查指南
    
    **階段 3：CI/CD 整合（第 3 週）**
    - 將密鑰掃描新增到 CI/CD 管線
    - 在建置流程中整合檢查檢查
    - 設定自動警報
    - 阻止包含偵測到憑證或檢查失敗的合併
    - 設定監控儀表板
    
    **階段 4：推送保護（第 4 週）**
    - 評估 GitProxy 的核准工作流程
    - 設定推送政策和授權儲存庫
    - 設定核准流程（UI、CLI、API）
    - 訓練團隊核准工作流程
    - 記錄升級程序
    
    **階段 5：密鑰管理（第 5 週以上）**
    - 評估密鑰管理解決方案
    - 遷移生產憑證
    - 實施自動輪換
    - 記錄操作程序
    
    **階段 6：持續改進**
    - 審查和更新偵測模式
    - 分析誤報率
    - 收集團隊回饋
    - 根據團隊需求優化檢查規則
    - 進行定期安全訓練

## 處理誤報

所有掃描工具都會產生需要管理的誤報：

```bash
# git-secrets：允許特定模式
git secrets --add --allowed 'example_password'
git secrets --add --allowed 'test_api_key'

# detect-secrets：稽核並標記誤報
detect-secrets audit .secrets.baseline
# 互動式：將每個發現標記為真實或誤報

# gitleaks：使用 .gitleaksignore
echo "path/to/test/file.py" >> .gitleaksignore
```

```yaml
# detect-secrets 的自訂設定
# .secrets.baseline
{
  "exclude": {
    "files": "test/.*|.*\\.example$",
    "lines": "password.*=.*example"
  }
}
```

!!!warning "⚠️ 誤報管理"
    **最佳實踐**
    - 仔細審查每個誤報
    - 記錄為什麼允許模式
    - 使用特定的允許清單,而非廣泛模式
    - 定期稽核允許的模式
    - 移除過時的允許清單項目


## 結論

防止憑證進入 Git 需要與 OWASP DevSecOps 原則一致的分層防禦策略。沒有單一工具能捕捉每個錯誤,但多個重疊的防禦建立了強大的保護系統。預提交階段特別關鍵——它是你的第一道也是最有效的防線,在問題到達中央儲存庫之前就予以捕捉。

從 `.gitignore` 設定和環境變數開始建立正確的模式。新增預提交鉤子以自動進行密鑰和程式碼品質的本機掃描。實施 CI/CD 管線檢查以捕捉繞過的鉤子。對於需要核准工作流程的組織,GitProxy 提供了無法繞過的額外推送保護層。為生產憑證部署密鑰管理系統,優先考慮自動過期的短期憑證以最小化暴露視窗。啟用平台掃描以進行持續監控。

在預防上的投資立即帶來回報。每個被防止的憑證洩露都避免了 [Git 歷史重寫、憑證輪換和事件回應](/zh-TW/2022/02/Managing-Credentials-Committed-to-Git/)的複雜性。維護掃描工具的營運負擔與憑證洩露的成本相比微不足道。

從基礎開始——正確的 `.gitignore` 和環境變數——然後逐步新增層次。預提交鉤子應該是你的下一個優先事項,結合密鑰偵測與程式碼檢查以進行全面的品質強制執行。即使是基本的預提交鉤子也能捕捉大多數意外提交。對於受監管的環境,考慮使用 GitProxy 來強制執行核准工作流程。具有短期憑證的進階密鑰管理代表黃金標準,但可以等到你的團隊掌握基礎知識後再實施。

記住：每個提交到 Git 的憑證都應被視為已洩露。預防不僅僅是關於工具——它是關於建立一種文化,讓憑證保護和程式碼品質成為自動的,而非事後想法。短期憑證體現了深度防禦——即使洩露,它們也會快速過期,限制損害。預提交階段在開發者最需要的時候為他們提供即時回饋和教育。
