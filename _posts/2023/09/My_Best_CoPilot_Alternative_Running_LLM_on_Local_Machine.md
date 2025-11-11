---
title: My Best CoPilot Alternative - Running LLM on Local Machine
date: 2023-09-03
tags:
  - AI
categories:
  - AI
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
excerpt: Run Code Llama locally with a $200 used GPU. Keep your data private, get 100k tokens (vs CoPilot's 1500), and pay zero monthly fees. Setup guide with ollama + VS Code included.
comments: true
---

![](hero.png)

I'm always on the lookout for new and innovative tools to help me improve my coding skills and increase my productivity. Recently, I stumbled upon Code Llama, a free, open-source large language model (LLM) developed by Meta that allows you to set up on your low-cost gaming desktop. In this blog post, I'll be sharing my experience with Code Llama and how it can serve as a great alternative to GitHub CoPilot.

## Setup Code Llama with ollama

ollama (https://ollama.ai/), which uses a Dockerfile-like configuration file. It also manages Docker layers from LLM to system prompt. ollama helps a lot to setup and run Code Llama. Although the website says Windows is coming soon, I followed steps in https://github.com/jmorganca/ollama and ran it successfully. The following are my setup,
1. Windows 11
2. WSL 2 with Ubuntu
3. Nvidia 3060 12GB
4. https://github.com/jmorganca/ollama

If you do not have enough video RAM, it falls back to system RAM and CPU.

There are many models for you to choose (https://ollama.ai/library) but you should first try Code Llama. You can pull the Code Llama with `ollama pull codellama` like a docker image. However, there is a license agreement to accept (https://ai.meta.com/resources/models-and-libraries/llama-downloads/). Once you have requested, accepted, and been approved, you can start using it. If you do not, there are many other libraries you can try.

:question: Why I choose 12GB Video RAM on display card instead of 8GB, 16GB, 24GB?
8GB video cards are more common and cheaper but with an additional 4GB of video RAM (VRAM) you can run a larger model in the next tier. LLMs are usually built in 3 tiers with different model parameter sizes, each tier using a certain amount of VRAM approximately. Below shows 12GB fits both 7B and 13B. RAM more than 12GB is a waste unless you spend time on quantizing the model for the next tier and accept that the model runs much slower after quantization. Code Llama provides a 34B model that you can use with 24GB, which is the only use case for a 24GB video card.

| Model | Size in storage | Typical memory usage | VRAM 8GB | VRAM 12GB | VRAM 24GB | VRAM 2 X 24GB |
| --- | --: | --: | :-: | :-: | :-: | :-: |
| 7B | 4GB | 7GB | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| 13B | 8GB | 11GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 34B | 19GB | 23GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 70B | 40GB | 35GB | :x: | :x: | :x: | :white_check_mark: |

The largest video RAM size for a consumer-grade display card is 24GB, so you will need two video cards.

## How to Set Up Code Llama with Visual Studio Code

Setting up Code Llama with Visual Studio Code is easy and straightforward. Search and install a Visual Studio Code extension "Continue". This extension allows you to use LLM from the service provider and local LLM service like ollama. "Continue" starts an interactive tutorial and you should start to use it happily.

## Local vs CoPilot (or any other subscription-based service)

There are many other CoPilot-like service providers that are free. Quality from free services is usually poor, so I will not compare them in the table below,

| Feature | Local | CoPilot (or any other subscription-based service) |
| --- | --- | --- |
| Cost of Ownership | USD 200 for a second-hand nVidia 3060 12GB. Excluding the PC desktop that I already have | - |
| Price | Free. Electricity costs me around 1kWh a month, which is negligible | Subscription-based, starting from USD 10 a month|
| ROI | 20 months | - |
| LLM for you to choose | Many. There are programming language-specific models. | Depends on the provider |
| Input token limit | 100k (Code Llama) | 1500 (Copilot) |
| Setup | Quite easy with ollama | Easy |
| Privacy | Your data stays on your local machine | Data is sent to third party for processing |

Input token is the "memory" of the context. GPT4's input token is 8k; that's why you feel the code generated is better than CoPilot when your requirement is complex. Please note the number could be inaccurate as technology is advancing quickly.

It's important to remember that the quality of the generated code is not just determined by the model used, but also by the system prompts and the context provided. This is because there are so many models you can use, and the prompt could matter more than a model. You can customize system prompts that fit you best and switch between models like crazy from Continue. For example, the poor code below could be generated from both Code Llama and GPT4 if you do not have a proper system prompt or if your context has been messed up,

> No system prompt
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

A simple system prompt makes a great difference. Not to mention other parameters such as temperature you can switch easily with ollama and Continue
> System prompt: You are a seasoned programmer with a focus on using a single line of code to solve a problem.
> Write a python function to generate six unique numbers from 1 to 49.

{% codeblock lang:python line_number:false %}
def generate_unique_numbers(n):
    return random.sample(range(1, n), k=6)
{% endcodeblock %}

## Conclusion

Security and privacy are my top concerns. Running LLM is my best choice.
