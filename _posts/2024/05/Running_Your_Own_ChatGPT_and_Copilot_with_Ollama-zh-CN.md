---
title: 使用 Ollama 运行你自己的 ChatGPT 和 Copilot
date: 2024-5-1
categories:
  - AI
tag:
  - AI
thumbnail: llama_thumbnails.png
thumbnail_80: llama_80.png
lang: zh-CN
excerpt: 用 Ollama、Gradio 和 LLaMA 3 在本地免费运行自己的 ChatGPT 和 Copilot！
comments: true
---

你是否曾想探索像 ChatGPT 和 Copilot 这样的 AI 驱动聊天机器人的能力，而不依赖第三方服务？通过 Ollama 和一些设置，你可以运行自己的 ChatGPT 实例，并根据你的特定需求进行定制。无论你是想将对话式 AI 集成到应用程序或项目中的开发者、寻求分析 AI 模型性能的研究人员，还是只是想尝试这项尖端技术的爱好者——掌控自己的聊天机器人可以为创新和探索开启令人兴奋的可能性。

*总之，我想运行自己的 ChatGPT 和 Copilot。*

## 设置 Ollama

首先，你必须设置 [Ollama](https://ollama.com/)。到目前为止，我还没有听到任何关于在任何平台上设置 Ollama 有困难的抱怨，包括 Windows WSL。Ollama 准备好后，拉取一个模型，例如 Llama 3：

{% codeblock lang:shell-session line_number:false %}
$ # 拉取 5GB 模型可能需要一些时间...
$ ollama pull llama3:instruct 

$ # 列出你拥有的模型
$ ollama list 
NAME                    ID              SIZE    MODIFIED
llama3:instruct         71a106a91016    4.7 GB  11 days ago
{% endcodeblock %}

通过命令行测试模型，虽然措辞可能不同：

{% codeblock lang:shell-session line_number:false %}
$ ollama run llama3:instruct
>>> Send a message (/? for help)
>>> are you ready?
I'm always ready to play a game, answer questions, or just chat. What's on your mind? Let me know what you'd like
to do and I'll do my best to help.
{% endcodeblock %}

检查 Ollama 的端口是否正在监听：

{% codeblock lang:shell-session line_number:false %}
$ netstat -a -n | grep 11434
tcp        0      0 127.0.0.1:11434         0.0.0.0:*               LISTEN
$ # 看起来不错，端口 11434 已准备好

$ # 如果 Ollama 没有监听，执行以下命令
ollama serve
{% endcodeblock %}

请查看 https://ollama.com/library 以获取可用模型列表。

## Gradio

虽然你可以设置系统提示词、参数、嵌入内容和一些前/后处理，但你可能想要一种更简单的方式通过网页界面进行交互。你需要 [Gradio](https://www.gradio.app/guides/quickstart)。假设你已经准备好 Python：

{% codeblock lang:shell-session line_number:false %}
$ # 创建 Python 虚拟环境。
$ # gradio-env 是文件夹名称，你可以将其更改为任何名称
$ python -m venv gradio-env

$ # 进入虚拟环境
$ gradio-env/Script/activate
$ # 如果你使用 Windows
$ gradio-env\\script\\activate.bat

$ # 安装 Gradio
$ pip install gradio
{% endcodeblock %}

接下来，创建一个 Python 脚本，文件名如 `app.py`。如果你使用其他模型，请更新模型。

执行以下命令，你可以使用 URL 访问界面。

开启 `http://127.0.0.1:7860`

![测试](/2024/05/Running_Your_Own_ChatGPT_and_Copilot_with_Ollama/test.png)

### 列出模型

假设你已经拉取了多个模型，并且你想从下拉列表中选择。

展开额外输入后，你可以看到下拉菜单：

![下拉菜单](/2024/05/Running_Your_Own_ChatGPT_and_Copilot_with_Ollama/dropdown.png)

### 使用聊天历史

先前的实现使用了 Ollama 的 generate API。该 API 接受一个简单的参数 prompt，允许将聊天历史与提示词一起发送。然而，最好使用 Ollama 的 chat API，它接受 messages 参数。这个 messages 参数可以指定角色，使模型能够更好地解释和相应地响应。

## Visual Studio Code 与扩展

像 [Continue](https://docs.continue.dev/intro) 这样的扩展非常容易设置。

你可以设置 Ollama 或更新扩展的 config.json。

你可以为本地 copilot 设置模型角色。

## 在本地机器外提供 Gradio 或 Ollama API

默认情况下，Gradio 和 Ollama 仅在 localhost 上监听，这意味着出于安全原因，网络上的其他人无法访问它们。你可以通过像 Nginx 这样的代理和 API 网关来提供网页或 API，以实现传输中的数据加密和身份验证。然而，为了简单起见，你可以设置以下内容以允许所有 IP 访问你的本地 Ollama。

如果你通过 WSL 运行 Gradio 和 Ollama，你需要使用 PowerShell 命令将端口从 WSL 转发到本地机器。

更新脚本中的端口 7860,11434 以符合你自己的需求。7860 是 Gradio 的端口，11434 是 ollama 的端口

玩得开心！
