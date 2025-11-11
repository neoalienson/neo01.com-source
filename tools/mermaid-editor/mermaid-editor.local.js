// Mermaid Diagram Editor
class MermaidEditor {
    constructor() {
        this.input = document.getElementById('mermaid-input');
        this.output = document.getElementById('diagram-output');
        this.errorMessage = document.getElementById('error-message');
        this.diagramCounter = 0;
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.examples = {
            flowchart: `graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`,
            sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,
            gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,
            pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
            class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`
        };
        
        this.init();
    }
    
    init() {
        mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
        
        this.input.addEventListener('input', () => this.debounceRender());
        this.setupPanControls();
        this.renderDiagram();
    }
    
    debounceRender() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.renderDiagram(), 1000);
    }
    
    async renderDiagram() {
        const code = this.input.value.trim();
        
        if (!code) {
            this.output.innerHTML = 'Enter Mermaid code above and click Render to see the diagram...';
            this.hideError();
            return;
        }
        
        try {
            this.hideError();
            this.output.innerHTML = 'Rendering diagram...';
            
            const diagramId = `mermaid-${++this.diagramCounter}`;
            const { svg } = await mermaid.render(diagramId, code);
            
            this.output.innerHTML = svg;
        } catch (error) {
            this.showError(`Error rendering diagram: ${error.message}`);
            this.output.innerHTML = 'Failed to render diagram. Check the code syntax.';
        }
    }
    
    loadExample(type) {
        if (this.examples[type]) {
            this.input.value = this.examples[type];
            this.renderDiagram();
        }
    }
    
    clearEditor() {
        this.input.value = '';
        this.output.innerHTML = 'Enter Mermaid code above and click Render to see the diagram...';
        this.hideError();
    }
    
    copyCode() {
        const code = this.input.value;
        
        if (!code) {
            this.showError('No code to copy');
            return;
        }
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                this.showSuccess('Code copied to clipboard!');
            }).catch(() => {
                this.fallbackCopy(code);
            });
        } else {
            this.fallbackCopy(code);
        }
    }
    
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showSuccess('Code copied to clipboard!');
        } catch (err) {
            this.showError('Failed to copy code');
        }
        
        document.body.removeChild(textArea);
    }
    
    downloadSVG() {
        const svg = this.output.querySelector('svg');
        
        if (!svg) {
            this.showError('No diagram to download');
            return;
        }
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mermaid-diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showSuccess('SVG downloaded!');
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => this.hideError(), 5000);
    }
    
    showSuccess(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.style.background = '#d4edda';
        this.errorMessage.style.color = '#155724';
        setTimeout(() => this.hideError(), 3000);
    }
    
    hideError() {
        this.errorMessage.style.display = 'none';
        this.errorMessage.style.background = '#f8d7da';
        this.errorMessage.style.color = '#dc3545';
    }
    
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
        this.applyZoom();
    }
    
    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.3);
        this.applyZoom();
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
        this.applyTransform();
    }
    
    applyZoom() {
        this.applyTransform();
    }
    
    applyTransform() {
        const svg = this.output.querySelector('svg');
        if (svg) {
            svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
            svg.style.transformOrigin = 'center';
        }
    }
    
    setupPanControls() {
        this.output.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.output.classList.add('panning');
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isPanning) return;
            
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.panX += deltaX;
            this.panY += deltaY;
            
            this.applyTransform();
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            this.isPanning = false;
            this.output.classList.remove('panning');
        });
    }
}

// Global functions for button clicks
function renderDiagram() {
    window.mermaidEditor.renderDiagram();
}

function loadExample(type) {
    window.mermaidEditor.loadExample(type);
}

function clearEditor() {
    window.mermaidEditor.clearEditor();
}

function copyCode() {
    window.mermaidEditor.copyCode();
}

function downloadSVG() {
    window.mermaidEditor.downloadSVG();
}

function zoomIn() {
    window.mermaidEditor.zoomIn();
}

function zoomOut() {
    window.mermaidEditor.zoomOut();
}

function resetZoom() {
    window.mermaidEditor.resetZoom();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mermaidEditor = new MermaidEditor();
});