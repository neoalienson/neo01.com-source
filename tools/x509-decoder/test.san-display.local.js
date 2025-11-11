framework.test('SAN displayed after issuer when present', () => {
    const pem = `-----BEGIN CERTIFICATE-----
MIIDqzCCA1CgAwIBAgIQPTOoh5ZKwLYQ0K62CPxa/TAKBggqhkjOPQQDAjA7MQsw
CQYDVQQGEwJVUzEeMBwGA1UEChMVR29vZ2xlIFRydXN0IFNlcnZpY2VzMQwwCgYD
VQQDEwNXRTIwHhcNMjUxMDEzMDgzOTQ4WhcNMjYwMTA1MDgzOTQ3WjAaMRgwFgYD
VQQDEw9tYWlsLmdvb2dsZS5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARv
E25V2Pur2diZ1livBQpKPSvDPMMW0o5zMPNM813NvtL8P/n/vLu8c+J6th2coq+X
jCAzVTaZNk4enrfHVNfOo4ICVTCCAlEwDgYDVR0PAQH/BAQDAgeAMBMGA1UdJQQM
MAoGCCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFK2KdSVRlCDYHiUu
XD3tw1v4mhhBMB8GA1UdIwQYMBaAFHW+xHeuifZEN33PsWgfHRrr3DRZMFgGCCsG
AQUFBwEBBEwwSjAhBggrBgEFBQcwAYYVaHR0cDovL28ucGtpLmdvb2cvd2UyMCUG
CCsGAQUFBzAChhlodHRwOi8vaS5wa2kuZ29vZy93ZTIuY3J0MCwGA1UdEQQlMCOC
D21haWwuZ29vZ2xlLmNvbYIQaW5ib3guZ29vZ2xlLmNvbTATBgNVHSAEDDAKMAgG
BmeBDAECATA2BgNVHR8ELzAtMCugKaAnhiVodHRwOi8vYy5wa2kuZ29vZy93ZTIv
eHV6dDNQVTlGX3cuY3JsMIIBBQYKKwYBBAHWeQIEAgSB9gSB8wDxAHcAlpdkv1VY
l633Q4doNwhCd+nwOtX2pPM2bkakPw/KqcYAAAGZ3PDCZgAABAMASDBGAiEArMPp
084nx9Ne8m3JOiySmKo8ruiyPhMwEH5rupzXZVsCIQCp9WMBoLvNABpIdOqhv3bi
h9IH1pWNojUNH/2eA9bXOgB2AO08S9boBsKkogBX28sk4jgB31Ev7cSGxXAPIN23
Pj/gAAABmdzwxj0AAAQDAEcwRQIhAKVWVF+YtjOczbrHB6awmnLYbMYJpHl3apKN
lrFIjz2bAiBmiQywU6/xY3AY4BtLiRdp33f0NG7KEuzQhWtH08W0FDAKBggqhkjO
PQQDAgNJADBGAiEA+QWs+/7b2rbFY3PnCPJUqHInr9jzVj5vcAUn7AMcctcCIQDp
HW4P1BvhrM1PfDgYCt2LaqOM9/Vpka3maZflPSK73w==
-----END CERTIFICATE-----`;

    const parser = new X509CertificateParser(pem);
    const cert = parser.parseCertificate();
    
    framework.assertTrue(cert.subjectAltName !== null, 'SAN should be present');
    framework.assertTrue(Array.isArray(cert.subjectAltName), 'SAN should be an array');
    framework.assertTrue(cert.subjectAltName.includes('mail.google.com'), 'SAN should include mail.google.com');
    framework.assertTrue(cert.subjectAltName.includes('inbox.google.com'), 'SAN should include inbox.google.com');
});

framework.test('UI displays SAN after issuer', () => {
    if (!window.decoderInstance) {
        window.decoderInstance = new X509Decoder();
    }
    const decoder = window.decoderInstance;
    
    const pem = `-----BEGIN CERTIFICATE-----
MIIDqzCCA1CgAwIBAgIQPTOoh5ZKwLYQ0K62CPxa/TAKBggqhkjOPQQDAjA7MQsw
CQYDVQQGEwJVUzEeMBwGA1UEChMVR29vZ2xlIFRydXN0IFNlcnZpY2VzMQwwCgYD
VQQDEwNXRTIwHhcNMjUxMDEzMDgzOTQ4WhcNMjYwMTA1MDgzOTQ3WjAaMRgwFgYD
VQQDEw9tYWlsLmdvb2dsZS5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARv
E25V2Pur2diZ1livBQpKPSvDPMMW0o5zMPNM813NvtL8P/n/vLu8c+J6th2coq+X
jCAzVTaZNk4enrfHVNfOo4ICVTCCAlEwDgYDVR0PAQH/BAQDAgeAMBMGA1UdJQQM
MAoGCCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFK2KdSVRlCDYHiUu
XD3tw1v4mhhBMB8GA1UdIwQYMBaAFHW+xHeuifZEN33PsWgfHRrr3DRZMFgGCCsG
AQUFBwEBBEwwSjAhBggrBgEFBQcwAYYVaHR0cDovL28ucGtpLmdvb2cvd2UyMCUG
CCsGAQUFBzAChhlodHRwOi8vaS5wa2kuZ29vZy93ZTIuY3J0MCwGA1UdEQQlMCOC
D21haWwuZ29vZ2xlLmNvbYIQaW5ib3guZ29vZ2xlLmNvbTATBgNVHSAEDDAKMAgG
BmeBDAECATA2BgNVHR8ELzAtMCugKaAnhiVodHRwOi8vYy5wa2kuZ29vZy93ZTIv
eHV6dDNQVTlGX3cuY3JsMIIBBQYKKwYBBAHWeQIEAgSB9gSB8wDxAHcAlpdkv1VY
l633Q4doNwhCd+nwOtX2pPM2bkakPw/KqcYAAAGZ3PDCZgAABAMASDBGAiEArMPp
084nx9Ne8m3JOiySmKo8ruiyPhMwEH5rupzXZVsCIQCp9WMBoLvNABpIdOqhv3bi
h9IH1pWNojUNH/2eA9bXOgB2AO08S9boBsKkogBX28sk4jgB31Ev7cSGxXAPIN23
Pj/gAAABmdzwxj0AAAQDAEcwRQIhAKVWVF+YtjOczbrHB6awmnLYbMYJpHl3apKN
lrFIjz2bAiBmiQywU6/xY3AY4BtLiRdp33f0NG7KEuzQhWtH08W0FDAKBggqhkjO
PQQDAgNJADBGAiEA+QWs+/7b2rbFY3PnCPJUqHInr9jzVj5vcAUn7AMcctcCIQDp
HW4P1BvhrM1PfDgYCt2LaqOM9/Vpka3maZflPSK73w==
-----END CERTIFICATE-----`;
    
    decoder.certInput.value = pem;
    decoder.autoDecode();
    
    const container = decoder.output.parentElement;
    const allCertNames = Array.from(container.querySelectorAll('.cert-field .cert-name'))
        .map(el => el.textContent);
    
    const subjectIndex = allCertNames.indexOf('Subject');
    const issuerIndex = allCertNames.indexOf('Issuer');
    const sanIndex = allCertNames.indexOf('Subject Alternative Name');
    
    framework.assertTrue(sanIndex !== -1, 'SAN field should be displayed');
    framework.assertTrue(issuerIndex !== -1 && sanIndex !== -1, 'Both Issuer and SAN should exist');
    framework.assertTrue(issuerIndex < sanIndex, 'SAN should appear after Issuer');
    framework.assertTrue(subjectIndex < issuerIndex, 'Subject should appear before Issuer');
});
