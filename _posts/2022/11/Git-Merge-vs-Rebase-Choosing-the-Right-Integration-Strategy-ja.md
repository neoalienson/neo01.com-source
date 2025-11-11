---
title: "Git Merge vs Rebase：適切な統合戦略の選択"
date: 2022-11-01
lang: ja
categories: Development
tags:
  - Git
  - Version Control
  - Workflow
  - Best Practices
excerpt: "git merge と git rebase の根本的な違いを理解し、それぞれのアプローチをいつ使用するかを学び、Git履歴を明確で意味のあるものに保つテクニックをマスターしましょう。"
thumbnail: /assets/git/thumbnail.png
---

フィーチャーブランチをメインブランチに統合しようとしています。キーボードの上で指が止まります。`git merge` と `git rebase` のどちらを入力すべきでしょうか？この一見シンプルな決定は、プロジェクトの履歴、チームのワークフロー、そして数ヶ月後に問題をデバッグする能力に影響を与えます。

merge vs rebase の議論は、何年もの間開発チームを分断してきました。rebase が提供するクリーンで線形な履歴を信じる人もいます。他の人は merge の完全な履歴記録を好み、開発のあらゆる曲折を保存します。真実は？両方のアプローチにはそれぞれの場所があり、それぞれをいつ使用するかを理解することが効果的な Git ワークフローにとって重要です。

これは「正しい」答えを見つけることではありません。トレードオフを理解することです。Merge はコンテキストを保持しますが、複雑な履歴を作成します。Rebase はクリーンなタイムラインを作成しますが、履歴を書き換えます。あなたの選択は、チームのワークフロー、プロジェクトのニーズ、そして直面している特定の状況に依存します。

## Git Merge の理解

Git merge は、2つのブランチの履歴を結びつける新しいコミットを作成することで、ブランチを結合します。これはデフォルトの統合方法であり、変更がどのように開発されたかの完全なコンテキストを保持します。

### Merge の仕組み

{% mermaid %}
gitGraph
    commit id: "A"
    commit id: "B"
    branch feature
    checkout feature
    commit id: "C"
    commit id: "D"
    checkout main
    commit id: "E"
    merge feature
    commit id: "マージコミット"
{% endmermaid %}

**Merge プロセス**：
```bash
# メインブランチに切り替え
git checkout main

# フィーチャーブランチをマージ
git merge feature

# 結果：マージコミット M を作成
# 履歴：A -> B -> E -> M
#              \-> C -> D /
```

### Merge のタイプ

**Fast-Forward Merge**：
分岐した変更が存在しない場合、Git は単にブランチポインタを前方に移動します。

{% mermaid %}
gitGraph
    commit id: "A"
    commit id: "B"
    branch feature
    checkout feature
    commit id: "C"
    commit id: "D"
    checkout main
    merge feature
{% endmermaid %}

```bash
# Fast-forward マージ（マージコミットなし）
git merge feature
# 出力：Fast-forward
```

**Three-Way Merge**：
ブランチが分岐している場合、Git は2つの親を持つマージコミットを作成します。

```bash
# Three-way マージ（マージコミットを作成）
git merge feature
# 出力：Merge made by the 'recursive' strategy
```

**No-Fast-Forward Merge**：
Fast-forward が可能な場合でも、マージコミットの作成を強制します。

```bash
# 常にマージコミットを作成
git merge --no-ff feature
```

### Merge の利点

!!!tip "✅ Merge を使用するタイミング"
    **完全な履歴を保持**：すべてのコミットとブランチが可視のまま
    **チームコラボレーション**：複数の開発者が並行開発を確認可能
    **機能追跡**：機能間の明確な境界
    **安全な操作**：既存のコミットを書き換えない
    **公開ブランチ**：共有ブランチに最適

## Git Rebase の理解

Git rebase は、あるブランチから別のブランチへコミットを移動または再生し、線形履歴を作成します。コミット履歴を書き換えて、すべての作業が順次発生したかのように見せます。

### Rebase の仕組み

{% mermaid %}
gitGraph
    commit id: "A"
    commit id: "B"
    branch feature
    checkout feature
    commit id: "C"
    commit id: "D"
    checkout main
    commit id: "E"
    checkout feature
    commit id: "C'" type: HIGHLIGHT
    commit id: "D'" type: HIGHLIGHT
{% endmermaid %}

**Rebase プロセス**：
```bash
# フィーチャーブランチに切り替え
git checkout feature

# メインブランチにリベース
git rebase main

# 結果：E の上に C と D を再生
# 履歴：A -> B -> E -> C' -> D'
```

### インタラクティブ Rebase

インタラクティブ rebase は強力な履歴編集機能を提供します：

```bash
# インタラクティブ rebase を開始
git rebase -i HEAD~3

# インタラクティブオプション：
# pick   = コミットを使用
# reword = コミットを使用するが、メッセージを編集
# edit   = コミットを使用するが、修正のために停止
# squash = 前のコミットと結合
# fixup  = squash と同様だが、メッセージを破棄
# drop   = コミットを削除
```

**インタラクティブ Rebase の例**：
```bash
pick abc123 ユーザー認証を追加
squash def456 認証のタイプミスを修正
reword ghi789 パスワード検証を追加
drop jkl012 デバッグログ

# 結果：3つのコミットが2つのクリーンなコミットになる
```

### Rebase の利点

!!!tip "✅ Rebase を使用するタイミング"
    **クリーンな線形履歴**：追跡と理解が容易
    **マージ前**：統合前にフィーチャーブランチをクリーンアップ
    **ローカルブランチ**：まだプッシュされていないコミットに安全
    **Bisect フレンドリー**：線形履歴がデバッグを簡素化
    **プロフェッショナルなコミット**：チームに洗練された作業を提示

## Merge vs Rebase：直接比較

### 履歴構造

**Merge 履歴**：
```
*   Merge branch 'feature'
|\  
| * 機能 C を追加
| * 機能 B を追加
* | メインのバグを修正
* | ドキュメントを更新
|/  
* 初期コミット
```

**Rebase 履歴**：
```
* 機能 C を追加
* 機能 B を追加
* メインのバグを修正
* ドキュメントを更新
* 初期コミット
```

### ビジュアル比較

{% mermaid %}
---
config:
  theme: 'default'
---
gitGraph
    commit id: "初期"
    branch feature-merge
    checkout feature-merge
    commit id: "機能 A"
    commit id: "機能 B"
    checkout main
    commit id: "メイン作業"
    merge feature-merge
    commit id: "マージコミット"
    
    branch feature-rebase
    checkout feature-rebase
    commit id: "機能 C"
    commit id: "機能 D"
    checkout main
    cherry-pick id: "機能 C"
    cherry-pick id: "機能 D"
{% endmermaid %}

### 決定マトリックス

| 側面 | Merge | Rebase |
|--------|-------|--------|
| **履歴** | すべてのコミットを保持 | 線形履歴を作成 |
| **複雑さ** | 乱雑になる可能性 | クリーンでシンプル |
| **安全性** | 履歴を書き換えない | コミット履歴を書き換える |
| **コラボレーション** | 公開ブランチに安全 | 共有ブランチにリスク |
| **デバッグ** | 並行開発を表示 | Bisect が容易 |
| **コンテキスト** | ブランチコンテキストを保持 | ブランチ情報を失う |

## 一般的なワークフローとベストプラクティス

### Rebase を使用したフィーチャーブランチワークフロー

**機能開発の推奨アプローチ**：

```bash
# 1. フィーチャーブランチを作成
git checkout -b feature/user-profile

# 2. 機能に取り組む
git commit -m "プロフィールモデルを追加"
git commit -m "プロフィール API を追加"

# 3. 機能をメインと同期
git checkout main
git pull
git checkout feature/user-profile
git rebase main

# 4. マージ前にコミットをクリーンアップ
git rebase -i main

# 5. メインにマージ（マージコミットを作成）
git checkout main
git merge --no-ff feature/user-profile
```

### Pull Request ワークフロー

{% mermaid %}
gitGraph
    commit id: "ベース"
    branch feature
    checkout feature
    commit id: "作業 1"
    commit id: "作業 2"
    checkout main
    commit id: "メイン更新"
    checkout feature
    commit id: "メインにリベース"
    commit id: "コミットをクリーンアップ"
    checkout main
    merge feature
    commit id: "PR マージ済み"
{% endmermaid %}

**Pull Request のベストプラクティス**：
```bash
# PR 作成前：リベースとクリーンアップ
git fetch origin
git rebase origin/main
git rebase -i origin/main  # コミットを squash/クリーンアップ

# リモートにプッシュ（リベース後は force push）
git push --force-with-lease origin feature/user-profile

# PR 承認後：マージコミットでマージ
# （GitHub/GitLab UI で --no-ff を使用して実行）
```

### チームコラボレーションルール

!!!warning "⚠️ Rebase のゴールデンルール"
    **公開/共有ブランチにプッシュされたコミットは絶対にリベースしない**
    
    リベースは履歴を書き換えます。他の人があなたのコミットに基づいて作業している場合、リベースは分岐した履歴とマージコンフリクトを作成します。
    
    **安全**：プッシュ前にローカルコミットをリベース
    **危険**：他の人がプルしたコミットをリベース

## コンフリクトの処理

### Merge コンフリクト

```bash
# マージ中
git merge feature
# CONFLICT (content): Merge conflict in file.js

# ファイル内のコンフリクトを解決
# その後マージを完了
git add file.js
git commit -m "フィーチャーブランチをマージ"
```

### Rebase コンフリクト

```bash
# リベース中
git rebase main
# CONFLICT (content): Merge conflict in file.js

# 各コミットのコンフリクトを解決
git add file.js
git rebase --continue

# または必要に応じて中止
git rebase --abort
```

!!!anote "📋 コンフリクト解決のヒント"
    **Merge コンフリクト**：マージコミットで一度解決
    **Rebase コンフリクト**：リベースされた各コミットで解決が必要な場合あり
    **戦略**：多くのコンフリクトがある場合、merge の方が速い可能性
    **ツール**：`git mergetool` または IDE のコンフリクト解決を使用

## 高度なテクニック

### Squash Merge

すべてのフィーチャーコミットをメインブランチ上の単一のコミットに結合：

```bash
# Squash マージ
git merge --squash feature
git commit -m "完全なユーザープロフィール機能を追加"

# 結果：すべての変更を含む単一のコミットがメインに
```

{% mermaid %}
gitGraph
    commit id: "A"
    commit id: "B"
    branch feature
    checkout feature
    commit id: "C"
    commit id: "D"
    commit id: "E"
    checkout main
    commit id: "Squash された C+D+E" type: HIGHLIGHT
{% endmermaid %}

**Squash マージを使用するタイミング**：
- 機能に多くの小さなコミットがある
- メインブランチの履歴をクリーンにしたい
- 個々のコミットが履歴にとって重要でない

### Autosquash を使用した Rebase

```bash
# 開発中に fixup コミットを作成
git commit -m "機能を追加"
git commit --fixup HEAD  # fixup としてマーク

# 後で、リベース中に自動 squash
git rebase -i --autosquash main
# fixup コミットを自動的に配置して squash
```

### 選択的統合のための Cherry-Pick

```bash
# フィーチャーブランチから特定のコミットを選択
git cherry-pick abc123
git cherry-pick def456

# 用途：
# - フィーチャーブランチからのホットフィックス
# - 選択的な機能統合
# - リリースブランチへの修正のバックポート
```

## 実世界のシナリオ

### シナリオ 1：長期フィーチャーブランチ

**問題**：フィーチャーブランチがメインから大きく分岐している。

**解決策**：
```bash
# 定期的にリベースして最新に保つ
git checkout feature/major-refactor
git fetch origin
git rebase origin/main

# マージの準備ができたら、最終リベースとマージ
git rebase -i origin/main  # コミットをクリーンアップ
git checkout main
git merge --no-ff feature/major-refactor
```

### シナリオ 2：本番環境のホットフィックス

**問題**：重大なバグを即座に修正する必要がある。

**解決策**：
```bash
# 本番環境からホットフィックスを作成
git checkout -b hotfix/security-patch production
git commit -m "セキュリティ脆弱性を修正"

# 本番環境にマージ（fast-forward）
git checkout production
git merge hotfix/security-patch

# メインにマージ（コンテキストを保持）
git checkout main
git merge --no-ff hotfix/security-patch
```

### シナリオ 3：乱雑な機能開発

**問題**：フィーチャーブランチに多くの「WIP」や「タイプミス修正」コミットがある。

**解決策**：
```bash
# インタラクティブリベースで履歴をクリーンアップ
git rebase -i main

# 関連するコミットを squash
pick abc123 ユーザーサービスを追加
squash def456 タイプミスを修正
squash ghi789 WIP
pick jkl012 ユーザーテストを追加
squash mno345 テストを修正

# 結果：5つではなく2つのクリーンなコミット
```

## 戦略の選択

### 決定フローチャート

{% mermaid %}
flowchart TD
    A["🔀 ブランチを統合する必要？"] --> B{"📍 公開/共有ブランチ？"}
    B -->|はい| C["✅ MERGE を使用"]
    B -->|いいえ| D{"🧹 クリーンな履歴が必要？"}
    D -->|はい| E["✅ REBASE を使用"]
    D -->|いいえ| F{"🔍 多くのコンフリクトが予想される？"}
    F -->|はい| C
    F -->|いいえ| E
    
    C --> G["📝 機能追跡のために --no-ff を検討"]
    E --> H["⚠️ プッシュされたコミットは絶対にリベースしない"]
    
    style C fill:#4ecdc4
    style E fill:#45b7d1
    style G fill:#96ceb4
    style H fill:#ff6b6b
{% endmermaid %}

### チームガイドラインテンプレート

```markdown
## 私たちの Git 統合戦略

### デフォルトアプローチ
- フィーチャーブランチ：ローカルでリベース、--no-ff でマージ
- ホットフィックス：直接マージ
- リリースブランチ：マージのみ

### Rebase ルール
✅ リベースすべき：
- まだプッシュされていないローカルコミット
- 更新されたメインへのフィーチャーブランチ
- PR 前にコミット履歴をクリーンアップ

❌ リベースすべきでない：
- 共有ブランチにプッシュされたコミット
- メイン/本番ブランチ
- 他の人があなたのブランチをプルした後

### Merge ルール
- 機能マージには常に --no-ff を使用
- ホットフィックスには fast-forward を使用
- 実験的機能には squash マージを使用
```

## 一般的な問題のトラブルシューティング

### 悪いリベースからの回復

```bash
# リベース前のコミットを見つける
git reflog
# 出力：abc123 HEAD@{1}: rebase: checkout main

# リベース前にリセット
git reset --hard HEAD@{1}

# または特定のコミットにリセット
git reset --hard abc123
```

### Force Push 問題の修正

!!!error "🚨 Force Push が失敗"
    **問題**：リベースを force push し、チームメイトにコンフリクトが発生
    
    **解決策**：
    ```bash
    # チームメイトはブランチをリセットすべき
    git fetch origin
    git reset --hard origin/feature-branch
    
    # または新しい履歴に作業をリベース
    git rebase origin/feature-branch
    ```

### Merge vs Rebase コンフリクト

```bash
# リベースコンフリクトが複雑すぎる場合
git rebase --abort

# マージにフォールバック
git merge main
```

## 結論：バランスを見つける

merge vs rebase の議論は、どちらかを選ぶことではありません。仕事に適したツールを使用することです。Merge は履歴とコンテキストを保持し、コラボレーションと公開ブランチに最適です。Rebase はクリーンな線形履歴を作成し、ローカル開発と機能統合の準備に最適です。

**ほとんどのチームへの推奨アプローチ**：
- **ローカルでリベース**：フィーチャーブランチを最新でクリーンに保つ
- **公開でマージ**：マージコミットで機能を統合
- **明確なコミュニケーション**：チームがそれぞれをいつ使用するか理解していることを確認
- **一貫性を保つ**：チームの規約を文書化して従う

最高の Git ワークフローは、チームが理解し、一貫して従うものです。シンプルなルールから始め、ニーズに基づいて調整し、覚えておいてください：目標は完璧な履歴ではなく、効果的なコラボレーションと保守可能なコードです。

merge、rebase、またはその両方の組み合わせを選択するかどうかにかかわらず、トレードオフを理解することで、プロジェクトとチームに役立つ情報に基づいた決定を下すことができます。
