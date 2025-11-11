framework.test('should defang URL with all options enabled', () => {
    const input = 'http://example.com:8080/path';
    const expected = 'hxxp[://]example[.]com[:]8080/path';
    const result = Defanger.defang(input);
    framework.assertEqual(result, expected);
});

framework.test('should defang HTTPS URL', () => {
    const input = 'https://malicious.site:443';
    const expected = 'hxxps[://]malicious[.]site[:]443';
    const result = Defanger.defang(input);
    framework.assertEqual(result, expected);
});

framework.test('should defang IP address', () => {
    const input = '192.168.1.1:80';
    const expected = '192[.]168[.]1[.]1[:]80';
    const result = Defanger.defang(input);
    framework.assertEqual(result, expected);
});

framework.test('should defang with only replaceDots enabled', () => {
    const input = 'http://example.com:8080';
    const expected = 'http://example[.]com:8080';
    const result = Defanger.defang(input, {
        replaceDots: true,
        replaceHttp: false,
        replaceProtocol: false,
        replacePorts: false
    });
    framework.assertEqual(result, expected);
});

framework.test('should defang with only replaceHttp enabled', () => {
    const input = 'http://example.com:8080';
    const expected = 'hxxp://example.com:8080';
    const result = Defanger.defang(input, {
        replaceDots: false,
        replaceHttp: true,
        replaceProtocol: false,
        replacePorts: false
    });
    framework.assertEqual(result, expected);
});

framework.test('should defang with only replaceProtocol enabled', () => {
    const input = 'http://example.com:8080';
    const expected = 'http[://]example.com:8080';
    const result = Defanger.defang(input, {
        replaceDots: false,
        replaceHttp: false,
        replaceProtocol: true,
        replacePorts: false
    });
    framework.assertEqual(result, expected);
});

framework.test('should defang with only replacePorts enabled', () => {
    const input = 'http://example.com:8080';
    const expected = 'http://example.com[:]8080';
    const result = Defanger.defang(input, {
        replaceDots: false,
        replaceHttp: false,
        replaceProtocol: false,
        replacePorts: true
    });
    framework.assertEqual(result, expected);
});

framework.test('should handle multiple URLs', () => {
    const input = 'Visit http://site1.com:80 or https://site2.org:443';
    const expected = 'Visit hxxp[://]site1[.]com[:]80 or hxxps[://]site2[.]org[:]443';
    const result = Defanger.defang(input);
    framework.assertEqual(result, expected);
});

framework.test('should preserve non-port colons', () => {
    const input = 'Time: 12:30 URL: http://test.com:8080';
    const expected = 'Time: 12:30 URL: hxxp[://]test[.]com[:]8080';
    const result = Defanger.defang(input);
    framework.assertEqual(result, expected);
});

framework.test('should refang URL with all options enabled', () => {
    const input = 'hxxp[://]example[.]com[:]8080/path';
    const expected = 'http://example.com:8080/path';
    const result = Defanger.refang(input);
    framework.assertEqual(result, expected);
});

framework.test('should refang HTTPS URL', () => {
    const input = 'hxxps[://]malicious[.]site[:]443';
    const expected = 'https://malicious.site:443';
    const result = Defanger.refang(input);
    framework.assertEqual(result, expected);
});

framework.test('should refang IP address', () => {
    const input = '192[.]168[.]1[.]1[:]80';
    const expected = '192.168.1.1:80';
    const result = Defanger.refang(input);
    framework.assertEqual(result, expected);
});

framework.test('should refang with only replaceDots enabled', () => {
    const input = 'http://example[.]com:8080';
    const expected = 'http://example.com:8080';
    const result = Defanger.refang(input, {
        replaceDots: true,
        replaceHttp: false,
        replaceProtocol: false,
        replacePorts: false
    });
    framework.assertEqual(result, expected);
});

framework.test('should refang with only replaceHttp enabled', () => {
    const input = 'hxxp://example.com:8080';
    const expected = 'http://example.com:8080';
    const result = Defanger.refang(input, {
        replaceDots: false,
        replaceHttp: true,
        replaceProtocol: false,
        replacePorts: false
    });
    framework.assertEqual(result, expected);
});

framework.test('should refang with only replaceProtocol enabled', () => {
    const input = 'http[://]example.com:8080';
    const expected = 'http://example.com:8080';
    const result = Defanger.refang(input, {
        replaceDots: false,
        replaceHttp: false,
        replaceProtocol: true,
        replacePorts: false
    });
    framework.assertEqual(result, expected);
});

framework.test('should refang with only replacePorts enabled', () => {
    const input = 'http://example.com[:]8080';
    const expected = 'http://example.com:8080';
    const result = Defanger.refang(input, {
        replaceDots: false,
        replaceHttp: false,
        replaceProtocol: false,
        replacePorts: true
    });
    framework.assertEqual(result, expected);
});

framework.test('should handle multiple URLs in refang', () => {
    const input = 'Visit hxxp[://]site1[.]com[:]80 or hxxps[://]site2[.]org[:]443';
    const expected = 'Visit http://site1.com:80 or https://site2.org:443';
    const result = Defanger.refang(input);
    framework.assertEqual(result, expected);
});

framework.test('should be inverse of defang', () => {
    const original = 'http://example.com:8080/path?query=value';
    const defanged = Defanger.defang(original);
    const refanged = Defanger.refang(defanged);
    framework.assertEqual(refanged, original);
});

framework.test('should handle mixed defanged and normal text', () => {
    const input = 'Check hxxp[://]bad[.]site[.]com[:]8080 and normal text';
    const expected = 'Check http://bad.site.com:8080 and normal text';
    const result = Defanger.refang(input);
    framework.assertEqual(result, expected);
});

framework.test('should maintain data integrity through defang and refang', () => {
    const testCases = [
        'http://example.com',
        'https://test.org:443/path',
        '192.168.1.1:8080',
        'ftp://files.server.net:21',
        'http://sub.domain.example.com:3000/api/v1'
    ];

    testCases.forEach(original => {
        const defanged = Defanger.defang(original);
        const refanged = Defanger.refang(defanged);
        framework.assertEqual(refanged, original);
    });
});
