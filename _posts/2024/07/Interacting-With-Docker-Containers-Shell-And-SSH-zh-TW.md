---
title: 與 Docker 容器互動 - Shell 和 SSH
date: 2024-7-4
categories:
  - Development
tag:
  - docker
thumbnail: banner.jpeg
thumbnail_80: icon.jpeg
lang: zh-TW
excerpt: Shell和SSH訪問容器很方便,但為什麼它們對Docker不好?探索安全風險和更好的替代方案。
comments: true
---

Docker 通過將應用程式封裝在輕量級、可攜式容器中，徹底改變了我們建構、交付和運行應用程式的方式。使用 shell 和 SSH 與這些容器互動不是最佳實踐，但對開發者來說很方便。在這篇部落格文章中，我們將探討如何使用 shell 訪問和 SSH 與 Docker 容器互動。

### 容器的 Shell 訪問

與正在運行的 Docker 容器互動的最直接方法是通過 Docker exec 命令，前提是您使用 shell 建構映像。此命令允許您在正在運行的容器中運行新命令，這對於除錯或快速修改特別有用。

以下是使用方法：

1. **識別容器**：首先，您需要知道容器的 ID 或名稱。您可以使用 `docker ps` 列出所有正在運行的容器。

2. **執行命令**：要在容器內運行命令，使用 `docker exec`。例如，要啟動互動式 shell 會話，您可以使用：
   ```
   docker exec -it <container_id_or_name> /bin/sh
   ```
   將 `<container_id_or_name>` 替換為您實際的容器 ID 或名稱。`-it` 標誌在容器中附加互動式 tty。

!!!warning "⚠️ 維護安全性"
    請記住，使用不必要的元件（特別是 shell）建構容器映像可能會帶來安全風險。始終 `FROM scratch` 建構映像以保持其乾淨，並與可觀察性整合以進行故障排除。

### SSH 進入容器

雖然 shell 訪問很方便，但有時您可能需要更持久的連接方法，例如 SSH。設定對 Docker 容器的 SSH 訪問涉及更多步驟：

1. **創建 Dockerfile**：您需要一個安裝 SSH 並設定必要配置的 Dockerfile。這是一個簡單的範例：
   ```
   FROM ubuntu:latest
   RUN apt-get update && apt-get install -y openssh-server
   RUN mkdir /var/run/sshd
   RUN echo 'root:YOUR_PASSWORD' | chpasswd
   RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
   EXPOSE 22
   CMD ["/usr/sbin/sshd", "-D"]
   ```
   將 `YOUR_PASSWORD` 替換為您選擇的安全密碼。

2. **建構並運行容器**：使用 `docker build` 建構映像並使用 `docker run` 運行它，確保映射 SSH 埠：
   ```
   docker build -t ssh-enabled-container .
   docker run -d -p 2222:22 ssh-enabled-container
   ```

3. **SSH 進入容器**：使用 SSH 客戶端連接到容器：
   ```
   ssh root@localhost -p 2222
   ```
   使用您在 Dockerfile 中設定的密碼登入。

!!!warning "⚠️ 維護安全性"
    請記住，在容器中暴露 SSH 可能是安全風險。始終使用強密碼或 SSH 金鑰，並考慮額外的安全措施，例如防火牆和 SSH 強化實踐。還有其他危險的方式可以訪問 SSH 埠，但我們不會在這篇文章中進一步討論。

### 為什麼 Shell 和 SSH 對 Docker 不好

當您 SSH 進入容器時，您本質上是將其視為傳統虛擬機，這違背了容器的**隔離**、**短暫**和極簡環境的理念。

1. **安全風險**：SSH 伺服器為您的容器增加了不必要的複雜性和潛在漏洞。在容器中運行的每個 SSH 進程都是惡意行為者的額外攻擊面。

2. **容器膨脹**：容器應該是輕量級的，只包含運行應用程式所需的基本套件。安裝 SSH 伺服器和 shell 會增加容器的大小，並添加應用程式運行不必要的額外層。

3. **偏離容器編排工具**：現代容器編排工具（如 Kubernetes）提供自己的訪問容器方法，例如 `kubectl exec`。使用 SSH 和 shell 可能會繞過這些工具，導致偏離標準化工作流程，並可能導致配置漂移。

4. **有狀態性**：容器被設計為無狀態和不可變的。SSH 和 shell 進入容器並進行更改可能導致有狀態配置，這不會反映在容器的映像或定義檔案中。當容器在不同環境中重新部署或擴展時，這可能會導致問題。

5. **生命週期管理**：Docker 容器應該經常停止和啟動，通過更新容器映像來進行更改。通過使用 SSH 和 shell，您可能會被誘惑對正在運行的容器進行臨時更改，這違背了不可變基礎設施的原則。

6. **管理複雜性**：管理 SSH 金鑰、確保它們被輪換並保持安全，為容器管理增加了額外的複雜性層。它還增加了管理容器訪問的管理開銷。

### 結論

無論您偏好 Docker exec 的簡單性還是 SSH 的持久性，這兩種方法都提供了與 Docker 容器互動的強大方式。請記住負責任地使用這些工具，牢記安全性，您將能夠有效地管理您的容器。

我們希望本指南對您有所幫助。有關更詳細的說明和最佳實踐，請參閱官方 Docker 文件和 SSH 配置指南。祝容器化愉快！

![](/2024/07/Interacting-With-Docker-Containers-Shell-And-SSH/hero.jpeg)
