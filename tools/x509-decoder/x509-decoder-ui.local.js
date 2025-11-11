// X.509 Certificate Decoder UI
class X509Decoder {
    constructor() {
        this.certInput = document.getElementById('certInput');
        this.output = document.getElementById('output');
        this.dropZone = document.getElementById('dropZone');
        this.certFile = document.getElementById('certFile');
        this.fileInfo = document.getElementById('fileInfo');
        
        this.init();
    }
    
    init() {
        this.certInput.addEventListener('input', () => this.autoDecode());
        
        // File input change event
        this.certFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
        
        // Drop zone click event
        this.dropZone.addEventListener('click', () => {
            this.certFile.click();
        });
        
        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });
        
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
    }
    
    handleFileUpload(file) {
        const container = this.output.parentElement;
        container.querySelectorAll('.cert-result').forEach(el => {
            if (el.id !== 'textOutput') el.remove();
        });
        this.currentChain = null;
        this.showFileInfo(file);
        
        const reader = new FileReader();
        const fileName = file.name.toLowerCase();
        
        // Determine if file is binary (DER) or text (PEM)
        if (fileName.endsWith('.der')) {
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const bytes = new Uint8Array(arrayBuffer);
                const parser = new X509CertificateParser(bytes);
                this.certInput.value = parser.pem;
                this.decodeCertificate(parser.pem);
            };
            reader.readAsArrayBuffer(file);
        } else {
            // PEM, CRT, CER - read as text
            reader.onload = (e) => {
                const text = e.target.result;
                this.certInput.value = text;
                this.decodeCertificate(text);
            };
            reader.readAsText(file);
        }
    }
    
    showFileInfo(file) {
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        this.fileInfo.innerHTML = `
            <div><strong>File Name:</strong> ${file.name}</div>
            <div><strong>File Size:</strong> ${formatBytes(file.size)}</div>
            <div><strong>Last Modified:</strong> ${new Date(file.lastModified).toLocaleString()}</div>
        `;
        this.fileInfo.style.display = 'block';
    }
    
    autoDecode() {
        const container = this.output.parentElement;
        container.querySelectorAll('.cert-result').forEach(el => {
            if (el.id !== 'textOutput') el.remove();
        });
        this.currentChain = null;
        const cert = this.certInput.value.trim();
        if (cert && cert.includes('BEGIN CERTIFICATE')) {
            this.decodeCertificate(cert);
        } else {
            this.output.innerHTML = '';
            document.getElementById('textOutput').style.display = 'none';
        }
    }
    
    decodeCertificate(pemCert) {
        try {
            const parser = new X509CertificateParser(pemCert);
            const chain = parser.parseChain();
            
            if (chain.length > 1) {
                const chainWithRelations = parser.buildChainRelationships(chain);
                this.displayChain(chainWithRelations);
            } else {
                const certInfo = parser.parseCertificate();
                this.displayResults(certInfo, true);
            }
        } catch (error) {
            this.showError('Invalid certificate format or parsing error');
        }
    }
    
    calculateFingerprint(bytes) {
        // Simplified fingerprint calculation
        let hash = 0;
        for (let i = 0; i < bytes.length; i++) {
            hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
        }
        return Math.abs(hash).toString(16).padStart(8, '0').match(/.{2}/g).join(':');
    }
    
    displayChain(chain) {
        this.output.innerHTML = '';
        this.currentChain = chain;
        
        const container = this.output.parentElement;
        
        // Display chain summary
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'cert-result';
        summaryDiv.innerHTML = `
            <div class="cert-name">Certificate Chain (${chain.length} certificates)</div>
            <div class="cert-output">${chain.map((c, i) => `${i + 1}. ${c.certType.toUpperCase()}: ${c.subjectCN}`).join('<br>')}</div>
        `;
        container.insertBefore(summaryDiv, this.output);
        
        // Display Mermaid diagram
        this.displayMermaidDiagram(chain, container);
        
        // Display each certificate
        chain.forEach((cert, index) => {
            const certSection = document.createElement('div');
            certSection.className = 'cert-result';
            certSection.style.marginTop = '20px';
            certSection.innerHTML = `<div class="cert-name" style="font-size: 1.2em; font-weight: bold; margin-bottom: 15px;">Certificate #${index + 1} - ${cert.certType.toUpperCase()}</div>`;
            
            const fieldsContainer = document.createElement('div');
            fieldsContainer.style.display = 'flex';
            fieldsContainer.style.flexDirection = 'column';
            fieldsContainer.style.gap = '5px';
            certSection.appendChild(fieldsContainer);
            
            container.insertBefore(certSection, this.output);
            
            const originalOutput = this.output;
            this.output = fieldsContainer;
            this.displayResults(cert, true);
            this.output = originalOutput;
        });
        
        // Display text output for entire chain
        const textOutput = document.getElementById('textOutput');
        const textContent = document.getElementById('textContent');
        textContent.textContent = this.generateChainTextOutput();
        textOutput.style.display = 'block';
    }
    
    displayMermaidDiagram(chain, container) {
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'cert-result';
        
        let mermaidCode = 'graph TD\n';
        
        chain.forEach((cert, index) => {
            const id = `cert${index}`;
            const icon = cert.certType === 'root' ? '🔐' : (cert.certType === 'leaf' ? '📄' : '🔒');
            const label = `${icon} ${cert.certType.toUpperCase()}<br/>${cert.subjectCN}<br/>${cert.validFrom} to ${cert.validTo}`;
            
            mermaidCode += `    ${id}["${label}"]\n`;
            
            if (cert.signedBy !== null) {
                mermaidCode += `    cert${cert.signedBy} -->|Signs| ${id}\n`;
            }
        });
        
        // Add styling
        chain.forEach((cert, index) => {
            const id = `cert${index}`;
            if (cert.certType === 'root') {
                mermaidCode += `    style ${id} fill:#e8f5e9,stroke:#4caf50,stroke-width:3px\n`;
            } else if (cert.certType === 'intermediate') {
                mermaidCode += `    style ${id} fill:#fff3e0,stroke:#ff9800,stroke-width:2px\n`;
            } else {
                mermaidCode += `    style ${id} fill:#e3f2fd,stroke:#2196f3,stroke-width:2px\n`;
            }
        });
        
        mermaidDiv.innerHTML = `
            <div class="cert-name">Certificate Chain Visualization</div>
            <div class="cert-output" style="background: white;">
                <pre class="mermaid">${mermaidCode}</pre>
            </div>
        `;
        container.insertBefore(mermaidDiv, this.output);
        
        // Reinitialize mermaid if available
        if (typeof mermaid !== 'undefined') {
            mermaid.init(undefined, mermaidDiv.querySelector('.mermaid'));
        }
    }
    
    displayResults(certInfo, includeSubjectIssuer = false) {
        if (!this.currentChain) {
            this.output.innerHTML = '';
        }
        this.currentCertInfo = certInfo;
        
        const formatDN = (dn) => {
            const parts = dn.split(', ');
            const cnIndex = parts.findIndex(p => p.startsWith('CN='));
            if (cnIndex !== -1) {
                const cn = parts[cnIndex];
                const others = parts.filter((_, i) => i !== cnIndex);
                return others.length > 0 ? others.join(', ') + ',\n' + cn : cn;
            }
            return dn;
        };
        
        const buildRows = () => {
            const baseRows = [
                [{ name: 'Subject', value: formatDN(certInfo.subject) }],
                [{ name: 'Issuer', value: formatDN(certInfo.issuer) }]
            ];
            
            if (certInfo.subjectAltName && Array.isArray(certInfo.subjectAltName)) {
                baseRows.push([{ name: 'Subject Alternative Name', value: certInfo.subjectAltName.join(', ') }]);
            }
            
            baseRows.push(
                [{ name: 'Valid From', value: certInfo.validFrom }, { name: 'Valid To', value: certInfo.validTo }],
                [{ name: 'Signature Algorithm', value: certInfo.signatureAlgorithm }, { name: 'Public Key Algorithm', value: certInfo.publicKeyAlgorithm }],
                [{ name: 'Public Key Size', value: certInfo.publicKeySize }, { name: 'Key Usage', value: certInfo.keyUsage }],
                [{ name: 'Extensions', value: certInfo.extensions.join(', ') }],
                [{ name: 'Serial Number', value: certInfo.serialNumber }],
                [{ name: 'Version', value: certInfo.version }, { name: 'Fingerprint (SHA-1)', value: certInfo.fingerprint }]
            );
            
            return baseRows;
        };
        
        const rows = includeSubjectIssuer ? buildRows() : [
            [{ name: 'Valid From', value: certInfo.validFrom }, { name: 'Valid To', value: certInfo.validTo }],
            [{ name: 'Signature Algorithm', value: certInfo.signatureAlgorithm }, { name: 'Public Key Algorithm', value: certInfo.publicKeyAlgorithm }],
            [{ name: 'Public Key Size', value: certInfo.publicKeySize }, { name: 'Key Usage', value: certInfo.keyUsage }],
            [{ name: 'Extensions', value: certInfo.extensions.join(', ') }],
            [{ name: 'Serial Number', value: certInfo.serialNumber }],
            [{ name: 'Version', value: certInfo.version }, { name: 'Fingerprint (SHA-1)', value: certInfo.fingerprint }]
        ];
        
        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'cert-row';
            if (row.length === 2) {
                rowDiv.setAttribute('data-cols', '2');
            }
            row.forEach(field => {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'cert-field';
                fieldDiv.innerHTML = `
                    <div class="cert-name">${field.name}</div>
                    <div class="cert-output">${field.value}</div>
                    <button class="copy-individual" onclick="copyText('${field.value}')">📋</button>
                `;
                rowDiv.appendChild(fieldDiv);
            });
            this.output.appendChild(rowDiv);
        });
        
        // Display text output
        const textOutput = document.getElementById('textOutput');
        const textContent = document.getElementById('textContent');
        textContent.textContent = this.generateTextOutput();
        textOutput.style.display = 'block';
    }
    
    generateChainTextOutput() {
        if (!this.currentChain) return this.generateTextOutput();
        
        let output = `X.509 Certificate Chain Information\n====================================\n\n`;
        output += `Total Certificates: ${this.currentChain.length}\n\n`;
        
        this.currentChain.forEach((cert, index) => {
            output += `\n${'='.repeat(60)}\n`;
            output += `Certificate #${index + 1} - ${cert.certType.toUpperCase()}\n`;
            output += `${'='.repeat(60)}\n\n`;
            
            this.currentCertInfo = cert;
            output += this.generateTextOutput();
            output += '\n';
        });
        
        return output;
    }
    
    generateTextOutput() {
        if (!this.currentCertInfo) return '';
        
        const info = this.currentCertInfo;
        let output = `X.509 Certificate Information
=============================

Version: ${info.version}
Serial Number: ${info.serialNumber}
Signature Algorithm: ${info.signatureAlgorithm}
Issuer: ${info.issuer}
Subject: ${info.subject}
Valid From: ${info.validFrom}
Valid To: ${info.validTo}
Public Key Algorithm: ${info.publicKeyAlgorithm}
Public Key Size: ${info.publicKeySize}
Fingerprint (SHA-1): ${info.fingerprint}

Extensions:
-----------
`;
        
        if (info.keyUsageDetails) {
            output += `\nKey Usage (${info.keyUsageDetails.critical ? 'Critical' : 'Not Critical'}):\n`;
            info.keyUsageDetails.usages.forEach(usage => {
                output += `  - ${usage}\n`;
            });
        }
        
        if (info.basicConstraintsDetails) {
            output += `\nBasic Constraints (${info.basicConstraintsDetails.critical ? 'Critical' : 'Not Critical'}):\n`;
            output += `  CA: ${info.basicConstraintsDetails.isCA ? 'TRUE' : 'FALSE'}\n`;
        }
        
        if (info.subjectKeyIdDetails) {
            output += `\nSubject Key Identifier (${info.subjectKeyIdDetails.critical ? 'Critical' : 'Not Critical'}):\n`;
            output += `  ${info.subjectKeyIdDetails.keyId}\n`;
        }
        
        if (info.authorityKeyIdDetails) {
            output += `\nAuthority Key Identifier (${info.authorityKeyIdDetails.critical ? 'Critical' : 'Not Critical'}):\n`;
            output += `  ${info.authorityKeyIdDetails.keyId}\n`;
        }
        
        if (info.subjectAltName) {
            const san = info.subjectAltName;
            if (Array.isArray(san)) {
                output += `\nSubject Alternative Name:\n`;
                san.forEach(item => {
                    output += `  ${item}\n`;
                });
            } else if (san.dnsNames) {
                output += `\nSubject Alternative Name (${san.critical ? 'Critical' : 'Not Critical'}):\n`;
                san.dnsNames.forEach(dns => {
                    output += `  DNS: ${dns}\n`;
                });
            }
        }
        
        if (info.authorityInfoAccessDetails) {
            output += `\nAuthority Information Access (${info.authorityInfoAccessDetails.critical ? 'Critical' : 'Not Critical'}):\n`;
            info.authorityInfoAccessDetails.caIssuers.forEach(uri => {
                output += `  CA Issuers: ${uri}\n`;
            });
        }
        
        if (info.certificatePoliciesDetails) {
            output += `\nCertificate Policies (${info.certificatePoliciesDetails.critical ? 'Critical' : 'Not Critical'}):\n`;
            info.certificatePoliciesDetails.policies.forEach(policy => {
                output += `  Policy OID: ${policy}\n`;
            });
        }
        
        if (info.crlDistributionPointsDetails) {
            output += `\nCRL Distribution Points (${info.crlDistributionPointsDetails.critical ? 'Critical' : 'Not Critical'}):\n`;
            info.crlDistributionPointsDetails.uris.forEach(uri => {
                output += `  URI: ${uri}\n`;
            });
        }
        
        if (!this.currentChain) {
            output += `\nGenerated on: ${new Date().toISOString()}`;
        }
        return output;
    }
    
    showError(message) {
        this.output.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'cert-result error';
        errorDiv.innerHTML = `
            <div class="cert-name">Error</div>
            <div class="cert-output">${message}</div>
        `;
        this.output.appendChild(errorDiv);
    }
}

// Global functions
function clearAll() {
    if (window.decoderInstance) {
        document.getElementById('certInput').value = '';
        document.getElementById('certFile').value = '';
        const output = document.getElementById('output');
        output.innerHTML = '';
        const container = output.parentElement;
        container.querySelectorAll('.cert-result').forEach(el => {
            if (el.id !== 'textOutput') el.remove();
        });
        document.getElementById('textOutput').style.display = 'none';
        document.getElementById('fileInfo').style.display = 'none';
        window.decoderInstance.currentChain = null;
        const certInput = document.getElementById('certInput');
        certInput.focus();
        certInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function copyTextOutput() {
    const textContent = document.getElementById('textContent').textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textContent).then(() => {
            showCopySuccess(event.target);
        }).catch(err => {
            fallbackCopyTextToClipboard(textContent, event.target);
        });
    } else {
        fallbackCopyTextToClipboard(textContent, event.target);
    }
}

function copyText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess(event.target);
        }).catch(err => {
            fallbackCopyTextToClipboard(text, event.target);
        });
    } else {
        fallbackCopyTextToClipboard(text, event.target);
    }
}

function fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess(button);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess(button) {
    const originalText = button.textContent;
    button.textContent = '✅';
    button.style.background = '#28a745';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#007acc';
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('certInput')) {
        window.decoderInstance = new X509Decoder();
    }
});
