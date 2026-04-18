import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToolLayout } from '../../components/ToolLayout.jsx';

// ─────────────────────────────────────────────
// Pure parsing functions (testable)
// ─────────────────────────────────────────────

export function formatTime(ms, showMillis = true) {
  if (typeof ms !== 'number' || ms < 0) return '00:00:00.000';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  
  const pad = (n, digits = 2) => String(n).padStart(digits, '0');
  
  if (showMillis) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatTimeShort(ms) {
  if (typeof ms !== 'number' || ms < 0) return '0:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (n) => String(n).padStart(2, '0');
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function formatLapTime(lapNumber, lapTime, totalTime) {
  return {
    lap: lapNumber,
    lapTime: formatTime(lapTime),
    totalTime: formatTime(totalTime)
  };
}

export function parseTimeToMs(timeString) {
  if (typeof timeString !== 'string') return 0;
  
  const parts = timeString.split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts.map(Number);
    return ((h * 3600) + (m * 60) + s) * 1000;
  } else if (parts.length === 2) {
    const [m, s] = parts.map(Number);
    return ((m * 60) + s) * 1000;
  }
  return 0;
}

export function isValidTimeString(timeString) {
  if (typeof timeString !== 'string') return false;
  const regex = /^(\d{1,2}:)?\d{1,2}:\d{2}(\.\d{1,3})?$/;
  return regex.test(timeString);
}

// ─────────────────────────────────────────────
// React Component (Client-side only)
// ─────────────────────────────────────────────

const translations = {
  en: {
    title: "Chronometer",
    description: "A stopwatch tool to measure elapsed time with lap support.",
    start: "Start",
    pause: "Pause",
    stop: "Stop",
    reset: "Reset",
    lap: "Lap",
    laps: "Laps",
    noLaps: "No laps recorded",
    clearLaps: "Clear Laps"
  },
  "zh-CN": {
    title: "秒表",
    description: "测量经过时间的秒表工具，支持计次功能。",
    start: "开始",
    pause: "暂停",
    stop: "停止",
    reset: "重置",
    lap: "计次",
    laps: "计次",
    noLaps: "暂无计次记录",
    clearLaps: "清除计次"
  },
  "zh-TW": {
    title: "碼表",
    description: "測量經過時間的碼表工具，支援計次功能。",
    start: "開始",
    pause: "暫停",
    stop: "停止",
    reset: "重置",
    lap: "計次",
    laps: "計次",
    noLaps: "暫無計次記錄",
    clearLaps: "清除計次"
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

export function Chronometer({ locale = 'en' }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const [isClient, setIsClient] = useState(false);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    pausedTimeRef.current = elapsedTime;
    setIsRunning(false);
  }, [elapsedTime]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setElapsedTime(0);
    pausedTimeRef.current = 0;
    setLaps([]);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    pausedTimeRef.current = 0;
  }, []);

  const handleLap = useCallback(() => {
    if (isRunning) {
      const lastLapTime = laps.length > 0 ? laps[0].totalMs : 0;
      const lapTime = elapsedTime - lastLapTime;
      setLaps(prev => [{
        lap: laps.length + 1,
        lapTimeMs: lapTime,
        totalMs: elapsedTime
      }, ...prev]);
    }
  }, [isRunning, elapsedTime, laps]);

  const handleClearLaps = useCallback(() => {
    setLaps([]);
  }, []);

  if (!isClient) {
    return (
      <ToolLayout title={t('title', locale)}>
        <div className="tool_main">
          <p>{t('description', locale)}</p>
          <div className="loading">Loading...</div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <p>{t('description', locale)}</p>
        
        <div className="chrono-display">
          <div className="chrono-time">{formatTime(elapsedTime)}</div>
        </div>
        
        <div className="chrono-controls">
          {!isRunning ? (
            <button className="chrono-btn start" onClick={handleStart}>
              {t('start', locale)}
            </button>
          ) : (
            <button className="chrono-btn pause" onClick={handlePause}>
              {t('pause', locale)}
            </button>
          )}
          <button className="chrono-btn stop" onClick={handleStop}>
            {t('stop', locale)}
          </button>
          <button className="chrono-btn reset" onClick={handleReset}>
            {t('reset', locale)}
          </button>
          <button 
            className="chrono-btn lap" 
            onClick={handleLap}
            disabled={!isRunning}
          >
            {t('lap', locale)}
          </button>
        </div>
        
        <div className="chrono-laps">
          <div className="laps-header">
            <h3>{t('laps', locale)} ({laps.length})</h3>
            {laps.length > 0 && (
              <button className="clear-laps-btn" onClick={handleClearLaps}>
                {t('clearLaps', locale)}
              </button>
            )}
          </div>
          
          {laps.length === 0 ? (
            <p className="no-laps">{t('noLaps', locale)}</p>
          ) : (
            <div className="laps-list">
              {laps.map(lap => (
                <div key={lap.lap} className="lap-item">
                  <span className="lap-number">Lap {lap.lap}</span>
                  <span className="lap-time">{formatTime(lap.lapTimeMs)}</span>
                  <span className="lap-total">{formatTime(lap.totalMs)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
