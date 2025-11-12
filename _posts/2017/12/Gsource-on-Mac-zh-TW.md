---
title: Mac 上的 Gsource
date: 2017-12-08
tags:
  - Visualization
  - Mac
category:
  - Development
lang: zh-TW
excerpt: "用炅酷的 3D 動畫展示你的程式碼歷史！在 Mac 上安裝 Gource，讓非技術人員看到開發者的努力。"
---

向非 IT 人員說明開發者工作有多努力通常很困難。通常，我會嘗試讓他們觀看 [Gource](http://gource.io/)。

![gsource 範例](/2017/12/Gsource-on-Mac/gsource.jpeg)

在 Mac 上設定 Gource 並不困難，但有幾個步驟。首先，您必須安裝 Brew。然後，從終端機執行以下命令，

{% codeblock lang:shell %}
# 如果您沒有 wget，請安裝它
brew install wget

# gsource 相依性
brew install glew
brew install pkg-config
brew install sdl2
brew install sdl2_image
brew install boost
brew install glm
brew install pcre

# 下載並建置 Gource
wget https://github.com/acaudwell/Gource/releases/download/gource-0.47/gource-0.47.tar.gz
tar vfxz gource-0.47.tar.gz
cd gource-0.47
./configure

# 假設 configure 沒有錯誤
make install
{% endcodeblock %}

二進位檔案將安裝到 /usr/local/bin/gource。執行以下命令從具有 Git 儲存庫的目錄生成影片
{% codeblock lang:shell %}
cd [your git repository]
/usr/local/bin/gource
{% endcodeblock %}

您可以透過將您的頭像重新命名為 Git 作者名稱（如 Git 日誌中的「Your Name.png」）來替換預設圖示，將其放在本機目錄中，並執行以下 Gource 命令
{% codeblock lang:shell %}
/usr/local/bin/gource --user-image-dir .
{% endcodeblock %}

如果您覺得影片太長，可以透過使用 `-c`、`--time-scale` 或 `SCALE` 更改模擬時間比例（預設值：1.0）來調整速度。

您可以透過使用 `--max-files NUMBER` 將最大檔案數從無限制減少到一個值（如 100）來使您的影片不那麼混亂

當新增或刪除大量檔案時，使用 `-e 0.5` 新增彈性很有趣。

更多資訊可以在 [Controls](https://github.com/acaudwell/Gource/wiki/Controls) 中找到

影片可以使用選項 `-o FILENAME` 輸出到檔案。1 分鐘影片的檔案大小可能超過 10GB，所以請注意。

生成影片後，您可以使用 libav 將其轉換為 MP4，
{% codeblock lang:shell %}
brew install libav
avconv -vcodec ppm -f image2pipe -i gource.ppm -c:v libx265 -c:a copy gource.mkv
{% endcodeblock %}
我的部落格的 Gource：
{% youtube iZiZ4CaDkcM %}
