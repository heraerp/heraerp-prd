# HERA Universal Workflow Engine - Operational Runbooks

## Overview

This document provides operational procedures for managing the HERA Universal Workflow Engine in production. These runbooks cover common operational tasks, troubleshooting procedures, and emergency response protocols.

## 🚨 Emergency Contacts & Escalation

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| **Primary Oncall** | Platform Team Slack | Immediate |
| **Secondary Oncall** | Ops Team Manager | 15 minutes |
| **Subject Matter Expert** | Workflow Engineering Lead | 30 minutes |
| **Business Stakeholder** | Operations Director | 1 hour |

---

## 🔧 Operational Procedures

### 1. How to Pause/Resume a Workflow

**When to Use:**
- Investigate workflow issues
- Maintenance windows
- Business process changes
- Emergency situations

**Prerequisites:**
- Admin role access
- Organization ID
- Instance ID to pause/resume

**Procedure:**

```bash
# 1. Pause Workflow Instance
curl -X POST "/api/v1/workflows/{instance_id}/pause" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "reason": "Investigation needed for unusual behavior",
    "paused_by": "admin-user-id"
  }'

# 2. Verify Pause Status
curl -X GET "/api/v1/workflows/{instance_id}?organization_id=org-123" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: "paused": true

# 3. Resume When Ready
curl -X POST "/api/v1/workflows/{instance_id}/resume" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "resumed_by": "admin-user-id",
    "notes": "Investigation completed, resuming normal operation"
  }'
```

**Validation:**
- Check instance shows `"paused": false`
- Verify timers resume processing
- Confirm workflow advances continue

**Common Issues:**
- **Instance not found**: Verify organization ID and instance ID
- **Permission denied**: Ensure admin role and proper authentication
- **Already paused/resumed**: Check current state before operation

---

### 2. How to Retry Failed Effects

**When to Use:**
- Effects failed due to transient issues
- External service was temporarily unavailable
- Network issues caused effect failures
- Manual intervention after fixing root cause

**Prerequisites:**
- Admin role access
- Instance ID with failed effects
- Step ID containing the failures

**Procedure:**

```bash
# 1. Identify Failed Effects
curl -X GET "/api/v1/workflows/{instance_id}/steps?organization_id=org-123" \
  -H "Authorization: Bearer $TOKEN"

# Look for steps with "effects_failed": [...]

# 2. Retry Failed Effects
curl -X POST "/api/v1/workflows/{instance_id}/retry-effects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "step_id": "step-456",
    "retried_by": "admin-user-id"
  }'

# 3. Retry Specific Effects Only (Optional)
curl -X POST "/api/v1/workflows/{instance_id}/retry-effects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "step_id": "step-456",
    "effect_filter": ["HERA.COMMS.WHATSAPP.SEND.MESSAGE.V1"],
    "retried_by": "admin-user-id"
  }'
```

**Validation:**
- Check response shows `effects_successful` and `effects_still_failed` arrays
- Verify step metadata shows `effects_failed: []` for successful retries
- Confirm downstream effects (notifications, GL postings) completed

**Common Issues:**
- **Still failing**: Check logs for root cause, may need manual intervention
- **Downstream service issues**: Verify external services are operational
- **Data inconsistency**: May need to manually reconcile state

---

### 3. How to Reassign Tasks

**When to Use:**
- Staff changes or unavailability
- Workload balancing
- Escalation to higher authority
- Role changes in organization

**Prerequisites:**
- Admin role or task owner access
- Task ID to reassign
- Valid target role or user

**Procedure:**

```bash
# 1. Check Current Task Assignment
curl -X GET "/api/v1/tasks?organization_id=org-123&task_state=OPEN" \
  -H "Authorization: Bearer $TOKEN"

# 2. Reassign to Role
curl -X POST "/api/v1/tasks/{task_id}/reassign" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "assignee_role": "senior_manager",
    "reassigned_by": "admin-user-id",
    "reason": "Escalating to senior management due to complexity"
  }'

# 3. Reassign to Specific User
curl -X POST "/api/v1/tasks/{task_id}/reassign" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "assignee_user_id": "user-789",
    "reassigned_by": "admin-user-id",
    "reason": "Assigning to subject matter expert"
  }'
```

**Validation:**
- Verify task shows new assignee in response
- Check that task remains in appropriate state (OPEN if reassigned from CLAIMED)
- Confirm new assignee receives notification (if configured)

**Common Issues:**
- **User/role not found**: Verify assignee exists in organization
- **Task already completed**: Cannot reassign completed tasks
- **Permission denied**: Ensure proper access rights

---

### 4. What to Do If Timer Backlog Grows

**Symptoms:**
- Timer fire latency > 60 seconds
- Growing number of overdue timers
- Workflows stuck waiting for timer events
- Alert: "Timer queue backlog > 0 for 10+ minutes"

**Immediate Actions:**

```bash
# 1. Check Timer Status
curl -X GET "/api/v1/workflows?organization_id=org-123&overdue=true" \
  -H "Authorization: Bearer $TOKEN"

# 2. Check Scheduler Health
tail -f /var/log/hera/scheduler.log | grep "HERA.UNIV.WF.SCHEDULER"

# 3. Manual Timer Processing (if needed)
# Identify overdue timers
psql -c "
  SELECT timer_id, instance_id, fire_at, 
         EXTRACT(EPOCH FROM (NOW() - fire_at))/60 as minutes_overdue
  FROM wf_timers_view 
  WHERE timer_status = 'PENDING' 
    AND fire_at <= NOW() - INTERVAL '5 minutes'
  ORDER BY fire_at
  LIMIT 10;
"

# 4. Fire Specific Timer Manually
curl -X POST "/api/v1/workflows/{instance_id}/timers/fire" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "timer_id": "timer-123"
  }'
```

**Investigation Steps:**

1. **Check Scheduler Process:**
   ```bash
   ps aux | grep scheduler
   systemctl status hera-scheduler
   ```

2. **Check Database Performance:**
   ```sql
   SELECT * FROM pg_stat_activity 
   WHERE query LIKE '%wf_timers%' 
     AND state = 'active';
   ```

3. **Check Worker Capacity:**
   ```bash
   # Check if workers are overwhelmed
   htop
   # Check database connections
   psql -c "SELECT count(*) FROM pg_stat_activity;"
   ```

**Resolution:**
- **Restart scheduler** if process is stuck
- **Scale timer workers** if capacity issue
- **Check database performance** and optimize queries
- **Manual intervention** for critical timers

---

## 🚨 Emergency Response Procedures

### Workflow Engine Down/Unavailable

**Symptoms:**
- API endpoints returning 500 errors
- No new workflows starting
- Existing workflows not advancing

**Immediate Response:**
1. **Check service status**
2. **Review recent deployments**
3. **Check database connectivity**
4. **Examine error logs**
5. **Activate business continuity procedures**

**Recovery Steps:**
1. Restart application services
2. Check database health and connections
3. Verify configuration files
4. Test with simple workflow start
5. Gradually restore full functionality

### Mass Workflow Failures

**Symptoms:**
- Workflow success rate < 98%
- Multiple organizations affected
- Similar error patterns across workflows

**Emergency Actions:**
```bash
# 1. Immediate Assessment
curl -X GET "/api/v1/workflows?organization_id=org-123&current_state=FAILED" \
  -H "Authorization: Bearer $TOKEN"

# 2. Emergency Stop (if needed)
# Set global emergency stop
curl -X POST "/api/v1/admin/feature-flags" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "action": "set",
    "definition_code": "ALL",
    "enabled": false,
    "global": true,
    "reason": "Emergency system-wide stop due to mass failures"
  }'

# 3. Pause All Active Workflows
# Script to pause all active workflows
```

### Data Corruption Detected

**Immediate Actions:**
1. **Stop all workflow processing**
2. **Activate backup and recovery procedures**
3. **Isolate affected systems**
4. **Contact database team**
5. **Document scope of corruption**

---

## 📊 Monitoring & Health Checks

### Daily Health Check Procedures

**Morning Checks (9 AM):**
```bash
# 1. Workflow Engine Health
curl -X GET "/api/health/workflows" -H "Authorization: Bearer $TOKEN"

# 2. Timer Processing Health
psql -c "
  SELECT 
    COUNT(*) FILTER (WHERE timer_status = 'PENDING' AND fire_at <= NOW()) as overdue_timers,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as timers_created_24h,
    COUNT(*) FILTER (WHERE timer_status = 'FIRED' AND fired_at >= NOW() - INTERVAL '24 hours') as timers_fired_24h
  FROM wf_timers_view;
"

# 3. Workflow Success Rate
psql -c "
  SELECT 
    COUNT(*) as total_workflows,
    COUNT(*) FILTER (WHERE current_state IN ('COMPLETED')) as completed,
    COUNT(*) FILTER (WHERE current_state IN ('FAILED', 'CANCELLED')) as failed,
    (COUNT(*) FILTER (WHERE current_state IN ('COMPLETED')) * 100.0 / COUNT(*)) as success_rate
  FROM wf_instances_view 
  WHERE created_at >= NOW() - INTERVAL '24 hours';
"
```

**Key Metrics to Monitor:**
- Workflow success rate (target: >99.5%)
- Timer fire latency (target: <60 seconds)
- Task completion SLA (target: <24 hours)
- Active workflow count
- Error rate by workflow type

### Weekly Health Review

**Every Monday (10 AM):**
1. Review previous week's metrics
2. Analyze any SLA breaches
3. Check for workflow definition updates needed
4. Review customer feedback and issues
5. Plan any operational improvements

---

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Workflows Stuck in PENDING State

**Symptoms:**
- Workflows not advancing from initial state
- No error messages in logs
- Timer seems set but not firing

**Diagnosis:**
```sql
-- Check workflow state
SELECT instance_id, current_state, created_at, updated_at
FROM wf_instances_view 
WHERE current_state = 'PENDING' 
  AND created_at < NOW() - INTERVAL '1 hour';

-- Check for associated timers
SELECT t.timer_id, t.fire_at, t.timer_status
FROM wf_timers_view t
JOIN wf_instances_view i ON i.instance_id = t.instance_id
WHERE i.current_state = 'PENDING';
```

**Resolution:**
1. Check if scheduler is running
2. Verify timer worker capacity
3. Manual timer fire if needed
4. Check for database locks

#### Issue: Customer Not Receiving Notifications

**Symptoms:**
- Workflow shows effects completed successfully
- Customer reports no WhatsApp message received
- Communication logs show delivery

**Diagnosis:**
```sql
-- Check effect execution
SELECT effect_id, effect_status, last_error
FROM wf_effects_view 
WHERE effect_smart_code = 'HERA.COMMS.WHATSAPP.SEND.MESSAGE.V1'
  AND created_at >= NOW() - INTERVAL '1 hour';

-- Check communication logs
SELECT * FROM communication_logs 
WHERE correlation_id = 'workflow-correlation-id';
```

**Resolution:**
1. Verify customer phone number format
2. Check WhatsApp service status
3. Validate message template
4. Manual message resend if needed

#### Issue: High Memory Usage

**Symptoms:**
- Server memory usage > 80%
- Slow query performance
- Occasional timeouts

**Diagnosis:**
```sql
-- Check long-running queries
SELECT pid, state, query_start, query
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query_start < NOW() - INTERVAL '30 seconds'
ORDER BY query_start;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;
```

**Resolution:**
1. Restart application if needed
2. Optimize problematic queries
3. Increase connection pooling
4. Scale resources if necessary

---

## 📚 Reference Information

### Smart Code Reference

| Smart Code | Purpose | Common Issues |
|------------|---------|---------------|
| `HERA.UNIV.WF.INSTANCE.V1` | Workflow instances | State consistency |
| `HERA.UNIV.WF.STEP.V1` | State transitions | Idempotency issues |
| `HERA.UNIV.WF.TIMER.V1` | Scheduled events | Fire latency |
| `HERA.UNIV.TASK.V1` | Human tasks | Assignment issues |
| `HERA.UNIV.WF.EFFECT.V1` | Effect execution | Retry failures |

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `WORKFLOW_DISABLED` | Feature flag disabled | Check feature flags |
| `PERMISSION_DENIED` | Insufficient permissions | Verify user role |
| `TIMER_ALREADY_FIRED` | Duplicate timer fire | Check for race conditions |
| `GUARD_FAILED` | Business rule violation | Review guard logic |
| `EFFECT_FAILED` | Effect execution error | Check external services |

### Database Quick Reference

```sql
-- Key Views
wf_instances_view    -- Workflow instances
wf_steps_view        -- State transitions  
wf_tasks_view        -- Human tasks
wf_timers_view       -- Scheduled events
wf_effects_view      -- Effect executions

-- Important Indexes
idx_wf_instances_org_state
idx_wf_instances_sla
idx_wf_timers_due
idx_wf_tasks_state_due

-- Critical Constraints
Timer uniqueness: (organization_id, entity_code)
Step idempotency: (organization_id, line_code)
```

### Log File Locations

```bash
# Application Logs
/var/log/hera/workflow-engine.log
/var/log/hera/scheduler.log
/var/log/hera/timer-worker.log

# Database Logs
/var/log/postgresql/postgresql-main.log

# System Logs
/var/log/syslog
journalctl -u hera-workflow-engine
```

---

## 📞 Support Procedures

### When to Escalate

**Immediate Escalation (Page Oncall):**
- Complete workflow engine failure
- Data corruption detected
- Security breach suspected
- Customer-facing service down

**Standard Escalation (Slack Alert):**
- SLA breach > 5%
- Performance degradation
- Individual workflow issues
- Configuration problems

**Business Escalation:**
- Customer complaints about automation
- Business process issues
- Approval workflow stuck
- Revenue-impacting problems

### Documentation Requirements

**Incident Documentation:**
1. Time and symptoms
2. Actions taken
3. Resolution steps
4. Root cause analysis
5. Prevention measures

**Change Documentation:**
1. Pre-change validation
2. Implementation steps
3. Post-change verification
4. Rollback procedures
5. Lessons learned

---

## 🔄 Maintenance Procedures

### Routine Maintenance

**Daily:**
- Health check dashboard review
- Error log review
- Performance metrics check

**Weekly:**
- Database maintenance (VACUUM, ANALYZE)
- Log rotation and cleanup
- Backup verification

**Monthly:**
- Index maintenance
- Query performance review
- Capacity planning review
- DR drill execution

### Emergency Maintenance

**Immediate Response:**
1. Assess impact and urgency
2. Implement temporary workarounds
3. Execute fix with minimal downtime
4. Verify resolution
5. Document incident

**Planned Maintenance:**
1. Schedule during low-usage periods
2. Notify stakeholders in advance
3. Prepare rollback procedures
4. Execute with monitoring
5. Validate post-maintenance

---

This runbook should be kept current with system changes and updated based on operational experience. Regular review and updates ensure effective incident response and system reliability.