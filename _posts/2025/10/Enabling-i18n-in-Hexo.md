---
title: "Enabling i18n in Hexo: A Complete Guide to Multilingual Blogging"
date: 2025-10-30
lang: en
categories: Development
tags:
  - Hexo
  - i18n
  - Static Site
excerpt: "Master multilingual content management in Hexo with custom plugins, URL strategies, and performance optimization through fragment caching."
thumbnail: /assets/hexo/thumbnail.png
---

Building a multilingual blog isn't just about translating content—it's about creating a seamless experience across languages while maintaining performance and SEO. This guide walks through the complete i18n implementation used on this website, from URL structure to caching strategies.

## What is Hexo?

[Hexo](https://hexo.io/) is a fast, simple, and powerful static site generator built on Node.js. It transforms Markdown files into a complete website with:

- **Lightning-fast generation**: Hundreds of files in seconds
- **Markdown support**: Write content in plain text with formatting
- **Extensible plugins**: Rich ecosystem for added functionality
- **Theme system**: Customizable templates and layouts
- **Git-friendly**: Version control your entire site

**Perfect for**:
- Technical blogs with code examples
- Documentation sites
- Personal portfolios
- Multilingual content (with proper setup)

**Installation**:
```bash
npm install -g hexo-cli
hexo init my-blog
cd my-blog
npm install
hexo server
```

!!!info "📌 Version Note"
    This guide is based on **Hexo 8.1.0 or above**. Permalink behavior and filter hooks may differ in earlier versions.

## The Challenge of Hexo i18n

### What Hexo Provides

Hexo has basic i18n support for **theme translations only**:

```yaml
# _config.yml
language:
  - en
  - zh-TW
  - zh-CN
  - ja

i18n_dir: :lang  # Detects language from URL path
```

**Language files** (theme translations):
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

**Templates** use helpers:
```ejs
<%= __('menu.home') %>  <!-- Outputs: Home or 首頁 -->
```

**Path detection**:
```yaml
i18n_dir: :lang  # Detects language from first URL segment
```

Examples:
- `/index.html` → `en` (default)
- `/zh-tw/index.html` → `zh-tw`
- `/archives/index.html` → `en` (not detected as language)

### The Problems

Hexo's native i18n **only translates UI text**, not content:

**❌ No content filtering**:
- Index page shows all posts regardless of language
- Archives mix English and Chinese posts together
- Categories/tags don't filter by language

**❌ No language-specific generators**:
- `/archives/` shows posts from all languages
- `/categories/Development/` mixes all language versions
- No way to generate `/zh-TW/archives/` separately

**❌ No SEO support**:
- No canonical tags for translations
- No language-specific sitemaps
- Search engines see duplicate content

**❌ Posts require workaround** (Tested in Hexo 8.1.0):
- Hexo's permalink system applies the default pattern (`:title/`) before any filters can intercept
- The `post_permalink` filter only runs when `__permalink` is already set from front matter
- The processor converts `permalink` → `__permalink` during file reading, too early for custom logic
- Virtual `path` property can't be modified after generation starts
- **Solution**: Patch Hexo's `post_permalink.js` filter to auto-inject language prefix and strip language suffix

### What's Needed

Creating a truly multilingual blog requires:

- Language-specific URLs for all content types
- Separate index/archive/category/tag pages per language
- Proper sitemap generation with all languages
- Canonical tags to prevent duplicate content penalties
- Performance optimization to handle multiple languages (this site supports 4: en, zh-TW, zh-CN, ja)

## URL Structure Strategy

### Posts vs Pages: Different Approaches

**Blog Posts** with automatic language handling:
- Can be organized anywhere: `source/_posts/`, `source/zh-TW/_posts/`, etc.
- Use filename suffix convention: `Article-Title-ja.md`, `Article-Title-zh-TW.md`
- Language identified by `lang` field in front matter
- **Patch auto-generates** language-prefixed URLs without suffix duplication

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

**Result**: `Article-Title-zh-TW.md` → `/zh-TW/2025/10/Article-Title/` (suffix stripped)

**Pages** use directory-based organization:
- English: `source/tools/index.md` → `/tools/`
- Chinese: `source/zh-TW/tools/index.md` → `/zh-TW/tools/`
- Japanese: `source/ja/tools/index.md` → `/ja/tools/`

```yaml
---
title: 工具
layout: tools
lang: zh-TW
---
```

!!!warning "⚠️ Hexo Core Patch Required for Posts"
    **Why posts need a patch**: Posts use the `post_permalink` filter which applies patterns before language detection. Pages use a different processor that respects directory structure directly.
    
    **The problem**: Hexo's permalink system is deeply integrated into the post processor:
    
    1. Processor reads file and converts `permalink` → `__permalink`
    2. Default permalink pattern (`:title/`) applied immediately
    3. `post_permalink` filter only runs if `__permalink` exists
    4. Virtual `path` property computed from filter, can't be modified
    
    **The solution**: Patch `node_modules/hexo/dist/plugins/filter/post_permalink.js` to:
    - Extract `lang` field from post data
    - Strip `-{lang}` suffix from slug (e.g., `Article-Title-ja` → `Article-Title`)
    - Auto-inject `/{lang}/` prefix for non-default languages
    - Handle both manual and generated permalinks
    
    **Why pages don't need the patch**: Pages use directory-based organization that Hexo's native `i18n_dir: :lang` handles automatically. The patch only affects post processing.
    
    **See**: [Hexo i18n Permalink Patch](#hexo-core-patch) section below for implementation.

### Configuration

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

## Hexo Core Patch

### The Automatic Permalink Solution

To eliminate manual permalink configuration, patch Hexo's core permalink filter:

**File**: `node_modules/hexo/dist/plugins/filter/post_permalink.js`

```javascript
function postPermalinkFilter(data) {
  // Extract language and clean slug
  const lang = data.lang || 'en';
  const defaultLang = this.config.language?.[0] || 'en';
  
  // Strip language suffix from slug if present
  let cleanSlug = data.slug;
  const langPattern = new RegExp(`-(${this.config.language?.join('|')})$`);
  if (langPattern.test(cleanSlug)) {
    cleanSlug = cleanSlug.replace(langPattern, '');
  }
  
  const meta = {
    id: data.id,
    title: cleanSlug,  // Use cleaned slug
    name: cleanSlug,   // Use cleaned slug
    post_title: data.title,
    year: data.date.format('YYYY'),
    month: data.date.format('MM'),
    day: data.date.format('DD'),
    i_month: data.date.format('M'),
    i_day: data.date.format('D')
  };
  
  // Handle manual permalink
  if (data.__permalink) {
    let permalink = this.renderSync(data.__permalink, meta);
    // Inject language prefix for non-default languages
    if (lang !== defaultLang && !permalink.startsWith(`/${lang}/`)) {
      permalink = `/${lang}${permalink.startsWith('/') ? '' : '/'}${permalink}`;
    }
    return permalink;
  }
  
  // Handle generated permalink
  let permalink = this.renderSync(this.config.permalink, meta);
  // Inject language prefix for non-default languages
  if (lang !== defaultLang) {
    permalink = `/${lang}${permalink.startsWith('/') ? '' : '/'}${permalink}`;
  }
  return permalink;
}
```

### Why Patching Is Not Ideal

!!!warning "⚠️ Patching Drawbacks"
    **Maintenance burden**:
    - Breaks after every Hexo upgrade
    - Requires reapplication with `npm install`
    - May conflict with future Hexo changes
    - Team members must remember to apply patches
    
    **Fragility**:
    - Hexo's internal structure could change
    - Patch file format is brittle
    - No guarantee of compatibility across versions
    - Debugging becomes harder when core is modified
    
    **Better approach**: Propose the feature to Hexo's maintainers

!!!tip "💡 Contributing to Open Source"
    **Instead of patching, consider**:
    
    1. **Open a GitHub issue**: Describe the i18n permalink use case
    2. **Propose a solution**: Share your patch as a starting point
    3. **Submit a pull request**: Contribute the feature upstream
    4. **Benefits**:
       - Feature maintained by Hexo team
       - Works out-of-the-box for everyone
       - No patch maintenance burden
       - Community testing and improvements
    
    **Hexo repository**: [hexojs/hexo](https://github.com/hexojs/hexo)
    
    **Until then**: Use patches as a temporary workaround, but plan to migrate once official support exists.

### Applying the Patch

**Option 1: Manual patch** (requires reapplication after `npm install`):
```bash
cd hexo-blog
patch -p0 < ../patches/hexo-i18n-post-permalink.patch
```

**Option 2: Post-install script** (automatic):
```json
// package.json
{
  "scripts": {
    "postinstall": "patch -p0 < ../patches/hexo-i18n-post-permalink.patch || true"
  }
}
```

**Patch files**:
- `patches/hexo-i18n-post-permalink.patch` - For blog posts
- `patches/hexo-i18n-page-permalink.patch` - For pages (optional)

### How It Works

**Before patch**:
- Filename: `Tools-Games-ja.md`
- Generated URL: `/ja/2025/10/Tools-Games-ja/` ❌ (suffix duplicated)

**After patch**:
- Filename: `Tools-Games-ja.md`
- Generated URL: `/ja/2025/10/Tools-Games/` ✅ (suffix stripped)

**Key features**:
1. **Language detection**: Reads `lang` field from front matter
2. **Suffix stripping**: Removes `-ja`, `-zh-TW`, `-zh-CN` from slugs
3. **Prefix injection**: Adds `/{lang}/` for non-default languages
4. **Manual override**: Respects explicit `permalink` in front matter

!!!tip "💡 Filename Convention"
    Use language suffix in filenames for organization:
    - `Article-Title.md` (English)
    - `Article-Title-zh-TW.md` (Traditional Chinese)
    - `Article-Title-zh-CN.md` (Simplified Chinese)
    - `Article-Title-ja.md` (Japanese)
    
    The patch automatically strips suffixes from URLs.

### Could You Patch Pages Too?

Technically yes, but unnecessary. The directory-based approach for pages:

- **Works out of the box**: Hexo's native `i18n_dir: :lang` handles it
- **Clearer organization**: Language structure visible in file system
- **Easier to maintain**: No filename suffix conventions needed
- **No patch maintenance burden**: Survives `npm install` without reapplication

**Best practice**: Use the patch for posts (dynamic content with dates), use directory structure for pages (static content like About, Tools, etc.).

!!!info "📋 This Website's Approach"
    This website uses the **patch approach for both posts and pages** (not the directory-based approach for pages):
    
    **Why centralize everything?**
    - **Consistency**: Same filename suffix convention for all content types
    - **Simpler structure**: All content in standard locations (`source/_posts/`, `source/tools/`)
    - **Easier refactoring**: Moving files doesn't break language detection
    - **Less duplication**: No need to recreate directory structure per language
    - **Unified workflow**: Same translation process for posts and pages
    
    **Trade-off**: Pages could use directory-based approach (out-of-the-box), but using the patch for everything maintains consistency and simplifies the mental model.
    
    **See**: [Extending to Pages](#extending-the-patch-to-pages) section below for implementation.

### Extending the Patch to Pages

To apply the same approach to pages, patch Hexo's page processor:

**File**: `node_modules/hexo/dist/plugins/processor/asset.js`

Add after line 60 (after `data.path` is set):

```javascript
// i18n: Auto-inject language prefix and strip language suffix for pages
const lang = data.lang || 'en';
const defaultLang = config.language?.[0] || 'en';
const languages = config.language || ['en'];
if (lang !== defaultLang && !data.path.startsWith(`${lang}/`)) {
    // Extract filename to check for language suffix
    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1].replace(/\.(md|markdown|html)$/i, '');
    const langPattern = new RegExp(`-(${languages.join('|')})$`);
    
    // Strip language suffix from path if present in filename
    if (langPattern.test(filename)) {
        const pathWithoutExt = data.path.replace(/\.html$/, '');
        const cleanPath = pathWithoutExt.replace(langPattern, '');
        data.path = cleanPath + '.html';
    }
    data.path = `${lang}/${data.path}`;
}
```

**Applying the patch**:

```bash
cd hexo-blog
patch -p0 < ../patches/hexo-i18n-page-permalink.patch
```

**How it works**:
- Patches Hexo's page processor directly
- Runs during page file processing
- Strips language suffix from filename (e.g., `index-zh-CN.md` → `index.html`)
- Injects language prefix (e.g., `terms-and-conditions/index.html` → `zh-CN/terms-and-conditions/index.html`)

**Example**:
- File: `source/terms-and-conditions/index-zh-CN.md` with `lang: zh-CN`
- Generated URL: `/zh-CN/terms-and-conditions/` (✅ suffix stripped, prefix added)
- File: `source/tools-ja.md` with `lang: ja`
- Generated URL: `/ja/tools/` (✅ suffix stripped, prefix added)

## Essential i18n Plugins

Standard Hexo generators don't support language-specific content. Custom plugins fill the gap:

!!!warning "⚠️ Remove Official Plugins First"
    Uninstall Hexo's default generators to avoid conflicts:
    ```bash
    npm uninstall hexo-generator-index hexo-generator-archive hexo-generator-category hexo-generator-tag hexo-generator-sitemap
    ```
    The i18n versions replace these completely.

### 1. Index Pages
**Plugin**: [hexo-generator-i18n-index](https://github.com/neoalienson/hexo-generator-i18n-index)

Creates separate index pages per language with sticky post support:

```bash
npm install hexo-generator-i18n-index
```

```yaml
index_generator:
  per_page: 24
  order_by: -date
```

**Sorting logic**:
1. Regular posts first, redirect posts (`original_lang_url`) last
2. Sticky/pinned posts at top
3. Then by date (newest first)

**Result**:
- `/` - English posts only
- `/zh-TW/` - Traditional Chinese posts only
- `/zh-CN/` - Simplified Chinese posts only
- `/ja/` - Japanese posts only

### 2. Sitemap Generation
**Plugin**: [hexo-generator-i18n-sitemap](https://github.com/neoalienson/hexo-generator-i18n-sitemap)

Generates unified sitemap with all language versions:
- `/sitemap.xml` - All pages across all languages
- `/sitemap.txt` - Simple URL list format

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

### 3. Archive Pages
**Plugin**: [hexo-generator-i18n-archive](https://github.com/neoalienson/hexo-generator-i18n-archive)

Creates language-specific archives:
- `/archives/` (English)
- `/zh-TW/archives/` (Traditional Chinese)
- `/ja/archives/` (Japanese)

```yaml
i18n_archive_generator:
  enable: true
  per_page: 24
  yearly: true
  monthly: false
```

### 4. Category Pages
**Plugin**: [hexo-generator-i18n-category](https://github.com/neoalienson/hexo-generator-i18n-category)

Generates category pages per language with translated category names:

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

### 5. Tag Pages
**Plugin**: [hexo-generator-i18n-tag](https://github.com/neoalienson/hexo-generator-i18n-tag)

Creates tag pages filtered by language:

```yaml
i18n_tag_generator:
  enable: true
  per_page: 24
```

### 6. Canonical Tags
**Plugin**: [hexo-plugin-i18n-canonical](https://github.com/neoalienson/hexo-plugin-i18n-canonical)

Prevents duplicate content penalties by adding proper canonical tags.

**The Problem**: Search engines see translated pages as duplicate content:
- `/2025/10/Article-Title/` (English)
- `/zh-TW/2025/10/Article-Title/` (Chinese)
- `/ja/2025/10/Article-Title/` (Japanese)

Without canonical tags, Google may:
- Split ranking signals across translations
- Index wrong language version
- Penalize site for "duplicate" content

**The Solution**: Canonical tags tell search engines which version is primary:

```html
<!-- All language versions point to English as canonical -->
<link rel="canonical" href="https://neo01.com/2025/10/Article-Title/" />
```

```yaml
canonical_multilang:
  enable: true
  default_lang: en  # Primary language
  languages:
    - en
    - zh-TW
    - zh-CN
    - ja
```

**Result**: Search engines understand these are translations, not duplicates, preserving SEO value.

## Performance Optimization with Fragment Caching

### The Multilingual Performance Challenge

This website supports 4 languages (en, zh-TW, zh-CN, ja), which means:
- **4× pages generated**: Every post creates 4 index entries, 4 archive pages, 4 category pages, 4 tag pages
- **4× template rendering**: Header, footer, sidebar rendered 4 times per page type
- **4× memory usage**: Each language maintains separate page objects
- **Exponential growth**: 100 posts × 4 languages = 400+ pages before counting archives/categories/tags

**General rule**: For N languages, expect N× build time and memory usage without optimization.

### The Fragment Caching Solution

Hexo's `fragment_cache()` function saves rendered template content and reuses it across pages. Critical for components that don't change per page.

**Key principle**: Cache per language, not globally.

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

**Cache key strategy**:
- `header-en`, `header-zh-TW`, `header-zh-CN`, `header-ja` (4 cache entries)
- Each language gets isolated cache
- Reused across all pages in that language

### What to Cache

**Header** (`layout.ejs`):
```ejs
<%- fragment_cache('header-' + (page.lang || 'en'), function(){
    return partial('common/header');
}) %>
```
- Navigation, language selector, logo
- 4 cache entries (one per language)
- Reused across ~100+ pages per language

**Sidebar** (`sidebar.ejs`):
```ejs
<%- fragment_cache('sidebar-static-' + (page.lang || 'en'), function(){
    return partial('common/sidebar-static');
}) %>
```
- Social links, structure
- Widgets cached separately per language

**Widgets** (`sidebar-widgets.ejs`):
```ejs
<%- fragment_cache('widget-recent_posts-' + (page.lang || 'en'), function(){
    return partial('widget/recent_posts');
}) %>
```
- Recent posts filtered by language in template:
```ejs
<%_ site.posts.filter(function(post) { 
    return (post.lang || 'en') === currentLang; 
}).limit(5).each(function(post) { _%>
```
- Same 5 posts shown across all pages in that language

**Footer** (`footer.ejs`):
```ejs
<%- fragment_cache('footer-static-' + (page.lang || 'en'), function(){
    return partial('common/footer-static');
}) %>
<%- partial('common/footer-dynamic') %>
```
- Static: Copyright, credits (cached)
- Dynamic: QR codes (page-specific)

**Scripts** (`layout.ejs`):
```ejs
<%- fragment_cache('scripts-' + (page.lang || 'en'), function(){
    return partial('common/scripts');
}) %>
```
- JavaScript includes cached per language

### Configuration Requirement

```yaml
# _config.yml
relative_link: false  # Required for safe caching
```

!!!warning "⚠️ Relative Links Break Caching"
    Fragment caching captures page objects. With `relative_link: true`, cached content contains wrong paths. Always use absolute paths with caching enabled.

### Client-Side Language Selector

Server-side language switching breaks with fragment caching. Solution: JavaScript-based URL generation.

```javascript
// Detect current path
var currentPath = window.location.pathname;
var basePath = currentPath.replace(/^\/[a-z]{2}(-[A-Z]{2})?\//, '/');

// Generate language-specific URLs
document.querySelectorAll('[data-lang]').forEach(function(link) {
    var targetLang = link.getAttribute('data-lang');
    var targetUrl = targetLang === 'en' ? basePath : '/' + targetLang + basePath;
    link.href = targetUrl;
});
```

**Benefits**:
- Language selector HTML cached per language
- URLs generated from real browser location
- No stale page object issues

### Performance Impact

**Before optimization** (this site with 4 languages):
- Build time: ~1 minutes for 400+ pages (4 languages × 100+ posts)
- Memory usage: High template rendering overhead
- Each page renders header/footer/sidebar from scratch

**After optimization**:
- Build time: ~40 seconds (60% reduction)
- Memory usage: Significantly lower
- Cache hit ratio: 80-95% per language

**Math for this site**: 
- Without caching: 400 pages × 5 components = 2,000 renders
- With caching: 20 cache entries (4 languages × 5 components) + 400 dynamic renders
- **General formula**: N cache entries per component instead of (pages × N) renders

## Content Management Workflow

### Creating New Posts

1. **Write English version first** (source of truth):
```bash
hexo new post "Article Title"
# Creates: source/_posts/Article-Title.md
```

2. **Add language metadata**:
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

3. **Create translations** with language suffix:
```bash
# Use language suffix in filename
cp source/_posts/Article-Title.md source/_posts/Article-Title-zh-TW.md
cp source/_posts/Article-Title.md source/_posts/Article-Title-zh-CN.md
cp source/_posts/Article-Title.md source/_posts/Article-Title-ja.md
```

4. **Update translation metadata** (no permalink needed):
```yaml
---
title: "文章標題"
date: 2025-10-30
lang: zh-TW  # Patch auto-generates: /zh-TW/2025/10/Article-Title/
categories: Development
tags:
  - Hexo
excerpt: "繁體中文摘要"
---
```

!!!tip "💡 Automatic URL Generation"
    With the patch applied:
    - `Article-Title-zh-TW.md` → `/zh-TW/2025/10/Article-Title/`
    - `Article-Title-ja.md` → `/ja/2025/10/Article-Title/`
    - Language suffix automatically stripped from URLs
    - No manual `permalink` configuration needed

### Handling Untranslated Content

For content available in only one language, use `original_lang_url`:

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

This displays a redirect notice instead of content, directing readers to the available language version.

## Resource Management

### Images and Assets

**English posts**: Use relative paths
```markdown
![Diagram](diagram.png)
```

**Translated posts**: Use absolute paths to English assets
```markdown
![圖表](/2025/10/Article-Title/diagram.png)
```

**Benefits**:
- No asset duplication
- Single source of truth
- Easier maintenance

### Internal Links

Always use absolute paths with language prefix:

```markdown
<!-- English -->
[Tools](/tools/)
[Previous Post](/2025/09/Previous-Article/)

<!-- Traditional Chinese -->
[工具](/zh-TW/tools/)
[上一篇文章](/zh-TW/2025/09/Previous-Article/)
```

## SEO Considerations

### Excerpt Management

Each language has different character density:

```yaml
excerpt_length:
  default: 200
  en: 200
  zh-TW: 100
  zh-CN: 100
  ja: 100
```

Always provide manual excerpts in front matter for better control:

```yaml
excerpt: "Master multilingual content management in Hexo with custom plugins."
```

### Category Translation

Keep category keys in English, translate display names:

```yaml
category_i18n:
  Development:
    en: "Development"
    zh-TW: "開發"
    zh-CN: "开发"
    ja: "開発"
```

### Tags

**Always use English tags** regardless of content language:

```yaml
tags:
  - Hexo
  - i18n
  - Static Site
```

This ensures consistent tag pages across languages.

## Additional Performance Tips

### Disable Plugins During Development

Many i18n plugins can be disabled during local preview to speed up development:

```yaml
# _config.yml
i18n_archive_generator:
  enable: false  # Disable for preview
  
i18n_category_generator:
  enable: false  # Disable for preview
  
i18n_tag_generator:
  enable: false  # Disable for preview
  
sitemap_i18n:
  enable: false  # Disable for preview
  
canonical_multilang:
  enable: false  # Disable for preview
```

**Enable before deployment**:
```bash
# Set enable: true for all plugins before deploying
hexo clean && hexo generate
```

**Benefits**:
- Faster local builds (seconds vs minutes)
- Quicker iteration during content creation
- Full functionality only when needed for production

!!!tip "💡 Development Workflow"
    Keep plugins disabled in `_config.yml` for daily work. Enable them only in CI/CD pipeline or before manual deployment.

## Troubleshooting

### Wrong Language Content Appears

**Cause**: Fragment cache not using language-specific keys

**Solution**: Verify cache keys include `page.lang`:
```ejs
<%- fragment_cache('component-' + (page.lang || 'en'), function(){
    return partial('common/component');
}) %>
```

### Language Selector Shows 404

**Cause**: Server-side path detection with fragment caching

**Solution**: Implement client-side URL generation (see above)

### Build Performance Degraded

**Cause**: Caching disabled or `relative_link: true`

**Solution**: 
1. Set `relative_link: false`
2. Clear cache: `hexo clean`
3. Regenerate: `hexo generate`

### Translations Not Appearing

**Cause**: Missing `lang` metadata or incorrect permalink

**Solution**: Verify front matter includes:
- `lang: zh-TW` (or appropriate language code)
- `permalink: /zh-TW/YYYY/MM/slug/`

## Conclusion

Building a multilingual Hexo blog requires custom plugins and careful optimization, but the result is a fast, SEO-friendly site that serves global audiences. The key insights:

- **Separate concerns**: Posts centralized, pages directory-based
- **Cache aggressively**: Fragment caching per language reduces build time by 60%
- **Client-side enhancement**: JavaScript handles dynamic elements without breaking caching
- **Consistent structure**: English as source of truth, translations follow established patterns

This implementation powers a blog with 400+ pages across 4 languages, building in under 2 minutes while maintaining excellent performance and SEO.

The future of static site generation is multilingual, and with the right architecture, Hexo can deliver world-class results.
