---
title: Mark Six master on Linux/Mac
tags:
  - Python
  - ShellScript
  - AI
id: 7307
categories:
  - Development
date: 2017-07-18
updated: 2024-2-6
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
excerpt: "From command-line one-liners to AI-generated Python scripts, explore multiple ways to generate Hong Kong Mark Six lottery numbers on Linux/Mac. See how AI writes better code!"
comments: true
---

![A Mark six ticket](Mark_six_ticket_front.jpg)

Mark Six is a lottery in Hong Kong. You can select 6 numbers from a pool of 49 numbers on the lottery ticket. There are numerous single-line commands that can be used to generate 6 numbers randomly from 1 to 49.

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

~~jot on Mac~~ macOS 10.13 High Sierra no longer provides jot
{% codeblock lang:bash %}
jot -r -s ' ' 6 1 49 | tr ' ' '\n'
{% endcodeblock %}

However, you will soon find repeated numbers are generated from the above solutions. The trick to have non-repeated generated numbers is using random sort from an array with 49 numbers,

python 2
{% codeblock lang:python %}
python -c 'import random; a = range(1, 49); random.shuffle(a); print a[:6:]'
{% endcodeblock %}

~~jot on Mac~~ macOS 10.13 High Sierra no longer provides jot
{% codeblock lang:bash %}
jot 49 1 49 | gsort --random-sort | head -n 6
{% endcodeblock %}

## Using AI to write python script

Using AI to generate Python scripts is extremely straightforward. Let's write a prompt and compare it with what we wrote in 2017. The prompt is: `Write a Python script that pick six random unique numbers from 1 to 49, inclusive. Write it simple and testable.`
{% codeblock lang:python %}
import random

def get_random_numbers():
    return random.sample(range(1, 50), 6)

print(get_random_numbers())
{% endcodeblock %}

The result is great! We can add AI to unit test as well.

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

The unit test is better than many developers!
