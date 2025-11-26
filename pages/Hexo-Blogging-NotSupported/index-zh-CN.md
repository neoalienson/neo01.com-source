---
title: Hexo 博客速查表
date: 2022-12-08 09:56:37
comments: false
lang: zh-CN
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
checker:
  skip_admonition: true
---

## 提示区块

### example - 代码示例

!!!example "💻 配置示例"
    ```yaml
    ---
    title: 我的博客文章
    date: 2025-01-15
    category: Development
    tags: [Git, DevOps]
    excerpt: "文章内容的简洁描述..."
    ---
    ```

### 区块内的高级格式

**提示区块内的代码区块**

!!!tip "🔧 Git 配置"
    设置你的 Git 身份：
    
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

**提示区块内的表格**

!!!info "💡 端口范围"
    
    | 操作系统 | 范围 | 数量 |
    |---|---|---|
    | Linux | 32768-60999 | 28232 |
    | Windows | 49152-65535 | 16384 |
    | macOS | 49152-65535 | 16384 |

### 嵌套格式

!!!error "❌ 常见陷阱"
    **避免这些错误：**
    
    1. **硬编码路径**
       ```javascript
       // ❌ 不好
       const path = 'C:\\Users\\neo\\file.txt';
       
       // ✅ 好
       const path = require('path').join(__dirname, 'file.txt');
       ```
    
    2. **缺少错误处理**
       - 总是使用 try-catch 块
       - 验证用户输入
       - 正确记录错误
    
    3. **忽略 async/await**
       > 回调函数会导致"回调地狱"。使用现代异步模式。
