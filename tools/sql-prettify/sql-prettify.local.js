// SQL Prettify - Converted from IT-Tools
class SqlPrettify {
    constructor() {
        this.sqlInput = document.getElementById('sqlInput');
        this.result = document.getElementById('result');
        this.keywordCaseSelect = document.getElementById('keywordCase');
        this.indentStyleSelect = document.getElementById('indentStyle');
        
        this.init();
    }
    
    init() {
        this.sqlInput.addEventListener('input', () => this.autoFormat());
        this.keywordCaseSelect.addEventListener('change', () => this.autoFormat());
        this.indentStyleSelect.addEventListener('change', () => this.autoFormat());
        this.autoFormat();
    }
    
    autoFormat() {
        const sql = this.sqlInput.value;
        if (sql) {
            const keywordCase = this.keywordCaseSelect.value;
            const indentStyle = this.indentStyleSelect.value;
            this.result.textContent = this.formatSql(sql, keywordCase, indentStyle);
        } else {
            this.result.textContent = '';
        }
    }
    
    formatSql(sql, keywordCase = 'upper', indentStyle = 'standard') {
        // Remove extra whitespace and normalize
        sql = sql.replace(/\s+/g, ' ').trim();
        
        // Keywords that should be on new lines
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
            'GROUP BY', 'ORDER BY', 'HAVING', 'UNION', 'INSERT', 'UPDATE', 'DELETE', 'CREATE',
            'ALTER', 'DROP', 'AND', 'OR'
        ];
        
        // Add line breaks before major keywords
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const replacement = indentStyle === 'tabular-right' && ['FROM', 'WHERE', 'GROUP BY', 'ORDER BY'].includes(keyword.toUpperCase()) 
                ? `\n  ${keyword}` 
                : `\n${keyword}`;
            sql = sql.replace(regex, replacement);
        });
        
        // Handle SELECT fields based on indent style
        if (indentStyle === 'tabular-left') {
            sql = sql.replace(/SELECT\s+(.+?)\s+FROM/gi, (match, fields) => {
                const fieldArray = fields.split(',').map(field => field.trim());
                const firstField = fieldArray[0] + ',';
                const restFields = fieldArray.slice(1).map((field, index) => {
                    const isLast = index === fieldArray.length - 2;
                    return '       ' + field + (isLast ? '' : ',');
                }).join('\n');
                return `SELECT ${firstField}${restFields ? '\n' + restFields : ''}\nFROM   `;
            });
        } else if (indentStyle === 'tabular-right') {
            sql = sql.replace(/SELECT\s+(.+?)\s+FROM/gi, (match, fields) => {
                const fieldArray = fields.split(',').map(field => field.trim());
                const firstField = fieldArray[0] + ', ';
                const restFields = fieldArray.slice(1).map((field, index) => {
                    const isLast = index === fieldArray.length - 2;
                    return '       ' + field + (isLast ? '' : ',');
                }).join('\n');
                return `SELECT ${firstField}${restFields ? '\n' + restFields : ''}\n  FROM `;
            });
        } else {
            sql = sql.replace(/SELECT\s+(.+?)\s+FROM/gi, (match, fields) => {
                const fieldList = fields.split(',').map(field => '    ' + field.trim()).join(',\n');
                return `SELECT\n${fieldList}\n  FROM`;
            });
        }
        
        // Apply keyword case
        if (keywordCase !== 'preserve') {
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const replacement = keywordCase === 'upper' ? keyword.toUpperCase() : keyword.toLowerCase();
                sql = sql.replace(regex, replacement);
            });
        }
        
        // Indent subqueries and conditions
        const lines = sql.split('\n');
        let indentLevel = 0;
        const formatted = lines.map(line => {
            const originalLine = line;
            line = line.trim();
            if (!line) return '';
            
            // Skip indenting if already formatted for tabular
            if (indentStyle !== 'standard' && (originalLine.startsWith('SELECT') || originalLine.startsWith('  FROM') || originalLine.includes(', '))) {
                return originalLine;
            }
            
            // Decrease indent for closing keywords
            if (line.match(/^\)/)) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const indent = '    '.repeat(indentLevel);
            
            // Increase indent for opening keywords
            if (line.match(/\($/)) {
                indentLevel++;
            }
            
            return indent + line;
        }).join('\n');
        
        return formatted.trim();
    }
    
    minifySql(sql) {
        return sql.replace(/\s+/g, ' ').trim();
    }
}

// Global functions for buttons
function formatSql() {
    const sqlInput = document.getElementById('sqlInput');
    const result = document.getElementById('result');
    const keywordCaseSelect = document.getElementById('keywordCase');
    const indentStyleSelect = document.getElementById('indentStyle');
    const sql = sqlInput.value;
    
    if (sql) {
        const prettifier = new SqlPrettify();
        const keywordCase = keywordCaseSelect.value;
        const indentStyle = indentStyleSelect.value;
        result.textContent = prettifier.formatSql(sql, keywordCase, indentStyle);
    }
}

function minifySql() {
    const sqlInput = document.getElementById('sqlInput');
    const result = document.getElementById('result');
    const sql = sqlInput.value;
    
    if (sql) {
        const prettifier = new SqlPrettify();
        result.textContent = prettifier.minifySql(sql);
    }
}

function copyResult() {
    const result = document.getElementById('result');
    const text = result.textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess();
        }).catch(err => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess() {
    const btn = document.querySelector('.copy-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#28a745';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#007acc';
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SqlPrettify();
});