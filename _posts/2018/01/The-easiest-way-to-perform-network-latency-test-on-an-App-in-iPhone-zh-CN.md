---
title: 在 iPhone 上对应用程序执行网络延迟测试的最简单方法
date: 2018-01-04
tags:
  - iOS
categories:
  - Development
lang: zh-CN
excerpt: "无需代理或路由器！使用 iOS 内置的 Network Link Conditioner 轻松模拟网络延迟和不良网络条件。"
comments: true
---

在 iOS 中模拟网络延迟甚至不良网络条件非常简单。您不需要设置代理、路由器或不良的网络提供商。您所要做的就是使用 Xcode 启用开发者模式。然后，您可以看到**开发者**图标，它允许您轻松模拟各种网络场景。

![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step1.png)

***

在开发者下，您可以看到 **Network Link Conditioner**。默认情况下它是*关闭*的。点击 **Network Link Conditioner**，
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step2.png)

***

有几个配置文件供您使用。您可以利用从您的手机到目标后端的 **ping** 时间（往返），然后减去从实验室后端的 **ping** 时间。要创建新的配置文件，只需点击 **Add a profile...**
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step3.png)

***

假设 ping 时间为 900ms，您可以设置 **Out Delay**、**In Delay** 或两者。
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step4.png)

***

完成！

<link rel="stylesheet" href="/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/style.css">
