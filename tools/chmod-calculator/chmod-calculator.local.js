// Chmod Calculator - Converted from IT-Tools
class ChmodCalculator {
    constructor() {
        this.checkboxes = {
            owner: {
                read: document.getElementById('owner-read'),
                write: document.getElementById('owner-write'),
                execute: document.getElementById('owner-execute')
            },
            group: {
                read: document.getElementById('group-read'),
                write: document.getElementById('group-write'),
                execute: document.getElementById('group-execute')
            },
            others: {
                read: document.getElementById('others-read'),
                write: document.getElementById('others-write'),
                execute: document.getElementById('others-execute')
            }
        };
        
        this.octalResult = document.getElementById('octal-result');
        this.symbolicResult = document.getElementById('symbolic-result');
        this.umaskResult = document.getElementById('umask-result');
        this.numericInput = document.getElementById('numericInput');
        
        this.init();
    }
    
    init() {
        // Add event listeners to all checkboxes
        Object.values(this.checkboxes).forEach(group => {
            Object.values(group).forEach(checkbox => {
                checkbox.addEventListener('change', () => this.updateFromCheckboxes());
            });
        });
        
        // Add event listener to numeric input
        this.numericInput.addEventListener('input', () => this.updateFromNumeric());
        
        // Initial calculation
        this.updateFromCheckboxes();
    }
    
    updateFromCheckboxes() {
        const octal = this.calculateOctal();
        const symbolic = this.calculateSymbolic();
        const umask = this.calculateUmask(octal);
        
        this.octalResult.textContent = octal;
        this.symbolicResult.textContent = symbolic;
        this.umaskResult.textContent = umask;
        this.numericInput.value = octal;
    }
    
    updateFromNumeric() {
        const value = this.numericInput.value;
        if (value.match(/^[0-7]{1,3}$/)) {
            const paddedValue = value.padStart(3, '0');
            this.setCheckboxesFromOctal(paddedValue);
            this.octalResult.textContent = paddedValue;
            this.symbolicResult.textContent = this.calculateSymbolic();
            this.umaskResult.textContent = this.calculateUmask(paddedValue);
        }
    }
    
    calculateOctal() {
        const owner = this.getPermissionValue('owner');
        const group = this.getPermissionValue('group');
        const others = this.getPermissionValue('others');
        
        return `${owner}${group}${others}`;
    }
    
    getPermissionValue(type) {
        const permissions = this.checkboxes[type];
        let value = 0;
        
        if (permissions.read.checked) value += 4;
        if (permissions.write.checked) value += 2;
        if (permissions.execute.checked) value += 1;
        
        return value;
    }
    
    calculateSymbolic() {
        return this.getSymbolicPermission('owner') + 
               this.getSymbolicPermission('group') + 
               this.getSymbolicPermission('others');
    }
    
    getSymbolicPermission(type) {
        const permissions = this.checkboxes[type];
        let symbolic = '';
        
        symbolic += permissions.read.checked ? 'r' : '-';
        symbolic += permissions.write.checked ? 'w' : '-';
        symbolic += permissions.execute.checked ? 'x' : '-';
        
        return symbolic;
    }
    
    calculateUmask(octal) {
        const digits = octal.split('').map(d => parseInt(d));
        const umaskDigits = digits.map(d => 7 - d);
        return umaskDigits.join('');
    }
    
    setCheckboxesFromOctal(octal) {
        const digits = octal.split('').map(d => parseInt(d));
        const types = ['owner', 'group', 'others'];
        
        digits.forEach((digit, index) => {
            const type = types[index];
            this.checkboxes[type].read.checked = (digit & 4) !== 0;
            this.checkboxes[type].write.checked = (digit & 2) !== 0;
            this.checkboxes[type].execute.checked = (digit & 1) !== 0;
        });
    }
}

function copyResult() {
    const result = document.getElementById('octal-result');
    const text = result.textContent;
    
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

function copySymbolic() {
    const result = document.getElementById('symbolic-result');
    const text = result.textContent;
    
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

function copyUmask() {
    const result = document.getElementById('umask-result');
    const text = result.textContent;
    
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
    new ChmodCalculator();
});