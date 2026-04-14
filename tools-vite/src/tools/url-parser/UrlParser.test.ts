import { describe, it, expect } from 'vitest';
import { parseUrl } from './UrlParserFunctions.js';

describe('UrlParser', () => {
  describe('parseUrl', () => {
    describe('Happy Flow - Standard URLs', () => {
      it('parses https URL with all components', () => {
        const result = parseUrl('https://neo01.com:8080/path/to/page?param1=value1&param2=value2#section');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('https:');
        expect(result.host).toBe('neo01.com:8080');
        expect(result.hostname).toBe('neo01.com');
        expect(result.port).toBe('8080');
        expect(result.pathname).toBe('/path/to/page');
        expect(result.search).toBe('?param1=value1&param2=value2');
        expect(result.hash).toBe('#section');
        expect(result.origin).toBe('https://neo01.com:8080');
      });

      it('parses simple https URL', () => {
        const result = parseUrl('https://example.com');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('https:');
        expect(result.hostname).toBe('example.com');
        expect(result.port).toBe('');
        expect(result.pathname).toBe('/');
      });

      it('parses http URL', () => {
        const result = parseUrl('http://example.com');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('http:');
        expect(result.hostname).toBe('example.com');
      });

      it('parses URL with query parameters', () => {
        const result = parseUrl('https://example.com/search?q=test&lang=en');
        expect(result).not.toBe(null);
        expect(result.search).toBe('?q=test&lang=en');
        expect(result.searchParams).toHaveLength(2);
        expect(result.searchParams[0]).toEqual(['q', 'test']);
        expect(result.searchParams[1]).toEqual(['lang', 'en']);
      });

      it('parses URL with fragment', () => {
        const result = parseUrl('https://example.com/page#intro');
        expect(result).not.toBe(null);
        expect(result.hash).toBe('#intro');
      });

      it('parses URL with path', () => {
        const result = parseUrl('https://example.com/api/users/123');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/api/users/123');
      });

      it('parses URL with port 80 (returns empty string, default port)', () => {
        const result = parseUrl('http://example.com:80/path');
        expect(result).not.toBe(null);
        expect(result.port).toBe('');
      });

      it('parses URL with various ports', () => {
        const result = parseUrl('https://example.com:3000/api');
        expect(result).not.toBe(null);
        expect(result.port).toBe('3000');
      });
    });

    describe('Happy Flow - Query parameter parsing', () => {
      it('parses single query parameter', () => {
        const result = parseUrl('https://example.com?key=value');
        expect(result.searchParams).toHaveLength(1);
        expect(result.searchParams[0]).toEqual(['key', 'value']);
      });

      it('parses multiple query parameters', () => {
        const result = parseUrl('https://example.com?a=1&b=2&c=3');
        expect(result.searchParams).toHaveLength(3);
      });

      it('parses empty query string', () => {
        const result = parseUrl('https://example.com?');
        expect(result.searchParams).toHaveLength(0);
      });

      it('parses parameter with empty value', () => {
        const result = parseUrl('https://example.com?key=');
        expect(result.searchParams[0]).toEqual(['key', '']);
      });

      it('parses parameter with special characters in value', () => {
        const result = parseUrl('https://example.com?key=hello%20world');
        expect(result.searchParams[0]).toEqual(['key', 'hello world']);
      });

      it('parses duplicate parameters', () => {
        const result = parseUrl('https://example.com?key=value1&key=value2');
        expect(result.searchParams).toHaveLength(2);
        expect(result.searchParams[0]).toEqual(['key', 'value1']);
        expect(result.searchParams[1]).toEqual(['key', 'value2']);
      });
    });

    describe('Happy Flow - Different protocols', () => {
      it('parses ftp URL', () => {
        const result = parseUrl('ftp://files.example.com');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('ftp:');
      });

      it('parses file URL', () => {
        const result = parseUrl('file:///path/to/file.txt');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('file:');
      });

      it('parses mailto URL', () => {
        const result = parseUrl('mailto:user@example.com');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('mailto:');
      });

      it('parses ws WebSocket URL', () => {
        const result = parseUrl('ws://example.com/socket');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('ws:');
      });

      it('parses wss secure WebSocket URL', () => {
        const result = parseUrl('wss://example.com/socket');
        expect(result).not.toBe(null);
        expect(result.protocol).toBe('wss:');
      });
    });

    describe('Happy Flow - Edge length URLs', () => {
      it('parses URL with long path', () => {
        const result = parseUrl('https://example.com/' + 'a'.repeat(100));
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/' + 'a'.repeat(100));
      });

      it('parses URL with many query parameters', () => {
        const params = Array.from({ length: 20 }, (_, i) => `p${i}=v${i}`).join('&');
        const result = parseUrl(`https://example.com?${params}`);
        expect(result).not.toBe(null);
        expect(result.searchParams).toHaveLength(20);
      });

      it('parses URL with long query value', () => {
        const result = parseUrl('https://example.com?key=' + 'v'.repeat(100));
        expect(result).not.toBe(null);
        expect(result.searchParams[0][1]).toBe('v'.repeat(100));
      });
    });

    describe('Edge Cases - Unusual but valid URLs', () => {
      it('parses URL with IP address as hostname', () => {
        const result = parseUrl('http://192.168.1.1:8080/');
        expect(result).not.toBe(null);
        expect(result.hostname).toBe('192.168.1.1');
        expect(result.port).toBe('8080');
      });

      it('parses URL with localhost', () => {
        const result = parseUrl('http://localhost:3000/api');
        expect(result).not.toBe(null);
        expect(result.hostname).toBe('localhost');
        expect(result.port).toBe('3000');
      });

      it('parses URL with hyphen in hostname', () => {
        const result = parseUrl('https://my-site.example.com/');
        expect(result).not.toBe(null);
        expect(result.hostname).toBe('my-site.example.com');
      });

      it('parses URL with numbers in hostname', () => {
        const result = parseUrl('https://site123.example.com/');
        expect(result).not.toBe(null);
        expect(result.hostname).toBe('site123.example.com');
      });

      it('parses URL with underscore in hostname', () => {
        const result = parseUrl('https://my_site.example.com/');
        expect(result).not.toBe(null);
        expect(result.hostname).toBe('my_site.example.com');
      });

      it('parses URL with single-letter subdomain', () => {
        const result = parseUrl('https://a.e.example.com/');
        expect(result).not.toBe(null);
        expect(result.hostname).toBe('a.e.example.com');
      });

      it('parses URL with double subdomain', () => {
        const result = parseUrl('https://deep.sub.domain.example.com/');
        expect(result).not.toBe(null);
        expect(result.hostname).toBe('deep.sub.domain.example.com');
      });

      it('parses URL with empty path after domain', () => {
        const result = parseUrl('https://example.com');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/');
      });

      it('parses URL with just hash (empty hash)', () => {
        const result = parseUrl('https://example.com/page#');
        expect(result).not.toBe(null);
        expect(result.hash).toBe('');
      });

      it('parses URL with just query (empty search)', () => {
        const result = parseUrl('https://example.com/page?');
        expect(result).not.toBe(null);
        expect(result.search).toBe('');
      });
    });

    describe('Edge Cases - Special characters in URLs', () => {
it('parses URL with encoded characters in path (percent stays encoded)', () => {
        const result = parseUrl('https://example.com/path%2Fto%2Ffile');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/path%2Fto%2Ffile');
      });

      it('parses URL with encoded characters in query', () => {
        const result = parseUrl('https://example.com?q=hello%20world');
        expect(result).not.toBe(null);
        expect(result.searchParams[0][1]).toBe('hello world');
      });

      it('parses URL with plus in query value', () => {
        const result = parseUrl('https://example.com?q=a+b');
        expect(result).not.toBe(null);
        expect(result.searchParams[0][1]).toBe('a b');
      });

      it('parses URL with percent-encoded query value', () => {
        const result = parseUrl('https://example.com?q=100%25');
        expect(result).not.toBe(null);
        expect(result.searchParams[0][1]).toBe('100%');
      });

      it('parses URL with ampersand in query value', () => {
        const result = parseUrl('https://example.com?q=a%26b');
        expect(result).not.toBe(null);
        expect(result.searchParams[0][1]).toBe('a&b');
      });

      it('parses URL with equals in query value', () => {
        const result = parseUrl('https://example.com?q=a%3Db');
        expect(result).not.toBe(null);
        expect(result.searchParams[0][1]).toBe('a=b');
      });
    });

    describe('Edge Cases - Complex query strings', () => {
      it('parses query with array-style parameters', () => {
        const result = parseUrl('https://example.com?items[]=1&items[]=2&items[]=3');
        expect(result).not.toBe(null);
        expect(result.searchParams).toHaveLength(3);
        expect(result.searchParams[0]).toEqual(['items[]', '1']);
      });

      it('parses query with nested parameters', () => {
        const result = parseUrl('https://example.com?user[name]=John&user[email]=test@example.com');
        expect(result).not.toBe(null);
        expect(result.searchParams).toHaveLength(2);
      });

      it('parses query with boolean-like values', () => {
        const result = parseUrl('https://example.com?active=true&disabled=false');
        expect(result).not.toBe(null);
        expect(result.searchParams[0]).toEqual(['active', 'true']);
        expect(result.searchParams[1]).toEqual(['disabled', 'false']);
      });

      it('parses query with numeric values', () => {
        const result = parseUrl('https://example.com?count=42&price=19.99');
        expect(result).not.toBe(null);
        expect(result.searchParams[0]).toEqual(['count', '42']);
        expect(result.searchParams[1]).toEqual(['price', '19.99']);
      });

      it('parses query with empty value', () => {
        const result = parseUrl('https://example.com?name=&age=30');
        expect(result).not.toBe(null);
        expect(result.searchParams[0]).toEqual(['name', '']);
        expect(result.searchParams[1]).toEqual(['age', '30']);
      });

      it('parses query with plus signs preserved', () => {
        const result = parseUrl('https://example.com?q=c%2B%2B');
        expect(result).not.toBe(null);
        expect(result.searchParams[0][1]).toBe('c++');
      });
    });

    describe('Edge Cases - Fragment variations', () => {
      it('parses URL with fragment containing special chars', () => {
        const result = parseUrl('https://example.com/page#section-1');
        expect(result).not.toBe(null);
        expect(result.hash).toBe('#section-1');
      });

      it('parses URL with fragment containing slash', () => {
        const result = parseUrl('https://example.com/page#path/to/section');
        expect(result).not.toBe(null);
        expect(result.hash).toBe('#path/to/section');
      });

      it('parses URL with encoded fragment (keeps encoding)', () => {
        const result = parseUrl('https://example.com/page#%E4%B8%AD%E6%96%87');
        expect(result).not.toBe(null);
        expect(result.hash).toBe('#%E4%B8%AD%E6%96%87');
      });

      it('parses URL with query and fragment', () => {
        const result = parseUrl('https://example.com/page?q=test#section');
        expect(result).not.toBe(null);
        expect(result.search).toBe('?q=test');
        expect(result.hash).toBe('#section');
      });
    });

    describe('Edge Cases - Path variations', () => {
      it('parses URL with root path', () => {
        const result = parseUrl('https://example.com/');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/');
      });

      it('parses URL with multiple consecutive slashes', () => {
        const result = parseUrl('https://example.com///path');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('///path');
      });

      it('parses URL with trailing slash', () => {
        const result = parseUrl('https://example.com/path/');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/path/');
      });

      it('parses URL with encoded slash in path (keeps encoding)', () => {
        const result = parseUrl('https://example.com/path%2Fto%2Ffile');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/path%2Fto%2Ffile');
      });

      it('parses URL with dots in path normalized by browser', () => {
        const result = parseUrl('https://example.com/.././path/./file');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/path/file');
      });
    });

    describe('Exceptional Cases - Invalid URLs', () => {
      it('returns null for invalid URL format', () => {
        expect(parseUrl('not-a-valid-url')).toBe(null);
      });

      it('returns null for just domain without protocol', () => {
        expect(parseUrl('example.com')).toBe(null);
      });

      it('returns null for empty string', () => {
        expect(parseUrl('')).toBe(null);
      });

      it('returns null for whitespace only', () => {
        expect(parseUrl('   ')).toBe(null);
      });

      it('returns null for protocol without URL', () => {
        expect(parseUrl('http://')).toBe(null);
      });

      it('returns null for incomplete URL', () => {
        expect(parseUrl('https://')).toBe(null);
      });

      it('returns null for URL with only path', () => {
        expect(parseUrl('/path/to/page')).toBe(null);
      });

      it('returns null for URL with no protocol separator', () => {
        expect(parseUrl('https//example.com')).toBe(null);
      });

      it('returns null for URL with broken protocol', () => {
        expect(parseUrl('ht tp://example.com')).toBe(null);
      });
    });

    describe('Exceptional Cases - Edge invalid inputs', () => {
      it('returns null for URL with invalid port', () => {
        expect(parseUrl('https://example.com:abc/path')).toBe(null);
      });

      it('returns null for URL with negative port', () => {
        expect(parseUrl('https://example.com:-1/path')).toBe(null);
      });

      it('returns null for URL with port > 65535', () => {
        expect(parseUrl('https://example.com:99999/path')).toBe(null);
      });

      it('returns null for malformed IP address', () => {
        expect(parseUrl('http://192.168.1.256/')).toBe(null);
      });

      it('handles URL with tab characters (stripped by browser)', () => {
        const result = parseUrl('https://example.com\t/path');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/path');
      });

      it('handles URL with newline (stripped by browser)', () => {
        const result = parseUrl('https://example.com\n/path');
        expect(result).not.toBe(null);
        expect(result.pathname).toBe('/path');
      });
    });

    describe('Origin property behavior', () => {
      it('returns correct origin for https URL', () => {
        const result = parseUrl('https://example.com:8080/path');
        expect(result.origin).toBe('https://example.com:8080');
      });

      it('returns correct origin for http URL', () => {
        const result = parseUrl('http://example.com');
        expect(result.origin).toBe('http://example.com');
      });

      it('returns correct origin for localhost', () => {
        const result = parseUrl('http://localhost:3000');
        expect(result.origin).toBe('http://localhost:3000');
      });

it('returns null origin for file protocol (browser behavior)', () => {
        const result = parseUrl('file:///path/to/file');
        expect(result).not.toBe(null);
        expect(result.origin).toBe('null');
      });
    });
  });

  describe('URL component extraction', () => {
    it('extracts all standard components from full URL', () => {
      const result = parseUrl('https://user:pass@www.example.com:8080/path/to/file.html?query=value&foo=bar#hash');
      expect(result).not.toBe(null);
      expect(result.protocol).toBe('https:');
      expect(result.host).toBe('www.example.com:8080');
      expect(result.hostname).toBe('www.example.com');
      expect(result.port).toBe('8080');
      expect(result.pathname).toBe('/path/to/file.html');
      expect(result.search).toBe('?query=value&foo=bar');
      expect(result.hash).toBe('#hash');
    });

    it('handles URL with authentication info', () => {
      const result = parseUrl('https://user:password@example.com/');
      expect(result).not.toBe(null);
      expect(result.hostname).toBe('example.com');
    });

    it('handles URL without authentication info', () => {
      const result = parseUrl('https://example.com/');
      expect(result).not.toBe(null);
      expect(result.hostname).toBe('example.com');
    });
  });

  describe('SearchParams array format', () => {
    it('returns searchParams as array of key-value pairs', () => {
      const result = parseUrl('https://example.com?a=1&b=2');
      expect(Array.isArray(result.searchParams)).toBe(true);
      expect(result.searchParams[0]).toEqual(['a', '1']);
      expect(result.searchParams[1]).toEqual(['b', '2']);
    });

    it('returns empty array when no query params', () => {
      const result = parseUrl('https://example.com/path');
      expect(result.searchParams).toEqual([]);
    });

    it('handles query params with special characters', () => {
      const result = parseUrl('https://example.com?q=%E4%B8%AD%E6%96%87');
      expect(result.searchParams[0][0]).toBe('q');
      expect(result.searchParams[0][1]).toBe('中文');
    });
  });
});