---
title: CLLocationManager 教程与疑难排解
tags:
  - iOS
  - Swift
categories:
  - Development
date: 2016-02-28
lang: zh-CN
excerpt: "iOS 8 后位置服务不工作？解决 CLLocationManager 常见问题的完整指南"
comments: true
---

许多开发者抱怨移动应用程序开发比网页应用程序开发更困难。他们尝试精确地遵循在线教程，但移动应用程序仍然无法运作。这是因为移动平台发展迅速，教程无法保持最新。

我的朋友遇到了上述情况，无法从位置管理器获得任何位置更新。他将 CoreLocation.framework 库加入到 Link Binary，

![CLLocationSample1](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample1.png)

![CLLocationSample2](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample2.png)

然后，他放入以下代码，看起来是对的。

{% gist 18ab0cc09e57cc2a4e6b AppDelegate.swift %}

然而，控制台没有任何输出。这是因为从 iOS 8 开始，你需要加入 NSLocationAlwaysUsageDescription 或 NSLocationWhenInUseUsageDescription，取决于 requestAlwaysAuthorization（用于后台位置）或 requestWhenInUseAuthorization（仅在前台时的位置）。

![CLLocationSample3](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample3.png)

![CLLocationSample4](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample4.png)

让我们开始构建并运行应用程序。如果你第一次启动它，你应该会看到以下警告。

![CLLocationManager5](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationManager5.png)

点击允许后，你应该会获得更新。如果你在模拟器上运行，你可能需要通过从 Debug -> Location 选择位置来调整位置。

我已将项目上传到 [https://github.com/neoalienson/CLLocationManagerSample](https://github.com/neoalienson/CLLocationManagerSample)

祝你好运，我希望这个教程不会很快过时！

&nbsp;
