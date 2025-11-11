---
title: 我最好的 CoPilot 替代方案 - 在本機執行 LLM
date: 2023-09-03
tags:
  - AI
categories:
  - AI
lang: zh-TW
excerpt: 用 200 美元二手顯卡執行 Code Llama，資料不出本機，100k 權杖超過 CoPilot！
comments: true
---

![](/2023/09/My_Best_CoPilot_Alternative_Running_LLM_on_Local_Machine/hero.png)

我一直在尋找新的創新工具來幫助我提高編碼技能並提高生產力。最近，我偶然發現了 Code Llama，這是由 Meta 開發的免費開源大型語言模型（LLM），您可以在低成本的遊戲桌機上設定。在這篇部落格文章中，我將分享我使用 Code Llama 的經驗，以及它如何成為 GitHub CoPilot 的絕佳替代方案。

## 使用 ollama 設定 Code Llama

ollama（https://ollama.ai/）使用類似 Dockerfile 的配置檔案。它還管理從 LLM 到系統提示的 Docker 層。ollama 在設定和執行 Code Llama 方面提供了很大的幫助。儘管網站說 Windows 即將推出，但我遵循 https://github.com/jmorganca/ollama 中的步驟並成功執行。以下是我的設定，
1. Windows 11
2. WSL 2 與 Ubuntu
3. Nvidia 3060 12GB
4. https://github.com/jmorganca/ollama

如果您沒有足夠的顯示記憶體，它會退回到系統 RAM 和 CPU。

有許多模型供您選擇（https://ollama.ai/library），但您應該首先嘗試 Code Llama。您可以使用 `ollama pull codellama` 像 docker 映像一樣拉取 Code Llama。然而，有一個授權協議需要接受（https://ai.meta.com/resources/models-and-libraries/llama-downloads/）。一旦您請求、接受並獲得批准，您就可以開始使用它。如果您不這樣做，還有許多其他函式庫可以嘗試。

:question: 為什麼我選擇顯示卡上的 12GB 顯示記憶體而不是 8GB、16GB、24GB？
8GB 顯示卡更常見且更便宜，但額外的 4GB 顯示記憶體（VRAM）可以讓您在下一個層級執行更大的模型。LLM 通常以 3 個層級建構，具有不同的模型參數大小，每個層級大約使用一定量的 VRAM。下面顯示 12GB 適合 7B 和 13B。超過 12GB 的 RAM 是浪費，除非您花時間量化下一層級的模型並接受量化後模型執行速度會慢得多。Code Llama 提供了一個 34B 模型，您可以使用 24GB，這是 24GB 顯示卡的唯一使用案例。

| 模型 | 儲存大小 | 典型記憶體使用量 | VRAM 8GB | VRAM 12GB | VRAM 24GB | VRAM 2 X 24GB |
| --- | --: | --: | :-: | :-: | :-: | :-: |
| 7B | 4GB | 7GB | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| 13B | 8GB | 11GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 34B | 19GB | 23GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 70B | 40GB | 35GB | :x: | :x: | :x: | :white_check_mark: |

消費級顯示卡的最大顯示記憶體大小為 24GB，因此您需要兩張顯示卡。

## 如何使用 Visual Studio Code 設定 Code Llama

使用 Visual Studio Code 設定 Code Llama 既簡單又直接。搜尋並安裝 Visual Studio Code 擴充功能「Continue」。此擴充功能允許您使用來自服務提供商的 LLM 和本機 LLM 服務（如 ollama）。「Continue」啟動互動式教學，您應該開始愉快地使用它。

## 本機 vs CoPilot（或任何其他基於訂閱的服務）

還有許多其他免費的類似 CoPilot 的服務提供商。免費服務的品質通常很差，所以我不會在下表中比較它們，

| 功能 | 本機 | CoPilot（或任何其他基於訂閱的服務）|
| --- | --- | --- |
| 擁有成本 | 二手 nVidia 3060 12GB 200 美元。不包括我已經擁有的 PC 桌機 | - |
| 價格 | 免費。電費每月約 1kWh，可以忽略不計 | 基於訂閱，每月 10 美元起|
| ROI | 20 個月 | - |
| 可供選擇的 LLM | 許多。有特定程式語言的模型。| 取決於提供商 |
| 輸入權杖限制 | 100k（Code Llama）| 1500（Copilot）|
| 設定 | 使用 ollama 相當容易 | 簡單 |
| 隱私 | 您的資料保留在本機 | 資料發送到第三方進行處理 |

輸入權杖是上下文的「記憶」。GPT4 的輸入權杖是 8k；這就是為什麼當您的需求複雜時，您會覺得生成的程式碼比 CoPilot 更好。請注意，由於技術進步迅速，數字可能不準確。

重要的是要記住，生成程式碼的品質不僅取決於使用的模型，還取決於系統提示和提供的上下文。這是因為有很多模型可以使用，提示可能比模型更重要。您可以自訂最適合您的系統提示，並從 Continue 瘋狂地在模型之間切換。例如，如果您沒有適當的系統提示或您的上下文已經混亂，Code Llama 和 GPT4 都可能生成以下糟糕的程式碼，

> 沒有系統提示
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

一個簡單的系統提示會產生很大的差異。更不用說您可以使用 ollama 和 Continue 輕鬆切換的其他參數，例如溫度
> 系統提示：您是一位經驗豐富的程式設計師，專注於使用單行程式碼解決問題。
> Write a python function to generate six unique numbers from 1 to 49.

{% codeblock lang:python line_number:false %}
def generate_unique_numbers(n):
    return random.sample(range(1, n), k=6)
{% endcodeblock %}

## 結論

安全和隱私是我最關心的問題。執行 LLM 是我的最佳選擇。
