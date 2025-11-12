---
title: 如何在 iOS 上為 MITM 代理設定根憑證
date: 2018-03-28
tags:
  - iOS
  - Test Automation
categories:
  - Development
lang: zh-TW
excerpt: "逐步圖解如何在 iOS 裝置上安裝和信任 BrowserMob-Proxy 的根憑證，輕鬆放截 HTTPS 流量。"
comments: true
---

在 iOS 上信任除錯代理（如 BrowserMob-Proxy）的根憑證在其前進方向上相當嚴格。您可以使用裝置的 Safari 從 [ca-certificate-rsa.cer](https://github.com/lightbody/browsermob-proxy/blob/master/browsermob-core/src/main/resources/sslSupport/ca-certificate-rsa.cer) 下載憑證，或者您也可以將檔案拖曳到模擬器中。

1. 點擊允許以安裝憑證
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_01.png)

2. 點擊右上角的 `Install`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_02.png)

3. 再次點擊右上角的 `Install`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_03.png)

4. `Install`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_04.png)

5. 驗證後，點擊 `Done`。憑證已安裝
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_05.png)

6. 要將憑證信任為根憑證，請前往 `General` 中的 `About`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_06.png)

7. 向下捲動直到看到 `Certificate Trust Settings`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_07.png)

8. 切換 `LittleProxy MITM` 以信任它
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_08.png)

9. 點擊 `Continue` 以將其信任為根憑證
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_09.png)

10. 完成。現在所有流量都可以被代理攔截而不會有任何抱怨
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_10.png)

<link rel="stylesheet" href="/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/style.css">
