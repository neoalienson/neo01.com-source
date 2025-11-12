---
title: CLLocationManager 教學與疑難排解
tags:
  - iOS
  - Swift
categories:
  - Development
date: 2016-02-28
lang: zh-TW
excerpt: "iOS 8 後位置服務不工作？解決 CLLocationManager 常見問題的完整指南"
comments: true
---

許多開發者抱怨行動應用程式開發比網頁應用程式開發更困難。他們嘗試精確地遵循線上教學，但行動應用程式仍然無法運作。這是因為行動平台發展迅速，教學無法保持最新。

我的朋友遇到了上述情況，無法從位置管理器獲得任何位置更新。他將 CoreLocation.framework 函式庫加入到 Link Binary，

![CLLocationSample1](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample1.png)

![CLLocationSample2](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample2.png)

然後，他放入以下程式碼，看起來是對的。

{% gist 18ab0cc09e57cc2a4e6b AppDelegate.swift %}

然而，控制台沒有任何輸出。這是因為從 iOS 8 開始，你需要加入 NSLocationAlwaysUsageDescription 或 NSLocationWhenInUseUsageDescription，取決於 requestAlwaysAuthorization（用於背景位置）或 requestWhenInUseAuthorization（僅在前景時的位置）。

![CLLocationSample3](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample3.png)

![CLLocationSample4](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample4.png)

讓我們開始建構並執行應用程式。如果你第一次啟動它，你應該會看到以下警告。

![CLLocationManager5](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationManager5.png)

點擊允許後，你應該會獲得更新。如果你在模擬器上執行，你可能需要透過從 Debug -> Location 選擇位置來調整位置。

我已將專案上傳到 [https://github.com/neoalienson/CLLocationManagerSample](https://github.com/neoalienson/CLLocationManagerSample)

祝你好運，我希望這個教學不會很快過時！

&nbsp;
