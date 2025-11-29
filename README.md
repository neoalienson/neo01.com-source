# Decoding Digital Anomalies

This repository contains the raw source files for generating the live site at [neo01.com](https://neo01.com).

Personal tech blog covering AI, cybersecurity, architecture, and development.

## Live Site
[neo01.com](https://neo01.com)

## Features
- Multilingual (EN/ZH-TW/ZH-CN) with i18n support
- 20+ developer tools
- AI playground
- Interactive games
- Performance optimized
- Mermaid diagram support

## Language Support
- English (default)
- Traditional Chinese (zh-TW)
- Simplified Chinese (zh-CN)

## Content Guidelines

**Categories:**
- Must be one of: `AI`, `Development`, `Architecture`, `Cybersecurity`, `Misc`
- Use exact capitalization as shown

**Tags:**
- Must be in English only
- Proper capitalization: Use title case (e.g., `Security`, `iOS`, `Android`, `Machine Learning`)
- Concise and relevant: 3 tags maximum, directly related to content
- Consistent terminology: Use established terms (`Git` not `git`, `DevOps` not `devops`)
- Examples: `Git`, `DevOps`, `Security`, `Database`, `AI`, `Machine Learning`, `Cloud Computing`, `Version Control`
- Avoid: Generic tags like `Technology`, `Programming`, `Software`

**Post Structure:**
- Post frontmatter must include `lang` field for non-English posts (e.g., `lang: zh-TW`)
- Mermaid diagrams use markdown code blocks: ```mermaid instead of Hexo tags

**Excerpts:**
- Required: All posts must have excerpts
- Double quotes required: Always wrap excerpt in double quotes for YAML safety
- Length limits:
  - English: 200 characters
  - Traditional Chinese (zh-TW): 100 characters
  - Simplified Chinese (zh-CN): 100 characters
- Example: `excerpt: "Master Git branching strategies from Git Flow to GitHub Flow, exploring when to use each approach..."`

**Localized Content (zh-TW, zh-CN):**
- Pages: Create separate HTML files with language suffix (e.g., `index-zh-CN.html`, `index-zh-TW.html`) in the same page directory
- Tools: Create separate HTML files with language suffix in the same tool directory
- Always use absolute paths to reference images, CSS, and JS from the English version
- Example: `<link rel="stylesheet" href="/tools/tool-name/style.css">`
- Blog Posts: Use same asset folder structure as English version (e.g., `/2025/10/Article-Title/image.jpg`)

**Mermaid Diagrams:**
- Always use `gitGraph` syntax for branching strategies

## Admonition Blocks

**Use admonition blocks strategically to highlight important information and improve readability. Do not use too frequent.**

### Supported Types and Usage

| Type | Purpose | Emoji Suggestions |
|------|---------|------------------|
| `anote` | General notes and observations | 📝 📋 ℹ️ |
| `info, todo` | Additional information, tasks | 💡 📌 ✅ |
| `warning, attention, caution` | Important warnings, gotchas | ⚠️ 🚨 ⚡ |
| `error, failure, danger, bug` | Critical issues, problems | ❌ 🚫 💥 |
| `success` | Positive outcomes, achievements | ✅ 🎉 ✨ |
| `tip` | Helpful suggestions, best practices | 💡 🔧 🎯 |
| `question` | Questions, considerations | ❓ 🤔 💭 |
| `example` | Code examples, demonstrations | 📝 💻 🔍 |
| `quote` | Citations, references | 💬 📖 🗣️ |

**Correct Syntax:**

```
!!!anote "🏛️ Hierarchical Approaches"
    **Cloud Resource Groups/Projects**
    
    Instead of encoding everything in name, use hierarchy:
    
    **Flat (Long):**
    - `acme-prod-useast-web-api-logs`
    - `acme-prod-useast-web-api-backups`
    - `acme-prod-useast-db-postgres-backups`
```

**Important:** 
- Use `!!!` (three exclamation marks), NOT `:::`
- Always wrap the title in double quotes
- Indent content with 4 spaces
    

### Syntax Rules

- **Use `!!!` prefix** - Three exclamation marks, NOT `:::`
- **Wrap title in double quotes** - `!!!anote "Title"` not `!!!anote Title`
- **Always use emojis in titles** to make blocks visually engaging
- **Use anote instead of note** to avoid CSS conflicts
- **Be specific with titles** rather than using generic type names
- **Keep content concise** but informative
- **Use appropriate severity** - don't overuse warnings
- **Do NOT use tables inside admonition blocks** - tables are not supported and will break rendering
- **Do NOT use code blocks inside admonition blocks** - multi-line code blocks may not render correctly; use inline code with backticks instead or move code outside the block

## Directory Structure

```
source/
├── _data/           # YAML data files for i18n content
├── _posts/          # Blog posts organized by year/month
│   ├── 2017/01/     # Example: posts from January 2017
│   └── ...          # Other years and months
├── about-me/        # About page with certifications
├── ai/              # AI playground tools
├── assets/          # Images and media files
├── games/           # Interactive games
├── pages/           # Static pages
├── tools/           # 20+ developer tools
└── README.md        # This file
```



Built with Hexo 8.1.0