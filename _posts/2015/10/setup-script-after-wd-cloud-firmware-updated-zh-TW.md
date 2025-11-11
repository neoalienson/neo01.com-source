---
title: WD Cloud 韌體更新後的設定腳本
tags:
  - arm
  - wdcloud
categories:
  - Development
date: 2015-10-19
thumbnail: /assets/wdcloud/wdcloud.png
lang: zh-TW
excerpt: "韌體更新後失去所有配置？自動化腳本幫你恢復 SSH 和套件設定"
---

每當 WD Cloud 韌體更新時，你會失去所有自訂配置。以下腳本幫助我恢復我的設定，

## 更新 SSH 伺服器以使用公鑰認證
登入 WD Cloud 的 root 並在伺服器端建立 .ssh，
{% codeblock lang:bash %}
mkdir ~/.ssh
{% endcodeblock %}

從你的機器上傳公鑰到伺服器，將 _**nas**_ 替換為你的主機/IP 位址。
{% codeblock lang:bash %}
scp ~/.ssh/id_rsa.pub root@_**nas**_:~/.ssh/authorized_keys
{% endcodeblock %}

在伺服器端
{% codeblock lang:bash %}
chmod go-rwx ~/.ssh
sed -i.bak "s/PubkeyAuthentication no/PubkeyAuthentication yes/" /etc/ssh/sshd_config
/etc/init.d/ssh restart
{% endcodeblock %}

你可以在不輸入密碼的情況下 ssh 到 nas。簡而言之，
{% codeblock lang:bash %}
# 從你自己的機器執行
# 先決條件，你已經在 ~/.ssh 中生成了公鑰/私鑰對

# 配置
export TARGET_SERVER=nas

ssh root@$TARGET_SERVER mkdir ~/.ssh
從你的機器上傳公鑰到伺服器，將 nas 替換為你的主機/IP 位址。

scp ~/.ssh/id_rsa.pub root@nas:~/.ssh/authorized_keys
在伺服器端

ssh root@$TARGET_SERVER << EOF
chmod go-rwx ~/.ssh
sed -i.bak "s/PubkeyAuthentication no/PubkeyAuthentication yes/" /etc/ssh/sshd_config
/etc/init.d/ssh restart
EOF
{% endcodeblock %}

如果你不想建構套件，你可以從 [https://app.box.com/wdcloud](https://app.box.com/wdcloud) 下載。我會盡量保持更新。

## 建構一般套件的腳本
以下腳本建構套件，例如 transmission、joe 等
{% codeblock lang:bash %}
# 根據我的個人偏好為 WD Cloud（ubuntu、arm）建構有用的組件

### 配置 ###
# 你的 WD cloud 主機名稱
export SERVER_HOST=nas

# 目標雲端版本
WD_VERSION=04.04.02-105

### 執行 ###

# 下載並解壓縮 gpl 原始碼和建構工具
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

# 覆蓋 build/etc/apt/sources.list
echo "deb http://security.debian.org/ wheezy/updates main contrib non-free" > build/etc/apt/sources.list
echo "deb-src http://security.debian.org/ wheezy/updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb-src http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
echo "deb-src http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
# 可選，直到你需要使用 backports 套件
echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list

cp /etc/resolv.conf build/etc

# exiv2
./build.sh exiv2

# 編輯器
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
# 以下建構過程將在一小時左右完成
./build.sh libcurl3-gnutls
./build.sh libminiupnpc5
./build.sh libnatpmp1
./build.sh transmission-common
./build.sh transmission-daemon
# 上傳
scp build/root/libcurl3-gnutls_*.deb root@$SERVER_HOST:~
scp build/root/libminiupnpc5_*.deb root@$SERVER_HOST:~
scp build/root/libnatpmp1_*.deb root@$SERVER_HOST:~
scp build/root/transmission-common_*.deb root@$SERVER_HOST:~
scp build/root/transmission-daemon_*.deb root@$SERVER_HOST:~
# 安裝
ssh root@$SERVER_HOST dpkg -i libcurl3-gnutls_*.deb
ssh root@$SERVER_HOST dpkg -i libminiupnpc5_*.deb
ssh root@$SERVER_HOST dpkg -i libnatpmp1_*.deb
ssh root@$SERVER_HOST dpkg -i transmission-common_*.deb
ssh root@$SERVER_HOST dpkg -i transmission-daemon_*.deb
# transmission daemon / web 應該已啟動
# 如果沒有，/etc/init.d/transmission-daemon start
# 如果你有備份設定，上傳設定並重新啟動
# /etc/init.d/transmission-daemon restart

# nodejs
./build.sh libc-ares2
scp build/root/libc-ares2_*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i libc-ares2_*.deb
# 建構需要一小時
./build.sh libv8
scp build/root/libv8-3*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i libv8-3*.deb
wget https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-armv7l.tar.gz
tar xvfz node-v4.2.1-linux-armv7l.tar.gz
cd node-v4.2.1-linux-armv7l
{% endcodeblock %}
