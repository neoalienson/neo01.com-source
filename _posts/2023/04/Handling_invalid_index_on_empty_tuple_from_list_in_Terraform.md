---
title: Handling invalid index on empty tuple from list in Terraform
date: 2023-04-12
tags:
  - terraform
categories:
  - Development
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: "Hit empty tuple errors with feature toggles? Master four solutions: try(), conditional expressions, splat expressions, and for loops to handle empty tuples in Terraform gracefully."
thumbnail: /assets/terraform/thumbnail.png
---

It is common to use `count = 0` to achieve feature toggle in Terraform. However, it could result in an empty tuple error when it is implemented in a resource and the feature is disabled. A tuple is a type of list that can contain any number of elements of different types. Index zero is used to access the enabled resource, e.g., `module.feature[0].id`. The tuple is empty when the resource is disabled, and `module.feature[0]` does not exist, resulting in an error.

For example, below code runs well:

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = [ { name: "a" }, { name: "b" } ]
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

Output:

{% codeblock lang:shell-session line_number:false %}
$ terraform plan

Changes to Outputs:
  + result = "a"
{% endcodeblock %}

However, it will throw an error when `my_tuple` is empty.

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

Output:

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

Feature toggling is a common use case for empty tuples. However, there are other use cases for empty tuples. For example, if you are using a module that returns a tuple, you may want to handle the case where the tuple is empty.

Here are techniques that can be used to handle empty tuples in Terraform,

## Conditional Expressions

A straightforward approach to handling empty tuples is to use a conditional expression to check whether the tuple is empty before trying to access an element. Here's an example of how to use a conditional expression:

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = length(local.my_tuple) > 0 ? local.my_tuple[0].name : "default-value"
}
{% endcodeblock %}

In this example, the `length()` function is used to check whether `my_tuple` is empty. If `my_tuple` is not empty, `name` in the first element ([0]) is assigned to the `result` variable. If `my_tuple` is empty, "default-value" is assigned to the `result` variable. No empty tuple error is thrown because `local.my_tuple[0].name` is not evaluated when `my_tuple` is empty.

This can be difficult to read when the variable name is long, as the variable name is repeated twice in the conditional expression.

## try Function

Another approach to handling empty tuples is to use the `try()` function. The `try()` function is used to attempt to access a value and provide a default value if the value is undefined. Here's an example of how to use the `try()` function:

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = try(local.my_tuple[0].name, "default-value") 
}
{% endcodeblock %}

In this example, the `try()` function is used to attempt to access name in the first element ([0]) of `my_tuple`. Since `my_tuple` is empty, the string "default-value" is used as a default value for value.

## for Expression
In Terraform 0.13.0 you can use `for` expressions to handle empty tuples:

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = [for i in local.my_tuple: i.name]
}
{% endcodeblock %}

This is the least readable approach, but brings us to splat expressions below:

{% codeblock lang:hcl line_number:false %}
## Splat Expressions

locals {
  my_tuple = []

  result = local.my_tuple[*].name
}
{% endcodeblock %}

Both `for` expressions and splat expressions are not supported in Terraform 0.12.29, but they are supported in Terraform 0.13.0 and later. Also, both return an empty tuple if the `my_tuple` is empty, unlike the conditional expression and `try()` function which a default value can be specified.

A legacy splat expression `local.my_tuple.*.name` is also supported in Terraform 0.12.29 and later (v1.4 as of date of this post). However, this is not recommended as it could be removed in a future release.

More information about splat expression,
https://developer.hashicorp.com/terraform/language/expressions/splat

It is worth noting that the result from the expressions is a tuple. You may need to convert it to a list with `tolist()` function, or `toset()` function if you want to remove duplicates and/or order the items. `compact()` function can be used to remove empty string and null values from a list. You can also use `join()` function to convert a list to a string.

## feature toggling with meta-argument `for_each` with dynamic blocks

Use of `for_each` meta-argument with dynamic blocks can be an approach for feature toggling but beyond the scope of this post. 

## References
https://support.hashicorp.com/hc/en-us/articles/9471971461651-ERROR-Invalid-index-on-empty-tuple
