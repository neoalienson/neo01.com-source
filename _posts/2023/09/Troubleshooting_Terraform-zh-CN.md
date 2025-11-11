---
title: Terraform 故障排除
date: 2023-09-27
tags:
  - terraform
categories:
  - Development
lang: zh-CN
excerpt: 掌握 Terraform 调试技巧：启用追踪日志、控制并行执行，让基础设施代码问题无所遁形。
thumbnail: /assets/terraform/thumbnail.png
---

![追踪日志与依赖性分析](/2023/09/Troubleshooting_Terraform/log.png)

Terraform 是管理基础设施即代码的绝佳工具，但有时当出现问题时，调试可能会很棘手。在这篇博客文章中，我将分享如何排除 Terraform 问题的技巧。

## 启用调试日志
`TF_LOG` 环境变量允许您设置 Terraform 的日志级别，这对于获取有关 Terraform 在幕后执行的更多详细信息很有用。您可以将其设置为以下值之一：`TRACE`、`DEBUG`、`INFO`、`WARN` 或 `ERROR`。默认值为 `INFO`，仅显示高级别消息。要获得更详细的输出，您可以将其设置为 `DEBUG`。`TRACE` 包含来自 `DEBUG` 的详细信息，但包括大多数调试不需要的依赖性分析详细信息。例如，您可以在运行 Terraform 之前运行此命令：

`export TF_LOG=DEBUG` 然后 `terraform plan`

或在单行中运行

`export TF_LOG=DEBUG && terraform plan`

如果您指定 `TF_LOG_PATH` 环境变量，日志将存储在文件中。

## TF_LOG_CORE 和 TF_LOG_PROVIDER

调试日志可能非常庞大，超过 100MB！如果您想专注于调试提供者，您应该使用 `TF_LOG_PROVIDER` 搭配来自 `TF_LOG` 的参数。如果您怀疑依赖性有问题，您应该使用 `TF_LOG_CORE`。

## 依赖性和并行处理
Terraform 在执行前分析 Terraform 模块之间的依赖性。依赖性分析确保资源以正确的顺序配置。同时，Terraform 使用分析结果通过识别可以同时配置或修改的独立资源集来有效地并行执行操作。然而，来自并发执行的日志非常难以阅读，我们必须在 `plan` 和 `apply` 上使用参数 `-parallelism=1` 停用并发性。

使用 `-parallelism=1`，资源会依序一次创建/修改/销毁一个。这允许更容易的调试和故障排除，因为每个资源一次执行一个。例如，`terraform apply -parallelism=1`：
{% mermaid %}
graph TD
  A[Terraform 操作] --> C[资源 1 修改]
  C --> D[资源 2 修改]
  D --> E[Terraform 执行完成]
{% endmermaid %}

当未指定 `-parallelism` 时，默认值为 10。资源会并行创建/修改/销毁，允许更快的执行。然而，这也可能使调试和故障排除问题变得更加困难，因为多个资源同时执行。例如，`terraform apply`：
{% mermaid %}
  graph TD
  A[Terraform 操作] --> C[资源 1 修改]
  A --> D[资源 2 修改]
  D --> E[Terraform 执行完成]
  C --> E
{% endmermaid %}
