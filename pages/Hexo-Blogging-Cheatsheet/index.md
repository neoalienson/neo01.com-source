---
title: Hexo Blogging Cheatsheet
date: 2022-12-08 09:56:37
comments: false
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
---

This page also used for testing components used in the posts and pages.

## Useful links

* [Hexo Docs](https://hexo.io/docs)
* [List of XML and HTML character entity references on Wikipedia](https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references)

## My blog's information

* [Check if my domain is blocked in mainland](http://www.viewdns.info/chinesefirewall/?domain=neo01.com)

## Design

* [Font Awesome](http://fontawesome.io/icons/#brand)

## Frequently used Emoji
|                         |                                |        |
| ----------------------- | ------------------------------ | ------ |
| :D ````:D````(shortcut)|||
| :smile: ````:smile:```` | :blush: ````:blush:```` | :heart_eyes: ````:heart_eyes:```` |
| :sweat: ````:sweat:```` | :thumbsup: ````:thumbsup:```` | :yum: ````:yum:```` |
| :cold_sweat: ````:cold_sweat:```` | :scream: ````:scream:```` | :sob: ````:sob:```` |
| :stuck_out_tongue_winking_eye: ````:stuck_out_tongue_winking_eye:```` | :kissing: ````:kissing:```` | :sleepy: ````:sleepy:```` |
| :poop: ````:poop:````   | :v: ````:v:```` | :100: ````:100:```` |
| :see_no_evil: ````:see_no_evil:```` | :hear_no_evil: ````:hear_no_evil:```` | :speak_no_evil: ````:speak_no_evil:```` |
| :kiss: ````:kiss:````   | :skull: ````:skull:```` | :droplet: ````:droplet:```` |
| :fireworks: ````:fireworks:```` | :loudspeaker: ````:loudspeaker:```` | :warning: ````:warning:```` |
| :no_entry_sign: ````:no_entry_sign:```` | :white_check_mark: ````:white_check_mark:```` | :x: ````:x:```` |
| :secret: ````:secret:```` | :interrobang: ````:interrobang:```` | :bangbang: ````:bangbang:```` |

and more from [Emoji Cheatsheet](https://www.webpagefx.com/tools/emoji-cheat-sheet/)

## CSS
### Keys
* <kbd>Control</kbd> &lt;kbd&gt;Contro&lt;/kbd&gt;
* <kbd>Shift &#x21E7;</kbd> &lt;kbd&gt;Shift &amp;#x21E7;&lt;/kbd&gt; - use Unicode characters

## Markdown (with plugins)
* `++Inserted++` ++Inserted++
* Footnote ```[^1]``` for the mark[^1], ```[^1]:``` for the note
* Use {% raw %}{% raw %}{% endraw %}{% endraw %} if the markdown cause you trouble on {% raw %}{{}} or {%%}{% endraw %}
* Youtube Video {% raw %}{% youtube [youtube id] %}{% endraw %}

[^1]: Footnote sample

| Action | Markdown | Sample |
| ------ | -------- | ------ |
| sub | `H~2~0` | H~2~0 |
| sup | `x^2^` | x^2^ |
| Bold | `**bold**` | **bold** |
| Italic | `*italic*` | *italic* |
| Bold and Italic | `***bold and italic***` | ***bold and italic*** |
| Marked | `==marked==` | ==marked== |
| Strikethrough | `~~strikethrough~~` | ~~strikethrough~~ |
| Inline code | `` `inline code` `` | `inline code` |
| Link | `[link text](https://neo01.com)` | [link text](https://neo01.com) |
| Image | `![alt text](https://neo01.com/image.jpg)` |  |

Attributes with style class, eg:

```
# header {.style-me}
paragraph {data-toggle=modal}
paragraph *style me*{.red} more text
```

output
```
<h1 class="style-me">header</h1>
<p data-toggle="modal">paragraph</p>
<p>paragraph <em class="red">style me</em> more text</p>
```

### Table Column Alignment
Code:
{% codeblock %}
{% raw %}| Default | Left | Center | Right |
| --- | :-- | :-: | --: |
| 1 | 1 | 1 | 1 |
| 22 | 22 | 22 | 22 |
| 333 | 333 | 333 | 333 |{% endraw %}
{% endcodeblock %}

Result:
| Default | Left | Center | Right |
| --- | :-- | :-: | --: |
| 1 | 1 | 1 | 1 |
| 22 | 22 | 22 | 22 |
| 333 | 333 | 333 | 333 |

### Blockquote
Code:
{% codeblock %}
{% raw %}> Some quote text{% endraw %}
{% endcodeblock %}

Result:
> Some quote text

### Ordered list 
Code:
{% codeblock %}
{% raw %}1. item 1
2. item 2{% endraw %}
{% endcodeblock %}

Result:
1. item 1
2. item 2

### Unordered list 
Code:
{% codeblock %}
{% raw %}- item 1
- item 2{% endraw %}
{% endcodeblock %}

Result:
- item 1
- item 2

### Horizontal rule
Code:
`---`

Result:

---

### Code block

Result:
~~~
Code block 
~~~

Code:
{% codeblock %}
{% raw %}~~~
Code block 
~~~{% endraw %}
{% endcodeblock %}

## Github Card

**User**

Code:
{% codeblock %}
{% raw %}{% githubCard user:neoalienson %}{% endraw %}
{% endcodeblock %}

{% githubCard user:neoalienson %}

**A repository**

Code:
{% codeblock %}
{% raw %}{% githubCard user:neoalienson repo:pachinko %}{% endraw %}
{% endcodeblock %}

Result:
{% githubCard user:neoalienson repo:pachinko %}

## Mermaid JS

### Tag Syntax (Original)

Prerendered.

Code:
{% codeblock %}
{% raw %}```mermaid
block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
```{% endraw %}
{% endcodeblock %}

Result:
```mermaid
block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
```

Live rendering

<pre class="mermaid">
block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
</pre>

### Markdown Syntax (New)

Live rendering using standard markdown code fence.

Code:

Result:
```mermaid
block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
```

## Barchart

Result:
{% echarts %}
{
  "title": {
    "text": "Ephemeral Port Ranges by Operating System"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Linux (Old)", "Linux (New)", "Windows", "FreeBSD", "macOS"]
  },
  "yAxis": {
    "type": "value",
    "name": "Number of Ports"
  },
  "series": [{
    "type": "bar",
    "data": [28233, 28232, 16384, 55536, 16384],
    "itemStyle": {
      "color": "#1976d2"
    }
  }]
}
{% endecharts %}

Code:
{% codeblock %}
{% raw %}{% echarts %}
{
  "title": {
    "text": "Ephemeral Port Ranges by Operating System"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Linux (Old)", "Linux (New)", "Windows", "FreeBSD", "macOS"]
  },
  "yAxis": {
    "type": "value",
    "name": "Number of Ports"
  },
  "series": [{
    "type": "bar",
    "data": [28233, 28232, 16384, 55536, 16384],
    "itemStyle": {
      "color": "#1976d2"
    }
  }]
}
{% endecharts %}{% endraw %}
{% endcodeblock %}
