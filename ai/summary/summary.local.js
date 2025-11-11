// Text Summarizer using Chrome's built-in AI
class TextSummarizer {
    constructor() {
        this.input = document.querySelector('#input');
        this.typeSelect = document.querySelector('#type');
        this.formatSelect = document.querySelector('#format');
        this.lengthSelect = document.querySelector('#length');
        this.characterCount = document.querySelector('#character-count');
        this.unsupportedDiv = document.querySelector('#summarization-unsupported');
        this.unavailableDiv = document.querySelector('#summarization-unavailable');
        this.output = document.querySelector('#output');
        this.debounceTimer = null;
        
        this.init();
    }
    
    async init() {
        if (!('Summarizer' in self)) {
            this.unavailableDiv.style.display = 'block';
            return;
        }
        
        if (!await this.isSupported()) {
            this.unsupportedDiv.style.display = 'block';
            return;
        }
        
        this.setupEventListeners();
        this.generateSummary();
    }
    
    setupEventListeners() {
        const debounceGenerate = () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.generateSummary(), 1000);
        };
        
        this.typeSelect.addEventListener('change', debounceGenerate);
        this.formatSelect.addEventListener('change', debounceGenerate);
        this.lengthSelect.addEventListener('change', debounceGenerate);
        this.input.addEventListener('input', debounceGenerate);
    }
    
    async isSupported() {
        try {
            const availability = await self.Summarizer.availability();
            return availability === 'available' || availability === 'downloadable';
        } catch (error) {
            return false;
        }
    }
    
    async createSummarizer() {
        try {
            return await self.Summarizer.create({
                type: this.typeSelect.value,
                format: this.formatSelect.value,
                length: this.lengthSelect.value
            });
        } catch (error) {
            throw new Error('Failed to create summarizer');
        }
    }
    
    async generateSummary() {
        const text = this.input.value.trim();
        
        if (!text) {
            this.output.textContent = 'Enter text above to generate a summary...';
            this.characterCount.textContent = '0';
            return;
        }
        
        try {
            this.output.textContent = 'Generating summary...';
            
            const summarizer = await this.createSummarizer();
            
            // Update token usage
            const tokenUsage = await summarizer.measureInputUsage(text);
            this.characterCount.textContent = `${tokenUsage.toFixed()} of ${summarizer.inputQuota}`;
            
            // Generate summary
            const summary = await summarizer.summarize(text);
            this.output.textContent = summary;
            
            // Clean up
            summarizer.destroy();
            
        } catch (error) {
            this.output.textContent = `Error: ${error.message}`;
            console.error('Summarization error:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextSummarizer();
});