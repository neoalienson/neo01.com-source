framework.test('Lets Encrypt certificate parsing', () => {
    const pem = `-----BEGIN CERTIFICATE-----
MIIE/TCCA+WgAwIBAgISBnY9ugTPoh5t2QcBI3lLRT7NMA0GCSqGSIb3DQEBCwUA
MDMxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQwwCgYDVQQD
EwNSMTEwHhcNMjUwODE5MjExOTM4WhcNMjUxMTE3MjExOTM3WjAUMRIwEAYDVQQD
EwluZW8wMS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCYmFjr
7Mu2d4HocA6HIjHv0mNjZwGckE4QFpSc9Rm2BTBWtoJBYtQxC3nA1OHBNhMfXHAW
IdAcUxOMPAyMXRVH+MeUKUGPwuOyKbYbd42oc+rYY5E30iZQYaEEvfp2IgaloD3c
B0uPtwYktheSLsmu3BYsLMNslCMtn53UQNqYJj1nhze2TKSj7lIx44cs7TjucKW1
mH3Dh5b7LkVsomwk/2NCtuR81F9rlnMkegyliWiG8XEDeVMOiBxuWqXwgAxmDaSi
ILW5CRwANY88iaeKjE5X/R4oGTpj0FYD6fUyDTdAP5qQcTPX17R+QUi0BaqO92U2
h4dmyv9tg0PvSKyNAgMBAAGjggIoMIICJDAOBgNVHQ8BAf8EBAMCBaAwHQYDVR0l
BBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYE
FFjJsqpo5qVIzNgr6EKyv3++RWZoMB8GA1UdIwQYMBaAFMXPRqTq9MPAemyVxC2w
XpIvJuO5MDMGCCsGAQUFBwEBBCcwJTAjBggrBgEFBQcwAoYXaHR0cDovL3IxMS5p
LmxlbmNyLm9yZy8wIwYDVR0RBBwwGoIJbmVvMDEuY29tgg13d3cubmVvMDEuY29t
MBMGA1UdIAQMMAowCAYGZ4EMAQIBMC4GA1UdHwQnMCUwI6AhoB+GHWh0dHA6Ly9y
MTEuYy5sZW5jci5vcmcvNzguY3JsMIIBBAYKKwYBBAHWeQIEAgSB9QSB8gDwAHcA
pELFBklgYVSPD9TqnPt6LSZFTYepfy/fRVn2J086hFQAAAGYxGlA4QAABAMASDBG
AiEA+tVCCFfQfZzo2+t2cAYAodoV/h7QNOz4WRMlw59O3hwCIQDzd0xLuxcb/N3X
+W/Rtasm6Cx+NUkwkEuwKUAxiElYKAB1ABoE/0nQVB1Ar/agw7/x2MRnL07s7iNA
aJhrF0Au3Il9AAABmMRpQVwAAAQDAEYwRAIgGni1NW3egKdCHsYWOd2qJWaGtd0l
nbxhbr5FWLmj5GACIBK5VTijGZMCVSM6JCAcVpOWhf3grxTi2MRzt879mdtVMA0G
CSqGSIb3DQEBCwUAA4IBAQAENCXxsMuo/QrGuzqvrIh1nlFgiNiQZczA1Lged1U5
ZD1TNZM2JuW0xJQ4eWv4AOEYL28RjHLx0TBQtDQRapufl6MBJ6I/JRi+5cklYyA4
r8cyVAqM38QJxOezXsLPCkDdeqWOcdAAXoMrMDicu0ozgB7mCRjtUwvZthP1ZDwj
z+teSsdRD4o8s7JDGUiDtWlQvNPAEnCOwwVLfEvVDWU/C77wc3eyy9jLlPwM+3fb
ZieuluG8dYhK7yQni4za5FlP0TbZE9sATFEdxL9ttLaUwqRJ6gPMDyilbf4RHQIP
6TOUuLQwBdMT7fbsAnhkZaaZbTZqR9uhefKhFm5Urx3k
-----END CERTIFICATE-----`;

    const parser = new X509CertificateParser(pem);
    const cert = parser.parseCertificate();

    framework.assertEqual(cert.version, 'v3', 'Certificate version');
    framework.assertEqual(cert.serialNumber, '06:76:3d:ba:04:cf:a2:1e:6d:d9:07:01:23:79:4b:45:3e:cd', 'Serial number');
    framework.assertEqual(cert.signatureAlgorithm, 'SHA256withRSA', 'Signature algorithm');
    framework.assertEqual(cert.validFrom, '2025-08-19 21:19:38Z', 'Valid from date');
    framework.assertEqual(cert.validTo, '2025-11-17 21:19:37Z', 'Valid to date');
    framework.assertTrue(cert.issuer.includes('C=US'), 'Issuer contains C=US');
    framework.assertTrue(cert.issuer.includes("O=Let's Encrypt"), "Issuer contains O=Let's Encrypt");
    framework.assertTrue(cert.issuer.includes('CN=R11'), 'Issuer contains CN=R11');
    framework.assertTrue(cert.subject.includes('CN=neo01.com'), 'Subject contains CN=neo01.com');
    framework.assertEqual(cert.publicKeyAlgorithm, 'RSA', 'Public key algorithm');
    framework.assertEqual(cert.publicKeySize, '2048 bits', 'Public key size');
    framework.assertTrue(Array.isArray(cert.extensions), 'Extensions is an array');
    framework.assertTrue(cert.extensions.length > 0, 'Extensions array is not empty');
    framework.assertTrue(cert.extensions.includes('Key Usage'), 'Extensions includes Key Usage');
    framework.assertTrue(cert.keyUsageDetails !== null, 'Key Usage details exist');
    framework.assertEqual(cert.keyUsageDetails.critical, true, 'Key Usage is critical');
    framework.assertTrue(Array.isArray(cert.keyUsageDetails.usages), 'Key Usage usages is an array');
    framework.assertTrue(cert.keyUsageDetails.usages.includes('Signing'), 'Key Usage includes Signing');
    framework.assertTrue(cert.keyUsageDetails.usages.includes('Key Encipherment'), 'Key Usage includes Key Encipherment');
    framework.assertTrue(cert.extensions.includes('Extended Key Usage'), 'Extensions includes Extended Key Usage');
    framework.assertTrue(cert.extensions.includes('Basic Constraints'), 'Extensions includes Basic Constraints');
    framework.assertTrue(cert.basicConstraintsDetails !== null, 'Basic Constraints details exist');
    framework.assertEqual(cert.basicConstraintsDetails.critical, true, 'Basic Constraints is critical');
    framework.assertEqual(cert.basicConstraintsDetails.isCA, false, 'Certificate is not a CA');
    framework.assertTrue(cert.extensions.includes('Subject Key Identifier'), 'Extensions includes Subject Key Identifier');
    framework.assertTrue(cert.subjectKeyIdDetails !== null, 'Subject Key Identifier details exist');
    framework.assertEqual(cert.subjectKeyIdDetails.critical, false, 'Subject Key Identifier is not critical');
    framework.assertEqual(cert.subjectKeyIdDetails.keyId, '58:c9:b2:aa:68:e6:a5:48:cc:d8:2b:e8:42:b2:bf:7f:be:45:66:68', 'Subject Key ID matches');
    framework.assertTrue(cert.extensions.includes('Authority Key Identifier'), 'Extensions includes Authority Key Identifier');
    framework.assertTrue(cert.authorityKeyIdDetails !== null, 'Authority Key Identifier details exist');
    framework.assertEqual(cert.authorityKeyIdDetails.critical, false, 'Authority Key Identifier is not critical');
    framework.assertEqual(cert.authorityKeyIdDetails.keyId, 'c5:cf:46:a4:ea:f4:c3:c0:7a:6c:95:c4:2d:b0:5e:92:2f:26:e3:b9', 'Authority Key ID matches');
    framework.assertTrue(cert.extensions.includes('Authority Information Access'), 'Extensions includes Authority Information Access');
    framework.assertTrue(cert.authorityInfoAccessDetails !== null, 'Authority Information Access details exist');
    framework.assertEqual(cert.authorityInfoAccessDetails.critical, false, 'Authority Information Access is not critical');
    framework.assertTrue(Array.isArray(cert.authorityInfoAccessDetails.caIssuers), 'AIA caIssuers is an array');
    framework.assertTrue(cert.authorityInfoAccessDetails.caIssuers.includes('http://r11.i.lencr.org/'), 'AIA includes CA Issuer URI');
    framework.assertTrue(cert.extensions.includes('Certificate Policies'), 'Extensions includes Certificate Policies');
    framework.assertTrue(cert.certificatePoliciesDetails !== null, 'Certificate Policies details exist');
    framework.assertEqual(cert.certificatePoliciesDetails.critical, false, 'Certificate Policies is not critical');
    framework.assertTrue(Array.isArray(cert.certificatePoliciesDetails.policies), 'Certificate Policies is an array');
    framework.assertTrue(cert.certificatePoliciesDetails.policies.includes('2.23.140.1.2.1'), 'Certificate Policies includes OID 2.23.140.1.2.1');
    framework.assertTrue(cert.extensions.includes('CRL Distribution Points'), 'Extensions includes CRL Distribution Points');
    framework.assertTrue(cert.crlDistributionPointsDetails !== null, 'CRL Distribution Points details exist');
    framework.assertEqual(cert.crlDistributionPointsDetails.critical, false, 'CRL Distribution Points is not critical');
    framework.assertTrue(Array.isArray(cert.crlDistributionPointsDetails.uris), 'CRL Distribution Points URIs is an array');
    framework.assertTrue(cert.crlDistributionPointsDetails.uris.includes('http://r11.c.lencr.org/78.crl'), 'CRL Distribution Points includes URI');
    framework.assertTrue(cert.extensions.includes('Subject Alternative Name'), 'Extensions includes Subject Alternative Name');
    framework.assertTrue(cert.subjectAltName !== null, 'Subject Alternative Name details exist');
    framework.assertTrue(Array.isArray(cert.subjectAltName), 'SAN is an array');
    framework.assertTrue(cert.subjectAltName.includes('neo01.com'), 'SAN includes neo01.com');
    framework.assertTrue(cert.subjectAltName.includes('www.neo01.com'), 'SAN includes www.neo01.com');
    framework.assertTrue(cert.fingerprint.includes(':'), 'Fingerprint contains colons');
    framework.assertTrue(cert.keyUsage.length > 0, 'Key usage string is not empty'); 
});
