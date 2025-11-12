---
title: Linux/MacでのMark Sixマスター
tags:
  - Python
  - ShellScript
  - AI
id: 7307
categories:
  - Development
date: 2017-07-18
updated: 2024-2-6
lang: ja
excerpt: コマンドラインのワンライナーからAI生成のPythonスクリプトまで、Linux/Macで香港のMark Six宝くじ番号を生成する複数の方法を探ります。AIがより良いコードを書く様子をご覧ください！
comments: true
---

![Mark sixチケット](/2017/07/Mark-six-master-on-linuxmac/Mark_six_ticket_front.jpg)

Mark Sixは香港の宝くじです。宝くじチケットで49個の数字のプールから6個の数字を選択できます。1から49までの6個の数字をランダムに生成するために使用できる多数の単一行コマンドがあります。

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

~~Macのjot~~ macOS 10.13 High Sierraはjotを提供しなくなりました
{% codeblock lang:bash %}
jot -r -s ' ' 6 1 49 | tr ' ' '\n'
{% endcodeblock %}

しかし、上記のソリューションから重複した数字が生成されることにすぐに気付くでしょう。重複しない生成された数字を持つトリックは、49個の数字を持つ配列からランダムソートを使用することです。

python 2
{% codeblock lang:python %}
python -c 'import random; a = range(1, 49); random.shuffle(a); print a[:6:]'
{% endcodeblock %}

~~Macのjot~~ macOS 10.13 High Sierraはjotを提供しなくなりました
{% codeblock lang:bash %}
jot 49 1 49 | gsort --random-sort | head -n 6
{% endcodeblock %}

## AIを使用してPythonスクリプトを書く

AIを使用してPythonスクリプトを生成することは非常に簡単です。プロンプトを書いて、2017年に書いたものと比較してみましょう。プロンプトは：`1から49までの範囲から6つのランダムな一意の数字を選ぶPythonスクリプトを書いてください。シンプルでテスト可能に書いてください。`
{% codeblock lang:python %}
import random

def get_random_numbers():
    return random.sample(range(1, 50), 6)

print(get_random_numbers())
{% endcodeblock %}

結果は素晴らしいです！AIをユニットテストにも追加できます。

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

ユニットテストは多くの開発者よりも優れています！
