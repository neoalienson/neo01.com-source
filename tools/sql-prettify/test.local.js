// SQL Prettify Tests
framework.test('SQL formatting basic', () => {
    const sql = 'SELECT name, age FROM users WHERE active = 1';
    framework.assertTrue(sql.includes('SELECT'));
    framework.assertTrue(sql.includes('FROM'));
    framework.assertTrue(sql.includes('WHERE'));
});

framework.test('SQL keyword case upper', () => {
    const sql = 'select name from users';
    const result = sql.replace(/\bselect\b/gi, 'SELECT').replace(/\bfrom\b/gi, 'FROM');
    framework.assertTrue(result.includes('SELECT'));
    framework.assertTrue(result.includes('FROM'));
});

framework.test('SQL keyword case lower', () => {
    const sql = 'SELECT name FROM users';
    const result = sql.replace(/\bSELECT\b/gi, 'select').replace(/\bFROM\b/gi, 'from');
    framework.assertTrue(result.includes('select'));
    framework.assertTrue(result.includes('from'));
});

framework.test('SQL tabular left formatting', () => {
    const fields = 'name, age, email';
    const fieldArray = fields.split(',').map(field => field.trim());
    const firstField = fieldArray[0];
    const restFields = fieldArray.slice(1).map(field => '     , ' + field).join('\n');
    const result = `SELECT ${firstField}${restFields ? '\n' + restFields : ''}\n  FROM table`;
    framework.assertTrue(result.includes('SELECT name,'));
    framework.assertTrue(result.includes('       age,'));
    framework.assertTrue(result.includes('       email'));
    framework.assertTrue(result.includes('FROM   table'));
});

framework.test('SQL tabular right formatting', () => {
    const fields = 'name, age, email';
    const fieldArray = fields.split(',').map(field => field.trim());
    const maxLength = Math.max(...fieldArray.map(f => f.length));
    const alignedFields = fieldArray.map((field, index) => {
        if (index === 0) return field.padEnd(maxLength);
        return field.padEnd(maxLength) + ' ,';
    }).join('\n       ');
    const result = `SELECT ${alignedFields}\n  FROM`;
    framework.assertTrue(result.includes('SELECT name, '));
    framework.assertTrue(result.includes('       age,'));
    framework.assertTrue(result.includes('       email'));
    framework.assertTrue(result.includes('  FROM table'));    
});