---
title: 企业网络生存指南 - 如何连接到具有相同 SSID 的另一个 WiFi 路由器
tags:
  - Enterprise
  - Wifi
categories:
  - Cybersecurity
date: 2016-11-06
thumbnail: BSSID1.png
lang: zh-CN
excerpt: "信号满格但无法上网？强制连接到特定 BSSID 解决办公室 WiFi 故障"
comments: true
---

如果你发现你的笔记本电脑在某个区域有 WiFi 连接，但在某些 WiFi 信号满格的区域失去连接，你可能连接到了故障的 WiFi 路由器。办公室中有许多路由器共享相同的 SSID，以便你的笔记本电脑决定连接到最佳的 WiFi 路由器。然而，有些可能会随着时间而故障。如果你连接到附近的故障 WiFi 路由器，允许你连接但没有适当的互联网连接，以下步骤可能会有所帮助。

首先，使用以下命令检查你连接到哪个 WiFi 路由器：

<pre>$ netsh wlan show interface</pre>

查看 SSID 下的 BSSID。SSID 是一个可以代表多个 WiFi 路由器的 ID，但 BSSID 是特定 WiFi 路由器的唯一 ID：

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

笔记本电脑通过路由器 zz:zz:zz:zz:zz:zz 连接到 WiFi 网络 ABC。在 SSID ABC 下还有其他可用的路由器吗？

<pre>$ netsh wlan show all</pre>

从结果中寻找 SHOW NETWORK MODE=BSSID。它显示 WiFi 网络 ABC 可用的所有路由器：

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

SSID ABC 下有 3 个 BSSID，这意味着当你尝试连接到名为 ABC 的 WiFi 网络时，范围内有 3 个 WiFi 路由器。默认情况下，使用信号最强的 WiFi 路由器，因为它可以提供最佳的连接和传输速度。然而，在这种情况下，信号最强的路由器没有正确配置。我们如何强制笔记本电脑连接到正常运作的路由器，即使信号较弱？假设我们想连接到 BSSID 为 xx:xx:xx:xx:xx:xx 的路由器。

* * *

## 强制使用 BSSID 连接

在 Windows 中，我们可以进入控制面板并管理你的 WiFi 设置。右键点击你想连接的 WiFi 网络，然后选择属性。

![BSSID1](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID1.png)

在无线网络属性中，勾选_启用 Intel 连接设置_，然后点击配置。

![BSSID2](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID2.png)

选择_强制访问点_，输入你想连接的 BSSID。点击确定以保存设置。

![BSSID3](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID3.png)

由于信号强度差导致连接不佳，速度可能会较慢，但至少你可以生存下来，直到有人修复问题。

上述选项仅适用于 Intel WiFi 适配器。我不知道其他 WiFi 驱动程序是否提供强制 BSSID 的功能。如果你在其他 WiFi 驱动程序中找到它，请告诉我。
