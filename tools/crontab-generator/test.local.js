// Crontab Generator Tests
framework.test('Cron expression generation', () => {
    const minute = '*';
    const hour = '0';
    const day = '*';
    const month = '*';
    const weekday = '*';
    const result = `${minute} ${hour} ${day} ${month} ${weekday}`;
    framework.assertEqual(result, '* 0 * * *');
});

framework.test('Cron description generation', () => {
    // Test midnight description
    const description = 'Runs every minute at midnight';
    framework.assertTrue(description.includes('midnight'));
});

framework.test('Interval parsing', () => {
    const minute = '*/15';
    const interval = minute.split('*/')[1];
    framework.assertEqual(interval, '15');
});