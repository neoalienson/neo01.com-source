// World Clock Tool
class WorldClock {
    constructor(translations = {}) {
        this.clocksGrid = document.getElementById('clocks-grid');
        this.modal = document.getElementById('add-modal');
        this.timezoneSelect = document.getElementById('timezone-select');
        this.timeOffset = 0;
        this.use24Hour = true;
        this.translations = {
            remove: translations.remove || 'Remove',
            countries: translations.countries || {},
            cities: translations.cities || {},
            locale: translations.locale || 'en-US',
            dateFormat: translations.dateFormat || { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
        };
        
        this.loadTimezones();
        this.populateTimezoneSelect();
        this.renderClocks();
        this.startClock();
        this.initAnalogClock();
        this.init24HourToggle();
        this.showStorageStatus();
    }
    
    loadTimezones() {
        try {
            const saved = localStorage.getItem('worldClockTimezones');
            this.timezones = saved ? JSON.parse(saved) : [
                'America/New_York',
                'Europe/London', 
                'Asia/Tokyo',
                'Australia/Sydney'
            ];
        } catch (e) {
            this.timezones = [
                'America/New_York',
                'Europe/London', 
                'Asia/Tokyo',
                'Australia/Sydney'
            ];
        }
    }
    
    saveTimezones() {
        try {
            localStorage.setItem('worldClockTimezones', JSON.stringify(this.timezones));
            return true;
        } catch (e) {
            return false;
        }
    }
    
    init24HourToggle() {
        const toggle = document.getElementById('format24h');
        const ampmBtn = document.getElementById('ampm-toggle');
        const ampmHint = document.getElementById('ampm-hint');
        if (toggle) {
            toggle.addEventListener('change', () => {
                this.use24Hour = toggle.checked;
                if (ampmBtn) {
                    ampmBtn.style.display = toggle.checked ? 'none' : 'inline-block';
                }
                if (ampmHint) {
                    ampmHint.style.display = toggle.checked ? 'none' : 'block';
                }
                this.updateClocks();
            });
        }
    }
    
    toggleAMPM() {
        this.timeOffset += 12 * 3600000;
        this.updateClocks();
    }
    
    resetTime() {
        this.timeOffset = 0;
        this.updateClocks();
    }
    
    initAnalogClock() {
        const hourHand = document.getElementById('hour-hand');
        const minuteHand = document.getElementById('minute-hand');
        const clock = document.getElementById('analog-clock');
        const refTime = document.getElementById('reference-time');
        const refDate = document.getElementById('reference-date');
        
        let isDragging = false;
        let currentHand = null;
        
        const updateAnalogClock = () => {
            const now = new Date(Date.now() + this.timeOffset);
            const hours = now.getHours() % 12;
            const minutes = now.getMinutes();
            hourHand.style.transform = `rotate(${hours * 30 + minutes * 0.5}deg)`;
            minuteHand.style.transform = `rotate(${minutes * 6}deg)`;
            
            if (refTime && refDate) {
                const timeStr = now.toLocaleTimeString('en-US', { hour12: !this.use24Hour, hour: '2-digit', minute: '2-digit' });
                if (this.use24Hour) {
                    refTime.textContent = timeStr;
                } else {
                    const parts = timeStr.split(' ');
                    refTime.textContent = parts[0];
                    const ampmBtn = document.getElementById('ampm-toggle');
                    if (ampmBtn) {
                        ampmBtn.textContent = parts[1] || 'AM';
                        ampmBtn.style.display = 'inline-block';
                    }
                }
                refDate.textContent = now.toLocaleDateString(this.translations.locale, this.translations.dateFormat);
            }
        };
        
        const getAngle = (e) => {
            const rect = clock.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI + 90;
            return angle < 0 ? angle + 360 : angle;
        };
        
        const onDrag = (e) => {
            if (!isDragging) return;
            const angle = getAngle(e);
            const now = new Date();
            const offsetTime = new Date(Date.now() + this.timeOffset);
            
            if (currentHand === minuteHand) {
                const targetMinutes = Math.round(angle / 6) % 60;
                const currentMinutes = offsetTime.getMinutes();
                const minuteDiff = targetMinutes - currentMinutes;
                this.timeOffset += minuteDiff * 60000;
            } else if (currentHand === hourHand) {
                const targetHours = Math.round(angle / 30) % 12;
                const currentHours = offsetTime.getHours() % 12;
                const hourDiff = targetHours - currentHours;
                this.timeOffset += hourDiff * 3600000;
            }
            updateAnalogClock();
            this.updateClocks();
        };
        
        [hourHand, minuteHand].forEach(hand => {
            hand.addEventListener('mousedown', (e) => {
                isDragging = true;
                currentHand = hand;
                e.preventDefault();
            });
        });
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', () => {
            isDragging = false;
            currentHand = null;
        });
        
        setInterval(updateAnalogClock, 1000);
        updateAnalogClock();
    }
    
    showStorageStatus() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            const status = document.createElement('div');
            status.style.cssText = 'position:fixed;top:10px;right:10px;background:#4CAF50;color:white;padding:8px 12px;border-radius:4px;font-size:12px;z-index:1000';
            status.textContent = '\u2713 Changes saved automatically';
            document.body.appendChild(status);
            setTimeout(() => status.remove(), 3000);
        } catch (e) {
            const status = document.createElement('div');
            status.style.cssText = 'position:fixed;top:10px;right:10px;background:#f44336;color:white;padding:8px 12px;border-radius:4px;font-size:12px;z-index:1000';
            status.textContent = '\u26a0 Changes will not be saved';
            document.body.appendChild(status);
        }
    }
    
    populateTimezoneSelect() {
        const timezones = [
            { tz: 'Pacific/Midway', country: 'USA' },
            { tz: 'Pacific/Honolulu', country: 'USA' },
            { tz: 'America/Anchorage', country: 'USA' },
            { tz: 'America/Los_Angeles', country: 'USA' },
            { tz: 'America/Denver', country: 'USA' },
            { tz: 'America/Chicago', country: 'USA' },
            { tz: 'America/New_York', country: 'USA' },
            { tz: 'America/Caracas', country: 'Venezuela' },
            { tz: 'America/Halifax', country: 'Canada' },
            { tz: 'America/St_Johns', country: 'Canada' },
            { tz: 'America/Sao_Paulo', country: 'Brazil' },
            { tz: 'America/Buenos_Aires', country: 'Argentina' },
            { tz: 'Atlantic/Azores', country: 'Portugal' },
            { tz: 'UTC', country: 'UTC' },
            { tz: 'Europe/London', country: 'UK' },
            { tz: 'Europe/Paris', country: 'France' },
            { tz: 'Europe/Berlin', country: 'Germany' },
            { tz: 'Europe/Rome', country: 'Italy' },
            { tz: 'Europe/Athens', country: 'Greece' },
            { tz: 'Europe/Istanbul', country: 'Turkey' },
            { tz: 'Europe/Moscow', country: 'Russia' },
            { tz: 'Asia/Dubai', country: 'UAE' },
            { tz: 'Asia/Kabul', country: 'Afghanistan' },
            { tz: 'Asia/Karachi', country: 'Pakistan' },
            { tz: 'Asia/Kolkata', country: 'India' },
            { tz: 'Asia/Kathmandu', country: 'Nepal' },
            { tz: 'Asia/Dhaka', country: 'Bangladesh' },
            { tz: 'Asia/Yangon', country: 'Myanmar' },
            { tz: 'Asia/Bangkok', country: 'Thailand' },
            { tz: 'Asia/Singapore', country: 'Singapore' },
            { tz: 'Asia/Hong_Kong', country: 'Hong Kong' },
            { tz: 'Asia/Shanghai', country: 'China' },
            { tz: 'Asia/Tokyo', country: 'Japan' },
            { tz: 'Asia/Seoul', country: 'South Korea' },
            { tz: 'Australia/Adelaide', country: 'Australia' },
            { tz: 'Australia/Sydney', country: 'Australia' },
            { tz: 'Pacific/Auckland', country: 'New Zealand' },
            { tz: 'Pacific/Fiji', country: 'Fiji' }
        ];
        
        this.timezoneSelect.innerHTML = '';
        timezones.forEach(({ tz, country }) => {
            const now = new Date();
            const offset = this.getUTCOffset(tz, now);
            const option = document.createElement('option');
            option.value = tz;
            const cityName = tz.split('/').pop().replace(/_/g, ' ');
            const translatedCity = this.translations.cities[cityName] || cityName;
            const translatedCountry = this.translations.countries[country] || country;
            option.textContent = `${offset} ${translatedCity} (${translatedCountry})`;
            this.timezoneSelect.appendChild(option);
        });
    }
    
    getUTCOffset(timezone, date) {
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        const offset = (tzDate - utcDate) / 3600000;
        const sign = offset >= 0 ? '+' : '-';
        const absOffset = Math.abs(offset);
        const hours = Math.floor(absOffset);
        const minutes = Math.round((absOffset - hours) * 60);
        return minutes > 0 ? `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}` : `UTC${sign}${hours}`;
    }
    
    renderClocks() {
        // Clear existing clocks except add button
        const addButton = this.clocksGrid.querySelector('.add-timezone');
        this.clocksGrid.innerHTML = '';
        
        this.timezones.forEach((timezone, index) => {
            const clockCard = this.createClockCard(timezone, index);
            this.clocksGrid.appendChild(clockCard);
        });
        
        this.clocksGrid.appendChild(addButton);
    }
    
    createClockCard(timezone, index) {
        const card = document.createElement('div');
        card.className = 'clock-card';
        const offset = this.getUTCOffset(timezone, new Date());
        card.innerHTML = `
            <div class="city-name">${this.getCityName(timezone)}</div>
            <div class="date-display" id="date-${index}"></div>
            <div class="time-display" id="time-${index}"></div>
            <div class="timezone-display">${offset}</div>
            <div class="card-analog-clock" id="card-clock-${index}">
                <div class="card-clock-hand card-hour-hand" id="card-hour-${index}"></div>
                <div class="card-clock-hand card-minute-hand" id="card-minute-${index}"></div>
                <div class="card-clock-center"></div>
            </div>
            <button class="remove-btn" onclick="removeTimezone(${index})">${this.translations.remove}</button>
        `;
        return card;
    }
    
    getCityName(timezone) {
        const parts = timezone.split('/');
        const cityName = parts[parts.length - 1].replace(/_/g, ' ');
        return this.translations.cities[cityName] || cityName;
    }
    
    updateClocks() {
        this.timezones.forEach((timezone, index) => {
            try {
                const now = new Date(Date.now() + this.timeOffset);
                const timeElement = document.getElementById(`time-${index}`);
                const dateElement = document.getElementById(`date-${index}`);
                
                if (timeElement && dateElement) {
                    const timeString = now.toLocaleTimeString('en-US', {
                        timeZone: timezone,
                        hour12: !this.use24Hour,
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const dateString = now.toLocaleDateString(this.translations.locale, {
                        timeZone: timezone,
                        ...this.translations.dateFormat
                    });
                    
                    timeElement.textContent = timeString;
                    dateElement.textContent = dateString;
                    
                    // Update card analog clock
                    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
                    const hours = tzDate.getHours() % 12;
                    const minutes = tzDate.getMinutes();
                    const hourHand = document.getElementById(`card-hour-${index}`);
                    const minuteHand = document.getElementById(`card-minute-${index}`);
                    if (hourHand && minuteHand) {
                        hourHand.style.transform = `rotate(${hours * 30 + minutes * 0.5}deg)`;
                        minuteHand.style.transform = `rotate(${minutes * 6}deg)`;
                    }
                }
            } catch (error) {
                console.error(`Error updating clock for ${timezone}:`, error);
            }
        });
    }
    
    startClock() {
        this.updateClocks();
        setInterval(() => this.updateClocks(), 1000);
    }
    
    addTimezone(timezone) {
        if (!this.timezones.includes(timezone)) {
            this.timezones.push(timezone);
            this.saveTimezones();
            this.renderClocks();
        }
    }
    
    removeTimezone(index) {
        this.timezones.splice(index, 1);
        this.saveTimezones();
        this.renderClocks();
    }
    
    showModal() {
        this.modal.style.display = 'block';
    }
    
    hideModal() {
        this.modal.style.display = 'none';
    }
}

// Global functions
function showAddModal() {
    window.worldClock.showModal();
}

function hideAddModal() {
    window.worldClock.hideModal();
}

function addTimezone() {
    const timezone = document.getElementById('timezone-select').value;
    window.worldClock.addTimezone(timezone);
    window.worldClock.hideModal();
}

function removeTimezone(index) {
    window.worldClock.removeTimezone(index);
}

function resetTime() {
    window.worldClock.resetTime();
}

function toggleAMPM() {
    window.worldClock.toggleAMPM();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('add-modal');
    if (event.target === modal) {
        hideAddModal();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.worldClock = new WorldClock(window.worldClockTranslations || {});
});