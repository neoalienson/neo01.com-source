---
title: "在 Hexo 中啟用 i18n：多語言部落格完整指南"
date: 2025-10-30
lang: zh-TW
categories: Development
tags:
  - Hexo
  - i18n
  - Static Site
excerpt: "掌握 Hexo 多語言內容管理，透過自訂插件、URL 策略與片段快取優化效能。"
thumbnail: /assets/hexo/thumbnail.png
---

建立多語言部落格不僅僅是翻譯內容——而是在維持效能與 SEO 的同時，創造跨語言的無縫體驗。本指南將完整介紹本網站使用的 i18n 實作方式，從 URL 結構到快取策略。

## 什麼是 Hexo？

[Hexo](https://hexo.io/) 是一個快速、簡單且強大的靜態網站產生器，基於 Node.js 建構。它能將 Markdown 檔案轉換為完整的網站，具備以下特點：

- **閃電般的生成速度**：數秒內處理數百個檔案
- **Markdown 支援**：使用純文字格式化撰寫內容
- **可擴充插件**：豐富的生態系統提供額外功能
- **主題系統**：可自訂的模板與版面配置
- **Git 友善**：對整個網站進行版本控制

**適合用於**：
- 包含程式碼範例的技術部落格
- 文件網站
- 個人作品集
- 多語言內容（需適當設定）

**安裝方式**：
```bash
npm install -g hexo-cli
hexo init my-blog
cd my-blog
npm install
hexo server
```

!!!info "📌 版本說明"
    本指南基於 **Hexo 8.1.0 或更高版本**。永久連結行為與過濾器鉤子在較早版本中可能有所不同。

## Hexo i18n 的挑戰

### Hexo 提供的功能

Hexo 具備基本的 i18n 支援，但**僅限於主題翻譯**：

```yaml
# _config.yml
language:
  - en
  - zh-TW
  - zh-CN
  - ja

i18n_dir: :lang  # 從 URL 路徑偵測語言
```

**語言檔案**（主題翻譯）：
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

**模板**使用輔助函式：
```ejs
<%= __('menu.home') %>  <!-- 輸出：Home 或 首頁 -->
```

**路徑偵測**：
```yaml
i18n_dir: :lang  # 從第一個 URL 區段偵測語言
```

範例：
- `/index.html` → `en`（預設）
- `/zh-tw/index.html` → `zh-tw`
- `/archives/index.html` → `en`（未被偵測為語言）

### 問題所在

Hexo 原生的 i18n **僅翻譯 UI 文字**，不包含內容：

**❌ 無內容過濾**：
- 首頁顯示所有文章，不論語言
- 歸檔頁面混合英文與中文文章
- 分類/標籤不依語言過濾

**❌ 無語言專屬產生器**：
- `/archives/` 顯示所有語言的文章
- `/categories/Development/` 混合所有語言版本
- 無法單獨產生 `/zh-TW/archives/`

**❌ 無 SEO 支援**：
- 翻譯版本無 canonical 標籤
- 無語言專屬的網站地圖
- 搜尋引擎視為重複內容

**❌ 文章需要變通方法**（在 Hexo 8.1.0 測試）：
- Hexo 的永久連結系統在任何過濾器攔截前就套用預設模式（`:title/`）
- `post_permalink` 過濾器僅在 `__permalink` 已從 front matter 設定時執行
- 處理器在檔案讀取時將 `permalink` 轉換為 `__permalink`，對自訂邏輯來說太早
- 虛擬 `path` 屬性在生成開始後無法修改
- **解決方案**：修補 Hexo 的 `post_permalink.js` 過濾器以自動注入語言前綴並移除語言後綴

### 需要什麼

建立真正的多語言部落格需要：

- 所有內容類型的語言專屬 URL
- 每種語言的獨立首頁/歸檔/分類/標籤頁面
- 包含所有語言的適當網站地圖生成
- Canonical 標籤以防止重複內容懲罰
- 效能優化以處理多種語言（本網站支援 4 種：en、zh-TW、zh-CN、ja）

## URL 結構策略

### 文章與頁面：不同的方法

**部落格文章**具備自動語言處理：
- 可組織在任何位置：`source/_posts/`、`source/zh-TW/_posts/` 等
- 使用檔名後綴慣例：`Article-Title-ja.md`、`Article-Title-zh-TW.md`
- 語言由 front matter 中的 `lang` 欄位識別
- **修補程式自動產生**帶語言前綴的 URL，不重複後綴

```yaml
---
title: "文章標題"
date: 2025-10-30
lang: zh-TW
categories: Development
tags:
  - Hexo
---
```

**結果**：`Article-Title-zh-TW.md` → `/zh-TW/2025/10/Article-Title/`（後綴已移除）

**頁面**使用基於目錄的組織方式：
- 英文：`source/tools/index.md` → `/tools/`
- 中文：`source/zh-TW/tools/index.md` → `/zh-TW/tools/`
- 日文：`source/ja/tools/index.md` → `/ja/tools/`

```yaml
---
title: 工具
layout: tools
lang: zh-TW
---
```

!!!warning "⚠️ 文章需要 Hexo 核心修補程式"
    **為何文章需要修補程式**：文章使用 `post_permalink` 過濾器，在語言偵測前套用模式。頁面使用不同的處理器，直接遵循目錄結構。
    
    **問題**：Hexo 的永久連結系統深度整合到文章處理器中：
    
    1. 處理器讀取檔案並將 `permalink` 轉換為 `__permalink`
    2. 預設永久連結模式（`:title/`）立即套用
    3. `post_permalink` 過濾器僅在 `__permalink` 存在時執行
    4. 虛擬 `path` 屬性從過濾器計算，無法修改
    
    **解決方案**：修補 `node_modules/hexo/dist/plugins/filter/post_permalink.js` 以：
    - 從文章資料提取 `lang` 欄位
    - 從 slug 移除 `-{lang}` 後綴（例如 `Article-Title-ja` → `Article-Title`）
    - 為非預設語言自動注入 `/{lang}/` 前綴
    - 處理手動與自動產生的永久連結
    
    **為何頁面不需要修補程式**：頁面使用基於目錄的組織方式，Hexo 原生的 `i18n_dir: :lang` 可自動處理。修補程式僅影響文章處理。
    
    **參見**：下方的 [Hexo 核心修補程式](#hexo-核心修補程式) 章節以了解實作方式。

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

## Hexo 核心修補程式

### 自動永久連結解決方案

為了消除手動永久連結設定，修補 Hexo 的核心永久連結過濾器：

**檔案**：`node_modules/hexo/dist/plugins/filter/post_permalink.js`

```javascript
function postPermalinkFilter(data) {
  // 提取語言並清理 slug
  const lang = data.lang || 'en';
  const defaultLang = this.config.language?.[0] || 'en';
  
  // 如果存在，從 slug 移除語言後綴
  let cleanSlug = data.slug;
  const langPattern = new RegExp(`-(${this.config.language?.join('|')})$`);
  if (langPattern.test(cleanSlug)) {
    cleanSlug = cleanSlug.replace(langPattern, '');
  }
  
  const meta = {
    id: data.id,
    title: cleanSlug,  // 使用清理後的 slug
    name: cleanSlug,   // 使用清理後的 slug
    post_title: data.title,
    year: data.date.format('YYYY'),
    month: data.date.format('MM'),
    day: data.date.format('DD'),
    i_month: data.date.format('M'),
    i_day: data.date.format('D')
  };
  
  // 處理手動永久連結
  if (data.__permalink) {
    let permalink = this.renderSync(data.__permalink, meta);
    // 為非預設語言注入語言前綴
    if (lang !== defaultLang && !permalink.startsWith(`/${lang}/`)) {
      permalink = `/${lang}${permalink.startsWith('/') ? '' : '/'}${permalink}`;
    }
    return permalink;
  }
  
  // 處理自動產生的永久連結
  let permalink = this.renderSync(this.config.permalink, meta);
  // 為非預設語言注入語言前綴
  if (lang !== defaultLang) {
    permalink = `/${lang}${permalink.startsWith('/') ? '' : '/'}${permalink}`;
  }
  return permalink;
}
```

### 為何修補並非理想做法

!!!warning "⚠️ 修補的缺點"
    **維護負擔**：
    - 每次 Hexo 升級後都會失效
    - 需要在 `npm install` 後重新套用
    - 可能與未來的 Hexo 變更衝突
    - 團隊成員必須記得套用修補程式
    
    **脆弱性**：
    - Hexo 的內部結構可能改變
    - 修補檔案格式很脆弱
    - 無法保證跨版本相容性
    - 修改核心後除錯變得更困難
    
    **更好的方法**：向 Hexo 維護者提議此功能

!!!tip "💡 貢獻開源專案"
    **與其修補，不如考慮**：
    
    1. **開啟 GitHub issue**：描述 i18n permalink 使用案例
    2. **提議解決方案**：分享您的修補程式作為起點
    3. **提交 pull request**：向上游貢獻此功能
    4. **優點**：
       - 功能由 Hexo 團隊維護
       - 所有人都能開箱即用
       - 無修補維護負擔
       - 社群測試與改進
    
    **Hexo 儲存庫**：[hexojs/hexo](https://github.com/hexojs/hexo)
    
    **在此之前**：將修補程式作為臨時解決方案，但計劃在官方支援存在後遷移。

### 套用修補程式

**選項 1：手動修補**（`npm install` 後需重新套用）：
```bash
cd hexo-blog
patch -p0 < ../patches/hexo-i18n-post-permalink.patch
```

**選項 2：安裝後腳本**（自動）：
```json
// package.json
{
  "scripts": {
    "postinstall": "patch -p0 < ../patches/hexo-i18n-post-permalink.patch || true"
  }
}
```

**修補檔案**：
- `patches/hexo-i18n-post-permalink.patch` - 用於部落格文章
- `patches/hexo-i18n-page-permalink.patch` - 用於頁面（選用）

### 運作方式

**修補前**：
- 檔名：`Tools-Games-ja.md`
- 產生的 URL：`/ja/2025/10/Tools-Games-ja/` ❌（後綴重複）

**修補後**：
- 檔名：`Tools-Games-ja.md`
- 產生的 URL：`/ja/2025/10/Tools-Games/` ✅（後綴已移除）

**主要功能**：
1. **語言偵測**：從 front matter 讀取 `lang` 欄位
2. **後綴移除**：從 slug 移除 `-ja`、`-zh-TW`、`-zh-CN`
3. **前綴注入**：為非預設語言新增 `/{lang}/`
4. **手動覆寫**：遵循 front matter 中明確的 `permalink`

!!!tip "💡 檔名慣例"
    在檔名中使用語言後綴以便組織：
    - `Article-Title.md`（英文）
    - `Article-Title-zh-TW.md`（繁體中文）
    - `Article-Title-zh-CN.md`（簡體中文）
    - `Article-Title-ja.md`（日文）
    
    修補程式會自動從 URL 移除後綴。

### 也能修補頁面嗎？

技術上可以，但沒必要。頁面的基於目錄方法：

- **開箱即用**：Hexo 原生的 `i18n_dir: :lang` 可處理
- **更清晰的組織**：語言結構在檔案系統中可見
- **更易維護**：不需要檔名後綴慣例
- **無修補維護負擔**：`npm install` 後仍可存活

**最佳實踐**：對文章使用修補程式（帶日期的動態內容），對頁面使用目錄結構（如關於、工具等靜態內容）。

!!!info "📋 本網站的方法"
    本網站對**文章和頁面都使用修補方法**（而非頁面的基於目錄方法）：
    
    **為何集中所有內容？**
    - **一致性**：所有內容類型使用相同的檔名後綴慣例
    - **更簡單的結構**：所有內容在標準位置（`source/_posts/`、`source/tools/`）
    - **更易重構**：移動檔案不會破壞語言偵測
    - **減少重複**：無需為每種語言重建目錄結構
    - **統一工作流程**：文章和頁面使用相同的翻譯流程
    
    **取捨**：頁面可使用基於目錄的方法（開箱即用），但對所有內容使用修補程式可維持一致性並簡化心智模型。
    
    **參見**：下方的[將修補程式擴展到頁面](#將修補程式擴展到頁面)章節以了解實作方式。

### 將修補程式擴展到頁面

要對頁面套用相同方法，修補 Hexo 的頁面處理器：

**檔案**：`node_modules/hexo/dist/plugins/processor/asset.js`

在第 60 行後新增（在 `data.path` 設定後）：

```javascript
// i18n: 為頁面自動注入語言前綴並移除語言後綴
const lang = data.lang || 'en';
const defaultLang = config.language?.[0] || 'en';
const languages = config.language || ['en'];
if (lang !== defaultLang && !data.path.startsWith(`${lang}/`)) {
    // 提取檔名以檢查語言後綴
    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1].replace(/\.(md|markdown|html)$/i, '');
    const langPattern = new RegExp(`-(${languages.join('|')})$`);
    
    // 如果檔名中存在語言後綴，從路徑移除
    if (langPattern.test(filename)) {
        const pathWithoutExt = data.path.replace(/\.html$/, '');
        const cleanPath = pathWithoutExt.replace(langPattern, '');
        data.path = cleanPath + '.html';
    }
    data.path = `${lang}/${data.path}`;
}
```

**套用修補程式**：

```bash
cd hexo-blog
patch -p0 < ../patches/hexo-i18n-page-permalink.patch
```

**運作方式**：
- 直接修補 Hexo 的頁面處理器
- 在頁面檔案處理期間執行
- 從檔名移除語言後綴（例如 `index-zh-CN.md` → `index.html`）
- 注入語言前綴（例如 `terms-and-conditions/index.html` → `zh-CN/terms-and-conditions/index.html`）

**範例**：
- 檔案：`source/terms-and-conditions/index-zh-CN.md` 帶 `lang: zh-CN`
- 產生的 URL：`/zh-CN/terms-and-conditions/`（✅ 後綴已移除，前綴已新增）
- 檔案：`source/tools-ja.md` 帶 `lang: ja`
- 產生的 URL：`/ja/tools/`（✅ 後綴已移除，前綴已新增）

## 必要的 i18n 插件

標準的 Hexo 產生器不支援語言專屬內容。自訂插件填補了這個空缺：

!!!warning "⚠️ 先移除官方插件"
    解除安裝 Hexo 的預設產生器以避免衝突：
    ```bash
    npm uninstall hexo-generator-index hexo-generator-archive hexo-generator-category hexo-generator-tag hexo-generator-sitemap
    ```
    i18n 版本會完全取代這些插件。

### 1. 首頁

**插件**：[hexo-generator-i18n-index](https://github.com/neoalienson/hexo-generator-i18n-index)

為每種語言建立獨立的首頁，支援置頂文章：

```bash
npm install hexo-generator-i18n-index
```

```yaml
index_generator:
  per_page: 24
  order_by: -date
```

**排序邏輯**：
1. 一般文章在前，重導向文章（`original_lang_url`）在後
2. 置頂文章在最上方
3. 然後依日期排序（最新的在前）

**結果**：
- `/` - 僅英文文章
- `/zh-TW/` - 僅繁體中文文章
- `/zh-CN/` - 僅簡體中文文章
- `/ja/` - 僅日文文章

### 2. 網站地圖生成

**插件**：[hexo-generator-i18n-sitemap](https://github.com/neoalienson/hexo-generator-i18n-sitemap)

產生包含所有語言版本的統一網站地圖：
- `/sitemap.xml` - 所有語言的所有頁面
- `/sitemap.txt` - 簡單的 URL 列表格式

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

### 3. 歸檔頁面

**插件**：[hexo-generator-i18n-archive](https://github.com/neoalienson/hexo-generator-i18n-archive)

建立語言專屬的歸檔頁面：
- `/archives/`（英文）
- `/zh-TW/archives/`（繁體中文）
- `/ja/archives/`（日文）

```yaml
i18n_archive_generator:
  enable: true
  per_page: 24
  yearly: true
  monthly: false
```

### 4. 分類頁面

**插件**：[hexo-generator-i18n-category](https://github.com/neoalienson/hexo-generator-i18n-category)

為每種語言產生分類頁面，並翻譯分類名稱：

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

### 5. 標籤頁面

**插件**：[hexo-generator-i18n-tag](https://github.com/neoalienson/hexo-generator-i18n-tag)

建立依語言過濾的標籤頁面：

```yaml
i18n_tag_generator:
  enable: true
  per_page: 24
```

### 6. Canonical 標籤

**插件**：[hexo-plugin-i18n-canonical](https://github.com/neoalienson/hexo-plugin-i18n-canonical)

透過新增適當的 canonical 標籤來防止重複內容懲罰。

**問題**：搜尋引擎將翻譯頁面視為重複內容：
- `/2025/10/Article-Title/`（英文）
- `/zh-TW/2025/10/Article-Title/`（中文）
- `/ja/2025/10/Article-Title/`（日文）

沒有 canonical 標籤，Google 可能會：
- 在翻譯版本間分散排名訊號
- 索引錯誤的語言版本
- 因「重複」內容而懲罰網站

**解決方案**：Canonical 標籤告訴搜尋引擎哪個版本是主要版本：

```html
<!-- 所有語言版本都指向英文作為 canonical -->
<link rel="canonical" href="https://neo01.com/2025/10/Article-Title/" />
```

```yaml
canonical_multilang:
  enable: true
  default_lang: en  # 主要語言
  languages:
    - en
    - zh-TW
    - zh-CN
    - ja
```

**結果**：搜尋引擎理解這些是翻譯版本而非重複內容，保留 SEO 價值。

## 透過片段快取優化效能

### 多語言效能挑戰

本網站支援 4 種語言（en、zh-TW、zh-CN、ja），這意味著：
- **4× 頁面生成**：每篇文章建立 4 個首頁條目、4 個歸檔頁面、4 個分類頁面、4 個標籤頁面
- **4× 模板渲染**：每種頁面類型的頁首、頁尾、側邊欄渲染 4 次
- **4× 記憶體使用**：每種語言維護獨立的頁面物件
- **指數成長**：100 篇文章 × 4 種語言 = 400+ 頁面（尚未計算歸檔/分類/標籤）

**一般規則**：對於 N 種語言，在沒有優化的情況下，預期 N× 建置時間與記憶體使用量。

### 片段快取解決方案

Hexo 的 `fragment_cache()` 函式儲存已渲染的模板內容並在頁面間重複使用。對於不會因頁面而改變的元件至關重要。

**關鍵原則**：依語言快取，而非全域快取。

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

**快取鍵策略**：
- `header-en`、`header-zh-TW`、`header-zh-CN`、`header-ja`（4 個快取條目）
- 每種語言獲得隔離的快取
- 在該語言的所有頁面間重複使用

### 要快取什麼

**頁首**（`layout.ejs`）：
```ejs
<%- fragment_cache('header-' + (page.lang || 'en'), function(){
    return partial('common/header');
}) %>
```
- 導覽、語言選擇器、標誌
- 4 個快取條目（每種語言一個）
- 在每種語言的 ~100+ 頁面間重複使用

**側邊欄**（`sidebar.ejs`）：
```ejs
<%- fragment_cache('sidebar-static-' + (page.lang || 'en'), function(){
    return partial('common/sidebar-static');
}) %>
```
- 社群連結、結構
- 小工具依語言分別快取

**小工具**（`sidebar-widgets.ejs`）：
```ejs
<%- fragment_cache('widget-recent_posts-' + (page.lang || 'en'), function(){
    return partial('widget/recent_posts');
}) %>
```
- 最近文章在模板中依語言過濾：
```ejs
<%_ site.posts.filter(function(post) { 
    return (post.lang || 'en') === currentLang; 
}).limit(5).each(function(post) { _%>
```
- 該語言的所有頁面顯示相同的 5 篇文章

**頁尾**（`footer.ejs`）：
```ejs
<%- fragment_cache('footer-static-' + (page.lang || 'en'), function(){
    return partial('common/footer-static');
}) %>
<%- partial('common/footer-dynamic') %>
```
- 靜態：版權、致謝（已快取）
- 動態：QR 碼（頁面專屬）

**腳本**（`layout.ejs`）：
```ejs
<%- fragment_cache('scripts-' + (page.lang || 'en'), function(){
    return partial('common/scripts');
}) %>
```
- JavaScript 引入依語言快取

### 設定需求

```yaml
# _config.yml
relative_link: false  # 安全快取所需
```

!!!warning "⚠️ 相對連結會破壞快取"
    片段快取會捕獲頁面物件。使用 `relative_link: true` 時，快取的內容包含錯誤的路徑。啟用快取時務必使用絕對路徑。

### 客戶端語言選擇器

伺服器端語言切換會因片段快取而失效。解決方案：基於 JavaScript 的 URL 生成。

```javascript
// 偵測當前路徑
var currentPath = window.location.pathname;
var basePath = currentPath.replace(/^\\/[a-z]{2}(-[A-Z]{2})?\\//, '/');

// 產生語言專屬 URL
document.querySelectorAll('[data-lang]').forEach(function(link) {
    var targetLang = link.getAttribute('data-lang');
    var targetUrl = targetLang === 'en' ? basePath : '/' + targetLang + basePath;
    link.href = targetUrl;
});
```

**優點**：
- 語言選擇器 HTML 依語言快取
- URL 從真實瀏覽器位置生成
- 無過時頁面物件問題

### 效能影響

**優化前**（本網站 4 種語言）：
- 建置時間：400+ 頁面（4 種語言 × 100+ 文章）約 1 分鐘
- 記憶體使用：高模板渲染開銷
- 每個頁面從頭渲染頁首/頁尾/側邊欄

**優化後**：
- 建置時間：約 40 秒（減少 60%）
- 記憶體使用：顯著降低
- 快取命中率：每種語言 80-95%

**本網站的數學**：
- 無快取：400 頁面 × 5 元件 = 2,000 次渲染
- 有快取：20 個快取條目（4 種語言 × 5 元件）+ 400 次動態渲染
- **一般公式**：每個元件 N 個快取條目，而非（頁面 × N）次渲染

## 內容管理工作流程

### 建立新文章

1. **先撰寫英文版本**（真實來源）：
```bash
hexo new post "Article Title"
# 建立：source/_posts/Article-Title.md
```

2. **新增語言中繼資料**：
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

3. **建立翻譯版本**，使用語言後綴：
```bash
# 在檔名中使用語言後綴
cp source/_posts/Article-Title.md source/_posts/Article-Title-zh-TW.md
cp source/_posts/Article-Title.md source/_posts/Article-Title-zh-CN.md
cp source/_posts/Article-Title.md source/_posts/Article-Title-ja.md
```

4. **更新翻譯中繼資料**（不需要 permalink）：
```yaml
---
title: "文章標題"
date: 2025-10-30
lang: zh-TW  # 修補程式自動產生：/zh-TW/2025/10/Article-Title/
categories: Development
tags:
  - Hexo
excerpt: "繁體中文摘要"
---
```

!!!tip "💡 自動 URL 生成"
    套用修補程式後：
    - `Article-Title-zh-TW.md` → `/zh-TW/2025/10/Article-Title/`
    - `Article-Title-ja.md` → `/ja/2025/10/Article-Title/`
    - 語言後綴自動從 URL 移除
    - 不需要手動 `permalink` 設定

### 處理未翻譯的內容

對於僅提供單一語言的內容，使用 `original_lang_url`：

```yaml
---
title: "CISP 認證"
date: 2025-10-30
lang: zh-TW
permalink: /zh-TW/2025/10/cisp-certification/
categories: Cybersecurity
original_lang_url: /zh-CN/2025/10/cisp-certification/
---
```

這會顯示重導向通知而非內容，引導讀者前往可用的語言版本。

## 資源管理

### 圖片與資產

**英文文章**：使用相對路徑
```markdown
![Diagram](diagram.png)
```

**翻譯文章**：使用絕對路徑指向英文資產
```markdown
![圖表](/2025/10/Article-Title/diagram.png)
```

**優點**：
- 無資產重複
- 單一真實來源
- 更易維護

### 內部連結

務必使用帶語言前綴的絕對路徑：

```markdown
<!-- 英文 -->
[Tools](/tools/)
[Previous Post](/2025/09/Previous-Article/)

<!-- 繁體中文 -->
[工具](/zh-TW/tools/)
[上一篇文章](/zh-TW/2025/09/Previous-Article/)
```

## SEO 考量

### 摘要管理

每種語言有不同的字元密度：

```yaml
excerpt_length:
  default: 200
  en: 200
  zh-TW: 100
  zh-CN: 100
  ja: 100
```

務必在 front matter 中提供手動摘要以獲得更好的控制：

```yaml
excerpt: "掌握 Hexo 多語言內容管理，透過自訂插件優化效能。"
```

### 分類翻譯

保持分類鍵為英文，翻譯顯示名稱：

```yaml
category_i18n:
  Development:
    en: "Development"
    zh-TW: "開發"
    zh-CN: "开发"
    ja: "開発"
```

### 標籤

**無論內容語言為何，務必使用英文標籤**：

```yaml
tags:
  - Hexo
  - i18n
  - Static Site
```

這確保跨語言的標籤頁面一致性。

## 額外的效能技巧

### 開發期間停用插件

許多 i18n 插件可在本地預覽期間停用以加速開發：

```yaml
# _config.yml
i18n_archive_generator:
  enable: false  # 預覽時停用
  
i18n_category_generator:
  enable: false  # 預覽時停用
  
i18n_tag_generator:
  enable: false  # 預覽時停用
  
sitemap_i18n:
  enable: false  # 預覽時停用
  
canonical_multilang:
  enable: false  # 預覽時停用
```

**部署前啟用**：
```bash
# 部署前將所有插件的 enable 設為 true
hexo clean && hexo generate
```

**優點**：
- 更快的本地建置（秒級 vs 分鐘級）
- 內容建立期間更快的迭代
- 僅在生產環境需要時才使用完整功能

!!!tip "💡 開發工作流程"
    在 `_config.yml` 中保持插件停用以進行日常工作。僅在 CI/CD 管線或手動部署前啟用它們。

## 疑難排解

### 出現錯誤語言的內容

**原因**：片段快取未使用語言專屬鍵

**解決方案**：驗證快取鍵包含 `page.lang`：
```ejs
<%- fragment_cache('component-' + (page.lang || 'en'), function(){
    return partial('common/component');
}) %>
```

### 語言選擇器顯示 404

**原因**：伺服器端路徑偵測與片段快取

**解決方案**：實作客戶端 URL 生成（見上方）

### 建置效能下降

**原因**：快取停用或 `relative_link: true`

**解決方案**：
1. 設定 `relative_link: false`
2. 清除快取：`hexo clean`
3. 重新生成：`hexo generate`

### 翻譯未出現

**原因**：缺少 `lang` 中繼資料或不正確的 permalink

**解決方案**：驗證 front matter 包含：
- `lang: zh-TW`（或適當的語言代碼）
- `permalink: /zh-TW/YYYY/MM/slug/`

## 結論

建立多語言 Hexo 部落格需要自訂插件與仔細的優化，但結果是一個快速、SEO 友善的網站，服務全球受眾。關鍵見解：

- **分離關注點**：文章集中化，頁面基於目錄
- **積極快取**：依語言的片段快取將建置時間減少 60%
- **客戶端增強**：JavaScript 處理動態元素而不破壞快取
- **一致的結構**：英文作為真實來源，翻譯遵循既定模式

此實作支援一個擁有 400+ 頁面、跨 4 種語言的部落格，在 2 分鐘內建置完成，同時維持優秀的效能與 SEO。

靜態網站生成的未來是多語言的，透過正確的架構，Hexo 可以提供世界級的結果。
