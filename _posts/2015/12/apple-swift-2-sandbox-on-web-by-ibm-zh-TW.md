---
title: '介紹 Apple Swift 2 的 try-catch，以及 IBM Bluemix 的網頁沙盒'
tags:
  - Apple
  - iOS
  - Swift
categories:
  - Development
date: 2015-12-07
thumbnail: /assets/coding/swift.png
lang: zh-TW
excerpt: "Swift 2 的 try-catch 比 Go 更優雅？在 IBM 網頁沙盒中親自體驗 Swift 2.2 的新特性"
---

Apple Swift 最初是用於 iOS 應用程式開發的程式語言。它可以在 Mac 的 Xcode 中找到。

現在 Apple Swift 2 託管在 [IBM Bluemix 的網站 (http://swiftlang.ng.bluemix.net)](http://swiftlang.ng.bluemix.net)。截至今天，Swift 版本為 2.2-dev，

{% codeblock %}
Swift version 2.2-dev (LLVM 46be9ff861, Clang 4deb154edc, Swift 778f82939c)
Target: x86_64-unknown-linux-gnu
{% endcodeblock %}

Swift 2 引入了許多語言特性。讓我們從範例程式碼開始介紹優雅的 try-catch 特性，

{% codeblock lang:swift %}
/* Basic Fibonacci function in swift.
   Demonstrates func calls and recursion.
*/

func Fibonacci(i: Int) throws -> Int  {
    if i <= 2 {
        return 1
    } else {
return **try** Fibonacci(i - 1) + Fibonacci(i - 2)
    }
}

do {
try print(Fibonacci(22))
  /* do something that doesn't throw in the middle
  */
  // the keyword reminds you below function will throw
try print(Fibonacci(11))
} catch {
  print("error")
}
{% endcodeblock %}

該函數實際上並沒有拋出任何東西，但你可以看到會拋出的函數呼叫都以 ```try``` 為前綴。

Swift 語言在這個特性上的演進速度似乎比 Google 的 Go 語言快一點。
