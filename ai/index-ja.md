---
title: AIプレイグラウンド
date: 2025-01-01
layout: tools
lang: ja
---

Chromeの組み込みAI APIを使用した実験的なツールです。これらのツールを使用するには、AI機能を有効にしたChrome Canaryが必要です。

<div class="category-header">
  <h2>🤖 テキスト処理</h2>
</div>

<div class="tools-grid">
  <a href="/ja/ai/summary/" class="tool-card">
    <h3>📝 テキスト要約</h3>
    <p class="tool-description">Chromeの組み込み要約APIを使用してテキストの要約を生成します。さまざまな要約タイプ、長さ、形式から選択できます。</p>
    <ul class="tool-features">
      <li>複数の要約タイプ（キーポイント、TL;DR、ティーザー、見出し）</li>
      <li>調整可能な長さ（短い、中程度、長い）</li>
      <li>出力形式（Markdown、プレーンテキスト）</li>
      <li>リアルタイムトークン使用量追跡</li>
    </ul>
  </a>

  <a href="/ja/ai/prompt/" class="tool-card">
    <h3>💬 プロンプトAPIプレイグラウンド</h3>
    <p class="tool-description">会話型インターフェースを通じてChromeの組み込み言語モデル（Gemini Nano）と対話します。さまざまなパラメータを試して、リアルタイムの応答を確認できます。</p>
    <ul class="tool-features">
      <li>Markdownサポート付きストリーミング応答</li>
      <li>調整可能なtemperatureとtop-kパラメータ</li>
      <li>セッション管理とトークン追跡</li>
      <li>会話履歴表示</li>
    </ul>
  </a>
</div>

---

*注意: これらのツールを使用するには、実験的なAI機能を有効にしたChrome Canary/Betaが必要です。chrome://flags/#optimization-guide-on-device-modelにアクセスしてAI機能を有効にしてください。*

<link rel="stylesheet" href="/ai/ai.css">
