---
title: 實用資訊
id: 2148
comments: false
date: 2023-04-04 21:03:05
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
lang: zh-TW
---

## 關於
此頁面包含對我自己有用的資訊。它也作為此部落格的測試頁面。

## 常用提示
將字串從部落格標題轉換為 Linux 友善的檔案名稱。
```
convert string by replacing colon with dash, nonnalpha numeric with underscore. reduce repetiting underscore or dash to single underscore or dash:
```

## 軟體開發

### 安全性
* [Instrumentation tookit](https://www.frida.re/)
* 執行命令時遮罩敏感資訊（如 Proxy-Authorization）， 
  `curl -v https://somewhere.need.authenticated.proxy 2>&1 | sed -E "s/(proxy-authorization:).*/\\1: ***/i"`
* [Nessus](https://www.nessus.org/)
* [OWASP](https://www.owasp.org/)
* [SANS](https://www.sans.org)
* [Vulnerability Database](https://www.cybersecurity-help.cz/vdb/)

### 其他
* [Creating an Alpine Linux package](https://wiki.alpinelinux.org/wiki/Creating_an_Alpine_package)
* [Visual Studio Code Keyboard Shortcuts for Windows](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)

## 常用命令
* 立即關閉 Windows ```shutdown -r -t 0```，當你遠端連線到 Windows PC 時很有用
* 切換 Java 版本
{% codeblock %}export JAVA_HOME=`/usr/libexec/java_home -v 1.8`{% endcodeblock %}

### Git
* 復原（未推送）
```git reset --soft HEAD~```
* 刪除遠端分支
```git push [remote] --delete [branch]```
例如：```git push origin --delete feature/branch```
* 同步遠端分支並刪除遠端不存在的本地副本
```git fetch --prune```
* 列出分支之間的提交差異
```git rev-list [branch]...[another branch]```
* 列出分支之間的提交差異，箭頭指示哪個分支擁有該提交
```git rev-list --left-right [branch]...[another branch]```
* 列出分支相對於遠端分支的領先/落後提交
```git rev-list [branch]...[remote]/[another branch]```
* 顯示分支之間的領先或落後數量
```git rev-list --left-right count [branch]...[another branch]```
* 使用最新提交更新子模組
```git submodule update --remote```
* 清理孤立提交
```git gc --prune=now --aggressive```

## Windows

### 移除 XBox
* 使用 Powershell 移除 XBox ```Get-ProvisionedAppxPackage -Online | Where-Object { $_.PackageName -match "xbox" } | ForEach-Object { Remove-ProvisionedAppxPackage -Online -AllUsers -PackageName $_.PackageName }```
* 檢查是否還有 Xbox 應用程式 ```dism /Online /Get-ProvisionedAppxPackages | Select-String PackageName | Select-String xbox```

### Windows 快捷鍵
僅列出常用且容易忘記的快捷鍵。
| | |
| --- | --- |
| 將視窗移至另一個螢幕 | <kbd>&#x229E; Windows</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd> |
| 切換到另一個桌面 | <kbd>&#x229E; Windows</kbd> + <kbd>⌃ Control</kbd> + <kbd>←</kbd> / <kbd>→</kbd> |
| 工作檢視 | <kbd>&#x229E; Windows</kbd> + <kbd>Tab</kbd> |
| 開啟控制中心 | <kbd>&#x229E; Windows</kbd> + <kbd>A</kbd> |
| 顯示/隱藏桌面 | <kbd>&#x229E; Windows</kbd> + <kbd>D</kbd> |
| 開啟檔案總管 | <kbd>&#x229E; Windows</kbd> + <kbd>E</kbd> |
| 快速連結選單（系統工具如事件檢視器） | <kbd>&#x229E; Windows</kbd> + <kbd>X</kbd> |
| 鎖定 | <kbd>&#x229E; Windows</kbd> + <kbd>L</kbd> |

### 編輯
| | |
| --- | --- |
| 切換語音輸入 | <kbd>&#x229E; Windows</kbd> + <kbd>H</kbd> |
| 開啟剪貼簿歷史記錄 | <kbd>&#x229E; Windows</kbd> + <kbd>⌃ Control</kbd> + <kbd>V</kbd> |
| 貼上為純文字[^1] | <kbd>&#x229E; Windows</kbd> + <kbd>V</kbd>[^2] |
| 擷取螢幕並 OCR 到剪貼簿[^1] | <kbd>&#x229E; Windows</kbd> + <kbd>T</kbd>[^2] |
| 表情符號 | <kbd>&#x229E; Windows</kbd> + <kbd>.</kbd>[^2] |

[^1]:需要 PowerToys
[^2]:自訂快捷鍵

## Visual Studio Code 快捷鍵
僅列出常用且容易忘記的快捷鍵。參考自 https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf

### 基本
| | |
| --- | --- |
| 使用者設定 | <kbd>⌃ Control</kbd> + <kbd>,</kbd> |
| 選取所有符合的項目 |  <kbd>Alt</kbd> + <kbd>Enter</kbd> |
| 快速修復 |  <kbd>⌃ Control<</kbd> + <kbd>.</kbd> |
| Ctrl+K Ctrl+X |  <kbd>⌃ Control<</kbd> + <kbd>K</kbd> <kbd>⌃ Control<</kbd> + <kbd>X</kbd> |

### 導覽
| | |
| --- | --- |
| 前往行... | <kbd>⌃ Control</kbd> + <kbd>G</kbd> |
| 前往檔案... | <kbd>⌃ Control</kbd> + <kbd>P</kbd> |
| 前往下一個錯誤或警告 | <kbd>F8</kbd> |
| 聚焦到第 1、2 或 3... 編輯器群組 |  <kbd>⌃ Control</kbd> + <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>... |
| 分割編輯器 |  <kbd>⌃ Control</kbd> + <kbd>\\</kbd> |
| 顯示整合終端機 | <kbd>⌃ Control</kbd> + <kbd>`</kbd> |
| 建立新終端機 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>`</kbd> |
| 顯示檔案總管 / 切換焦點 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>E</kbd> |
| 顯示搜尋 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>S</kbd> |
| 顯示原始檔控制 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>G</kbd> |
| 顯示偵錯 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>D</kbd> |
| 顯示擴充功能 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>X</kbd> |
| 在檔案中取代 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>H</kbd> |
| 顯示輸出面板 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>U</kbd> |
| 在側邊開啟 Markdown 預覽 | <kbd>⌃ Control</kbd> + <kbd>K</kbd> <kbd>V</kbd> |

### 偵錯
| | |
| --- | --- |
| 切換中斷點 | <kbd>F9</kbd> |
| 開始/繼續 | <kbd>F5</kbd> |
| 逐程序 | <kbd>F10</kbd> |
| 逐步執行 | <kbd>F11</kbd> |
| 跳離 | <kbd>&#x21E7; Shift</kbd> + <kbd>F11</kbd> |

## 其他

* [指南](/zh-TW/pages/useful-information/guides)
* [學習](/zh-TW/pages/useful-information/learning)
* [工具](/zh-TW/pages/useful-information/useful_tools)
