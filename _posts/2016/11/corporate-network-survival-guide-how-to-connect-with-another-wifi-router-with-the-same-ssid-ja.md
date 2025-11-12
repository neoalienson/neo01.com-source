---
title: >-
  企業ネットワークサバイバルガイド - 同じSSIDを持つ別のWiFiルーターに接続する方法
tags:
  - Enterprise
  - Wifi
id: 7062
categories:
  - Cybersecurity
date: 2016-11-06
thumbnail: /2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID1.png
lang: ja
excerpt: フル信号なのにインターネットがない？特定のBSSIDへの強制接続で故障したオフィスWiFiルーターをバイパスします。
comments: true
---

特定のエリアでノートブックにWiFi接続があるのに、フルWiFi信号のある一部のエリアで接続が失われる場合、故障したWiFiルーターの下にいる可能性があります。オフィスには同じSSIDを共有する多くのルーターがあり、ノートブックが接続する最適なWiFiルーターを決定します。しかし、時間の経過とともに一部が故障する可能性があります。接続を許可するが適切なインターネット接続を持たない近くの故障したWiFiルーターに接続する場合、以下の手順が役立つ可能性があります。

まず、以下のコマンドを使用して、接続しているWiFiルーターを確認します：

<pre>$ netsh wlan show interface</pre>

SSIDの下のBSSIDを見てください。SSIDは複数のWiFiルーターを表すことができるIDですが、BSSIDは特定のWiFiルーターの一意のIDです：

<pre>There is 1 interface on the system:

    Name                   : Wireless Network Connection
    Description            : Intel(R) Centrino(R) Advanced-N 6205
    GUID                   : d827d652-b7f5-412e-xxxx-1235ea895d99
    Physical address       : aa:aa:aa:aa:aa:aa
    State                  : connected
    SSID                   : ABC
    BSSID                  : zz:zz:zz:zz:zz:zz
    Network type           : Infrastructure
    Radio type             : 802.11n
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    Connection mode        : Auto Connect
    Channel                : 1
    Receive rate (Mbps)    : 144
    Transmit rate (Mbps)   : 144
    Signal                 : 99%
    Profile                : ABC

    Hosted network status  : Not started
</pre>

ノートブックはルーターzz:zz:zz:zz:zz:zzを介してWiFiネットワークABCに接続されています。SSID ABCの下に他のルーターはありますか？

<pre>$ netsh wlan show all</pre>

結果からSHOW NETWORK MODE=BSSIDを探します。WiFiネットワークABCで利用可能なすべてのルーターが表示されます：

<pre>=======================================================================
======================= SHOW NETWORKS MODE=BSSID ======================
=======================================================================

SSID 8 : ABC
    Network type            : Infrastructure
    Authentication          : WPA2-Personal
    Encryption              : CCMP
    BSSID 1                 : xx:xx:xx:xx:xx:xx
         Signal             : 80%
         Radio type         : 802.11n
         Channel            : 40
         Basic rates (Mbps) : 6 12 24
         Other rates (Mbps) : 9 18 36 48 54
    BSSID 2                 : yy:yy:yy:yy:yy:yy
         Signal             : 76%
         Radio type         : 802.11n
         Channel            : 161
         Basic rates (Mbps) : 6 12 24
         Other rates (Mbps) : 9 18 36 48 54
    BSSID 3                 : zz:zz:zz:zz:zz:zz
         Signal             : 99%
         Radio type         : 802.11n
         Channel            : 11
         Basic rates (Mbps) : 6.5 16 19.5 117
         Other rates (Mbps) : 18 19.5 24 36 39 48 54 156
</pre>

SSID ABCの下に3つのBSSIDがあります。つまり、ABCという名前のWiFiネットワークに接続しようとすると、範囲内に3つのWiFiルーターがあることを意味します。ノートブックへの信号が最も強いWiFiルーターがデフォルトで使用されます。これは、最高の接続性と転送速度を提供できるためです。しかし、この場合、最も強い信号を持つルーターが適切に構成されていません。信号は弱いが動作しているルーターに強制的に接続するにはどうすればよいでしょうか？BSSID xx:xx:xx:xx:xx:xxのルーターに接続したいとしましょう。

* * *

## BSSIDとの強制接続

Windowsでは、コントロールパネルに移動してWiFi設定を管理できます。接続したいWiFiネットワークを右クリックし、プロパティを選択します。

![BSSID1](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID1.png)

ワイヤレスネットワークのプロパティで、_Intel接続設定を有効にする_をチェックし、構成をクリックします。

![BSSID2](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID2.png)

_必須アクセスポイント_を選択し、接続したいBSSIDを入力します。OKをクリックして設定を保存します。

![BSSID3](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID3.png)

信号強度が弱いため接続性が悪く、遅くなる可能性がありますが、少なくとも誰かが問題を修正するまで生き残ることができます。

上記のオプションはIntel WiFiアダプターでのみ機能します。他のWiFiドライバーがBSSIDを強制する機能を提供しているかどうかはわかりません。別のWiFiドライバーで見つけた場合は教えてください。
