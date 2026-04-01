---
title: "Jenkins vs GitHub Actions vs GitLab CI：纯 CI 视角的比较"
date: 2026-02-26
categories:
  - Development
tags:
  - Jenkins
  - Platform Engineering
excerpt: "在选择 CI 平台？跳过行销话术。本文纯粹从持续整合的角度分析 Jenkins、GitHub Actions 和 GitLab CI——效能、维护、开发者体验和实际的权衡取舍。"
lang: zh-CN
available_langs:
  - zh-TW
thumbnail: /assets/jenkins/thumbnail.png
thumbnail_80: /assets/jenkins/thumbnail_80.png
canonical_lang: en
canonical_url: /2026/02/Jenkins-vs-GitHub-GitLab-CI.html
comments: true
---

你的 CI 平台是工程速度的心跳。每个提交都会触发它。每个 PR 都依赖它。每个开发者每天都要与它互动多次。

然而，团队选择 CI 工具的原因往往是错误的：
- 「我们已经有 Jenkins 了」（沉没成本谬误）
- 「GitHub Actions 对小团队免费」（直到不是为止）
- 「GitLab CI 是整合的」（但它够好吗？）

这个比较穿透了噪音。没有 CD 偏见。没有供应商行销。只有**纯 CI**：构建、测试、lint、扫描、打包。

以下是 CI 真正重要的事项，以及每个平台如何交付。

---

## 1 什么是「纯 CI」？

**持续整合** 是一种自动构建和测试每个提交的实践。目标：早期发现错误、确保代码质量，并为开发者提供快速反馈。

**纯 CI 范围：**

| 阶段 | 做什么 | 典型持续时间 |
|-------|--------------|------------------|
| **Checkout** | 从 Git 获取代码 | 10-30 秒 |
| **Build** | 编译、打包、容器化 | 2-10 分钟 |
| **Unit Tests** | 快速、隔离的测试 | 1-5 分钟 |
| **Integration Tests** | 多组件测试 | 5-15 分钟 |
| **Lint/Format** | 代码质量检查 | 30 秒 - 2 分钟 |
| **Security Scan** | SAST、依赖扫描 | 1-5 分钟 |
| **Artifact Upload** | 推送到 registry/repository | 1-3 分钟 |

**CI 不是什么：**
- ❌ 部署到生产环境（那是 CD）
- ❌ 配置基础设施（那是 GitOps/IaC）
- ❌ 管理环境（那是 Environment on Demand）

!!! info "为什么这很重要"
    许多 CI/CD 比较将 **CI 能力**（构建/测试）与 **CD 能力**（部署/发布）混淆。这导致错误的决策：

    - 因为 CD 插件而选择 Jenkins，但你只需要 CI
    - 因为 GitHub Actions「靠近代码」而选择它，却没有评估 CI 效能
    - 因为整合而选择 GitLab CI，却没有在大规模下测试 CI 速度

    本文**只关注 CI**。CD 是另一个话题。

范围定义完毕，让我们建立 CI 平台真正重要的评估标准。

---

## 2 评估标准：什么让 CI 变好？

### 核心指标

| 指标 | 为什么重要 | 目标 |
|--------|----------------|--------|
| **反馈时间** | 开发者等待 CI 时会失去上下文 | 80% 的运行 < 10 分钟 |
| **可靠性** | 不稳定的 CI 会摧毁信任 | > 99% 正常运行时间，< 1% 不稳定率 |
| **成本可预测性** | CI 成本随团队规模扩展 | 已知的每月成本，无意外 |
| **维护开销** | CI 应该赋能开发者，而非阻碍他们 | < 4 小时/周 运营时间 |
| **开发者体验** | 摩擦会减缓交付速度 | 直观的配置，清晰的错误 |
| **可扩展性** | CI 必须处理并发的 PR | 高峰时期无排队时间 |

### 次要考虑因素

| 因素 | 重要性 | 备注 |
|--------|------------|-------|
| **插件生态系统** | 中 | 仅在你需要特定整合时才重要 |
| **供应商锁定** | 低 - 中 | CI 配置通常是可移植的 |
| **本地部署支持** | 低 | 大多数团队现在是云原生的 |
| **CD 功能** | 范围外 | 需要单独评估 |

现在让我们通过这个 CI 专注的视角来检查每个平台。

---

## 3 Jenkins：自托管的可靠选择

### 架构

```
Developer → GitHub/GitLab → Jenkins Master → Jenkins Agents → Build/Test
                                    ↓
                              Shared Storage (Artifacts)
```

**部署模型：** 自托管（VM、Kubernetes 或裸机）

### CI 优势

**1. 无限的灵活性**

```groovy
// Jenkinsfile - 完整的程序控制
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

**为什么重要：** 你可以实现**任何 CI 逻辑**——Jenkinsfile 支持 Groovy 脚本、共享库和自定义插件。

---

**2. 成本控制**

```
EC2 上自托管的 Jenkins：
  - Master: t3.medium ($0.0416/小时)
  - Agents: 自动扩展的 spot instances ($0.01-0.03/小时)
  - Storage: EBS volumes ($0.10/GB-月)

5000 次构建的每月成本：~$200-400
```

**可预测的定价：** 你支付的是基础设施费用，而不是每次构建的分钟数。

---

**3. Agent 灵活性**

```yaml
# 不同工作负载的 Agent 标签
agents:
  - label: "linux-small"   # 快速 linting、单元测试
  - label: "linux-large"   # 重型构建、整合测试
  - label: "windows"       # .NET 构建
  - label: "gpu"           # ML 模型训练
  - label: "arm64"         # 跨平台构建
```

**自带 runner：** 任何机器都可以成为 Jenkins agent——EC2、Kubernetes pods、本地服务器，甚至是开发者的笔记本电脑用于本地测试。

---

**4. 成熟的插件生态系统**

| 插件类别 | 可用的插件 |
|-----------------|-------------------|
| 源代码控制 | Git、SVN、Mercurial、Perforce |
| 构建工具 | Maven、Gradle、npm、pip、cargo |
| 测试 | JUnit、pytest、Jest、Cypress |
| 安全 | SonarQube、Snyk、Checkmarx |
| 通知 | Slack、Teams、Email、PagerDuty |
| Artifact 存储 | Nexus、Artifactory、S3、Docker Registry |

更新中心有**1800+ 插件**。如果工具存在，Jenkins 就能与它整合。

### CI 弱点

**1. Groovy 问题：能力还是负担？**

```groovy
// Jenkinsfile - 你可以撰写完整的程序逻辑
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

**Groovy 是优势吗？** 取决于情况。

| 方面 | 现实 |
|--------|-------------|
| **能力** | ✅ Turing-complete。你可以实现任何 CI 逻辑。 |
| **学习曲线** | ❌ 大多数开发者知道 JavaScript/Python，而不是 Groovy。 |
| **调试** | ❌ 堆栈追踪是 Java/Groovy 混合体。难以解析。 |
| **测试** | ⚠️ 你可以对 Jenkinsfiles 进行单元测试，但很少有团队这样做。 |
| **代码审查** | ❌ 复杂的 pipeline 变成「只有 Sarah 懂的那个东西」。 |
| **招聘** | ❌ 2026 年大多数简历上没有「Jenkins + Groovy」。 |

**巴士系数问题：**

```
8 人开发团队：
  - 2 人可以从头撰写新的 Jenkinsfiles
  - 4 人可以修改现有的 pipeline
  - 2 人只能阅读/理解它们

当 Sarah 离职时：谁来维护 500 行的共享库？
```

**与基于 YAML 的 CI 比较：**

```yaml
# GitHub Actions - 声明式、受限但可读
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

**权衡：** 你失去了程序灵活性，但获得了：
- 所有开发者的可读性
- 更容易的入职
- 更低的巴士系数风险

**Groovy 的结论：**

| 情境 | Groovy 是... |
|----------|--------------|
| 复杂、动态的 CI 逻辑 | ✅ 超能力 |
| 标准的构建/测试/部署 | ❌ 过度设计 |
| 大型团队有人员流动 | ❌ 负债 |
| 小型团队、成员稳定 | ⚠️ 可接受 |
| 受监管的行业（审计追踪） | ✅ 可追踪的逻辑 |

!!! question "🤔 所以你应该避免 Groovy 吗？"
    不——但要有 intentionality：

    - **使用 Groovy** 如果你需要动态 pipeline、复杂的编排或自定义整合
    - **避免 Groovy** 如果你的 CI 是标准的（构建 → 测试 → 发布）
    - **大量文档** 如果你选择 Groovy 路线（共享库需要文档）
    - **培训团队** 让不止一个人理解 pipeline 逻辑

---

**2. 维护开销**

```bash
# Jenkins 现实检查
$ kubectl get pods -n jenkins
NAME                            READY   STATUS    RESTARTS
jenkins-controller-0            1/1     Running   12 last week
jenkins-agent-pool-deployment   3/3     Running   0
```

**你签下的是什么：**

| 任务 | 频率 | 所需时间 |
|------|-----------|---------------|
| Jenkins 升级 | 每月 | 1-2 小时 |
| 插件更新 | 每周 | 2-4 小时 |
| Agent 疑难排解 | 视需要 | 1-3 小时/周 |
| 磁盘空间管理 | 每周 | 1 小时 |
| 安全补丁 | 每月 | 2-3 小时 |

**总运营开销：** 单个 Jenkins 实例每月 8-15 小时。

---

**2. 配置复杂性**

```groovy
// 共享库 (vars/buildAndTest.groovy)
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

// 使用共享库的 Jenkinsfile
@Library('my-shared-lib') _
buildAndTest(name: 'backend', timeout: 45)
```

**学习曲线：**
- Groovy 语法（大多数开发者不熟悉）
- 共享库模式
- 插件兼容性矩阵
- Agent 标签管理
- 凭证范围划分

---

**3. 反馈时间变异性**

```
Build #101: 8 分钟   (快取暖、agent 可用)
Build #102: 23 分钟  (快取冷、排队等待 agent)
Build #103: 15 分钟  (部分快取、spot instance 抢占)
```

**为什么会变化：**
- Agent 可用性（排队时间）
- 快取暖/冷状态
- 共享资源竞争
- 到 artifact 存储的网络延迟

**结果：** 开发者无法预测 CI 持续时间。

---

**4. UI/UX 债务**

| 方面 | Jenkins 现实 |
|--------|-----------------|
| 构建日志 | 纯文字，大输出时加载缓慢 |
| Pipeline 可视化 | Blue Ocean 更好但感觉是强加的 |
| 错误讯息 | 通常是神秘的堆栈追踪 |
| 移动体验 | 不存在 |
| 搜索 | 仅限构建编号和状态 |

**开发者感受：** 「Jenkins 能用，但我害怕使用它。」

### Jenkins CI 评分卡

| 指标 | 评分 | 备注 |
|--------|-------|-------|
| 反馈时间 | ⚠️ 可变 | 取决于条件 8-25 分钟 |
| 可靠性 | ✅ 好 | 正确配置后稳定 |
| 成本可预测性 | ✅ 优秀 | 基础设施成本可预测 |
| 维护 | ❌ 高 | 每月 8-15 小时运营开销 |
| 开发者体验 | ⚠️ 混合 | 强大但复杂 |
| 可扩展性 | ⚠️ 手动 | 需要容量规划 |

**最适合：** 有专职 DevOps 资源、复杂 CI 需求或严格本地部署需求的团队。

**最不适合：** 小型团队、初创公司或想要「CI 就能用」的组织。

---

## 4 GitHub Actions：开发者优先的选择

### 架构

```
Developer → GitHub PR → GitHub Actions Runner → Build/Test
                        ↓
                  GitHub Packages (Artifacts)
```

**部署模型：** SaaS (github.com) 或自托管 runner

### CI 优势

**1. 零设置**

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

**就是这样。** 没有服务器。没有 agent。没有维护。推送代码 → CI 运行。

---

**2. 紧密的 GitHub 整合**

| 功能 | 优势 |
|---------|---------|
| **PR 状态检查** | CI 结果直接出现在 PR UI 中 |
| **必要检查** | 在 CI 通过前阻止合并 |
| **Action 评论** | 机器人可以在 PR 上评论测试结果 |
| **Workflow 触发** | 在 PR 开启、同步、标签、评论时运行 |
| **秘密扫描** | 内建的代码秘密检测 |

**开发者工作流：**

```
1. 开发者开启 PR
2. CI 自动触发
3. 结果在几秒内出现在 PR 中
4. 绿色勾号 → 准备审查
5. 红色 X → 点击查看失败
```

无需上下文切换。无需仪表板搜索。

---

**3. Action 市场**

```yaml
# 来自市场的可重用 actions
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
  - uses: aws-actions/configure-aws-credentials@v4
  - uses: docker/setup-buildx-action@v3
  - uses: sonarsource/sonarqube-scan-action@v3
```

**30,000+ actions** 可用。最常见的 CI 任务只需一个 `uses:` 语句。

---

**4. 矩阵构建**

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

**自动生成 8 个并行作业**。非常适合跨平台测试。

---

**5. 内建缓存**

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

**缓存命中：** 后续运行可减少 60-80% 的构建时间。

### CI 弱点

**1. 大规模的成本**

```
GitHub Actions 定价（按量付费）：
  - 免费层：2,000 分钟/月
  - 超额：$0.008/分钟 (Linux), $0.016/分钟 (macOS)

50 人开发团队：
  - 平均 20 次构建/开发者/天 × 10 分钟/构建
  - 1000 次构建/天 × 22 天 = 22,000 次构建/月
  - 22,000 × 10 分钟 = 220,000 分钟
  - 成本：218,000 × $0.008 = $1,744/月
```

**自托管 runner 可降低成本** 但会增加维护开销。

---

**2. Runner 限制**

| 限制 | 影响 |
|------------|--------|
| **最长作业持续时间：** 6 小时 | 长时间运行的测试可能超时 |
| **最大矩阵大小：** 256 作业 | 大型测试矩阵需要分片 |
| **存储：** 每个 workflow 10GB | Artifact 保留限制 |
| **并发作业：** 取决于方案 | 免费：20, 专业：40, 企业：180 |
| **无持久状态** | 每个作业从头开始 |

**需要变通方法：**
- 长时间运行的整合测试（> 6 小时）
- 大型 artifact 存储（> 10GB）
- 有状态构建（增量编译）

---

**3. YAML 复杂性**

```yaml
# 简单的 CI 很快变得复杂
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

**YAML 蔓延：** CI workflow 很快增长到 200+ 行。可重用性需要复合 actions 或可重用 workflow（更多的 YAML）。

---

**4. 调试挑战**

```
[CI 失败] 作业 "test" 失败，退出码 1

日志：
> npm run test:integration
> jest --config jest.integration.config.js

FAIL src/integration/payment.test.js
  ● Payment Integration › processes payment successfully

    Error: connect ECONNREFUSED 127.0.0.1:5432

    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)

测试运行完成。1 失败，47 通过。
```

**调试限制：**
- 无法 SSH 访问 runner（除非使用调试 actions）
- 事后分析有限
- 日志在保留期后消失（最多 90 天）
- 无法在相同环境下重放失败的作业

---

**5. 供应商锁定**

| 锁定方面 | 严重性 |
|----------------|----------|
| **Workflow 语法** | 中（YAML 可移植，但 GitHub 特定功能不可移植） |
| **Action 依赖** | 低（大多数 actions 是开源的） |
| **GitHub Packages** | 中（如果切换需要迁移） |
| **秘密管理** | 低（标准模式） |
| **Runner 基础设施** | 高（如果使用 GitHub 托管的 runner） |

**迁移成本：** 从 GitHub Actions 迁移到另一个 CI 平台需要重写 workflow 并重新培训团队。

### GitHub Actions 评分卡

| 指标 | 评分 | 备注 |
|--------|-------|-------|
| 反馈时间 | ✅ 好 | 通常 5-15 分钟 |
| 可靠性 | ✅ 优秀 | GitHub 基础设施稳健 |
| 成本可预测性 | ⚠️ 可变 | 随使用量扩展，可能意外 |
| 维护 | ✅ 优秀 | 零运营开销 |
| 开发者体验 | ✅ 优秀 | 直观、整合 |
| 可扩展性 | ✅ 好 | 自动扩展，但有并发限制 |

**最适合：** 已经在 GitHub 上的团队、初创公司、重视开发者体验胜过成本控制的项目。

**最不适合：** 大规模下对成本敏感的组织、需要长时间运行作业或自定义 runner 配置的团队。

---

## 5 GitLab CI：整合平台

### 架构

```
Developer → GitLab Push → GitLab Runner → Build/Test
                        ↓
                  GitLab Registry (Artifacts)
```

**部署模型：** SaaS (gitlab.com) 或自管理

### CI 优势

**1. 单一配置文件**

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

**一切都在一个文件中：** linting、测试、构建、安全扫描。不需要单独的 CD 配置。

---

**2. Auto DevOps**

```
GitLab 可以自动检测你的项目并自动配置 CI/CD：

1. 语言检测 (Node.js、Python、Go、Java 等)
2. 框架检测 (React、Django、Spring 等)
3. 数据库检测 (PostgreSQL、MySQL、Redis)
4. 自动生成 CI/CD pipeline
5. 每个 MR 部署到 review apps
```

**零配置 CI：** 对于常见技术栈开箱即用。

---

**3. 内建功能**

| 功能 | 包含 |
|---------|----------|
| **容器 Registry** | ✅ 是（整合） |
| **包 Registry** | ✅ 是（npm、Maven、PyPI 等） |
| **安全扫描** | ✅ 是（SAST、DAST、依赖扫描） |
| **代码质量** | ✅ 是（基于 diff 的质量报告） |
| **测试报告** | ✅ 是（JUnit、覆盖率可视化） |
| **依赖管理** | ✅ 是（漏洞报告） |

**无需插件搜索：** 一切开箱即用。

---

**4. Runner 灵活性**

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

**Runner 类型：**
- **Shared runners：** GitLab 管理 (gitlab.com)
- **Group runners：** 跨项目共享
- **Project runners：** 专用于特定项目
- **Self-hosted：** 你自己的基础设施

---

**5. Pipeline 可视化**

```
Pipeline #12345 - main branch
┌─────────┬─────────┬─────────┬─────────┐
│  lint   │  test   │  build  │ security│
│   ✅    │   ✅    │   ✅    │   ✅    │
│  1:23   │  4:56   │  2:34   │  1:45   │
└─────────┴─────────┴─────────┴─────────┘
Total duration: 10:38
```

**清晰的可视化：** 在一个视图中查看所有阶段、作业和持续时间。

### CI 弱点

**1. 紧密耦合**

```
GitLab CI 是为 GitLab 设计的。与 GitHub 或 Bitbucket 一起使用：
  - 需要 webhooks 和 API tokens
  - 失去 MR 整合功能
  - 手动状态检查配置
  - 没有 Auto DevOps
```

**平台锁定：** 当你全面使用 GitLab（repo、registry、packages、deploy）时，GitLab CI 表现最佳。

---

**2. YAML 学习曲线**

```yaml
# GitLab CI 有自己的 YAML 语义
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

**许多概念需要学习：** stages、scripts、artifacts、cache、rules、tags、retry、timeout、services、variables、before/after_script。

---

**3. 大规模成本 (SaaS)**

```
GitLab CI 定价 (gitlab.com)：
  - 免费：400 CI/CD 分钟/月
  - Premium：$19/用户/月（包含 50,000 分钟）
  - Ultimate：$99/用户/月（包含 50,000 分钟）
  - 额外分钟：$0.007/分钟

50 人开发团队 (Premium)：
  - 基础：50 × $19 = $950/月
  - 包含分钟：50,000
  - 使用量：220,000 分钟（与 GitHub 示例相同）
  - 超额：170,000 × $0.007 = $1,190/月
  - 总计：$2,140/月
```

**自管理可降低成本** 但会增加基础设施开销。

---

**4. 效能变异性**

```
Shared runners (gitlab.com)：
  - 排队时间：0-5 分钟（高峰时段）
  - 作业持续时间：5-20 分钟
  - 效能：可变（共享资源）

Self-hosted runners：
  - 排队时间：接近零（专用）
  - 作业持续时间：5-15 分钟
  - 效能：一致（你的基础设施）
```

**Shared runner 抽奖：** 你的作业可能落在快速或慢速 runner 上。

---

**5. 调试限制**

| 限制 | 影响 |
|------------|--------|
| **无法 SSH 到 runner** | 无法调试实时作业（除非自托管） |
| **日志保留：** 最多 90 天 | 历史分析有限 |
| **Artifact 过期** | 下载的 artifact 自动删除 |
| **有限的重放** | 无法在完全相同的环境下重新运行 |

**变通方法：** 使用 `CI_DEBUG_TRACE` 进行详细日志记录，或自托管 runner 以获得 SSH 访问。

### GitLab CI 评分卡

| 指标 | 评分 | 备注 |
|--------|-------|-------|
| 反馈时间 | ⚠️ 可变 | 取决于 runner 5-20 分钟 |
| 可靠性 | ✅ 好 | 稳定，但 shared runner 可能排队 |
| 成本可预测性 | ⚠️ 可变 | 与 GitHub 在大规模下相似 |
| 维护 | ✅ 好 | SaaS 为零，自管理为中等 |
| 开发者体验 | ✅ 好 | 整合但学习曲线较陡 |
| 可扩展性 | ✅ 好 | 使用自托管 runner 自动扩展 |

**最适合：** 全面使用 GitLab 平台的团队、想要整合 DevOps 功能的组织。

**最不适合：** 多 repo 设置（GitHub + GitLab）、想要最小 CI 配置学习的团队。

---

## 6 一对一比较

### 反馈时间

| 平台 | 典型持续时间 | 变异性 |
|----------|------------------|-------------|
| **Jenkins** | 8-25 分钟 | 高（agent 可用性、缓存状态） |
| **GitHub Actions** | 5-15 分钟 | 低（一致的基础设施） |
| **GitLab CI** | 5-20 分钟 | 中（shared vs dedicated runner） |

**赢家：** GitHub Actions（最一致）

---

### 维护开销

| 平台 | 每月运营时间 | 复杂性 |
|----------|------------------|------------|
| **Jenkins** | 8-15 小时 | 高（升级、插件、agent） |
| **GitHub Actions** | 0-2 小时 | 低（仅 workflow 调试） |
| **GitLab CI (SaaS)** | 0-2 小时 | 低（仅 workflow 调试） |
| **GitLab CI (自管理)** | 4-8 小时 | 中（runner 管理） |

**赢家：** GitHub Actions / GitLab CI SaaS（平手）

---

### 大规模成本（50 开发者，220k 分钟/月）

| 平台 | 每月成本 | 可预测性 |
|----------|--------------|----------------|
| **Jenkins (自托管)** | $200-400 | 高（仅基础设施） |
| **GitHub Actions** | $1,744 | 中（基于使用量） |
| **GitLab CI Premium** | $2,140 | 中（基于使用量） |

**赢家：** Jenkins（如果你有 DevOps 能力）

---

### 开发者体验

| 方面 | Jenkins | GitHub Actions | GitLab CI |
|--------|---------|----------------|-----------|
| **设置时间** | 数天 | 数分钟 | 数分钟 |
| **配置语法** | Groovy（复杂） | YAML（简单） | YAML（中等） |
| **错误讯息** | 难懂 | 清晰 | 清晰 |
| **PR 整合** | 需要插件 | 原生 | 原生（仅 GitLab） |
| **学习曲线** | 陡峭 | 平缓 | 中等 |

**赢家：** GitHub Actions（对开发者最简单）

---

### 灵活性

| 平台 | 自定义 | 插件生态系统 | Runner 选项 |
|----------|---------------|------------------|----------------|
| **Jenkins** | 无限 | 1800+ 插件 | 任何机器 |
| **GitHub Actions** | 高（复合 actions） | 30,000+ actions | GitHub 托管或自托管 |
| **GitLab CI** | 高（includes/extends） | 内建功能 | GitLab 托管或自托管 |

**赢家：** Jenkins（最灵活，但最复杂）

---

### 可扩展性

| 平台 | 自动扩展 | 并发限制 | 排队管理 |
|----------|--------------|-------------------|------------------|
| **Jenkins** | 手动（Kubernetes 插件） | 无（你的基础设施） | 自定义（优先级队列） |
| **GitHub Actions** | 自动 | 基于方案（20-180 作业） | 自动 |
| **GitLab CI** | 自动（自托管） | 基于方案 | 自动 |

**赢家：** GitHub Actions（最容易扩展）

---

## 7 决策框架

### 选择 Jenkins 如果：

- ✅ 你有专职的 DevOps 工程师（或能力）
- ✅ 成本控制至关重要（自托管基础设施）
- ✅ 你需要复杂的 CI 逻辑（自定义插件、共享库）
- ✅ 需要本地部署或空气隔离环境
- ✅ 你已经投资于 Jenkins 生态系统

### 选择 GitHub Actions 如果：

- ✅ 你的代码在 GitHub 上
- ✅ 开发者体验是优先事项
- ✅ 你想要零维护开销
- ✅ 你的 CI 需求是标准的（构建、测试、发布）
- ✅ 你重视紧密的 PR 整合

### 选择 GitLab CI 如果：

- ✅ 你的代码在 GitLab 上
- ✅ 你想要整合的 DevOps 功能（安全扫描、registry、packages）
- ✅ 你偏好单一供应商平台
- ✅ Auto DevOps 对你的团队有吸引力
- ✅ 你愿意学习 GitLab 的 YAML 语义

---

## 8 迁移考虑

### Jenkins → GitHub Actions

```
迁移工作：中 - 高
- 将 Jenkinsfiles 重写为 GitHub Actions workflows
- 用复合 actions 替换共享库
- 将凭证迁移到 GitHub Secrets
- 培训团队 YAML 语法
- 更新文档

时间：典型团队 2-4 周
```

### GitHub Actions → GitLab CI

```
迁移工作：低 - 中
- 将 workflow YAML 转换为 GitLab CI YAML
- 将 GitHub 特定功能映射到 GitLab 对应项
- 更新 runner 配置
- 如果使用 GitHub Packages 则迁移 packages/registry

时间：典型团队 1-2 周
```

### GitLab CI → GitHub Actions

```
迁移工作：中
- 将 .gitlab-ci.yml 转换为 GitHub workflows
- 替换 GitLab 特定功能（Auto DevOps、内建扫描）
- 如果使用 GitLab Registry 则设置替代 registry
- 将 MR 整合更新为 PR 检查

时间：典型团队 2-3 周
```

---

## 总结：CI 平台决策矩阵

```mermaid
flowchart TD
    A[开始：选择 CI 平台] --> B{代码在 GitHub?}
    B -->|是 | C{DevOps 能力？}
    B -->|否 | D{代码在 GitLab?}

    C -->|无 | E[GitHub Actions]
    C -->|专职团队 | F{成本关键？}
    F -->|是 | G[Jenkins]
    F -->|否 | E

    D -->|是 | H{想要整合功能？}
    D -->|否 | I[多平台策略]

    H -->|是 | J[GitLab CI]
    H -->|否 | K{基于优先级评估}

    E --> L[✅ 零维护<br/>✅ 最佳 DX<br/>⚠️ 大规模成本]
    G --> M[✅ 最低成本<br/>✅ 最大灵活性<br/>❌ 高维护]
    J --> N[✅ 整合平台<br/>✅ 内建功能<br/>⚠️ GitLab 锁定]

    style E fill:#e3f2fd,stroke:#1976d2
    style G fill:#fff3e0,stroke:#f57c00
    style J fill:#e8f5e9,stroke:#388e3c
```

**最终建议：**

| 情境 | 推荐平台 |
|----------|---------------------|
| **GitHub 上的初创公司** | GitHub Actions |
| **GitLab 上的企业** | GitLab CI |
| **成本敏感，有 DevOps 团队** | Jenkins |
| **复杂 CI 需求** | Jenkins |
| **开发者体验优先** | GitHub Actions |
| **整合 DevOps 平台** | GitLab CI |
| **需要本地部署** | Jenkins 或 GitLab 自管理 |

---

## 底线

没有普遍「最佳」的 CI 平台。正确的选择取决于你团队的限制：

| 优先级 | 最佳选择 |
|----------|-------------|
| **最小化维护** | GitHub Actions |
| **最小化成本** | Jenkins（自托管） |
| **最大化灵活性** | Jenkins |
| **最佳开发者体验** | GitHub Actions |
| **整合平台** | GitLab CI |
| **企业功能** | GitLab CI Ultimate 或 Jenkins + 插件 |

**真正的问题不是「哪个 CI 最好？」** 而是「哪个 CI 最适合我们团队的限制和优先级？」

诚实地回答这个问题，选择就会变得清晰。
