import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';

const TIMEZONES = [
  { tz: 'Pacific/Midway', country: 'USA' },
  { tz: 'Pacific/Honolulu', country: 'USA' },
  { tz: 'America/Anchorage', country: 'USA' },
  { tz: 'America/Los_Angeles', country: 'USA' },
  { tz: 'America/Denver', country: 'USA' },
  { tz: 'America/Chicago', country: 'USA' },
  { tz: 'America/New_York', country: 'USA' },
  { tz: 'America/Halifax', country: 'Canada' },
  { tz: 'America/St_Johns', country: 'Canada' },
  { tz: 'America/Sao_Paulo', country: 'Brazil' },
  { tz: 'America/Buenos_Aires', country: 'Argentina' },
  { tz: 'Atlantic/Azores', country: 'Portugal' },
  { tz: 'UTC', country: 'UTC' },
  { tz: 'Europe/London', country: 'UK' },
  { tz: 'Europe/Paris', country: 'France' },
  { tz: 'Europe/Berlin', country: 'Germany' },
  { tz: 'Europe/Rome', country: 'Italy' },
  { tz: 'Europe/Athens', country: 'Greece' },
  { tz: 'Europe/Istanbul', country: 'Turkey' },
  { tz: 'Europe/Moscow', country: 'Russia' },
  { tz: 'Asia/Dubai', country: 'UAE' },
  { tz: 'Asia/Kabul', country: 'Afghanistan' },
  { tz: 'Asia/Karachi', country: 'Pakistan' },
  { tz: 'Asia/Kolkata', country: 'India' },
  { tz: 'Asia/Kathmandu', country: 'Nepal' },
  { tz: 'Asia/Dhaka', country: 'Bangladesh' },
  { tz: 'Asia/Yangon', country: 'Myanmar' },
  { tz: 'Asia/Bangkok', country: 'Thailand' },
  { tz: 'Asia/Singapore', country: 'Singapore' },
  { tz: 'Asia/Hong_Kong', country: 'Hong Kong' },
  { tz: 'Asia/Shanghai', country: 'China' },
  { tz: 'Asia/Tokyo', country: 'Japan' },
  { tz: 'Asia/Seoul', country: 'South Korea' },
  { tz: 'Australia/Adelaide', country: 'Australia' },
  { tz: 'Australia/Sydney', country: 'Australia' },
  { tz: 'Pacific/Auckland', country: 'New Zealand' },
  { tz: 'Pacific/Fiji', country: 'Fiji' }
];

const DEFAULT_TIMEZONES = [
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const translations = {
  en: {
    title: 'World Clock',
    referenceTime: 'Reference Time',
    resetTime: 'Reset Time',
    hour24Format: '24-hour format',
    addTimezone: 'Add Timezone',
    cancel: 'Cancel',
    remove: 'Remove',
    about: 'About World Clock',
    description: 'World Clock displays current time across multiple timezones simultaneously. In our globally connected world, coordinating across timezones is essential for remote teams, international business, and personal connections.',
    commonUseCases: 'Common Use Cases',
    useCase1: 'Remote teams coordinate meetings across timezones',
    useCase2: 'International businesses schedule calls with clients',
    useCase3: 'Travelers track time in destination and home timezone',
    useCase4: 'Event organizers plan global webinars and conferences',
    tip: 'Click Add Timezone to select regions you want to monitor. Clocks update automatically every second.',
    cities: {},
    countries: {}
  },
  'zh-CN': {
    title: '世界时钟',
    referenceTime: '参考时间',
    resetTime: '重置时间',
    hour24Format: '24小时制',
    addTimezone: '添加时区',
    cancel: '取消',
    remove: '移除',
    about: '关于世界时钟',
    description: '世界时钟同时显示多个时区的当前时间。在全球互联的世界中，协调不同时区对于远程团队、国际商务和个人联系至关重要。',
    commonUseCases: '常见用例',
    useCase1: '远程团队协调跨时区会议',
    useCase2: '国际企业与客户安排通话',
    useCase3: '旅客追踪目的地和家乡时间',
    useCase4: '活动组织者计划全球网络研讨会和会议',
    tip: '点击"添加时区"选择您要监控的地区。时钟每秒自动更新。',
    cities: {
      'New York': '纽约',
      'Los Angeles': '洛杉矶',
      'London': '伦敦',
      'Tokyo': '东京',
      'Sydney': '悉尼',
      'Shanghai': '上海',
      'Hong Kong': '香港',
      'Singapore': '新加坡',
      'Paris': '巴黎',
      'Berlin': '柏林'
    },
    countries: {
      'USA': '美国',
      'UK': '英国',
      'Japan': '日本',
      'Australia': '澳大利亚',
      'China': '中国',
      'Canada': '加拿大',
      'France': '法国',
      'Germany': '德国'
    }
  },
  'zh-TW': {
    title: '世界時鐘',
    referenceTime: '參考時間',
    resetTime: '重置時間',
    hour24Format: '24小時制',
    addTimezone: '添加時區',
    cancel: '取消',
    remove: '移除',
    about: '關於世界時鐘',
    description: '世界時鐘同時顯示多個時區的當前時間。在全球互聯的世界中，協調不同時區對於遠程團隊、國際商務和個人聯繫至關重要。',
    commonUseCases: '常見用例',
    useCase1: '遠程團隊協調跨時區會議',
    useCase2: '國際企業與客戶安排通話',
    useCase3: '旅客追蹤目的地和家鄉時間',
    useCase4: '活動組織者計劃全球網絡研討會和會議',
    tip: '點擊"添加時區"選擇您要監控的地區。時鐘每秒自動更新。',
    cities: {
      'New York': '紐約',
      'Los Angeles': '洛杉磯',
      'London': '倫敦',
      'Tokyo': '東京',
      'Sydney': '雪梨',
      'Shanghai': '上海',
      'Hong Kong': '香港',
      'Singapore': '新加坡',
      'Paris': '巴黎',
      'Berlin': '柏林'
    },
    countries: {
      'USA': '美國',
      'UK': '英國',
      'Japan': '日本',
      'Australia': '澳大利亞',
      'China': '中國',
      'Canada': '加拿大',
      'France': '法國',
      'Germany': '德國'
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

export function getUTCOffset(timezone, date = new Date()) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offset = (tzDate - utcDate) / 3600000;
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  return minutes > 0 ? `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}` : `UTC${sign}${hours}`;
}

export function getCityName(timezone, translations = {}) {
  const parts = timezone.split('/');
  const cityName = parts[parts.length - 1].replace(/_/g, ' ');
  return translations[cityName] || cityName;
}

export function WorldClock({ locale = 'en' }) {
  const [timezones, setTimezones] = useState(() => {
    try {
      const saved = localStorage.getItem('worldClockTimezones');
      return saved ? JSON.parse(saved) : DEFAULT_TIMEZONES;
    } catch {
      return DEFAULT_TIMEZONES;
    }
  });
  const [timeOffset, setTimeOffset] = useState(0);
  const [use24Hour, setUse24Hour] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const hourHandRef = useRef(null);
  const minuteHandRef = useRef(null);
  const clockRef = useRef(null);
  const isDraggingRef = useRef(false);
  const currentHandRef = useRef(null);

  const saveTimezones = useCallback((tzList) => {
    try {
      localStorage.setItem('worldClockTimezones', JSON.stringify(tzList));
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = new Date(currentTime.getTime() + timeOffset);
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();

    if (hourHandRef.current) {
      hourHandRef.current.style.transform = `rotate(${hours * 30 + minutes * 0.5}deg)`;
    }
    if (minuteHandRef.current) {
      minuteHandRef.current.style.transform = `rotate(${minutes * 6}deg)`;
    }
  }, [currentTime, timeOffset]);

  const handleDragStart = useCallback((e, hand) => {
    isDraggingRef.current = true;
    currentHandRef.current = hand;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !clockRef.current) return;

      const rect = clockRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI + 90;
      const adjustedAngle = angle < 0 ? angle + 360 : angle;

      const now = new Date();
      const offsetTime = new Date(now.getTime() + timeOffset);

      if (currentHandRef.current === minuteHandRef.current) {
        const targetMinutes = Math.round(adjustedAngle / 6) % 60;
        const currentMinutes = offsetTime.getMinutes();
        const minuteDiff = targetMinutes - currentMinutes;
        setTimeOffset(prev => prev + minuteDiff * 60000);
      } else if (currentHandRef.current === hourHandRef.current) {
        const targetHours = Math.round(adjustedAngle / 30) % 12;
        const currentHours = offsetTime.getHours() % 12;
        const hourDiff = targetHours - currentHours;
        setTimeOffset(prev => prev + hourDiff * 3600000);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      currentHandRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [timeOffset]);

  const handleAddTimezone = useCallback((tz) => {
    if (!timezones.includes(tz)) {
      const newTimezones = [...timezones, tz];
      setTimezones(newTimezones);
      saveTimezones(newTimezones);
    }
    setShowModal(false);
  }, [timezones, saveTimezones]);

  const handleRemoveTimezone = useCallback((index) => {
    const newTimezones = timezones.filter((_, i) => i !== index);
    setTimezones(newTimezones);
    saveTimezones(newTimezones);
  }, [timezones, saveTimezones]);

  const handleResetTime = useCallback(() => {
    setTimeOffset(0);
  }, []);

  const handleToggleAMPM = useCallback(() => {
    setTimeOffset(prev => prev + 12 * 3600000);
  }, []);

  const trans = translations[locale] || translations.en;
  const now = new Date(currentTime.getTime() + timeOffset);

  const referenceTimeStr = now.toLocaleTimeString('en-US', {
    hour12: !use24Hour,
    hour: '2-digit',
    minute: '2-digit'
  });

  const referenceDateStr = now.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="clock-container">
          <div className="clock-section">
            <div className="analog-clock" ref={clockRef}>
              <div className="clock-number" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}>12</div>
              <div className="clock-number" style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}>3</div>
              <div className="clock-number" style={{ bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}>6</div>
              <div className="clock-number" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)' }}>9</div>
              <div
                ref={minuteHandRef}
                className="clock-hand minute-hand"
                onMouseDown={(e) => handleDragStart(e, minuteHandRef.current)}
              />
              <div
                ref={hourHandRef}
                className="clock-hand hour-hand"
                onMouseDown={(e) => handleDragStart(e, hourHandRef.current)}
              />
              <div className="clock-center" />
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '14px' }}>
              Drag clock hands to adjust time
            </div>
          </div>
          <div className="clock-controls">
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#495057', marginBottom: '10px' }}>
              {t('referenceTime', locale)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '2rem', fontWeight: 'bold', color: '#007acc' }}>
                {referenceTimeStr}
              </div>
              {!use24Hour && (
                <button
                  onClick={handleToggleAMPM}
                  style={{
                    padding: '6px 12px',
                    background: '#007acc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {now.getHours() >= 12 ? 'PM' : 'AM'}
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '10px', textAlign: 'center' }}>
              {referenceDateStr}
            </div>
            <button
              onClick={handleResetTime}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '15px',
                width: '100%'
              }}
            >
              {t('resetTime', locale)}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <label style={{ fontSize: '14px', color: '#555' }}>{t('hour24Format', locale)}</label>
              <label className="time-switch">
                <input
                  type="checkbox"
                  checked={use24Hour}
                  onChange={(e) => setUse24Hour(e.target.checked)}
                />
                <span className="time-slider" />
              </label>
            </div>
          </div>
        </div>

        <div className="clocks-grid">
          {timezones.map((timezone, index) => {
            const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
            const tzHours = tzTime.getHours() % 12;
            const tzMinutes = tzTime.getMinutes();
            const cityName = getCityName(timezone, trans.cities || {});
            const offset = getUTCOffset(timezone, now);
            const timeStr = tzTime.toLocaleTimeString('en-US', {
              hour12: !use24Hour,
              hour: '2-digit',
              minute: '2-digit'
            });
            const dateStr = tzTime.toLocaleDateString(locale, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div key={timezone} className="clock-card">
                <div className="city-name">{cityName}</div>
                <div className="date-display">{dateStr}</div>
                <div className="time-display">{timeStr}</div>
                <div className="timezone-display">{offset}</div>
                <div className="card-analog-clock">
                  <div
                    className="card-clock-hand card-hour-hand"
                    style={{ transform: `rotate(${tzHours * 30 + tzMinutes * 0.5}deg)` }}
                  />
                  <div
                    className="card-clock-hand card-minute-hand"
                    style={{ transform: `rotate(${tzMinutes * 6}deg)` }}
                  />
                  <div className="card-clock-center" />
                </div>
                <button className="remove-btn" onClick={() => handleRemoveTimezone(index)}>
                  {t('remove', locale)}
                </button>
              </div>
            );
          })}

          <div className="add-timezone" onClick={() => setShowModal(true)}>
            <div className="add-timezone-text">+ {t('addTimezone', locale)}</div>
          </div>
        </div>

        {showModal && (
          <div className="modal" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-content">
              <div className="modal-header">{t('addTimezone', locale)}</div>
              <select
                onChange={(e) => e.target.value && handleAddTimezone(e.target.value)}
                value=""
              >
                <option value="" disabled>Select timezone...</option>
                {TIMEZONES.filter(tz => !timezones.includes(tz.tz)).map(({ tz, country }) => {
                  const cityName = getCityName(tz, trans.cities || {});
                  const countryName = trans.countries?.[country] || country;
                  const offset = getUTCOffset(tz, now);
                  return (
                    <option key={tz} value={tz}>
                      {offset} {cityName} ({countryName})
                    </option>
                  );
                })}
              </select>
              <div className="modal-buttons">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {t('cancel', locale)}
                </button>
              </div>
            </div>
          </div>
        )}
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