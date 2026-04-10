import React, { useState, useCallback } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

const NATO_ALPHABET = {
  'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta',
  'E': 'Echo', 'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel',
  'I': 'India', 'J': 'Juliet', 'K': 'Kilo', 'L': 'Lima',
  'M': 'Mike', 'N': 'November', 'O': 'Oscar', 'P': 'Papa',
  'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray',
  'Y': 'Yankee', 'Z': 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three',
  '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
  '8': 'Eight', '9': 'Nine'
};

const translations = {
  en: {
    title: 'NATO Alphabet Converter',
    textToConvert: 'Text to convert to NATO alphabet:',
    placeholder: 'Enter your text here...',
    standardNato: 'Standard NATO',
    uppercaseNato: 'Uppercase NATO',
    lowercaseNato: 'Lowercase NATO',
    dashSeparated: 'Dash Separated',
    commaSeparated: 'Comma Separated',
    phoneticOnly: 'Phonetic Only',
    copy: 'Copy',
    copied: 'Copied!',
    about: 'About NATO Alphabet Converter',
    description: 'NATO Alphabet Converter translates text into the NATO phonetic alphabet, a standardized system for clearly communicating letters over radio or phone.',
    commonUseCases: 'Common Use Cases',
    useCase1: 'Customer service representatives spell names and codes over the phone',
    useCase2: 'Aviation professionals communicate call signs and coordinates',
    useCase3: 'Military and emergency services transmit critical information accurately',
    useCase4: 'IT support spells passwords and license keys',
    tip: 'Tip: Type or paste your text into the input field. The tool automatically converts each character to its NATO phonetic equivalent in real-time.'
  },
  'zh-CN': {
    title: 'NATO 字母表转换器',
    textToConvert: '要转换为 NATO 字母表的文本：',
    placeholder: '在此输入您的文字...',
    standardNato: '标准 NATO',
    uppercaseNato: '大写 NATO',
    lowercaseNato: '小写 NATO',
    dashSeparated: '横杠分隔',
    commaSeparated: '逗号分隔',
    phoneticOnly: '仅语音',
    copy: '复制',
    copied: '已复制！',
    about: '关于 NATO 字母表转换器',
    description: 'NATO 字母表转换器将文本转换为 NATO  phonetic 字母表，这是一种用于在无线电或电话中清晰传达字母的标准化系统。',
    commonUseCases: '常见用例',
    useCase1: '客服代表在电话中拼写姓名和确认码',
    useCase2: '航空专业人员传达呼号和坐标',
    useCase3: '军事和紧急服务准确地传输关键信息',
    useCase4: 'IT 支持拼写密码和许可证密钥',
    tip: '提示：在输入框中输入或粘贴文字，工具会自动实时将每个字符转换为其 NATO phonetic 等效项。'
  },
  'zh-TW': {
    title: 'NATO 字母表轉換器',
    textToConvert: '要轉換為 NATO 字母表的文本：',
    placeholder: '在此輸入您的文字...',
    standardNato: '標準 NATO',
    uppercaseNato: '大寫 NATO',
    lowercaseNato: '小寫 NATO',
    dashSeparated: '橫槓分隔',
    commaSeparated: '逗號分隔',
    phoneticOnly: '僅語音',
    copy: '複製',
    copied: '已複製！',
    about: '關於 NATO 字母表轉換器',
    description: 'NATO 字母表轉換器將文本轉換為 NATO phonetic 字母表，這是一種用於在無線電或電話中清晰傳達字母的標準化系統。',
    commonUseCases: '常見用例',
    useCase1: '客服代表在電話中拼寫姓名和確認碼',
    useCase2: '航空專業人員傳達呼號和坐標',
    useCase3: '軍事和緊急服務準確地傳輸關鍵信息',
    useCase4: 'IT 支持拼寫密碼和許可證密鑰',
    tip: '提示：在輸入框中輸入或貼上文字，工具會自動即時將每個字符轉換為其 NATO phonetic 等效項。'
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

export function toStandardNato(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return `${char} - ${NATO_ALPHABET[char]}`;
    } else if (char === ' ') {
      return '[SPACE]';
    } else if (char.match(/[^A-Z0-9]/)) {
      return `${char} - [${char}]`;
    }
    return char;
  }).join('\n');
}

export function toUppercaseNato(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char].toUpperCase();
    } else if (char === ' ') {
      return 'SPACE';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(' ');
}

export function toLowercaseNato(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char].toLowerCase();
    } else if (char === ' ') {
      return 'space';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(' ');
}

export function toDashSeparated(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char];
    } else if (char === ' ') {
      return 'Space';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(' - ');
}

export function toCommaSeparated(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char];
    } else if (char === ' ') {
      return 'Space';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(', ');
}

export function toPhoneticOnly(text) {
  return text.toUpperCase().split('').filter(char => NATO_ALPHABET[char])
    .map(char => NATO_ALPHABET[char]).join(' ');
}

export function NatoAlphabetConverter({ locale = 'en' }) {
  const [input, setInput] = useState('Hello World');

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const formats = [
    { key: 'standardNato', fn: toStandardNato },
    { key: 'uppercaseNato', fn: toUppercaseNato },
    { key: 'lowercaseNato', fn: toLowercaseNato },
    { key: 'dashSeparated', fn: toDashSeparated },
    { key: 'commaSeparated', fn: toCommaSeparated },
    { key: 'phoneticOnly', fn: toPhoneticOnly }
  ];

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="textInput">{t('textToConvert', locale)}</label>
          <textarea
            id="textInput"
            placeholder={t('placeholder', locale)}
            value={input}
            onChange={handleInputChange}
          />
        </div>

        <div className="output-grid">
          {formats.map(format => (
            <div key={format.key} className="nato-result">
              <CopyButton text={format.fn(input)} locale={locale} className="copy-individual" />
              <div className="nato-name">{t(format.key, locale)}</div>
              <div className="nato-output">{format.fn(input)}</div>
            </div>
          ))}
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