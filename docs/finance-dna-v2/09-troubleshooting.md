# Finance DNA v2 - Troubleshooting Guide

**Smart Code**: `HERA.ACCOUNTING.TROUBLESHOOTING.GUIDE.v2`

**Auto-Generated**: ✅  
**Last Updated**: 2025-01-10  
**Source**: Live error analysis and support cases

## 🛠️ Common Issues & Solutions

### **1. GL Balance Validation Errors**

#### **Error**: Transaction not balanced
```
GL transaction not balanced: Debits=1000.00 Credits=900.00 Difference=100.00
```

**Cause**: Total debit amounts don't equal total credit amounts in journal entry.

**Solution**:
```sql
-- Check transaction balance
SELECT 
    ut.id,
    ut.transaction_code,
    COALESCE(SUM(utl.debit_amount), 0) as total_debits,
    COALESCE(SUM(utl.credit_amount), 0) as total_credits,
    ABS(COALESCE(SUM(utl.debit_amount), 0) - COALESCE(SUM(utl.credit_amount), 0)) as difference
FROM universal_transactions ut
LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
WHERE ut.organization_id = 'your-org-id'
  AND ut.id = 'problem-transaction-id'
GROUP BY ut.id, ut.transaction_code;

-- Fix by adjusting line amounts to balance
UPDATE universal_transaction_lines 
SET credit_amount = 1000.00 
WHERE transaction_id = 'problem-transaction-id' 
  AND line_number = 2;
```

**Prevention**:
- Always validate debit/credit totals before submission
- Use the GL balance validation function in your application
- Implement client-side balance checking

#### **Error**: Rounding differences in multi-currency transactions
```
GL transaction not balanced: Debits=999.99 Credits=1000.01 Difference=0.02
```

**Cause**: Currency conversion rounding differences.

**Solution**:
```sql
-- Automatic rounding adjustment function
CREATE OR REPLACE FUNCTION hera_auto_balance_adjustment_v2(
    p_transaction_id UUID,
    p_adjustment_account_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_difference DECIMAL(15,2);
    v_line_count INTEGER;
BEGIN
    -- Calculate balance difference
    SELECT 
        ABS(COALESCE(SUM(debit_amount), 0) - COALESCE(SUM(credit_amount), 0)),
        COUNT(*)
    INTO v_difference, v_line_count
    FROM universal_transaction_lines
    WHERE transaction_id = p_transaction_id;
    
    -- Only adjust for small rounding differences
    IF v_difference > 0 AND v_difference <= 0.05 THEN
        INSERT INTO universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            line_entity_id,
            line_type,
            debit_amount,
            credit_amount,
            smart_code
        ) VALUES (
            (SELECT organization_id FROM universal_transactions WHERE id = p_transaction_id),
            p_transaction_id,
            v_line_count + 1,
            p_adjustment_account_id,
            'ADJUSTMENT',
            CASE WHEN v_difference > 0 THEN 0.00 ELSE v_difference END,
            CASE WHEN v_difference > 0 THEN v_difference ELSE 0.00 END,
            'HERA.ACCOUNTING.GL.LINE.ROUNDING.ADJUSTMENT.v2'
        );
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;
```

### **2. Organization Access Issues**

#### **Error**: Organization access denied
```
Organization access denied: User does not have access to organization f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Cause**: User not properly assigned to organization or JWT token missing organization context.

**Diagnosis**:
```sql
-- Check user organization membership
SELECT 
    ce_user.entity_name as user_name,
    ce_org.entity_name as organization_name,
    cr.relationship_type,
    cr.created_at as membership_date
FROM core_entities ce_user
JOIN core_relationships cr ON ce_user.id = cr.from_entity_id
JOIN core_entities ce_org ON cr.to_entity_id = ce_org.id
WHERE ce_user.entity_type = 'user'
  AND ce_user.id = 'problem-user-id'
  AND cr.relationship_type = 'MEMBER_OF';

-- Check JWT organization context
SELECT current_setting('app.current_org', true) as current_org_setting;
```

**Solution**:
```sql
-- Add user to organization
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code
) VALUES (
    'target-organization-id',
    'user-entity-id',
    'target-organization-id',
    'MEMBER_OF',
    'HERA.ACCOUNTING.SECURITY.USER.MEMBERSHIP.v2'
);

-- Set organization context in session
SELECT hera_set_organization_context_v2('target-organization-id');
```

### **3. Smart Code Validation Failures**

#### **Error**: Invalid smart code format
```
Smart code validation failed: 'HERA.ACCOUNTING.GL.TXN.JOURNAL.v1' does not match required pattern
```

**Cause**: Using v1 smart codes or incorrect format.

**Solution**:
```sql
-- Find and update invalid smart codes
WITH invalid_smart_codes AS (
    SELECT 
        id,
        smart_code,
        CASE 
            WHEN smart_code LIKE '%.v1' THEN REPLACE(smart_code, '.v1', '.v2')
            WHEN smart_code NOT LIKE 'HERA.ACCOUNTING.%' THEN 'HERA.ACCOUNTING.MIGRATION.ENTITY.v2'
            ELSE smart_code
        END as corrected_smart_code
    FROM core_entities
    WHERE organization_id = 'your-org-id'
      AND NOT validate_finance_dna_smart_code(smart_code)
)
UPDATE core_entities ce
SET smart_code = isc.corrected_smart_code
FROM invalid_smart_codes isc
WHERE ce.id = isc.id;
```

**Validation Function**:
```sql
-- Test smart code validity
SELECT 
    smart_code,
    validate_finance_dna_smart_code(smart_code) as is_valid,
    CASE 
        WHEN validate_finance_dna_smart_code(smart_code) THEN 'VALID'
        ELSE 'INVALID - UPDATE REQUIRED'
    END as status
FROM core_entities
WHERE organization_id = 'your-org-id'
  AND entity_type IN ('gl_account', 'fin_rule', 'fiscal_period')
ORDER BY is_valid, smart_code;
```

### **4. RLS Policy Issues**

#### **Error**: No data returned despite records existing
```
Query returns 0 rows but records exist in database
```

**Cause**: Row Level Security blocking access due to incorrect organization context.

**Diagnosis**:
```sql
-- Check RLS policy status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
      'core_organizations', 'core_entities', 'core_dynamic_data',
      'core_relationships', 'universal_transactions', 'universal_transaction_lines'
  );

-- Check current organization context
SELECT 
    current_setting('app.current_org', true) as current_org,
    current_setting('app.current_user_id', true) as current_user;

-- Test query with RLS disabled (for debugging only)
SET row_security = off;
SELECT COUNT(*) FROM core_entities WHERE organization_id = 'your-org-id';
SET row_security = on;
```

**Solution**:
```sql
-- Properly set organization context before queries
SELECT hera_set_organization_context_v2('correct-organization-id');

-- Verify context is set correctly
SELECT current_setting('app.current_org')::uuid = 'correct-organization-id'::uuid as context_correct;

-- Re-run original query
SELECT * FROM core_entities WHERE entity_type = 'gl_account' LIMIT 5;
```

### **5. Performance Issues**

#### **Issue**: Slow trial balance generation
```
Trial balance taking >30 seconds to generate
```

**Diagnosis**:
```sql
-- Check query execution plan
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    ce.id,
    ce.entity_code,
    ce.entity_name,
    COALESCE(SUM(utl.debit_amount), 0) as total_debits,
    COALESCE(SUM(utl.credit_amount), 0) as total_credits
FROM core_entities ce
LEFT JOIN universal_transaction_lines utl ON ce.id = utl.line_entity_id
WHERE ce.organization_id = 'your-org-id'
  AND ce.entity_type = 'gl_account'
GROUP BY ce.id, ce.entity_code, ce.entity_name;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('core_entities', 'universal_transaction_lines')
ORDER BY idx_tup_read DESC;
```

**Solution**:
```sql
-- Create performance indexes if missing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_org_type 
    ON core_entities (organization_id, entity_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_lines_entity_org
    ON universal_transaction_lines (line_entity_id, organization_id);

-- Use materialized view for better performance
REFRESH MATERIALIZED VIEW mv_account_balances_v2;

-- Call optimized RPC function
SELECT * FROM hera_generate_trial_balance_v2(
    'your-org-id'::uuid,
    CURRENT_DATE,
    true,  -- include_sub_accounts
    'USD',
    false, -- include_zero_balances
    null,  -- account_type_filter
    true   -- use_materialized_view
);
```

### **6. Policy Application Failures**

#### **Error**: Policy not triggering for transactions
```
Expected policy to trigger for transaction but no GL posting occurred
```

**Diagnosis**:
```sql
-- Check policy configuration
SELECT 
    ce.entity_name as policy_name,
    ce.metadata as policy_metadata,
    cdd.field_value_json as policy_config
FROM core_entities ce
JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
WHERE ce.organization_id = 'your-org-id'
  AND ce.entity_type = 'fin_rule'
  AND cdd.field_name = 'posting_configuration';

-- Test policy matching
SELECT hera_resolve_applicable_policies_v2(
    'your-org-id'::uuid,
    'HERA.SALES.TXN.ORDER.v2',
    '{"transaction_type": "sale", "total_amount": 1000.00}'::jsonb
);

-- Check policy execution logs
SELECT 
    ut.created_at,
    ut.smart_code,
    ut.metadata
FROM universal_transactions ut
WHERE ut.organization_id = 'your-org-id'
  AND ut.smart_code LIKE '%POLICY%'
  AND ut.created_at >= NOW() - INTERVAL '1 day'
ORDER BY ut.created_at DESC;
```

**Solution**:
```sql
-- Test individual policy
SELECT hera_test_policy_application_v2(
    'your-org-id'::uuid,
    'policy-id'::uuid,
    '{"smart_code": "HERA.SALES.TXN.ORDER.v2", "total_amount": 1000.00}'::jsonb
);

-- Update policy configuration if needed
UPDATE core_dynamic_data
SET field_value_json = jsonb_set(
    field_value_json,
    '{trigger_conditions,smart_code_pattern}',
    '"HERA.SALES.TXN.ORDER.v2"'
)
WHERE entity_id = 'policy-entity-id'
  AND field_name = 'posting_configuration';
```

### **7. Migration Issues**

#### **Error**: Migration stuck in progress
```
Migration batch appears hung with no progress for >30 minutes
```

**Diagnosis**:
```sql
-- Check migration status
SELECT 
    metadata->>'migration_batch' as batch_id,
    smart_code,
    COUNT(*) as event_count,
    MAX(created_at) as last_activity
FROM universal_transactions
WHERE organization_id = 'your-org-id'
  AND smart_code LIKE 'HERA.ACCOUNTING.MIGRATION.%'
  AND metadata->>'migration_batch' = 'MIGRATION_2025_01_10_001'
GROUP BY metadata->>'migration_batch', smart_code
ORDER BY last_activity DESC;

-- Check for blocking locks
SELECT 
    pg_stat_activity.pid,
    pg_stat_activity.state,
    pg_stat_activity.query,
    pg_stat_activity.query_start
FROM pg_stat_activity
WHERE pg_stat_activity.datname = current_database()
  AND state = 'active'
  AND query LIKE '%migration%';
```

**Solution**:
```sql
-- Resume migration from last successful phase
SELECT hera_migration_phase_3_reverse_transactions_v2(
    'your-org-id'::uuid,
    'MIGRATION_2025_01_10_001',
    50  -- smaller batch size
);

-- If necessary, perform emergency rollback
SELECT hera_migration_emergency_rollback_v2(
    'your-org-id'::uuid,
    'MIGRATION_2025_01_10_001',
    'Migration hung - emergency rollback performed'
);
```

## 🔍 Diagnostic Queries

### **System Health Check**
```sql
-- Comprehensive system health check
WITH health_metrics AS (
    -- Organization data
    SELECT 
        'organizations' as metric_type,
        COUNT(*) as count,
        'INFO' as status
    FROM core_organizations
    
    UNION ALL
    
    -- GL accounts per organization
    SELECT 
        'gl_accounts' as metric_type,
        COUNT(*) as count,
        CASE 
            WHEN COUNT(*) >= 10 THEN 'HEALTHY'
            WHEN COUNT(*) >= 5 THEN 'WARNING'
            ELSE 'CRITICAL'
        END as status
    FROM core_entities
    WHERE entity_type = 'gl_account'
      AND organization_id = 'your-org-id'
    
    UNION ALL
    
    -- Recent transactions
    SELECT 
        'recent_transactions' as metric_type,
        COUNT(*) as count,
        CASE 
            WHEN COUNT(*) > 0 THEN 'ACTIVE'
            ELSE 'INACTIVE'
        END as status
    FROM universal_transactions
    WHERE organization_id = 'your-org-id'
      AND created_at >= NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    -- Policy configuration
    SELECT 
        'financial_policies' as metric_type,
        COUNT(*) as count,
        CASE 
            WHEN COUNT(*) >= 1 THEN 'CONFIGURED'
            ELSE 'NOT_CONFIGURED'
        END as status
    FROM core_entities
    WHERE entity_type = 'fin_rule'
      AND organization_id = 'your-org-id'
)
SELECT 
    metric_type,
    count,
    status,
    CASE 
        WHEN status IN ('HEALTHY', 'ACTIVE', 'CONFIGURED', 'INFO') THEN '✅'
        WHEN status IN ('WARNING', 'INACTIVE') THEN '⚠️'
        ELSE '❌'
    END as indicator
FROM health_metrics
ORDER BY 
    CASE status 
        WHEN 'CRITICAL' THEN 1
        WHEN 'WARNING' THEN 2
        WHEN 'NOT_CONFIGURED' THEN 3
        ELSE 4
    END;
```

### **Data Integrity Validation**
```sql
-- Check for data integrity issues
WITH integrity_checks AS (
    -- Orphaned transaction lines
    SELECT 
        'orphaned_transaction_lines' as check_type,
        COUNT(*) as issue_count,
        'Transaction lines without parent transaction' as description
    FROM universal_transaction_lines utl
    LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.id IS NULL
      AND utl.organization_id = 'your-org-id'
    
    UNION ALL
    
    -- Missing GL account references
    SELECT 
        'missing_gl_accounts' as check_type,
        COUNT(*) as issue_count,
        'Transaction lines referencing non-existent GL accounts' as description
    FROM universal_transaction_lines utl
    LEFT JOIN core_entities ce ON utl.line_entity_id = ce.id
    WHERE ce.id IS NULL
      AND utl.organization_id = 'your-org-id'
    
    UNION ALL
    
    -- Unbalanced transactions
    SELECT 
        'unbalanced_transactions' as check_type,
        COUNT(*) as issue_count,
        'Transactions with debit/credit imbalance > $0.01' as description
    FROM (
        SELECT 
            ut.id,
            ABS(COALESCE(SUM(utl.debit_amount), 0) - COALESCE(SUM(utl.credit_amount), 0)) as imbalance
        FROM universal_transactions ut
        LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
        WHERE ut.organization_id = 'your-org-id'
          AND ut.transaction_type = 'JOURNAL_ENTRY'
        GROUP BY ut.id
        HAVING ABS(COALESCE(SUM(utl.debit_amount), 0) - COALESCE(SUM(utl.credit_amount), 0)) > 0.01
    ) unbalanced
)
SELECT 
    check_type,
    issue_count,
    description,
    CASE 
        WHEN issue_count = 0 THEN '✅ PASS'
        WHEN issue_count <= 5 THEN '⚠️ WARNING'
        ELSE '❌ CRITICAL'
    END as status
FROM integrity_checks
ORDER BY issue_count DESC;
```

### **Performance Analysis**
```sql
-- Analyze query performance patterns
SELECT 
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as sequential_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as index_tuples_fetched,
    ROUND(
        CASE 
            WHEN (seq_scan + idx_scan) > 0 
            THEN (idx_scan::DECIMAL / (seq_scan + idx_scan)) * 100 
            ELSE 0 
        END, 2
    ) as index_usage_percent
FROM pg_stat_user_tables
WHERE tablename IN (
    'core_organizations', 'core_entities', 'core_dynamic_data',
    'core_relationships', 'universal_transactions', 'universal_transaction_lines'
)
ORDER BY seq_scan DESC;
```

## 🛡️ Emergency Procedures

### **Emergency Data Recovery**
```sql
-- If data appears lost, check RLS settings first
SET row_security = off;  -- DANGER: Only for emergency diagnosis
SELECT COUNT(*) FROM core_entities WHERE organization_id = 'your-org-id';
SET row_security = on;

-- If data exists but is inaccessible, check user permissions
SELECT hera_validate_organization_access('your-org-id'::uuid);

-- Restore from backup if data is truly lost
-- (Backup restoration procedures would be environment-specific)
```

### **Emergency Transaction Reversal**
```sql
-- Create emergency reversal transaction
SELECT hera_post_gl_transaction_v2(
    'your-org-id'::uuid,
    '{"transaction_type": "JOURNAL_ENTRY", "description": "Emergency reversal"}'::jsonb,
    ARRAY[
        '{"line_number": 1, "gl_account_id": "account-1", "credit_amount": 1000.00}'::jsonb,
        '{"line_number": 2, "gl_account_id": "account-2", "debit_amount": 1000.00}'::jsonb
    ]
);
```

### **Emergency User Access Restoration**
```sql
-- Grant emergency access to organization
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    metadata
) VALUES (
    'target-org-id',
    'emergency-user-id',
    'target-org-id',
    'MEMBER_OF',
    'HERA.ACCOUNTING.SECURITY.EMERGENCY.ACCESS.v2',
    '{"emergency": true, "granted_by": "system_admin", "reason": "data_recovery"}'::jsonb
);
```

---

## 📞 Support Resources

### **Log Analysis**
```sql
-- Get recent error logs
SELECT 
    created_at,
    smart_code,
    metadata->>'error_message' as error,
    metadata->>'function_name' as function_name,
    metadata
FROM universal_transactions
WHERE organization_id = 'your-org-id'
  AND smart_code LIKE '%ERROR%'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
```

### **Configuration Validation**
```sql
-- Validate Finance DNA v2 configuration
SELECT * FROM hera_validate_security_configuration_v2('your-org-id'::uuid);
SELECT * FROM hera_policy_health_check_v2('your-org-id'::uuid);
SELECT * FROM validate_sacred_six_compliance();
```

### **Contact Information**
- **Technical Support**: Create issue at GitHub repository
- **Documentation**: `/docs/finance-dna-v2/` (this documentation)
- **Emergency Escalation**: Follow organization's incident response procedures

**Finance DNA v2 troubleshooting guide provides comprehensive solutions for common issues while maintaining Sacred Six compliance and complete audit trails.**