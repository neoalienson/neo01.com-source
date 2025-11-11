framework.test('Single certificate displays subject and issuer', () => {
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
    
    framework.assertTrue(cert.subject !== undefined, 'Subject should be defined');
    framework.assertTrue(cert.subject.length > 0, 'Subject should not be empty');
    framework.assertTrue(cert.subject.includes('CN=neo01.com'), 'Subject should contain CN=neo01.com');
    framework.assertTrue(cert.issuer !== undefined, 'Issuer should be defined');
    framework.assertTrue(cert.issuer.length > 0, 'Issuer should not be empty');
    framework.assertTrue(cert.issuer.includes('CN=R11'), 'Issuer should contain CN=R11');
});
