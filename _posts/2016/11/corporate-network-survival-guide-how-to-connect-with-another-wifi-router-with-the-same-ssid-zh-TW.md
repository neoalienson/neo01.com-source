---
title: 企業網路生存指南 - 如何連接到具有相同 SSID 的另一個 WiFi 路由器
tags:
  - Enterprise
  - Wifi
categories:
  - Cybersecurity
date: 2016-11-06
thumbnail: BSSID1.png
lang: zh-TW
excerpt: "訊號滿格但無法上網？強制連接到特定 BSSID 解決辦公室 WiFi 故障"
comments: true
---

如果你發現你的筆記型電腦在某個區域有 WiFi 連線，但在某些 WiFi 訊號滿格的區域失去連線，你可能連接到了故障的 WiFi 路由器。辦公室中有許多路由器共享相同的 SSID，以便你的筆記型電腦決定連接到最佳的 WiFi 路由器。然而，有些可能會隨著時間而故障。如果你連接到附近的故障 WiFi 路由器，允許你連接但沒有適當的網際網路連線，以下步驟可能會有所幫助。

首先，使用以下命令檢查你連接到哪個 WiFi 路由器：

<pre>$ netsh wlan show interface</pre>

查看 SSID 下的 BSSID。SSID 是一個可以代表多個 WiFi 路由器的 ID，但 BSSID 是特定 WiFi 路由器的唯一 ID：

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

筆記型電腦透過路由器 zz:zz:zz:zz:zz:zz 連接到 WiFi 網路 ABC。在 SSID ABC 下還有其他可用的路由器嗎？

<pre>$ netsh wlan show all</pre>

從結果中尋找 SHOW NETWORK MODE=BSSID。它顯示 WiFi 網路 ABC 可用的所有路由器：

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

SSID ABC 下有 3 個 BSSID，這意味著當你嘗試連接到名為 ABC 的 WiFi 網路時，範圍內有 3 個 WiFi 路由器。預設情況下，使用訊號最強的 WiFi 路由器，因為它可以提供最佳的連線和傳輸速度。然而，在這種情況下，訊號最強的路由器沒有正確配置。我們如何強制筆記型電腦連接到正常運作的路由器，即使訊號較弱？假設我們想連接到 BSSID 為 xx:xx:xx:xx:xx:xx 的路由器。

* * *

## 強制使用 BSSID 連接

在 Windows 中，我們可以進入控制台並管理你的 WiFi 設定。右鍵點擊你想連接的 WiFi 網路，然後選擇內容。

![BSSID1](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID1.png)

在無線網路內容中，勾選_啟用 Intel 連線設定_，然後點擊設定。

![BSSID2](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID2.png)

選擇_強制存取點_，輸入你想連接的 BSSID。點擊確定以儲存設定。

![BSSID3](/2016/11/corporate-network-survival-guide-how-to-connect-with-another-wifi-router-with-the-same-ssid/BSSID3.png)

由於訊號強度差導致連線不佳，速度可能會較慢，但至少你可以生存下來，直到有人修復問題。

上述選項僅適用於 Intel WiFi 介面卡。我不知道其他 WiFi 驅動程式是否提供強制 BSSID 的功能。如果你在其他 WiFi 驅動程式中找到它，請告訴我。
