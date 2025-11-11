---
title: "我開發的 Hexo 插件"
date: 2024-05-02
lang: zh-TW
category: Development
excerpt: "我開發的 Hexo 插件集合，用於增強靜態部落格的留言、GitHub 卡片等功能。"
thumbnail: /assets/hexo/thumbnail.png
---

使用 Hexo 建立靜態網站並不意味著要犧牲互動性。我開發了幾個插件來增強 Hexo 部落格的留言、GitHub 整合和其他功能。

<div class="tools-grid">
  <a href="#hexo-plugin-commentbox" class="tool-card">
    <h3>💬 hexo-plugin-commentbox</h3>
    <p class="tool-description">將 commentbox.io 留言系統整合到你的 Hexo 部落格文章中。無需伺服器端基礎設施即可新增社群互動。</p>
    <ul class="tool-features">
      <li>預設在所有頁面啟用</li>
      <li>透過 front matter 精細控制</li>
      <li>簡單整合</li>
    </ul>
  </a>

  <a href="#hexo-plugin-cookieconsent" class="tool-card">
    <h3>🍪 hexo-plugin-cookieconsent</h3>
    <p class="tool-description">為你的 Hexo 網站新增符合 GDPR 的 Cookie 同意橫幅。與 vanilla-cookieconsent 函式庫的輕量級整合。</p>
    <ul class="tool-features">
      <li>可自訂的同意模態框</li>
      <li>多語言支援</li>
      <li>基於類別的 Cookie 管理</li>
    </ul>
  </a>

  <a href="#hexo-plugin-apache-echarts" class="tool-card">
    <h3>📊 hexo-plugin-apache-echarts</h3>
    <p class="tool-description">將互動式 Apache ECharts 視覺化新增到你的 Hexo 文章中。使用簡單的標籤語法建立資料驅動的圖表。</p>
    <ul class="tool-features">
      <li>互動式客戶端圖表</li>
      <li>基於 CDN 的函式庫載入</li>
      <li>支援所有 ECharts 圖表類型</li>
    </ul>
  </a>

  <a href="#hexo-plugin-i18n-canonical" class="tool-card">
    <h3>🌐 hexo-plugin-i18n-canonical</h3>
    <p class="tool-description">管理多語言網站的規範網址。自動新增 canonical 和 hreflang 標籤以改善 SEO。</p>
    <ul class="tool-features">
      <li>自動 canonical 標籤</li>
      <li>所有語言的 hreflang 標籤</li>
      <li>改善多語言 SEO</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-sitemap" class="tool-card">
    <h3>🗺️ hexo-generator-i18n-sitemap</h3>
    <p class="tool-description">為多語言網站生成 sitemap.xml，具有適當的語言篩選。</p>
    <ul class="tool-features">
      <li>生成 sitemap.xml 和 sitemap.txt</li>
      <li>排除首頁重複</li>
      <li>多語言支援</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-archive" class="tool-card">
    <h3>📚 hexo-generator-i18n-archive</h3>
    <p class="tool-description">為每種語言生成存檔頁面，具有適當的篩選。</p>
    <ul class="tool-features">
      <li>特定語言的存檔</li>
      <li>按年、月、日組織</li>
      <li>支援分頁</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-tag" class="tool-card">
    <h3>🏷️ hexo-generator-i18n-tag</h3>
    <p class="tool-description">為每種語言生成標籤頁面，具有篩選和排序。</p>
    <ul class="tool-features">
      <li>特定語言的標籤頁面</li>
      <li>重定向文章顯示在最後</li>
      <li>支援分頁</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-category" class="tool-card">
    <h3>📁 hexo-generator-i18n-category</h3>
    <p class="tool-description">為每種語言生成類別頁面，具有篩選和排序。</p>
    <ul class="tool-features">
      <li>特定語言的類別頁面</li>
      <li>重定向文章顯示在最後</li>
      <li>支援分頁</li>
    </ul>
  </a>

  <a href="#hexo-github-card-inline" class="tool-card">
    <h3>🎴 hexo-github-card-inline</h3>
    <p class="tool-description">在文章中內嵌渲染 GitHub 使用者和儲存庫卡片。透過視覺化、資料豐富的展示來展示個人檔案和專案。</p>
    <ul class="tool-features">
      <li>帶統計資料的使用者檔案卡片</li>
      <li>帶指標的儲存庫卡片</li>
      <li>程式語言分布圖表</li>
    </ul>
  </a>
</div>

---

## hexo-plugin-commentbox

[hexo-plugin-commentbox](https://github.com/neoalienson/hexo-plugin-commentbox)

### 功能特性

- **預設啟用**：留言自動出現在所有頁面
- **精細控制**：透過 front matter 在特定文章停用留言
- **簡單整合**：只需最少的設定

### 停用留言

要在特定文章或頁面停用留言，在 front matter 中新增：

```yaml
---
title: 你的文章標題
comments: false
---
```

### 安全注意事項

!!!warning "⚠️ 外部指令碼載入"
    此插件從 unpkg.com/commentbox.io 載入外部 JavaScript。請注意：

    - 外部指令碼可以存取你的頁面內容和使用者資料
    - 指令碼從 CDN 載入，沒有子資源完整性（SRI）驗證
    - 外部指令碼的變更不在你的控制範圍內
    - 考慮你網站的內容安全政策（CSP）要求
!!!

!!!anote "📝 免責聲明"
    此專案與 commentbox.io 沒有任何關聯、認可或連結。這是一個獨立插件，用於將 commentbox.io 服務整合到 Hexo 部落格中。

---

## hexo-plugin-cookieconsent

[hexo-plugin-cookieconsent](https://github.com/neoalienson/hexo-plugin-cookieconsent)

一個 Hexo 插件，用於快速將 Cookie 同意功能新增到你的網站，使用輕量級的 [vanilla-cookieconsent](https://github.com/orestbida/cookieconsent) 函式庫。

### 功能特性

- **符合 GDPR**：協助滿足歐盟 Cookie 同意要求
- **輕量級**：對網站效能影響最小
- **可自訂**：完全控制外觀和行為
- **多語言**：內建多語言支援，可自動偵測
- **類別管理**：按必要性、功能性和分析來組織 Cookie

### 設定範例

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

### Cookie 類別

!!!info "📋 類別類型"
    **必要 Cookie**（始終啟用）
    網站功能所必需 - 安全性、導航和核心功能。

    **功能性 Cookie**
    記住使用者偏好，如語言設定和登入詳細資訊。

    **分析 Cookie**
    協助了解訪客行為以改善網站效能。

### 使用場景

- **GDPR 合規**：滿足歐洲隱私法規
- **使用者透明度**：清楚傳達 Cookie 使用情況
- **隱私控制**：讓使用者管理他們的 Cookie 偏好
- **多地區網站**：自動偵測語言並顯示適當的同意文字

!!!tip "💡 效能提示"
    設定 `injectJs: false` 並在主題中手動包含指令碼，以更好地控制載入時機。

---

## hexo-plugin-apache-echarts

[hexo-plugin-apache-echarts](https://github.com/neoalienson/hexo-plugin-apache-echarts)

使用簡單的標籤語法將互動式 Apache ECharts 視覺化新增到你的 Hexo 文章中。查看 [ECharts 圖表庫](https://echarts.apache.org/examples/zh/index.html)以獲取圖表範例。

### 功能特性

- **互動式客戶端圖表**：豐富、響應式的資料視覺化
- **基於 CDN 的 ECharts 函式庫載入**：無需本地依賴
- **可設定的 ID 生成**：隨機或基於雜湊的圖表 ID
- **自動 ECharts 指令碼注入**：無需手動設定
- **支援所有 ECharts 圖表類型**：長條圖、折線圖、圓餅圖、散點圖等

### 設定範例

```yaml
echarts:
  enable: true
  js_url: /cache/echarts.min.local.js
  id_generation: 'hash'
```

---

## hexo-plugin-i18n-canonical

[hexo-plugin-i18n-canonical](https://github.com/neoalienson/hexo-plugin-i18n-canonical)

用於管理多語言網站規範網址的 Hexo 插件。

### 功能特性

- **自動新增 canonical 標籤**：為所有頁面提供正確的 SEO
- **自動新增 hreflang 標籤**：為所有語言變體
- **將翻譯內容指向原始語言**：預設：英語
- **支援自訂規範語言**：透過 canonical_lang front matter
- **支援 zh-TW、zh-CN 和 ja 翻譯**：內建多語言支援
- **跳過已有 canonical 標籤的頁面**：防止重複
- **改善多語言內容的 SEO**：更好的搜尋引擎索引

---

## hexo-generator-i18n-sitemap

[hexo-generator-i18n-sitemap](https://github.com/neoalienson/hexo-generator-i18n-sitemap)

為多語言網站生成 sitemap.xml。

### 功能特性

- **生成 sitemap.xml 和 sitemap.txt**：包含所有頁面和文章
- **排除首頁 index.html 重複**：更清晰的 sitemap 結構

---

## hexo-generator-i18n-archive

[hexo-generator-i18n-archive](https://github.com/neoalienson/hexo-generator-i18n-archive)

為每種語言生成存檔頁面。

### 功能特性

- **為每種語言生成存檔頁面**：特定語言篩選
- **按語言篩選文章**：僅顯示相關文章
- **按年、月、日組織文章**：時間順序組織
- **支援分頁**：處理大型存檔
- **可透過設定開關**：效能控制

---

## hexo-generator-i18n-tag

[hexo-generator-i18n-tag](https://github.com/neoalienson/hexo-generator-i18n-tag)

為每種語言生成標籤頁面，具有篩選和排序。

### 功能特性

- **為每種語言生成標籤頁面**：特定語言篩選
- **按語言篩選文章**：僅顯示相關文章
- **重定向文章顯示在最後**：更好的使用者體驗
- **支援分頁**：處理大型標籤集合
- **可透過設定開關**：效能控制

---

## hexo-generator-i18n-category

[hexo-generator-i18n-category](https://github.com/neoalienson/hexo-generator-i18n-category)

為每種語言生成類別頁面，具有篩選和排序。

### 功能特性

- **為每種語言生成類別頁面**：特定語言篩選
- **按語言篩選文章**：僅顯示相關文章
- **重定向文章顯示在最後**：更好的使用者體驗
- **支援分頁**：處理大型類別集合
- **可透過設定開關**：效能控制

---

## hexo-github-card-inline

[hexo-github-card-inline](https://github.com/neoalienson/hexo-github-card-inline)

### 使用者卡片

顯示包含統計資料和程式語言分布的完整 GitHub 使用者檔案：

```
{% raw %}{% githubCard user:neoalienson %}{% endraw %}
```

卡片顯示：

- 📍 位置
- 🔗 網站
- 📁 儲存庫數量
- ⭐ 總星標數
- 📈 提交數
- 👥 追蹤者
- 🔄 拉取請求
- ❗ 議題
- 程式語言分布圖表

### 儲存庫卡片

展示特定儲存庫的關鍵指標：

```
{% raw %}{% githubCard user:neoalienson repo:pachinko %}{% endraw %}
```

卡片顯示：

- 📖 儲存庫名稱和描述
- ⭐ 星標數
- 🍴 分支數
- 主要程式語言

這些插件是開源的，可在 GitHub 上取得。本網站使用這些插件建置。安裝說明和設定詳情可在各個儲存庫中找到。歡迎貢獻、提出議題和回饋。

<link rel="stylesheet" href="/tools/tools.css">
