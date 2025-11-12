---
title: WD Cloud 和 Node.js 的交叉编译
tags:
  - arm
  - nodejs
  - wdcloud
categories:
  - Development
date: 2015-03-14
thumbnail: /assets/wdcloud/wdcloud.png
lang: zh-CN
excerpt: "在 Ubuntu 上为 WD Cloud ARM 设备交叉编译 Node.js 和其他包的完整指南"
---

WD Cloud 在 ARM 上运行 Debian Linux。当你为其他架构构建应用程序时，你需要使用交叉编译。我已经在 Ubuntu 14 上成功构建了一个包，方法是遵循[这篇文章](http://community.wd.com/t5/WD-My-Cloud/GUIDE-Building-packages-for-the-new-firmware-someone-tried-it/td-p/768007/page/2)，并附上一些注意事项。

如果你看到类似以下的错误消息：
{% codeblock lang:bash %}
Err http://ftp.debian.org wheezy-updates Release.gpg Could not resolve 'ftp.debian.org'
{% endcodeblock %}

那么，将 /etc/resolv.conf 复制到 build/etc，例如：
{% codeblock lang:bash %}
sudo cp /etc/resolv.conf build/etc
{% endcodeblock %}

# 使用 Wheezy 为 WD Cloud 固件版本 4 或更高版本进行交叉编译的摘要

{% codeblock lang:bash %}
# 交叉编译所需
apt-get install qemu-user-static
apt-get install binfmt-support

# 构建文件夹
mkdir wdmc-build
cd wdmc-build

# 下载位置可以在 http://support.wdc.com/product/download.asp?groupid=904&lang=en 找到
wget http://download.wdc.com/gpl/gpl-source-wd_my_cloud-04.01.03-421.zip

unzip gpl-source-wd_my_cloud-04.01.03-421.zip packages/build_tools/debian/*
mkdir 64k-wheezy
cp -R packages/build_tools/debian/* ./64k-wheezy
echo '#!/bin/bash' > 64k-wheezy/build.sh
echo './build-armhf-package.sh --pagesize=64k $1 wheezy' >> 64k-wheezy/build.sh
chmod a+x 64k-wheezy/build.sh

cd 64k-wheezy
# 设置脚本会在 chroot 期间提示输入 root 密码
./setup.sh bootstrap/wheezy-bootstrap_1.24.14_armhf.tar.gz build

sudo mv build/usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static_orig
sudo cp /usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static

# 覆盖 build/etc/apt/sources.list
sudo echo "deb http://security.debian.org/ wheezy/updates main contrib non-free" > build/etc/apt/sources.list
sudo echo "deb-src http://security.debian.org/ wheezy/updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb-src http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb-src http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
# 可选，直到你需要使用 backports 包
sudo echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list

sudo cp /etc/resolv.conf build/etc
{% endcodeblock %}

然后你可以通过使用包名称执行 build.sh 来构建，例如：
{% codeblock lang:bash %}
./build.sh joe
{% endcodeblock %}

它会从存储库下载源代码包、交叉编译它，并构建一个 deb 文件。这个过程可能需要超过 10 分钟。一旦成功，你可以将 .deb 文件 scp 到你的路由器，并使用 ```dpkg -i``` 安装它。

# 手动构建 Node.js

构建 Node.js 有点棘手，因为源代码不在存储库中。我曾尝试使用来自 http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x86.tar.gz 的二进制文件，但失败了，错误消息为：
```cannot execute binary file```
你可以按照脚本手动构建它：
{% codeblock lang:bash %}
# 设置工具
./setup.sh bootstrap/wheezy-bootstrap_1.24.14_armhf.tar.gz build
sudo mkdir -p build/root/binutils
sudo tar vfx binutils/binutils-armhf-64k.tar.gz -C build/root/binutils
sudo chroot build /bin/bash
cd /root/binutils
dpkg -i binutils_*.deb
dpkg -i binutils-multiarch_*.deb
export DEBIAN_FRONTEND=noninteractive
export DEBCONF_NONINTERACTIVE_SEEN=true
export LC_ALL=C
export LANGUAGE=C
export LANG=C
export DEB_CFLAGS_APPEND='-D_FILE_OFFSET_BITS=64 -D_LARGEFILE_SOURCE'
export DEB_BUILD_OPTIONS=nocheck
cd /root

# 现在构建环境已准备好
wget http://nodejs.org/dist/v0.12.0/node-v0.12.0.tar.gz
tar vfxz node-v0.12.0.tar.gz
cd node-v0.12.0
./configure
make

# 返回原始环境
exit
{% endcodeblock %}
二进制文件已准备好在 build/root/node-v0.12.0/node 中，供你上传到 WD Cloud。你可以上传到 WD Cloud 中的 /usr/local/bin。

你还需要从 http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x86.tar.gz 下载 npm 和其他组件。解压缩文件并将它们放在 /usr/local 或 /usr 中。
{% codeblock lang:bash %}
wget http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x86.tar.gz
tar vfxz node-v0.12.0-linux-x86.tar.gz
cd node-v0.12.0-linux-x86
rm bin/node
cp -R include /usr/local
cp -R share /usr/local
cp -R lib /usr/local
cp -R bin /usr/local
{% endcodeblock %}
记住不要覆盖你已上传的二进制文件。

# 包列表

以下是我成功构建的包列表：

- htop
- joe
- unrar
- transmission
  - libcurl3-gnutls
  - libminiupnpc5
  - libnatpmp1
  - transmission-common
  - transmission-daemon
- Node.js 先决条件
  - libc-ares2
  - libv8
- python3-pip
  - libcurl3-gnutls
  - python2.6
  - python3
  - python3-pkg-resources
  - python3-setuptools
  - python-pkg-resources
  - python-setuptools
- liberror-perl（git 所需）
- git
- rrdtool（cacti 所需）
- virtual-mysql-client（cacti 所需）
- php5-mysql（cacti 所需）
- dbconfig-common（cacti 所需）
- libphp-adodb（cacti 所需）
- snmp（cacti 所需）
- php5-snmp（cacti 所需）
- cacti

包已上传到 [https://app.box.com/wdcloud](https://app.box.com/wdcloud)。

构建脚本：
{% gist 1629e9a9bf266fb4abfc %}
