// URL Encoder/Decoder - Converted from IT-Tools
class UrlEncoder {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.result = document.getElementById('result');
        
        this.init();
    }
    
    init() {
        // Auto-encode on input
        this.textInput.addEventListener('input', () => this.autoEncode());
        this.autoEncode();
    }
    
    autoEncode() {
        const text = this.textInput.value;
        if (text) {
            this.result.textContent = encodeURIComponent(text);
        } else {
            this.result.textContent = '';
        }
    }
    
    encode(text) {
        return encodeURIComponent(text);
    }
    
    decode(text) {
        try {
            return decodeURIComponent(text);
        } catch (e) {
            return 'Invalid URL encoding';
        }
    }
}

// Global functions for buttons
function encodeText() {
    const textInput = document.getElementById('textInput');
    const result = document.getElementById('result');
    const text = textInput.value;
    
    if (text) {
        result.textContent = encodeURIComponent(text);
    }
}

function decodeText() {
    const textInput = document.getElementById('textInput');
    const result = document.getElementById('result');
    const text = textInput.value;
    
    if (text) {
        try {
            result.textContent = decodeURIComponent(text);
        } catch (e) {
            result.textContent = 'Invalid URL encoding';
        }
    }
}

function copyResult() {
    const result = document.getElementById('result');
    const text = result.textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess();
        }).catch(err => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
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
        showCopySuccess();
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess() {
    const btn = document.querySelector('.copy-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#28a745';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#007acc';
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UrlEncoder();
});