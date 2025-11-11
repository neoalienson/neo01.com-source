// Test certificate chain parsing - broken down into individual tests
const GITHUB_CERT_CHAIN = `-----BEGIN CERTIFICATE-----
MIICjzCCAhWgAwIBAgIQXIuZxVqUxdJxVt7NiYDMJjAKBggqhkjOPQQDAzCBiDEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCk5ldyBKZXJzZXkxFDASBgNVBAcTC0plcnNl
eSBDaXR5MR4wHAYDVQQKExVUaGUgVVNFUlRSVVNUIE5ldHdvcmsxLjAsBgNVBAMT
JVVTRVJUcnVzdCBFQ0MgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTAwMjAx
MDAwMDAwWhcNMzgwMTE4MjM1OTU5WjCBiDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
Ck5ldyBKZXJzZXkxFDASBgNVBAcTC0plcnNleSBDaXR5MR4wHAYDVQQKExVUaGUg
VVNFUlRSVVNUIE5ldHdvcmsxLjAsBgNVBAMTJVVTRVJUcnVzdCBFQ0MgQ2VydGlm
aWNhdGlvbiBBdXRob3JpdHkwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAAQarFRaqflo
I+d61SRvU8Za2EurxtW20eZzca7dnNYMYf3boIkDuAUU7FfO7l0/4iGzzvfUinng
o4N+LZfQYcTxmdwlkWOrfzCjtHDix6EznPO/LlxTsV+zfTJ/ijTjeXmjQjBAMB0G
A1UdDgQWBBQ64QmG1M8ZwpZ2dEl23OA1xmNjmjAOBgNVHQ8BAf8EBAMCAQYwDwYD
VR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAwNoADBlAjA2Z6EWCNzklwBBHU6+4WMB
zzuqQhFkoJ2UOQIReVx7Hfpkue4WQrO/isIJxOzksU0CMQDpKmFHjFJKS04YcPbW
RNZu9YO6bVi9JNlWSOrvxKJGgYhqOkbRqZtNyWHa0V1Xahg=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDqDCCAy6gAwIBAgIRAPNkTmtuAFAjfglGvXvh9R0wCgYIKoZIzj0EAwMwgYgx
CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpOZXcgSmVyc2V5MRQwEgYDVQQHEwtKZXJz
ZXkgQ2l0eTEeMBwGA1UEChMVVGhlIFVTRVJUUlVTVCBOZXR3b3JrMS4wLAYDVQQD
EyVVU0VSVHJ1c3QgRUNDIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTE4MTEw
MjAwMDAwMFoXDTMwMTIzMTIzNTk1OVowgY8xCzAJBgNVBAYTAkdCMRswGQYDVQQI
ExJHcmVhdGVyIE1hbmNoZXN0ZXIxEDAOBgNVBAcTB1NhbGZvcmQxGDAWBgNVBAoT
D1NlY3RpZ28gTGltaXRlZDE3MDUGA1UEAxMuU2VjdGlnbyBFQ0MgRG9tYWluIFZh
bGlkYXRpb24gU2VjdXJlIFNlcnZlciBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEH
A0IABHkYk8qfbZ5sVwAjBTcLXw9YWsTef1Wj6R7W2SUKiKAgSh16TwUwimNJE4xk
IQeV/To14UrOkPAY9z2vaKb71EijggFuMIIBajAfBgNVHSMEGDAWgBQ64QmG1M8Z
wpZ2dEl23OA1xmNjmjAdBgNVHQ4EFgQU9oUKOxGG4QR9DqoLLNLuzGR7e64wDgYD
VR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0lBBYwFAYIKwYB
BQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAIBgZngQwBAgEwUAYD
VR0fBEkwRzBFoEOgQYY/aHR0cDovL2NybC51c2VydHJ1c3QuY29tL1VTRVJUcnVz
dEVDQ0NlcnRpZmljYXRpb25BdXRob3JpdHkuY3JsMHYGCCsGAQUFBwEBBGowaDA/
BggrBgEFBQcwAoYzaHR0cDovL2NydC51c2VydHJ1c3QuY29tL1VTRVJUcnVzdEVD
Q0FkZFRydXN0Q0EuY3J0MCUGCCsGAQUFBzABhhlodHRwOi8vb2NzcC51c2VydHJ1
c3QuY29tMAoGCCqGSM49BAMDA2gAMGUCMEvnx3FcsVwJbZpCYF9z6fDWJtS1UVRs
cS0chWBNKPFNpvDKdrdKRe+oAkr2jU+ubgIxAODheSr2XhcA7oz9HmedGdMhlrd9
4ToKFbZl+/OnFFzqnvOhcjHvClECEQcKmc8fmA==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIEoTCCBEigAwIBAgIRAKtmhrVie+gFloITMBKGSfUwCgYIKoZIzj0EAwIwgY8x
CzAJBgNVBAYTAkdCMRswGQYDVQQIExJHcmVhdGVyIE1hbmNoZXN0ZXIxEDAOBgNV
BAcTB1NhbGZvcmQxGDAWBgNVBAoTD1NlY3RpZ28gTGltaXRlZDE3MDUGA1UEAxMu
U2VjdGlnbyBFQ0MgRG9tYWluIFZhbGlkYXRpb24gU2VjdXJlIFNlcnZlciBDQTAe
Fw0yNTAyMDUwMDAwMDBaFw0yNjAyMDUyMzU5NTlaMBUxEzARBgNVBAMTCmdpdGh1
Yi5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQgNFxG/yzL+CSarvC7L3ep
H5chNnG6wiYYxR5D/Z1J4MxGnIX8KbT5fCgLoyzHXL9v50bdBIq6y4AtN4gN7gbW
o4IC/DCCAvgwHwYDVR0jBBgwFoAU9oUKOxGG4QR9DqoLLNLuzGR7e64wHQYDVR0O
BBYEFFPIF96emE7HTda83quVPjA9PdHIMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMB
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

framework.test('Extract 3 certificates from PEM chain', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    framework.assertEqual(parser.certs.length, 3, 'Should extract 3 certificates');
});

framework.test('Parse all 3 certificates', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    framework.assertEqual(chain.length, 3, 'Should parse 3 certificates');
});

framework.test('Find github.com leaf certificate', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const githubCert = chain.find(c => c.subject.includes('github.com'));
    framework.assertTrue(githubCert !== undefined, 'Should find github.com cert');
    framework.assertEqual(githubCert.validFrom.substring(0, 10), '2025-02-05', 'Valid from 2025-02-05');
});

framework.test('Find Sectigo intermediate CA', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const sectigoCert = chain.find(c => c.subject.includes('Sectigo'));
    framework.assertTrue(sectigoCert !== undefined, 'Should find Sectigo cert');
});

framework.test('Find USERTrust root CA', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const usertrustCert = chain.find(c => c.subject.includes('USERTrust'));
    framework.assertTrue(usertrustCert !== undefined, 'Should find USERTrust cert');
});

framework.test('Build chain relationships', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const chainWithRelations = parser.buildChainRelationships(chain);
    framework.assertEqual(chainWithRelations.length, 3, 'Should have 3 certs with relationships');
});

framework.test('Classify certificate types (leaf/intermediate/root)', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const chainWithRelations = parser.buildChainRelationships(chain);
    
    const githubRel = chainWithRelations.find(c => c.subjectCN === 'github.com');
    const sectigoRel = chainWithRelations.find(c => c.subjectCN.includes('Sectigo'));
    const usertrustRel = chainWithRelations.find(c => c.subjectCN.includes('USERTrust'));
    
    framework.assertEqual(githubRel.certType, 'leaf', 'github.com should be leaf');
    framework.assertEqual(sectigoRel.certType, 'intermediate', 'Sectigo should be intermediate');
    framework.assertEqual(usertrustRel.certType, 'root', 'USERTrust should be root');
});

framework.test('Detect self-signed certificates', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const chainWithRelations = parser.buildChainRelationships(chain);
    
    const githubRel = chainWithRelations.find(c => c.subjectCN === 'github.com');
    const usertrustRel = chainWithRelations.find(c => c.subjectCN.includes('USERTrust'));
    
    framework.assertEqual(githubRel.isSelfSigned, false, 'github.com not self-signed');
    framework.assertEqual(usertrustRel.isSelfSigned, true, 'USERTrust is self-signed');
});

framework.test('Map issuer-subject relationships', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const chainWithRelations = parser.buildChainRelationships(chain);
    
    const githubRel = chainWithRelations.find(c => c.subjectCN === 'github.com');
    const sectigoRel = chainWithRelations.find(c => c.subjectCN.includes('Sectigo'));
    
    framework.assertEqual(githubRel.issuerCN, 'Sectigo ECC Domain Validation Secure Server CA', 'github.com issued by Sectigo');
    framework.assertEqual(sectigoRel.issuerCN, 'USERTrust ECC Certification Authority', 'Sectigo issued by USERTrust');
});

framework.test('Parse Subject Alternative Names count', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const chainWithRelations = parser.buildChainRelationships(chain);
    
    const githubRel = chainWithRelations.find(c => c.subjectCN === 'github.com');
    framework.assertTrue(githubRel.subjectAltName !== null, 'Should have SANs');
    framework.assertEqual(githubRel.subjectAltName.length, 2, 'Should have 2 SANs');
});

framework.test('Parse Subject Alternative Names values', () => {
    const parser = new X509CertificateParser(GITHUB_CERT_CHAIN);
    const chain = parser.parseChain();
    const chainWithRelations = parser.buildChainRelationships(chain);
    
    const githubRel = chainWithRelations.find(c => c.subjectCN === 'github.com');
    const san = githubRel.subjectAltName;
    
    if (Array.isArray(san) && san.length > 0 && Array.isArray(san[0])) {
        framework.assertEqual(san[0][1], 'github.com', 'First SAN is github.com');
        framework.assertEqual(san[1][1], 'www.github.com', 'Second SAN is www.github.com');
    } else {
        framework.assertEqual(san[0], 'github.com', 'First SAN is github.com');
        framework.assertEqual(san[1], 'www.github.com', 'Second SAN is www.github.com');
    }
});
