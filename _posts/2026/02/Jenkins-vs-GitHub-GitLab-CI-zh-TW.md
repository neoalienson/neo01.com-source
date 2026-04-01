---
title: "Jenkins vs GitHub Actions vs GitLab CI：純 CI 視角的比較"
date: 2026-02-26
categories:
  - Development
tags:
  - Jenkins
  - Platform Engineering
excerpt: "在選擇 CI 平台？跳過行銷話術。本文純粹從持續整合的角度分析 Jenkins、GitHub Actions 和 GitLab CI——效能、維護、開發者體驗和實際的權衡取捨。"
lang: zh-TW
available_langs:
  - zh-CN
thumbnail: /assets/jenkins/thumbnail.png
thumbnail_80: /assets/jenkins/thumbnail_80.png
canonical_lang: en
canonical_url: /2026/02/Jenkins-vs-GitHub-GitLab-CI.html
comments: true
---

你的 CI 平台是工程速度的心跳。每個提交都會觸發它。每個 PR 都依賴它。每個開發者每天都要與它互動多次。

然而，團隊選擇 CI 工具的原因往往是錯誤的：
- 「我們已經有 Jenkins 了」（沉沒成本謬誤）
- 「GitHub Actions 對小團隊免費」（直到不是為止）
- 「GitLab CI 是整合的」（但它夠好嗎？）

這個比較穿透了噪音。沒有 CD 偏見。沒有供應商行銷。只有**純 CI**：建置、測試、lint、掃描、打包。

以下是 CI 真正重要的事項，以及每個平台如何交付。

---

## 1 什麼是「純 CI」？

**持續整合** 是一種自動建置和測試每個提交的實踐。目標：早期發現錯誤、確保程式碼品質，並為開發者提供快速回饋。

**純 CI 範圍：**

| 階段 | 做什麼 | 典型持續時間 |
|-------|--------------|------------------|
| **Checkout** | 從 Git 獲取程式碼 | 10-30 秒 |
| **Build** | 編譯、打包、容器化 | 2-10 分鐘 |
| **Unit Tests** | 快速、隔離的測試 | 1-5 分鐘 |
| **Integration Tests** | 多組件測試 | 5-15 分鐘 |
| **Lint/Format** | 程式碼品質檢查 | 30 秒 - 2 分鐘 |
| **Security Scan** | SAST、依賴掃描 | 1-5 分鐘 |
| **Artifact Upload** | 推送到 registry/repository | 1-3 分鐘 |

**CI 不是什麼：**
- ❌ 部署到生產環境（那是 CD）
- ❌ 配置基礎設施（那是 GitOps/IaC）
- ❌ 管理環境（那是 Environment on Demand）

!!! info "為什麼這很重要"
    許多 CI/CD 比較將 **CI 能力**（建置/測試）與 **CD 能力**（部署/發布）混淆。這導致錯誤的決策：

    - 因為 CD 外掛程式而選擇 Jenkins，但你只需要 CI
    - 因為 GitHub Actions「靠近程式碼」而選擇它，卻沒有評估 CI 效能
    - 因為整合而選擇 GitLab CI，卻沒有在大規模下測試 CI 速度

    本文**只關注 CI**。CD 是另一個話題。

範圍定義完畢，讓我們建立 CI 平台真正重要的評估標準。

---

## 2 評估標準：什麼讓 CI 變好？

### 核心指標

| 指標 | 為什麼重要 | 目標 |
|--------|----------------|--------|
| **回饋時間** | 開發者等待 CI 時會失去上下文 | 80% 的運行 < 10 分鐘 |
| **可靠性** | 不穩定的 CI 會摧毀信任 | > 99% 正常運行時間，< 1% 不穩定率 |
| **成本可預測性** | CI 成本隨團隊規模擴展 | 已知的每月成本，無意外 |
| **維護開銷** | CI 應該賦能開發者，而非阻礙他們 | < 4 小時/週 運營時間 |
| **開發者體驗** | 摩擦會減緩交付速度 | 直觀的配置，清晰的錯誤 |
| **可擴展性** | CI 必須處理並發的 PR | 高峰時期無排隊時間 |

### 次要考慮因素

| 因素 | 重要性 | 備註 |
|--------|------------|-------|
| **外掛程式生態系統** | 中 | 僅在你需要特定整合時才重要 |
| **供應商鎖定** | 低 - 中 | CI 配置通常是可移植的 |
| **本地部署支持** | 低 | 大多數團隊現在是雲原生的 |
| **CD 功能** | 範圍外 | 需要單獨評估 |

現在讓我們通過這個 CI 專注的視角來檢查每個平台。

---

## 3 Jenkins：自託管的可靠選擇

### 架構

```
Developer → GitHub/GitLab → Jenkins Master → Jenkins Agents → Build/Test
                                    ↓
                              Shared Storage (Artifacts)
```

**部署模型：** 自託管（VM、Kubernetes 或裸機）

### CI 優勢

**1. 無限的靈活性**

```groovy
// Jenkinsfile - 完整的程式控制
pipeline {
    agent { label 'linux-large' }

    environment {
        BUILD_ID = "${env.BUILD_NUMBER}"
        REGISTRY = credentials('docker-registry')
    }

    stages {
        stage('Build') {
            steps {
                sh 'docker build -t app:${BUILD_ID} .'
            }
        }

        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps { sh 'make test-unit' }
                }
                stage('Integration Tests') {
                    steps { sh 'make test-integration' }
                }
                stage('Security Scan') {
                    steps { sh 'trivy image app:${BUILD_ID}' }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/target/*.jar'
            cleanWs()
        }
    }
}
```

**為什麼重要：** 你可以實現**任何 CI 邏輯**——Jenkinsfile 支持 Groovy 腳本、共享函式庫和自訂外掛程式。

---

**2. 成本控制**

```
EC2 上自託管的 Jenkins：
  - Master: t3.medium ($0.0416/小時)
  - Agents: 自動擴展的 spot instances ($0.01-0.03/小時)
  - Storage: EBS volumes ($0.10/GB-月)

5000 次建置的每月成本：~$200-400
```

**可預測的定價：** 你支付的是基礎設施費用，而不是每次建置的分鐘數。

---

**3. Agent 靈活性**

```yaml
# 不同工作負載的 Agent 標籤
agents:
  - label: "linux-small"   # 快速 linting、單元測試
  - label: "linux-large"   # 重型建置、整合測試
  - label: "windows"       # .NET 建置
  - label: "gpu"           # ML 模型訓練
  - label: "arm64"         # 跨平台建置
```

**自帶 runner：** 任何機器都可以成為 Jenkins agent——EC2、Kubernetes pods、本地伺服器，甚至是開發者的筆記型電腦用於本地測試。

---

**4. 成熟的外掛程式生態系統**

| 外掛程式類別 | 可用的外掛程式 |
|-----------------|-------------------|
| 來源控制 | Git、SVN、Mercurial、Perforce |
| 建置工具 | Maven、Gradle、npm、pip、cargo |
| 測試 | JUnit、pytest、Jest、Cypress |
| 安全 | SonarQube、Snyk、Checkmarx |
| 通知 | Slack、Teams、Email、PagerDuty |
| Artifact 存儲 | Nexus、Artifactory、S3、Docker Registry |

更新中心有**1800+ 外掛程式**。如果工具存在，Jenkins 就能與它整合。

### CI 弱點

**1. Groovy 問題：能力還是負擔？**

```groovy
// Jenkinsfile - 你可以撰寫完整的程式邏輯
def buildMatrix = [:]
['dev', 'staging', 'prod'].each { env ->
    buildMatrix[env] = {
        node("agent-${env}") {
            try {
                checkout scm
                def config = load "config/${env}.groovy"
                parallel config.steps.collect { step ->
                    { ->
                        timeout(time: config.timeout, unit: 'MINUTES') {
                            sh "${step.command}"
                        }
                    }
                }
            } catch (Exception e) {
                currentBuild.result = 'FAILURE'
                emailext subject: "Build failed: ${env}",
                         body: "Error: ${e.message}",
                         to: config.notifyEmail
                throw e
            }
        }
    }
}
parallel buildMatrix
```

**Groovy 是優勢嗎？** 取決於情況。

| 方面 | 現實 |
|--------|-------------|
| **能力** | ✅ Turing-complete。你可以實現任何 CI 邏輯。 |
| **學習曲線** | ❌ 大多數開發者知道 JavaScript/Python，而不是 Groovy。 |
| **除錯** | ❌ 堆疊追蹤是 Java/Groovy 混合體。難以解析。 |
| **測試** | ⚠️ 你可以對 Jenkinsfiles 進行單元測試，但很少有團隊這樣做。 |
| **程式碼審查** | ❌ 複雜的 pipeline 變成「只有 Sarah 懂的那個東西」。 |
| **招聘** | ❌ 2026 年大多數簡歷上沒有「Jenkins + Groovy」。 |

**巴士係數問題：**

```
8 人開發團隊：
  - 2 人可以從頭撰寫新的 Jenkinsfiles
  - 4 人可以修改現有的 pipeline
  - 2 人只能閱讀/理解它們

當 Sarah 離職時：誰來維護 500 行的共享函式庫？
```

**與基於 YAML 的 CI 比較：**

```yaml
# GitHub Actions - 宣告式、受限但可讀
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - uses: actions/checkout@v4
      - run: make build
        env:
          TARGET_ENV: ${{ matrix.environment }}
```

**權衡：** 你失去了程式靈活性，但獲得了：
- 所有開發者的可讀性
- 更容易的入職
- 更低的巴士係數風險

**Groovy 的結論：**

| 情境 | Groovy 是... |
|----------|--------------|
| 複雜、動態的 CI 邏輯 | ✅ 超能力 |
| 標準的建置/測試/部署 | ❌ 過度設計 |
| 大型團隊有人員流動 | ❌ 負債 |
| 小型團隊、成員穩定 | ⚠️ 可接受 |
| 受監管的行業（審計追蹤） | ✅ 可追蹤的邏輯 |

!!! question "🤔 所以你應該避免 Groovy 嗎？"
    不——但要有 intentionality：

    - **使用 Groovy** 如果你需要動態 pipeline、複雜的編排或自訂整合
    - **避免 Groovy** 如果你的 CI 是標準的（建置 → 測試 → 發布）
    - **大量文件** 如果你選擇 Groovy 路線（共享函式庫需要文件）
    - **培訓團隊** 讓不止一個人理解 pipeline 邏輯

---

**2. 維護開銷**

```bash
# Jenkins 現實檢查
$ kubectl get pods -n jenkins
NAME                            READY   STATUS    RESTARTS
jenkins-controller-0            1/1     Running   12 last week
jenkins-agent-pool-deployment   3/3     Running   0
```

**你簽下的是什麼：**

| 任務 | 頻率 | 所需時間 |
|------|-----------|---------------|
| Jenkins 升級 | 每月 | 1-2 小時 |
| 外掛程式更新 | 每週 | 2-4 小時 |
| Agent 疑難排解 | 視需要 | 1-3 小時/週 |
| 磁碟空間管理 | 每週 | 1 小時 |
| 安全補丁 | 每月 | 2-3 小時 |

**總運營開銷：** 單個 Jenkins 實例每月 8-15 小時。

---

**2. 配置複雜性**

```groovy
// 共享函式庫 (vars/buildAndTest.groovy)
def call(Map config = [:]) {
    def name = config.get('name', 'default')
    def timeout = config.get('timeout', 30)

    node('linux') {
        timeout(time: timeout, unit: 'MINUTES') {
            try {
                checkout scm
                sh "make build NAME=${name}"
                sh "make test NAME=${name}"
            } catch (Exception e) {
                currentBuild.result = 'FAILURE'
                throw e
            }
        }
    }
}

// 使用共享函式庫的 Jenkinsfile
@Library('my-shared-lib') _
buildAndTest(name: 'backend', timeout: 45)
```

**學習曲線：**
- Groovy 語法（大多數開發者不熟悉）
- 共享函式庫模式
- 外掛程式相容性矩陣
- Agent 標籤管理
- 憑證範圍劃分

---

**3. 回饋時間變異性**

```
Build #101: 8 分鐘   (快取暖、agent 可用)
Build #102: 23 分鐘  (快取冷、排隊等待 agent)
Build #103: 15 分鐘  (部分快取、spot instance 搶占)
```

**為什麼會變化：**
- Agent 可用性（排隊時間）
- 快取暖/冷狀態
- 共享資源競爭
- 到 artifact 存儲的網絡延遲

**結果：** 開發者無法預測 CI 持續時間。

---

**4. UI/UX 債務**

| 方面 | Jenkins 現實 |
|--------|-----------------|
| 建置日誌 | 純文字，大輸出時載入緩慢 |
| Pipeline 可視化 | Blue Ocean 更好但感覺是強加的 |
| 錯誤訊息 | 通常是神秘的堆疊追蹤 |
| 移動體驗 | 不存在 |
| 搜尋 | 僅限建置編號和狀態 |

**開發者感受：** 「Jenkins 能用，但我害怕使用它。」

### Jenkins CI 評分卡

| 指標 | 評分 | 備註 |
|--------|-------|-------|
| 回饋時間 | ⚠️ 可變 | 取決於條件 8-25 分鐘 |
| 可靠性 | ✅ 好 | 正確配置後穩定 |
| 成本可預測性 | ✅ 優秀 | 基礎設施成本可預測 |
| 維護 | ❌ 高 | 每月 8-15 小時運營開銷 |
| 開發者體驗 | ⚠️ 混合 | 強大但複雜 |
| 可擴展性 | ⚠️ 手動 | 需要容量規劃 |

**最適合：** 有專職 DevOps 資源、複雜 CI 需求或嚴格本地部署需求的團隊。

**最不適合：** 小型團隊、初創公司或想要「CI 就能用」的組織。

---

## 4 GitHub Actions：開發者優先的選擇

### 架構

```
Developer → GitHub PR → GitHub Actions Runner → Build/Test
                        ↓
                  GitHub Packages (Artifacts)
```

**部署模型：** SaaS (github.com) 或自託管 runner

### CI 優勢

**1. 零設置**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm test
```

**就是這樣。** 沒有伺服器。沒有 agent。沒有維護。推送程式碼 → CI 運行。

---

**2. 緊密的 GitHub 整合**

| 功能 | 優勢 |
|---------|---------|
| **PR 狀態檢查** | CI 結果直接出現在 PR UI 中 |
| **必要檢查** | 在 CI 通過前阻止合併 |
| **Action 評論** | 機器人可以在 PR 上評論測試結果 |
| **Workflow 觸發** | 在 PR 開啟、同步、標籤、評論時運行 |
| **秘密掃描** | 內建的程式碼秘密檢測 |

**開發者工作流：**

```
1. 開發者開啟 PR
2. CI 自動觸發
3. 結果在幾秒內出現在 PR 中
4. 綠色勾號 → 準備審查
5. 紅色 X → 點擊查看失敗
```

無需上下文切換。無需儀表板搜尋。

---

**3. Action 市場**

```yaml
# 來自市場的可重用 actions
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
  - uses: aws-actions/configure-aws-credentials@v4
  - uses: docker/setup-buildx-action@v3
  - uses: sonarsource/sonarqube-scan-action@v3
```

**30,000+ actions** 可用。最常見的 CI 任務只需一個 `uses:` 語句。

---

**4. 矩阵建置**

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node: [18, 20, 22]
    exclude:
      - os: macos-latest
        node: 18

runs-on: ${{ matrix.os }}
```

**自動生成 8 個並行作業**。非常適合跨平台測試。

---

**5. 內建快取**

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

**快取命中：** 後續運行可減少 60-80% 的建置時間。

### CI 弱點

**1. 大規模的成本**

```
GitHub Actions 定價（按量付費）：
  - 免費層：2,000 分鐘/月
  - 超額：$0.008/分鐘 (Linux), $0.016/分鐘 (macOS)

50 人開發團隊：
  - 平均 20 次建置/開發者/天 × 10 分鐘/建置
  - 1000 次建置/天 × 22 天 = 22,000 次建置/月
  - 22,000 × 10 分鐘 = 220,000 分鐘
  - 成本：218,000 × $0.008 = $1,744/月
```

**自託管 runner 可降低成本** 但會增加維護開銷。

---

**2. Runner 限制**

| 限制 | 影響 |
|------------|--------|
| **最長作業持續時間：** 6 小時 | 長時間運行的測試可能超時 |
| **最大矩陣大小：** 256 作業 | 大型測試矩陣需要分片 |
| **存儲：** 每個 workflow 10GB | Artifact 保留限制 |
| **並發作業：** 取決於方案 | 免費：20, 專業：40, 企業：180 |
| **無持久狀態** | 每個作業從頭開始 |

**需要變通方法：**
- 長時間運行的整合測試（> 6 小時）
- 大型 artifact 存儲（> 10GB）
- 有狀態建置（增量編譯）

---

**3. YAML 複雜性**

```yaml
# 簡單的 CI 很快變得複雜
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  build:
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

**YAML 蔓延：** CI workflow 很快增長到 200+ 行。可重用性需要複合 actions 或可重用 workflow（更多的 YAML）。

---

**4. 除錯挑戰**

```
[CI 失敗] 作業 "test" 失敗，退出碼 1

日誌：
> npm run test:integration
> jest --config jest.integration.config.js

FAIL src/integration/payment.test.js
  ● Payment Integration › processes payment successfully

    Error: connect ECONNREFUSED 127.0.0.1:5432

    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)

測試運行完成。1 失敗，47 通過。
```

**除錯限制：**
- 無法 SSH 訪問 runner（除非使用除錯 actions）
- 事後分析有限
- 日誌在保留期後消失（最多 90 天）
- 無法在相同環境下重放失敗的作業

---

**5. 供應商鎖定**

| 鎖定方面 | 嚴重性 |
|----------------|----------|
| **Workflow 語法** | 中（YAML 可移植，但 GitHub 特定功能不可移植） |
| **Action 依賴** | 低（大多數 actions 是開源的） |
| **GitHub Packages** | 中（如果切換需要遷移） |
| **秘密管理** | 低（標準模式） |
| **Runner 基礎設施** | 高（如果使用 GitHub 託管的 runner） |

**遷移成本：** 從 GitHub Actions 遷移到另一個 CI 平台需要重寫 workflow 並重新培訓團隊。

### GitHub Actions 評分卡

| 指標 | 評分 | 備註 |
|--------|-------|-------|
| 回饋時間 | ✅ 好 | 通常 5-15 分鐘 |
| 可靠性 | ✅ 優秀 | GitHub 基礎設施穩健 |
| 成本可預測性 | ⚠️ 可變 | 隨使用量擴展，可能意外 |
| 維護 | ✅ 優秀 | 零運營開銷 |
| 開發者體驗 | ✅ 優秀 | 直觀、整合 |
| 可擴展性 | ✅ 好 | 自動擴展，但有並發限制 |

**最適合：** 已經在 GitHub 上的團隊、初創公司、重視開發者體驗勝過成本控制的專案。

**最不適合：** 大規模下對成本敏感的組織、需要長時間運行作業或自訂 runner 配置的團隊。

---

## 5 GitLab CI：整合平台

### 架構

```
Developer → GitLab Push → GitLab Runner → Build/Test
                        ↓
                  GitLab Registry (Artifacts)
```

**部署模型：** SaaS (gitlab.com) 或自管理

### CI 優勢

**1. 單一配置文件**

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - build
  - security

variables:
  NODE_VERSION: "20"
  DOCKER_REGISTRY: registry.gitlab.com

lint:
  stage: lint
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run lint
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

test:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - postgres:15
  script:
    - npm ci
    - npm run test:unit
    - npm run test:integration
  variables:
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/test
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

security-scan:
  stage: security
  image: registry.gitlab.com/security-products/semgrep:latest
  variables:
    SEMGREP_RULES: "auto"
  script:
    - /analyzer run
  artifacts:
    reports:
      sast: gl-sast-report.json
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

**一切都在一個文件中：** linting、測試、建置、安全掃描。不需要單獨的 CD 配置。

---

**2. Auto DevOps**

```
GitLab 可以自動檢測你的專案並自動配置 CI/CD：

1. 語言檢測 (Node.js、Python、Go、Java 等)
2. 框架檢測 (React、Django、Spring 等)
3. 數據庫檢測 (PostgreSQL、MySQL、Redis)
4. 自動生成 CI/CD pipeline
5. 每個 MR 部署到 review apps
```

**零配置 CI：** 對於常見技術棧開箱即用。

---

**3. 內建功能**

| 功能 | 包含 |
|---------|----------|
| **容器 Registry** | ✅ 是（整合） |
| **套件 Registry** | ✅ 是（npm、Maven、PyPI 等） |
| **安全掃描** | ✅ 是（SAST、DAST、依賴掃描） |
| **程式碼品質** | ✅ 是（基於 diff 的品質報告） |
| **測試報告** | ✅ 是（JUnit、覆蓋率可視化） |
| **依賴管理** | ✅ 是（漏洞報告） |

**無需外掛程式搜尋：** 一切開箱即用。

---

**4. Runner 靈活性**

```yaml
# GitLab Runner 配置
[[runners]]
  name = "docker-pool"
  url = "https://gitlab.com/"
  executor = "docker"
  [runners.docker]
    image = "docker:24"
    privileged = true
    disable_cache = false
    volumes = ["/cache"]
    shm_size = 0
  [runners.cache]
    Type = "s3"
    Shared = true
```

**Runner 類型：**
- **Shared runners：** GitLab 管理 (gitlab.com)
- **Group runners：** 跨專案共享
- **Project runners：** 專用於特定專案
- **Self-hosted：** 你自己的基礎設施

---

**5. Pipeline 可視化**

```
Pipeline #12345 - main branch
┌─────────┬─────────┬─────────┬─────────┐
│  lint   │  test   │  build  │ security│
│   ✅    │   ✅    │   ✅    │   ✅    │
│  1:23   │  4:56   │  2:34   │  1:45   │
└─────────┴─────────┴─────────┴─────────┘
Total duration: 10:38
```

**清晰的可視化：** 在一個視圖中查看所有階段、作業和持續時間。

### CI 弱點

**1. 緊密耦合**

```
GitLab CI 是為 GitLab 設計的。與 GitHub 或 Bitbucket 一起使用：
  - 需要 webhooks 和 API tokens
  - 失去 MR 整合功能
  - 手動狀態檢查配置
  - 沒有 Auto DevOps
```

**平台鎖定：** 當你全面使用 GitLab（repo、registry、packages、deploy）時，GitLab CI 表現最佳。

---

**2. YAML 學習曲線**

```yaml
# GitLab CI 有自己的 YAML 語義
job_name:
  stage: build
  image: node:20
  services:
    - postgres:15
  variables:
    DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/test"
  before_script:
    - npm ci
  script:
    - npm run build
    - npm test
  after_script:
    - echo "Cleanup complete"
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
    reports:
      junit: junit.xml
  cache:
    paths:
      - node_modules/
    key: ${CI_COMMIT_REF_SLUG}
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: always
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: on_success
    - when: never
  tags:
    - docker
  timeout: 30m
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
```

**許多概念需要學習：** stages、scripts、artifacts、cache、rules、tags、retry、timeout、services、variables、before/after_script。

---

**3. 大規模成本 (SaaS)**

```
GitLab CI 定價 (gitlab.com)：
  - 免費：400 CI/CD 分鐘/月
  - Premium：$19/用戶/月（包含 50,000 分鐘）
  - Ultimate：$99/用戶/月（包含 50,000 分鐘）
  - 額外分鐘：$0.007/分鐘

50 人開發團隊 (Premium)：
  - 基礎：50 × $19 = $950/月
  - 包含分鐘：50,000
  - 使用量：220,000 分鐘（與 GitHub 範例相同）
  - 超額：170,000 × $0.007 = $1,190/月
  - 總計：$2,140/月
```

**自管理可降低成本** 但會增加基礎設施開銷。

---

**4. 效能變異性**

```
Shared runners (gitlab.com)：
  - 排隊時間：0-5 分鐘（高峰時段）
  - 作業持續時間：5-20 分鐘
  - 效能：可變（共享資源）

Self-hosted runners：
  - 排隊時間：接近零（專用）
  - 作業持續時間：5-15 分鐘
  - 效能：一致（你的基礎設施）
```

**Shared runner 抽獎：** 你的作業可能落在快速或慢速 runner 上。

---

**5. 除錯限制**

| 限制 | 影響 |
|------------|--------|
| **無法 SSH 到 runner** | 無法除錯實時作業（除非自託管） |
| **日誌保留：** 最多 90 天 | 歷史分析有限 |
| **Artifact 過期** | 下載的 artifact 自動刪除 |
| **有限的重放** | 無法在完全相同的環境下重新運行 |

**變通方法：** 使用 `CI_DEBUG_TRACE` 進行詳細日誌記錄，或自託管 runner 以獲得 SSH 訪問。

### GitLab CI 評分卡

| 指標 | 評分 | 備註 |
|--------|-------|-------|
| 回饋時間 | ⚠️ 可變 | 取決於 runner 5-20 分鐘 |
| 可靠性 | ✅ 好 | 穩定，但 shared runner 可能排隊 |
| 成本可預測性 | ⚠️ 可變 | 與 GitHub 在大規模下相似 |
| 維護 | ✅ 好 | SaaS 為零，自管理為中等 |
| 開發者體驗 | ✅ 好 | 整合但學習曲線較陡 |
| 可擴展性 | ✅ 好 | 使用自託管 runner 自動擴展 |

**最適合：** 全面使用 GitLab 平台的團隊、想要整合 DevOps 功能的組織。

**最不適合：** 多 repo 設置（GitHub + GitLab）、想要最小 CI 配置學習的團隊。

---

## 6 一對一比較

### 回饋時間

| 平台 | 典型持續時間 | 變異性 |
|----------|------------------|-------------|
| **Jenkins** | 8-25 分鐘 | 高（agent 可用性、快取狀態） |
| **GitHub Actions** | 5-15 分鐘 | 低（一致的基礎設施） |
| **GitLab CI** | 5-20 分鐘 | 中（shared vs dedicated runner） |

**贏家：** GitHub Actions（最一致）

---

### 維護開銷

| 平台 | 每月運營時間 | 複雜性 |
|----------|------------------|------------|
| **Jenkins** | 8-15 小時 | 高（升級、外掛程式、agent） |
| **GitHub Actions** | 0-2 小時 | 低（僅 workflow 除錯） |
| **GitLab CI (SaaS)** | 0-2 小時 | 低（僅 workflow 除錯） |
| **GitLab CI (自管理)** | 4-8 小時 | 中（runner 管理） |

**贏家：** GitHub Actions / GitLab CI SaaS（平手）

---

### 大規模成本（50 開發者，220k 分鐘/月）

| 平台 | 每月成本 | 可預測性 |
|----------|--------------|----------------|
| **Jenkins (自託管)** | $200-400 | 高（僅基礎設施） |
| **GitHub Actions** | $1,744 | 中（基於使用量） |
| **GitLab CI Premium** | $2,140 | 中（基於使用量） |

**贏家：** Jenkins（如果你有 DevOps 能力）

---

### 開發者體驗

| 方面 | Jenkins | GitHub Actions | GitLab CI |
|--------|---------|----------------|-----------|
| **設置時間** | 數天 | 數分鐘 | 數分鐘 |
| **配置語法** | Groovy（複雜） | YAML（簡單） | YAML（中等） |
| **錯誤訊息** | 難懂 | 清晰 | 清晰 |
| **PR 整合** | 需要外掛程式 | 原生 | 原生（僅 GitLab） |
| **學習曲線** | 陡峭 | 平緩 | 中等 |

**贏家：** GitHub Actions（對開發者最簡單）

---

### 靈活性

| 平台 | 自訂 | 外掛程式生態系統 | Runner 選項 |
|----------|---------------|------------------|----------------|
| **Jenkins** | 無限 | 1800+ 外掛程式 | 任何機器 |
| **GitHub Actions** | 高（複合 actions） | 30,000+ actions | GitHub 託管或自託管 |
| **GitLab CI** | 高（includes/extends） | 內建功能 | GitLab 託管或自託管 |

**贏家：** Jenkins（最靈活，但最複雜）

---

### 可擴展性

| 平台 | 自動擴展 | 並發限制 | 排隊管理 |
|----------|--------------|-------------------|------------------|
| **Jenkins** | 手動（Kubernetes 外掛程式） | 無（你的基礎設施） | 自訂（優先級隊列） |
| **GitHub Actions** | 自動 | 基於方案（20-180 作業） | 自動 |
| **GitLab CI** | 自動（自託管） | 基於方案 | 自動 |

**贏家：** GitHub Actions（最容易擴展）

---

## 7 決策框架

### 選擇 Jenkins 如果：

- ✅ 你有專職的 DevOps 工程師（或能力）
- ✅ 成本控制至關重要（自託管基礎設施）
- ✅ 你需要複雜的 CI 邏輯（自訂外掛程式、共享函式庫）
- ✅ 需要本地部署或空氣隔離環境
- ✅ 你已經投資於 Jenkins 生態系統

### 選擇 GitHub Actions 如果：

- ✅ 你的程式碼在 GitHub 上
- ✅ 開發者體驗是優先事項
- ✅ 你想要零維護開銷
- ✅ 你的 CI 需求是標準的（建置、測試、發布）
- ✅ 你重視緊密的 PR 整合

### 選擇 GitLab CI 如果：

- ✅ 你的程式碼在 GitLab 上
- ✅ 你想要整合的 DevOps 功能（安全掃描、registry、packages）
- ✅ 你偏好單一供應商平台
- ✅ Auto DevOps 對你的團隊有吸引力
- ✅ 你願意學習 GitLab 的 YAML 語義

---

## 8 遷移考慮

### Jenkins → GitHub Actions

```
遷移工作：中 - 高
- 將 Jenkinsfiles 重寫為 GitHub Actions workflows
- 用複合 actions 替換共享函式庫
- 將憑證遷移到 GitHub Secrets
- 培訓團隊 YAML 語法
- 更新文件

時間：典型團隊 2-4 週
```

### GitHub Actions → GitLab CI

```
遷移工作：低 - 中
- 將 workflow YAML 轉換為 GitLab CI YAML
- 將 GitHub 特定功能映射到 GitLab 對應項
- 更新 runner 配置
- 如果使用 GitHub Packages 則遷移 packages/registry

時間：典型團隊 1-2 週
```

### GitLab CI → GitHub Actions

```
遷移工作：中
- 將 .gitlab-ci.yml 轉換為 GitHub workflows
- 替換 GitLab 特定功能（Auto DevOps、內建掃描）
- 如果使用 GitLab Registry 則設置替代 registry
- 將 MR 整合更新為 PR 檢查

時間：典型團隊 2-3 週
```

---

## 總結：CI 平台決策矩陣

```mermaid
flowchart TD
    A[開始：選擇 CI 平台] --> B{程式碼在 GitHub?}
    B -->|是 | C{DevOps 能力？}
    B -->|否 | D{程式碼在 GitLab?}

    C -->|無 | E[GitHub Actions]
    C -->|專職團隊 | F{成本關鍵？}
    F -->|是 | G[Jenkins]
    F -->|否 | E

    D -->|是 | H{想要整合功能？}
    D -->|否 | I[多平台策略]

    H -->|是 | J[GitLab CI]
    H -->|否 | K{基於優先級評估}

    E --> L[✅ 零維護<br/>✅ 最佳 DX<br/>⚠️ 大規模成本]
    G --> M[✅ 最低成本<br/>✅ 最大靈活性<br/>❌ 高維護]
    J --> N[✅ 整合平台<br/>✅ 內建功能<br/>⚠️ GitLab 鎖定]

    style E fill:#e3f2fd,stroke:#1976d2
    style G fill:#fff3e0,stroke:#f57c00
    style J fill:#e8f5e9,stroke:#388e3c
```

**最終建議：**

| 情境 | 推薦平台 |
|----------|---------------------|
| **GitHub 上的初創公司** | GitHub Actions |
| **GitLab 上的企業** | GitLab CI |
| **成本敏感，有 DevOps 團隊** | Jenkins |
| **複雜 CI 需求** | Jenkins |
| **開發者體驗優先** | GitHub Actions |
| **整合 DevOps 平台** | GitLab CI |
| **需要本地部署** | Jenkins 或 GitLab 自管理 |

---

## 底線

沒有普遍「最佳」的 CI 平台。正確的選擇取決於你團隊的限制：

| 優先級 | 最佳選擇 |
|----------|-------------|
| **最小化維護** | GitHub Actions |
| **最小化成本** | Jenkins（自託管） |
| **最大化靈活性** | Jenkins |
| **最佳開發者體驗** | GitHub Actions |
| **整合平台** | GitLab CI |
| **企業功能** | GitLab CI Ultimate 或 Jenkins + 外掛程式 |

**真正的問題不是「哪個 CI 最好？」** 而是「哪個 CI 最適合我們團隊的限制和優先級？」

誠實地回答這個問題，選擇就會變得清晰。
