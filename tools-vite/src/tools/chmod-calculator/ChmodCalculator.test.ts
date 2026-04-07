import { describe, it, expect } from 'vitest';
import { calculateOctal, calculateSymbolic, calculateUmask } from './ChmodCalculator';

describe('ChmodCalculator', () => {
  describe('calculateOctal', () => {
    describe('Happy Flow - Standard permission combinations', () => {
      it('calculates octal for 777 (rwxrwxrwx)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: true, execute: true },
          others: { read: true, write: true, execute: true }
        };
        expect(calculateOctal(perms)).toBe('777');
      });

      it('calculates octal for 644 (rw-r--r--)', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: true, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('644');
      });

      it('calculates octal for 755 (rwxr-xr-x)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateOctal(perms)).toBe('755');
      });

      it('calculates octal for 600 (rw-------)', () => {
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

      it('calculates octal for 444 (r--r--r--)', () => {
        const perms = {
          owner: { read: true, write: false, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: true, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('444');
      });

      it('calculates octal for 666 (rw-rw-rw-)', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: true, execute: false },
          others: { read: true, write: true, execute: false }
        };
        expect(calculateOctal(perms)).toBe('666');
      });

      it('calculates octal for 751 (rwxr-x--x)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateOctal(perms)).toBe('751');
      });

      it('calculates octal for 700 (rwx------)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('700');
      });

      it('calculates octal for 555 (r-xr-xr-x)', () => {
        const perms = {
          owner: { read: true, write: false, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateOctal(perms)).toBe('555');
      });

      it('calculates octal for 311 (--x-wx--x)', () => {
        const perms = {
          owner: { read: false, write: false, execute: true },
          group: { read: false, write: true, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateOctal(perms)).toBe('131');
      });

      it('calculates octal for 366 (wxrw-rw-)', () => {
        const perms = {
          owner: { read: false, write: true, execute: true },
          group: { read: true, write: true, execute: false },
          others: { read: true, write: true, execute: false }
        };
        expect(calculateOctal(perms)).toBe('366');
      });
    });

    describe('Edge Cases - Single permission bits', () => {
      it('calculates octal for read-only per group (444)', () => {
        const perms = {
          owner: { read: true, write: false, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: true, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('444');
      });

      it('calculates octal for write-only per group (222)', () => {
        const perms = {
          owner: { read: false, write: true, execute: false },
          group: { read: false, write: true, execute: false },
          others: { read: false, write: true, execute: false }
        };
        expect(calculateOctal(perms)).toBe('222');
      });

      it('calculates octal for execute-only per group (111)', () => {
        const perms = {
          owner: { read: false, write: false, execute: true },
          group: { read: false, write: false, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateOctal(perms)).toBe('111');
      });

      it('calculates octal for read+write (6)', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('600');
      });

      it('calculates octal for read+execute (5)', () => {
        const perms = {
          owner: { read: true, write: false, execute: true },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('500');
      });

      it('calculates octal for write+execute (3)', () => {
        const perms = {
          owner: { read: false, write: true, execute: true },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('300');
      });
    });

    describe('Edge Cases - Mixed owner/group/others', () => {
      it('calculates octal for owner has all, others have none', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('700');
      });

      it('calculates octal for owner rwx, group rx, others x', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateOctal(perms)).toBe('751');
      });

      it('calculates octal for 4755 (setuid)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateOctal(perms)).toBe('755');
      });
    });

    describe('Exceptional Cases - Tricky inputs', () => {
      it('returns string starting with 0 for low values', () => {
        const perms = {
          owner: { read: false, write: false, execute: true },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('100');
      });

      it('handles all false permissions', () => {
        const perms = {
          owner: { read: false, write: false, execute: false },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateOctal(perms)).toBe('000');
      });

      it('handles all true permissions', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: true, execute: true },
          others: { read: true, write: true, execute: true }
        };
        expect(calculateOctal(perms)).toBe('777');
      });
    });
  });

  describe('calculateSymbolic', () => {
    describe('Happy Flow - Standard permission combinations', () => {
      it('calculates symbolic for 777 (rwxrwxrwx)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: true, execute: true },
          others: { read: true, write: true, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('rwxrwxrwx');
      });

      it('calculates symbolic for 644 (rw-r--r--)', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: true, write: false, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('rw-r--r--');
      });

      it('calculates symbolic for 755 (rwxr-xr-x)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('rwxr-xr-x');
      });

      it('calculates symbolic for 600 (rw-------)', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('rw-------');
      });

      it('calculates symbolic for 000 (no permissions)', () => {
        const perms = {
          owner: { read: false, write: false, execute: false },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('---------');
      });

      it('calculates symbolic for 700 (rwx------)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('rwx------');
      });

      it('calculates symbolic for 666 (rw-rw-rw-)', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: true, execute: false },
          others: { read: true, write: true, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('rw-rw-rw-');
      });

      it('calculates symbolic for 555 (r-xr-xr-x)', () => {
        const perms = {
          owner: { read: true, write: false, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('r-xr-xr-x');
      });

      it('calculates symbolic for 751 (rwxr-x--x)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('rwxr-x--x');
      });

      it('calculates symbolic for 311 (--x-wx--x)', () => {
        const perms = {
          owner: { read: false, write: false, execute: true },
          group: { read: false, write: true, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('--x-wx--x');
      });

      it('calculates symbolic for 367 (wxrw-rw-)', () => {
        const perms = {
          owner: { read: false, write: true, execute: true },
          group: { read: true, write: true, execute: false },
          others: { read: true, write: true, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('-wxrw-rw-');
      });

      it('calculates symbolic for 4755 (setuid - shows as rwsr-xr-x)', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('rwxr-xr-x');
      });
    });

    describe('Edge Cases - Single permission bits', () => {
      it('calculates symbolic for read-only (r--r--r--)', () => {
        const perms = {
          owner: { read: true, write: false, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: true, write: false, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('r--r--r--');
      });

      it('calculates symbolic for write-only (-w--w--w-)', () => {
        const perms = {
          owner: { read: false, write: true, execute: false },
          group: { read: false, write: true, execute: false },
          others: { read: false, write: true, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('-w--w--w-');
      });

      it('calculates symbolic for execute-only (--x--x--x)', () => {
        const perms = {
          owner: { read: false, write: false, execute: true },
          group: { read: false, write: false, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('--x--x--x');
      });

      it('calculates symbolic for read+write (rw-rw-rw-)', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: true, execute: false },
          others: { read: true, write: true, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('rw-rw-rw-');
      });

      it('calculates symbolic for read+execute (r-xr-xr-x)', () => {
        const perms = {
          owner: { read: true, write: false, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('r-xr-xr-x');
      });

      it('calculates symbolic for write+execute (-wx-wx-wx)', () => {
        const perms = {
          owner: { read: false, write: true, execute: true },
          group: { read: false, write: true, execute: true },
          others: { read: false, write: true, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('-wx-wx-wx');
      });
    });

    describe('Edge Cases - Asymmetric permissions', () => {
      it('calculates symbolic for owner rwx, group r-x, others --x', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: true, write: false, execute: true },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('rwxr-x--x');
      });

      it('calculates symbolic for owner rw, group r, others none', () => {
        const perms = {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: false, write: false, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('rw-r-----');
      });

      it('calculates symbolic for owner rwx, group none, others r-x', () => {
        const perms = {
          owner: { read: true, write: true, execute: true },
          group: { read: false, write: false, execute: false },
          others: { read: true, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('rwx---r-x');
      });
    });

    describe('Exceptional Cases - All combinations of single bits', () => {
      it('calculates symbolic for owner=r, group=w, others=x', () => {
        const perms = {
          owner: { read: true, write: false, execute: false },
          group: { read: false, write: true, execute: false },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('r---w---x');
      });

      it('calculates symbolic for owner=w, group=r, others=x', () => {
        const perms = {
          owner: { read: false, write: true, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: false, write: false, execute: true }
        };
        expect(calculateSymbolic(perms)).toBe('-w-r----x');
      });

      it('calculates symbolic for owner=x, group=w, others=r', () => {
        const perms = {
          owner: { read: false, write: false, execute: true },
          group: { read: false, write: true, execute: false },
          others: { read: true, write: false, execute: false }
        };
        expect(calculateSymbolic(perms)).toBe('--x-w-r--');
      });
    });
  });

  describe('calculateUmask', () => {
    describe('Happy Flow - Standard umask calculations', () => {
      it('calculates umask for 777 (expected 000)', () => {
        expect(calculateUmask('777')).toBe('000');
      });

      it('calculates umask for 644 (expected 133)', () => {
        expect(calculateUmask('644')).toBe('133');
      });

      it('calculates umask for 755 (expected 022)', () => {
        expect(calculateUmask('755')).toBe('022');
      });

      it('calculates umask for 600 (expected 177)', () => {
        expect(calculateUmask('600')).toBe('177');
      });

      it('calculates umask for 000 (expected 777)', () => {
        expect(calculateUmask('000')).toBe('777');
      });

      it('calculates umask for 666 (expected 111)', () => {
        expect(calculateUmask('666')).toBe('111');
      });

      it('calculates umask for 555 (expected 222)', () => {
        expect(calculateUmask('555')).toBe('222');
      });

      it('calculates umask for 444 (expected 333)', () => {
        expect(calculateUmask('444')).toBe('333');
      });

      it('calculates umask for 700 (expected 077)', () => {
        expect(calculateUmask('700')).toBe('077');
      });

      it('calculates umask for 751 (expected 026)', () => {
        expect(calculateUmask('751')).toBe('026');
      });

      it('calculates umask for 311 (expected 466)', () => {
        expect(calculateUmask('311')).toBe('466');
      });

      it('calculates umask for 277 (expected 500)', () => {
        expect(calculateUmask('277')).toBe('500');
      });
    });

    describe('Edge Cases - Boundary values', () => {
      it('calculates umask for 000 (max umask)', () => {
        expect(calculateUmask('000')).toBe('777');
      });

      it('calculates umask for 777 (min umask)', () => {
        expect(calculateUmask('777')).toBe('000');
      });

      it('calculates umask for 111', () => {
        expect(calculateUmask('111')).toBe('666');
      });

      it('calculates umask for 222', () => {
        expect(calculateUmask('222')).toBe('555');
      });

      it('calculates umask for 333', () => {
        expect(calculateUmask('333')).toBe('444');
      });

      it('calculates umask for 444', () => {
        expect(calculateUmask('444')).toBe('333');
      });

      it('calculates umask for 555', () => {
        expect(calculateUmask('555')).toBe('222');
      });

      it('calculates umask for 666', () => {
        expect(calculateUmask('666')).toBe('111');
      });
    });

    describe('Edge Cases - Single digit input', () => {
      it('calculates umask for single digit 7', () => {
        expect(calculateUmask('7')).toBe('0');
      });

      it('calculates umask for single digit 6', () => {
        expect(calculateUmask('6')).toBe('1');
      });

      it('calculates umask for single digit 5', () => {
        expect(calculateUmask('5')).toBe('2');
      });

      it('calculates umask for single digit 4', () => {
        expect(calculateUmask('4')).toBe('3');
      });

      it('calculates umask for single digit 3', () => {
        expect(calculateUmask('3')).toBe('4');
      });

      it('calculates umask for single digit 2', () => {
        expect(calculateUmask('2')).toBe('5');
      });

      it('calculates umask for single digit 1', () => {
        expect(calculateUmask('1')).toBe('6');
      });

      it('calculates umask for single digit 0', () => {
        expect(calculateUmask('0')).toBe('7');
      });
    });

    describe('Edge Cases - Two digit input', () => {
      it('calculates umask for two digits 77', () => {
        expect(calculateUmask('77')).toBe('00');
      });

      it('calculates umask for two digits 66', () => {
        expect(calculateUmask('66')).toBe('11');
      });

      it('calculates umask for two digits 55', () => {
        expect(calculateUmask('55')).toBe('22');
      });

      it('calculates umask for two digits 44', () => {
        expect(calculateUmask('44')).toBe('33');
      });

      it('calculates umask for two digits 76', () => {
        expect(calculateUmask('76')).toBe('01');
      });

      it('calculates umask for two digits 63', () => {
        expect(calculateUmask('63')).toBe('14');
      });
    });

    describe('Exceptional Cases - Edge behavior', () => {
      it('handles all zeros in umask', () => {
        expect(calculateUmask('000')).toBe('777');
      });

      it('handles all sevens in umask', () => {
        expect(calculateUmask('777')).toBe('000');
      });

      it('handles alternating pattern 707', () => {
        expect(calculateUmask('707')).toBe('070');
      });

      it('handles alternating pattern 525', () => {
        expect(calculateUmask('525')).toBe('252');
      });

      it('handles pattern 135 (odd positions)', () => {
        expect(calculateUmask('135')).toBe('642');
      });

      it('handles pattern 246 (even positions)', () => {
        expect(calculateUmask('246')).toBe('531');
      });
    });
  });
});