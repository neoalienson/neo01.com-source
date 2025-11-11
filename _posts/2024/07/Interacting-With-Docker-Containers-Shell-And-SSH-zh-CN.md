---
title: 与 Docker 容器交互 - Shell 和 SSH
date: 2024-7-4
categories:
  - Development
tag:
  - docker
thumbnail: banner.jpeg
thumbnail_80: icon.jpeg
lang: zh-CN
excerpt: Shell和SSH访问容器很方便,但为什么它们对Docker不好?探索安全风险和更好的替代方案。
comments: true
---

Docker 通过将应用程序封装在轻量级、可移植容器中，彻底改变了我们构建、交付和运行应用程序的方式。使用 shell 和 SSH 与这些容器交互不是最佳实践，但对开发者来说很方便。在这篇博客文章中，我们将探讨如何使用 shell 访问和 SSH 与 Docker 容器交互。

### 容器的 Shell 访问

与正在运行的 Docker 容器交互的最直接方法是通过 Docker exec 命令，前提是您使用 shell 构建镜像。此命令允许您在正在运行的容器中运行新命令，这对于调试或快速修改特别有用。

以下是使用方法：

1. **识别容器**：首先，您需要知道容器的 ID 或名称。您可以使用 `docker ps` 列出所有正在运行的容器。

2. **执行命令**：要在容器内运行命令，使用 `docker exec`。例如，要启动交互式 shell 会话，您可以使用：
   ```
   docker exec -it <container_id_or_name> /bin/sh
   ```
   将 `<container_id_or_name>` 替换为您实际的容器 ID 或名称。`-it` 标志在容器中附加交互式 tty。

!!!warning "⚠️ 维护安全性"
    请记住，使用不必要的组件（特别是 shell）构建容器镜像可能会带来安全风险。始终 `FROM scratch` 构建镜像以保持其干净，并与可观察性集成以进行故障排除。

### SSH 进入容器

虽然 shell 访问很方便，但有时您可能需要更持久的连接方法，例如 SSH。设置对 Docker 容器的 SSH 访问涉及更多步骤：

1. **创建 Dockerfile**：您需要一个安装 SSH 并设置必要配置的 Dockerfile。这是一个简单的示例：
   ```
   FROM ubuntu:latest
   RUN apt-get update && apt-get install -y openssh-server
   RUN mkdir /var/run/sshd
   RUN echo 'root:YOUR_PASSWORD' | chpasswd
   RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
   EXPOSE 22
   CMD ["/usr/sbin/sshd", "-D"]
   ```
   将 `YOUR_PASSWORD` 替换为您选择的安全密码。

2. **构建并运行容器**：使用 `docker build` 构建镜像并使用 `docker run` 运行它，确保映射 SSH 端口：
   ```
   docker build -t ssh-enabled-container .
   docker run -d -p 2222:22 ssh-enabled-container
   ```

3. **SSH 进入容器**：使用 SSH 客户端连接到容器：
   ```
   ssh root@localhost -p 2222
   ```
   使用您在 Dockerfile 中设置的密码登录。

!!!warning "⚠️ 维护安全性"
    请记住，在容器中暴露 SSH 可能是安全风险。始终使用强密码或 SSH 密钥，并考虑额外的安全措施，例如防火墙和 SSH 强化实践。还有其他危险的方式可以访问 SSH 端口，但我们不会在这篇文章中进一步讨论。

### 为什么 Shell 和 SSH 对 Docker 不好

当您 SSH 进入容器时，您本质上是将其视为传统虚拟机，这违背了容器的**隔离**、**短暂**和极简环境的理念。

1. **安全风险**：SSH 服务器为您的容器增加了不必要的复杂性和潜在漏洞。在容器中运行的每个 SSH 进程都是恶意行为者的额外攻击面。

2. **容器膨胀**：容器应该是轻量级的，只包含运行应用程序所需的基本包。安装 SSH 服务器和 shell 会增加容器的大小，并添加应用程序运行不必要的额外层。

3. **偏离容器编排工具**：现代容器编排工具（如 Kubernetes）提供自己的访问容器方法，例如 `kubectl exec`。使用 SSH 和 shell 可能会绕过这些工具，导致偏离标准化工作流程，并可能导致配置漂移。

4. **有状态性**：容器被设计为无状态和不可变的。SSH 和 shell 进入容器并进行更改可能导致有状态配置，这不会反映在容器的镜像或定义文件中。当容器在不同环境中重新部署或扩展时，这可能会导致问题。

5. **生命周期管理**：Docker 容器应该经常停止和启动，通过更新容器镜像来进行更改。通过使用 SSH 和 shell，您可能会被诱惑对正在运行的容器进行临时更改，这违背了不可变基础设施的原则。

6. **管理复杂性**：管理 SSH 密钥、确保它们被轮换并保持安全，为容器管理增加了额外的复杂性层。它还增加了管理容器访问的管理开销。

### 结论

无论您偏好 Docker exec 的简单性还是 SSH 的持久性，这两种方法都提供了与 Docker 容器交互的强大方式。请记住负责任地使用这些工具，牢记安全性，您将能够有效地管理您的容器。

我们希望本指南对您有所帮助。有关更详细的说明和最佳实践，请参阅官方 Docker 文档和 SSH 配置指南。祝容器化愉快！

![](/2024/07/Interacting-With-Docker-Containers-Shell-And-SSH/hero.jpeg)
