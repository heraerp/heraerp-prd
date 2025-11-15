# HERA Universal Tile System - Disaster Recovery Runbook

## 🚨 Emergency Contacts

**Primary Contacts:**
- DevOps Team: [Add Slack channel or phone]
- Database Admin: [Add contact]
- System Owner: [Add contact]

**Escalation Path:**
1. On-call Engineer → DevOps Team Lead → CTO
2. For security incidents: Security Team → CISO

## 🎯 Recovery Objectives

**Recovery Time Objective (RTO):** 1 hour maximum
**Recovery Point Objective (RPO):** 24 hours maximum (daily backups)

## 📋 Quick Reference Commands

### Emergency Assessment
```bash
# Check system health
npm run disaster:health

# Get disaster recovery plan
npm run dr:plan

# List available backups
npm run backup:list
```

### Emergency Actions
```bash
# Create emergency backup
npm run backup:emergency

# Complete system rollback (auto-confirmed)
npm run rollback:emergency

# Disaster scenarios (auto-confirmed)
npm run disaster:complete-failure
npm run disaster:database-corruption
npm run disaster:security
npm run disaster:performance
```

## 🔥 Disaster Scenarios

### Scenario 1: Complete System Failure

**Symptoms:**
- Application completely inaccessible
- Database connection failures
- API endpoints returning 500 errors
- Multiple monitoring alerts

**Immediate Actions:**
```bash
# 1. Assess system health
npm run disaster:health

# 2. Create emergency backup (if possible)
npm run backup:emergency

# 3. Execute emergency recovery
npm run disaster:complete-failure

# 4. Verify recovery
npm run smoke:test
npm run verify:prod
```

**Estimated Recovery Time:** 30-45 minutes

---

### Scenario 2: Database Corruption

**Symptoms:**
- Data integrity errors
- Inconsistent query results
- Foreign key constraint failures
- Transaction rollback errors

**Immediate Actions:**
```bash
# 1. Stop write operations (manual intervention)
# - Set application to read-only mode
# - Stop background jobs

# 2. Execute database recovery
npm run disaster:database-corruption

# 3. Verify data integrity
npm run smoke:test
npm run verify:prod
```

**Estimated Recovery Time:** 45-60 minutes

---

### Scenario 3: Security Breach

**Symptoms:**
- Unauthorized access alerts
- Suspicious database changes
- Malicious code detection
- Data exfiltration indicators

**Immediate Actions:**
```bash
# 1. Isolate the breach
# - Revoke compromised API keys
# - Block suspicious IP addresses
# - Change all passwords

# 2. Execute security recovery
npm run disaster:security

# 3. Forensic backup for investigation
npm run backup:create "Forensic backup - Security incident $(date)"

# 4. Security verification
npm run verify:prod:security
```

**Estimated Recovery Time:** 1-2 hours (includes investigation)

---

### Scenario 4: Performance Degradation

**Symptoms:**
- Response times > 5 seconds
- High database CPU usage
- Memory leaks
- User complaints about slowness

**Immediate Actions:**
```bash
# 1. Assess performance impact
npm run disaster:performance

# 2. Quick load test
npm run load:test:quick

# 3. If severe, consider rollback
npm run rollback:emergency

# 4. Performance verification
npm run load:test:stress
```

**Estimated Recovery Time:** 15-30 minutes

## 📦 Backup and Rollback Procedures

### Creating Backups

```bash
# Create manual backup
npm run backup:create "Pre-maintenance backup"

# Create emergency backup
npm run backup:emergency

# List all available backups
npm run backup:list

# Clean up old backups
npm run backup:cleanup
```

### Rollback Procedures

```bash
# Rollback to latest backup (with confirmation)
npm run rollback

# Rollback to specific backup
npm run rollback:specific backup-1698765432

# Emergency rollback (skip confirmation)
npm run rollback:emergency

# Preview rollback changes (dry run)
npm run rollback:dry-run
```

## 🔍 Verification and Testing

### Post-Recovery Verification

```bash
# Production readiness check
npm run verify:prod

# Smoke tests
npm run smoke:test

# Performance validation
npm run load:test:quick

# Full system verification
npm run verify:prod:report
```

### Health Monitoring

```bash
# Continuous health monitoring
npm run health:monitor

# Performance monitoring
npm run perf:monitor

# System dashboard
npm run monitor:dashboard
```

## 🛠️ Manual Recovery Procedures

### Database Manual Recovery

1. **Access Database Console:**
   ```bash
   # Production environment
   psql $DATABASE_URL
   ```

2. **Check Table Integrity:**
   ```sql
   -- Check core tables
   SELECT COUNT(*) FROM core_entities;
   SELECT COUNT(*) FROM core_dynamic_data;
   SELECT COUNT(*) FROM core_relationships;
   
   -- Verify constraints
   SELECT conname, contype FROM pg_constraint WHERE contype = 'f';
   ```

3. **Manual Data Restoration:**
   ```sql
   -- If automated rollback fails, restore specific tables
   \copy core_entities FROM '/backup/path/core_entities.csv' CSV HEADER;
   ```

### Application Recovery

1. **Restart Services:**
   ```bash
   # Restart application
   npm run start:production
   
   # Restart monitoring
   npm run monitor:start
   ```

2. **Clear Caches:**
   ```bash
   # Clear application cache
   npm run clean:build
   npm run build
   ```

### Network and DNS Recovery

1. **Verify DNS Resolution:**
   ```bash
   nslookup app.heraerp.com
   nslookup awfcrncxngqwbhqapffb.supabase.co
   ```

2. **Check SSL Certificates:**
   ```bash
   openssl s_client -connect app.heraerp.com:443 -servername app.heraerp.com
   ```

## 📊 Recovery Validation Checklist

### Critical Functions Test

- [ ] User authentication works
- [ ] Database connectivity restored
- [ ] API endpoints responding
- [ ] Tile system functional
- [ ] Transaction processing working
- [ ] Data integrity verified
- [ ] Performance within thresholds
- [ ] Security controls active
- [ ] Monitoring systems operational
- [ ] Backups being created

### Business Operations Test

- [ ] Users can log in
- [ ] Create/read/update operations work
- [ ] Reports generate correctly
- [ ] Integrations functioning
- [ ] Email notifications working
- [ ] File uploads/downloads work
- [ ] Search functionality active
- [ ] Mobile app connectivity

## 🔄 Communication Plan

### Internal Communication

1. **Incident Declaration:**
   - Notify DevOps team immediately
   - Create incident channel in Slack
   - Update status page

2. **Progress Updates:**
   - Every 15 minutes during active recovery
   - Include estimated resolution time
   - Document actions taken

3. **Resolution Communication:**
   - Confirm system restoration
   - Provide post-incident report
   - Schedule post-mortem meeting

### External Communication

1. **Customer Notification:**
   - Status page update within 5 minutes
   - Email notification for extended outages
   - Social media updates if needed

2. **Stakeholder Updates:**
   - Executive briefing for major incidents
   - Regular updates during recovery
   - Post-incident summary report

## 📈 Continuous Improvement

### Post-Incident Review

1. **Root Cause Analysis:**
   - Technical investigation
   - Process review
   - Timeline analysis

2. **Action Items:**
   - Technical improvements
   - Process updates
   - Training needs

3. **Documentation Updates:**
   - Runbook refinements
   - Contact list updates
   - Procedure improvements

### Testing and Drills

1. **Regular Testing:**
   - Monthly backup restoration tests
   - Quarterly disaster recovery drills
   - Annual full-scale exercises

2. **Performance Monitoring:**
   - RTO/RPO tracking
   - Recovery success rates
   - Process efficiency metrics

## 📚 Additional Resources

### Documentation Links

- [System Architecture](./docs/architecture/README.md)
- [Database Schema](./docs/schema/hera-sacred-six-schema.yaml)
- [API Documentation](./docs/api/README.md)
- [Monitoring Setup](./scripts/monitoring/README.md)

### Emergency Scripts Location

```
scripts/verification/
├── disaster-recovery.sh        # Main disaster recovery script
├── rollback-procedures.ts      # Backup and rollback management
├── production-readiness.ts     # System verification
├── smoke-tests.ts             # Essential functionality tests
├── load-test.ts               # Performance validation
└── deployment-pipeline.sh     # Safe deployment pipeline
```

### Recovery Time Guidelines

| Incident Type | Detection | Response | Recovery | Verification | Total RTO |
|--------------|-----------|----------|----------|--------------|-----------|
| Complete Failure | 2 min | 3 min | 30 min | 10 min | 45 min |
| Database Corruption | 5 min | 5 min | 45 min | 15 min | 70 min |
| Security Breach | 10 min | 10 min | 60 min | 30 min | 110 min |
| Performance Degradation | 15 min | 5 min | 15 min | 10 min | 45 min |

---

**🚨 Remember: In a real emergency, speed and communication are critical. Don't hesitate to escalate early and keep stakeholders informed.**

*Last Updated: $(date)*
*Version: 1.0*