---
title: 在 iPhone 上對應用程式執行網路延遲測試的最簡單方法
date: 2018-01-04
tags:
  - iOS
categories:
  - Development
lang: zh-TW
excerpt: "無需代理或路由器！使用 iOS 內建的 Network Link Conditioner 輕鬆模擬網路延遲和不良網路條件。"
comments: true
---

在 iOS 中模擬網路延遲甚至不良網路條件非常簡單。您不需要設定代理、路由器或不良的網路提供商。您所要做的就是使用 Xcode 啟用開發者模式。然後，您可以看到**開發者**圖示，它允許您輕鬆模擬各種網路場景。

![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step1.png)

***

在開發者下，您可以看到 **Network Link Conditioner**。預設情況下它是*關閉*的。點擊 **Network Link Conditioner**，
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step2.png)

***

有幾個設定檔供您使用。您可以利用從您的手機到目標後端的 **ping** 時間（往返），然後減去從實驗室後端的 **ping** 時間。要建立新的設定檔，只需點擊 **Add a profile...**
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step3.png)

***

假設 ping 時間為 900ms，您可以設定 **Out Delay**、**In Delay** 或兩者。
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step4.png)

***

完成！

<link rel="stylesheet" href="/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/style.css">
