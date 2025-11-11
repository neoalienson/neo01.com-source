---
title: Androidエミュレーターを高速化
date: 2013-07-17
tags:
  - Android
category:
  - Development
lang: ja
excerpt: Androidエミュレーターの起動に何分も待つのにうんざり？Intel HAXMが起動時間を数分からわずか10秒に短縮します。開発ワークフローを超高速化する方法をご紹介します。
comments: true
---

長い間、Androidエミュレーターに関する最も頻繁な不満は、起動と動作速度の遅さでした。Intel Atom x86システムイメージを使用すると少し改善されましたが、大きな変化はありませんでした。しかし、昨年、IntelがIntel Hardware Accelerated Execution Manager（HAXM）をリリースし、状況が劇的に改善されました。以前は、Androidの起動アニメーションから画面ロックに到達するまで数分かかっていましたが、今ではわずか10秒です！

## HAXMのインストール
まず、CPUがVTをサポートしていることを確認してください。今日のほとんどのCPUはサポートしています。次に、Android SDK ManagerのExtrasセクションに移動し、Intel x86 Emulator Accelerator（HAXM）をインストールします。この手順ではパッケージをダウンロードするだけであることに注意してください。SDKパスでパッケージを見つけてインストールを完了する必要があります。例えば、Macでは`SDK Path /extras/intel/Hardware_Accelerated_Execution_Manager`にダウンロードされます。その後、`IntelHAXM.dmg`ファイルを開き、内部のパッケージを実行してインストールを完了します。

エミュレーターを実行した後、成功すると、コンソールに次のように表示されます：`Emulator] HAX is working and emulator runs in fast virt mode.` MacBook AirでAndroidエミュレーターがどれだけ速く動作するかを見たい場合は、以下のビデオをご覧ください。

{% youtube 1jwX_n8B3mI %}
