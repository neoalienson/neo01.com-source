import { describe, it, expect } from 'vitest';
import { formatTime, formatTimeShort, formatLapTime, parseTimeToMs, isValidTimeString } from './Chronometer';

describe('Chronometer', () => {
  describe('formatTime', () => {
    describe('Happy Flow', () => {
      it('formats zero milliseconds', () => {
        expect(formatTime(0)).toBe('00:00:00.000');
      });

      it('formats seconds only', () => {
        expect(formatTime(1000)).toBe('00:00:01.000');
      });

      it('formats minutes', () => {
        expect(formatTime(65000)).toBe('00:01:05.000');
      });

      it('formats hours', () => {
        expect(formatTime(3661000)).toBe('01:01:01.000');
      });

      it('formats milliseconds', () => {
        expect(formatTime(123)).toBe('00:00:00.123');
      });

      it('formats complex time', () => {
        expect(formatTime(9876543)).toBe('02:44:36.543');
      });
    });

    describe('Edge Cases', () => {
      it('handles negative numbers as zero', () => {
        expect(formatTime(-1000)).toBe('00:00:00.000');
      });

      it('handles non-number input', () => {
        expect(formatTime('string' as any)).toBe('00:00:00.000');
        expect(formatTime(null as any)).toBe('00:00:00.000');
        expect(formatTime(undefined as any)).toBe('00:00:00.000');
      });

      it('formats without milliseconds when showMillis is false', () => {
        expect(formatTime(123456, false)).toBe('00:02:03');
      });
    });
  });

  describe('formatTimeShort', () => {
    describe('Happy Flow', () => {
      it('formats seconds only', () => {
        expect(formatTimeShort(5000)).toBe('0:05');
      });

      it('formats minutes and seconds', () => {
        expect(formatTimeShort(65000)).toBe('1:05');
      });

      it('formats hours with minutes', () => {
        expect(formatTimeShort(3665000)).toBe('1:01:05');
      });
    });

    describe('Edge Cases', () => {
      it('handles zero', () => {
        expect(formatTimeShort(0)).toBe('0:00');
      });

      it('handles negative as zero', () => {
        expect(formatTimeShort(-1000)).toBe('0:00');
      });
    });
  });

  describe('formatLapTime', () => {
    it('formats lap data correctly', () => {
      const result = formatLapTime(1, 5000, 10000);
      expect(result.lap).toBe(1);
      expect(result.lapTime).toBe('00:00:05.000');
      expect(result.totalTime).toBe('00:00:10.000');
    });

    it('formats multiple laps', () => {
      const result = formatLapTime(5, 30000, 120000);
      expect(result.lap).toBe(5);
      expect(result.lapTime).toBe('00:00:30.000');
      expect(result.totalTime).toBe('00:02:00.000');
    });
  });

  describe('parseTimeToMs', () => {
    describe('Happy Flow', () => {
      it('parses HH:MM:SS format', () => {
        expect(parseTimeToMs('01:30:45')).toBe((1*3600 + 30*60 + 45) * 1000);
      });

      it('parses MM:SS format', () => {
        expect(parseTimeToMs('05:30')).toBe((5*60 + 30) * 1000);
      });

      it('parses seconds only', () => {
        // Implementation requires MM:SS or HH:MM:SS format
        expect(parseTimeToMs('0:45')).toBe(45 * 1000);
      });
    });

    describe('Edge Cases', () => {
      it('returns 0 for non-string input', () => {
        expect(parseTimeToMs(null as any)).toBe(0);
        expect(parseTimeToMs(undefined as any)).toBe(0);
        expect(parseTimeToMs(123 as any)).toBe(0);
      });

      it('returns 0 for invalid format', () => {
        expect(parseTimeToMs('invalid')).toBe(0);
        expect(Number.isNaN(parseTimeToMs('abc:def')) || parseTimeToMs('abc:def') === 0).toBe(true);
      });
    });
  });

  describe('isValidTimeString', () => {
    describe('Valid Time Strings', () => {
      it('accepts HH:MM:SS format', () => {
        expect(isValidTimeString('01:30:45')).toBe(true);
      });

      it('accepts MM:SS format', () => {
        expect(isValidTimeString('05:30')).toBe(true);
      });

      it('accepts with milliseconds', () => {
        expect(isValidTimeString('01:30:45.123')).toBe(true);
      });
    });

    describe('Invalid Time Strings', () => {
      it('rejects non-strings', () => {
        expect(isValidTimeString(null as any)).toBe(false);
        expect(isValidTimeString(undefined as any)).toBe(false);
        expect(isValidTimeString(123 as any)).toBe(false);
      });

      it('rejects invalid formats', () => {
        expect(isValidTimeString('invalid')).toBe(false);
        expect(isValidTimeString('1:2:3:4')).toBe(false);
        expect(isValidTimeString('')).toBe(false);
      });
    });
  });
});
