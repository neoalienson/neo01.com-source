---
title: 使用 AI 的程式碼化簡報
date: 2024-04-01
tags:
  - AI
  - Presentation as Code
  - Slidev
categories:
  - Development
thumbnail_80: thumbnail_80.jpeg
thumbnail: thumbnail.jpeg
lang: zh-TW
excerpt: 探索 Slidev 和 LLM 建立程式碼化簡報，但版面和動畫調整仍是挑戰。
---

![](/2024/04/Presentation_As_Code_with_AI/index.jpeg)

您熟悉「一切皆程式碼」的概念嗎？它指的是使用程式碼來定義、管理和自動化各種系統元件，包括基礎設施、圖表、政策等等。但簡報呢？是否可以使用程式碼來製作令人驚豔且互動式的投影片？

答案是肯定的，這要歸功於 Slidev，一個讓您使用 Markdown 和 Vue.js 編寫投影片的簡報框架。Slidev 基於程式碼化簡報的理念，這意味著您可以使用您最喜歡的程式碼編輯器、版本控制系統和開發工具來建立和分享您的投影片。

在這篇部落格文章中，我將向您介紹 Slidev，並展示它與 PowerPoint 等傳統簡報工具的比較。我還將探討使用大型語言模型 (LLM) AI 生成簡報程式碼的可能性。

{% mermaid %}
graph LR
    A["傳統工具"] --> B["PowerPoint/Keynote"]
    C["程式碼化簡報"] --> D["Markdown + Slidev"]
    B --> E["視覺編輯器"]
    D --> F["程式碼編輯器 + Git"]
{% endmermaid %}

## 什麼是程式碼化簡報？

程式碼化簡報是一種使用程式碼而非圖形使用者介面來建立簡報的方式。與傳統簡報工具相比，它有幾個優點，例如：

- 您可以使用您偏好的程式碼編輯器和語法突顯
- 您可以利用程式語言和框架的強大功能和靈活性
- 您可以重複使用和模組化您的投影片和元件
- 您可以使用 Git 或其他工具協作和版本控制您的投影片
- 您可以自動化和自訂您的簡報工作流程
- 您可以將您的投影片與外部資料來源和 API 整合

當然，程式碼化簡報也有一些缺點，例如：

- 您需要學習新的語法或框架
- 您可能會失去一些視覺回饋和互動性
- 您可能對投影片的版面配置和設計控制較少
- 您可能會面臨不同瀏覽器和裝置的相容性問題
- 新增動畫可能具有挑戰性

程式碼化簡報的好處之一是您可以使用任何您喜歡的程式語言或框架。例如，您可以使用 HTML、CSS 和 JavaScript 來建立基於網頁的投影片，或者您可以使用 LaTeX 來建立 PDF 投影片。

然而，如果您正在尋找專為程式碼化簡報設計的特定框架，您可能想查看 Slidev (https://github.com/slidevjs/slidev)。

!!!tip "💡 快速開始"
    想試試 Slidev 嗎？只需執行 `npm init slidev` 即可建立您的第一個簡報！

另一個替代方案是在 PowerPoint 中使用 VBA 來建立投影片。然而，與 Markdown 相比，VBA 的可讀性較低。由於本文專注於程式碼化簡報，我將專注於 Slidev。

## Slidev 與 LLM

用於簡報的 Slidev Markdown 通常比 HTML/CSS/JavaScript 更簡潔。Markdown 更具可讀性，而 ChatGPT 等 LLM 可以透過提示生成 Markdown，例如：「使用 Slidev 為小學生生成一個關於太陽系的簡報。使用淡出作為轉場。」

結果是一個包含多張投影片的簡潔 Slidev Markdown 簡報：
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

與其他圖像生成 AI 一樣，LLM AI 缺乏人類視角。文字溢位很常見，因為 AI 模型通常被調整為冗長。

!!!warning "⚠️ 學習曲線"
    雖然 Markdown 比 HTML/CSS 簡單，但您仍然需要學習 Slidev 特定的語法和 Vue.js 以獲得進階功能。

### 那圖片呢？

僅使用 LLM 新增圖片非常耗費人力。您必須搜尋合適的圖片、下載它們，並使用檔案名稱和位置更新提示。即使如此，結果也可能無法預測。

### 那圖表呢？

您可以使用 Mermaid 建立圖表，但已知的 LLM 並未針對此任務進行最佳化，通常需要手動介入。

### 那動畫呢？

在 Slidev 中新增動畫可能具有挑戰性，因為它需要了解 CSS 或 JavaScript 動畫等網頁技術，這對所有使用者來說可能並不直觀。

## 結論

Slidev 是一個創新的工具，可以使用程式碼建立簡報，但它也有自己的一系列挑戰。即使有大型語言模型的協助，使用者在編寫投影片的版面配置、設計和動畫時仍然經常面臨困難。調整元素以調整大小並適合最佳的人類可讀性可能特別令人沮喪且耗時。此外，新增動畫以使簡報更具吸引力仍然是一項複雜的任務。儘管有這些障礙，Slidev 仍提供了顯著的好處，包括靈活性、互動性以及與其他網頁技術的相容性。對於那些尋求透過程式碼呈現想法的新穎方式的人來說，Slidev 絕對值得探索。
