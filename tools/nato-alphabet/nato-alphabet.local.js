// NATO Alphabet Converter
class NatoAlphabetConverter {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.output = document.getElementById('output');
        
        this.natoAlphabet = {
            'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta',
            'E': 'Echo', 'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel',
            'I': 'India', 'J': 'Juliet', 'K': 'Kilo', 'L': 'Lima',
            'M': 'Mike', 'N': 'November', 'O': 'Oscar', 'P': 'Papa',
            'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
            'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray',
            'Y': 'Yankee', 'Z': 'Zulu',
            '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three',
            '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
            '8': 'Eight', '9': 'Nine'
        };
        
        this.formats = [
            { name: 'Standard NATO', fn: this.toStandardNato },
            { name: 'Uppercase NATO', fn: this.toUppercaseNato },
            { name: 'Lowercase NATO', fn: this.toLowercaseNato },
            { name: 'Dash Separated', fn: this.toDashSeparated },
            { name: 'Comma Separated', fn: this.toCommaSeparated },
            { name: 'Phonetic Only', fn: this.toPhoneticOnly }
        ];
        
        this.init();
    }
    
    init() {
        this.textInput.addEventListener('input', () => this.convertAllFormats());
        this.convertAllFormats();
    }
    
    convertAllFormats() {
        const text = this.textInput.value || 'Hello World';
        this.output.innerHTML = '';
        
        this.formats.forEach(format => {
            const result = format.fn.call(this, text);
            const formatDiv = document.createElement('div');
            formatDiv.className = 'nato-result';
            formatDiv.innerHTML = `
                <button class="copy-individual" onclick="copyText('${result.replace(/'/g, "\\'")}')">Copy</button>
                <div class="nato-name">${format.name}</div>
                <div class="nato-output">${result}</div>
            `;
            this.output.appendChild(formatDiv);
        });
    }
    
    toStandardNato(text) {
        return text.toUpperCase().split('').map(char => {
            if (this.natoAlphabet[char]) {
                return `${char} - ${this.natoAlphabet[char]}`;
            } else if (char === ' ') {
                return '[SPACE]';
            } else if (char.match(/[^A-Z0-9]/)) {
                return `${char} - [${char}]`;
            }
            return char;
        }).join('\n');
    }
    
    toUppercaseNato(text) {
        return text.toUpperCase().split('').map(char => {
            if (this.natoAlphabet[char]) {
                return this.natoAlphabet[char].toUpperCase();
            } else if (char === ' ') {
                return 'SPACE';
            } else if (char.match(/[^A-Z0-9]/)) {
                return char;
            }
            return char;
        }).join(' ');
    }
    
    toLowercaseNato(text) {
        return text.toUpperCase().split('').map(char => {
            if (this.natoAlphabet[char]) {
                return this.natoAlphabet[char].toLowerCase();
            } else if (char === ' ') {
                return 'space';
            } else if (char.match(/[^A-Z0-9]/)) {
                return char;
            }
            return char;
        }).join(' ');
    }
    
    toDashSeparated(text) {
        return text.toUpperCase().split('').map(char => {
            if (this.natoAlphabet[char]) {
                return this.natoAlphabet[char];
            } else if (char === ' ') {
                return 'Space';
            } else if (char.match(/[^A-Z0-9]/)) {
                return char;
            }
            return char;
        }).join(' - ');
    }
    
    toCommaSeparated(text) {
        return text.toUpperCase().split('').map(char => {
            if (this.natoAlphabet[char]) {
                return this.natoAlphabet[char];
            } else if (char === ' ') {
                return 'Space';
            } else if (char.match(/[^A-Z0-9]/)) {
                return char;
            }
            return char;
        }).join(', ');
    }
    
    toPhoneticOnly(text) {
        return text.toUpperCase().split('').filter(char => this.natoAlphabet[char])
            .map(char => this.natoAlphabet[char]).join(' ');
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
    new NatoAlphabetConverter();
});