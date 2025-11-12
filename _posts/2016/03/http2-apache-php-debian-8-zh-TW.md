---
title: 在 Debian 8 上使用 Apache 和 PHP 設定 HTTP/2
categories:
  - Development
date: 2016-03-15
thumbnail: http2.png
lang: zh-TW
excerpt: "告別灰色等待時間！HTTP/2 多工處理讓頁面載入速度提升 2 倍"
comments: true
---

我的部落格已遷移到新的 Debian 虛擬私人伺服器（VPS）。我嘗試在新伺服器上啟用 SPDY，但 Google 對 Apache 的支援有些問題。最新的 Chrome 瀏覽器僅支援 SPDY 3.1，但 Google 僅為 Apache 模組提供 SPDY 3.0。我決定跳過 SPDY 並設定 HTTP/2，因為更多主要瀏覽器正在採用 HTTP/2。


* * *


## HTTP/1.1 建立多個新連線

在 HTTP/2 之前，讓我們簡要了解 HTTP/1.1 有多慢，

![http1.1-1](/2016/03/http2-apache-php-debian-8/http1.1-1.png)

從上圖可以看出，在第一個請求之後，21 個新連線同時嘗試連接到 HTTP 伺服器。時間軸中的灰線代表浪費在連接到伺服器上的時間。我可憐的伺服器只能立即服務 5 個（前 3 個、第 7 個和第 8 個）。總體而言，客戶端必須等待 0.5-1 秒才能開始下載內容並到達紅色目標線，這意味著頁面已準備好進行渲染。

* * *

## HTTP/2 從原始連線進行多工處理

以下是 HTTP/2。不再有灰色！這是因為 HTTP/2 保持一個單一連線（多工處理），不會浪費時間在握手連線上。
![http2-1](/2016/03/http2-apache-php-debian-8/http2-1.png)

HTTP/2 還有許多其他好處。隨意探索！

* * *

## 設定

要在 Debian 8 上使用 PHP5 在 Apache 上設定 HTTP/2，我必須使用來自測試頻道的 Apache 2.4.18，因為此版本包含 ```mod_http2```。同時，使用 ```mod_fcgid```，但不需要 NPN。最後，HTTP/2 需要 SSL。


**建立 /etc/apt/sources.list.d/testing.list**

{% codeblock lang:bash %}
deb     http://mirror.steadfast.net/debian/ testing main contrib non-free
deb-src http://mirror.steadfast.net/debian/ testing main contrib non-free
deb     http://ftp.us.debian.org/debian/    testing main contrib non-free
deb-src http://ftp.us.debian.org/debian/    testing main contrib non-free
{% endcodeblock %}

**建立 /etc/apt/preferences.d/testing.pref**
{% codeblock lang:bash %}
Package: *
Pin: release a=testing
Pin-Priority: 750
{% endcodeblock %}

**將以下內容加入網站配置檔案**
{% codeblock lang:bash %}
<Location />
AddHandler fcgid-script .php
Options +ExecCGI
FcgidWrapper /usr/bin/php-cgi .php
</Location>
{% endcodeblock %}

**執行以下命令**
{% codeblock lang:bash %}
# 從測試頻道安裝 Apache 2.4.18，而不是從穩定版安裝 2.4.10
sudo apt-get install apache2/testing apache2-data/testing apache2-bin/testing libnghttp2-14 libssl1.0.2  apache2-mpm-worker/testing
# fcgid
sudo apt-get libapache2-mod-fcgid
# 從測試頻道安裝 PHP
sudo apt-get install php-getid3/testing php-common/testing libphp-phpmailer/testing

sudo a2enmod mpm_prefork
sudo a2enmod fcgid
sudo a2dismod php5

# 最後，重新啟動 apache
sudo apache2ctl restart
{% endcodeblock %}

* * *

## 顯示活動的 HTTP/2 會話

從 Chrome 開啟 chrome://net-internals/#events&q=type:HTTP2_SESSION%20is:active。如果你成功設定，你應該會看到你的網站列在下面的截圖中，

![http2-result](/2016/03/http2-apache-php-debian-8/http2-result.png)

有許多關於設定 SPDY 的教學會建議從下拉選單中選擇 SPDY。SPDY 已從最新版本的 Chrome 中移除。

* * *

## 關於新的 VPS

我已經免費使用 Openshift.com 多年。然而，我必須從 Openshift 切換到另一個服務，因為免費帳戶不支援 CA 簽署的 SSL。付費使用者可以將 CA 簽署的 SSL 加入他們的網站。我不介意付費，但他們不接受來自香港的付款。SSL 在搜尋引擎排名中變得越來越重要，並且對於像 SPDY 這樣可以改善頁面載入效能的進階協定是必需的。我最終從 hostmada.com 選擇了一個 VPS，每年 24 美元。

_享受吧！_
