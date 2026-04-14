import React, { useState, useCallback } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

const translations = {
  en: {
    title: "URL Parser",
    inputLabel: "URL to parse:",
    inputPlaceholder: "Enter URL here...",
    result: "Result",
    copy: "Copy",
    copied: "Copied!",
    protocol: "Protocol",
    host: "Host",
    hostname: "Hostname",
    port: "Port",
    pathname: "Pathname",
    search: "Search",
    hash: "Hash",
    origin: "Origin",
    queryParams: "Query Parameters",
    param: "Parameter",
    value: "Value",
    invalidUrl: "Invalid URL format",
    about: "About URL Parser",
    description: "URL Parser breaks down any URL into its constituent parts. It handles protocol, hostname, port, path, query parameters, and fragment.",
    howItWorks: "How It Works",
    howItWorksText: "The URL constructor parses the URL string into its components. Each part is then displayed in a structured format for easy inspection.",
    commonUseCases: "Common Use Cases",
    useCase1: "Developers parse URLs to extract query parameters",
    useCase2: "Security professionals examine URLs for phishing attempts",
    useCase3: "SEO specialists optimize URL structure",
    tip: "Simply paste any URL and instantly see all its components broken down and explained."
  },
  "zh-CN": {
    title: "URL 解析器",
    inputLabel: "要解析的 URL：",
    inputPlaceholder: "在此输入 URL...",
    result: "结果",
    copy: "复制",
    copied: "已复制！",
    protocol: "协议",
    host: "主机",
    hostname: "主机名",
    port: "端口",
    pathname: "路径",
    search: "查询",
    hash: "锚点",
    origin: "来源",
    queryParams: "查询参数",
    param: "参数",
    value: "值",
    invalidUrl: "无效的 URL 格式",
    about: "关于 URL 解析器",
    description: "URL 解析器将任何 URL 分解为其组成部分。它处理协议、主机名、端口、路径、查询参数和锚点。",
    howItWorks: "工作原理",
    howItWorksText: "URL 构造函数将 URL 字符串解析为其组成部分。每个部分都以结构化格式显示，便于检查。",
    commonUseCases: "常见用例",
    useCase1: "开发人员解析 URL 以提取查询参数",
    useCase2: "安全专业人员检查钓鱼攻击的 URL",
    useCase3: "SEO 专家优化 URL 结构",
    tip: "只需粘贴任何 URL，即可立即查看其所有组成部分的详细分解。"
  },
  "zh-TW": {
    title: "URL 解析器",
    inputLabel: "要解析的 URL：",
    inputPlaceholder: "在此輸入 URL...",
    result: "結果",
    copy: "複製",
    copied: "已複製！",
    protocol: "協定",
    host: "主機",
    hostname: "主機名",
    port: "連接埠",
    pathname: "路徑",
    search: "查詢",
    hash: "錨點",
    origin: "來源",
    queryParams: "查詢參數",
    param: "參數",
    value: "值",
    invalidUrl: "無效的 URL 格式",
    about: "關於 URL 解析器",
    description: "URL 解析器將任何 URL 分解為其組成部分。它處理協定、主機名、連接埠、路徑、查詢參數和錨點。",
    howItWorks: "工作原理",
    howItWorksText: "URL 建構函式將 URL 字串解析為其組成部分。每個部分都以結構化格式顯示，便於檢查。",
    commonUseCases: "常見用例",
    useCase1: "開發人員解析 URL 以提取查詢參數",
    useCase2: "安全專業人員檢查網路釣魚攻擊的 URL",
    useCase3: "SEO 專家優化 URL 結構",
    tip: "只需貼上任何 URL，即可立即查看其所有組成部分的詳細分解。"
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

export function parseUrl(urlString) {
  try {
    const url = new URL(urlString);
    return {
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port || 'default',
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      searchParams: Array.from(url.searchParams.entries())
    };
  } catch (e) {
    return null;
  }
}

export function UrlParser({ locale = 'en' }) {
  const [input, setInput] = useState('https://neo01.com:8080/path/to/page?param1=value1&param2=value2#section');
  const [parsedUrl, setParsedUrl] = useState(null);
  const [error, setError] = useState('');

  const handleParse = useCallback(() => {
    const result = parseUrl(input);
    if (result) {
      setParsedUrl(result);
      setError('');
    } else {
      setError(t('invalidUrl', locale));
      setParsedUrl(null);
    }
  }, [input, locale]);

  React.useEffect(() => {
    const result = parseUrl(input);
    if (result) {
      setParsedUrl(result);
      setError('');
    } else if (input) {
      setError(t('invalidUrl', locale));
      setParsedUrl(null);
    }
  }, [input, locale]);

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="urlInput">{t('inputLabel', locale)}</label>
          <input
            type="text"
            id="urlInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('inputPlaceholder', locale)}
          />
        </div>

        {error && (
          <div className="output-section">
            <div className="output-content error">{error}</div>
          </div>
        )}

        {parsedUrl && !error && (
          <div className="output-grid">
            <div className="parse-result">
              <CopyButton text={parsedUrl.protocol} locale={locale} />
              <div className="parse-name">{t('protocol', locale)}</div>
              <div className="parse-output">{parsedUrl.protocol}</div>
            </div>

            <div className="parse-result">
              <CopyButton text={parsedUrl.host} locale={locale} />
              <div className="parse-name">{t('host', locale)}</div>
              <div className="parse-output">{parsedUrl.host}</div>
            </div>

            <div className="parse-result">
              <CopyButton text={parsedUrl.hostname} locale={locale} />
              <div className="parse-name">{t('hostname', locale)}</div>
              <div className="parse-output">{parsedUrl.hostname}</div>
            </div>

            <div className="parse-result">
              <CopyButton text={parsedUrl.port} locale={locale} />
              <div className="parse-name">{t('port', locale)}</div>
              <div className="parse-output">{parsedUrl.port}</div>
            </div>

            <div className="parse-result">
              <CopyButton text={parsedUrl.pathname} locale={locale} />
              <div className="parse-name">{t('pathname', locale)}</div>
              <div className="parse-output">{parsedUrl.pathname}</div>
            </div>

            <div className="parse-result">
              <CopyButton text={parsedUrl.search} locale={locale} />
              <div className="parse-name">{t('search', locale)}</div>
              <div className="parse-output">{parsedUrl.search}</div>
            </div>

            <div className="parse-result">
              <CopyButton text={parsedUrl.hash} locale={locale} />
              <div className="parse-name">{t('hash', locale)}</div>
              <div className="parse-output">{parsedUrl.hash}</div>
            </div>

            <div className="parse-result">
              <CopyButton text={parsedUrl.origin} locale={locale} />
              <div className="parse-name">{t('origin', locale)}</div>
              <div className="parse-output">{parsedUrl.origin}</div>
            </div>

            {parsedUrl.searchParams.length > 0 && (
              <div className="parse-result full-width">
                <div className="parse-name">{t('queryParams', locale)}</div>
                <table className="params-table">
                  <thead>
                    <tr>
                      <th>{t('param', locale)}</th>
                      <th>{t('value', locale)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedUrl.searchParams.map(([key, value]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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