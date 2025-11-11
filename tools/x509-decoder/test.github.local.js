framework.test('GitHub ECC certificate parsing', () => {
    const pem = `-----BEGIN CERTIFICATE-----
MIIEoTCCBEigAwIBAgIRAKtmhrVie+gFloITMBKGSfUwCgYIKoZIzj0EAwIwgY8x
CzAJBgNVBAYTAkdCMRswGQYDVQQIExJHcmVhdGVyIE1hbmNoZXN0ZXIxEDAOBgNV
BAcTB1NhbGZvcmQxGDAWBgNVBAoTD1NlY3RpZ28gTGltaXRlZDE3MDUGA1UEAxMu
U2VjdGlnbyBFQ0MgRG9tYWluIFZhbGlkYXRpb24gU2VjdXJlIFNlcnZlciBDQTAe
Fw0yNTAyMDUwMDAwMDBaFw0yNjAyMDUyMzU5NTlaMBUxEzARBgNVBAMTCmdpdGh1
Yi5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQgNFxG/yzL+CSarvC7L3ep
H5chNnG6wiYYxR5D/Z1J4MxGnIX8KbT5fCgLoyzHXL9v50bdBIq6y4AtN4gN7gbW
o4IC/DCCAvgwHwYDVR0jBBgwFoAU9oUKOxGG4QR9DqoLLNLuzGR7e64wHQYDVR0O
BBYEFFPIf96emE7HTda83quVPjA9PdHIMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMB
Af8EAjAAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjBJBgNVHSAEQjBA
MDQGCysGAQQBsjEBAgIHMCUwIwYIKwYBBQUHAgEWF2h0dHBzOi8vc2VjdGlnby5j
b20vQ1BTMAgGBmeBDAECATCBhAYIKwYBBQUHAQEEeDB2ME8GCCsGAQUFBzAChkNo
dHRwOi8vY3J0LnNlY3RpZ28uY29tL1NlY3RpZ29FQ0NEb21haW5WYWxpZGF0aW9u
U2VjdXJlU2VydmVyQ0EuY3J0MCMGCCsGAQUFBzABhhdodHRwOi8vb2NzcC5zZWN0
aWdvLmNvbTCCAX4GCisGAQQB1nkCBAIEggFuBIIBagFoAHUAlpdkv1VYl633Q4do
NwhCd+nwOtX2pPM2bkakPw/KqcYAAAGU02uUSwAABAMARjBEAiA7i6o+LpQjt6Ae
EjltHhs/TiECnHd0xTeer/3vD1xgsAIgYlGwRot+SqEBCs//frx/YHTPwox9QLdy
7GjTLWHfcMAAdwAZhtTHKKpv/roDb3gqTQGRqs4tcjEPrs5dcEEtJUzH1AAAAZTT
a5PtAAAEAwBIMEYCIQDlrInx7J+3MfqgxB2+Fvq3dMlk1qj4chOw/+HkYVfG0AIh
AMT+JKAQfUuIdBGxfryrGrwsOD3pRs1tyAyykdPGRgsTAHYAyzj3FYl8hKFEX1vB
3fvJbvKaWc1HCmkFhbDLFMMUWOcAAAGU02uUJQAABAMARzBFAiEA1GKW92agDFNJ
IYrMH3gaJdXsdIVpUcZOfxH1FksbuLECIFJCfslINhc53Q0TIMJHdcFOW2tgG4tB
A1dL881tXbMnMCUGA1UdEQQeMByCCmdpdGh1Yi5jb22CDnd3dy5naXRodWIuY29t
MAoGCCqGSM49BAMCA0cAMEQCIHGMp27BBBJ1356lCe2WYyzYIp/fAONQM3AkeE/f
ym0sAiBtVfN3YgIZ+neHEfwcRhhz4uDpc8F+tKmtceWJSicMkA==
-----END CERTIFICATE-----`;
    
    const parser = new X509CertificateParser(pem);
    const cert = parser.parseCertificate();
    
    framework.assertEqual(cert.version, 'v3', 'Certificate version');
    framework.assertEqual(cert.serialNumber, '00:ab:66:86:b5:62:7b:e8:05:96:82:13:30:12:86:49:f5', 'Serial number');
    framework.assertEqual(cert.signatureAlgorithm, 'SHA256withECDSA', 'Signature algorithm');
    framework.assertEqual(cert.validFrom.substring(0, 10), '2025-02-05', 'Valid from date');
    framework.assertEqual(cert.validTo.substring(0, 10), '2026-02-05', 'Valid to date');
    framework.assertTrue(cert.issuer.includes('C=GB'), 'Issuer contains C=GB');
    framework.assertTrue(cert.issuer.includes('O=Sectigo Limited'), 'Issuer contains O=Sectigo Limited');
    framework.assertTrue(cert.issuer.includes('CN=Sectigo ECC Domain Validation Secure Server CA'), 'Issuer contains CN=Sectigo ECC Domain Validation Secure Server CA');
    framework.assertTrue(cert.subject.includes('CN=github.com'), 'Subject contains CN=github.com');
    framework.assertEqual(cert.publicKeyAlgorithm, 'EC', 'Public key algorithm');
    framework.assertEqual(cert.publicKeySize, '256 bits', 'Public key size');
    framework.assertTrue(Array.isArray(cert.subjectAltName), 'SAN is an array');
    framework.assertTrue(cert.subjectAltName.includes('github.com'), 'SAN includes github.com');
    framework.assertTrue(cert.subjectAltName.includes('www.github.com'), 'SAN includes www.github.com');
});
