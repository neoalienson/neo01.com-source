// Case Converter Tests
framework.test('camelCase conversion', () => {
    const result = 'hello world test'.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '').replace(/[^\w]/g, '');
    framework.assertEqual(result, 'helloWorldTest');
});

framework.test('snake_case conversion', () => {
    const str = 'Hello World Test';
    const result = str.replace(/\W+/g, ' ').split(/ |\B(?=[A-Z])/).map(word => word.toLowerCase()).join('_');
    framework.assertEqual(result, 'hello_world_test');
});

framework.test('kebab-case conversion', () => {
    const str = 'Hello World Test';
    const result = str.replace(/\W+/g, ' ').split(/ |\B(?=[A-Z])/).map(word => word.toLowerCase()).join('-');
    framework.assertEqual(result, 'hello-world-test');
});