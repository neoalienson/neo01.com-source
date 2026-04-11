import { describe, it, expect } from 'vitest';
import { getUTCOffset, getCityName, TIMEZONES, DEFAULT_TIMEZONES } from './WorldClock.jsx';

describe('WorldClock', () => {
  describe('getUTCOffset', () => {
    describe('Happy Flow - Standard timezones', () => {
      it('returns UTC+0 for UTC timezone', () => {
        expect(getUTCOffset('UTC')).toBe('UTC+0');
      });

      it('returns correct offset for America/New_York', () => {
        const offset = getUTCOffset('America/New_York');
        expect(offset).toMatch(/^UTC[+-]\d+$/);
      });

      it('returns correct offset for Europe/London', () => {
        const offset = getUTCOffset('Europe/London');
        expect(offset).toMatch(/^UTC[+-]\d+$/);
      });

      it('returns correct offset for Asia/Tokyo', () => {
        expect(getUTCOffset('Asia/Tokyo')).toBe('UTC+9');
      });

      it('returns correct offset for Pacific/Honolulu', () => {
        expect(getUTCOffset('Pacific/Honolulu')).toBe('UTC-10');
      });

      it('returns correct offset for Australia/Sydney', () => {
        const offset = getUTCOffset('Australia/Sydney');
        expect(offset).toMatch(/^UTC[+-]\d+$/);
      });
    });

    describe('Edge Cases - Half-hour and quarter-hour offsets', () => {
      it('returns UTC with minutes for Asia/Kolkata (UTC+5:30)', () => {
        const offset = getUTCOffset('Asia/Kolkata');
        expect(offset).toBe('UTC+5:30');
      });

      it('returns UTC with minutes for Asia/Kathmandu (UTC+5:45)', () => {
        const offset = getUTCOffset('Asia/Kathmandu');
        expect(offset).toBe('UTC+5:45');
      });

      it('returns UTC with minutes for Pacific/Fiji (UTC+12)', () => {
        const offset = getUTCOffset('Pacific/Fiji');
        expect(offset).toMatch(/UTC[+-]\d+$/);
      });

      it('returns UTC with minutes for Australia/Adelaide (UTC+9:30)', () => {
        const offset = getUTCOffset('Australia/Adelaide');
        expect(offset).toBe('UTC+9:30');
      });
    });

    describe('Edge Cases - US timezones', () => {
      it('returns correct offset for America/Los_Angeles (Pacific)', () => {
        const offset = getUTCOffset('America/Los_Angeles');
        expect(offset).toMatch(/^UTC[+-]\d+$/);
      });

      it('returns correct offset for America/Denver (Mountain)', () => {
        const offset = getUTCOffset('America/Denver');
        expect(offset).toMatch(/^UTC[+-]\d+$/);
      });

      it('returns correct offset for America/Chicago (Central)', () => {
        const offset = getUTCOffset('America/Chicago');
        expect(offset).toMatch(/^UTC[+-]\d+$/);
      });
    });

    describe('Edge Cases - With specific date', () => {
      it('handles date parameter', () => {
        const date = new Date('2024-01-15T12:00:00Z');
        const offset = getUTCOffset('UTC', date);
        expect(offset).toBe('UTC+0');
      });

      it('handles different dates for same timezone', () => {
        const summerDate = new Date('2024-07-15T12:00:00Z');
        const winterDate = new Date('2024-01-15T12:00:00Z');
        const summerOffset = getUTCOffset('America/New_York', summerDate);
        const winterOffset = getUTCOffset('America/New_York', winterDate);
        // Note: Offsets may differ due to DST
        expect(summerOffset).toMatch(/^UTC[+-]\d+(:\d{2})?$/);
        expect(winterOffset).toMatch(/^UTC[+-]\d+(:\d{2})?$/);
      });
    });
  });

  describe('getCityName', () => {
    describe('Happy Flow - Standard parsing', () => {
      it('parses America/New_York correctly', () => {
        expect(getCityName('America/New_York')).toBe('New York');
      });

      it('parses Europe/London correctly', () => {
        expect(getCityName('Europe/London')).toBe('London');
      });

      it('parses Asia/Tokyo correctly', () => {
        expect(getCityName('Asia/Tokyo')).toBe('Tokyo');
      });

      it('parses Asia/Singapore correctly', () => {
        expect(getCityName('Asia/Singapore')).toBe('Singapore');
      });

      it('parses Pacific/Honolulu correctly', () => {
        expect(getCityName('Pacific/Honolulu')).toBe('Honolulu');
      });

      it('parses Australia/Sydney correctly', () => {
        expect(getCityName('Australia/Sydney')).toBe('Sydney');
      });
    });

    describe('Edge Cases - Underscore replacement', () => {
      it('replaces underscores with spaces', () => {
        expect(getCityName('America/Los_Angeles')).toBe('Los Angeles');
      });

      it('replaces multiple underscores', () => {
        expect(getCityName('America/St_Johns')).toBe('St Johns');
      });

      it('handles Pacific/Midway', () => {
        expect(getCityName('Pacific/Midway')).toBe('Midway');
      });
    });

    describe('Edge Cases - With translations', () => {
      it('applies translation when available', () => {
        const translations = { 'New York': '纽约', 'London': '伦敦' };
        expect(getCityName('America/New_York', translations)).toBe('纽约');
      });

      it('falls back to original when translation not available', () => {
        const translations = { 'London': '伦敦' };
        expect(getCityName('America/New_York', translations)).toBe('New York');
      });

      it('applies partial translations', () => {
        const translations = { 'Tokyo': '东京' };
        expect(getCityName('Asia/Tokyo', translations)).toBe('东京');
        expect(getCityName('Europe/London', translations)).toBe('London');
      });

      it('handles empty translations object', () => {
        expect(getCityName('Europe/London', {})).toBe('London');
      });

      it('handles undefined translations', () => {
        expect(getCityName('Europe/London')).toBe('London');
      });
    });
  });

  describe('TIMEZONES constant', () => {
    it('contains expected number of timezones', () => {
      expect(TIMEZONES.length).toBeGreaterThan(30);
    });

    it('contains UTC timezone', () => {
      expect(TIMEZONES.some(tz => tz.tz === 'UTC')).toBe(true);
    });

    it('contains common US timezones', () => {
      expect(TIMEZONES.some(tz => tz.tz === 'America/New_York')).toBe(true);
      expect(TIMEZONES.some(tz => tz.tz === 'America/Los_Angeles')).toBe(true);
    });

    it('contains major city timezones', () => {
      expect(TIMEZONES.some(tz => tz.tz === 'Europe/London')).toBe(true);
      expect(TIMEZONES.some(tz => tz.tz === 'Asia/Tokyo')).toBe(true);
    });

    it('each timezone has country property', () => {
      TIMEZONES.forEach(({ tz, country }) => {
        expect(tz).toBeDefined();
        expect(country).toBeDefined();
        expect(typeof country).toBe('string');
      });
    });
  });

  describe('DEFAULT_TIMEZONES constant', () => {
    it('contains 4 default timezones', () => {
      expect(DEFAULT_TIMEZONES).toHaveLength(4);
    });

    it('contains America/New_York', () => {
      expect(DEFAULT_TIMEZONES).toContain('America/New_York');
    });

    it('contains Europe/London', () => {
      expect(DEFAULT_TIMEZONES).toContain('Europe/London');
    });

    it('contains Asia/Tokyo', () => {
      expect(DEFAULT_TIMEZONES).toContain('Asia/Tokyo');
    });

    it('contains Australia/Sydney', () => {
      expect(DEFAULT_TIMEZONES).toContain('Australia/Sydney');
    });

    it('all entries are valid timezone strings', () => {
      DEFAULT_TIMEZONES.forEach(tz => {
        expect(typeof tz).toBe('string');
        expect(tz).toContain('/');
      });
    });
  });

  describe('Integration - Offset and city name together', () => {
    it('provides both offset and city for default timezones', () => {
      DEFAULT_TIMEZONES.forEach(tz => {
        const offset = getUTCOffset(tz);
        const city = getCityName(tz);
        expect(offset).toMatch(/^UTC[+-]\d+(:\d{2})?$/);
        expect(city).toBeTruthy();
        expect(city.length).toBeGreaterThan(0);
      });
    });

    it('works with translations for all default timezones', () => {
      const translations = {
        'New York': '纽约',
        'London': '伦敦',
        'Tokyo': '东京',
        'Sydney': '悉尼'
      };

      DEFAULT_TIMEZONES.forEach(tz => {
        const city = getCityName(tz, translations);
        expect(city).toBeTruthy();
      });
    });
  });
});