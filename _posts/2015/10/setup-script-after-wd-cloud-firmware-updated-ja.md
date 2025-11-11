---
title: WD Cloudファームウェア更新後のセットアップスクリプト
tags:
  - arm
  - wdcloud
id: 6943
categories:
  - Development
date: 2015-10-19
thumbnail: /assets/wdcloud/wdcloud.png
lang: ja
excerpt: ファームウェア更新後にすべての設定が失われましたか？SSHとパッケージ設定を迅速に復元する自動化スクリプト。
---

WD Cloudファームウェアが更新されるたびに、すべてのカスタム設定が失われます。以下のスクリプトは、設定を元に戻すのに役立ちます。

## 公開鍵認証を使用するようにSSHサーバーを更新
WD Cloudのrootにログインし、サーバー側で.sshを作成します。
{% codeblock lang:bash %}
mkdir ~/.ssh
{% endcodeblock %}

マシンからサーバーに公開鍵をアップロードします。_**nas**_をホスト/IPアドレスに置き換えてください。
{% codeblock lang:bash %}
scp ~/.ssh/id_rsa.pub root@_**nas**_:~/.ssh/authorized_keys
{% endcodeblock %}

サーバー側で
{% codeblock lang:bash %}
chmod go-rwx ~/.ssh
sed -i.bak "s/PubkeyAuthentication no/PubkeyAuthentication yes/" /etc/ssh/sshd_config
/etc/init.d/ssh restart
{% endcodeblock %}

パスワードを入力せずにnasにsshできます。簡単に言うと、
{% codeblock lang:bash %}
# 自分のマシンから実行
# 前提条件：~/.sshに公開鍵/秘密鍵ペアを生成済み

# 設定
export TARGET_SERVER=nas

ssh root@$TARGET_SERVER mkdir ~/.ssh
scp ~/.ssh/id_rsa.pub root@$TARGET_SERVER:~/.ssh/authorized_keys

ssh root@$TARGET_SERVER << EOF
chmod go-rwx ~/.ssh
sed -i.bak "s/PubkeyAuthentication no/PubkeyAuthentication yes/" /etc/ssh/sshd_config
/etc/init.d/ssh restart
EOF
{% endcodeblock %}

パッケージをビルドしたくない場合は、[https://app.box.com/wdcloud](https://app.box.com/wdcloud)からダウンロードできます。最新の状態に保つよう努めます。

## 一般的なパッケージをビルドするスクリプト
以下のスクリプトは、transmission、joeなどのパッケージをビルドします
{% codeblock lang:bash %}
# 個人的な好みに基づいてWD Cloud（ubuntu、arm）用の便利なコンポーネントをビルド

### 設定 ###
# WD cloudホスト名
export SERVER_HOST=nas

# ターゲットクラウドバージョン
WD_VERSION=04.04.02-105

### 実行 ###

# gplソースとビルドツールをダウンロードして解凍
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

# build/etc/apt/sources.listを上書き
echo "deb http://security.debian.org/ wheezy/updates main contrib non-free" > build/etc/apt/sources.list
echo "deb-src http://security.debian.org/ wheezy/updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb-src http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
echo "deb-src http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list
echo "deb http://ftp.debian.org/debian wheezy-backports main contrib non-free" >> build/etc/apt/sources.list

cp /etc/resolv.conf build/etc

# exiv2
./build.sh exiv2

# エディタ
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
./build.sh libcurl3-gnutls
./build.sh libminiupnpc5
./build.sh libnatpmp1
./build.sh transmission-common
./build.sh transmission-daemon
# アップロード
scp build/root/libcurl3-gnutls_*.deb root@$SERVER_HOST:~
scp build/root/libminiupnpc5_*.deb root@$SERVER_HOST:~
scp build/root/libnatpmp1_*.deb root@$SERVER_HOST:~
scp build/root/transmission-common_*.deb root@$SERVER_HOST:~
scp build/root/transmission-daemon_*.deb root@$SERVER_HOST:~
# インストール
ssh root@$SERVER_HOST dpkg -i libcurl3-gnutls_*.deb
ssh root@$SERVER_HOST dpkg -i libminiupnpc5_*.deb
ssh root@$SERVER_HOST dpkg -i libnatpmp1_*.deb
ssh root@$SERVER_HOST dpkg -i transmission-common_*.deb
ssh root@$SERVER_HOST dpkg -i transmission-daemon_*.deb

# nodejs
./build.sh libc-ares2
scp build/root/libc-ares2_*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i libc-ares2_*.deb
./build.sh libv8
scp build/root/libv8-3*.deb root@$SERVER_HOST:~
ssh root@$SERVER_HOST dpkg -i libv8-3*.deb
wget https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-armv7l.tar.gz
tar xvfz node-v4.2.1-linux-armv7l.tar.gz
cd node-v4.2.1-linux-armv7l
{% endcodeblock %}
