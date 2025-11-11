---
title: 在 Terraform 中处理列表中空元组的无效索引
date: 2023-04-12
tags:
  - terraform
categories:
  - Development
lang: zh-CN
excerpt: 功能切换时遇到空元组错误？掌握 try()、条件表达式和展开表达式等四种解决方案。
thumbnail: /assets/terraform/thumbnail.png
---

在 Terraform 中使用 `count = 0` 来实现功能切换是很常见的。然而，当它在资源中实现且功能被停用时，可能会导致空元组错误。元组是一种可以包含任意数量不同类型元素的列表类型。索引零用于访问已启用的资源，例如 `module.feature[0].id`。当资源被停用时，元组为空，且 `module.feature[0]` 不存在，导致错误。

例如，以下代码运行良好：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = [ { name: "a" }, { name: "b" } ]
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

输出：

{% codeblock lang:shell-session line_number:false %}
$ terraform plan

Changes to Outputs:
  + result = "a"
{% endcodeblock %}

然而，当 `my_tuple` 为空时会抛出错误。

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

输出：

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

功能切换是空元组的常见使用案例。然而，空元组还有其他使用案例。例如，如果您使用的模块返回元组，您可能想处理元组为空的情况。

以下是可用于在 Terraform 中处理空元组的技术，

## 条件表达式

处理空元组的直接方法是在尝试访问元素之前使用条件表达式检查元组是否为空。以下是如何使用条件表达式的示例：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = length(local.my_tuple) > 0 ? local.my_tuple[0].name : "default-value"
}
{% endcodeblock %}

在此示例中，`length()` 函数用于检查 `my_tuple` 是否为空。如果 `my_tuple` 不为空，则第一个元素 ([0]) 中的 `name` 被分配给 `result` 变量。如果 `my_tuple` 为空，则"default-value"被分配给 `result` 变量。不会抛出空元组错误，因为当 `my_tuple` 为空时不会评估 `local.my_tuple[0].name`。

当变量名称很长时，这可能难以阅读，因为变量名称在条件表达式中重复了两次。

## try 函数

处理空元组的另一种方法是使用 `try()` 函数。`try()` 函数用于尝试访问值，如果值未定义则提供默认值。以下是如何使用 `try()` 函数的示例：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = try(local.my_tuple[0].name, "default-value") 
}
{% endcodeblock %}

在此示例中，`try()` 函数用于尝试访问 `my_tuple` 第一个元素 ([0]) 中的 name。由于 `my_tuple` 为空，字符串"default-value"被用作 value 的默认值。

## for 表达式
在 Terraform 0.13.0 中，您可以使用 `for` 表达式来处理空元组：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = [for i in local.my_tuple: i.name]
}
{% endcodeblock %}

这是可读性最低的方法，但带我们进入下面的展开表达式：

{% codeblock lang:hcl line_number:false %}
## 展开表达式

locals {
  my_tuple = []

  result = local.my_tuple[*].name
}
{% endcodeblock %}

`for` 表达式和展开表达式在 Terraform 0.12.29 中不受支持，但在 Terraform 0.13.0 及更高版本中受支持。此外，如果 `my_tuple` 为空，两者都会返回空元组，与可以指定默认值的条件表达式和 `try()` 函数不同。

旧版展开表达式 `local.my_tuple.*.name` 在 Terraform 0.12.29 及更高版本（截至本文发布日期为 v1.4）中也受支持。然而，不建议使用此方法，因为它可能在未来版本中被移除。

有关展开表达式的更多信息，
https://developer.hashicorp.com/terraform/language/expressions/splat

值得注意的是，表达式的结果是元组。您可能需要使用 `tolist()` 函数将其转换为列表，或者如果您想删除重复项和/或排序项目，则使用 `toset()` 函数。`compact()` 函数可用于从列表中删除空字符串和 null 值。您还可以使用 `join()` 函数将列表转换为字符串。

## 使用动态块的 meta-argument `for_each` 进行功能切换

使用带有动态块的 `for_each` meta-argument 可以是功能切换的一种方法，但超出了本文的范围。

## 参考资料
https://support.hashicorp.com/hc/en-us/articles/9471971461651-ERROR-Invalid-index-on-empty-tuple
