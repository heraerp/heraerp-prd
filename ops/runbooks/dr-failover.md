# Runbook: Disaster Recovery Failover

## Overview
This runbook covers the complete disaster recovery process for HERA, including database failover, application switchover, and data integrity verification.

## Prerequisites
- Access to primary and DR AWS/Cloud accounts
- Database admin credentials
- DNS management access
- PagerDuty admin for incident management
- Slack #incident channel access

## Recovery Objectives
- **RPO (Recovery Point Objective)**: ≤ 5 minutes
- **RTO (Recovery Time Objective)**: ≤ 30 minutes
- **Data Loss Tolerance**: Zero for committed transactions

## Pre-Flight Checklist
```bash
# Verify DR readiness
./scripts/dr-health-check.sh

# Expected output:
# ✓ DR Database: Streaming (lag: 42 bytes)
# ✓ DR Application: Standby (version: 1.0.0)
# ✓ Backups: Current (last: 5 min ago)
# ✓ DNS TTL: 60 seconds
# ✓ SSL Certificates: Valid
```

## Failover Decision Tree
```
Is primary database responding?
├─ NO → Execute Full Failover (Section 1)
├─ YES, but degraded → Execute Partial Failover (Section 2)
└─ YES, but region down → Execute Region Failover (Section 3)
```

## 1. Full Database Failover (15-20 min)

### 1.1 Declare Incident (2 min)
```bash
# Create incident
curl -X POST https://api.pagerduty.com/incidents \
  -H "Authorization: Token token=$PD_TOKEN" \
  -d '{
    "incident": {
      "type": "incident",
      "title": "HERA Database Failover Initiated",
      "urgency": "high"
    }
  }'

# Notify stakeholders
./scripts/notify-stakeholders.sh "DR failover initiated"
```

### 1.2 Stop Primary Applications (3 min)
```bash
# Scale down primary region
kubectl scale deployment hera-api --replicas=0 -n production
kubectl scale deployment hera-workers --replicas=0 -n production

# Verify no active connections
psql -h primary.db.hera.internal -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

### 1.3 Promote DR Database (5 min)
```bash
# On DR database server
sudo -u postgres pg_ctl promote -D /var/lib/postgresql/data

# Verify promotion
psql -h dr.db.hera.internal -c "SELECT pg_is_in_recovery();"
# Should return: false

# Check replication lag
psql -h dr.db.hera.internal -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"
```

### 1.4 Update Application Configuration (3 min)
```bash
# Update environment variables
kubectl set env deployment/hera-api DATABASE_URL="postgresql://dr.db.hera.internal:5432/hera" -n dr

# Update connection pooler
kubectl edit configmap pgbouncer-config -n dr
# Change: host = dr.db.hera.internal

# Restart connection pooler
kubectl rollout restart deployment/pgbouncer -n dr
```

### 1.5 Switch DNS (2 min)
```bash
# Update Route53 / CloudFlare
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.heraerp.com",
        "Type": "A",
        "TTL": 60,
        "ResourceRecords": [{"Value": "DR_IP_ADDRESS"}]
      }
    }]
  }'
```

### 1.6 Start DR Applications (3 min)
```bash
# Scale up DR region
kubectl scale deployment hera-api --replicas=10 -n dr
kubectl scale deployment hera-workers --replicas=5 -n dr

# Monitor startup
kubectl logs -f deployment/hera-api -n dr
```

### 1.7 Verify Functionality (2 min)
```bash
# Health check
curl -s https://api.heraerp.com/health | jq .

# Test authentication
curl -X POST https://api.heraerp.com/api/v1/auth/health \
  -H "Authorization: Bearer $TEST_TOKEN"

# Test database write
curl -X POST https://api.heraerp.com/api/v1/test/write \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"test": "dr_validation_'$(date +%s)'"}'
```

## 2. Data Integrity Verification (5 min)

### 2.1 Transaction Consistency
```sql
-- Check for gaps in sequences
WITH seq_check AS (
  SELECT 
    transaction_number,
    LAG(transaction_number) OVER (ORDER BY transaction_number) as prev_num
  FROM universal_transactions
  WHERE created_at > NOW() - INTERVAL '1 hour'
)
SELECT 
  COUNT(*) FILTER (WHERE transaction_number - prev_num > 1) as gaps
FROM seq_check;
```

### 2.2 Multi-Tenant Isolation
```sql
-- Verify organization isolation
SELECT 
  organization_id,
  COUNT(*) as record_count
FROM core_entities
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY organization_id
HAVING COUNT(DISTINCT organization_id) = 1;
```

### 2.3 Smart Code Integrity
```sql
-- Verify smart codes are valid
SELECT COUNT(*) as invalid_smart_codes
FROM core_entities
WHERE smart_code NOT LIKE 'HERA.%.v_'
  AND created_at > NOW() - INTERVAL '1 hour';
```

## 3. Rollback Procedure (if needed)

### 3.1 Assess Rollback Need
- Data corruption detected
- DR performance severely degraded
- Critical feature not working

### 3.2 Execute Rollback
```bash
# Stop DR applications
kubectl scale deployment hera-api --replicas=0 -n dr

# Repoint DNS to primary
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{...}'  # Use primary IP

# Resync databases
pg_basebackup -h primary.db.hera.internal -D /var/lib/postgresql/recovery -U replication -v -P -W

# Start primary applications
kubectl scale deployment hera-api --replicas=10 -n production
```

## 4. Post-Failover Tasks

### 4.1 Monitor Performance (Continuous)
```bash
# Watch key metrics
watch -n 10 './scripts/dr-metrics.sh'

# Alert thresholds
# - API p95 latency > 500ms
# - Database CPU > 80%
# - Error rate > 1%
```

### 4.2 Update Status Page
```bash
curl -X POST https://api.statuspage.io/v1/pages/$PAGE_ID/incidents \
  -H "Authorization: OAuth $STATUS_TOKEN" \
  -d '{
    "incident": {
      "name": "Operating from DR Region",
      "status": "monitoring",
      "impact": "minor"
    }
  }'
```

### 4.3 Plan Return to Primary
- Schedule maintenance window
- Test primary recovery
- Plan reverse failover
- Update runbooks with lessons learned

## Appendix

### A. Contact List
- **Database Team**: db-oncall@hera.pagerduty.com
- **Infrastructure**: infra-oncall@hera.pagerduty.com
- **Leadership**: cto@heraerp.com, vp-eng@heraerp.com
- **Customer Success**: cs-lead@heraerp.com

### B. Critical Commands Reference
```bash
# Database failover
pg_ctl promote -D $PGDATA

# Force DNS propagation
aws route53 get-change --id $CHANGE_ID

# Emergency scale
kubectl scale --all deployments --replicas=0 -n production

# Backup validation
pg_restore --list backup.dump | head -20
```

### C. Automation Scripts
All scripts in `/ops/scripts/dr/`:
- `dr-health-check.sh` - Pre-flight validation
- `dr-failover.sh` - Automated failover
- `dr-rollback.sh` - Automated rollback
- `dr-test.sh` - Monthly DR drill

## Lessons Learned Log
| Date | Incident | Duration | Lessons |
|------|----------|----------|---------|
| 2024-01-15 | DR Drill | 18 min | DNS TTL was 300s, reduced to 60s |
| 2024-02-20 | Network Partition | 25 min | Added pgbouncer pause/resume |
| 2024-03-10 | DR Drill | 14 min | Automated health checks added |