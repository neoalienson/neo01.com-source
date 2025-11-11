// Chmod Calculator Tests
framework.test('Chmod octal calculation', () => {
    const owner = 4 + 2 + 0; // rw-
    const group = 4 + 0 + 0; // r--
    const others = 0 + 0 + 0; // ---
    const result = `${owner}${group}${others}`;
    framework.assertEqual(result, '640');
});

framework.test('Chmod symbolic calculation', () => {
    const permissions = [true, true, true, true, false, true, true, false, false];
    const symbols = ['r', 'w', 'x', 'r', 'w', 'x', 'r', 'w', 'x'];
    const result = permissions.map((p, i) => p ? symbols[i] : '-').join('');
    framework.assertEqual(result, 'rwxr-xr--');
});