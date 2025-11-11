---
title: 'Apple Swift 2のtry-catchの紹介、IBM BluemixによるWebサンドボックス付き'
tags:
  - Apple
  - iOS
  - Swift
id: 6963
categories:
  - Development
date: 2015-12-07
thumbnail: /assets/coding/swift.png
lang: ja
excerpt: Swift 2のtry-catchはGoよりエレガント？IBMのWebベースサンドボックスでSwift 2.2の新しいエラー処理機能を自分で試してみましょう。
---

Apple SwiftはiOSアプリケーション開発のためのプログラミング言語です。MacのXcodeで見つけることができます。

現在、Apple Swift 2は[IBM Bluemixのウェブサイト（http://swiftlang.ng.bluemix.net）](http://swiftlang.ng.bluemix.net)でホストされています。今日現在、Swiftバージョンは2.2-devです。

{% codeblock %}
Swift version 2.2-dev (LLVM 46be9ff861, Clang 4deb154edc, Swift 778f82939c)
Target: x86_64-unknown-linux-gnu
{% endcodeblock %}

Swift 2には多くの言語機能が導入されています。サンプルコードからエレガントなtry-catch機能を始めましょう。

{% codeblock lang:swift %}
/* Swiftの基本的なフィボナッチ関数。
   関数呼び出しと再帰を示します。
*/

func Fibonacci(i: Int) throws -> Int  {
    if i <= 2 {
        return 1
    } else {
return try Fibonacci(i - 1) + Fibonacci(i - 2)
    }
}

do {
try print(Fibonacci(22))
  /* 途中で投げないことをする
  */
  // キーワードは以下の関数が投げることを思い出させます
try print(Fibonacci(11))
} catch {
  print("error")
}
{% endcodeblock %}

関数は実際には何も投げませんが、投げる関数呼び出しには```try```が前置されていることがわかります。

この機能に関するSwift言語の進化速度は、GoogleのGo言語よりも少し速いようです。
