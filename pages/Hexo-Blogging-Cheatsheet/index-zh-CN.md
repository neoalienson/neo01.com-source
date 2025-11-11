---
title: Hexo 博客速查表
date: 2022-12-08 09:56:37
comments: false
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
lang: zh-CN
---

此页面也用于测试文章和页面中使用的组件。

## 实用链接

* [Hexo 文档](https://hexo.io/docs)
* [维基百科上的 XML 和 HTML 字符实体参考列表](https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references)

## 我的博客信息

* [检查我的域名是否在中国大陆被封锁](http://www.viewdns.info/chinesefirewall/?domain=neo01.com)

## 设计

* [Font Awesome](http://fontawesome.io/icons/#brand)

## 常用表情符号
|                         |                                |        |
| ----------------------- | ------------------------------ | ------ |
| :D ````:D````(快捷键)||
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

更多请参考 [Emoji Cheatsheet](https://www.webpagefx.com/tools/emoji-cheat-sheet/)

## CSS
### 按键
* <kbd>Control</kbd> &lt;kbd&gt;Contro&lt;/kbd&gt;
* <kbd>Shift &#x21E7;</kbd> &lt;kbd&gt;Shift &amp;#x21E7;&lt;/kbd&gt; - 使用 Unicode 字符

## Markdown（含插件）
* `++Inserted++` ++Inserted++
* 脚注 ```[^1]``` 用于标记[^1]，```[^1]:``` 用于注释
* 如果 markdown 在 {% raw %}{{}} 或 {%%}{% endraw %} 上造成问题，请使用 {% raw %}{% raw %}{% endraw %}{% endraw %}
* Youtube 视频 {% raw %}{% youtube [youtube id] %}{% endraw %}

[^1]: 脚注示例

| 操作 | Markdown | 示例 |
| ------ | -------- | ------ |
| 下标 | `H~2~0` | H~2~0 |
| 上标 | `x^2^` | x^2^ |
| 粗体 | `**bold**` | **bold** |
| 斜体 | `*italic*` | *italic* |
| 粗体和斜体 | `***bold and italic***` | ***bold and italic*** |
| 标记 | `==marked==` | ==marked== |
| 删除线 | `~~strikethrough~~` | ~~strikethrough~~ |
| 行内代码 | `` `inline code` `` | `inline code` |
| 链接 | `[link text](https://neo01.com)` | [link text](https://neo01.com) |
| 图片 | `![alt text](https://neo01.com/image.jpg)` |  |

使用样式类的属性，例如：

```
# header {.style-me}
paragraph {data-toggle=modal}
paragraph *style me*{.red} more text
```

输出
```
<h1 class="style-me">header</h1>
<p data-toggle="modal">paragraph</p>
<p>paragraph <em class="red">style me</em> more text</p>
```

### 表格列对齐
代码：
{% codeblock %}
{% raw %}| 默认 | 左对齐 | 居中 | 右对齐 |
| --- | :-- | :-: | --: |
| 1 | 1 | 1 | 1 |
| 22 | 22 | 22 | 22 |
| 333 | 333 | 333 | 333 |{% endraw %}
{% endcodeblock %}

结果：
| 默认 | 左对齐 | 居中 | 右对齐 |
| --- | :-- | :-: | --: |
| 1 | 1 | 1 | 1 |
| 22 | 22 | 22 | 22 |
| 333 | 333 | 333 | 333 |

### 引用块
代码：
{% codeblock %}
{% raw %}> 一些引用文字{% endraw %}
{% endcodeblock %}

结果：
> 一些引用文字

### 有序列表
代码：
{% codeblock %}
{% raw %}1. 项目 1
2. 项目 2{% endraw %}
{% endcodeblock %}

结果：
1. 项目 1
2. 项目 2

### 无序列表
代码：
{% codeblock %}
{% raw %}- 项目 1
- 项目 2{% endraw %}
{% endcodeblock %}

结果：
- 项目 1
- 项目 2

### 水平线
代码：
`---`

结果：

---

### 代码块

结果：
~~~
代码块
~~~

代码：
{% codeblock %}
{% raw %}~~~
代码块
~~~{% endraw %}
{% endcodeblock %}

## Github 卡片

**用户**

代码：
{% codeblock %}
{% raw %}{% githubCard user:neoalienson %}{% endraw %}
{% endcodeblock %}

{% githubCard user:neoalienson %}

**仓库**

代码：
{% codeblock %}
{% raw %}{% githubCard user:neoalienson repo:pachinko %}{% endraw %}
{% endcodeblock %}

结果：
{% githubCard user:neoalienson repo:pachinko %}

## Mermaid JS

预渲染。

代码：
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

结果：
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

实时渲染

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

## 柱状图

结果：
{% echarts %}
{
  "title": {
    "text": "各操作系统的临时端口范围"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Linux (旧)", "Linux (新)", "Windows", "FreeBSD", "macOS"]
  },
  "yAxis": {
    "type": "value",
    "name": "端口数量"
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

代码：
{% codeblock %}
{% raw %}{% echarts %}
{
  "title": {
    "text": "各操作系统的临时端口范围"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Linux (旧)", "Linux (新)", "Windows", "FreeBSD", "macOS"]
  },
  "yAxis": {
    "type": "value",
    "name": "端口数量"
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
