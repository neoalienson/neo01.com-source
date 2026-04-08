import { describe, it, expect } from 'vitest';
import { getTextStats } from './TextStatistics.jsx';

describe('TextStatistics', () => {
  describe('getTextStats', () => {
    describe('Happy Flow - Standard text inputs', () => {
      it('analyzes standard English paragraph', () => {
        const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(123);
        expect(stats.charactersNoSpaces).toBe(105);
        expect(stats.words).toBe(19);
        expect(stats.sentences).toBe(2);
        expect(stats.paragraphs).toBe(1);
        expect(stats.lines).toBe(1);
        expect(stats.longestWord).toBe('consectetur');
      });

      it('analyzes multiple sentences', () => {
        const text = 'Hello world! How are you? I am fine.';
        const stats = getTextStats(text);
        expect(stats.words).toBe(8);
        expect(stats.sentences).toBe(3);
      });

      it('analyzes multi-paragraph text', () => {
        const text = 'First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.';
        const stats = getTextStats(text);
        expect(stats.paragraphs).toBe(3);
        expect(stats.lines).toBe(5);
        expect(stats.words).toBe(9);
      });

      it('analyzes text with various punctuation', () => {
        const text = 'Hello... world! Are you okay? Yes!';
        const stats = getTextStats(text);
        expect(stats.sentences).toBe(4);
        expect(stats.words).toBe(6);
      });

      it('analyzes Chinese text', () => {
        const text = '你好，世界！这是一段中文文本。';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(15);
        expect(stats.charactersNoSpaces).toBe(15);
        expect(stats.words).toBe(1);
        expect(stats.sentences).toBe(1);
      });

      it('analyzes Japanese text', () => {
        const text = 'こんにちは世界！これはテストです。';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(17);
        expect(stats.charactersNoSpaces).toBe(17);
        expect(stats.words).toBe(1);
        expect(stats.sentences).toBe(1);
      });
    });

    describe('Edge Cases - Empty and minimal inputs', () => {
      it('handles empty string', () => {
        const text = '';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(0);
        expect(stats.charactersNoSpaces).toBe(0);
        expect(stats.words).toBe(0);
        expect(stats.sentences).toBe(0);
        expect(stats.paragraphs).toBe(0);
        expect(stats.lines).toBe(1);
        expect(stats.estimatedTokens).toBe(0);
        expect(stats.readingTimeMinutes).toBe(0);
        expect(stats.avgWordLength).toBe('0');
      });

      it('handles whitespace only', () => {
        const text = '   \n\n   \n   ';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(12);
        expect(stats.charactersNoSpaces).toBe(0);
        expect(stats.words).toBe(0);
        expect(stats.sentences).toBe(0);
        expect(stats.lines).toBe(4);
      });

      it('handles single character', () => {
        const text = 'a';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(1);
        expect(stats.charactersNoSpaces).toBe(1);
        expect(stats.words).toBe(1);
        expect(stats.estimatedTokens).toBe(1);
      });

      it('handles single word', () => {
        const text = 'Hello';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(5);
        expect(stats.words).toBe(1);
        expect(stats.sentences).toBe(1);
      });

      it('handles single sentence without typical ending', () => {
        const text = 'Hello world';
        const stats = getTextStats(text);
        expect(stats.words).toBe(2);
        expect(stats.sentences).toBe(1);
      });
    });

    describe('Edge Cases - Special characters and formatting', () => {
      it('handles newlines correctly', () => {
        const text = 'Line 1\nLine 2\nLine 3';
        const stats = getTextStats(text);
        expect(stats.lines).toBe(3);
        expect(stats.paragraphs).toBe(1);
        expect(stats.words).toBe(6);
      });

      it('handles tabs and special whitespace', () => {
        const text = 'Hello\t\tworld\n\n\t\tTest';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(20);
        expect(stats.charactersNoSpaces).toBe(14);
        expect(stats.paragraphs).toBe(2);
        expect(stats.words).toBe(3);
      });

      it('handles multiple spaces between words', () => {
        const text = 'Hello     world    test';
        const stats = getTextStats(text);
        expect(stats.words).toBe(3);
      });

      it('handles leading and trailing whitespace', () => {
        const text = '   Hello world   ';
        const stats = getTextStats(text);
        expect(stats.words).toBe(2);
      });

      it('handles multiple consecutive newlines', () => {
        const text = 'Paragraph 1\n\n\n\n\nParagraph 2';
        const stats = getTextStats(text);
        expect(stats.paragraphs).toBe(2);
        expect(stats.lines).toBe(6);
      });
    });

    describe('Edge Cases - Numbers and symbols', () => {
      it('handles text with numbers', () => {
        const text = 'Test 123 with 456 numbers 789';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(29);
        expect(stats.charactersNoSpaces).toBe(24);
        expect(stats.words).toBe(6);
        expect(stats.longestWord).toBe('numbers');
      });

      it('handles text with symbols', () => {
        const text = 'Hello @#$%^&*() world!';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(22);
        expect(stats.words).toBe(3);
      });

      it('handles URL-like text', () => {
        const text = 'Visit https://example.com for more info.';
        const stats = getTextStats(text);
        expect(stats.words).toBe(5);
        expect(stats.sentences).toBe(2);
      });

      it('handles email-like text', () => {
        const text = 'Contact test@example.com for help.';
        const stats = getTextStats(text);
        expect(stats.words).toBe(4);
        expect(stats.sentences).toBe(2);
      });
    });

    describe('Edge Cases - Long text', () => {
      it('handles very long text', () => {
        const text = 'Word '.repeat(1000);
        const stats = getTextStats(text);
        expect(stats.words).toBe(1000);
        expect(stats.readingTimeMinutes).toBe(5);
        expect(stats.estimatedTokens).toBe(1000);
      });

      it('handles text with very long words', () => {
        const text = 'Supercalifragilisticexpialidocious antidisestablishmentarianism';
        const stats = getTextStats(text);
        expect(stats.longestWord).toBe('Supercalifragilisticexpialidocious');
        expect(stats.longestWord.length).toBe(34);
      });
    });

    describe('Edge Cases - Average word length', () => {
      it('calculates average word length correctly', () => {
        const text = 'Hi ok bye';
        const stats = getTextStats(text);
        expect(stats.avgWordLength).toBe('2.33');
      });

      it('handles single character words', () => {
        const text = 'a b c d e';
        const stats = getTextStats(text);
        expect(stats.avgWordLength).toBe('1.00');
      });

      it('handles long words only', () => {
        const text = 'supercalifragilisticexpialidocious';
        const stats = getTextStats(text);
        expect(parseFloat(stats.avgWordLength)).toBe(34);
      });

      it('returns "0" for empty text', () => {
        const text = '';
        const stats = getTextStats(text);
        expect(stats.avgWordLength).toBe('0');
      });
    });

    describe('Edge Cases - Longest word detection', () => {
      it('finds longest word in mixed text', () => {
        const text = 'I ate a banana and an apple';
        const stats = getTextStats(text);
        expect(stats.longestWord).toBe('banana');
      });

      it('returns empty string when no word characters found', () => {
        const text = '   @#$%^   ';
        const stats = getTextStats(text);
        expect(stats.longestWord).toBe('');
      });

      it('finds longest word with mixed case', () => {
        const text = 'Hello WORLD supercalifragilisticexpialidocious test';
        const stats = getTextStats(text);
        expect(stats.longestWord).toBe('supercalifragilisticexpialidocious');
      });

      it('handles numbers as words', () => {
        const text = '123456789 12 123';
        const stats = getTextStats(text);
        expect(stats.longestWord).toBe('123456789');
      });
    });

    describe('Edge Cases - Tokens estimation', () => {
      it('calculates tokens correctly', () => {
        const text = 'Hello world';
        const stats = getTextStats(text);
        expect(stats.estimatedTokens).toBe(3);
      });

      it('handles exact division', () => {
        const text = '1234';
        const stats = getTextStats(text);
        expect(stats.estimatedTokens).toBe(1);
      });

      it('handles partial token', () => {
        const text = '12345';
        const stats = getTextStats(text);
        expect(stats.estimatedTokens).toBe(2);
      });
    });

    describe('Edge Cases - Reading time', () => {
      it('calculates reading time for short text', () => {
        const text = 'Hello world';
        const stats = getTextStats(text);
        expect(stats.readingTimeMinutes).toBe(1);
      });

      it('calculates reading time for long text', () => {
        const text = 'word '.repeat(400);
        const stats = getTextStats(text);
        expect(stats.readingTimeMinutes).toBe(2);
      });

      it('returns 0 for empty text', () => {
        const text = '';
        const stats = getTextStats(text);
        expect(stats.readingTimeMinutes).toBe(0);
      });
    });

    describe('Exceptional Cases - Unicode and emoji', () => {
      it('handles emoji', () => {
        const text = 'Hello 👋 World 🌍 🎉';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(20);
        expect(stats.charactersNoSpaces).toBe(16);
        expect(stats.words).toBe(5);
      });

      it('handles mixed unicode', () => {
        const text = 'Hello 世界 🌏 Привет';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(18);
        expect(stats.charactersNoSpaces).toBe(15);
        expect(stats.words).toBe(4);
      });

      it('handles zero-width characters', () => {
        const text = 'Hello\u200BWorld';
        const stats = getTextStats(text);
        expect(stats.characters).toBe(11);
        expect(stats.charactersNoSpaces).toBe(11);
      });
    });

    describe('Exceptional Cases - Complex sentence detection', () => {
      it('handles multiple punctuation marks', () => {
        const text = 'Hello!!! How are you??? I am fine!';
        const stats = getTextStats(text);
        expect(stats.sentences).toBe(3);
        expect(stats.words).toBe(7);
      });

      it('handles exclamation without space after', () => {
        const text = 'Wow!Really?Hmm.';
        const stats = getTextStats(text);
        expect(stats.sentences).toBe(3);
        expect(stats.words).toBe(1);
      });

      it('handles ellipsis as sentence separator', () => {
        const text = 'Hello... World... Test...';
        const stats = getTextStats(text);
        expect(stats.sentences).toBe(3);
        expect(stats.words).toBe(3);
      });

      it('handles question mark in middle of sentence', () => {
        const text = 'What? I do not know!';
        const stats = getTextStats(text);
        expect(stats.sentences).toBe(2);
        expect(stats.words).toBe(5);
      });
    });

    describe('Exceptional Cases - Line counting', () => {
      it('counts lines including trailing newline', () => {
        const text = 'Line 1\nLine 2\n';
        const stats = getTextStats(text);
        expect(stats.lines).toBe(3);
        expect(stats.words).toBe(4);
      });

      it('handles single line with no newline', () => {
        const text = 'Single line';
        const stats = getTextStats(text);
        expect(stats.lines).toBe(1);
      });

      it('handles only newlines', () => {
        const text = '\n\n\n\n';
        const stats = getTextStats(text);
        expect(stats.lines).toBe(5);
        expect(stats.paragraphs).toBe(0);
      });
    });

    describe('Exceptional Cases - Paragraph counting', () => {
      it('counts empty lines between paragraphs', () => {
        const text = 'Para 1\n\n\nPara 2';
        const stats = getTextStats(text);
        expect(stats.paragraphs).toBe(2);
        expect(stats.lines).toBe(4);
      });

      it('handles single paragraph with multiple lines', () => {
        const text = 'Line 1\nLine 2\nLine 3';
        const stats = getTextStats(text);
        expect(stats.paragraphs).toBe(1);
        expect(stats.lines).toBe(3);
      });

      it('handles trailing newlines not creating empty paragraphs', () => {
        const text = 'Paragraph\n\n\n';
        const stats = getTextStats(text);
        expect(stats.paragraphs).toBe(1);
        expect(stats.lines).toBe(4);
      });
    });
  });
});