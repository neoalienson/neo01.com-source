---
title: 我最好的 CoPilot 替代方案 - 在本地运行 LLM
date: 2023-09-03
tags:
  - AI
categories:
  - AI
lang: zh-CN
excerpt: 用 200 美元二手显卡运行 Code Llama，数据不出本地，100k 令牌超过 CoPilot！
comments: true
---

![](/2023/09/My_Best_CoPilot_Alternative_Running_LLM_on_Local_Machine/hero.png)

我一直在寻找新的创新工具来帮助我提高编码技能并提高生产力。最近，我偶然发现了 Code Llama，这是由 Meta 开发的免费开源大型语言模型（LLM），您可以在低成本的游戏台式机上设置。在这篇博客文章中，我将分享我使用 Code Llama 的经验，以及它如何成为 GitHub CoPilot 的绝佳替代方案。

## 使用 ollama 设置 Code Llama

ollama (https://ollama.ai/) 使用类似 Dockerfile 的配置文件。它还管理从 LLM 到系统提示的 Docker 层。ollama 在设置和运行 Code Llama 方面提供了很大的帮助。尽管网站说 Windows 即将推出，但我遵循 https://github.com/jmorganca/ollama 中的步骤并成功运行。以下是我的设置，
1. Windows 11
2. WSL 2 与 Ubuntu
3. Nvidia 3060 12GB
4. https://github.com/jmorganca/ollama

如果您没有足够的显示内存，它会退回到系统 RAM 和 CPU。

有许多模型供您选择 (https://ollama.ai/library)，但您应该首先尝试 Code Llama。您可以使用 `ollama pull codellama` 像 docker 镜像一样拉取 Code Llama。然而，有一个许可协议需要接受（https://ai.meta.com/resources/models-and-libraries/llama-downloads/）。一旦您请求、接受并获得批准，您就可以开始使用它。如果您不这样做，还有许多其他库可以尝试。

:question: 为什么我选择显示卡上的 12GB 显示内存而不是 8GB、16GB、24GB？
8GB 显示卡更常见且更便宜，但额外的 4GB 显示内存（VRAM）可以让您在下一个层级运行更大的模型。LLM 通常以 3 个层级构建，具有不同的模型参数大小，每个层级大约使用一定量的 VRAM。下面显示 12GB 适合 7B 和 13B。超过 12GB 的 RAM 是浪费，除非您花时间量化下一层级的模型并接受量化后模型运行速度会慢得多。Code Llama 提供了一个 34B 模型，您可以使用 24GB，这是 24GB 显示卡的唯一使用案例。

| 模型 | 存储大小 | 典型内存使用量 | VRAM 8GB | VRAM 12GB | VRAM 24GB | VRAM 2 X 24GB |
| --- | --: | --: | :-: | :-: | :-: | :-: |
| 7B | 4GB | 7GB | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| 13B | 8GB | 11GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 34B | 19GB | 23GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 70B | 40GB | 35GB | :x: | :x: | :x: | :white_check_mark: |

消费级显示卡的最大显示内存大小为 24GB，因此您需要两张显示卡。

## 如何使用 Visual Studio Code 设置 Code Llama

使用 Visual Studio Code 设置 Code Llama 既简单又直接。搜索并安装 Visual Studio Code 扩展"Continue"。此扩展允许您使用来自服务提供商的 LLM 和本地 LLM 服务（如 ollama）。"Continue"启动交互式教程，您应该开始愉快地使用它。

## 本地 vs CoPilot（或任何其他基于订阅的服务）

还有许多其他免费的类似 CoPilot 的服务提供商。免费服务的质量通常很差，所以我不会在下表中比较它们，

| 功能 | 本地 | CoPilot（或任何其他基于订阅的服务）|
| --- | --- | --- |
| 拥有成本 | 二手 nVidia 3060 12GB 200 美元。不包括我已经拥有的 PC 台式机 | - |
| 价格 | 免费。电费每月约 1kWh，可以忽略不计 | 基于订阅，每月 10 美元起|
| ROI | 20 个月 | - |
| 可供选择的 LLM | 许多。有特定编程语言的模型。| 取决于提供商 |
| 输入令牌限制 | 100k（Code Llama）| 1500（Copilot）|
| 设置 | 使用 ollama 相当容易 | 简单 |
| 隐私 | 您的数据保留在本地 | 数据发送到第三方进行处理 |

输入令牌是上下文的"记忆"。GPT4 的输入令牌是 8k；这就是为什么当您的需求复杂时，您会觉得生成的代码比 CoPilot 更好。请注意，由于技术进步迅速，数字可能不准确。

重要的是要记住，生成代码的质量不仅取决于使用的模型，还取决于系统提示和提供的上下文。这是因为有很多模型可以使用，提示可能比模型更重要。您可以自定义最适合您的系统提示，并从 Continue 疯狂地在模型之间切换。例如，如果您没有适当的系统提示或您的上下文已经混乱，Code Llama 和 GPT4 都可能生成以下糟糕的代码，

> 没有系统提示
> write a python function to generate six unique numbers from 1 to 49 

{% codeblock lang:python line_number:false %}
import random

def get_unique_numbers(n):
    nums = []
    while len(nums) < n:
        num = random.randint(1, 49)
        if num not in nums:
            nums.append(num)
    return nums
{% endcodeblock %}

一个简单的系统提示会产生很大的差异。更不用说您可以使用 ollama 和 Continue 轻松切换的其他参数，例如温度
> 系统提示：您是一位经验丰富的程序员，专注于使用单行代码解决问题。
> Write a python function to generate six unique numbers from 1 to 49.

{% codeblock lang:python line_number:false %}
def generate_unique_numbers(n):
    return random.sample(range(1, n), k=6)
{% endcodeblock %}

## 结论

安全和隐私是我最关心的问题。运行 LLM 是我的最佳选择。
