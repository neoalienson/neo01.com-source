---
title: "Jenkins vs GitHub Actions vs GitLab CI: A Pure CI Perspective"
date: 2026-02-26
categories:
  - Development
tags:
  - Jenkins
  - Platform Engineering
excerpt: "Choosing a CI platform? Skip the marketing. This comparison breaks down Jenkins, GitHub Actions, and GitLab CI purely from a continuous integration perspective—performance, maintenance, developer experience, and real-world trade-offs."
lang: en
available_langs:
  - zh-TW
  - zh-CN
thumbnail: /assets/jenkins/thumbnail.png
canonical_lang: en
comments: true
---

Your CI platform is the heartbeat of engineering velocity. Every commit triggers it. Every PR depends on it. Every developer interacts with it—multiple times a day.

Yet teams often choose CI tools for the wrong reasons:
- "We already have Jenkins" (sunk cost fallacy)
- "GitHub Actions is free for small teams" (until it isn't)
- "GitLab CI is integrated" (but is it good enough?)

This comparison cuts through the noise. No CD bias. No vendor marketing. Just **pure CI**: build, test, lint, scan, package.

Here's what actually matters for CI, and how each platform delivers.

---

## 1 What Is "Pure CI"?

**Continuous Integration** is the practice of automatically building and testing every commit. The goal: catch bugs early, ensure code quality, and provide fast feedback to developers.

**Pure CI Scope:**

| Stage | What It Does | Typical Duration |
|-------|--------------|------------------|
| **Checkout** | Fetch code from Git | 10-30 seconds |
| **Build** | Compile, bundle, containerize | 2-10 minutes |
| **Unit Tests** | Fast, isolated tests | 1-5 minutes |
| **Integration Tests** | Multi-component tests | 5-15 minutes |
| **Lint/Format** | Code quality checks | 30 seconds - 2 minutes |
| **Security Scan** | SAST, dependency scanning | 1-5 minutes |
| **Artifact Upload** | Push to registry/repository | 1-3 minutes |

**What CI Is NOT:**
- ❌ Deploying to production (that's CD)
- ❌ Provisioning infrastructure (that's GitOps/IaC)
- ❌ Managing environments (that's Environment on Demand)

!!! info "Why This Matters"
    Many CI/CD comparisons conflate **CI capabilities** (build/test) with **CD capabilities** (deploy/release). This leads to poor decisions:
    
    - Choosing Jenkins for its CD plugins when you only need CI
    - Picking GitHub Actions because it's "close to the code" without evaluating CI performance
    - Selecting GitLab CI for integration without testing CI speed at scale
    
    This article focuses **only on CI**. CD is a different conversation.

With the scope defined, let's establish the evaluation criteria that actually matter for CI platforms.

---

## 2 Evaluation Criteria: What Makes CI Good?

### Core Metrics

| Metric | Why It Matters | Target |
|--------|----------------|--------|
| **Feedback Time** | Developers lose context waiting for CI | < 10 minutes for 80% of runs |
| **Reliability** | Flaky CI destroys trust | > 99% uptime, < 1% flaky rate |
| **Cost Predictability** | CI costs scale with team size | Known monthly cost, no surprises |
| **Maintenance Overhead** | CI should enable devs, not block them | < 4 hours/week ops time |
| **Developer Experience** | Friction slows down shipping | Intuitive config, clear errors |
| **Scalability** | CI must handle concurrent PRs | No queue times during peak |

### Secondary Considerations

| Factor | Importance | Notes |
|--------|------------|-------|
| **Plugin Ecosystem** | Medium | Only matters if you need specific integrations |
| **Vendor Lock-in** | Low-Medium | CI configs are usually portable |
| **On-premise Support** | Low | Most teams are cloud-native now |
| **CD Features** | Out of scope | Separate evaluation needed |

Now let's examine each platform through this CI-focused lens.

---

## 3 Jenkins: The Self-Hosted Workhorse

### Architecture

```
Developer → GitHub/GitLab → Jenkins Master → Jenkins Agents → Build/Test
                                    ↓
                              Shared Storage (Artifacts)
```

**Deployment Model:** Self-hosted (VM, Kubernetes, or bare metal)

### CI Strengths

**1. Unlimited Flexibility**

```groovy
// Jenkinsfile - Full programmatic control
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

**Why it matters:** You can implement **any CI logic** Jenkinsfile supports Groovy scripting, shared libraries, and custom plugins.

---

**2. Cost Control**

```
Self-hosted Jenkins on EC2:
  - Master: t3.medium ($0.0416/hour)
  - Agents: Auto-scaling spot instances ($0.01-0.03/hour)
  - Storage: EBS volumes ($0.10/GB-month)
  
Monthly cost for 5000 builds: ~$200-400
```

**Predictable pricing:** You pay for infrastructure, not per-build minutes.

---

**3. Agent Flexibility**

```yaml
# Agent labels for different workloads
agents:
  - label: "linux-small"   # Quick linting, unit tests
  - label: "linux-large"   # Heavy builds, integration tests
  - label: "windows"       # .NET builds
  - label: "gpu"           # ML model training
  - label: "arm64"         # Cross-platform builds
```

**Bring your own runners:** Any machine can be a Jenkins agent—EC2, Kubernetes pods, on-premise servers, even developer laptops for local testing.

---

**4. Mature Plugin Ecosystem**

| Plugin Category | Available Plugins |
|-----------------|-------------------|
| Source Control | Git, SVN, Mercurial, Perforce |
| Build Tools | Maven, Gradle, npm, pip, cargo |
| Testing | JUnit, pytest, Jest, Cypress |
| Security | SonarQube, Snyk, Checkmarx |
| Notifications | Slack, Teams, Email, PagerDuty |
| Artifact Storage | Nexus, Artifactory, S3, Docker Registry |

**1800+ plugins** in the update center. If a tool exists, Jenkins integrates with it.

### CI Weaknesses

**1. The Groovy Question: Power or Burden?**

```groovy
// Jenkinsfile - You can write full programmatic logic
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

**Is Groovy an advantage?** It depends.

| Aspect | The Reality |
|--------|-------------|
| **Power** | ✅ Turing-complete. You can implement any CI logic. |
| **Learning curve** | ❌ Most devs know JavaScript/Python, not Groovy. |
| **Debugging** | ❌ Stack traces are Java/Groovy hybrid. Hard to parse. |
| **Testing** | ⚠️ You can unit test Jenkinsfiles, but few teams do. |
| **Code review** | ❌ Complex pipelines become "that thing only Sarah understands." |
| **Hiring** | ❌ "Jenkins + Groovy" isn't on most resumes in 2026. |

**The Bus Factor Problem:**

```
Team of 8 developers:
  - 2 can write new Jenkinsfiles from scratch
  - 4 can modify existing pipelines
  - 2 can only read/understand them
  
When Sarah leaves: Who maintains the 500-line shared library?
```

**Compare to YAML-based CI:**

```yaml
# GitHub Actions - Declarative, constrained, but readable
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

**Trade-off:** You lose programmatic flexibility but gain:
- Readability for all developers
- Easier onboarding
- Lower bus factor risk

**Verdict on Groovy:**

| Scenario | Groovy is... |
|----------|--------------|
| Complex, dynamic CI logic | ✅ A superpower |
| Standard build/test/deploy | ❌ Overkill |
| Large team with turnover | ❌ Liability |
| Small team, stable membership | ⚠️ Acceptable |
| Regulated industry (audit trails) | ✅ Traceable logic |

!!! question "🤔 So Should You Avoid Groovy?"
    No—but be intentional:
    
    - **Use Groovy** if you need dynamic pipelines, complex orchestration, or custom integrations
    - **Avoid Groovy** if your CI is standard (build → test → publish)
    - **Document heavily** if you go the Groovy route (shared libraries need docs)
    - **Train the team** so more than one person understands the pipeline logic

---

**2. Maintenance Overhead**

```bash
# Jenkins reality check
$ kubectl get pods -n jenkins
NAME                            READY   STATUS    RESTARTS
jenkins-controller-0            1/1     Running   12 last week
jenkins-agent-pool-deployment   3/3     Running   0
```

**What you're signing up for:**

| Task | Frequency | Time Required |
|------|-----------|---------------|
| Jenkins upgrades | Monthly | 1-2 hours |
| Plugin updates | Weekly | 2-4 hours |
| Agent troubleshooting | As needed | 1-3 hours/week |
| Disk space management | Weekly | 1 hour |
| Security patches | Monthly | 2-3 hours |

**Total ops overhead:** 8-15 hours/month for a single Jenkins instance.

---

**2. Configuration Complexity**

```groovy
// Shared Library (vars/buildAndTest.groovy)
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

// Jenkinsfile using shared library
@Library('my-shared-lib') _
buildAndTest(name: 'backend', timeout: 45)
```

**The learning curve:**
- Groovy syntax (unfamiliar to most devs)
- Shared library patterns
- Plugin compatibility matrices
- Agent label management
- Credential scoping

---

**3. Feedback Time Variability**

```
Build #101: 8 minutes  (warm cache, available agent)
Build #102: 23 minutes (cold cache, queued for agent)
Build #103: 15 minutes (partial cache, spot instance preemption)
```

**Why it varies:**
- Agent availability (queue times)
- Cache warm/cold state
- Shared resource contention
- Network latency to artifact stores

**Result:** Developers can't predict CI duration.

---

**4. UI/UX Debt**

| Aspect | Jenkins Reality |
|--------|-----------------|
| Build logs | Plain text, slow loading for large outputs |
| Pipeline visualization | Blue Ocean is better but feels bolted-on |
| Error messages | Often cryptic stack traces |
| Mobile experience | Non-existent |
| Search | Limited to build numbers and status |

**Developer sentiment:** "Jenkins works, but I dread using it."

### Jenkins CI Scorecard

| Metric | Score | Notes |
|--------|-------|-------|
| Feedback Time | ⚠️ Variable | 8-25 minutes depending on conditions |
| Reliability | ✅ Good | Stable once configured properly |
| Cost Predictability | ✅ Excellent | Infrastructure costs are predictable |
| Maintenance | ❌ High | 8-15 hours/month ops overhead |
| Developer Experience | ⚠️ Mixed | Powerful but complex |
| Scalability | ⚠️ Manual | Requires capacity planning |

**Best for:** Teams with dedicated DevOps resources, complex CI requirements, or strict on-premise needs.

**Worst for:** Small teams, startups, or organizations wanting "CI that just works."

---

## 4 GitHub Actions: The Developer-First Choice

### Architecture

```
Developer → GitHub PR → GitHub Actions Runner → Build/Test
                        ↓
                  GitHub Packages (Artifacts)
```

**Deployment Model:** SaaS (github.com) or Self-hosted runners

### CI Strengths

**1. Zero Setup**

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

**That's it.** No servers. No agents. No maintenance. Push code → CI runs.

---

**2. Tight GitHub Integration**

| Feature | Benefit |
|---------|---------|
| **PR Status Checks** | CI results appear directly in PR UI |
| **Required Checks** | Block merges until CI passes |
| **Action Comments** | Bots can comment test results on PRs |
| **Workflow Triggers** | Run on PR open, sync, label, comment |
| **Secret Scanning** | Built-in secret detection in code |

**Developer workflow:**

```
1. Developer opens PR
2. CI automatically triggers
3. Results appear in PR within seconds
4. Green checkmark → ready for review
5. Red X → click through to see failures
```

No context switching. No dashboard hunting.

---

**3. Action Marketplace**

```yaml
# Reusable actions from marketplace
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
  - uses: aws-actions/configure-aws-credentials@v4
  - uses: docker/setup-buildx-action@v3
  - uses: sonarsource/sonarqube-scan-action@v3
```

**30,000+ actions** available. Most common CI tasks are one `uses:` statement away.

---

**4. Matrix Builds**

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

**Spawns 8 parallel jobs** automatically. Perfect for cross-platform testing.

---

**5. Caching Built-In**

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

**Cache hits:** 60-80% reduction in build time for subsequent runs.

### CI Weaknesses

**1. Cost at Scale**

```
GitHub Actions Pricing (Pay-as-you-go):
  - Free tier: 2,000 minutes/month
  - Overages: $0.008/minute (Linux), $0.016/minute (macOS)
  
Team with 50 developers:
  - Average 20 builds/dev/day × 10 minutes/build
  - 1000 builds/day × 22 days = 22,000 builds/month
  - 22,000 × 10 minutes = 220,000 minutes
  - Cost: 218,000 × $0.008 = $1,744/month
```

**Self-hosted runners reduce cost** but add maintenance overhead.

---

**2. Runner Limitations**

| Limitation | Impact |
|------------|--------|
| **Max job duration:** 6 hours | Long-running tests may timeout |
| **Max matrix size:** 256 jobs | Large test matrices need sharding |
| **Storage:** 10GB per workflow | Artifact retention limits |
| **Concurrent jobs:** Varies by plan | Free: 20, Pro: 40, Enterprise: 180 |
| **No persistent state** | Each job starts fresh |

**Workaround needed for:**
- Long-running integration tests (> 6 hours)
- Large artifact storage (> 10GB)
- Stateful builds (incremental compilation)

---

**3. YAML Complexity**

```yaml
# Simple CI becomes complex quickly
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

**YAML sprawl:** CI workflows grow to 200+ lines quickly. Reusability requires composite actions or reusable workflows (more YAML).

---

**4. Debugging Challenges**

```
[CI Failure] Job "test" failed with exit code 1

Logs:
> npm run test:integration
> jest --config jest.integration.config.js

FAIL src/integration/payment.test.js
  ● Payment Integration › processes payment successfully
    
    Error: connect ECONNREFUSED 127.0.0.1:5432
    
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)

Test run complete. 1 failed, 47 passed.
```

**Debugging limitations:**
- No SSH access to runners (unless using debug actions)
- Limited post-mortem analysis
- Logs disappear after retention period (90 days max)
- Can't replay failed jobs with same environment

---

**5. Vendor Lock-in**

| Lock-in Aspect | Severity |
|----------------|----------|
| **Workflow syntax** | Medium (YAML is portable, but GitHub-specific features aren't) |
| **Action dependencies** | Low (most actions are open source) |
| **GitHub Packages** | Medium (migration needed if switching) |
| **Secret management** | Low (standard patterns) |
| **Runner infrastructure** | High (if using GitHub-hosted runners) |

**Migration cost:** Moving from GitHub Actions to another CI platform requires rewriting workflows and retraining teams.

### GitHub Actions Scorecard

| Metric | Score | Notes |
|--------|-------|-------|
| Feedback Time | ✅ Good | 5-15 minutes typical |
| Reliability | ✅ Excellent | GitHub infrastructure is robust |
| Cost Predictability | ⚠️ Variable | Scales with usage, can surprise |
| Maintenance | ✅ Excellent | Zero ops overhead |
| Developer Experience | ✅ Excellent | Intuitive, integrated |
| Scalability | ✅ Good | Auto-scales, but concurrency limits |

**Best for:** Teams already on GitHub, startups, projects valuing developer experience over cost control.

**Worst for:** Cost-sensitive organizations at scale, teams needing long-running jobs or custom runner configurations.

---

## 5 GitLab CI: The Integrated Platform

### Architecture

```
Developer → GitLab Push → GitLab Runner → Build/Test
                        ↓
                  GitLab Registry (Artifacts)
```

**Deployment Model:** SaaS (gitlab.com) or Self-managed

### CI Strengths

**1. Single Configuration File**

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

**Everything in one file:** linting, testing, building, security scanning. No separate CD configuration needed.

---

**2. Auto DevOps**

```
GitLab can auto-detect your project and configure CI/CD automatically:

1. Language detection (Node.js, Python, Go, Java, etc.)
2. Framework detection (React, Django, Spring, etc.)
3. Database detection (PostgreSQL, MySQL, Redis)
4. Auto-generates CI/CD pipeline
5. Deploys to review apps per MR
```

**Zero-config CI:** Works out of the box for common stacks.

---

**3. Built-in Features**

| Feature | Included |
|---------|----------|
| **Container Registry** | ✅ Yes (integrated) |
| **Package Registry** | ✅ Yes (npm, Maven, PyPI, etc.) |
| **Security Scanning** | ✅ Yes (SAST, DAST, dependency scanning) |
| **Code Quality** | ✅ Yes (diff-based quality reports) |
| **Test Reports** | ✅ Yes (JUnit, coverage visualization) |
| **Dependency Management** | ✅ Yes (vulnerability reports) |

**No plugin hunting:** Everything works out of the box.

---

**4. Runner Flexibility**

```yaml
# GitLab Runner configuration
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

**Runner types:**
- **Shared runners:** GitLab-managed (gitlab.com)
- **Group runners:** Shared across projects
- **Project runners:** Dedicated to specific project
- **Self-hosted:** Your own infrastructure

---

**5. Pipeline Visualization**

```
Pipeline #12345 - main branch
┌─────────┬─────────┬─────────┬─────────┐
│  lint   │  test   │  build  │ security│
│   ✅    │   ✅    │   ✅    │   ✅    │
│  1:23   │  4:56   │  2:34   │  1:45   │
└─────────┴─────────┴─────────┴─────────┘
Total duration: 10:38
```

**Clear visualization:** See all stages, jobs, and durations in one view.

### CI Weaknesses

**1. Tight Coupling**

```
GitLab CI is designed for GitLab. Using it with GitHub or Bitbucket:
  - Requires webhooks and API tokens
  - Loses MR integration features
  - Manual status check configuration
  - No Auto DevOps
```

**Platform lock-in:** GitLab CI works best when you're all-in on GitLab (repo, registry, packages, deploy).

---

**2. YAML Learning Curve**

```yaml
# GitLab CI has its own YAML semantics
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

**Many concepts to learn:** stages, scripts, artifacts, cache, rules, tags, retry, timeout, services, variables, before/after_script.

---

**3. Cost at Scale (SaaS)**

```
GitLab CI Pricing (gitlab.com):
  - Free: 400 CI/CD minutes/month
  - Premium: $19/user/month (includes 50,000 minutes)
  - Ultimate: $99/user/month (includes 50,000 minutes)
  - Additional minutes: $0.007/minute
  
Team with 50 developers (Premium):
  - Base: 50 × $19 = $950/month
  - Included minutes: 50,000
  - Usage: 220,000 minutes (same as GitHub example)
  - Overage: 170,000 × $0.007 = $1,190/month
  - Total: $2,140/month
```

**Self-managed reduces cost** but adds infrastructure overhead.

---

**4. Performance Variability**

```
Shared runners (gitlab.com):
  - Queue times: 30 seconds - 5 minutes during peak
  - Job duration: 5-20 minutes
  - Performance: Variable (shared resources)

Self-hosted runners:
  - Queue times: Near zero (dedicated)
  - Job duration: 5-15 minutes
  - Performance: Consistent (your infrastructure)
```

**Shared runner lottery:** Your job might land on a fast or slow runner.

---

**5. Debugging Limitations**

| Limitation | Impact |
|------------|--------|
| **No SSH to runners** | Can't debug live jobs (unless self-hosted) |
| **Log retention:** 90 days max | Historical analysis limited |
| **Artifact expiration** | Downloaded artifacts auto-delete |
| **Limited replay** | Can't re-run with exact same environment |

**Workaround:** Use `CI_DEBUG_TRACE` for verbose logging, or self-host runners for SSH access.

### GitLab CI Scorecard

| Metric | Score | Notes |
|--------|-------|-------|
| Feedback Time | ⚠️ Variable | 5-20 minutes depending on runners |
| Reliability | ✅ Good | Stable, but shared runners can queue |
| Cost Predictability | ⚠️ Variable | Similar to GitHub at scale |
| Maintenance | ✅ Good | Zero for SaaS, moderate for self-managed |
| Developer Experience | ✅ Good | Integrated but steeper learning curve |
| Scalability | ✅ Good | Auto-scales with self-hosted runners |

**Best for:** Teams all-in on GitLab platform, organizations wanting integrated DevOps features.

**Worst for:** Multi-repo setups (GitHub + GitLab), teams wanting minimal CI configuration learning.

---

## 6 Head-to-Head Comparison

### Feedback Time

| Platform | Typical Duration | Variability |
|----------|------------------|-------------|
| **Jenkins** | 8-25 minutes | High (agent availability, cache state) |
| **GitHub Actions** | 5-15 minutes | Low (consistent infrastructure) |
| **GitLab CI** | 5-20 minutes | Medium (shared vs dedicated runners) |

**Winner:** GitHub Actions (most consistent)

---

### Maintenance Overhead

| Platform | Monthly Ops Time | Complexity |
|----------|------------------|------------|
| **Jenkins** | 8-15 hours | High (upgrades, plugins, agents) |
| **GitHub Actions** | 0-2 hours | Low (workflow debugging only) |
| **GitLab CI (SaaS)** | 0-2 hours | Low (workflow debugging only) |
| **GitLab CI (Self-managed)** | 4-8 hours | Medium (runner management) |

**Winner:** GitHub Actions / GitLab CI SaaS (tie)

---

### Cost at Scale (50 developers, 220k minutes/month)

| Platform | Monthly Cost | Predictability |
|----------|--------------|----------------|
| **Jenkins (self-hosted)** | $200-400 | High (infrastructure only) |
| **GitHub Actions** | $1,744 | Medium (usage-based) |
| **GitLab CI Premium** | $2,140 | Medium (usage-based) |

**Winner:** Jenkins (if you have DevOps capacity)

---

### Developer Experience

| Aspect | Jenkins | GitHub Actions | GitLab CI |
|--------|---------|----------------|-----------|
| **Setup Time** | Days | Minutes | Minutes |
| **Config Syntax** | Groovy (complex) | YAML (simple) | YAML (moderate) |
| **Error Messages** | Cryptic | Clear | Clear |
| **PR Integration** | Plugin required | Native | Native (GitLab only) |
| **Learning Curve** | Steep | Shallow | Moderate |

**Winner:** GitHub Actions (easiest for developers)

---

### Flexibility

| Platform | Customization | Plugin Ecosystem | Runner Options |
|----------|---------------|------------------|----------------|
| **Jenkins** | Unlimited | 1800+ plugins | Any machine |
| **GitHub Actions** | High (composite actions) | 30,000+ actions | GitHub-hosted or self-hosted |
| **GitLab CI** | High (includes/extends) | Built-in features | GitLab-hosted or self-hosted |

**Winner:** Jenkins (most flexible, but most complex)

---

### Scalability

| Platform | Auto-scaling | Concurrency Limits | Queue Management |
|----------|--------------|-------------------|------------------|
| **Jenkins** | Manual (Kubernetes plugin) | None (your infrastructure) | Custom (priority queues) |
| **GitHub Actions** | Automatic | Plan-based (20-180 jobs) | Automatic |
| **GitLab CI** | Automatic (self-hosted) | Plan-based | Automatic |

**Winner:** GitHub Actions (easiest to scale)

---

## 7 Decision Framework

### Choose Jenkins If:

- ✅ You have dedicated DevOps engineers (or capacity)
- ✅ Cost control is critical (self-hosted infrastructure)
- ✅ You need complex CI logic (custom plugins, shared libraries)
- ✅ On-premise or air-gapped environments required
- ✅ You're already invested in Jenkins ecosystem

### Choose GitHub Actions If:

- ✅ Your code is on GitHub
- ✅ Developer experience is a priority
- ✅ You want zero maintenance overhead
- ✅ Your CI needs are standard (build, test, publish)
- ✅ You value tight PR integration

### Choose GitLab CI If:

- ✅ Your code is on GitLab
- ✅ You want integrated DevOps features (security scanning, registry, packages)
- ✅ You prefer single-vendor platform
- ✅ Auto DevOps appeals to your team
- ✅ You're willing to learn GitLab's YAML semantics

---

## 8 Migration Considerations

### Jenkins → GitHub Actions

```
Migration effort: Medium-High
- Rewrite Jenkinsfiles as GitHub Actions workflows
- Replace shared libraries with composite actions
- Migrate credentials to GitHub Secrets
- Train team on YAML syntax
- Update documentation

Timeline: 2-4 weeks for typical team
```

### GitHub Actions → GitLab CI

```
Migration effort: Low-Medium
- Convert workflow YAML to GitLab CI YAML
- Map GitHub-specific features to GitLab equivalents
- Update runner configurations
- Migrate packages/registry if using GitHub Packages

Timeline: 1-2 weeks for typical team
```

### GitLab CI → GitHub Actions

```
Migration effort: Medium
- Convert .gitlab-ci.yml to GitHub workflows
- Replace GitLab-specific features (Auto DevOps, built-in scanning)
- Set up alternative registry if using GitLab Registry
- Update MR integration to PR checks

Timeline: 2-3 weeks for typical team
```

---

## Summary: The CI Platform Decision Matrix

```mermaid
flowchart TD
    A[Start: Choose CI Platform] --> B{Code on GitHub?}
    B -->|Yes| C{DevOps capacity?}
    B -->|No| D{Code on GitLab?}
    
    C -->|None| E[GitHub Actions]
    C -->|Dedicated team| F{Cost critical?}
    F -->|Yes| G[Jenkins]
    F -->|No| E
    
    D -->|Yes| H{Want integrated features?}
    D -->|No| I[Multi-platform strategy]
    
    H -->|Yes| J[GitLab CI]
    H -->|No| K{Evaluate based on priorities}
    
    E --> L[✅ Zero maintenance<br/>✅ Best DX<br/>⚠️ Cost at scale]
    G --> M[✅ Lowest cost<br/>✅ Maximum flexibility<br/>❌ High maintenance]
    J --> N[✅ Integrated platform<br/>✅ Built-in features<br/>⚠️ GitLab lock-in]
    
    style E fill:#e3f2fd,stroke:#1976d2
    style G fill:#fff3e0,stroke:#f57c00
    style J fill:#e8f5e9,stroke:#388e3c
```

**Final Recommendation:**

| Scenario | Recommended Platform |
|----------|---------------------|
| **Startup on GitHub** | GitHub Actions |
| **Enterprise on GitLab** | GitLab CI |
| **Cost-sensitive, DevOps team available** | Jenkins |
| **Complex CI requirements** | Jenkins |
| **Developer experience priority** | GitHub Actions |
| **Integrated DevOps platform** | GitLab CI |
| **On-premise required** | Jenkins or GitLab Self-managed |

---

## The Bottom Line

There's no universally "best" CI platform. The right choice depends on your team's constraints:

| Priority | Best Choice |
|----------|-------------|
| **Minimize maintenance** | GitHub Actions |
| **Minimize cost** | Jenkins (self-hosted) |
| **Maximize flexibility** | Jenkins |
| **Best developer experience** | GitHub Actions |
| **Integrated platform** | GitLab CI |
| **Enterprise features** | GitLab CI Ultimate or Jenkins + plugins |

**The real question isn't "which CI is best?"** It's "which CI best fits our team's constraints and priorities?"

Answer that honestly, and the choice becomes clear.
