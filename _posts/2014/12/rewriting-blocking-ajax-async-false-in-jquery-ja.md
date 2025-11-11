---
title: 'ブロッキングAJAXの書き換え（jQueryのasync: false）'
tags:
  - jasmine
  - javascript
id: 6805
categories:
  - Development
date: 2014-12-15
lang: ja
excerpt: "ブロッキングAJAX呼び出しを非同期モードに書き換える方法を学びましょう。JavaScriptコードのasync: falseとグローバル変数のアンチパターンを排除します。"
thumbnail: /assets/coding/2.png
---

JavaScriptの一部をテストするためにJasmine Ajaxを適用したとき、行き詰まりました。原因はJasmine AjaxがブロッキングAJAX呼び出しをサポートしていないことでした。Jasmine Ajaxを責めるつもりはありません。なぜなら、ブロッキングAJAX呼び出しを行うことは全く意味がないと思うからです。

ほとんどすべての開発者は、AJAXを非同期を意味する頭字語と考えています。しかし、AJAXの世界は一部の新しい学習者にとって複雑であり、ブロッキングを伴うAJAX呼び出しを見ることは珍しくありません。ブロッキングAJAX呼び出しは、ほとんどのWeb、モバイル、サーバープラットフォームで悪い慣行と見なされています。理由はプラットフォームによって若干異なりますが、全体的に、JavaScriptはシングルスレッドであり、ブロッキング呼び出しは機能の停止を意味します。

以下は、`async: false`を使用したブロッキングを伴うjQuery AJAX呼び出しの例です（そして別のアンチパターン、グローバル変数の使用）：

{% codeblock lang:js line_number:false %}
var someGlobal = false;

$.ajax({
    type: "GET",
    url: "//somewhere",
    contentType: "application/json; charset=utf-8", 
    async: false,
    success: (function() {
        someGlobal = true;
    })
});

if (someGlobal) {
   // フォローアップ
}
{% endcodeblock %}

上記の例は、ステップバイステップで実行されるため、ある意味で理解しやすいです。**someGlobal**の値は、フォローアップする前に適切に割り当てられます。ブロッキングとグローバル変数の使用を除けば、すべて問題ありません。これを書き換えて見てみましょう。

{% codeblock lang:js line_number:false %}
$.ajax({
    type: "GET",
    url: "//somewhere",
    contentType: "application/json; charset=utf-8", 
    async:true,
    success: (function() {
        followUp(true);
    }),
    error: (function() {
        followUp(false);
    })
});

// パラメータresultはsomeGlobalから名前変更
function followUp(result) {
    // フォローアップ
}
{% endcodeblock %}

これで、`async: true`設定により、AJAXリクエストはブロックされません。フォローアップのコードを別の`followUp`関数に配置しました。グローバル変数は必要ありません。実際には、これはコールバックチェーンの一部になる可能性があり、それについては後で説明します。
