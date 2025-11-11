// PNG Metadata Checker Tests
if (typeof framework !== 'undefined') {
    const createMockChecker = () => {
        return new PngMetadataChecker(true);
    };

    framework.test('PNG signature validation', () => {
        const checker = createMockChecker();
        const validSignature = new DataView(new ArrayBuffer(8));
        [137, 80, 78, 71, 13, 10, 26, 10].forEach((byte, i) => validSignature.setUint8(i, byte));
        const validResult = checker.checkPngSignature(validSignature);
        framework.assert(validResult.valid === true, 'Valid PNG signature should be recognized');
        
        const invalidSignature = new DataView(new ArrayBuffer(8));
        [137, 80, 78, 71, 13, 10, 26, 11].forEach((byte, i) => invalidSignature.setUint8(i, byte));
        const invalidResult = checker.checkPngSignature(invalidSignature);
        framework.assert(invalidResult.valid === false, 'Invalid PNG signature should be rejected');
    });
    
    framework.test('IHDR chunk parsing', () => {
        const checker = createMockChecker();
        const ihdrData = new DataView(new ArrayBuffer(13));
        ihdrData.setUint32(0, 1920);
        ihdrData.setUint32(4, 1080);
        ihdrData.setUint8(8, 8);
        ihdrData.setUint8(9, 2);
        ihdrData.setUint8(10, 0);
        ihdrData.setUint8(11, 0);
        ihdrData.setUint8(12, 0);
        const result = checker.parseIHDR(ihdrData);
        framework.assert(result.width === 1920, 'Width should be parsed correctly');
        framework.assert(result.height === 1080, 'Height should be parsed correctly');
        framework.assert(result.bitDepth === 8, 'Bit depth should be parsed correctly');
        framework.assert(result.colorType === 2, 'Color type should be parsed correctly');
    });
    
    framework.test('tEXt chunk parsing', () => {
        const checker = createMockChecker();
        const textData = 'Title\0Test Image';
        const buffer = new ArrayBuffer(textData.length);
        const view = new DataView(buffer);
        for (let i = 0; i < textData.length; i++) view.setUint8(i, textData.charCodeAt(i));
        const result = checker.parseText(view);
        framework.assert(result.Title === 'Test Image', 'Text chunk should be parsed correctly');
    });
    
    framework.test('tIME chunk parsing', () => {
        const checker = createMockChecker();
        const timeData = new DataView(new ArrayBuffer(7));
        timeData.setUint16(0, 2024);
        timeData.setUint8(2, 1);
        timeData.setUint8(3, 15);
        timeData.setUint8(4, 14);
        timeData.setUint8(5, 30);
        timeData.setUint8(6, 45);
        const result = checker.parseTime(timeData);
        framework.assert(result instanceof Date, 'Should return a Date object');
        framework.assert(result.getFullYear() === 2024, 'Year should be parsed correctly');
        framework.assert(result.getMonth() === 0, 'Month should be parsed correctly (0-based)');
        framework.assert(result.getDate() === 15, 'Day should be parsed correctly');
    });
    
    framework.test('gAMA chunk parsing', () => {
        const checker = createMockChecker();
        const gammaData = new DataView(new ArrayBuffer(4));
        gammaData.setUint32(0, 220000);
        const result = checker.parseGamma(gammaData);
        framework.assert(Math.abs(result - 2.2) < 0.01, 'Gamma should be parsed correctly');
    });
    
    framework.test('String reading utility', () => {
        const checker = createMockChecker();
        const testString = 'Hello World';
        const buffer = new ArrayBuffer(testString.length + 5);
        const view = new DataView(buffer);
        for (let i = 0; i < testString.length; i++) view.setUint8(i + 2, testString.charCodeAt(i));
        const result = checker.readString(view, 2, testString.length);
        framework.assert(result === testString, 'String should be read correctly');
    });
    
    framework.test('Case converter integration', () => {
        const checker = createMockChecker();
        framework.assert(typeof checker.toTitleCase === 'function', 'Case converter should be available');
        const result = checker.toTitleCase('test metadata key');
        framework.assert(result === 'Test Metadata Key', 'Case converter should format keys correctly');
    });
    
    framework.test('Error handling', () => {
        const checker = createMockChecker();
        const mockFile = { type: 'image/jpeg', name: 'test.jpg', size: 1000 };
        checker.error = { style: { display: 'none' }, textContent: '' };
        checker.output = { style: { display: 'none' } };
        checker.fileInfo = { style: { display: 'none' } };
        checker.processFile(mockFile);
        framework.assert(checker.error.style.display === 'block', 'Error should be displayed for invalid file type');
        framework.assert(checker.error.textContent.includes('PNG'), 'Error message should mention PNG requirement');
    });
    
    framework.test('File info formatting', () => {
        const checker = createMockChecker();
        const mockFile = { name: 'test.png', size: 1048576, lastModified: new Date('2024-01-15T10:30:00').getTime() };
        checker.fileInfo = { innerHTML: '', style: { display: 'none' } };
        checker.showFileInfo(mockFile);
        framework.assert(checker.fileInfo.innerHTML.includes('test.png'), 'File name should be displayed');
        framework.assert(checker.fileInfo.innerHTML.includes('1 MB'), 'File size should be formatted correctly');
        framework.assert(checker.fileInfo.style.display === 'block', 'File info should be visible');
    });
}
