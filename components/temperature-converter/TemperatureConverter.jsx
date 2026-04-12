import React, { useState, useCallback } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

export function celsiusToFahrenheit(c) {
  return c * 9 / 5 + 32;
}

export function fahrenheitToCelsius(f) {
  return (f - 32) * 5 / 9;
}

export function celsiusToKelvin(c) {
  return c + 273.15;
}

export function kelvinToCelsius(k) {
  return k - 273.15;
}

export function celsiusToRankine(c) {
  return (c + 273.15) * 9 / 5;
}

export function rankineToCelsius(r) {
  return (r * 5 / 9) - 273.15;
}

function formatTemperature(value) {
  return Math.round(value * 100) / 100;
}

const translations = {
  en: {
    title: 'Temperature Converter',
    inputLabel: 'Temperature value:',
    placeholder: 'Enter temperature...',
    about: 'About Temperature Converter',
    description: 'Temperature Converter instantly converts temperatures between Celsius, Fahrenheit, and Kelvin scales. Different regions and scientific fields use different temperature scales, making conversion essential for international communication, scientific work, and everyday situations.',
    commonUseCases: 'Common Use Cases',
    useCase1: 'Travelers convert weather forecasts when visiting countries using different temperature scales',
    useCase2: 'Cooks convert recipe temperatures between Celsius and Fahrenheit',
    useCase3: 'Scientists convert between Celsius and Kelvin for calculations',
    useCase4: 'Students verify homework answers and international teams communicate temperature specifications',
    tip: 'Enter a temperature value in any scale. Click on any result to switch input to that scale. The tool automatically displays conversions to all scales in real-time.',
    scales: {
      Celsius: { symbol: '°C', description: 'Water freezes at 0°C, boils at 100°C' },
      Fahrenheit: { symbol: '°F', description: 'Water freezes at 32°F, boils at 212°F' },
      Kelvin: { symbol: 'K', description: 'Absolute zero at 0K, water freezes at 273.15K' },
      Rankine: { symbol: '°R', description: 'Absolute zero at 0°R, water freezes at 491.67°R' }
    }
  },
  'zh-CN': {
    title: '温度转换器',
    inputLabel: '温度值：',
    placeholder: '输入温度...',
    about: '关于温度转换器',
    description: '温度转换器可即时在摄氏、华氏和开氏温标之间转换温度。不同地区和科学领域使用不同的温标，使转换对于国际交流、科学工作和日常生活至关重要。',
    commonUseCases: '常见用例',
    useCase1: '旅行者在访问使用不同温标的国家时转换天气预报',
    useCase2: '厨师在摄氏和华氏温度之间转换食谱温度',
    useCase3: '科学家在计算时转换摄氏和开氏温度',
    useCase4: '学生验证作业答案，国际团队交流温度规格',
    tip: '输入任意温标的温度值。点击任意结果可切换到该温标。工具会自动实时显示所有温标的转换。',
    scales: {
      Celsius: { symbol: '°C', description: '水在 0°C 结冰，在 100°C 沸腾' },
      Fahrenheit: { symbol: '°F', description: '水在 32°F 结冰，在 212°F 沸腾' },
      Kelvin: { symbol: 'K', description: '绝对零度为 0K，水在 273.15K 结冰' },
      Rankine: { symbol: '°R', description: '绝对零度为 0°R，水在 491.67°R 结冰' }
    }
  },
  'zh-TW': {
    title: '溫度轉換器',
    inputLabel: '溫度值：',
    placeholder: '輸入溫度...',
    about: '關於溫度轉換器',
    description: '溫度轉換器可即時在攝氏、華氏和開氏溫標之間轉換溫度。不同地區和科學領域使用不同的溫標，使轉換對於國際交流、科學工作和日常生活至關重要。',
    commonUseCases: '常見用例',
    useCase1: '旅行者在訪問使用不同溫標的國家時轉換天氣預報',
    useCase2: '廚師在攝氏和華氏溫度之間轉換食譜溫度',
    useCase3: '科學家在計算時轉換攝氏和開氏溫度',
    useCase4: '學生驗證作業答案，國際團隊交流溫度規格',
    tip: '輸入任意溫標的溫度值。點擊任意結果可切換到該溫標。工具會自動即時顯示所有溫標的轉換。',
    scales: {
      Celsius: { symbol: '°C', description: '水在 0°C 結冰，在 100°C 沸騰' },
      Fahrenheit: { symbol: '°F', description: '水在 32°F 結冰，在 212°F 沸騰' },
      Kelvin: { symbol: 'K', description: '絕對零度為 0K，水在 273.15K 結冰' },
      Rankine: { symbol: '°R', description: '絕對零度為 0°R，水在 491.67°R 結冰' }
    }
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

const SCALES = [
  { name: 'Celsius', fromCelsius: c => c },
  { name: 'Fahrenheit', fromCelsius: celsiusToFahrenheit },
  { name: 'Kelvin', fromCelsius: celsiusToKelvin },
  { name: 'Rankine', fromCelsius: celsiusToRankine }
];

const TO_CELSIUS = {
  Celsius: c => c,
  Fahrenheit: fahrenheitToCelsius,
  Kelvin: kelvinToCelsius,
  Rankine: rankineToCelsius
};

export function TemperatureConverter({ locale = 'en' }) {
  const [inputValue, setInputValue] = useState(25);
  const [currentScale, setCurrentScale] = useState('Celsius');

  const handleInputChange = useCallback((e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setInputValue(value);
    }
  }, []);

  const switchToScale = useCallback((scaleName, value) => {
    setCurrentScale(scaleName);
    setInputValue(value);
  }, []);

  const trans = translations[locale] || translations.en;

  const celsiusValue = TO_CELSIUS[currentScale](inputValue);

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label htmlFor="tempInput">{t('inputLabel', locale)}</label>
          <input
            type="number"
            id="tempInput"
            placeholder={t('placeholder', locale)}
            value={inputValue}
            onChange={handleInputChange}
            step="0.01"
          />
        </div>

        <div className="output-grid">
          {SCALES.map(scale => {
            const convertedValue = scale.fromCelsius(celsiusValue);
            const formattedValue = formatTemperature(convertedValue);
            const scaleInfo = trans.scales?.[scale.name] || {};

            return (
              <div
                key={scale.name}
                className="temp-result"
                onClick={() => switchToScale(scale.name, convertedValue)}
                style={{ cursor: 'pointer' }}
              >
                <div className="temp-name">{scale.name}</div>
                <div className="temp-value">
                  {formattedValue} {scaleInfo.symbol || (scale.name === 'Kelvin' ? 'K' : scale.name === 'Rankine' ? '°R' : '°C')}
                </div>
                <div className="temp-description">{scaleInfo.description || ''}</div>
                <CopyButton
                  text={formattedValue.toString()}
                  locale={locale}
                  className="copy-individual"
                />
              </div>
            );
          })}
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