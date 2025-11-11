---
title: Passkeys - Your Gateway to Seamless Security
date: 2023-12-15
categories:
  - Cybersecurity
thumbnail: thumbnail.jpeg
excerpt: Can we say goodbye to those ugly, long strings of symbol-mixed passwords? Yes! Let's welcome Passkeys, our sleek and sexy cybersecurity solution.
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
---

![](index.jpeg)

In the digital world, passwords are like the keys to your personal treasure chest, but let's face it, they're more like a bunch of sticky notes you can't find when you need them but someone else somehow can. Can we eliminate passwords by some degree? Yes, with Passkeys.

> Passkey is a type of authentication method used to secure access to various online services and accounts. It is a unique key pair consisting of a public key and a private key that is generated specifically for an individual user

... in short, use your phone or fingerprint device with biometric to authenticate your login.

Before adopting Passkeys you can have a trial on https://www.passkeys.io/. Remember to read instructions from https://www.passkeys.io/#How-to-use-a-passkey. You can create a passkey on multiple devices for the same account.

## How Passkey works for dummies

Below demo runs on a Windows with fingerprint sensor and Windows Hello. You can have the same experience on mobile.

### Creating an account on website

Like many applications, you need to create an account first. Most websites would ask you for a password setup to keep you comfortable.

<link rel="stylesheet" href="style.css">

Create an account with email you like,

<img src=create1.png class="border">

Registration is skipped as this is just a demo

<img src=create2.png class="border">

### Create first passkey

Once you click the create button, the website would ask your browser to setup passkey.

<img src=create3.png class="border">

Your browser directs your request to a module which has passkey capability. Bitwarden in this case.

<img src=create4.png class="border">

Authenticate with biometric.

<img src=create5.png class="border">

Create a public/private key pair. Private key stays in the module. Only public key send back to browser and the website.

<img src=create6.png class="border">

That's it! The website associates your account with your passkey. You can logout/sign out.

<img src=create8.png class="border">

### Login

Login is very similar to creating an account. Sign in with a passkey. You don't need to provide your email address.

<img src=login1.png class="border">

The process is the same.

<img src=login2.png class="border">

You may notice that you can use more than one device to login.

<img src=create9.png class="border">

### Setting up second passkey for your account

Let's try "Use another device"

<img src=create10.png class="border">

"iPhone, iPad, or Android device"

<img src=create11.png class="border">

Scan QR code from your device.

<img src=create12.png class="border">

Your device tells the website that the QR code is scanned from your account.

<img src=create13.png class="border">

After authentication, your device generates its own public/private key pair, and then sends the public key to the website. 

<img src=create14.png class="border">

You can now use the second passkey to login!

![](passkey_setup.png)

### What if my mobile device is lost

Remember to setup recovery method for your account! Second passkey can be a recovery but please pick a reliable one to yourself. Otherwise you will end up like below.

![](passkey_lost.jpeg)

## Where can I use passkey

The following list will assist you in identifying services that are compatible with passkey adoption.

Services/OS that support Passkey:
* [Bitwarden](https://bitwarden.com/)
* Windows (Windows Hello)
* iOS
* Android

Websites/Apps that support Passkey:
* [Amazon](https://amazon.com)
* [Apple ID](https://apple.com) iOS only
* [GitHub](https://github.com)
* [Google Account](https://myaccount.google.com)
* [Internet Identity](https://identity.ic0.app/)
* [LinkedIn](https://www.linkedin.com/)
* [npmjs.com](https://www.npmjs.com/)
* WhatsApp (Android & iOS)
* [Yahoo](https://yahoo.com/)

Websites that do not yet support Passkey but support Multi-Factor Authentication (MFA):
* [Atlassian](https://atlassian.com) and its product family such as [Bitbucket](https://bitbucket.com)
* [Docker](https://docker.com)
* [Gitlab](https://gitlab.com)
* [terraform.io](https://terraform.io)
* [Wellfound.com](https://wellfound.com/)


You are encouraged to adopt Passkeys for enhanced security, as they are not susceptible to traditional phishing attacks and do not require memorizing complex passwords. 

With the support of industry giants and the convenience they offer, Passkeys are set to become the new standard in digital security.
