---
title: Hexo Blogging Cheatsheet
date: 2022-12-08 09:56:37
comments: false
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
checker:
  skip_admonition: true
---

## Admonition Blocks

### example - Code Examples

!!!example "💻 Configuration Example"
    ```yaml
    ---
    title: My Blog Post
    date: 2025-01-15
    category: Development
    tags: [Git, DevOps]
    excerpt: "A concise description of the post content..."
    ---
    ```

### Advanced Formatting Inside Blocks

**Code Block Inside Admonition**

!!!tip "🔧 Git Configuration"
    Set up your Git identity:
    
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

**Table Inside Admonition**

!!!info "💡 Port Ranges"
    
    | OS | Range | Count |
    |---|---|---|
    | Linux | 32768-60999 | 28232 |
    | Windows | 49152-65535 | 16384 |
    | macOS | 49152-65535 | 16384 |

### Nested Formatting

!!!error "❌ Common Pitfalls"
    **Avoid these mistakes:**
    
    1. **Hardcoded paths**
       ```javascript
       // ❌ Bad
       const path = 'C:\\Users\\neo\\file.txt';
       
       // ✅ Good
       const path = require('path').join(__dirname, 'file.txt');
       ```
    
    2. **Missing error handling**
       - Always use try-catch blocks
       - Validate user input
       - Log errors properly
    
    3. **Ignoring async/await**
       > Callbacks lead to "callback hell". Use modern async patterns.
