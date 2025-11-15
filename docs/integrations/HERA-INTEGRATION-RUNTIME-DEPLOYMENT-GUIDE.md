# HERA Integration Runtime - Complete Deployment Guide

## Overview

This guide covers the complete setup and deployment of the HERA Integration Runtime system, including all components for both development and production environments.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Production Deployment](#production-deployment)
4. [Database Migrations](#database-migrations)
5. [Edge Functions Deployment](#edge-functions-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Testing & Verification](#testing-verification)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring-maintenance)

## Architecture Overview

The HERA Integration Runtime consists of:

```
┌─────────────────────────────────────────────────────────────────┐
│                    HERA Integration Runtime v1.1               │
├─────────────────────────────────────────────────────────────────┤
│  API v2 Gateway (Enhanced)                                     │
│  ├── /api/v2/integrations/events     - Process inbound events  │
│  ├── /api/v2/integrations/connectors - Manage connectors       │
│  └── /api/v2/health                 - System health check      │
├─────────────────────────────────────────────────────────────────┤
│  Outbox Worker System                                          │
│  ├── Webhook delivery with HMAC signing                       │
│  ├── Retry logic with exponential backoff                     │
│  └── Dead Letter Queue (DLQ) for failed deliveries           │
├─────────────────────────────────────────────────────────────────┤
│  Database Layer (Sacred Six + Integration Extensions)          │
│  ├── RPC Functions for integration operations                  │
│  ├── Relationship types for connector management               │
│  └── Pre-built connector definitions (WhatsApp, LinkedIn, etc) │
├─────────────────────────────────────────────────────────────────┤
│  User Interfaces                                              │
│  ├── Integration Control Center (Platform Admin)              │
│  └── Integration Hub (Tenant Organizations)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Development Environment Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase CLI** installed and configured
- **Git** repository access
- **PostgreSQL** 14+ (via Supabase local development)

### Step 1: Repository Setup

```bash
# Clone and navigate to project
git clone <repository-url>
cd heraerp-dev

# Install dependencies
npm install

# Start Supabase local development
supabase start
```

### Step 2: Apply Database Migrations

```bash
# Apply the integration runtime migration
supabase migration up

# Verify migration was applied
supabase db diff --local
```

### Step 3: Deploy Edge Functions (Development)

```bash
# Deploy API v2 Gateway (enhanced with integration endpoints)
supabase functions deploy api-v2 --no-verify-jwt=false

# Deploy Outbox Worker for webhook delivery
supabase functions deploy outbox-worker --no-verify-jwt=false

# Verify deployments
supabase functions list
```

### Step 4: Setup Pre-Built Connectors

```bash
# Apply connector definitions
psql -h localhost -p 54322 -U postgres -d postgres -f scripts/setup-prebuilt-connectors.sql

# Verify connectors were created
psql -h localhost -p 54322 -U postgres -d postgres -c "
SELECT 
  entity_code,
  entity_name,
  created_at
FROM core_entities 
WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF' 
ORDER BY created_at;
"
```

### Step 5: Environment Configuration

Create `.env.local` with development settings:

```bash
# Development Environment Variables
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_local_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_local_service_role_key>

# Integration Runtime Configuration
INTEGRATION_RUNTIME_ENABLED=true
OUTBOX_WORKER_ENABLED=true
WEBHOOK_SIGNING_ENABLED=true

# Default Organization (Platform)
DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000000

# Development-specific settings
NODE_ENV=development
ENABLE_DEBUG_LOGGING=true
```

### Step 6: Start Development Server

```bash
# Start Next.js development server
npm run dev

# Application available at http://localhost:3000
```

## Production Deployment

### Prerequisites

- **Supabase Production Project** configured
- **Domain & SSL certificates** setup
- **CI/CD pipeline** configured
- **Environment secrets** managed securely

### Step 1: Production Database Migration

```bash
# Connect to production Supabase project
supabase link --project-ref <production-project-ref>

# Apply migrations to production
supabase db push

# Verify migration status
supabase migration list --remote
```

### Step 2: Deploy Production Edge Functions

```bash
# Deploy API v2 Gateway to production
supabase functions deploy api-v2 --project-ref <production-project-ref> --no-verify-jwt=false

# Deploy Outbox Worker to production  
supabase functions deploy outbox-worker --project-ref <production-project-ref> --no-verify-jwt=false

# Verify production deployments
supabase functions list --project-ref <production-project-ref>
```

### Step 3: Setup Production Connectors

```bash
# Connect to production database
export PGPASSWORD=<production_db_password>
psql -h <production_db_host> -U postgres -d postgres -f scripts/setup-prebuilt-connectors.sql

# Verify connectors in production
psql -h <production_db_host> -U postgres -d postgres -c "
SELECT 
  entity_code,
  entity_name,
  created_at,
  (SELECT jsonb_extract_path_text(field_value_json, 'status') 
   FROM core_dynamic_data d 
   WHERE d.entity_id = e.id AND d.field_name = 'connector_config') as status
FROM core_entities e
WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF' 
ORDER BY created_at;
"
```

### Step 4: Production Environment Configuration

Create production environment variables:

```bash
# Production Environment Variables (via CI/CD or hosting platform)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<production_service_role_key>

# Integration Runtime Configuration
INTEGRATION_RUNTIME_ENABLED=true
OUTBOX_WORKER_ENABLED=true
WEBHOOK_SIGNING_ENABLED=true

# Production-specific settings
NODE_ENV=production
ENABLE_DEBUG_LOGGING=false

# Security settings
WEBHOOK_SIGNATURE_ALGORITHM=sha256
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS_PER_MINUTE=100

# Monitoring
SENTRY_DSN=<your_sentry_dsn>
MONITORING_ENABLED=true
```

### Step 5: Deploy Application

```bash
# Build for production
npm run build

# Deploy to your hosting platform (Vercel, Netlify, etc.)
npm run deploy

# Or using Docker
docker build -t hera-integration-runtime .
docker run -p 3000:3000 hera-integration-runtime
```

## Database Migrations

### Migration Files Structure

```
supabase/migrations/
├── 20241115000001_hera_integration_runtime.sql  # Core integration functions
└── scripts/
    ├── setup-prebuilt-connectors.sql           # Connector definitions
    └── verify-integration-setup.sql            # Verification queries
```

### Core Migration: `20241115000001_hera_integration_runtime.sql`

This migration creates:

1. **Integration Event Processing**
   - `hera_integration_event_in_v1()` - Process inbound events
   - Event validation, deduplication, and smart code generation

2. **Connector Management** 
   - `hera_integration_connector_v1()` - Manage connector lifecycle
   - Definition creation, installation, and configuration

3. **Webhook System**
   - `hera_webhook_config_v1()` - Webhook configuration management
   - `hera_webhook_get_by_topic_v1()` - Topic-based webhook retrieval
   - `hera_webhook_delivery_log_v1()` - Delivery attempt logging

4. **Outbox Pattern**
   - `hera_outbox_get_pending_v1()` - Retrieve pending events
   - `hera_outbox_update_status_v1()` - Update delivery status
   - `hera_outbox_schedule_retry_v1()` - Schedule retry attempts

5. **Relationship Types**
   - 10 specialized relationship types for integration management
   - Connector dependencies, webhook assignments, event processing

### Connector Definitions: `setup-prebuilt-connectors.sql`

Creates 5 pre-built connector definitions:

1. **WhatsApp Business Cloud API**
   - Messaging and customer support
   - API key authentication
   - Real-time message events

2. **LinkedIn Marketing API** 
   - Lead generation and professional networking
   - OAuth 2.0 authentication
   - Campaign and engagement events

3. **Meta (Facebook) Graph API**
   - Social media management and advertising
   - OAuth 2.0 authentication
   - Page messages, posts, and lead events

4. **Zapier Webhooks**
   - Connect with 5000+ business tools
   - Webhook-based authentication
   - Bi-directional automation triggers

5. **HubSpot CRM API**
   - Customer relationship management
   - OAuth 2.0 authentication
   - Contact, deal, and form submission events

## Edge Functions Deployment

### API v2 Gateway: `supabase/functions/api-v2/index.ts`

Enhanced gateway with integration endpoints:

- **Security**: Complete actor resolution with caching
- **Guardrails**: Smart code validation, GL balance checking
- **Integration Routes**:
  - `POST /api/v2/integrations/events` - Process inbound events
  - `POST /api/v2/integrations/connectors` - Manage connectors
- **Performance**: Rate limiting, idempotency, Redis caching

### Outbox Worker: `supabase/functions/outbox-worker/index.ts`

Webhook delivery system:

- **Security**: HMAC signature generation and verification
- **Reliability**: Exponential backoff retry logic
- **Monitoring**: Comprehensive delivery logging
- **Endpoints**:
  - `POST /outbox-worker/process` - Manual trigger processing
  - `GET /outbox-worker/health` - Health check
  - `GET /outbox-worker/stats` - Delivery statistics

### Deployment Commands

```bash
# Development deployment
supabase functions deploy api-v2 --no-verify-jwt=false
supabase functions deploy outbox-worker --no-verify-jwt=false

# Production deployment
supabase functions deploy api-v2 --project-ref <prod-ref> --no-verify-jwt=false
supabase functions deploy outbox-worker --project-ref <prod-ref> --no-verify-jwt=false

# Verify deployments
supabase functions list [--project-ref <ref>]
```

## Environment Configuration

### Development Configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Integration settings
INTEGRATION_RUNTIME_ENABLED=true
OUTBOX_WORKER_ENABLED=true
DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000000

# Development features
NODE_ENV=development
ENABLE_DEBUG_LOGGING=true
SKIP_RATE_LIMITING=true
```

### Production Configuration

```bash
# Environment variables (set via hosting platform)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<production_service_role_key>

# Integration settings
INTEGRATION_RUNTIME_ENABLED=true
OUTBOX_WORKER_ENABLED=true

# Production security
NODE_ENV=production
ENABLE_DEBUG_LOGGING=false
RATE_LIMIT_ENABLED=true
WEBHOOK_SIGNATURE_REQUIRED=true

# Monitoring
SENTRY_DSN=<sentry_dsn>
LOG_LEVEL=info
```

## Testing & Verification

### Step 1: Integration Runtime Health Check

```bash
# Test API v2 gateway health
curl -X GET "http://localhost:54321/functions/v1/api-v2/health"

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-11-15T10:30:00Z",
#   "version": "2.3.0",
#   "components": {
#     "api_gateway": "healthy",
#     "guardrails": "healthy"
#   }
# }
```

### Step 2: Outbox Worker Health Check

```bash
# Test outbox worker health
curl -X GET "http://localhost:54321/functions/v1/outbox-worker/health"

# Expected response:
# {
#   "status": "healthy", 
#   "timestamp": "2024-11-15T10:30:00Z",
#   "version": "1.0.0"
# }
```

### Step 3: Database Function Testing

```sql
-- Test integration event processing
SELECT hera_integration_event_in_v1(
  '00000000-0000-0000-0000-000000000001'::uuid, -- actor
  '00000000-0000-0000-0000-000000000000'::uuid, -- org
  'test-source',                                -- source
  'test_event',                                -- type
  '{"test": "data"}'::jsonb,                   -- data
  'test-connector',                            -- connector
  'test-123',                                  -- idempotency
  'HERA.TEST.EVENT.v1',                       -- smart_code
  '{}'::jsonb                                  -- options
);

-- Test connector management
SELECT hera_integration_connector_v1(
  '00000000-0000-0000-0000-000000000001'::uuid, -- actor
  '00000000-0000-0000-0000-000000000000'::uuid, -- org
  'LIST',                                       -- operation
  'INTEGRATION_CONNECTOR_DEF',                  -- type
  null,                                        -- code
  '{}'::jsonb,                                 -- config
  '{}'::jsonb,                                 -- install_config
  '{}'::jsonb                                  -- options
);
```

### Step 4: UI Component Testing

```bash
# Start development server
npm run dev

# Navigate to integration interfaces:
# 1. Platform Control Center: http://localhost:3000/platform/integrations/control-center
# 2. Tenant Integration Hub: http://localhost:3000/settings/integrations

# Verify:
# - Connector catalog loads
# - Installation workflows work
# - Monitoring displays correctly
```

### Step 5: End-to-End Integration Test

```bash
# Create test script: test-integration-e2e.ts
npm run test:integration

# Or manual test:
curl -X POST "http://localhost:54321/functions/v1/api-v2/integrations/events" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Organization-Id: <org_id>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_source": "whatsapp-business-cloud",
    "event_type": "message_received", 
    "connector_code": "whatsapp-business-cloud",
    "event_data": {
      "from": "+1234567890",
      "message": "Hello, I need help!",
      "timestamp": "2024-11-15T10:30:00Z"
    },
    "smart_code": "HERA.WHATSAPP.EVENT.MESSAGE.RECEIVED.v1"
  }'
```

## Troubleshooting

### Common Issues

#### 1. Migration Failures

**Error**: `ERROR: 42P10: there is no unique or exclusion constraint`

**Solution**: Updated migration files remove problematic `ON CONFLICT` clauses
```bash
# Re-apply migration with fixes
supabase db reset --linked
supabase migration up
```

#### 2. Edge Function Deployment Issues

**Error**: `Function deployment failed`

**Solution**: Check JWT verification settings
```bash
# Deploy without JWT verification for service role functions
supabase functions deploy api-v2 --no-verify-jwt=false
```

#### 3. Connector Installation Failures

**Error**: `guardrail_violation:SMARTCODE_MISSING`

**Solution**: Ensure smart codes follow HERA DNA patterns
```typescript
// Correct pattern: HERA.MODULE.SUBMODULE.TYPE.DETAIL.v1
"smart_code": "HERA.WHATSAPP.EVENT.MESSAGE.RECEIVED.v1"
```

#### 4. Webhook Delivery Failures

**Error**: Webhook delivery returns 401/403 errors

**Solution**: Verify HMAC signature generation
```typescript
// Check webhook configuration includes proper secret
{
  "webhook_config": {
    "url": "https://your-domain.com/webhooks/integration",
    "secret": "your-webhook-secret"
  }
}
```

### Debug Commands

```bash
# Check Supabase logs
supabase logs --type=functions --project-ref <ref>

# Database connection test
supabase db ping

# Function invocation logs
supabase functions logs api-v2 --project-ref <ref>

# Integration event logs
psql -c "
SELECT 
  e.created_at,
  e.entity_code,
  d1.field_value_text as event_source,
  d2.field_value_text as event_type,
  e.smart_code
FROM core_entities e
JOIN core_dynamic_data d1 ON d1.entity_id = e.id AND d1.field_name = 'event_source'
JOIN core_dynamic_data d2 ON d2.entity_id = e.id AND d2.field_name = 'event_type'
WHERE e.entity_type = 'INTEGRATION_EVENT'
ORDER BY e.created_at DESC
LIMIT 10;
"
```

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Integration Event Volume**
   - Events processed per hour/day
   - Success vs failure rates
   - Processing latency

2. **Webhook Delivery Performance**
   - Delivery success rates
   - Retry attempt frequencies
   - Dead letter queue sizes

3. **Connector Health**
   - Active installations per organization
   - Authentication token expiry dates
   - Rate limit violations

4. **System Resource Usage**
   - Database connections
   - Edge function invocations
   - Memory and CPU utilization

### Monitoring Queries

```sql
-- Integration events summary (last 24 hours)
SELECT 
  d1.field_value_text as event_source,
  count(*) as event_count,
  count(*) FILTER (WHERE d2.field_value_text = 'processed') as successful,
  count(*) FILTER (WHERE d2.field_value_text = 'failed') as failed
FROM core_entities e
JOIN core_dynamic_data d1 ON d1.entity_id = e.id AND d1.field_name = 'event_source'
LEFT JOIN core_dynamic_data d2 ON d2.entity_id = e.id AND d2.field_name = 'status'
WHERE e.entity_type = 'INTEGRATION_EVENT'
  AND e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY d1.field_value_text
ORDER BY event_count DESC;

-- Connector installation status
SELECT 
  e.entity_code as connector_code,
  count(*) as installations,
  count(*) FILTER (WHERE d.field_value_text = 'active') as active,
  count(*) FILTER (WHERE d.field_value_text = 'paused') as paused
FROM core_entities e
JOIN core_dynamic_data d ON d.entity_id = e.id AND d.field_name = 'status'
WHERE e.entity_type = 'INTEGRATION_CONNECTOR_INSTALL'
GROUP BY e.entity_code
ORDER BY installations DESC;

-- Webhook delivery performance
SELECT 
  DATE_TRUNC('hour', e.created_at) as hour,
  count(*) as total_deliveries,
  avg((d1.field_value_number)) as avg_status_code,
  count(*) FILTER (WHERE d1.field_value_number BETWEEN 200 AND 299) as successful
FROM core_entities e
JOIN core_dynamic_data d1 ON d1.entity_id = e.id AND d1.field_name = 'status_code'
WHERE e.entity_type = 'WEBHOOK_DELIVERY_LOG'
  AND e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', e.created_at)
ORDER BY hour;
```

### Maintenance Tasks

#### Daily
- Check integration event processing rates
- Monitor webhook delivery success rates
- Review error logs for anomalies

#### Weekly
- Analyze connector usage patterns
- Check authentication token expiry dates
- Review and clean up old integration logs

#### Monthly
- Audit connector configurations
- Update pre-built connector definitions
- Performance optimization review
- Security assessment

### Backup & Recovery

```bash
# Backup integration configuration
pg_dump -h <host> -U postgres -t core_entities -t core_dynamic_data \
  --where="entity_type IN ('INTEGRATION_CONNECTOR_DEF', 'INTEGRATION_CONNECTOR_INSTALL', 'INTEGRATION_WEBHOOK')" \
  > integration_backup.sql

# Restore integration configuration
psql -h <host> -U postgres -d postgres -f integration_backup.sql
```

## Security Considerations

### Authentication & Authorization

1. **Actor Resolution**: Every request resolves to specific user entity
2. **Organization Isolation**: Tenant boundaries enforced at all layers
3. **Permission Checks**: Role-based access to integration features

### Webhook Security

1. **HMAC Signatures**: All outgoing webhooks signed with SHA-256
2. **SSL/TLS Required**: HTTPS endpoints mandatory for webhooks
3. **Signature Verification**: Recipients must verify webhook authenticity

### Data Privacy

1. **Encryption at Rest**: Sensitive connector credentials encrypted
2. **Audit Logging**: Complete trail of all integration activities
3. **Data Retention**: Configurable retention policies for integration logs

### Access Control

1. **Platform Admin**: Full access to Integration Control Center
2. **Organization Admin**: Access to Integration Hub for their org
3. **Integration Manager**: Limited access to connector configuration

---

## 🎉 Deployment Checklist

### Development Environment ✅
- [ ] Repository cloned and dependencies installed
- [ ] Supabase local development running
- [ ] Integration runtime migration applied
- [ ] Edge functions deployed locally
- [ ] Pre-built connectors created
- [ ] Environment variables configured
- [ ] Development server running
- [ ] Integration UIs accessible
- [ ] Health checks passing

### Production Environment ✅
- [ ] Production Supabase project configured
- [ ] Database migrations applied to production
- [ ] Edge functions deployed to production
- [ ] Pre-built connectors created in production
- [ ] Production environment variables set
- [ ] Application deployed to hosting platform
- [ ] SSL certificates configured
- [ ] Domain routing configured
- [ ] Integration UIs accessible in production
- [ ] Health checks passing in production
- [ ] Monitoring and alerting configured

**🚀 With this comprehensive setup, HERA Integration Runtime is ready to connect with WhatsApp, LinkedIn, Meta, Zapier, HubSpot, and any other external platform through the universal connector architecture!**