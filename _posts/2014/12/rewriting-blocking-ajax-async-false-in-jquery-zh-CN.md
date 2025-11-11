---
title: '重写阻塞式 AJAX（JQuery 中的 async: false）'
tags:
  - jasmine
  - javascript
id: 6805
categories:
  - Development
date: 2014-12-15
lang: zh-CN
excerpt: "学习如何将阻塞式 AJAX 调用重写为异步模式。消除 async: false 和全局变量的反模式。"
thumbnail: /assets/coding/2.png
---

当我应用 Jasmine Ajax 来测试一段 JavaScript 时，我卡住了，我发现原因是 Jasmine Ajax 不支持阻塞式 AJAX 调用。我不怪 Jasmine Ajax，因为我认为进行阻塞式 AJAX 调用根本没有意义。

几乎所有开发人员都认为 AJAX 是代表异步（Asynchronous）的缩写。然而，AJAX 的世界对一些新学习者来说可能很复杂，看到带有阻塞的 AJAX 调用并不罕见。在大多数网页、移动和服务器平台上，阻塞式 AJAX 调用被认为是不良实践。原因因平台而略有不同，但总体而言，JavaScript 是单线程的，任何阻塞调用都意味着功能停止。

以下是使用 `async: false` 进行阻塞的 jQuery AJAX 调用示例（以及另一个反模式，使用全局变量），

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

上面的示例在某种意义上很容易理解，因为它逐步执行。**someGlobal** 的值在后续处理之前被正确赋值。除了阻塞和使用全局变量外，一切都很好。让我们重写这个并看看。

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

现在，由于 `async: true` 设置，AJAX 请求不会被阻塞。我们将后续处理的代码放入一个单独的 `followUp` 函数中。不需要全局变量。在现实世界中，这可能成为回调链的一部分，我们稍后会讨论。
