---
title: Passkeys - 您通往无缝安全的门户
date: 2023-12-15
categories:
  - Cybersecurity
thumbnail: thumbnail.jpeg
excerpt: 我们能告别那些丑陋、冗长的符号混合密码吗？是的！让我们欢迎 Passkeys，我们时尚性感的网络安全解决方案。
lang: zh-CN
comments: true
---

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/index.jpeg)

在数字世界中，密码就像您个人宝箱的钥匙，但让我们面对现实，它们更像是一堆您需要时找不到但其他人不知何故可以找到的便利贴。我们能在某种程度上消除密码吗？是的，使用 Passkeys。

> Passkey 是一种用于保护对各种在线服务和账户的访问的验证方法。它是一个唯一的密钥对，由为个别用户专门生成的公钥和私钥组成

... 简而言之，使用您的手机或指纹设备与生物识别来验证您的登录。

在采用 Passkeys 之前，您可以在 https://www.passkeys.io/ 上进行试用。记得阅读 https://www.passkeys.io/#How-to-use-a-passkey 的说明。您可以为同一账户在多个设备上创建 passkey。

## Passkey 如何运作（简单版）

以下演示在具有指纹传感器和 Windows Hello 的 Windows 上执行。您可以在移动设备上获得相同的体验。

### 在网站上创建账户

像许多应用程序一样，您需要先创建一个账户。大多数网站会要求您设置密码以让您感到舒适。

<link rel="stylesheet" href="/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/style.css">

使用您喜欢的电子邮件创建账户，

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create1.png class="border">

注册被跳过，因为这只是一个演示

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create2.png class="border">

### 创建第一个 passkey

一旦您点击创建按钮，网站会要求您的浏览器设置 passkey。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create3.png class="border">

您的浏览器将您的请求导向具有 passkey 功能的模块。在这种情况下是 Bitwarden。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create4.png class="border">

使用生物识别进行验证。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create5.png class="border">

创建公钥/私钥对。私钥保留在模块中。只有公钥发送回浏览器和网站。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create6.png class="border">

就是这样！网站将您的账户与您的 passkey 关联。您可以登出/退出。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create8.png class="border">

### 登录

登录与创建账户非常相似。使用 passkey 登录。您不需要提供您的电子邮件地址。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/login1.png class="border">

过程是相同的。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/login2.png class="border">

您可能会注意到您可以使用多个设备登录。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create9.png class="border">

### 为您的账户设置第二个 passkey

让我们尝试"使用其他设备"

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create10.png class="border">

"iPhone、iPad 或 Android 设备"

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create11.png class="border">

从您的设备扫描 QR 码。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create12.png class="border">

您的设备告诉网站 QR 码是从您的账户扫描的。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create13.png class="border">

验证后，您的设备生成自己的公钥/私钥对，然后将公钥发送到网站。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create14.png class="border">

您现在可以使用第二个 passkey 登录！

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/passkey_setup.png)

### 如果我的移动设备丢失了怎么办

记得为您的账户设置恢复方法！第二个 passkey 可以作为恢复方法，但请选择一个对您自己可靠的方法。否则您最终会像下面这样。

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/passkey_lost.jpeg)

## 我可以在哪里使用 passkey

以下清单将协助您识别与 passkey 采用兼容的服务。

支持 Passkey 的服务/操作系统：
* [Bitwarden](https://bitwarden.com/)
* Windows（Windows Hello）
* iOS
* Android

支持 Passkey 的网站/应用程序：
* [Amazon](https://amazon.com)
* [Apple ID](https://apple.com) 仅限 iOS
* [GitHub](https://github.com)
* [Google Account](https://myaccount.google.com)
* [Internet Identity](https://identity.ic0.app/)
* [LinkedIn](https://www.linkedin.com/)
* [npmjs.com](https://www.npmjs.com/)
* WhatsApp（Android 和 iOS）
* [Yahoo](https://yahoo.com/)

尚未支持 Passkey 但支持多因素验证（MFA）的网站：
* [Atlassian](https://atlassian.com) 及其产品系列，如 [Bitbucket](https://bitbucket.com)
* [Docker](https://docker.com)
* [Gitlab](https://gitlab.com)
* [terraform.io](https://terraform.io)
* [Wellfound.com](https://wellfound.com/)


鼓励您采用 Passkeys 以增强安全性，因为它们不易受到传统网络钓鱼攻击的影响，也不需要记住复杂的密码。

在业界巨头的支持和它们提供的便利性下，Passkeys 将成为数字安全的新标准。
