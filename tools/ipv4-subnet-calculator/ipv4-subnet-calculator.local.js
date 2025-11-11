// IPv4 Subnet Calculator - Converted from IT-Tools
class IPv4SubnetCalculator {
    constructor() {
        this.ipInput = document.getElementById('ipInput');
        this.output = document.getElementById('output');
        
        this.init();
    }
    
    init() {
        this.ipInput.addEventListener('input', () => this.calculateSubnet());
        this.calculateSubnet();
    }
    
    calculateSubnet() {
        const input = this.ipInput.value || '192.168.1.0/24';
        this.output.innerHTML = '';
        
        try {
            const [ip, cidr] = input.split('/');
            if (!ip || !cidr) throw new Error('Invalid format');
            
            const subnet = this.parseSubnet(ip, parseInt(cidr));
            this.displayResults(subnet);
        } catch (error) {
            this.showError('Invalid IP/CIDR format');
        }
    }
    
    parseSubnet(ip, cidr) {
        const ipParts = ip.split('.').map(part => parseInt(part));
        if (ipParts.length !== 4 || ipParts.some(part => isNaN(part) || part < 0 || part > 255)) {
            throw new Error('Invalid IP address');
        }
        
        if (cidr < 0 || cidr > 32) {
            throw new Error('Invalid CIDR');
        }
        
        const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
        const subnetMask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
        const networkInt = (ipInt & subnetMask) >>> 0;
        const broadcastInt = (networkInt | (0xFFFFFFFF >>> cidr)) >>> 0;
        
        const hostBits = 32 - cidr;
        const totalHosts = Math.pow(2, hostBits);
        const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0;
        
        return {
            networkAddress: this.intToIp(networkInt),
            broadcastAddress: this.intToIp(broadcastInt),
            subnetMask: this.intToIp(subnetMask),
            wildcardMask: this.intToIp(~subnetMask >>> 0),
            firstHost: usableHosts > 0 ? this.intToIp(networkInt + 1) : 'N/A',
            lastHost: usableHosts > 0 ? this.intToIp(broadcastInt - 1) : 'N/A',
            totalHosts: totalHosts,
            usableHosts: usableHosts,
            cidr: cidr,
            binarySubnetMask: this.intToBinary(subnetMask)
        };
    }
    
    intToIp(int) {
        return [
            (int >>> 24) & 0xFF,
            (int >>> 16) & 0xFF,
            (int >>> 8) & 0xFF,
            int & 0xFF
        ].join('.');
    }
    
    intToBinary(int) {
        return (int >>> 0).toString(2).padStart(32, '0').match(/.{8}/g).join('.');
    }
    
    displayResults(subnet) {
        const results = [
            { name: 'Network Address', value: subnet.networkAddress },
            { name: 'Broadcast Address', value: subnet.broadcastAddress },
            { name: 'Subnet Mask', value: subnet.subnetMask },
            { name: 'Wildcard Mask', value: subnet.wildcardMask },
            { name: 'First Host', value: subnet.firstHost },
            { name: 'Last Host', value: subnet.lastHost },
            { name: 'Total Hosts', value: subnet.totalHosts.toLocaleString() },
            { name: 'Usable Hosts', value: subnet.usableHosts.toLocaleString() },
            { name: 'CIDR Notation', value: `/${subnet.cidr}` },
            { name: 'Binary Subnet Mask', value: subnet.binarySubnetMask }
        ];
        
        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'subnet-result';
            resultDiv.innerHTML = `
                <button class="copy-individual" onclick="copyText('${result.value}')">Copy</button>
                <div class="subnet-name">${result.name}</div>
                <div class="subnet-output">${result.value}</div>
            `;
            this.output.appendChild(resultDiv);
        });
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'subnet-result error';
        errorDiv.innerHTML = `
            <div class="subnet-name">Error</div>
            <div class="subnet-output">${message}</div>
        `;
        this.output.appendChild(errorDiv);
    }
}

// Copy individual result to clipboard
function copyText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess(event.target);
        }).catch(err => {
            fallbackCopyTextToClipboard(text, event.target);
        });
    } else {
        fallbackCopyTextToClipboard(text, event.target);
    }
}

function fallbackCopyTextToClipboard(text, button) {
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
        showCopySuccess(button);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess(button) {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#28a745';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#007acc';
    }, 2000);
}

// Class button functions
function setClassA() {
    document.getElementById('ipInput').value = '10.0.0.0/8';
    const calculator = new IPv4SubnetCalculator();
    calculator.calculateSubnet();
}

function setClassB() {
    document.getElementById('ipInput').value = '172.16.0.0/16';
    const calculator = new IPv4SubnetCalculator();
    calculator.calculateSubnet();
}

function setClassC() {
    document.getElementById('ipInput').value = '192.168.1.0/24';
    const calculator = new IPv4SubnetCalculator();
    calculator.calculateSubnet();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IPv4SubnetCalculator();
});