-- HERA Security Framework Migration
-- Implements mixed RLS policies, audit logging, and security functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- AUDIT LOGGING TABLES
-- =============================================

-- Audit log table
CREATE TABLE IF NOT EXISTS hera_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'context_set', 
        'rls_bypass_attempt', 
        'service_role_access', 
        'cross_org_attempt',
        'auth_failure',
        'permission_denied',
        'data_access',
        'data_modification'
    )),
    organization_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    issuer TEXT,
    auth_mode TEXT NOT NULL CHECK (auth_mode IN ('supabase', 'external', 'service')),
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    endpoint TEXT,
    method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_org_time ON hera_audit_log(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON hera_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON hera_audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_auth_mode ON hera_audit_log(auth_mode);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    organization_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_org ON rate_limits(organization_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- User organizations table for membership management
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'user', 'readonly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_status ON user_organizations(status);

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to execute arbitrary SQL (for GUC management)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Function to get current setting safely
CREATE OR REPLACE FUNCTION get_current_setting(setting_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN current_setting(setting_name, true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- Function to clear RLS bypass (auto-reset)
CREATE OR REPLACE FUNCTION clear_bypass_rls()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('app.bypass_rls', NULL, true);
END;
$$;

-- Function to get org context from JWT or GUC
CREATE OR REPLACE FUNCTION get_org_context()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    -- Try GUC first (highest priority)
    DECLARE
        guc_org_id TEXT := current_setting('app.org_id', true);
    BEGIN
        IF guc_org_id IS NOT NULL AND guc_org_id != '' THEN
            RETURN guc_org_id::UUID;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL; -- Continue to JWT check
    END;
    
    -- Fallback to JWT claims
    DECLARE
        jwt_org_id TEXT := auth.jwt() ->> 'organization_id';
    BEGIN
        IF jwt_org_id IS NOT NULL THEN
            RETURN jwt_org_id::UUID;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    RETURN NULL;
END;
$$;

-- Function to check if RLS bypass is active
CREATE OR REPLACE FUNCTION is_rls_bypassed()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN current_setting('app.bypass_rls', true) = 'true';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- =============================================
-- MIXED RLS POLICIES
-- =============================================

-- Enable RLS on all core tables
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS org_scope_mixed ON core_organizations;
DROP POLICY IF EXISTS org_scope_mixed ON core_entities;
DROP POLICY IF EXISTS org_scope_mixed ON core_dynamic_data;
DROP POLICY IF EXISTS org_scope_mixed ON core_relationships;
DROP POLICY IF EXISTS org_scope_mixed ON universal_transactions;
DROP POLICY IF EXISTS org_scope_mixed ON universal_transaction_lines;

-- Service role policies (with org scope enforcement)
DROP POLICY IF EXISTS service_role_guard ON core_organizations;
DROP POLICY IF EXISTS service_role_guard ON core_entities;
DROP POLICY IF EXISTS service_role_guard ON core_dynamic_data;
DROP POLICY IF EXISTS service_role_guard ON core_relationships;
DROP POLICY IF EXISTS service_role_guard ON universal_transactions;
DROP POLICY IF EXISTS service_role_guard ON universal_transaction_lines;

-- Mixed RLS policies for core_organizations
CREATE POLICY org_scope_mixed ON core_organizations
    FOR ALL
    USING (
        id = get_org_context()
        OR is_rls_bypassed()
    );

-- Mixed RLS policies for core_entities
CREATE POLICY org_scope_mixed ON core_entities
    FOR ALL
    USING (
        organization_id = get_org_context()
        OR is_rls_bypassed()
    );

-- Mixed RLS policies for core_dynamic_data
CREATE POLICY org_scope_mixed ON core_dynamic_data
    FOR ALL
    USING (
        organization_id = get_org_context()
        OR is_rls_bypassed()
    );

-- Mixed RLS policies for core_relationships
CREATE POLICY org_scope_mixed ON core_relationships
    FOR ALL
    USING (
        organization_id = get_org_context()
        OR is_rls_bypassed()
    );

-- Mixed RLS policies for universal_transactions
CREATE POLICY org_scope_mixed ON universal_transactions
    FOR ALL
    USING (
        organization_id = get_org_context()
        OR is_rls_bypassed()
    );

-- Mixed RLS policies for universal_transaction_lines
CREATE POLICY org_scope_mixed ON universal_transaction_lines
    FOR ALL
    USING (
        organization_id = get_org_context()
        OR is_rls_bypassed()
    );

-- Service role specific policies (always org-scoped unless explicitly bypassed)
CREATE POLICY service_role_guard ON core_organizations
    FOR ALL
    TO service_role
    USING (
        id = COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY service_role_guard ON core_entities
    FOR ALL
    TO service_role
    USING (
        organization_id = COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY service_role_guard ON core_dynamic_data
    FOR ALL
    TO service_role
    USING (
        organization_id = COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY service_role_guard ON core_relationships
    FOR ALL
    TO service_role
    USING (
        organization_id = COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY service_role_guard ON universal_transactions
    FOR ALL
    TO service_role
    USING (
        organization_id = COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY service_role_guard ON universal_transaction_lines
    FOR ALL
    TO service_role
    USING (
        organization_id = COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =============================================
-- AUDIT TRIGGERS
-- =============================================

-- Function to log data access
CREATE OR REPLACE FUNCTION audit_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log data access for sensitive tables
    INSERT INTO hera_audit_log (
        event_type,
        organization_id,
        user_id,
        role,
        auth_mode,
        details,
        timestamp
    ) VALUES (
        'data_access',
        COALESCE(
            nullif(current_setting('app.org_id', true), '')::uuid,
            (auth.jwt() ->> 'organization_id')::uuid
        ),
        COALESCE(
            current_setting('app.user_id', true),
            auth.uid()::text
        ),
        COALESCE(
            current_setting('app.role', true),
            'unknown'
        ),
        COALESCE(
            current_setting('app.auth_mode', true),
            'unknown'
        ),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'record_id', CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.id::text
                ELSE NEW.id::text
            END
        ),
        NOW()
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the operation if audit logging fails
        RETURN CASE 
            WHEN TG_OP = 'DELETE' THEN OLD
            ELSE NEW
        END;
END;
$$;

-- Create audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_entities ON core_entities;
CREATE TRIGGER audit_entities
    AFTER INSERT OR UPDATE OR DELETE ON core_entities
    FOR EACH ROW EXECUTE FUNCTION audit_data_access();

DROP TRIGGER IF EXISTS audit_transactions ON universal_transactions;
CREATE TRIGGER audit_transactions
    AFTER INSERT OR UPDATE OR DELETE ON universal_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_data_access();

-- =============================================
-- SECURITY VIEWS
-- =============================================

-- View for monitoring RLS policy effectiveness
CREATE OR REPLACE VIEW security_monitoring AS
SELECT 
    al.event_type,
    al.organization_id,
    al.auth_mode,
    COUNT(*) as event_count,
    MAX(al.timestamp) as last_occurrence,
    array_agg(DISTINCT al.role) as roles_involved
FROM hera_audit_log al
WHERE al.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY al.event_type, al.organization_id, al.auth_mode
ORDER BY event_count DESC;

-- View for rate limiting monitoring
CREATE OR REPLACE VIEW rate_limit_monitoring AS
SELECT 
    rl.organization_id,
    rl.action,
    COUNT(*) as request_count,
    AVG(rl.count) as avg_requests_per_window,
    MAX(rl.count) as max_requests_per_window,
    MAX(rl.updated_at) as last_activity
FROM rate_limits rl
WHERE rl.window_start >= NOW() - INTERVAL '1 hour'
GROUP BY rl.organization_id, rl.action
ORDER BY request_count DESC;

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON hera_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rate_limits TO authenticated;
GRANT SELECT ON user_organizations TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant monitoring view access
GRANT SELECT ON security_monitoring TO authenticated;
GRANT SELECT ON rate_limit_monitoring TO authenticated;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default rate limit entries (optional)
INSERT INTO rate_limits (key, count, window_start, organization_id, user_id, action)
VALUES ('init', 0, NOW(), '00000000-0000-0000-0000-000000000000', 'system', 'init')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE hera_audit_log IS 'Comprehensive audit log for all security events';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking per org/user/action';
COMMENT ON TABLE user_organizations IS 'User membership in organizations with roles';

COMMENT ON FUNCTION get_org_context() IS 'Get organization context from GUC or JWT';
COMMENT ON FUNCTION is_rls_bypassed() IS 'Check if RLS bypass is currently active';
COMMENT ON FUNCTION clear_bypass_rls() IS 'Clear RLS bypass setting (auto-reset function)';