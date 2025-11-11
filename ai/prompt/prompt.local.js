// Prompt API Playground using Chrome's built-in AI
import { marked } from "https://cdn.jsdelivr.net/npm/marked@13.0.3/lib/marked.esm.js";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs";

const SYSTEM_PROMPT = "You are a helpful and friendly assistant.";

class PromptPlayground {
    constructor() {
        this.session = null;
        this.initElements();
        this.init();
    }
    
    initElements() {
        this.errorMessage = document.getElementById("error-message");
        this.costSpan = document.getElementById("cost");
        this.promptArea = document.getElementById("prompt-area");
        this.promptInput = document.getElementById("prompt-input");
        this.responseArea = document.getElementById("response-area");
        this.resetButton = document.getElementById("reset-button");
        this.rawResponse = document.querySelector("details div");
        this.form = document.querySelector("form");
        this.maxTokensInfo = document.getElementById("max-tokens");
        this.temperatureInfo = document.getElementById("temperature");
        this.tokensLeftInfo = document.getElementById("tokens-left");
        this.tokensSoFarInfo = document.getElementById("tokens-so-far");
        this.topKInfo = document.getElementById("top-k");
        this.sessionTemperature = document.getElementById("session-temperature");
        this.sessionTopK = document.getElementById("session-top-k");
    }
    
    async init() {
        if (!('LanguageModel' in self)) {
            this.errorMessage.style.display = "block";
            this.errorMessage.innerHTML = `Your browser doesn't support the Prompt API. If you're on Chrome, join the <a href="https://goo.gle/chrome-ai-dev-preview-join">Early Preview Program</a> to enable it.`;
            return;
        }
        
        this.promptArea.style.display = "block";
        this.setupEventListeners();
        await this.initializeSession();
    }
    
    setupEventListeners() {
        this.form.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log('Form submitted');
            await this.promptModel();
        });
        
        // Direct button listener as backup
        document.getElementById('submit-button').addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Button clicked');
            await this.promptModel();
        });
        
        this.promptInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.form.dispatchEvent(new Event("submit"));
            }
        });
        
        this.promptInput.addEventListener("input", async () => {
            await this.updateCost();
        });
        
        this.resetButton.addEventListener("click", () => {
            this.resetSession();
        });
        
        this.sessionTemperature.addEventListener("input", async () => {
            await this.updateSession();
        });
        
        this.sessionTopK.addEventListener("input", async () => {
            await this.updateSession();
        });
    }
    
    async initializeSession() {
        try {
            const params = await LanguageModel.params();
            this.sessionTemperature.value = params.defaultTemperature || 1;
            this.sessionTemperature.max = params.maxTemperature || 2;
            this.sessionTopK.value = params.defaultTopK || 3;
            this.sessionTopK.max = params.maxTopK || 128;
            
            await this.updateSession();
        } catch (error) {
            console.error('Failed to initialize session:', error);
        }
    }
    
    async updateSession() {
        try {
            if (this.session) {
                this.session.destroy();
            }
            
            this.session = await LanguageModel.create({
                temperature: Number(this.sessionTemperature.value),
                topK: Number(this.sessionTopK.value),
                initialPrompts: [{
                    role: 'system',
                    content: SYSTEM_PROMPT,
                }],
            });
            
            this.resetUI();
            this.updateStats();
        } catch (error) {
            console.error('Failed to update session:', error);
        }
    }
    
    async updateCost() {
        const value = this.promptInput.value.trim();
        if (!value || !this.session) return;
        
        try {
            let cost;
            if (this.session.countPromptTokens) {
                cost = await this.session.countPromptTokens(value);
            } else if (this.session.measureInputUsage) {
                cost = await this.session.measureInputUsage(value);
            }
            
            if (cost !== undefined) {
                this.costSpan.textContent = `${cost} token${cost === 1 ? '' : 's'}`;
            }
        } catch (error) {
            console.error('Failed to calculate cost:', error);
        }
    }
    
    async promptModel() {
        const prompt = this.promptInput.value.trim();
        if (!prompt || !this.session) return;
        
        this.responseArea.style.display = "block";
        
        const heading = document.createElement("h3");
        heading.classList.add("prompt", "speech-bubble");
        heading.textContent = prompt;
        this.responseArea.append(heading);
        
        const p = document.createElement("p");
        p.classList.add("response", "speech-bubble");
        p.textContent = "Generating response...";
        this.responseArea.append(p);
        
        try {
            const stream = await this.session.promptStreaming(prompt);
            
            let result = '';
            let previousChunk = '';
            
            for await (const chunk of stream) {
                const newChunk = chunk.startsWith(previousChunk)
                    ? chunk.slice(previousChunk.length) : chunk;
                result += newChunk;
                p.innerHTML = DOMPurify.sanitize(marked.parse(result));
                this.rawResponse.innerText = result;
                previousChunk = chunk;
            }
        } catch (error) {
            p.textContent = `Error: ${error.message}`;
        } finally {
            this.updateStats();
        }
    }
    
    updateStats() {
        if (!this.session) return;
        
        const numberFormat = new Intl.NumberFormat("en-US");
        const decimalFormat = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
        
        this.temperatureInfo.textContent = decimalFormat.format(this.session.temperature || 0);
        this.topKInfo.textContent = numberFormat.format(this.session.topK || 0);
        
        // Handle both old and new API versions
        const maxTokens = this.session.inputQuota || this.session.maxTokens || 0;
        const tokensUsed = this.session.inputUsage || this.session.tokensSoFar || 0;
        const tokensLeft = this.session.tokensSoFar || (maxTokens - tokensUsed) || 0;
        
        this.maxTokensInfo.textContent = numberFormat.format(maxTokens);
        this.tokensLeftInfo.textContent = numberFormat.format(tokensLeft);
        this.tokensSoFarInfo.textContent = numberFormat.format(tokensUsed);
        
        console.log('Stats updated:', { maxTokens, tokensUsed, tokensLeft });
    }
    
    resetUI() {
        this.responseArea.style.display = "none";
        this.responseArea.innerHTML = "";
        this.rawResponse.innerHTML = "";
        this.promptInput.focus();
    }
    
    resetSession() {
        this.promptInput.value = "";
        this.resetUI();
        if (this.session) {
            this.session.destroy();
            this.session = null;
        }
        this.updateSession();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PromptPlayground();
});