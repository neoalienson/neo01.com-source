// Emoji Picker Tests
framework.test('Emoji data structure', () => {
    const emoji = { char: '😀', name: 'grinning face', category: 'smileys' };
    framework.assertEqual(emoji.char, '😀');
    framework.assertEqual(emoji.name, 'grinning face');
    framework.assertEqual(emoji.category, 'smileys');
});

framework.test('Category extraction', () => {
    const emojis = [
        { char: '😀', name: 'grinning face', category: 'smileys' },
        { char: '❤️', name: 'red heart', category: 'symbols' },
        { char: '👍', name: 'thumbs up', category: 'people' }
    ];
    const categories = [...new Set(emojis.map(e => e.category))];
    framework.assertTrue(categories.includes('smileys'));
    framework.assertTrue(categories.includes('symbols'));
    framework.assertTrue(categories.includes('people'));
});

framework.test('Emoji search filtering', () => {
    const emojis = [
        { char: '😀', name: 'grinning face', category: 'smileys' },
        { char: '❤️', name: 'red heart', category: 'symbols' }
    ];
    const searchTerm = 'heart';
    const filtered = emojis.filter(emoji => 
        emoji.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    framework.assertEqual(filtered.length, 1);
    framework.assertEqual(filtered[0].char, '❤️');
});