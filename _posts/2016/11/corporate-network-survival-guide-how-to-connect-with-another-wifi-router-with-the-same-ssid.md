---
title: >-
  Corporate Network Survival Guide - How to Connect with Another WiFi Router
  with the Same SSID
tags:
  - Enterprise
  - Wifi
id: 7062
categories:
  - Cybersecurity
date: 2016-11-06
thumbnail: BSSID1.png
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: "Full signal but no internet? Force connection to specific BSSID to bypass faulty office WiFi routers."
comments: true
---

If you find your notebook has WiFi connectivity in a certain area but loses it in some areas with full WiFi signal, you may be under a faulty WiFi router. There are many routers in an office that share the same SSID so that your notebook determines the best WiFi router to connect with. However, some may fail over time. The steps below may help if you connect to a faulty WiFi router nearby that allows you to connect but does not have proper Internet connectivity.

First, use the command below to check which WiFi router you are connecting to:

<pre>$ netsh wlan show interface</pre>

Take a look at the BSSID under SSID. SSID is an ID that could represent more than one WiFi router, but BSSID is the unique ID for a specific WiFi router:

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

The notebook is connected to the WiFi network ABC via router zz:zz:zz:zz:zz:zz. Are any other routers available under the SSID ABC?

<pre>$ netsh wlan show all</pre>

Look for SHOW NETWORK MODE=BSSID from the result. It shows all the routers available for WiFi network ABC:

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

There are 3 BSSIDs under SSID ABC, which means there are 3 WiFi routers in range when you are trying to connect to the WiFi network named ABC. The WiFi router with the strongest signal to your notebook is used by default, as it can provide the best connectivity and transfer speed. However, the router with the strongest signal is not configured properly in this case. How do we force the notebook to connect to a router that is working although the signal is weaker? Let's say we want to connect to the router with BSSID xx:xx:xx:xx:xx:xx.

* * *

## Forcing Connection with BSSID

In Windows, we can go to the Control Panel and manage your WiFi settings. Right-click on the WiFi network that you want to connect with, and then select Properties.

![BSSID1](BSSID1.png)

In the Wireless Network Properties, check _Enable Intel connection settings_, then click Configure.

![BSSID2](BSSID2.png)

Select _Mandatory Access Point_, key in the BSSID that you want to connect with. Click OK to save the settings.

![BSSID3](BSSID3.png)

It may be slower as you have poor connectivity due to poor signal strength, but you survive at least until someone fixes the issue.

The above option only works for Intel WiFi adapters. I do not know if other WiFi drivers provide the feature for enforcing BSSID. Let me know if you have found it in another WiFi driver.
