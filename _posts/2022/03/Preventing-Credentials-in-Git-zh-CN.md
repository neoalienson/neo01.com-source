---
title: "在 Git 中防止凭证：分层防御策略"
date: 2022-03-21
categories: Development
tags: [Security, Git, DevOps]
lang: zh-CN
excerpt: "预防胜于补救。遵循 OWASP DevSecOps 原则，通过预提交钩子、密钥扫描、代码检查和自动检测构建多层防御。"
thumbnail: /assets/git/thumbnail.png
---

在探讨[如何从凭证泄露中恢复](/zh-CN/2022/02/Managing-Credentials-Committed-to-Git/)之后,显而易见的问题出现了：我们如何一开始就防止凭证进入 Git？答案不是单一工具或技术——而是在多个阶段捕获错误的分层防御策略,在它们成为事件之前。

预防比补救有效得多。从 Git 历史中删除凭证需要重写提交、与团队成员协调,并接受分支和镜像可能永久保留泄露。相比之下,防止初始提交只需几秒钟,并消除所有下游复杂性。本文探讨形成全面凭证保护策略的实用工具和技术。

## 防御层次

有效的凭证保护需要多个重叠的防御：

!!!anote "🛡️ 深度防御"
    **第 1 层：配置**
    - `.gitignore` 防止跟踪凭证文件
    - 全局模式捕获常见错误
    - 模板文件指导正确结构
    
    **第 2 层：代码实践**
    - 环境变量将配置与代码分离
    - 配置库强制执行模式
    - 代码审查捕获硬编码密钥
    
    **第 3 层：自动扫描**
    - 预提交钩子阻止包含凭证的提交
    - CI/CD 流水线扫描捕获绕过的钩子
    - 仓库扫描检测历史泄露
    
    **第 4 层：密钥管理**
    - 集中式凭证存储
    - 运行时密钥注入
    - 自动轮换功能
    
    **第 5 层：监控**
    - 平台提供的扫描（GitHub、GitLab）
    - 自定义模式检测
    - 快速响应的警报系统

每一层捕获不同类型的错误,并在其他层失败时提供冗余。


## 第 1 层：Gitignore 配置

第一道防线防止 Git 跟踪凭证文件。

### 必要的 Gitignore 模式

配置 `.gitignore` 以排除常见的凭证位置：

```gitignore
# 环境文件
.env
.env.local
.env.*.local
.env.development
.env.production

# 配置文件
config/secrets.yml
config/database.yml
config/credentials.yml
secrets.json
secrets.yaml

# 密钥文件
*.key
*.pem
*.p12
*.pfx
*.cer
*.crt
id_rsa
id_dsa

# 云服务商凭证
.aws/credentials
.azure/credentials
gcloud-service-key.json

# 可能包含凭证的 IDE 文件
.vscode/settings.json
.idea/workspace.xml
.idea/dataSources.xml
```

!!!tip "📝 Gitignore 最佳实践"
    **仓库级别模式**
    - 在第一次提交前添加模式
    - 包含项目特定的凭证文件
    - 记录为什么文件被忽略
    - 将 `.gitignore` 提交到仓库
    
    **全局 Gitignore**
    - 全局配置个人模式
    - 涵盖 IDE 特定文件
    - 应用到所有仓库
    
    ```bash
    # 设置全局 gitignore
    git config --global core.excludesfile ~/.gitignore_global
    
    # 添加常见模式
    cat >> ~/.gitignore_global << EOF
    .env
    *.key
    *.pem
    .DS_Store
    EOF
    ```

### 指导用的模板文件

提供 `.env.example` 文件显示所需结构,但不包含实际凭证：

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

# README.md 说明
# 复制 .env.example 到 .env 并填入实际值
```

模板文件引导开发者采用正确的凭证管理方式,而不暴露实际密钥。


## 第 2 层：环境变量和配置

通过环境变量和配置管理将凭证与代码分离。

### 环境变量模式

将凭证存储在环境变量中,绝不在代码中：

```python
# config.py - 不良：硬编码凭证
DATABASE_URL = "postgresql://user:pass123@localhost/db"
API_KEY = "sk_live_abc123xyz789"

# config.py - 良好：环境变量
import os

DATABASE_URL = os.environ["DATABASE_URL"]
API_KEY = os.environ["API_KEY"]

# config.py - 更好：带验证和默认值
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
// config.js - 不良：硬编码凭证
const config = {
  apiKey: "sk_live_abc123xyz789",
  dbPassword: "password123"
};

// config.js - 良好：环境变量
const config = {
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD
};

// config.js - 更好：带验证
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

!!!success "✅ 环境变量的优势"
    **优点**
    - 凭证永远不在源代码中
    - 每个环境不同的值
    - 无需更改代码即可轻松轮换
    - 跨语言和平台的标准
    - 部署系统支持
    
    **实施指南**
    - 在启动时验证必要变量
    - 如果凭证缺失则快速失败
    - 记录所有必要变量
    - 为非密钥提供合理默认值
    - 使用一致的命名约定

### 配置库

使用强制执行环境变量模式的配置库：

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

配置库提供一致的模式并减少样板代码。


## 第 3 层：预提交钩子

自动扫描在凭证进入 Git 历史之前捕获它们。根据 [OWASP DevSecOps 指南](https://owasp.org/www-project-devsecops-guideline/latest/01-Pre-commit),预提交阶段至关重要,因为它在安全问题到达中央仓库之前就予以防止。此阶段专注于两个关键领域：密钥管理和代码检查,通过早期检测确保更高质量的代码。

### 为什么预提交很重要

预提交阶段作为第一道防线：

!!!anote "🎯 预提交的优势"
    **早期检测**
    - 在问题进入仓库之前捕获
    - 防止密钥到达中央 Git 服务器
    - 在开发者工作站立即阻止提交
    - 大幅降低补救成本
    
    **质量强制执行**
    - 通过检查工具强制执行编码标准
    - 验证代码格式一致性
    - 检查安全漏洞
    - 确保符合团队指南
    
    **开发者反馈**
    - 即时反馈循环
    - 教育开发者安全实践
    - 防止尴尬的公开泄露
    - 建立安全意识

### 基本预提交钩子

创建简单的钩子来检测常见的凭证模式：

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 获取暂存的更改
STAGED_DIFF=$(git diff --cached)

# 检查常见的凭证模式
if echo "$STAGED_DIFF" | grep -qE "(password|api_key|secret|token)\s*=\s*['\"][^'\"]+['\"]"; then
  echo "❌ 错误：在提交中检测到潜在凭证"
  echo "请移除凭证并使用环境变量"
  exit 1
fi

# 检查 AWS 访问密钥
if echo "$STAGED_DIFF" | grep -qE "AKIA[0-9A-Z]{16}"; then
  echo "❌ 错误：检测到 AWS 访问密钥"
  exit 1
fi

# 检查私钥
if echo "$STAGED_DIFF" | grep -qE "BEGIN.*PRIVATE KEY"; then
  echo "❌ 错误：检测到私钥"
  exit 1
fi

# 检查高熵字符串（潜在密钥）
if echo "$STAGED_DIFF" | grep -qE "['\"][a-zA-Z0-9]{32,}['\"]"; then
  echo "⚠️  警告：检测到高熵字符串（可能是密钥）"
  echo "提交前请仔细审查"
fi

exit 0
```

### 使用 git-secrets

AWS 的 git-secrets 提供全面的凭证检测：

```bash
# 安装 git-secrets
brew install git-secrets  # macOS
# 或
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# 在仓库中安装钩子
cd /path/to/your/repo
git secrets --install

# 注册 AWS 模式
git secrets --register-aws

# 添加自定义模式
git secrets --add 'password\s*=\s*["\'][^"\']+["\']'
git secrets --add 'api[_-]?key\s*=\s*["\'][^"\']+["\']'
git secrets --add '["\'][a-zA-Z0-9]{32,}["\']'

# 扫描仓库历史
git secrets --scan-history
```

!!!tip "🔧 git-secrets 配置"
    **全局安装**
    - 在所有仓库中安装钩子：`git secrets --install ~/.git-templates/git-secrets`
    - 设置全局模板目录：`git config --global init.templateDir ~/.git-templates/git-secrets`
    
    **自定义模式**
    - 添加组织特定模式：`git secrets --add 'MYCOMPANY_[A-Z_]+\s*=\s*["\'][^"\']+["\']'`
    - 添加内部令牌模式：`git secrets --add 'internal[_-]token\s*:\s*["\'][^"\']+["\']'`
    
    **允许的模式**
    - 将误报加入白名单：`git secrets --add --allowed 'example_password'`
    - 允许测试密钥：`git secrets --add --allowed 'test_api_key'`

### 使用 detect-secrets

Yelp 的 detect-secrets 提供高级的基于熵的检测：

```bash
# 安装 detect-secrets
pip install detect-secrets

# 创建基线
detect-secrets scan > .secrets.baseline

# 提交基线
git add .secrets.baseline
git commit -m "Add secrets baseline"

# 安装预提交钩子
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
    **高级检测**
    - 基于熵的密钥检测
    - 自定义检测器的插件系统
    - 管理误报的基线
    - 支持多种密钥类型
    
    **管理误报**
    - 审计基线：`detect-secrets audit .secrets.baseline`
    - 更新基线：`detect-secrets scan --baseline .secrets.baseline`

### 使用 pre-commit 框架

pre-commit 框架管理多个钩子：

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
# 安装 pre-commit
pip install pre-commit

# 安装钩子
pre-commit install

# 手动运行
pre-commit run --all-files
```

pre-commit 框架在项目间提供一致的钩子管理。

### 代码检查集成

除了密钥检测,预提交钩子应强制执行代码质量：

```yaml
# .pre-commit-config.yaml - 全面配置
repos:
  # 安全：密钥检测
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
  
  # 代码质量：检查
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

!!!tip "🔧 检查最佳实践"
    **Python 项目**
    - **Black**：代码格式化
    - **Flake8**：风格指南强制执行
    - **Pylint**：代码分析
    - **mypy**：类型检查
    
    **JavaScript/TypeScript 项目**
    - **ESLint**：代码质量和风格
    - **Prettier**：代码格式化
    - **TSLint**：TypeScript 特定规则
    
    **检查的优势**
    - 团队间一致的代码风格
    - 早期捕获常见错误
    - 强制执行安全最佳实践
    - 减少代码审查摩擦
    - 提高代码可维护性

结合密钥检测与代码检查创建了全面的预提交防御,同时解决安全和质量问题。


## 第 4 层：CI/CD 流水线扫描

通过 CI/CD 扫描捕获绕过预提交钩子的凭证。

### GitHub Actions 集成

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

### GitLab CI 集成

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

### 自定义扫描脚本

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
        print("❌ 在提交中检测到凭证！")
        for finding in findings:
            print(f"  - {finding['type']}: {finding['count']} 个匹配")
        sys.exit(1)
    
    print("✅ 未检测到凭证")
```

CI/CD 扫描在开发者绕过本地钩子时提供安全网。


## 第 5 层：密钥管理系统

在生产环境中用集中式密钥管理取代环境变量。

### AWS Secrets Manager

```python
# 在运行时获取密钥
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# 在应用程序中使用
secrets = get_secret('production/app/credentials')
DATABASE_URL = secrets['database_url']
API_KEY = secrets['api_key']
```

### HashiCorp Vault

```python
# 使用 hvac 库
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

!!!anote "🔐 密钥管理的优势"
    **优点**
    - 集中式凭证存储
    - 自动轮换功能
    - 访问控制和审计
    - 静态和传输中的加密
    - 与云平台集成
    - 短期凭证减少暴露窗口
    
    **何时使用**
    - 生产环境
    - 多服务架构
    - 合规要求
    - 需要自动凭证轮换
    - 团队范围的凭证共享

### 短期凭证

密钥管理系统启用自动过期的短期凭证：

```python
# AWS STS 临时凭证
import boto3

sts = boto3.client('sts')
response = sts.assume_role(
    RoleArn='arn:aws:iam::123456789012:role/AppRole',
    RoleSessionName='app-session',
    DurationSeconds=3600  # 1 小时
)

credentials = response['Credentials']
# 使用临时凭证
```

```python
# Vault 动态密钥
import hvac

client = hvac.Client(url='https://vault.example.com')
client.auth.approle.login(
    role_id=os.environ['VAULT_ROLE_ID'],
    secret_id=os.environ['VAULT_SECRET_ID']
)

# 生成短期数据库凭证
db_creds = client.secrets.database.generate_credentials(
    name='my-role',
    ttl='1h'
)

username = db_creds['data']['username']
password = db_creds['data']['password']
# 凭证在 1 小时后自动过期
```

!!!success "✅ 短期凭证的优势"
    **安全优势**
    - 凭证自动过期
    - 减少凭证泄露的窗口
    - 无需手动轮换
    - 泄露的凭证快速失效
    - 限制凭证暴露的影响范围
    
    **实施模式**
    - AWS STS 用于临时 AWS 凭证（15 分钟 - 12 小时）
    - Vault 动态密钥用于数据库（几分钟到几小时）
    - 具有短过期时间的 OAuth 令牌（几分钟到几小时）
    - 具有 TTL 的服务账户令牌
    - 具有短有效期的证书式认证
    
    **最佳实践**
    - 为凭证设置最短实用 TTL
    - 实施自动凭证刷新
    - 监控凭证使用模式
    - 在应用程序关闭时撤销凭证
    - 使用凭证缓存以最小化请求


## 第 6 层：使用 GitProxy 的推送保护

对于需要审批工作流的组织,[GitProxy](https://git-proxy.finos.org/) 在 Git 之上提供自定义推送保护和策略。

### 什么是 GitProxy？

GitProxy 是一个高度可配置的框架,在维持开发者体验的同时强制执行推送保护：

!!!anote "🛡️ GitProxy 功能"
    **开发者优先设计**
    - 在到达远程仓库之前拦截推送
    - 在 CLI/终端中呈现补救说明
    - 最小化摩擦和采用障碍
    - 让开发者专注于提交代码
    
    **审批工作流**
    - 将推送保持在暂停状态
    - 需要明确审批才能推送到上游
    - 提供 Web UI、REST API 和 CLI 进行审批
    - 生成可共享的推送审查链接
    
    **可配置的策略**
    - 自定义推送保护规则
    - 组织特定的安全态势
    - 风险偏好对齐
    - 与现有工作流集成

### 快速配置

```bash
# 安装 GitProxy
npm install -g @finos/git-proxy

# 创建配置
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

# 运行 GitProxy
npx @finos/git-proxy --config ./proxy.config.json

# 配置仓库使用 GitProxy
git remote set-url origin http://localhost:8000/your-org/your-repo.git
```

### 审批工作流

当开发者推送代码时：

```bash
$ git push
remote:
remote: GitProxy has received your push ✅
remote:
remote: 🔗 Shareable Link
remote: http://localhost:8080/dashboard/push/000000__b12557
```

通过 CLI 审批：

```bash
# 登录
npx @finos/git-proxy-cli login --username admin --password admin

# 审批推送
npx @finos/git-proxy-cli authorise --id 000000__b12557

# 开发者重新推送
git push  # 现在成功
```

!!!tip "🎯 GitProxy 使用案例"
    **何时使用 GitProxy**
    - 需要审批工作流的受监管行业
    - 具有严格变更控制的组织
    - 需要在生产前审查推送的团队
    - 代码更改的合规要求
    - 预提交钩子之外的额外层次
    
    **优势**
    - 集中式推送控制
    - 所有推送的审计轨迹
    - 组织级别的策略强制执行
    - 开发者无法绕过
    - 补充预提交钩子


## 第 7 层：平台扫描和监控

利用平台提供的扫描进行持续监控。

### GitHub 密钥扫描

GitHub 自动扫描公开仓库：

!!!anote "🔍 GitHub 密钥扫描"
    **自动检测**
    - 扫描公开仓库中的所有提交
    - 检测 100 多种凭证模式
    - 通知仓库管理员
    - 警告凭证提供者（AWS、Azure 等）
    
    **GitHub Advanced Security**
    - 适用于私有仓库
    - 自定义模式支持
    - 推送保护（阻止提交）
    - 与安全公告集成
    
    **启用推送保护**
    - Settings → Code security and analysis → Push protection → Enable

### GitLab 密钥检测

```yaml
# .gitlab-ci.yml
include:
  - template: Security/Secret-Detection.gitlab-ci.yml

secret_detection:
  variables:
    SECRET_DETECTION_HISTORIC_SCAN: "true"
```

### 自定义监控

```python
# 监控新提交
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

持续监控捕获滑过其他层次的凭证。


## 实施策略

遵循 OWASP DevSecOps 原则逐步推出凭证保护：

!!!tip "📋 实施路线图"
    **阶段 1：基础（第 1 周）**
    - 添加全面的 `.gitignore` 模式
    - 创建 `.env.example` 模板
    - 记录环境变量要求
    - 审计现有代码中的硬编码凭证
    
    **阶段 2：预提交保护（第 2 周）**
    - 安装 git-secrets 或 detect-secrets
    - 配置密钥检测的预提交钩子
    - 添加代码检查钩子（Black、ESLint 等）
    - 培训团队预提交工作流
    - 建立代码审查指南
    
    **阶段 3：CI/CD 集成（第 3 周）**
    - 将密钥扫描添加到 CI/CD 流水线
    - 在构建流程中集成检查检查
    - 配置自动警报
    - 阻止包含检测到凭证或检查失败的合并
    - 设置监控仪表板
    
    **阶段 4：推送保护（第 4 周）**
    - 评估 GitProxy 的审批工作流
    - 配置推送策略和授权仓库
    - 设置审批流程（UI、CLI、API）
    - 培训团队审批工作流
    - 记录升级程序
    
    **阶段 5：密钥管理（第 5 周以上）**
    - 评估密钥管理解决方案
    - 迁移生产凭证
    - 实施自动轮换
    - 记录操作程序
    
    **阶段 6：持续改进**
    - 审查和更新检测模式
    - 分析误报率
    - 收集团队反馈
    - 根据团队需求优化检查规则
    - 进行定期安全培训

## 处理误报

所有扫描工具都会产生需要管理的误报：

```bash
# git-secrets：允许特定模式
git secrets --add --allowed 'example_password'
git secrets --add --allowed 'test_api_key'

# detect-secrets：审计并标记误报
detect-secrets audit .secrets.baseline
# 交互式：将每个发现标记为真实或误报

# gitleaks：使用 .gitleaksignore
echo "path/to/test/file.py" >> .gitleaksignore
```

```yaml
# detect-secrets 的自定义配置
# .secrets.baseline
{
  "exclude": {
    "files": "test/.*|.*\\.example$",
    "lines": "password.*=.*example"
  }
}
```

!!!warning "⚠️ 误报管理"
    **最佳实践**
    - 仔细审查每个误报
    - 记录为什么允许模式
    - 使用特定的允许列表,而非广泛模式
    - 定期审计允许的模式
    - 移除过时的允许列表项目


## 结论

防止凭证进入 Git 需要与 OWASP DevSecOps 原则一致的分层防御策略。没有单一工具能捕获每个错误,但多个重叠的防御创建了强大的保护系统。预提交阶段特别关键——它是你的第一道也是最有效的防线,在问题到达中央仓库之前就予以捕获。

从 `.gitignore` 配置和环境变量开始建立正确的模式。添加预提交钩子以自动进行密钥和代码质量的本地扫描。实施 CI/CD 流水线检查以捕获绕过的钩子。对于需要审批工作流的组织,GitProxy 提供了无法绕过的额外推送保护层。为生产凭证部署密钥管理系统,优先考虑自动过期的短期凭证以最小化暴露窗口。启用平台扫描以进行持续监控。

在预防上的投资立即带来回报。每个被防止的凭证泄露都避免了 [Git 历史重写、凭证轮换和事件响应](/zh-CN/2022/02/Managing-Credentials-Committed-to-Git/)的复杂性。维护扫描工具的运营负担与凭证泄露的成本相比微不足道。

从基础开始——正确的 `.gitignore` 和环境变量——然后逐步添加层次。预提交钩子应该是你的下一个优先事项,结合密钥检测与代码检查以进行全面的质量强制执行。即使是基本的预提交钩子也能捕获大多数意外提交。对于受监管的环境,考虑使用 GitProxy 来强制执行审批工作流。具有短期凭证的高级密钥管理代表黄金标准,但可以等到你的团队掌握基础知识后再实施。

记住：每个提交到 Git 的凭证都应被视为已泄露。预防不仅仅是关于工具——它是关于建立一种文化,让凭证保护和代码质量成为自动的,而非事后想法。短期凭证体现了深度防御——即使泄露,它们也会快速过期,限制损害。预提交阶段在开发者最需要的时候为他们提供即时反馈和教育。
