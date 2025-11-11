---
title: 在 Terraform 中使用自訂驗證來驗證其他變數
date: 2022-12-09
tags:
  - terraform
categories:
  - Development
lang: zh-TW
excerpt: "學習如何在 Terraform 中使用自訂驗證區塊來驗證多個變數之間的關係。由 ChatGPT 生成。"
thumbnail: /assets/terraform/thumbnail.png
---

**此部落格文章由 ChatGPT 生成**

在 Terraform 中，您可以使用自訂驗證區塊為 Terraform 變數定義自己的自訂驗證規則。這些驗證區塊允許您指定 Terraform 將用於驗證變數值的驗證函式。您還可以使用這些自訂驗證區塊來驗證 Terraform 配置中的其他變數。

要從自訂驗證函式驗證其他變數，您可以使用 `var` 關鍵字，後跟您要驗證的變數名稱。例如，如果您有兩個名為 `subnet_id` 和 `vpc_id` 的變數，並且您想驗證 `subnet_id` 是否與 `vpc_id` 關聯，您可以定義一個自訂驗證區塊，如下所示：

{% codeblock lang:hcl line_number:false %}
variable "subnet_id" {
  type = string
}

variable "vpc_id" {
  type = string
}

validation {
  condition = can_associate_subnet_with_vpc(var.subnet_id, var.vpc_id)
  error_message = "The specified subnet is not associated with the specified VPC."
}

function can_associate_subnet_with_vpc(subnet_id, vpc_id) {
  // perform validation logic here
}
{% endcodeblock %}

在上面的範例中，我們定義了一個自訂驗證區塊，該區塊呼叫 `can_associate_subnet_with_vpc` 函式來驗證 `subnet_id` 是否與 `vpc_id` 關聯。`can_associate_subnet_with_vpc` 函式接受兩個參數，`subnet_id` 和 `vpc_id`，這兩個參數都使用 `var` 關鍵字傳遞。

在函式內部，您可以執行驗證變數所需的任何驗證邏輯。如果驗證成功，函式應返回 `true`，如果驗證失敗，則應返回 `false`。

透過使用 `var` 關鍵字並將變數傳遞給您的自訂驗證函式，您可以輕鬆驗證 Terraform 配置中的多個變數，並確保它們符合您的要求。

總之，要在 Terraform 中從自訂驗證函式驗證其他變數，您可以使用 `var` 關鍵字，後跟您要驗證的變數名稱。這允許您輕鬆驗證 Terraform 配置中的多個變數，並確保它們符合您的要求。
