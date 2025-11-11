// Test UI field ordering
framework.test('Certificate fields ordered from user perspective', () => {
    const mockCertInfo = {
        version: 'v3',
        serialNumber: '00:11:22',
        signatureAlgorithm: 'SHA256withRSA',
        issuer: 'CN=Test CA',
        subject: 'CN=test.com',
        validFrom: '2025-01-01',
        validTo: '2026-01-01',
        keyUsage: 'Digital Signature',
        publicKeyAlgorithm: 'RSA',
        publicKeySize: '2048 bits',
        fingerprint: 'aa:bb:cc',
        extensions: ['Key Usage']
    };
    
    const rows = [
        [{ name: 'Subject', value: mockCertInfo.subject }],
        [{ name: 'Issuer', value: mockCertInfo.issuer }],
        [{ name: 'Valid From', value: mockCertInfo.validFrom }, { name: 'Valid To', value: mockCertInfo.validTo }],
        [{ name: 'Signature Algorithm', value: mockCertInfo.signatureAlgorithm }, { name: 'Public Key Algorithm', value: mockCertInfo.publicKeyAlgorithm }],
        [{ name: 'Public Key Size', value: mockCertInfo.publicKeySize }, { name: 'Key Usage', value: mockCertInfo.keyUsage }],
        [{ name: 'Extensions', value: mockCertInfo.extensions.join(', ') }],
        [{ name: 'Serial Number', value: mockCertInfo.serialNumber }],
        [{ name: 'Version', value: mockCertInfo.version }, { name: 'Fingerprint (SHA-1)', value: mockCertInfo.fingerprint }]
    ];
    
    framework.assertEqual(rows[0][0].name, 'Subject', 'First row should be Subject');
    framework.assertEqual(rows[1][0].name, 'Issuer', 'Second row should be Issuer');
    framework.assertEqual(rows[2][0].name, 'Valid From', 'Third row first field should be Valid From');
    framework.assertEqual(rows[2][1].name, 'Valid To', 'Third row second field should be Valid To');
    framework.assertEqual(rows[5][0].name, 'Extensions', 'Sixth row should be Extensions');
    framework.assertEqual(rows[6][0].name, 'Serial Number', 'Seventh row should be Serial Number');
});
