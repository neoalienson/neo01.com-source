---
title: 以認證為中心的 DevSecOps - 強化企業軟體開發
date: 2024-11-16
categories:
  - Cybersecurity
thumbnail: banner.jpeg
thumbnail_80: icon.png
lang: zh-TW
excerpt: 供應鏈攻擊激增,團隊孤島作戰,工具分散——探索以認證為中心的DevSecOps如何統一企業安全實踐。
---

![](/2024/11/Attestation-Centric-Dev-Sec-Ops-Fortifying-Enterprise-Software-Development/index.jpeg)

企業內部對於能夠將軟體工件追溯回其原始原始碼和建置指令的可靠方法的需求日益增長，這是由供應鏈攻擊的增加所驅動的。這種需求也適用於其他常見的企業情境，例如孤立的團隊合作和 DevSecOps 實踐的多樣化。雖然企業通常可以使用市場上廣泛的 DevSecOps 工具，但他們採用的工具越多，他們的流程往往變得越分散和孤立。

## 工具困境：整合過載

一旦企業配備了廣泛的 DevSecOps 工具陣列，下一個挑戰就是整合它們以最小化分散。市場提供了眾多工具，每個都聲稱是安全挑戰的終極解決方案。然而，實際上，沒有單一工具可以全面解決所有問題。關鍵挑戰是建立一個凝聚的生態系統，讓這些工具和諧運作，確保軟體交付的透明和高效管道。

{% mermaid %}
graph TB
    subgraph Frag["傳統分散方法"]
    Code1[程式碼儲存庫] --> Tool1[Snyk]
    Code1 --> Tool2[Checkmarx]
    Code1 --> Tool3[Prisma Cloud]
    Tool1 -.x|手動整合|.-> Portal1[開發者入口]
    Tool2 -.x|手動整合|.-> Portal1
    Tool3 -.x|手動整合|.-> Portal1
    Portal1 -.x|分散資料|.-> Team1[安全團隊]
    end
    
    Frag -.->|轉型| Unified
    
    subgraph Unified["認證統一方法"]
    Code2[程式碼儲存庫] --> Att1[Snyk + 認證]
    Code2 --> Att2[Checkmarx + 認證]
    Code2 --> Att3[Prisma Cloud + 認證]
    Att1 -->|簽署認證| Store[認證儲存]
    Att2 -->|簽署認證| Store
    Att3 -->|簽署認證| Store
    Store -->|統一視圖| Team2[安全團隊]
    end
    
    style Tool1 fill:#ff6b6b,stroke:#c92a2a
    style Tool2 fill:#ff6b6b,stroke:#c92a2a
    style Tool3 fill:#ff6b6b,stroke:#c92a2a
    style Portal1 fill:#ffd43b,stroke:#fab005
    style Att1 fill:#51cf66,stroke:#2f9e44
    style Att2 fill:#51cf66,stroke:#2f9e44
    style Att3 fill:#51cf66,stroke:#2f9e44
    style Store fill:#4dabf7,stroke:#1971c2
{% endmermaid %}

許多企業選擇開發自己的開發者入口，整合或使用這些工具的掃描報告，並為開發者和安全工程師提供統一視圖。這種方法允許集中管理漏洞、合規性檢查和其他安全相關任務。然而，它需要**大量投資**於開發和維護。如果沒有適當的整合和無縫的工作流程，這些工具可能成為開發團隊的噩夢。此外，不同的開發團隊通常對其軟體開發生命週期（SDLC）有不同的工具；例如，行動開發團隊可能使用專門的掃描工具。

## 什麼是認證？

!!!info "🔐 理解認證"
    認證是一組工具和實踐，使 SDLC 中的每個步驟都能在軟體工件和產生它們的流程之間建立安全且可驗證的連結。這些認證作為防篡改、不可偽造的紙本追蹤，詳細記錄軟體創建過程的每個步驟，從程式碼提交到建置和部署。

### 認證流程

讓我們通過將其分解為易於理解的步驟來探索認證的工作原理：

**步驟 1：元資料收集**

創建工件認證的過程通常涉及產生加密簽署的聲明，證明軟體建置的來源。這包括以下資訊：
- 與工件相關的工作流程
- 儲存庫和組織
- 環境詳細資訊
- 提交 SHA
- 建置的觸發事件

我們將這些資訊稱為**元資料**。

**步驟 2：加密簽署**

然後將元資料打包成加密簽署的工件認證，可以儲存在受信任的儲存庫中或分發給軟體的消費者。這個過程確保軟體建置及其相關元資料的來源是可驗證和防篡改的。

**步驟 3：驗證**

任何人都可以使用公鑰驗證認證，確保工件沒有被篡改並來自受信任的來源。

### 區塊鏈連結

!!!anote "🔗 認證和區塊鏈：相似的原則"
    將認證想像成區塊鏈技術——兩者都創建不可變的記錄鏈。在區塊鏈中，每個區塊包含前一個區塊的加密雜湊，使其防篡改。同樣，認證為您的軟體創建加密的監管鏈：
    
    - **不可變性**：一旦簽署，認證無法在不被檢測的情況下更改
    - **透明度**：任何有訪問權限的人都可以驗證監管鏈
    - **去中心化**：沒有單點故障或信任
    - **加密證明**：數學確定性而不是基於信任的驗證
    
    然而，與區塊鏈不同，認證不需要分散式共識或挖礦——它們輕量、快速，專門為軟體供應鏈安全設計。

{% mermaid %}
sequenceDiagram
    participant Dev as 開發者
    participant Repo as 程式碼儲存庫
    participant Build as 建置系統
    participant Sign as 簽署服務
    participant Store as 認證儲存
    participant Verify as 驗證器
    
    Dev->>Repo: 提交程式碼
    Repo->>Build: 觸發建置
    Build->>Build: 收集元資料
    Build->>Sign: 請求簽署
    Sign->>Sign: 產生加密簽章
    Sign->>Store: 儲存簽署認證
    Store->>Verify: 提供認證
    Verify->>Verify: 驗證簽章
    Verify->>Verify: ✓ 認證有效
{% endmermaid %}

認證和元資料的概念在業界已經存在了幾十年，但直到最近我們才開始看到更多工具和服務出現來支援這一點。例如，GitHub 最近推出了工件認證的[公開測試版](https://github.blog/2024-05-02-introducing-artifact-attestations-now-in-public-beta/)。

## 認證如何拯救局面

以認證為中心的 DevSecOps 將分散的工具環境轉變為統一、可驗證的生態系統。認證不是強制工具直接相互整合，而是創建所有工具都可以使用的通用語言。

### 用共享證據打破孤島

想像 Sarah，一家大型金融機構的安全工程師。她的團隊使用 Snyk 進行漏洞掃描，而行動團隊偏好 Checkmarx，基礎設施團隊依賴 Prisma Cloud。以前，關聯這些團隊的安全發現需要手動工作，通常導致覆蓋範圍的差距。

使用以認證為中心的 DevSecOps，每個工具都會產生關於其發現的加密簽署認證。當 Sarah 需要評估使用共享基礎設施元件的行動應用程式的安全態勢時，她可以通過認證追蹤完整的安全旅程：

{% mermaid %}
graph TB
    A[程式碼提交] -->|程式碼認證| B[來源已驗證]
    B -->|建置認證| C[建置已驗證]
    C -->|掃描認證| D[安全已掃描]
    D -->|部署認證| E[已部署]
    
    B -.->|作者身份<br/>程式碼完整性| Info1[" "]
    C -.->|建置環境<br/>建置流程| Info2[" "]
    D -.->|Snyk 發現<br/>Checkmarx 結果<br/>Prisma Cloud 報告| Info3[" "]
    E -.->|環境配置<br/>部署時間| Info4[" "]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#51cf66,stroke:#2f9e44
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
    style Info1 fill:none,stroke:none
    style Info2 fill:none,stroke:none
    style Info3 fill:none,stroke:none
    style Info4 fill:none,stroke:none
{% endmermaid %}

!!!success "✅ 實際運作的認證類型"
    - **程式碼認證**：確認原始碼完整性和作者身份
    - **建置認證**：驗證建置環境和流程
    - **掃描認證**：記錄來自多個工具的安全發現
    - **部署認證**：記錄部署環境和配置

### 供應鏈透明度變得簡單

從 SolarWinds 到 Log4j 的供應鏈攻擊激增，使企業敏銳地意識到他們的盲點。傳統方法通常依賴軟體物料清單（SBOM），但這些是靜態快照，無法捕捉現代軟體開發的動態性質。

以認證為中心的方法提供了活生生的審計追蹤。當在第三方函式庫中發現新漏洞時，安全團隊可以通過查詢認證快速識別所有受影響的應用程式，而不是手動檢查每個專案的依賴項。

## 實際實施：三大支柱

{% mermaid %}
graph TB
    subgraph "支柱 1：標準化元資料"
    Tools[DevSecOps 工具] -->|產生| Meta[標準化認證]
    end
    
    subgraph "支柱 2：加密驗證"
    Meta -->|簽署| Crypto[加密簽署]
    end
    
    subgraph "支柱 3：可查詢儲存"
    Crypto -->|儲存| Store[認證儲存]
    Store -->|查詢| Q1["誰建置了這個？"]
    Store -->|查詢| Q2["有什麼漏洞？"]
    Store -->|查詢| Q3["執行了哪些掃描？"]
    end
    
    style Meta fill:#4dabf7,stroke:#1971c2
    style Crypto fill:#51cf66,stroke:#2f9e44
    style Store fill:#ffd43b,stroke:#fab005
    style Q1 fill:#e7f5ff,stroke:#1971c2
    style Q2 fill:#e7f5ff,stroke:#1971c2
    style Q3 fill:#e7f5ff,stroke:#1971c2
{% endmermaid %}

!!!tip "🏛️ 支柱 1：標準化元資料收集"
    DevSecOps 管道中的每個工具都應該以標準化格式產生認證。這並不意味著替換現有工具——而是用認證能力增強它們。
    
    標準化確保所有工具使用相同的語言，使整合無縫並降低管理多個安全工具的複雜性。

!!!example "📄 認證元資料範例"
    這個 YAML 結構遵循 SLSA（軟體工件供應鏈等級）來源格式，正在成為業界標準。它捕捉：
    - **主體**：正在認證的工件（名稱和加密摘要）
    - **謂詞類型**：正在使用的認證格式
    - **建置者資訊**：誰/什麼創建了工件
    - **來源資訊**：程式碼來自哪裡
    
```yaml
# 認證元資料範例
subject:
  name: "myapp:v1.2.3"
  digest: "sha256:abc123..."
predicateType: "https://slsa.dev/provenance/v0.2"
predicate:
  builder:
    id: "https://github.com/actions"
  buildType: "https://github.com/actions/workflow"
  invocation:
    configSource:
      uri: "git+https://github.com/myorg/myapp"
      digest: "sha1:def456..."
```

!!!tip "🔒 支柱 2：加密驗證"
    所有認證都必須加密簽署以確保完整性和不可否認性。這創建了一個不可變的監管鏈，可以抵禦複雜的攻擊。
    
    將其視為數位印章，證明：
    - 認證沒有被篡改
    - 它來自受信任的來源
    - 它在特定時間點創建

!!!tip "🔍 支柱 3：可查詢認證儲存"
    認證資料應該儲存在集中的、可查詢的系統中，允許安全團隊提出複雜的問題，例如：
    - 「顯示過去 30 天內由外部貢獻者提交的程式碼建置的所有應用程式」
    - 「哪些部署包含函式庫 X 的易受攻擊版本？」
    - 「在生產部署之前對此工件執行了哪些安全掃描？」
    
    這將安全性從被動轉變為主動——您可以在事件發生之前回答問題。

## 前進之路：從小處著手，大處著眼

!!!success "🚀 實施路線圖"
    實施以認證為中心的 DevSecOps 不需要完全改造現有基礎設施。從這些實際步驟開始：
    
    1. **從建置認證試點開始**：首先為最關鍵的應用程式產生建置來源認證
    2. **逐步整合**：一次一個地為現有安全工具添加認證能力
    3. **建立政策**：定義不同類型部署所需的認證
    4. **培訓團隊**：確保開發者和安全工程師了解如何解釋和使用認證資料

{% mermaid %}
graph LR
    A[第 1-2 週<br/>試點建置<br/>認證] --> B[第 3-4 週<br/>添加安全<br/>掃描認證]
    B --> C[第 5-6 週<br/>整合<br/>部署認證]
    C --> D[第 7-8 週<br/>建立<br/>政策]
    D --> E[持續<br/>培訓與改進]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#4dabf7,stroke:#1971c2
    style C fill:#4dabf7,stroke:#1971c2
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 結論：通過透明度建立信任

在軟體供應鏈持續受到威脅且企業開發團隊在日益複雜的環境中運作的時代，以認證為中心的 DevSecOps 提供了通往安全和營運效率的道路。通過為軟體開發生命週期的每個步驟創建可驗證的加密證據，組織可以從希望其安全措施有效轉變為知道它們有效。

企業軟體安全的未來不是擁有更多工具——而是更好地了解這些工具如何協同工作以保護您的組織。以認證為中心的 DevSecOps 提供了這種可見性，一次一個加密簽章。

*準備為您的組織探索以認證為中心的 DevSecOps？首先評估您當前的工具環境，並識別為最關鍵的開發管道添加認證能力的機會。*
