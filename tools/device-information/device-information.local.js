// Device Information Tool
class DeviceInformation {
    constructor() {
        this.container = document.getElementById('deviceInfo');
        this.init();
    }
    
    init() {
        this.displayDeviceInfo();
        window.addEventListener('resize', () => this.updateWindowSize());
    }
    
    async displayDeviceInfo() {
        const sections = [
            {
                title: 'Screen',
                items: this.getScreenInfo()
            },
            {
                title: 'Device',
                items: this.getDeviceInfo()
            },
            {
                title: 'AI Capabilities',
                items: await this.getAIInfo()
            }
        ];
        
        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'info-section';
            sectionDiv.innerHTML = `
                <h3>${section.title}</h3>
                ${section.items.map(item => `
                    <div class="info-item">
                        <span class="info-label">${item.label}</span>
                        <span class="info-value" id="${item.id || ''}">
                            ${item.value}
                        </span>
                    </div>
                `).join('')}
            `;
            this.container.appendChild(sectionDiv);
        });
        
        // Add user agent as separate block
        const userAgentDiv = document.createElement('div');
        userAgentDiv.className = 'user-agent-block';
        userAgentDiv.innerHTML = `
            <h3>User Agent</h3>
            <textarea id="user-agent-input" class="user-agent-text" style="width: 100%; min-height: 80px; font-family: 'Courier New', monospace; padding: 10px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${navigator.userAgent}</textarea>
            <button class="copy-btn" onclick="copyUserAgent()">Copy</button>
            <div id="parsed-ua" style="margin-top: 15px;"></div>
        `;
        this.container.appendChild(userAgentDiv);
        
        // Setup user agent parsing
        const userAgentInput = document.getElementById('user-agent-input');
        userAgentInput.addEventListener('input', () => this.updateParsedUA());
        this.updateParsedUA();
    }
    
    getScreenInfo() {
        return [
            { label: 'Screen size', value: `${screen.availWidth} x ${screen.availHeight}` },
            { label: 'Orientation', value: screen.orientation?.type || 'unknown' },
            { label: 'Orientation angle', value: screen.orientation?.angle !== undefined ? `${screen.orientation.angle}°` : 'unknown' },
            { label: 'Color depth', value: `${screen.colorDepth} bits` },
            { label: 'Pixel ratio', value: `${window.devicePixelRatio} dppx` },
            { label: 'Window size', value: `${window.innerWidth} x ${window.innerHeight}`, id: 'windowSize' }
        ];
    }
    
    getDeviceInfo() {
        return [
            { label: 'Browser vendor', value: navigator.vendor || 'unknown' },
            { label: 'Languages', value: navigator.languages?.join(', ') || 'unknown' },
            { label: 'Platform', value: navigator.platform || 'unknown' }
        ];
    }
    
    async getAIInfo() {
        const aiInfo = [];
        
        try {
            if ('LanguageModel' in self) {
                const availability = await LanguageModel.availability();
                aiInfo.push({ label: 'Language Model', value: availability });
            
            } else {
                aiInfo.push({ label: 'Language Model', value: 'not supported' });
            }

            aiInfo.push({ label: 'Summarizer API',
                value: ('Summarizer' in self) ? 'supported' : 'not supported' });
            aiInfo.push({ label: 'Proofreader API',
                value: ('Proofreader' in self) ? 'supported' : 'not supported' });
            aiInfo.push({ label: 'LanguageDetector API',
                value: ('LanguageDetector' in self) ? 'supported' : 'not supported' });                  
            aiInfo.push({ label: 'Translator API',
                value: ('Translator' in self) ? 'supported' : 'not supported' });                  
            aiInfo.push({ label: 'Writer API',
                value: ('Writer' in self) ? 'supported' : 'not supported' });                  
            aiInfo.push({ label: 'Rewriter API',
                value: ('Rewriter' in self) ? 'supported' : 'not supported' });                  
                

        } catch (error) {
            aiInfo.push({ label: 'Language Model', value: 'error checking' });
        }
        
        return aiInfo;
    }
    
    parseUserAgent(ua) {
        const result = {
            browser: 'Unknown',
            version: 'Unknown',
            engine: 'Unknown',
            os: 'Unknown',
            device: 'Desktop'
        };
        
        // Browser detection
        if (ua.includes('Chrome') && !ua.includes('Edg')) {
            result.browser = 'Chrome';
            const match = ua.match(/Chrome\/(\d+\.\d+)/);
            result.version = match ? match[1] : 'Unknown';
            result.engine = 'Blink';
        } else if (ua.includes('Firefox')) {
            result.browser = 'Firefox';
            const match = ua.match(/Firefox\/(\d+\.\d+)/);
            result.version = match ? match[1] : 'Unknown';
            result.engine = 'Gecko';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            result.browser = 'Safari';
            const match = ua.match(/Version\/(\d+\.\d+)/);
            result.version = match ? match[1] : 'Unknown';
            result.engine = 'WebKit';
        } else if (ua.includes('Edg')) {
            result.browser = 'Edge';
            const match = ua.match(/Edg\/(\d+\.\d+)/);
            result.version = match ? match[1] : 'Unknown';
            result.engine = 'Blink';
        }
        
        // OS detection
        if (ua.includes('Windows NT')) {
            result.os = 'Windows';
            if (ua.includes('Windows NT 10.0')) result.os = 'Windows 10/11';
            else if (ua.includes('Windows NT 6.3')) result.os = 'Windows 8.1';
            else if (ua.includes('Windows NT 6.1')) result.os = 'Windows 7';
        } else if (ua.includes('Mac OS X')) {
            result.os = 'macOS';
            const match = ua.match(/Mac OS X (\d+_\d+)/);
            if (match) result.os = `macOS ${match[1].replace('_', '.')}`;
        } else if (ua.includes('Linux')) {
            result.os = 'Linux';
        } else if (ua.includes('Android')) {
            result.os = 'Android';
            const match = ua.match(/Android (\d+\.\d+)/);
            if (match) result.os = `Android ${match[1]}`;
        } else if (ua.includes('iPhone OS') || ua.includes('iOS')) {
            result.os = 'iOS';
            const match = ua.match(/OS (\d+_\d+)/);
            if (match) result.os = `iOS ${match[1].replace('_', '.')}`;
        }
        
        // Device detection
        if (ua.includes('Mobile') || ua.includes('Android')) {
            result.device = 'Mobile';
        } else if (ua.includes('Tablet') || ua.includes('iPad')) {
            result.device = 'Tablet';
        }
        
        return result;
    }
    
    updateParsedUA() {
        const userAgentInput = document.getElementById('user-agent-input');
        const parsedDiv = document.getElementById('parsed-ua');
        
        if (userAgentInput && parsedDiv) {
            const parsedUA = this.parseUserAgent(userAgentInput.value);
            parsedDiv.innerHTML = `
                <div class="info-item">
                    <span class="info-label">Browser</span>
                    <span class="info-value">${parsedUA.browser}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Version</span>
                    <span class="info-value">${parsedUA.version}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Engine</span>
                    <span class="info-value">${parsedUA.engine}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">OS</span>
                    <span class="info-value">${parsedUA.os}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Device</span>
                    <span class="info-value">${parsedUA.device}</span>
                </div>
            `;
        }
    }
    
    updateWindowSize() {
        const windowSizeElement = document.getElementById('windowSize');
        if (windowSizeElement) {
            windowSizeElement.textContent = `${window.innerWidth} x ${window.innerHeight}`;
        }
    }
}

// Copy user agent from textarea
function copyUserAgent() {
    const userAgentInput = document.getElementById('user-agent-input');
    const text = userAgentInput ? userAgentInput.value : '';
    copyText(text);
}

// Copy text to clipboard
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
document.addEventListener('DOMContentLoaded', async () => {
    new DeviceInformation();
});