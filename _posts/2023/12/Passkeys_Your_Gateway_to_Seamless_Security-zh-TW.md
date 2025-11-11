---
title: Passkeys - 您通往無縫安全的門戶
date: 2023-12-15
categories:
  - Cybersecurity
thumbnail: thumbnail.jpeg
excerpt: 我們能告別那些醜陋、冗長的符號混合密碼嗎？是的！讓我們歡迎 Passkeys，我們時尚性感的網路安全解決方案。
lang: zh-TW
comments: true
---

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/index.jpeg)

在數位世界中，密碼就像您個人寶箱的鑰匙，但讓我們面對現實，它們更像是一堆您需要時找不到但其他人不知何故可以找到的便利貼。我們能在某種程度上消除密碼嗎？是的，使用 Passkeys。

> Passkey 是一種用於保護對各種線上服務和帳戶的存取的驗證方法。它是一個唯一的金鑰對，由為個別使用者專門生成的公鑰和私鑰組成

... 簡而言之，使用您的手機或指紋裝置與生物識別來驗證您的登入。

在採用 Passkeys 之前，您可以在 https://www.passkeys.io/ 上進行試用。記得閱讀 https://www.passkeys.io/#How-to-use-a-passkey 的說明。您可以為同一帳戶在多個裝置上建立 passkey。

## Passkey 如何運作（簡單版）

以下示範在具有指紋感應器和 Windows Hello 的 Windows 上執行。您可以在行動裝置上獲得相同的體驗。

### 在網站上建立帳戶

像許多應用程式一樣，您需要先建立一個帳戶。大多數網站會要求您設定密碼以讓您感到舒適。

<link rel="stylesheet" href="/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/style.css">

使用您喜歡的電子郵件建立帳戶，

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create1.png class="border">

註冊被跳過，因為這只是一個示範

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create2.png class="border">

### 建立第一個 passkey

一旦您點擊建立按鈕，網站會要求您的瀏覽器設定 passkey。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create3.png class="border">

您的瀏覽器將您的請求導向具有 passkey 功能的模組。在這種情況下是 Bitwarden。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create4.png class="border">

使用生物識別進行驗證。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create5.png class="border">

建立公鑰/私鑰對。私鑰保留在模組中。只有公鑰發送回瀏覽器和網站。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create6.png class="border">

就是這樣！網站將您的帳戶與您的 passkey 關聯。您可以登出/退出。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create8.png class="border">

### 登入

登入與建立帳戶非常相似。使用 passkey 登入。您不需要提供您的電子郵件地址。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/login1.png class="border">

過程是相同的。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/login2.png class="border">

您可能會注意到您可以使用多個裝置登入。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create9.png class="border">

### 為您的帳戶設定第二個 passkey

讓我們嘗試「使用其他裝置」

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create10.png class="border">

「iPhone、iPad 或 Android 裝置」

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create11.png class="border">

從您的裝置掃描 QR 碼。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create12.png class="border">

您的裝置告訴網站 QR 碼是從您的帳戶掃描的。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create13.png class="border">

驗證後，您的裝置生成自己的公鑰/私鑰對，然後將公鑰發送到網站。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create14.png class="border">

您現在可以使用第二個 passkey 登入！

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/passkey_setup.png)

### 如果我的行動裝置遺失了怎麼辦

記得為您的帳戶設定恢復方法！第二個 passkey 可以作為恢復方法，但請選擇一個對您自己可靠的方法。否則您最終會像下面這樣。

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/passkey_lost.jpeg)

## 我可以在哪裡使用 passkey

以下清單將協助您識別與 passkey 採用相容的服務。

支援 Passkey 的服務/作業系統：
* [Bitwarden](https://bitwarden.com/)
* Windows（Windows Hello）
* iOS
* Android

支援 Passkey 的網站/應用程式：
* [Amazon](https://amazon.com)
* [Apple ID](https://apple.com) 僅限 iOS
* [GitHub](https://github.com)
* [Google Account](https://myaccount.google.com)
* [Internet Identity](https://identity.ic0.app/)
* [LinkedIn](https://www.linkedin.com/)
* [npmjs.com](https://www.npmjs.com/)
* WhatsApp（Android 和 iOS）
* [Yahoo](https://yahoo.com/)

尚未支援 Passkey 但支援多因素驗證（MFA）的網站：
* [Atlassian](https://atlassian.com) 及其產品系列，如 [Bitbucket](https://bitbucket.com)
* [Docker](https://docker.com)
* [Gitlab](https://gitlab.com)
* [terraform.io](https://terraform.io)
* [Wellfound.com](https://wellfound.com/)


鼓勵您採用 Passkeys 以增強安全性，因為它們不易受到傳統網路釣魚攻擊的影響，也不需要記住複雜的密碼。

在業界巨頭的支持和它們提供的便利性下，Passkeys 將成為數位安全的新標準。
