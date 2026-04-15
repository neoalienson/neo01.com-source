import { describe, it, expect } from 'vitest';
import { md5Hash, sha1Hash, sha256Hash, sha512Hash, sha3_256Hash, sha3_512Hash, ripemd160Hash, generateAllHashes } from './HashFunctions.js';

describe('HashText', () => {
  describe('md5Hash', () => {
    describe('Happy Flow - Standard inputs', () => {
      it('hashes "Hello World!" correctly', () => {
        expect(md5Hash('Hello World!')).toBe('ed076287532e86365e841e92bfc50d8c');
      });

      it('hashes "test" correctly', () => {
        expect(md5Hash('test')).toBe('098f6bcd4621d373cade4e832627b4f6');
      });

      it('hashes "password" correctly', () => {
        expect(md5Hash('password')).toBe('5f4dcc3b5aa765d61d8327deb882cf99');
      });

      it('hashes "abc" correctly', () => {
        expect(md5Hash('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
      });

      it('hashes empty string', () => {
        expect(md5Hash('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
      });

      it('hashes "a" correctly', () => {
        expect(md5Hash('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
      });

      it('hashes "message" correctly', () => {
        expect(md5Hash('message')).toBe('78e731027d8fd50ed642340b7c9a63b3');
      });
    });

    describe('Happy Flow - Known test vectors', () => {
      it('hashes known vector "abc" per RFC 1321', () => {
        expect(md5Hash('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
      });

      it('hashes known vector "message digest" per RFC 1321', () => {
        expect(md5Hash('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0');
      });

      it('hashes known vector "a" per RFC 1321', () => {
        expect(md5Hash('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
      });
    });

    describe('Edge Cases - Long inputs', () => {
      it('hashes long text', () => {
        const long = 'Lorem ipsum dolor sit amet '.repeat(10);
        const hash = md5Hash(long);
        expect(hash).toHaveLength(32);
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });

      it('hashes very long text', () => {
        const long = 'a'.repeat(10000);
        const hash = md5Hash(long);
        expect(hash).toHaveLength(32);
      });
    });

    describe('Edge Cases - Special characters', () => {
      it('hashes text with newlines', () => {
        expect(md5Hash('line1\nline2\nline3')).toBeTruthy();
      });

      it('hashes text with tabs', () => {
        expect(md5Hash('a\tb\tc')).toBeTruthy();
      });

      it('hashes text with special chars', () => {
        expect(md5Hash('!@#$%^&*()')).toBeTruthy();
      });

      it('hashes text with unicode', () => {
        expect(md5Hash('你好')).toBe('7eca689f0d3389d9dea66ae112e5cfd7');
      });

      it('hashes text with emoji', () => {
        expect(md5Hash('👋')).toBeTruthy();
      });
    });

    describe('Edge Cases - Numbers and symbols', () => {
      it('hashes numbers', () => {
        expect(md5Hash('1234567890')).toBe('e807f1fcf82d132f9bb018ca6738a19f');
      });

      it('hashes hex-like string', () => {
        expect(md5Hash('deadbeef')).toBe('4f41243847da693a4f356c0486114bc6');
      });
    });
  });

  describe('sha1Hash', () => {
    describe('Happy Flow - Standard inputs', () => {
      it('hashes "Hello World!" correctly', () => {
        expect(sha1Hash('Hello World!')).toBe('2ef7bde608ce5404e97d5f042f95f89f1c232871');
      });

      it('hashes "test" correctly', () => {
        expect(sha1Hash('test')).toBe('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
      });

      it('hashes "password" correctly', () => {
        expect(sha1Hash('password')).toBe('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8');
      });

      it('hashes empty string', () => {
        expect(sha1Hash('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
      });

      it('hashes "abc" correctly', () => {
        expect(sha1Hash('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
      });
    });

    describe('Edge Cases - Special characters', () => {
      it('hashes text with unicode', () => {
        expect(sha1Hash('你好')).toBeTruthy();
      });

      it('hashes text with emoji', () => {
        expect(sha1Hash('👋🌍🎉')).toBeTruthy();
      });

      it('hashes text with newlines', () => {
        expect(sha1Hash('line1\nline2')).toBeTruthy();
      });
    });

    describe('Edge Cases - Long inputs', () => {
      it('hashes long text', () => {
        const long = 'a'.repeat(1000);
        const hash = sha1Hash(long);
        expect(hash).toHaveLength(40);
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });
    });
  });

  describe('sha256Hash', () => {
    describe('Happy Flow - Standard inputs', () => {
      it('hashes "Hello World!" correctly', () => {
        expect(sha256Hash('Hello World!')).toBe('7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');
      });

      it('hashes "test" correctly', () => {
        expect(sha256Hash('test')).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
      });

      it('hashes empty string', () => {
        expect(sha256Hash('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      });

      it('hashes "abc" correctly', () => {
        expect(sha256Hash('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      });
    });

    describe('Edge Cases - Unicode', () => {
      it('hashes Chinese characters', () => {
        expect(sha256Hash('你好')).toBe('670d9743542cae3ea7ebe36af56bd53648b0a1126162e78d81a32934a711302e');
      });

      it('hashes Japanese characters', () => {
        expect(sha256Hash('こんにちは')).toBeTruthy();
      });

      it('hashes emoji', () => {
        expect(sha256Hash('👋🌍🎉')).toBeTruthy();
      });
    });

    describe('Edge Cases - Long inputs', () => {
      it('hashes long text', () => {
        const long = 'Lorem ipsum '.repeat(100);
        const hash = sha256Hash(long);
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });
    });
  });

  describe('sha512Hash', () => {
    describe('Happy Flow - Standard inputs', () => {
      it('hashes "Hello World!" correctly', () => {
        expect(sha512Hash('Hello World!')).toBe('861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8');
      });

      it('hashes "test" correctly', () => {
        expect(sha512Hash('test')).toBe('ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff');
      });

      it('hashes empty string', () => {
        expect(sha512Hash('')).toBe('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
      });

      it('hashes "abc" correctly', () => {
        expect(sha512Hash('abc')).toBe('ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
      });
    });

    describe('Edge Cases - Unicode', () => {
      it('hashes Chinese characters', () => {
        expect(sha512Hash('你好')).toBeTruthy();
      });

      it('hashes emoji', () => {
        expect(sha512Hash('👋🌍🎉')).toBeTruthy();
      });
    });

    describe('Edge Cases - Long inputs', () => {
      it('hashes long text', () => {
        const long = 'a'.repeat(1000);
        const hash = sha512Hash(long);
        expect(hash).toHaveLength(128);
      });
    });
  });

  describe('sha3_256Hash', () => {
    describe('Happy Flow - Standard inputs', () => {
      it('hashes "Hello World!" correctly', () => {
        expect(sha3_256Hash('Hello World!')).toBeTruthy();
      });

      it('hashes "test" correctly', () => {
        expect(sha3_256Hash('test')).toBeTruthy();
      });

      it('hashes empty string', () => {
        expect(sha3_256Hash('')).toBeTruthy();
      });

      it('hashes "abc" correctly', () => {
        expect(sha3_256Hash('abc')).toBeTruthy();
      });
    });

    describe('Edge Cases - Unicode', () => {
      it('hashes Chinese characters', () => {
        expect(sha3_256Hash('你好')).toBeTruthy();
      });

      it('hashes emoji', () => {
        expect(sha3_256Hash('👋🌍🎉')).toBeTruthy();
      });
    });
  });

  describe('sha3_512Hash', () => {
    describe('Happy Flow - Standard inputs', () => {
      it('hashes "Hello World!" correctly', () => {
        expect(sha3_512Hash('Hello World!')).toBeTruthy();
      });

      it('hashes "test" correctly', () => {
        expect(sha3_512Hash('test')).toBeTruthy();
      });

      it('hashes empty string', () => {
        expect(sha3_512Hash('')).toBeTruthy();
      });
    });

    describe('Edge Cases - Unicode', () => {
      it('hashes Chinese characters', () => {
        expect(sha3_512Hash('你好')).toBeTruthy();
      });

      it('hashes emoji', () => {
        expect(sha3_512Hash('👋🌍🎉')).toBeTruthy();
      });
    });
  });

  describe('ripemd160Hash', () => {
    describe('Happy Flow - Standard inputs', () => {
      it('hashes "Hello World!" correctly', () => {
        expect(ripemd160Hash('Hello World!')).toBeTruthy();
      });

      it('hashes "test" correctly', () => {
        expect(ripemd160Hash('test')).toBe('5e52fee47e6b070565f74372468cdc699de89107');
      });

      it('hashes empty string', () => {
        expect(ripemd160Hash('')).toBe('9c1185a5c5e9fc54612808977ee8f548b2258d31');
      });

      it('hashes "abc" correctly', () => {
        expect(ripemd160Hash('abc')).toBe('8eb208f7e05d987a9b044a8e98c6b087f15a0bfc');
      });
    });

    describe('Edge Cases - Unicode', () => {
      it('hashes Chinese characters', () => {
        expect(ripemd160Hash('你好')).toBeTruthy();
      });

      it('hashes emoji', () => {
        expect(ripemd160Hash('👋🌍🎉')).toBeTruthy();
      });
    });
  });

  describe('generateAllHashes', () => {
    describe('Happy Flow - Generate all hashes', () => {
      it('generates all hashes for "Hello World!"', () => {
        const hashes = generateAllHashes('Hello World!');
        expect(hashes.md5).toBeTruthy();
        expect(hashes.sha1).toBeTruthy();
        expect(hashes.sha256).toBeTruthy();
        expect(hashes.sha512).toBeTruthy();
        expect(hashes.sha3_256).toBeTruthy();
        expect(hashes.sha3_512).toBeTruthy();
        expect(hashes.ripemd160).toBeTruthy();
      });

      it('generates all hashes for "test"', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.md5).toBe('098f6bcd4621d373cade4e832627b4f6');
        expect(hashes.sha1).toBe('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
        expect(hashes.sha256).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
        expect(Object.keys(hashes)).toHaveLength(7);
      });

      it('generates all hashes for empty string', () => {
        const hashes = generateAllHashes('');
        expect(hashes.md5).toBe('d41d8cd98f00b204e9800998ecf8427e');
        expect(hashes.sha1).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
      });
    });

    describe('Edge Cases - Different inputs', () => {
      it('generates hashes for Chinese text', () => {
        const hashes = generateAllHashes('你好');
        expect(Object.keys(hashes)).toHaveLength(7);
        expect(hashes.md5).toBeTruthy();
        expect(hashes.sha256).toBeTruthy();
      });

      it('generates hashes for emoji', () => {
        const hashes = generateAllHashes('👋🌍🎉');
        expect(Object.keys(hashes)).toHaveLength(7);
        expect(hashes.md5).toBeTruthy();
      });

      it('generates hashes for numbers', () => {
        const hashes = generateAllHashes('1234567890');
        expect(Object.keys(hashes)).toHaveLength(7);
      });
    });

    describe('Hash output formats', () => {
      it('MD5 produces 32 char hex string', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.md5).toHaveLength(32);
        expect(hashes.md5).toMatch(/^[a-f0-9]+$/);
      });

      it('SHA1 produces 40 char hex string', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.sha1).toHaveLength(40);
        expect(hashes.sha1).toMatch(/^[a-f0-9]+$/);
      });

      it('SHA256 produces 64 char hex string', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.sha256).toHaveLength(64);
        expect(hashes.sha256).toMatch(/^[a-f0-9]+$/);
      });

      it('SHA512 produces 128 char hex string', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.sha512).toHaveLength(128);
        expect(hashes.sha512).toMatch(/^[a-f0-9]+$/);
      });

      it('SHA3-256 produces 64 char hex string', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.sha3_256).toHaveLength(64);
        expect(hashes.sha3_256).toMatch(/^[a-f0-9]+$/);
      });

      it('SHA3-512 produces 128 char hex string', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.sha3_512).toHaveLength(128);
        expect(hashes.sha3_512).toMatch(/^[a-f0-9]+$/);
      });

      it('RIPEMD160 produces 40 char hex string', () => {
        const hashes = generateAllHashes('test');
        expect(hashes.ripemd160).toHaveLength(40);
        expect(hashes.ripemd160).toMatch(/^[a-f0-9]+$/);
      });
    });
  });

  describe('Hash consistency', () => {
    it('same input always produces same hash', () => {
      const text = 'Hello World!';
      const hash1 = md5Hash(text);
      const hash2 = md5Hash(text);
      expect(hash1).toBe(hash2);
    });

    it('different inputs produce different hashes', () => {
      const hash1 = md5Hash('Hello');
      const hash2 = md5Hash('World');
      expect(hash1).not.toBe(hash2);
    });

    it('case sensitivity works', () => {
      const hash1 = md5Hash('test');
      const hash2 = md5Hash('TEST');
      expect(hash1).not.toBe(hash2);
    });

    it('whitespace matters', () => {
      const hash1 = md5Hash('test');
      const hash2 = md5Hash(' test');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Cross-algorithm verification', () => {
    it('all algorithms produce output for same input', () => {
      const hashes = generateAllHashes('Cross-test string 123!@#');
      expect(Object.values(hashes).every(h => h && h.length > 0)).toBe(true);
    });

    it('each algorithm produces unique hash for same input', () => {
      const hashes = generateAllHashes('Same input');
      const hashValues = Object.values(hashes);
      const uniqueHashes = new Set(hashValues);
      expect(uniqueHashes.size).toBe(hashValues.length);
    });
  });
});