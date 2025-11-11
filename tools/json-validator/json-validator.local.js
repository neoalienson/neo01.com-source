// JSON Validator & Formatter
class JsonValidator {
    constructor() {
        this.inputJson = document.getElementById('inputJson');
        this.outputJson = document.getElementById('outputJson');
        this.inputStatus = document.getElementById('inputStatus');
        this.outputStatus = document.getElementById('outputStatus');
        this.sortKeys = document.getElementById('sortKeys');
        this.indentSize = document.getElementById('indentSize');
        
        this.init();
    }
    
    init() {
        this.inputJson.addEventListener('input', () => this.validateInput());
        this.validateInput();
    }
    
    validateInput() {
        const input = this.inputJson.value.trim();
        
        if (!input) {
            this.showStatus(this.inputStatus, '', '');
            this.outputJson.value = '';
            this.showStatus(this.outputStatus, '', '');
            return;
        }
        
        try {
            JSON.parse(input);
            this.showStatus(this.inputStatus, 'Valid JSON', 'valid');
        } catch (error) {
            this.showStatus(this.inputStatus, `Invalid JSON: ${error.message}`, 'invalid');
        }
    }
    
    formatJson() {
        const input = this.inputJson.value.trim();
        
        if (!input) {
            this.showStatus(this.outputStatus, 'No input to format', 'invalid');
            return;
        }
        
        try {
            let parsed = JSON.parse(input);
            
            if (this.sortKeys.checked) {
                parsed = this.sortObjectKeys(parsed);
            }
            
            const indent = this.indentSize.value === '\t' ? '\t' : parseInt(this.indentSize.value);
            const formatted = JSON.stringify(parsed, null, indent);
            this.outputJson.value = formatted;
            this.showStatus(this.outputStatus, 'JSON formatted successfully', 'valid');
        } catch (error) {
            this.outputJson.value = '';
            this.showStatus(this.outputStatus, `Cannot format: ${error.message}`, 'invalid');
        }
    }
    
    minifyJson() {
        const input = this.inputJson.value.trim();
        
        if (!input) {
            this.showStatus(this.outputStatus, 'No input to minify', 'invalid');
            return;
        }
        
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            this.outputJson.value = minified;
            this.showStatus(this.outputStatus, 'JSON minified successfully', 'valid');
        } catch (error) {
            this.outputJson.value = '';
            this.showStatus(this.outputStatus, `Cannot minify: ${error.message}`, 'invalid');
        }
    }
    
    sortObjectKeys(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        } else if (obj !== null && typeof obj === 'object') {
            const sorted = {};
            Object.keys(obj).sort().forEach(key => {
                sorted[key] = this.sortObjectKeys(obj[key]);
            });
            return sorted;
        }
        return obj;
    }
    
    showStatus(element, message, type) {
        element.textContent = message;
        element.className = `status ${type}`;
        
        if (!message) {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }
}

// Global functions for button clicks
function formatJson() {
    window.jsonValidator.formatJson();
}

function minifyJson() {
    window.jsonValidator.minifyJson();
}

function clearInput() {
    document.getElementById('inputJson').value = '';
    document.getElementById('outputJson').value = '';
    window.jsonValidator.validateInput();
    window.jsonValidator.showStatus(document.getElementById('outputStatus'), '', '');
}

function copyOutput() {
    const output = document.getElementById('outputJson');
    const text = output.value;
    
    if (!text) {
        window.jsonValidator.showStatus(document.getElementById('outputStatus'), 'Nothing to copy', 'invalid');
        return;
    }
    
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
    const status = document.getElementById('outputStatus');
    window.jsonValidator.showStatus(status, 'Copied to clipboard!', 'valid');
    
    setTimeout(() => {
        window.jsonValidator.showStatus(status, '', '');
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('inputJson')) {
        window.jsonValidator = new JsonValidator();
    }
});