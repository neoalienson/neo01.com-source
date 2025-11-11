---
title: 与 ChatGPT 结对编程 - 开发者的梦想成真
date: 2023-03-30
tags:
  - terraform
  - AI
categories:
  - Development
lang: zh-CN
excerpt: ChatGPT 不是取代开发者，而是最佳结对伙伴！学习如何用魔法问题获得更好的代码审查。
comments: true
---

![](/2023/03/Pair_Programming_with_ChatGPT_A_Developer_s_Dream_Come_True/pair_programming.png)

作为一名全栈开发者，多年来我与许多人类进行过结对编程。然而，最近我有机会与 ChatGPT（由 OpenAI 训练的大型语言模型）合作，这是一个改变游戏规则的体验。我发现 ChatGPT 并没有取代我的角色，而是作为结对编程的伙伴，为我提供有价值的见解和观点。让我们深入了解它如何改变我的结对编程体验！

## 人类与 ChatGPT：完美的协同作用
人类开发者与 ChatGPT 之间的合作关系相当独特。以下是我的典型循环：

1. 需求收集：我们人类开发者提供特定功能或函数的需求。ChatGPT 编写代码，我们人类进行审查。
2. 总结需求：我发现要求 ChatGPT 总结我的需求非常有用，因为我通常不会一次性提供所有需求。这有助于我检查我们是否在同一页面上。
3. 单元测试模板：ChatGPT 根据总结的需求生成单元测试模板。
4. 人类完成并精炼单元测试：我们人类开发者完成并精炼单元测试，并向 ChatGPT 提供反馈，精炼他们对任务的理解。

## 轮到 ChatGPT 审查我的代码
反过来，人类可以编写程序并要求 ChatGPT 审查和总结代码。这个过程有助于识别潜在问题并确保代码符合所需的需求。然而，有时您可能需要稍微帮助 ChatGPT，而不是直接丢一段代码。例如，

### 尝试 #1，简单地要求审查
提示：

{% codeblock lang:hcl line_number:false %}
review following terraform code in main.tf.

resource "some_resource" "resource_name" {
  name = "some_name"
  value = condition == true ? "aaa,bbb,ccc,${var.b}" : "${var.a},aaa,bbb,ccc,${var.b}"
}
{% endcodeblock %}

回应

> 您提供的代码创建了一个名为"some_resource"的资源，名称为"resource_name"，并将"name"属性设置为"some_name"。此外，它根据条件设置"value"属性。如果"condition"变量为 true，则"value"设置为"aaa,bbb,ccc,${var.b}"。如果"condition"为 false，则"value"设置为"${var.a},aaa,bbb,ccc,${var.b}"。
>
> 假设变量"a"、"b"和"condition"已正确定义，代码看起来是有效且功能正常的。然而，重要的是确保资源类型及其属性对于您的基础设施需求是正确且正确配置的。此外，使用描述性名称来命名资源和属性是一个好习惯，以便更容易理解代码的目的。

以上听起来毫无意义。让我们稍微精炼一下我们的问题

### 尝试 #2，告诉您想从代码审查中得到什么

提示：

{% codeblock lang:hcl line_number:false %}
review following terraform code in main.tf. can you propose better coding?

resource "some_resource" "resource_name" {
  name = "some_name"
  value = condition == true ? "aaa,bbb,ccc,${var.b}" : "${var.a},aaa,bbb,ccc,${var.b}"
}
{% endcodeblock %}

回应

> 代码在语法方面看起来不错，但如果您正在寻找建议，这里有一些：
> 
> 为您的资源使用有意义的名称总是一个好主意，这样您以后可以轻松识别它们。不要使用"some_resource"和"resource_name"，尝试想出更具描述性的名称。
> 
> 在 value 属性中，通常最好避免对复杂表达式使用三元运算符，因为它们会使代码更难阅读和理解。相反，考虑将表达式分成多行，或创建一个保存计算值的单独变量。
> 
> 考虑仅在必要时使用插值语法（${...}）。在这种情况下，由于 var.a 和 var.b 已经是变量，您可以简单地使用 + 运算符将它们与其他字符串连接起来。
> 
> 以下是如何使用这些建议重构代码的示例：
>
> ```hcl
> resource "some_resource" "example" {
>   name  = "example_resource"
>   value = compute_value(var.a, var.b, condition)
> }
> 
> // Define a separate function to compute the value
> // This makes the code easier to read and understand
> // and allows for reuse if needed
> locals {
>   compute_value = (a, b, condition) => {
>     if condition {
>       "aaa,bbb,ccc," + b
>     } else {
>       a + ",aaa,bbb,ccc," + b
>     }
>   }
> }
> ```
> 此代码使用局部变量来定义一个单独的函数，该函数根据输入变量和条件标志计算值。这使得代码更容易阅读和理解，并且如果需要还允许重复使用。


使用神奇的问题*你能提出更好的编码吗？*您会得到更有意义的结果。尽管它无法发现我正在重复部分变量（`,aaa,bbb,ccc,${var.b}`），这违反了 DRY 原则。我稍微重写了一下并再次询问，如下所示，

### 尝试 #3，询问对我的两段代码的意见

提示：

{% codeblock lang:hcl line_number:false %}
which terraform code is better, can you propose better coding?

code 1,
  resource "some_resource" "resource_name" {
  name = "some_name"
  value = condition == true ? "aaa,bbb,ccc,${var.b}" : "${var.a},aaa,bbb,ccc,${var.b}"
}

code2,
  locals {
    a = {
      "aaa",
      "bbb",
      "ccc",
      var.b,
    }
  }
  resource "some_resource" "resource_name" {
  name = "some_name"
  value = join(",", condition == true ? [] : var.a, local.a)
}
{% endcodeblock %}

回应

> 两个代码示例都是有效且功能正常的，但它们有不同的目的和实现。
> 
> 代码 1 使用三元运算符根据条件设置"some_resource"资源的"value"属性。这是设置属性的简洁方式，但对于更复杂的表达式可能可读性较差。
> 
> 代码 2 使用局部变量来创建要连接在一起的值列表。它使用"join"函数将列表中的值与逗号作为分隔符连接起来。对于较长的值列表和表达式，这种方法可能更具可读性。
> 
> 最终，这两个代码示例之间的选择取决于您的基础设施的特定需求和要求。如果您有一个小的值列表和一个简单的条件，代码 1 可能更合适。如果您有一个较长的值列表和一个更复杂的表达式，代码 2 可能更合适。
> 为了提出更好的编码，我建议结合两个代码示例的最佳部分，以创建更具可读性、可维护性和可扩展性的代码。
> 
> ```hcl
> locals {
>   some_values = [
>     "aaa",
>     "bbb",
>     "ccc",
>     var.b,
>   ]
> }
> 
> resource "some_resource" "resource_name" {
>   name  = "some_name"
>   value = join(",", concat(var.a, condition ? [] : local.some_values))
> }
> ```
> 在此代码中，我们使用局部变量来存储硬编码值和"var.b"变量。然后，我们使用"concat"函数连接"var.a"和局部变量的值。最后，我们使用"join"函数将值与逗号分隔符连接起来。
> 
> 此代码比以前的示例更具可读性、可维护性和可扩展性。它将硬编码值与变量分开，使用更具可读性的"concat"函数而不是三元运算符，并使用更简洁的"join"函数。
> 

这结合了人类和 AI 的改进！然而，我最有可能使用尝试 #2，因为它毫不费力。

## ChatGPT 在结对编程中的优势
以下是在结对编程中使用 ChatGPT 而不是另一个人类的一些主要优势：

1. 全天候可用性：ChatGPT 始终可用，让您可以在灵感来袭时随时处理项目，而无需等待其他开发者。
2. 即时反馈：即时接收有关您的代码的反馈，简化您的开发流程。
3. 一致性：ChatGPT 提供一致的反馈质量，不受人类偏见或情绪波动的影响。
4. 多样性：ChatGPT 可以提供人类结对编程师可能没有的多样化观点和见解。这可以带来更具创意和创新的解决方案。
6. 学习机会：通过观察 ChatGPT 的建议和代码审查，开发者可以学习新的编码技术和最佳实践。

## 潜在缺点

如示例所示，您应该注意，如果您没有提供足够的背景或提出正确的问题，审查结果将不令人满意。

## GitHub Copilot 与 Visual Studio Code
我发现它有助于代码完成，但目前缺乏交互性。

## 协作的新时代
与 ChatGPT 的结对编程是一个改变游戏规则的体验。它在人类开发者和 AI 之间提供了强大的协同作用，简化了开发流程并提供了新的学习机会。虽然它永远无法取代人类开发者的创造力和解决问题的能力，但 ChatGPT 是现代开发者工具库中的宝贵工具。所以，试试看，亲自体验结对编程的未来！
