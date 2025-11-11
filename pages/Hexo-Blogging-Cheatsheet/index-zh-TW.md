---
title: Hexo 部落格速查表
date: 2022-12-08 09:56:37
comments: false
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
lang: zh-TW
---

此頁面也用於測試文章和頁面中使用的元件。

## 實用連結

* [Hexo 文件](https://hexo.io/docs)
* [維基百科上的 XML 和 HTML 字元實體參考列表](https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references)

## 我的部落格資訊

* [檢查我的網域是否在中國大陸被封鎖](http://www.viewdns.info/chinesefirewall/?domain=neo01.com)

## 設計

* [Font Awesome](http://fontawesome.io/icons/#brand)

## 常用表情符號
|                         |                                |        |
| ----------------------- | ------------------------------ | ------ |
| :D ````:D````(快捷鍵)||
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

更多請參考 [Emoji Cheatsheet](https://www.webpagefx.com/tools/emoji-cheat-sheet/)

## CSS
### 按鍵
* <kbd>Control</kbd> &lt;kbd&gt;Contro&lt;/kbd&gt;
* <kbd>Shift &#x21E7;</kbd> &lt;kbd&gt;Shift &amp;#x21E7;&lt;/kbd&gt; - 使用 Unicode 字元

## Markdown（含外掛）
* `++Inserted++` ++Inserted++
* 註腳 ```[^1]``` 用於標記[^1]，```[^1]:``` 用於註解
* 如果 markdown 在 {% raw %}{{}} 或 {%%}{% endraw %} 上造成問題，請使用 {% raw %}{% raw %}{% endraw %}{% endraw %}
* Youtube 影片 {% raw %}{% youtube [youtube id] %}{% endraw %}

[^1]: 註腳範例

| 動作 | Markdown | 範例 |
| ------ | -------- | ------ |
| 下標 | `H~2~0` | H~2~0 |
| 上標 | `x^2^` | x^2^ |
| 粗體 | `**bold**` | **bold** |
| 斜體 | `*italic*` | *italic* |
| 粗體和斜體 | `***bold and italic***` | ***bold and italic*** |
| 標記 | `==marked==` | ==marked== |
| 刪除線 | `~~strikethrough~~` | ~~strikethrough~~ |
| 行內程式碼 | `` `inline code` `` | `inline code` |
| 連結 | `[link text](https://neo01.com)` | [link text](https://neo01.com) |
| 圖片 | `![alt text](https://neo01.com/image.jpg)` |  |

使用樣式類別的屬性，例如：

```
# header {.style-me}
paragraph {data-toggle=modal}
paragraph *style me*{.red} more text
```

輸出
```
<h1 class="style-me">header</h1>
<p data-toggle="modal">paragraph</p>
<p>paragraph <em class="red">style me</em> more text</p>
```

### 表格欄位對齊
程式碼：
{% codeblock %}
{% raw %}| 預設 | 左對齊 | 置中 | 右對齊 |
| --- | :-- | :-: | --: |
| 1 | 1 | 1 | 1 |
| 22 | 22 | 22 | 22 |
| 333 | 333 | 333 | 333 |{% endraw %}
{% endcodeblock %}

結果：
| 預設 | 左對齊 | 置中 | 右對齊 |
| --- | :-- | :-: | --: |
| 1 | 1 | 1 | 1 |
| 22 | 22 | 22 | 22 |
| 333 | 333 | 333 | 333 |

### 引用區塊
程式碼：
{% codeblock %}
{% raw %}> 一些引用文字{% endraw %}
{% endcodeblock %}

結果：
> 一些引用文字

### 有序清單
程式碼：
{% codeblock %}
{% raw %}1. 項目 1
2. 項目 2{% endraw %}
{% endcodeblock %}

結果：
1. 項目 1
2. 項目 2

### 無序清單
程式碼：
{% codeblock %}
{% raw %}- 項目 1
- 項目 2{% endraw %}
{% endcodeblock %}

結果：
- 項目 1
- 項目 2

### 水平線
程式碼：
`---`

結果：

---

### 程式碼區塊

結果：
~~~
程式碼區塊
~~~

程式碼：
{% codeblock %}
{% raw %}~~~
程式碼區塊
~~~{% endraw %}
{% endcodeblock %}

## Github 卡片

**使用者**

程式碼：
{% codeblock %}
{% raw %}{% githubCard user:neoalienson %}{% endraw %}
{% endcodeblock %}

{% githubCard user:neoalienson %}

**儲存庫**

程式碼：
{% codeblock %}
{% raw %}{% githubCard user:neoalienson repo:pachinko %}{% endraw %}
{% endcodeblock %}

結果：
{% githubCard user:neoalienson repo:pachinko %}

## Mermaid JS

預先渲染。

程式碼：
{% codeblock %}
{% raw %}{% mermaid %}
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
{% endmermaid %}{% endraw %}
{% endcodeblock %}

結果：
{% mermaid %}block-beta
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
{% endmermaid %}

即時渲染

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

## 長條圖

結果：
{% echarts %}
{
  "title": {
    "text": "各作業系統的臨時埠範圍"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Linux (舊)", "Linux (新)", "Windows", "FreeBSD", "macOS"]
  },
  "yAxis": {
    "type": "value",
    "name": "埠數量"
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

程式碼：
{% codeblock %}
{% raw %}{% echarts %}
{
  "title": {
    "text": "各作業系統的臨時埠範圍"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Linux (舊)", "Linux (新)", "Windows", "FreeBSD", "macOS"]
  },
  "yAxis": {
    "type": "value",
    "name": "埠數量"
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
