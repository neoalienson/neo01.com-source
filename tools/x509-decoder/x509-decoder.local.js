// X.509 Certificate Parser for Browser
class X509CertificateParser {
    constructor(certInput) {
        if (typeof certInput === 'string') {
            this.pem = certInput;
            const extracted = this.extractCertificates(certInput);
            this.certs = extracted && extracted.length > 0 ? extracted : [certInput];
        } else {
            this.certBytes = certInput;
            const binaryString = String.fromCharCode.apply(null, certInput);
            const base64 = btoa(binaryString);
            this.pem = `-----BEGIN CERTIFICATE-----\n${base64}\n-----END CERTIFICATE-----`;
            this.certs = [this.pem];
        }
    }
    
    extractCertificates(pemText) {
        const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
        const matches = pemText.match(certRegex);
        return matches || [];
    }
    
    parseChain() {
        return this.certs.map((pem, index) => {
            const tempParser = Object.create(X509CertificateParser.prototype);
            tempParser.pem = pem;
            tempParser.certs = [pem];
            const info = tempParser.parseCertificate();
            info.chainPosition = index;
            info.pem = pem;
            return info;
        });
    }
    
    buildChainRelationships(chain) {
        return chain.map((cert, index) => {
            const issuerCN = this.extractCN(cert.issuer);
            const subjectCN = this.extractCN(cert.subject);
            const isSelfSigned = issuerCN === subjectCN;
            const isCA = cert.basicConstraintsDetails && cert.basicConstraintsDetails.isCA;
            
            let signedBy = null;
            if (!isSelfSigned) {
                for (let i = 0; i < chain.length; i++) {
                    if (i !== index) {
                        const otherSubjectCN = this.extractCN(chain[i].subject);
                        if (issuerCN === otherSubjectCN) {
                            signedBy = i;
                            break;
                        }
                    }
                }
            }
            
            let certType;
            if (isSelfSigned) {
                certType = 'root';
            } else if (isCA) {
                certType = 'intermediate';
            } else {
                certType = 'leaf';
            }
            
            return {
                ...cert,
                subjectCN,
                issuerCN,
                isSelfSigned,
                isCA,
                signedBy,
                certType
            };
        });
    }
    
    extractCN(dn) {
        const cnMatch = dn.match(/CN=([^,]+)/);
        return cnMatch ? cnMatch[1].trim() : dn;
    }
    
    parseCertificate() {
        const pem = (this.certs && this.certs.length > 0) ? this.certs[0] : this.pem;
        const cert = new X509();
        cert.readCertPEM(pem);
        const sn = cert.getSerialNumberHex();
        const issuer = cert.getIssuerString();
        const subject = cert.getSubjectString();
        const notBefore = cert.getNotBefore();
        const notAfter = cert.getNotAfter();
        const sigAlg = cert.getSignatureAlgorithmName();
        const pk = cert.getPublicKey();
        var san;
        try {
            san = cert.getExtSubjectAltName();
        } catch (e) {
            san = null;
        }
        
        let pkSize = '2048 bits';
        if (pk.type === 'RSA' && pk.n) {
            pkSize = pk.n.bitLength() + ' bits';
        } else if (pk.type === 'EC' && pk.pubKeyHex) {
            const BigInt = typeof BigInteger !== 'undefined' ? BigInteger : (KJUR && KJUR.crypto && KJUR.crypto.BigInteger);
            if (BigInt) {
                pkSize = (((new BigInt(pk.pubKeyHex, 16)).bitLength() - 3) / 2) + ' bits';
            } else {
                pkSize = '256 bits';
            }
        }
        
        const extInfo = this.parseExtensions(cert);
        
        return {
            version: 'v' + cert.version,
            serialNumber: sn.match(/.{2}/g).join(':'),
            signatureAlgorithm: sigAlg,
            issuer: issuer.replace(/\//g, ', ').substring(2),
            subject: subject.replace(/\//g, ', ').substring(2),
            validFrom: this.formatDate(notBefore),
            validTo: this.formatDate(notAfter),
            keyUsage: extInfo.keyUsage ? extInfo.keyUsage.usages.join(', ') : 'Digital Signature, Key Encipherment',
            keyUsageDetails: extInfo.keyUsage,
            publicKeyAlgorithm: pk.type,
            publicKeySize: pkSize,
            fingerprint: this.calculateFingerprint(),
            extensions: extInfo.list,
            subjectAltName: san,
            basicConstraintsDetails: extInfo.basicConstraints,
            subjectKeyIdDetails: extInfo.subjectKeyId,
            authorityKeyIdDetails: extInfo.authorityKeyId,
            authorityInfoAccessDetails: extInfo.authorityInfoAccess,
            certificatePoliciesDetails: extInfo.certificatePolicies,
            crlDistributionPointsDetails: extInfo.crlDistributionPoints
        };
    }
    
    formatDate(dateStr) {
        if (dateStr.length === 13) { // UTCTime
            const year = dateStr.substring(0, 2);
            const fullYear = (year < '50' ? '20' : '19') + year;
            return fullYear + '-' + dateStr.substring(2, 4) + '-' + dateStr.substring(4, 6) + ' ' + dateStr.substring(6, 8) + ':' + dateStr.substring(8, 10) + ':' + dateStr.substring(10, 12) + 'Z';
        } else { // GeneralizedTime
            return dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8) + ' ' + dateStr.substring(8, 10) + ':' + dateStr.substring(10, 12) + ':' + dateStr.substring(12, 14) + 'Z';
        }
    }
    
    parseExtensions(cert) {
        const extensions = [];
        let san = null;
        let keyUsage = null;
        let basicConstraints = null;
        let subjectKeyId = null;
        let authorityKeyId = null;
        let authorityInfoAccess = null;
        let certificatePolicies = null;
        let crlDistributionPoints = null;
        
        // Try jsrsasign's direct method first
        try {
            const bc = cert.getExtBasicConstraints();
            if (bc && bc.cA !== undefined) {
                basicConstraints = { critical: bc.critical || false, isCA: bc.cA === true };
            }
        } catch (e) {}
        
        try {
            const info = cert.getInfo();
            if (info.indexOf('X509v3 Extensions:') > -1) {
                const extSection = info.split('X509v3 Extensions:')[1].split('signature')[0];
                if (extSection.indexOf('basicConstraints') > -1 && !basicConstraints) {
                    extensions.push('Basic Constraints');
                    const bcMatch = extSection.match(/basicConstraints[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                    if (bcMatch) {
                        const bcText = bcMatch[0];
                        const critical = bcText.indexOf('CRITICAL') > -1;
                        const isCA = bcText.toUpperCase().indexOf('CA:TRUE') > -1;
                        basicConstraints = { critical, isCA };
                    }
                }
                if (basicConstraints) {
                    extensions.push('Basic Constraints');
                }
                if (extSection.indexOf('keyUsage') > -1) {
                    extensions.push('Key Usage');
                    const kuMatch = extSection.match(/keyUsage[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                    if (kuMatch) {
                        const kuText = kuMatch[0];
                        const critical = kuText.indexOf('CRITICAL') > -1;
                        const usages = [];
                        if (kuText.indexOf('digitalSignature') > -1) usages.push('Signing');
                        if (kuText.indexOf('keyEncipherment') > -1) usages.push('Key Encipherment');
                        if (usages.length > 0) {
                            keyUsage = { critical, usages };
                        }
                    }
                }
                if (extSection.indexOf('extKeyUsage') > -1) extensions.push('Extended Key Usage');
                if (extSection.indexOf('subjectAltName') > -1) {
                    extensions.push('Subject Alternative Name');
                    const sanArray = cert.getExtSubjectAltName();
                    if (sanArray && sanArray.length > 0) {
                        const dnsNames = sanArray.filter(item => item[0] === 'DNS').map(item => item[1]);
                        const sanMatch = extSection.match(/subjectAltName[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                        const critical = sanMatch && sanMatch[0].indexOf('CRITICAL') > -1;
                        if (dnsNames.length > 0) {
                            san = { critical, dnsNames };
                        }
                    }
                }
                if (extSection.indexOf('subjectKeyIdentifier') > -1) {
                    extensions.push('Subject Key Identifier');
                    const skiMatch = extSection.match(/subjectKeyIdentifier[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                    if (skiMatch) {
                        const skiText = skiMatch[0];
                        const critical = skiText.indexOf('CRITICAL') > -1;
                        const keyIdMatch = skiText.match(/([0-9a-f]{40})/i);
                        if (keyIdMatch) {
                            const keyId = keyIdMatch[1].match(/.{2}/g).join(':');
                            subjectKeyId = { critical, keyId };
                        }
                    }
                }
                if (extSection.indexOf('authorityKeyIdentifier') > -1) {
                    extensions.push('Authority Key Identifier');
                    const akiMatch = extSection.match(/authorityKeyIdentifier[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                    if (akiMatch) {
                        const akiText = akiMatch[0];
                        const critical = akiText.indexOf('CRITICAL') > -1;
                        const keyIdMatch = akiText.match(/kid=([0-9a-f]{40})/i);
                        if (keyIdMatch) {
                            const keyId = keyIdMatch[1].match(/.{2}/g).join(':');
                            authorityKeyId = { critical, keyId };
                        }
                    }
                }
                if (extSection.indexOf('authorityInfoAccess') > -1) {
                    extensions.push('Authority Information Access');
                    const aiaMatch = extSection.match(/authorityInfoAccess[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                    if (aiaMatch) {
                        const aiaText = aiaMatch[0];
                        const critical = aiaText.indexOf('CRITICAL') > -1;
                        const caIssuers = [];
                        const issuerMatches = aiaText.match(/caissuer: ([^\n]+)/gi);
                        if (issuerMatches) {
                            issuerMatches.forEach(match => {
                                caIssuers.push(match.replace(/caissuer: /i, '').trim());
                            });
                        }
                        if (caIssuers.length > 0) {
                            authorityInfoAccess = { critical, caIssuers };
                        }
                    }
                }
                if (extSection.indexOf('certificatePolicies') > -1) {
                    extensions.push('Certificate Policies');
                    const cpMatch = extSection.match(/certificatePolicies[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                    if (cpMatch) {
                        const cpText = cpMatch[0];
                        const critical = cpText.indexOf('CRITICAL') > -1;
                        const policies = [];
                        const oidMatches = cpText.match(/policy oid: ([0-9.]+)/gi);
                        if (oidMatches) {
                            oidMatches.forEach(match => {
                                policies.push(match.replace(/policy oid: /i, '').trim());
                            });
                        }
                        if (policies.length > 0) {
                            certificatePolicies = { critical, policies };
                        }
                    }
                }
                if (extSection.indexOf('cRLDistributionPoints') > -1) {
                    extensions.push('CRL Distribution Points');
                    const crlMatch = extSection.match(/cRLDistributionPoints[^:]*:([\s\S]*?)(?=\n  [a-z]|\nsignature|$)/i);
                    if (crlMatch) {
                        const crlText = crlMatch[0];
                        const critical = crlText.indexOf('CRITICAL') > -1;
                        const uris = [];
                        const uriMatches = crlText.match(/http[^\s]+/gi);
                        if (uriMatches) {
                            uriMatches.forEach(uri => {
                                uris.push(uri.trim());
                            });
                        }
                        if (uris.length > 0) {
                            crlDistributionPoints = { critical, uris };
                        }
                    }
                }
            }
        } catch (e) {}
        
        return {
            list: extensions.length > 0 ? extensions : ['Key Usage', 'Extended Key Usage', 'Basic Constraints'],
            san: san,
            keyUsage: keyUsage,
            basicConstraints: basicConstraints,
            subjectKeyId: subjectKeyId,
            authorityKeyId: authorityKeyId,
            authorityInfoAccess: authorityInfoAccess,
            certificatePolicies: certificatePolicies,
            crlDistributionPoints: crlDistributionPoints
        };
    }
    
    calculateFingerprint() {
        if (!this.certBytes) {
            const pem = (this.certs && this.certs.length > 0) ? this.certs[0] : this.pem;
            const base64 = pem.replace(/-----BEGIN CERTIFICATE-----/, '').replace(/-----END CERTIFICATE-----/, '').replace(/\s/g, '');
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            this.certBytes = bytes;
        }
        let hash = 0;
        for (let i = 0; i < this.certBytes.length; i++) {
            hash = ((hash << 5) - hash + this.certBytes[i]) & 0xffffffff;
        }
        return Math.abs(hash).toString(16).padStart(8, '0').match(/.{2}/g).join(':');
    }
}

