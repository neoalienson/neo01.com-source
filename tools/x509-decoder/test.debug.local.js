// Debug test to identify the issue
const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIIFazCCBFOgAwIBAgISA6PFANk/8qNaFVUhxVL0BbvNMA0GCSqGSIb3DQEBCwUA
MDMxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQwwCgYDVQQD
EwNSMTEwHhcNMjQxMjA0MDAwMDAwWhcNMjUwMzA0MjM1OTU5WjAUMRIwEAYDVQQD
Ewluby5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDHqxPvhqLx
-----END CERTIFICATE-----`;

try {
    console.log('Test 1: Create parser');
    const parser = new X509CertificateParser(SAMPLE_CERT);
    console.log('✓ Parser created');
    console.log('  - pem exists:', !!parser.pem);
    console.log('  - certs exists:', !!parser.certs);
    console.log('  - certs length:', parser.certs ? parser.certs.length : 'undefined');
    
    console.log('\nTest 2: Parse certificate');
    const certInfo = parser.parseCertificate();
    console.log('✓ Certificate parsed');
    console.log('  - version:', certInfo.version);
    console.log('  - subject:', certInfo.subject);
    
} catch (error) {
    console.log('✗ Error:', error.message);
    console.log('  Stack:', error.stack);
}
