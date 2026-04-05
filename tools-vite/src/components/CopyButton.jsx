import React, { useState, useCallback } from 'react';

export function CopyButton({ text, className = 'copy-individual' }) {
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
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}