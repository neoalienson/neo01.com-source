// Emoji Picker - Converted from IT-Tools
class EmojiPicker {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.categoriesContainer = document.getElementById('categories');
        this.emojiGrid = document.getElementById('emojiGrid');
        this.copiedMessage = document.getElementById('copiedMessage');
        
        this.emojis = EMOJI_DATA;
        this.categories = [...new Set(this.emojis.map(e => e.category))];
        this.currentCategory = 'all';
        
        this.init();
    }
    
    init() {
        this.renderCategories();
        this.renderEmojis();
        
        this.searchInput.addEventListener('input', () => this.handleSearch());
    }
    

    
    renderCategories() {
        const allBtn = document.createElement('button');
        allBtn.className = 'category-btn active';
        allBtn.textContent = 'All';
        allBtn.onclick = () => this.selectCategory('all');
        this.categoriesContainer.appendChild(allBtn);
        
        this.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            btn.onclick = () => this.selectCategory(category);
            this.categoriesContainer.appendChild(btn);
        });
    }
    
    selectCategory(category) {
        this.currentCategory = category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.renderEmojis();
    }
    
    renderEmojis(searchTerm = '') {
        let filteredEmojis = this.emojis;
        
        if (this.currentCategory !== 'all') {
            filteredEmojis = filteredEmojis.filter(emoji => emoji.category === this.currentCategory);
        }
        
        if (searchTerm) {
            filteredEmojis = filteredEmojis.filter(emoji => 
                emoji.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        this.emojiGrid.innerHTML = '';
        
        filteredEmojis.forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.innerHTML = `
                <div class="emoji-char">${emoji.char}</div>
                <div class="emoji-name">${emoji.name}</div>
            `;
            emojiItem.onclick = () => this.copyEmoji(emoji.char);
            this.emojiGrid.appendChild(emojiItem);
        });
    }
    
    handleSearch() {
        const searchTerm = this.searchInput.value;
        this.renderEmojis(searchTerm);
    }
    
    copyEmoji(emoji) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(emoji).then(() => {
                this.showCopiedMessage();
            }).catch(err => {
                this.fallbackCopy(emoji);
            });
        } else {
            this.fallbackCopy(emoji);
        }
    }
    
    fallbackCopy(text) {
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
            this.showCopiedMessage();
        } catch (err) {
            console.error('Failed to copy emoji', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    showCopiedMessage() {
        this.copiedMessage.classList.add('show');
        setTimeout(() => {
            this.copiedMessage.classList.remove('show');
        }, 2000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmojiPicker();
});