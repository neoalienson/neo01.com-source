---
title: 在 Terraform 中處理列表中空元組的無效索引
date: 2023-04-12
tags:
  - terraform
categories:
  - Development
lang: zh-TW
excerpt: 功能切換時遇到空元組錯誤？掌握 try()、條件表達式和展開表達式等四種解決方案。
thumbnail: /assets/terraform/thumbnail.png
---

在 Terraform 中使用 `count = 0` 來實現功能切換是很常見的。然而，當它在資源中實作且功能被停用時，可能會導致空元組錯誤。元組是一種可以包含任意數量不同類型元素的列表類型。索引零用於存取已啟用的資源，例如 `module.feature[0].id`。當資源被停用時，元組為空，且 `module.feature[0]` 不存在，導致錯誤。

例如，以下程式碼執行良好：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = [ { name: "a" }, { name: "b" } ]
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

輸出：

{% codeblock lang:shell-session line_number:false %}
$ terraform plan

Changes to Outputs:
  + result = "a"
{% endcodeblock %}

然而，當 `my_tuple` 為空時會拋出錯誤。

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

輸出：

{% codeblock lang:shell-session line_number:false %}
$ terraform plan
╷
│ Error: Invalid index
│
│   on main.tf line 5, in locals:
│    5: value = local.my_tuple[0].name
│     ├────────────────
│     │ local.my_tuple is empty tuple
│
│ The given key does not identify an element in this collection value: the collection has no elements.
{% endcodeblock %}

功能切換是空元組的常見使用案例。然而，空元組還有其他使用案例。例如，如果您使用的模組返回元組，您可能想處理元組為空的情況。

以下是可用於在 Terraform 中處理空元組的技術，

## 條件表達式

處理空元組的直接方法是在嘗試存取元素之前使用條件表達式檢查元組是否為空。以下是如何使用條件表達式的範例：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = length(local.my_tuple) > 0 ? local.my_tuple[0].name : "default-value"
}
{% endcodeblock %}

在此範例中，`length()` 函式用於檢查 `my_tuple` 是否為空。如果 `my_tuple` 不為空，則第一個元素 ([0]) 中的 `name` 被指派給 `result` 變數。如果 `my_tuple` 為空，則「default-value」被指派給 `result` 變數。不會拋出空元組錯誤，因為當 `my_tuple` 為空時不會評估 `local.my_tuple[0].name`。

當變數名稱很長時，這可能難以閱讀，因為變數名稱在條件表達式中重複了兩次。

## try 函式

處理空元組的另一種方法是使用 `try()` 函式。`try()` 函式用於嘗試存取值，如果值未定義則提供預設值。以下是如何使用 `try()` 函式的範例：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = try(local.my_tuple[0].name, "default-value") 
}
{% endcodeblock %}

在此範例中，`try()` 函式用於嘗試存取 `my_tuple` 第一個元素 ([0]) 中的 name。由於 `my_tuple` 為空，字串「default-value」被用作 value 的預設值。

## for 表達式
在 Terraform 0.13.0 中，您可以使用 `for` 表達式來處理空元組：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = [for i in local.my_tuple: i.name]
}
{% endcodeblock %}

這是可讀性最低的方法，但帶我們進入下面的展開表達式：

{% codeblock lang:hcl line_number:false %}
## 展開表達式

locals {
  my_tuple = []

  result = local.my_tuple[*].name
}
{% endcodeblock %}

`for` 表達式和展開表達式在 Terraform 0.12.29 中不受支援，但在 Terraform 0.13.0 及更高版本中受支援。此外，如果 `my_tuple` 為空，兩者都會返回空元組，與可以指定預設值的條件表達式和 `try()` 函式不同。

舊版展開表達式 `local.my_tuple.*.name` 在 Terraform 0.12.29 及更高版本（截至本文發布日期為 v1.4）中也受支援。然而，不建議使用此方法，因為它可能在未來版本中被移除。

有關展開表達式的更多資訊，
https://developer.hashicorp.com/terraform/language/expressions/splat

值得注意的是，表達式的結果是元組。您可能需要使用 `tolist()` 函式將其轉換為列表，或者如果您想刪除重複項和/或排序項目，則使用 `toset()` 函式。`compact()` 函式可用於從列表中刪除空字串和 null 值。您還可以使用 `join()` 函式將列表轉換為字串。

## 使用動態區塊的 meta-argument `for_each` 進行功能切換

使用帶有動態區塊的 `for_each` meta-argument 可以是功能切換的一種方法，但超出了本文的範圍。

## 參考資料
https://support.hashicorp.com/hc/en-us/articles/9471971461651-ERROR-Invalid-index-on-empty-tuple
