---
title: 在 iPhone/iPad 上设置仅使用 SSL 的 IMAP
tags:
  - iOS
categories:
  - Cybersecurity
date: 2016-06-08
lang: zh-CN
excerpt: "iOS 无法连接 IMAP SSL？飞行模式是关键！分步骤图解教程"
comments: true
---

<link rel="stylesheet" href="/2016/06/setup-imap-with-ssl-only-on-iphoneipad/style.css">

你无法在 iPhone/iPad（iOS 设备）上设置仅提供 IMAP SSL（端口 993）的服务器。iOS 使用非 SSL IMAP 端口（端口 143）来检测 IMAP 的存在。以下是帮助你设置的技巧。

首先，也是最重要的，你必须禁用任何可能的互联网连接。最简单的方法是切换到飞行模式。&nbsp;

![imaps-ios01](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios01.png)

***

前往**设置**，点击**邮件、通讯录、日历**
![imaps-ios02](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios02.png)

***

点击**添加账户**
![imaps-ios03](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios03.png)

***

点击**其他**
![imaps-ios04](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios04.png)

***

输入基本信息并点击**下一步**
![imaps-ios06](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios06.png)

***

它会要求你输入收件和发件邮件服务器。填写服务器信息。点击**下一步**。
![imaps-ios08](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios08.png)

***

它会提示网络连接。点击**确定**以忽略它。
![imaps-ios09](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios09.png)

***

再次点击**下一步**。这次你可以**保存**。
![imaps-ios10](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios10.png)

***

再次**保存**。
![imaps-ios11](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios11.png)

***

点击新创建的账户。
![imaps-ios12](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios12.png)

***

点击**高级**。
![imaps-ios14](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios14.png)

***

启用**使用 SSL**。
![imaps-ios15](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios15.png)

***

点击左上角的**账户**以保存更改并返回上一个屏幕。
![imaps-ios16](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios16.png)

***

记得在测试你的电子邮件设置之前，从飞行模式切换回正常模式。
