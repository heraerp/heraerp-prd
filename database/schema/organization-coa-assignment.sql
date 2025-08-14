-- Organization COA Template Assignment System
-- This extends the HERA 6-table architecture for template assignment

-- Organization COA Configuration Table
-- Stores which templates are assigned to each organization
CREATE TABLE IF NOT EXISTS organization_coa_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Template Layer Configuration
    base_template VARCHAR(50) DEFAULT 'universal_base', -- Always universal_base
    country_template VARCHAR(50), -- india, usa, uk, etc.
    industry_template VARCHAR(50), -- restaurant, healthcare, manufacturing, etc.
    
    -- Assignment Metadata
    assigned_by UUID, -- User who assigned the template
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_date DATE DEFAULT CURRENT_DATE,
    
    -- Status and Control
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
    is_locked BOOLEAN DEFAULT FALSE, -- Prevents changes once finalized
    
    -- Customization Flags
    allow_custom_accounts BOOLEAN DEFAULT TRUE,
    auto_sync_updates BOOLEAN DEFAULT TRUE, -- Auto-update when templates change
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES core_organizations(id),
    CONSTRAINT unique_org_coa UNIQUE (organization_id)
);

-- Organization COA Assignment History
-- Tracks all template assignment changes for audit purposes
CREATE TABLE IF NOT EXISTS organization_coa_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Change Details
    change_type VARCHAR(20) NOT NULL, -- assigned, modified, reverted
    previous_config JSONB, -- Previous template configuration
    new_config JSONB, -- New template configuration
    
    -- Change Metadata
    changed_by UUID NOT NULL,
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Impact Analysis
    accounts_affected INTEGER DEFAULT 0,
    custom_accounts_preserved BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_org_history FOREIGN KEY (organization_id) REFERENCES core_organizations(id)
);

-- Template Assignment Rules
-- Defines business rules for template assignment
CREATE TABLE IF NOT EXISTS coa_assignment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Definition
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50) NOT NULL, -- country_mandatory, industry_recommended, etc.
    
    -- Rule Logic
    condition_json JSONB NOT NULL, -- JSON conditions for rule application
    action_json JSONB NOT NULL, -- JSON actions when rule matches
    
    -- Rule Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100, -- Lower number = higher priority
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Insert Default Assignment Rules
INSERT INTO coa_assignment_rules (rule_name, rule_type, condition_json, action_json, description) VALUES
('Country Template Mandatory', 'country_mandatory', 
 '{"organization.country": {"required": true}}',
 '{"require_country_template": true, "block_assignment_without_country": true}',
 'Organizations must have a country-specific template assigned'),

('Industry Template Recommended', 'industry_recommended',
 '{"organization.industry": {"exists": true}}',
 '{"suggest_industry_template": true, "show_industry_benefits": true}',
 'Recommend industry template when organization industry is known'),

('Lock After Go-Live', 'governance',
 '{"organization.status": "live", "coa_config.has_transactions": true}',
 '{"lock_template_changes": true, "require_approval": true}',
 'Lock COA template changes after organization goes live with transactions');

-- Function to assign COA template to organization
CREATE OR REPLACE FUNCTION assign_coa_template(
    p_organization_id UUID,
    p_country_template VARCHAR(50) DEFAULT NULL,
    p_industry_template VARCHAR(50) DEFAULT NULL,
    p_assigned_by UUID DEFAULT NULL,
    p_allow_custom_accounts BOOLEAN DEFAULT TRUE
) RETURNS JSON AS $$
DECLARE
    v_config_id UUID;
    v_previous_config JSONB;
    v_result JSON;
BEGIN
    -- Get existing configuration if any
    SELECT row_to_json(c.*) INTO v_previous_config
    FROM organization_coa_config c
    WHERE c.organization_id = p_organization_id;
    
    -- Insert or update COA configuration
    INSERT INTO organization_coa_config (
        organization_id,
        country_template,
        industry_template,
        assigned_by,
        allow_custom_accounts
    ) VALUES (
        p_organization_id,
        p_country_template,
        p_industry_template,
        p_assigned_by,
        p_allow_custom_accounts
    )
    ON CONFLICT (organization_id) DO UPDATE SET
        country_template = EXCLUDED.country_template,
        industry_template = EXCLUDED.industry_template,
        assigned_by = EXCLUDED.assigned_by,
        allow_custom_accounts = EXCLUDED.allow_custom_accounts,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_config_id;
    
    -- Record change in history
    INSERT INTO organization_coa_history (
        organization_id,
        change_type,
        previous_config,
        new_config,
        changed_by,
        change_reason
    ) VALUES (
        p_organization_id,
        CASE WHEN v_previous_config IS NULL THEN 'assigned' ELSE 'modified' END,
        v_previous_config,
        (SELECT row_to_json(c.*) FROM organization_coa_config c WHERE c.id = v_config_id),
        p_assigned_by,
        'Template assignment via assign_coa_template function'
    );
    
    -- Build the COA for this organization
    SELECT build_customized_coa(
        p_organization_id::TEXT,
        p_country_template,
        p_industry_template
    ) INTO v_result;
    
    RETURN json_build_object(
        'success', true,
        'configuration_id', v_config_id,
        'message', 'COA template assigned successfully',
        'coa_structure', v_result
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to assign COA template'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get organization's current COA assignment
CREATE OR REPLACE FUNCTION get_organization_coa_assignment(
    p_organization_id UUID
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'organization_id', c.organization_id,
        'base_template', c.base_template,
        'country_template', c.country_template,
        'industry_template', c.industry_template,
        'status', c.status,
        'is_locked', c.is_locked,
        'allow_custom_accounts', c.allow_custom_accounts,
        'assigned_at', c.assigned_at,
        'effective_date', c.effective_date,
        'template_layers', json_build_array(
            json_build_object('layer', 'base', 'template', c.base_template),
            CASE WHEN c.country_template IS NOT NULL THEN 
                json_build_object('layer', 'country', 'template', c.country_template)
            END,
            CASE WHEN c.industry_template IS NOT NULL THEN 
                json_build_object('layer', 'industry', 'template', c.industry_template)
            END
        )
    ) INTO v_result
    FROM organization_coa_config c
    WHERE c.organization_id = p_organization_id;
    
    IF v_result IS NULL THEN
        RETURN json_build_object(
            'organization_id', p_organization_id,
            'status', 'no_assignment',
            'message', 'No COA template assigned to this organization'
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_coa_config_organization ON organization_coa_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_coa_config_status ON organization_coa_config(status);
CREATE INDEX IF NOT EXISTS idx_org_coa_config_templates ON organization_coa_config(country_template, industry_template);
CREATE INDEX IF NOT EXISTS idx_org_coa_history_organization ON organization_coa_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_coa_history_changed_at ON organization_coa_history(changed_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON organization_coa_config TO authenticated;
GRANT SELECT ON organization_coa_history TO authenticated;
GRANT EXECUTE ON FUNCTION assign_coa_template TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_coa_assignment TO authenticated;