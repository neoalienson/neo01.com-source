---
title: 'Rewriting blocking AJAX (async: false in JQuery)'
tags:
  - jasmine
  - javascript
id: 6805
categories:
  - Development
date: 2014-12-15
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
excerpt: "Learn how to rewrite blocking AJAX calls to async mode. Eliminate the anti-patterns of async: false and global variables in your JavaScript code."
thumbnail: /assets/coding/2.png
---

When I applied Jasmine Ajax to test a piece of JavaScript, I was stuck, and I discovered that the cause was no support for blocking AJAX calls from Jasmine Ajax. I don't blame Jasmine Ajax because I don't think making blocking AJAX calls makes sense at all.

Almost all developers consider AJAX to be an acronym standing for Asynchronous. However, the world of AJAX can be complicated to some new learners, and it's not uncommon to see AJAX calls with blocking. Blocking AJAX calls are considered a poor practice in most web, mobile, and server platforms. The reasons differ slightly by platform, but overall, JavaScripts are single-threaded, and any blocking call means cessation of function.

Below is an example of a jQuery AJAX call with blocking using `async: false` (and another anti-pattern, using global variables),

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

The above example is easy to follow in some sense because it runs step-by-step. The value of **someGlobal** is properly assigned before following up. Everything is fine except for the blocking and use of a global variable. Let's rewrite this and see.

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

Now, the AJAX request is not blocked due to the `async: true` setting. We've placed the code for follow-up into a separate `followUp` function. No global variable is needed. In the real world, this could become part of a callback chain, and we'll discuss that later.
