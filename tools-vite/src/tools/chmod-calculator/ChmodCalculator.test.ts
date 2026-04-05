import { describe, it, expect } from 'vitest';
import { calculateOctal, calculateSymbolic, calculateUmask } from './ChmodCalculator';

describe('ChmodCalculator', () => {

  describe('calculateOctal', () => {
    it('calculates octal for read-write-execute (7)', () => {
      const perms = {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        others: { read: true, write: true, execute: true }
      };
      expect(calculateOctal(perms)).toBe('777');
    });

    it('calculates octal for read-only (4)', () => {
      const perms = {
        owner: { read: true, write: false, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false }
      };
      expect(calculateOctal(perms)).toBe('444');
    });

    it('calculates octal for 644 (owner rw, group r, others r)', () => {
      const perms = {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false }
      };
      expect(calculateOctal(perms)).toBe('644');
    });

    it('calculates octal for 755 (owner rwx, group rx, others rx)', () => {
      const perms = {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true }
      };
      expect(calculateOctal(perms)).toBe('755');
    });

    it('calculates octal for 600 (owner rw, group none, others none)', () => {
      const perms = {
        owner: { read: true, write: true, execute: false },
        group: { read: false, write: false, execute: false },
        others: { read: false, write: false, execute: false }
      };
      expect(calculateOctal(perms)).toBe('600');
    });

    it('calculates octal for 000 (no permissions)', () => {
      const perms = {
        owner: { read: false, write: false, execute: false },
        group: { read: false, write: false, execute: false },
        others: { read: false, write: false, execute: false }
      };
      expect(calculateOctal(perms)).toBe('000');
    });

    it('calculates octal for 751 (owner rwx, group rx, others x)', () => {
      const perms = {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: false, write: false, execute: true }
      };
      expect(calculateOctal(perms)).toBe('751');
    });
  });

  describe('calculateSymbolic', () => {
    it('calculates symbolic for 777', () => {
      const perms = {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        others: { read: true, write: true, execute: true }
      };
      expect(calculateSymbolic(perms)).toBe('rwxrwxrwx');
    });

    it('calculates symbolic for 644', () => {
      const perms = {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false }
      };
      expect(calculateSymbolic(perms)).toBe('rw-r--r--');
    });

    it('calculates symbolic for 600', () => {
      const perms = {
        owner: { read: true, write: true, execute: false },
        group: { read: false, write: false, execute: false },
        others: { read: false, write: false, execute: false }
      };
      expect(calculateSymbolic(perms)).toBe('rw-------');
    });

    it('calculates symbolic for 000', () => {
      const perms = {
        owner: { read: false, write: false, execute: false },
        group: { read: false, write: false, execute: false },
        others: { read: false, write: false, execute: false }
      };
      expect(calculateSymbolic(perms)).toBe('---------');
    });
  });

  describe('calculateUmask', () => {
    it('calculates umask for 777', () => {
      expect(calculateUmask('777')).toBe('000');
    });

    it('calculates umask for 644', () => {
      expect(calculateUmask('644')).toBe('133');
    });

    it('calculates umask for 755', () => {
      expect(calculateUmask('755')).toBe('022');
    });

    it('calculates umask for 600', () => {
      expect(calculateUmask('600')).toBe('177');
    });

    it('calculates umask for 000', () => {
      expect(calculateUmask('000')).toBe('777');
    });
  });

});