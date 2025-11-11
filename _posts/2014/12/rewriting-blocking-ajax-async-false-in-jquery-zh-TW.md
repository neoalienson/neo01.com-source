---
title: '重寫阻塞式 AJAX（JQuery 中的 async: false）'
tags:
  - jasmine
  - javascript
id: 6805
categories:
  - Development
date: 2014-12-15
lang: zh-TW
excerpt: "學習如何將阻塞式 AJAX 呼叫重寫為非同步模式。消除 async: false 和全域變數的反模式。"
thumbnail: /assets/coding/2.png
---

當我應用 Jasmine Ajax 來測試一段 JavaScript 時，我卡住了，我發現原因是 Jasmine Ajax 不支援阻塞式 AJAX 呼叫。我不怪 Jasmine Ajax，因為我認為進行阻塞式 AJAX 呼叫根本沒有意義。

幾乎所有開發人員都認為 AJAX 是代表非同步（Asynchronous）的縮寫。然而，AJAX 的世界對一些新學習者來說可能很複雜，看到帶有阻塞的 AJAX 呼叫並不罕見。在大多數網頁、行動和伺服器平台上，阻塞式 AJAX 呼叫被認為是不良實踐。原因因平台而略有不同，但總體而言，JavaScript 是單執行緒的，任何阻塞呼叫都意味著功能停止。

以下是使用 `async: false` 進行阻塞的 jQuery AJAX 呼叫範例（以及另一個反模式，使用全域變數），

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
   // follow-up
}
{% endcodeblock %}

上面的範例在某種意義上很容易理解，因為它逐步執行。**someGlobal** 的值在後續處理之前被正確賦值。除了阻塞和使用全域變數外，一切都很好。讓我們重寫這個並看看。

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

// parameter result is renamed from someGlobal
function followUp(result) {
    // follow-up
}
{% endcodeblock %}

現在，由於 `async: true` 設定，AJAX 請求不會被阻塞。我們將後續處理的程式碼放入一個單獨的 `followUp` 函式中。不需要全域變數。在現實世界中，這可能成為回呼鏈的一部分，我們稍後會討論。
