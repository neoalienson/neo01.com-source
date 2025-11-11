// Chronometer Tool
class Chronometer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.intervalId = null;
        this.laps = [];
        
        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.lapBtn = document.getElementById('lap-btn');
        this.lapsContainer = document.getElementById('laps-container');
        this.lapsList = document.getElementById('laps-list');
        
        this.updateDisplay();
    }
    
    start() {
        if (!this.isRunning) {
            this.startTime = Date.now() - this.elapsedTime;
            this.isRunning = true;
            this.intervalId = setInterval(() => this.updateTime(), 10);
            
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'inline-block';
            this.stopBtn.disabled = false;
            this.lapBtn.disabled = false;
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.intervalId);
            
            this.startBtn.style.display = 'inline-block';
            this.pauseBtn.style.display = 'none';
            this.lapBtn.disabled = true;
        }
    }
    
    stop() {
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.elapsedTime = 0;
        
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.stopBtn.disabled = true;
        this.lapBtn.disabled = true;
        
        this.updateDisplay();
    }
    
    reset() {
        this.stop();
        this.laps = [];
        this.updateLapsDisplay();
        this.lapsContainer.style.display = 'none';
    }
    
    recordLap() {
        if (this.isRunning) {
            const lapTime = this.elapsedTime;
            const previousLapTime = this.laps.length > 0 ? this.laps[this.laps.length - 1].total : 0;
            const lapDuration = lapTime - previousLapTime;
            
            this.laps.push({
                number: this.laps.length + 1,
                total: lapTime,
                duration: lapDuration
            });
            
            this.updateLapsDisplay();
            this.lapsContainer.style.display = 'block';
        }
    }
    
    updateTime() {
        if (this.isRunning) {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        const time = this.formatTime(this.elapsedTime);
        this.timeDisplay.textContent = time;
    }
    
    updateLapsDisplay() {
        this.lapsList.innerHTML = '';
        
        this.laps.forEach(lap => {
            const lapDiv = document.createElement('div');
            lapDiv.className = 'lap-time';
            lapDiv.innerHTML = `
                <span class="lap-number">Lap ${lap.number}</span>
                <span class="lap-duration">${this.formatTime(lap.duration)}</span>
            `;
            this.lapsList.appendChild(lapDiv);
        });
    }
    
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = milliseconds % 1000;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
}

// Global functions for button clicks
function startTimer() {
    window.chronometer.start();
}

function pauseTimer() {
    window.chronometer.pause();
}

function stopTimer() {
    window.chronometer.stop();
}

function resetTimer() {
    window.chronometer.reset();
}

function recordLap() {
    window.chronometer.recordLap();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chronometer = new Chronometer();
});