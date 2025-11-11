// Node.js Test Runner for ASN.1 Parser
const fs = require('fs');
const path = require('path');

// Load test framework
const TestFramework = require('../test-framework.js');
const framework = new TestFramework();

// Load jsrsasign
const jsrsasign = require('jsrsasign');
global.X509 = jsrsasign.X509;
global.KJUR = jsrsasign.KJUR;

// Mock atob for Node.js
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

// Load X509 parser - extract class manually
const parserCode = fs.readFileSync(path.join(__dirname, 'x509-decoder.js'), 'utf8');
const startIdx = parserCode.indexOf('class X509CertificateParser');
let endIdx = startIdx;
let braceCount = 0;
let foundFirstBrace = false;
for (let i = startIdx; i < parserCode.length; i++) {
    if (parserCode[i] === '{') {
        braceCount++;
        foundFirstBrace = true;
    } else if (parserCode[i] === '}') {
        braceCount--;
        if (foundFirstBrace && braceCount === 0) {
            endIdx = i + 1;
            break;
        }
    }
}
const X509CertificateParserCode = parserCode.substring(startIdx, endIdx);
const X509CertificateParser = eval('(' + X509CertificateParserCode + ')');
global.X509CertificateParser = X509CertificateParser;

// Load and run tests
const testCode = fs.readFileSync(path.join(__dirname, 'test.full.js'), 'utf8');
eval(testCode);

// Run the tests
framework.run();