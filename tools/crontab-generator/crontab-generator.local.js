// Crontab Generator - Converted from IT-Tools
class CrontabGenerator {
    constructor() {
        this.minuteSelect = document.getElementById('minute');
        this.hourSelect = document.getElementById('hour');
        this.daySelect = document.getElementById('day');
        this.monthSelect = document.getElementById('month');
        this.weekdaySelect = document.getElementById('weekday');
        this.cronResult = document.getElementById('cronResult');
        this.cronDescription = document.getElementById('cronDescription');
        
        this.init();
    }
    
    init() {
        this.minuteSelect.addEventListener('change', () => this.generateCron());
        this.hourSelect.addEventListener('change', () => this.generateCron());
        this.daySelect.addEventListener('change', () => this.generateCron());
        this.monthSelect.addEventListener('change', () => this.generateCron());
        this.weekdaySelect.addEventListener('change', () => this.generateCron());
        this.generateCron();
    }
    
    generateCron() {
        const minute = this.minuteSelect.value;
        const hour = this.hourSelect.value;
        const day = this.daySelect.value;
        const month = this.monthSelect.value;
        const weekday = this.weekdaySelect.value;
        
        const cronExpression = `${minute} ${hour} ${day} ${month} ${weekday}`;
        this.cronResult.textContent = cronExpression;
        this.cronDescription.textContent = this.generateDescription(minute, hour, day, month, weekday);
    }
    
    generateDescription(minute, hour, day, month, weekday) {
        let description = 'Runs ';
        
        // Handle frequency
        if (minute.includes('*/')) {
            const interval = minute.split('*/')[1];
            description += `every ${interval} minutes`;
        } else if (minute === '*') {
            description += 'every minute';
        } else {
            description += `at minute ${minute}`;
        }
        
        // Handle hour
        if (hour !== '*') {
            if (hour === '0') {
                description += ' at midnight';
            } else if (hour === '12') {
                description += ' at noon';
            } else {
                const hourNum = parseInt(hour);
                const ampm = hourNum < 12 ? 'AM' : 'PM';
                const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
                description += ` at ${displayHour} ${ampm}`;
            }
        }
        
        // Handle day
        if (day !== '*') {
            if (day.includes('*/')) {
                const interval = day.split('*/')[1];
                description += ` every ${interval} days`;
            } else {
                description += ` on day ${day}`;
            }
        }
        
        // Handle month
        if (month !== '*') {
            const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
            description += ` in ${months[parseInt(month)]}`;
        }
        
        // Handle weekday
        if (weekday !== '*') {
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            description += ` on ${weekdays[parseInt(weekday)]}`;
        }
        
        return description;
    }
}

function copyResult() {
    const result = document.getElementById('cronResult');
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
    new CrontabGenerator();
});