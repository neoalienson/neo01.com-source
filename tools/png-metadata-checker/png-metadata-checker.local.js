// PNG Metadata Checker
class PngMetadataChecker {
    constructor(skipInit = false) {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.output = document.getElementById('output');
        this.error = document.getElementById('error');
        this.fileInfo = document.getElementById('fileInfo');
        // Simple case conversion function
        this.toTitleCase = (str) => {
            return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };
        
        if (!skipInit) this.init();
    }
    
    init() {
        if (!this.fileInput || !this.dropZone) return;
        
        // File input change event
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processFile(e.target.files[0]);
            }
        });
        
        // Drop zone click event
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });
        
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
    }
    
    processFile(file) {
        this.clearOutput();
        
        // Validate file type
        if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
            this.showError('Please select a PNG file.');
            return;
        }
        
        // Show file info
        this.showFileInfo(file);
        
        // Read file as ArrayBuffer
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                const metadata = this.extractPngMetadata(arrayBuffer);
                this.displayMetadata(metadata, file);
            } catch (error) {
                this.showError(`Error reading PNG file: ${error.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
    }
    
    extractPngMetadata(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        const metadata = {
            fileSignature: this.checkPngSignature(view),
            chunks: [],
            imageInfo: {},
            textualData: {},
            timestamps: {},
            colorProfile: null,
            gamma: null
        };
        
        if (!metadata.fileSignature.valid) {
            throw new Error('Invalid PNG file signature');
        }
        
        let offset = 8; // Skip PNG signature
        
        while (offset < arrayBuffer.byteLength - 8) {
            const chunkLength = view.getUint32(offset);
            const chunkType = this.readString(view, offset + 4, 4);
            const chunkData = new DataView(arrayBuffer, offset + 8, chunkLength);
            
            const chunk = {
                type: chunkType,
                length: chunkLength,
                offset: offset
            };
            
            // Parse specific chunk types
            switch (chunkType) {
                case 'IHDR':
                    metadata.imageInfo = this.parseIHDR(chunkData);
                    chunk.data = metadata.imageInfo;
                    break;
                case 'tEXt':
                    chunk.data = this.parseText(chunkData);
                    Object.assign(metadata.textualData, chunk.data);
                    break;
                case 'iTXt':
                    chunk.data = this.parseIText(chunkData);
                    Object.assign(metadata.textualData, chunk.data);
                    break;
                case 'zTXt':
                    chunk.data = this.parseZText(chunkData);
                    Object.assign(metadata.textualData, chunk.data);
                    break;
                case 'tIME':
                    chunk.data = this.parseTime(chunkData);
                    metadata.timestamps.lastModified = chunk.data;
                    break;
                case 'gAMA':
                    chunk.data = this.parseGamma(chunkData);
                    metadata.gamma = chunk.data;
                    break;
                case 'iCCP':
                    chunk.data = this.parseColorProfile(chunkData);
                    metadata.colorProfile = chunk.data;
                    break;
            }
            
            metadata.chunks.push(chunk);
            offset += 8 + chunkLength + 4; // length + type + data + CRC
        }
        
        return metadata;
    }
    
    checkPngSignature(view) {
        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
        const fileSignature = [];
        
        for (let i = 0; i < 8; i++) {
            fileSignature.push(view.getUint8(i));
        }
        
        return {
            expected: signature,
            actual: fileSignature,
            valid: signature.every((byte, index) => byte === fileSignature[index])
        };
    }
    
    parseIHDR(view) {
        return {
            width: view.getUint32(0),
            height: view.getUint32(4),
            bitDepth: view.getUint8(8),
            colorType: view.getUint8(9),
            compressionMethod: view.getUint8(10),
            filterMethod: view.getUint8(11),
            interlaceMethod: view.getUint8(12)
        };
    }
    
    parseText(view) {
        const text = {};
        let nullIndex = -1;
        
        // Find null separator
        for (let i = 0; i < view.byteLength; i++) {
            if (view.getUint8(i) === 0) {
                nullIndex = i;
                break;
            }
        }
        
        if (nullIndex > 0) {
            const keyword = this.readString(view, 0, nullIndex);
            const value = this.readString(view, nullIndex + 1, view.byteLength - nullIndex - 1);
            text[keyword] = value;
        }
        
        return text;
    }
    
    parseIText(view) {
        // Simplified iTXt parsing
        const text = {};
        let offset = 0;
        let nullCount = 0;
        let keyword = '';
        
        // Find keyword (ends with null)
        while (offset < view.byteLength && nullCount < 1) {
            const byte = view.getUint8(offset);
            if (byte === 0) {
                nullCount++;
            } else if (nullCount === 0) {
                keyword += String.fromCharCode(byte);
            }
            offset++;
        }
        
        if (keyword && offset < view.byteLength) {
            // Skip compression flag and compression method
            offset += 2;
            
            // Skip language tag and translated keyword (find next null)
            while (offset < view.byteLength && view.getUint8(offset) !== 0) offset++;
            offset++; // Skip null
            while (offset < view.byteLength && view.getUint8(offset) !== 0) offset++;
            offset++; // Skip null
            
            // Read text value
            if (offset < view.byteLength) {
                const value = this.readString(view, offset, view.byteLength - offset);
                text[keyword] = value;
            }
        }
        
        return text;
    }
    
    parseZText(view) {
        // Simplified zTXt parsing (without decompression)
        const text = {};
        let nullIndex = -1;
        
        for (let i = 0; i < view.byteLength; i++) {
            if (view.getUint8(i) === 0) {
                nullIndex = i;
                break;
            }
        }
        
        if (nullIndex > 0) {
            const keyword = this.readString(view, 0, nullIndex);
            text[keyword] = '[Compressed text data]';
        }
        
        return text;
    }
    
    parseTime(view) {
        const year = view.getUint16(0);
        const month = view.getUint8(2);
        const day = view.getUint8(3);
        const hour = view.getUint8(4);
        const minute = view.getUint8(5);
        const second = view.getUint8(6);
        
        return new Date(year, month - 1, day, hour, minute, second);
    }
    
    parseGamma(view) {
        return view.getUint32(0) / 100000;
    }
    
    parseColorProfile(view) {
        let nullIndex = -1;
        for (let i = 0; i < view.byteLength; i++) {
            if (view.getUint8(i) === 0) {
                nullIndex = i;
                break;
            }
        }
        
        if (nullIndex > 0) {
            const profileName = this.readString(view, 0, nullIndex);
            return {
                name: profileName,
                compressionMethod: view.getUint8(nullIndex + 1),
                profileSize: view.byteLength - nullIndex - 2
            };
        }
        
        return null;
    }
    
    readString(view, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            const byte = view.getUint8(offset + i);
            if (byte === 0) break;
            str += String.fromCharCode(byte);
        }
        return str;
    }
    
    showFileInfo(file) {
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        this.fileInfo.innerHTML = `
            <div><strong>File Name:</strong> ${file.name}</div>
            <div><strong>File Size:</strong> ${formatBytes(file.size)}</div>
            <div><strong>Last Modified:</strong> ${new Date(file.lastModified).toLocaleString()}</div>
            <button class="clear-btn" onclick="pngChecker.clearAll()">Clear</button>
        `;
        this.fileInfo.style.display = 'block';
    }
    
    displayMetadata(metadata, file) {
        let output = '';
        
        // File signature
        output += `<div class="metadata-section"><div class="metadata-title">PNG File Signature</div><div class="metadata-item"><span class="metadata-key">Valid:</span> <span class="metadata-value">${metadata.fileSignature.valid ? 'Yes' : 'No'}</span></div></div>`;
        
        // Image information
        if (metadata.imageInfo.width) {
            const colorTypes = {
                0: 'Grayscale',
                2: 'RGB',
                3: 'Palette',
                4: 'Grayscale + Alpha',
                6: 'RGB + Alpha'
            };
            
            output += `<div class="metadata-section"><div class="metadata-title">Image Information (IHDR)</div><div class="metadata-item"><span class="metadata-key">Dimensions:</span> <span class="metadata-value">${metadata.imageInfo.width} × ${metadata.imageInfo.height} pixels</span></div><div class="metadata-item"><span class="metadata-key">Bit Depth:</span> <span class="metadata-value">${metadata.imageInfo.bitDepth}</span></div><div class="metadata-item"><span class="metadata-key">Color Type:</span> <span class="metadata-value">${colorTypes[metadata.imageInfo.colorType] || metadata.imageInfo.colorType}</span></div><div class="metadata-item"><span class="metadata-key">Compression:</span> <span class="metadata-value">${metadata.imageInfo.compressionMethod === 0 ? 'Deflate' : metadata.imageInfo.compressionMethod}</span></div><div class="metadata-item"><span class="metadata-key">Interlace:</span> <span class="metadata-value">${metadata.imageInfo.interlaceMethod === 0 ? 'None' : 'Adam7'}</span></div></div>`;
        }
        
        // Textual data with case conversion
        if (Object.keys(metadata.textualData).length > 0) {
            output += `<div class="metadata-section"><div class="metadata-title">Textual Data</div>`;
            
            for (const [key, value] of Object.entries(metadata.textualData)) {
                // Use case converter for key formatting
                const formattedKey = this.toTitleCase(key.replace(/[_-]/g, ' '));
                let formattedValue = value;
                
                // Try to format as JSON if it looks like JSON
                if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                    try {
                        const parsed = JSON.parse(value);
                        formattedValue = JSON.stringify(parsed, null, 2);
                    } catch (e) {}
                }
                
                output += `<div class="metadata-item"><span class="metadata-key">${formattedKey}:</span><br><span class="metadata-value">${formattedValue}</span></div>`;
            }
            output += `</div>`;
        }
        
        // Timestamps
        if (metadata.timestamps.lastModified) {
            output += `<div class="metadata-section">
                <div class="metadata-title">Timestamps</div>
                <div class="metadata-item">
                    <span class="metadata-key">Last Modified:</span> 
                    <span class="metadata-value">${metadata.timestamps.lastModified.toLocaleString()}</span>
                </div>
            </div>`;
        }
        
        // Gamma
        if (metadata.gamma) {
            output += `<div class="metadata-section">
                <div class="metadata-title">Color Information</div>
                <div class="metadata-item">
                    <span class="metadata-key">Gamma:</span> 
                    <span class="metadata-value">${metadata.gamma}</span>
                </div>
            </div>`;
        }
        
        // Color profile
        if (metadata.colorProfile) {
            output += `<div class="metadata-section">
                <div class="metadata-title">Color Profile</div>
                <div class="metadata-item">
                    <span class="metadata-key">Profile Name:</span> 
                    <span class="metadata-value">${metadata.colorProfile.name}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-key">Profile Size:</span> 
                    <span class="metadata-value">${metadata.colorProfile.profileSize} bytes</span>
                </div>
            </div>`;
        }
        
        // Chunks details
        output += `<div class="metadata-section">
            <div class="metadata-title">PNG Chunks (${metadata.chunks.length} total)</div>`;
        
        metadata.chunks.forEach((chunk, index) => {
            // if (chunk.type === 'IDAT') return; // Skip image data chunks
            
            let chunkInfo = `${chunk.length} bytes at offset ${chunk.offset}`;
            
            if (chunk.data) {
                if (chunk.type === 'tEXt' || chunk.type === 'iTXt' || chunk.type === 'zTXt') {
                    const textEntries = Object.entries(chunk.data).map(([k, v]) => `${k}: ${v}`).join(', ');
                    chunkInfo += ` - ${textEntries}`;
                } else if (chunk.type === 'IHDR') {
                    chunkInfo += ` - ${chunk.data.width}×${chunk.data.height}`;
                } else if (chunk.type === 'tIME') {
                    chunkInfo += ` - ${chunk.data.toLocaleString()}`;
                }
            }
            
            output += `<div class="metadata-item">
                <span class="metadata-key">${index + 1}. ${chunk.type}:</span> 
                <span class="metadata-value">${chunkInfo}</span>
            </div>`;
        });
        output += `</div>`;
        
        this.output.innerHTML = output;
        this.output.style.display = 'block';
    }
    
    showError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
        this.output.style.display = 'none';
    }
    
    clearOutput() {
        this.error.style.display = 'none';
        this.output.style.display = 'none';
    }
    
    clearAll() {
        this.clearOutput();
        this.fileInfo.style.display = 'none';
        this.fileInput.value = '';
    }
}

// Initialize when DOM is loaded
let pngChecker;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dropZone')) {
        pngChecker = new PngMetadataChecker();
    }
});