// Text Statistics - Converted from IT-Tools
class TextStatistics {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.statsContainer = document.getElementById('stats');
        
        this.init();
    }
    
    init() {
        this.textInput.addEventListener('input', () => this.calculateStats());
        this.calculateStats();
    }
    
    calculateStats() {
        const text = this.textInput.value;
        const stats = this.getTextStats(text);
        this.displayStats(stats);
    }
    
    getTextStats(text) {
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
        const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
        const lines = text.split('\n').length;
        
        // Approximate token count (rough estimation: ~4 characters per token)
        const estimatedTokens = Math.ceil(charactersNoSpaces / 4);
        
        // Reading time (average 200 words per minute)
        const readingTimeMinutes = Math.ceil(words / 200);
        
        return {
            characters,
            charactersNoSpaces,
            words,
            sentences,
            paragraphs,
            lines,
            estimatedTokens,
            readingTimeMinutes
        };
    }
    
    displayStats(stats) {
        this.statsContainer.innerHTML = '';
        
        const statItems = [
            { label: 'Characters', value: stats.characters },
            { label: 'Characters (no spaces)', value: stats.charactersNoSpaces },
            { label: 'Words', value: stats.words },
            { label: 'Sentences', value: stats.sentences },
            { label: 'Paragraphs', value: stats.paragraphs },
            { label: 'Lines', value: stats.lines },
            { label: 'Estimated Tokens (LLM)', value: stats.estimatedTokens }
        ];
        
        statItems.forEach(item => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = `
                <div class="stat-label">${item.label}</div>
                <div class="stat-value">${item.value.toLocaleString()}</div>
            `;
            this.statsContainer.appendChild(statCard);
        });
        
        // Reading time card (special styling)
        const readingCard = document.createElement('div');
        readingCard.className = 'stat-card reading-time';
        readingCard.innerHTML = `
            <div class="stat-label">Estimated Reading Time</div>
            <div class="stat-value">${stats.readingTimeMinutes} min</div>
        `;
        this.statsContainer.appendChild(readingCard);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextStatistics();
});