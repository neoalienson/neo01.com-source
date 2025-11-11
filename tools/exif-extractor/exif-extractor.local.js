// EXIF Extractor
class ExifExtractor {
    constructor(skipInit = false) {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.output = document.getElementById('output');
        this.error = document.getElementById('error');
        this.fileInfo = document.getElementById('fileInfo');
        
        this.toTitleCase = (str) => {
            return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };
        
        if (!skipInit) this.init();
    }
    
    init() {
        if (!this.fileInput || !this.dropZone) return;
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processFile(e.target.files[0]);
            }
        });
        
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });
        
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
        
        if (!file.type.includes('jpeg') && !file.name.toLowerCase().match(/\.(jpg|jpeg)$/)) {
            this.showError('Please select a JPEG file.');
            return;
        }
        
        this.showFileInfo(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                const exifData = this.extractExifData(arrayBuffer);
                this.displayMetadata(exifData, file);
            } catch (error) {
                this.showError(`Error reading JPEG file: ${error.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
    }
    
    extractExifData(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        const exifData = {
            fileSignature: this.checkJpegSignature(view),
            segments: [],
            exif: {},
            gps: {},
            thumbnail: null
        };
        
        if (!exifData.fileSignature.valid) {
            throw new Error('Invalid JPEG file signature');
        }
        
        let offset = 2; // Skip JPEG signature
        
        while (offset < arrayBuffer.byteLength - 1) {
            if (view.getUint8(offset) !== 0xFF) break;
            
            const marker = view.getUint16(offset);
            const segmentLength = view.getUint16(offset + 2);
            
            const segment = {
                marker: marker.toString(16).toUpperCase(),
                length: segmentLength,
                offset: offset
            };
            
            if (marker === 0xFFE1) { // APP1 - EXIF
                const exifHeader = this.readString(view, offset + 4, 4);
                if (exifHeader === 'Exif') {
                    const tiffOffset = offset + 10;
                    Object.assign(exifData.exif, this.parseExifTiff(view, tiffOffset));
                }
            }
            
            exifData.segments.push(segment);
            offset += 2 + segmentLength;
        }
        
        return exifData;
    }
    
    checkJpegSignature(view) {
        const signature = [0xFF, 0xD8];
        const fileSignature = [view.getUint8(0), view.getUint8(1)];
        
        return {
            expected: signature,
            actual: fileSignature,
            valid: signature.every((byte, index) => byte === fileSignature[index])
        };
    }
    
    parseExifTiff(view, offset) {
        const exif = {};
        
        // Check TIFF header
        const byteOrder = view.getUint16(offset);
        const littleEndian = byteOrder === 0x4949;
        
        const tiffMagic = littleEndian ? view.getUint16(offset + 2, true) : view.getUint16(offset + 2);
        if (tiffMagic !== 42) return exif;
        
        const ifdOffset = littleEndian ? view.getUint32(offset + 4, true) : view.getUint32(offset + 4);
        
        // Parse IFD0
        this.parseIFD(view, offset + ifdOffset, offset, littleEndian, exif);
        
        return exif;
    }
    
    parseIFD(view, ifdOffset, tiffOffset, littleEndian, exif) {
        if (ifdOffset + 2 > view.byteLength) return;
        
        const entryCount = littleEndian ? view.getUint16(ifdOffset, true) : view.getUint16(ifdOffset);
        
        for (let i = 0; i < entryCount; i++) {
            const entryOffset = ifdOffset + 2 + (i * 12);
            if (entryOffset + 12 > view.byteLength) break;
            
            const tag = littleEndian ? view.getUint16(entryOffset, true) : view.getUint16(entryOffset);
            const type = littleEndian ? view.getUint16(entryOffset + 2, true) : view.getUint16(entryOffset + 2);
            const count = littleEndian ? view.getUint32(entryOffset + 4, true) : view.getUint32(entryOffset + 4);
            const valueOffset = littleEndian ? view.getUint32(entryOffset + 8, true) : view.getUint32(entryOffset + 8);
            
            const tagName = this.getExifTagName(tag);
            const value = this.parseExifValue(view, type, count, valueOffset, tiffOffset, littleEndian);
            
            if (tagName && value !== null) {
                exif[tagName] = value;
            }
            
            // Parse Exif sub-IFD
            if (tag === 0x8769 && type === 4) { // ExifOffset
                const exifIfdOffset = littleEndian ? view.getUint32(entryOffset + 8, true) : view.getUint32(entryOffset + 8);
                if (tiffOffset + exifIfdOffset + 2 <= view.byteLength) {
                    this.parseIFD(view, tiffOffset + exifIfdOffset, tiffOffset, littleEndian, exif);
                }
            }
        }
    }
    
    parseExifValue(view, type, count, valueOffset, tiffOffset, littleEndian) {
        const typeSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
        const totalSize = count * typeSize[type];
        
        let offset = totalSize <= 4 ? valueOffset : tiffOffset + valueOffset;
        
        // Bounds check
        if (offset >= view.byteLength) return null;
        
        try {
            switch (type) {
                case 1: // BYTE
                case 7: // UNDEFINED
                    return totalSize === 1 ? view.getUint8(offset) : this.readBytes(view, offset, count);
                case 2: // ASCII
                    return this.readString(view, totalSize <= 4 ? offset : tiffOffset + valueOffset, count - 1);
                case 3: // SHORT
                    return count === 1 ? 
                        (littleEndian ? view.getUint16(offset, true) : view.getUint16(offset)) :
                        this.readShorts(view, offset, count, littleEndian);
                case 4: // LONG
                    return count === 1 ?
                        (littleEndian ? view.getUint32(offset, true) : view.getUint32(offset)) :
                        this.readLongs(view, offset, count, littleEndian);
                case 5: // RATIONAL
                    if (tiffOffset + valueOffset + 8 > view.byteLength) return null;
                    const num = littleEndian ? view.getUint32(tiffOffset + valueOffset, true) : view.getUint32(tiffOffset + valueOffset);
                    const den = littleEndian ? view.getUint32(tiffOffset + valueOffset + 4, true) : view.getUint32(tiffOffset + valueOffset + 4);
                    return den === 0 ? 0 : num / den;
                default:
                    return null;
            }
        } catch (e) {
            return null;
        }
    }
    
    getExifTagName(tag) {
        return exif_tag_list.exif[tag];
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
    
    readBytes(view, offset, count) {
        const bytes = [];
        for (let i = 0; i < count; i++) {
            bytes.push(view.getUint8(offset + i));
        }
        return bytes;
    }
    
    readShorts(view, offset, count, littleEndian) {
        const shorts = [];
        for (let i = 0; i < count; i++) {
            shorts.push(littleEndian ? view.getUint16(offset + i * 2, true) : view.getUint16(offset + i * 2));
        }
        return shorts;
    }
    
    readLongs(view, offset, count, littleEndian) {
        const longs = [];
        for (let i = 0; i < count; i++) {
            longs.push(littleEndian ? view.getUint32(offset + i * 4, true) : view.getUint32(offset + i * 4));
        }
        return longs;
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
            <button class="clear-btn" onclick="exifExtractor.clearAll()">Clear</button>
        `;
        this.fileInfo.style.display = 'block';
    }
    
    displayMetadata(exifData, file) {
        let output = '';
        
        output += `<div class="metadata-section"><div class="metadata-title">JPEG File Signature</div><div class="metadata-item"><span class="metadata-key">Valid:</span> <span class="metadata-value">${exifData.fileSignature.valid ? 'Yes' : 'No'}</span></div></div>`;
        
        if (Object.keys(exifData.exif).length > 0) {
            output += `<div class="metadata-section"><div class="metadata-title">EXIF Data</div>`;
            
            for (const [key, value] of Object.entries(exifData.exif)) {
                const formattedKey = this.toTitleCase(key.replace(/([A-Z])/g, ' $1').trim());
                let formattedValue = this.formatExifValue(key, value);
                
                output += `<div class="metadata-item"><span class="metadata-key">${formattedKey}:</span> <span class="metadata-value">${formattedValue}</span></div>`;
            }
            output += `</div>`;
        }
        
        output += `<div class="metadata-section"><div class="metadata-title">JPEG Segments (${exifData.segments.length} total)</div>`;
        
        exifData.segments.forEach((segment, index) => {
            const segmentName = this.getSegmentName(segment.marker);
            output += `<div class="metadata-item"><span class="metadata-key">${index + 1}. ${segment.marker} (${segmentName}):</span> <span class="metadata-value">${segment.length} bytes at offset ${segment.offset}</span></div>`;
        });
        output += `</div>`;
        
        this.output.innerHTML = output;
        this.output.style.display = 'block';
    }
    
    formatExifValue(key, value) {
        if (typeof value === 'number') {
            if (key.includes('Resolution')) {
                return `${value.toFixed(2)} dpi`;
            }
            if (key === 'ExposureTime') {
                return value < 1 ? `1/${Math.round(1/value)}s` : `${value}s`;
            }
            if (key === 'FNumber') {
                return `f/${value.toFixed(1)}`;
            }
            if (key === 'FocalLength' || key === 'FocalLengthIn35mmFormat') {
                return `${value}mm`;
            }
            if (key === 'ISO' || key === 'RecommendedExposureIndex') {
                return `ISO ${value}`;
            }
            if (key === 'ModifyDate' || key === 'DateTimeOriginal' || key === 'CreateDate') {
                return new Date(value * 1000).toLocaleString();
            }
            if (key === 'ExposureCompensation') {
                return `${value > 0 ? '+' : ''}${value.toFixed(2)} EV`;
            }
            return value.toString();
        }
        if (Array.isArray(value)) {
            if (key === 'LensInfo') {
                return `${value[0]}-${value[1]}mm f/${value[2]}-${value[3]}`;
            }
            return value.join(', ');
        }
        return value;
    }
    
    getSegmentName(marker) {
        const segments = {
            'FFD8': 'SOI (Start of Image)',
            'FFE0': 'APP0 (JFIF)',
            'FFE1': 'APP1 (EXIF)',
            'FFE2': 'APP2',
            'FFDB': 'DQT (Quantization Table)',
            'FFC0': 'SOF0 (Start of Frame)',
            'FFC4': 'DHT (Huffman Table)',
            'FFDA': 'SOS (Start of Scan)',
            'FFD9': 'EOI (End of Image)'
        };
        return segments[marker] || 'Unknown';
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

let exifExtractor;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dropZone')) {
        exifExtractor = new ExifExtractor();
    }
});