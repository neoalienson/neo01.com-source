---
title: Passkeys - シームレスなセキュリティへの入り口
date: 2023-12-15
lang: ja
categories:
  - Cybersecurity
thumbnail: /2023/12/Passkeys_Your_Gateway_to_Seamless_Security/thumbnail.jpeg
excerpt: "醜くて長い記号混じりのパスワードに別れを告げることができるでしょうか？はい！洗練されたサイバーセキュリティソリューション、Passkeysを歓迎しましょう。"
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
comments: true
---

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/index.jpeg)

デジタルの世界では、パスワードは個人の宝箱への鍵のようなものですが、正直に言うと、必要なときに見つからない付箋の束のようなもので、なぜか他の誰かは見つけられてしまいます。パスワードをある程度排除できるでしょうか？はい、Passkeysで可能です。

> Passkeyは、さまざまなオンラインサービスやアカウントへのアクセスを保護するために使用される認証方法の一種です。個々のユーザー専用に生成される公開鍵と秘密鍵からなる一意のキーペアです

...つまり、生体認証を使用して携帯電話や指紋デバイスでログインを認証します。

Passkeysを採用する前に、https://www.passkeys.io/ で試すことができます。https://www.passkeys.io/#How-to-use-a-passkey の手順を必ず読んでください。同じアカウントに対して複数のデバイスでpasskeyを作成できます。

## 初心者向けPasskeyの仕組み

以下のデモは、指紋センサーとWindows Helloを搭載したWindowsで実行されます。モバイルでも同じ体験ができます。

### Webサイトでアカウントを作成する

多くのアプリケーションと同様に、まずアカウントを作成する必要があります。ほとんどのWebサイトでは、快適に利用できるようにパスワード設定を求められます。

<link rel="stylesheet" href="/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/style.css">

お好きなメールアドレスでアカウントを作成します。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create1.png class="border">

これはデモなので登録はスキップされます。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create2.png class="border">

### 最初のpasskeyを作成する

作成ボタンをクリックすると、Webサイトはブラウザにpasskeyのセットアップを要求します。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create3.png class="border">

ブラウザは、passkey機能を持つモジュールにリクエストを転送します。この場合はBitwardenです。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create4.png class="border">

生体認証で認証します。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create5.png class="border">

公開鍵/秘密鍵のペアを作成します。秘密鍵はモジュール内に留まります。公開鍵のみがブラウザとWebサイトに送り返されます。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create6.png class="border">

これで完了です！Webサイトはあなたのアカウントをpasskeyに関連付けます。ログアウト/サインアウトできます。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create8.png class="border">

### ログイン

ログインはアカウント作成と非常に似ています。passkeyでサインインします。メールアドレスを入力する必要はありません。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/login1.png class="border">

プロセスは同じです。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/login2.png class="border">

複数のデバイスを使用してログインできることに気付くかもしれません。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create9.png class="border">

### アカウントに2つ目のpasskeyを設定する

「別のデバイスを使用」を試してみましょう。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create10.png class="border">

「iPhone、iPad、またはAndroidデバイス」

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create11.png class="border">

デバイスからQRコードをスキャンします。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create12.png class="border">

デバイスは、QRコードがあなたのアカウントからスキャンされたことをWebサイトに伝えます。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create13.png class="border">

認証後、デバイスは独自の公開鍵/秘密鍵のペアを生成し、公開鍵をWebサイトに送信します。

<img src=/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/create14.png class="border">

これで2つ目のpasskeyを使用してログインできます！

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/passkey_setup.png)

### モバイルデバイスを紛失した場合

アカウントの回復方法を必ず設定してください！2つ目のpasskeyは回復手段になりますが、自分にとって信頼できるものを選んでください。そうしないと、以下のようになってしまいます。

![](/2023/12/Passkeys_Your_Gateway_to_Seamless_Security/passkey_lost.jpeg)

## Passkeyはどこで使えますか

以下のリストは、passkeyの採用に対応しているサービスを特定するのに役立ちます。

Passkeyをサポートするサービス/OS：
* [Bitwarden](https://bitwarden.com/)
* Windows（Windows Hello）
* iOS
* Android

Passkeyをサポートするウェブサイト/アプリ：
* [Amazon](https://amazon.com)
* [Apple ID](https://apple.com) iOSのみ
* [GitHub](https://github.com)
* [Google Account](https://myaccount.google.com)
* [Internet Identity](https://identity.ic0.app/)
* [LinkedIn](https://www.linkedin.com/)
* [npmjs.com](https://www.npmjs.com/)
* WhatsApp（Android & iOS）
* [Yahoo](https://yahoo.com/)

Passkeyはまだサポートしていないが多要素認証（MFA）をサポートするウェブサイト：
* [Atlassian](https://atlassian.com) および[Bitbucket](https://bitbucket.com)などの製品ファミリー
* [Docker](https://docker.com)
* [Gitlab](https://gitlab.com)
* [terraform.io](https://terraform.io)
* [Wellfound.com](https://wellfound.com/)

Passkeysは従来のフィッシング攻撃に対して脆弱ではなく、複雑なパスワードを記憶する必要がないため、セキュリティ強化のためにPasskeysの採用をお勧めします。

業界大手のサポートと提供される利便性により、Passkeysはデジタルセキュリティの新しい標準になる予定です。
