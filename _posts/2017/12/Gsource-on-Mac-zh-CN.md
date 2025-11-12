---
title: Mac 上的 Gsource
date: 2017-12-08
tags:
  - Visualization
  - Mac
category:
  - Development
lang: zh-CN
excerpt: "用炫酷的 3D 动画展示你的代码历史！在 Mac 上安装 Gource，让非技术人员看到开发者的努力。"
---

向非 IT 人员说明开发者工作有多努力通常很困难。通常，我会尝试让他们观看 [Gource](http://gource.io/)。

![gsource 示例](/2017/12/Gsource-on-Mac/gsource.jpeg)

在 Mac 上设置 Gource 并不困难，但有几个步骤。首先，您必须安装 Brew。然后，从终端运行以下命令，

{% codeblock lang:shell %}
# 如果您没有 wget，请安装它
brew install wget

# gsource 依赖项
brew install glew
brew install pkg-config
brew install sdl2
brew install sdl2_image
brew install boost
brew install glm
brew install pcre

# 下载并构建 Gource
wget https://github.com/acaudwell/Gource/releases/download/gource-0.47/gource-0.47.tar.gz
tar vfxz gource-0.47.tar.gz
cd gource-0.47
./configure

# 假设 configure 没有错误
make install
{% endcodeblock %}

二进制文件将安装到 /usr/local/bin/gource。运行以下命令从具有 Git 存储库的目录生成视频
{% codeblock lang:shell %}
cd [your git repository]
/usr/local/bin/gource
{% endcodeblock %}

您可以通过将您的头像重命名为 Git 作者名称（如 Git 日志中的"Your Name.png"）来替换默认图标，将其放在本地目录中，并运行以下 Gource 命令
{% codeblock lang:shell %}
/usr/local/bin/gource --user-image-dir .
{% endcodeblock %}

如果您觉得视频太长，可以通过使用 `-c`、`--time-scale` 或 `SCALE` 更改模拟时间比例（默认值：1.0）来调整速度。

您可以通过使用 `--max-files NUMBER` 将最大文件数从无限制减少到一个值（如 100）来使您的视频不那么混乱

当添加或删除大量文件时，使用 `-e 0.5` 添加弹性很有趣。

更多信息可以在 [Controls](https://github.com/acaudwell/Gource/wiki/Controls) 中找到

视频可以使用选项 `-o FILENAME` 输出到文件。1 分钟视频的文件大小可能超过 10GB，所以请注意。

生成视频后，您可以使用 libav 将其转换为 MP4，
{% codeblock lang:shell %}
brew install libav
avconv -vcodec ppm -f image2pipe -i gource.ppm -c:v libx265 -c:a copy gource.mkv
{% endcodeblock %}
我的博客的 Gource：
{% youtube iZiZ4CaDkcM %}
