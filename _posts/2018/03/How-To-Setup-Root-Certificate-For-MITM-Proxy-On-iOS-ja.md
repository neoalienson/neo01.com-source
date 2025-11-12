---
title: iOSでMITMプロキシのルート証明書を設定する方法
date: 2018-03-28
tags:
  - iOS
  - Test Automation
categories:
  - Development
lang: ja
excerpt: "iOSデバイスにBrowserMob-Proxyルート証明書をインストールして信頼するための段階的なビジュアルガイド。HTTPSトラフィックを問題なく傍受できます！"
comments: true
---

BrowserMob-Proxyなどのデバッグプロキシのルート証明書をiOSで信頼するには、かなり厳格な手順が必要です。デバイスのSafariを使用して[ca-certificate-rsa.cer](https://github.com/lightbody/browsermob-proxy/blob/master/browsermob-core/src/main/resources/sslSupport/ca-certificate-rsa.cer)から証明書をダウンロードするか、シミュレータにファイルをドラッグすることもできます。

1. `許可`をタップして証明書をインストールします
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_01.png)

2. 右上の`インストール`をタップします
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_02.png)

3. もう一度、右上の`インストール`をタップします
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_03.png)

4. `インストール`
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_04.png)

5. 確認後、`完了`をタップします。証明書がインストールされました
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_05.png)

6. 証明書をルート証明書として信頼するには、`一般`の`情報`に移動します
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_06.png)

7. `証明書信頼設定`が表示されるまで下にスクロールします
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_07.png)

8. `LittleProxy MITM`をオンに切り替えて信頼します
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_08.png)

9. `続ける`をタップしてルート証明書として信頼します
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_09.png)

10. 完了。これで、すべてのトラフィックが問題なくプロキシによって傍受されます
![](/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/setup_cert_ios_10.png)

<link rel="stylesheet" href="/2018/03/How-To-Setup-Root-Certificate-For-MITM-Proxy-On-iOS/style.css">
