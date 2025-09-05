# HERA Enterprise GA Features

## Overview

HERA's Enterprise General Availability (GA) features provide production-grade capabilities for large-scale deployments while maintaining strict adherence to the Sacred Six tables architecture. Every enterprise feature integrates seamlessly with HERA's universal patterns, ensuring zero schema changes and complete smart code integration.

## 🏗️ Architecture Principles

1. **Sacred Six Adherence** - No new tables, all enterprise data in existing schema
2. **Smart Code Enforcement** - Every operation has business context
3. **Universal Integration** - Enterprise features enhance, not replace, universal patterns
4. **Zero Schema Changes** - All configuration and state in dynamic data
5. **Multi-Tenant First** - Perfect organization isolation guaranteed

## 🔐 Security & Compliance

### SSO Provider (`/src/lib/auth/sso-provider.ts`)
- **SAML 2.0** with metadata import and IdP-initiated flow
- **OIDC** with discovery endpoint support
- **JIT Provisioning** creates users/entities automatically
- **Session Management** with JWT integration
- **Configuration Storage** as entities with encryption

### RBAC Policy Engine (`/src/lib/rbac/policy-engine.ts`)
- **YAML Policies** for human-readable permission management
- **Smart Code Families** - Grant permissions by pattern (`HERA.FIN.*`)
- **Conditional Access** - Time-based, IP-based, MFA requirements
- **Audit Trail** - Every permission check logged
- **Dynamic Evaluation** - Policies stored as entities, hot-reloadable

### KMS Encryption (`/src/lib/crypto/kms-provider.ts`)
- **Envelope Encryption** - DEK/KEK pattern for PII protection
- **Key Rotation** - Automatic re-encryption on rotation
- **Purpose-Based Keys** - Separate keys for PII, credentials, tokens
- **Field-Level Encryption** - Selective encryption in dynamic data
- **Audit Logging** - All encryption operations tracked

## ⚡ Reliability & Performance

### Rate Limiter (`/src/lib/limits/rate-limiter.ts`)
- **Sliding Window** algorithm for accurate limiting
- **Per-Organization Tiers** - Different limits by subscription
- **API Group Limits** - Separate limits for read/write/admin
- **Idempotency Support** - Safe retries with 24h TTL
- **Distributed Safe** - Works across multiple instances

### RLS Query Builder (`/src/lib/rbac/query-builder-middleware.ts`)
- **Automatic Filtering** - Injects organization_id transparently
- **Proxy Pattern** - No query modification required
- **Context Aware** - Uses request context for filtering
- **Performance Optimized** - Minimal overhead
- **Bypass Support** - Admin operations when needed

### Enterprise Middleware (`/src/lib/middleware/enterprise-middleware.ts`)
Unified middleware stack that combines:
- Rate limiting checks
- RBAC authorization
- Idempotency handling
- Request tracing
- Structured logging
- RLS context setup
- Security headers
- Error standardization

## 📊 Observability

### Distributed Tracing (`/src/lib/observability/tracer.ts`)
- **OpenTelemetry** integration
- **Specialized Methods** - traceUCR, traceGuardrail, traceDB, traceAPI
- **Context Propagation** - Automatic trace ID flow
- **Performance Metrics** - Operation timing built-in
- **Export Support** - OTLP HTTP exporter ready

### Metrics Collection (`/src/lib/observability/metrics.ts`)
- **Prometheus Format** - Standard exposition format
- **Business Metrics** - Transaction counts, revenue tracking
- **Technical Metrics** - API latency, error rates, cache hits
- **Custom Metrics** - Extensible for any business need
- **Persistence** - Metrics stored as transactions

### Structured Logging (`/src/lib/observability/logger.ts`)
- **JSON Format** - Machine-readable logs
- **Context Preservation** - Request ID, trace ID, org ID
- **Log Levels** - Configurable by environment
- **Specialized Loggers** - API, guardrail, UCR, audit
- **Correlation** - Links logs, traces, and metrics

## 📋 API Governance

### OpenAPI Specification (`/openapi/hera.v1.yaml`)
- **Version 3.0.3** compliant
- **Smart Code Annotations** - x-smart-code-family extensions
- **Security Schemes** - Bearer auth, API keys defined
- **Problem+JSON** - RFC7807 error responses
- **Pagination** - Cursor-based with examples

### Enterprise Endpoints
```bash
GET  /api/v1/metrics              # Prometheus metrics
GET  /api/v1/audit/events         # Query audit trail
GET  /api/v1/audit/stream         # Real-time SSE stream
POST /api/v1/guardrails/validate  # Dry-run validation
POST /api/v1/enterprise           # Enterprise operations
```

## 🎯 Implementation Patterns

### Using Enterprise Middleware
```typescript
import { enterpriseMiddleware } from '@/lib/middleware/enterprise-middleware'

export async function POST(request: NextRequest) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    // ctx provides:
    // - requestId: Unique request identifier
    // - organizationId: From JWT/session
    // - userId: Authenticated user
    // - roles: User's roles
    // - traceId: Distributed trace ID
    
    // Automatic features:
    // ✅ Rate limiting enforced
    // ✅ RBAC policy checked
    // ✅ Idempotency handled
    // ✅ RLS context set
    // ✅ Request traced
    // ✅ Activity logged
    
    // Your business logic here
    const result = await processBusinessLogic(ctx)
    
    return NextResponse.json(result)
  })
}
```

### Storing Enterprise Configuration
```typescript
// All configuration stored as entities
const ssoConfig = {
  entity_type: 'sso_config',
  entity_name: 'Okta SAML Configuration',
  smart_code: 'HERA.SECURITY.SSO.OKTA.CONFIG.v1',
  metadata: {
    provider: 'okta',
    saml: {
      entryPoint: 'https://company.okta.com/sso/saml',
      cert: 'encrypted_cert_here'
    }
  }
}

// Sensitive data in dynamic fields with encryption
const secret = {
  entity_id: ssoConfig.id,
  field_name: 'client_secret',
  field_value_text: await kmsProvider.encrypt(secret),
  smart_code: 'HERA.SECURITY.SSO.SECRET.v1'
}
```

### RBAC Policy Example
```yaml
# Stored as entity with smart code HERA.SECURITY.RBAC.POLICY.v1
policies:
  - name: financial_admin
    description: Full access to financial operations
    permissions:
      - action: "*"
        resource: "HERA.FIN.*"
        effect: allow
        conditions:
          - type: time_based
            start: "09:00"
            end: "17:00"
            timezone: "UTC"
          - type: mfa_required
            value: true
            
  - name: read_only_user  
    description: Read-only access to non-sensitive data
    permissions:
      - action: "GET"
        resource: "HERA.*.READ"
        effect: allow
      - action: "*"
        resource: "HERA.*.SENSITIVE"
        effect: deny
```

## 🚀 Testing Enterprise Features

Run the comprehensive test suite:
```bash
# Test all enterprise features
node scripts/test-enterprise-features.js

# Individual feature tests
npm test -- --grep "SSO"
npm test -- --grep "RBAC"
npm test -- --grep "Rate Limiting"
npm test -- --grep "Audit"
```

## 📊 Monitoring & Operations

### Pre-configured Dashboards
1. **Guardrail Health** - Block rates, auto-fix success, validation latency
2. **UCR Throughput** - Decision rates, evaluation time, active rules
3. **Fiscal Close SLA** - Days to close, compliance rates, bottlenecks
4. **API Performance** - P95/P99 latency, error rates, throughput

### Health Checks
```bash
# System health
GET /api/health

# Component health
GET /api/health/database
GET /api/health/cache
GET /api/health/auth
```

### Runbooks
- `/ops/runbooks/guardrail-spikes.md` - Handle validation spikes
- `/ops/runbooks/dr-failover.md` - Disaster recovery procedures
- `/ops/runbooks/security-incident.md` - Security response
- `/ops/runbooks/performance-degradation.md` - Performance issues

## 🔒 Security Best Practices

1. **Always Use Enterprise Middleware** - Don't bypass security layers
2. **Encrypt Sensitive Data** - Use KMS for PII and credentials
3. **Audit Everything** - Business operations should create audit entries
4. **Rate Limit APIs** - Prevent abuse and ensure fair usage
5. **Implement RBAC** - Fine-grained permissions, not just roles
6. **Monitor Continuously** - Watch metrics and logs for anomalies
7. **Test Security** - Regular penetration testing and audits

## 🎯 Enterprise Features Summary

| Feature | Purpose | Key Benefit |
|---------|---------|-------------|
| SSO/SAML | Enterprise authentication | Zero password management |
| RBAC | Fine-grained permissions | Compliance ready |
| KMS | Data encryption | GDPR/CCPA compliance |
| Rate Limiting | API protection | Fair usage enforcement |
| Idempotency | Safe retries | Data integrity |
| Tracing | Request tracking | Performance insights |
| Metrics | System monitoring | Proactive alerting |
| Audit Trail | Compliance logging | Complete accountability |
| RLS | Data isolation | Multi-tenant security |
| OpenAPI | API documentation | Developer experience |

All enterprise features maintain HERA's core principles: Sacred Six adherence, smart code enforcement, and zero schema changes. This ensures enterprise capabilities enhance rather than complicate the universal architecture.