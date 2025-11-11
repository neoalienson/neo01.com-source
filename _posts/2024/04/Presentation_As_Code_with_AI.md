---
title: Presentation as Code with AI
date: 2024-04-01
tags:
  - AI
  - Presentation as Code
  - Slidev
categories:
  - Development
spell_checked: 2025-01-01
grammar_checked: 2025-01-01
thumbnail_80: thumbnail_80.jpeg
thumbnail: thumbnail.jpeg
excerpt: Explore Slidev and LLMs for presentation-as-code, but layout adjustments and animations remain challenging even with AI assistance.
---

![](index.jpeg)

Are you familiar with the concept of "everything as code"? It refers to using code to define, manage, and automate various system components, including infrastructure, diagrams, policies, and beyond. But what about presentations? Is it possible to use code to craft stunning and interactive slides?

The answer is yes, thanks to Slidev, a presentation framework that lets you write slides using Markdown and Vue.js. Slidev is based on the idea of presentation as code, which means that you can use your favorite code editor, version control system, and development tools to create and share your slides.

In this blog post, I will introduce you to Slidev and show you how it compares to traditional presentation tools like PowerPoint. I will also explore the possibility of generating presentation code with large language model (LLM) AI.

{% mermaid %}
graph LR
    A["Traditional Tools"] --> B["PowerPoint/Keynote"]
    C["Presentation as Code"] --> D["Markdown + Slidev"]
    B --> E["Visual Editor"]
    D --> F["Code Editor + Git"]
{% endmermaid %}

## What is Presentation as Code?

Presentation as code is a way of creating presentations using code instead of graphical user interfaces. It has several advantages over traditional presentation tools, such as:

- You can use your preferred code editor and syntax highlighting
- You can leverage the power and flexibility of programming languages and frameworks
- You can reuse and modularize your slides and components
- You can collaborate and version control your slides using Git or other tools
- You can automate and customize your presentation workflow
- You can integrate your slides with external data sources and APIs

Of course, presentation as code also has some drawbacks, such as:

- You need to learn a new syntax or framework
- You may lose some visual feedback and interactivity
- You may have less control over the layout and design of your slides
- You may face compatibility issues with different browsers and devices.
- Adding animations can be challenging.

One of the benefits of presentation as code is that you can use any programming language or framework that you like. For example, you can use HTML, CSS, and JavaScript to create web-based slides, or you can use LaTeX to create PDF slides.

However, if you are looking for a specific framework that is designed for presentation as code, you may want to check out Slidev (https://github.com/slidevjs/slidev).

!!!tip "💡 Quick Start"
    Want to try Slidev? Simply run `npm init slidev` to create your first presentation!

Another alternative is using VBA in PowerPoint to create slides. However, VBA is less human-readable compared to Markdown. As this post focuses on presentation as code, I will concentrate on Slidev.

## Slidev with LLM

Slidev Markdown for presentations is often cleaner than HTML/CSS/JavaScript. Markdown is more human-readable, and LLMs such as ChatGPT can generate Markdown with prompts, for example: "Use Slidev to generate a presentation about the solar system for primary school students. Use fade-out for transitions."

The result is a clean Slidev Markdown presentation with multiple slides:
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
|----------|----------------------------------------------------|
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

Like other image generation AIs, LLM AI lacks a human perspective. Text overflow is common because AI models are often tuned to be verbose.

!!!warning "⚠️ Learning Curve"
    While Markdown is simpler than HTML/CSS, you'll still need to learn Slidev-specific syntax and Vue.js for advanced features.

### What about images?

Adding images with LLM alone is very labor-intensive. You must search for suitable images, download them, and update the prompt with the filename and placement. Even then, the results can be unpredictable.

### What about charts?

You can create charts with Mermaid, but known LLMs are not optimized for this task, often requiring manual intervention.

### What about animation?

Adding animations in Slidev can be challenging as it requires understanding of web technologies like CSS or JavaScript animations, which may not be straightforward for all users.

## Conclusion

Slidev is an innovative tool for creating presentations with code, but it comes with its own set of challenges. Even with the assistance of large language models, users often face difficulties in coding the layout, design, and animations of slides. Adjusting elements to resize and fit for optimal human readability can be particularly frustrating and time-consuming. Moreover, adding animations to make presentations more engaging remains a complex task. Despite these hurdles, Slidev offers significant benefits, including flexibility, interactivity, and compatibility with other web technologies. For those seeking a novel way to present ideas through code, Slidev is definitely worth exploring.
