---
title: "Preventing Credentials in Git: A Layered Defense Strategy"
date: 2022-03-21
categories: Development
tags: [Security, Git, Credentials, DevOps]
excerpt: "Prevention beats remediation. Build a multi-layered defense following OWASP DevSecOps principles with pre-commit hooks, secrets scanning, code linting, and automated detection."
thumbnail: /assets/git/thumbnail.png
---

After exploring [how to recover from credential leaks](/2022/02/Managing-Credentials-Committed-to-Git/), the obvious question emerges: how do we prevent credentials from entering Git in the first place? The answer isn't a single tool or technique—it's a layered defense strategy that catches mistakes at multiple stages before they become incidents.

Prevention is dramatically more effective than remediation. Removing credentials from Git history requires rewriting commits, coordinating with team members, and accepting that forks and mirrors may preserve the leak forever. In contrast, preventing the initial commit takes seconds and eliminates all downstream complexity. This post explores the practical tools and techniques that form a comprehensive credential protection strategy.

## The Defense Layers

Effective credential protection requires multiple overlapping defenses:

!!!anote "🛡️ Defense in Depth"
    **Layer 1: Configuration**
    - `.gitignore` prevents tracking credential files
    - Global patterns catch common mistakes
    - Template files guide proper structure
    
    **Layer 2: Code Practices**
    - Environment variables separate config from code
    - Configuration libraries enforce patterns
    - Code review catches hardcoded secrets
    
    **Layer 3: Automated Scanning**
    - Pre-commit hooks block commits with credentials
    - CI/CD pipeline scanning catches bypassed hooks
    - Repository scanning detects historical leaks
    
    **Layer 4: Secrets Management**
    - Centralized credential storage
    - Runtime secret injection
    - Automatic rotation capabilities
    
    **Layer 5: Monitoring**
    - Platform-provided scanning (GitHub, GitLab)
    - Custom pattern detection
    - Alert systems for rapid response

Each layer catches different types of mistakes and provides redundancy when other layers fail.

## Layer 1: Gitignore Configuration

The first defense prevents Git from tracking credential files.

### Essential Gitignore Patterns

Configure `.gitignore` to exclude common credential locations:

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.development
.env.production

# Configuration files
config/secrets.yml
config/database.yml
config/credentials.yml
secrets.json
secrets.yaml

# Key files
*.key
*.pem
*.p12
*.pfx
*.cer
*.crt
id_rsa
id_dsa

# Cloud provider credentials
.aws/credentials
.azure/credentials
gcloud-service-key.json

# IDE files that may contain credentials
.vscode/settings.json
.idea/workspace.xml
.idea/dataSources.xml
```

!!!tip "📝 Gitignore Best Practices"
    **Repository-Level Patterns**
    - Add patterns before first commit
    - Include project-specific credential files
    - Document why files are ignored
    - Commit `.gitignore` to repository
    
    **Global Gitignore**
    - Configure personal patterns globally
    - Covers IDE-specific files
    - Applies to all repositories
    
    ```bash
    # Set global gitignore
    git config --global core.excludesfile ~/.gitignore_global
    
    # Add common patterns
    cat >> ~/.gitignore_global << EOF
    .env
    *.key
    *.pem
    .DS_Store
    EOF
    ```

### Template Files for Guidance

Provide `.env.example` files showing required structure without actual credentials:

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_KEY=your_api_key_here
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
STRIPE_SECRET_KEY=sk_test_your_key_here
```

```bash
# .gitignore
.env
.env.local

# README.md instructions
# Copy .env.example to .env and fill in actual values
```

Template files guide developers toward proper credential management without exposing actual secrets.

## Layer 2: Environment Variables and Configuration

Separate credentials from code through environment variables and configuration management.

### Environment Variable Patterns

Store credentials in environment variables, never in code:

```python
# config.py - Bad: Hardcoded credentials
DATABASE_URL = "postgresql://user:pass123@localhost/db"
API_KEY = "sk_live_abc123xyz789"

# config.py - Good: Environment variables
import os

DATABASE_URL = os.environ["DATABASE_URL"]
API_KEY = os.environ["API_KEY"]

# config.py - Better: With validation and defaults
import os

def get_required_env(key):
    value = os.environ.get(key)
    if not value:
        raise ValueError(f"Required environment variable {key} is not set")
    return value

DATABASE_URL = get_required_env("DATABASE_URL")
API_KEY = get_required_env("API_KEY")
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
```

```javascript
// config.js - Bad: Hardcoded credentials
const config = {
  apiKey: "sk_live_abc123xyz789",
  dbPassword: "password123"
};

// config.js - Good: Environment variables
const config = {
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD
};

// config.js - Better: With validation
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

const config = {
  apiKey: requireEnv("API_KEY"),
  dbPassword: requireEnv("DB_PASSWORD"),
  debug: process.env.DEBUG === "true"
};
```

!!!success "✅ Environment Variable Benefits"
    **Advantages**
    - Credentials never in source code
    - Different values per environment
    - Easy rotation without code changes
    - Standard across languages and platforms
    - Supported by deployment systems
    
    **Implementation Guidelines**
    - Validate required variables at startup
    - Fail fast if credentials missing
    - Document all required variables
    - Provide sensible defaults for non-secrets
    - Use consistent naming conventions

### Configuration Libraries

Use configuration libraries that enforce environment variable patterns:

```python
# Using python-decouple
from decouple import config

DATABASE_URL = config("DATABASE_URL")
API_KEY = config("API_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
```

```javascript
// Using dotenv
require('dotenv').config();

const config = {
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD
};
```

Configuration libraries provide consistent patterns and reduce boilerplate.

## Layer 3: Pre-commit Hooks

Automated scanning catches credentials before they enter Git history. According to the [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/latest/01-Pre-commit), the pre-commit phase is critical because it prevents security issues before they reach the central repository. This phase focuses on two key areas: secrets management and code linting, ensuring higher quality code through early detection.

### Why Pre-commit Matters

The pre-commit phase serves as the first line of defense:

!!!anote "🎯 Pre-commit Benefits"
    **Early Detection**
    - Catches issues before they enter repository
    - Prevents secrets from reaching central Git server
    - Blocks commits immediately at developer workstation
    - Reduces remediation costs dramatically
    
    **Quality Enforcement**
    - Enforces coding standards through linters
    - Validates code formatting consistency
    - Checks for security vulnerabilities
    - Ensures compliance with team guidelines
    
    **Developer Feedback**
    - Immediate feedback loop
    - Educates developers on security practices
    - Prevents embarrassing public leaks
    - Builds security awareness

### Basic Pre-commit Hook

Create a simple hook to detect common credential patterns:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Get staged changes
STAGED_DIFF=$(git diff --cached)

# Check for common credential patterns
if echo "$STAGED_DIFF" | grep -qE "(password|api_key|secret|token)\s*=\s*['\"][^'\"]+['\"]"; then
  echo "❌ Error: Potential credentials detected in commit"
  echo "Please remove credentials and use environment variables"
  exit 1
fi

# Check for AWS access keys
if echo "$STAGED_DIFF" | grep -qE "AKIA[0-9A-Z]{16}"; then
  echo "❌ Error: AWS access key detected"
  exit 1
fi

# Check for private keys
if echo "$STAGED_DIFF" | grep -qE "BEGIN.*PRIVATE KEY"; then
  echo "❌ Error: Private key detected"
  exit 1
fi

# Check for high entropy strings (potential secrets)
if echo "$STAGED_DIFF" | grep -qE "['\"][a-zA-Z0-9]{32,}['\"]"; then
  echo "⚠️  Warning: High entropy string detected (possible secret)"
  echo "Review carefully before committing"
fi

exit 0
```

### Using git-secrets

AWS's git-secrets provides comprehensive credential detection:

```bash
# Install git-secrets
brew install git-secrets  # macOS
# or
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# Install hooks in repository
cd /path/to/your/repo
git secrets --install

# Register AWS patterns
git secrets --register-aws

# Add custom patterns
git secrets --add 'password\s*=\s*["\'][^"\']+["\']'
git secrets --add 'api[_-]?key\s*=\s*["\'][^"\']+["\']'
git secrets --add '["\'][a-zA-Z0-9]{32,}["\']'

# Scan repository history
git secrets --scan-history
```

!!!tip "🔧 git-secrets Configuration"
    **Global Installation**
    ```bash
    # Install hooks in all repositories
    git secrets --install ~/.git-templates/git-secrets
    git config --global init.templateDir ~/.git-templates/git-secrets
    ```
    
    **Custom Patterns**
    ```bash
    # Add organization-specific patterns
    git secrets --add 'MYCOMPANY_[A-Z_]+\s*=\s*["\'][^"\']+["\']'
    git secrets --add 'internal[_-]token\s*:\s*["\'][^"\']+["\']'
    ```
    
    **Allowed Patterns**
    ```bash
    # Whitelist false positives
    git secrets --add --allowed 'example_password'
    git secrets --add --allowed 'test_api_key'
    ```

### Using detect-secrets

Yelp's detect-secrets offers advanced entropy-based detection:

```bash
# Install detect-secrets
pip install detect-secrets

# Create baseline
detect-secrets scan > .secrets.baseline

# Commit baseline
git add .secrets.baseline
git commit -m "Add secrets baseline"

# Install pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
detect-secrets-hook --baseline .secrets.baseline $(git diff --cached --name-only)
EOF
chmod +x .git/hooks/pre-commit
```

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

!!!success "✅ detect-secrets Features"
    **Advanced Detection**
    - Entropy-based secret detection
    - Plugin system for custom detectors
    - Baseline for managing false positives
    - Supports multiple secret types
    
    **Managing False Positives**
    ```bash
    # Audit baseline
    detect-secrets audit .secrets.baseline
    
    # Update baseline
    detect-secrets scan --baseline .secrets.baseline
    ```

### Using pre-commit Framework

The pre-commit framework manages multiple hooks:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
      
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.16.1
    hooks:
      - id: gitleaks
```

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

The pre-commit framework provides consistent hook management across projects.

### Code Linting Integration

Beyond secrets detection, pre-commit hooks should enforce code quality:

```yaml
# .pre-commit-config.yaml - Comprehensive setup
repos:
  # Security: Secrets detection
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
  
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: trailing-whitespace
      - id: end-of-file-fixer
  
  # Code Quality: Linting
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3
  
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=88']
  
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.40.0
    hooks:
      - id: eslint
        files: \.[jt]sx?$
        types: [file]
```

!!!tip "🔧 Linting Best Practices"
    **Python Projects**
    - **Black**: Code formatting
    - **Flake8**: Style guide enforcement
    - **Pylint**: Code analysis
    - **mypy**: Type checking
    
    **JavaScript/TypeScript Projects**
    - **ESLint**: Code quality and style
    - **Prettier**: Code formatting
    - **TSLint**: TypeScript-specific rules
    
    **Benefits of Linting**
    - Consistent code style across team
    - Catches common bugs early
    - Enforces security best practices
    - Reduces code review friction
    - Improves code maintainability

Combining secrets detection with code linting creates a comprehensive pre-commit defense that addresses both security and quality concerns.

## Layer 4: CI/CD Pipeline Scanning

Catch credentials that bypass pre-commit hooks through CI/CD scanning.

### GitHub Actions Integration

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI Integration

```yaml
# .gitlab-ci.yml
secret-detection:
  stage: test
  image: python:3.9
  before_script:
    - pip install detect-secrets
  script:
    - detect-secrets scan --baseline .secrets.baseline
  only:
    - merge_requests
    - main
```

### Custom Scanning Script

```python
# scripts/scan_secrets.py
import re
import sys
import subprocess

PATTERNS = [
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key'),
    (r'password\s*=\s*["\'][^"\']+["\']', 'Password'),
    (r'api[_-]?key\s*=\s*["\'][^"\']+["\']', 'API Key'),
    (r'BEGIN.*PRIVATE KEY', 'Private Key'),
]

def scan_commit(commit_hash):
    diff = subprocess.check_output(
        ['git', 'show', commit_hash],
        text=True
    )
    
    findings = []
    for pattern, name in PATTERNS:
        matches = re.findall(pattern, diff, re.IGNORECASE)
        if matches:
            findings.append({
                'type': name,
                'pattern': pattern,
                'count': len(matches)
            })
    
    return findings

if __name__ == '__main__':
    commit = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'],
        text=True
    ).strip()
    
    findings = scan_commit(commit)
    if findings:
        print("❌ Credentials detected in commit!")
        for finding in findings:
            print(f"  - {finding['type']}: {finding['count']} match(es)")
        sys.exit(1)
    
    print("✅ No credentials detected")
```

CI/CD scanning provides a safety net when developers bypass local hooks.

## Layer 5: Secrets Management Systems

Replace environment variables with centralized secrets management for production.

### AWS Secrets Manager

```python
# Fetch secrets at runtime
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# Use in application
secrets = get_secret('production/app/credentials')
DATABASE_URL = secrets['database_url']
API_KEY = secrets['api_key']
```

### HashiCorp Vault

```python
# Using hvac library
import hvac

client = hvac.Client(url='https://vault.example.com')
client.auth.approle.login(
    role_id=os.environ['VAULT_ROLE_ID'],
    secret_id=os.environ['VAULT_SECRET_ID']
)

secrets = client.secrets.kv.v2.read_secret_version(
    path='production/app'
)
DATABASE_URL = secrets['data']['data']['database_url']
```

### Kubernetes Secrets

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0BkYi9uYW1l
  api-key: c2tfbGl2ZV9hYmMxMjN4eXo3ODk=
```

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

!!!anote "🔐 Secrets Management Benefits"
    **Advantages**
    - Centralized credential storage
    - Automatic rotation capabilities
    - Access control and auditing
    - Encryption at rest and in transit
    - Integration with cloud platforms
    - Short-lived credentials reduce exposure window
    
    **When to Use**
    - Production environments
    - Multi-service architectures
    - Compliance requirements
    - Automated credential rotation needed
    - Team-wide credential sharing

### Short-Lived Credentials

Secrets management systems enable short-lived credentials that automatically expire:

```python
# AWS STS temporary credentials
import boto3

sts = boto3.client('sts')
response = sts.assume_role(
    RoleArn='arn:aws:iam::123456789012:role/AppRole',
    RoleSessionName='app-session',
    DurationSeconds=3600  # 1 hour
)

credentials = response['Credentials']
# Use temporary credentials
```

```python
# Vault dynamic secrets
import hvac

client = hvac.Client(url='https://vault.example.com')
client.auth.approle.login(
    role_id=os.environ['VAULT_ROLE_ID'],
    secret_id=os.environ['VAULT_SECRET_ID']
)

# Generate short-lived database credentials
db_creds = client.secrets.database.generate_credentials(
    name='my-role',
    ttl='1h'
)

username = db_creds['data']['username']
password = db_creds['data']['password']
# Credentials automatically expire after 1 hour
```

!!!success "✅ Short-Lived Credential Benefits"
    **Security Advantages**
    - Credentials expire automatically
    - Reduced window for credential compromise
    - No manual rotation required
    - Leaked credentials become invalid quickly
    - Limits blast radius of credential exposure
    
    **Implementation Patterns**
    - AWS STS for temporary AWS credentials (15 min - 12 hours)
    - Vault dynamic secrets for databases (minutes to hours)
    - OAuth tokens with short expiration (minutes to hours)
    - Service account tokens with TTL
    - Certificate-based authentication with short validity
    
    **Best Practices**
    - Set shortest practical TTL for credentials
    - Implement automatic credential refresh
    - Monitor credential usage patterns
    - Revoke credentials on application shutdown
    - Use credential caching to minimize requests

## Layer 6: Push Protection with GitProxy

For organizations requiring approval workflows, [GitProxy](https://git-proxy.finos.org/) provides custom push protections and policies on top of Git.

### What is GitProxy?

GitProxy is a highly configurable framework that enforces push protections while maintaining developer experience:

!!!anote "🛡️ GitProxy Features"
    **Developer-First Design**
    - Intercepts pushes before reaching remote repository
    - Presents remediation instructions in CLI/Terminal
    - Minimizes friction and adoption barriers
    - Keeps developers focused on committing code
    
    **Approval Workflow**
    - Holds pushes in suspended state
    - Requires explicit approval before upstream push
    - Provides web UI, REST API, and CLI for approvals
    - Generates shareable links for push review
    
    **Configurable Policies**
    - Custom push protection rules
    - Organization-specific security posture
    - Risk appetite alignment
    - Integration with existing workflows

### Quick Setup

```bash
# Install GitProxy
npm install -g @finos/git-proxy

# Create configuration
cat > proxy.config.json << EOF
{
  "authorisedList": [
    {
      "project": "your-org",
      "name": "your-repo",
      "url": "https://github.com/your-org/your-repo.git"
    }
  ]
}
EOF

# Run GitProxy
npx @finos/git-proxy --config ./proxy.config.json

# Configure repository to use GitProxy
git remote set-url origin http://localhost:8000/your-org/your-repo.git
```

### Approval Workflow

When a developer pushes code:

```bash
$ git push
remote:
remote: GitProxy has received your push ✅
remote:
remote: 🔗 Shareable Link
remote: http://localhost:8080/dashboard/push/000000__b12557
```

Approve via CLI:

```bash
# Login
npx @finos/git-proxy-cli login --username admin --password admin

# Approve push
npx @finos/git-proxy-cli authorise --id 000000__b12557

# Developer re-pushes
git push  # Now succeeds
```

!!!tip "🎯 GitProxy Use Cases"
    **When to Use GitProxy**
    - Regulated industries requiring approval workflows
    - Organizations with strict change control
    - Teams needing push review before production
    - Compliance requirements for code changes
    - Additional layer beyond pre-commit hooks
    
    **Benefits**
    - Centralized push control
    - Audit trail of all pushes
    - Policy enforcement at organization level
    - Cannot be bypassed by developers
    - Complements pre-commit hooks

## Layer 7: Platform Scanning and Monitoring

Leverage platform-provided scanning for continuous monitoring.

### GitHub Secret Scanning

GitHub automatically scans public repositories:

!!!anote "🔍 GitHub Secret Scanning"
    **Automatic Detection**
    - Scans all commits in public repositories
    - Detects 100+ credential patterns
    - Notifies repository admins
    - Alerts credential providers (AWS, Azure, etc.)
    
    **GitHub Advanced Security**
    - Available for private repositories
    - Custom pattern support
    - Push protection (blocks commits)
    - Integration with security advisories
    
    **Enabling Push Protection**
    ```
    Settings → Code security and analysis
    → Push protection → Enable
    ```

### GitLab Secret Detection

```yaml
# .gitlab-ci.yml
include:
  - template: Security/Secret-Detection.gitlab-ci.yml

secret_detection:
  variables:
    SECRET_DETECTION_HISTORIC_SCAN: "true"
```

### Custom Monitoring

```python
# Monitor new commits
import requests
import re

def check_commit(repo, commit_sha):
    url = f"https://api.github.com/repos/{repo}/commits/{commit_sha}"
    response = requests.get(url)
    commit_data = response.json()
    
    patterns = [
        r'AKIA[0-9A-Z]{16}',
        r'password\s*=\s*["\'][^"\']+["\']',
    ]
    
    for file in commit_data.get('files', []):
        patch = file.get('patch', '')
        for pattern in patterns:
            if re.search(pattern, patch):
                alert_security_team(repo, commit_sha, pattern)
```

Continuous monitoring catches credentials that slip through other layers.

## Implementation Strategy

Roll out credential protection incrementally following OWASP DevSecOps principles:

!!!tip "📋 Implementation Roadmap"
    **Phase 1: Foundation (Week 1)**
    - Add comprehensive `.gitignore` patterns
    - Create `.env.example` templates
    - Document environment variable requirements
    - Audit existing code for hardcoded credentials
    
    **Phase 2: Pre-commit Protection (Week 2)**
    - Install git-secrets or detect-secrets
    - Configure pre-commit hooks for secrets detection
    - Add code linting hooks (Black, ESLint, etc.)
    - Train team on pre-commit workflow
    - Establish code review guidelines
    
    **Phase 3: CI/CD Integration (Week 3)**
    - Add secret scanning to CI/CD pipeline
    - Integrate linting checks in build process
    - Configure automated alerts
    - Block merges with detected credentials or linting failures
    - Set up monitoring dashboards
    
    **Phase 4: Push Protection (Week 4)**
    - Evaluate GitProxy for approval workflows
    - Configure push policies and authorized repositories
    - Set up approval processes (UI, CLI, API)
    - Train team on approval workflow
    - Document escalation procedures
    
    **Phase 5: Secrets Management (Week 5+)**
    - Evaluate secrets management solutions
    - Migrate production credentials
    - Implement automatic rotation
    - Document operational procedures
    
    **Phase 6: Continuous Improvement**
    - Review and update detection patterns
    - Analyze false positive rates
    - Gather team feedback
    - Refine linting rules based on team needs
    - Conduct regular security training

## Handling False Positives

All scanning tools generate false positives that require management:

```bash
# git-secrets: Allow specific patterns
git secrets --add --allowed 'example_password'
git secrets --add --allowed 'test_api_key'

# detect-secrets: Audit and mark false positives
detect-secrets audit .secrets.baseline
# Interactive: mark each finding as real or false positive

# gitleaks: Use .gitleaksignore
echo "path/to/test/file.py" >> .gitleaksignore
```

```yaml
# Custom configuration for detect-secrets
# .secrets.baseline
{
  "exclude": {
    "files": "test/.*|.*\\.example$",
    "lines": "password.*=.*example"
  }
}
```

!!!warning "⚠️ False Positive Management"
    **Best Practices**
    - Review each false positive carefully
    - Document why patterns are allowed
    - Use specific allowlists, not broad patterns
    - Regularly audit allowed patterns
    - Remove obsolete allowlist entries

## Conclusion

Preventing credentials from entering Git requires a layered defense strategy aligned with OWASP DevSecOps principles. No single tool catches every mistake, but multiple overlapping defenses create a robust protection system. The pre-commit phase is particularly critical—it's your first and most effective line of defense, catching issues before they reach the central repository.

Start with `.gitignore` configuration and environment variables to establish proper patterns. Add pre-commit hooks for automated local scanning of both secrets and code quality. Implement CI/CD pipeline checks to catch bypassed hooks. For organizations requiring approval workflows, GitProxy provides an additional layer of push protection that cannot be bypassed. Deploy secrets management systems for production credentials, prioritizing short-lived credentials that automatically expire to minimize exposure windows. Enable platform scanning for continuous monitoring.

The investment in prevention pays immediate dividends. Each prevented credential leak avoids the complexity of [Git history rewriting, credential rotation, and incident response](/2022/02/Managing-Credentials-Committed-to-Git/). The operational burden of maintaining scanning tools is minimal compared to the cost of credential compromise.

Start with the basics—proper `.gitignore` and environment variables—then add layers incrementally. Pre-commit hooks should be your next priority, combining secrets detection with code linting for comprehensive quality enforcement. Even basic pre-commit hooks catch the majority of accidental commits. For regulated environments, consider GitProxy to enforce approval workflows. Advanced secrets management with short-lived credentials represents the gold standard but can wait until your team has mastered the fundamentals.

Remember: every credential committed to Git should be treated as compromised. Prevention isn't just about tools—it's about building a culture where credential protection and code quality are automatic, not afterthoughts. Short-lived credentials embody defense in depth—even if leaked, they expire quickly, limiting the damage. The pre-commit phase provides immediate feedback and education to developers at the moment they need it most.
