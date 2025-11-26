---
title: Hexo 部落格速查表
date: 2022-12-08 09:56:37
comments: false
lang: zh-TW
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
checker:
  skip_admonition: true
---

## 提示區塊

### example - 程式碼範例

!!!example "💻 設定範例"
    ```yaml
    ---
    title: 我的部落格文章
    date: 2025-01-15
    category: Development
    tags: [Git, DevOps]
    excerpt: "文章內容的簡潔描述..."
    ---
    ```

### 區塊內的進階格式

**提示區塊內的程式碼區塊**

!!!tip "🔧 Git 設定"
    設定你的 Git 身份：
    
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

**提示區塊內的表格**

!!!info "💡 連接埠範圍"
    
    | 作業系統 | 範圍 | 數量 |
    |---|---|---|
    | Linux | 32768-60999 | 28232 |
    | Windows | 49152-65535 | 16384 |
    | macOS | 49152-65535 | 16384 |

### 巢狀格式

!!!error "❌ 常見陷阱"
    **避免這些錯誤：**
    
    1. **硬編碼路徑**
       ```javascript
       // ❌ 不好
       const path = 'C:\\Users\\neo\\file.txt';
       
       // ✅ 好
       const path = require('path').join(__dirname, 'file.txt');
       ```
    
    2. **缺少錯誤處理**
       - 總是使用 try-catch 區塊
       - 驗證使用者輸入
       - 正確記錄錯誤
    
    3. **忽略 async/await**
       > 回呼函式會導致「回呼地獄」。使用現代非同步模式。
