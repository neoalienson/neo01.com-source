---
title: Debian 8でApacheとPHPを使用したHTTP/2のセットアップ
id: 7036
categories:
  - Development
date: 2016-03-15
tags:
thumbnail: /2016/03/http2-apache-php-debian-8/http2.png
lang: ja
excerpt: グレーの待機時間にさようなら！HTTP/2マルチプレクシングが単一接続でページ読み込み速度を2倍にします。
comments: true
---

私のブログは新しいDebian仮想プライベートサーバー（VPS）に移行されました。新しいサーバーでSPDYを有効にしようとしましたが、ApacheのGoogleからのサポートは多少壊れています。最新のChromeブラウザはSPDY 3.1のみをサポートしていますが、GoogleはApacheモジュールにSPDY 3.0のみを提供しています。より多くの主要ブラウザがHTTP/2を採用しているため、SPDYをスキップしてHTTP/2をセットアップすることにしました。

* * *

## HTTP/1.1は複数の新しい接続を作成します

HTTP/2の前に、HTTP/1.1がどれほど遅いかについて簡単なアイデアを持ちましょう。

![http1.1-1](/2016/03/http2-apache-php-debian-8/http1.1-1.png)

上記のチャートからわかるように、最初のリクエストの後、21の新しい接続が同時にHTTPサーバーに接続しようとしています。タイムラインのグレーの線は、サーバーへの接続に無駄にされた時間を表しています。私の貧弱なサーバーは、すぐに5つ（最初の3つ、7番目、8番目）しか提供できません。全体として、クライアントはコンテンツのダウンロードを開始し、ページがレンダリングの準備ができたことを意味する赤いゴールラインに到達するまで0.5〜1秒待つ必要があります。

* * *

## HTTP/2は元の接続から多重化します

以下はHTTP/2です。もうグレーはありません！これは、HTTP/2が単一の接続（多重化）を維持し、接続のハンドシェイクに時間が無駄にされないためです。
![http2-1](/2016/03/http2-apache-php-debian-8/http2-1.png)

HTTP/2には他にも多くの利点があります。自由に探索してください！

* * *

## セットアップ

Debian 8でPHP5を使用したApacheでHTTP/2をセットアップするには、このバージョンに```mod_http2```が含まれているため、テストチャネルからApache 2.4.18を使用する必要があります。一方、```mod_fcgid```が使用されますが、NPNは必要ありません。最後に、HTTP/2にはSSLが必要です。

**/etc/apt/sources.list.d/testing.listを作成**

{% codeblock lang:bash %}
deb     http://mirror.steadfast.net/debian/ testing main contrib non-free
deb-src http://mirror.steadfast.net/debian/ testing main contrib non-free
deb     http://ftp.us.debian.org/debian/    testing main contrib non-free
deb-src http://ftp.us.debian.org/debian/    testing main contrib non-free
{% endcodeblock %}

**/etc/apt/preferences.d/testing.prefを作成**
{% codeblock lang:bash %}
Package: *
Pin: release a=testing
Pin-Priority: 750
{% endcodeblock %}

**サイト設定ファイルに以下を追加**
{% codeblock lang:bash %}
<Location />
AddHandler fcgid-script .php
Options +ExecCGI
FcgidWrapper /usr/bin/php-cgi .php
</Location>
{% endcodeblock %}

**以下のコマンドを実行**
{% codeblock lang:bash %}
# stableの2.4.10ではなく、testingチャネルからApache 2.4.18をインストール
sudo apt-get install apache2/testing apache2-data/testing apache2-bin/testing libnghttp2-14 libssl1.0.2  apache2-mpm-worker/testing
# fcgid
sudo apt-get libapache2-mod-fcgid
# testingチャネルからPHP
sudo apt-get install php-getid3/testing php-common/testing libphp-phpmailer/testing

sudo a2enmod mpm_prefork
sudo a2enmod fcgid
sudo a2dismod php5

# 最後にapacheを再起動
sudo apache2ctl restart
{% endcodeblock %}

* * *

## アクティブなHTTP/2セッションの表示

ChromeからChrome://net-internals/#events&q=type:HTTP2_SESSION%20is:activeを開きます。正常にセットアップした場合、以下のスクリーンショットのようにサイトがリストされているはずです。

![http2-result](/2016/03/http2-apache-php-debian-8/http2-result.png)

SPDYのセットアップに関する多くのチュートリアルでは、ドロップダウンからSPDYを選択することを提案しています。SPDYは最近のバージョンのChromeから削除されました。

* * *

## 新しいVPSについて

私は何年も無料でOpenshift.comを使用してきました。しかし、無料アカウントはCA署名付きSSLをサポートしていないため、Openshiftから別のサービスに切り替える必要がありました。有料ユーザーはウェブサイトにCA署名付きSSLを追加できます。支払うことは気にしませんが、香港からの支払いを受け付けていません。SSLは検索エンジンのランキングでますます重要になっており、ページ読み込みパフォーマンスを向上させることができるSPDYなどの高度なプロトコルに必要です。最終的に、年間24米ドルでhostmada.comからVPSを選択しました。

_お楽しみください！_
