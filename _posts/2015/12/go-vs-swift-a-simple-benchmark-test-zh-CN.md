---
title: 'C、Go、Java、Javascript、PHP、Python 和 Swift 的趣味基准测试'
tags:
  - Swift
  - Apple
  - nodejs
categories:
  - Development
date: 2015-12-14
thumbnail: /assets/coding/swift.png
lang: zh-CN
excerpt: "Java 竟然赢了？7 种语言气泡排序性能对决，结果出人意料"
---

## 故事从 Swift 和 Go 开始

我更喜欢 Apple 的 Swift 语言的美感，胜过 Google 的 Go。好吧，这是主观的。[Apple 已将 Swift 开源](https://github.com/apple/swift)，我决定运行一个简单的基准测试，以客观地了解哪种语言在速度方面更好。

Swift 在 5.85 秒内完成，但 Go 只需要 0.74 秒。

## 其他语言

好吧，我很好奇其他语言的性能。每种语言的测试运行 3 次，并舍弃第一次运行的时间。结果是第二次和最后一次运行的平均值。这已经足够了，因为这个测试只是为了好玩。

_警告：所有编译器/解释器都没有使用优化标志。一旦你应用这些标志，你会体验到巨大的差异。我不会深入探讨这个主题。_

Java 是赢家！至少对于不知道如何设置优化标志的傻瓜来说是这样。

## 结果

_警告：所有编译器/解释器都没有使用优化标志。一旦你应用这些标志，你会体验到巨大的差异。我不会深入探讨这个主题。_

{% echarts %}
{
  title: {
    text: '不同语言冒泡排序的时间（毫秒）',
    subtext: '越低越好',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  xAxis: {
    type: 'category',
    data: ['Swift', 'Go', 'C (gcc)', 'C (clang)'],
    axisLabel: {
      rotate: 30
    }
  },
  yAxis: {
    type: 'value',
    name: '时间（毫秒）',
    min: 0
  },
  series: [
    {
      name: '冒泡排序时间',
      type: 'bar',
      data: [5850, 740, 218, 193],
      itemStyle: {
        color: function(params) {
          const colors = ['#c23531', '#2f4554', '#61a0a8', '#91c7ae'];
          return colors[params.dataIndex];
        }
      },
      label: {
        show: true,
        position: 'top'
      }
    }
  ]
};
{% endecharts %}

GitHub 上的源代码 [https://github.com/neoalienson/c_java_javascript_go_php_python_swift](https://github.com/neoalienson/c_java_javascript_go_php_python_swift)

{% githubCard user:neoalienson repo:c_java_javascript_go_php_python_swift %}
