---
title: Linux/Mac 上的六合彩大師
tags:
  - Python
  - ShellScript
  - AI
id: 7307
categories:
  - Development
date: 2017-07-18
updated: 2024-2-6
lang: zh-TW
excerpt: "從命令列單行程式碼到 AI 生成的 Python 腳本，探索在 Linux/Mac 上生成六合彩號碼的多種方法。"
comments: true
---

![六合彩彩票](/2017/07/Mark-six-master-on-linuxmac/Mark_six_ticket_front.jpg)

六合彩是香港的彩票。您可以在彩票上從 49 個號碼池中選擇 6 個號碼。有許多單行命令可用於從 1 到 49 隨機生成 6 個號碼。

python 2
{% codeblock lang:python %}
python -c 'import random; print [ random.randint(1,49) for _ in xrange(6)]'
{% endcodeblock %}

awk
{% codeblock lang:bash %}
awk -v min=1 -v max=49 'BEGIN{ srand(); for (i = 0; i < 6; i++)  print int(min+rand()*(max-min+1))}'
{% endcodeblock %}

bash
{% codeblock lang:bash %}
for i in {1..6}; do echo $(( ( RANDOM % 49 ) + 1)); done
{% endcodeblock %}

~~Mac 上的 jot~~ macOS 10.13 High Sierra 不再提供 jot
{% codeblock lang:bash %}
jot -r -s ' ' 6 1 49 | tr ' ' '\n'
{% endcodeblock %}

然而，您很快就會發現上述解決方案會生成重複的號碼。獲得不重複生成號碼的技巧是使用包含 49 個號碼的陣列進行隨機排序，

python 2
{% codeblock lang:python %}
python -c 'import random; a = range(1, 49); random.shuffle(a); print a[:6:]'
{% endcodeblock %}

~~Mac 上的 jot~~ macOS 10.13 High Sierra 不再提供 jot
{% codeblock lang:bash %}
jot 49 1 49 | gsort --random-sort | head -n 6
{% endcodeblock %}

## 使用 AI 編寫 python 腳本

使用 AI 生成 Python 腳本非常簡單。讓我們編寫一個提示並將其與我們在 2017 年編寫的內容進行比較。提示是：`Write a Python script that pick six random unique numbers from 1 to 49, inclusive. Write it simple and testable.`
{% codeblock lang:python %}
import random

def get_random_numbers():
    return random.sample(range(1, 50), 6)

print(get_random_numbers())
{% endcodeblock %}

結果很棒！我們也可以將 AI 加入單元測試。

{% codeblock lang:python %}
import unittest
from your_script import get_random_numbers

class TestGetRandomNumbers(unittest.TestCase):
    def test_length(self):
        self.assertEqual(len(get_random_numbers()), 6)

    def test_values(self):
        numbers = get_random_numbers()
        self.assertTrue(all(1 <= x <= 49 for x in numbers))

    def test_uniqueness(self):
        numbers = get_random_numbers()
        self.assertTrue(len(set(numbers)) == len(numbers))

if __name__ == '__main__':
    unittest.main()
{% endcodeblock %}

單元測試比許多開發者都好！
