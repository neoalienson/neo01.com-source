---
title: AI 游乐场
date: 2025-01-01
layout: tools
lang: zh-CN
---

使用 Chrome 内建 AI API 的实验性工具。这些工具需要启用 AI 功能的 Chrome Canary。

<div class="category-header">
  <h2>🤖 文字处理</h2>
</div>

<div class="tools-grid">
  <a href="/zh-CN/ai/summary/" class="tool-card">
    <h3>📝 文字摘要器</h3>
    <p class="tool-description">使用 Chrome 内建的摘要 API 生成文字摘要。可选择不同的摘要类型、长度和格式。</p>
    <ul class="tool-features">
      <li>多种摘要类型（重点、TL;DR、预告、标题）</li>
      <li>可调整长度（短、中、长）</li>
      <li>输出格式（Markdown、纯文字）</li>
      <li>实时令牌使用追踪</li>
    </ul>
  </a>

  <a href="/zh-CN/ai/prompt/" class="tool-card">
    <h3>💬 提示 API 游乐场</h3>
    <p class="tool-description">通过对话界面与 Chrome 内建语言模型（Gemini Nano）互动。实验不同参数并查看实时响应。</p>
    <ul class="tool-features">
      <li>支持 Markdown 的流式响应</li>
      <li>可调整温度和 top-k 参数</li>
      <li>会话管理和令牌追踪</li>
      <li>对话历史显示</li>
    </ul>
  </a>
</div>

---

*注意：这些工具需要启用实验性 AI 功能的 Chrome Canary/Beta。请访问 chrome://flags/#optimization-guide-on-device-model 以启用 AI 功能。*

<link rel="stylesheet" href="/ai/ai.css">
