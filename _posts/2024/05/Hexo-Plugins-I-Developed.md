---
title: "Hexo Plugins I Developed"
date: 2024-05-02
lang: en
category: Development
excerpt: "A collection of Hexo plugins I developed to enhance static blogs with comments, GitHub cards, and more functionality."
thumbnail: /assets/hexo/thumbnail.png
---

Building a static site with Hexo doesn't mean sacrificing interactivity. I developed several plugins to enhance Hexo blogs with comments, GitHub integration, and other features.

<div class="tools-grid">
  <a href="#hexo-plugin-commentbox" class="tool-card">
    <h3>💬 hexo-plugin-commentbox</h3>
    <p class="tool-description">Integrate commentbox.io commenting system into your Hexo blog posts. Add community engagement without server-side infrastructure.</p>
    <ul class="tool-features">
      <li>Enabled by default on all pages</li>
      <li>Granular control via front matter</li>
      <li>Simple integration</li>
    </ul>
  </a>

  <a href="#hexo-plugin-cookieconsent" class="tool-card">
    <h3>🍪 hexo-plugin-cookieconsent</h3>
    <p class="tool-description">Add GDPR-compliant cookie consent banner to your Hexo site. Lightweight integration with vanilla-cookieconsent library.</p>
    <ul class="tool-features">
      <li>Customizable consent modal</li>
      <li>Multi-language support</li>
      <li>Category-based cookie management</li>
    </ul>
  </a>

  <a href="#hexo-plugin-apache-echarts" class="tool-card">
    <h3>📊 hexo-plugin-apache-echarts</h3>
    <p class="tool-description">Add interactive Apache ECharts visualizations to your Hexo posts. Create data-driven charts with simple tag syntax.</p>
    <ul class="tool-features">
      <li>Interactive client-side charts</li>
      <li>CDN-based library loading</li>
      <li>All ECharts chart types supported</li>
    </ul>
  </a>

  <a href="#hexo-plugin-i18n-canonical" class="tool-card">
    <h3>🌐 hexo-plugin-i18n-canonical</h3>
    <p class="tool-description">Manage canonical URLs for multilingual sites. Automatically adds canonical and hreflang tags for better SEO.</p>
    <ul class="tool-features">
      <li>Automatic canonical tags</li>
      <li>Hreflang tags for all languages</li>
      <li>Improves multilingual SEO</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-sitemap" class="tool-card">
    <h3>🗺️ hexo-generator-i18n-sitemap</h3>
    <p class="tool-description">Generate sitemap.xml for multilingual sites with proper language filtering.</p>
    <ul class="tool-features">
      <li>Generates sitemap.xml and sitemap.txt</li>
      <li>Excludes homepage duplicates</li>
      <li>Multilingual support</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-archive" class="tool-card">
    <h3>📚 hexo-generator-i18n-archive</h3>
    <p class="tool-description">Generate archive pages for each language with proper filtering.</p>
    <ul class="tool-features">
      <li>Language-specific archives</li>
      <li>Year, month, day organization</li>
      <li>Pagination support</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-tag" class="tool-card">
    <h3>🏷️ hexo-generator-i18n-tag</h3>
    <p class="tool-description">Generate tag pages for each language with filtering and sorting.</p>
    <ul class="tool-features">
      <li>Language-specific tag pages</li>
      <li>Redirect posts appear last</li>
      <li>Pagination support</li>
    </ul>
  </a>

  <a href="#hexo-generator-i18n-category" class="tool-card">
    <h3>📁 hexo-generator-i18n-category</h3>
    <p class="tool-description">Generate category pages for each language with filtering and sorting.</p>
    <ul class="tool-features">
      <li>Language-specific category pages</li>
      <li>Redirect posts appear last</li>
      <li>Pagination support</li>
    </ul>
  </a>

  <a href="#hexo-github-card-inline" class="tool-card">
    <h3>🎴 hexo-github-card-inline</h3>
    <p class="tool-description">Render GitHub user and repository cards inline within your posts. Showcase profiles and projects with visual, data-rich representations.</p>
    <ul class="tool-features">
      <li>User profile cards with statistics</li>
      <li>Repository cards with metrics</li>
      <li>Language distribution charts</li>
    </ul>
  </a>
</div>

---

## hexo-plugin-commentbox

[hexo-plugin-commentbox](https://github.com/neoalienson/hexo-plugin-commentbox)

### Security Considerations

!!!warning "⚠️ External Script Loading"
    This plugin loads external JavaScript from unpkg.com/commentbox.io. Be aware:

    - External scripts can access your page content and user data
    - The script is loaded from a CDN without Subresource Integrity (SRI) verification
    - Changes to the external script are outside your control
    - Consider your site's Content Security Policy (CSP) requirements


!!!anote "📝 Disclaimer"
    This project is not affiliated with, endorsed by, or connected to commentbox.io in any way. It is an independent plugin created to integrate the commentbox.io service into Hexo blogs.

---

## hexo-plugin-cookieconsent

[hexo-plugin-cookieconsent](https://github.com/neoalienson/hexo-plugin-cookieconsent)

A Hexo plugin for quickly adding cookie consent functionality to your website using the lightweight [vanilla-cookieconsent](https://github.com/orestbida/cookieconsent) library.

### Features

- **GDPR Compliant**: Helps meet EU cookie consent requirements
- **Lightweight**: Minimal performance impact on your site
- **Customizable**: Full control over appearance and behavior
- **Multi-language**: Built-in support for multiple languages with auto-detection
- **Category Management**: Organize cookies by necessity, functionality, and analytics

### Configuration Example

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

### Cookie Categories

!!!info "📋 Category Types"
    **Necessary Cookies** (Always enabled)
    Essential for site functionality - security, navigation, and core features.

    **Functionality Cookies**
    Remember user preferences like language settings and login details.

    **Analytics Cookies**
    Help understand visitor behavior to improve site performance.

### Use Cases

- **GDPR Compliance**: Meet European privacy regulations
- **User Transparency**: Clearly communicate cookie usage
- **Privacy Control**: Let users manage their cookie preferences
- **Multi-region Sites**: Auto-detect language and show appropriate consent text

!!!tip "💡 Performance Tip"
    Set `injectJs: false` and manually include the script in your theme for better control over loading timing.

---

## hexo-plugin-apache-echarts

[hexo-plugin-apache-echarts](https://github.com/neoalienson/hexo-plugin-apache-echarts)

Add interactive Apache ECharts visualizations to your Hexo posts with simple tag syntax. View the [ECharts gallery](https://echarts.apache.org/examples/en/index.html) for chart examples.

### Features

- **Interactive client-side charts**: Rich, responsive data visualizations
- **CDN-based ECharts library loading**: No local dependencies required
- **Configurable ID generation**: Random or hash-based chart IDs
- **Automatic ECharts script injection**: Zero manual setup
- **Support for all ECharts chart types**: Bar, line, pie, scatter, and more

### Configuration Example

```yaml
echarts:
  enable: true
  js_url: /cache/echarts.min.local.js
  id_generation: 'hash'
```

---

## hexo-plugin-i18n-canonical

[hexo-plugin-i18n-canonical](https://github.com/neoalienson/hexo-plugin-i18n-canonical)

Hexo plugin to manage canonical URLs for multilingual sites.

### Features

- **Automatically adds canonical tags**: To all pages for proper SEO
- **Automatically adds hreflang tags**: For all language variants
- **Points translated content to source language**: Default: English
- **Supports custom canonical language**: Via canonical_lang front matter
- **Supports zh-TW, zh-CN, and ja translations**: Built-in multilingual support
- **Skips pages with existing canonical tags**: Prevents duplication
- **Improves SEO for multilingual content**: Better search engine indexing

---

## hexo-generator-i18n-sitemap

[hexo-generator-i18n-sitemap](https://github.com/neoalienson/hexo-generator-i18n-sitemap)

Generates sitemap.xml for multilingual sites.

### Features

- **Generates sitemap.xml and sitemap.txt**: With all pages and posts
- **Excludes homepage index.html duplicates**: Cleaner sitemap structure

---

## hexo-generator-i18n-archive

[hexo-generator-i18n-archive](https://github.com/neoalienson/hexo-generator-i18n-archive)

Generates archive pages for each language.

### Features

- **Generates archive pages for each language**: Language-specific filtering
- **Filters posts by language**: Only shows relevant posts
- **Organizes posts by year, month, and day**: Chronological organization
- **Supports pagination**: Handle large archives
- **Can be toggled on/off via configuration**: Performance control

---

## hexo-generator-i18n-tag

[hexo-generator-i18n-tag](https://github.com/neoalienson/hexo-generator-i18n-tag)

Generates tag pages for each language with filtering and sorting.

### Features

- **Generates tag pages for each language**: Language-specific filtering
- **Filters posts by language**: Only shows relevant posts
- **Sorts posts with redirect posts appearing last**: Better user experience
- **Supports pagination**: Handle large tag collections
- **Can be toggled on/off via configuration**: Performance control

---

## hexo-generator-i18n-category

[hexo-generator-i18n-category](https://github.com/neoalienson/hexo-generator-i18n-category)

Generates category pages for each language with filtering and sorting.

### Features

- **Generates category pages for each language**: Language-specific filtering
- **Filters posts by language**: Only shows relevant posts
- **Sorts posts with redirect posts appearing last**: Better user experience
- **Supports pagination**: Handle large category collections
- **Can be toggled on/off via configuration**: Performance control

---

## hexo-github-card-inline

[hexo-github-card-inline](https://github.com/neoalienson/hexo-github-card-inline)

### User Cards

Display comprehensive GitHub user profiles with statistics and language breakdown:

{% githubCard user:neoalienson %}

### Repository Cards

Showcase specific repositories with key metrics:

{% githubCard user:neoalienson repo:pachinko %}


These plugins are open source and available on GitHub. This website is built with these plugins. Installation instructions and configuration details can be found in each repository. Contributions, issues, and feedback are welcome.

<link rel="stylesheet" href="/tools/tools.css">
