---
title: iPhoneアプリでネットワークレイテンシーテストを実行する最も簡単な方法
date: 2018-01-04
tags:
  - iOS
categories:
  - Development
lang: ja
excerpt: "プロキシやルーターは不要！iOSの組み込みNetwork Link Conditionerを使用して、ネットワークレイテンシーや劣悪なネットワーク状態をシミュレートします。アプリのパフォーマンスを簡単にテストできます。"
comments: true
---

iOSでネットワークレイテンシーや劣悪なネットワーク状態をシミュレートするのは非常に簡単です。プロキシ、ルーター、または劣悪なネットワークプロバイダーを設定する必要はありません。Xcodeを使用して開発者モードを有効にするだけです。すると、**Developer**アイコンが表示され、さまざまなネットワークシナリオを簡単にシミュレートできます。

![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step1.png)

***

Developerの下に、**Network Link Conditioner**が表示されます。デフォルトでは*オフ*になっています。**Network Link Conditioner**をタップします。
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step2.png)

***

使用できるプロファイルがいくつかあります。携帯電話からターゲットバックエンドへの**ping**時間（往復）を利用し、ラボのバックエンドからの**ping**時間を差し引くことができます。新しいプロファイルを作成するには、**Add a profile...**をタップします。
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step3.png)

***

たとえば、ping時間が900msの場合、**Out Delay**、**In Delay**、またはその両方を設定できます。
![](/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/step4.png)

***

完了！

<link rel="stylesheet" href="/2018/01/The-easiest-way-to-perform-network-latency-test-on-an-App-in-iPhone/style.css">
