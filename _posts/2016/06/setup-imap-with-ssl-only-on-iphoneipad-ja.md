---
title: iPhone/iPadでSSLのみのIMAPをセットアップ
tags:
  - iOS
id: 7074
categories:
  - Cybersecurity
date: 2016-06-08
lang: ja
excerpt: iOSでIMAP SSLに接続できない？機内モードが鍵です！ステップバイステップのビジュアルガイド。
comments: true
---

<link rel="stylesheet" href="/2016/06/setup-imap-with-ssl-only-on-iphoneipad/style.css">

IMAP SSLのみを提供するサーバー（ポート993）でiPhone/iPad（iOSデバイス）にIMAPをセットアップすることはできません。iOSは非SSL IMAPポート（ポート143）を使用してIMAPの存在を検出します。これをセットアップするのに役立つトリックがあります。

まず、最も重要なことは、可能なインターネット接続を無効にする必要があることです。最も簡単な方法は、機内モードに切り替えることです。

![imaps-ios01](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios01.png)

***

**設定**に移動し、**メール、連絡先、カレンダー**をタップします
![imaps-ios02](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios02.png)

***

**アカウントを追加**をタップします
![imaps-ios03](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios03.png)

***

**その他**をタップします
![imaps-ios04](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios04.png)

***

基本情報を入力し、**次へ**をタップします
![imaps-ios06](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios06.png)

***

受信メールサーバーと送信メールサーバーを尋ねられます。サーバー情報を入力します。**次へ**をタップします。
![imaps-ios08](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios08.png)

***

ネットワーク接続を求められます。**OK**をタップして無視します。
![imaps-ios09](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios09.png)

***

再度**次へ**をタップします。今回は**保存**できます。
![imaps-ios10](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios10.png)

***

再度**保存**します。
![imaps-ios11](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios11.png)

***

新しく作成されたアカウントをタップします。
![imaps-ios12](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios12.png)

***

**詳細**をタップします。
![imaps-ios14](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios14.png)

***

**SSLを使用**を有効にします。
![imaps-ios15](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios15.png)

***

左上の**アカウント**をタップして変更を保存し、前の画面に戻ります。
![imaps-ios16](/2016/06/setup-imap-with-ssl-only-on-iphoneipad/imaps-ios16.png)

***

メール設定をテストする前に、機内モードから通常モードに戻すことを忘れないでください。
