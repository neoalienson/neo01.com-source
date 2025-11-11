// Temperature Converter - Converted from IT-Tools
class TemperatureConverter {
    constructor() {
        this.tempInput = document.getElementById('tempInput');
        this.output = document.getElementById('output');
        
        this.scales = [
            { 
                name: 'Celsius', 
                symbol: '°C',
                fromCelsius: (c) => c,
                toCelsius: (c) => c,
                description: 'Water freezes at 0°C, boils at 100°C'
            },
            { 
                name: 'Fahrenheit', 
                symbol: '°F',
                fromCelsius: (c) => (c * 9/5) + 32,
                toCelsius: (f) => (f - 32) * 5/9,
                description: 'Water freezes at 32°F, boils at 212°F'
            },
            { 
                name: 'Kelvin', 
                symbol: 'K',
                fromCelsius: (c) => c + 273.15,
                toCelsius: (k) => k - 273.15,
                description: 'Absolute zero at 0K, water freezes at 273.15K'
            },
            { 
                name: 'Rankine', 
                symbol: '°R',
                fromCelsius: (c) => (c + 273.15) * 9/5,
                toCelsius: (r) => (r * 5/9) - 273.15,
                description: 'Absolute zero at 0°R, water freezes at 491.67°R'
            }
        ];
        
        this.currentScale = 'Celsius';
        this.init();
    }
    
    init() {
        this.tempInput.addEventListener('input', () => this.convertTemperatures());
        this.convertTemperatures();
    }
    
    convertTemperatures() {
        const inputValue = parseFloat(this.tempInput.value) || 25;
        this.output.innerHTML = '';
        
        // Convert input to Celsius first
        const currentScaleObj = this.scales.find(s => s.name === this.currentScale);
        const celsiusValue = currentScaleObj.toCelsius(inputValue);
        
        this.scales.forEach(scale => {
            const convertedValue = scale.fromCelsius(celsiusValue);
            const formattedValue = this.formatTemperature(convertedValue);
            
            const tempDiv = document.createElement('div');
            tempDiv.className = 'temp-result';
            tempDiv.innerHTML = `
                <div class="temp-name">${scale.name}</div>
                <div class="temp-value">${formattedValue} ${scale.symbol}</div>
                <div class="temp-description">${scale.description}</div>
                <button class="copy-individual" onclick="copyText('${formattedValue}')">Copy Value</button>
            `;
            
            // Add click handler to switch input scale
            tempDiv.addEventListener('click', (e) => {
                if (!e.target.classList.contains('copy-individual')) {
                    this.switchScale(scale.name, convertedValue);
                }
            });
            
            this.output.appendChild(tempDiv);
        });
    }
    
    switchScale(scaleName, value) {
        this.currentScale = scaleName;
        this.tempInput.value = this.formatTemperature(value);
        this.convertTemperatures();
    }
    
    formatTemperature(value) {
        return Math.round(value * 100) / 100;
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
    new TemperatureConverter();
});