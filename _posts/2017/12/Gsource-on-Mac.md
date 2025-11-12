---
title: Gsource on Mac
date: 2017-12-08
tags:
  - Visualization
  - Mac
category:
  - Development
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: "Visualize your Git repository history with stunning 3D animations using Gource on Mac. Show non-technical folks how hard developers work with mesmerizing code evolution videos."
---

It is often difficult to tell how hard developers are working to non-IT folks. Usually, I try to let them watch [Gource](http://gource.io/).

![gsource sample](gsource.jpeg)

Setting up Gource on Mac is not difficult, but it has several steps. First, you have to have Brew installed. Then, run the commands below from Terminal,

{% codeblock lang:shell %}
# install wget if you don't have
brew install wget

# gsource dependency
brew install glew
brew install pkg-config
brew install sdl2
brew install sdl2_image
brew install boost
brew install glm
brew install pcre

# download and build Gource
wget https://github.com/acaudwell/Gource/releases/download/gource-0.47/gource-0.47.tar.gz
tar vfxz gource-0.47.tar.gz
cd gource-0.47
./configure

# assume no error from configure
make install
{% endcodeblock %}

The binary will install into /usr/local/bin/gource. Run the command below to generate the video from a directory with a Git repository
{% codeblock lang:shell %}
cd [your git repository]
/usr/local/bin/gource
{% endcodeblock %}

You can replace the default icon with yours by renaming your avatar to the Git author name such as "Your Name.png" as in the Git log, place it in the local directory, and run the Gource command below
{% codeblock lang:shell %}
/usr/local/bin/gource --user-image-dir .
{% endcodeblock %}

If you feel the video is too long, you can adjust the speed by changing the simulation time scale (default: 1.0) with `-c`, `--time-scale`, or `SCALE`.

You can make your video less messy by reducing the maximum number of files from unlimited to a value such as 100 with `--max-files NUMBER`

Adding elasticity is fun with `-e 0.5` when a large number of files are being added or deleted.

More information can be found in [Controls](https://github.com/acaudwell/Gource/wiki/Controls)

The video can be output to a file with the option `-o FILENAME`. The file size can be over 10GB for a 1-minute video, so beware.

After the video is generated, you can use libav to convert it to MP4,
{% codeblock lang:shell %}
brew install libav
avconv -vcodec ppm -f image2pipe -i gource.ppm -c:v libx265 -c:a copy gource.mkv
{% endcodeblock %}
Gource of my blog:
{% youtube iZiZ4CaDkcM %}
