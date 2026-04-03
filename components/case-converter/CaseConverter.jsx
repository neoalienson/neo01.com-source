import React, { useState, useCallback, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

const translations = {
  en: {
    title: "Case Converter",
    inputLabel: "Text to convert:",
    placeholder: "Enter text to convert...",
    cases: {
      camelCase: "camelCase",
      PascalCase: "PascalCase",
      snake_case: "snake_case",
      Pascal_Snake_Case: "Pascal_Snake_Case",
      "kebab-case": "kebab-case",
      "Pascal-Kebab-Case": "Pascal-Kebab-Case",
      CONSTANT_CASE: "CONSTANT_CASE",
      "dot.case": "dot.case",
      "path/case": "path/case",
      "Title Case": "Title Case",
      "Sentence case": "Sentence case",
      "UPPER CASE": "UPPER CASE",
      "lower case": "lower case",
      "aLtErNaTiNg CaSe": "aLtErNaTiNg CaSe",
      "InVeRsE CaSe": "InVeRsE CaSe"
    }
  },
  "zh-CN": {
    title: "命名转换器",
    inputLabel: "要转换的文本：",
    placeholder: "输入要转换的文本...",
    cases: {
      camelCase: "驼峰命名",
      PascalCase: "帕斯卡命名",
      snake_case: "下划线命名",
      Pascal_Snake_Case: "帕斯卡下划线",
      "kebab-case": "短横线命名",
      "Pascal-Kebab-Case": "帕斯卡短横线",
      CONSTANT_CASE: "常量命名",
      "dot.case": "点分隔命名",
      "path/case": "路径命名",
      "Title Case": "首字母大写",
      "Sentence case": "句首大写",
      "UPPER CASE": "全大写",
      "lower case": "全小写",
      "aLtErNaTiNg CaSe": "大小写交替",
      "InVeRsE CaSe": "反转换"
    }
  },
  "zh-TW": {
    title: "命名轉換器",
    inputLabel: "要轉換的文字：",
    placeholder: "輸入要轉換的文字...",
    cases: {
      camelCase: "駝峰命名",
      PascalCase: "帕斯卡命名",
      snake_case: "底線命名",
      Pascal_Snake_Case: "帕斯卡底線",
      "kebab-case": "短橫線命名",
      "Pascal-Kebab-Case": "帕斯卡短橫線",
      CONSTANT_CASE: "常數命名",
      "dot.case": "點分隔命名",
      "path/case": "路徑命名",
      "Title Case": "首字母大寫",
      "Sentence case": "句首大寫",
      "UPPER CASE": "全大寫",
      "lower case": "全小寫",
      "aLtErNaTiNg CaSe": "大小寫交替",
      "InVeRsE CaSe": "反轉換"
    }
  }
};

export function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '');
}

export function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '');
}

export function toSnakeCase(str) {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
}

export function toKebabCase(str) {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-');
}

export function toConstantCase(str) {
  return toSnakeCase(str).toUpperCase();
}

export function toDotCase(str) {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('.');
}

export function toPathCase(str) {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('/');
}

export function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function toSentenceCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toUpperCase(str) {
  return str.toUpperCase();
}

export function toLowerCase(str) {
  return str.toLowerCase();
}

export function toAlternatingCase(str) {
  return str
    .split('')
    .map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
    .join('');
}

export function toInverseCase(str) {
  return str
    .split('')
    .map(char => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()))
    .join('');
}

export function toPascalSnakeCase(str) {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
}

export function toPascalKebabCase(str) {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-');
}

function t(key, locale = 'en') {
  const trans = translations[locale] || translations.en;
  const keys = key.split('.');
  let value = trans;
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function CaseConverter({ locale = 'en' }) {
  const [input, setInput] = useState('Hello World! This is a Sample Text.');

  const caseFunctions = useMemo(
    () => [
      { name: 'camelCase', fn: toCamelCase },
      { name: 'PascalCase', fn: toPascalCase },
      { name: 'snake_case', fn: toSnakeCase },
      { name: 'Pascal_Snake_Case', fn: toPascalSnakeCase },
      { name: 'kebab-case', fn: toKebabCase },
      { name: 'Pascal-Kebab-Case', fn: toPascalKebabCase },
      { name: 'CONSTANT_CASE', fn: toConstantCase },
      { name: 'dot.case', fn: toDotCase },
      { name: 'path/case', fn: toPathCase },
      { name: 'Title Case', fn: toTitleCase },
      { name: 'Sentence case', fn: toSentenceCase },
      { name: 'UPPER CASE', fn: toUpperCase },
      { name: 'lower case', fn: toLowerCase },
      { name: 'aLtErNaTiNg CaSe', fn: toAlternatingCase },
      { name: 'InVeRsE CaSe', fn: toInverseCase },
    ],
    []
  );

  const results = useMemo(() => {
    if (!input.trim()) {
      return caseFunctions.map(c => ({ name: c.name, result: '' }));
    }
    return caseFunctions.map(c => ({ name: c.name, result: c.fn(input) }));
  }, [input, caseFunctions]);

  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
    },
    []
  );

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="textInput">{t('inputLabel', locale)}</label>
          <textarea
            id="textInput"
            value={input}
            onChange={handleInputChange}
            placeholder={t('placeholder', locale)}
          />
        </div>
        <div className="output-grid" id="output">
          {results.map(({ name, result }) => (
            <div key={name} className="case-result">
              <CopyButton text={result} />
              <div className="case-name">{t(`cases.${name}`, locale)}</div>
              <div className="case-output">{result}</div>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}