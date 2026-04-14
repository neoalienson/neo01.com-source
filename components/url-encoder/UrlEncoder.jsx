import React, { useState, useCallback } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

const translations = {
  en: {
    title: "URL Encoder/Decoder",
    inputLabel: "Text or URL to encode/decode:",
    inputPlaceholder: "Enter your text or URL here...",
    encode: "Encode",
    decode: "Decode",
    result: "Result",
    copy: "Copy",
    copied: "Copied!",
    invalidEncoding: "Invalid URL encoding",
    about: "About URL Encoder/Decoder",
    description: "URL Encoder/Decoder converts text to and from URL-safe format. URLs can only contain certain characters, so special characters must be encoded using percent-encoding.",
    howItWorks: "How It Works",
    howItWorksText: "The encoder converts special characters, spaces, and non-ASCII characters into percent-encoded format (%XX) that can be safely included in URLs. The decoder reverses this process.",
    commonUseCases: "Common Use Cases",
    useCase1: "Web developers encode query parameters for API requests",
    useCase2: "SEO specialists decode URLs to understand their structure",
    useCase3: "Developers debug URL-related issues",
    tip: "Paste your text or URL into the input field. Click Encode to convert to URL-safe format or Decode to restore encoded URLs."
  },
  "zh-CN": {
    title: "URL 编码/解码器",
    inputLabel: "要编码/解码的文本或 URL：",
    inputPlaceholder: "在此输入文本或 URL...",
    encode: "编码",
    decode: "解码",
    result: "结果",
    copy: "复制",
    copied: "已复制！",
    invalidEncoding: "无效的 URL 编码",
    about: "关于 URL 编码/解码器",
    description: "URL 编码/解码器将文本转换为 URL 安全格式。URL 只能包含某些字符，因此必须使用百分号编码（%XX）来编码特殊字符。",
    howItWorks: "工作原理",
    howItWorksText: "编码器将特殊字符、空格和非 ASCII 字符转换为百分号编码格式（%XX），可以安全地包含在 URL 中。解码器则反向处理。",
    commonUseCases: "常见用例",
    useCase1: "Web 开发人员为 API 请求编码查询参数",
    useCase2: "SEO 专家解码 URL 以了解其结构",
    useCase3: "开发人员调试 URL 相关问题",
    tip: "将文本或 URL 粘贴到输入框中。点击编码转换为 URL 安全格式，或点击解码还原编码的 URL。"
  },
  "zh-TW": {
    title: "URL 編碼/解碼器",
    inputLabel: "要編碼/解碼的文字或 URL：",
    inputPlaceholder: "在此輸入文字或 URL...",
    encode: "編碼",
    decode: "解碼",
    result: "結果",
    copy: "複製",
    copied: "已複製！",
    invalidEncoding: "無效的 URL 編碼",
    about: "關於 URL 編碼/解碼器",
    description: "URL 編碼/解碼器將文字轉換為 URL 安全格式。URL 只能包含某些字符，因此必須使用百分號編碼（%XX）來編碼特殊字符。",
    howItWorks: "工作原理",
    howItWorksText: "編碼器將特殊字符、空格和非 ASCII 字元轉換為百分號編碼格式（%XX），可以安全地包含在 URL 中。解碼器則反向處理。",
    commonUseCases: "常見用例",
    useCase1: "Web 開發人員為 API 請求編碼查詢參數",
    useCase2: "SEO 專家解碼 URL 以了解其結構",
    useCase3: "開發人員調試 URL 相關問題",
    tip: "將文字或 URL 貼到輸入框中。點擊編碼轉換為 URL 安全格式，或點擊解碼還原編碼的 URL。"
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

export function encodeText(text) {
  return encodeURIComponent(text);
}

export function decodeText(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    return null;
  }
}

export function UrlEncoder({ locale = 'en' }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleEncode = useCallback(() => {
    if (input) {
      setResult(encodeText(input));
      setError('');
    }
  }, [input]);

  const handleDecode = useCallback(() => {
    if (input) {
      const decoded = decodeText(input);
      if (decoded === null) {
        setError(t('invalidEncoding', locale));
        setResult('');
      } else {
        setResult(decoded);
        setError('');
      }
    }
  }, [input, locale]);

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="textInput">{t('inputLabel', locale)}</label>
          <textarea
            id="textInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('inputPlaceholder', locale)}
            rows={4}
          />
        </div>

        <div className="action-buttons">
          <button className="action-btn" onClick={handleEncode}>{t('encode', locale)}</button>
          <button className="action-btn" onClick={handleDecode}>{t('decode', locale)}</button>
        </div>

        <div className="output-section">
          <CopyButton text={result} locale={locale} />
          <div className="output-label">{t('result', locale)}</div>
          {error ? (
            <div className="output-content error">{error}</div>
          ) : (
            <div className="output-content" id="result">{result}</div>
          )}
        </div>
      </div>

      <div className="info-section">
        <h2>{t('about', locale)}</h2>
        <p>{t('description', locale)}</p>

        <h3>{t('howItWorks', locale)}</h3>
        <p>{t('howItWorksText', locale)}</p>

        <h3>{t('commonUseCases', locale)}</h3>
        <ul>
          <li>{t('useCase1', locale)}</li>
          <li>{t('useCase2', locale)}</li>
          <li>{t('useCase3', locale)}</li>
        </ul>

        <p>{t('tip', locale)}</p>
      </div>
    </ToolLayout>
  );
}