---
title: CLLocationManagerチュートリアルとトラブルシューティング
tags:
  - iOS
  - Swift
id: 7010
categories:
  - Development
date: 2016-02-28
lang: ja
excerpt: iOS 8以降、位置情報サービスが機能しない？NSLocationUsageDescriptionを使用した一般的なCLLocationManagerの問題を修正する完全ガイド。
comments: true
---

多くの開発者は、モバイルアプリケーション開発がWebアプリケーション開発よりも難しいと不満を言います。彼らはオンラインのチュートリアルに正確に従おうとしますが、モバイルアプリケーションはまだ動作しません。これは、モバイルプラットフォームが急速に進化しており、チュートリアルが最新の状態を保つことができないためです。

私の友人は上記の状況に陥り、ロケーションマネージャーから位置情報の更新を取得できませんでした。彼はCoreLocation.frameworkライブラリをLink Binaryに追加しました。

![CLLocationSample1](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample1.png)

![CLLocationSample2](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample2.png)

その後、以下のコードを配置しましたが、正しいように見えます。

{% gist 18ab0cc09e57cc2a4e6b AppDelegate.swift %}

しかし、コンソールには何も出力されません。これは、iOS 8以降、requestAlwaysAuthorization（バックグラウンド位置情報用）またはrequestWhenInUseAuthorization（フォアグラウンドのみの位置情報）に応じて、NSLocationAlwaysUsageDescriptionまたはNSLocationWhenInUseUsageDescriptionを追加する必要があるためです。

![CLLocationSample3](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample3.png)

![CLLocationSample4](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationSample4.png)

アプリをビルドして実行しましょう。初めて起動すると、以下のアラートが表示されるはずです。

![CLLocationManager5](/2016/02/cllocationmanager-tutorial-and-troubleshooting/CLLocationManager5.png)

「許可」をタップすると更新が取得されるはずです。シミュレーターを実行している場合は、Debug -> Locationから場所を選択して位置を調整する必要があるかもしれません。

プロジェクトを[https://github.com/neoalienson/CLLocationManagerSample](https://github.com/neoalienson/CLLocationManagerSample)にアップロードしました。

幸運を祈ります。このチュートリアルがすぐに古くならないことを願っています！
