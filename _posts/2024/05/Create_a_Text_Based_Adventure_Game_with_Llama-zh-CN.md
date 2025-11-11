---
title: 使用 Llama 创建文字冒险游戏
date: 2024-5-22
grammar_checked: 2025-07-01
categories:
  - AI
tag:
  - AI
thumbnail: index.jpeg
thumbnail_80: thumbnail.jpeg
spell_checked: 2025-07-01
lang: zh-CN
excerpt: 用 Gradio、LLaMA 3 和 Ollama 轻松构建本地 AI 文字冒险游戏，开启奇幻之旅！
comments: true
---

![](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/index.jpeg)

使用 Gradio、LLaMA 和 OLLAMA 建立文字冒险游戏

自 GPT-2 以来，开发者一直使用大型语言模型（LLM）来开发文字游戏，但设置起来很困难。有了 Gradio、LLaMA 3 和 OLLAMA，在你自己的电脑上免费本地运行文字游戏变得超级简单。

在冒险开始之前，你可以了解更多关于 Gradio、LLaMA 和 ollama 的背景：
[使用 Ollama 运行您自己的 ChatGPT 和 Copilot](/zh-CN/2024/05/Running_Your_Own_ChatGPT_and_Copilot_with_Ollama/)

就像上面的博客文章一样，将使用 ollama API，建议使用 llama3:instruct 模型。假设你已经拉取了模型：

{% codeblock game.py lang:python line_number:false %}
def generate_chat_response(prompt, history = None, model= 'llama3:instruct'):
    if model is None:
        model = shared.selected_model

    messages = []
    if history:
        for u, a in history:
            messages.append({"role": "user", "content": u})
            messages.append({"role": "assistant", "content": a})
    messages.append({"role": "user", "content": prompt})

    data = {"model": model, "stream": False, "messages": messages}

    response = requests.post(
        config.ollama_url + "chat",
        headers={"Content-Type": "application/json", "Connection": "close"},
        data=json.dumps(data),
    )

    if response.status_code == 200:
        bot_message = json.loads(response.text)["message"]["content"]
        return bot_message
    else:
        print("Error: generate response:", response.status_code, response.text)

{% endcodeblock %}

## 游戏界面

![一览游戏界面](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/interface1.png)

游戏界面不太直观，但在这篇博客文章中应该很容易解释：

{% codeblock game.py lang:python line_number:false %}
import gradio as gr

# Game Interface
with gr.Blocks() as demo:
    textbox = gr.Textbox(elem_id="input_box", lines=3, min_width=800)
    chatbot = gr.Chatbot(show_copy_button=True, layout="panel")
    submit_btn = gr.Button(value="Submit")
    with gr.Blocks():
        nem_game = gr.ClearButton(value='New Game', components = [chatbot])
        chat_interface = gr.ChatInterface(
            fn=take_action,
            textbox=textbox,
            chatbot=chatbot,
            submit_btn=submit_btn,
            retry_btn=None,
            undo_btn=None,
        )
        nem_game.click(fn=start_new_game, output=chat_interface.chatbot_state)

if __name__ == "__main__":
    demo.launch()        
{% endcodeblock %}

除了使用 Gradio 设置游戏界面外，当按下「New Game」按钮时，关于游戏背景和规则的指令会发送给 LLM。一个非常好的游戏指令范例可以在 https://github.com/fladdict/llm_games 找到。将 `<to be inserted>` 替换为提示词：

{% codeblock game.py lang:python line_number:false %}
game_prompt = """
<to be inserted>
"""

game_instruction = ""

def start_new_game():
    global game_instruction

    response = generate_chat_response(prompt=game_prompt)
    game_instruction = response

    # clean up chat history
    return []
{% endcodeblock %}

game_instruction 的副本被保存以供稍后使用。

以下是按下「New Game」按钮时 LLM 响应的范例：

<div class="box">
  <div class="person-a">
    <div class="message">
欢迎来到聊天转生：我应该已经死去的青梅竹马，在异世界成为了英雄！

你即将与你的青梅竹马展开一场非凡的冒险，她已经转生到另一个世界成为英雄。你的旅程将通过聊天进行，你将提供知识和指导，帮助你的朋友克服挑战并击败魔王。

初始设定：

你的青梅竹马名叫 Akira，是一位 17 岁的女孩，有着短而卷曲的棕色头发和明亮的蓝色眼睛。她性格温柔好奇，经常向周围的人寻求建议和支持。

你收到来自 Akira 的消息：

「嘿！是我，Akira！我知道这听起来很疯狂，但我正从另一个世界给你写信。我在这里转生成为英雄，我需要你的帮助。我不了解这个新世界的许多事情，所以我指望你来指导我。」

第一个问题：

Akira 发送了她的第一个问题：

「什么是『电』？」

请用你选择的语言（英语、日语或任何其他语言）回答。

故事进度：0 危机上升：0 技术创新：无

等待你的响应以继续！
   </div><!-- message -->
  </div><!-- person a -->
</div><!-- box -->

玩家现在可以按照指示开始玩游戏，并输入他们的行动。

然而，Gradio 中的聊天机器人组件不知道游戏提示词和指令。这是因为我们在开始新游戏时跳过使用聊天机器人与 LLM 通信。为了解决这个问题，`take_action` 函数帮助将提示词和指令放在历史记录的开头，然后将它们传递给 LLM：

{% codeblock game.py lang:python line_number:false %}
def take_action(prompt, history = None, model = None):
    global game_instruction
    global game_prompt

    starting = [(game_prompt, game_instruction)]
    if len(history) > 0:
        starting.extend(history)

    return generate_chat_response(prompt, history=starting)
{% endcodeblock %}

让我们开始冒险吧！

## 我的冒险

以下是我在撰写时的冒险：

![冒险者](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/adventurer_1.jpeg)

<div class="box">
  <div class="person-b">
    <div class="message">
我不擅长物理。你能告诉我你在你的世界中使用的电脑吗？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">  
别担心，我不会因为你不擅长物理而责怪你！

Akira 的眼睛睁大，兴奋地试图解释电脑的概念：

「噢，电脑？！它们就像...可以存储和处理大量信息的魔法盒子！你可以用它们与远方的人交流、玩游戏，甚至创作艺术和音乐。我们有这些叫做『终端机』的东西，你可以在那里输入消息或指令，电脑会相应地响应。真的很酷！」

故事进度：1
危机上升：0
技术创新：对电脑的基本理解

你在帮助 Akira 理解现代科技方面迈出了一步！然而，魔王仍然潜伏在阴影中，策划着他的下一步行动...

你接下来想和 Akira 讨论什么？你想探索更多关于电脑的内容，还是转向其他话题？

请响应你的想法，我会继续冒险！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
好的，你能告诉我为什么你对电感兴趣吗？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
Akira 的好奇心：
Akira 身体前倾，眼睛闪烁着兴奋：

「哦，电真是太迷人了！在我们的世界，我们还没有它。我们用蜡烛和火把照明，用壁炉取暖。但转生我的英雄告诉我这个叫做『电』的东西，它可以为各种设备供电，让生活更轻松。我想了解更多，因为...嗯，如果我们能驾驭它的力量，也许我们可以创造新的方法来击败魔王，为我们的世界带来和平！」

故事进度：2
危机上升：0
技术创新：对电的基本理解
你越帮助 Akira 理解电，她就越接近解开这股神秘力量的秘密！但请记住，魔王仍然潜伏在阴影中，等待着他的机会...
你接下来想和 Akira 讨论什么？你想深入探讨世界的科技，还是探索故事的其他方面？
请响应你的想法，我会继续冒险！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
没有电，你的电脑怎么能工作？这对我来说不合逻辑。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
Akira 的担忧：
Akira 皱起眉头，看起来很困惑：

「嗯...我从来没有这样想过。你说得对，我们的电脑没有电就无法运作。但是...转生我的英雄说了一些关于『魔法』和『能量』参与这些设备如何工作的事情。也许不仅仅是电？」

故事进度：3
危机上升：0
技术创新：对电脑概念的基本理解
你让 Akira 开始批判性地思考科技！然而，魔王仍然潜伏在阴影中，等待着他的机会...
你接下来想和 Akira 讨论什么？你想探索更多关于电脑的内容，还是试着帮助她理解涉及的魔法方面？
请响应你的想法，我会继续冒险！

（注意：请记住这是一个奇幻世界，概念可能与我们自己的不同。目标是引导 Akira 对现代科技的理解，同时仍然尊重故事的奇幻元素。）
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
让我们假设在你的世界中，电脑是由魔法而不是电驱动的。魔法能量能用来拯救你的世界吗？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
Akira 的希望：+
Akira 的眼睛兴奋地亮了起来：

「哦，是的！如果我们能驾驭魔法的力量，也许我们可以用它来保卫我们的世界对抗魔王！我听说有古老的神器和法术被隐藏起来，只等着被发现。也许我们可以用那些来创造一个魔法护盾，或找到削弱魔王力量的方法！」

故事进度：4
危机上升：0
技术创新：对魔法概念的基本理解

你给了 Akira 希望，魔法可以用来拯救他们的世界！然而，魔王仍在策划他的下一步行动，你们需要继续合作才能保持领先...

你接下来想和 Akira 讨论什么？你想探索更多关于魔法神器、法术的内容，还是试着想出一个击败魔王的计划？

请响应你的想法，我会继续冒险！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
请使用魔法能量把我带到你的世界。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
魔法传送门：+
Akira 的眼睛兴奋地闪耀，她举起手，一道柔和的蓝光开始从中散发出来。你周围的空气似乎波动和扭曲，仿佛现实本身正在弯曲以容纳魔法能量。

突然，你感觉自己被拉过闪烁的传送门，离开了你自己的世界。你被一道温暖的金色光芒包围，似乎洗去了所有的担忧和顾虑。当你从另一边出现时，你发现自己站在 Akira 的世界中。

新环境：+
你环顾四周，发现自己身处一片郁郁葱葱、充满生机的森林中。空气中弥漫着盛开花朵的甜美香气，鸟儿柔和的鸣叫声创造出舒缓的背景旋律。高大的树木向天空延伸，它们的树枝上挂满了似乎沙沙作响并互相低语秘密的树叶。

Akira 站在你面前，脸上带着惊奇的表情，看着你的到来。她的眼睛闪烁着兴奋，她伸出手向你招手。

故事进度：5
危机上升：0
技术创新：对魔法旅行的基本理解
你成功地旅行到了 Akira 的世界！但请记住，魔王仍然潜伏在阴影中，等待着他的机会。你需要与 Akira 合作，揭开前方的秘密和挑战...

你接下来想做什么？你想探索这个新世界、寻找线索或神器，还是试着与 Akira 沟通你们击败魔王的共同目标？
请响应你的想法，我会继续冒险！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
让我们问问树木，古老的神器和法术藏在哪里。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
**低语之林：**   +
Akira 走近一棵高大的树，眼睛闪烁着好奇。她伸出手，仿佛要触摸树干，并开始用柔和、悦耳的声音说话：

「智慧之树，古老的存在，我们寻求你的指引。我们正在寻求击败魔王并为我们的世界带来和平。你能向我们揭示古老的神器和法术藏在哪里吗？」

树木似乎在搅动，它们的树叶轻轻沙沙作响，仿佛它们在互相交流。然后，它们齐声低语：

「寻找古老橡树的神谕，在森林的深处。在那里，过去的秘密等待着你。但要小心，因为道路险恶，魔王的爪牙潜伏在阴影中。」

**故事进度：** 6
**危机上升：** 1（树木的警告表明前方有危险。）
**技术创新：** 对与自然进行魔法交流的基本理解

你从低语之林获得了宝贵的信息！然而，你现在知道旅程将充满危险。你接下来想做什么？

你想前往古老橡树的神谕，还是探索森林的其他部分寻找线索和资源？或者你想寻求 Akira 的指导，了解如何继续？

请响应你的想法，我会继续冒险！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
Akira，请带我们去森林的深处。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
**森林小径：**   +
Akira 点点头，脸上带着坚定的表情。她沿着一条蜿蜒的小径带领你，熟练地穿过茂密的植被。这里的树木长得更高更密，在森林地面上投下斑驳的阴影。

当你行走时，空气中弥漫着一股超凡脱俗的能量。你能感受到古老魔法的力量从土地本身散发出来。Akira 停下来，眼睛盯着前方的某个东西。她低声说：「神谕的树林就在附近。」

**古老橡树林：**   +
你穿过一帘藤蔓，进入一片被高耸的树木环绕的空地。中心矗立着一棵巨大的橡树，它的树皮因年代久远而扭曲。空气中弥漫着古老智慧的气息。

Akira 走近树木，双手伸出，仿佛在表示敬意。她开始轻声吟唱，你周围的空气似乎随着能量振动。突然，一个全息影像在你面前具体化：一个飘渺的虚幻身影，眼睛像星星一样燃烧。

**神谕的幻象：**   +
神谕用一个在你脑海中回响的声音说话：「在水晶洞穴的深处寻找光之基石。但要小心，因为道路充满了险恶的幻象和古老的守护者。」

幻象消失了，留给你的问题比答案还多。你接下来想做什么？

你要：
A) 出发寻找水晶洞穴
B) 询问 Akira 关于光之基石及其意义
C) 探索周围的森林寻找线索和资源

请响应你的选择。
    </div><!-- message -->
  </div><!-- person a -->
</div><!-- box -->

游戏开始崩溃。它不再响应故事进度，而是响应多项选择，与之前的响应不同。这是因为聊天历史已经达到 8k 个 token，这是模型一次可以处理的最大 token 数量。我们如何解决这个问题？我们可以使用支持更多上下文的不同模型吗？还是我们应该总结故事进度，然后将其传递给模型？这是你真正的冒险了！

![全尺寸冒险者](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/adventurer.jpeg)

![全尺寸 Akira](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/akira.jpeg)

<link rel="stylesheet" href="/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/style.css">
