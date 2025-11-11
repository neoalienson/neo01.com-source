---
title: "私が開発した Hexo プラグイン"
date: 2024-05-02
lang: ja
category: Development
excerpt: "コメント、GitHub カード、その他の機能で静的ブログを強化するために開発した Hexo プラグインのコレクション。"
thumbnail: /assets/hexo/thumbnail.png
---

Hexo で静的サイトを構築することは、インタラクティブ性を犠牲にすることを意味しません。私は、コメント、GitHub 統合、その他の機能で Hexo ブログを強化するいくつかのプラグインを開発しました。

<div class="tools-grid">
  <a href="#hexo-plugin-commentbox" class="tool-card">
    <h3>💬 hexo-plugin-commentbox</h3>
    <p class="tool-description">commentbox.io コメントシステムを Hexo ブログ記事に統合します。サーバーサイドインフラストラクチャなしでコミュニティエンゲージメントを追加できます。</p>
    <ul class="tool-features">
      <li>すべてのページでデフォルトで有効</li>
      <li>front matter による細かい制御</li>
      <li>シンプルな統合</li>
    </ul>
  </a>

  <a href="#hexo-plugin-cookieconsent" class="tool-card">
    <h3>🍪 hexo-plugin-cookieconsent</h3>
    <p class="tool-description">Hexo サイトに GDPR 準拠の Cookie 同意バナーを追加します。vanilla-cookieconsent ライブラリとの軽量な統合。</p>
    <ul class="tool-features">
      <li>カスタマイズ可能な同意モーダル</li>
      <li>多言語サポート</li>
      <li>カテゴリベースの Cookie 管理</li>
    </ul>
  </a>

  <a href="#hexo-plugin-apache-echarts" class="tool-card">
    <h3>📊 hexo-plugin-apache-echarts</h3>
    <p class="tool-description">Hexo 記事にインタラクティブな Apache ECharts 可視化を追加します。シンプルなタグ構文でデータ駆動のチャートを作成できます。</p>
    <ul class="tool-features">
      <li>インタラクティブなクライアントサイドチャート</li>
      <li>CDN ベースのライブラリ読み込み</li>
      <li>すべての ECharts チャートタイプをサポート</li>
    </ul>
  </a>

  <a href="#hexo-plugin-i18n-canonical" class="tool-card">
    <h3>🌐 hexo-plugin-i18n-canonical</h3>
    <p class="tool-description">多言語サイトの正規 URL を管理します。canonical と hreflang タグを自動追加して SEO を改善します。</p>
    <ul class="tool-features">
      <li>自動 canonical タグ</li>
      <li>すべての言語の hreflang タグ</li>
      <li>多言語 SEO の改善</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-sitemap" class="tool-card">
    <h3>🗺️ hexo-generator-i18n-sitemap</h3>
    <p class="tool-description">多言語サイト用に sitemap.xml を生成し、適切な言語フィルタリングを行います。</p>
    <ul class="tool-features">
      <li>sitemap.xml と sitemap.txt を生成</li>
      <li>ホームページの重複を除外</li>
      <li>多言語サポート</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-archive" class="tool-card">
    <h3>📚 hexo-generator-i18n-archive</h3>
    <p class="tool-description">各言語のアーカイブページを生成し、適切なフィルタリングを行います。</p>
    <ul class="tool-features">
      <li>言語固有のアーカイブ</li>
      <li>年、月、日で整理</li>
      <li>ページネーションサポート</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-tag" class="tool-card">
    <h3>🏷️ hexo-generator-i18n-tag</h3>
    <p class="tool-description">各言語のタグページを生成し、フィルタリングとソートを行います。</p>
    <ul class="tool-features">
      <li>言語固有のタグページ</li>
      <li>リダイレクト記事は最後に表示</li>
      <li>ページネーションサポート</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-category" class="tool-card">
    <h3>📁 hexo-generator-i18n-category</h3>
    <p class="tool-description">各言語のカテゴリページを生成し、フィルタリングとソートを行います。</p>
    <ul class="tool-features">
      <li>言語固有のカテゴリページ</li>
      <li>リダイレクト記事は最後に表示</li>
      <li>ページネーションサポート</li>
    </ul>
  </a>

  <a href="#hexo-github-card-inline" class="tool-card">
    <h3>🎴 hexo-github-card-inline</h3>
    <p class="tool-description">記事内に GitHub ユーザーとリポジトリカードをインラインでレンダリングします。視覚的でデータ豊富な表現でプロフィールとプロジェクトを紹介できます。</p>
    <ul class="tool-features">
      <li>統計データ付きユーザープロフィールカード</li>
      <li>メトリクス付きリポジトリカード</li>
      <li>プログラミング言語分布チャート</li>
    </ul>
  </a>
</div>

---

## hexo-plugin-commentbox

[hexo-plugin-commentbox](https://github.com/neoalienson/hexo-plugin-commentbox)

### 機能

- **デフォルトで有効**：すべてのページにコメントが自動的に表示されます
- **細かい制御**：front matter を使用して特定の記事でコメントを無効にできます
- **シンプルな統合**：最小限の設定のみが必要です

### コメントの無効化

特定の記事やページでコメントを無効にするには、front matter に以下を追加します：

```yaml
---
title: 記事のタイトル
comments: false
---
```

### セキュリティに関する考慮事項

!!!warning "⚠️ 外部スクリプトの読み込み"
    このプラグインは unpkg.com/commentbox.io から外部 JavaScript を読み込みます。以下の点に注意してください：

    - 外部スクリプトはページコンテンツとユーザーデータにアクセスできます
    - スクリプトは CDN から読み込まれ、サブリソース整合性（SRI）検証がありません
    - 外部スクリプトの変更はあなたの制御外です
    - サイトのコンテンツセキュリティポリシー（CSP）要件を考慮してください
!!!

!!!anote "📝 免責事項"
    このプロジェクトは commentbox.io と一切関係がなく、承認や接続もありません。これは commentbox.io サービスを Hexo ブログに統合するために作成された独立したプラグインです。

---

## hexo-plugin-cookieconsent

[hexo-plugin-cookieconsent](https://github.com/neoalienson/hexo-plugin-cookieconsent)

軽量な [vanilla-cookieconsent](https://github.com/orestbida/cookieconsent) ライブラリを使用して、ウェブサイトに Cookie 同意機能を素早く追加する Hexo プラグインです。

### 機能

- **GDPR 準拠**: EU の Cookie 同意要件を満たすのに役立ちます
- **軽量**: サイトのパフォーマンスへの影響を最小限に抑えます
- **カスタマイズ可能**: 外観と動作を完全に制御できます
- **多言語**: 自動検出機能付きの複数言語サポート
- **カテゴリ管理**: 必須、機能性、分析によって Cookie を整理します

### 設定例

```yaml
cookieconsent:
  enable: true
  injectJs: true
  cssUrl: "/cache/cookieconsent.css"
  options:
    guiOptions:
      consentModal:
        layout: box
        position: bottom right
    categories:
      necessary:
        readOnly: true
      functionality: {}
      analytics: {}
    language:
      default: en
      autoDetect: browser
```

### Cookie カテゴリ

!!!info "📋 カテゴリタイプ"
    **必須 Cookie**（常に有効）
    サイト機能に不可欠 - セキュリティ、ナビゲーション、コア機能。

    **機能性 Cookie**
    言語設定やログイン詳細などのユーザー設定を記憶します。

    **分析 Cookie**
    訪問者の行動を理解し、サイトのパフォーマンスを改善するのに役立ちます。

### ユースケース

- **GDPR コンプライアンス**: ヨーロッパのプライバシー規制を満たす
- **ユーザーの透明性**: Cookie の使用を明確に伝える
- **プライバシー制御**: ユーザーが Cookie の設定を管理できるようにする
- **多地域サイト**: 言語を自動検出し、適切な同意テキストを表示する

!!!tip "💡 パフォーマンスのヒント"
    `injectJs: false` に設定し、テーマ内でスクリプトを手動で含めることで、読み込みタイミングをより適切に制御できます。

---

## hexo-plugin-apache-echarts

[hexo-plugin-apache-echarts](https://github.com/neoalienson/hexo-plugin-apache-echarts)

シンプルなタグ構文で Hexo 記事にインタラクティブな Apache ECharts 可視化を追加します。[ECharts ギャラリー](https://echarts.apache.org/examples/ja/index.html)でチャートの例を確認できます。

### 機能

- **インタラクティブなクライアントサイドチャート**: 豊かでレスポンシブなデータ可視化
- **CDN ベースの ECharts ライブラリ読み込み**: ローカル依存関係不要
- **設定可能な ID 生成**: ランダムまたはハッシュベースのチャート ID
- **自動 ECharts スクリプトインジェクション**: 手動設定不要
- **すべての ECharts チャートタイプをサポート**: 棒グラフ、折れ線グラフ、円グラフ、散布図など

### 設定例

```yaml
echarts:
  enable: true
  js_url: /cache/echarts.min.local.js
  id_generation: 'hash'
```

---

## hexo-plugin-i18n-canonical

[hexo-plugin-i18n-canonical](https://github.com/neoalienson/hexo-plugin-i18n-canonical)

多言語サイトの正規 URL を管理する Hexo プラグイン。

### 機能

- **canonical タグを自動追加**：すべてのページに適切な SEO を提供
- **hreflang タグを自動追加**：すべての言語バリエーション用
- **翻訳コンテンツをソース言語に指定**：デフォルト：英語
- **カスタム正規言語をサポート**：canonical_lang front matter 経由
- **zh-TW、zh-CN、ja 翻訳をサポート**：組み込み多言語サポート
- **既存の canonical タグを持つページをスキップ**：重複を防止
- **多言語コンテンツの SEO を改善**：検索エンジンのインデックス作成を向上

---

## hexo-generator-i18n-sitemap

[hexo-generator-i18n-sitemap](https://github.com/neoalienson/hexo-generator-i18n-sitemap)

多言語サイト用に sitemap.xml を生成します。

### 機能

- **sitemap.xml と sitemap.txt を生成**：すべてのページと記事を含む
- **ホームページ index.html の重複を除外**：よりクリーンな sitemap 構造

---

## hexo-generator-i18n-archive

[hexo-generator-i18n-archive](https://github.com/neoalienson/hexo-generator-i18n-archive)

各言語のアーカイブページを生成します。

### 機能

- **各言語のアーカイブページを生成**：言語固有のフィルタリング
- **言語で記事をフィルタリング**：関連記事のみ表示
- **年、月、日で記事を整理**：時系列整理
- **ページネーションサポート**：大規模アーカイブに対応
- **設定でオン/オフ切り替え可能**：パフォーマンス制御

---

## hexo-generator-i18n-tag

[hexo-generator-i18n-tag](https://github.com/neoalienson/hexo-generator-i18n-tag)

各言語のタグページを生成し、フィルタリングとソートを行います。

### 機能

- **各言語のタグページを生成**：言語固有のフィルタリング
- **言語で記事をフィルタリング**：関連記事のみ表示
- **リダイレクト記事は最後に表示**：より良いユーザーエクスペリエンス
- **ページネーションサポート**：大規模タグコレクションに対応
- **設定でオン/オフ切り替え可能**：パフォーマンス制御

---

## hexo-generator-i18n-category

[hexo-generator-i18n-category](https://github.com/neoalienson/hexo-generator-i18n-category)

各言語のカテゴリページを生成し、フィルタリングとソートを行います。

### 機能

- **各言語のカテゴリページを生成**：言語固有のフィルタリング
- **言語で記事をフィルタリング**：関連記事のみ表示
- **リダイレクト記事は最後に表示**：より良いユーザーエクスペリエンス
- **ページネーションサポート**：大規模カテゴリコレクションに対応
- **設定でオン/オフ切り替え可能**：パフォーマンス制御

---

## hexo-github-card-inline

[hexo-github-card-inline](https://github.com/neoalienson/hexo-github-card-inline)

### ユーザーカード

統計データとプログラミング言語の内訳を含む包括的な GitHub ユーザープロフィールを表示します：

```
{% raw %}{% githubCard user:neoalienson %}{% endraw %}
```

カードに表示される内容：

- 📍 場所
- 🔗 ウェブサイト
- 📁 リポジトリ数
- ⭐ 総スター数
- 📈 コミット数
- 👥 フォロワー
- 🔄 プルリクエスト
- ❗ イシュー
- プログラミング言語分布チャート

### リポジトリカード

特定のリポジトリの主要なメトリクスを表示します：

```
{% raw %}{% githubCard user:neoalienson repo:pachinko %}{% endraw %}
```

カードに表示される内容：

- 📖 リポジトリ名と説明
- ⭐ スター数
- 🍴 フォーク数
- 主要なプログラミング言語

これらのプラグインはオープンソースで、GitHub で入手できます。このウェブサイトはこれらのプラグインで構築されています。インストール手順と設定の詳細は各リポジトリで確認できます。貢献、イシュー、フィードバックを歓迎します。

<link rel="stylesheet" href="/tools/tools.css">
