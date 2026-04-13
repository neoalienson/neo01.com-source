import React, { useState, useCallback } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

export function encodeBase64(text, urlSafe = false) {
  try {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    if (urlSafe) {
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    return encoded;
  } catch {
    throw new Error('Failed to encode text');
  }
}

export function decodeBase64(base64, urlSafe = false) {
  try {
    let normalized = base64;
    if (urlSafe) {
      normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
      while (normalized.length % 4) {
        normalized += '=';
      }
    }
    return decodeURIComponent(escape(atob(normalized)));
  } catch {
    throw new Error('Invalid Base64 string');
  }
}

function isBase64(str) {
  if (!str || str.trim() === '') return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str.replace(/\s/g, ''));
}

const translations = {
  en: {
    title: 'Base64 Encoder/Decoder',
    urlSafe: 'URL Safe',
    inputLabel: 'Input Text:',
    inputPlaceholder: 'Enter text to encode or Base64 to decode...',
    outputLabel: 'Output:',
    outputPlaceholder: 'Output will appear here...',
    encode: 'Encode to Base64',
    decode: 'Decode from Base64',
    copy: 'Copy',
    copied: 'Copied!',
    messagePleaseEnterText: 'Please enter text to encode',
    messagePleaseEnterBase64: 'Please enter Base64 to decode',
    messageEncodedSuccess: 'Text encoded successfully',
    messageDecodedSuccess: 'Base64 decoded successfully',
    messageInvalidBase64: 'Invalid Base64 string',
    messageCopied: 'Copied to clipboard',
    about: 'About Base64 Encoding',
    description: 'Base64 is an encoding scheme that converts binary data into ASCII text using 64 printable characters (A-Z, a-z, 0-9, +, /).',
    commonUseCases: 'Common Use Cases',
    useCase1: 'Embedding images in HTML/CSS (data URLs)',
    useCase2: 'Encoding email attachments (MIME)',
    useCase3: 'Transmitting JSON Web Tokens (JWT)',
    useCase4: 'Storing binary data in databases and encoding API credentials',
    tip: 'Enter any text to encode it to Base64, or paste Base64 to decode it back to plain text. Toggle URL-safe mode for web-friendly encoding.'
  },
  'zh-CN': {
    title: 'Base64 编码器/解码器',
    urlSafe: 'URL 安全',
    inputLabel: '输入文本：',
    inputPlaceholder: '输入要编码的文本或要解码的 Base64...',
    outputLabel: '输出：',
    outputPlaceholder: '输出将显示在这里...',
    encode: '编码为 Base64',
    decode: '从 Base64 解码',
    copy: '复制',
    copied: '已复制！',
    messagePleaseEnterText: '请输入要编码的文本',
    messagePleaseEnterBase64: '请输入要解码的 Base64',
    messageEncodedSuccess: '文本编码成功',
    messageDecodedSuccess: 'Base64 解码成功',
    messageInvalidBase64: '无效的 Base64 字符串',
    messageCopied: '已复制到剪贴板',
    about: '关于 Base64 编码',
    description: 'Base64 是一种将二进制数据转换为 ASCII 文本的编码方案，使用 64 个可打印字符（A-Z、a-z、0-9、+、/）。',
    commonUseCases: '常见用例',
    useCase1: '在 HTML/CSS 中嵌入图像（data URLs）',
    useCase2: '编码电子邮件附件（MIME）',
    useCase3: '传输 JSON Web Tokens (JWT)',
    useCase4: '在数据库中存储二进制数据和编码 API 凭证',
    tip: '输入任何文本将其编码为 Base64，或粘贴 Base64 将其解码回纯文本。切换 URL 安全模式以获得适合网页的编码。'
  },
  'zh-TW': {
    title: 'Base64 編碼器/解碼器',
    urlSafe: 'URL 安全',
    inputLabel: '輸入文本：',
    inputPlaceholder: '輸入要編碼的文本或要解碼的 Base64...',
    outputLabel: '輸出：',
    outputPlaceholder: '輸出將顯示在這裡...',
    encode: '編碼為 Base64',
    decode: '從 Base64 解碼',
    copy: '複製',
    copied: '已複製！',
    messagePleaseEnterText: '請輸入要編碼的文本',
    messagePleaseEnterBase64: '請輸入要解碼的 Base64',
    messageEncodedSuccess: '文本編碼成功',
    messageDecodedSuccess: 'Base64 解碼成功',
    messageInvalidBase64: '無效的 Base64 字串',
    messageCopied: '已複製到剪貼板',
    about: '關於 Base64 編碼',
    description: 'Base64 是一種將二進制數據轉換為 ASCII 文本的編碼方案，使用 64 個可打印字符（A-Z、a-z、0-9、+、/）。',
    commonUseCases: '常見用例',
    useCase1: '在 HTML/CSS 中嵌入圖像（data URLs）',
    useCase2: '編碼電子郵件附件（MIME）',
    useCase3: '傳輸 JSON Web Tokens (JWT)',
    useCase4: '在數據庫中存儲二進制數據和編碼 API 憑證',
    tip: '輸入任何文本將其編碼為 Base64，或粘貼 Base64 將其解碼回純文本。切換 URL 安全模式以獲得適合網頁的編碼。'
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

export function Base64Converter({ locale = 'en' }) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  }, []);

  const handleEncode = useCallback(() => {
    if (!inputText.trim()) {
      showMessage(t('messagePleaseEnterText', locale), 'error');
      return;
    }
    try {
      const encoded = encodeBase64(inputText, urlSafe);
      setOutputText(encoded);
      showMessage(t('messageEncodedSuccess', locale), 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }, [inputText, urlSafe, locale, showMessage]);

  const handleDecode = useCallback(() => {
    if (!inputText.trim()) {
      showMessage(t('messagePleaseEnterBase64', locale), 'error');
      return;
    }
    try {
      const decoded = decodeBase64(inputText, urlSafe);
      setOutputText(decoded);
      showMessage(t('messageDecodedSuccess', locale), 'success');
    } catch (error) {
      showMessage(t('messageInvalidBase64', locale), 'error');
    }
  }, [inputText, urlSafe, locale, showMessage]);

  const handleClearOutput = useCallback(() => {
    setOutputText('');
    setMessage('');
    setMessageType('');
  }, []);

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="controls">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="urlSafe"
              checked={urlSafe}
              onChange={(e) => {
                setUrlSafe(e.target.checked);
                handleClearOutput();
              }}
            />
            <label htmlFor="urlSafe">{t('urlSafe', locale)}</label>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="inputText">{t('inputLabel', locale)}</label>
          <textarea
            id="inputText"
            placeholder={t('inputPlaceholder', locale)}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleClearOutput();
            }}
          />
          <div className="button-group">
            <button className="btn-primary" onClick={handleEncode}>
              {t('encode', locale)}
            </button>
            <button className="btn-secondary" onClick={handleDecode}>
              {t('decode', locale)}
            </button>
          </div>
        </div>

        <div className="input-group">
          <div className="output-header">
            <label htmlFor="outputText">{t('outputLabel', locale)}</label>
            <CopyButton text={outputText} locale={locale} className="btn-copy" />
          </div>
          <textarea
            id="outputText"
            readOnly
            placeholder={t('outputPlaceholder', locale)}
            value={outputText}
          />
          {message && (
            <div id="message" className={messageType} style={{
              padding: '10px',
              marginTop: '10px',
              borderRadius: '4px',
              background: messageType === 'error' ? '#f8d7da' : '#d4edda',
              color: messageType === 'error' ? '#721c24' : '#155724'
            }}>
              {message}
            </div>
          )}
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