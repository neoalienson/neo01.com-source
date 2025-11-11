---
title: "Setting Up a Private Certificate Authority at Home"
date: 2024-03-15
tags:
  - Cybersecurity
  - Homelab
  - PKI
categories:
  - Cybersecurity
excerpt: "Tired of browser warnings on your homelab services? Learn how to set up your own Certificate Authority to issue trusted SSL certificates for internal services."
thumbnail_80: thumbnail_80.png
thumbnail: thumbnail.png
---

![](banner.png)

You've set up a beautiful homelab with multiple services—Nextcloud, Home Assistant, Plex, maybe a NAS. Everything works great, except for one annoying thing: every time you access these services via HTTPS, your browser screams "Your connection is not private!" 

Sure, you could click "Advanced" and "Proceed anyway" every single time. But what if I told you there's a better way? Welcome to the world of private Certificate Authorities.

## Why You Need a Private CA

**The Problem:**

When you access `https://192.168.1.100` or `https://homeserver.local`, your browser doesn't trust the connection because:
- Self-signed certificates aren't trusted by default
- Public CAs (Let's Encrypt, DigiCert) won't issue certificates for private IP addresses or `.local` domains
- Clicking through security warnings defeats the purpose of HTTPS

**The Solution:**

Create your own Certificate Authority (CA) that:
- Issues certificates for your internal services
- Gets trusted by all your devices once installed
- Works offline without external dependencies
- Gives you full control over certificate lifecycle

## Understanding the Basics

### What is a Certificate Authority?

A CA is an entity that issues digital certificates. When your browser trusts a CA, it automatically trusts any certificate signed by that CA.

**The Trust Chain:**

{% mermaid %}flowchart TD
    A["🏛️ Root CA<br/>(Your Private CA)"] --> B["📜 Intermediate CA<br/>(Optional)"]
    B --> C["🔒 Server Certificate<br/>(homeserver.local)"]
    B --> D["🔒 Server Certificate<br/>(nas.local)"]
    B --> E["🔒 Server Certificate<br/>(192.168.1.100)"]
    
    F["💻 Your Devices"] -.->|"Trust"| A
    F -->|"Automatically trust"| C
    F -->|"Automatically trust"| D
    F -->|"Automatically trust"| E
    
    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#e8f5e9
    style D fill:#e8f5e9
    style E fill:#e8f5e9
    style F fill:#fff3e0
{% endmermaid %}

### Root CA vs Intermediate CA

- **Root CA:** The top-level authority. Keep this offline and secure.
- **Intermediate CA:** Signs actual certificates. Can be revoked without affecting the root.
- **Server Certificates:** What your services use for HTTPS.

!!!tip "💡 Best Practice"
    Use a two-tier hierarchy: Root CA → Intermediate CA → Server Certificates. This way, if your intermediate CA is compromised, you can revoke it without re-trusting the root on all devices.

## Setting Up Your Private CA

### Method 1: Using OpenSSL (Manual Control)

**Step 1: Create Root CA**

```bash
# Generate root CA private key (keep this VERY secure!)
openssl genrsa -aes256 -out root-ca.key 4096

# Create root CA certificate (valid for 10 years)
openssl req -x509 -new -nodes -key root-ca.key -sha256 -days 3650 \
  -out root-ca.crt \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=Home Lab Root CA"
```

**Step 2: Create Intermediate CA**

```bash
# Generate intermediate CA private key
openssl genrsa -aes256 -out intermediate-ca.key 4096

# Create certificate signing request (CSR)
openssl req -new -key intermediate-ca.key -out intermediate-ca.csr \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=Home Lab Intermediate CA"

# Sign intermediate CA with root CA
openssl x509 -req -in intermediate-ca.csr -CA root-ca.crt -CAkey root-ca.key \
  -CAcreateserial -out intermediate-ca.crt -days 1825 -sha256 \
  -extfile <(echo "basicConstraints=CA:TRUE")
```

**Step 3: Issue Server Certificate**

```bash
# Generate server private key
openssl genrsa -out homeserver.key 2048

# Create CSR for your server
openssl req -new -key homeserver.key -out homeserver.csr \
  -subj "/C=US/ST=State/L=City/O=Home Lab/CN=homeserver.local"

# Create SAN (Subject Alternative Name) config
cat > san.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = homeserver.local
DNS.2 = homeserver
IP.1 = 192.168.1.100
EOF

# Sign server certificate with intermediate CA
openssl x509 -req -in homeserver.csr -CA intermediate-ca.crt \
  -CAkey intermediate-ca.key -CAcreateserial -out homeserver.crt \
  -days 365 -sha256 -extfile san.cnf -extensions v3_req
```

### Method 2: Using easy-rsa (Simplified)

```bash
# Install easy-rsa
git clone https://github.com/OpenVPN/easy-rsa.git
cd easy-rsa/easyrsa3

# Initialize PKI
./easyrsa init-pki

# Build CA
./easyrsa build-ca

# Generate server certificate
./easyrsa gen-req homeserver nopass
./easyrsa sign-req server homeserver
```

### Method 3: Using step-ca (Modern Approach - Recommended)

[step-ca](https://smallstep.com/docs/step-ca) is a modern, automated CA that simplifies certificate management. Think of it as "Let's Encrypt for your homelab."

**Why step-ca is Better:**

- **Automated certificate management** with ACME protocol support
- **Built-in certificate renewal** - no manual scripts needed
- **OAuth/OIDC integration** for SSH certificates
- **Simple CLI** - no complex OpenSSL commands
- **Web-based workflows** for certificate requests
- **Short-lived certificates** by default (better security)
- **Remote management** capabilities

**Installation:**

```bash
# macOS
brew install step

# Ubuntu/Debian
curl -fsSL https://packages.smallstep.com/keys/apt/repo-signing-key.gpg -o /etc/apt/trusted.gpg.d/smallstep.asc
echo 'deb [signed-by=/etc/apt/trusted.gpg.d/smallstep.asc] https://packages.smallstep.com/stable/debian debs main' | sudo tee /etc/apt/sources.list.d/smallstep.list
sudo apt update && sudo apt install step-cli step-ca

# RHEL/Fedora
sudo dnf install step-cli step-ca

# Windows (Winget)
winget install Smallstep.step-ca

# Docker
docker pull smallstep/step-ca
```

**Initialize Your CA:**

```bash
# Interactive setup
step ca init

# You'll be prompted for:
# - PKI name (e.g., "Home Lab")
# - DNS names (e.g., "ca.homelab.local")
# - Listen address (e.g., "127.0.0.1:8443")
# - First provisioner email (e.g., "admin@homelab.local")
# - Password for CA keys

# Example output:
✔ What would you like to name your new PKI? Home Lab
✔ What DNS names or IP addresses would you like to add to your new CA? ca.homelab.local
✔ What address will your new CA listen at? 127.0.0.1:8443
✔ What would you like to name the first provisioner? admin@homelab.local
✔ What do you want your password to be? ********

✔ Root certificate: /home/user/.step/certs/root_ca.crt
✔ Root fingerprint: 702a094e239c9eec6f0dcd0a5f65e595bf7ed6614012825c5fe3d1ae1b2fd6ee
```

**Advanced Init Options:**

```bash
# With ACME support (for automatic certificate management)
step ca init --acme

# With SSH certificate support
step ca init --ssh

# For Kubernetes deployment
step ca init --helm

# With remote management enabled
step ca init --remote-management
```

**Start the CA Server:**

```bash
# Start CA
step-ca $(step path)/config/ca.json

# Or run as systemd service
sudo systemctl enable step-ca
sudo systemctl start step-ca
```

**Issue Your First Certificate:**

```bash
# Simple certificate issuance
step ca certificate homeserver.local homeserver.crt homeserver.key

# You'll be prompted for the provisioner password
✔ Key ID: rQxROEr7Kx9TNjSQBTETtsu3GKmuW9zm02dMXZ8GUEk
✔ Please enter the password to decrypt the provisioner key: ********
✔ CA: https://ca.homelab.local:8443/1.0/sign
✔ Certificate: homeserver.crt
✔ Private Key: homeserver.key

# With Subject Alternative Names (SANs)
step ca certificate homeserver.local homeserver.crt homeserver.key \
  --san homeserver \
  --san 192.168.1.100

# With custom validity period
step ca certificate homeserver.local homeserver.crt homeserver.key \
  --not-after 8760h  # 1 year
```

**Trust Your CA on Client Machines:**

```bash
# Bootstrap trust (downloads root CA and configures step)
step ca bootstrap --ca-url https://ca.homelab.local:8443 \
  --fingerprint 702a094e239c9eec6f0dcd0a5f65e595bf7ed6614012825c5fe3d1ae1b2fd6ee

# Install root CA into system trust store
step certificate install $(step path)/certs/root_ca.crt
```

**Automatic Certificate Renewal:**

step-ca makes renewal trivial:

```bash
# Renew certificate (before expiration)
step ca renew homeserver.crt homeserver.key
✔ Would you like to overwrite homeserver.crt [y/n]: y
Your certificate has been saved in homeserver.crt.

# Automatic renewal daemon (renews at 2/3 of certificate lifetime)
step ca renew homeserver.crt homeserver.key --daemon

# Force renewal
step ca renew homeserver.crt homeserver.key --force
```

!!!warning "⏰ Renewal Timing"
    Once a certificate expires, the CA will not renew it. Set up automated renewals to run at around two-thirds of a certificate's lifetime. The `--daemon` flag handles this automatically.

**Adjust Certificate Lifetimes:**

```bash
# 5-minute certificate (for sensitive access)
step ca certificate localhost localhost.crt localhost.key --not-after=5m

# 90-day certificate (for servers)
step ca certificate homeserver.local homeserver.crt homeserver.key --not-after=2160h

# Certificate valid starting 5 minutes from now
step ca certificate localhost localhost.crt localhost.key --not-before=5m --not-after=240h
```

To change global defaults, edit `$(step path)/config/ca.json`:

```json
"authority": {
  "claims": {
    "minTLSCertDuration": "5m",
    "maxTLSCertDuration": "2160h",
    "defaultTLSCertDuration": "24h"
  }
}
```

**Advanced: Single-Use Tokens (For Containers/VMs):**

Generate a short-lived token for delegated certificate issuance:

```bash
# Generate token (expires in 5 minutes)
TOKEN=$(step ca token homeserver.local)
✔ Provisioner: admin@homelab.local (JWK)
✔ Please enter the password to decrypt the provisioner key: ********

# In container/VM: Create CSR
step certificate create --csr homeserver.local homeserver.csr homeserver.key

# In container/VM: Get certificate using token
step ca sign --token $TOKEN homeserver.csr homeserver.crt
✔ CA: https://ca.homelab.local:8443
✔ Certificate: homeserver.crt
```

This is perfect for:
- Docker containers that need certificates at startup
- VM provisioning workflows
- CI/CD pipelines
- Delegating certificate issuance without sharing CA credentials

**ACME Integration (Like Let's Encrypt):**

ACME (Automated Certificate Management Environment) is the protocol Let's Encrypt uses. step-ca supports ACME for fully automated certificate issuance and renewal.

**Enable ACME:**

```bash
# Add ACME provisioner (if not done during init)
step ca provisioner add acme --type ACME

# Restart step-ca to apply changes
sudo systemctl restart step-ca
```

**ACME Challenge Types:**

| Challenge | Port | Use Case | Difficulty |
|-----------|------|----------|------------|
| **http-01** | 80 | General purpose, web servers | Easy |
| **dns-01** | 53 | Wildcard certs, firewalled servers | Medium |
| **tls-alpn-01** | 443 | TLS-only environments | Medium |

**Using step as ACME Client:**

```bash
# HTTP-01 challenge (starts web server on port 80)
step ca certificate --provisioner acme neo01.com example.crt example.key

✔ Provisioner: acme (ACME)
Using Standalone Mode HTTP challenge to validate neo01.com .. done!
Waiting for Order to be 'ready' for finalization .. done!
Finalizing Order .. done!
✔ Certificate: example.crt
✔ Private Key: example.key
```

**Using certbot:**

```bash
# HTTP-01 challenge
certbot certonly --standalone \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local \
  --register-unsafely-without-email

# DNS-01 challenge (for wildcard certificates)
certbot certonly --manual --preferred-challenges dns \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d '*.homelab.local'

# Automatic renewal
certbot renew --server https://ca.homelab.local:8443/acme/acme/directory
```

**Using acme.sh:**

```bash
# HTTP-01 challenge
acme.sh --issue --standalone \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local

# DNS-01 with Cloudflare
export CF_Token="your-cloudflare-api-token"
acme.sh --issue --dns dns_cf \
  --server https://ca.homelab.local:8443/acme/acme/directory \
  -d homeserver.local

# Automatic renewal (runs daily)
acme.sh --cron
```

**ACME Flow Diagram:**

{% mermaid %}sequenceDiagram
    participant Client as ACME Client
    participant CA as step-ca
    participant Web as Web Server
    
    Client->>CA: 1. Create account & order certificate
    CA->>Client: 2. Return challenges (http-01, dns-01, tls-alpn-01)
    Client->>Web: 3. Place challenge response at /.well-known/acme-challenge/
    Client->>CA: 4. Ready for validation
    CA->>Web: 5. Verify challenge response
    CA->>Client: 6. Challenge validated
    Client->>CA: 7. Submit CSR
    CA->>Client: 8. Issue certificate
    
    Note over Client,CA: Certificate issued automatically!
{% endmermaid %}

**Why ACME is Better:**

- **Zero human interaction** - Fully automated certificate lifecycle
- **Automatic renewal** - No expired certificates
- **Industry standard** - Works with any ACME client
- **Proven at scale** - Powers Let's Encrypt (billions of certificates)
- **Built-in validation** - Proves domain/IP ownership automatically

**Integration with Traefik:**

```yaml
# traefik.yml
entryPoints:
  websecure:
    address: ":443"

certificatesResolvers:
  homelab:
    acme:
      caServer: https://ca.homelab.local:8443/acme/acme/directory
      storage: /acme.json
      tlsChallenge: {}

# docker-compose.yml
services:
  whoami:
    image: traefik/whoami
    labels:
      - "traefik.http.routers.whoami.rule=Host(`whoami.homelab.local`)"
      - "traefik.http.routers.whoami.tls.certresolver=homelab"
```

**Docker Compose Setup:**

```yaml
version: '3'
services:
  step-ca:
    image: smallstep/step-ca
    ports:
      - "8443:8443"
    volumes:
      - step-ca-data:/home/step
    environment:
      - DOCKER_STEPCA_INIT_NAME=Home Lab
      - DOCKER_STEPCA_INIT_DNS_NAMES=ca.homelab.local
      - DOCKER_STEPCA_INIT_PROVISIONER_NAME=admin@homelab.local
    restart: unless-stopped

volumes:
  step-ca-data:
```

**Comparison: OpenSSL vs step-ca**

| Task | OpenSSL | step-ca |
|------|---------|----------|
| **Create CA** | Multiple commands, config files | `step ca init` |
| **Issue certificate** | 5+ commands with config | `step ca certificate` |
| **Renewal** | Manual script | `step ca renew --daemon` |
| **ACME support** | Not built-in | Built-in |
| **Learning curve** | Steep | Gentle |
| **Automation** | DIY | Built-in |
| **SSH certificates** | Complex | `step ssh` commands |

!!!tip "💡 When to Use step-ca"
    Use step-ca if you:
    - Want automated certificate management
    - Need ACME protocol support
    - Want to integrate with modern tools (Traefik, Kubernetes)
    - Prefer simple CLI over complex OpenSSL commands
    - Need SSH certificate management
    - Want built-in renewal automation
    
    Stick with OpenSSL if you:
    - Need maximum control over every detail
    - Have existing OpenSSL-based workflows
    - Work in air-gapped environments without step-ca binaries
    - Require specific certificate extensions not supported by step-ca

## Installing Your CA Certificate

### Windows

1. Double-click `root-ca.crt`
2. Click "Install Certificate"
3. Select "Local Machine"
4. Choose "Place all certificates in the following store"
5. Select "Trusted Root Certification Authorities"
6. Click "Finish"

### macOS

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain root-ca.crt
```

### Linux (Ubuntu/Debian)

```bash
sudo cp root-ca.crt /usr/local/share/ca-certificates/homelab-root-ca.crt
sudo update-ca-certificates
```

### iOS/iPadOS

1. Email `root-ca.crt` to yourself or host it on a web server
2. Open the file on your device
3. Go to Settings → General → VPN & Device Management
4. Install the profile
5. Go to Settings → General → About → Certificate Trust Settings
6. Enable full trust for the certificate

### Android

1. Copy `root-ca.crt` to your device
2. Settings → Security → Encryption & credentials → Install a certificate
3. Select "CA certificate"
4. Browse and select your certificate

## Configuring Services

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name homeserver.local;

    ssl_certificate /path/to/homeserver.crt;
    ssl_certificate_key /path/to/homeserver.key;
    
    # Optional: Include intermediate CA
    # ssl_certificate should contain: server cert + intermediate cert
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:8080;
    }
}
```

### Apache

```apache
<VirtualHost *:443>
    ServerName homeserver.local
    
    SSLEngine on
    SSLCertificateFile /path/to/homeserver.crt
    SSLCertificateKeyFile /path/to/homeserver.key
    SSLCertificateChainFile /path/to/intermediate-ca.crt
    
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/
</VirtualHost>
```

### Docker Compose

```yaml
version: '3'
services:
  web:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./homeserver.crt:/etc/nginx/ssl/cert.crt
      - ./homeserver.key:/etc/nginx/ssl/cert.key
```

## Certificate Management

### Certificate Lifecycle

{% mermaid %}flowchart TD
    A["📝 Create Certificate"] --> B["🚀 Deploy to Server"]
    B --> C["👁️ Monitor Expiration"]
    C --> D{"⏰ Approaching Expiration?"}
    D -->|"No"| C
    D -->|"Yes (at 2/3 lifetime)"| E["🔄 Renew Certificate"]
    E --> F["🚀 Redeploy to Server"]
    F --> C
    
    style A fill:#e3f2fd
    style B fill:#e8f5e9
    style C fill:#fff3e0
    style D fill:#fff9c4
    style E fill:#f3e5f5
    style F fill:#e8f5e9
{% endmermaid %}

### Renewal Script

```bash
#!/bin/bash
# renew-cert.sh

DOMAIN="homeserver.local"
CERT_DIR="/etc/ssl/homelab"

# Generate new key and CSR
openssl genrsa -out ${CERT_DIR}/${DOMAIN}.key 2048
openssl req -new -key ${CERT_DIR}/${DOMAIN}.key \
  -out ${CERT_DIR}/${DOMAIN}.csr \
  -subj "/CN=${DOMAIN}"

# Sign with intermediate CA
openssl x509 -req -in ${CERT_DIR}/${DOMAIN}.csr \
  -CA ${CERT_DIR}/intermediate-ca.crt \
  -CAkey ${CERT_DIR}/intermediate-ca.key \
  -CAcreateserial -out ${CERT_DIR}/${DOMAIN}.crt \
  -days 365 -sha256

# Reload nginx
systemctl reload nginx

echo "Certificate renewed for ${DOMAIN}"
```

### Automation with Cron

```bash
# Add to crontab: renew 30 days before expiration
0 0 1 * * /path/to/renew-cert.sh
```

## Security Best Practices

!!!danger "⚠️ Critical Security Measures"
    **Protect Your Root CA Private Key:**
    - Store offline on encrypted USB drive
    - Never expose to network
    - Use strong passphrase (AES-256)
    - Keep multiple encrypted backups
    - Consider hardware security module (HSM) for production

**Key Security Measures:**

1. **Separate Root and Intermediate CAs**
   - Root CA: Offline, only for signing intermediate CAs
   - Intermediate CA: Online, signs server certificates

2. **Use Strong Key Sizes**
   - Root CA: 4096-bit RSA or EC P-384
   - Intermediate CA: 4096-bit RSA or EC P-384
   - Server certificates: 2048-bit RSA minimum

3. **Set Appropriate Validity Periods**
   - Root CA: 10-20 years
   - Intermediate CA: 5 years
   - Server certificates: 1 year (easier to rotate)

4. **Implement Certificate Revocation**
   - Maintain Certificate Revocation List (CRL)
   - Or use Online Certificate Status Protocol (OCSP)

5. **Audit and Monitor**
   - Log all certificate issuance
   - Monitor for unauthorized certificates
   - Regular security audits

## Common Issues and Solutions

### Issue: Browser Still Shows Warning

**Causes:**
- CA certificate not installed correctly
- Certificate doesn't include correct SAN (Subject Alternative Name)
- Accessing via IP but certificate only has DNS name

**Solution:**
```bash
# Check certificate SANs
openssl x509 -in homeserver.crt -text -noout | grep -A1 "Subject Alternative Name"

# Ensure certificate includes all access methods
DNS.1 = homeserver.local
DNS.2 = homeserver
IP.1 = 192.168.1.100
```

### Issue: Certificate Chain Incomplete

**Solution:**
Create certificate bundle:
```bash
cat homeserver.crt intermediate-ca.crt > homeserver-bundle.crt
```

Use bundle in server configuration.

### Issue: Private Key Permissions

```bash
# Set correct permissions
chmod 600 homeserver.key
chown root:root homeserver.key
```

## Advanced: Automated Certificate Management

### SSH Certificates with step-ca

If you initialized with `--ssh`, step-ca can also issue SSH certificates for password-less authentication.

**Setup SSH User Authentication:**

```bash
# On SSH server: Trust the user CA
step ssh config --roots > /etc/ssh/ssh_user_ca.pub

echo 'TrustedUserCAKeys /etc/ssh/ssh_user_ca.pub' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd

# On client: Get SSH user certificate
step ssh certificate alice@homelab.local id_ecdsa
✔ Provisioner: admin@homelab.local (JWK)
✔ Please enter the password to decrypt the provisioner key: ********
✔ CA: https://ca.homelab.local:8443
✔ Private Key: id_ecdsa
✔ Certificate: id_ecdsa-cert.pub
✔ SSH Agent: yes

# Inspect certificate
cat id_ecdsa-cert.pub | step ssh inspect
```

**Setup SSH Host Authentication:**

```bash
# On SSH server: Get host certificate
cd /etc/ssh
sudo step ssh certificate --host --sign server.homelab.local ssh_host_ecdsa_key.pub

# Configure SSHD to use certificate
echo 'HostCertificate /etc/ssh/ssh_host_ecdsa_key-cert.pub' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd

# On clients: Trust the host CA
step ssh config --host --roots >> ~/.ssh/known_hosts
# Prepend with: @cert-authority *
```

**Automate SSH Host Certificate Renewal:**

```bash
# Create weekly renewal cron
cat <<EOF | sudo tee /etc/cron.weekly/renew-ssh-cert
#!/bin/sh
export STEPPATH=/root/.step
cd /etc/ssh && step ssh renew ssh_host_ecdsa_key-cert.pub ssh_host_ecdsa_key --force
exit 0
EOF
sudo chmod 755 /etc/cron.weekly/renew-ssh-cert
```

### Using step-ca with nginx-proxy-manager

```bash
# 1. Get certificate from step-ca
step ca certificate npm.homelab.local npm.crt npm.key

# 2. In nginx-proxy-manager UI:
#    - SSL Certificates → Add SSL Certificate → Custom
#    - Upload npm.crt and npm.key
#    - Set up automatic renewal with step ca renew --daemon
```

### Using step-ca with Home Assistant

```yaml
# configuration.yaml
http:
  ssl_certificate: /ssl/homeassistant.crt
  ssl_key: /ssl/homeassistant.key

# Get certificate
# step ca certificate homeassistant.local /ssl/homeassistant.crt /ssl/homeassistant.key
```

### Monitoring and Management

```bash
# Check certificate expiration
step certificate inspect homeserver.crt --short
X.509v3 TLS Certificate (ECDSA P-256) [Serial: 7720...1576]
  Subject:     homeserver.local
  Issuer:      Home Lab Intermediate CA
  Valid from:  2025-05-15T00:59:37Z
          to:  2025-05-16T01:00:37Z

# Revoke a certificate (passive revocation - blocks renewal)
step ca revoke --cert homeserver.crt --key homeserver.key
✔ CA: https://ca.homelab.local:8443
Certificate with Serial Number 30671613121311574910895916201205874495 has been revoked.

# List provisioners
step ca provisioner list
```

## Comparison: Private CA vs Let's Encrypt

| Feature | Private CA | Let's Encrypt |
|---------|-----------|---------------|
| **Cost** | Free | Free |
| **Internal IPs** | ✅ Yes | ❌ No |
| **`.local` domains** | ✅ Yes | ❌ No |
| **Offline operation** | ✅ Yes | ❌ No |
| **Auto-renewal** | Manual/Custom | ✅ Built-in |
| **Public trust** | ❌ No | ✅ Yes |
| **Setup complexity** | Medium | Low |
| **Maintenance** | Manual | Automated |

**When to use Private CA:**
- Internal services only
- Private IP addresses
- `.local` or custom TLDs
- Air-gapped networks
- Full control needed

**When to use Let's Encrypt:**
- Public-facing services
- Public domain names
- Want automatic renewal
- Don't want to manage CA infrastructure

## Resources

- **[OpenSSL Documentation](https://www.openssl.org/docs/):** Complete OpenSSL reference
- **[easy-rsa](https://github.com/OpenVPN/easy-rsa):** Simplified CA management
- **[step-ca](https://smallstep.com/docs/step-ca):** Modern CA with ACME support
- **[PKI Tutorial](https://pki-tutorial.readthedocs.io/):** Comprehensive PKI guide

## Conclusion

Setting up a private CA might seem daunting at first, but once configured, it eliminates those annoying browser warnings and provides proper encryption for your homelab services. The initial time investment pays off with a more professional and secure home network.

**Key Takeaways:**
- Private CAs enable trusted HTTPS for internal services
- **step-ca is recommended** for modern, automated certificate management
- Two-tier hierarchy (Root + Intermediate) provides better security
- Install root CA certificate on all your devices once
- Automate certificate renewal to avoid expiration issues (step-ca makes this easy)
- Keep root CA private key offline and secure
- SSH certificates eliminate password authentication and improve security

**Quick Start Recommendation:**

For most homelabs, use step-ca:
1. `step ca init --acme --ssh` (one command setup)
2. `step certificate install $(step path)/certs/root_ca.crt` (trust on all devices)
3. `step ca certificate service.local service.crt service.key` (get certificates)
4. `step ca renew service.crt service.key --daemon` (automatic renewal)

Start small with a single service, get comfortable with the process, then expand to your entire homelab. Your future self will thank you when you're not clicking through security warnings anymore! 🔒
