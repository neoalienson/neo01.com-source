// UI Behavior Tests
// Define test certificates
if (!window.testCerts) {
    window.testCerts = {
        single: `-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----`,
        github: `-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----`
    };
}

const uiBehaviorTests = [
    {
        name: 'Clear previous results on new input',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            const container = decoder.output.parentElement;
            
            // First decode
            decoder.certInput.value = window.testCerts.github;
            decoder.autoDecode();
            
            const firstResultCount = container.querySelectorAll('.cert-result').length;
            framework.assertTrue(firstResultCount > 0, 'Should have results after first decode');
            
            // Second decode with different cert
            decoder.certInput.value = window.testCerts.single;
            decoder.autoDecode();
            
            const secondResultCount = container.querySelectorAll('.cert-result').length;
            framework.assertTrue(secondResultCount > 0, 'Should have results after second decode');
            
            // Verify old results are cleared (no duplicate chain elements)
            const chainSummaries = container.querySelectorAll('.cert-result .cert-name');
            const chainCount = Array.from(chainSummaries).filter(el => 
                el.textContent.includes('Certificate Chain')
            ).length;
            framework.assertTrue(chainCount <= 1, 'Should not have duplicate chain summaries');
        }
    },
    {
        name: 'Clear results when input is empty',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            const container = decoder.output.parentElement;
            
            // Decode first
            decoder.certInput.value = window.testCerts.single;
            decoder.autoDecode();
            
            framework.assertTrue(decoder.output.children.length > 0, 'Should have output after decode');
            
            // Clear input
            decoder.certInput.value = '';
            decoder.autoDecode();
            
            framework.assertEqual(decoder.output.innerHTML, '', 'Output should be empty');
            const textOutput = document.getElementById('textOutput');
            framework.assertEqual(textOutput.style.display, 'none', 'Text output should be hidden');
        }
    },
    {
        name: 'clearAll() clears all results and focuses input',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            const container = decoder.output.parentElement;
            
            // Setup
            decoder.certInput.value = window.testCerts.github;
            decoder.autoDecode();
            
            // Clear
            clearAll();
            
            framework.assertEqual(decoder.certInput.value, '', 'Input should be empty');
            framework.assertEqual(decoder.output.innerHTML, '', 'Output should be empty');
            framework.assertEqual(decoder.currentChain, null, 'Current chain should be null');
            
            const certResults = container.querySelectorAll('.cert-result');
            const nonTextOutput = Array.from(certResults).filter(el => el.id !== 'textOutput');
            framework.assertEqual(nonTextOutput.length, 0, 'All cert-result elements should be removed except textOutput');
            
            const textOutput = document.getElementById('textOutput');
            framework.assertEqual(textOutput.style.display, 'none', 'Text output should be hidden');
        }
    },
    {
        name: 'DN formatting shows CN last with comma',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            
            decoder.certInput.value = window.testCerts.github;
            decoder.autoDecode();
            
            // Find Subject field
            const certNames = decoder.output.querySelectorAll('.cert-name');
            let subjectOutput = null;
            certNames.forEach(name => {
                if (name.textContent === 'SUBJECT') {
                    subjectOutput = name.nextElementSibling;
                }
            });
            
            if (subjectOutput) {
                const text = subjectOutput.textContent;
                const lines = text.split('\n');
                if (lines.length > 1) {
                    framework.assertTrue(lines[0].endsWith(','), 'First line should end with comma');
                    framework.assertTrue(lines[1].startsWith('CN='), 'Second line should start with CN=');
                }
            }
        }
    },
    {
        name: 'Copy buttons use correct classes and sizes',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            
            decoder.certInput.value = window.testCerts.single;
            decoder.autoDecode();
            
            // Check individual copy buttons (emoji)
            const individualButtons = document.querySelectorAll('.copy-individual');
            framework.assertTrue(individualButtons.length > 0, 'Should have individual copy buttons');
            
            const firstButton = individualButtons[0];
            framework.assertTrue(firstButton.classList.contains('copy-individual'), 'Button should have copy-individual class');
            framework.assertEqual(firstButton.textContent, '📋', 'Individual copy button should show clipboard emoji');
            
            // Check action copy buttons (text)
            const actionButtons = document.querySelectorAll('.copy-action');
            if (actionButtons.length > 0) {
                framework.assertTrue(actionButtons[0].classList.contains('copy-action'), 'Button should have copy-action class');
            }
        }
    },
    {
        name: 'Certificate fields displayed in correct order',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            
            decoder.certInput.value = window.testCerts.github;
            decoder.autoDecode();
            
            // For chain, fields are in certificate sections, not in decoder.output
            const container = decoder.output.parentElement;
            const allCertNames = Array.from(container.querySelectorAll('.cert-field .cert-name'))
                .map(el => el.textContent);
            
            // Check that Subject and Issuer appear
            const hasSubject = allCertNames.some(name => name === 'Subject');
            const hasIssuer = allCertNames.some(name => name === 'Issuer');
            const hasValidFrom = allCertNames.some(name => name === 'Valid From');
            
            framework.assertTrue(hasSubject, 'Should have Subject field');
            framework.assertTrue(hasIssuer, 'Should have Issuer field');
            framework.assertTrue(hasValidFrom, 'Should have Valid From field');
            
            // Check order within first certificate section
            if (allCertNames.length > 0) {
                const subjectIndex = allCertNames.indexOf('Subject');
                const issuerIndex = allCertNames.indexOf('Issuer');
                if (subjectIndex !== -1 && issuerIndex !== -1) {
                    framework.assertTrue(subjectIndex < issuerIndex, 'Subject should come before Issuer');
                }
            }
        }
    },
    {
        name: 'Chain visualization creates mermaid diagram',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            const container = decoder.output.parentElement;
            
            decoder.certInput.value = window.testCerts.github;
            decoder.autoDecode();
            
            const mermaidElements = container.querySelectorAll('.mermaid');
            framework.assertTrue(mermaidElements.length > 0, 'Should have mermaid diagram for chain');
            
            const mermaidCode = mermaidElements[0].textContent;
            framework.assertTrue(mermaidCode.includes('graph TD'), 'Should be a graph diagram');
            framework.assertTrue(mermaidCode.includes('Signs'), 'Should show signing relationships');
        }
    },
    {
        name: 'Text output is generated and displayed',
        test: () => {
            if (!window.decoderInstance) {
                window.decoderInstance = new X509Decoder();
            }
            const decoder = window.decoderInstance;
            
            decoder.certInput.value = window.testCerts.single;
            decoder.autoDecode();
            
            const textOutput = document.getElementById('textOutput');
            const textContent = document.getElementById('textContent');
            
            framework.assertEqual(textOutput.style.display, 'block', 'Text output should be visible');
            framework.assertTrue(textContent.textContent.length > 0, 'Text content should not be empty');
            framework.assertTrue(textContent.textContent.includes('X.509 Certificate Information'), 'Should contain certificate info header');
        }
    }
];

// Run tests using framework
if (typeof framework !== 'undefined') {
    uiBehaviorTests.forEach(test => {
        framework.test(test.name, test.test);
    });
}
