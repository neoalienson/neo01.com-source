---
title: My Fiddler Cookbook
id: 7270
categories:
  - Development
date: 2017-05-20
tags:
thumbnail: fiddler.jpg
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
excerpt: "Master essential Fiddler tricks: HTTPS decryption, simple load testing, and request modification. The most powerful debugging proxy tool on Windows!"
comments: true
---

Fiddler is my favorite debugging proxy on Windows. Usually, I use Python to write simple debugging proxy which is usually less than 30 lines until it needs https.

# Enabling https decryption

That's why my first configuration on Fiddler is Decrypting HTTPS traffic,

![](fiddler-2.png)

Check Decrypt HTTPS traffic and click OK.
![](fiddler-3.png)

It will then ask to install a Trust Root Certificate,
![](fiddler-4a.png)
![](fiddler-4b.png)

The scary text is a warning about https traffic being seen by Fiddler. Fiddler's root certificate is now trusted, which means Fiddler can generate certificates trusted by your applications, including your browser.

If it doesn't prompt you to install the certificate, you can have the certificate installed with below,
![](fiddler-5.png)

# A Simple Load Test

You can run a very simple load test by selecting multiple request, and then press R. Beware the response from the server may be cached in different layer of the infrastructure.
![](fiddler-6.png)

You can see how well the servers perform from the Timeline.
![](fiddler-7.png)

Sometimes you can even see the number of outgoing connection limit on Windows by checking with Timeline.

# Modifying your request

You can also modify your request before sending it out,
![](fiddler-8.png)
