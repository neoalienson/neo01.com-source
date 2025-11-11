---
title: 实用信息
id: 2148
comments: false
date: 2023-04-04 21:03:05
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
lang: zh-CN
---

## 关于
此页面包含对我自己有用的信息。它也作为此博客的测试页面。

## 常用提示
将字符串从博客标题转换为 Linux 友好的文件名。
```
convert string by replacing colon with dash, nonnalpha numeric with underscore. reduce repetiting underscore or dash to single underscore or dash:
```

## 软件开发

### 安全性
* [Instrumentation tookit](https://www.frida.re/)
* 执行命令时遮罩敏感信息（如 Proxy-Authorization）， 
  `curl -v https://somewhere.need.authenticated.proxy 2>&1 | sed -E "s/(proxy-authorization:).*/\\1: ***/i"`
* [Nessus](https://www.nessus.org/)
* [OWASP](https://www.owasp.org/)
* [SANS](https://www.sans.org)
* [Vulnerability Database](https://www.cybersecurity-help.cz/vdb/)

### 其他
* [Creating an Alpine Linux package](https://wiki.alpinelinux.org/wiki/Creating_an_Alpine_package)
* [Visual Studio Code Keyboard Shortcuts for Windows](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)

## 常用命令
* 立即关闭 Windows ```shutdown -r -t 0```，当你远程连接到 Windows PC 时很有用
* 切换 Java 版本
{% codeblock %}export JAVA_HOME=`/usr/libexec/java_home -v 1.8`{% endcodeblock %}

### Git
* 撤销（未推送）
```git reset --soft HEAD~```
* 删除远程分支
```git push [remote] --delete [branch]```
例如：```git push origin --delete feature/branch```
* 同步远程分支并删除远程不存在的本地副本
```git fetch --prune```
* 列出分支之间的提交差异
```git rev-list [branch]...[another branch]```
* 列出分支之间的提交差异，箭头指示哪个分支拥有该提交
```git rev-list --left-right [branch]...[another branch]```
* 列出分支相对于远程分支的领先/落后提交
```git rev-list [branch]...[remote]/[another branch]```
* 显示分支之间的领先或落后数量
```git rev-list --left-right count [branch]...[another branch]```
* 使用最新提交更新子模块
```git submodule update --remote```
* 清理孤立提交
```git gc --prune=now --aggressive```

## Windows

### 移除 XBox
* 使用 Powershell 移除 XBox ```Get-ProvisionedAppxPackage -Online | Where-Object { $_.PackageName -match "xbox" } | ForEach-Object { Remove-ProvisionedAppxPackage -Online -AllUsers -PackageName $_.PackageName }```
* 检查是否还有 Xbox 应用程序 ```dism /Online /Get-ProvisionedAppxPackages | Select-String PackageName | Select-String xbox```

### Windows 快捷键
仅列出常用且容易忘记的快捷键。
| | |
| --- | --- |
| 将窗口移至另一个屏幕 | <kbd>&#x229E; Windows</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd> |
| 切换到另一个桌面 | <kbd>&#x229E; Windows</kbd> + <kbd>⌃ Control</kbd> + <kbd>←</kbd> / <kbd>→</kbd> |
| 任务视图 | <kbd>&#x229E; Windows</kbd> + <kbd>Tab</kbd> |
| 打开操作中心 | <kbd>&#x229E; Windows</kbd> + <kbd>A</kbd> |
| 显示/隐藏桌面 | <kbd>&#x229E; Windows</kbd> + <kbd>D</kbd> |
| 打开文件资源管理器 | <kbd>&#x229E; Windows</kbd> + <kbd>E</kbd> |
| 快速链接菜单（系统工具如事件查看器） | <kbd>&#x229E; Windows</kbd> + <kbd>X</kbd> |
| 锁定 | <kbd>&#x229E; Windows</kbd> + <kbd>L</kbd> |

### 编辑
| | |
| --- | --- |
| 切换语音输入 | <kbd>&#x229E; Windows</kbd> + <kbd>H</kbd> |
| 打开剪贴板历史记录 | <kbd>&#x229E; Windows</kbd> + <kbd>⌃ Control</kbd> + <kbd>V</kbd> |
| 粘贴为纯文本[^1] | <kbd>&#x229E; Windows</kbd> + <kbd>V</kbd>[^2] |
| 截取屏幕并 OCR 到剪贴板[^1] | <kbd>&#x229E; Windows</kbd> + <kbd>T</kbd>[^2] |
| 表情符号 | <kbd>&#x229E; Windows</kbd> + <kbd>.</kbd>[^2] |

[^1]:需要 PowerToys
[^2]:自定义快捷键

## Visual Studio Code 快捷键
仅列出常用且容易忘记的快捷键。参考自 https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf

### 基本
| | |
| --- | --- |
| 用户设置 | <kbd>⌃ Control</kbd> + <kbd>,</kbd> |
| 选择所有匹配项 |  <kbd>Alt</kbd> + <kbd>Enter</kbd> |
| 快速修复 |  <kbd>⌃ Control<</kbd> + <kbd>.</kbd> |
| Ctrl+K Ctrl+X |  <kbd>⌃ Control<</kbd> + <kbd>K</kbd> <kbd>⌃ Control<</kbd> + <kbd>X</kbd> |

### 导航
| | |
| --- | --- |
| 转到行... | <kbd>⌃ Control</kbd> + <kbd>G</kbd> |
| 转到文件... | <kbd>⌃ Control</kbd> + <kbd>P</kbd> |
| 转到下一个错误或警告 | <kbd>F8</kbd> |
| 聚焦到第 1、2 或 3... 编辑器组 |  <kbd>⌃ Control</kbd> + <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>... |
| 拆分编辑器 |  <kbd>⌃ Control</kbd> + <kbd>\\</kbd> |
| 显示集成终端 | <kbd>⌃ Control</kbd> + <kbd>`</kbd> |
| 创建新终端 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>`</kbd> |
| 显示资源管理器 / 切换焦点 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>E</kbd> |
| 显示搜索 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>S</kbd> |
| 显示源代码管理 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>G</kbd> |
| 显示调试 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>D</kbd> |
| 显示扩展 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>X</kbd> |
| 在文件中替换 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>H</kbd> |
| 显示输出面板 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>U</kbd> |
| 在侧边打开 Markdown 预览 | <kbd>⌃ Control</kbd> + <kbd>K</kbd> <kbd>V</kbd> |

### 调试
| | |
| --- | --- |
| 切换断点 | <kbd>F9</kbd> |
| 开始/继续 | <kbd>F5</kbd> |
| 单步跳过 | <kbd>F10</kbd> |
| 单步调试 | <kbd>F11</kbd> |
| 单步跳出 | <kbd>&#x21E7; Shift</kbd> + <kbd>F11</kbd> |

## 其他

* [指南](/zh-CN/pages/useful-information/guides)
* [学习](/zh-CN/pages/useful-information/learning)
* [工具](/zh-CN/pages/useful-information/useful_tools)
