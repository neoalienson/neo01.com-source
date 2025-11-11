framework.describe('JsonYamlConverter', () => {
    framework.test('converts simple JSON to YAML', () => {
        const json = '{"name":"John","age":30}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('name: John'), 'YAML should contain name field');
        framework.assert(yaml.includes('age: 30'), 'YAML should contain age field');
    });

    framework.test('converts simple YAML to JSON', () => {
        const yaml = `name: John
age: 30`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assertEqual(obj.name, 'John');
        framework.assertEqual(obj.age, 30);
    });

    framework.test('handles arrays in JSON to YAML', () => {
        const json = '{"items":["apple","banana","cherry"]}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('- apple'), 'YAML should contain array items');
        framework.assert(yaml.includes('- banana'), 'YAML should contain array items');
    });

    framework.test('handles nested objects', () => {
        const json = '{"user":{"name":"John","address":{"city":"NYC"}}}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('user:'), 'YAML should contain user key');
        framework.assert(yaml.includes('address:'), 'YAML should contain address key');
        framework.assert(yaml.includes('city: NYC'), 'YAML should contain city value');
    });

    framework.test('handles null values', () => {
        const json = '{"value":null}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('value: null'), 'YAML should contain null value');
    });

    framework.test('handles boolean values', () => {
        const json = '{"active":true,"disabled":false}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('active: true'), 'YAML should contain true value');
        framework.assert(yaml.includes('disabled: false'), 'YAML should contain false value');
    });

    framework.test('throws error on invalid JSON', () => {
        try {
            JsonYamlConverter.jsonToYaml('{invalid}');
            framework.assert(false, 'Should throw error');
        } catch (error) {
            framework.assert(error.message.includes('Invalid JSON'), 'Should throw Invalid JSON error');
        }
    });

    framework.test('handles empty objects', () => {
        const json = '{"empty":{}}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('empty: {}'), 'YAML should contain empty object');
    });

    framework.test('handles empty arrays', () => {
        const json = '{"list":[]}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('list: []'), 'YAML should contain empty array');
    });

    framework.test('handles proper indentation', () => {
        const json = '{"parent":{"child":{"value":"test"}}}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('parent:'), 'YAML should contain parent');
        framework.assert(yaml.includes('  child:'), 'YAML should indent child');
        framework.assert(yaml.includes('    value: test'), 'YAML should indent value');
    });

    framework.test('parses indented YAML to JSON', () => {
        const yaml = `parent:
  child:
    value: test`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assertEqual(obj.parent.child.value, 'test');
    });

    framework.test('parses tab-indented YAML to JSON', () => {
        const yaml = `parent:
	child:
		value: test`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assertEqual(obj.parent.child.value, 'test');
    });

    framework.test('parses nested object with array', () => {
        const yaml = `markdown:
  plugins:
    - markdown-it-emoji
    - markdown-it-sub`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assert(obj.markdown.plugins.length === 2, 'Should have 2 plugins');
        framework.assertEqual(obj.markdown.plugins[0], 'markdown-it-emoji');
        framework.assertEqual(obj.markdown.plugins[1], 'markdown-it-sub');
    });

    framework.test('converts nested object with array to YAML', () => {
        const json = '{"markdown":{"plugins":["markdown-it-emoji","markdown-it-sub"]}}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('markdown:'), 'YAML should contain markdown');
        framework.assert(yaml.includes('plugins:'), 'YAML should contain plugins');
        framework.assert(yaml.includes('- markdown-it-emoji'), 'YAML should contain first plugin');
        framework.assert(yaml.includes('- markdown-it-sub'), 'YAML should contain second plugin');
    });

    framework.test('parses array of objects with array items is not indented more than the key, which is acceptable', () => {
        const yaml = `js_compactor:
  downloads:
  - url: https://a
    local: c
  - url: https://b
    local: d`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assert(obj.js_compactor.downloads.length === 2, 'Should have 2 downloads');
        framework.assertEqual(obj.js_compactor.downloads[0].url, 'https://a');
        framework.assertEqual(obj.js_compactor.downloads[0].local, 'c');
        framework.assertEqual(obj.js_compactor.downloads[1].url, 'https://b');
        framework.assertEqual(obj.js_compactor.downloads[1].local, 'd');
    });

    framework.test('parses array of objects', () => {
        const yaml = 'js_compactor:\n  downloads:\n    - url: https://a\n      local: c\n    - url: https://b\n      local: d';
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assert(obj.js_compactor.downloads.length === 2, 'Should have 2 downloads');
        framework.assertEqual(obj.js_compactor.downloads[0].url, 'https://a');
        framework.assertEqual(obj.js_compactor.downloads[0].local, 'c');
        framework.assertEqual(obj.js_compactor.downloads[1].url, 'https://b');
        framework.assertEqual(obj.js_compactor.downloads[1].local, 'd');
    });

    framework.test('converts array of objects to YAML', () => {
        const json = '{"js_compactor":{"downloads":[{"url":"https://a","local":"c"},{"url":"https://b","local":"d"}]}}';
        const yaml = JsonYamlConverter.jsonToYaml(json);
        framework.assert(yaml.includes('js_compactor:'), 'YAML should contain js_compactor');
        framework.assert(yaml.includes('downloads:'), 'YAML should contain downloads');
        framework.assert(yaml.includes('- url: https://a'), 'YAML should contain first url');
        framework.assert(yaml.includes('  local: c'), 'YAML should contain first local');
        framework.assert(yaml.includes('- url: https://b'), 'YAML should contain second url');
        framework.assert(yaml.includes('  local: d'), 'YAML should contain second local');
    });

    framework.test('rejects array item without array context', () => {
        try {
            const yaml = `key: value
- item`;
            JsonYamlConverter.yamlToJson(yaml);
            framework.assert(false, 'Should throw error');
        } catch (error) {
            framework.assert(error.message.includes('Invalid YAML') || error.message.includes('expected'), 'Should throw YAML error');
        }
    });

    framework.test('handles YAML comments', () => {
        const yaml = `# Comment
name: John
# Another comment
age: 30`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assertEqual(obj.name, 'John');
        framework.assertEqual(obj.age, 30);
    });

    framework.test('handles empty lines', () => {
        const yaml = `name: John

age: 30`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assertEqual(obj.name, 'John');
        framework.assertEqual(obj.age, 30);
    });

    framework.test('handles multiline string with greater than', () => {
        const yaml = `description: >
  Testing`;
        const json = JsonYamlConverter.yamlToJson(yaml);
        const obj = JSON.parse(json);
        framework.assertEqual(obj.description, 'Testing');
    });
});
