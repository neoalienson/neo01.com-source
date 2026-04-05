import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '../../components/i18n/I18nProvider.jsx';
import { ToolLayout } from '../../components/ToolLayout.jsx';
import { CopyButton } from '../../components/CopyButton.jsx';

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

export function CaseConverter() {
  const { t } = useTranslation();
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
    <ToolLayout title={t('caseConverter.title')}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="textInput">{t('caseConverter.inputLabel')}</label>
          <textarea
            id="textInput"
            value={input}
            onChange={handleInputChange}
            placeholder={t('caseConverter.placeholder')}
          />
        </div>
        <div className="output-grid" id="output">
          {results.map(({ name, result }) => (
            <div key={name} className="case-result">
              <CopyButton text={result} />
              <div className="case-name">{t(`caseConverter.cases.${name}`)}</div>
              <div className="case-output">{result}</div>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}