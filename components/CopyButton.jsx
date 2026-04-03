import React, { useState, useCallback } from 'react';

const translations = {
  en: { copy: 'Copy', copied: 'Copied!' },
  'zh-CN': { copy: '复制', copied: '已复制！' },
  'zh-TW': { copy: '複製', copied: '已複製！' }
};

function t(key, locale = 'en') {
  return translations[locale]?.[key] || translations.en[key];
}

export function CopyButton({ text, className = 'copy-individual', locale = 'en' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      style={copied ? { background: '#28a745' } : undefined}
    >
      {copied ? t('copied', locale) : t('copy', locale)}
    </button>
  );
}