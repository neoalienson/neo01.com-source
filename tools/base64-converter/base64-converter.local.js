class Base64Converter {
    static encode(text, urlSafe = false) {
        try {
            const encoded = btoa(unescape(encodeURIComponent(text)));
            return urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : encoded;
        } catch (error) {
            throw new Error('Failed to encode text');
        }
    }

    static decode(base64, urlSafe = false) {
        try {
            let normalized = base64;
            if (urlSafe) {
                normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
                while (normalized.length % 4) {
                    normalized += '=';
                }
            }
            return decodeURIComponent(escape(atob(normalized)));
        } catch (error) {
            throw new Error('Invalid Base64 string');
        }
    }
}

function encodeText() {
    const input = document.getElementById('inputText').value;
    const urlSafe = document.getElementById('urlSafe').checked;
    const output = document.getElementById('outputText');
    const message = document.getElementById('message');

    if (!input.trim()) {
        showMessage('Please enter text to encode', 'error');
        return;
    }

    try {
        const encoded = Base64Converter.encode(input, urlSafe);
        output.value = encoded;
        showMessage('Text encoded successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function decodeText() {
    const input = document.getElementById('inputText').value;
    const urlSafe = document.getElementById('urlSafe').checked;
    const output = document.getElementById('outputText');
    const message = document.getElementById('message');

    if (!input.trim()) {
        showMessage('Please enter Base64 to decode', 'error');
        return;
    }

    try {
        const decoded = Base64Converter.decode(input, urlSafe);
        output.value = decoded;
        showMessage('Base64 decoded successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function copyOutput() {
    const output = document.getElementById('outputText');
    if (!output.value) {
        showMessage('No output to copy', 'error');
        return;
    }
    
    output.select();
    document.execCommand('copy');
    showMessage('Copied to clipboard', 'success');
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = type;
    setTimeout(() => {
        message.textContent = '';
        message.className = '';
    }, 3000);
}

// Real-time encoding/decoding on input change
const inputText = document.getElementById('inputText');
if (inputText) {
    inputText.addEventListener('input', function() {
        const output = document.getElementById('outputText');
        if (output && output.value) {
            output.value = '';
            const message = document.getElementById('message');
            if (message) message.textContent = '';
        }
    });
}

const urlSafe = document.getElementById('urlSafe');
if (urlSafe) {
    urlSafe.addEventListener('change', function() {
        const output = document.getElementById('outputText');
        if (output && output.value) {
            output.value = '';
            const message = document.getElementById('message');
            if (message) message.textContent = '';
        }
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Base64Converter;
}