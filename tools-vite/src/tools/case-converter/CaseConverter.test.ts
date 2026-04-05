import { describe, it, expect } from 'vitest';
import {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toDotCase,
  toPathCase,
  toTitleCase,
  toSentenceCase,
  toUpperCase,
  toLowerCase,
  toAlternatingCase,
  toInverseCase,
  toPascalSnakeCase,
  toPascalKebabCase,
} from './CaseConverter';

describe('CaseConverter', () => {

  describe('Edge Cases', () => {
    describe('toCamelCase', () => {
      it('converts empty string to empty string', () => {
        expect(toCamelCase('')).toBe('');
      });

      it('converts single character', () => {
        expect(toCamelCase('a')).toBe('a');
        expect(toCamelCase('A')).toBe('a');
      });

      it('preserves numbers in input', () => {
        expect(toCamelCase('hello123world')).toBe('hello123world');
      });

      it('handles multiple spaces by treating each as word boundary', () => {
        expect(toCamelCase('hello    world')).toBe('helloWorld');
      });

      it('handles leading and trailing spaces', () => {
        expect(toCamelCase('  hello  ')).toBe('hello');
      });

      it('handles consecutive uppercase (XMLParser)', () => {
        expect(toCamelCase('XMLParser')).toBe('xmlParser');
      });

      it('handles hyphens as word boundary', () => {
        expect(toCamelCase('hello-world')).toBe('helloWorld');
      });
    });

    describe('toPascalCase', () => {
      it('converts empty string to empty string', () => {
        expect(toPascalCase('')).toBe('');
      });

      it('converts single character to uppercase', () => {
        expect(toPascalCase('a')).toBe('A');
        expect(toPascalCase('A')).toBe('A');
      });

      it('preserves numbers in input', () => {
        expect(toPascalCase('hello123world')).toBe('Hello123world');
      });

      it('handles multiple spaces', () => {
        expect(toPascalCase('hello    world')).toBe('HelloWorld');
      });

      it('handles consecutive uppercase', () => {
        expect(toPascalCase('XMLParser')).toBe('XmlParser');
      });

      it('handles hyphens', () => {
        expect(toPascalCase('hello-world')).toBe('HelloWorld');
      });
    });

    describe('toSnakeCase', () => {
      it('converts empty string to empty string', () => {
        expect(toSnakeCase('')).toBe('');
      });

      it('converts single character', () => {
        expect(toSnakeCase('a')).toBe('a');
        expect(toSnakeCase('A')).toBe('a');
      });

      it('preserves numbers', () => {
        expect(toSnakeCase('hello123world')).toBe('hello123world');
      });

      it('handles consecutive uppercase', () => {
        expect(toSnakeCase('XMLParser')).toBe('xml_parser');
      });

      it('handles hyphens as word boundary', () => {
        expect(toSnakeCase('hello-world')).toBe('hello_world');
      });

      it('handles multiple spaces', () => {
        expect(toSnakeCase('hello    world')).toBe('hello_world');
      });
    });

    describe('toKebabCase', () => {
      it('converts empty string to empty string', () => {
        expect(toKebabCase('')).toBe('');
      });

      it('handles consecutive uppercase', () => {
        expect(toKebabCase('XMLParser')).toBe('xml-parser');
      });

      it('handles hyphens in input', () => {
        expect(toKebabCase('hello-world')).toBe('hello-world');
      });

      it('handles multiple spaces', () => {
        expect(toKebabCase('hello    world')).toBe('hello-world');
      });
    });

    describe('toConstantCase', () => {
      it('converts empty string to empty string', () => {
        expect(toConstantCase('')).toBe('');
      });

      it('handles consecutive uppercase', () => {
        expect(toConstantCase('XMLParser')).toBe('XML_PARSER');
      });

      it('handles hyphens', () => {
        expect(toConstantCase('hello-world')).toBe('HELLO_WORLD');
      });
    });

    describe('toDotCase', () => {
      it('converts empty string to empty string', () => {
        expect(toDotCase('')).toBe('');
      });

      it('handles consecutive uppercase', () => {
        expect(toDotCase('XMLParser')).toBe('xml.parser');
      });

      it('handles hyphens', () => {
        expect(toDotCase('hello-world')).toBe('hello.world');
      });

      it('handles multiple spaces', () => {
        expect(toDotCase('hello    world')).toBe('hello.world');
      });
    });

    describe('toPathCase', () => {
      it('converts empty string to empty string', () => {
        expect(toPathCase('')).toBe('');
      });

      it('handles consecutive uppercase', () => {
        expect(toPathCase('XMLParser')).toBe('xml/parser');
      });

      it('handles hyphens', () => {
        expect(toPathCase('hello-world')).toBe('hello/world');
      });
    });

    describe('toTitleCase', () => {
      it('converts empty string to empty string', () => {
        expect(toTitleCase('')).toBe('');
      });

      it('handles single character', () => {
        expect(toTitleCase('a')).toBe('A');
        expect(toTitleCase('A')).toBe('A');
      });

      it('handles all uppercase', () => {
        expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
      });

      it('handles multiple spaces', () => {
        expect(toTitleCase('hello    world')).toBe('Hello    World');
      });

      it('handles leading/trailing spaces', () => {
        expect(toTitleCase('  hello  ')).toBe('  Hello  ');
      });
    });

    describe('toSentenceCase', () => {
      it('converts empty string to empty string', () => {
        expect(toSentenceCase('')).toBe('');
      });

      it('handles single character', () => {
        expect(toSentenceCase('a')).toBe('A');
        expect(toSentenceCase('A')).toBe('A');
      });

      it('converts all uppercase to sentence case', () => {
        expect(toSentenceCase('HELLO WORLD')).toBe('Hello world');
      });

      it('handles multiple spaces', () => {
        expect(toSentenceCase('hello    world')).toBe('Hello    world');
      });
    });

    describe('toUpperCase', () => {
      it('converts empty string to empty string', () => {
        expect(toUpperCase('')).toBe('');
      });

      it('handles single character', () => {
        expect(toUpperCase('a')).toBe('A');
        expect(toUpperCase('A')).toBe('A');
      });

      it('handles numbers', () => {
        expect(toUpperCase('hello123')).toBe('HELLO123');
      });

      it('handles multiple spaces', () => {
        expect(toUpperCase('hello    world')).toBe('HELLO    WORLD');
      });
    });

    describe('toLowerCase', () => {
      it('converts empty string to empty string', () => {
        expect(toLowerCase('')).toBe('');
      });

      it('handles single character', () => {
        expect(toLowerCase('a')).toBe('a');
        expect(toLowerCase('A')).toBe('a');
      });

      it('handles numbers', () => {
        expect(toLowerCase('HELLO123')).toBe('hello123');
      });

      it('handles multiple spaces', () => {
        expect(toLowerCase('HELLO    WORLD')).toBe('hello    world');
      });
    });

    describe('toAlternatingCase', () => {
      it('converts empty string to empty string', () => {
        expect(toAlternatingCase('')).toBe('');
      });

      it('handles single character', () => {
        expect(toAlternatingCase('a')).toBe('a');
        expect(toAlternatingCase('A')).toBe('a');
      });

      it('handles numbers as unchanged', () => {
        expect(toAlternatingCase('abc123')).toBe('aBc123');
      });

      it('handles multiple spaces', () => {
        expect(toAlternatingCase('hello    world')).toBe('hElLo    WoRlD');
      });
    });

    describe('toInverseCase', () => {
      it('converts empty string to empty string', () => {
        expect(toInverseCase('')).toBe('');
      });

      it('handles single character', () => {
        expect(toInverseCase('a')).toBe('A');
        expect(toInverseCase('A')).toBe('a');
      });

      it('handles numbers as unchanged', () => {
        expect(toInverseCase('abc123')).toBe('ABC123');
      });

      it('handles multiple spaces', () => {
        expect(toInverseCase('hello    world')).toBe('HELLO    WORLD');
      });
    });

    describe('toPascalSnakeCase', () => {
      it('converts empty string to empty string', () => {
        expect(toPascalSnakeCase('')).toBe('');
      });

      it('handles consecutive uppercase', () => {
        expect(toPascalSnakeCase('XMLParser')).toBe('Xml_Parser');
      });

      it('handles hyphens', () => {
        expect(toPascalSnakeCase('hello-world')).toBe('Hello_World');
      });
    });

    describe('toPascalKebabCase', () => {
      it('converts empty string to empty string', () => {
        expect(toPascalKebabCase('')).toBe('');
      });

      it('handles consecutive uppercase', () => {
        expect(toPascalKebabCase('XMLParser')).toBe('Xml-Parser');
      });

      it('handles hyphens', () => {
        expect(toPascalKebabCase('hello-world')).toBe('Hello-World');
      });
    });
  });
  describe('toCamelCase', () => {
    it('converts hello world to helloWorld', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });

    it('converts Hello World to helloWorld', () => {
      expect(toCamelCase('Hello World')).toBe('helloWorld');
    });

    it('converts helloWorld to helloWorld', () => {
      expect(toCamelCase('helloWorld')).toBe('helloWorld');
    });
  });

  describe('toPascalCase', () => {
    it('converts hello world to HelloWorld', () => {
      expect(toPascalCase('hello world')).toBe('HelloWorld');
    });

    it('converts Hello World to HelloWorld', () => {
      expect(toPascalCase('Hello World')).toBe('HelloWorld');
    });

    it('converts helloWorld to HelloWorld', () => {
      expect(toPascalCase('helloWorld')).toBe('HelloWorld');
    });
  });

  describe('toSnakeCase', () => {
    it('converts hello world to hello_world', () => {
      expect(toSnakeCase('hello world')).toBe('hello_world');
    });

    it('converts helloWorld to hello_world', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world');
    });

    it('converts HelloWorld to hello_world', () => {
      expect(toSnakeCase('HelloWorld')).toBe('hello_world');
    });
  });

  describe('toKebabCase', () => {
    it('converts hello world to hello-world', () => {
      expect(toKebabCase('hello world')).toBe('hello-world');
    });

    it('converts helloWorld to hello-world', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
    });
  });

  describe('toConstantCase', () => {
    it('converts hello world to HELLO_WORLD', () => {
      expect(toConstantCase('hello world')).toBe('HELLO_WORLD');
    });

    it('converts helloWorld to HELLO_WORLD', () => {
      expect(toConstantCase('helloWorld')).toBe('HELLO_WORLD');
    });
  });

  describe('toDotCase', () => {
    it('converts hello world to hello.world', () => {
      expect(toDotCase('hello world')).toBe('hello.world');
    });

    it('converts helloWorld to hello.world', () => {
      expect(toDotCase('helloWorld')).toBe('hello.world');
    });
  });

  describe('toPathCase', () => {
    it('converts hello world to hello/world', () => {
      expect(toPathCase('hello world')).toBe('hello/world');
    });

    it('converts helloWorld to hello/world', () => {
      expect(toPathCase('helloWorld')).toBe('hello/world');
    });
  });

  describe('toTitleCase', () => {
    it('converts hello world to Hello World', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('converts HELLO WORLD to Hello World', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });
  });

  describe('toSentenceCase', () => {
    it('converts HELLO WORLD to Hello world', () => {
      expect(toSentenceCase('HELLO WORLD')).toBe('Hello world');
    });

    it('converts hello world to Hello world', () => {
      expect(toSentenceCase('hello world')).toBe('Hello world');
    });
  });

  describe('toUpperCase', () => {
    it('converts hello to HELLO', () => {
      expect(toUpperCase('hello')).toBe('HELLO');
    });
  });

  describe('toLowerCase', () => {
    it('converts HELLO to hello', () => {
      expect(toLowerCase('HELLO')).toBe('hello');
    });
  });

  describe('toAlternatingCase', () => {
    it('converts hello to hElLo', () => {
      expect(toAlternatingCase('hello')).toBe('hElLo');
    });

    it('converts abc to aBc', () => {
      expect(toAlternatingCase('abc')).toBe('aBc');
    });
  });

  describe('toInverseCase', () => {
    it('converts Hello World to hELLO wORLD', () => {
      expect(toInverseCase('Hello World')).toBe('hELLO wORLD');
    });

    it('converts hElLo to HeLlO', () => {
      expect(toInverseCase('hElLo')).toBe('HeLlO');
    });
  });

  describe('toPascalSnakeCase', () => {
    it('converts hello world to Hello_World', () => {
      expect(toPascalSnakeCase('hello world')).toBe('Hello_World');
    });

    it('converts helloWorld to Hello_World', () => {
      expect(toPascalSnakeCase('helloWorld')).toBe('Hello_World');
    });
  });

  describe('toPascalKebabCase', () => {
    it('converts hello world to Hello-World', () => {
      expect(toPascalKebabCase('hello world')).toBe('Hello-World');
    });

    it('converts helloWorld to Hello-World', () => {
      expect(toPascalKebabCase('helloWorld')).toBe('Hello-World');
    });
  });
});