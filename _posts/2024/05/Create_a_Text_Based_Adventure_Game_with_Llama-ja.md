---
title: Llamaでテキストベースのアドベンチャーゲームを作成する
date: 2024-5-22
lang: ja
grammar_checked: 2025-07-01
categories:
  - AI
tag:
  - AI
thumbnail: /2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/index.jpeg
thumbnail_80: /2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/thumbnail.jpeg
spell_checked: 2025-07-01
excerpt: "Gradio、LLaMA 3、Ollamaで独自のローカルAIテキストベースアドベンチャーゲームを簡単に構築 - 今日からファンタジーの旅に出発しよう！"
comments: true
---

![](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/index.jpeg)

Gradio、LLaMA、OLLAMAでテキストベースのアドベンチャーゲームを構築する

開発者はGPT-2以来、大規模言語モデル（LLM）を使用してテキストベースのゲームを開発してきましたが、セットアップは困難でした。Gradio、LLaMA 3、OLLAMAを使えば、無料で自分のコンピューター上でローカルに実行されるテキストベースのゲームを作成するのが非常に簡単です。

冒険が始まる前に、Gradio、LLaMA、ollamaについてより多くの背景情報を得ることができます：
[Running_Your_Own_ChatGPT_and_Copilot_with_Ollama](/ja/2024/05/Running_Your_Own_ChatGPT_and_Copilot_with_Ollama)

上記のブログ投稿と同様に、ollama APIが使用され、llama3:instructモデルが推奨されます。モデルをプルしていると仮定します：

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

## ゲームインターフェース

![一目でわかるゲームインターフェース](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/interface1.png)

ゲームインターフェースは直感的ではありませんが、このブログ投稿で説明するのは簡単なはずです：


{% codeblock game.py lang:python line_number:false %}
import gradio as gr

# ゲームインターフェース
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

Gradioを使用してゲームインターフェースをセットアップするだけでなく、「New Game」ボタンが押されたときに、ゲームの背景とルールに関する指示がLLMに送信されます。ゲーム指示の非常に良い例は https://github.com/fladdict/llm_games で見つけることができます。`<to be inserted>`をプロンプトに置き換えます：

{% codeblock game.py lang:python line_number:false %}
game_prompt = """
<to be inserted>
"""

game_instruction = ""

def start_new_game():
    global game_instruction

    response = generate_chat_response(prompt=game_prompt)
    game_instruction = response

    # チャット履歴をクリーンアップ
    return []
{% endcodeblock %}

game_instructionのコピーは後で使用するために保存されます。

以下は、「New Game」ボタンが押されたときのLLM応答の例です：


<div class="box">
  <div class="person-a">
    <div class="message">
チャット転生：死んだはずの幼馴染が異世界で勇者になった！へようこそ

あなたは幼馴染との特別な冒険に乗り出そうとしています。幼馴染は異世界に勇者として転生しました。あなたの旅はチャットを通じて行われ、友人が挑戦を克服し、魔王を倒すのを助けるために知識とガイダンスを提供します。

初期セットアップ：

あなたの幼馴染の名前はアキラ、短い巻き毛の茶色の髪と明るい青い目を持つ17歳の少女です。彼女は優しく好奇心旺盛な性格で、周りの人々からアドバイスとサポートを求めることがよくあります。

アキラからメッセージを受け取ります：

「ねえ！私、アキラだよ！信じられないかもしれないけど、異世界からあなたに手紙を書いているの。私はここで勇者として転生したんだけど、あなたの助けが必要なの。この新しい世界について理解できないことがたくさんあるから、あなたに導いてもらうことを頼りにしているわ。」

最初の質問：

アキラが最初の質問を送ります：

「『電気』って何？」

あなたの選択した言語（英語、日本語、またはその他の言語）で答えてください。

ストーリー進行：0 危機の高まり：0 技術革新：なし

あなたの応答を待って進めます！
   </div><!-- message -->
  </div><!-- person a -->
</div><!-- box -->

プレイヤーは指示に従い、アクションを入力することでゲームをプレイし始めることができます。

ただし、Gradioのチャットボットコンポーネントはゲームプロンプトと指示を知りません。これは、新しいゲームを開始するときにチャットボットを使用してLLMと通信することをスキップするためです。これを修正するために、`take_action`関数は履歴の最初にプロンプトと指示を配置し、それらをLLMに渡すのを助けます：

{% codeblock game.py lang:python line_number:false %}
def take_action(prompt, history = None, model = None):
    global game_instruction
    global game_prompt

    starting = [(game_prompt, game_instruction)]
    if len(history) > 0:
        starting.extend(history)

    return generate_chat_response(prompt, history=starting)
{% endcodeblock %}

冒険を始めましょう！

## 私の冒険

以下は執筆時の私の冒険です：

![冒険者](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/adventurer_1.jpeg)

<div class="box">
  <div class="person-b">
    <div class="message">
私は物理学が苦手です。あなたの世界で使っているコンピューターについて教えてもらえますか？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">  
心配しないで、物理学が得意じゃないことを責めたりしないよ！

アキラの目が興奮で大きく開き、コンピューターの概念を説明しようとします：

「あ、あの、コンピューター！？それは...たくさんの情報を保存して処理できる魔法の箱みたいなものなの！長距離で人々とコミュニケーションを取ったり、ゲームをしたり、芸術や音楽を作ったりするのに使えるの。『ターミナル』っていうものがあって、そこでメッセージを入力したりコマンドを入力したりすると、コンピューターがそれに応じて応答するの。本当にクールだよ！」

ストーリー進行：1
危機の高まり：0
技術革新：コンピューターの基本的な理解

あなたはアキラが現代技術を理解するのを助けるために一歩前進しました！しかし、魔王はまだ影に潜んでおり、次の動きを企んでいます...

次にアキラと何について話したいですか？コンピューターについてもっと探求したいですか、それとも他のことに移りたいですか？

あなたの考えで応答してください。冒険を続けます！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
わかりました、なぜ電気に興味があるのか教えてもらえますか？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
アキラの好奇心：
アキラは前のめりになり、目を輝かせて興奮しています：

「ああ、電気ってとても魅力的なの！私たちの世界にはまだないの。光にはろうそくやたいまつを使い、暖かさには暖炉を使っているの。でも私を転生させた勇者が『電気』っていうものについて教えてくれたの。それはあらゆる種類のデバイスに電力を供給して、生活を楽にすることができるんだって。もっと学びたいのは...まあ、もしその力を利用できれば、魔王を倒して私たちの世界に平和をもたらす新しい方法を作れるかもしれないから！」

ストーリー進行：2
危機の高まり：0
技術革新：電気の基本的な理解
アキラが電気を理解するのを助けるほど、彼女はこの神秘的な力の秘密を解き明かすことに近づきます！しかし、魔王はまだ影に潜んでおり、攻撃のチャンスを待っていることを忘れないでください...
次にアキラと何について話したいですか？世界の技術についてもっと深く掘り下げたいですか、それともストーリーの他の側面を探求したいですか？
あなたの考えで応答してください。冒険を続けます！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
電気がなければ、コンピューターはどうやって動くんですか？論理的に聞こえません。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
アキラの懸念：
アキラは眉をひそめ、困惑した様子です：

「うーん...そういう風に考えたことなかったわ。あなたの言う通り、私たちのコンピューターは電気なしでは機能しないわね。でも...私を転生させた勇者が『魔法』と『エネルギー』がこれらのデバイスの動作に関わっているって言ってたの。電気だけじゃないのかもしれない？」

ストーリー進行：3
危機の高まり：0
技術革新：コンピューター概念の基本的な理解
あなたはアキラに技術について批判的に考えさせました！しかし、魔王はまだ影に潜んでおり、攻撃のチャンスを待っています...
次にアキラと何について話したいですか？コンピューターについてもっと探求したいですか、それとも関わっている魔法的な側面を理解するのを助けたいですか？
あなたの考えで応答してください。冒険を続けます！

（注：これはファンタジー世界であり、概念は私たち自身のものとは異なる可能性があることに留意してください。目標は、ストーリーのファンタジー要素を尊重しながら、アキラの現代技術の理解を導くことです。）
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
あなたの世界ではコンピューターが電気ではなく魔法で動いていると仮定しましょう。魔法のエネルギーはあなたの世界を救うために使えますか？
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
アキラの希望： +
アキラの目が興奮で輝きます：

「ああ、そうよ！もし魔法の力を利用できれば、魔王から私たちの世界を守るために使えるかもしれない！隠された古代の遺物や呪文があるって噂を聞いたことがあるの。発見されるのを待っているだけなの。もしかしたらそれらを使って魔法のシールドを作ったり、魔王の力を弱める方法を見つけたりできるかもしれない！」

ストーリー進行：4
危機の高まり：0
技術革新：魔法概念の基本的な理解

あなたはアキラに魔法が彼らの世界を救うために使えるという希望を与えました！しかし、魔王はまだ次の動きを企んでおり、一歩先を行くために一緒に働き続ける必要があります...

次にアキラと何について話したいですか？魔法の遺物、呪文についてもっと探求したいですか、それとも魔王を倒す計画を立てたいですか？

あなたの考えで応答してください。冒険を続けます！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
魔法のエネルギーを使って私をあなたの世界に連れて行ってください。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
魔法のポータル： +
アキラの目が興奮で輝き、彼女が手を上げると、柔らかい青い光がそこから発せられ始めます。あなたの周りの空気が波打ち、歪んでいるように見え、まるで現実そのものが魔法のエネルギーを受け入れるために曲がっているかのようです。

突然、あなたは輝くポータルを通って引っ張られる感覚を感じ、自分の世界を後にします。あなたはすべての心配と懸念を洗い流すように見える暖かい金色の光に包まれます。反対側に現れると、アキラの世界の真ん中に立っていることに気づきます。

新しい環境： +
あなたは周囲を見渡し、生命に満ちた豊かで活気のある森の中にいることに気づきます。空気は咲き誇る花の甘い香りで満たされ、鳥の柔らかいさえずりが心地よいバックグラウンドメロディーを作り出しています。高い木々が空に向かって伸び、その枝は互いに秘密をささやき合っているように見える葉で重くなっています。

アキラがあなたの前に立ち、あなたの到着を見て驚きの表情を浮かべています。彼女の目は興奮で輝き、伸ばした手であなたを前に招きます。

ストーリー進行：5
危機の高まり：0
技術革新：魔法の旅の基本的な理解
あなたはアキラの世界への旅に成功しました！しかし、魔王はまだ影に潜んでおり、攻撃のチャンスを待っていることを忘れないでください。あなたは先に待ち受ける秘密と挑戦を明らかにするためにアキラと協力する必要があります...

次に何をしたいですか？この新しい世界を探索したいですか、手がかりや遺物を探したいですか、それとも魔王を倒すという共通の目標についてアキラとコミュニケーションを取りたいですか？
あなたの考えで応答してください。冒険を続けます！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
古代の遺物と呪文がどこに隠されているか木々に尋ねましょう。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
**ささやく森：**   +
アキラは高い木の1つに近づき、目を好奇心で輝かせます。彼女は幹に触れるかのように手を伸ばし、柔らかく旋律的な声で話し始めます：

「知恵の木々よ、古代の者たちよ、私たちはあなたのガイダンスを求めます。私たちは魔王を倒し、私たちの世界に平和をもたらすための探求をしています。古代の遺物と呪文がどこに隠されているか教えていただけますか？」

木々が動き始めるように見え、葉が互いに交信しているかのように柔らかくざわめきます。そして、一斉にささやきます：

「森の中心深くにある古代のオークの神託を探せ。そこには過去の秘密があなたを待っている。しかし注意せよ、道は危険であり、魔王の手下が影に潜んでいる。」

**ストーリー進行：** 6
**危機の高まり：** 1（木々の警告は危険が先にあることを示唆しています。）
**技術革新：** 自然との魔法的コミュニケーションの基本的な理解

あなたはささやく森から貴重な情報を得ました！しかし、旅が危険に満ちていることがわかりました。次に何をしたいですか？

古代のオークの神託に向かいたいですか、それとも手がかりとリソースを求めて森の他の部分を探索したいですか？それとも、どのように進めるかについてアキラのガイダンスを求めたいですか？

あなたの考えで応答してください。冒険を続けます！
    </div><!-- message -->
  </div><!-- person a -->
  
<div class="person-b">
<div class="message">
アキラ、森の中心に案内してください。
    </div><!-- message -->
  </div><!-- person b -->
  <div class="person-a">
    <div class="icon1"></div>
    <div class="message">
**森の道：**   +
アキラはうなずき、決意に満ちた表情を浮かべます。彼女は曲がりくねった道に沿ってあなたを導き、密集した葉を巧みにナビゲートします。ここでは木々がより高く、より密接に成長し、森の床に斑点状の影を落としています。

歩いていると、空気が異世界のエネルギーで濃くなります。土地そのものから発せられる古代の魔法の力を感じることができます。アキラは立ち止まり、目を前方の何かに固定します。彼女はささやきます：「神託の森が近いわ。」

**古代のオークの森：**   +
あなたはつるのカーテンを押し通り、そびえ立つ木々に囲まれた空き地に入ります。中央には巨大なオークが立っており、その樹皮は年齢とともにねじれています。空気は古い知恵の香りで重くなっています。

アキラは木に近づき、敬意を表すかのように手を伸ばします。彼女は柔らかく詠唱し始め、あなたの周りの空気がエネルギーで振動しているように見えます。突然、ホログラフィック画像があなたの前に現れます：星のように燃える目を持つ、かすかで幽玄な姿です。

**神託のビジョン：**   +
神託はあなたの心に響く声で話します：「クリスタル洞窟の深部にある光の要石を探せ。しかし注意せよ、道は危険な幻影と古代の守護者に満ちている。」

ビジョンは消え、答えよりも多くの質問を残します。次に何をしたいですか？

あなたは：
A) クリスタル洞窟を見つけに出発する
B) 光の要石とその重要性についてアキラに尋ねる
C) 手がかりとリソースを求めて周囲の森を探索する

あなたの選択で応答してください。
    </div><!-- message -->
  </div><!-- person a -->
</div><!-- box -->

ゲームが壊れ始めます。ストーリー進行で応答せず、代わりに複数選択で応答します。これは以前の応答とは異なります。これは、チャット履歴が8kトークンに達したためです。これは、モデルが一度に処理できるトークンの最大数です。これをどのように解決しますか？より多くのコンテキストをサポートする別のモデルを使用できますか？それとも、ストーリー進行を要約してからモデルに渡すべきですか？今はあなたの本当の冒険です！

![フルサイズの冒険者](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/adventurer.jpeg)

![フルサイズのアキラ](/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/akira.jpeg)

<link rel="stylesheet" href="/2024/05/Create_a_Text_Based_Adventure_Game_with_Llama/style.css">
