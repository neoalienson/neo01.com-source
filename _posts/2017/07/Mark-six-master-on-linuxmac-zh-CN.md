---
title: Linux/Mac 上的六合彩大师
tags:
  - Python
  - ShellScript
  - AI
id: 7307
categories:
  - Development
date: 2017-07-18
updated: 2024-2-6
lang: zh-CN
excerpt: "从命令行单行代码到 AI 生成的 Python 脚本，探索在 Linux/Mac 上生成六合彩号码的多种方法。"
comments: true
---

![六合彩彩票](/2017/07/Mark-six-master-on-linuxmac/Mark_six_ticket_front.jpg)

六合彩是香港的彩票。您可以在彩票上从 49 个号码池中选择 6 个号码。有许多单行命令可用于从 1 到 49 随机生成 6 个号码。

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

然而，您很快就会发现上述解决方案会生成重复的号码。获得不重复生成号码的技巧是使用包含 49 个号码的数组进行随机排序，

python 2
{% codeblock lang:python %}
python -c 'import random; a = range(1, 49); random.shuffle(a); print a[:6:]'
{% endcodeblock %}

~~Mac 上的 jot~~ macOS 10.13 High Sierra 不再提供 jot
{% codeblock lang:bash %}
jot 49 1 49 | gsort --random-sort | head -n 6
{% endcodeblock %}

## 使用 AI 编写 python 脚本

使用 AI 生成 Python 脚本非常简单。让我们编写一个提示并将其与我们在 2017 年编写的内容进行比较。提示是：`Write a Python script that pick six random unique numbers from 1 to 49, inclusive. Write it simple and testable.`
{% codeblock lang:python %}
import random

def get_random_numbers():
    return random.sample(range(1, 50), 6)

print(get_random_numbers())
{% endcodeblock %}

结果很棒！我们也可以将 AI 加入单元测试。

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

单元测试比许多开发者都好！
