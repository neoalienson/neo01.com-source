// Minimal Test Framework
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }
    
    test(name, fn) {
        this.tests.push({ name, fn, tool: this.currentTool || 'unknown' });
    }
    
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected: ${expected}, Got: ${actual}`);
        }
    }
    
    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message} Expected true, got false`);
        }
    }
    
    assert(condition, message = '') {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }
    
    describe(name, fn) {
        fn();
    }
    
    assertThrows(fn, message = '') {
        try {
            fn();
            throw new Error(`${message} Expected function to throw`);
        } catch (e) {
            // Expected
        }
    }
    
    run() {
        console.log('Running tests...');
        
        this.tests.forEach(test => {
            try {
                test.fn();
                console.log(`✓ ${test.tool}:${test.name}`);
                this.results.passed++;
            } catch (error) {
                console.log(`✗ ${test.tool}:${test.name}: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        });
        
        console.log(`Results: ${this.results.passed}/${this.results.total} passed`);
        return this.results.failed === 0;
    }
}

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestFramework;
}