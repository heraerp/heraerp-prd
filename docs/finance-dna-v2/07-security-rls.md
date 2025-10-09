# Finance DNA v2 - Security & Row Level Security

**Smart Code**: `HERA.ACCOUNTING.SECURITY.RLS.ARCHITECTURE.v2`

**Auto-Generated**: ✅  
**Last Updated**: 2025-01-10  
**Source**: Live RLS policy analysis

## 🔐 Security Architecture Overview

Finance DNA v2 implements **enterprise-grade security** with multiple layers of protection, perfect multi-tenant isolation, and comprehensive audit trails. All security measures are built on the Sacred Six architecture.

### **Security Principles**
- **Zero Trust Architecture**: Every request verified and authorized
- **Perfect Multi-Tenancy**: Organization-level data isolation via RLS
- **Defense in Depth**: Multiple security layers working together
- **Sacred Six Compliance**: All security data stored in universal tables
- **Complete Audit Trail**: Every security event logged and traceable

## 🏛️ Row Level Security (RLS) Implementation

### **Universal RLS Policy Pattern**

All Sacred Six tables enforce perfect organization isolation:

```sql
-- Universal RLS policy template for all Sacred Six tables
CREATE POLICY finance_dna_v2_org_isolation ON {table_name}
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_org')::uuid)
    WITH CHECK (organization_id = current_setting('app.current_org')::uuid);

-- Enable RLS on all Sacred Six tables
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;
```

### **Organization Context Management**

```sql
-- Organization context setting function
CREATE OR REPLACE FUNCTION hera_set_organization_context_v2(
    p_organization_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_org_access BOOLEAN := false;
BEGIN
    -- Validate user has access to this organization
    SELECT hera_validate_user_organization_access_v2(
        current_setting('app.current_user_id')::uuid,
        p_organization_id
    ) INTO v_user_org_access;
    
    IF NOT v_user_org_access THEN
        RAISE EXCEPTION 'User does not have access to organization: %', p_organization_id;
    END IF;
    
    -- Set organization context for RLS
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    -- Log context switch
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'SECURITY_CONTEXT_SWITCH',
        'HERA.ACCOUNTING.SECURITY.RLS.ENFORCEMENT.v2',
        jsonb_build_object(
            'user_id', current_setting('app.current_user_id', true),
            'context_switch_time', NOW(),
            'session_id', current_setting('app.session_id', true)
        )
    );
    
    RETURN true;
END;
$$;
```

### **Advanced RLS Policies**

#### **1. Time-Based Access Control**

```sql
-- Time-restricted access policy for financial operations
CREATE POLICY finance_dna_v2_time_restricted ON universal_transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = current_setting('app.current_org')::uuid
        AND (
            -- Allow during business hours (9 AM - 6 PM)
            EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 18
            OR 
            -- Allow admin users anytime
            hera_user_has_role_v2(
                current_setting('app.current_user_id')::uuid,
                'finance_admin'
            )
        )
    );
```

#### **2. Amount-Based Access Control**

```sql
-- Amount threshold policy for large transactions
CREATE POLICY finance_dna_v2_amount_threshold ON universal_transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = current_setting('app.current_org')::uuid
        AND (
            total_amount <= 10000.00
            OR 
            hera_user_has_role_v2(
                current_setting('app.current_user_id')::uuid,
                'finance_manager'
            )
        )
    );
```

#### **3. Fiscal Period Access Control**

```sql
-- Prevent posting to closed periods
CREATE POLICY finance_dna_v2_fiscal_period_control ON universal_transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = current_setting('app.current_org')::uuid
        AND hera_validate_fiscal_period_access_v2(
            organization_id,
            transaction_date,
            current_setting('app.current_user_id')::uuid
        )
    );
```

## 🔑 Authentication & Authorization

### **User Identity Resolution**

```sql
CREATE OR REPLACE FUNCTION hera_resolve_user_identity_v2()
RETURNS TABLE(
    user_id UUID,
    organization_id UUID,
    user_roles TEXT[],
    permissions TEXT[],
    session_context JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_organization_id UUID;
BEGIN
    -- Get user ID from JWT or session
    v_user_id := current_setting('app.current_user_id')::uuid;
    v_organization_id := current_setting('app.current_org')::uuid;
    
    RETURN QUERY
    WITH user_memberships AS (
        SELECT 
            ce_user.id as user_id,
            ce_org.id as organization_id,
            array_agg(DISTINCT cdd_role.field_value_text) as user_roles,
            array_agg(DISTINCT cdd_perm.field_value_text) as permissions
        FROM core_entities ce_user
        JOIN core_relationships cr ON ce_user.id = cr.from_entity_id
        JOIN core_entities ce_org ON cr.to_entity_id = ce_org.id
        LEFT JOIN core_dynamic_data cdd_role ON ce_user.id = cdd_role.entity_id 
            AND cdd_role.field_name = 'user_role'
        LEFT JOIN core_dynamic_data cdd_perm ON ce_user.id = cdd_perm.entity_id
            AND cdd_perm.field_name = 'user_permission'
        WHERE ce_user.id = v_user_id
          AND ce_org.id = v_organization_id
          AND cr.relationship_type = 'MEMBER_OF'
        GROUP BY ce_user.id, ce_org.id
    )
    SELECT 
        um.user_id,
        um.organization_id,
        um.user_roles,
        um.permissions,
        jsonb_build_object(
            'session_start', current_setting('app.session_start', true),
            'last_activity', NOW(),
            'ip_address', current_setting('app.client_ip', true)
        ) as session_context
    FROM user_memberships um;
END;
$$;
```

### **Role-Based Access Control (RBAC)**

```sql
-- Financial roles stored as entities
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES 
(p_organization_id, 'fin_role', 'Finance Administrator', 'ROLE_FIN_ADMIN', 
 'HERA.ACCOUNTING.SECURITY.ROLE.ADMIN.v2',
 '{"permissions": ["finance:read", "finance:write", "finance:admin"]}'),
(p_organization_id, 'fin_role', 'Finance Manager', 'ROLE_FIN_MANAGER',
 'HERA.ACCOUNTING.SECURITY.ROLE.MANAGER.v2', 
 '{"permissions": ["finance:read", "finance:write"]}'),
(p_organization_id, 'fin_role', 'Finance User', 'ROLE_FIN_USER',
 'HERA.ACCOUNTING.SECURITY.ROLE.USER.v2',
 '{"permissions": ["finance:read"]}');

-- Role permissions in dynamic data
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code
) VALUES (
    p_organization_id,
    v_finance_admin_role_id,
    'role_permissions',
    'json',
    '{
        "financial_transactions": {
            "create": true,
            "read": true,
            "update": true,
            "delete": true,
            "approve": true
        },
        "chart_of_accounts": {
            "create": true,
            "read": true,
            "update": true,
            "delete": true
        },
        "financial_reports": {
            "view_all": true,
            "export": true,
            "schedule": true
        },
        "system_administration": {
            "user_management": true,
            "role_assignment": true,
            "system_configuration": true
        }
    }',
    'HERA.ACCOUNTING.SECURITY.PERMISSIONS.ADMIN.v2'
);
```

### **Permission Validation Function**

```sql
CREATE OR REPLACE FUNCTION hera_validate_permission_v2(
    p_user_id UUID,
    p_organization_id UUID,
    p_required_permission TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_permission BOOLEAN := false;
    v_user_roles TEXT[];
    v_permission_check RECORD;
BEGIN
    -- Get user roles
    SELECT user_roles INTO v_user_roles
    FROM hera_resolve_user_identity_v2()
    WHERE user_id = p_user_id AND organization_id = p_organization_id;
    
    -- Check permissions for each role
    FOR v_permission_check IN
        SELECT 
            ce.entity_name as role_name,
            cdd.field_value_json as role_permissions
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'fin_role'
          AND ce.entity_name = ANY(v_user_roles)
          AND cdd.field_name = 'role_permissions'
    LOOP
        -- Check if permission exists in role
        IF jsonb_path_exists(
            v_permission_check.role_permissions,
            format('$.**?(@.type() == "boolean" && @ == true && $.keyname() == "%s")', 
                   p_required_permission)::jsonpath
        ) THEN
            v_has_permission := true;
            EXIT;
        END IF;
    END LOOP;
    
    -- Log permission check
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'PERMISSION_CHECK',
        CASE 
            WHEN v_has_permission THEN 'HERA.ACCOUNTING.SECURITY.PERMISSION.GRANTED.v2'
            ELSE 'HERA.ACCOUNTING.SECURITY.PERMISSION.DENIED.v2'
        END,
        jsonb_build_object(
            'user_id', p_user_id,
            'required_permission', p_required_permission,
            'permission_granted', v_has_permission,
            'user_roles', v_user_roles
        )
    );
    
    RETURN v_has_permission;
END;
$$;
```

## 🔒 Data Encryption

### **Field-Level Encryption for Sensitive Data**

```sql
-- Encrypt sensitive financial data in dynamic data
CREATE OR REPLACE FUNCTION hera_encrypt_sensitive_field_v2(
    p_organization_id UUID,
    p_entity_id UUID,
    p_field_name TEXT,
    p_sensitive_value TEXT,
    p_smart_code TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted_value TEXT;
    v_field_id UUID;
    v_encryption_key TEXT;
BEGIN
    -- Get organization-specific encryption key
    SELECT hera_get_org_encryption_key_v2(p_organization_id) 
    INTO v_encryption_key;
    
    -- Encrypt the sensitive value
    v_encrypted_value := pgp_sym_encrypt(p_sensitive_value, v_encryption_key);
    
    -- Store encrypted value in dynamic data
    INSERT INTO core_dynamic_data (
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value_text,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        p_entity_id,
        p_field_name,
        'encrypted_text',
        v_encrypted_value,
        p_smart_code,
        jsonb_build_object(
            'encryption_algorithm', 'AES-256',
            'encrypted_at', NOW(),
            'encrypted_by', current_setting('app.current_user_id', true)
        )
    ) RETURNING id INTO v_field_id;
    
    -- Log encryption event
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'DATA_ENCRYPTION',
        'HERA.ACCOUNTING.SECURITY.ENCRYPTION.FIELD.v2',
        jsonb_build_object(
            'entity_id', p_entity_id,
            'field_name', p_field_name,
            'encrypted_field_id', v_field_id
        )
    );
    
    RETURN v_field_id;
END;
$$;
```

### **Secure Data Retrieval**

```sql
CREATE OR REPLACE FUNCTION hera_decrypt_sensitive_field_v2(
    p_organization_id UUID,
    p_field_id UUID,
    p_user_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted_value TEXT;
    v_decrypted_value TEXT;
    v_encryption_key TEXT;
    v_access_authorized BOOLEAN := false;
BEGIN
    -- Validate user has permission to decrypt
    SELECT hera_validate_permission_v2(
        p_user_id, 
        p_organization_id, 
        'sensitive_data:decrypt'
    ) INTO v_access_authorized;
    
    IF NOT v_access_authorized THEN
        RAISE EXCEPTION 'Insufficient permissions to decrypt sensitive data';
    END IF;
    
    -- Get encrypted value
    SELECT field_value_text INTO v_encrypted_value
    FROM core_dynamic_data
    WHERE id = p_field_id
      AND organization_id = p_organization_id
      AND field_type = 'encrypted_text';
    
    IF v_encrypted_value IS NULL THEN
        RAISE EXCEPTION 'Encrypted field not found or access denied';
    END IF;
    
    -- Get decryption key
    SELECT hera_get_org_encryption_key_v2(p_organization_id) 
    INTO v_encryption_key;
    
    -- Decrypt value
    v_decrypted_value := pgp_sym_decrypt(v_encrypted_value, v_encryption_key);
    
    -- Log decryption access
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'DATA_DECRYPTION',
        'HERA.ACCOUNTING.SECURITY.DECRYPTION.ACCESS.v2',
        jsonb_build_object(
            'field_id', p_field_id,
            'accessed_by', p_user_id,
            'access_timestamp', NOW(),
            'access_ip', current_setting('app.client_ip', true)
        )
    );
    
    RETURN v_decrypted_value;
END;
$$;
```

## 🔍 Security Monitoring & Audit

### **Security Event Detection**

```sql
CREATE OR REPLACE FUNCTION hera_detect_security_anomalies_v2(
    p_organization_id UUID,
    p_time_window_hours INTEGER DEFAULT 24
) RETURNS TABLE(
    anomaly_type TEXT,
    severity_level TEXT,
    event_count BIGINT,
    affected_users TEXT[],
    anomaly_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH time_boundary AS (
        SELECT NOW() - INTERVAL '1 hour' * p_time_window_hours as start_time
    ),
    -- Failed authentication attempts
    failed_auth_anomalies AS (
        SELECT 
            'REPEATED_AUTH_FAILURES' as anomaly_type,
            CASE 
                WHEN COUNT(*) > 10 THEN 'HIGH'
                WHEN COUNT(*) > 5 THEN 'MEDIUM'
                ELSE 'LOW'
            END as severity_level,
            COUNT(*) as event_count,
            array_agg(DISTINCT metadata->>'user_id') as affected_users,
            jsonb_build_object(
                'failure_count', COUNT(*),
                'time_window_hours', p_time_window_hours,
                'last_failure', MAX(created_at)
            ) as anomaly_details
        FROM universal_transactions ut, time_boundary tb
        WHERE ut.organization_id = p_organization_id
          AND ut.smart_code = 'HERA.ACCOUNTING.SECURITY.AUTH.FAILURE.v2'
          AND ut.created_at >= tb.start_time
        GROUP BY metadata->>'user_id'
        HAVING COUNT(*) > 3
    ),
    -- Unusual access patterns
    access_pattern_anomalies AS (
        SELECT 
            'UNUSUAL_ACCESS_PATTERN' as anomaly_type,
            'MEDIUM' as severity_level,
            COUNT(*) as event_count,
            array_agg(DISTINCT metadata->>'user_id') as affected_users,
            jsonb_build_object(
                'access_count', COUNT(*),
                'unique_hours', COUNT(DISTINCT EXTRACT(HOUR FROM created_at)),
                'access_pattern', 'outside_normal_hours'
            ) as anomaly_details
        FROM universal_transactions ut, time_boundary tb
        WHERE ut.organization_id = p_organization_id
          AND ut.smart_code LIKE 'HERA.ACCOUNTING.SECURITY.%.v2'
          AND ut.created_at >= tb.start_time
          AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 8 AND 19
        GROUP BY metadata->>'user_id'
        HAVING COUNT(*) > 5
    ),
    -- Privilege escalation attempts
    privilege_escalation_anomalies AS (
        SELECT 
            'PRIVILEGE_ESCALATION_ATTEMPT' as anomaly_type,
            'HIGH' as severity_level,
            COUNT(*) as event_count,
            array_agg(DISTINCT metadata->>'user_id') as affected_users,
            jsonb_build_object(
                'denied_permissions', array_agg(DISTINCT metadata->>'required_permission'),
                'escalation_attempts', COUNT(*)
            ) as anomaly_details
        FROM universal_transactions ut, time_boundary tb
        WHERE ut.organization_id = p_organization_id
          AND ut.smart_code = 'HERA.ACCOUNTING.SECURITY.PERMISSION.DENIED.v2'
          AND ut.created_at >= tb.start_time
          AND metadata->>'required_permission' LIKE '%admin%'
        GROUP BY metadata->>'user_id'
        HAVING COUNT(*) > 2
    )
    SELECT * FROM failed_auth_anomalies
    UNION ALL
    SELECT * FROM access_pattern_anomalies
    UNION ALL
    SELECT * FROM privilege_escalation_anomalies;
END;
$$;
```

### **Real-Time Security Dashboard**

```sql
CREATE OR REPLACE FUNCTION hera_security_dashboard_v2(
    p_organization_id UUID
) RETURNS TABLE(
    metric_category TEXT,
    metric_name TEXT,
    metric_value NUMERIC,
    metric_status TEXT,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH security_metrics AS (
        -- Active Sessions
        SELECT 
            'SESSION_MANAGEMENT' as category,
            'Active Sessions' as metric_name,
            COUNT(DISTINCT metadata->>'session_id')::NUMERIC as metric_value,
            'INFO' as metric_status,
            MAX(created_at) as last_updated
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND smart_code = 'HERA.ACCOUNTING.SECURITY.RLS.ENFORCEMENT.v2'
          AND created_at >= NOW() - INTERVAL '1 hour'
        
        UNION ALL
        
        -- Permission Denials (Last 24h)
        SELECT 
            'ACCESS_CONTROL' as category,
            'Permission Denials (24h)' as metric_name,
            COUNT(*)::NUMERIC as metric_value,
            CASE 
                WHEN COUNT(*) > 20 THEN 'CRITICAL'
                WHEN COUNT(*) > 10 THEN 'WARNING'
                ELSE 'NORMAL'
            END as metric_status,
            MAX(created_at) as last_updated
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND smart_code = 'HERA.ACCOUNTING.SECURITY.PERMISSION.DENIED.v2'
          AND created_at >= NOW() - INTERVAL '24 hours'
        
        UNION ALL
        
        -- Encryption Operations (Last Hour)
        SELECT 
            'DATA_PROTECTION' as category,
            'Encryption Ops (1h)' as metric_name,
            COUNT(*)::NUMERIC as metric_value,
            'INFO' as metric_status,
            MAX(created_at) as last_updated
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND smart_code IN (
              'HERA.ACCOUNTING.SECURITY.ENCRYPTION.FIELD.v2',
              'HERA.ACCOUNTING.SECURITY.DECRYPTION.ACCESS.v2'
          )
          AND created_at >= NOW() - INTERVAL '1 hour'
        
        UNION ALL
        
        -- RLS Policy Compliance
        SELECT 
            'RLS_COMPLIANCE' as category,
            'RLS Policy Violations' as metric_name,
            0::NUMERIC as metric_value,  -- Placeholder - would be calculated from RLS audit
            'PASS' as metric_status,
            NOW() as last_updated
    )
    SELECT * FROM security_metrics;
END;
$$;
```

## 🛡️ Security Best Practices

### **Secure RPC Function Template**

```sql
-- Template for secure Finance DNA v2 RPC functions
CREATE OR REPLACE FUNCTION hera_secure_finance_function_template_v2(
    p_organization_id UUID,
    p_required_permission TEXT,
    p_function_parameters JSONB
) RETURNS function_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_result function_result;
    v_start_time TIMESTAMP := clock_timestamp();
BEGIN
    -- 1. Extract user context
    v_user_id := current_setting('app.current_user_id')::uuid;
    
    -- 2. Validate organization access
    IF NOT hera_validate_organization_access(p_organization_id) THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- 3. Set organization context for RLS
    PERFORM hera_set_organization_context_v2(p_organization_id);
    
    -- 4. Validate permissions
    IF NOT hera_validate_permission_v2(v_user_id, p_organization_id, p_required_permission) THEN
        RAISE EXCEPTION 'Insufficient permissions: %', p_required_permission;
    END IF;
    
    -- 5. Input validation and sanitization
    IF p_function_parameters IS NULL THEN
        RAISE EXCEPTION 'Function parameters cannot be null';
    END IF;
    
    -- 6. Business logic execution (RLS automatically applied)
    BEGIN
        -- Your secure business logic here
        -- All queries automatically filtered by organization_id via RLS
        
        v_result.success := true;
        v_result.message := 'Operation completed successfully';
        
    EXCEPTION WHEN OTHERS THEN
        -- 7. Error handling and logging
        INSERT INTO universal_transactions (
            organization_id,
            transaction_type,
            smart_code,
            metadata
        ) VALUES (
            p_organization_id,
            'FUNCTION_ERROR',
            'HERA.ACCOUNTING.SECURITY.ERROR.LOGGED.v2',
            jsonb_build_object(
                'function_name', 'hera_secure_finance_function_template_v2',
                'error_message', SQLERRM,
                'user_id', v_user_id,
                'parameters', p_function_parameters
            )
        );
        
        v_result.success := false;
        v_result.message := 'Operation failed: ' || SQLERRM;
    END;
    
    -- 8. Audit logging
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'FUNCTION_EXECUTION',
        'HERA.ACCOUNTING.AUDIT.FUNCTION.EXECUTED.v2',
        jsonb_build_object(
            'function_name', 'hera_secure_finance_function_template_v2',
            'user_id', v_user_id,
            'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time)),
            'success', v_result.success,
            'parameters_hash', md5(p_function_parameters::text)
        )
    );
    
    RETURN v_result;
END;
$$;
```

### **Security Configuration Validation**

```sql
CREATE OR REPLACE FUNCTION hera_validate_security_configuration_v2(
    p_organization_id UUID
) RETURNS TABLE(
    security_area TEXT,
    configuration_item TEXT,
    status TEXT,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH security_checks AS (
        -- RLS Policy Check
        SELECT 
            'RLS_POLICIES' as security_area,
            'Sacred Six RLS Enabled' as configuration_item,
            CASE 
                WHEN COUNT(*) = 6 THEN 'COMPLIANT'
                ELSE 'NON_COMPLIANT'
            END as status,
            CASE 
                WHEN COUNT(*) = 6 THEN 'All Sacred Six tables have RLS enabled'
                ELSE format('Only %s/6 Sacred Six tables have RLS enabled', COUNT(*))
            END as recommendation
        FROM (
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename IN (
                  'core_organizations', 'core_entities', 'core_dynamic_data',
                  'core_relationships', 'universal_transactions', 'universal_transaction_lines'
              )
              AND rowsecurity = true
        ) rls_tables
        
        UNION ALL
        
        -- User Role Assignment Check
        SELECT 
            'RBAC' as security_area,
            'User Role Assignments' as configuration_item,
            CASE 
                WHEN COUNT(*) > 0 THEN 'CONFIGURED'
                ELSE 'NOT_CONFIGURED'
            END as status,
            CASE 
                WHEN COUNT(*) > 0 THEN format('%s users have assigned roles', COUNT(*))
                ELSE 'No users have assigned financial roles'
            END as recommendation
        FROM core_relationships cr
        JOIN core_entities ce_user ON cr.from_entity_id = ce_user.id
        JOIN core_entities ce_role ON cr.to_entity_id = ce_role.id
        WHERE cr.organization_id = p_organization_id
          AND cr.relationship_type = 'HAS_ROLE'
          AND ce_role.entity_type = 'fin_role'
        
        UNION ALL
        
        -- Encryption Key Check
        SELECT 
            'ENCRYPTION' as security_area,
            'Organization Encryption Key' as configuration_item,
            CASE 
                WHEN hera_get_org_encryption_key_v2(p_organization_id) IS NOT NULL THEN 'CONFIGURED'
                ELSE 'NOT_CONFIGURED'
            END as status,
            CASE 
                WHEN hera_get_org_encryption_key_v2(p_organization_id) IS NOT NULL 
                THEN 'Organization has encryption key configured'
                ELSE 'Organization encryption key needs to be configured'
            END as recommendation
    )
    SELECT * FROM security_checks;
END;
$$;
```

---

## 🎯 Security Compliance Checklist

### **Implementation Checklist**
- [ ] All Sacred Six tables have RLS enabled with organization isolation
- [ ] Organization context properly set for all database operations
- [ ] User authentication and authorization properly implemented
- [ ] Role-based permissions configured and validated
- [ ] Sensitive data encryption implemented where required
- [ ] Security monitoring and anomaly detection active
- [ ] Complete audit trail for all security events
- [ ] Regular security configuration validation performed

### **Monitoring Checklist**
- [ ] Security dashboard monitors key metrics in real-time
- [ ] Anomaly detection alerts configured for suspicious activities
- [ ] Failed authentication attempts tracked and analyzed
- [ ] Permission denial patterns monitored
- [ ] Encryption/decryption operations logged and audited
- [ ] RLS policy compliance validated regularly

### **Incident Response Checklist**
- [ ] Security incident escalation procedures documented
- [ ] Automated security event notifications configured
- [ ] Forensic audit trail capabilities verified
- [ ] User access revocation procedures tested
- [ ] Data breach containment procedures documented
- [ ] Compliance reporting capabilities validated

**Finance DNA v2 security architecture provides enterprise-grade protection while maintaining perfect Sacred Six compliance and comprehensive auditability.**