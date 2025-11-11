let qrCode = null;

function generateQRCode() {
    const text = document.getElementById('qr-text').value.trim();
    
    if (!text) {
        alert('Please enter text or URL');
        return;
    }
    
    const size = parseInt(document.getElementById('qr-size').value);
    const useGradient = document.getElementById('qr-gradient').checked;
    const color = document.getElementById('qr-color').value;
    const color2 = document.getElementById('qr-color2').value;
    const gradientType = document.getElementById('gradient-type').value;
    const bgColor = document.getElementById('qr-bg').value;
    const dotType = document.getElementById('qr-type').value;
    const errorLevel = document.getElementById('qr-error').value;
    const cornerSquareType = document.getElementById('corner-square-type').value;
    const cornerDotType = document.getElementById('corner-dot-type').value;
    
    // Clear previous QR code
    const canvas = document.getElementById('qr-canvas');
    canvas.innerHTML = '';
    
    // Build options
    const options = {
        width: size,
        height: size,
        data: text,
        qrOptions: {
            errorCorrectionLevel: errorLevel
        },
        dotsOptions: {
            color: useGradient ? undefined : color,
            gradient: useGradient ? {
                type: gradientType,
                colorStops: [
                    { offset: 0, color: color },
                    { offset: 1, color: color2 }
                ]
            } : undefined,
            type: dotType
        },
        backgroundOptions: {
            color: bgColor
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 0
        }
    };
    
    if (cornerSquareType) {
        options.cornersSquareOptions = {
            type: cornerSquareType,
            color: useGradient ? undefined : color,
            gradient: useGradient ? {
                type: gradientType,
                colorStops: [
                    { offset: 0, color: color },
                    { offset: 1, color: color2 }
                ]
            } : undefined
        };
    }
    
    if (cornerDotType) {
        options.cornersDotOptions = {
            type: cornerDotType,
            color: useGradient ? undefined : color,
            gradient: useGradient ? {
                type: gradientType,
                colorStops: [
                    { offset: 0, color: color },
                    { offset: 1, color: color2 }
                ]
            } : undefined
        };
    }
    
    // Create new QR code
    qrCode = new QRCodeStyling(options);
    
    qrCode.append(canvas);
    document.getElementById('download-btn').style.display = 'block';
}

function downloadQRCode() {
    if (qrCode) {
        qrCode.download({
            name: "qr-code",
            extension: "png"
        });
    }
}

document.getElementById('generate-btn').addEventListener('click', generateQRCode);
document.getElementById('download-btn').addEventListener('click', downloadQRCode);

// Toggle gradient options
document.getElementById('qr-gradient').addEventListener('change', function(e) {
    const show = e.target.checked;
    document.getElementById('color2-group').style.display = show ? 'block' : 'none';
    document.getElementById('gradient-type-group').style.display = show ? 'block' : 'none';
});

// Generate on Ctrl+Enter in textarea
document.getElementById('qr-text').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        generateQRCode();
    }
});
