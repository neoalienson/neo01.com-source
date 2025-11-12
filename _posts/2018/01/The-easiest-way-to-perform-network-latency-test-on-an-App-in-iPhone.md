---
title: The easiest way to perform network latency test on an App in iPhone
date: 2018-01-04
tags:
  - iOS
categories:
  - Development
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: "No proxy or router needed! Simulate network latency and poor network conditions on iOS using the built-in Network Link Conditioner. Test your app's performance effortlessly."
comments: true
---

Simulating network latency or even poor network conditions in iOS is very easy. You don't need to set up a proxy, router, or a poor network provider. All you have to do is enable Developer mode using Xcode. Then, you can see the **Developer** icon, which allows you to easily simulate various network scenarios.

![](step1.png)

***

Under Developer, you can see the **Network Link Conditioner**. By default it is *Off*. Tap on the **Network Link Conditioner**,
![](step2.png)

***

There are several profiles for you to use. You can utilize the **ping** time (round-trip) from your mobile phone to your target backend, and then subtract the **ping** time from your lab's backend. To create a new profile, simply tap on **Add a profile...**
![](step3.png)

***

Let's say the ping time is 900ms, you can set either **Out Delay**, **In Delay** or both.
![](step4.png)

***

Done!

<link rel="stylesheet" href="style.css">
