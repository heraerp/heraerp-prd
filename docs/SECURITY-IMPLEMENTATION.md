# HERA Security Framework Implementation

This document provides a comprehensive guide to the HERA security framework implementation, which provides bulletproof multi-tenant isolation, authentication, and audit logging.

## 🚀 Quick Start

### 1. Apply Database Migrations

```bash
# Apply the security framework migration
psql $DATABASE_URL -f database/migrations/20241002000001_security_framework.sql
```

### 2. Configure Environment Variables

```bash
# .env.local
HERA_TRUSTED_ISSUERS=https://auth.partner1.com,https://auth.partner2.com
HERA_JWT_AUDIENCE=hera-api
HERA_CACHE_TTL=120
HERA_RED_TEAM_MODE=true  # Enable in non-production for testing

# Partner public keys
PARTNER1_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
PARTNER2_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...

# Notification webhooks
SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/...
SECURITY_EMAIL_RECIPIENTS=security@yourcompany.com
PAGERDUTY_INTEGRATION_KEY=your-key-here

# Service authentication tokens
ANALYTICS_SERVICE_TOKEN=secure-token-here
NOTIFICATIONS_SERVICE_TOKEN=secure-token-here
INTEGRATIONS_SERVICE_TOKEN=secure-token-here
```

### 3. Use Security Middleware in Your APIs

```typescript
import { withSecurity } from '@/lib/security/security-middleware'

async function handleSecureEndpoint(req: NextRequest, context: SecurityContext) {
  // Your logic here - runs within secure database context
  // RLS automatically filters by organization
  const { data } = await supabase.from('core_entities').select('*')
  
  return NextResponse.json({ data })
}

// Apply security with role-based permissions
export const GET = withSecurity(handleSecureEndpoint, {
  allowedRoles: ['owner', 'admin', 'manager'],
  enableAuditLogging: true,
  enableRateLimit: true
})
```

## 🏗️ Architecture Overview

### Three-Layer Security Model

1. **Layer 1: Organization Isolation** - Sacred organization_id boundary (zero data leakage)
2. **Layer 2: Entity-Level Permissions** - Dynamic role-based access through universal entities  
3. **Layer 3: Row-Level Security** - Database-level enforcement with mixed JWT/GUC policies

### Core Components

#### 1. Database Context Manager (`database-context.ts`)

Provides secure database operations with automatic GUC management:

```typescript
import { dbContext } from '@/lib/security/database-context'

const result = await dbContext.executeWithContext(
  {
    orgId: 'org-uuid',
    userId: 'user-uuid', 
    role: 'admin',
    authMode: 'supabase'
  },
  async (client) => {
    // All queries automatically scoped to organization
    return await client.from('core_entities').select('*')
  }
)
```

**Key Features:**
- ✅ Automatic transaction management
- ✅ GUC lifecycle management (set → execute → clear)
- ✅ Timeout protection (30s default)
- ✅ Comprehensive audit logging
- ✅ Red team simulation mode
- ✅ Error isolation and cleanup

#### 2. Authentication Resolver (`auth-resolver.ts`)

Handles dual-path authentication with JWT validation:

```typescript
import { authResolver } from '@/lib/security/auth-resolver'

// In your API route
const context = await authResolver.getOrgContext(req)
// Returns: { orgId, userId, role, authMode, issuer? }
```

**Supported Authentication Methods:**
- ✅ Supabase JWT (primary path)
- ✅ External JWT with JWKS validation  
- ✅ Service-to-service authentication
- ✅ Cached organization membership (2min TTL)
- ✅ Rate limiting per org/user/action

#### 3. Security Middleware (`security-middleware.ts`)

Comprehensive middleware for Next.js API routes:

```typescript
// Role-specific middleware
export const GET = requireManager(handleManagerEndpoint)
export const POST = requireOwner(handleOwnerEndpoint)
export const PUT = requireUser(handleUserEndpoint)

// Public endpoints
export const GET = publicEndpoint(handlePublicEndpoint)

// Service authentication
export const POST = withServiceAuth(handleServiceEndpoint, ['analytics', 'notifications'])
```

## 🛡️ Database Security

### Mixed RLS Policies

All tables use mixed policies that work with both JWT and GUC contexts:

```sql
-- Example policy for core_entities
CREATE POLICY org_scope_mixed ON core_entities
    FOR ALL
    USING (
        organization_id = COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );
```

### Service Role Protection

Even service role is org-scoped by default:

```sql
CREATE POLICY service_role_guard ON core_entities
    FOR ALL
    TO service_role
    USING (
        organization_id = get_org_context()
        OR is_rls_bypassed()
    );
```

### Audit Tables

All security events are logged to `hera_audit_log`:

```sql
-- Event types tracked
'context_set'           -- GUC context setting
'rls_bypass_attempt'    -- RLS bypass attempts  
'service_role_access'   -- Service role usage
'cross_org_attempt'     -- Cross-org access attempts
'auth_failure'          -- Authentication failures
'data_access'           -- Sensitive data access
'data_modification'     -- Data changes
```

## 📊 Monitoring & Observability

### Security Dashboard

```typescript
import { securityMonitoring } from '@/lib/security/monitoring'

const dashboardData = await securityMonitoring.getDashboardData('24h')
```

**Tracked Metrics:**
- Auth failures per issuer
- Org switches per minute  
- RLS policy denials
- Service role organization diversity
- Rate limit violations
- Active security alerts

### Automated Alerts

Configurable thresholds trigger automatic alerts:

```typescript
alertThresholds: {
  authFailuresPerMinute: 10,
  rlsBypassAttempts: 1,      // Zero tolerance
  rateExceededPerHour: 100,
  crossOrgAttempts: 1,       // Zero tolerance
  serviceRoleOrgDiversity: 50
}
```

**Alert Channels:**
- Slack/Discord webhooks
- Email notifications (critical only)
- PagerDuty integration (critical only)

### Prometheus Metrics

```bash
# Auth failures
hera_auth_failures_total{issuer="supabase"} 

# RLS denials
hera_rls_denials_total

# Active alerts  
hera_active_alerts
```

## 🧪 Testing Framework

### RLS Policy Tests

Comprehensive test suite validates security:

```bash
npm test tests/security/rls-policy.test.ts
```

**Test Coverage:**
- ✅ GUC context isolation
- ✅ Cross-org access prevention
- ✅ Service role restrictions
- ✅ Audit trail validation
- ✅ Rate limiting enforcement
- ✅ Concurrent context switches
- ✅ Memory leak prevention

### Red Team Mode

Enable automated security testing:

```bash
HERA_RED_TEAM_MODE=true npm test
```

Simulates:
- Cross-org access attempts
- RLS bypass attempts  
- Permission escalation
- Data exfiltration attempts

## 🚨 Security Patterns

### DO: Secure API Implementation

```typescript
import { withSecurity } from '@/lib/security/security-middleware'

async function handleSecureData(req: NextRequest, context: SecurityContext) {
  // ✅ Database operations automatically scoped to org
  const { data } = await supabase
    .from('sensitive_data')
    .select('*')
    .eq('status', 'active')
  
  // ✅ Context automatically includes org/user/role
  return NextResponse.json({
    data,
    context: {
      organization_id: context.orgId,
      user_role: context.role
    }
  })
}

export const GET = withSecurity(handleSecureData, {
  allowedRoles: ['owner', 'admin'],
  enableAuditLogging: true
})
```

### DON'T: Direct Database Access

```typescript
// ❌ NEVER do this - bypasses all security
const { data } = await supabase
  .from('core_entities')
  .select('*')
  // No organization filtering!

// ❌ NEVER manually set organization_id
const orgId = req.headers.get('x-org-id') // Spoofable!
```

### DO: Service-to-Service Authentication

```typescript
// ✅ Proper service authentication
export const POST = withServiceAuth(handleServiceEndpoint, {
  allowedServices: ['analytics', 'notifications']
})

// ✅ Create org-scoped service context
const context = createOrgServiceContext(orgId)
await dbContext.executeWithContext(context, async (client) => {
  // Service operations with proper org scope
})
```

## 📋 Deployment Checklist

### Pre-Production

- [ ] Run security test suite: `npm test tests/security/`
- [ ] Verify RLS policies enabled on all tables
- [ ] Test with multiple organizations
- [ ] Validate JWT issuer configuration
- [ ] Enable red team mode and verify alerts
- [ ] Configure monitoring webhooks
- [ ] Set up Prometheus metrics collection

### Production Deployment

- [ ] Apply database migrations
- [ ] Configure environment variables
- [ ] Enable security monitoring
- [ ] Set up alert notifications
- [ ] Configure rate limiting thresholds
- [ ] Verify backup/recovery procedures
- [ ] Document incident response procedures

### Post-Deployment

- [ ] Monitor security dashboard for 24h
- [ ] Verify audit logs are being generated
- [ ] Test alert notifications
- [ ] Run red team exercises
- [ ] Review and tune rate limits
- [ ] Update documentation

## 🔧 Configuration Options

### Database Context Options

```typescript
await dbContext.executeWithContext(context, operation, {
  bypassRLS: false,          // Only for service operations
  timeoutMs: 30000,          // Operation timeout
  auditDetails: {            // Additional audit metadata
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  }
})
```

### Security Middleware Options

```typescript
withSecurity(handler, {
  requireAuth: true,         // Require authentication
  allowedRoles: ['owner'],   // Allowed user roles
  requireOrgContext: true,   // Require org context
  enableAuditLogging: true,  // Log all operations
  enableRateLimit: true,     // Apply rate limiting
  bypassRLS: false          // Bypass RLS (service only)
})
```

### Monitoring Configuration

```typescript
const config = {
  alertThresholds: {
    authFailuresPerMinute: 10,
    rlsBypassAttempts: 1,
    rateExceededPerHour: 100,
    crossOrgAttempts: 1,
    serviceRoleOrgDiversity: 50
  },
  metricsRetention: {
    hourly: 7,    // days
    daily: 90,    // days
    monthly: 365  // days
  }
}
```

## 🚀 Performance Considerations

### Connection Pooling

Use pgBouncer in TRANSACTION mode to prevent GUC leakage:

```ini
# pgbouncer.ini
pool_mode = transaction
default_pool_size = 20
max_client_conn = 100
```

### Query Optimization

- RLS policies use indexes on `organization_id`
- GUC functions are marked STABLE for caching
- Rate limiting uses TTL-based cleanup
- Audit logs use time-based partitioning

### Caching Strategy

```typescript
// Organization membership cache (2min TTL)
orgMembershipCache.set(`${userId}:${orgId}`, membership)

// JWT validation cache (5min TTL)  
jwtValidationCache.set(tokenHash, claims)

// Rate limiting cache (1min windows)
rateLimitCache.set(key, count)
```

## 🎯 Best Practices

### 1. Always Use Security Middleware

Every API endpoint should use `withSecurity()` or one of its variants.

### 2. Principle of Least Privilege

Use the most restrictive role requirements for each endpoint:
- `requireOwner()` - Sensitive operations only
- `requireManager()` - Management functions
- `requireUser()` - General access
- `publicEndpoint()` - Public data only

### 3. Audit Everything

Enable audit logging for all sensitive operations:
```typescript
enableAuditLogging: true // Always for production
```

### 4. Monitor Continuously

Set up automated monitoring and alerting:
- Security dashboard checks
- Prometheus metrics collection
- Real-time alert notifications
- Regular red team exercises

### 5. Test Security Boundaries

Regularly run the security test suite:
```bash
npm test tests/security/
HERA_RED_TEAM_MODE=true npm test
```

## 🔐 Security Incident Response

### Detection

Automated alerts trigger for:
- Multiple auth failures
- RLS bypass attempts  
- Cross-org access attempts
- Unusual service role activity
- Rate limit violations

### Response Procedures

1. **Immediate Actions**
   - Check security dashboard
   - Review audit logs
   - Identify affected organizations
   - Assess scope of potential breach

2. **Containment**
   - Revoke compromised tokens
   - Temporarily disable affected accounts
   - Enable additional monitoring
   - Document all actions

3. **Investigation**
   - Analyze audit trail
   - Identify root cause
   - Assess data exposure
   - Document findings

4. **Recovery**
   - Patch security vulnerabilities
   - Restore normal operations
   - Notify affected customers
   - Update security procedures

### Contact Information

- **Security Team**: security@yourcompany.com
- **On-call**: Use PagerDuty integration
- **Escalation**: Follow incident response playbook

---

## 📚 Additional Resources

- [HERA Universal API Documentation](./UNIVERSAL-API-V2.md)
- [Database Schema Guide](./SCHEMA-FIRST-DEVELOPMENT.md)
- [JWT Authentication Setup](./MULTI-TENANT-AUTH-GUIDE.md)
- [Monitoring Dashboard Setup](./monitoring/README.md)
- [Security Test Suite](../tests/security/README.md)

---

**Remember: Security is not a feature—it's a foundation. Every line of code should respect the three-layer security model and contribute to a zero-trust architecture.**