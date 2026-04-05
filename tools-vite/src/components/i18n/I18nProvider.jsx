import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    common: {
      copy: "Copy",
      copied: "Copied!"
    },
    caseConverter: {
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
    }
  },
  "zh-CN": {
    common: {
      copy: "复制",
      copied: "已复制！"
    },
    caseConverter: {
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
    }
  },
  "zh-TW": {
    common: {
      copy: "複製",
      copied: "已複製！"
    },
    caseConverter: {
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
  }
};

const I18nContext = createContext(translations.en);

export function useTranslation() {
  const t = useContext(I18nContext);
  return {
    t: (key) => {
      const keys = key.split('.');
      let value = t;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    }
  };
}

export function I18nProvider({ children, locale = 'en' }) {
  const [currentTranslations, setCurrentTranslations] = useState(translations[locale] || translations.en);

  useEffect(() => {
    setCurrentTranslations(translations[locale] || translations.en);
  }, [locale]);

  return (
    <I18nContext.Provider value={currentTranslations}>
      {children}
    </I18nContext.Provider>
  );
}