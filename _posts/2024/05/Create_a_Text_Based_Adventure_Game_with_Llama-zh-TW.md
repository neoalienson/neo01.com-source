---
title: 使用 Llama 創建文字冒險遊戲
date: 2024-5-22
grammar_checked: 2025-07-01
categories:
  - AI
tag:
  - AI
thumbnail: index.jpeg
thumbnail_80: thumbnail.jpeg
spell_checked: 2025-07-01
lang: zh-TW
excerpt: 用 Gradio、LLaMA 3 和 Ollama 輕鬆構建本地 AI 文字冒險遊戲，開啟奇幻之旅！
comments: true
---

![](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/index.jpeg)

使用 Gradio、LLaMA 和 OLLAMA 建立文字冒險遊戲

自 GPT-2 以來，開發者一直使用大型語言模型（LLM）來開發文字遊戲，但設定起來很困難。有了 Gradio、LLaMA 3 和 OLLAMA，在你自己的電腦上免費本地運行文字遊戲變得超級簡單。

在冒險開始之前，你可以了解更多關於 Gradio、LLaMA 和 ollama 的背景：
[使用 Ollama 運行您自己的 ChatGPT 和 Copilot](/zh-TW/2024/05/Running_Your_Own_ChatGPT_and_Copilot_with_Ollama/)

就像上面的部落格文章一樣，將使用 ollama API，建議使用 llama3:instruct 模型。假設你已經拉取了模型：

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

## 遊戲介面

![一覽遊戲介面](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/interface1.png)

遊戲介面不太直觀，但在這篇部落格文章中應該很容易解釋：

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

除了使用 Gradio 設定遊戲介面外，當按下「New Game」按鈕時，關於遊戲背景和規則的指令會發送給 LLM。一個非常好的遊戲指令範例可以在 https://github.com/fladdict/llm_games 找到。將 `<to be inserted>` 替換為提示詞：

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

game_instruction 的副本被保存以供稍後使用。

以下是按下「New Game」按鈕時 LLM 回應的範例：



<div class="box">
  <div class="person-a">
    <div class="message">
歡迎來到聊天轉生：我應該已經死去的青梅竹馬，在異世界成為了英雄！

你即將與你的青梅竹馬展開一場非凡的冒險，她已經轉生到另一個世界成為英雄。你的旅程將通過聊天進行，你將提供知識和指導，幫助你的朋友克服挑戰並擊敗魔王。

初始設定：

你的青梅竹馬名叫 Akira，是一位 17 歲的女孩，有著短而捲曲的棕色頭髮和明亮的藍色眼睛。她性格溫柔好奇，經常向周圍的人尋求建議和支持。

你收到來自 Akira 的訊息：

「嘿！是我，Akira！我知道這聽起來很瘋狂，但我正從另一個世界給你寫信。我在這裡轉生成為英雄，我需要你的幫助。我不了解這個新世界的許多事情，所以我指望你來指導我。」

第一個問題：

Akira 發送了她的第一個問題：

「什麼是『電』？」

請用你選擇的語言（英語、日語或任何其他語言）回答。

故事進度：0 危機上升：0 技術創新：無

等待你的回應以繼續！
   </div><!-- message -->
  </div><!-- person a -->
</div><!-- box -->

玩家現在可以按照指示開始玩遊戲，並輸入他們的行動。

然而，Gradio 中的聊天機器人組件不知道遊戲提示詞和指令。這是因為我們在開始新遊戲時跳過使用聊天機器人與 LLM 通訊。為了解決這個問題，`take_action` 函數幫助將提示詞和指令放在歷史記錄的開頭，然後將它們傳遞給 LLM：

{% codeblock game.py lang:python line_number:false %}
def take_action(prompt, history = None, model = None):
    global game_instruction
    global game_prompt

    starting = [(game_prompt, game_instruction)]
    if len(history) > 0:
        starting.extend(history)

    return generate_chat_response(prompt, history=starting)
{% endcodeblock %}

讓我們開始冒險吧！

## 我的冒險

以下是我在撰寫時的冒險：

![冒險者](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/adventurer_1.jpeg)

<div class="box">
  <div class="person-b">
    <div class="message">
我不擅長物理。你能告訴我你在你的世界中使用的電腦嗎？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">  
別擔心，我不會因為你不擅長物理而責怪你！

Akira 的眼睛睜大，興奮地試圖解釋電腦的概念：

「噢，電腦？！它們就像...可以儲存和處理大量資訊的魔法盒子！你可以用它們與遠方的人交流、玩遊戲，甚至創作藝術和音樂。我們有這些叫做『終端機』的東西，你可以在那裡輸入訊息或指令，電腦會相應地回應。真的很酷！」

故事進度：1
危機上升：0
技術創新：對電腦的基本理解

你在幫助 Akira 理解現代科技方面邁出了一步！然而，魔王仍然潛伏在陰影中，策劃著他的下一步行動...

你接下來想和 Akira 討論什麼？你想探索更多關於電腦的內容，還是轉向其他話題？

請回應你的想法，我會繼續冒險！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
好的，你能告訴我為什麼你對電感興趣嗎？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
Akira 的好奇心：
Akira 身體前傾，眼睛閃爍著興奮：

「哦，電真是太迷人了！在我們的世界，我們還沒有它。我們用蠟燭和火把照明，用壁爐取暖。但轉生我的英雄告訴我這個叫做『電』的東西，它可以為各種設備供電，讓生活更輕鬆。我想了解更多，因為...嗯，如果我們能駕馭它的力量，也許我們可以創造新的方法來擊敗魔王，為我們的世界帶來和平！」

故事進度：2
危機上升：0
技術創新：對電的基本理解
你越幫助 Akira 理解電，她就越接近解開這股神秘力量的秘密！但請記住，魔王仍然潛伏在陰影中，等待著他的機會...
你接下來想和 Akira 討論什麼？你想深入探討世界的科技，還是探索故事的其他方面？
請回應你的想法，我會繼續冒險！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
沒有電，你的電腦怎麼能工作？這對我來說不合邏輯。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
Akira 的擔憂：
Akira 皺起眉頭，看起來很困惑：

「嗯...我從來沒有這樣想過。你說得對，我們的電腦沒有電就無法運作。但是...轉生我的英雄說了一些關於『魔法』和『能量』參與這些設備如何工作的事情。也許不僅僅是電？」

故事進度：3
危機上升：0
技術創新：對電腦概念的基本理解
你讓 Akira 開始批判性地思考科技！然而，魔王仍然潛伏在陰影中，等待著他的機會...
你接下來想和 Akira 討論什麼？你想探索更多關於電腦的內容，還是試著幫助她理解涉及的魔法方面？
請回應你的想法，我會繼續冒險！

（注意：請記住這是一個奇幻世界，概念可能與我們自己的不同。目標是引導 Akira 對現代科技的理解，同時仍然尊重故事的奇幻元素。）
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
讓我們假設在你的世界中，電腦是由魔法而不是電驅動的。魔法能量能用來拯救你的世界嗎？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
Akira 的希望：+
Akira 的眼睛興奮地亮了起來：

「哦，是的！如果我們能駕馭魔法的力量，也許我們可以用它來保衛我們的世界對抗魔王！我聽說有古老的神器和法術被隱藏起來，只等著被發現。也許我們可以用那些來創造一個魔法護盾，或找到削弱魔王力量的方法！」

故事進度：4
危機上升：0
技術創新：對魔法概念的基本理解

你給了 Akira 希望，魔法可以用來拯救他們的世界！然而，魔王仍在策劃他的下一步行動，你們需要繼續合作才能保持領先...

你接下來想和 Akira 討論什麼？你想探索更多關於魔法神器、法術的內容，還是試著想出一個擊敗魔王的計劃？

請回應你的想法，我會繼續冒險！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
請使用魔法能量把我帶到你的世界。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
魔法傳送門：+
Akira 的眼睛興奮地閃耀，她舉起手，一道柔和的藍光開始從中散發出來。你周圍的空氣似乎波動和扭曲，彷彿現實本身正在彎曲以容納魔法能量。

突然，你感覺自己被拉過閃爍的傳送門，離開了你自己的世界。你被一道溫暖的金色光芒包圍，似乎洗去了所有的擔憂和顧慮。當你從另一邊出現時，你發現自己站在 Akira 的世界中。

新環境：+
你環顧四周，發現自己身處一片鬱鬱蔥蔥、充滿生機的森林中。空氣中瀰漫著盛開花朵的甜美香氣，鳥兒柔和的鳴叫聲創造出舒緩的背景旋律。高大的樹木向天空延伸，它們的樹枝上掛滿了似乎沙沙作響並互相低語秘密的樹葉。

Akira 站在你面前，臉上帶著驚奇的表情，看著你的到來。她的眼睛閃爍著興奮，她伸出手向你招手。

故事進度：5
危機上升：0
技術創新：對魔法旅行的基本理解
你成功地旅行到了 Akira 的世界！但請記住，魔王仍然潛伏在陰影中，等待著他的機會。你需要與 Akira 合作，揭開前方的秘密和挑戰...

你接下來想做什麼？你想探索這個新世界、尋找線索或神器，還是試著與 Akira 溝通你們擊敗魔王的共同目標？
請回應你的想法，我會繼續冒險！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
讓我們問問樹木，古老的神器和法術藏在哪裡。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
**低語之林：**   +
Akira 走近一棵高大的樹，眼睛閃爍著好奇。她伸出手，彷彿要觸摸樹幹，並開始用柔和、悅耳的聲音說話：

「智慧之樹，古老的存在，我們尋求你的指引。我們正在尋求擊敗魔王並為我們的世界帶來和平。你能向我們揭示古老的神器和法術藏在哪裡嗎？」

樹木似乎在攪動，它們的樹葉輕輕沙沙作響，彷彿它們在互相交流。然後，它們齊聲低語：

「尋找古老橡樹的神諭，在森林的深處。在那裡，過去的秘密等待著你。但要小心，因為道路險惡，魔王的爪牙潛伏在陰影中。」

**故事進度：** 6
**危機上升：** 1（樹木的警告表明前方有危險。）
**技術創新：** 對與自然進行魔法交流的基本理解

你從低語之林獲得了寶貴的資訊！然而，你現在知道旅程將充滿危險。你接下來想做什麼？

你想前往古老橡樹的神諭，還是探索森林的其他部分尋找線索和資源？或者你想尋求 Akira 的指導，了解如何繼續？

請回應你的想法，我會繼續冒險！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
Akira，請帶我們去森林的深處。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
**森林小徑：**   +
Akira 點點頭，臉上帶著堅定的表情。她沿著一條蜿蜒的小徑帶領你，熟練地穿過茂密的植被。這裡的樹木長得更高更密，在森林地面上投下斑駁的陰影。

當你行走時，空氣中瀰漫著一股超凡脫俗的能量。你能感受到古老魔法的力量從土地本身散發出來。Akira 停下來，眼睛盯著前方的某個東西。她低聲說：「神諭的樹林就在附近。」

**古老橡樹林：**   +
你穿過一簾藤蔓，進入一片被高聳的樹木環繞的空地。中心矗立著一棵巨大的橡樹，它的樹皮因年代久遠而扭曲。空氣中瀰漫著古老智慧的氣息。

Akira 走近樹木，雙手伸出，彷彿在表示敬意。她開始輕聲吟唱，你周圍的空氣似乎隨著能量振動。突然，一個全息影像在你面前具體化：一個飄渺的虛幻身影，眼睛像星星一樣燃燒。

**神諭的幻象：**   +
神諭用一個在你腦海中迴響的聲音說話：「在水晶洞穴的深處尋找光之基石。但要小心，因為道路充滿了險惡的幻象和古老的守護者。」

幻象消失了，留給你的問題比答案還多。你接下來想做什麼？

你要：
A) 出發尋找水晶洞穴
B) 詢問 Akira 關於光之基石及其意義
C) 探索周圍的森林尋找線索和資源

請回應你的選擇。
    </div><!-- message -->
  </div><!-- person a -->
</div><!-- box -->

遊戲開始崩潰。它不再回應故事進度，而是回應多項選擇，與之前的回應不同。這是因為聊天歷史已經達到 8k 個 token，這是模型一次可以處理的最大 token 數量。我們如何解決這個問題？我們可以使用支援更多上下文的不同模型嗎？還是我們應該總結故事進度，然後將其傳遞給模型？這是你真正的冒險了！

![全尺寸冒險者](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/adventurer.jpeg)

![全尺寸 Akira](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/akira.jpeg)

<link rel="stylesheet" href="/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/style.css">
