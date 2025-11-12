---
title: How To Setup Root Certificate For MITM Proxy On iOS
date: 2018-03-28
tags:
  - iOS
  - Test Automation
categories:
  - Development
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
excerpt: "Step-by-step visual guide to install and trust BrowserMob-Proxy root certificate on iOS devices. Intercept HTTPS traffic without complaints!"
comments: true
---

Trusting the root certificate for debugging proxies such as BrowserMob-Proxy on iOS is quite strict in its forward direction. You can download the certificate from [ca-certificate-rsa.cer](https://github.com/lightbody/browsermob-proxy/blob/master/browsermob-core/src/main/resources/sslSupport/ca-certificate-rsa.cer) using Device's Safari, or you can drag the file into the Simulator as well.

1. Tap on Allow to install the cert
![](setup_cert_ios_01.png)

2. Tap `Install` on the upper right
![](setup_cert_ios_02.png)

3. Again, tap `Install` on the upper right
![](setup_cert_ios_03.png)

4. `Install`
![](setup_cert_ios_04.png)

5. Once verified, tap on `Done`. The certificate is installed
![](setup_cert_ios_05.png)

6. To trust the certificate as Root Certificate, goto `About` in `General`
![](setup_cert_ios_06.png)

7. Scroll down until you see `Certificate Trust Settings`
![](setup_cert_ios_07.png)

8. Toggle on the `LittleProxy MITM` to trust it
![](setup_cert_ios_08.png)

9. Tap `Continue` to trust it as Root Certificate
![](setup_cert_ios_09.png)

10. Done. Now all traffic can be intercepted by the proxy without any complaint
![](setup_cert_ios_10.png)

<link rel="stylesheet" href="style.css">
