const DOH_PROVIDERS = {
    cloudflare: 'https://cloudflare-dns.com/dns-query',
    google: 'https://dns.google/resolve',
    quad9: 'https://dns.quad9.net:5053/dns-query'
};

function toggleCustomUrl() {
    const provider = document.getElementById('dohProvider').value;
    const customUrlRow = document.getElementById('customUrlRow');
    customUrlRow.style.display = provider === 'custom' ? 'block' : 'none';
}

async function performLookup() {
    const domain = document.getElementById('domainInput').value.trim();
    const recordType = document.getElementById('recordType').value;
    const provider = document.getElementById('dohProvider').value;
    
    if (!domain) {
        showError('Please enter a domain name');
        return;
    }
    
    const output = document.getElementById('output');
    const loading = document.getElementById('loading');
    
    output.innerHTML = '';
    loading.style.display = 'block';
    
    try {
        const startTime = performance.now();
        const result = await dohLookup(domain, recordType, provider);
        const endTime = performance.now();
        const queryTime = (endTime - startTime).toFixed(2);
        
        displayResults(result, domain, recordType, provider, queryTime);
    } catch (error) {
        showError(`Lookup failed: ${error.message}`);
    } finally {
        loading.style.display = 'none';
    }
}

async function dohLookup(domain, type, provider) {
    let url;
    if (provider === 'custom') {
        url = document.getElementById('customUrl').value.trim();
        if (!url) {
            throw new Error('Please enter a custom DoH URL');
        }
    } else {
        url = DOH_PROVIDERS[provider];
    }
    
    if (provider === 'google') {
        // Google uses a different parameter format
        const response = await fetch(`${url}?name=${domain}&type=${type}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } else {
        // Cloudflare and Quad9 use standard format
        const response = await fetch(`${url}?name=${domain}&type=${type}`, {
            headers: { 'Accept': 'application/dns-json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
}

function displayResults(data, domain, recordType, provider, queryTime) {
    const output = document.getElementById('output');
    
    // Query information
    const queryInfo = document.createElement('div');
    queryInfo.className = 'query-info';
    queryInfo.innerHTML = `
        <h4>Query Information</h4>
        <div class="query-stats">
            <div class="stat-item">
                <span class="stat-label">Domain:</span>
                <span class="stat-value">${domain}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Type:</span>
                <span class="stat-value">${recordType}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Provider:</span>
                <span class="stat-value">${provider}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Query Time:</span>
                <span class="stat-value">${queryTime} ms</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Status:</span>
                <span class="stat-value">${data.Status === 0 ? 'Success' : 'Error ' + data.Status}</span>
            </div>
        </div>
    `;
    output.appendChild(queryInfo);
    
    // Check for answers
    if (!data.Answer || data.Answer.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `<p>No ${recordType} records found for ${domain}</p>`;
        output.appendChild(noResults);
        return;
    }
    
    // Display each answer
    data.Answer.forEach((answer, index) => {
        const line = document.createElement('div');
        line.className = 'result-line';
        
        const typeSpan = document.createElement('span');
        typeSpan.className = 'result-type';
        typeSpan.textContent = getRecordTypeName(answer.type);
        
        const dataSpan = document.createElement('span');
        dataSpan.className = 'result-data';
        
        // Format data based on record type
        if (answer.type === 15) { // MX
            const parts = answer.data.split(' ');
            dataSpan.innerHTML = `<span class="mx-priority">Priority: ${parts[0]}</span>${parts[1]}`;
        } else if (answer.type === 16) { // TXT
            dataSpan.textContent = answer.data.replace(/"/g, '');
        } else {
            dataSpan.textContent = answer.data;
        }
        
        const ttlSpan = document.createElement('span');
        ttlSpan.className = 'result-ttl';
        ttlSpan.textContent = `(TTL: ${answer.TTL}s)`;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => {
            copyToClipboard(answer.data);
            copyBtn.textContent = '✓';
            setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        };
        
        line.appendChild(typeSpan);
        line.appendChild(dataSpan);
        line.appendChild(ttlSpan);
        line.appendChild(copyBtn);
        output.appendChild(line);
    });
}

function getRecordTypeName(type) {
    const types = {
        1: 'A',
        2: 'NS',
        5: 'CNAME',
        6: 'SOA',
        12: 'PTR',
        15: 'MX',
        16: 'TXT',
        28: 'AAAA',
        257: 'CAA'
    };
    return types[type] || `Type ${type}`;
}

function showError(message) {
    const output = document.getElementById('output');
    output.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${message}
        </div>
    `;
}

function clearResults() {
    document.getElementById('output').innerHTML = '';
    document.getElementById('domainInput').value = '';
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// Allow Enter key to trigger lookup
document.getElementById('domainInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performLookup();
    }
});
