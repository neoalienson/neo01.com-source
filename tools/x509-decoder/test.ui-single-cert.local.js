framework.test('UI displays subject and issuer for single certificate', () => {
    const mockOutput = document.createElement('div');
    mockOutput.id = 'output';
    
    const decoder = new X509Decoder();
    decoder.output = mockOutput;
    decoder.currentChain = null;
    
    const certInfo = {
        version: 'v3',
        serialNumber: '01:02:03',
        signatureAlgorithm: 'SHA256withRSA',
        issuer: 'C=US, O=Test CA, CN=Test Root',
        subject: 'CN=example.com',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        publicKeyAlgorithm: 'RSA',
        publicKeySize: '2048 bits',
        keyUsage: 'Digital Signature',
        extensions: ['Key Usage'],
        fingerprint: '00:11:22:33'
    };
    
    decoder.displayResults(certInfo, true);
    
    const outputHTML = mockOutput.innerHTML;
    framework.assertTrue(outputHTML.includes('Subject'), 'Output should contain Subject field');
    framework.assertTrue(outputHTML.includes('Issuer'), 'Output should contain Issuer field');
    framework.assertTrue(outputHTML.includes('example.com'), 'Output should contain subject CN');
    framework.assertTrue(outputHTML.includes('Test Root'), 'Output should contain issuer CN');
});
