---
title: Terraformでリストからの空のタプルでの無効なインデックスの処理
date: 2023-04-12
tags:
  - terraform
categories:
  - Development
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
lang: ja
excerpt: "機能トグルで空のタプルエラーに遭遇しましたか？4つのソリューションをマスターしましょう：try()、条件式、スプラット式、forループを使用してTerraformで空のタプルを優雅に処理する方法。"
thumbnail: /assets/terraform/thumbnail.png
---

Terraformで機能トグルを実現するために`count = 0`を使用することは一般的です。しかし、リソースに実装され、機能が無効になっている場合、空のタプルエラーが発生する可能性があります。タプルは、異なるタイプの任意の数の要素を含むことができるリストの一種です。インデックス0は有効なリソースにアクセスするために使用されます。例：`module.feature[0].id`。リソースが無効になっているとタプルは空になり、`module.feature[0]`は存在しないため、エラーが発生します。

例えば、以下のコードは正常に動作します：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = [ { name: "a" }, { name: "b" } ]
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

出力：

{% codeblock lang:shell-session line_number:false %}
$ terraform plan

Changes to Outputs:
  + result = "a"
{% endcodeblock %}

しかし、`my_tuple`が空の場合はエラーが発生します。

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []
  result = local.my_tuple[0].name
}

output "result" {
   value = local.result
}
{% endcodeblock %}

出力：

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

機能トグルは空のタプルの一般的な使用例です。しかし、空のタプルには他の使用例もあります。例えば、タプルを返すモジュールを使用している場合、タプルが空の場合を処理したい場合があります。

以下は、Terraformで空のタプルを処理するために使用できる技術です。
## 条件式

空のタプルを処理する直接的なアプローチは、要素にアクセスしようとする前にタプルが空かどうかをチェックする条件式を使用することです。条件式の使用例は以下の通りです：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = length(local.my_tuple) > 0 ? local.my_tuple[0].name : "default-value"
}
{% endcodeblock %}

この例では、`length()`関数を使用して`my_tuple`が空かどうかをチェックします。`my_tuple`が空でない場合、最初の要素（[0]）の`name`が`result`変数に割り当てられます。`my_tuple`が空の場合、「default-value」が`result`変数に割り当てられます。`my_tuple`が空の場合は`local.my_tuple[0].name`が評価されないため、空のタプルエラーは発生しません。

変数名が長い場合、条件式で変数名が2回繰り返されるため、読みにくくなる可能性があります。

## try関数

空のタプルを処理するもう一つのアプローチは、`try()`関数を使用することです。`try()`関数は値にアクセスを試み、値が未定義の場合にデフォルト値を提供するために使用されます。`try()`関数の使用例は以下の通りです：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = try(local.my_tuple[0].name, "default-value") 
}
{% endcodeblock %}

この例では、`try()`関数を使用して`my_tuple`の最初の要素（[0]）のnameにアクセスを試みます。`my_tuple`が空なので、文字列「default-value」がvalueのデフォルト値として使用されます。

## for式
Terraform 0.13.0では、`for`式を使用して空のタプルを処理できます：

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = [for i in local.my_tuple: i.name]
}
{% endcodeblock %}

これは最も読みにくいアプローチですが、以下のスプラット式につながります：

## スプラット式

{% codeblock lang:hcl line_number:false %}
locals {
  my_tuple = []

  result = local.my_tuple[*].name
}
{% endcodeblock %}

`for`式とスプラット式の両方はTerraform 0.12.29ではサポートされていませんが、Terraform 0.13.0以降でサポートされています。また、両方とも`my_tuple`が空の場合は空のタプルを返します。これは、デフォルト値を指定できる条件式や`try()`関数とは異なります。

レガシースプラット式`local.my_tuple.*.name`もTerraform 0.12.29以降（この投稿の日付時点でv1.4）でサポートされています。しかし、将来のリリースで削除される可能性があるため、これは推奨されません。

スプラット式の詳細情報：
https://developer.hashicorp.com/terraform/language/expressions/splat

式からの結果はタプルであることに注意してください。`tolist()`関数でリストに変換するか、重複を削除したりアイテムを順序付けしたい場合は`toset()`関数を使用する必要があるかもしれません。`compact()`関数は、リストから空の文字列とnull値を削除するために使用できます。また、`join()`関数を使用してリストを文字列に変換することもできます。

## 動的ブロックでのメタ引数`for_each`による機能トグル

動的ブロックでの`for_each`メタ引数の使用は機能トグルのアプローチになり得ますが、この投稿の範囲を超えています。

## 参考文献
https://support.hashicorp.com/hc/en-us/articles/9471971461651-ERROR-Invalid-index-on-empty-tuple