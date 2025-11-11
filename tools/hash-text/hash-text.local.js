// Hash Text - Converted from IT-Tools
class HashText {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.output = document.getElementById('output');
        
        this.hashFunctions = [
            { name: 'MD5', fn: this.md5Hash },
            { name: 'SHA1', fn: this.sha1Hash },
            { name: 'SHA256', fn: this.sha256Hash },
            { name: 'SHA512', fn: this.sha512Hash },
            { name: 'SHA3-256', fn: this.sha3_256Hash },
            { name: 'SHA3-512', fn: this.sha3_512Hash },
            { name: 'RIPEMD160', fn: this.ripemd160Hash }
        ];
        
        this.init();
    }
    
    init() {
        this.textInput.addEventListener('input', () => this.generateAllHashes());
        this.generateAllHashes();
    }
    
    generateAllHashes() {
        const text = this.textInput.value || 'Hello World!';
        this.output.innerHTML = '';
        
        this.hashFunctions.forEach(hashType => {
            const result = hashType.fn.call(this, text);
            const hashDiv = document.createElement('div');
            hashDiv.className = 'hash-result';
            hashDiv.innerHTML = `
                <button class="copy-individual" onclick="copyText('${result}')">Copy</button>
                <div class="hash-name">${hashType.name}</div>
                <div class="hash-output">${result}</div>
            `;
            this.output.appendChild(hashDiv);
        });
    }
    
    // Hash functions using CryptoJS
    md5Hash(text) {
        return CryptoJS.MD5(text).toString();
    }
    
    sha1Hash(text) {
        return CryptoJS.SHA1(text).toString();
    }
    
    sha256Hash(text) {
        return CryptoJS.SHA256(text).toString();
    }
    
    sha512Hash(text) {
        return CryptoJS.SHA512(text).toString();
    }
    
    sha3_256Hash(text) {
        return CryptoJS.SHA3(text, { outputLength: 256 }).toString();
    }
    
    sha3_512Hash(text) {
        return CryptoJS.SHA3(text, { outputLength: 512 }).toString();
    }
    
    ripemd160Hash(text) {
        return CryptoJS.RIPEMD160(text).toString();
    }
}

// Copy individual result to clipboard
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
    button.textContent = 'Copied!';
    button.style.background = '#28a745';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#007acc';
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HashText();
});