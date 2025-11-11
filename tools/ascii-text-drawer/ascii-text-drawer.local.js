// ASCII Text Drawer - Converted from IT-Tools
class AsciiTextDrawer {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.fontCategory = document.getElementById('fontCategory');
        this.output = document.getElementById('output');
        
        this.fontCategories = {
            popular: ['Standard', 'Big', 'Small', 'Block', 'Banner', 'Digital', 'Doom', 'Slant', 'Shadow', 'Speed'],
            '3d': ['3-D', '3D Diagonal', '3D-ASCII', 'Banner3-D', 'Henry 3D', 'Larry 3D', 'Larry 3D 2', 'Isometric1', 'Isometric2', 'Isometric3', 'Isometric4', 'Emboss', 'Emboss 2', 'Relief', 'Relief2'],
            small: ['Small', 'Mini', '1Row', '3x5', 'Small ASCII 12', 'Small ASCII 9', 'Small Block', 'Small Caps', 'Small Shadow', 'Small Slant', 'Small Braille', 'Small Keyboard', 'Small Mono 12', 'Small Mono 9', 'Small Poison', 'Small Script', 'Small Tengwar', 'Small Isometric1', 'miniwi', 'Short', 'Thin', 'Two Point', 'Three Point'],
            decorative: ['Bubble', 'Flower Power', 'Heart Left', 'Heart Right', 'Graffiti', 'Gothic', 'Fun Face', 'Ghoulish', 'Fun Faces', 'Goofy', 'Ghost', 'Barbwire', 'Bloody', 'Poison', 'S Blood', 'Lil Devil', 'Thorned', 'Weird', 'Whimsy'],
            script: ['Script', 'Cursive', 'Caligraphy', 'Caligraphy2', 'JS Cursive', 'NScript', 'NV Script', 'SL Script', 'Small Script', 'Italic', 'Efti Italic', 'Jazmine', 'Nancyj', 'Nancyj-Fancy', 'Nancyj-Improved', 'Nancyj-Underlined', 'Sweet', 'Calvin S', 'Crawford', 'Crawford2', 'Fraktur', 'Roman', 'Serifcap', 'Stampate', 'Stampatello'],
            tech: ['Digital', 'Computer', 'Electronic', 'LCD', 'Dot Matrix', 'Binary', 'Cyberlarge', 'Cybermedium', 'Cybersmall', 'Future', 'Hex', 'Octal', 'Decimal', 'O8', 'Term', 'WideTerm', 'Linux', 'OS2', 'ICL-1900'],
            block: ['Block', 'Blocks', 'Big', 'Bigfig', 'Chunky', 'Colossal', 'Thick', 'JS Block Letters', 'Line Blocks', 'Rectangles', 'Shaded Blocky', 'Stop', 'Tiles', 'Alpha', 'Alphabet', 'Basic', 'Braced', 'Double', 'Double Shorts', 'Letter', 'Letters', 'Straight', 'THIS'],
            banner: ['Banner', 'Banner3', 'Banner4', 'Old Banner', 'Big Chief', 'Marquee', 'Broadway', 'Broadway KB', 'Hollywood', 'Epic', 'Coinstak', 'Star Strips', 'Stellar', 'The Edge'],
            mono: ['Mono 12', 'Mono 9', 'Big Mono 12', 'Big Mono 9', 'Small Mono 12', 'Small Mono 9', 'ASCII 12', 'ASCII 9', 'Big ASCII 12', 'Big ASCII 9', 'Small ASCII 12', 'Small ASCII 9', 'ASCII New Roman'],
            themed: ['Star Wars', 'Trek', 'Def Leppard', 'Rammstein', 'USA Flag', 'Greek', 'NT Greek', 'Hieroglyphs', 'Runic', 'Tengwar', 'Katakana', 'Ivrit', 'Mshebrew210', 'Jerusalem', 'Tsalagi', 'Bear', 'Train', 'Cards', 'Arrows', 'Fire Font-k', 'Fire Font-s'],
            geometric: ['Circle', 'Diamond', 'Pyramid', 'Puzzle', 'Modular', 'Ticks', 'Ticks Slant', 'Peaks', 'Peaks Slant', 'Gradient', 'Wavescape', 'Wavy', 'Knob', 'Mirror', 'Reverse', 'Rotated', 'Rounded', 'Slide'],
            retro: ['Doom', 'DOS Rebel', 'Rebel', 'ANSI Regular', 'ANSI Shadow', 'Fender', 'Cola', 'Diet Cola', 'Dr Pepper', 'Varsity', 'Stacey', 'Rozzo', 'Pagga', 'Lockergnome', 'B1FF', 'Bell', 'Benjamin', 'Elite', 'Georgi16', 'Georgia11', 'Kban', 'Lean', 'Mike', 'Moscow', 'Muzzle', 'Univers'],
            stylized: ['4Max', '5 Line Oblique', 'BlurVision ASCII', 'Contrast', 'DANC4', 'Filter', 'Horizontal Left', 'Horizontal Right', 'Slant Relief', 'Upside Down Text'],
            amc: ['AMC 3 Line', 'AMC 3 Liv1', 'AMC AAA01', 'AMC Neko', 'AMC Razor', 'AMC Razor2', 'AMC Slash', 'AMC Slider', 'AMC Thin', 'AMC Tubes', 'AMC Untitled'],
            efti: ['Efti Chess', 'Efti Font', 'Efti Piti', 'Efti Robot', 'Efti Wall', 'Efti Water'],
            artistic: ['Acrobatic', 'Alligator', 'Alligator2', 'Avatar', 'Bright', 'Bulbhead', 'Catwalk', 'Chiseled', 'Crazy', 'Dancing Font', 'Flipped', 'Four Tops', 'Fuzzy', 'Graceful', 'Impossible', 'Invita', 'Jacky', 'Madrid', 'Ogre', 'Pawp', 'Pebbles', 'Puffy', 'Red Phoenix', 'Soft', 'Spliff', 'Sub-Zero', 'Swamp Land', 'Swan', 'Tanja', 'Tubular', 'Twisted', 'Wet Letter', 'Wow'],
            money: ['Big Money-ne', 'Big Money-nw', 'Big Money-se', 'Big Money-sw'],
            names: ['Bolger', 'Contessa', 'Cosmike', 'Cosmike2', 'Cricket', 'Cygnet', 'Delta Corps Priest 1', 'DiamFont', 'Doh', 'DWhistled', 'Glenyn', 'JS Bracket Letters', 'JS Capital Curves', 'JS Stick Letters', 'Konto Slant', 'Konto', 'Maxfour', 'Merlin1', 'Merlin2', 'Mnemonic', 'Pepper', 'Rowan Cap', 'RubiFont', 'Runyc', 'Santa Clara', 'Shimrod', 'Stforek', 'Stick Letters', 'Stronger Than All', 'Terrace', 'Test1', 'Tmplr', 'Tombstone'],
            misc: ['Babyface Lame', 'Babyface Leet', 'Keyboard', 'Morse', 'Morse2', 'Nipples', 'Patorjk-HeX', "Patorjk's Cheese", 'Rot13']
        };
        
        this.allFonts = Object.values(this.fontCategories).flat();
        
        this.init();
    }
    
    init() {
        this.textInput.addEventListener('input', () => this.generateAllAscii());
        this.fontCategory.addEventListener('change', () => this.generateAllAscii());
        this.generateAllAscii();
    }
    
    generateAllAscii() {
        const text = this.textInput.value || 'HELLO';
        const category = this.fontCategory.value;
        this.output.innerHTML = '';
        
        const fontsToUse = category === 'all' ? this.allFonts : this.fontCategories[category];
        
        fontsToUse.forEach(font => {
            figlet(text, {
                font: font,
                horizontalLayout: 'default',
                verticalLayout: 'default'
            }, (err, data) => {
                if (!err) {
                    const fontDiv = document.createElement('div');
                    fontDiv.className = 'font-result';
                    fontDiv.innerHTML = `<div class="font-name">${font.toUpperCase()}</div><pre>${data}</pre>`;
                    this.output.appendChild(fontDiv);
                }
            });
        });
    }
}

// Copy to clipboard function
function copyToClipboard() {
    const output = document.getElementById('output');
    const text = output.textContent;
    
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
    // Wait for figlet to be available
    if (typeof figlet !== 'undefined') {
        new AsciiTextDrawer();
    } else {
        // Retry after a short delay if figlet isn't loaded yet
        setTimeout(() => {
            new AsciiTextDrawer();
        }, 100);
    }
});