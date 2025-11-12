---
title: MacでのGsource
date: 2017-12-08
tags:
  - Visualization
  - Mac
category:
  - Development
lang: ja
excerpt: Macで Gourceを使用して、Gitリポジトリの履歴を見事な3Dアニメーションで視覚化します。開発者がどれだけ一生懸命働いているかを、魅惑的なコード進化ビデオで非技術者に示しましょう。
---

開発者がどれだけ一生懸命働いているかを非IT関係者に伝えることは難しいことがよくあります。通常、私は彼らに[Gource](http://gource.io/)を見せようとします。

![gsourceサンプル](/2017/12/Gsource-on-Mac/gsource.jpeg)

MacでGourceをセットアップすることは難しくありませんが、いくつかのステップがあります。まず、Brewをインストールする必要があります。次に、ターミナルから以下のコマンドを実行します。

{% codeblock lang:shell %}
# wgetがない場合はインストール
brew install wget

# gsource依存関係
brew install glew
brew install pkg-config
brew install sdl2
brew install sdl2_image
brew install boost
brew install glm
brew install pcre

# Gourceをダウンロードしてビルド
wget https://github.com/acaudwell/Gource/releases/download/gource-0.47/gource-0.47.tar.gz
tar vfxz gource-0.47.tar.gz
cd gource-0.47
./configure

# configureからエラーがないと仮定
make install
{% endcodeblock %}

バイナリは/usr/local/bin/gourceにインストールされます。Gitリポジトリを含むディレクトリからビデオを生成するには、以下のコマンドを実行します。
{% codeblock lang:shell %}
cd [your git repository]
/usr/local/bin/gource
{% endcodeblock %}

Gitログの「Your Name.png」のようなGit作成者名にアバターの名前を変更し、ローカルディレクトリに配置して、以下のGourceコマンドを実行することで、デフォルトのアイコンを自分のものに置き換えることができます。
{% codeblock lang:shell %}
/usr/local/bin/gource --user-image-dir .
{% endcodeblock %}

ビデオが長すぎると感じる場合は、`-c`、`--time-scale`、または`SCALE`でシミュレーション時間スケール（デフォルト：1.0）を変更して速度を調整できます。

`--max-files NUMBER`で無制限から100などの値に最大ファイル数を減らすことで、ビデオをより整理できます。

多数のファイルが追加または削除されているときに、`-e 0.5`で弾力性を追加すると楽しいです。

詳細は[Controls](https://github.com/acaudwell/Gource/wiki/Controls)で確認できます。

ビデオは`-o FILENAME`オプションでファイルに出力できます。1分間のビデオでファイルサイズが10GBを超える可能性があるため、注意してください。

ビデオが生成されたら、libavを使用してMP4に変換できます。
{% codeblock lang:shell %}
brew install libav
avconv -vcodec ppm -f image2pipe -i gource.ppm -c:v libx265 -c:a copy gource.mkv
{% endcodeblock %}
私のブログのGource：
{% youtube iZiZ4CaDkcM %}
