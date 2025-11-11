// URL Parser Tests
framework.test('URL parsing', () => {
    const url = 'https://neo01.com:8080/path?param=value#hash';
    const urlObj = new URL(url);
    framework.assertEqual(urlObj.protocol, 'https:');
    framework.assertEqual(urlObj.hostname, 'neo01.com');
    framework.assertEqual(urlObj.port, '8080');
});