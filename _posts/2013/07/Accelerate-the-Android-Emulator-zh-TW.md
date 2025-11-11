---
title: 加速 Android 模擬器
date: 2013-07-17
tags:
  - Android
category:
  - Development
lang: zh-TW
excerpt: Android 模擬器從啟動到鎖屏要幾分鐘?用 Intel HAXM 加速到 10 秒!告別龜速開發體驗。
comments: true
---

長期以來，Android 模擬器最常被抱怨的就是啟動和運行速度緩慢。使用 Intel Atom x86 系統映像檔有些許幫助，但改善並不明顯。然而，去年 Intel 發布了 Intel Hardware Accelerated Execution Manager (HAXM)，大幅改善了這個情況。以前從 Android 開機動畫到螢幕鎖定畫面需要好幾分鐘，現在只需要 10 秒！

## 安裝 HAXM
首先，確認你的 CPU 支援 VT，現今大多數 CPU 都支援。然後，在 Android SDK Manager 的 Extras 區段安裝 Intel x86 Emulator Accelerator (HAXM)。注意這個步驟只是下載套件；你必須在 SDK 路徑中找到它來完成安裝。例如，在 Mac 上，它會被下載到 `SDK Path /extras/intel/Hardware_Accelerated_Execution_Manager`。然後開啟 `IntelHAXM.dmg` 檔案並執行裡面的套件來完成安裝。

執行模擬器後，如果成功，你會在 Console 看到：`Emulator] HAX is working and emulator runs in fast virt mode.` 如果你想看看 Android 模擬器在 MacBook Air 上執行有多快，可以觀看以下影片。

{% youtube 1jwX_n8B3mI %}
