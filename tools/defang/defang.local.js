class Defanger {
    static defang(text, options = {}) {
        const {
            replaceDots = true,
            replaceHttp = true,
            replaceProtocol = true,
            replacePorts = true
        } = options;

        let result = text;

        if (replaceHttp) {
            result = result.replace(/http/gi, 'hxxp');
        }

        if (replaceProtocol) {
            result = result.replace(/:(\/\/)/g, '[://]');
        }

        if (replacePorts) {
            result = result.replace(/:\/\/(\S+?):(\d+)/g, '://$1[:]$2');
            result = result.replace(/(\S*\.\S+?):(\d+)/g, '$1[:]$2');
        }

        if (replaceDots) {
            result = result.replace(/\./g, '[.]');
        }

        return result;
    }

    static refang(text, options = {}) {
        const {
            replaceDots = true,
            replaceHttp = true,
            replaceProtocol = true,
            replacePorts = true
        } = options;

        let result = text;

        if (replaceDots) {
            result = result.replace(/\[\.\]/g, '.');
        }

        if (replacePorts) {
            result = result.replace(/\[:\](\d+)/g, ':$1');
        }

        if (replaceProtocol) {
            result = result.replace(/\[:\/\/\]/g, '://');
        }

        if (replaceHttp) {
            result = result.replace(/hxxp/gi, 'http');
        }

        return result;
    }
}

function getOptions() {
    return {
        replaceDots: document.getElementById('replaceDots').checked,
        replaceHttp: document.getElementById('replaceHttp').checked,
        replaceProtocol: document.getElementById('replaceProtocol').checked,
        replacePorts: document.getElementById('replacePorts').checked
    };
}

function defangText() {
    const input = document.getElementById('inputText').value;
    const output = document.getElementById('outputText');

    if (!input.trim()) {
        showMessage('Please enter text to defang', 'error');
        return;
    }

    const defanged = Defanger.defang(input, getOptions());
    output.textContent = defanged;
    showMessage('Text defanged successfully', 'success');
}

function refangText() {
    const input = document.getElementById('inputText').value;
    const output = document.getElementById('outputText');

    if (!input.trim()) {
        showMessage('Please enter text to refang', 'error');
        return;
    }

    const refanged = Defanger.refang(input, getOptions());
    output.textContent = refanged;
    showMessage('Text refanged successfully', 'success');
}

function copyOutput() {
    const output = document.getElementById('outputText');
    if (!output.textContent || output.textContent === 'Output will appear here...') {
        showMessage('No output to copy', 'error');
        return;
    }
    
    navigator.clipboard.writeText(output.textContent).then(() => {
        showMessage('Copied to clipboard', 'success');
    }).catch(() => {
        showMessage('Failed to copy', 'error');
    });
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = 'defang-' + type;
    setTimeout(() => {
        message.textContent = '';
        message.className = '';
    }, 3000);
}

(function() {
    const inputText = document.getElementById('inputText');
    if (inputText) {
        inputText.addEventListener('input', function() {
            const output = document.getElementById('outputText');
            if (output && output.textContent !== 'Output will appear here...') {
                output.textContent = 'Output will appear here...';
                const message = document.getElementById('message');
                if (message) message.textContent = '';
            }
        });
    }
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Defanger;
}
