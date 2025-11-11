---
title: "非同步請求-回覆模式：建構響應式分散式系統"
date: 2020-04-20
lang: zh-TW
categories:
  - Architecture
series: architecture_pattern
excerpt: "了解非同步請求-回覆模式如何透過將長時間執行的操作與即時回應解耦，實現響應式應用程式，防止逾時並改善使用者體驗。"
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

現代應用程式經常需要執行需要大量時間完成的操作——處理大型檔案、產生複雜報表，或呼叫緩慢的外部 API。當這些操作阻塞請求執行緒時，會造成糟糕的使用者體驗，並可能耗盡伺服器資源。非同步請求-回覆模式透過將請求與回應解耦來解決這個問題，讓應用程式在背景處理工作時保持響應。

## 問題：當操作耗時過長

傳統的同步請求-回應模型適用於快速操作。客戶端發送請求，等待處理，然後接收回應——全部在幾秒內完成。然而，當操作耗時較長時，這個模型就會失效：

- **逾時失敗**：HTTP 連線在處理完成前逾時
- **資源耗盡**：執行緒保持阻塞狀態，限制並行請求數量
- **糟糕的使用者體驗**：使用者盯著載入動畫或凍結的介面
- **連鎖故障**：緩慢的操作可能導致整個系統當機

!!!warning "⚠️ 同步陷阱"
    單一耗時 30 秒的緩慢操作可能在整個期間佔用一個執行緒。在執行緒數量有限的情況下，僅僅幾個緩慢的請求就能讓整個應用程式對新請求無回應。

考慮這些常見場景：

- **影片處理**：將上傳的影片轉換為多種格式
- **報表產生**：從大型資料集建立複雜的分析報表
- **批次操作**：在單一請求中處理數千筆記錄
- **外部 API 呼叫**：等待緩慢的第三方服務
- **機器學習**：在大型模型上執行推論

## 解決方案：將請求與回應解耦

非同步請求-回覆模式將請求提交與結果擷取分離：

1. **客戶端提交請求**並立即收到確認訊息及狀態端點
2. **伺服器在背景非同步處理**
3. **客戶端輪詢狀態端點**或在完成時接收回呼
4. **客戶端在處理完成時擷取結果**

{% mermaid %}
sequenceDiagram
    participant Client as 客戶端
    participant API as API 閘道
    participant Queue as 訊息佇列
    participant Worker as 背景工作程序
    participant Storage as 結果儲存
    
    Client->>API: 1. POST /process (請求)
    API->>Queue: 2. 將任務加入佇列
    API-->>Client: 3. 202 Accepted + 狀態 URL
    
    Note over Client: 客戶端可自由執行其他工作
    
    Worker->>Queue: 4. 從佇列取出任務
    Worker->>Worker: 5. 處理（長時間操作）
    Worker->>Storage: 6. 儲存結果
    
    Client->>API: 7. GET /status/{id}
    API->>Storage: 8. 檢查狀態
    Storage-->>API: 9. 狀態：完成
    API-->>Client: 10. 200 OK + 結果 URL
    
    Client->>API: 11. GET /result/{id}
    API->>Storage: 12. 擷取結果
    Storage-->>API: 13. 回傳結果
    API-->>Client: 14. 200 OK + 結果資料
{% endmermaid %}

## 運作方式：模式實戰

讓我們逐步了解如何為影片轉碼服務實作此模式：

### 步驟 1：提交請求

客戶端啟動處理並立即收到確認：

```javascript
// 客戶端提交影片進行處理
const response = await fetch('/api/videos/transcode', {
  method: 'POST',
  body: JSON.stringify({
    videoUrl: 'https://neo01.com/video.mp4',
    formats: ['720p', '1080p', '4k']
  })
});

// 伺服器立即回應 202 Accepted
// {
//   "jobId": "job-12345",
//   "status": "pending",
//   "statusUrl": "/api/videos/status/job-12345"
// }

const { jobId, statusUrl } = await response.json();
```

### 步驟 2：非同步處理

伺服器將工作加入佇列並在背景處理：

```javascript
// API 端點處理器
app.post('/api/videos/transcode', async (req, res) => {
  const jobId = generateJobId();
  
  // 儲存工作中繼資料
  await jobStore.create({
    id: jobId,
    status: 'pending',
    request: req.body,
    createdAt: Date.now()
  });
  
  // 加入佇列進行背景處理
  await messageQueue.send({
    jobId,
    videoUrl: req.body.videoUrl,
    formats: req.body.formats
  });
  
  // 立即回應
  res.status(202).json({
    jobId,
    status: 'pending',
    statusUrl: `/api/videos/status/${jobId}`
  });
});

// 背景工作程序
messageQueue.subscribe(async (message) => {
  await jobStore.update(message.jobId, { status: 'processing' });
  
  try {
    const results = await transcodeVideo(
      message.videoUrl,
      message.formats
    );
    
    await jobStore.update(message.jobId, {
      status: 'completed',
      results,
      completedAt: Date.now()
    });
  } catch (error) {
    await jobStore.update(message.jobId, {
      status: 'failed',
      error: error.message
    });
  }
});
```

### 步驟 3：檢查狀態

客戶端輪詢狀態端點以追蹤進度：

```javascript
// 客戶端輪詢完成狀態
async function waitForCompletion(statusUrl) {
  while (true) {
    const response = await fetch(statusUrl);
    const status = await response.json();
    
    if (status.status === 'completed') {
      return status.results;
    }
    
    if (status.status === 'failed') {
      throw new Error(status.error);
    }
    
    // 再次輪詢前等待
    await sleep(2000);
  }
}

// 狀態端點
app.get('/api/videos/status/:jobId', async (req, res) => {
  const job = await jobStore.get(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    jobId: job.id,
    status: job.status,
    results: job.results,
    createdAt: job.createdAt,
    completedAt: job.completedAt
  });
});
```

## 實作策略

### 策略 1：輪詢

客戶端定期檢查狀態端點：

**優點：**
- 實作簡單
- 適用於任何 HTTP 客戶端
- 不需要伺服器端回呼基礎設施

**缺點：**
- 增加網路流量
- 延遲通知（輪詢間隔）
- 當沒有變化時浪費請求

```javascript
// 指數退避輪詢
async function pollWithBackoff(statusUrl, maxAttempts = 30) {
  let delay = 1000; // 從 1 秒開始
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkStatus(statusUrl);
    
    if (status.status !== 'pending' && status.status !== 'processing') {
      return status;
    }
    
    await sleep(delay);
    delay = Math.min(delay * 1.5, 30000); // 最多 30 秒
  }
  
  throw new Error('Polling timeout');
}
```

### 策略 2：Webhooks

伺服器在處理完成時回呼客戶端：

**優點：**
- 立即通知
- 不浪費輪詢請求
- 有效利用資源

**缺點：**
- 需要可公開存取的回呼 URL
- 更複雜的錯誤處理
- 安全性考量（驗證、確認）

```javascript
// 客戶端提供回呼 URL
await fetch('/api/videos/transcode', {
  method: 'POST',
  body: JSON.stringify({
    videoUrl: 'https://neo01.com/video.mp4',
    formats: ['720p', '1080p'],
    callbackUrl: 'https://client.com/webhook/video-complete'
  })
});

// 伺服器在完成時呼叫 webhook
async function notifyCompletion(job) {
  if (job.callbackUrl) {
    await fetch(job.callbackUrl, {
      method: 'POST',
      headers: {
        'X-Signature': generateSignature(job),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId: job.id,
        status: job.status,
        results: job.results
      })
    });
  }
}
```

### 策略 3：WebSockets

維護持久連線以進行即時更新：

**優點：**
- 即時雙向通訊
- 對多次更新有效率
- 適合進度追蹤

**缺點：**
- 更複雜的基礎設施
- 連線管理開銷
- 不適用於所有環境

```javascript
// 客戶端建立 WebSocket 連線
const ws = new WebSocket(`wss://api.neo01.com/jobs/${jobId}`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  if (update.status === 'processing') {
    console.log(`進度：${update.progress}%`);
  } else if (update.status === 'completed') {
    console.log('工作完成：', update.results);
    ws.close();
  }
};
```

## 關鍵實作考量

### 1. 狀態端點設計

設計清晰、資訊豐富的狀態回應：

```javascript
// 設計良好的狀態回應
{
  "jobId": "job-12345",
  "status": "processing",
  "progress": 65,
  "message": "正在轉碼為 1080p 格式",
  "createdAt": "2020-04-15T10:30:00Z",
  "estimatedCompletion": "2020-04-15T10:35:00Z",
  "_links": {
    "self": "/api/videos/status/job-12345",
    "cancel": "/api/videos/cancel/job-12345"
  }
}
```

### 2. HTTP 狀態碼

使用適當的狀態碼來傳達狀態：

- **202 Accepted**：請求已接受處理
- **200 OK**：狀態檢查成功
- **303 See Other**：處理完成，重新導向至結果
- **404 Not Found**：工作 ID 不存在
- **410 Gone**：工作已過期或清理

### 3. 結果儲存與過期

實作結果的生命週期管理：

```javascript
// 儲存具有 TTL 的結果
await resultStore.set(jobId, result, {
  expiresIn: 24 * 60 * 60 // 24 小時
});

// 清理過期的工作
setInterval(async () => {
  const expiredJobs = await jobStore.findExpired();
  
  for (const job of expiredJobs) {
    await resultStore.delete(job.id);
    await jobStore.delete(job.id);
  }
}, 60 * 60 * 1000); // 每小時
```

### 4. 冪等性

確保請求可以安全地重試：

```javascript
// 使用冪等性金鑰
app.post('/api/videos/transcode', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // 檢查是否已處理
  const existing = await jobStore.findByIdempotencyKey(idempotencyKey);
  if (existing) {
    return res.status(202).json({
      jobId: existing.id,
      status: existing.status,
      statusUrl: `/api/videos/status/${existing.id}`
    });
  }
  
  // 處理新請求
  const jobId = await createJob(req.body, idempotencyKey);
  // ...
});
```

## 何時使用此模式

### 理想場景

!!!success "✅ 完美使用案例"
    **長時間執行的操作**：需要超過幾秒才能完成的任務
    
    **資源密集型處理**：消耗大量 CPU、記憶體或 I/O 的操作
    
    **外部相依性**：呼叫緩慢或不可靠的第三方服務
    
    **批次處理**：對大型資料集或多個項目的操作

### 考慮替代方案的情況

!!!info "🤔 請三思如果..."
    **快速操作**：次秒級操作不會從非同步複雜性中受益
    
    **簡單使用案例**：直接的 CRUD 操作同步運作良好
    
    **即時需求**：當絕對需要立即結果時

## 架構品質屬性

### 可擴展性

此模式實現水平擴展：

- **工作程序擴展**：新增更多背景工作程序以處理增加的負載
- **佇列緩衝**：訊息佇列吸收流量高峰
- **資源最佳化**：API 和處理層獨立擴展

### 韌性

透過以下方式增強容錯能力：

- **重試邏輯**：失敗的工作可以自動重試
- **斷路器**：防止連鎖故障
- **優雅降級**：即使工作程序過載，API 仍保持響應

### 使用者體驗

改善響應性：

- **即時回饋**：使用者獲得即時確認
- **進度更新**：顯示處理狀態和預估完成時間
- **非阻塞**：使用者可以在等待時繼續其他活動

## 常見陷阱與解決方案

!!!warning "⚠️ 注意"
    **輪詢風暴**：太多客戶端過於頻繁地輪詢
    
    **解決方案**：實作指數退避和速率限制

!!!warning "⚠️ 注意"
    **遺失結果**：結果在客戶端擷取前過期
    
    **解決方案**：設定適當的 TTL 並在過期前通知客戶端

!!!warning "⚠️ 注意"
    **孤立工作**：工作永遠卡在處理狀態
    
    **解決方案**：實作工作逾時和死信佇列

## 實際範例：文件處理服務

這是一個完整的文件處理服務範例：

```javascript
// API 層
class DocumentProcessingAPI {
  async submitDocument(file, options) {
    const jobId = uuidv4();
    
    // 上傳檔案至儲存
    const fileUrl = await storage.upload(file);
    
    // 建立工作記錄
    await db.jobs.create({
      id: jobId,
      status: 'pending',
      fileUrl,
      options,
      createdAt: new Date()
    });
    
    // 加入佇列進行處理
    await queue.publish('document-processing', {
      jobId,
      fileUrl,
      options
    });
    
    return {
      jobId,
      statusUrl: `/api/documents/status/${jobId}`
    };
  }
  
  async getStatus(jobId) {
    const job = await db.jobs.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job not found');
    }
    
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error
    };
  }
}

// 工作程序層
class DocumentProcessor {
  async processJob(message) {
    const { jobId, fileUrl, options } = message;
    
    try {
      await this.updateStatus(jobId, 'processing', 0);
      
      // 下載文件
      const document = await storage.download(fileUrl);
      await this.updateStatus(jobId, 'processing', 25);
      
      // 提取文字
      const text = await this.extractText(document);
      await this.updateStatus(jobId, 'processing', 50);
      
      // 分析內容
      const analysis = await this.analyzeContent(text, options);
      await this.updateStatus(jobId, 'processing', 75);
      
      // 產生報表
      const report = await this.generateReport(analysis);
      await this.updateStatus(jobId, 'processing', 90);
      
      // 儲存結果
      const resultUrl = await storage.upload(report);
      await this.updateStatus(jobId, 'completed', 100, { resultUrl });
      
    } catch (error) {
      await this.updateStatus(jobId, 'failed', null, null, error.message);
      throw error;
    }
  }
  
  async updateStatus(jobId, status, progress, result = null, error = null) {
    await db.jobs.update(jobId, {
      status,
      progress,
      result,
      error,
      updatedAt: new Date()
    });
  }
}
```

## 結論

非同步請求-回覆模式對於建構響應式、可擴展的分散式系統至關重要。透過將長時間執行的操作與即時回應解耦，它實現了：

- **更好的使用者體驗**：即時回饋和非阻塞操作
- **改善的可擴展性**：API 和處理層獨立擴展
- **增強的韌性**：優雅地處理故障和重試
- **資源效率**：最佳利用執行緒和連線

雖然它透過狀態追蹤和結果管理引入了複雜性，但對於需要超過幾秒的操作，其好處遠遠超過成本。當您需要執行耗時的工作而不阻塞客戶端時，請考慮使用此模式。

## 相關模式

- **Claim-Check 模式**：補充非同步處理以處理大型負載
- **基於佇列的負載平衡**：使用訊息佇列平滑流量高峰
- **競爭消費者**：實現佇列工作的並行處理
- **優先佇列**：在其他工作之前處理高優先順序工作

## 參考資料

- [Microsoft Azure 架構模式：非同步請求-回覆](https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply)
- [企業整合模式：請求-回覆](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RequestReply.html)
