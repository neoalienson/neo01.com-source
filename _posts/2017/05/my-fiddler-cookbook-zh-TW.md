---
title: 我的 Fiddler 食譜
id: 7270
categories:
  - Development
date: 2017-05-20
tags:
thumbnail: fiddler.jpg
lang: zh-TW
excerpt: "掌握 Fiddler 的必備技巧：HTTPS 解密、簡單負載測試和請求修改。Windows 上最強大的除錯代理工具！"
comments: true
---

Fiddler 是我在 Windows 上最喜歡的除錯代理。通常，我使用 Python 編寫簡單的除錯代理，通常少於 30 行，直到它需要 https。

# 啟用 https 解密

這就是為什麼我在 Fiddler 上的第一個配置是解密 HTTPS 流量，

![](/2017/05/my-fiddler-cookbook/fiddler-2.png)

勾選 Decrypt HTTPS traffic 並點擊 OK。
![](/2017/05/my-fiddler-cookbook/fiddler-3.png)

然後它會要求安裝信任根憑證，
![](/2017/05/my-fiddler-cookbook/fiddler-4a.png)
![](/2017/05/my-fiddler-cookbook/fiddler-4b.png)

可怕的文字是關於 https 流量被 Fiddler 看到的警告。Fiddler 的根憑證現在受信任，這意味著 Fiddler 可以生成您的應用程式（包括您的瀏覽器）信任的憑證。

如果它沒有提示您安裝憑證，您可以使用以下方式安裝憑證，
![](/2017/05/my-fiddler-cookbook/fiddler-5.png)

# 簡單的負載測試

您可以透過選擇多個請求，然後按 R 來執行非常簡單的負載測試。請注意，來自伺服器的回應可能會在基礎設施的不同層級中快取。
![](/2017/05/my-fiddler-cookbook/fiddler-6.png)

您可以從時間軸看到伺服器的效能如何。
![](/2017/05/my-fiddler-cookbook/fiddler-7.png)

有時您甚至可以透過檢查時間軸來查看 Windows 上的傳出連線數量限制。

# 修改您的請求

您也可以在發送請求之前修改它，
![](/2017/05/my-fiddler-cookbook/fiddler-8.png)
