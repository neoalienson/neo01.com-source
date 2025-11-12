---
title: WD CloudとNode.jsのクロスビルド
tags:
  - arm
  - nodejs
  - wdcloud
id: 6851
categories:
  - Development
date: 2015-03-14
thumbnail: /assets/wdcloud/wdcloud.png
lang: ja
excerpt: Ubuntu上でWD Cloud ARM デバイス用にNode.jsとパッケージをクロスコンパイルする完全ガイド。すぐに使えるビルドスクリプト付き。
---

WD CloudはARM上でDebian Linuxを実行します。他のアーキテクチャ用にアプリケーションをビルドする場合、クロスビルドを使用する必要があります。いくつかの注意事項を含めて、[この投稿](http://community.wd.com/t5/WD-My-Cloud/GUIDE-Building-packages-for-the-new-firmware-someone-tried-it/td-p/768007/page/2)に従ってUbuntu 14でパッケージのビルドに成功しました。

次のようなエラーメッセージが表示された場合：
{% codeblock lang:bash %}
Err http://ftp.debian.org wheezy-updates Release.gpg Could not resolve 'ftp.debian.org'
{% endcodeblock %}

/etc/resolv.confをbuild/etcにコピーします。例：
{% codeblock lang:bash %}
sudo cp /etc/resolv.conf build/etc
{% endcodeblock %}

# WD Cloudファームウェアバージョン4以降のWheezyを使用したクロスビルドの概要

{% codeblock lang:bash %}
# クロスビルドに必要
apt-get install qemu-user-static
apt-get install binfmt-support

# ビルド用フォルダ
mkdir wdmc-build
cd wdmc-build

# ダウンロード場所はhttp://support.wdc.com/product/download.asp?groupid=904&lang=enで確認可能
wget http://download.wdc.com/gpl/gpl-source-wd_my_cloud-04.01.03-421.zip

unzip gpl-source-wd_my_cloud-04.01.03-421.zip packages/build_tools/debian/*
mkdir 64k-wheezy
cp -R packages/build_tools/debian/* ./64k-wheezy
echo '#!/bin/bash' > 64k-wheezy/build.sh
echo './build-armhf-package.sh --pagesize=64k $1 wheezy' >> 64k-wheezy/build.sh
chmod a+x 64k-wheezy/build.sh

cd 64k-wheezy
# セットアップスクリプトはchroot中にrootパスワードを要求します
./setup.sh bootstrap/wheezy-bootstrap_1.24.14_armhf.tar.gz build

sudo mv build/usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static_orig
sudo cp /usr/bin/qemu-arm-static build/usr/bin/qemu-arm-static

# build/etc/apt/sources.listを上書き
sudo echo "deb http://security.debian.org/ wheezy/updates main contrib non-free" > build/etc/apt/sources.list
sudo echo "deb-src http://security.debian.org/ wheezy/updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb-src http://ftp.debian.org/debian wheezy-updates main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list
sudo echo "deb-src http://ftp.debian.org/debian wheezy main contrib non-free" >> build/etc/apt/sources.list

sudo cp /etc/resolv.conf build/etc
{% endcodeblock %}

その後、パッケージ名を指定して`build.sh`を実行してビルドできます。例：
{% codeblock lang:bash %}
./build.sh joe
{% endcodeblock %}

リポジトリからソースパッケージをダウンロードし、クロスコンパイルして、debファイルをビルドします。プロセスには10分以上かかる場合があります。成功したら、.debファイルをルーターにscpして、```dpkg -i```でインストールできます。

# Node.jsの手動ビルド

Node.jsのビルドは、ソースがリポジトリにないため、少し厄介です。http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x86.tar.gzからバイナリを使用しようとしましたが、次のエラーで失敗しました：
```cannot execute binary file```
スクリプトに従って手動でビルドできます：
{% codeblock lang:bash %}
# ユーティリティのセットアップ
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

# ビルド環境の準備完了
wget http://nodejs.org/dist/v0.12.0/node-v0.12.0.tar.gz
tar vfxz node-v0.12.0.tar.gz
cd node-v0.12.0
./configure
make

# 元の環境に戻る
exit
{% endcodeblock %}
バイナリはbuild/root/node-v0.12.0/nodeに準備されており、WD Cloudにアップロードできます。WD Cloudの/usr/local/binにアップロードできます。

http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x86.tar.gzからnpmおよびその他のコンポーネントもダウンロードする必要があります。ファイルを抽出して、/usr/localまたは/usrに配置します。
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
アップロードしたバイナリを上書きしないように注意してください。

# パッケージリスト

以下は、正常にビルドしたパッケージのリストです：

- htop
- joe
- unrar
- transmission
  - libcurl3-gnutls
  - libminiupnpc5
  - libnatpmp1
  - transmission-common
  - transmission-daemon
- Node.js前提条件
  - libc-ares2
  - libv8
- python3-pip
- liberror-perl（gitに必要）
- git
- rrdtool（cactiに必要）
- virtual-mysql-client（cactiに必要）
- php5-mysql（cactiに必要）
- dbconfig-common（cactiに必要）
- libphp-adodb（cactiに必要）
- snmp（cactiに必要）
- php5-snmp（cactiに必要）
- cacti

パッケージは[https://app.box.com/wdcloud](https://app.box.com/wdcloud)にアップロードされています。

ビルドスクリプト：
{% gist 1629e9a9bf266fb4abfc %}
