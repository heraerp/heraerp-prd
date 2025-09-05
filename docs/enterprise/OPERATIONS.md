# HERA Operations Guide

## Overview

This guide covers day-to-day operations, maintenance procedures, and operational excellence practices for running HERA in production.

## Operational Model

### Service Tiers
1. **Tier 0**: Authentication, Authorization (5 min response)
2. **Tier 1**: Core APIs, Database (15 min response)
3. **Tier 2**: Reporting, Batch Jobs (30 min response)
4. **Tier 3**: Analytics, Archive (2 hour response)

### On-Call Structure
```yaml
on_call_rotation:
  primary:
    schedule: weekly
    handoff: Monday 10:00 UTC
    engineers: 6
  
  secondary:
    schedule: weekly
    coverage: primary_backup
  
  escalation:
    L1: primary_oncall
    L2: secondary_oncall + team_lead
    L3: engineering_manager + cto
```

## Daily Operations

### Morning Checklist (30 min)
```bash
#!/bin/bash
# Daily health check

# 1. System health
curl -s https://api.heraerp.com/health | jq .

# 2. Overnight job status
./scripts/check-batch-jobs.sh

# 3. Error rates
./scripts/error-summary.sh --period 24h

# 4. Capacity check
./scripts/capacity-report.sh

# 5. Security alerts
./scripts/security-scan.sh --quick

# 6. Backup verification
./scripts/backup-status.sh
```

### Key Metrics Review
- API availability (target: 99.9%)
- p95 latency (target: <250ms read, <500ms write)
- Error rate (target: <1%)
- Active organizations
- Transaction volume
- Database connections

## Deployment Operations

### Deployment Pipeline
```yaml
stages:
  - name: Pre-flight
    steps:
      - guardrail_lint
      - contract_tests
      - security_scan
      - capacity_check
  
  - name: Canary
    steps:
      - deploy_5_percent
      - monitor_15_min
      - check_slos
  
  - name: Progressive
    steps:
      - deploy_25_percent
      - monitor_30_min
      - deploy_100_percent
  
  - name: Validation
    steps:
      - smoke_tests
      - synthetic_monitoring
      - user_acceptance
```

### Rollback Criteria
Automatic rollback if:
- Error rate > 5%
- p95 latency > 2x baseline
- Availability < 99.5%
- Critical alerts firing

### Blue-Green Deployment
```bash
# Deploy to green environment
./scripts/deploy.sh --env green --version 1.2.0

# Run validation
./scripts/validate-deployment.sh --env green

# Switch traffic
./scripts/switch-traffic.sh --to green --percentage 100

# Keep blue as instant rollback
./scripts/maintain-env.sh --env blue --state standby
```

## Database Operations

### Connection Pool Management
```yaml
connection_pools:
  api:
    min: 20
    max: 100
    idle_timeout: 300s
  
  reporting:
    min: 5
    max: 25
    statement_timeout: 300s
  
  admin:
    min: 2
    max: 5
    superuser: true
```

### Maintenance Windows
```sql
-- Weekly maintenance tasks
-- Sundays 02:00-04:00 UTC

-- 1. Vacuum analyze
VACUUM ANALYZE core_entities;
VACUUM ANALYZE universal_transactions;

-- 2. Update statistics
ANALYZE;

-- 3. Reindex if needed
REINDEX CONCURRENTLY INDEX idx_entities_org_type;

-- 4. Clear old audit logs
DELETE FROM universal_transactions 
WHERE transaction_type = 'audit'
  AND created_at < NOW() - INTERVAL '90 days';
```

### Performance Tuning
```sql
-- Monitor slow queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

## Security Operations

### Daily Security Tasks
1. **Review Security Logs**
   ```bash
   ./scripts/security-audit.sh --date today
   ```

2. **Check Failed Authentications**
   ```sql
   SELECT 
     metadata->>'user_id' as user_id,
     COUNT(*) as failures
   FROM universal_transactions
   WHERE transaction_type = 'auth_failure'
     AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY 1
   HAVING COUNT(*) > 5;
   ```

3. **Validate Certificates**
   ```bash
   ./scripts/cert-check.sh --days 30
   ```

### Secret Rotation
```yaml
rotation_schedule:
  database_passwords:
    frequency: quarterly
    automation: full
  
  api_keys:
    frequency: monthly
    automation: full
  
  encryption_keys:
    frequency: annually
    automation: assisted
  
  certificates:
    frequency: 30_days_before_expiry
    automation: full
```

## Capacity Management

### Resource Monitoring
```yaml
thresholds:
  cpu:
    warning: 70%
    critical: 85%
    action: scale_horizontal
  
  memory:
    warning: 80%
    critical: 90%
    action: scale_vertical
  
  storage:
    warning: 75%
    critical: 85%
    action: expand_volume
  
  connections:
    warning: 80%
    critical: 90%
    action: increase_pool
```

### Scaling Procedures

#### Horizontal Scaling
```bash
# API tier scaling
kubectl scale deployment hera-api \
  --replicas=15 \
  -n production

# Worker scaling
kubectl scale deployment hera-workers \
  --replicas=10 \
  -n production
```

#### Vertical Scaling
```bash
# Database scaling (requires maintenance)
./scripts/db-scale.sh \
  --instance db-primary \
  --class db.r6g.2xlarge \
  --maintenance-window "Sunday 02:00 UTC"
```

### Capacity Planning
Monthly review:
- Growth trends
- Seasonal patterns
- Resource utilization
- Cost optimization
- Performance baselines

## Incident Management

### Incident Lifecycle
1. **Detection** - Automated alerts
2. **Triage** - Severity assessment
3. **Response** - Follow runbook
4. **Resolution** - Fix and verify
5. **Post-mortem** - Learn and improve

### Severity Levels
| Level | Definition | Response Time | Example |
|-------|------------|--------------|---------|
| SEV1 | Complete outage | 5 min | Database down |
| SEV2 | Major degradation | 15 min | API errors >10% |
| SEV3 | Minor issue | 1 hour | Reporting slow |
| SEV4 | Low impact | Next business day | UI glitch |

### Incident Commander Duties
- Coordinate response team
- Communicate with stakeholders
- Make critical decisions
- Document timeline
- Lead post-mortem

## Maintenance Procedures

### Planned Maintenance
```yaml
maintenance_calendar:
  database:
    frequency: monthly
    duration: 2 hours
    tasks:
      - vacuum_full
      - analyze
      - update_statistics
      - clear_bloat
  
  infrastructure:
    frequency: quarterly
    duration: 4 hours
    tasks:
      - os_patching
      - security_updates
      - certificate_renewal
      - hardware_checks
  
  application:
    frequency: weekly
    duration: 30 minutes
    tasks:
      - dependency_updates
      - cache_clear
      - log_rotation
```

### Emergency Maintenance
1. Declare incident
2. Notify customers (if impact >5 min)
3. Execute fix
4. Validate resolution
5. Post-mortem within 48h

## Backup & Archive

### Backup Verification
Daily automated tests:
```bash
#!/bin/bash
# Restore latest backup to test instance
./scripts/restore-backup.sh \
  --source latest \
  --target test-restore \
  --validate

# Run integrity checks
./scripts/validate-restore.sh \
  --check-counts \
  --check-relationships \
  --check-transactions
```

### Archive Strategy
```yaml
archive_policy:
  universal_transactions:
    retention_active: 2 years
    retention_archive: 7 years
    archive_after: 2 years
    storage_class: glacier
  
  audit_logs:
    retention_active: 1 year
    retention_archive: 7 years
    compliance: sox_required
```

## Cost Optimization

### Resource Right-Sizing
Monthly review:
```bash
# Generate utilization report
./scripts/resource-utilization.sh --period 30d

# Identify over-provisioned resources
./scripts/cost-optimizer.sh --recommend

# Apply recommendations
./scripts/cost-optimizer.sh --apply --confirm
```

### Reserved Capacity
```yaml
reservations:
  compute:
    coverage_target: 70%
    term: 1_year
    payment: all_upfront
  
  database:
    coverage_target: 100%
    term: 3_years
    payment: partial_upfront
```

## Operational Excellence

### Automation Priorities
1. Repetitive tasks
2. Error-prone procedures
3. Time-sensitive operations
4. Compliance requirements

### Documentation Standards
- Runbooks for all alerts
- Architecture diagrams current
- API documentation automated
- Change logs maintained

### Continuous Improvement
- Weekly ops review
- Monthly metrics analysis
- Quarterly architecture review
- Annual DR assessment

## Tooling

### Essential Tools
```yaml
monitoring:
  - prometheus
  - grafana
  - elastic_stack
  - jaeger

automation:
  - terraform
  - ansible
  - jenkins
  - github_actions

debugging:
  - k9s
  - pgcli
  - httpie
  - jq
```

### Custom Scripts
Location: `/ops/scripts/`
- `health-check.sh` - System health
- `deploy.sh` - Deployment automation
- `rollback.sh` - Quick rollback
- `debug-pod.sh` - Container debugging
- `db-analyze.sh` - Database analysis