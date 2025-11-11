---
title: '介绍 Apple Swift 2 的 try-catch，以及 IBM Bluemix 的网页沙盒'
tags:
  - Apple
  - iOS
  - Swift
categories:
  - Development
date: 2015-12-07
thumbnail: /assets/coding/swift.png
lang: zh-CN
excerpt: "Swift 2 的 try-catch 比 Go 更优雅？在 IBM 网页沙盒中亲自体验 Swift 2.2 的新特性"
---

Apple Swift 最初是用于 iOS 应用程序开发的编程语言。它可以在 Mac 的 Xcode 中找到。

现在 Apple Swift 2 托管在 [IBM Bluemix 的网站 (http://swiftlang.ng.bluemix.net)](http://swiftlang.ng.bluemix.net)。截至今天，Swift 版本为 2.2-dev，

{% codeblock %}
Swift version 2.2-dev (LLVM 46be9ff861, Clang 4deb154edc, Swift 778f82939c)
Target: x86_64-unknown-linux-gnu
{% endcodeblock %}

Swift 2 引入了许多语言特性。让我们从示例代码开始介绍优雅的 try-catch 特性，

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

该函数实际上并没有抛出任何东西，但你可以看到会抛出的函数调用都以 ```try``` 为前缀。

Swift 语言在这个特性上的演进速度似乎比 Google 的 Go 语言快一点。
