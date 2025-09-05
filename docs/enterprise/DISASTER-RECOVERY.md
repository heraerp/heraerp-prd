# HERA Disaster Recovery

## Overview

HERA's disaster recovery strategy ensures business continuity with automated failover, data integrity, and rapid recovery capabilities while maintaining the Sacred Six tables architecture.

## Recovery Objectives

### Targets
- **RPO (Recovery Point Objective)**: ≤ 5 minutes
- **RTO (Recovery Time Objective)**: ≤ 30 minutes
- **Data Integrity**: 100% for committed transactions
- **Multi-Tenant Isolation**: Maintained during recovery

### Disaster Scenarios
1. **Database Failure** - Primary database unresponsive
2. **Regional Outage** - Entire cloud region unavailable
3. **Data Corruption** - Logical data integrity issues
4. **Cyber Attack** - Ransomware or data breach

## Architecture

### Multi-Region Setup
```
┌─────────────────────┐         ┌─────────────────────┐
│   Primary Region    │         │     DR Region       │
├─────────────────────┤         ├─────────────────────┤
│ • Application Tier  │         │ • Application Tier  │
│ • Database Primary  │◄────────┤ • Database Replica  │
│ • Cache Layer       │         │ • Cache Layer       │
│ • File Storage      │◄────────┤ • File Storage      │
└─────────────────────┘         └─────────────────────┘
         Active                        Standby
```

### Replication Strategy
- **Database**: Streaming replication with < 1s lag
- **Files**: Cross-region S3 replication
- **Cache**: Not replicated (rebuilt on failover)
- **Configuration**: Multi-region parameter store

## Backup Strategy

### Automated Backups
```yaml
backup_schedule:
  full_backup:
    frequency: daily
    time: "02:00 UTC"
    retention: 30 days
  
  incremental:
    frequency: hourly
    retention: 7 days
  
  transaction_logs:
    continuous: true
    retention: 14 days
```

### Backup Validation
```bash
#!/bin/bash
# Daily backup validation
./scripts/backup-validate.sh

# Tests:
# 1. Restore to test instance
# 2. Verify row counts
# 3. Check data integrity
# 4. Validate relationships
# 5. Test multi-tenant isolation
```

### Point-in-Time Recovery (PITR)
```sql
-- Restore to specific transaction
RESTORE DATABASE hera 
TO TRANSACTION 'abc123'
WITH REPLACE;

-- Restore to timestamp
RESTORE DATABASE hera
TO TIME '2025-01-15 10:30:00'
WITH STANDBY;
```

## Failover Procedures

### 1. Automated Failover (Preferred)

#### Health Checks
```yaml
health_checks:
  database:
    endpoint: "primary.db.hera.com:5432"
    interval: 10s
    timeout: 5s
    unhealthy_threshold: 3
  
  application:
    endpoint: "https://api.heraerp.com/health"
    interval: 30s
    timeout: 10s
    unhealthy_threshold: 2
```

#### Failover Trigger
```typescript
// Automated failover decision
if (primaryHealthCheck.failures >= threshold) {
  await initiateFailover({
    reason: 'Primary database unavailable',
    automatic: true,
    notify: ['oncall', 'leadership']
  })
}
```

### 2. Manual Failover Process

#### Step 1: Assess Situation (2 min)
```bash
# Check primary health
./scripts/dr-health-check.sh --primary

# Check replication lag
psql -h dr.db.hera.com -c "
  SELECT now() - pg_last_xact_replay_timestamp() AS lag;
"

# Verify DR readiness
./scripts/dr-health-check.sh --dr
```

#### Step 2: Initiate Failover (5 min)
```bash
# Execute failover script
./scripts/dr-failover.sh --confirm

# Script performs:
# 1. Stop primary applications
# 2. Promote DR database
# 3. Update DNS records
# 4. Start DR applications
# 5. Verify functionality
```

#### Step 3: Validate Operations (3 min)
```bash
# Run validation suite
./scripts/dr-validate.sh

# Checks:
# - API endpoints responding
# - Database writes working
# - Multi-tenant isolation intact
# - Smart codes validating
# - Auth functioning
```

## Data Recovery

### 1. Transaction Recovery
```sql
-- Find last committed transaction
SELECT MAX(id), MAX(transaction_date)
FROM universal_transactions
WHERE transaction_date < '2025-01-15 10:00:00';

-- Verify no gaps
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM universal_transactions
  WHERE created_at >= NOW() - INTERVAL '1 hour'
)
SELECT COUNT(*) as gaps
FROM ordered
WHERE id != rn;
```

### 2. Relationship Integrity
```sql
-- Verify relationships intact
SELECT COUNT(*) as orphaned
FROM core_relationships r
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities e1 WHERE e1.id = r.from_entity_id
) OR NOT EXISTS (
  SELECT 1 FROM core_entities e2 WHERE e2.id = r.to_entity_id
);
```

### 3. Smart Code Validation
```sql
-- Ensure smart codes are valid
SELECT 
  COUNT(*) as invalid_codes
FROM (
  SELECT smart_code FROM core_entities
  UNION ALL
  SELECT smart_code FROM universal_transactions
) t
WHERE smart_code NOT LIKE 'HERA.%.v_';
```

## Failback Procedures

### 1. Prepare Original Primary
```bash
# Rebuild primary as replica
pg_basebackup -h dr.db.hera.com \
  -D /var/lib/postgresql/data \
  -U replication -v -P -W \
  -X stream -c fast

# Start replication
postgres -D /var/lib/postgresql/data
```

### 2. Schedule Maintenance Window
```typescript
// Notify users
await notificationService.scheduleMaintenanceWindow({
  start: '2025-01-20T02:00:00Z',
  duration: '30m',
  reason: 'Failback to primary datacenter',
  impact: 'Brief service interruption'
})
```

### 3. Execute Failback
```bash
# Same process as failover but in reverse
./scripts/dr-failback.sh --window "2025-01-20T02:00:00Z"
```

## Testing & Drills

### Monthly DR Drills
```yaml
dr_drill_schedule:
  frequency: monthly
  day: "First Saturday"
  time: "14:00 UTC"
  duration: 2 hours
  
  test_scenarios:
    - database_failover
    - application_failover
    - full_region_failover
    - data_recovery
    - failback
```

### Drill Checklist
- [ ] Notify stakeholders
- [ ] Execute failover
- [ ] Validate all services
- [ ] Test critical user journeys
- [ ] Verify data integrity
- [ ] Execute failback
- [ ] Document lessons learned

### Performance Metrics
Track during each drill:
- Time to detection
- Time to decision
- Time to failover
- Time to validation
- Total downtime
- Data integrity checks

## Security During DR

### 1. Access Control
```yaml
dr_access_control:
  requires:
    - mfa: mandatory
    - vpn: required
    - approval: 2 senior engineers
  
  audit:
    - all_commands_logged: true
    - video_recording: optional
```

### 2. Encryption Keys
```typescript
// Ensure keys available in DR
await kmsProvider.replicateKeys({
  source: 'primary-region',
  destination: 'dr-region',
  includeRotated: true
})
```

### 3. Audit Trail
All DR actions logged:
```json
{
  "transaction_type": "dr_operation",
  "smart_code": "HERA.DR.FAILOVER.INITIATED.v1",
  "metadata": {
    "operation": "failover",
    "initiated_by": "oncall-engineer",
    "reason": "Database unavailable",
    "start_time": "2025-01-15T10:30:00Z"
  }
}
```

## Communication Plan

### Incident Communication
1. **T+0**: Incident detected
2. **T+5m**: Leadership notified
3. **T+10m**: Status page updated
4. **T+15m**: Customer communication
5. **T+30m**: Failover complete
6. **T+1h**: Post-incident report

### Contact Matrix
| Role | Primary | Backup | Escalation |
|------|---------|--------|------------|
| Database | db-oncall@pagerduty | db-lead@hera | CTO |
| Infrastructure | infra-oncall@pagerduty | infra-lead@hera | VP Eng |
| Security | security@hera | ciso@hera | CEO |
| Customer Success | cs-lead@hera | cs-team@slack | CCO |

## Recovery Scenarios

### Scenario 1: Database Corruption
```bash
# 1. Stop writes
kubectl scale deployment hera-api --replicas=0

# 2. Identify corruption point
psql -c "SELECT * FROM pg_stat_database_conflicts;"

# 3. Restore to point before corruption
pg_restore --clean --no-owner \
  --dbname=hera \
  backup_2025_01_15_09_00.dump

# 4. Replay transactions from audit
./scripts/replay-transactions.sh \
  --from "2025-01-15T09:00:00Z" \
  --exclude-corrupted
```

### Scenario 2: Ransomware Attack
```bash
# 1. Isolate affected systems
./scripts/emergency-isolation.sh

# 2. Activate incident response
./scripts/security-incident.sh --type ransomware

# 3. Restore from immutable backups
./scripts/restore-immutable.sh \
  --backup-id "immutable-2025-01-15"

# 4. Reset all credentials
./scripts/rotate-all-secrets.sh --emergency
```

### Scenario 3: Split Brain
```sql
-- Detect split brain
SELECT 
  pg_is_in_recovery(),
  pg_last_wal_receive_lsn(),
  pg_last_wal_replay_lsn()
FROM pg_stat_wal_receiver;

-- Resolution: Fence old primary
-- Then rebuild as replica
```

## Lessons Learned

### Historical Incidents
| Date | Incident | Impact | Improvements |
|------|----------|--------|--------------|
| 2024-Q1 | Network partition | 15 min downtime | Added connection retry logic |
| 2024-Q2 | Storage failure | 0 downtime | Validated multi-attach volumes |
| 2024-Q3 | DR drill | 18 min RTO | Automated DNS updates |
| 2024-Q4 | Regional outage | 25 min RTO | Improved health checks |

### Continuous Improvements
1. Automate manual steps
2. Reduce decision time
3. Improve monitoring
4. Regular training
5. Update runbooks