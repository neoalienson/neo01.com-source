---
title: Setting up HTTP/2 with Apache and PHP on Debian 8
id: 7036
categories:
  - Development
date: 2016-03-15
tags:
thumbnail: http2.png
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: "Say goodbye to gray waiting time! HTTP/2 multiplexing doubles page load speed with single connection."
comments: true
---

My blog has been migrated to a new Debian Virtual Private Server (VPS). I was trying to enable SPDY on my new server, but support from Google for Apache is somewhat broken. The latest Chrome browser supports SPDY 3.1 only, but Google only provides SPDY 3.0 to the Apache module. I decided to skip SPDY and set up HTTP/2, as more major browsers are adopting HTTP/2.


* * *


## HTTP/1.1 makes multiple new connections

Before HTTP/2, let's have a brief idea of how slow HTTP/1.1 is,

![http1.1-1](http1.1-1.png)

As you can see from the above chart, 21 new connections are trying to connect to the HTTP server simultaneously after the first request. The gray line in timelines represents time wasted on connecting to the server. My poor server can only serve 5 (first 3, 7th, and 8th) immediately. Overall, the client has to wait for 0.5-1s to start downloading content and reach the red goal line, which means the page is ready for rendering.

* * *

## HTTP/2 multiplexes from the original connection

Below is HTTP/2. No more gray! This is because HTTP/2 keeps one single connection (multiplexing) and no time is wasted on handshaking connections.
![http2-1](http2-1.png)

There are many more benefits from HTTP/2. Feel free to explore!

* * *

## Setup

To set up HTTP/2 on Apache with PHP5 on Debian 8, I have to use Apache 2.4.18 from the testing channel as this version includes ```mod_http2```. Meanwhile, ```mod_fcgid``` is used, but no NPN is required. Lastly, SSL is required for HTTP/2.


**Create /etc/apt/sources.list.d/testing.list**

{% codeblock lang:bash %}
deb     http://mirror.steadfast.net/debian/ testing main contrib non-free
deb-src http://mirror.steadfast.net/debian/ testing main contrib non-free
deb     http://ftp.us.debian.org/debian/    testing main contrib non-free
deb-src http://ftp.us.debian.org/debian/    testing main contrib non-free
{% endcodeblock %}

**Create /etc/apt/preferences.d/testing.pref**
{% codeblock lang:bash %}
Package: *
Pin: release a=testing
Pin-Priority: 750
{% endcodeblock %}

**Add below to site config file**
{% codeblock lang:bash %}
<Location />
AddHandler fcgid-script .php
Options +ExecCGI
FcgidWrapper /usr/bin/php-cgi .php
</Location>
{% endcodeblock %}

**Run below commands**
{% codeblock lang:bash %}
# install Apache 2.4.18 from testing channel instead of 2.4.10 from stable
sudo apt-get install apache2/testing apache2-data/testing apache2-bin/testing libnghttp2-14 libssl1.0.2  apache2-mpm-worker/testing
# fcgid
sudo apt-get libapache2-mod-fcgid
# PHP from testing channel
sudo apt-get install php-getid3/testing php-common/testing libphp-phpmailer/testing

sudo a2enmod mpm_prefork
sudo a2enmod fcgid
sudo a2dismod php5

# finally, restart apache
sudo apache2ctl restart
{% endcodeblock %}

* * *

## Showing active HTTP/2 session

Open chrome://net-internals/#events&q=type:HTTP2_SESSION%20is:active from Chrome. You should see your site listed as in the below screenshot if you have set it up successfully,

![http2-result](http2-result.png)

There are many tutorials about setting up SPDY that would suggest choosing SPDY from the dropdown. SPDY has been removed from the recent version of Chrome.

* * *

## About the new VPS

I have been using Openshift.com for free for years. However, I have to switch to another service from Openshift because the free account doesn't support CA-signed SSL. Paid users can add CA-signed SSL to their website. I do not mind paying, but they do not accept payment from Hong Kong. SSL is getting more important in search engine ranking, and it is required for an advanced protocol such as SPDY that can improve page loading performance. I chose a VPS from hostmada.com for USD 24 a year in the end.

_Enjoy!_
