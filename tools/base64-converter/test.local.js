// Unit tests for Base64 Converter
function runBase64ConverterTests() {
    const tests = [];

    // Test standard Base64 encoding
    tests.push({
        name: 'Standard Base64 encoding - simple text',
        test: () => {
            const result = Base64Converter.encode('Hello World');
            return result === 'SGVsbG8gV29ybGQ=';
        }
    });

    tests.push({
        name: 'Standard Base64 encoding - special characters',
        test: () => {
            const result = Base64Converter.encode('Hello, 世界! 🌍');
            return result === 'SGVsbG8sIOS4lueVjCEg8J+MjQ==';
        }
    });

    tests.push({
        name: 'Standard Base64 decoding - simple text',
        test: () => {
            const result = Base64Converter.decode('SGVsbG8gV29ybGQ=');
            return result === 'Hello World';
        }
    });

    tests.push({
        name: 'Standard Base64 decoding - special characters',
        test: () => {
            const result = Base64Converter.decode('SGVsbG8sIOS4lueVjCEg8J+MjQ==');
            return result === 'Hello, 世界! 🌍';
        }
    });

    // Test URL-safe Base64 encoding
    tests.push({
        name: 'URL-safe Base64 encoding',
        test: () => {
            const result = Base64Converter.encode('?>?', true);
            return result === 'Pz4_';
        }
    });

    tests.push({
        name: 'URL-safe Base64 decoding',
        test: () => {
            const result = Base64Converter.decode('Pz4_', true);
            return result === '?>?';
        }
    });

    // Test padding removal in URL-safe mode
    tests.push({
        name: 'URL-safe removes padding',
        test: () => {
            const result = Base64Converter.encode('Hello', true);
            return result === 'SGVsbG8' && !result.includes('=');
        }
    });

    // Test empty string
    tests.push({
        name: 'Empty string encoding',
        test: () => {
            const result = Base64Converter.encode('');
            return result === '';
        }
    });

    tests.push({
        name: 'Empty string decoding',
        test: () => {
            const result = Base64Converter.decode('');
            return result === '';
        }
    });

    // Test error handling
    tests.push({
        name: 'Invalid Base64 throws error',
        test: () => {
            try {
                Base64Converter.decode('Invalid@Base64!');
                return false;
            } catch (error) {
                return error.message === 'Invalid Base64 string';
            }
        }
    });

    // Test round-trip conversion
    tests.push({
        name: 'Round-trip conversion - standard',
        test: () => {
            const original = 'The quick brown fox jumps over the lazy dog';
            const encoded = Base64Converter.encode(original);
            const decoded = Base64Converter.decode(encoded);
            return decoded === original;
        }
    });

    tests.push({
        name: 'Round-trip conversion - URL-safe',
        test: () => {
            const original = 'The quick brown fox jumps over the lazy dog';
            const encoded = Base64Converter.encode(original, true);
            const decoded = Base64Converter.decode(encoded, true);
            return decoded === original;
        }
    });

    // Test binary data (using Unicode characters)
    tests.push({
        name: 'Binary data handling',
        test: () => {
            const original = '\x00\x01\x02\x03\xFF';
            const encoded = Base64Converter.encode(original);
            const decoded = Base64Converter.decode(encoded);
            return decoded === original;
        }
    });

    // Test long text
    tests.push({
        name: 'Long text handling',
        test: () => {
            const original = 'A'.repeat(1000);
            const encoded = Base64Converter.encode(original);
            const decoded = Base64Converter.decode(encoded);
            return decoded === original;
        }
    });

    return tests;
}

// Register tests with the test framework
if (typeof registerTestSuite === 'function') {
    registerTestSuite('Base64 Converter', runBase64ConverterTests);
}