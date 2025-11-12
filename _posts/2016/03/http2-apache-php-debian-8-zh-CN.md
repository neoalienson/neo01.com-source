---
title: 在 Debian 8 上使用 Apache 和 PHP 设置 HTTP/2
categories:
  - Development
date: 2016-03-15
thumbnail: http2.png
lang: zh-CN
excerpt: "告别灰色等待时间！HTTP/2 多路复用让页面加载速度提升 2 倍"
comments: true
---

我的博客已迁移到新的 Debian 虚拟私人服务器（VPS）。我尝试在新服务器上启用 SPDY，但 Google 对 Apache 的支持有些问题。最新的 Chrome 浏览器仅支持 SPDY 3.1，但 Google 仅为 Apache 模块提供 SPDY 3.0。我决定跳过 SPDY 并设置 HTTP/2，因为更多主要浏览器正在采用 HTTP/2。


* * *


## HTTP/1.1 建立多个新连接

在 HTTP/2 之前，让我们简要了解 HTTP/1.1 有多慢，

![http1.1-1](/2016/03/http2-apache-php-debian-8/http1.1-1.png)

从上图可以看出，在第一个请求之后，21 个新连接同时尝试连接到 HTTP 服务器。时间轴中的灰线代表浪费在连接到服务器上的时间。我可怜的服务器只能立即服务 5 个（前 3 个、第 7 个和第 8 个）。总体而言，客户端必须等待 0.5-1 秒才能开始下载内容并到达红色目标线，这意味着页面已准备好进行渲染。

* * *

## HTTP/2 从原始连接进行多路复用

以下是 HTTP/2。不再有灰色！这是因为 HTTP/2 保持一个单一连接（多路复用），不会浪费时间在握手连接上。
![http2-1](/2016/03/http2-apache-php-debian-8/http2-1.png)

HTTP/2 还有许多其他好处。随意探索！

* * *

## 设置

要在 Debian 8 上使用 PHP5 在 Apache 上设置 HTTP/2，我必须使用来自测试频道的 Apache 2.4.18，因为此版本包含 ```mod_http2```。同时，使用 ```mod_fcgid```，但不需要 NPN。最后，HTTP/2 需要 SSL。


**创建 /etc/apt/sources.list.d/testing.list**

{% codeblock lang:bash %}
deb     http://mirror.steadfast.net/debian/ testing main contrib non-free
deb-src http://mirror.steadfast.net/debian/ testing main contrib non-free
deb     http://ftp.us.debian.org/debian/    testing main contrib non-free
deb-src http://ftp.us.debian.org/debian/    testing main contrib non-free
{% endcodeblock %}

**创建 /etc/apt/preferences.d/testing.pref**
{% codeblock lang:bash %}
Package: *
Pin: release a=testing
Pin-Priority: 750
{% endcodeblock %}

**将以下内容加入网站配置文件**
{% codeblock lang:bash %}
<Location />
AddHandler fcgid-script .php
Options +ExecCGI
FcgidWrapper /usr/bin/php-cgi .php
</Location>
{% endcodeblock %}

**运行以下命令**
{% codeblock lang:bash %}
# 从测试频道安装 Apache 2.4.18，而不是从稳定版安装 2.4.10
sudo apt-get install apache2/testing apache2-data/testing apache2-bin/testing libnghttp2-14 libssl1.0.2  apache2-mpm-worker/testing
# fcgid
sudo apt-get libapache2-mod-fcgid
# 从测试频道安装 PHP
sudo apt-get install php-getid3/testing php-common/testing libphp-phpmailer/testing

sudo a2enmod mpm_prefork
sudo a2enmod fcgid
sudo a2dismod php5

# 最后，重新启动 apache
sudo apache2ctl restart
{% endcodeblock %}

* * *

## 显示活动的 HTTP/2 会话

从 Chrome 打开 chrome://net-internals/#events&q=type:HTTP2_SESSION%20is:active。如果你成功设置，你应该会看到你的网站列在下面的截图中，

![http2-result](/2016/03/http2-apache-php-debian-8/http2-result.png)

有许多关于设置 SPDY 的教程会建议从下拉菜单中选择 SPDY。SPDY 已从最新版本的 Chrome 中移除。

* * *

## 关于新的 VPS

我已经免费使用 Openshift.com 多年。然而，我必须从 Openshift 切换到另一个服务，因为免费账户不支持 CA 签署的 SSL。付费用户可以将 CA 签署的 SSL 加入他们的网站。我不介意付费，但他们不接受来自香港的付款。SSL 在搜索引擎排名中变得越来越重要，并且对于像 SPDY 这样可以改善页面加载性能的高级协议是必需的。我最终从 hostmada[.]com 选择了一个 VPS，每年 24 美元。

_享受吧！_
