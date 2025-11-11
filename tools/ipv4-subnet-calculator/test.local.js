// IPv4 Subnet Calculator Tests
framework.test('IP to integer conversion', () => {
    const ipParts = [192, 168, 1, 0];
    const ipInt = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
    framework.assertEqual(ipInt, 3232235776); // 192.168.1.0 as unsigned int
});

framework.test('Integer to IP conversion', () => {
    const int = 3232235776; // 192.168.1.0 as unsigned int
    const ip = [
        (int >>> 24) & 0xFF,
        (int >>> 16) & 0xFF,
        (int >>> 8) & 0xFF,
        int & 0xFF
    ].join('.');
    framework.assertEqual(ip, '192.168.1.0');
});

framework.test('Subnet mask calculation', () => {
    const cidr = 24;
    const subnetMask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const maskIp = [
        (subnetMask >>> 24) & 0xFF,
        (subnetMask >>> 16) & 0xFF,
        (subnetMask >>> 8) & 0xFF,
        subnetMask & 0xFF
    ].join('.');
    framework.assertEqual(maskIp, '255.255.255.0');
});

framework.test('Host count calculation', () => {
    const cidr = 24;
    const hostBits = 32 - cidr;
    const totalHosts = Math.pow(2, hostBits);
    const usableHosts = totalHosts - 2;
    framework.assertEqual(totalHosts, 256);
    framework.assertEqual(usableHosts, 254);
});