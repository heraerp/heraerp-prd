-- Enterprise Workflow Engine Schema
-- Smart Code: HERA.ENTERPRISE.WORKFLOW.SCHEMA.v1
--
-- This schema supports the enterprise workflow engine for approval processes,
-- state transitions, and business process automation across all modules.

-- Create workflow configuration table
CREATE TABLE IF NOT EXISTS entity_workflow_configs (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    workflow_config JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_active_workflow_per_entity_type 
        EXCLUDE (organization_id WITH =, entity_type WITH =) 
        WHERE (is_active = true),
    
    -- Indexes
    CONSTRAINT valid_workflow_config CHECK (
        workflow_config ? 'states' AND 
        workflow_config ? 'transitions' AND
        jsonb_array_length(workflow_config->'states') > 0 AND
        jsonb_array_length(workflow_config->'transitions') > 0
    )
);

-- Create workflow audit trail table
CREATE TABLE IF NOT EXISTS entity_workflow_audit (
    workflow_audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES core_entities(id) ON DELETE CASCADE,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    approval_data JSONB DEFAULT '{}',
    system_generated BOOLEAN DEFAULT false,
    transition_metadata JSONB DEFAULT '{}',
    
    -- Indexes for performance
    CONSTRAINT valid_state_transition CHECK (from_state != to_state OR from_state = 'SYSTEM')
);

-- Create approval requests table
CREATE TABLE IF NOT EXISTS entity_approval_requests (
    approval_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES core_entities(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    approval_rules JSONB NOT NULL,
    notes TEXT,
    approval_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT
);

-- Create individual approvals table (for multi-level approvals)
CREATE TABLE IF NOT EXISTS entity_approval_actions (
    approval_action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID NOT NULL REFERENCES entity_approval_requests(approval_request_id) ON DELETE CASCADE,
    approver_user_id UUID NOT NULL REFERENCES auth.users(id),
    approval_level INTEGER NOT NULL DEFAULT 1,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'delegated', 'escalated')),
    notes TEXT,
    approval_data JSONB DEFAULT '{}',
    delegated_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one action per approver per request per level
    UNIQUE(approval_request_id, approver_user_id, approval_level)
);

-- Create escalation tracking table
CREATE TABLE IF NOT EXISTS entity_approval_escalations (
    escalation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID NOT NULL REFERENCES entity_approval_requests(approval_request_id) ON DELETE CASCADE,
    escalated_from UUID NOT NULL REFERENCES auth.users(id),
    escalated_to UUID NOT NULL REFERENCES auth.users(id),
    escalation_reason TEXT NOT NULL,
    escalated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_action TEXT CHECK (resolution_action IN ('approved', 'rejected', 'further_escalated', 'returned'))
);

-- Create notification queue table
CREATE TABLE IF NOT EXISTS entity_workflow_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES core_entities(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('workflow_change', 'approval_request', 'approval_action', 'escalation', 'reminder')),
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_data JSONB DEFAULT '{}',
    channels TEXT[] DEFAULT ARRAY['email'], -- email, sms, slack, teams, in_app
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT
);

-- Create business rules enforcement table
CREATE TABLE IF NOT EXISTS entity_business_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    rule_logic JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique rule name per entity type per organization
    UNIQUE(organization_id, entity_type, rule_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_configs_org_type ON entity_workflow_configs(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_configs_active ON entity_workflow_configs(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_workflow_audit_entity ON entity_workflow_audit(entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_audit_changed_at ON entity_workflow_audit(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_audit_changed_by ON entity_workflow_audit(changed_by);

CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON entity_approval_requests(entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_org ON entity_approval_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON entity_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON entity_approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_due_date ON entity_approval_requests(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON entity_approval_actions(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_approver ON entity_approval_actions(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_level ON entity_approval_actions(approval_level);

CREATE INDEX IF NOT EXISTS idx_escalations_request ON entity_approval_escalations(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_escalations_escalated_to ON entity_approval_escalations(escalated_to);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON entity_workflow_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON entity_workflow_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON entity_workflow_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON entity_workflow_notifications(entity_id);

CREATE INDEX IF NOT EXISTS idx_business_rules_org_type ON entity_business_rules(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON entity_business_rules(is_active) WHERE is_active = true;

-- Create Row Level Security (RLS) policies
ALTER TABLE entity_workflow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_workflow_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_approval_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_workflow_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_business_rules ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Enterprise Workflow Engine schema created successfully!';
    RAISE NOTICE 'Tables created: 7';
    RAISE NOTICE 'Indexes created: 15';
END $$;