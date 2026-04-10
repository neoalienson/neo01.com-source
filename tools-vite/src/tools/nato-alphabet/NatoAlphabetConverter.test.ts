import { describe, it, expect } from 'vitest';
import { toStandardNato, toUppercaseNato, toLowercaseNato, toDashSeparated, toCommaSeparated, toPhoneticOnly } from './NatoAlphabetConverter.jsx';

describe('NatoAlphabetConverter', () => {
  describe('toStandardNato', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts single letter to standard NATO', () => {
        expect(toStandardNato('A')).toBe('A - Alpha');
      });

      it('converts word Hello', () => {
        expect(toStandardNato('Hello')).toBe('H - Hotel\nE - Echo\nL - Lima\nL - Lima\nO - Oscar');
      });

      it('converts phrase Hello World', () => {
        expect(toStandardNato('Hello World')).toBe('H - Hotel\nE - Echo\nL - Lima\nL - Lima\nO - Oscar\n[SPACE]\nW - Whiskey\nO - Oscar\nR - Romeo\nL - Lima\nD - Delta');
      });

      it('converts ABC', () => {
        expect(toStandardNato('ABC')).toBe('A - Alpha\nB - Bravo\nC - Charlie');
      });

      it('converts numbers 123', () => {
        expect(toStandardNato('123')).toBe('1 - One\n2 - Two\n3 - Three');
      });

      it('converts mixed alphanumeric', () => {
        expect(toStandardNato('1A2B')).toBe('1 - One\nA - Alpha\n2 - Two\nB - Bravo');
      });
    });

    describe('Edge Cases - Lowercase input', () => {
      it('converts lowercase a to standard NATO', () => {
        expect(toStandardNato('a')).toBe('A - Alpha');
      });

      it('converts lowercase test', () => {
        expect(toStandardNato('test')).toBe('T - Tango\nE - Echo\nS - Sierra\nT - Tango');
      });
    });

    describe('Edge Cases - Empty and spaces', () => {
      it('handles empty string', () => {
        expect(toStandardNato('')).toBe('');
      });

      it('handles single space', () => {
        expect(toStandardNato(' ')).toBe('[SPACE]');
      });

      it('handles multiple spaces', () => {
        expect(toStandardNato('   ')).toBe('[SPACE]\n[SPACE]\n[SPACE]');
      });
    });

    describe('Edge Cases - Unknown characters', () => {
      it('handles symbols', () => {
        expect(toStandardNato('@#$%')).toBe('@ - [@]\n# - [#]\n$ - [$]\n% - [%]');
      });

      it('handles punctuation', () => {
        expect(toStandardNato('Hello!')).toBe('H - Hotel\nE - Echo\nL - Lima\nL - Lima\nO - Oscar\n! - [!]');
      });
    });

    describe('Edge Cases - Long text', () => {
      it('handles long phrase', () => {
        const result = toStandardNato('Hello World 123');
        expect(result).toContain('H - Hotel');
        expect(result).toContain('O - Oscar');
        expect(result).toContain('[SPACE]');
        expect(result).toContain('1 - One');
      });
    });
  });

  describe('toUppercaseNato', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts single letter to uppercase NATO', () => {
        expect(toUppercaseNato('A')).toBe('ALPHA');
      });

      it('converts word Hello to uppercase', () => {
        expect(toUppercaseNato('Hello')).toBe('HOTEL ECHO LIMA LIMA OSCAR');
      });

      it('converts phrase with spaces', () => {
        expect(toUppercaseNato('Hello World')).toBe('HOTEL ECHO LIMA LIMA OSCAR SPACE WHISKEY OSCAR ROMEO LIMA DELTA');
      });
    });

    describe('Edge Cases - Lowercase input', () => {
      it('converts lowercase to uppercase NATO', () => {
        expect(toUppercaseNato('a')).toBe('ALPHA');
      });

      it('converts lowercase test', () => {
        expect(toUppercaseNato('test')).toBe('TANGO ECHO SIERRA TANGO');
      });
    });

    describe('Edge Cases - Empty and spaces', () => {
      it('handles empty string', () => {
        expect(toUppercaseNato('')).toBe('');
      });

      it('handles single space', () => {
        expect(toUppercaseNato(' ')).toBe('SPACE');
      });
    });

    describe('Edge Cases - Unknown characters', () => {
      it('preserves unknown characters', () => {
        expect(toUppercaseNato('@#\$%')).toBe('@ # \$ %');
      });
    });
  });

  describe('toLowercaseNato', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts single letter to lowercase NATO', () => {
        expect(toLowercaseNato('A')).toBe('alpha');
      });

      it('converts word Hello to lowercase', () => {
        expect(toLowercaseNato('Hello')).toBe('hotel echo lima lima oscar');
      });
    });

    describe('Edge Cases - Empty and spaces', () => {
      it('handles empty string', () => {
        expect(toLowercaseNato('')).toBe('');
      });

      it('handles single space', () => {
        expect(toLowercaseNato(' ')).toBe('space');
      });
    });
  });

  describe('toDashSeparated', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts single letter with dash', () => {
        expect(toDashSeparated('A')).toBe('Alpha');
      });

      it('converts word with dash separators', () => {
        expect(toDashSeparated('Hello')).toBe('Hotel - Echo - Lima - Lima - Oscar');
      });

      it('converts phrase with spaces', () => {
        expect(toDashSeparated('Hello World')).toBe('Hotel - Echo - Lima - Lima - Oscar - Space - Whiskey - Oscar - Romeo - Lima - Delta');
      });
    });

    describe('Edge Cases - Empty and spaces', () => {
      it('handles empty string', () => {
        expect(toDashSeparated('')).toBe('');
      });

      it('handles single space', () => {
        expect(toDashSeparated(' ')).toBe('Space');
      });
    });
  });

  describe('toCommaSeparated', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts single letter with comma', () => {
        expect(toCommaSeparated('A')).toBe('Alpha');
      });

      it('converts word with comma separators', () => {
        expect(toCommaSeparated('Hello')).toBe('Hotel, Echo, Lima, Lima, Oscar');
      });

      it('converts phrase with spaces', () => {
        expect(toCommaSeparated('Hello World')).toBe('Hotel, Echo, Lima, Lima, Oscar, Space, Whiskey, Oscar, Romeo, Lima, Delta');
      });
    });

    describe('Edge Cases - Empty and spaces', () => {
      it('handles empty string', () => {
        expect(toCommaSeparated('')).toBe('');
      });

      it('handles single space', () => {
        expect(toCommaSeparated(' ')).toBe('Space');
      });
    });
  });

  describe('toPhoneticOnly', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts single letter to phonetic only', () => {
        expect(toPhoneticOnly('A')).toBe('Alpha');
      });

      it('converts word with phonetic only', () => {
        expect(toPhoneticOnly('Hello')).toBe('Hotel Echo Lima Lima Oscar');
      });

      it('converts phrase ignoring spaces', () => {
        expect(toPhoneticOnly('Hello World')).toBe('Hotel Echo Lima Lima Oscar Whiskey Oscar Romeo Lima Delta');
      });

      it('converts numbers 123', () => {
        expect(toPhoneticOnly('123')).toBe('One Two Three');
      });
    });

    describe('Edge Cases - Empty and spaces', () => {
      it('handles empty string', () => {
        expect(toPhoneticOnly('')).toBe('');
      });

      it('handles single space (no phonetic output)', () => {
        expect(toPhoneticOnly(' ')).toBe('');
      });

      it('handles multiple spaces (no phonetic output)', () => {
        expect(toPhoneticOnly('   ')).toBe('');
      });
    });

    describe('Edge Cases - Unknown characters', () => {
      it('ignores symbols', () => {
        expect(toPhoneticOnly('@#\$%')).toBe('');
      });

      it('ignores punctuation', () => {
        expect(toPhoneticOnly('Hello!')).toBe('Hotel Echo Lima Lima Oscar');
      });
    });

    describe('Edge Cases - Mixed content', () => {
      it('handles alphanumeric with spaces', () => {
        expect(toPhoneticOnly('1A2B')).toBe('One Alpha Two Bravo');
      });

      it('handles mixed case', () => {
        expect(toPhoneticOnly('Test')).toBe('Tango Echo Sierra Tango');
      });
    });
  });

  describe('Integration - All formats for same input', () => {
    it('produces correct output for Hello World', () => {
      const input = 'Hello World';
      expect(toStandardNato(input)).toBe('H - Hotel\nE - Echo\nL - Lima\nL - Lima\nO - Oscar\n[SPACE]\nW - Whiskey\nO - Oscar\nR - Romeo\nL - Lima\nD - Delta');
      expect(toUppercaseNato(input)).toBe('HOTEL ECHO LIMA LIMA OSCAR SPACE WHISKEY OSCAR ROMEO LIMA DELTA');
      expect(toLowercaseNato(input)).toBe('hotel echo lima lima oscar space whiskey oscar romeo lima delta');
      expect(toDashSeparated(input)).toBe('Hotel - Echo - Lima - Lima - Oscar - Space - Whiskey - Oscar - Romeo - Lima - Delta');
      expect(toCommaSeparated(input)).toBe('Hotel, Echo, Lima, Lima, Oscar, Space, Whiskey, Oscar, Romeo, Lima, Delta');
      expect(toPhoneticOnly(input)).toBe('Hotel Echo Lima Lima Oscar Whiskey Oscar Romeo Lima Delta');
    });

    it('produces correct output for ABC', () => {
      const input = 'ABC';
      expect(toStandardNato(input)).toBe('A - Alpha\nB - Bravo\nC - Charlie');
      expect(toUppercaseNato(input)).toBe('ALPHA BRAVO CHARLIE');
      expect(toLowercaseNato(input)).toBe('alpha bravo charlie');
      expect(toDashSeparated(input)).toBe('Alpha - Bravo - Charlie');
      expect(toCommaSeparated(input)).toBe('Alpha, Bravo, Charlie');
      expect(toPhoneticOnly(input)).toBe('Alpha Bravo Charlie');
    });

    it('produces correct output for 123', () => {
      const input = '123';
      expect(toStandardNato(input)).toBe('1 - One\n2 - Two\n3 - Three');
      expect(toUppercaseNato(input)).toBe('ONE TWO THREE');
      expect(toLowercaseNato(input)).toBe('one two three');
      expect(toDashSeparated(input)).toBe('One - Two - Three');
      expect(toCommaSeparated(input)).toBe('One, Two, Three');
      expect(toPhoneticOnly(input)).toBe('One Two Three');
    });
  });

  describe('Edge Cases - Case insensitivity', () => {
    it('converts uppercase Test', () => {
      expect(toStandardNato('Test')).toBe('T - Tango\nE - Echo\nS - Sierra\nT - Tango');
    });

    it('converts lowercase test', () => {
      expect(toStandardNato('test')).toBe('T - Tango\nE - Echo\nS - Sierra\nT - Tango');
    });

    it('produces same NATO output for A and a', () => {
      expect(toStandardNato('A')).toBe(toStandardNato('a'));
      expect(toUppercaseNato('A')).toBe(toUppercaseNato('a'));
      expect(toLowercaseNato('A')).toBe(toLowercaseNato('a'));
    });
  });

  describe('Edge Cases - Special NATO letters', () => {
    it('handles X-ray correctly', () => {
      expect(toStandardNato('X')).toBe('X - X-ray');
      expect(toUppercaseNato('X')).toBe('X-RAY');
      expect(toLowercaseNato('x')).toBe('x-ray');
      expect(toDashSeparated('X')).toBe('X-ray');
      expect(toCommaSeparated('X')).toBe('X-ray');
      expect(toPhoneticOnly('X')).toBe('X-ray');
    });
  });
});