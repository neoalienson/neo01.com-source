---
title: 私のFiddlerクックブック
id: 7270
categories:
  - Development
date: 2017-05-20
tags:
thumbnail: /2017/05/my-fiddler-cookbook/fiddler.jpg
lang: ja
excerpt: 必須のFiddlerトリックをマスター：HTTPS復号化、シンプルな負荷テスト、リクエスト変更。Windows上で最も強力なデバッグプロキシツール！
comments: true
---

FiddlerはWindows上で私のお気に入りのデバッグプロキシです。通常、Pythonを使用してシンプルなデバッグプロキシを書きますが、通常は30行未満で、httpsが必要になるまでです。

# https復号化の有効化

そのため、Fiddlerでの最初の設定はHTTPSトラフィックの復号化です。

![](/2017/05/my-fiddler-cookbook/fiddler-2.png)

「Decrypt HTTPS traffic」をチェックし、OKをクリックします。
![](/2017/05/my-fiddler-cookbook/fiddler-3.png)

その後、Trust Root Certificateのインストールを求められます。
![](/2017/05/my-fiddler-cookbook/fiddler-4a.png)
![](/2017/05/my-fiddler-cookbook/fiddler-4b.png)

恐ろしいテキストは、httpsトラフィックがFiddlerによって見られることについての警告です。Fiddlerのルート証明書が信頼されるようになりました。つまり、Fiddlerはブラウザを含むアプリケーションによって信頼される証明書を生成できます。

証明書のインストールを求められない場合は、以下で証明書をインストールできます。
![](/2017/05/my-fiddler-cookbook/fiddler-5.png)

# シンプルな負荷テスト

複数のリクエストを選択してRを押すことで、非常にシンプルな負荷テストを実行できます。サーバーからの応答は、インフラストラクチャのさまざまなレイヤーでキャッシュされる可能性があることに注意してください。
![](/2017/05/my-fiddler-cookbook/fiddler-6.png)

タイムラインからサーバーのパフォーマンスを確認できます。
![](/2017/05/my-fiddler-cookbook/fiddler-7.png)

タイムラインをチェックすることで、Windowsでの発信接続制限の数を確認できることもあります。

# リクエストの変更

送信する前にリクエストを変更することもできます。
![](/2017/05/my-fiddler-cookbook/fiddler-8.png)
