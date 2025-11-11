---
title: "Federated Identity: One Login to Rule Them All"
date: 2019-12-15
categories:
  - Architecture
series: architecture_pattern
excerpt: "Delegate authentication to external identity providers to simplify development, reduce administrative overhead, and improve user experience across multiple applications and organizations."
lang: en
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

Imagine carrying a different key for every building you need to enter—your office, the gym, the library, your apartment. Now imagine having one master key that works everywhere, but each building still controls who gets access. This is the essence of federated identity: one set of credentials, trusted across multiple systems, while each system maintains control over what you can do.

## The Challenge: Too Many Passwords, Too Many Problems

In today's interconnected world, users work with applications from multiple organizations—their employer, business partners, cloud service providers, and third-party tools. Each application traditionally requires its own authentication system.

### The Traditional Approach: Separate Credentials Everywhere

```javascript
// Each application manages its own users
class TraditionalAuthSystem {
  constructor() {
    this.users = new Map();
  }
  
  async register(username, password, email) {
    // Store credentials in application database
    const hashedPassword = await this.hashPassword(password);
    this.users.set(username, {
      password: hashedPassword,
      email: email,
      createdAt: new Date()
    });
  }
  
  async login(username, password) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }
    
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }
    
    return this.createSession(username);
  }
}
```

!!!warning "⚠️ Problems with Traditional Authentication"
    **Disjointed User Experience**: Users forget credentials when managing multiple accounts
    
    **Security Vulnerabilities**: Departing employees' accounts may not be deprovisioned promptly
    
    **Administrative Burden**: Managing users, passwords, and permissions across systems
    
    **Development Overhead**: Building and maintaining authentication infrastructure

## The Solution: Federated Identity

Delegate authentication to trusted external identity providers. Users authenticate once with their identity provider, then access multiple applications without re-entering credentials.

{% mermaid %}
graph LR
    User([User]) -->|1. Access App| App[Application]
    App -->|2. Redirect to IdP| IdP[Identity Provider]
    User -->|3. Authenticate| IdP
    IdP -->|4. Issue Token| STS[Security Token Service]
    STS -->|5. Return Token with Claims| App
    App -->|6. Grant Access| User
    
    style User fill:#4dabf7,stroke:#1971c2
    style App fill:#51cf66,stroke:#2f9e44
    style IdP fill:#ffd43b,stroke:#f59f00
    style STS fill:#ff8787,stroke:#c92a2a
{% endmermaid %}

### How It Works

1. **User attempts to access application**: The application detects the user is not authenticated
2. **Redirect to Identity Provider**: Application redirects user to trusted identity provider
3. **User authenticates**: User provides credentials to their identity provider
4. **Token issuance**: Identity provider issues a security token containing claims about the user
5. **Token validation**: Application validates the token and extracts user information
6. **Access granted**: User accesses the application without creating new credentials

## Core Components

### 1. Identity Provider (IdP)

The trusted authority that authenticates users and issues tokens:

```javascript
class IdentityProvider {
  constructor(userDirectory) {
    this.userDirectory = userDirectory;
    this.trustedApplications = new Set();
  }
  
  async authenticate(username, password, applicationId) {
    // Verify application is trusted
    if (!this.trustedApplications.has(applicationId)) {
      throw new Error('Untrusted application');
    }
    
    // Authenticate user against directory
    const user = await this.userDirectory.validateCredentials(
      username, 
      password
    );
    
    if (!user) {
      throw new Error('Authentication failed');
    }
    
    // Issue token with claims
    return this.issueToken(user, applicationId);
  }
  
  issueToken(user, applicationId) {
    const claims = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      department: user.department,
      issuer: 'corporate-idp',
      audience: applicationId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (3600 * 1000) // 1 hour
    };
    
    // Sign the token
    return this.signToken(claims);
  }
}
```

### 2. Security Token Service (STS)

Transforms and augments tokens, establishing trust between identity providers and applications:

```javascript
class SecurityTokenService {
  constructor(trustedIdPs) {
    this.trustedIdPs = trustedIdPs;
    this.claimMappings = new Map();
  }
  
  async transformToken(incomingToken, targetApplication) {
    // Verify token is from trusted IdP
    const tokenInfo = await this.validateToken(incomingToken);
    
    if (!this.trustedIdPs.has(tokenInfo.issuer)) {
      throw new Error('Token from untrusted issuer');
    }
    
    // Transform claims for target application
    const transformedClaims = this.transformClaims(
      tokenInfo.claims,
      targetApplication
    );
    
    // Issue new token for target application
    return this.issueToken(transformedClaims, targetApplication);
  }
  
  transformClaims(claims, targetApplication) {
    const mapping = this.claimMappings.get(targetApplication);
    
    if (!mapping) {
      return claims; // No transformation needed
    }
    
    const transformed = {};
    
    for (const [sourceClaim, targetClaim] of mapping.entries()) {
      if (claims[sourceClaim]) {
        transformed[targetClaim] = claims[sourceClaim];
      }
    }
    
    // Add application-specific claims
    transformed.applicationId = targetApplication;
    transformed.transformedAt = Date.now();
    
    return transformed;
  }
}
```

### 3. Claims-Based Access Control

Applications authorize access based on claims in the token:

```javascript
class ClaimsBasedAuthorization {
  constructor() {
    this.policies = new Map();
  }
  
  definePolicy(resource, requiredClaims) {
    this.policies.set(resource, requiredClaims);
  }
  
  async authorize(token, resource) {
    // Extract claims from token
    const claims = await this.extractClaims(token);
    
    // Get required claims for resource
    const required = this.policies.get(resource);
    
    if (!required) {
      return true; // No policy defined, allow access
    }
    
    // Check if user has required claims
    return this.evaluateClaims(claims, required);
  }
  
  evaluateClaims(userClaims, requiredClaims) {
    for (const [claimType, requiredValue] of Object.entries(requiredClaims)) {
      const userValue = userClaims[claimType];
      
      if (!userValue) {
        return false; // Missing required claim
      }
      
      if (Array.isArray(requiredValue)) {
        // Check if user has any of the required values
        if (!requiredValue.includes(userValue)) {
          return false;
        }
      } else if (userValue !== requiredValue) {
        return false;
      }
    }
    
    return true;
  }
}

// Usage example
const authz = new ClaimsBasedAuthorization();

// Define access policies
authz.definePolicy('/admin', {
  role: ['admin', 'superuser']
});

authz.definePolicy('/reports/financial', {
  role: 'manager',
  department: 'finance'
});

// Check authorization
const canAccess = await authz.authorize(userToken, '/admin');
```

## Implementation Example

Here's a complete federated authentication flow:

```javascript
class FederatedApplication {
  constructor(identityProviderUrl, applicationId, secretKey) {
    this.identityProviderUrl = identityProviderUrl;
    this.applicationId = applicationId;
    this.secretKey = secretKey;
    this.authorization = new ClaimsBasedAuthorization();
  }
  
  // Middleware to protect routes
  requireAuthentication() {
    return async (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        // Redirect to identity provider
        const redirectUrl = this.buildAuthenticationUrl(req.originalUrl);
        return res.redirect(redirectUrl);
      }
      
      try {
        // Validate token
        const claims = await this.validateToken(token);
        
        // Attach user information to request
        req.user = claims;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
  }
  
  buildAuthenticationUrl(returnUrl) {
    const params = new URLSearchParams({
      client_id: this.applicationId,
      return_url: returnUrl,
      response_type: 'token'
    });
    
    return `${this.identityProviderUrl}/authenticate?${params}`;
  }
  
  async handleCallback(req, res) {
    const { token } = req.query;
    
    try {
      // Validate token from IdP
      const claims = await this.validateToken(token);
      
      // Create application session
      const sessionToken = await this.createSession(claims);
      
      // Redirect to original destination
      const returnUrl = req.query.return_url || '/';
      res.redirect(`${returnUrl}?token=${sessionToken}`);
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
  
  async validateToken(token) {
    // Verify token signature
    const payload = await this.verifySignature(token, this.secretKey);
    
    // Check expiration
    if (payload.expiresAt < Date.now()) {
      throw new Error('Token expired');
    }
    
    // Verify audience
    if (payload.audience !== this.applicationId) {
      throw new Error('Token not intended for this application');
    }
    
    return payload;
  }
}

// Setup application
const app = express();
const federatedApp = new FederatedApplication(
  'https://idp.company.com',
  'my-application-id',
  process.env.SECRET_KEY
);

// Callback endpoint for IdP
app.get('/auth/callback', (req, res) => {
  federatedApp.handleCallback(req, res);
});

// Protected routes
app.get('/dashboard', 
  federatedApp.requireAuthentication(),
  (req, res) => {
    res.json({
      message: 'Welcome to dashboard',
      user: req.user
    });
  }
);
```

## Home Realm Discovery

When multiple identity providers are available, the system must determine which one to use:

```javascript
class HomeRealmDiscovery {
  constructor() {
    this.providerMappings = new Map();
    this.defaultProvider = null;
  }
  
  registerProvider(identifier, providerUrl) {
    this.providerMappings.set(identifier, providerUrl);
  }
  
  setDefaultProvider(providerUrl) {
    this.defaultProvider = providerUrl;
  }
  
  discoverProvider(userIdentifier) {
    // Extract domain from email
    if (userIdentifier.includes('@')) {
      const domain = userIdentifier.split('@')[1];
      
      // Check if domain has mapped provider
      if (this.providerMappings.has(domain)) {
        return this.providerMappings.get(domain);
      }
    }
    
    // Check for subdomain-based discovery
    const subdomain = this.extractSubdomain(userIdentifier);
    if (subdomain && this.providerMappings.has(subdomain)) {
      return this.providerMappings.get(subdomain);
    }
    
    // Return default provider
    return this.defaultProvider;
  }
  
  async promptUserSelection(availableProviders) {
    // Present user with list of identity providers
    return {
      providers: Array.from(this.providerMappings.entries()).map(
        ([name, url]) => ({ name, url })
      )
    };
  }
}

// Usage
const discovery = new HomeRealmDiscovery();

// Map domains to identity providers
discovery.registerProvider('company.com', 'https://idp.company.com');
discovery.registerProvider('partner.com', 'https://sso.partner.com');
discovery.registerProvider('social', 'https://social-idp.com');

// Discover provider for user
const provider = discovery.discoverProvider('user@company.com');
// Returns: https://idp.company.com
```

## Benefits of Federated Identity

### 1. Single Sign-On (SSO)

Users authenticate once and access multiple applications:

{% mermaid %}
sequenceDiagram
    participant User
    participant App1
    participant App2
    participant IdP
    
    User->>App1: Access Application 1
    App1->>IdP: Redirect for authentication
    User->>IdP: Provide credentials
    IdP->>App1: Return token
    App1->>User: Grant access
    
    Note over User,App2: Later, user accesses App2
    
    User->>App2: Access Application 2
    App2->>IdP: Check authentication
    IdP->>App2: Return existing token
    App2->>User: Grant access (no login required)
{% endmermaid %}

### 2. Centralized Identity Management

Identity provider manages all user accounts:

```javascript
class CentralizedIdentityManagement {
  async onboardEmployee(employee) {
    // Create account in identity provider
    await this.identityProvider.createUser({
      username: employee.email,
      name: employee.name,
      department: employee.department,
      roles: employee.roles
    });
    
    // Employee automatically has access to all applications
    // No need to create accounts in each application
  }
  
  async offboardEmployee(employeeId) {
    // Disable account in identity provider
    await this.identityProvider.disableUser(employeeId);
    
    // Employee immediately loses access to all applications
    // No need to deactivate accounts in each application
  }
  
  async updateEmployeeRole(employeeId, newRole) {
    // Update role in identity provider
    await this.identityProvider.updateUser(employeeId, {
      roles: [newRole]
    });
    
    // Role change propagates to all applications
  }
}
```

### 3. Reduced Development Overhead

Applications don't need to implement authentication:

```javascript
// Before: Complex authentication logic
class ApplicationWithAuth {
  async register(user) { /* ... */ }
  async login(credentials) { /* ... */ }
  async resetPassword(email) { /* ... */ }
  async verifyEmail(token) { /* ... */ }
  async enable2FA(userId) { /* ... */ }
  // ... hundreds of lines of auth code
}

// After: Delegate to identity provider
class ApplicationWithFederation {
  constructor(identityProvider) {
    this.identityProvider = identityProvider;
  }
  
  async authenticate(token) {
    // Simply validate token
    return await this.identityProvider.validateToken(token);
  }
}
```

## Design Considerations

### 1. Single Point of Failure

Identity provider availability is critical:

!!!warning "🔒 Reliability Considerations"
    **Deploy across multiple datacenters**: Ensure identity provider has high availability
    
    **Implement caching**: Cache tokens and validation results to handle temporary outages
    
    **Graceful degradation**: Allow limited functionality when IdP is unavailable
    
    **Monitor health**: Continuously monitor identity provider availability

```javascript
class ResilientTokenValidation {
  constructor(identityProvider, cache) {
    this.identityProvider = identityProvider;
    this.cache = cache;
  }
  
  async validateToken(token) {
    // Check cache first
    const cached = await this.cache.get(`token:${token}`);
    if (cached) {
      return cached;
    }
    
    try {
      // Validate with identity provider
      const claims = await this.identityProvider.validate(token);
      
      // Cache successful validation
      await this.cache.set(`token:${token}`, claims, 300); // 5 minutes
      
      return claims;
    } catch (error) {
      // If IdP is unavailable, check if we have cached validation
      const fallback = await this.cache.get(`token:fallback:${token}`);
      if (fallback) {
        console.warn('Using cached token validation due to IdP unavailability');
        return fallback;
      }
      
      throw error;
    }
  }
}
```

### 2. Social Identity Providers

Social providers offer limited user information:

```javascript
class SocialIdentityIntegration {
  async handleSocialLogin(socialToken, provider) {
    // Extract claims from social provider
    const socialClaims = await this.validateSocialToken(socialToken, provider);
    
    // Social providers typically only provide:
    // - Unique identifier
    // - Email (sometimes)
    // - Name (sometimes)
    
    // Check if user exists in application
    let user = await this.findUserBySocialId(
      provider,
      socialClaims.id
    );
    
    if (!user) {
      // First time login - need to register
      user = await this.registerSocialUser({
        socialProvider: provider,
        socialId: socialClaims.id,
        email: socialClaims.email,
        name: socialClaims.name
      });
    }
    
    // Augment claims with application-specific information
    return {
      ...socialClaims,
      userId: user.id,
      roles: user.roles,
      preferences: user.preferences
    };
  }
}
```

### 3. Token Lifetime and Refresh

Manage token expiration and renewal:

```javascript
class TokenLifecycleManager {
  constructor(identityProvider) {
    this.identityProvider = identityProvider;
  }
  
  async issueTokenPair(user) {
    // Short-lived access token
    const accessToken = await this.createToken(user, {
      type: 'access',
      expiresIn: 900 // 15 minutes
    });
    
    // Long-lived refresh token
    const refreshToken = await this.createToken(user, {
      type: 'refresh',
      expiresIn: 2592000 // 30 days
    });
    
    return { accessToken, refreshToken };
  }
  
  async refreshAccessToken(refreshToken) {
    // Validate refresh token
    const claims = await this.validateToken(refreshToken);
    
    if (claims.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Issue new access token
    return await this.createToken(claims, {
      type: 'access',
      expiresIn: 900
    });
  }
}
```

## When to Use This Pattern

!!!tip "✅ Ideal Scenarios"
    **Enterprise Single Sign-On**: Employees access multiple corporate applications
    
    **Multi-Partner Collaboration**: Business partners need access without corporate accounts
    
    **SaaS Applications**: Multi-tenant applications where each tenant uses their own identity provider
    
    **Consumer Applications**: Allow users to sign in with social identity providers

!!!warning "❌ Not Suitable When"
    **Single Identity Provider**: All users authenticate with one system accessible to the application
    
    **Legacy Systems**: Application cannot handle modern authentication protocols
    
    **Highly Isolated Systems**: Security requirements prohibit external authentication

## Real-World Example: Multi-Tenant SaaS

```javascript
class MultiTenantSaaS {
  constructor() {
    this.tenants = new Map();
    this.sts = new SecurityTokenService();
  }
  
  async registerTenant(tenantId, identityProviderConfig) {
    // Register tenant's identity provider
    this.tenants.set(tenantId, {
      id: tenantId,
      identityProvider: identityProviderConfig,
      users: new Set()
    });
    
    // Configure STS to trust tenant's IdP
    await this.sts.addTrustedProvider(
      identityProviderConfig.issuer,
      identityProviderConfig.publicKey
    );
  }
  
  async authenticateUser(token) {
    // Validate token with STS
    const claims = await this.sts.validateToken(token);
    
    // Determine tenant from token
    const tenantId = claims.tenantId;
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      throw new Error('Unknown tenant');
    }
    
    // Verify user belongs to tenant
    if (!tenant.users.has(claims.userId)) {
      // First time user - add to tenant
      tenant.users.add(claims.userId);
    }
    
    return {
      user: claims,
      tenant: tenant
    };
  }
}
```

## Summary

Federated identity transforms authentication from a burden into an enabler. By delegating authentication to trusted identity providers, you:

- **Improve user experience** with single sign-on
- **Enhance security** with centralized identity management
- **Reduce development effort** by avoiding custom authentication
- **Enable collaboration** across organizational boundaries

The pattern is particularly powerful in enterprise and multi-tenant scenarios where users need seamless access to multiple applications while maintaining security and control.

## Reference

- [Federated Identity Pattern - Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/federated-identity)
