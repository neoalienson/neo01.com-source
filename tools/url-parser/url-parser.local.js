// URL Parser - Converted from IT-Tools
class UrlParser {
    constructor() {
        this.urlInput = document.getElementById('urlInput');
        this.output = document.getElementById('output');
        
        this.init();
    }
    
    init() {
        this.urlInput.addEventListener('input', () => this.parseUrl());
        this.parseUrl();
    }
    
    parseUrl() {
        const urlString = this.urlInput.value || 'https://neo01.com:8080/path/to/page?param1=value1&param2=value2#section';
        this.output.innerHTML = '';
        
        try {
            const url = new URL(urlString);
            
            const components = [
                { name: 'Protocol', value: url.protocol },
                { name: 'Host', value: url.host },
                { name: 'Hostname', value: url.hostname },
                { name: 'Port', value: url.port || 'default' },
                { name: 'Pathname', value: url.pathname },
                { name: 'Search', value: url.search },
                { name: 'Hash', value: url.hash },
                { name: 'Origin', value: url.origin }
            ];
            
            components.forEach(component => {
                if (component.value) {
                    this.createResultDiv(component.name, component.value);
                }
            });
            
            // Parse query parameters
            if (url.search) {
                this.createParamsDiv(url.searchParams);
            }
            
        } catch (error) {
            this.createResultDiv('Error', 'Invalid URL format');
        }
    }
    
    createResultDiv(name, value) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'parse-result';
        resultDiv.innerHTML = `
            <button class="copy-individual" onclick="copyText('${value.replace(/'/g, "\\'")}')">Copy</button>
            <div class="parse-name">${name}</div>
            <div class="parse-output">${value}</div>
        `;
        this.output.appendChild(resultDiv);
    }
    
    createParamsDiv(searchParams) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'parse-result';
        
        let tableHtml = '<table class="params-table"><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>';
        
        for (const [key, value] of searchParams) {
            tableHtml += `<tr><td>${key}</td><td>${value}</td></tr>`;
        }
        
        tableHtml += '</tbody></table>';
        
        resultDiv.innerHTML = `
            <button class="copy-individual" onclick="copyParams()">Copy</button>
            <div class="parse-name">Query Parameters</div>
            <div class="parse-output">${tableHtml}</div>
        `;
        this.output.appendChild(resultDiv);
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

function copyParams() {
    const urlInput = document.getElementById('urlInput');
    try {
        const url = new URL(urlInput.value);
        const params = [];
        for (const [key, value] of url.searchParams) {
            params.push(`${key}=${value}`);
        }
        const text = params.join('\n');
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showCopySuccess(event.target);
            }).catch(err => {
                fallbackCopyTextToClipboard(text, event.target);
            });
        } else {
            fallbackCopyTextToClipboard(text, event.target);
        }
    } catch (error) {
        console.error('Error copying params:', error);
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
    new UrlParser();
});