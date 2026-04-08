import React, { useState, useMemo, useCallback } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

const translations = {
  en: {
    title: 'Text Statistics',
    textToAnalyze: 'Text to analyze:',
    placeholder: 'Enter your text here...',
    characters: 'Characters',
    charactersNoSpaces: 'Characters (no spaces)',
    words: 'Words',
    sentences: 'Sentences',
    paragraphs: 'Paragraphs',
    lines: 'Lines',
    estimatedTokens: 'Estimated Tokens (LLM)',
    readingTime: 'Estimated Reading Time',
    avgWordLength: 'Avg Word Length',
    longestWord: 'Longest Word',
    copy: 'Copy',
    copied: 'Copied!',
    about: 'About Text Statistics',
    description: 'Text Statistics analyzes text to provide comprehensive metrics including character count, word count, sentence count, paragraph count, reading time, and more.',
    commonUseCases: 'Common Use Cases',
    useCase1: 'Writers track word counts for articles, essays, and manuscripts',
    useCase2: 'Students verify assignment word limits',
    useCase3: 'Social media managers optimize posts for platform limits',
    useCase4: 'SEO specialists analyze content length for search optimization',
    tip: 'Tip: Paste or type your text into the input field. Statistics update automatically in real-time.',
    minRead: 'min'
  },
  'zh-CN': {
    title: '文字统计',
    textToAnalyze: '要分析的文本：',
    placeholder: '在此输入您的文字...',
    characters: '字符数',
    charactersNoSpaces: '字符数（无空格）',
    words: '词数',
    sentences: '句子数',
    paragraphs: '段落数',
    lines: '行数',
    estimatedTokens: '预估 Token 数 (LLM)',
    readingTime: '预估阅读时间',
    avgWordLength: '平均词长',
    longestWord: '最长单词',
    copy: '复制',
    copied: '已复制！',
    about: '关于文字统计',
    description: '文字统计提供全面的文本指标，包括字符数、词数、句子数、段落数、阅读时间等。',
    commonUseCases: '常见用例',
    useCase1: '作者追踪文章、论文的手稿字数',
    useCase2: '学生验证作业字数限制',
    useCase3: '社交媒体管理员优化帖子平台限制',
    useCase4: 'SEO 专家分析内容长度以进行搜索优化',
    tip: '提示：在输入框中粘贴或输入文字，统计信息会自动实时更新。',
    minRead: '分钟'
  },
  'zh-TW': {
    title: '文字統計',
    textToAnalyze: '要分析的文本：',
    placeholder: '在此輸入您的文字...',
    characters: '字元數',
    charactersNoSpaces: '字元數（無空格）',
    words: '詞數',
    sentences: '句子數',
    paragraphs: '段落數',
    lines: '行數',
    estimatedTokens: '預估 Token 數 (LLM)',
    readingTime: '預估閱讀時間',
    avgWordLength: '平均詞長',
    longestWord: '最長單詞',
    copy: '複製',
    copied: '已複製！',
    about: '關於文字統計',
    description: '文字統計提供全面的文本指標，包括字元數、詞數、句子數、段落數、閱讀時間等。',
    commonUseCases: '常見用例',
    useCase1: '作者追蹤文章、論文的手稿字數',
    useCase2: '學生驗證作業字數限制',
    useCase3: '社交媒體管理員優化帖子平台限制',
    useCase4: 'SEO 專家分析內容長度以進行搜索優化',
    tip: '提示：在輸入框中貼上或輸入文字，統計信息會自動即時更新。',
    minRead: '分鐘'
  }
};

function t(key, locale = 'en') {
  const trans = translations[locale] || translations.en;
  const keys = key.split('.');
  let value = trans;
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function getTextStats(text) {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
  const lines = text.split('\n').length;
  const estimatedTokens = Math.ceil(charactersNoSpaces / 4);
  const readingTimeMinutes = Math.ceil(words / 200);
  const avgWordLength = words > 0 ? (charactersNoSpaces / words).toFixed(2) : '0';

  const wordMatches = text.match(/[a-zA-Z0-9]+/g);
  const longestWord = wordMatches && wordMatches.length > 0
    ? wordMatches.reduce((longest, word) => word.length > longest.length ? word : longest, '')
    : '';

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    estimatedTokens,
    readingTimeMinutes,
    avgWordLength,
    longestWord
  };
}

export function TextStatistics({ locale = 'en' }) {
  const [input, setInput] = useState('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');

  const stats = useMemo(() => getTextStats(input), [input]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const statItems = [
    { key: 'characters', label: t('characters', locale), value: stats.characters },
    { key: 'charactersNoSpaces', label: t('charactersNoSpaces', locale), value: stats.charactersNoSpaces },
    { key: 'words', label: t('words', locale), value: stats.words },
    { key: 'sentences', label: t('sentences', locale), value: stats.sentences },
    { key: 'paragraphs', label: t('paragraphs', locale), value: stats.paragraphs },
    { key: 'lines', label: t('lines', locale), value: stats.lines },
    { key: 'estimatedTokens', label: t('estimatedTokens', locale), value: stats.estimatedTokens },
    { key: 'avgWordLength', label: t('avgWordLength', locale), value: stats.avgWordLength },
    { key: 'longestWord', label: t('longestWord', locale), value: stats.longestWord || '-' }
  ];

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="textInput">{t('textToAnalyze', locale)}</label>
          <textarea
            id="textInput"
            placeholder={t('placeholder', locale)}
            value={input}
            onChange={handleInputChange}
          />
        </div>

        <div className="stats-grid">
          {statItems.map(item => (
            <div key={item.key} className="stat-card">
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">
                {item.value.toLocaleString()}
                {item.key === 'longestWord' && stats.longestWord && (
                  <CopyButton text={stats.longestWord} locale={locale} className="copy-mini" />
                )}
              </div>
            </div>
          ))}

          <div className="stat-card reading-time">
            <div className="stat-label">{t('readingTime', locale)}</div>
            <div className="stat-value">
              {stats.readingTimeMinutes} {t('minRead', locale)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h2>{t('about', locale)}</h2>
        <p>{t('description', locale)}</p>

        <h3>{t('commonUseCases', locale)}</h3>
        <ul>
          <li>{t('useCase1', locale)}</li>
          <li>{t('useCase2', locale)}</li>
          <li>{t('useCase3', locale)}</li>
          <li>{t('useCase4', locale)}</li>
        </ul>
        <p>{t('tip', locale)}</p>
      </div>
    </ToolLayout>
  );
}