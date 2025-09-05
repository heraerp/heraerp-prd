# HERA Enterprise Security

## Overview

HERA implements defense-in-depth security architecture with multiple layers of protection for enterprise data and operations.

## Security Architecture

### 1. Authentication & SSO

#### SAML 2.0 Support
- Identity Provider integration (Okta, Azure AD, OneLogin)
- Just-In-Time (JIT) user provisioning
- Attribute mapping for roles and permissions
- Session management with configurable timeouts

#### OpenID Connect (OIDC)
- OAuth 2.0 + OIDC for modern authentication
- PKCE support for enhanced security
- Token refresh with rotation
- Multi-factor authentication (MFA) enforcement

#### Implementation
```typescript
// Configure SSO for organization
await ssoProvider.configureSSOProvider({
  provider: 'saml',
  tenant_id: organizationId,
  metadata: {
    issuer: 'https://idp.company.com',
    sso_url: 'https://idp.company.com/sso',
    certificate: '...',
  },
  attribute_mapping: {
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    name: 'displayName',
    groups: 'memberOf'
  },
  smart_code: 'HERA.SECURITY.SSO.SAML.CONFIG.v1'
})
```

### 2. Role-Based Access Control (RBAC)

#### Policy Engine
- YAML-based policy definitions
- Smart code family permissions
- Time-based and conditional access
- API endpoint-level controls

#### Policy Example
```yaml
role: FINANCE_MANAGER
allow:
  - api: "POST /api/v1/fiscal/closing-step"
    smart_code_family: "HERA.FISCAL.**"
  - smart_code_family: "HERA.ACCOUNTING.**"
    actions: ["read", "write", "approve"]
deny:
  - api: "DELETE /api/v1/**"
conditions:
  - type: time_based
    config:
      business_hours_only: true
  - type: mfa_required
```

### 3. Row-Level Security (RLS)

#### Automatic Organization Isolation
```typescript
// All queries automatically filtered by organization_id
const query = supabase
  .from('core_entities')
  .select('*')
// Automatically adds: .eq('organization_id', currentOrg)
```

#### Query Builder Protection
- Prevents cross-organization data access
- Validates organization_id on all operations
- Throws errors on context mismatch
- Audit logging for all access attempts

### 4. Encryption & Key Management

#### Data Encryption
- **At Rest**: AES-256-GCM with envelope encryption
- **In Transit**: TLS 1.3 minimum
- **Field Level**: PII encryption with dedicated DEKs
- **Key Rotation**: Automated with zero downtime

#### KMS Integration
```typescript
// Encrypt sensitive data
const encrypted = await kmsProvider.encrypt(
  sensitiveData,
  {
    organization_id: orgId,
    purpose: 'pii',
    field_name: 'ssn'
  }
)

// Automatic key rotation
await kmsProvider.rotateKeys(organizationId)
```

### 5. Audit & Compliance

#### Comprehensive Audit Trail
- Every operation logged to `universal_transactions`
- Immutable audit records with smart codes
- User actions, API calls, data changes tracked
- Compliance-ready reports (SOC2, HIPAA, GDPR)

#### Audit Event Structure
```json
{
  "transaction_type": "audit",
  "smart_code": "HERA.SECURITY.AUDIT.DATA_ACCESS.v1",
  "metadata": {
    "user_id": "user-123",
    "action": "read",
    "resource": "customer_data",
    "ip_address": "10.0.0.1",
    "result": "success"
  }
}
```

### 6. Data Privacy & PII Protection

#### PII Handling
- Automatic field identification
- Encryption before storage
- Masking in logs and UI
- Right to erasure support

#### GDPR Compliance
```typescript
// Tokenize PII for erasure
const tokenized = await privacyService.tokenizePII(userData)

// Execute right to erasure
await privacyService.executeErasure(userId, {
  preserve_audit: true,
  anonymize_transactions: true
})
```

## Security Best Practices

### 1. API Security
- Rate limiting per organization/IP
- Idempotency for critical operations
- Input validation with guardrails
- Output sanitization

### 2. Session Management
- JWT with short expiration
- Refresh token rotation
- Device fingerprinting
- Concurrent session limits

### 3. Network Security
- WAF protection
- DDoS mitigation
- IP allowlisting
- VPN access for admin

### 4. Development Security
- Secure coding standards
- Dependency scanning
- SAST/DAST in CI/CD
- Security training required

## Incident Response

### Security Event Detection
```typescript
heraLogger.logSecurityEvent({
  requestId,
  eventType: 'suspicious_activity',
  userId,
  details: {
    reason: 'Multiple failed auth attempts',
    ip_address: request.ip,
    user_agent: request.headers['user-agent']
  }
})
```

### Response Procedures
1. **Detection**: Real-time alerts via monitoring
2. **Containment**: Automatic account lockout
3. **Investigation**: Audit trail analysis
4. **Recovery**: Credential reset, key rotation
5. **Lessons Learned**: Update policies

## Compliance Certifications

### Current
- SOC 2 Type II
- ISO 27001:2022
- GDPR Compliant
- CCPA Ready

### In Progress
- HIPAA Compliance
- PCI DSS Level 1
- FedRAMP Authorization

## Security Contacts

- **Security Team**: security@heraerp.com
- **Incident Response**: incident@heraerp.com
- **Bug Bounty**: security.txt at /.well-known/security.txt
- **24/7 Hotline**: +1-800-HERA-911