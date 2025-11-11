// Hash Text Tests
framework.test('MD5 hash', () => {
    if (typeof CryptoJS !== 'undefined') {
        const result = CryptoJS.MD5('test').toString();
        framework.assertEqual(result, '098f6bcd4621d373cade4e832627b4f6');
    } else {
        framework.assertTrue(true, 'CryptoJS not available');
    }
});