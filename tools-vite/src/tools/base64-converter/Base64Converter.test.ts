import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64, isBase64 } from './Base64Converter.jsx';

describe('Base64Converter', () => {
  describe('encodeBase64', () => {
    describe('Happy Flow - Standard text encoding', () => {
      it('encodes simple ASCII text', () => {
        expect(encodeBase64('Hello')).toBe('SGVsbG8=');
      });

      it('encodes "Hello World"', () => {
        expect(encodeBase64('Hello World')).toBe('SGVsbG8gV29ybGQ=');
      });

      it('encodes "The quick brown fox"', () => {
        expect(encodeBase64('The quick brown fox')).toBe('VGhlIHF1aWNrIGJyb3duIGZveA==');
      });

      it('encodes "M" (single char, produces padding)', () => {
        expect(encodeBase64('M')).toBe('TQ==');
      });

      it('encodes "Ma" (two chars, produces one =)', () => {
        expect(encodeBase64('Ma')).toBe('TWE=');
      });

      it('encodes "Man" (three chars, no padding)', () => {
        expect(encodeBase64('Man')).toBe('TWFu');
      });

      it('encodes empty string', () => {
        expect(encodeBase64('')).toBe('');
      });

      it('encodes "a" (minimum input)', () => {
        expect(encodeBase64('a')).toBe('YQ==');
      });

      it('encodes "ab" (two chars)', () => {
        expect(encodeBase64('ab')).toBe('YWI=');
      });

      it('encodes "abc" (three chars)', () => {
        expect(encodeBase64('abc')).toBe('YWJj');
      });

      it('encodes "abcd" (four chars)', () => {
        expect(encodeBase64('abcd')).toBe('YWJjZA==');
      });
    });

    describe('Happy Flow - URL-safe encoding', () => {
      it('encodes with URL-safe flag replacing + and /', () => {
        expect(encodeBase64('Hello+World/Test', true)).toBe('SGVsbG8rV29ybGQvVGVzdA');
      });

      it('encodes "a+b" with urlSafe to get no padding', () => {
        expect(encodeBase64('a+b', true)).toBe('YSti');
      });

      it('encodes basic text with urlSafe without padding', () => {
        expect(encodeBase64('Hello', true)).toBe('SGVsbG8');
      });

      it('encodes longer text with urlSafe', () => {
        expect(encodeBase64('user@example.com', true)).toBe('dXNlckBleGFtcGxlLmNvbQ');
      });
    });

    describe('Happy Flow - Numbers and special chars', () => {
      it('encodes numbers', () => {
        expect(encodeBase64('1234567890')).toBe('MTIzNDU2Nzg5MA==');
      });

      it('encodes special characters', () => {
        expect(encodeBase64('!@#$%^&*()')).toBe('IUAjJCVeJiooKQ==');
      });

      it('encodes spaces', () => {
        expect(encodeBase64('   ')).toBe('ICAg');
      });

      it('encodes newlines', () => {
        expect(encodeBase64('\n\n\n')).toBe('CgoK');
      });
    });

    describe('Edge Cases - Long text', () => {
      it('encodes long string', () => {
        const long = 'a'.repeat(1000);
        expect(encodeBase64(long)).toBeTruthy();
        expect(encodeBase64(long).length).toBeGreaterThan(1000);
      });

      it('encodes repeating pattern', () => {
        expect(encodeBase64('abcabcabc')).toBe('YWJjYWJjYWJj');
      });
    });

    describe('Edge Cases - Unicode text', () => {
      it('encodes Chinese characters', () => {
        expect(encodeBase64('你好')).toBe('5L2g5aW9');
      });

      it('encodes Japanese characters', () => {
        expect(encodeBase64('こんにちは')).toBe('44GT44KT44Gr44Gh44Gv');
      });

      it('encodes Korean characters', () => {
        expect(encodeBase64('안녕하세요')).toBe('7JWI64WV7ZWY7IS47JqU');
      });

      it('encodes emoji', () => {
        expect(encodeBase64('👋🌍🎉')).toBe('8J+Ri/CfjI3wn46J');
      });

      it('encodes mixed Unicode', () => {
        expect(encodeBase64('Hello世界👋')).toBe('SGVsbG/kuJbnlYzwn5GL');
      });
    });

    describe('Edge Cases - Special Unicode', () => {
      it('encodes mathematical symbols', () => {
        expect(encodeBase64('∑∏∫∂∆∇')).toBe('4oiR4oiP4oir4oiC4oiG4oiH');
      });

      it('encodes accented characters', () => {
        expect(encodeBase64('café')).toBe('Y2Fm6Q==');
      });

      it('encodes German umlauts', () => {
        expect(encodeBase64('Übung')).toBe('w5xic3VuZw==');
      });

      it('encodes Russian Cyrillic', () => {
        expect(encodeBase64('Привет')).toBe('0KHQsNC80LDRgNCw0L0=');
      });
    });

    describe('Edge Cases - Binary-like data', () => {
      it('encodes data that would have + in standard Base64', () => {
        const result = encodeBase64('+++');
        expect(result).toBe('KysrKw==');
      });

      it('encodes data that would have / in standard Base64', () => {
        const result = encodeBase64('///');
        expect(result).toBe('Ly8vLw==');
      });

      it('encodes mixed binary characters', () => {
        expect(encodeBase64('\x00\x01\x02')).toBe('AAEC');
      });
    });

    describe('Exceptional Cases - Encoding errors', () => {
      it('handles surrogate pairs that might cause encoding errors', () => {
        // This tests the unescape/encodeURIComponent approach
        const result = encodeBase64('𝌆'); // Musical G clef surrogate pair
        expect(result).toBeTruthy();
      });
    });
  });

  describe('decodeBase64', () => {
    describe('Happy Flow - Standard text decoding', () => {
      it('decodes simple Base64', () => {
        expect(decodeBase64('SGVsbG8=')).toBe('Hello');
      });

      it('decodes SGVsbG8gV29ybGQ= to Hello World', () => {
        expect(decodeBase64('SGVsbG8gV29ybGQ=')).toBe('Hello World');
      });

      it('decodes TWFu to Man', () => {
        expect(decodeBase64('TWFu')).toBe('Man');
      });

      it('decodes "TWE=" to "Ma"', () => {
        expect(decodeBase64('TWE=')).toBe('Ma');
      });

      it('decodes "TQ==" to "M"', () => {
        expect(decodeBase64('TQ==')).toBe('M');
      });

      it('decodes empty string', () => {
        expect(decodeBase64('')).toBe('');
      });

      it('decodes "YQ==" to "a"', () => {
        expect(decodeBase64('YQ==')).toBe('a');
      });

      it('decodes "YWI=" to "ab"', () => {
        expect(decodeBase64('YWI=')).toBe('ab');
      });

      it('decodes "YWJj" to "abc"', () => {
        expect(decodeBase64('YWJj')).toBe('abc');
      });

      it('decodes "YWJjZA==" to "abcd"', () => {
        expect(decodeBase64('YWJjZA==')).toBe('abcd');
      });
    });

    describe('Happy Flow - URL-safe decoding', () => {
      it('decodes URL-safe Base64 with - instead of +', () => {
        expect(decodeBase64('SGVsbG8rV29ybGQ', true)).toBe('Hello+World');
      });

      it('decodes URL-safe Base64 with _ instead of /', () => {
        expect(decodeBase64('U29tZXRoaW5nL1Rlc3Q', true)).toBe('Something/Test');
      });

      it('decodes URL-safe without padding', () => {
        expect(decodeBase64('SGVsbG8', true)).toBe('Hello');
      });

      it('decodes "YSti" from urlSafe encode', () => {
        expect(decodeBase64('YSti', true)).toBe('a+b');
      });

      it('decodes email-like Base64', () => {
        expect(decodeBase64('dXNlckBleGFtcGxlLmNvbQ', true)).toBe('user@example.com');
      });
    });

    describe('Edge Cases - Padding variations', () => {
      it('decodes Base64 with no padding when length is divisible by 4', () => {
        expect(decodeBase64('YWJj')).toBe('abc');
      });

      it('decodes Base64 with single = padding', () => {
        expect(decodeBase64('YWI=')).toBe('ab');
      });

      it('decodes Base64 with double == padding', () => {
        expect(decodeBase64('YQ==')).toBe('a');
      });

      it('handles padding added automatically for URL-safe mode', () => {
        expect(decodeBase64('YQ', true)).toBe('a');
      });

      it('handles short input in URL-safe mode', () => {
        expect(decodeBase64('YWJj', true)).toBe('abc');
      });
    });

    describe('Edge Cases - Unicode decoding', () => {
      it('decodes Chinese characters', () => {
        expect(decodeBase64('5L2g5aW9')).toBe('你好');
      });

      it('decodes Japanese characters', () => {
        expect(decodeBase64('44GT44KT44Gr44Gh44Gv')).toBe('こんにちは');
      });

      it('decodes emoji', () => {
        expect(decodeBase64('8J7hm5mBrOeGl')).toBe('👋🌍🎉');
      });

      it('decodes mixed Unicode', () => {
        expect(decodeBase64('SGVsbG8lMjnlsoI8Kfh')).toBe('Hello世界👋');
      });
    });

    describe('Edge Cases - Special characters', () => {
      it('decodes special characters', () => {
        expect(decodeBase64('IUAjJCVeJiooKQ==')).toBe('!@#$%^&*()');
      });

      it('decodes mathematical symbols', () => {
        expect(decodeBase64('4piioKnsmIfsmKfsmKf')).toBe('∑∏∫∂∆∇');
      });

      it('decodes accented characters', () => {
        expect(decodeBase64('Y2Fm6Q==')).toBe('café');
      });
    });

    describe('Exceptional Cases - Invalid input', () => {
      it('throws error for invalid Base64 characters', () => {
        expect(() => decodeBase64('SGVsbG8!')).toThrow('Invalid Base64 string');
      });

      it('throws error for completely invalid string', () => {
        expect(() => decodeBase64('!!!')).toThrow('Invalid Base64 string');
      });

      it('throws error for whitespace-heavy invalid string', () => {
        expect(() => decodeBase64('SGV  sbG 8=')).toThrow('Invalid Base64 string');
      });
    });
  });

  describe('isBase64', () => {
    describe('Happy Flow - Valid Base64 detection', () => {
      it('detects valid simple Base64', () => {
        expect(isBase64('SGVsbG8=')).toBe(true);
      });

      it('detects valid Base64 without padding', () => {
        expect(isBase64('SGVsbG8gV29ybGQ')).toBe(true);
      });

      it('detects valid Base64 with == padding', () => {
        expect(isBase64('YQ==')).toBe(true);
      });

      it('detects valid Base64 with = padding', () => {
        expect(isBase64('YWI=')).toBe(true);
      });

      it('detects empty string as not Base64', () => {
        expect(isBase64('')).toBe(false);
      });
    });

    describe('Edge Cases - Invalid Base64 detection', () => {
      it('detects invalid characters', () => {
        expect(isBase64('SGVsbG8!')).toBe(false);
      });

      it('detects invalid with spaces', () => {
        expect(isBase64('SGVsb G8=')).toBe(false);
      });

      it('detects invalid with newlines', () => {
        expect(isBase64('SGV\nsb\nG8=')).toBe(false);
      });

      it('detects text as not Base64', () => {
        expect(isBase64('Hello World')).toBe(false);
      });

      it('detects single invalid char', () => {
        expect(isBase64('!')).toBe(false);
      });
    });

    describe('Edge Cases - Edge valid cases', () => {
      it('detects single character Base64', () => {
        expect(isBase64('YQ==')).toBe(true);
      });

      it('detects two character Base64', () => {
        expect(isBase64('YWI=')).toBe(true);
      });

      it('detects three character Base64 (no padding)', () => {
        expect(isBase64('YWJj')).toBe(true);
      });

      it('detects four character Base64 with padding', () => {
        expect(isBase64('YWJjZA==')).toBe(true);
      });
    });
  });

  describe('Round-trip encoding/decoding', () => {
    describe('Happy Flow - Encode then decode returns original', () => {
      it('round-trips "Hello World"', () => {
        const encoded = encodeBase64('Hello World');
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe('Hello World');
      });

      it('round-trips "Man"', () => {
        const encoded = encodeBase64('Man');
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe('Man');
      });

      it('round-trips Chinese characters', () => {
        const encoded = encodeBase64('你好');
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe('你好');
      });

      it('round-trips emoji', () => {
        const encoded = encodeBase64('👋🌍🎉');
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe('👋🌍🎉');
      });

      it('round-trips numbers and symbols', () => {
        const encoded = encodeBase64('123!@#');
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe('123!@#');
      });

      it('round-trips long text', () => {
        const long = 'Lorem ipsum dolor sit amet ' + 'consectetur adipiscing elit '.repeat(10);
        const encoded = encodeBase64(long);
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe(long);
      });
    });

    describe('Happy Flow - URL-safe round-trip', () => {
      it('round-trips with URL-safe encoding', () => {
        const encoded = encodeBase64('Hello+World/Test', true);
        const decoded = decodeBase64(encoded, true);
        expect(decoded).toBe('Hello+World/Test');
      });

      it('round-trips email with URL-safe', () => {
        const encoded = encodeBase64('user@example.com', true);
        const decoded = decodeBase64(encoded, true);
        expect(decoded).toBe('user@example.com');
      });

      it('round-trips special chars with URL-safe', () => {
        const encoded = encodeBase64('a+b/c+d', true);
        const decoded = decodeBase64(encoded, true);
        expect(decoded).toBe('a+b/c+d');
      });
    });

    describe('Edge Cases - Round-trip variations', () => {
      it('round-trips all ASCII characters', () => {
        const ascii = ' !\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
        const encoded = encodeBase64(ascii);
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe(ascii);
      });

      it('round-trips binary data', () => {
        const binary = '\x00\x01\x02\x03\x04\x05\x06\x07';
        const encoded = encodeBase64(binary);
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe(binary);
      });

      it('round-trips mixed content', () => {
        const mixed = 'Hello 世界 👋 123 !@#';
        const encoded = encodeBase64(mixed);
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe(mixed);
      });
    });
  });

  describe('Cross-check with known values', () => {
    it('encodes known test vector "f"', () => {
      expect(encodeBase64('f')).toBe('Zg==');
    });

    it('encodes known test vector "fo"', () => {
      expect(encodeBase64('fo')).toBe('Zm8=');
    });

    it('encodes known test vector "foo"', () => {
      expect(encodeBase64('foo')).toBe('Zm9v');
    });

    it('encodes known test vector "foob"', () => {
      expect(encodeBase64('foob')).toBe('Zm9vYg==');
    });

    it('encodes known test vector "fooba"', () => {
      expect(encodeBase64('fooba')).toBe('Zm9vYmE=');
    });

    it('encodes known test vector "foobar"', () => {
      expect(encodeBase64('foobar')).toBe('Zm9vYmFy');
    });

    it('decodes known test vector "Zm9vYmFy" to "foobar"', () => {
      expect(decodeBase64('Zm9vYmFy')).toBe('foobar');
    });

    it('decodes known test vector "Zg==" to "f"', () => {
      expect(decodeBase64('Zg==')).toBe('f');
    });

    it('decodes known test vector "Zm8=" to "fo"', () => {
      expect(decodeBase64('Zm8=')).toBe('fo');
    });

    it('decodes known test vector "Zm9v" to "foo"', () => {
      expect(decodeBase64('Zm9v')).toBe('foo');
    });
  });

  describe('Boundary conditions', () => {
    it('handles very short input "a"', () => {
      const encoded = encodeBase64('a');
      expect(decodeBase64(encoded)).toBe('a');
    });

    it('handles maximum padding scenario', () => {
      const encoded = encodeBase64('a');
      expect(encoded).toBe('YQ==');
    });

    it('handles minimum padding scenario', () => {
      const encoded = encodeBase64('aaa');
      expect(encoded).toBe('YWFh');
    });

    it('handles boundary between padded and unpadded', () => {
      expect(decodeBase64('YWJj')).toBe('abc');
      expect(decodeBase64('YWJjZA==')).toBe('abcd');
    });
  });
});