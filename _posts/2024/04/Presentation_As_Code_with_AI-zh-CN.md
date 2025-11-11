---
title: 使用 AI 的代码化演示
date: 2024-04-01
tags:
  - AI
  - Presentation as Code
  - Slidev
categories:
  - Development
thumbnail_80: thumbnail_80.jpeg
thumbnail: thumbnail.jpeg
lang: zh-CN
excerpt: 探索 Slidev 和 LLM 创建代码化演示，但布局和动画调整仍是挑战。
---

![](/2024/04/Presentation_As_Code_with_AI/index.jpeg)

您熟悉"一切皆代码"的概念吗？它指的是使用代码来定义、管理和自动化各种系统组件，包括基础设施、图表、策略等等。但演示呢？是否可以使用代码来制作令人惊艳且交互式的幻灯片？

答案是肯定的，这要归功于 Slidev，一个让您使用 Markdown 和 Vue.js 编写幻灯片的演示框架。Slidev 基于代码化演示的理念，这意味着您可以使用您最喜欢的代码编辑器、版本控制系统和开发工具来创建和分享您的幻灯片。

在这篇博客文章中，我将向您介绍 Slidev，并展示它与 PowerPoint 等传统演示工具的比较。我还将探讨使用大型语言模型 (LLM) AI 生成演示代码的可能性。

{% mermaid %}
graph LR
    A["传统工具"] --> B["PowerPoint/Keynote"]
    C["代码化演示"] --> D["Markdown + Slidev"]
    B --> E["视觉编辑器"]
    D --> F["代码编辑器 + Git"]
{% endmermaid %}

## 什么是代码化演示？

代码化演示是一种使用代码而非图形用户界面来创建演示的方式。与传统演示工具相比，它有几个优点，例如：

- 您可以使用您偏好的代码编辑器和语法突显
- 您可以利用编程语言和框架的强大功能和灵活性
- 您可以重复使用和模块化您的幻灯片和组件
- 您可以使用 Git 或其他工具协作和版本控制您的幻灯片
- 您可以自动化和自定义您的演示工作流程
- 您可以将您的幻灯片与外部数据源和 API 集成

当然，代码化演示也有一些缺点，例如：

- 您需要学习新的语法或框架
- 您可能会失去一些视觉反馈和交互性
- 您可能对幻灯片的布局和设计控制较少
- 您可能会面临不同浏览器和设备的兼容性问题
- 添加动画可能具有挑战性

代码化演示的好处之一是您可以使用任何您喜欢的编程语言或框架。例如，您可以使用 HTML、CSS 和 JavaScript 来创建基于网页的幻灯片，或者您可以使用 LaTeX 来创建 PDF 幻灯片。

然而，如果您正在寻找专为代码化演示设计的特定框架，您可能想查看 Slidev (https://github.com/slidevjs/slidev)。

!!!tip "💡 快速开始"
    想试试 Slidev 吗？只需执行 `npm init slidev` 即可创建您的第一个演示！

另一个替代方案是在 PowerPoint 中使用 VBA 来创建幻灯片。然而，与 Markdown 相比，VBA 的可读性较低。由于本文专注于代码化演示，我将专注于 Slidev。

## Slidev 与 LLM

用于演示的 Slidev Markdown 通常比 HTML/CSS/JavaScript 更简洁。Markdown 更具可读性，而 ChatGPT 等 LLM 可以通过提示生成 Markdown，例如："使用 Slidev 为小学生生成一个关于太阳系的演示。使用淡出作为转场。"

结果是一个包含多张幻灯片的简洁 Slidev Markdown 演示：
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

与其他图像生成 AI 一样，LLM AI 缺乏人类视角。文本溢出很常见，因为 AI 模型通常被调整为冗长。

!!!warning "⚠️ 学习曲线"
    虽然 Markdown 比 HTML/CSS 简单，但您仍然需要学习 Slidev 特定的语法和 Vue.js 以获得高级功能。

### 那图片呢？

仅使用 LLM 添加图片非常耗费人力。您必须搜索合适的图片、下载它们，并使用文件名和位置更新提示。即使如此，结果也可能无法预测。

### 那图表呢？

您可以使用 Mermaid 创建图表，但已知的 LLM 并未针对此任务进行优化，通常需要手动干预。

### 那动画呢？

在 Slidev 中添加动画可能具有挑战性，因为它需要了解 CSS 或 JavaScript 动画等网页技术，这对所有用户来说可能并不直观。

## 结论

Slidev 是一个创新的工具，可以使用代码创建演示，但它也有自己的一系列挑战。即使有大型语言模型的协助，用户在编写幻灯片的布局、设计和动画时仍然经常面临困难。调整元素以调整大小并适合最佳的人类可读性可能特别令人沮丧且耗时。此外，添加动画以使演示更具吸引力仍然是一项复杂的任务。尽管有这些障碍，Slidev 仍提供了显著的好处，包括灵活性、交互性以及与其他网页技术的兼容性。对于那些寻求通过代码呈现想法的新颖方式的人来说，Slidev 绝对值得探索。
