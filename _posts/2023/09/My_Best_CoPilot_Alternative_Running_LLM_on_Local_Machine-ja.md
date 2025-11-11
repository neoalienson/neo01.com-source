---
title: 私の最高のCoPilot代替案 - ローカルマシンでLLMを実行
date: 2023-09-03
tags:
  - AI
categories:
  - AI
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
lang: ja
excerpt: "200ドルの中古GPUでCode Llamaをローカル実行。データのプライバシーを保ち、10万トークン（CoPilotは1500）を取得し、月額料金はゼロ。ollama + VS Codeのセットアップガイド付き。"
comments: true
---

![](/2023/09/My_Best_CoPilot_Alternative_Running_LLM_on_Local_Machine/hero.png)

私は常に、コーディングスキルを向上させ、生産性を高めるための新しく革新的なツールを探しています。最近、Metaが開発した無料のオープンソース大規模言語モデル（LLM）であるCode Llamaに出会いました。これは低コストのゲーミングデスクトップでセットアップできます。このブログ投稿では、Code Llamaの経験と、GitHub CoPilotの優れた代替案としてどのように機能するかを共有します。

## ollamaでCode Llamaをセットアップ

ollama（https://ollama.ai/）は、Dockerfileのような設定ファイルを使用します。また、LLMからシステムプロンプトまでのDockerレイヤーを管理します。ollamaはCode Llamaのセットアップと実行に大いに役立ちます。ウェブサイトではWindowsは近日公開予定と書かれていますが、https://github.com/jmorganca/ollama の手順に従って正常に実行できました。以下は私のセットアップです：

1. Windows 11
2. WSL 2（Ubuntu）
3. Nvidia 3060 12GB
4. https://github.com/jmorganca/ollama

ビデオRAMが十分でない場合、システムRAMとCPUにフォールバックします。

選択できるモデルは多数ありますが（https://ollama.ai/library）、まずCode Llamaを試すべきです。`ollama pull codellama`でDockerイメージのようにCode Llamaをプルできます。ただし、受け入れる必要があるライセンス契約があります（https://ai.meta.com/resources/models-and-libraries/llama-downloads/）。リクエストし、受け入れ、承認されたら、使用を開始できます。そうでない場合は、試せる他の多くのライブラリがあります。

:question: なぜ8GB、16GB、24GBではなく、ディスプレイカードに12GBのビデオRAMを選んだのか？
8GBのビデオカードはより一般的で安価ですが、追加の4GBのビデオRAM（VRAM）があれば、次のティアのより大きなモデルを実行できます。LLMは通常、異なるモデルパラメータサイズの3つのティアで構築され、各ティアはおおよそ一定量のVRAMを使用します。以下は、12GBが7Bと13Bの両方に適合することを示しています。12GB以上のRAMは、次のティアのモデルを量子化するのに時間を費やし、量子化後にモデルがはるかに遅く実行されることを受け入れない限り、無駄です。Code Llamaは34Bモデルを提供しており、24GBで使用できます。これが24GBビデオカードの唯一のユースケースです。

| モデル | ストレージサイズ | 典型的なメモリ使用量 | VRAM 8GB | VRAM 12GB | VRAM 24GB | VRAM 2 X 24GB |
| --- | --: | --: | :-: | :-: | :-: | :-: |
| 7B | 4GB | 7GB | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| 13B | 8GB | 11GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 34B | 19GB | 23GB | :x: | :x: | :white_check_mark: | :white_check_mark: |
| 70B | 40GB | 35GB | :x: | :x: | :x: | :white_check_mark: |

コンシューマーグレードのディスプレイカードの最大ビデオRAMサイズは24GBなので、2枚のビデオカードが必要になります。

## Visual Studio CodeでCode Llamaをセットアップする方法

Visual Studio CodeでCode Llamaをセットアップするのは簡単で直感的です。Visual Studio Code拡張機能「Continue」を検索してインストールします。この拡張機能により、サービスプロバイダーからのLLMと、ollamaのようなローカルLLMサービスを使用できます。「Continue」はインタラクティブなチュートリアルを開始し、すぐに使い始めることができます。

## ローカル vs CoPilot（または他のサブスクリプションベースのサービス）

無料の他のCoPilotのようなサービスプロバイダーは多数あります。無料サービスの品質は通常低いため、以下の表では比較しません：

| 機能 | ローカル | CoPilot（または他のサブスクリプションベースのサービス） |
| --- | --- | --- |
| 所有コスト | 中古のnVidia 3060 12GBで200米ドル。すでに持っているPCデスクトップを除く | - |
| 価格 | 無料。電気代は月に約1kWhで、無視できる程度 | サブスクリプションベース、月額10米ドルから |
| ROI | 20ヶ月 | - |
| 選択できるLLM | 多数。プログラミング言語固有のモデルがあります | プロバイダーによる |
| 入力トークン制限 | 100k（Code Llama） | 1500（Copilot） |
| セットアップ | ollamaでかなり簡単 | 簡単 |
| プライバシー | データはローカルマシンに留まる | データは処理のためにサードパーティに送信される |

入力トークンはコンテキストの「メモリ」です。GPT4の入力トークンは8kです。そのため、要件が複雑な場合、生成されるコードがCoPilotよりも優れていると感じるのです。技術が急速に進歩しているため、数値は不正確である可能性があることに注意してください。

生成されるコードの品質は、使用されるモデルだけでなく、システムプロンプトと提供されるコンテキストによっても決まることを覚えておくことが重要です。これは、使用できるモデルが非常に多く、プロンプトがモデルよりも重要である可能性があるためです。Continueから、自分に最適なシステムプロンプトをカスタマイズし、モデルを自由に切り替えることができます。たとえば、適切なシステムプロンプトがない場合、またはコンテキストが混乱している場合、以下の貧弱なコードはCode LlamaとGPT4の両方から生成される可能性があります：

> システムプロンプトなし
> 1から49までの6つのユニークな数字を生成するPython関数を書いてください

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

シンプルなシステムプロンプトが大きな違いを生みます。ollamaとContinueで簡単に切り替えられる温度などの他のパラメータは言うまでもありません：

> システムプロンプト：あなたは、1行のコードで問題を解決することに焦点を当てたベテランプログラマーです。
> 1から49までの6つのユニークな数字を生成するPython関数を書いてください。

{% codeblock lang:python line_number:false %}
def generate_unique_numbers(n):
    return random.sample(range(1, n), k=6)
{% endcodeblock %}

## 結論

セキュリティとプライバシーが私の最大の関心事です。LLMを実行することが私の最良の選択です。
