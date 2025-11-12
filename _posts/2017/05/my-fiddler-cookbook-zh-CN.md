---
title: 我的 Fiddler 食谱
id: 7270
categories:
  - Development
date: 2017-05-20
tags:
thumbnail: fiddler.jpg
lang: zh-CN
excerpt: "掌握 Fiddler 的必备技巧：HTTPS 解密、简单负载测试和请求修改。Windows 上最强大的调试代理工具！"
comments: true
---

Fiddler 是我在 Windows 上最喜欢的调试代理。通常，我使用 Python 编写简单的调试代理，通常少于 30 行，直到它需要 https。

# 启用 https 解密

这就是为什么我在 Fiddler 上的第一个配置是解密 HTTPS 流量，

![](/2017/05/my-fiddler-cookbook/fiddler-2.png)

勾选 Decrypt HTTPS traffic 并点击 OK。
![](/2017/05/my-fiddler-cookbook/fiddler-3.png)

然后它会要求安装信任根证书，
![](/2017/05/my-fiddler-cookbook/fiddler-4a.png)
![](/2017/05/my-fiddler-cookbook/fiddler-4b.png)

可怕的文字是关于 https 流量被 Fiddler 看到的警告。Fiddler 的根证书现在受信任，这意味着 Fiddler 可以生成您的应用程序（包括您的浏览器）信任的证书。

如果它没有提示您安装证书，您可以使用以下方式安装证书，
![](/2017/05/my-fiddler-cookbook/fiddler-5.png)

# 简单的负载测试

您可以通过选择多个请求，然后按 R 来运行非常简单的负载测试。请注意，来自服务器的响应可能会在基础设施的不同层级中缓存。
![](/2017/05/my-fiddler-cookbook/fiddler-6.png)

您可以从时间轴看到服务器的性能如何。
![](/2017/05/my-fiddler-cookbook/fiddler-7.png)

有时您甚至可以通过检查时间轴来查看 Windows 上的传出连接数量限制。

# 修改您的请求

您也可以在发送请求之前修改它，
![](/2017/05/my-fiddler-cookbook/fiddler-8.png)
