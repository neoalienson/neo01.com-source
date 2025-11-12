---
title: Kubernetes 网络策略 - 为何零信任对企业至关重要
date: 2022-10-01
categories:
  - Cybersecurity
tags:
  - Security
  - Kubernetes
  - Network Policy
lang: zh-CN
excerpt: "在 Kubernetes 中，默认情况下每个 Pod 都可以与其他 Pod 通信。对企业而言，这不是安全性——这是等待发生的数据泄露。了解为何网络策略是您的第一道防线。"
thumbnail: /assets/k8s/thumbnail.png
---

在 Kubernetes 的世界中，有一个许多企业忽视的危险默认设置：每个 Pod 都可以与其他 Pod 通信，跨越所有命名空间，没有任何限制。这就像建造一栋办公室，每扇门都没上锁，每个文件柜都是开放的，每位员工都可以进入每个房间。方便吗？是的。安全吗？绝对不是。

对于处理敏感数据、法规遵从或多租户环境的企业来说，这种扁平网络模型是一颗定时炸弹。一个被入侵的 Pod 可以成为横向移动攻击整个集群的跳板。这就是为什么 Kubernetes 网络策略不仅重要，而且是必不可少的。

## 扁平网络问题

Kubernetes 的设计理念是简单性。默认情况下，网络模型是扁平的——任何 Pod 都可以使用 IP 地址连接到任何其他 Pod。这使得开发变得容易，消除了网络复杂性，但也造成了巨大的安全漏洞。

考虑一个典型的企业应用程序：

- 前端 Pod 处理用户请求
- 后端 API Pod 处理业务逻辑
- 数据库 Pod 存储敏感的客户数据
- 管理 Pod 用于集群管理
- 第三方集成 Pod 连接到外部服务

在默认的 Kubernetes 设置中，被入侵的前端 Pod 可以直接访问您的数据库 Pod。被利用的第三方集成可以连接到您的管理工具。没有障碍，没有检查点，没有隔离。

!!!danger "🚨 数据泄露情境"
    攻击者利用您面向公众的 Web 应用程序中的漏洞。他们获得了前端 Pod 的 shell 访问权限。如果没有网络策略，他们现在可以扫描整个集群，发现数据库 Pod，并窃取客户数据——这一切都是因为没有任何东西阻止他们建立这些连接。

这不是理论上的。[2020 年 Tesla Kubernetes 数据泄露](https://redlock.io/blog/cryptojacking-tesla)就是因为暴露的 Kubernetes 仪表板导致被入侵的 Pod 可以访问存储在集群其他地方的 AWS 凭证。网络隔离本可以限制爆炸半径。

## 网络策略登场：Kubernetes 的零信任

Kubernetes 网络策略是一个规范，定义了 Pod 如何相互通信以及如何与外部端点通信。它是您集群的防火墙，但不是使用 IP 地址和端口，而是根据 Pod 标签、命名空间和 CIDR 块定义规则。

核心原则很简单：**默认拒绝，明确允许**。这就是零信任网络——在证明必要之前，什么都不信任。

基本的网络策略如下所示：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

这个策略说："后端 Pod 只能在端口 8080 上接收来自前端 Pod 的流量，并且只能在端口 5432 上向数据库 Pod 发送流量。"其他一切都被阻止。

!!!success "✅ 深度防御"
    网络策略不能取代应用程序级别的安全性、身份验证或加密。它们是深度防御策略中的一层。即使攻击者入侵了一个 Pod，网络策略也会限制他们可以连接的范围。

## 为何企业不能忽视这一点

对于企业来说，网络策略不是可选的——它们是合规性和安全性的必需品：

**法规遵从**：PCI-DSS、HIPAA 和 SOC 2 等标准要求网络隔离。您必须证明敏感数据与较不受信任的组件隔离。网络策略提供可审计的、声明式的隔离证明。

**多租户**：如果您在同一个集群上运行多个团队或客户，网络策略可以防止一个租户访问另一个租户的资源。没有它们，命名空间隔离纯粹是逻辑上的，而不是强制执行的。

**爆炸半径限制**：当（不是如果）发生安全事件时，网络策略可以控制损害。开发命名空间中被入侵的 Pod 无法连接到生产环境。被攻破的前端无法直接访问数据库。

**审计和可见性**：网络策略是声明式的并且受版本控制。您可以审计谁在何时更改了什么以及为什么。将此与埋藏在网络设备中的传统防火墙规则进行比较。

**成本效益**：无需为每个安全区域部署单独的集群（昂贵且操作复杂），您可以使用网络策略在单个集群内建立安全边界。

!!!info "📊 合规要求"
    PCI-DSS 要求 1.2.1 明确规定限制入站和出站流量，仅限于持卡人数据环境所需的流量。网络策略是满足此要求的 Kubernetes 原生方式。

## 替代方案：属性型防火墙与服务网格

网络策略并不是唯一的选择。企业还有其他选项来保护 Kubernetes 网络：

### 传统防火墙：节点级陷阱

您可以使用传统网络防火墙或云安全组来控制 Kubernetes 节点之间的流量。但这种方法有一个致命缺陷，许多企业发现得太晚了。

**问题所在**：传统防火墙在节点级运作，而不是在 Pod 级。这就是为什么这很危险：

想象您有一个 Kubernetes 节点运行三个 Pod：
- Pod A：前端应用程序（需要互联网访问 CDN）
- Pod B：后端 API（永远不应该访问互联网）
- Pod C：数据库（绝对不能访问互联网）

使用传统防火墙，您配置节点的安全组以允许出站互联网访问，因为 Pod A 需要它。但问题来了：**所有三个 Pod 现在都有互联网访问权限**。防火墙无法区分 Pod——它只看到节点的 IP 地址。

这意味着：
- 您的数据库 Pod 可以将数据泄露到外部服务器
- 您的后端 API 可以被用作出站攻击的代理
- 被入侵的 Pod 可以下载恶意软件或与命令控制服务器通信

!!!danger "🔓 节点级安全漏洞"
    如果防火墙规则允许节点访问互联网（即使只是为了一个 Pod），该节点上的每个 Pod 都会继承该访问权限。您无法使用传统防火墙强制执行 Pod 特定的出站策略。这就是为什么节点级安全性对 Kubernetes 来说是不够的。

{% mermaid %}graph TB
    subgraph "传统防火墙（节点级）"
        FW1["防火墙规则：允许互联网"]
        Node1["Kubernetes 节点"]
        FW1 -.->|"应用到整个节点"| Node1
        
        subgraph Node1
            PodA1["Pod A<br/>（需要互联网）"]
            PodB1["Pod B<br/>（不应访问互联网）"]
            PodC1["Pod C - 数据库<br/>（绝不能访问互联网）"]
        end
        
        PodA1 -->|"✓ 允许"| Internet1["互联网"]
        PodB1 -->|"✓ 允许（问题！）"| Internet1
        PodC1 -->|"✓ 允许（危险！）"| Internet1
    end
    
    subgraph "网络策略（Pod 级）"
        Node2["Kubernetes 节点"]
        
        subgraph Node2
            PodA2["Pod A<br/>（需要互联网）"]
            PodB2["Pod B<br/>（不应访问互联网）"]
            PodC2["Pod C - 数据库<br/>（绝不能访问互联网）"]
        end
        
        NP1["网络策略：<br/>仅允许 Pod A"]
        NP1 -.->|"应用到特定 Pod"| PodA2
        
        PodA2 -->|"✓ 允许"| Internet2["互联网"]
        PodB2 -.->|"✗ 阻止"| Internet2
        PodC2 -.->|"✗ 阻止"| Internet2
    end
    
    style PodB1 fill:#ffcccc
    style PodC1 fill:#ff9999
    style PodB2 fill:#ccffcc
    style PodC2 fill:#ccffcc
    style FW1 fill:#ffeecc
    style NP1 fill:#ccffee
{% endmermaid %}

**其他限制**：

- **基于 IP，而非基于 Pod**：Pod 是短暂的，具有动态 IP。基于 IP 地址的防火墙规则在 Pod 创建和销毁时变得无法管理。
- **没有 Kubernetes 感知能力**：防火墙不理解命名空间、标签或 Pod 选择器。您失去了声明式的 Kubernetes 原生方法。
- **粗粒度控制**：您只能在节点级控制流量，而不是在实际安全边界所在的工作负载级。

### 属性型访问控制（ABAC）防火墙

一些新一代防火墙支持属性型策略，其中规则使用元数据属性而不是 IP 地址定义。这在理念上更接近 Kubernetes 网络策略：

- **元数据驱动**：基于应用程序身份、用户上下文或工作负载属性的规则
- **动态**：策略随着工作负载变化而调整，无需手动更新 IP
- **集中式**：整个基础设施的单一策略引擎

然而，ABAC 防火墙通常是 Kubernetes 外部的，需要集成且通常成本高昂。它们对于混合环境（Kubernetes + VM + 云服务）很强大，但增加了复杂性。

### 服务网格（Istio、Linkerd、Consul）

服务网格提供第 7 层（应用程序级）流量管理和安全性：

- **双向 TLS**：服务之间的自动加密和身份验证
- **细粒度策略**：基于 HTTP 方法、标头、路径的控制
- **可观察性**：详细的流量指标和追踪
- **高级路由**：金丝雀部署、流量分割、重试

服务网格非常强大，但也有权衡：

**复杂性**：显著的学习曲线和操作开销。您要为每个 Pod 添加 sidecar，管理控制平面，并调试新的基础设施层。

**性能开销**：Sidecar 代理增加延迟（通常每跳 1-5 毫秒）和资源消耗。

**成本**：更多资源、更多复杂性、更多操作负担。

!!!tip "💡 何时使用什么"
    **网络策略**：从这里开始。它们内置于 Kubernetes，易于实现，涵盖 80% 的企业安全需求。无需额外基础设施。
    
    **服务网格**：当您需要第 7 层功能（如双向 TLS、高级路由或详细可观察性）时添加。最适合具有复杂服务间通信的微服务架构。
    
    **ABAC 防火墙**：考虑用于混合环境，您需要跨 Kubernetes、VM 和云服务的一致策略。通常是企业级决策，而不仅仅是针对 Kubernetes。

## 比较：网络策略 vs 服务网格 vs ABAC 防火墙

| 功能 | 网络策略 | 服务网格 | ABAC 防火墙 |
|---------|---------------|--------------|---------------|
| **层级** | 第 3/4 层（IP/端口） | 第 7 层（HTTP/gRPC） | 第 3-7 层 |
| **复杂性** | 低 | 高 | 中 |
| **性能影响** | 最小 | 1-5 毫秒延迟 | 不一定 |
| **成本** | 免费（内置） | 资源开销 | 许可成本 |
| **加密** | 否（需要单独解决方案） | 包含双向 TLS | 取决于产品 |
| **可观察性** | 基本（取决于 CNI） | 优秀 | 良好 |
| **Kubernetes 原生** | 是 | 是 | 否 |
| **学习曲线** | 平缓 | 陡峭 | 中等 |
| **最适合** | 基本隔离 | 微服务安全 | 混合环境 |

## 实际实现

让我们通过一个实际示例：保护三层应用程序。

**架构**：
- 前端 Pod（面向公众）
- 后端 API Pod（内部）
- 数据库 Pod（敏感数据）

**安全要求**：
- 前端只能与后端 API 通信
- 后端 API 只能与数据库通信
- 数据库仅接受来自后端的连接
- 除了前端（用于 CDN 资产）外，没有 Pod 可以访问互联网

**实现**：

```yaml
# 默认拒绝所有流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# 允许前端接收外部流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - namespaceSelector: {}
      podSelector: {}
    ports:
    - protocol: TCP
      port: 443  # 允许 HTTPS 用于 CDN

---
# 允许后端仅与数据库通信
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          tier: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53  # 允许 DNS

---
# 数据库仅接受来自后端的连接
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - protocol: TCP
      port: 5432
```

这种设置建立了清晰的边界。即使攻击者入侵了前端，他们也无法直接访问数据库。他们需要同时入侵前端和后端才能接触到敏感数据——显著提高了门槛。

!!!warning "⚠️ 别忘了 DNS"
    一个常见的错误是忘记允许 DNS 流量。Pod 需要将服务名称解析为 IP 地址。始终包含 kube-dns 或 CoreDNS 的出站规则，通常在 UDP 端口 53 上。

## 入门指南

实现网络策略不必是全有或全无。以下是务实的方法：

**1. 验证 CNI 支持**：并非所有容器网络接口（CNI）插件都支持网络策略。Calico、Cilium 和 Weave Net 支持。AWS VPC CNI 和 Azure CNI 需要额外配置。检查您的 CNI 文档。

**2. 从监控开始**：在强制执行策略之前，以审计模式部署它们（如果您的 CNI 支持），或使用 [Cilium Hubble](https://github.com/cilium/hubble) 等工具可视化现有流量模式。

**3. 从全部拒绝开始**：在非关键命名空间中创建默认的全部拒绝策略。这会强制您明确允许必要的流量，揭示您的实际通信模式。

**4. 逐步加入白名单**：一次添加一个允许规则，每次更改后进行测试。从明显的流程（前端 → 后端）开始，然后处理边缘情况。

**5. 自动化测试**：使用 [netassert](https://github.com/controlplaneio/netassert) 等工具为您的网络策略编写测试。这可以防止策略更改时的回归。

**6. 文档化和版本控制**：将策略与应用程序清单一起存储在 Git 中。记录每个规则存在的原因。未来的您（或您的团队成员）会感谢您。

!!!tip "🛠️ 有用的工具"
    - **[Cilium Editor](https://editor.cilium.io/)**：可视化网络策略编辑器
    - **[Network Policy Viewer](https://github.com/runoncloud/kubectl-np-viewer)**：将策略可视化为图形
    - **[Inspektor Gadget](https://github.com/inspektor-gadget/inspektor-gadget)**：实时调试网络流量
    - **[Calico Enterprise](https://www.tigera.io/tigera-products/calico-enterprise/)**：高级策略管理（商业版）

## 结论

Kubernetes 网络策略对企业来说不是可选的。它是集群安全的基础，是防止横向移动的第一道防线，也是受监管行业的合规要求。

是的，有替代方案——服务网格提供更多功能，ABAC 防火墙提供更广泛的覆盖范围——但网络策略内置于 Kubernetes，不需要额外的基础设施，并解决了最关键的问题：防止不受限制的 Pod 间通信。

从简单开始。部署默认拒绝策略。将必要的流量加入白名单。彻底测试。您的安全团队、合规审计员和未来的事件响应人员会感谢您。

在 Kubernetes 中，默认是信任。对于企业来说，标准必须是零信任。网络策略就是您实现这一目标的方式。
