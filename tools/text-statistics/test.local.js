// Text Statistics Tests
framework.test('Text statistics word count', () => {
    const text = 'hello world test';
    const words = text.trim().split(/\s+/).length;
    const characters = text.length;
    framework.assertEqual(words, 3);
    framework.assertEqual(characters, 16);
});

framework.test('Text statistics token estimation', () => {
    const text = 'hello world';
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const estimatedTokens = Math.ceil(charactersNoSpaces / 4);
    framework.assertTrue(estimatedTokens > 0);
    framework.assertEqual(estimatedTokens, 3);
});