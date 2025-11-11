---
title: "Hexoで多言語対応を実現：完全ガイド"
date: 2025-10-30
lang: ja
categories: Development
tags:
  - Hexo
  - i18n
  - Static Site
excerpt: "カスタムプラグイン、URL戦略、フラグメントキャッシュによるパフォーマンス最適化で、Hexoの多言語コンテンツ管理をマスターしましょう。"
thumbnail: /assets/hexo/thumbnail.png
---

多言語ブログの構築は、単なるコンテンツの翻訳ではありません。パフォーマンスとSEOを維持しながら、言語を超えたシームレスな体験を創造することです。本ガイドでは、このウェブサイトで使用されているURL構造からキャッシュ戦略まで、完全なi18n実装を解説します。

## Hexoとは？

[Hexo](https://hexo.io/)は、Node.js上に構築された高速でシンプル、かつ強力な静的サイトジェネレーターです。Markdownファイルを完全なウェブサイトに変換し、以下の特徴を備えています：

- **超高速生成**：数秒で数百のファイルを処理
- **Markdownサポート**：フォーマット付きのプレーンテキストでコンテンツを記述
- **拡張可能なプラグイン**：追加機能のための豊富なエコシステム
- **テーマシステム**：カスタマイズ可能なテンプレートとレイアウト
- **Git対応**：サイト全体をバージョン管理

**最適な用途**：
- コード例を含む技術ブログ
- ドキュメントサイト
- 個人ポートフォリオ
- 多言語コンテンツ（適切な設定が必要）

**インストール**：
```bash
npm install -g hexo-cli
hexo init my-blog
cd my-blog
npm install
hexo server
```

!!!info "📌 バージョン情報"
    本ガイドは **Hexo 8.1.0以上** を基準としています。パーマリンクの動作とフィルターフックは、以前のバージョンでは異なる場合があります。

## Hexo i18nの課題

### Hexoが提供する機能

Hexoには**テーマ翻訳のみ**の基本的なi18nサポートがあります：

```yaml
# _config.yml
language:
  - en
  - zh-TW
  - zh-CN
  - ja

i18n_dir: :lang  # URLパスから言語を検出
```

**言語ファイル**（テーマ翻訳）：
```yaml
# themes/your-theme/languages/en.yml
menu:
  home: Home
  archives: Archives
  
# themes/your-theme/languages/zh-TW.yml
menu:
  home: 首頁
  archives: 歸檔
```

**テンプレート**でヘルパーを使用：
```ejs
<%= __('menu.home') %>  <!-- 出力：Home または 首頁 -->
```

**パス検出**：
```yaml
i18n_dir: :lang  # 最初のURLセグメントから言語を検出
```

例：
- `/index.html` → `en`（デフォルト）
- `/zh-tw/index.html` → `zh-tw`
- `/archives/index.html` → `en`（言語として検出されない）

### 問題点

Hexoのネイティブi18nは**UIテキストのみを翻訳**し、コンテンツは翻訳しません：

**❌ コンテンツフィルタリングなし**：
- インデックスページは言語に関係なくすべての投稿を表示
- アーカイブは英語と中国語の投稿を混在表示
- カテゴリー/タグは言語でフィルタリングしない

**❌ 言語固有のジェネレーターなし**：
- `/archives/` はすべての言語の投稿を表示
- `/categories/Development/` はすべての言語バージョンを混在表示
- `/zh-TW/archives/` を個別に生成する方法がない

**❌ SEOサポートなし**：
- 翻訳版のcanonicalタグなし
- 言語固有のサイトマップなし
- 検索エンジンが重複コンテンツと認識

**❌ 投稿には回避策が必要**（Hexo 8.1.0でテスト済み）：
- Hexoのパーマリンクシステムは、フィルターが介入する前にデフォルトパターン（`:title/`）を適用
- `post_permalink`フィルターは、front matterから`__permalink`が既に設定されている場合のみ実行
- プロセッサーはファイル読み込み時に`permalink` → `__permalink`を変換するため、カスタムロジックには早すぎる
- 仮想`path`プロパティは生成開始後に変更不可
- **解決策**：Hexoの`post_permalink.js`フィルターにパッチを適用し、言語プレフィックスを自動注入し、言語サフィックスを削除

### 必要なもの

真の多言語ブログを作成するには：

- すべてのコンテンツタイプの言語固有URL
- 言語ごとの個別インデックス/アーカイブ/カテゴリー/タグページ
- すべての言語を含む適切なサイトマップ生成
- 重複コンテンツペナルティを防ぐcanonicalタグ
- 複数言語を処理するパフォーマンス最適化（このサイトは4言語をサポート：en、zh-TW、zh-CN、ja）

## URL構造戦略

### 投稿とページ：異なるアプローチ

**ブログ投稿**は自動言語処理付き：
- 任意の場所に配置可能：`source/_posts/`、`source/zh-TW/_posts/`など
- ファイル名サフィックス規則を使用：`Article-Title-ja.md`、`Article-Title-zh-TW.md`
- 言語はfront matterの`lang`フィールドで識別
- **パッチが自動生成**：サフィックス重複なしで言語プレフィックス付きURL

```yaml
---
title: "記事タイトル"
date: 2025-10-30
lang: ja
categories: Development
tags:
  - Hexo
---
```

**結果**：`Article-Title-ja.md` → `/ja/2025/10/Article-Title/`（サフィックス削除）

**ページ**はディレクトリベースの構成を使用：
- 英語：`source/tools/index.md` → `/tools/`
- 中国語：`source/zh-TW/tools/index.md` → `/zh-TW/tools/`
- 日本語：`source/ja/tools/index.md` → `/ja/tools/`

```yaml
---
title: ツール
layout: tools
lang: ja
---
```

!!!warning "⚠️ 投稿にはHexoコアパッチが必要"
    **投稿にパッチが必要な理由**：投稿は言語検出前にパターンを適用する`post_permalink`フィルターを使用します。ページはディレクトリ構造を直接尊重する別のプロセッサーを使用します。
    
    **問題**：Hexoのパーマリンクシステムは投稿プロセッサーに深く統合されています：
    
    1. プロセッサーがファイルを読み込み、`permalink` → `__permalink`に変換
    2. デフォルトパーマリンクパターン（`:title/`）が即座に適用
    3. `post_permalink`フィルターは`__permalink`が存在する場合のみ実行
    4. 仮想`path`プロパティはフィルターから計算され、変更不可
    
    **解決策**：`node_modules/hexo/dist/plugins/filter/post_permalink.js`にパッチを適用：
    - 投稿データから`lang`フィールドを抽出
    - slugから`-{lang}`サフィックスを削除（例：`Article-Title-ja` → `Article-Title`）
    - デフォルト以外の言語に`/{lang}/`プレフィックスを自動注入
    - 手動および自動生成されたパーマリンクの両方を処理
    
    **ページにパッチが不要な理由**：ページはHexoネイティブの`i18n_dir: :lang`が自動処理するディレクトリベースの構成を使用します。パッチは投稿処理のみに影響します。
    
    **参照**：実装については下記の[Hexoコアパッチ](#hexoコアパッチ)セクションをご覧ください。

### 設定

```yaml
# _config.yml
language:
  - en
  - zh-TW
  - zh-CN
  - ja

i18n_dir: :lang
permalink: :title/
```

## Hexoコアパッチ

### 自動パーマリンクソリューション

手動パーマリンク設定を排除するため、Hexoのコアパーマリンクフィルターにパッチを適用します：

**ファイル**：`node_modules/hexo/dist/plugins/filter/post_permalink.js`

```javascript
function postPermalinkFilter(data) {
  // 言語を抽出してslugをクリーンアップ
  const lang = data.lang || 'en';
  const defaultLang = this.config.language?.[0] || 'en';
  
  // slugから言語サフィックスを削除（存在する場合）
  let cleanSlug = data.slug;
  const langPattern = new RegExp(`-(${this.config.language?.join('|')})$`);
  if (langPattern.test(cleanSlug)) {
    cleanSlug = cleanSlug.replace(langPattern, '');
  }
  
  const meta = {
    id: data.id,
    title: cleanSlug,  // クリーンアップされたslugを使用
    name: cleanSlug,   // クリーンアップされたslugを使用
    post_title: data.title,
    year: data.date.format('YYYY'),
    month: data.date.format('MM'),
    day: data.date.format('DD'),
    i_month: data.date.format('M'),
    i_day: data.date.format('D')
  };
  
  // 手動パーマリンクを処理
  if (data.__permalink) {
    let permalink = this.renderSync(data.__permalink, meta);
    // デフォルト以外の言語に言語プレフィックスを注入
    if (lang !== defaultLang && !permalink.startsWith(`/${lang}/`)) {
      permalink = `/${lang}${permalink.startsWith('/') ? '' : '/'}${permalink}`;
    }
    return permalink;
  }
  
  // 自動生成されたパーマリンクを処理
  let permalink = this.renderSync(this.config.permalink, meta);
  // デフォルト以外の言語に言語プレフィックスを注入
  if (lang !== defaultLang) {
    permalink = `/${lang}${permalink.startsWith('/') ? '' : '/'}${permalink}`;
  }
  return permalink;
}
```

### パッチが理想的でない理由

!!!warning "⚠️ パッチの欠点"
    **保守負担**：
    - Hexoのアップグレード後に毎回破損
    - `npm install`後に再適用が必要
    - 将来のHexoの変更と競合する可能性
    - チームメンバーがパッチ適用を覚えておく必要がある
    
    **脆弱性**：
    - Hexoの内部構造が変更される可能性
    - パッチファイル形式が脆弱
    - バージョン間の互換性の保証なし
    - コアを修正するとデバッグが困難に
    
    **より良いアプローチ**：Hexoのメンテナに機能を提案

!!!tip "💡 オープンソースへの貢献"
    **パッチの代わりに検討すべきこと**：
    
    1. **GitHub issueを開く**：i18n permalinkのユースケースを説明
    2. **解決策を提案**：パッチを開発の起点として共有
    3. **プルリクエストを提出**：機能を上流に貢献
    4. **メリット**：
       - Hexoチームが機能を保守
       - 誰もがすぐに使える
       - パッチ保守の負担がない
       - コミュニティのテストと改善
    
    **Hexoリポジトリ**：[hexojs/hexo](https://github.com/hexojs/hexo)
    
    **それまでは**：パッチを一時的な回避策として使用し、公式サポートが存在したら移行する計画を立てましょう。

### パッチの適用

**オプション1：手動パッチ**（`npm install`後に再適用が必要）：
```bash
cd hexo-blog
patch -p0 < ../patches/hexo-i18n-post-permalink.patch
```

**オプション2：インストール後スクリプト**（自動）：
```json
// package.json
{
  "scripts": {
    "postinstall": "patch -p0 < ../patches/hexo-i18n-post-permalink.patch || true"
  }
}
```

**パッチファイル**：
- `patches/hexo-i18n-post-permalink.patch` - ブログ投稿用
- `patches/hexo-i18n-page-permalink.patch` - ページ用（オプション）

### 動作方法

**パッチ適用前**：
- ファイル名：`Tools-Games-ja.md`
- 生成されたURL：`/ja/2025/10/Tools-Games-ja/` ❌（サフィックス重複）

**パッチ適用後**：
- ファイル名：`Tools-Games-ja.md`
- 生成されたURL：`/ja/2025/10/Tools-Games/` ✅（サフィックス削除）

**主な機能**：
1. **言語検出**：front matterから`lang`フィールドを読み取り
2. **サフィックス削除**：slugから`-ja`、`-zh-TW`、`-zh-CN`を削除
3. **プレフィックス注入**：デフォルト以外の言語に`/{lang}/`を追加
4. **手動オーバーライド**：front matterの明示的な`permalink`を尊重

!!!tip "💡 ファイル名規則"
    整理のためにファイル名に言語サフィックスを使用：
    - `Article-Title.md`（英語）
    - `Article-Title-zh-TW.md`（繁体字中国語）
    - `Article-Title-zh-CN.md`（簡体字中国語）
    - `Article-Title-ja.md`（日本語）
    
    パッチはURLからサフィックスを自動的に削除します。

### ページにもパッチを適用できますか？

技術的には可能ですが、不要です。ページのディレクトリベースアプローチ：

- **すぐに使える**：Hexoネイティブの`i18n_dir: :lang`が処理
- **より明確な構成**：ファイルシステムで言語構造が可視化
- **保守が容易**：ファイル名サフィックス規則が不要
- **パッチ保守の負担なし**：`npm install`後も存続

**ベストプラクティス**：投稿にはパッチを使用（日付付き動的コンテンツ）、ページにはディレクトリ構造を使用（About、Toolsなどの静的コンテンツ）。

!!!info "📋 このウェブサイトのアプローチ"
    このウェブサイトは**投稿とページの両方にパッチアプローチを使用**（ページのディレクトリベースアプローチではない）：
    
    **すべてを集中化する理由**
    - **一貫性**：すべてのコンテンツタイプで同じファイル名サフィックス規則
    - **よりシンプルな構造**：すべてのコンテンツが標準的な場所（`source/_posts/`、`source/tools/`）
    - **リファクタリングが容易**：ファイル移動が言語検出を破壊しない
    - **重複の削減**：言語ごとにディレクトリ構造を再作成する必要なし
    - **統一されたワークフロー**：投稿とページで同じ翻訳プロセス
    
    **トレードオフ**：ページはディレクトリベースアプローチ（すぐに使える）を使用できますが、すべてにパッチを使用することで一貫性を維持し、メンタルモデルを簡素化します。
    
    **参照**：実装については下記の[ページへのパッチ拡張](#ページへのパッチ拡張)セクションをご覧ください。

### ページへのパッチ拡張

ページに同じアプローチを適用するには、Hexoのページプロセッサーにパッチを適用します：

**ファイル**：`node_modules/hexo/dist/plugins/processor/asset.js`

60行目の後に追加（`data.path`設定後）：

```javascript
// i18n: ページに言語プレフィックスを自動注入し、言語サフィックスを削除
const lang = data.lang || 'en';
const defaultLang = config.language?.[0] || 'en';
const languages = config.language || ['en'];
if (lang !== defaultLang && !data.path.startsWith(`${lang}/`)) {
    // ファイル名を抽出して言語サフィックスをチェック
    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1].replace(/\.(md|markdown|html)$/i, '');
    const langPattern = new RegExp(`-(${languages.join('|')})$`);
    
    // ファイル名に言語サフィックスが存在する場合、パスから削除
    if (langPattern.test(filename)) {
        const pathWithoutExt = data.path.replace(/\.html$/, '');
        const cleanPath = pathWithoutExt.replace(langPattern, '');
        data.path = cleanPath + '.html';
    }
    data.path = `${lang}/${data.path}`;
}
```

**パッチの適用**：

```bash
cd hexo-blog
patch -p0 < ../patches/hexo-i18n-page-permalink.patch
```

**動作方法**：
- Hexoのページプロセッサーを直接パッチ
- ページファイル処理中に実行
- ファイル名から言語サフィックスを削除（例：`index-zh-CN.md` → `index.html`）
- 言語プレフィックスを注入（例：`terms-and-conditions/index.html` → `zh-CN/terms-and-conditions/index.html`）

**例**：
- ファイル：`source/terms-and-conditions/index-zh-CN.md`（`lang: zh-CN`付き）
- 生成されたURL：`/zh-CN/terms-and-conditions/`（✅ サフィックス削除、プレフィックス追加）
- ファイル：`source/tools-ja.md`（`lang: ja`付き）
- 生成されたURL：`/ja/tools/`（✅ サフィックス削除、プレフィックス追加）

## 必須のi18nプラグイン

標準のHexoジェネレーターは言語固有のコンテンツをサポートしていません。カスタムプラグインがそのギャップを埋めます：

!!!warning "⚠️ まず公式プラグインを削除"
    競合を避けるため、Hexoのデフォルトジェネレーターをアンインストール：
    ```bash
    npm uninstall hexo-generator-index hexo-generator-archive hexo-generator-category hexo-generator-tag hexo-generator-sitemap
    ```
    i18nバージョンがこれらを完全に置き換えます。

### 1. インデックスページ

**プラグイン**：[hexo-generator-i18n-index](https://github.com/neoalienson/hexo-generator-i18n-index)

言語ごとに個別のインデックスページを作成し、固定投稿をサポート：

```bash
npm install hexo-generator-i18n-index
```

```yaml
index_generator:
  per_page: 24
  order_by: -date
```

**ソートロジック**：
1. 通常の投稿が先、リダイレクト投稿（`original_lang_url`）が後
2. 固定投稿が最上部
3. 次に日付順（新しい順）

**結果**：
- `/` - 英語の投稿のみ
- `/zh-TW/` - 繁体字中国語の投稿のみ
- `/zh-CN/` - 簡体字中国語の投稿のみ
- `/ja/` - 日本語の投稿のみ

### 2. サイトマップ生成

**プラグイン**：[hexo-generator-i18n-sitemap](https://github.com/neoalienson/hexo-generator-i18n-sitemap)

すべての言語バージョンを含む統一サイトマップを生成：
- `/sitemap.xml` - すべての言語のすべてのページ
- `/sitemap.txt` - シンプルなURLリスト形式

```yaml
sitemap_i18n:
  enable: true
  languages:
    - en
    - zh-TW
    - zh-CN
    - ja
  changefreq: monthly
  priority: 0.6
```

### 3. アーカイブページ

**プラグイン**：[hexo-generator-i18n-archive](https://github.com/neoalienson/hexo-generator-i18n-archive)

言語固有のアーカイブページを作成：
- `/archives/`（英語）
- `/zh-TW/archives/`（繁体字中国語）
- `/ja/archives/`（日本語）

```yaml
i18n_archive_generator:
  enable: true
  per_page: 24
  yearly: true
  monthly: false
```

### 4. カテゴリーページ

**プラグイン**：[hexo-generator-i18n-category](https://github.com/neoalienson/hexo-generator-i18n-category)

言語ごとにカテゴリーページを生成し、カテゴリー名を翻訳：

```yaml
i18n_category_generator:
  enable: true
  per_page: 24

category_i18n:
  Development:
    en: "Development"
    zh-TW: "開發"
    zh-CN: "开发"
    ja: "開発"
```

### 5. タグページ

**プラグイン**：[hexo-generator-i18n-tag](https://github.com/neoalienson/hexo-generator-i18n-tag)

言語でフィルタリングされたタグページを作成：

```yaml
i18n_tag_generator:
  enable: true
  per_page: 24
```

### 6. Canonicalタグ

**プラグイン**：[hexo-plugin-i18n-canonical](https://github.com/neoalienson/hexo-plugin-i18n-canonical)

適切なcanonicalタグを追加して重複コンテンツペナルティを防止。

**問題**：検索エンジンは翻訳ページを重複コンテンツと見なします：
- `/2025/10/Article-Title/`（英語）
- `/zh-TW/2025/10/Article-Title/`（中国語）
- `/ja/2025/10/Article-Title/`（日本語）

canonicalタグがないと、Googleは次のことを行う可能性があります：
- 翻訳間でランキングシグナルを分散
- 間違った言語バージョンをインデックス
- 「重複」コンテンツでサイトにペナルティ

**解決策**：Canonicalタグは検索エンジンにどのバージョンが主要かを伝えます：

```html
<!-- すべての言語バージョンが英語をcanonicalとして指す -->
<link rel="canonical" href="https://neo01.com/2025/10/Article-Title/" />
```

```yaml
canonical_multilang:
  enable: true
  default_lang: en  # 主要言語
  languages:
    - en
    - zh-TW
    - zh-CN
    - ja
```

**結果**：検索エンジンはこれらが翻訳であり重複ではないことを理解し、SEO価値を保持します。

## フラグメントキャッシュによるパフォーマンス最適化

### 多言語パフォーマンスの課題

このウェブサイトは4言語（en、zh-TW、zh-CN、ja）をサポートしており、これは次を意味します：
- **4×ページ生成**：各投稿が4つのインデックスエントリ、4つのアーカイブページ、4つのカテゴリーページ、4つのタグページを作成
- **4×テンプレートレンダリング**：ページタイプごとにヘッダー、フッター、サイドバーを4回レンダリング
- **4×メモリ使用量**：各言語が個別のページオブジェクトを維持
- **指数関数的成長**：100投稿 × 4言語 = 400+ページ（アーカイブ/カテゴリー/タグを数える前）

**一般的なルール**：N言語の場合、最適化なしでN×のビルド時間とメモリ使用量を予想します。

### フラグメントキャッシュソリューション

Hexoの`fragment_cache()`関数は、レンダリングされたテンプレートコンテンツを保存し、ページ間で再利用します。ページごとに変更されないコンポーネントに不可欠です。

**重要な原則**：グローバルではなく、言語ごとにキャッシュします。

```ejs
<%
if (!config.relative_link) {
%>
<%- fragment_cache('header-' + (page.lang || 'en'), function(){
    return partial('common/header');
}) %>
<%
} else {
%>
<%- partial('common/header') %>
<%
}
%>
```

**キャッシュキー戦略**：
- `header-en`、`header-zh-TW`、`header-zh-CN`、`header-ja`（4つのキャッシュエントリ）
- 各言語が分離されたキャッシュを取得
- その言語のすべてのページで再利用

### キャッシュすべきもの

**ヘッダー**（`layout.ejs`）：
```ejs
<%- fragment_cache('header-' + (page.lang || 'en'), function(){
    return partial('common/header');
}) %>
```
- ナビゲーション、言語セレクター、ロゴ
- 4つのキャッシュエントリ（言語ごとに1つ）
- 各言語の約100+ページで再利用

**サイドバー**（`sidebar.ejs`）：
```ejs
<%- fragment_cache('sidebar-static-' + (page.lang || 'en'), function(){
    return partial('common/sidebar-static');
}) %>
```
- ソーシャルリンク、構造
- ウィジェットは言語ごとに個別にキャッシュ

**ウィジェット**（`sidebar-widgets.ejs`）：
```ejs
<%- fragment_cache('widget-recent_posts-' + (page.lang || 'en'), function(){
    return partial('widget/recent_posts');
}) %>
```
- 最近の投稿はテンプレート内で言語でフィルタリング：
```ejs
<%_ site.posts.filter(function(post) { 
    return (post.lang || 'en') === currentLang; 
}).limit(5).each(function(post) { _%>
```
- その言語のすべてのページで同じ5つの投稿を表示

**フッター**（`footer.ejs`）：
```ejs
<%- fragment_cache('footer-static-' + (page.lang || 'en'), function(){
    return partial('common/footer-static');
}) %>
<%- partial('common/footer-dynamic') %>
```
- 静的：著作権、クレジット（キャッシュ済み）
- 動的：QRコード（ページ固有）

**スクリプト**（`layout.ejs`）：
```ejs
<%- fragment_cache('scripts-' + (page.lang || 'en'), function(){
    return partial('common/scripts');
}) %>
```
- JavaScriptインクルードを言語ごとにキャッシュ

### 設定要件

```yaml
# _config.yml
relative_link: false  # 安全なキャッシュに必要
```

!!!warning "⚠️ 相対リンクはキャッシュを破壊"
    フラグメントキャッシュはページオブジェクトをキャプチャします。`relative_link: true`の場合、キャッシュされたコンテンツに間違ったパスが含まれます。キャッシュを有効にする場合は常に絶対パスを使用してください。

### クライアント側言語セレクター

サーバー側の言語切り替えはフラグメントキャッシュで機能しません。解決策：JavaScriptベースのURL生成。

```javascript
// 現在のパスを検出
var currentPath = window.location.pathname;
var basePath = currentPath.replace(/^\\/[a-z]{2}(-[A-Z]{2})?\\//, '/');

// 言語固有のURLを生成
document.querySelectorAll('[data-lang]').forEach(function(link) {
    var targetLang = link.getAttribute('data-lang');
    var targetUrl = targetLang === 'en' ? basePath : '/' + targetLang + basePath;
    link.href = targetUrl;
});
```

**利点**：
- 言語セレクターHTMLは言語ごとにキャッシュ
- URLは実際のブラウザーの場所から生成
- 古いページオブジェクトの問題なし

### パフォーマンスへの影響

**最適化前**（このサイトの4言語）：
- ビルド時間：400+ページ（4言語 × 100+投稿）で約1分
- メモリ使用量：高いテンプレートレンダリングオーバーヘッド
- 各ページがヘッダー/フッター/サイドバーをゼロからレンダリング

**最適化後**：
- ビルド時間：約40秒（60%削減）
- メモリ使用量：大幅に低下
- キャッシュヒット率：言語ごとに80-95%

**このサイトの計算**：
- キャッシュなし：400ページ × 5コンポーネント = 2,000レンダリング
- キャッシュあり：20キャッシュエントリ（4言語 × 5コンポーネント）+ 400動的レンダリング
- **一般的な式**：コンポーネントごとにNキャッシュエントリ、（ページ × N）レンダリングではない

## コンテンツ管理ワークフロー

### 新規投稿の作成

1. **まず英語版を作成**（信頼できる情報源）：
```bash
hexo new post "Article Title"
# 作成：source/_posts/Article-Title.md
```

2. **言語メタデータを追加**：
```yaml
---
title: "Article Title"
date: 2025-10-30
lang: en
categories: Development
tags:
  - Hexo
excerpt: "Compelling summary in English"
---
```

3. **言語サフィックス付きで翻訳版を作成**：
```bash
# ファイル名に言語サフィックスを使用
cp source/_posts/Article-Title.md source/_posts/Article-Title-zh-TW.md
cp source/_posts/Article-Title.md source/_posts/Article-Title-zh-CN.md
cp source/_posts/Article-Title.md source/_posts/Article-Title-ja.md
```

4. **翻訳メタデータを更新**（permalinkは不要）：
```yaml
---
title: "記事タイトル"
date: 2025-10-30
lang: ja  # パッチが自動生成：/ja/2025/10/Article-Title/
categories: Development
tags:
  - Hexo
excerpt: "日本語の要約"
---
```

!!!tip "💡 自動URL生成"
    パッチ適用後：
    - `Article-Title-zh-TW.md` → `/zh-TW/2025/10/Article-Title/`
    - `Article-Title-ja.md` → `/ja/2025/10/Article-Title/`
    - 言語サフィックスがURLから自動的に削除
    - 手動`permalink`設定は不要

### 未翻訳コンテンツの処理

単一言語でのみ利用可能なコンテンツには、`original_lang_url`を使用：

```yaml
---
title: "CISP認証"
date: 2025-10-30
lang: ja
permalink: /ja/2025/10/cisp-certification/
categories: Cybersecurity
original_lang_url: /zh-CN/2025/10/cisp-certification/
---
```

これはコンテンツの代わりにリダイレクト通知を表示し、読者を利用可能な言語バージョンに誘導します。

## リソース管理

### 画像とアセット

**英語投稿**：相対パスを使用
```markdown
![Diagram](diagram.png)
```

**翻訳投稿**：英語アセットへの絶対パスを使用
```markdown
![図](/2025/10/Article-Title/diagram.png)
```

**利点**：
- アセットの重複なし
- 単一の信頼できる情報源
- 保守が容易

### 内部リンク

常に言語プレフィックス付きの絶対パスを使用：

```markdown
<!-- 英語 -->
[Tools](/tools/)
[Previous Post](/2025/09/Previous-Article/)

<!-- 日本語 -->
[ツール](/ja/tools/)
[前の記事](/ja/2025/09/Previous-Article/)
```

## SEOの考慮事項

### 要約管理

各言語には異なる文字密度があります：

```yaml
excerpt_length:
  default: 200
  en: 200
  zh-TW: 100
  zh-CN: 100
  ja: 100
```

より良い制御のため、常にfront matterで手動要約を提供：

```yaml
excerpt: "カスタムプラグインでHexoの多言語コンテンツ管理をマスター。"
```

### カテゴリー翻訳

カテゴリーキーは英語のまま、表示名を翻訳：

```yaml
category_i18n:
  Development:
    en: "Development"
    zh-TW: "開發"
    zh-CN: "开发"
    ja: "開発"
```

### タグ

**コンテンツ言語に関係なく、常に英語タグを使用**：

```yaml
tags:
  - Hexo
  - i18n
  - Static Site
```

これにより、言語間でタグページの一貫性が確保されます。

## 追加のパフォーマンスヒント

### 開発中のプラグイン無効化

多くのi18nプラグインは、開発を高速化するためにローカルプレビュー中に無効化できます：

```yaml
# _config.yml
i18n_archive_generator:
  enable: false  # プレビュー用に無効化
  
i18n_category_generator:
  enable: false  # プレビュー用に無効化
  
i18n_tag_generator:
  enable: false  # プレビュー用に無効化
  
sitemap_i18n:
  enable: false  # プレビュー用に無効化
  
canonical_multilang:
  enable: false  # プレビュー用に無効化
```

**デプロイ前に有効化**：
```bash
# デプロイ前にすべてのプラグインのenableをtrueに設定
hexo clean && hexo generate
```

**利点**：
- より高速なローカルビルド（秒単位 vs 分単位）
- コンテンツ作成中のより速い反復
- 本番環境で必要な場合のみ完全な機能

!!!tip "💡 開発ワークフロー"
    日常作業では`_config.yml`でプラグインを無効のままにします。CI/CDパイプラインまたは手動デプロイ前にのみ有効化します。

## トラブルシューティング

### 間違った言語のコンテンツが表示される

**原因**：フラグメントキャッシュが言語固有のキーを使用していない

**解決策**：キャッシュキーに`page.lang`が含まれていることを確認：
```ejs
<%- fragment_cache('component-' + (page.lang || 'en'), function(){
    return partial('common/component');
}) %>
```

### 言語セレクターが404を表示

**原因**：フラグメントキャッシュによるサーバー側パス検出

**解決策**：クライアント側URL生成を実装（上記参照）

### ビルドパフォーマンスの低下

**原因**：キャッシュが無効または`relative_link: true`

**解決策**：
1. `relative_link: false`を設定
2. キャッシュをクリア：`hexo clean`
3. 再生成：`hexo generate`

### 翻訳が表示されない

**原因**：`lang`メタデータの欠落または不正なpermalink

**解決策**：front matterに以下が含まれていることを確認：
- `lang: ja`（または適切な言語コード）
- `permalink: /ja/YYYY/MM/slug/`

## まとめ

多言語Hexoブログの構築にはカスタムプラグインと慎重な最適化が必要ですが、結果は高速でSEOフレンドリーなサイトとなり、グローバルなオーディエンスにサービスを提供します。重要な洞察：

- **関心の分離**：投稿は集中化、ページはディレクトリベース
- **積極的なキャッシュ**：言語ごとのフラグメントキャッシュでビルド時間を60%削減
- **クライアント側の強化**：JavaScriptがキャッシュを破壊せずに動的要素を処理
- **一貫した構造**：英語を信頼できる情報源とし、翻訳は確立されたパターンに従う

この実装は、4言語にわたる400+ページのブログをサポートし、優れたパフォーマンスとSEOを維持しながら2分以内にビルドします。

静的サイト生成の未来は多言語であり、適切なアーキテクチャがあれば、Hexoは世界クラスの結果を提供できます。
