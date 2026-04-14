import { describe, it, expect } from 'vitest';
import { encodeText, decodeText } from './UrlEncoderFunctions.js';

describe('UrlEncoder', () => {
  describe('encodeText', () => {
    describe('Happy Flow - Standard text encoding', () => {
      it('encodes simple ASCII text', () => {
        expect(encodeText('Hello')).toBe('Hello');
      });

      it('encodes simple text with space', () => {
        expect(encodeText('Hello World')).toBe('Hello%20World');
      });

      it('encodes text with numbers', () => {
        expect(encodeText('abc123')).toBe('abc123');
      });

      it('encodes lowercase letters', () => {
        expect(encodeText('test')).toBe('test');
      });

      it('encodes uppercase letters', () => {
        expect(encodeText('TEST')).toBe('TEST');
      });
    });

    describe('Happy Flow - Special characters that need encoding', () => {
      it('encodes space to %20', () => {
        expect(encodeText('Hello World')).toBe('Hello%20World');
      });

      it('encodes multiple spaces', () => {
        expect(encodeText('a b c')).toBe('a%20b%20c');
      });

      it('encodes exclamation mark', () => {
        expect(encodeText('Hello!')).toBe('Hello!');
      });

      it('encodes at symbol', () => {
        expect(encodeText('user@example')).toBe('user%40example');
      });

      it('encodes hash/pound sign', () => {
        expect(encodeText('test#123')).toBe('test%23123');
      });

      it('encodes percent sign', () => {
        expect(encodeText('50% off')).toBe('50%25%20off');
      });

      it('encodes ampersand', () => {
        expect(encodeText('A & B')).toBe('A%20%26%20B');
      });

      it('encodes equals sign', () => {
        expect(encodeText('a=b')).toBe('a%3Db');
      });

      it('encodes plus sign', () => {
        expect(encodeText('a+b')).toBe('a%2Bb');
      });

      it('encodes question mark', () => {
        expect(encodeText('what?')).toBe('what%3F');
      });

      it('encodes slash', () => {
        expect(encodeText('path/to')).toBe('path%2Fto');
      });

      it('encodes backslash', () => {
        expect(encodeText('a\\b')).toBe('a%5Cb');
      });

      it('encodes quotes', () => {
        expect(encodeText('say "hello"')).toBe('say%20%22hello%22');
      });

it('encodes single quotes', () => {
        expect(encodeText("it's")).toBe("it's");
      });

      it('encodes angle brackets', () => {
        expect(encodeText('<tag>')).toBe('%3Ctag%3E');
      });
    });

    describe('Happy Flow - URL-like strings', () => {
      it('encodes URL with protocol', () => {
        expect(encodeText('https://example.com')).toBe('https%3A%2F%2Fexample.com');
      });

      it('encodes URL with path', () => {
        expect(encodeText('https://example.com/path')).toBe('https%3A%2F%2Fexample.com%2Fpath');
      });

      it('encodes URL with query params', () => {
        expect(encodeText('https://example.com?a=1&b=2')).toBe('https%3A%2F%2Fexample.com%3Fa%3D1%26b%3D2');
      });

      it('encodes URL with hash', () => {
        expect(encodeText('https://example.com#section')).toBe('https%3A%2F%2Fexample.com%23section');
      });

      it('encodes URL with port', () => {
        expect(encodeText('https://example.com:8080')).toBe('https%3A%2F%2Fexample.com%3A8080');
      });
    });

    describe('Happy Flow - Empty and edge case strings', () => {
      it('encodes empty string', () => {
        expect(encodeText('')).toBe('');
      });

      it('encodes single space', () => {
        expect(encodeText(' ')).toBe('%20');
      });

      it('encodes single character', () => {
        expect(encodeText('a')).toBe('a');
      });

      it('encodes newline', () => {
        expect(encodeText('\n')).toBe('%0A');
      });

      it('encodes tab', () => {
        expect(encodeText('\t')).toBe('%09');
      });

      it('encodes carriage return', () => {
        expect(encodeText('\r')).toBe('%0D');
      });
    });

    describe('Edge Cases - Non-ASCII and Unicode', () => {
      it('encodes Chinese characters', () => {
        expect(encodeText('你好')).toBe('%E4%BD%A0%E5%A5%BD');
      });

      it('encodes Japanese characters', () => {
        expect(encodeText('こんにちは')).toBe('%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF');
      });

      it('encodes Korean characters', () => {
        expect(encodeText('안녕하세요')).toBe('%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94');
      });

      it('encodes emoji', () => {
        expect(encodeText('👋🌍🎉')).toBe('%F0%9F%91%8B%F0%9F%8C%8D%F0%9F%8E%89');
      });

      it('encodes accented characters', () => {
        expect(encodeText('café')).toBe('caf%C3%A9');
      });

      it('encodes German umlauts', () => {
        expect(encodeText('Übung')).toBe('%C3%9Cbung');
      });

      it('encodes Russian Cyrillic', () => {
        expect(encodeText('Привет')).toBe('%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82');
      });

      it('encodes Arabic characters', () => {
        expect(encodeText('مرحبا')).toBe('%D9%85%D8%B1%D8%AD%D8%A8%D8%A7');
      });

      it('encodes mixed Unicode', () => {
        expect(encodeText('Hello世界')).toBe('Hello%E4%B8%96%E7%95%8C');
      });
    });

    describe('Edge Cases - Long strings', () => {
      it('encodes long text', () => {
        const long = 'Lorem ipsum dolor sit amet '.repeat(10);
        const encoded = encodeText(long);
        expect(encoded).toContain('%20');
        expect(encoded).not.toContain(' ');
      });

      it('encodes very long URL', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(1000);
        const encoded = encodeText(longUrl);
        expect(encoded).toContain('%2F');
        expect(encoded).toContain('%2F');
      });
    });

    describe('Edge Cases - Special ASCII characters', () => {
      it('encodes all special characters', () => {
        const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\~`';
        const encoded = encodeText(special);
        expect(encoded).not.toBe(special);
        expect(encoded.length).toBeGreaterThan(special.length);
      });

      it('encodes tilde', () => {
        expect(encodeText('~')).toBe('~');
      });

      it('encodes backtick', () => {
        expect(encodeText('`')).toBe('%60');
      });

      it('encodes colon', () => {
        expect(encodeText('a:b')).toBe('a%3Ab');
      });

      it('encodes semicolon', () => {
        expect(encodeText('a;b')).toBe('a%3Bb');
      });

      it('encodes equals', () => {
        expect(encodeText('a=b')).toBe('a%3Db');
      });

      it('encodes question mark', () => {
        expect(encodeText('a?b')).toBe('a%3Fb');
      });

      it('encodes bracket characters', () => {
        expect(encodeText('[]{}')).toBe('%5B%5D%7B%7D');
      });
    });
  });

  describe('decodeText', () => {
    describe('Happy Flow - Standard text decoding', () => {
      it('decodes simple unencoded text', () => {
        expect(decodeText('Hello')).toBe('Hello');
      });

      it('decodes text with spaces', () => {
        expect(decodeText('Hello%20World')).toBe('Hello World');
      });

      it('decodes text with numbers', () => {
        expect(decodeText('abc123')).toBe('abc123');
      });

      it('decodes lowercase letters', () => {
        expect(decodeText('test')).toBe('test');
      });

      it('decodes uppercase letters', () => {
        expect(decodeText('TEST')).toBe('TEST');
      });
    });

    describe('Happy Flow - Encoded special characters', () => {
      it('decodes space', () => {
        expect(decodeText('Hello%20World')).toBe('Hello World');
      });

      it('decodes multiple spaces', () => {
        expect(decodeText('a%20b%20c')).toBe('a b c');
      });

      it('decodes exclamation mark', () => {
        expect(decodeText('Hello%21')).toBe('Hello!');
      });

      it('decodes at symbol', () => {
        expect(decodeText('user%40example')).toBe('user@example');
      });

      it('decodes hash/pound sign', () => {
        expect(decodeText('test%23123')).toBe('test#123');
      });

      it('decodes percent sign', () => {
        expect(decodeText('50%25%20off')).toBe('50% off');
      });

      it('decodes ampersand', () => {
        expect(decodeText('A%20%26%20B')).toBe('A & B');
      });

      it('decodes equals sign', () => {
        expect(decodeText('a%3Db')).toBe('a=b');
      });

      it('decodes plus sign', () => {
        expect(decodeText('a%2Bb')).toBe('a+b');
      });

      it('decodes question mark', () => {
        expect(decodeText('what%3F')).toBe('what?');
      });

      it('decodes slash', () => {
        expect(decodeText('path%2Fto')).toBe('path/to');
      });

      it('decodes quotes', () => {
        expect(decodeText('say%20%22hello%22')).toBe('say "hello"');
      });
    });

    describe('Happy Flow - URL-like strings', () => {
      it('decodes URL with protocol', () => {
        expect(decodeText('https%3A%2F%2Fexample.com')).toBe('https://example.com');
      });

      it('decodes URL with path', () => {
        expect(decodeText('https%3A%2F%2Fexample.com%2Fpath')).toBe('https://example.com/path');
      });

      it('decodes URL with query params', () => {
        expect(decodeText('https%3A%2F%2Fexample.com%3Fa%3D1%26b%3D2')).toBe('https://example.com?a=1&b=2');
      });

      it('decodes URL with hash', () => {
        expect(decodeText('https%3A%2F%2Fexample.com%23section')).toBe('https://example.com#section');
      });

      it('decodes URL with port', () => {
        expect(decodeText('https%3A%2F%2Fexample.com%3A8080')).toBe('https://example.com:8080');
      });
    });

    describe('Happy Flow - Empty and edge case strings', () => {
      it('decodes empty string', () => {
        expect(decodeText('')).toBe('');
      });

      it('decodes single space encoding', () => {
        expect(decodeText('%20')).toBe(' ');
      });

      it('decodes newline', () => {
        expect(decodeText('%0A')).toBe('\n');
      });

      it('decodes tab', () => {
        expect(decodeText('%09')).toBe('\t');
      });

      it('decodes carriage return', () => {
        expect(decodeText('%0D')).toBe('\r');
      });
    });

    describe('Edge Cases - Non-ASCII and Unicode', () => {
      it('decodes Chinese characters', () => {
        expect(decodeText('%E4%BD%A0%E5%A5%BD')).toBe('你好');
      });

      it('decodes Japanese characters', () => {
        expect(decodeText('%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF')).toBe('こんにちは');
      });

      it('decodes Korean characters', () => {
        expect(decodeText('%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94')).toBe('안녕하세요');
      });

      it('decodes emoji', () => {
        expect(decodeText('%F0%9F%91%8B%F0%9F%8C%8D%F0%9F%8E%89')).toBe('👋🌍🎉');
      });

      it('decodes accented characters', () => {
        expect(decodeText('caf%C3%A9')).toBe('café');
      });

      it('decodes German umlauts', () => {
        expect(decodeText('%C3%9Cbung')).toBe('Übung');
      });

      it('decodes Russian Cyrillic', () => {
        expect(decodeText('%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82')).toBe('Привет');
      });

      it('decodes mixed Unicode', () => {
        expect(decodeText('Hello%E4%B8%96%E7%95%8C')).toBe('Hello世界');
      });
    });

    describe('Edge Cases - Long encoded strings', () => {
      it('decodes long text', () => {
        const encoded = 'Lorem%20ipsum%20dolor%20sit%20amet%20'.repeat(10);
        const decoded = decodeText(encoded);
        expect(decoded).not.toContain('%20');
        expect(decoded).toContain(' ');
      });

      it('decodes very long URL', () => {
        const encoded = 'https%3A%2F%2Fexample.com%2F' + 'a%25'.repeat(1000);
        const decoded = decodeText(encoded);
        expect(decoded).not.toContain('%2F');
        expect(decoded).toContain('https://example.com/');
      });
    });

    describe('Edge Cases - Already decoded characters', () => {
      it('decodes mixed encoded and raw', () => {
        expect(decodeText('Hello%20World%21')).toBe('Hello World!');
      });

      it('decodes text without any encoding', () => {
        expect(decodeText('abcdef')).toBe('abcdef');
      });

      it('decodes consecutive encoded segments', () => {
        expect(decodeText('%2F%3A%40')).toBe('/:@');
      });
    });

    describe('Exceptional Cases - Invalid percent encoding', () => {
      it('returns null for incomplete percent encoding', () => {
        expect(decodeText('%')).toBe(null);
      });

      it('returns null for single digit after percent', () => {
        expect(decodeText('%2')).toBe(null);
      });

      it('returns null for invalid hex after percent', () => {
        expect(decodeText('%ZZ')).toBe(null);
      });

      it('returns null for incomplete sequence', () => {
        expect(decodeText('Hello%20World%')).toBe(null);
      });

      it('returns null for truncated encoding', () => {
        expect(decodeText('test%2')).toBe(null);
      });
    });

    describe('Exceptional Cases - Invalid input types', () => {
      it('returns null for malformed URL encoding', () => {
        expect(decodeText('%E4%BD%A0%E5%A5')).toBe(null);
      });

      it('returns null for invalid UTF-8 sequence', () => {
        expect(decodeText('%80%80')).toBe(null);
      });
    });
  });

  describe('Round-trip encoding/decoding', () => {
    describe('Happy Flow - Encode then decode returns original', () => {
      it('round-trips simple text', () => {
        const encoded = encodeText('Hello World');
        const decoded = decodeText(encoded);
        expect(decoded).toBe('Hello World');
      });

      it('round-trips text with special characters', () => {
        const original = 'Hello World! How are you?';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });

      it('round-trips URL-like text', () => {
        const original = 'https://example.com/path?param=value';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });

      it('round-trips text with spaces and tabs', () => {
        const original = 'a b\tc';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });
    });

    describe('Happy Flow - Unicode round-trip', () => {
      it('round-trips Chinese characters', () => {
        const original = '你好世界';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });

      it('round-trips Japanese characters', () => {
        const original = 'こんにちは';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });

      it('round-trips emoji', () => {
        const original = '👋🌍🎉';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });

      it('round-trips mixed Unicode', () => {
        const original = 'Hello 世界 123 🎉';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });
    });

    describe('Edge Cases - Round-trip variations', () => {
      it('round-trips empty string', () => {
        const encoded = encodeText('');
        const decoded = decodeText(encoded);
        expect(decoded).toBe('');
      });

      it('round-trips all ASCII printable characters', () => {
        const ascii = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
        const encoded = encodeText(ascii);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(ascii);
      });

      it('round-trips consecutive encoded chars', () => {
        const original = '%20%3F%2F%40';
        const encoded = encodeText(original);
        const decoded = decodeText(encoded);
        expect(decoded).toBe(original);
      });
    });

    describe('Exceptional Cases - Invalid round-trip', () => {
      it('decode fails for invalid encoding', () => {
        const invalid = '%ZZinvalid';
        const decoded = decodeText(invalid);
        expect(decoded).toBe(null);
      });
    });
  });

  describe('Cross-check encodeURIComponent behavior', () => {
    it('matches encodeURIComponent for alphanumeric strings', () => {
      const text = 'HelloWorld123';
      expect(encodeText(text)).toBe(encodeURIComponent(text));
    });

    it('matches encodeURIComponent for URL components', () => {
      const text = 'path/to/page?id=42&sort=name';
      expect(encodeText(text)).toBe(encodeURIComponent(text));
    });

    it('matches encodeURIComponent for special chars', () => {
      const text = 'a:b@c$d';
      expect(encodeText(text)).toBe(encodeURIComponent(text));
    });

    it('matches encodeURIComponent for Unicode', () => {
      const text = '你好世界';
      expect(encodeText(text)).toBe(encodeURIComponent(text));
    });
  });
});