// Temperature Converter Tests
framework.test('Celsius to Fahrenheit', () => {
    const result = (0 * 9/5) + 32;
    framework.assertEqual(result, 32);
});

framework.test('Fahrenheit to Celsius', () => {
    const result = (32 - 32) * 5/9;
    framework.assertEqual(result, 0);
});