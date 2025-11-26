---
title: "IT 命名規範：為基礎設施建立清晰度"
date: 2002-12-10
lang: zh-TW
categories: Architecture
tags:
  - Infrastructure
  - Best Practices
  - DevOps
excerpt: "命名規範將基礎設施的混亂轉化為清晰。從主機名稱到資料庫表格，探索系統化命名的重要性，以及如何建立跨環境、網路和雲端平台擴展的規範。"
---

凌晨 3 點，正式環境資料庫當機。值班工程師連線到伺服器，但是哪一台？`db-server-1`、`database-prod`、`sql-main`、`dbprod01`——團隊在 12 台伺服器上使用了四種不同的命名模式。每個名稱都沒有透露環境、位置或用途的資訊。原本只需幾秒鐘的事情，變成了數分鐘的檢查設定檔，以及詢問同樣在睡夢中的隊友。

糟糕的命名規範在每個層面都造成摩擦。維運團隊浪費時間解讀神秘的主機名稱。資安稽核難以識別哪些伺服器屬於哪個環境。自動化腳本因為專案進行到一半時命名模式改變而失效。新團隊成員花費數週學習 `srv-misc-03` 實際上是做什麼的部落知識。

命名規範看似微不足道，直到它的缺失每天耗費數小時的生產力。設計良好的命名系統無需查閱文件就能提供即時的上下文——環境、位置、用途和實例。它透過使資源可預測和可發現來實現自動化。它透過明確環境邊界來防止資安事件。

本文探討 IT 基礎設施的系統化命名規範：機器主機名稱、Active Directory 群組、資料庫名稱和表格，以及公有雲資源。我們將探討為什麼某些資源不區分大小寫（DNS 遵循 RFC 1035 的不區分大小寫規範）、應包含哪些元素（環境、網路區域、位置），以及如何建立從小型團隊到全球企業都能擴展的規範。

## 命名規範的理由

在投資命名標準之前，團隊需要了解他們要解決什麼問題。

### 混亂的代價

不一致的命名會產生具體的問題：

!!!error "❌ 正式環境事故"
    **情境：部署到錯誤的環境**
    
    工程師將程式碼部署到 `app-server-2`。根據數字看起來像是測試伺服器。實際上是正式環境。客戶資料損毀。根本原因：主機名稱中沒有環境指示器。
    
    **影響：**
    - 4 小時停機時間
    - 從備份還原資料
    - 客戶信任受損
    - 事後檢討揭示過去一年有 6 次類似的險些失誤
    
    **預防：**
    
    使用規範：`prod-us-app-web-02` 對比 `dev-us-app-web-02`。環境明確。錯誤不可能發生。

!!!error "❌ 資安漏洞"
    **情境：防火牆規則配置錯誤**
    
    資安團隊建立防火牆規則，允許「所有網頁伺服器」存取資料庫。規則使用主機名稱模式 `web*`。包含了 `webdev-test-01`，這台機器位於 DMZ 供外部測試使用。外部測試人員現在可以存取正式環境資料庫。
    
    **影響：**
    - 合規違規
    - 稽核發現
    - 緊急規則修訂
    - 所有基於模式的規則的資安審查
    
    **預防：**
    
    使用規範：正式環境網頁伺服器是 `prod-{zone}-web-*`，開發伺服器是 `dev-{zone}-web-*`。網路區域明確。規則精確。

!!!error "❌ 營運效率低落"
    **情境：備份腳本失敗**
    
    備份腳本使用模式 `*prod*` 針對所有正式環境資料庫。遺漏了 `db-p-customer`（縮寫）、`database-live`（同義詞）和 `sql-main-01`（沒有環境指示器）。三個關鍵資料庫兩個月沒有備份。
    
    **影響：**
    - 在災難復原測試期間發現
    - 潛在的資料遺失窗口
    - 需要手動備份配置
    - 對自動化的信任受損
    
    **預防：**
    
    使用規範：所有正式環境資料庫符合 `prod-*-db-*`。腳本可靠。覆蓋完整。

### 系統化命名的好處

設計良好的規範提供可衡量的價值：

!!!success "✅ 即時上下文"
    **你得到什麼**
    
    每個資源名稱立即回答關鍵問題：
    - 哪個環境？（dev、staging、prod）
    - 在哪裡？（us-east、eu-west、datacenter-1）
    - 做什麼？（web、db、cache、queue）
    - 哪個實例？（01、02、primary、secondary）
    
    **範例：**
    
    `prod-useast-db-postgres-01`
    
    - 環境：正式環境
    - 位置：美國東部
    - 類型：資料庫
    - 技術：PostgreSQL
    - 實例：01
    
    **影響：**
    
    新工程師加入團隊。看到伺服器清單。立即理解基礎設施。不需要部落知識。

!!!success "✅ 自動化賦能"
    **你得到什麼**
    
    可預測的命名使自動化可靠：
    
    **備份腳本：**
    ```bash
    # 備份所有正式環境資料庫
    for db in $(list-servers | grep "^prod-.*-db-"); do
        backup-database $db
    done
    ```
    
    **監控設定：**
    ```yaml
    # 自動發現正式環境網頁伺服器
    targets:
      - pattern: "prod-*-web-*"
        metrics: [cpu, memory, requests]
        alerts: [high-cpu, high-memory]
    ```
    
    **部署管線：**
    ```python
    # 部署到正確的環境
    env = hostname.split('-')[0]  # 第一個元件是環境
    config = load_config(env)
    deploy(config)
    ```
    
    **影響：**
    
    腳本可靠運作。新資源自動包含。消除手動配置。

!!!success "✅ 資安與合規"
    **你得到什麼**
    
    清晰的邊界防止資安錯誤：
    
    **網路分段：**
    - DMZ 伺服器：`prod-dmz-*`
    - 內部伺服器：`prod-internal-*`
    - 管理伺服器：`prod-mgmt-*`
    
    防火牆規則參考命名模式。網路區域沒有歧義。
    
    **存取控制：**
    - 正式環境存取：需要核准 + MFA
    - 開發環境存取：標準驗證
    - 命名使環境顯而易見
    - 防止意外的正式環境存取
    
    **稽核軌跡：**
    - 「誰存取了正式環境資料庫？」
    - 查詢：`grep "prod-.*-db-" access.log`
    - 清晰、完整的結果
    
    **影響：**
    
    合規稽核通過。資安事件減少。存取控制有效。

!!!success "✅ 團隊協作"
    **你得到什麼**
    
    共享的命名語言改善溝通：
    
    **使用規範前：**
    - 「檢查主要資料庫伺服器」
    - 「哪一台？」
    - 「正式環境的那台」
    - 「我們有三台正式環境資料庫伺服器」
    - 「客戶資料庫」
    - 「那個在兩台伺服器上做備援」
    - 「主要的那台」
    - 「我怎麼知道哪台是主要的？」
    
    **使用規範後：**
    - 「檢查 prod-useast-db-customer-01」
    - 「完成」
    
    **影響：**
    
    溝通精確。消除誤解。加快入職速度。

## 核心命名元素

有效的命名規範包含提供上下文的特定元件。

### 環境指示器

環境必須明確且無歧義：

!!!anote "🎯 環境命名"
    **標準環境**
    - `dev` - 開發環境（活躍編碼）
    - `test` - 測試環境（QA 驗證）
    - `stage` - 預備環境（正式環境前）
    - `prod` - 正式環境（線上系統）
    
    **擴展環境**
    - `sandbox` - 實驗/學習
    - `uat` - 使用者驗收測試
    - `dr` - 災難復原
    - `demo` - 客戶展示
    
    **為什麼重要**
    - 防止部署錯誤
    - 啟用環境特定的政策
    - 釐清存取需求
    - 支援自動化

**要避免的反模式：**

```
❌ server-1, server-2          # 沒有環境指示器
❌ production-db, live-db      # 不一致的術語
❌ p-web-01, prod-web-02       # 混合縮寫
✅ prod-web-01, prod-web-02    # 一致且清晰
```

### 網路區域

網路分段應該在名稱中可見：

!!!anote "🔒 網路區域指示器"
    **常見區域**
    - `dmz` - 非軍事區（面向公眾）
    - `internal` - 內部網路（私有）
    - `mgmt` - 管理網路（管理員存取）
    - `data` - 資料層（資料庫）
    
    **資安好處**
    - 防火牆規則參考區域
    - 按區域的存取政策
    - 網路分段可見
    - 滿足合規要求
    
    **範例結構**
    - `prod-dmz-web-01` - 公開網頁伺服器
    - `prod-internal-app-01` - 內部應用程式
    - `prod-data-db-01` - 資料庫伺服器
    - `prod-mgmt-monitor-01` - 監控系統

### 地理位置

位置指示器支援多區域部署：

!!!anote "🌍 位置代碼"
    **資料中心代碼**
    - `dc1`、`dc2` - 實體資料中心
    - `hq`、`branch` - 辦公室位置
    - `colo1`、`colo2` - 主機代管設施
    
    **雲端區域**
    - `useast`、`uswest` - 美國區域
    - `euwest`、`eucentral` - 歐洲區域
    - `apsouth`、`apnortheast` - 亞太區域
    
    **為什麼重要**
    - 資料駐留合規
    - 延遲優化
    - 災難復原規劃
    - 按區域的成本分配
    
    **範例**
    - `prod-useast-web-01` - 美國東部正式環境網頁
    - `prod-euwest-db-01` - 歐洲西部正式環境資料庫
    - `dr-uswest-backup-01` - 美國西部災難復原

### 資源類型

類型指示器釐清用途：

!!!anote "📦 資源類型"
    **基礎設施元件**
    - `web` - 網頁伺服器
    - `app` - 應用程式伺服器
    - `db` - 資料庫伺服器
    - `cache` - 快取伺服器
    - `queue` - 訊息佇列
    - `lb` - 負載平衡器
    - `proxy` - 代理伺服器
    - `vpn` - VPN 閘道
    
    **支援服務**
    - `monitor` - 監控系統
    - `log` - 日誌聚合
    - `backup` - 備份伺服器
    - `build` - 建置伺服器
    - `deploy` - 部署伺服器
    
    **特定性層級**
    - 通用：`db`（任何資料庫）
    - 特定：`db-postgres`、`db-mysql`、`db-redis`
    - 非常特定：`db-postgres-primary`、`db-postgres-replica`

### 實例編號

實例識別器處理多個資源：

!!!anote "🔢 實例編號"
    **順序編號**
    - `01`、`02`、`03` - 零填充以便排序
    - 擴展到 99 個實例
    - 100+ 個實例使用 `001`
    
    **功能命名**
    - `primary`、`secondary` - 基於角色
    - `master`、`replica` - 複製階層
    - `active`、`standby` - 可用性狀態
    
    **混合方法**
    - `primary-01`、`replica-01`、`replica-02`
    - 結合角色和實例編號
    - 對複雜設定最清晰
    
    **考量**
    - 順序：容易新增實例
    - 功能：揭示用途
    - 混合：兩者兼得
    
    **範例**
    - `prod-useast-web-01` 到 `prod-useast-web-05`
    - `prod-useast-db-primary-01`
    - `prod-useast-db-replica-01`

## 大小寫敏感性考量

不同的 IT 資源有不同的大小寫敏感性規則。

### DNS 和主機名稱

DNS 根據規範不區分大小寫：

!!!anote "📜 RFC 1035：DNS 大小寫不敏感"
    **標準**
    
    RFC 1035（網域名稱 - 實作與規範）將 DNS 定義為不區分大小寫：
    
    「當你比較兩個網域名稱時，必須以不區分大小寫的方式比較它們。」
    
    **這意味著什麼**
    - `PROD-WEB-01.example.com` = `prod-web-01.example.com`
    - `Prod-Web-01.example.com` = `prod-web-01.example.com`
    - 所有變體都解析到相同的 IP 位址
    
    **為什麼小寫是標準**
    - 文件中的一致性
    - 更容易輸入
    - 避免混淆
    - 通用慣例
    
    **最佳實踐**
    
    主機名稱始終使用小寫：
    ```
    ✅ prod-useast-web-01
    ❌ PROD-USEAST-WEB-01
    ❌ Prod-UsEast-Web-01
    ```

**跨平台相容性：**

!!!tip "💡 主機名稱可攜性"
    **Windows**
    - 預設不區分大小寫
    - 顯示為輸入的內容但匹配任何大小寫
    - NetBIOS 名稱限制為 15 個字元
    
    **Linux/Unix**
    - 主機名稱不區分大小寫（DNS）
    - 檔案系統路徑區分大小寫
    - 慣例：小寫主機名稱
    
    **最佳實踐**
    
    在任何地方都使用小寫以避免混淆：
    - 主機名稱：`prod-web-01`
    - DNS 記錄：`prod-web-01.example.com`
    - 配置檔案：`prod-web-01`
    - 文件：`prod-web-01`

### 區分大小寫的資源

某些資源需要謹慎處理大小寫：

!!!warning "⚠️ 區分大小寫的系統"
    **Linux 檔案系統**
    
    路徑和檔案名稱區分大小寫：
    ```bash
    /var/log/app.log ≠ /var/log/App.log
    /home/user/config ≠ /home/user/Config
    ```
    
    **影響：**
    - 腳本必須使用精確的大小寫
    - 拼寫錯誤會產生難以發現的錯誤
    - 最佳實踐：路徑使用小寫
    
    **資料庫物件名稱**
    
    行為因資料庫而異：
    
    **PostgreSQL：**
    - 未加引號的識別符折疊為小寫
    - 加引號的識別符區分大小寫
    ```sql
    CREATE TABLE Users;        -- 建立 "users"
    CREATE TABLE "Users";      -- 建立 "Users"
    SELECT * FROM Users;       -- 查詢 "users"
    SELECT * FROM "Users";     -- 查詢 "Users"
    ```
    
    **MySQL：**
    - 大小寫敏感性取決於作業系統
    - Windows：不區分大小寫
    - Linux：區分大小寫
    - 最佳實踐：使用小寫
    
    **SQL Server：**
    - 取決於定序
    - 預設：不區分大小寫
    - 可以按資料庫配置
    
    **Oracle：**
    - 未加引號的識別符折疊為大寫
    - 加引號的識別符區分大小寫
    
    **最佳實踐：**
    ```sql
    ✅ 使用小寫、未加引號的識別符
    CREATE TABLE users (...);
    CREATE TABLE order_items (...);
    
    ❌ 避免混合大小寫
    CREATE TABLE "UserAccounts" (...);
    CREATE TABLE "OrderItems" (...);
    ```

!!!warning "⚠️ 雲端資源標籤"
    **AWS**
    - 標籤鍵區分大小寫
    - `Environment` ≠ `environment`
    - 可以建立不同大小寫的重複標籤
    
    **Azure**
    - 標籤名稱不區分大小寫
    - 儲存為輸入的內容
    - 以不區分大小寫的方式匹配
    
    **GCP**
    - 標籤（GCP 的標籤）區分大小寫
    - 必須是小寫
    - 由平台強制執行
    
    **最佳實踐：**
    
    所有標籤/標籤使用小寫：
    ```yaml
    ✅ 跨平台一致
    tags:
      environment: prod
      application: web
      owner: platform-team
    
    ❌ 造成問題
    tags:
      Environment: prod
      Application: web
      Owner: platform-team
    ```

### 混合環境的最佳實踐

!!!success "✅ 通用指南"
    **預設為小寫**
    - 在任何地方都有效
    - 避免大小寫敏感性問題
    - 更容易輸入和記憶
    
    **保持一致**
    - 選擇一種風格
    - 記錄它
    - 強制執行它
    
    **避免駝峰式和帕斯卡式**
    - 難以程式化解析
    - 不一致的單詞邊界
    - 改用連字號或底線
    
    **範例：**
    ```
    ✅ prod-useast-web-01
    ✅ prod_useast_web_01
    ❌ prodUsEastWeb01
    ❌ ProdUsEastWeb01
    ```
    
    **分隔符選擇**
    - 主機名稱：使用連字號（不允許底線）
    - 資料庫：使用底線（在 SQL 中更易讀）
    - 雲端標籤：使用連字號（更常見）
    - 檔案路徑：使用連字號或底線（避免空格）

## 資源特定的規範

不同的資源類型需要客製化的命名方法。

### 機器主機名稱

主機名稱有特定的技術約束：

!!!anote "🖥️ 主機名稱要求"
    **技術約束**
    - 每個標籤最多 63 個字元
    - 總 FQDN：253 個字元
    - 允許：字母、數字、連字號
    - 不能以連字號開始或結束
    - 不區分大小寫（使用小寫）
    
    **建議的結構**
    ```
    {environment}-{location}-{type}-{function}-{instance}
    ```
    
    **元件長度**
    - 環境：3-4 字元（`dev`、`prod`）
    - 位置：4-8 字元（`useast`、`euwest`）
    - 類型：2-4 字元（`web`、`db`、`app`）
    - 功能：4-10 字元（`api`、`admin`、`customer`）
    - 實例：2 字元（`01`、`02`）
    
    **總計：~20-30 個字元**（遠低於 63 限制）

**按環境的範例：**

```
開發環境：
dev-useast-web-api-01
dev-useast-app-auth-01
dev-useast-db-postgres-01

預備環境：
stage-useast-web-api-01
stage-useast-app-auth-01
stage-useast-db-postgres-01

正式環境：
prod-useast-web-api-01
prod-useast-web-api-02
prod-useast-app-auth-01
prod-useast-db-postgres-primary-01
prod-useast-db-postgres-replica-01
prod-uswest-web-api-01  # 不同區域
```

### Active Directory 群組

AD 群組需要階層式命名：

!!!anote "📁 AD 群組結構"
    **群組類型**
    - 安全群組：存取控制
    - 通訊群組：電子郵件清單
    
    **建議的結構**
    ```
    {type}_{scope}_{resource}_{permission}
    ```
    
    **類型前綴**
    - `SEC_` - 安全群組
    - `DL_` - 通訊清單
    - `APP_` - 應用程式特定
    - `ROLE_` - 基於角色的存取
    
    **範圍指示器**
    - `GLOBAL` - 企業級
    - `DOMAIN` - 網域特定
    - `LOCAL` - 資源本地
    
    **權限等級**
    - `ADMIN` - 完整管理存取
    - `WRITE` - 讀寫存取
    - `READ` - 唯讀存取
    - `EXEC` - 執行權限

**範例：**

```
安全群組：
SEC_PROD_DATABASE_ADMIN
SEC_PROD_DATABASE_READ
SEC_PROD_WEBSERVER_ADMIN
SEC_DEV_ALL_ADMIN

應用程式群組：
APP_SALESFORCE_ADMIN
APP_SALESFORCE_USER
APP_JIRA_ADMIN
APP_JIRA_USER

角色群組：
ROLE_DEVELOPERS
ROLE_OPERATIONS
ROLE_SECURITY_TEAM
ROLE_DATABASE_ADMINS

通訊清單：
DL_ENGINEERING_ALL
DL_OPERATIONS_ONCALL
DL_SECURITY_ALERTS
```

### 資料庫名稱

資料庫命名影響組織和存取：

!!!anote "💾 資料庫命名"
    **建議的結構**
    ```
    {environment}_{application}_{purpose}
    ```
    
    **環境前綴**
    - `dev_` - 開發
    - `test_` - 測試
    - `stage_` - 預備
    - `prod_` - 正式
    
    **為什麼以環境為前綴**
    - 防止意外連線
    - 在連線字串中清晰
    - 啟用環境特定的策略
    - 支援同一伺服器上的多個環境

**範例：**

```
應用程式資料庫：
prod_ecommerce_main
prod_ecommerce_analytics
prod_crm_main
prod_inventory_main

開發資料庫：
dev_ecommerce_main
dev_ecommerce_analytics
dev_crm_main

共享資料庫：
prod_shared_auth
prod_shared_logging
prod_shared_config
```

### 資料庫表格

表格命名影響查詢可讀性：

!!!anote "📋 表格命名規範"
    **單數與複數的議題**
    
    **單數（建議）**
    - 代表一個實體
    - 在程式碼中更清晰：`user.name` 而不是 `users.name`
    - 與 ORM 慣例一致
    ```sql
    user
    order
    product
    order_item
    ```
    
    **複數**
    - 代表集合
    - 在 SQL 中更自然：`SELECT * FROM users`
    ```sql
    users
    orders
    products
    order_items
    ```
    
    **選擇一個並保持一致**

**命名模式：**

```sql
-- 實體表格（單數）
user
product
order
customer

-- 連接表格（兩個實體）
user_role
product_category
order_item

-- 查找表格（後綴 _type 或 _status）
order_status
payment_type
shipping_method

-- 稽核表格（後綴 _audit 或 _history）
user_audit
order_history
price_history

-- 臨時表格（前綴 temp_）
temp_import_data
temp_calculation_results
```

### 雲端資源

雲端平台有特定的命名要求：

!!!anote "☁️ AWS 命名規範"
    **EC2 實例**
    - 使用 Name 標籤：`prod-useast-web-api-01`
    
    **S3 儲存桶**
    - 全球唯一
    - 小寫、數字、連字號
    - 模式：`{org}-{env}-{purpose}-{region}`
    ```
    acme-prod-backups-useast1
    acme-prod-logs-useast1
    ```
    
    **RDS 實例**
    ```
    prod-useast-postgres-customer-01
    prod-useast-mysql-inventory-01
    ```

!!!anote "☁️ Azure 命名規範"
    **資源群組**
    ```
    rg-prod-useast-web
    rg-prod-useast-data
    ```
    
    **虛擬機器**
    ```
    vm-prod-useast-web-01
    vm-prod-useast-app-01
    ```

!!!anote "☁️ GCP 命名規範"
    **Compute 實例**
    ```
    prod-useast-web-api-01
    prod-useast-app-auth-01
    ```
    
    **Cloud Storage 儲存桶**
    ```
    acme-prod-backups-us-east1
    acme-prod-logs-us-east1
    ```

**標籤標準化：**

!!!success "✅ 通用標籤架構"
    **必需標籤**
    ```yaml
    environment: prod|stage|dev|test
    application: web|api|database|cache
    owner: team-name or email
    cost-center: department or project code
    ```
    
    **可選標籤**
    ```yaml
    backup: daily|weekly|none
    monitoring: enabled|disabled
    compliance: pci|hipaa|sox|none
    ```

## 建立你的規範

建立有效的命名規範需要系統化的方法。

### 評估階段

從了解現狀開始：

!!!anote "🔍 評估清單"
    **盤點現有資源**
    - 列出所有主機名稱、資料庫、AD 群組
    - 識別命名模式（或缺乏模式）
    - 記錄例外和特殊情況
    - 按類型計算資源
    
    **識別痛點**
    - 調查團隊關於命名混淆的意見
    - 審查事故報告中與命名相關的問題
    - 檢查自動化腳本中的命名解決方案
    - 分析識別資源所花費的時間
    
    **利益相關者需求**
    - 維運：自動化需求
    - 資安：存取控制清晰度
    - 合規：稽核要求
    - 開發：整合模式
    - 財務：成本分配追蹤

### 設計原則

以清晰的原則指導規範設計：

!!!success "✅ 設計指南"
    **一致性優於完美**
    - 有不完美的規範比沒有規範好
    - 一致性啟用自動化
    - 可以隨時間改進
    - 不要讓完美成為良好的敵人
    
    **可擴展性考量**
    - 它能處理 10 倍的資源嗎？
    - 它支援多個區域嗎？
    - 它能處理新的資源類型嗎？
    - 有成長空間嗎？
    
    **人類可讀性與機器解析**
    - 人類每天閱讀名稱
    - 機器不斷解析名稱
    - 平衡兩者需求
    - 使用分隔符（連字號/底線）
    - 避免難懂的縮寫

### 實施策略

系統化地推出規範：

!!!tip "💡 實施階段"
    **階段 1：新資源**
    - 將規範應用於所有新資源
    - 最容易實施
    - 建立動力
    - 展示價值
    
    **階段 2：高影響資源**
    - 重新命名正式環境資料庫
    - 更新關鍵伺服器
    - 專注於經常存取的資源
    - 最大效益
    
    **階段 3：系統化遷移**
    - 重新命名剩餘資源
    - 更新文件
    - 遷移自動化腳本
    - 完成轉換
    
    **階段 4：持續強制執行**
    - 自動化驗證
    - 程式碼審查檢查
    - 定期稽核
    - 持續合規

### 治理與強制執行

隨時間維護規範：

!!!anote "📜 治理框架"
    **策略文件**
    - 書面命名標準
    - 每種資源類型的範例
    - 例外流程
    - 審查和更新時間表
    
    **自動化驗證**
    - 部署前檢查
    - CI/CD 管線整合
    - 雲端策略強制執行
    - 定期合規掃描
    
    **程式碼審查整合**
    - 基礎設施即程式碼審查
    - Terraform/CloudFormation 驗證
    - Pull request 檢查
    - 自動化評論
    
    **持續改進**
    - 季度規範審查
    - 回饋收集
    - 模式改進
    - 文件更新

## 要避免的反模式

常見的錯誤會破壞命名規範。

### 模糊的縮寫

難懂的捷徑造成混淆：

!!!error "❌ 縮寫問題"
    **有問題的範例**
    ```
    ❌ srv-p-db-01        # 'p' 是什麼？正式環境？主要？PostgreSQL？
    ❌ app-e-web-01       # 'e' 是什麼？東部？歐洲？外部？
    ❌ db-c-01            # 'c' 是什麼？快取？客戶？中央？
    ```
    
    **更好的替代方案**
    ```
    ✅ prod-useast-db-postgres-01
    ✅ prod-euwest-web-external-01
    ✅ prod-useast-cache-redis-01
    ```
    
    **指南**
    - 使用完整單詞以清晰
    - 僅使用標準縮寫（db、web、app）
    - 記錄所有縮寫
    - 疑惑時，完整拼寫

### 不一致的分隔符

混合分隔符風格造成問題：

!!!error "❌ 分隔符不一致"
    **有問題的範例**
    ```
    ❌ prod-web_01         # 混合連字號和底線
    ❌ prodWebServer01     # 主機名稱中的駝峰式
    ❌ prod.web.01         # 點（與 FQDN 混淆）
    ❌ prod web 01         # 空格（不允許）
    ```
    
    **一致的方法**
    ```
    ✅ 主機名稱：使用連字號
    prod-useast-web-01
    
    ✅ 資料庫：使用底線
    prod_ecommerce_main
    
    ✅ AD 群組：使用底線
    SEC_PROD_DATABASE_ADMIN
    ```

### 過於複雜的方案

太多元件降低可用性：

!!!error "❌ 複雜度過載"
    **有問題的範例**
    ```
    ❌ prod-v2-useast-1a-dmz-web-nginx-api-customer-v1-blue-01
    ```
    
    **問題**
    - 12 個元件
    - 難以記憶
    - 容易犯錯
    - 難以輸入
    
    **簡化版本**
    ```
    ✅ prod-useast-web-api-01
    ```
    
    **通過標籤的額外上下文**
    ```yaml
    Name: prod-useast-web-api-01
    Tags:
      version: v2
      availability-zone: us-east-1a
      network-zone: dmz
      software: nginx
    ```

### 缺少關鍵資訊

不完整的名稱造成模糊：

!!!error "❌ 上下文不足"
    **環境模糊**
    ```
    ❌ web-server-01       # 哪個環境？
    ❌ database-main       # 正式還是開發？
    ✅ prod-useast-web-01
    ✅ dev-useast-db-01
    ```
    
    **位置不確定**
    ```
    ❌ prod-web-01         # 哪個區域/資料中心？
    ❌ prod-db-primary     # 它在哪裡？
    ✅ prod-useast-web-01
    ✅ prod-euwest-db-primary-01
    ```
    
    **目的不清楚**
    ```
    ❌ prod-server-01      # 它做什麼？
    ❌ prod-app-01         # 哪個應用程式？
    ✅ prod-useast-web-storefront-01
    ✅ prod-useast-app-checkout-01
    ```

## 工具與自動化

自動化可靠地強制執行規範。

### 驗證工具

自動化檢查防止命名違規：

!!!tip "💡 驗證方法"
    **Pre-Commit Hooks**
    ```bash
    #!/bin/bash
    # .git/hooks/pre-commit
    
    # 驗證 Terraform 資源名稱
    terraform_files=$(git diff --cached --name-only | grep '.tf$')
    
    for file in $terraform_files; do
        if grep -q 'resource "aws_instance"' $file; then
            if ! grep -E 'Name.*=.*(prod|dev|stage)-[a-z]+-[a-z]+-[a-z]+-[0-9]+' $file; then
                echo "錯誤：$file 中的 EC2 實例名稱無效"
                echo "預期：{env}-{location}-{type}-{function}-{instance}"
                exit 1
            fi
        fi
    done
    ```
    
    **CI/CD 管線檢查**
    ```yaml
    # .github/workflows/validate-naming.yml
    name: 驗證命名規範
    
    on: [pull_request]
    
    jobs:
      validate:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2
          
          - name: 驗證基礎設施名稱
            run: |
              python scripts/validate-naming.py \
                --terraform terraform/ \
                --policy naming-policy.yaml
    ```

## 結論

命名規範形成可管理基礎設施的基礎。看似簡單的決定——如何命名伺服器或資料庫——在數百或數千個資源中累積起來。糟糕的命名在每個層面都造成摩擦：維運團隊浪費時間識別資源，資安團隊難以強制執行策略，自動化在不一致的模式上失敗，新團隊成員面臨陡峭的學習曲線。

系統化的命名規範通過將上下文直接編碼到資源名稱中來解決這些問題。命名良好的資源立即回答基本問題：哪個環境？在哪裡？做什麼？這種清晰度啟用自動化，防止資安錯誤，並加速故障排除。

關鍵元素——環境指示器、位置代碼、資源類型和實例編號——提供結構而不會過度複雜。了解大小寫敏感性很重要：DNS 根據 RFC 1035 不區分大小寫，但 Linux 檔案系統和許多資料庫系統區分大小寫。在任何地方預設為小寫可以避免跨平台問題。

不同的資源需要不同的方法。主機名稱遵循嚴格的技術約束（63 個字元，有限的字元集）。Active Directory 群組受益於具有清晰類型和權限指示器的階層式命名。資料庫名稱和表格需要在其生態系統內的一致性。雲端資源跨越多個平台，每個平台都有特定的要求，使標籤標準化至關重要。

實施通過分階段推出成功：從新資源開始，遷移高影響系統，然後系統化地更新剩餘的基礎設施。自動化通過驗證腳本、CI/CD 整合和雲端策略引擎強制執行規範。文件使規範可訪問並為常見情境提供範例。

遷移需要仔細規劃。DNS 別名和資料庫同義詞啟用漸進式轉換，而不會破壞現有應用程式。清晰的溝通、全面的文件和專用的支援渠道幫助團隊適應。投資回報紅利：減少的維運開銷、更少的資安事件、可靠的自動化和更快的入職。

反模式——模糊的縮寫、不一致的分隔符、過於複雜的方案、缺少關鍵資訊——會破壞規範。簡單性和一致性比完美更重要。每個人都遵循的規範勝過沒有人記得的完美規範。

命名規範隨基礎設施演進。定期審查納入回饋，適應新的資源類型，並根據經驗改進模式。目標不是靜態的完美，而是與組織需求一致的持續改進。

從小處開始。選擇一種資源類型——也許是新的 EC2 實例或資料庫表格。定義清晰的模式。用範例記錄它。一致地應用它。衡量影響：更快的故障排除、更可靠的自動化、更少的錯誤。然後擴展到其他資源類型。

大規模的基礎設施需要對看似簡單的決定採取系統化的方法。命名規範提供了這個系統。它們將混亂轉化為清晰，一次一個資源。
