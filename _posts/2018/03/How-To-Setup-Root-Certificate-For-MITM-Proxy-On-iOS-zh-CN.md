---
title: 如何在 iOS 上为 MITM 代理设置根证书
date: 2018-03-28
tags:
  - iOS
  - Test Automation
categories:
  - Development
lang: zh-CN
excerpt: "逐步图解如何在 iOS 设备上安装和信任 BrowserMob-Proxy 的根证书，轻松拦截 HTTPS 流量。"
comments: true
---

在 iOS 上信任调试代理（如 BrowserMob-Proxy）的根证书在其前进方向上相当严格。您可以使用设备的 Safari 从 [ca-certificate-rsa.cer](https://github.com/lightbody/browsermob-proxy/blob/master/browsermob-core/src/main/resources/sslSupport/ca-certificate-rsa.cer) 下载证书，或者您也可以将文件拖曳到模拟器中。

1. 点击允许以安装证书
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_01.png)

2. 点击右上角的 `Install`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_02.png)

3. 再次点击右上角的 `Install`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_03.png)

4. `Install`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_04.png)

5. 验证后，点击 `Done`。证书已安装
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_05.png)

6. 要将证书信任为根证书，请前往 `General` 中的 `About`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_06.png)

7. 向下滚动直到看到 `Certificate Trust Settings`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_07.png)

8. 切换 `LittleProxy MITM` 以信任它
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_08.png)

9. 点击 `Continue` 以将其信任为根证书
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_09.png)

10. 完成。现在所有流量都可以被代理拦截而不会有任何抱怨
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_10.png)

<link rel="stylesheet" href="/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/style.css">
