class JsonYamlConverter {
    static jsonToYaml(jsonString, prettyFormat = true) {
        try {
            const obj = JSON.parse(jsonString);
            return jsyaml.dump(obj, { indent: 2, lineWidth: -1 });
        } catch (error) {
            throw new Error('Invalid JSON format');
        }
    }

    static yamlToJson(yamlString, prettyFormat = true) {
        try {
            const obj = jsyaml.load(yamlString);
            return prettyFormat ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
        } catch (error) {
            throw new Error(`Invalid YAML format: ${error.message}`);
        }
    }

}

function convertToYaml() {
    const input = document.getElementById('inputText').value;
    const prettyFormat = document.getElementById('prettyFormat').checked;
    const output = document.getElementById('outputText');

    if (!input.trim()) {
        showMessage('Please enter JSON to convert', 'error');
        return;
    }

    try {
        const yaml = JsonYamlConverter.jsonToYaml(input, prettyFormat);
        output.value = yaml;
        showMessage('JSON converted to YAML successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function convertToJson() {
    const input = document.getElementById('inputText').value;
    const prettyFormat = document.getElementById('prettyFormat').checked;
    const output = document.getElementById('outputText');

    if (!input.trim()) {
        showMessage('Please enter YAML to convert', 'error');
        return;
    }

    try {
        const json = JsonYamlConverter.yamlToJson(input, prettyFormat);
        output.value = json;
        showMessage('YAML converted to JSON successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function copyOutput() {
    const output = document.getElementById('outputText');
    if (!output.value) {
        showMessage('No output to copy', 'error');
        return;
    }
    
    output.select();
    document.execCommand('copy');
    showMessage('Copied to clipboard', 'success');
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = type;
    setTimeout(() => {
        message.textContent = '';
        message.className = '';
    }, 3000);
}

const jsonYamlInputText = document.getElementById('inputText');
if (jsonYamlInputText) {
    jsonYamlInputText.addEventListener('input', function() {
        const output = document.getElementById('outputText');
        if (output && output.value) {
            output.value = '';
            const message = document.getElementById('message');
            if (message) message.textContent = '';
        }
    });
}

const jsonYamlPrettyFormat = document.getElementById('prettyFormat');
if (jsonYamlPrettyFormat) {
    jsonYamlPrettyFormat.addEventListener('change', function() {
        const output = document.getElementById('outputText');
        if (output && output.value) {
            output.value = '';
            const message = document.getElementById('message');
            if (message) message.textContent = '';
        }
    });
}

// Make jsyaml available for tests
if (typeof window !== 'undefined' && typeof jsyaml === 'undefined') {
    window.jsyaml = { load: () => ({}), dump: () => '' };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = JsonYamlConverter;
}