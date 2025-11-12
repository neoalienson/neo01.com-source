---
title: 在 iPhone/iPad 上設定僅使用 SSL 的 IMAP
tags:
  - iOS
categories:
  - Cybersecurity
date: 2016-06-08
lang: zh-TW
excerpt: "iOS 無法連接 IMAP SSL？飛航模式是關鍵！分步驟圖解教學"
comments: true
---

<link rel="stylesheet" href="/2016/06/setup-imap-with-ssl-only-on-iphoneipad/style.css">

你無法在 iPhone/iPad（iOS 裝置）上設定僅提供 IMAP SSL（連接埠 993）的伺服器。iOS 使用非 SSL IMAP 連接埠（連接埠 143）來偵測 IMAP 的存在。以下是幫助你設定的技巧。

首先，也是最重要的，你必須停用任何可能的網際網路連線。最簡單的方法是切換到飛航模式。&nbsp;

![imaps-ios01](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios01.png)

***

前往**設定**，點擊**郵件、聯絡資訊、行事曆**
![imaps-ios02](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios02.png)

***

點擊**加入帳號**
![imaps-ios03](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios03.png)

***

點擊**其他**
![imaps-ios04](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios04.png)

***

輸入基本資訊並點擊**下一步**
![imaps-ios06](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios06.png)

***

它會要求你輸入收件和寄件郵件伺服器。填寫伺服器資訊。點擊**下一步**。
![imaps-ios08](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios08.png)

***

它會提示網路連線。點擊**確定**以忽略它。
![imaps-ios09](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios09.png)

***

再次點擊**下一步**。這次你可以**儲存**。
![imaps-ios10](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios10.png)

***

再次**儲存**。
![imaps-ios11](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios11.png)

***

點擊新建立的帳號。
![imaps-ios12](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios12.png)

***

點擊**進階**。
![imaps-ios14](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios14.png)

***

啟用**使用 SSL**。
![imaps-ios15](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios15.png)

***

點擊左上角的**帳號**以儲存變更並返回上一個畫面。
![imaps-ios16](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios16.png)

***

記得在測試你的電子郵件設定之前，從飛航模式切換回正常模式。

