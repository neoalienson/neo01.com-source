---
title: "我开发的 Hexo 插件"
date: 2024-05-02
lang: zh-CN
category: Development
excerpt: "我开发的 Hexo 插件集合，用于增强静态博客的评论、GitHub 卡片等功能。"
thumbnail: /assets/hexo/thumbnail.png
---

使用 Hexo 构建静态网站并不意味着要牺牲交互性。我开发了几个插件来增强 Hexo 博客的评论、GitHub 集成和其他功能。

<div class="tools-grid">
  <a href="#hexo-plugin-commentbox" class="tool-card">
    <h3>💬 hexo-plugin-commentbox</h3>
    <p class="tool-description">将 commentbox.io 评论系统集成到你的 Hexo 博客文章中。无需服务器端基础设施即可添加社区互动。</p>
    <ul class="tool-features">
      <li>默认在所有页面启用</li>
      <li>通过 front matter 精细控制</li>
      <li>简单集成</li>
    </ul>
  </a>

  <a href="#hexo-plugin-cookieconsent" class="tool-card">
    <h3>🍪 hexo-plugin-cookieconsent</h3>
    <p class="tool-description">为你的 Hexo 网站添加符合 GDPR 的 Cookie 同意横幅。与 vanilla-cookieconsent 库的轻量级集成。</p>
    <ul class="tool-features">
      <li>可自定义的同意模态框</li>
      <li>多语言支持</li>
      <li>基于类别的 Cookie 管理</li>
    </ul>
  </a>

  <a href="#hexo-plugin-apache-echarts" class="tool-card">
    <h3>📊 hexo-plugin-apache-echarts</h3>
    <p class="tool-description">将交互式 Apache ECharts 可视化添加到你的 Hexo 文章中。使用简单的标签语法创建数据驱动的图表。</p>
    <ul class="tool-features">
      <li>交互式客户端图表</li>
      <li>基于 CDN 的库加载</li>
      <li>支持所有 ECharts 图表类型</li>
    </ul>
  </a>

  <a href="#hexo-plugin-i18n-canonical" class="tool-card">
    <h3>🌐 hexo-plugin-i18n-canonical</h3>
    <p class="tool-description">管理多语言网站的规范网址。自动添加 canonical 和 hreflang 标签以改善 SEO。</p>
    <ul class="tool-features">
      <li>自动 canonical 标签</li>
      <li>所有语言的 hreflang 标签</li>
      <li>改善多语言 SEO</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-sitemap" class="tool-card">
    <h3>🗺️ hexo-generator-i18n-sitemap</h3>
    <p class="tool-description">为多语言网站生成 sitemap.xml，具有适当的语言筛选。</p>
    <ul class="tool-features">
      <li>生成 sitemap.xml 和 sitemap.txt</li>
      <li>排除首页重复</li>
      <li>多语言支持</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-archive" class="tool-card">
    <h3>📚 hexo-generator-i18n-archive</h3>
    <p class="tool-description">为每种语言生成归档页面，具有适当的筛选。</p>
    <ul class="tool-features">
      <li>特定语言的归档</li>
      <li>按年、月、日组织</li>
      <li>支持分页</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-tag" class="tool-card">
    <h3>🏷️ hexo-generator-i18n-tag</h3>
    <p class="tool-description">为每种语言生成标签页面，具有筛选和排序。</p>
    <ul class="tool-features">
      <li>特定语言的标签页面</li>
      <li>重定向文章显示在最后</li>
      <li>支持分页</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-category" class="tool-card">
    <h3>📁 hexo-generator-i18n-category</h3>
    <p class="tool-description">为每种语言生成类别页面，具有筛选和排序。</p>
    <ul class="tool-features">
      <li>特定语言的类别页面</li>
      <li>重定向文章显示在最后</li>
      <li>支持分页</li>
    </ul>
  </a>

  <a href="#hexo-github-card-inline" class="tool-card">
    <h3>🎴 hexo-github-card-inline</h3>
    <p class="tool-description">在文章中内联渲染 GitHub 用户和仓库卡片。通过可视化、数据丰富的展示来展示个人资料和项目。</p>
    <ul class="tool-features">
      <li>带统计数据的用户资料卡片</li>
      <li>带指标的仓库卡片</li>
      <li>编程语言分布图表</li>
    </ul>
  </a>
</div>

---

## hexo-plugin-commentbox

[hexo-plugin-commentbox](https://github.com/neoalienson/hexo-plugin-commentbox)

### 功能特性

- **默认启用**：评论自动出现在所有页面
- **精细控制**：通过 front matter 在特定文章禁用评论
- **简单集成**：只需最少的配置

### 禁用评论

要在特定文章或页面禁用评论，在 front matter 中添加：

```yaml
---
title: 你的文章标题
comments: false
---
```

### 安全注意事项

!!!warning "⚠️ 外部脚本加载"
    此插件从 unpkg.com/commentbox.io 加载外部 JavaScript。请注意：

    - 外部脚本可以访问你的页面内容和用户数据
    - 脚本从 CDN 加载，没有子资源完整性（SRI）验证
    - 外部脚本的变更不在你的控制范围内
    - 考虑你网站的内容安全策略（CSP）要求
!!!

!!!anote "📝 免责声明"
    此项目与 commentbox.io 没有任何关联、认可或连接。这是一个独立插件，用于将 commentbox.io 服务集成到 Hexo 博客中。

---

## hexo-plugin-cookieconsent

[hexo-plugin-cookieconsent](https://github.com/neoalienson/hexo-plugin-cookieconsent)

一个 Hexo 插件，用于快速将 Cookie 同意功能添加到你的网站，使用轻量级的 [vanilla-cookieconsent](https://github.com/orestbida/cookieconsent) 库。

### 功能特性

- **符合 GDPR**：帮助满足欧盟 Cookie 同意要求
- **轻量级**：对网站性能影响最小
- **可自定义**：完全控制外观和行为
- **多语言**：内置多语言支持，可自动检测
- **类别管理**：按必要性、功能性和分析来组织 Cookie

### 配置示例

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

### Cookie 类别

!!!info "📋 类别类型"
    **必要 Cookie**（始终启用）
    网站功能所必需 - 安全性、导航和核心功能。

    **功能性 Cookie**
    记住用户偏好，如语言设置和登录详细信息。

    **分析 Cookie**
    帮助了解访客行为以改善网站性能。

### 使用场景

- **GDPR 合规**：满足欧洲隐私法规
- **用户透明度**：清楚传达 Cookie 使用情况
- **隐私控制**：让用户管理他们的 Cookie 偏好
- **多地区网站**：自动检测语言并显示适当的同意文字

!!!tip "💡 性能提示"
    设置 `injectJs: false` 并在主题中手动包含脚本，以更好地控制加载时机。

---

## hexo-plugin-apache-echarts

[hexo-plugin-apache-echarts](https://github.com/neoalienson/hexo-plugin-apache-echarts)

使用简单的标签语法将交互式 Apache ECharts 可视化添加到你的 Hexo 文章中。查看 [ECharts 图表库](https://echarts.apache.org/examples/zh/index.html)以获取图表示例。

### 功能特性

- **交互式客户端图表**：丰富、响应式的数据可视化
- **基于 CDN 的 ECharts 库加载**：无需本地依赖
- **可配置的 ID 生成**：随机或基于哈希的图表 ID
- **自动 ECharts 脚本注入**：无需手动设置
- **支持所有 ECharts 图表类型**：柱状图、折线图、饼图、散点图等

### 配置示例

```yaml
echarts:
  enable: true
  js_url: /cache/echarts.min.local.js
  id_generation: 'hash'
```

---

## hexo-plugin-i18n-canonical

[hexo-plugin-i18n-canonical](https://github.com/neoalienson/hexo-plugin-i18n-canonical)

用于管理多语言网站规范网址的 Hexo 插件。

### 功能特性

- **自动添加 canonical 标签**：为所有页面提供正确的 SEO
- **自动添加 hreflang 标签**：为所有语言变体
- **将翻译内容指向原始语言**：默认：英语
- **支持自定义规范语言**：通过 canonical_lang front matter
- **支持 zh-TW、zh-CN 和 ja 翻译**：内置多语言支持
- **跳过已有 canonical 标签的页面**：防止重复
- **改善多语言内容的 SEO**：更好的搜索引擎索引

---

## hexo-generator-i18n-sitemap

[hexo-generator-i18n-sitemap](https://github.com/neoalienson/hexo-generator-i18n-sitemap)

为多语言网站生成 sitemap.xml。

### 功能特性

- **生成 sitemap.xml 和 sitemap.txt**：包含所有页面和文章
- **排除首页 index.html 重复**：更清晰的 sitemap 结构

---

## hexo-generator-i18n-archive

[hexo-generator-i18n-archive](https://github.com/neoalienson/hexo-generator-i18n-archive)

为每种语言生成归档页面。

### 功能特性

- **为每种语言生成归档页面**：特定语言筛选
- **按语言筛选文章**：仅显示相关文章
- **按年、月、日组织文章**：时间顺序组织
- **支持分页**：处理大型归档
- **可通过配置开关**：性能控制

---

## hexo-generator-i18n-tag

[hexo-generator-i18n-tag](https://github.com/neoalienson/hexo-generator-i18n-tag)

为每种语言生成标签页面，具有筛选和排序。

### 功能特性

- **为每种语言生成标签页面**：特定语言筛选
- **按语言筛选文章**：仅显示相关文章
- **重定向文章显示在最后**：更好的用户体验
- **支持分页**：处理大型标签集合
- **可通过配置开关**：性能控制

---

## hexo-generator-i18n-category

[hexo-generator-i18n-category](https://github.com/neoalienson/hexo-generator-i18n-category)

为每种语言生成类别页面，具有筛选和排序。

### 功能特性

- **为每种语言生成类别页面**：特定语言筛选
- **按语言筛选文章**：仅显示相关文章
- **重定向文章显示在最后**：更好的用户体验
- **支持分页**：处理大型类别集合
- **可通过配置开关**：性能控制

---

## hexo-github-card-inline

[hexo-github-card-inline](https://github.com/neoalienson/hexo-github-card-inline)

### 用户卡片

显示包含统计数据和编程语言分布的完整 GitHub 用户资料：

```
{% raw %}{% githubCard user:neoalienson %}{% endraw %}
```

卡片显示：

- 📍 位置
- 🔗 网站
- 📁 仓库数量
- ⭐ 总星标数
- 📈 提交数
- 👥 关注者
- 🔄 拉取请求
- ❗ 议题
- 编程语言分布图表

### 仓库卡片

展示特定仓库的关键指标：

```
{% raw %}{% githubCard user:neoalienson repo:pachinko %}{% endraw %}
```

卡片显示：

- 📖 仓库名称和描述
- ⭐ 星标数
- 🍴 分支数
- 主要编程语言

这些插件是开源的，可在 GitHub 上获取。本网站使用这些插件构建。安装说明和配置详情可在各个仓库中找到。欢迎贡献、提出议题和反馈。

<link rel="stylesheet" href="/tools/tools.css">
