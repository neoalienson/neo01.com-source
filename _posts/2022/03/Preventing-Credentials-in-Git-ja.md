---
title: "Gitでの認証情報の防止：多層防御戦略"
date: 2022-03-21
categories: Development
tags: [Security, Git, Credentials, DevOps]
lang: ja
excerpt: "予防は修復に勝る。OWASP DevSecOps原則に従い、プレコミットフック、シークレットスキャン、コードリンティング、自動検出で多層防御を構築。"
thumbnail: /assets/git/thumbnail.png
---

[認証情報漏洩からの復旧方法](/ja/2022/02/Managing-Credentials-Committed-to-Git/)を探った後、明白な疑問が浮かびます：そもそも認証情報がGitに入るのをどう防ぐか？答えは単一のツールや技術ではなく、インシデントになる前に複数の段階でミスを捕捉する多層防御戦略です。

予防は修復よりもはるかに効果的です。Git履歴から認証情報を削除するには、コミットの書き換え、チームメンバーとの調整、そしてフォークやミラーが漏洩を永久に保持する可能性を受け入れる必要があります。対照的に、最初のコミットを防ぐには数秒しかかからず、すべての下流の複雑さを排除します。この記事では、包括的な認証情報保護戦略を形成する実用的なツールと技術を探ります。

## 防御層

効果的な認証情報保護には、複数の重複する防御が必要です：

!!!anote "🛡️ 多層防御"
    **レイヤー1：設定**
    - `.gitignore`が認証情報ファイルの追跡を防止
    - グローバルパターンが一般的なミスを捕捉
    - テンプレートファイルが適切な構造を案内
    
    **レイヤー2：コード実践**
    - 環境変数が設定とコードを分離
    - 設定ライブラリがパターンを強制
    - コードレビューがハードコードされたシークレットを捕捉
    
    **レイヤー3：自動スキャン**
    - プレコミットフックが認証情報を含むコミットをブロック
    - CI/CDパイプラインスキャンがバイパスされたフックを捕捉
    - リポジトリスキャンが履歴の漏洩を検出
    
    **レイヤー4：シークレット管理**
    - 集中型認証情報ストレージ
    - ランタイムシークレット注入
    - 自動ローテーション機能
    
    **レイヤー5：監視**
    - プラットフォーム提供のスキャン（GitHub、GitLab）
    - カスタムパターン検出
    - 迅速な対応のためのアラートシステム

各層は異なるタイプのミスを捕捉し、他の層が失敗したときに冗長性を提供します。


## レイヤー1：Gitignore設定

最初の防御線はGitが認証情報ファイルを追跡するのを防ぎます。

### 必須のGitignoreパターン

`.gitignore`を設定して一般的な認証情報の場所を除外します：

```gitignore
# 環境ファイル
.env
.env.local
.env.*.local
.env.development
.env.production

# 設定ファイル
config/secrets.yml
config/database.yml
config/credentials.yml
secrets.json
secrets.yaml

# キーファイル
*.key
*.pem
*.p12
*.pfx
*.cer
*.crt
id_rsa
id_dsa

# クラウドプロバイダー認証情報
.aws/credentials
.azure/credentials
gcloud-service-key.json

# 認証情報を含む可能性のあるIDEファイル
.vscode/settings.json
.idea/workspace.xml
.idea/dataSources.xml
```

!!!tip "📝 Gitignoreベストプラクティス"
    **リポジトリレベルパターン**
    - 最初のコミット前にパターンを追加
    - プロジェクト固有の認証情報ファイルを含める
    - ファイルが無視される理由を文書化
    - `.gitignore`をリポジトリにコミット
    
    **グローバルGitignore**
    - 個人パターンをグローバルに設定
    - IDE固有のファイルをカバー
    - すべてのリポジトリに適用
    
    ```bash
    # グローバルgitignoreを設定
    git config --global core.excludesfile ~/.gitignore_global
    
    # 一般的なパターンを追加
    cat >> ~/.gitignore_global << EOF
    .env
    *.key
    *.pem
    .DS_Store
    EOF
    ```

### ガイダンス用のテンプレートファイル

実際の認証情報なしで必要な構造を示す`.env.example`ファイルを提供します：

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

# README.md 説明
# .env.exampleを.envにコピーして実際の値を入力
```

テンプレートファイルは、実際のシークレットを公開することなく、開発者を適切な認証情報管理に導きます。


## レイヤー2：環境変数と設定

環境変数と設定管理を通じて認証情報とコードを分離します。

### 環境変数パターン

認証情報は環境変数に保存し、決してコードには含めません：

```python
# config.py - 悪い例：ハードコードされた認証情報
DATABASE_URL = "postgresql://user:pass123@localhost/db"
API_KEY = "sk_live_abc123xyz789"

# config.py - 良い例：環境変数
import os

DATABASE_URL = os.environ["DATABASE_URL"]
API_KEY = os.environ["API_KEY"]

# config.py - より良い例：検証とデフォルト値付き
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
// config.js - 悪い例：ハードコードされた認証情報
const config = {
  apiKey: "sk_live_abc123xyz789",
  dbPassword: "password123"
};

// config.js - 良い例：環境変数
const config = {
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD
};

// config.js - より良い例：検証付き
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

!!!success "✅ 環境変数の利点"
    **メリット**
    - 認証情報がソースコードに含まれない
    - 環境ごとに異なる値
    - コード変更なしで簡単にローテーション
    - 言語とプラットフォーム間の標準
    - デプロイメントシステムでサポート
    
    **実装ガイドライン**
    - 起動時に必要な変数を検証
    - 認証情報が欠落している場合は即座に失敗
    - すべての必要な変数を文書化
    - 非シークレットには適切なデフォルト値を提供
    - 一貫した命名規則を使用

### 設定ライブラリ

環境変数パターンを強制する設定ライブラリを使用します：

```python
# python-decoupleを使用
from decouple import config

DATABASE_URL = config("DATABASE_URL")
API_KEY = config("API_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
```

```javascript
// dotenvを使用
require('dotenv').config();

const config = {
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD
};
```

設定ライブラリは一貫したパターンを提供し、ボイラープレートを削減します。


## レイヤー3：プレコミットフック

自動スキャンは認証情報がGit履歴に入る前に捕捉します。[OWASP DevSecOpsガイドライン](https://owasp.org/www-project-devsecops-guideline/latest/01-Pre-commit)によると、プレコミットフェーズは重要です。なぜなら、セキュリティ問題が中央リポジトリに到達する前に防止するからです。このフェーズは2つの重要な領域に焦点を当てています：シークレット管理とコードリンティングで、早期検出を通じてより高品質なコードを保証します。

### プレコミットが重要な理由

プレコミットフェーズは最初の防御線として機能します：

!!!anote "🎯 プレコミットの利点"
    **早期検出**
    - 問題がリポジトリに入る前に捕捉
    - シークレットが中央Gitサーバーに到達するのを防止
    - 開発者のワークステーションで即座にコミットをブロック
    - 修復コストを大幅に削減
    
    **品質強制**
    - リンターを通じてコーディング標準を強制
    - コードフォーマットの一貫性を検証
    - セキュリティ脆弱性をチェック
    - チームガイドラインへの準拠を保証
    
    **開発者フィードバック**
    - 即座のフィードバックループ
    - 開発者にセキュリティ実践を教育
    - 恥ずかしい公開漏洩を防止
    - セキュリティ意識を構築

### 基本的なプレコミットフック

一般的な認証情報パターンを検出する簡単なフックを作成します：

```bash
#!/bin/bash
# .git/hooks/pre-commit

# ステージされた変更を取得
STAGED_DIFF=$(git diff --cached)

# 一般的な認証情報パターンをチェック
if echo "$STAGED_DIFF" | grep -qE "(password|api_key|secret|token)\s*=\s*['\"][^'\"]+['\"]"; then
  echo "❌ エラー：コミットに潜在的な認証情報を検出"
  echo "認証情報を削除して環境変数を使用してください"
  exit 1
fi

# AWSアクセスキーをチェック
if echo "$STAGED_DIFF" | grep -qE "AKIA[0-9A-Z]{16}"; then
  echo "❌ エラー：AWSアクセスキーを検出"
  exit 1
fi

# 秘密鍵をチェック
if echo "$STAGED_DIFF" | grep -qE "BEGIN.*PRIVATE KEY"; then
  echo "❌ エラー：秘密鍵を検出"
  exit 1
fi

# 高エントロピー文字列をチェック（潜在的なシークレット）
if echo "$STAGED_DIFF" | grep -qE "['\"][a-zA-Z0-9]{32,}['\"]"; then
  echo "⚠️  警告：高エントロピー文字列を検出（シークレットの可能性）"
  echo "コミット前に慎重に確認してください"
fi

exit 0
```

### git-secretsの使用

AWSのgit-secretsは包括的な認証情報検出を提供します：

```bash
# git-secretsをインストール
brew install git-secrets  # macOS
# または
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# リポジトリにフックをインストール
cd /path/to/your/repo
git secrets --install

# AWSパターンを登録
git secrets --register-aws

# カスタムパターンを追加
git secrets --add 'password\s*=\s*["\'][^"\']+["\']'
git secrets --add 'api[_-]?key\s*=\s*["\'][^"\']+["\']'
git secrets --add '["\'][a-zA-Z0-9]{32,}["\']'

# リポジトリ履歴をスキャン
git secrets --scan-history
```

!!!tip "🔧 git-secrets設定"
    **グローバルインストール**
    ```bash
    # すべてのリポジトリにフックをインストール
    git secrets --install ~/.git-templates/git-secrets
    git config --global init.templateDir ~/.git-templates/git-secrets
    ```
    
    **カスタムパターン**
    ```bash
    # 組織固有のパターンを追加
    git secrets --add 'MYCOMPANY_[A-Z_]+\s*=\s*["\'][^"\']+["\']'
    git secrets --add 'internal[_-]token\s*:\s*["\'][^"\']+["\']'
    ```
    
    **許可されたパターン**
    ```bash
    # 誤検出をホワイトリストに追加
    git secrets --add --allowed 'example_password'
    git secrets --add --allowed 'test_api_key'
    ```

### detect-secretsの使用

Yelpのdetect-secretsは高度なエントロピーベースの検出を提供します：

```bash
# detect-secretsをインストール
pip install detect-secrets

# ベースラインを作成
detect-secrets scan > .secrets.baseline

# ベースラインをコミット
git add .secrets.baseline
git commit -m "Add secrets baseline"

# プレコミットフックをインストール
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

!!!success "✅ detect-secrets機能"
    **高度な検出**
    - エントロピーベースのシークレット検出
    - カスタム検出器のプラグインシステム
    - 誤検出管理のためのベースライン
    - 複数のシークレットタイプをサポート
    
    **誤検出の管理**
    ```bash
    # ベースラインを監査
    detect-secrets audit .secrets.baseline
    
    # ベースラインを更新
    detect-secrets scan --baseline .secrets.baseline
    ```

### pre-commitフレームワークの使用

pre-commitフレームワークは複数のフックを管理します：

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
# pre-commitをインストール
pip install pre-commit

# フックをインストール
pre-commit install

# 手動で実行
pre-commit run --all-files
```

pre-commitフレームワークはプロジェクト間で一貫したフック管理を提供します。

### コードリンティング統合

シークレット検出に加えて、プレコミットフックはコード品質を強制すべきです：

```yaml
# .pre-commit-config.yaml - 包括的なセットアップ
repos:
  # セキュリティ：シークレット検出
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
  
  # コード品質：リンティング
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

!!!tip "🔧 リンティングベストプラクティス"
    **Pythonプロジェクト**
    - **Black**：コードフォーマット
    - **Flake8**：スタイルガイド強制
    - **Pylint**：コード分析
    - **mypy**：型チェック
    
    **JavaScript/TypeScriptプロジェクト**
    - **ESLint**：コード品質とスタイル
    - **Prettier**：コードフォーマット
    - **TSLint**：TypeScript固有のルール
    
    **リンティングの利点**
    - チーム間で一貫したコードスタイル
    - 一般的なバグを早期に捕捉
    - セキュリティベストプラクティスを強制
    - コードレビューの摩擦を削減
    - コードの保守性を向上

シークレット検出とコードリンティングを組み合わせることで、セキュリティと品質の両方の懸念に対処する包括的なプレコミット防御を作成します。


## レイヤー4：CI/CDパイプラインスキャン

CI/CDスキャンを通じてプレコミットフックをバイパスした認証情報を捕捉します。

### GitHub Actions統合

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

### GitLab CI統合

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

### カスタムスキャンスクリプト

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
        print("❌ コミットで認証情報を検出！")
        for finding in findings:
            print(f"  - {finding['type']}: {finding['count']} 件の一致")
        sys.exit(1)
    
    print("✅ 認証情報は検出されませんでした")
```

CI/CDスキャンは開発者がローカルフックをバイパスしたときにセーフティネットを提供します。


## レイヤー5：シークレット管理システム

本番環境では環境変数を集中型シークレット管理に置き換えます。

### AWS Secrets Manager

```python
# ランタイムでシークレットを取得
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# アプリケーションで使用
secrets = get_secret('production/app/credentials')
DATABASE_URL = secrets['database_url']
API_KEY = secrets['api_key']
```

### HashiCorp Vault

```python
# hvacライブラリを使用
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

!!!anote "🔐 シークレット管理の利点"
    **メリット**
    - 集中型認証情報ストレージ
    - 自動ローテーション機能
    - アクセス制御と監査
    - 保存時と転送時の暗号化
    - クラウドプラットフォームとの統合
    - 短期認証情報が露出ウィンドウを削減
    
    **使用すべき場合**
    - 本番環境
    - マルチサービスアーキテクチャ
    - コンプライアンス要件
    - 自動認証情報ローテーションが必要
    - チーム全体での認証情報共有

### 短期認証情報

シークレット管理システムは自動的に期限切れになる短期認証情報を有効にします：

```python
# AWS STS一時認証情報
import boto3

sts = boto3.client('sts')
response = sts.assume_role(
    RoleArn='arn:aws:iam::123456789012:role/AppRole',
    RoleSessionName='app-session',
    DurationSeconds=3600  # 1時間
)

credentials = response['Credentials']
# 一時認証情報を使用
```

```python
# Vault動的シークレット
import hvac

client = hvac.Client(url='https://vault.example.com')
client.auth.approle.login(
    role_id=os.environ['VAULT_ROLE_ID'],
    secret_id=os.environ['VAULT_SECRET_ID']
)

# 短期データベース認証情報を生成
db_creds = client.secrets.database.generate_credentials(
    name='my-role',
    ttl='1h'
)

username = db_creds['data']['username']
password = db_creds['data']['password']
# 認証情報は1時間後に自動的に期限切れ
```

!!!success "✅ 短期認証情報の利点"
    **セキュリティ上の利点**
    - 認証情報が自動的に期限切れ
    - 認証情報侵害のウィンドウを削減
    - 手動ローテーション不要
    - 漏洩した認証情報が迅速に無効化
    - 認証情報露出の影響範囲を制限
    
    **実装パターン**
    - AWS STSで一時AWS認証情報（15分〜12時間）
    - Vaultダイナミックシークレットでデータベース（数分〜数時間）
    - 短い有効期限のOAuthトークン（数分〜数時間）
    - TTL付きサービスアカウントトークン
    - 短い有効期間の証明書ベース認証
    
    **ベストプラクティス**
    - 認証情報に最短の実用的なTTLを設定
    - 自動認証情報更新を実装
    - 認証情報使用パターンを監視
    - アプリケーションシャットダウン時に認証情報を取り消し
    - リクエストを最小化するために認証情報キャッシュを使用


## レイヤー6：GitProxyによるプッシュ保護

承認ワークフローが必要な組織向けに、[GitProxy](https://git-proxy.finos.org/)はGit上にカスタムプッシュ保護とポリシーを提供します。

### GitProxyとは？

GitProxyは開発者体験を維持しながらプッシュ保護を強制する高度に設定可能なフレームワークです：

!!!anote "🛡️ GitProxy機能"
    **開発者ファーストの設計**
    - リモートリポジトリに到達する前にプッシュを傍受
    - CLI/ターミナルで修復手順を提示
    - 摩擦と採用障壁を最小化
    - 開発者がコードのコミットに集中できるようにする
    
    **承認ワークフロー**
    - プッシュを一時停止状態に保持
    - アップストリームへのプッシュ前に明示的な承認が必要
    - Web UI、REST API、CLIで承認を提供
    - プッシュレビュー用の共有可能なリンクを生成
    
    **設定可能なポリシー**
    - カスタムプッシュ保護ルール
    - 組織固有のセキュリティ態勢
    - リスク選好度の調整
    - 既存のワークフローとの統合

### クイックセットアップ

```bash
# GitProxyをインストール
npm install -g @finos/git-proxy

# 設定を作成
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

# GitProxyを実行
npx @finos/git-proxy --config ./proxy.config.json

# リポジトリをGitProxyを使用するように設定
git remote set-url origin http://localhost:8000/your-org/your-repo.git
```

### 承認ワークフロー

開発者がコードをプッシュすると：

```bash
$ git push
remote:
remote: GitProxy has received your push ✅
remote:
remote: 🔗 Shareable Link
remote: http://localhost:8080/dashboard/push/000000__b12557
```

CLIで承認：

```bash
# ログイン
npx @finos/git-proxy-cli login --username admin --password admin

# プッシュを承認
npx @finos/git-proxy-cli authorise --id 000000__b12557

# 開発者が再プッシュ
git push  # 今度は成功
```

!!!tip "🎯 GitProxyユースケース"
    **GitProxyを使用すべき場合**
    - 承認ワークフローが必要な規制業界
    - 厳格な変更管理を持つ組織
    - 本番前にプッシュレビューが必要なチーム
    - コード変更のコンプライアンス要件
    - プレコミットフックを超える追加レイヤー
    
    **利点**
    - 集中型プッシュ制御
    - すべてのプッシュの監査証跡
    - 組織レベルでのポリシー強制
    - 開発者がバイパスできない
    - プレコミットフックを補完


## レイヤー7：プラットフォームスキャンと監視

継続的な監視のためにプラットフォーム提供のスキャンを活用します。

### GitHubシークレットスキャン

GitHubは公開リポジトリを自動的にスキャンします：

!!!anote "🔍 GitHubシークレットスキャン"
    **自動検出**
    - 公開リポジトリのすべてのコミットをスキャン
    - 100以上の認証情報パターンを検出
    - リポジトリ管理者に通知
    - 認証情報プロバイダーに警告（AWS、Azureなど）
    
    **GitHub Advanced Security**
    - プライベートリポジトリで利用可能
    - カスタムパターンサポート
    - プッシュ保護（コミットをブロック）
    - セキュリティアドバイザリとの統合
    
    **プッシュ保護を有効化**
    ```
    Settings → Code security and analysis
    → Push protection → Enable
    ```

### GitLabシークレット検出

```yaml
# .gitlab-ci.yml
include:
  - template: Security/Secret-Detection.gitlab-ci.yml

secret_detection:
  variables:
    SECRET_DETECTION_HISTORIC_SCAN: "true"
```

### カスタム監視

```python
# 新しいコミットを監視
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

継続的な監視は他のレイヤーをすり抜けた認証情報を捕捉します。


## 実装戦略

OWASP DevSecOps原則に従って段階的に認証情報保護を展開します：

!!!tip "📋 実装ロードマップ"
    **フェーズ1：基礎（第1週）**
    - 包括的な`.gitignore`パターンを追加
    - `.env.example`テンプレートを作成
    - 環境変数要件を文書化
    - 既存コードのハードコードされた認証情報を監査
    
    **フェーズ2：プレコミット保護（第2週）**
    - git-secretsまたはdetect-secretsをインストール
    - シークレット検出用のプレコミットフックを設定
    - コードリンティングフック（Black、ESLintなど）を追加
    - チームにプレコミットワークフローをトレーニング
    - コードレビューガイドラインを確立
    
    **フェーズ3：CI/CD統合（第3週）**
    - CI/CDパイプラインにシークレットスキャンを追加
    - ビルドプロセスにリンティングチェックを統合
    - 自動アラートを設定
    - 検出された認証情報またはリンティング失敗を含むマージをブロック
    - 監視ダッシュボードを設定
    
    **フェーズ4：プッシュ保護（第4週）**
    - 承認ワークフロー用のGitProxyを評価
    - プッシュポリシーと承認済みリポジトリを設定
    - 承認プロセス（UI、CLI、API）を設定
    - チームに承認ワークフローをトレーニング
    - エスカレーション手順を文書化
    
    **フェーズ5：シークレット管理（第5週以降）**
    - シークレット管理ソリューションを評価
    - 本番認証情報を移行
    - 自動ローテーションを実装
    - 運用手順を文書化
    
    **フェーズ6：継続的改善**
    - 検出パターンをレビューおよび更新
    - 誤検出率を分析
    - チームフィードバックを収集
    - チームのニーズに基づいてリンティングルールを改善
    - 定期的なセキュリティトレーニングを実施

## 誤検出の処理

すべてのスキャンツールは管理が必要な誤検出を生成します：

```bash
# git-secrets：特定のパターンを許可
git secrets --add --allowed 'example_password'
git secrets --add --allowed 'test_api_key'

# detect-secrets：監査して誤検出をマーク
detect-secrets audit .secrets.baseline
# インタラクティブ：各発見を真実または誤検出としてマーク

# gitleaks：.gitleaksignoreを使用
echo "path/to/test/file.py" >> .gitleaksignore
```

```yaml
# detect-secretsのカスタム設定
# .secrets.baseline
{
  "exclude": {
    "files": "test/.*|.*\\.example$",
    "lines": "password.*=.*example"
  }
}
```

!!!warning "⚠️ 誤検出管理"
    **ベストプラクティス**
    - 各誤検出を慎重にレビュー
    - パターンが許可される理由を文書化
    - 広範なパターンではなく特定の許可リストを使用
    - 許可されたパターンを定期的に監査
    - 古い許可リストエントリを削除


## 結論

Gitへの認証情報の侵入を防ぐには、OWASP DevSecOps原則と一致した多層防御戦略が必要です。単一のツールですべてのミスを捕捉することはできませんが、複数の重複する防御が堅牢な保護システムを作成します。プレコミットフェーズは特に重要です—これは最初で最も効果的な防御線であり、問題が中央リポジトリに到達する前に捕捉します。

`.gitignore`設定と環境変数から始めて適切なパターンを確立します。シークレットとコード品質の自動ローカルスキャンのためにプレコミットフックを追加します。バイパスされたフックを捕捉するためにCI/CDパイプラインチェックを実装します。承認ワークフローが必要な組織には、GitProxyがバイパスできない追加のプッシュ保護レイヤーを提供します。本番認証情報用にシークレット管理システムを展開し、露出ウィンドウを最小化するために自動的に期限切れになる短期認証情報を優先します。継続的な監視のためにプラットフォームスキャンを有効にします。

予防への投資は即座に配当をもたらします。防止された各認証情報漏洩は、[Git履歴の書き換え、認証情報のローテーション、インシデント対応](/ja/2022/02/Managing-Credentials-Committed-to-Git/)の複雑さを回避します。スキャンツールの維持の運用負担は、認証情報侵害のコストと比較して微々たるものです。

基本から始めます—適切な`.gitignore`と環境変数—その後、段階的にレイヤーを追加します。プレコミットフックは次の優先事項であるべきで、包括的な品質強制のためにシークレット検出とコードリンティングを組み合わせます。基本的なプレコミットフックでさえ、ほとんどの偶発的なコミットを捕捉します。規制された環境では、承認ワークフローを強制するためにGitProxyの使用を検討してください。短期認証情報を持つ高度なシークレット管理はゴールドスタンダードを表しますが、チームが基礎をマスターするまで待つことができます。

覚えておいてください：Gitにコミットされたすべての認証情報は侵害されたものとして扱うべきです。予防はツールだけの問題ではありません—認証情報保護とコード品質が自動的で後付けではない文化を構築することです。短期認証情報は多層防御を体現しています—漏洩しても迅速に期限切れになり、損害を制限します。プレコミットフェーズは、開発者が最も必要とする瞬間に即座のフィードバックと教育を提供します。
