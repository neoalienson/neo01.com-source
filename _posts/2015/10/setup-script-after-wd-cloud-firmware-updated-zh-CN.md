---
title: WD Cloud 固件更新后的设置脚本
tags:
  - arm
  - wdcloud
categories:
  - Development
date: 2015-10-19
thumbnail: /assets/wdcloud/wdcloud.png
lang: zh-CN
excerpt: "固件更新后失去所有配置？自动化脚本帮你恢复 SSH 和包设置"
---

每当 WD Cloud 固件更新时，你会失去所有自定义配置。以下脚本帮助我恢复我的设置，

## 更新 SSH 服务器以使用公钥认证
登录 WD Cloud 的 root 并在服务器端创建 .ssh，
{% codeblock lang:bash %}
mkdir ~/.ssh
{% endcodeblock %}

从你的机器上传公钥到服务器，将 _**nas**_ 替换为你的主机/IP 地址。
{% codeblock lang:bash %}
scp ~/.ssh/id_rsa.pub root@_**nas**_:~/.ssh/authorized_keys
{% endcodeblock %}

在服务器端
{% codeblock lang:bash %}
chmod go-rwx ~/.ssh
sed -i.bak "s/PubkeyAuthentication no/PubkeyAuthentication yes/" /etc/ssh/sshd_config
/etc/init.d/ssh restart
{% endcodeblock %}

你可以在不输入密码的情况下 ssh 到 nas。简而言之，
{% codeblock lang:bash %}
# 从你自己的机器执行
# 先决条件，你已经在 ~/.ssh 中生成了公钥/私钥对

# 配置
export TARGET_SERVER=nas

ssh root@$TARGET_SERVER mkdir ~/.ssh
从你的机器上传公钥到服务器，将 nas 替换为你的主机/IP 地址。

scp ~/.ssh/id_rsa.pub root@nas:~/.ssh/authorized_keys
在服务器端

ssh root@$TARGET_SERVER << EOF
chmod go-rwx ~/.ssh
sed -i.bak "s/PubkeyAuthentication no/PubkeyAuthentication yes/" /etc/ssh/sshd_config
/etc/init.d/ssh restart
EOF
{% endcodeblock %}

如果你不想构建包，你可以从 [https://app.box.com/wdcloud](https://app.box.com/wdcloud) 下载。我会尽量保持更新。

## 构建一般包的脚本
以下脚本构建包，例如 transmission、joe 等
{% codeblock lang:bash %}
# 根据我的个人偏好为 WD Cloud（ubuntu、arm）构建有用的组件

### 配置 ###
# 你的 WD cloud 主机名称
export SERVER_HOST=nas

# 目标云端版本
WD_VERSION=04.04.02-105

### 执行 ###

# 下载并解压缩 gpl 源代码和构建工具
wget http://download.wdc.com/gpl/gpl-source-wd_my_cloud-$WD_VERSION.zip
rm -rf packages
unzip gpl-source-wd_my_cloud-$WD_VERSION.zip packages/build_tools/debian/*

mkdir 64k-wheezy
cp -R packages/build_tools/debian/* ./64k-wheezy
echo '#!/bin/bash' > 64k-wheezy/build.sh
echo './build-armhf-package.sh --pagesize=64k $1 wheezy' >> 64k-wheezy/build.sh
chmod a+x 64k-wheezy/build.sh

cd 64k-wheezy
./setup.sh bootstrap/wheezy-bootstrap_1.24.14_armhf.tar.gz build

mv build/usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static_orig
cp /usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static

# 覆盖 build/etc/apt/sources.list
echo "deb http://security.debian.org/ wheezy/updates main contrib non-free" > build/etc/apt/sources.list
echo "deb-src http://security.debian.org/ wheezy/updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb-src http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
echo "deb-src http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
# 可选，直到你需要使用 backports 包
echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list

cp /etc/resolv.conf build/etc

# exiv2
./build.sh exiv2

# 编辑器
./build.sh joe
scp build/root/joe_*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i joe_*.deb

# htop
./build.sh htop
scp build/root/htop_*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i htop_*.deb

# unrar
./build.sh unrar
scp build/root/unrar_*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i unrar_*.deb

# transmission
# 以下构建过程将在一小时左右完成
./build.sh libcurl3-gnutls
./build.sh libminiupnpc5
./build.sh libnatpmp1
./build.sh transmission-common
./build.sh transmission-daemon
# 上传
scp build/root/libcurl3-gnutls_*.deb root@$SERVER_HOST:~
scp build/root/libminiupnpc5_*.deb root@$SERVER_HOST:~
scp build/root/libnatpmp1_*.deb root@$SERVER_HOST:~
scp build/root/transmission-common_*.deb root@$SERVER_HOST:~
scp build/root/transmission-daemon_*.deb root@$SERVER_HOST:~
# 安装
ssh root@$SERVER_HOST dpkg -i libcurl3-gnutls_*.deb
ssh root@$SERVER_HOST dpkg -i libminiupnpc5_*.deb
ssh root@$SERVER_HOST dpkg -i libnatpmp1_*.deb
ssh root@$SERVER_HOST dpkg -i transmission-common_*.deb
ssh root@$SERVER_HOST dpkg -i transmission-daemon_*.deb
# transmission daemon / web 应该已启动
# 如果没有，/etc/init.d/transmission-daemon start
# 如果你有备份设置，上传设置并重新启动
# /etc/init.d/transmission-daemon restart

# nodejs
./build.sh libc-ares2
scp build/root/libc-ares2_*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i libc-ares2_*.deb
# 构建需要一小时
./build.sh libv8
scp build/root/libv8-3*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i libv8-3*.deb
wget https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-armv7l.tar.gz
tar xvfz node-v4.2.1-linux-armv7l.tar.gz
cd node-v4.2.1-linux-armv7l
{% endcodeblock %}
