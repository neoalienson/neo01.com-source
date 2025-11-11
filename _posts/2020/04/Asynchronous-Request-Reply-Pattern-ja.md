---
title: "非同期リクエスト-レスポンスパターン：レスポンシブな分散システムの構築"
date: 2020-04-20
categories: Architecture
tags:
  - Architecture
  - Design Patterns
  - Messaging
series: architecture_pattern
excerpt: "非同期リクエスト-レスポンスパターンが、長時間実行される操作を即座のレスポンスから切り離すことで、タイムアウトを防ぎ、ユーザーエクスペリエンスを向上させる方法を解説します。"
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
lang: ja
comments: true
---

現代のアプリケーションは、完了するまでに長時間かかる操作を実行する必要があることがよくあります。大きなファイルの処理、複雑なレポートの生成、遅い外部APIの呼び出しなどです。これらの操作がリクエストスレッドをブロックすると、ユーザーエクスペリエンスが悪化し、サーバーリソースを枯渇させる可能性があります。非同期リクエスト-レスポンスパターンは、リクエストとレスポンスを切り離すことでこれを解決し、バックグラウンドで作業が行われている間もアプリケーションがレスポンシブであり続けることを可能にします。

## 問題：操作に時間がかかりすぎる場合

従来の同期リクエスト-レスポンスモデルは、高速な操作には適しています。クライアントがリクエストを送信し、処理を待ち、レスポンスを受け取る—すべてが数秒以内に完了します。しかし、操作に時間がかかる場合、このモデルは破綻します：

- **タイムアウト障害**：処理が完了する前にHTTP接続がタイムアウトする
- **リソースの枯渇**：スレッドがブロックされたままになり、同時リクエストが制限される
- **ユーザーエクスペリエンスの悪化**：ユーザーがローディングスピナーやフリーズしたインターフェースを見つめる
- **連鎖的な障害**：遅い操作がシステム全体をダウンさせる可能性がある

!!!warning "⚠️ 同期の罠"
    30秒かかる単一の遅い操作は、その全期間スレッドを占有する可能性があります。利用可能なスレッドが限られている場合、わずか数個の遅いリクエストでアプリケーション全体が新しいリクエストに応答できなくなる可能性があります。

次のような一般的なシナリオを考えてみましょう：

- **動画処理**：アップロードされた動画を複数のフォーマットに変換する
- **レポート生成**：大規模なデータセットから複雑な分析レポートを作成する
- **バッチ操作**：単一のリクエストで数千のレコードを処理する
- **外部API呼び出し**：遅いサードパーティサービスを待つ
- **機械学習**：大規模なモデルで推論を実行する

## 解決策：リクエストとレスポンスを切り離す

非同期リクエスト-レスポンスパターンは、リクエストの送信と結果の取得を分離します：

1. **クライアントがリクエストを送信**し、ステータスエンドポイントを含む確認応答を即座に受け取る
2. **サーバーがバックグラウンドで非同期に処理**する
3. **クライアントがステータスエンドポイントをポーリング**するか、完了時にコールバックを受け取る
4. **クライアントが結果を取得**する、処理が完了したら

{% mermaid %}sequenceDiagram
    participant Client as クライアント
    participant API as APIゲートウェイ
    participant Queue as メッセージキュー
    participant Worker as バックグラウンドワーカー
    participant Storage as 結果ストレージ
    
    Client->>API: 1. POST /process (リクエスト)
    API->>Queue: 2. タスクをエンキュー
    API-->>Client: 3. 202 Accepted + ステータスURL
    
    Note over Client: クライアントは他の作業を自由に行える
    
    Worker->>Queue: 4. タスクをデキュー
    Worker->>Worker: 5. 処理（長時間操作）
    Worker->>Storage: 6. 結果を保存
    
    Client->>API: 7. GET /status/{id}
    API->>Storage: 8. ステータスを確認
    Storage-->>API: 9. ステータス：完了
    API-->>Client: 10. 200 OK + 結果URL
    
    Client->>API: 11. GET /result/{id}
    API->>Storage: 12. 結果を取得
    Storage-->>API: 13. 結果を返す
    API-->>Client: 14. 200 OK + 結果データ
{% endmermaid %}

## 仕組み：パターンの実践

動画トランスコーディングサービスのこのパターンの実装を見ていきましょう：

### ステップ1：リクエストの送信

クライアントが処理を開始し、即座に確認応答を受け取ります：

```javascript
// クライアントが処理のために動画を送信
const response = await fetch('/api/videos/transcode', {
  method: 'POST',
  body: JSON.stringify({
    videoUrl: 'https://neo01.com/video.mp4',
    formats: ['720p', '1080p', '4k']
  })
});

// サーバーが即座に202 Acceptedで応答
// {
//   "jobId": "job-12345",
//   "status": "pending",
//   "statusUrl": "/api/videos/status/job-12345"
// }

const { jobId, statusUrl } = await response.json();
```

### ステップ2：非同期処理

サーバーが作業をキューに入れ、バックグラウンドで処理します：

```javascript
// APIエンドポイントハンドラ
app.post('/api/videos/transcode', async (req, res) => {
  const jobId = generateJobId();
  
  // ジョブメタデータを保存
  await jobStore.create({
    id: jobId,
    status: 'pending',
    request: req.body,
    createdAt: Date.now()
  });
  
  // バックグラウンド処理のためにキューに入れる
  await messageQueue.send({
    jobId,
    videoUrl: req.body.videoUrl,
    formats: req.body.formats
  });
  
  // 即座に応答
  res.status(202).json({
    jobId,
    status: 'pending',
    statusUrl: `/api/videos/status/${jobId}`
  });
});

// バックグラウンドワーカー
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

### ステップ3：ステータスの確認

クライアントがステータスエンドポイントをポーリングして進捗を追跡します：

```javascript
// クライアントが完了をポーリング
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
    
    // 再度ポーリングする前に待機
    await sleep(2000);
  }
}

// ステータスエンドポイント
app.get('/api/videos/status/:jobId', async (req, res) => {
  const job = await jobStore.get(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'ジョブが見つかりません' });
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

## 実装戦略

### 戦略1：ポーリング

クライアントが定期的にステータスエンドポイントを確認します：

**利点：**
- 実装が簡単
- 任意のHTTPクライアントで動作
- サーバー側のコールバックインフラストラクチャが不要

**欠点：**
- ネットワークトラフィックの増加
- 通知の遅延（ポーリング間隔）
- 変更がない場合のリクエストの無駄

```javascript
// 指数バックオフポーリング
async function pollWithBackoff(statusUrl, maxAttempts = 30) {
  let delay = 1000; // 1秒から開始
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkStatus(statusUrl);
    
    if (status.status !== 'pending' && status.status !== 'processing') {
      return status;
    }
    
    await sleep(delay);
    delay = Math.min(delay * 1.5, 30000); // 最大30秒
  }
  
  throw new Error('ポーリングタイムアウト');
}
```

### 戦略2：Webhook

処理が完了したときにサーバーがクライアントにコールバックします：

**利点：**
- 即座の通知
- 無駄なポーリングリクエストがない
- リソースの効率的な使用

**欠点：**
- 公開アクセス可能なコールバックURLが必要
- より複雑なエラー処理
- セキュリティの考慮事項（認証、検証）

```javascript
// クライアントがコールバックURLを提供
await fetch('/api/videos/transcode', {
  method: 'POST',
  body: JSON.stringify({
    videoUrl: 'https://neo01.com/video.mp4',
    formats: ['720p', '1080p'],
    callbackUrl: 'https://client.com/webhook/video-complete'
  })
});

// 完了時にサーバーがWebhookを呼び出す
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

### 戦略3：WebSocket

リアルタイム更新のために永続的な接続を維持します：

**利点：**
- リアルタイムの双方向通信
- 複数の更新に効率的
- 進捗追跡に最適

**欠点：**
- より複雑なインフラストラクチャ
- 接続管理のオーバーヘッド
- すべての環境に適しているわけではない

```javascript
// クライアントがWebSocket接続を確立
const ws = new WebSocket(`wss://api.neo01.com/jobs/${jobId}`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  if (update.status === 'processing') {
    console.log(`進捗: ${update.progress}%`);
  } else if (update.status === 'completed') {
    console.log('ジョブ完了:', update.results);
    ws.close();
  }
};
```

## 主要な実装の考慮事項

### 1. ステータスエンドポイントの設計

明確で情報豊富なステータスレスポンスを設計します：

```javascript
// 適切に設計されたステータスレスポンス
{
  "jobId": "job-12345",
  "status": "processing",
  "progress": 65,
  "message": "1080pフォーマットにトランスコード中",
  "createdAt": "2020-04-15T10:30:00Z",
  "estimatedCompletion": "2020-04-15T10:35:00Z",
  "_links": {
    "self": "/api/videos/status/job-12345",
    "cancel": "/api/videos/cancel/job-12345"
  }
}
```

### 2. HTTPステータスコード

状態を伝えるために適切なステータスコードを使用します：

- **202 Accepted**：処理のためにリクエストが受け入れられた
- **200 OK**：ステータスチェックが成功
- **303 See Other**：処理完了、結果にリダイレクト
- **404 Not Found**：ジョブIDが存在しない
- **410 Gone**：ジョブが期限切れまたはクリーンアップされた

### 3. 結果の保存と有効期限

結果のライフサイクル管理を実装します：

```javascript
// TTL付きで結果を保存
await resultStore.set(jobId, result, {
  expiresIn: 24 * 60 * 60 // 24時間
});

// 期限切れのジョブをクリーンアップ
setInterval(async () => {
  const expiredJobs = await jobStore.findExpired();
  
  for (const job of expiredJobs) {
    await resultStore.delete(job.id);
    await jobStore.delete(job.id);
  }
}, 60 * 60 * 1000); // 1時間ごと
```

### 4. 冪等性

リクエストを安全に再試行できるようにします：

```javascript
// 冪等性キーを使用
app.post('/api/videos/transcode', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // すでに処理されているか確認
  const existing = await jobStore.findByIdempotencyKey(idempotencyKey);
  if (existing) {
    return res.status(202).json({
      jobId: existing.id,
      status: existing.status,
      statusUrl: `/api/videos/status/${existing.id}`
    });
  }
  
  // 新しいリクエストを処理
  const jobId = await createJob(req.body, idempotencyKey);
  // ...
});
```

## このパターンを使用するタイミング

### 理想的なシナリオ

!!!success "✅ 完璧な使用ケース"
    **長時間実行される操作**：完了するまでに数秒以上かかるタスク
    
    **リソース集約的な処理**：大量のCPU、メモリ、またはI/Oを消費する操作
    
    **外部依存関係**：遅いまたは信頼性の低いサードパーティサービスへの呼び出し
    
    **バッチ処理**：大規模なデータセットまたは複数のアイテムに対する操作

### 代替案を検討する場合

!!!info "🤔 次の場合は再考を..."
    **高速な操作**：1秒未満の操作は非同期の複雑さから恩恵を受けない
    
    **シンプルな使用ケース**：単純なCRUD操作は同期的に問題なく動作する
    
    **リアルタイム要件**：即座の結果が絶対に必要な場合

## アーキテクチャ品質属性

### スケーラビリティ

このパターンは水平スケーリングを可能にします：

- **ワーカーのスケーリング**：増加した負荷を処理するためにバックグラウンドワーカーを追加
- **キューのバッファリング**：メッセージキューがトラフィックスパイクを吸収
- **リソースの最適化**：APIと処理層が独立してスケールする

### 回復力

次を通じて強化された耐障害性：

- **リトライロジック**：失敗したジョブを自動的に再試行できる
- **サーキットブレーキング**：連鎖的な障害から保護
- **段階的な劣化**：ワーカーが過負荷でもAPIはレスポンシブなまま

### ユーザーエクスペリエンス

レスポンシブ性の向上：

- **即座のフィードバック**：ユーザーが即座に確認応答を受け取る
- **進捗更新**：処理ステータスと推定完了時間を表示
- **ノンブロッキング**：待機中にユーザーが他のアクティビティを続けられる

## 一般的な落とし穴と解決策

!!!warning "⚠️ 注意すべき点"
    **ポーリングストーム**：多くのクライアントが頻繁にポーリングしすぎる
    
    **解決策**：指数バックオフとレート制限を実装

!!!warning "⚠️ 注意すべき点"
    **結果の喪失**：クライアントが取得する前に結果が期限切れになる
    
    **解決策**：適切なTTLを設定し、期限切れ前にクライアントに通知

!!!warning "⚠️ 注意すべき点"
    **孤立したジョブ**：処理状態で永遠にスタックしたジョブ
    
    **解決策**：ジョブタイムアウトとデッドレターキューを実装

## 実世界の例：ドキュメント処理サービス

ドキュメント処理サービスの完全な例を示します：

```javascript
// API層
class DocumentProcessingAPI {
  async submitDocument(file, options) {
    const jobId = uuidv4();
    
    // ファイルをストレージにアップロード
    const fileUrl = await storage.upload(file);
    
    // ジョブレコードを作成
    await db.jobs.create({
      id: jobId,
      status: 'pending',
      fileUrl,
      options,
      createdAt: new Date()
    });
    
    // 処理のためにキューに入れる
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
      throw new NotFoundError('ジョブが見つかりません');
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

// ワーカー層
class DocumentProcessor {
  async processJob(message) {
    const { jobId, fileUrl, options } = message;
    
    try {
      await this.updateStatus(jobId, 'processing', 0);
      
      // ドキュメントをダウンロード
      const document = await storage.download(fileUrl);
      await this.updateStatus(jobId, 'processing', 25);
      
      // テキストを抽出
      const text = await this.extractText(document);
      await this.updateStatus(jobId, 'processing', 50);
      
      // コンテンツを分析
      const analysis = await this.analyzeContent(text, options);
      await this.updateStatus(jobId, 'processing', 75);
      
      // レポートを生成
      const report = await this.generateReport(analysis);
      await this.updateStatus(jobId, 'processing', 90);
      
      // 結果を保存
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

## まとめ

非同期リクエスト-レスポンスパターンは、レスポンシブでスケーラブルな分散システムを構築するために不可欠です。長時間実行される操作を即座のレスポンスから切り離すことで、次のことが可能になります：

- **より良いユーザーエクスペリエンス**：即座のフィードバックとノンブロッキング操作
- **スケーラビリティの向上**：APIと処理層の独立したスケーリング
- **回復力の強化**：障害とリトライの適切な処理
- **リソース効率**：スレッドと接続の最適な使用

ステータス追跡と結果管理を通じて複雑性を導入しますが、数秒以上かかる操作の場合、メリットはコストをはるかに上回ります。クライアントをブロックせずに時間のかかる作業を実行する必要がある場合は、このパターンを検討してください。

## 関連パターン

- **クレームチェックパターン**：大きなペイロードを処理するための非同期処理を補完
- **キューベースの負荷平準化**：メッセージキューでトラフィックスパイクを平滑化
- **競合コンシューマー**：キューに入れられたジョブの並列処理を可能にする
- **優先度キュー**：他のジョブより前に優先度の高いジョブを処理

## 参考文献

- [Microsoft Azure Architecture Patterns: Asynchronous Request-Reply](https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply)
- [Enterprise Integration Patterns: Request-Reply](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RequestReply.html)
