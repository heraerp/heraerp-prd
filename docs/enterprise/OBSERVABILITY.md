# HERA Observability

## Overview

HERA provides comprehensive observability through structured logging, distributed tracing, metrics collection, and real-time dashboards. All observability data adheres to the Sacred Six tables architecture.

## Architecture

### Components
1. **Structured Logging** - JSON logs with contextual metadata
2. **Distributed Tracing** - OpenTelemetry for request flow
3. **Metrics Collection** - Prometheus-compatible metrics
4. **Dashboards** - Pre-built Grafana dashboards
5. **Alerting** - Proactive issue detection

## Structured Logging

### Logger Configuration
```typescript
const logger = heraLogger.child({
  organization_id: 'org-123',
  service: 'api',
  version: '1.0.0'
})
```

### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages with stack traces

### Log Structure
```json
{
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "info",
  "message": "API request completed",
  "organization_id": "org-123",
  "user_id": "user-456",
  "smart_code": "HERA.API.REQUEST.COMPLETE.v1",
  "trace_id": "1234567890abcdef",
  "http_method": "POST",
  "http_path": "/api/v1/transactions",
  "http_status": 200,
  "response_time_ms": 125,
  "component": "api"
}
```

### Specialized Loggers

#### API Requests
```typescript
heraLogger.logAPIRequest({
  requestId,
  method: 'POST',
  path: '/api/v1/transactions',
  statusCode: 200,
  duration: 125,
  organizationId: 'org-123'
})
```

#### Guardrail Events
```typescript
heraLogger.logGuardrailBlock({
  requestId,
  table: 'core_entities',
  reason: 'Missing organization_id',
  payload: data,
  fixes_available: 3
})
```

#### Security Events
```typescript
heraLogger.logSecurityEvent({
  requestId,
  eventType: 'permission_denied',
  userId: 'user-123',
  details: {
    resource: '/api/v1/fiscal/close',
    reason: 'Insufficient permissions'
  }
})
```

## Distributed Tracing

### OpenTelemetry Integration
```typescript
// Initialize tracer
await heraTracer.initialize()

// Trace operations
const result = await heraTracer.traceAPI(
  'POST',
  '/api/v1/reports/pl',
  organizationId,
  async () => {
    // Operation logic
    return generateReport()
  }
)
```

### Trace Context
```
POST /api/v1/reports/pl
├─ guardrail.validate (15ms)
│  └─ autofix.apply (8ms)
├─ rbac.check (12ms)
├─ db.select (45ms)
│  ├─ core_entities (20ms)
│  └─ universal_transactions (25ms)
├─ report.generate (180ms)
│  ├─ smartcode.classify (30ms)
│  └─ calculations.perform (150ms)
└─ audit.write (10ms)
Total: 262ms
```

### Trace Propagation
```typescript
// Extract context from headers
const context = heraTracer.extractContext(req.headers)

// Inject context for downstream
const headers = heraTracer.injectContext({})
```

## Metrics

### Key Metrics

#### Guardrail Metrics
- `hera_guardrail_blocks_total` - Total blocks by reason
- `hera_guardrail_autofix_total` - Auto-fixes applied
- `hera_guardrail_validation_duration_ms` - Validation time

#### UCR Metrics
- `ucr_decisions_total` - Rule evaluations
- `ucr_eval_latency_ms` - Evaluation latency
- `ucr_active_rules` - Active rules per org

#### Report Metrics
- `reports_generated_total` - Reports by type
- `report_latency_ms` - Generation time
- `report_errors_total` - Generation failures

#### API Metrics
- `api_requests_total` - Requests by endpoint
- `api_duration_ms` - Request duration
- `api_errors_total` - Errors by type

### Recording Metrics
```typescript
// API request
heraMetrics.recordAPIRequest('POST', '/api/v1/transactions', 201)
heraMetrics.recordAPIDuration('POST', '/api/v1/transactions', 125)

// Report generation
heraMetrics.recordReportGeneration('org-123', 'pl', '2025-01')
heraMetrics.recordReportDuration('pl', 'medium', 2500)

// Business metrics
heraMetrics.recordTransactionVolume('org-123', 'sale')
heraMetrics.updateEntityCount('org-123', 'customer', 1250)
```

## Dashboards

### Pre-built Dashboards

#### 1. Guardrail Health
- Block rate by table and reason
- Auto-fix success percentage
- Validation latency p95
- Organization heatmap

#### 2. UCR Throughput
- Decisions per second
- Evaluation latency (p50/p95/p99)
- Active rules by organization
- Complex vs simple performance

#### 3. Fiscal Close SLA
- Average days to close
- SLA compliance percentage
- Step-by-step progress
- Bottleneck identification

#### 4. API Performance
- Request rate by method
- Latency p95 by endpoint
- Error rate percentage
- Rate limit violations

### Dashboard Access
```
# Development
http://localhost:3000 (Grafana)
http://localhost:9090 (Prometheus)

# Production
https://monitoring.heraerp.com
```

## Alerting

### Alert Rules

#### Critical Alerts
```yaml
- alert: GuardrailBlockSpike
  expr: sum(rate(hera_guardrail_blocks_total[5m])) > 100
  for: 5m
  annotations:
    summary: "High guardrail block rate"
    runbook_url: "/ops/runbooks/guardrail-spikes.md"

- alert: APIErrorRate
  expr: sum(rate(api_errors_total[5m])) / sum(rate(api_requests_total[5m])) > 0.05
  for: 5m
  annotations:
    summary: "API error rate above 5%"
```

#### Warning Alerts
```yaml
- alert: ReportGenerationSlow
  expr: histogram_quantile(0.95, report_latency_ms_bucket) > 10000
  for: 10m
  annotations:
    summary: "Report generation p95 > 10s"

- alert: FiscalCloseMissedSLA
  expr: fiscal_close_duration_days > 5
  annotations:
    summary: "Fiscal close exceeding 5 day SLA"
```

### Alert Routing
```yaml
route:
  group_by: ['alertname', 'organization_id']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: pagerduty
    - match:
        severity: warning
      receiver: slack
```

## Performance Monitoring

### SLIs (Service Level Indicators)
1. **API Latency p95** < 250ms (read), < 500ms (write)
2. **Error Rate** < 1%
3. **Guardrail Block Rate** < 5%
4. **Report Generation** < 10s for standard reports

### SLOs (Service Level Objectives)
- 99.9% availability (43.2 min/month downtime)
- 95% of requests meeting latency targets
- 99% of reports generated successfully

### Error Budget
```typescript
// Monitor error budget
const errorBudget = {
  monthly_budget_ms: 43200000, // 43.2k seconds
  consumed_ms: 0,
  remaining_percentage: 100
}

// Alert when 80% consumed
if (errorBudget.remaining_percentage < 20) {
  alertOncall('Error budget critically low')
}
```

## Log Aggregation

### Query Examples

#### Find slow API requests
```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "component": "api" } },
        { "range": { "response_time_ms": { "gte": 1000 } } }
      ]
    }
  }
}
```

#### Track user actions
```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "user_id": "user-123" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "sort": [{ "timestamp": "desc" }]
}
```

#### Audit trail for organization
```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "organization_id": "org-123" } },
        { "term": { "component": "audit" } }
      ]
    }
  }
}
```

## Development Tools

### Local Monitoring Stack
```bash
# Start monitoring
npm run monitoring:dev

# Creates:
# - Prometheus on :9090
# - Grafana on :3000
# - Node Exporter on :9100
```

### Debug Logging
```typescript
// Enable debug logs
process.env.LOG_LEVEL = 'debug'

// Namespace debugging
process.env.DEBUG = 'hera:*'
```

### Trace Visualization
```bash
# Start Jaeger UI
docker run -p 16686:16686 jaegertracing/all-in-one

# View traces at http://localhost:16686
```

## Best Practices

### 1. Structured Context
Always include organization and user context:
```typescript
logger.setContext(requestId, {
  organization_id: req.organizationId,
  user_id: req.userId,
  trace_id: req.traceId
})
```

### 2. Meaningful Metrics
Use descriptive labels:
```typescript
heraMetrics.recordAPIRequest(
  method,
  endpoint, // Not just /api/v1/*
  statusCode
)
```

### 3. Trace Critical Paths
Wrap important operations:
```typescript
await heraTracer.traceDB(
  'select',
  'universal_transactions',
  organizationId,
  async () => await db.query(...)
)
```

### 4. Alert Fatigue Prevention
- Set appropriate thresholds
- Use alert grouping
- Include runbook links
- Regular threshold reviews