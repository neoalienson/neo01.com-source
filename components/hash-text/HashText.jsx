import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

const translations = {
  en: {
    title: "Hash Text",
    inputLabel: "Text to hash:",
    inputPlaceholder: "Enter your text here...",
    hashTypes: {
      md5: "MD5",
      sha1: "SHA-1",
      sha256: "SHA-256",
      sha512: "SHA-512",
      sha3_256: "SHA-3-256",
      sha3_512: "SHA-3-512",
      ripemd160: "RIPEMD-160"
    },
    about: "About Hash Functions",
    description: "Hash functions are cryptographic algorithms that transform any input data into a fixed-size string of characters.",
    howItWorks: "How It Works",
    howItWorksText: "Enter any text and see its hash values across multiple algorithms including MD5, SHA-1, SHA-256, SHA-512, and SHA-3.",
    commonUseCases: "Common Use Cases",
    useCase1: "Verify data integrity with checksums",
    useCase2: "Secure password storage",
    useCase3: "Create digital signatures",
    tip: "Enter any text above to see its hash values computed using various cryptographic algorithms."
  },
  "zh-CN": {
    title: "文本哈希",
    inputLabel: "要哈希的文本：",
    inputPlaceholder: "在此输入文本...",
    hashTypes: {
      md5: "MD5",
      sha1: "SHA-1",
      sha256: "SHA-256",
      sha512: "SHA-512",
      sha3_256: "SHA-3-256",
      sha3_512: "SHA-3-512",
      ripemd160: "RIPEMD-160"
    },
    about: "关于哈希函数",
    description: "哈希函数是将任何输入数据转换为固定长度字符串的加密算法。",
    howItWorks: "工作原理",
    howItWorksText: "输入任何文本，即可看到使用 MD5、SHA-1、SHA-256、SHA-512 和 SHA-3 等多种算法计算的哈希值。",
    commonUseCases: "常见用例",
    useCase1: "使用校验和验证数据完整性",
    useCase2: "安全密码存储",
    useCase3: "创建数字签名",
    tip: "在上方输入任何文本，即可看到使用各种加密算法计算的哈希值。"
  },
  "zh-TW": {
    title: "文字雜湊",
    inputLabel: "要雜湊的文字：",
    inputPlaceholder: "在此輸入文字...",
    hashTypes: {
      md5: "MD5",
      sha1: "SHA-1",
      sha256: "SHA-256",
      sha512: "SHA-512",
      sha3_256: "SHA-3-256",
      sha3_512: "SHA-3-512",
      ripemd160: "RIPEMD-160"
    },
    about: "關於雜湊函數",
    description: "雜湊函數是將任何輸入資料轉換為固定長度字串的加密演算法。",
    howItWorks: "工作原理",
    howItWorksText: "輸入任何文字，即可看到使用 MD5、SHA-1、SHA-256、SHA-512 和 SHA-3 等多種演算法計算的雜湊值。",
    commonUseCases: "常見用例",
    useCase1: "使用校驗和驗證資料完整性",
    useCase2: "安全密碼儲存",
    useCase3: "建立數位簽名",
    tip: "在上方輸入任何文字，即可看到使用各種加密演算法計算的雜湊值。"
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

export function HashText({ locale = 'en' }) {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState({ md5: '', sha1: '', sha256: '', sha512: '', sha3_256: '', sha3_512: '', ripemd160: '' });
  const [ready, setReady] = useState(false);
  const computeRef = useRef(null);

  computeRef.current = () => {
    if (typeof CryptoJS !== 'undefined') {
      const text = input || 'Hello World!';
      setHashes({
        md5: CryptoJS.MD5(text).toString(),
        sha1: CryptoJS.SHA1(text).toString(),
        sha256: CryptoJS.SHA256(text).toString(),
        sha512: CryptoJS.SHA512(text).toString(),
        sha3_256: CryptoJS.SHA3(text, { outputLength: 256 }).toString(),
        sha3_512: CryptoJS.SHA3(text, { outputLength: 512 }).toString(),
        ripemd160: CryptoJS.RIPEMD160(text).toString()
      });
    }
  };

  useEffect(() => {
    setReady(true);
    if (computeRef.current) {
      computeRef.current();
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  useEffect(() => {
    if (ready && computeRef.current) {
      computeRef.current();
    }
  }, [input, ready]);

  const hashTypes = [
    { key: 'md5', label: t('hashTypes.md5', locale) },
    { key: 'sha1', label: t('hashTypes.sha1', locale) },
    { key: 'sha256', label: t('hashTypes.sha256', locale) },
    { key: 'sha512', label: t('hashTypes.sha512', locale) },
    { key: 'sha3_256', label: t('hashTypes.sha3_256', locale) },
    { key: 'sha3_512', label: t('hashTypes.sha3_512', locale) },
    { key: 'ripemd160', label: t('hashTypes.ripemd160', locale) }
  ];

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="textInput">{t('inputLabel', locale)}</label>
          <textarea
            id="textInput"
            value={input}
            onChange={handleInputChange}
            placeholder={t('inputPlaceholder', locale)}
            rows={4}
          />
        </div>

        <div className="output-grid">
          {hashTypes.map(({ key, label }) => (
            <div key={key} className="hash-result">
              <CopyButton text={hashes[key] || ''} locale={locale} />
              <div className="hash-name">{label}</div>
              <div className="hash-output">{hashes[key] || ''}</div>
            </div>
          ))}
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