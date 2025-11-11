// Case Converter - Converted from IT-Tools
class CaseConverter {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.output = document.getElementById('output');
        
        this.cases = [
            { name: 'camelCase', fn: this.toCamelCase },
            { name: 'PascalCase', fn: this.toPascalCase },
            { name: 'snake_case', fn: this.toSnakeCase },
            { name: 'Pascal_Snake_Case', fn: this.toPascalSnakeCase },
            { name: 'kebab-case', fn: this.toKebabCase },
            { name: 'Pascal-Kebab-Case', fn: this.toPascalKebabCase },
            { name: 'CONSTANT_CASE', fn: this.toConstantCase },
            { name: 'dot.case', fn: this.toDotCase },
            { name: 'path/case', fn: this.toPathCase },
            { name: 'Title Case', fn: this.toTitleCase },
            { name: 'Sentence case', fn: this.toSentenceCase },
            { name: 'UPPER CASE', fn: this.toUpperCase },
            { name: 'lower case', fn: this.toLowerCase },
            { name: 'aLtErNaTiNg CaSe', fn: this.toAlternatingCase },
            { name: 'InVeRsE CaSe', fn: this.toInverseCase }
        ];
        
        this.init();
    }
    
    init() {
        this.textInput.addEventListener('input', () => this.convertAllCases());
        this.convertAllCases();
    }
    
    convertAllCases() {
        const text = this.textInput.value || 'Hello World! This is a Sample Text.';
        this.output.innerHTML = '';
        
        this.cases.forEach(caseType => {
            const result = caseType.fn.call(this, text);
            const caseDiv = document.createElement('div');
            caseDiv.className = 'case-result';
            caseDiv.innerHTML = `
                <button class="copy-individual" onclick="copyText('${result.replace(/'/g, "\\'")}')">Copy</button>
                <div class="case-name">${caseType.name}</div>
                <div class="case-output">${result}</div>
            `;
            this.output.appendChild(caseDiv);
        });
    }
    
    // Case conversion functions
    toCamelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '').replace(/[^\w]/g, '');
    }
    
    toPascalCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
            return word.toUpperCase();
        }).replace(/\s+/g, '').replace(/[^\w]/g, '');
    }
    
    toSnakeCase(str) {
        return str.replace(/\W+/g, ' ')
            .split(/ |\B(?=[A-Z])/)
            .map(word => word.toLowerCase())
            .join('_');
    }
    
    toKebabCase(str) {
        return str.replace(/\W+/g, ' ')
            .split(/ |\B(?=[A-Z])/)
            .map(word => word.toLowerCase())
            .join('-');
    }
    
    toConstantCase(str) {
        return this.toSnakeCase(str).toUpperCase();
    }
    
    toDotCase(str) {
        return str.replace(/\W+/g, ' ')
            .split(/ |\B(?=[A-Z])/)
            .map(word => word.toLowerCase())
            .join('.');
    }
    
    toPathCase(str) {
        return str.replace(/\W+/g, ' ')
            .split(/ |\B(?=[A-Z])/)
            .map(word => word.toLowerCase())
            .join('/');
    }
    
    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
    
    toSentenceCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    toUpperCase(str) {
        return str.toUpperCase();
    }
    
    toLowerCase(str) {
        return str.toLowerCase();
    }
    
    toAlternatingCase(str) {
        return str.split('').map((char, index) => {
            return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
        }).join('');
    }
    
    toInverseCase(str) {
        return str.split('').map(char => {
            return char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
        }).join('');
    }
    
    toPascalSnakeCase(str) {
        return str.replace(/\W+/g, ' ')
            .split(/ |\B(?=[A-Z])/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('_');
    }
    
    toPascalKebabCase(str) {
        return str.replace(/\W+/g, ' ')
            .split(/ |\B(?=[A-Z])/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('-');
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
    new CaseConverter();
});