---
title: 加速 Android 模拟器
date: 2013-07-17
tags:
  - Android
category:
  - Development
lang: zh-CN
excerpt: Android 模拟器从启动到锁屏要几分钟?用 Intel HAXM 加速到 10 秒!告别龟速开发体验。
comments: true
---

长期以来，Android 模拟器最常被抱怨的就是启动和运行速度缓慢。使用 Intel Atom x86 系统映像文件有些许帮助，但改善并不明显。然而，去年 Intel 发布了 Intel Hardware Accelerated Execution Manager (HAXM)，大幅改善了这个情况。以前从 Android 开机动画到屏幕锁定画面需要好几分钟，现在只需要 10 秒！

## 安装 HAXM
首先，确认你的 CPU 支持 VT，现今大多数 CPU 都支持。然后，在 Android SDK Manager 的 Extras 区段安装 Intel x86 Emulator Accelerator (HAXM)。注意这个步骤只是下载套件；你必须在 SDK 路径中找到它来完成安装。例如，在 Mac 上，它会被下载到 `SDK Path /extras/intel/Hardware_Accelerated_Execution_Manager`。然后打开 `IntelHAXM.dmg` 文件并运行里面的套件来完成安装。

运行模拟器后，如果成功，你会在 Console 看到：`Emulator] HAX is working and emulator runs in fast virt mode.` 如果你想看看 Android 模拟器在 MacBook Air 上运行有多快，可以观看以下视频。

{% youtube 1jwX_n8B3mI %}
