// EXIF Extractor Tests
if (typeof framework !== 'undefined') {
    const createMockExtractor = () => {
        return new ExifExtractor(true);
    };

    framework.test('JPEG signature validation', () => {
        const extractor = createMockExtractor();
        const validSignature = new DataView(new ArrayBuffer(2));
        validSignature.setUint8(0, 0xFF);
        validSignature.setUint8(1, 0xD8);
        const validResult = extractor.checkJpegSignature(validSignature);
        framework.assert(validResult.valid === true, 'Valid JPEG signature should be recognized');
        
        const invalidSignature = new DataView(new ArrayBuffer(2));
        invalidSignature.setUint8(0, 0xFF);
        invalidSignature.setUint8(1, 0xD9);
        const invalidResult = extractor.checkJpegSignature(invalidSignature);
        framework.assert(invalidResult.valid === false, 'Invalid JPEG signature should be rejected');
    });
    
    framework.test('EXIF tag name lookup', () => {
        const extractor = createMockExtractor();
        framework.assert(extractor.getExifTagName(0x010F) === 'Make', 'Should return Make for tag 0x010F');
        framework.assert(extractor.getExifTagName(0x0110) === 'Model', 'Should return Model for tag 0x0110');
        framework.assert(extractor.getExifTagName(0x829A) === 'ExposureTime', 'Should return ExposureTime for tag 0x829A');
        framework.assert(extractor.getExifTagName(0x9999) === undefined, 'Should return undefined for unknown tag');
    });
    
    framework.test('String reading utility', () => {
        const extractor = createMockExtractor();
        const testString = 'Canon';
        const buffer = new ArrayBuffer(testString.length + 2);
        const view = new DataView(buffer);
        for (let i = 0; i < testString.length; i++) view.setUint8(i, testString.charCodeAt(i));
        const result = extractor.readString(view, 0, testString.length);
        framework.assert(result === testString, 'String should be read correctly');
    });
    
    framework.test('EXIF value formatting', () => {
        const extractor = createMockExtractor();
        framework.assert(extractor.formatExifValue('ExposureTime', 0.005) === '1/200s', 'Should format exposure time correctly');
        framework.assert(extractor.formatExifValue('FNumber', 2.8) === 'f/2.8', 'Should format f-number correctly');
        framework.assert(extractor.formatExifValue('FocalLength', 50) === '50mm', 'Should format focal length correctly');
        framework.assert(extractor.formatExifValue('ISO', 800) === 'ISO 800', 'Should format ISO correctly');
    });
    
    framework.test('Segment name lookup', () => {
        const extractor = createMockExtractor();
        framework.assert(extractor.getSegmentName('FFD8') === 'SOI (Start of Image)', 'Should return correct SOI name');
        framework.assert(extractor.getSegmentName('FFE1') === 'APP1 (EXIF)', 'Should return correct EXIF name');
        framework.assert(extractor.getSegmentName('FFD9') === 'EOI (End of Image)', 'Should return correct EOI name');
        framework.assert(extractor.getSegmentName('FFFF') === 'Unknown', 'Should return Unknown for unrecognized segment');
    });
    
    framework.test('Case converter integration', () => {
        const extractor = createMockExtractor();
        framework.assert(typeof extractor.toTitleCase === 'function', 'Case converter should be available');
        const result = extractor.toTitleCase('exposure time');
        framework.assert(result === 'Exposure Time', 'Case converter should format keys correctly');
    });
    
    framework.test('Error handling', () => {
        const extractor = createMockExtractor();
        const mockFile = { type: 'image/png', name: 'test.png', size: 1000 };
        extractor.error = { style: { display: 'none' }, textContent: '' };
        extractor.output = { style: { display: 'none' } };
        extractor.fileInfo = { style: { display: 'none' } };
        extractor.processFile(mockFile);
        framework.assert(extractor.error.style.display === 'block', 'Error should be displayed for invalid file type');
        framework.assert(extractor.error.textContent.includes('JPEG'), 'Error message should mention JPEG requirement');
    });
}
