---
title: WD Cloud 和 Node.js 的交叉編譯
tags:
  - arm
  - nodejs
  - wdcloud
categories:
  - Development
date: 2015-03-14
thumbnail: /assets/wdcloud/wdcloud.png
lang: zh-TW
excerpt: "在 Ubuntu 上為 WD Cloud ARM 裝置交叉編譯 Node.js 和其他套件的完整指南"
---

WD Cloud 在 ARM 上運行 Debian Linux。當你為其他架構建構應用程式時，你需要使用交叉編譯。我已經在 Ubuntu 14 上成功建構了一個套件，方法是遵循[這篇文章](http://community.wd.com/t5/WD-My-Cloud/GUIDE-Building-packages-for-the-new-firmware-someone-tried-it/td-p/768007/page/2)，並附上一些注意事項。

如果你看到類似以下的錯誤訊息：
{% codeblock lang:bash %}
Err http://ftp.debian.org wheezy-updates Release.gpg Could not resolve 'ftp.debian.org'
{% endcodeblock %}

那麼，將 /etc/resolv.conf 複製到 build/etc，例如：
{% codeblock lang:bash %}
sudo cp /etc/resolv.conf build/etc
{% endcodeblock %}

# 使用 Wheezy 為 WD Cloud 韌體版本 4 或更高版本進行交叉編譯的摘要

{% codeblock lang:bash %}
# 交叉編譯所需
apt-get install qemu-user-static
apt-get install binfmt-support

# 建構資料夾
mkdir wdmc-build
cd wdmc-build

# 下載位置可以在 http://support.wdc.com/product/download.asp?groupid=904&lang=en 找到
wget http://download.wdc.com/gpl/gpl-source-wd_my_cloud-04.01.03-421.zip

unzip gpl-source-wd_my_cloud-04.01.03-421.zip packages/build_tools/debian/*
mkdir 64k-wheezy
cp -R packages/build_tools/debian/* ./64k-wheezy
echo '#!/bin/bash' > 64k-wheezy/build.sh
echo './build-armhf-package.sh --pagesize=64k $1 wheezy' >> 64k-wheezy/build.sh
chmod a+x 64k-wheezy/build.sh

cd 64k-wheezy
# 設定腳本會在 chroot 期間提示輸入 root 密碼
./setup.sh bootstrap/wheezy-bootstrap_1.24.14_armhf.tar.gz build

sudo mv build/usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static_orig
sudo cp /usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static

# 覆蓋 build/etc/apt/sources.list
sudo echo "deb http://security.debian.org/ wheezy/updates main contrib non-free" > build/etc/apt/sources.list
sudo echo "deb-src http://security.debian.org/ wheezy/updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb-src http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb-src http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
# 可選，直到你需要使用 backports 套件
sudo echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list

sudo cp /etc/resolv.conf build/etc
{% endcodeblock %}

然後你可以透過使用套件名稱執行 build.sh 來建構，例如：
{% codeblock lang:bash %}
./build.sh joe
{% endcodeblock %}

它會從儲存庫下載原始碼套件、交叉編譯它，並建構一個 deb 檔案。這個過程可能需要超過 10 分鐘。一旦成功，你可以將 .deb 檔案 scp 到你的路由器，並使用 ```dpkg -i``` 安裝它。

# 手動建構 Node.js

建構 Node.js 有點棘手，因為原始碼不在儲存庫中。我曾嘗試使用來自 http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x86.tar.gz 的二進位檔案，但失敗了，錯誤訊息為：
```cannot execute binary file```
你可以按照腳本手動建構它：
{% codeblock lang:bash %}
# 設定工具
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

# 現在建構環境已準備好
wget http://nodejs.org/dist/v0.12.0/node-v0.12.0.tar.gz
tar vfxz node-v0.12.0.tar.gz
cd node-v0.12.0
./configure
make

# 返回原始環境
exit
{% endcodeblock %}
二進位檔案已準備好在 build/root/node-v0.12.0/node 中，供你上傳到 WD Cloud。你可以上傳到 WD Cloud 中的 /usr/local/bin。

你還需要從 http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x86.tar.gz 下載 npm 和其他組件。解壓縮檔案並將它們放在 /usr/local 或 /usr 中。
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
記住不要覆蓋你已上傳的二進位檔案。

# 套件列表

以下是我成功建構的套件列表：

- htop
- joe
- unrar
- transmission
  - libcurl3-gnutls
  - libminiupnpc5
  - libnatpmp1
  - transmission-common
  - transmission-daemon
- Node.js 先決條件
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

套件已上傳到 [https://app.box.com/wdcloud](https://app.box.com/wdcloud target=_blank)。

建構腳本：
{% gist 1629e9a9bf266fb4abfc %}
