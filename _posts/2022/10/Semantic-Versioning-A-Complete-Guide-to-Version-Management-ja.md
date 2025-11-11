---
title: "セマンティックバージョニング - バージョン管理完全ガイド"
date: 2022-10-22
lang: ja
categories: Development
tags:
  - Version Control
  - Software Development
  - Release Management
  - Git
  - Best Practices
excerpt: "セマンティックバージョニングをマスターして、変更を明確に伝え、依存関係を確実に管理しましょう。MAJOR.MINOR.PATCH形式、プレリリース識別子、開発ワークフローでのSemVer実装方法を学びます。"
thumbnail: /assets/coding/2.png
---

本番環境でアプリケーションがクラッシュしました。原因は？破壊的変更を導入した依存関係の「マイナー」アップデートでした。ライブラリメンテナーはそれをバージョン2.3.0としてタグ付けし、単純な機能追加を示唆していました。しかし、リリースノートを詳しく見ると、あなたのコードが依存している重要なAPIメソッドが削除されていることがわかりました。

このシナリオは世界中のソフトウェアチームで毎日発生しています。変更の性質を伝えないバージョン番号は、ビルドの失敗、本番障害、開発者のフラストレーションを引き起こします。バージョン1.4.7が1.4.6で動作していたすべてを破壊すると、依存関係エコシステムへの信頼が損なわれます。

解決策は更新を避けることではありません。変更の影響を明確に伝えるバージョニングシステムを採用することです。セマンティックバージョニング（SemVer）は、各リリースから何を期待できるかを正確に伝える標準化されたバージョン番号アプローチを提供します。

これは単なる番号付けスキームではありません。ソフトウェアメンテナーとユーザー間の契約を作成し、自動化された依存関係管理を可能にし、更新が既存の機能を破壊するのではなく強化する信頼できるソフトウェアエコシステムを構築することです。

## セマンティックバージョニングの理解

**セマンティックバージョニング（SemVer）**は、3つの部分からなる数字形式を使用するバージョニングスキームです：`MAJOR.MINOR.PATCH`。各コンポーネントは、そのリリースでの変更の性質について特定の意味を持ちます。

### SemVer形式：MAJOR.MINOR.PATCH

**メジャーバージョン**（X.0.0）：互換性のないAPI変更時にインクリメント
- コード修正が必要な破壊的変更
- 削除または大幅に変更された公開API
- 後方互換性を破る変更

**マイナーバージョン**（0.X.0）：後方互換性のある機能追加時にインクリメント
- 既存コードを破壊しない新機能
- 新しい公開APIまたはメソッド
- 互換性を維持する拡張機能

**パッチバージョン**（0.0.X）：後方互換性のあるバグ修正時にインクリメント
- 機能を変更しないバグ修正
- セキュリティパッチ
- APIを変更しないパフォーマンス改善

### バージョン進化の例

ライブラリが異なるタイプの変更を通じてどのように進化するかを追跡してみましょう：

{% mermaid %}
gitGraph
    commit id: "1.0.0 初期リリース"
    commit id: "1.0.1 バグ修正" tag: "PATCH"
    commit id: "1.0.2 セキュリティ修正" tag: "PATCH"
    commit id: "1.1.0 新機能" tag: "MINOR"
    commit id: "1.1.1 バグ修正" tag: "PATCH"
    commit id: "1.2.0 新API" tag: "MINOR"
    commit id: "2.0.0 破壊的変更" tag: "MAJOR"
{% endmermaid %}

**バージョン1.0.0 → 1.0.1**：ユーザー検証でのnullポインタ例外を修正
**バージョン1.0.1 → 1.0.2**：SQLインジェクション脆弱性をパッチ
**バージョン1.0.2 → 1.1.0**：ユーザープロフィール画像サポートを追加
**バージョン1.1.0 → 1.1.1**：プロフィール画像アップロードバグを修正
**バージョン1.1.1 → 1.2.0**：ユーザーロール管理APIを追加
**バージョン1.2.0 → 2.0.0**：非推奨の認証メソッドを削除

{% mermaid %}
flowchart TD
    A["🔄 コード変更"] --> B{"💥 破壊的変更？"}
    B -->|はい| C["📈 メジャーバージョン"]
    B -->|いいえ| D{"✨ 新機能？"}
    D -->|はい| E["📊 マイナーバージョン"]
    D -->|いいえ| F{"🐛 バグ修正？"}
    F -->|はい| G["🔧 パッチバージョン"]
    F -->|いいえ| H["❓ バージョン変更なし"]
    
    style C fill:#ff6b6b
    style E fill:#4ecdc4
    style G fill:#45b7d1
    style H fill:#96ceb4
{% endmermaid %}

## プレリリースとビルドメタデータ

SemVerは、プレリリースバージョンとビルドメタデータの追加識別子をサポートします。

### プレリリース識別子

形式：`MAJOR.MINOR.PATCH-prerelease`

一般的なプレリリース識別子：
- **alpha**：初期開発、不安定
- **beta**：機能完成、テスト段階
- **rc**（リリース候補）：リリース前の最終テスト

```
1.0.0-alpha.1    # 最初のalphaリリース
1.0.0-alpha.2    # 2番目のalphaリリース
1.0.0-beta.1     # 最初のbetaリリース
1.0.0-rc.1       # 最初のリリース候補
1.0.0            # 最終リリース
```

### ビルドメタデータ

形式：`MAJOR.MINOR.PATCH+build`

ビルドメタデータは追加情報を提供しますが、バージョン優先順位には影響しません：

```
1.0.0+20221022.1234     # ビルドタイムスタンプ
1.0.0+git.abc123        # Gitコミットハッシュ
1.0.0-beta.1+exp.sha.5114f85  # プレリリースとビルドの組み合わせ
```

### バージョン優先順位ルール

SemVerはバージョン比較の厳密な優先順位ルールを定義します：

1. **メジャー、マイナー、パッチ**は数値的に比較
2. **プレリリースバージョン**は通常バージョンより低い優先順位
3. **プレリリース識別子**は辞書順と数値順で比較
4. **ビルドメタデータ**は優先順位で無視される

```
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta
< 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
```

## 開発ワークフローでのSemVer

### SemVerを使った機能開発

セマンティックバージョニングがGitブランチ戦略とどのように統合されるかを示します：

{% mermaid %}
gitGraph
    commit id: "2.1.0"
    branch feature/user-search
    checkout feature/user-search
    commit id: "検索API追加"
    commit id: "フィルター追加"
    checkout main
    merge feature/user-search
    commit id: "2.2.0" tag: "MINOR"
    
    branch hotfix/security-patch
    checkout hotfix/security-patch
    commit id: "XSS脆弱性修正"
    checkout main
    merge hotfix/security-patch
    commit id: "2.2.1" tag: "PATCH"
    
    branch feature/breaking-auth
    checkout feature/breaking-auth
    commit id: "旧認証削除"
    commit id: "OAuth2追加"
    checkout main
    merge feature/breaking-auth
    commit id: "3.0.0" tag: "MAJOR"
{% endmermaid %}

### リリースブランチ戦略

複雑なプロジェクトでは、リリースブランチを使用してバージョンを安定化します：

{% mermaid %}
gitGraph
    commit id: "2.0.0"
    commit id: "機能A"
    commit id: "機能B"
    
    branch release/2.1
    checkout release/2.1
    commit id: "2.1.0-rc.1"
    commit id: "バグ修正"
    commit id: "2.1.0-rc.2"
    commit id: "2.1.0" tag: "リリース"
    
    checkout main
    merge release/2.1
    commit id: "機能C"
    commit id: "機能D"
    
    branch release/2.2
    checkout release/2.2
    commit id: "2.2.0-rc.1"
    commit id: "2.2.0" tag: "リリース"
{% endmermaid %}

## プロジェクトでのSemVer実装

### 自動化されたバージョン管理

コミットメッセージに基づいてバージョンバンプを自動化するツールを使用：

```bash
# Conventional CommitsとSemantic-releaseを使用
git commit -m "feat: add user search functionality"     # マイナーバージョンバンプ
git commit -m "fix: resolve null pointer exception"     # パッチバージョンバンプ
git commit -m "feat!: remove deprecated auth methods"   # メジャーバージョンバンプ

# 自動リリース
npx semantic-release
```

### Package.json SemVer設定

SemVerを使用して依存関係範囲を設定：

```json
{
  "dependencies": {
    "express": "^4.18.0",      // 4.x.x互換、< 5.0.0
    "lodash": "~4.17.21",      // 4.17.x互換
    "react": "18.2.0"          // 正確なバージョン
  }
}
```

**範囲演算子**：
- `^1.2.3`：1.x.x互換（>= 1.2.3、< 2.0.0）
- `~1.2.3`：1.2.x互換（>= 1.2.3、< 1.3.0）
- `1.2.3`：正確なバージョンマッチ

### バージョン検証スクリプト

```bash
#!/bin/bash
# validate-version.sh - 適切なSemVer形式を確保

VERSION=$1

if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$ ]]; then
    echo "エラー：無効なSemVer形式：$VERSION"
    echo "期待される形式：MAJOR.MINOR.PATCH[-prerelease][+build]"
    exit 1
fi

echo "有効なSemVer：$VERSION"
```

## 一般的なSemVerの誤解

!!!warning "🚫 バージョン0.x.xはSemVerルールに従わない"
    **誤解**：「バージョン0.x.xリリースは通常のSemVerルールに従うべきです。」
    
    **現実**：SemVerでは、初期開発中（0.x.x）は何でもいつでも変更される可能性があります。パブリックAPIは安定していると見なすべきではありません。バージョン1.0.0が最初の安定したパブリックAPIを定義します。

!!!warning "🚫 マーケティングバージョン vs 技術バージョン"
    **誤解**：「マーケティング上の理由でバージョン番号をスキップできます。」
    
    **現実**：SemVerは技術的コミュニケーションに関するものであり、マーケティングではありません。マーケティング上の理由で1.9.0から2.1.0にスキップすることは、セマンティック契約を破り、依存関係管理ツールを混乱させます。

!!!warning "🚫 パッチバージョンに新機能を含められる"
    **誤解**：「小さな新機能はパッチリリースに入れることができます。」
    
    **現実**：サイズに関係なく、新機能にはマイナーバージョンバンプが必要です。パッチバージョンは厳密にバグ修正とセキュリティパッチ用です。

!!!tip "💡 SemVerベストプラクティス"
    - **破壊的変更を明確に文書化**リリースノートで
    - **Conventional Commitsを使用**してバージョンバンプを自動化
    - **リリース前に後方互換性をテスト**
    - **機能削除前に非推奨警告を検討**
    - **変更ログを維持**Keep a Changelogフォーマットに従って

## ソフトウェア開発におけるバージョニングの種類

セマンティックバージョニングは、ソフトウェア開発のさまざまな側面で異なって適用されます。これらの区別を理解することで、異なるコンテキストに適切なバージョニング戦略を実装できます。

### 製品バージョニング

**製品バージョニング**は、エンドユーザーやステークホルダーにユーザー向けの変更とビジネス価値を伝えます。

**特徴**：
- **マーケティング連携**：ビジネスマイルストーンや機能リリースと連携することが多い
- **ユーザーコミュニケーション**：ユーザーが体験することに焦点を当てる
- **リリースサイクル**：技術的変更よりもビジネスサイクルに従う可能性
- **ブランディング考慮**：バージョン番号がマーケティング上の意味を持つ可能性

**例**：
```
MyApp 2023.1    # 年ベースのバージョニング
MyApp 5.0       # 主要機能リリース
MyApp 5.1       # 機能アップデート
MyApp 5.1.2     # バグ修正リリース
```

### APIバージョニング

**APIバージョニング**は、プログラミングインターフェースの後方互換性と進化を管理します。

**戦略**：
- **URLバージョニング**：`/api/v1/users`、`/api/v2/users`
- **ヘッダーバージョニング**：`Accept: application/vnd.api+json;version=2`
- **パラメーターバージョニング**：`/api/users?version=1`

```javascript
// SemVer原則でのAPI進化
// v1.0.0 - 初期API
GET /api/v1/users

// v1.1.0 - フィルタリング追加（後方互換）
GET /api/v1/users?role=admin

// v2.0.0 - レスポンスフォーマット変更（破壊的変更）
GET /api/v2/users  // 異なるJSON構造を返す
```

### アーティファクトバージョニング

**アーティファクトバージョニング**は、リポジトリ内のコンパイル済みバイナリ、ライブラリ、デプロイ可能パッケージを管理します。

**主要な概念**：
- **不変性**：一度公開されたアーティファクトは変更されるべきではない
- **トレーサビリティ**：各バージョンは特定のソースコードにマップされる
- **依存関係解決**：自動化された依存関係管理を可能にする
- **ビルド再現性**：同じバージョンは常に同じアーティファクトを生成する

**アーティファクトタイプ**：
```
# ライブラリアーティファクト
mylib-1.2.3.jar
mylib-1.2.3-sources.jar
mylib-1.2.3-javadoc.jar

# コンテナイメージ
myapp:1.2.3
myapp:1.2.3-alpine
myapp:latest

# パッケージアーティファクト
mypackage-1.2.3.tar.gz
mypackage_1.2.3_amd64.deb
```

## アーティファクトリポジトリ戦略

アーティファクトリポジトリは、異なる可変性ポリシーでバージョン化されたアーティファクトを保存および管理します。

### スナップショットリポジトリ

**スナップショットリポジトリ**は開発段階でアーティファクトの上書きを許可します。

**特徴**：
- **可変アーティファクト**：同じバージョンを再公開可能
- **開発フォーカス**：継続的な開発ビルドに使用
- **自動クリーンアップ**：古いスナップショットが自動的にパージされる可能性
- **統合テスト**：継続的統合ワークフローを可能にする

**命名規約**：
```
# Mavenスナップショットバージョニング
mylib-1.3.0-SNAPSHOT.jar
mylib-1.3.0-20221022.143052-1.jar  # タイムスタンプ付きスナップショット

# npmプレリリースバージョニング
mypackage@1.3.0-alpha.1
mypackage@1.3.0-beta.20221022
```

**ワークフロー例**：
{% mermaid %}
gitGraph
    commit id: "1.2.0 リリース"
    commit id: "1.3.0-SNAPSHOT開始"
    commit id: "機能作業"
    commit id: "SNAPSHOT-1公開"
    commit id: "バグ修正"
    commit id: "SNAPSHOT-2公開"
    commit id: "さらなる機能"
    commit id: "SNAPSHOT-3公開"
    commit id: "1.3.0 リリース" tag: "不変"
{% endmermaid %}

### 不変リポジトリ

**不変リポジトリ**は、リリースされたアーティファクトに対して一度書き込みポリシーを強制します。

**特徴**：
- **不変アーティファクト**：一度公開されたバージョンは変更できない
- **リリースフォーカス**：安定した本番環境対応リリースに使用
- **監査記録**：公開されたすべてのバージョンの完全な履歴
- **依存関係安定性**：時間が経っても一貫したビルドを保証

**利点**：
- **再現可能ビルド**：同じバージョンは常に同一の結果を生成
- **セキュリティ**：リリースされたアーティファクトの改ざんを防止
- **コンプライアンス**：ソフトウェアトレーサビリティの規制要件を満たす
- **信頼**：ユーザーはバージョンの一貫性に依存できる

!!!anote "📋 リリースリポジトリが不変でなければならない理由"
    バージョンがリリースされてユーザーに使用された後で、それを変更することはセマンティックバージョニングの基本的な契約を破ります。バージョン1.2.3が今日と昨日で異なる動作をする場合、依存関係管理は信頼できなくなり、ビルドは再現不可能になり、ソフトウェアサプライチェーンへの信頼が損なわれます。企業SDLCでは、UATテストは本番環境にデプロイされるのと全く同じアーティファクトを検証する必要があります—テスト後の変更は品質保証プロセス全体を無効にします。不変性は、今日ダウンロードされた`mylib@1.2.3`が6ヶ月後にダウンロードされた`mylib@1.2.3`と同一であることを保証します。

**リポジトリ設定例**：
```xml
<!-- Mavenリポジトリ設定 -->
<repositories>
  <repository>
    <id>snapshots</id>
    <url>https://repo.company.com/snapshots</url>
    <snapshots>
      <enabled>true</enabled>
      <updatePolicy>always</updatePolicy>
    </snapshots>
    <releases>
      <enabled>false</enabled>
    </releases>
  </repository>
  
  <repository>
    <id>releases</id>
    <url>https://repo.company.com/releases</url>
    <snapshots>
      <enabled>false</enabled>
    </snapshots>
    <releases>
      <enabled>true</enabled>
      <updatePolicy>never</updatePolicy>
    </releases>
  </repository>
</repositories>
```

### リポジトリ戦略比較

| 項目 | スナップショットリポジトリ | 不変リポジトリ |
|------|-------------|----------|
| **可変性** | アーティファクトを上書き可能 | 一度書き込み、変更不可 |
| **用途** | 開発、CI/CD | 本番リリース |
| **バージョン形式** | `1.0.0-SNAPSHOT` | `1.0.0` |
| **クリーンアップポリシー** | 自動パージ | 永久保持 |
| **ビルド再現性** | 保証されない | 保証される |
| **セキュリティ** | 低い（可変） | 高い（不変） |
| **ストレージコスト** | 低い（クリーンアップ） | 高い（保持） |

### ハイブリッドリポジトリワークフロー

スナップショットと不変リポジトリを組み合わせて完全な開発ライフサイクルを実現：

```bash
# 開発段階 - スナップショットリポジトリ
mvn deploy  # スナップショットリポジトリに公開
# アーティファクト: mylib-1.3.0-SNAPSHOT.jar（可変）

# リリース段階 - 不変リポジトリ
mvn release:prepare release:perform
# アーティファクト: mylib-1.3.0.jar（不変）

# リリース後 - 新しいスナップショット
# アーティファクト: mylib-1.4.0-SNAPSHOT.jar（可変）
```

!!!warning "⚠️ スナップショット依存関係のリスク"
    **問題**：本番環境でスナップショットバージョンに依存すると予測不可能な動作を引き起こす可能性があります。
    
    **解決策**：スナップショット依存関係は開発中のみ使用し、リリース時は常に不変バージョン依存関係で行う。

!!!tip "💡 リポジトリベストプラクティス"
    - **スナップショットとリリースのリポジトリを分離**
    - **スナップショットからリリースリポジトリへの自動プロモーション**
    - **スナップショットクリーンアップの保持ポリシー**
    - **未許可の変更を防ぐアクセス制御**
    - **不変アーティファクトのバックアップ戦略**

## SemVerと依存関係管理

### 依存関係解決戦略

パッケージマネージャーが異なるリポジトリタイプでSemVer範囲をどのように解決するかを理解：

```bash
# SemVer範囲でのnpm install動作
npm install express@^4.18.0    # 不変リポジトリから最新4.x.xをインストール
npm install lodash@~4.17.21    # 不変リポジトリから最新4.17.xをインストール
npm install react@18.2.0       # 正確なバージョンをインストール

# スナップショットリポジトリからの開発依存関係
npm install mylib@1.3.0-SNAPSHOT  # 最新のスナップショットビルドを取得

# インストールされるバージョンを確認
npm outdated
```

### ロックファイルとSemVer

ロックファイル（package-lock.json、yarn.lock）はSemVer範囲を尊重しながら正確なバージョンを記録：

```json
// package.json
{
  "dependencies": {
    "express": "^4.18.0",           // 不変リポジトリ範囲
    "mylib": "1.2.0"               // 正確な不変バージョン
  },
  "devDependencies": {
    "test-utils": "1.0.0-SNAPSHOT"  // 開発用スナップショット
  }
}

// package-lock.json（生成された）
{
  "dependencies": {
    "express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-..."
    },
    "mylib": {
      "version": "1.2.0",
      "resolved": "https://repo.company.com/releases/mylib-1.2.0.tgz"
    }
  }
}
```

### セキュリティとSemVer

異なるリポジトリタイプでセキュリティアップデートと安定性のバランスを取る：

```bash
# 最新のパッチバージョンにアップデート（セキュリティ修正）
npm update

# セキュリティ脆弱性をチェック
npm audit

# セキュリティ問題を自動修正
npm audit fix

# メジャーバージョンアップデートを強制（破壊的変更をレビュー）
npm install express@latest

# スナップショットリポジトリのセキュリティ考慮事項
# スナップショットには未検証のセキュリティ修正が含まれる可能性
npm install mylib@1.3.0-SNAPSHOT --registry=https://snapshots.company.com
```

## 高度なSemVerシナリオ

### モノレポバージョニング戦略

**独立バージョニング**：各パッケージが独自のバージョンを維持
```
packages/
  auth/         # v2.1.0（不変）
  database/     # v1.3.2（不変）
  ui-components/ # v3.0.1（不変）
  
# 開発スナップショット
  auth/         # v2.2.0-SNAPSHOT
  database/     # v1.4.0-SNAPSHOT
  ui-components/ # v3.1.0-SNAPSHOT
```

**同期バージョニング**：すべてのパッケージが同じバージョンを共有
```
packages/
  auth/         # v2.1.0（不変）
  database/     # v2.1.0（不変）
  ui-components/ # v2.1.0（不変）
  
# すべてのパッケージが一緒に次のスナップショットに移行
  auth/         # v2.2.0-SNAPSHOT
  database/     # v2.2.0-SNAPSHOT
  ui-components/ # v2.2.0-SNAPSHOT
```

**ハイブリッド戦略**：コアパッケージは同期、ユーティリティは独立
```
# コアプラットフォーム（同期）
core/
  platform/     # v3.0.0
  api/          # v3.0.0
  
# ユーティリティ（独立）
utils/
  logger/       # v1.2.1
  validator/    # v2.0.3
```

### 企業アーティファクト管理

大規模組織には高度なアーティファクト管理戦略が必要：

```yaml
# アーティファクトプロモーションパイプライン
stages:
  development:
    repository: snapshots
    policy: mutable
    retention: 30 days
    
  staging:
    repository: staging-releases
    policy: immutable
    retention: 90 days
    
  production:
    repository: production-releases
    policy: immutable
    retention: permanent
    
# プロモーション基準
promotion_rules:
  to_staging:
    - security_scan: passed
    - unit_tests: passed
    - integration_tests: passed
    
  to_production:
    - staging_validation: passed
    - performance_tests: passed
    - security_approval: required
```

## 結論

セマンティックバージョニングは、バージョン番号を任意のラベルから意味のあるコミュニケーションツールに変換します。MAJOR.MINOR.PATCH形式とそのルールに従うことで、信頼できる依存関係管理、自動化ツール、自信を持ったソフトウェアアップデートを可能にする契約を作成します。

SemVerの成功した採用の鍵は一貫性と明確なコミュニケーションです。すべてのバージョンバンプは変更の性質を正確に反映し、破壊的変更は十分に文書化され、慣重に検討されるべきです。

覚えておいてください：SemVerは単なる番号付けではありません—ソフトウェアエコシステムにおける信頼の構築に関するものです。開発者がバージョン番号に依存してアップデートの影響を理解できるとき、コミュニティ全体がより安定して保守しやすいソフトウェアから恩恵を受けます。

次のプロジェクトでSemVerの実装を始めてください。将来のあなた自身—そしてあなたのユーザー—が、ソフトウェアの進化にもたらされる明確性と予測可能性に感謝するでしょう。