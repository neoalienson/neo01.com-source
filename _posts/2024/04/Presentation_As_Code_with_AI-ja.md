---
title: AIを使ったプレゼンテーション・アズ・コード
date: 2024-04-01
tags:
  - AI
  - Presentation as Code
  - Slidev
categories:
  - Development 
spell_checked: 2025-01-01
grammar_checked: 2025-01-01
thumbnail_80: /2024/04/Presentation_As_Code_with_AI/thumbnail_80.jpeg
thumbnail: /2024/04/Presentation_As_Code_with_AI/thumbnail.jpeg
lang: ja
excerpt: "プレゼンテーション・アズ・コードのためのSlidevとLLMを探求しますが、レイアウト調整とアニメーションはAI支援でも依然として困難です。"
---

![](/2024/04/Presentation_As_Code_with_AI/index.jpeg)

「すべてをコードで」という概念をご存知ですか？これは、インフラストラクチャ、図、ポリシーなど、さまざまなシステムコンポーネントを定義、管理、自動化するためにコードを使用することを指します。しかし、プレゼンテーションはどうでしょうか？コードを使用して魅力的でインタラクティブなスライドを作成することは可能でしょうか？

答えはイエスです。Slidevのおかげで、MarkdownとVue.jsを使用してスライドを書くことができるプレゼンテーションフレームワークがあります。Slidevはプレゼンテーション・アズ・コードのアイデアに基づいており、お気に入りのコードエディタ、バージョン管理システム、開発ツールを使用してスライドを作成および共有できることを意味します。

このブログ投稿では、Slidevを紹介し、PowerPointなどの従来のプレゼンテーションツールとの比較を示します。また、大規模言語モデル（LLM）AIでプレゼンテーションコードを生成する可能性も探ります。

{% mermaid %}
graph LR
    A["従来のツール"] --> B["PowerPoint/Keynote"]
    C["プレゼンテーション・アズ・コード"] --> D["Markdown + Slidev"]
    B --> E["ビジュアルエディタ"]
    D --> F["コードエディタ + Git"]
{% endmermaid %}

## プレゼンテーション・アズ・コードとは？

プレゼンテーション・アズ・コードは、グラフィカルユーザーインターフェースの代わりにコードを使用してプレゼンテーションを作成する方法です。従来のプレゼンテーションツールと比較して、いくつかの利点があります：

- お気に入りのコードエディタと構文ハイライトを使用できる
- プログラミング言語とフレームワークの力と柔軟性を活用できる
- スライドとコンポーネントを再利用およびモジュール化できる
- Gitまたは他のツールを使用してスライドを共同作業およびバージョン管理できる
- プレゼンテーションワークフローを自動化およびカスタマイズできる
- スライドを外部データソースやAPIと統合できる

もちろん、プレゼンテーション・アズ・コードにはいくつかの欠点もあります：

- 新しい構文やフレームワークを学ぶ必要がある
- 視覚的なフィードバックとインタラクティビティが失われる可能性がある
- スライドのレイアウトとデザインに対する制御が少なくなる可能性がある
- 異なるブラウザやデバイスとの互換性の問題に直面する可能性がある
- アニメーションの追加が困難になる可能性がある

プレゼンテーション・アズ・コードの利点の1つは、好きなプログラミング言語やフレームワークを使用できることです。たとえば、HTML、CSS、JavaScriptを使用してWebベースのスライドを作成したり、LaTeXを使用してPDFスライドを作成したりできます。

ただし、プレゼンテーション・アズ・コード用に設計された特定のフレームワークを探している場合は、Slidev（https://github.com/slidevjs/slidev）をチェックしてみてください。

!!!tip "💡 クイックスタート"
    Slidevを試してみたいですか？`npm init slidev`を実行するだけで、最初のプレゼンテーションを作成できます！

もう1つの代替手段は、PowerPointでVBAを使用してスライドを作成することです。ただし、VBAはMarkdownと比較して人間が読みにくいです。この投稿はプレゼンテーション・アズ・コードに焦点を当てているため、Slidevに集中します。

## LLMを使ったSlidev

プレゼンテーション用のSlidev Markdownは、HTML/CSS/JavaScriptよりもクリーンであることが多いです。Markdownは人間が読みやすく、ChatGPTなどのLLMはプロンプトでMarkdownを生成できます。たとえば：「小学生向けの太陽系に関するプレゼンテーションをSlidevを使用して生成してください。トランジションにはフェードアウトを使用してください。」

結果は、複数のスライドを含むクリーンなSlidev Markdownプレゼンテーションです：
~~~
---
title: Solar System
transition: fade-out
---

# The Solar System

---

## What is the Solar System?

The Solar System is made up of the Sun and all the objects that orbit around it. Let's explore the planets and other fascinating things in our Solar System!

---

## The Sun

The Sun is a star at the center of our Solar System. It is a giant ball of hot, glowing gases. The Sun provides light and heat to all the planets.

---

## The Planets

| Planet   | Description                                        |
|----------|-----------------------------------------------------|
| Mercury  | Closest to the Sun, small and rocky                 |
| Venus    | Known as the "evening star," has a thick atmosphere |
| Earth    | Our home planet, with land, water, and atmosphere   |
| Mars     | Red planet with polar ice caps and dusty storms     |
| Jupiter  | Largest planet, with colorful stripes and big storms|
| Saturn   | Known for its beautiful rings made of ice and dust  |
| Uranus   | Tilted on its side, with icy blue color             |
| Neptune  | Cold, blue planet with strong winds                 |

---

## Other Objects

Apart from the Sun and planets, the Solar System also has other interesting objects:

- **Moon**: Earth's natural satellite
- **Asteroids**: Rocky objects that orbit the Sun
- **Comets**: Icy objects that leave a glowing trail when they get close to the Sun

---

## Fun Facts

- The Sun is so big that you can fit more than a million Earths inside it!
- Jupiter has a famous storm called the Great Red Spot, which is larger than Earth.
- Saturn's rings are not solid but made up of billions of small pieces of ice and rock.
- The Moon is about 1/4th the size of Earth and is our closest neighbor in space.

---

## Conclusion

The Solar System is a fascinating place with the Sun, planets, and other interesting objects. It's incredible to learn about the wonders of space!

---

# Questions?

Feel free to ask any questions you have about the Solar System!
~~~

他の画像生成AIと同様に、LLM AIは人間の視点を欠いています。AIモデルは冗長になるように調整されていることが多いため、テキストのオーバーフローが一般的です。

!!!warning "⚠️ 学習曲線"
    MarkdownはHTML/CSSよりシンプルですが、高度な機能のためにSlidev固有の構文とVue.jsを学ぶ必要があります。

### 画像はどうですか？

LLM単独で画像を追加することは非常に労力がかかります。適切な画像を検索し、ダウンロードし、ファイル名と配置でプロンプトを更新する必要があります。それでも、結果は予測不可能です。

### チャートはどうですか？

Mermaidでチャートを作成できますが、既知のLLMはこのタスクに最適化されておらず、多くの場合手動介入が必要です。

### アニメーションはどうですか？

Slidevでアニメーションを追加することは、CSSやJavaScriptアニメーションなどのWeb技術の理解が必要なため、困難な場合があり、すべてのユーザーにとって簡単ではない可能性があります。

## 結論

Slidevはコードでプレゼンテーションを作成するための革新的なツールですが、独自の課題があります。大規模言語モデルの支援があっても、ユーザーはスライドのレイアウト、デザイン、アニメーションをコーディングする際に困難に直面することがよくあります。最適な人間の読みやすさのために要素のサイズ変更と調整を行うことは、特にイライラして時間がかかる可能性があります。さらに、プレゼンテーションをより魅力的にするためのアニメーションの追加は、依然として複雑なタスクです。これらのハードルにもかかわらず、Slidevは柔軟性、インタラクティビティ、他のWeb技術との互換性など、大きな利点を提供します。コードを通じてアイデアを提示する新しい方法を求める人にとって、Slidevは間違いなく探求する価値があります。
