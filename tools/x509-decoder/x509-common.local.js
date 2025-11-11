function copySampleCert() {
    const sampleCert = document.getElementById('sampleCert').textContent;
    copyText(sampleCert);
}

function copyCommand(button, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = button.getAttribute('data-copied-text') || 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}
