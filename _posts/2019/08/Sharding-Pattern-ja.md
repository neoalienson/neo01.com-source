---
title: "シャーディングパターン：データストアの水平スケーリング"
date: 2019-08-17
categories:
  - Architecture
lang: ja
series: architecture_pattern
excerpt: "データストアを水平パーティションに分割してスケーラビリティとパフォーマンスを向上させます。シャーディングが複数のサーバーにデータを分散して大量のデータを処理する方法を学びます。"
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

すべての本を収容できないほど大きくなった図書館を想像してください。1つの不可能なほど大きな構造を建てる代わりに、複数の図書館支店を作成します。各支店は特定のカテゴリまたは範囲で整理された本を保持します。利用者は探しているものに基づいてどの支店を訪れるかを知っています。これがシャーディングの本質です：単一サーバーの制限を克服するために、複数のストアにデータを分割します。

## 図書館のアナロジー

複数の支店を持つ図書館システムと同様に：
- 場所全体に本を分散
- 多くの利用者による並列アクセスを許可
- 単一の場所での混雑を削減
- ユーザーへの地理的近接性を可能にする

シャーディングされたデータストア：
- 複数のサーバーにデータを分散
- 並列クエリと書き込みを許可
- 単一のデータベースでの競合を削減
- より良いパフォーマンスのためのデータの局所性を可能にする

{% mermaid %}
graph TB
    A[アプリケーション] --> B[シャーディングロジック]
    B --> C[シャード 1<br/>ユーザー A-H]
    B --> D[シャード 2<br/>ユーザー I-P]
    B --> E[シャード 3<br/>ユーザー Q-Z]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## 問題：単一サーバーの制限

単一サーバーでホストされるデータストアは、避けられない制約に直面します：

### ストレージスペースの制限

```javascript
// データが増えるにつれて、単一サーバーはスペースを使い果たします
class UserDatabase {
  constructor() {
    this.storage = new DiskStorage('/data');
    // 10TB、100TB、1PBに達したらどうなりますか？
  }
  
  async addUser(user) {
    try {
      await this.storage.write(user.id, user);
    } catch (error) {
      if (error.code === 'ENOSPC') {
        // ディスクがいっぱい - どうしますか？
        throw new Error('Storage capacity exceeded');
      }
    }
  }
}
```

### コンピューティングリソースの制約

```javascript
// 数百万の同時ユーザーを処理する単一サーバー
class OrderDatabase {
  async processQuery(query) {
    // クエリ処理でCPUが最大化
    // 結果のキャッシングでメモリが枯渇
    // クエリがタイムアウトし始める
    const result = await this.executeQuery(query);
    return result;
  }
}
```

### ネットワーク帯域幅のボトルネック

```javascript
// すべてのトラフィックが1つのネットワークインターフェースを通過
class DataStore {
  async handleRequest(request) {
    // ネットワークインターフェースが10Gbpsで飽和
    // リクエストがドロップされ始める
    // 応答時間が劇的に増加
    return await this.processRequest(request);
  }
}
```

### 地理的分散の課題

```javascript
// 世界中のユーザーが単一のデータセンターにアクセス
class GlobalApplication {
  async getUserData(userId) {
    // 東京のユーザーがバージニアのデータにアクセス
    // ネットワークラウンドトリップだけで200msのレイテンシ
    // 米国にEUデータを保存するコンプライアンスの問題
    return await this.database.query({ userId });
  }
}
```

!!!warning "⚠️ 垂直スケーリングの制限"
    **一時的なソリューション**：単一サーバーにより多くのCPU、メモリ、またはディスクを追加
    
    **物理的制限**：最終的にはこれ以上リソースを追加できない
    
    **コスト非効率**：ハイエンドサーバーは指数関数的に高価になる
    
    **単一障害点**：1つのサーバー障害がすべてのユーザーに影響

## ソリューション：水平パーティショニング（シャーディング）

データストアをシャードと呼ばれる水平パーティションに分割します。各シャード：
- 同じスキーマを持つ
- データの異なるサブセットを含む
- 別のストレージノードで実行
- 独立して動作

{% mermaid %}
graph TB
    A[アプリケーション層] --> B[シャードマップ/ルーター]
    B --> C[シャード A<br/>注文 0-999]
    B --> D[シャード B<br/>注文 1000-1999]
    B --> E[シャード C<br/>注文 2000-2999]
    B --> F[シャード D<br/>注文 3000+]
    
    C --> C1[(データベース<br/>サーバー 1)]
    D --> D1[(データベース<br/>サーバー 2)]
    E --> E1[(データベース<br/>サーバー 3)]
    F --> F1[(データベース<br/>サーバー 4)]
    
    style A fill:#4dabf7,stroke:#1971c2
    style B fill:#ffd43b,stroke:#fab005
    style C fill:#51cf66,stroke:#2f9e44
    style D fill:#51cf66,stroke:#2f9e44
    style E fill:#51cf66,stroke:#2f9e44
    style F fill:#51cf66,stroke:#2f9e44
{% endmermaid %}

## シャーディング戦略

### 1. ルックアップ戦略

マッピングテーブルを使用して、適切なシャードにリクエストをルーティングします：

```javascript
class LookupShardRouter {
  constructor() {
    // 高速キャッシュまたはデータベースに保存されたシャードマップ
    this.shardMap = new Map([
      ['tenant-1', 'shard-a'],
      ['tenant-2', 'shard-a'],
      ['tenant-3', 'shard-b'],
      ['tenant-4', 'shard-c']
    ]);
    
    this.shardConnections = {
      'shard-a': 'db1.neo01.com',
      'shard-b': 'db2.neo01.com',
      'shard-c': 'db3.neo01.com'
    };
  }
  
  getShardForTenant(tenantId) {
    const shardKey = this.shardMap.get(tenantId);
    return this.shardConnections[shardKey];
  }
  
  async queryTenantData(tenantId, query) {
    const shardUrl = this.getShardForTenant(tenantId);
    const connection = await this.connect(shardUrl);
    return await connection.query(query);
  }
}
```

!!!tip "💡 ルックアップ戦略のメリット"
    **柔軟性**：マップを更新することで簡単に再バランス
    
    **仮想シャード**：論理シャードをより少ない物理サーバーにマップ
    
    **制御**：高価値テナントを専用シャードに割り当て

### 2. 範囲戦略

連続したシャードキーに基づいて関連アイテムをグループ化します：

```javascript
class RangeShardRouter {
  constructor() {
    this.shardRanges = [
      { min: '2019-01-01', max: '2019-03-31', shard: 'db-q1-2019.neo01.com' },
      { min: '2019-04-01', max: '2019-06-30', shard: 'db-q2-2019.neo01.com' },
      { min: '2019-07-01', max: '2019-09-30', shard: 'db-q3-2019.neo01.com' },
      { min: '2019-10-01', max: '2019-12-31', shard: 'db-q4-2019.neo01.com' }
    ];
  }
  
  getShardForDate(date) {
    const range = this.shardRanges.find(r => 
      date >= r.min && date <= r.max
    );
    return range ? range.shard : null;
  }
  
  async queryOrdersByDateRange(startDate, endDate) {
    // 効率的：関連するシャードのみをクエリ
    const relevantShards = this.shardRanges
      .filter(r => r.max >= startDate && r.min <= endDate)
      .map(r => r.shard);
    
    // 複数のシャードへの並列クエリ
    const results = await Promise.all(
      relevantShards.map(shard => 
        this.queryShardByDateRange(shard, startDate, endDate)
      )
    );
    
    return results.flat();
  }
}
```

!!!tip "💡 範囲戦略のメリット"
    **範囲クエリ**：連続データを効率的に取得
    
    **自然な順序**：論理的な順序でデータを保存
    
    **時間ベースのアーカイブ**：古いシャードを簡単にアーカイブ

!!!warning "⚠️ 範囲戦略のリスク"
    **ホットスポット**：最近のデータがより頻繁にアクセスされることが多い
    
    **不均等な分散**：一部の範囲が他よりも大きくなる可能性

### 3. ハッシュ戦略

ハッシュ関数を使用してデータを均等に分散します：

```javascript
class HashShardRouter {
  constructor() {
    this.shards = [
      'db-shard-0.neo01.com',
      'db-shard-1.neo01.com',
      'db-shard-2.neo01.com',
      'db-shard-3.neo01.com'
    ];
  }
  
  hashUserId(userId) {
    // シンプルなハッシュ関数（本番環境ではより良いハッシュを使用）
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // 32ビット整数に変換
    }
    return Math.abs(hash);
  }
  
  getShardForUser(userId) {
    const hash = this.hashUserId(userId);
    const shardIndex = hash % this.shards.length;
    return this.shards[shardIndex];
  }
  
  async getUserData(userId) {
    const shard = this.getShardForUser(userId);
    const connection = await this.connect(shard);
    return await connection.query({ userId });
  }
}
```

!!!tip "💡 ハッシュ戦略のメリット"
    **均等な分散**：ホットスポットを防ぐ
    
    **ルックアップテーブル不要**：シャードの場所を直接計算
    
    **スケーラブル**：多くのシャードでうまく機能

!!!warning "⚠️ ハッシュ戦略の課題"
    **範囲クエリ**：範囲を効率的にクエリすることが困難
    
    **再バランス**：シャードを追加するにはデータの再ハッシュが必要

## このパターンを使用する場合

!!!success "✅ シャーディングを使用する場合"
    **大規模スケール**：データ量が単一サーバーの容量を超える
    
    **高スループット**：数百万の同時操作を処理する必要がある
    
    **地理的分散**：複数の地域に分散したユーザー
    
    **コストの最適化**：複数のコモディティサーバーが1つのハイエンドサーバーより安価

!!!warning "⚠️ シャーディングを避ける場合"
    **小規模**：データが1つのサーバーに快適に収まる
    
    **複雑な結合**：アプリケーションがテーブル間の結合に大きく依存
    
    **限られたリソース**：チームが分散システムを管理する専門知識を欠いている
    
    **時期尚早な最適化**：垂直スケーリングがまだ実行可能

## 参考文献

- [Data Partitioning Guidance](https://learn.microsoft.com/en-us/azure/architecture/best-practices/data-partitioning)
- [Sharding Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)
