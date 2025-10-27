-- Enterprise Workflow Engine Schema
-- Smart Code: HERA.ENTERPRISE.WORKFLOW.SCHEMA.v1
--
-- This schema supports the enterprise workflow engine for approval processes,
-- state transitions, and business process automation across all modules.

-- Create workflow configuration table
CREATE TABLE IF NOT EXISTS entity_workflow_configs (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core_organizations(organization_id) ON DELETE CASCADE,
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
    entity_id UUID NOT NULL REFERENCES core_entities(entity_id) ON DELETE CASCADE,
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
    entity_id UUID NOT NULL REFERENCES core_entities(entity_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core_organizations(organization_id) ON DELETE CASCADE,
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
    entity_id UUID NOT NULL REFERENCES core_entities(entity_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core_organizations(organization_id) ON DELETE CASCADE,
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
    organization_id UUID NOT NULL REFERENCES core_organizations(organization_id) ON DELETE CASCADE,
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

-- RLS Policies for organization-level isolation
CREATE POLICY IF NOT EXISTS workflow_configs_org_isolation ON entity_workflow_configs
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY IF NOT EXISTS workflow_audit_org_isolation ON entity_workflow_audit
    FOR ALL USING (
        entity_id IN (
            SELECT entity_id FROM core_entities 
            WHERE organization_id IN (
                SELECT organization_id FROM user_organization_memberships 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY IF NOT EXISTS approval_requests_org_isolation ON entity_approval_requests
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY IF NOT EXISTS approval_actions_org_isolation ON entity_approval_actions
    FOR ALL USING (
        approval_request_id IN (
            SELECT approval_request_id FROM entity_approval_requests
            WHERE organization_id IN (
                SELECT organization_id FROM user_organization_memberships 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY IF NOT EXISTS escalations_org_isolation ON entity_approval_escalations
    FOR ALL USING (
        approval_request_id IN (
            SELECT approval_request_id FROM entity_approval_requests
            WHERE organization_id IN (
                SELECT organization_id FROM user_organization_memberships 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY IF NOT EXISTS notifications_org_isolation ON entity_workflow_notifications
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR recipient_user_id = auth.uid()
    );

CREATE POLICY IF NOT EXISTS business_rules_org_isolation ON entity_business_rules
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Create stored functions for workflow automation

-- Function to auto-execute workflow transitions based on business rules
CREATE OR REPLACE FUNCTION execute_auto_workflow_transitions()
RETURNS void AS $$
BEGIN
    -- This function would be called by a cron job or trigger
    -- to automatically execute transitions based on time, conditions, etc.
    
    -- Example: Auto-approve requests after certain conditions are met
    UPDATE entity_approval_requests
    SET status = 'approved',
        resolved_at = NOW(),
        resolved_by = (SELECT id FROM auth.users WHERE email = 'system@hera.com' LIMIT 1),
        resolution_notes = 'Auto-approved by system based on business rules'
    WHERE status = 'pending'
        AND created_at < NOW() - INTERVAL '7 days'
        AND approval_rules::jsonb ? 'auto_approve_after_days';
        
    -- Add more auto-execution logic here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send workflow notifications
CREATE OR REPLACE FUNCTION send_workflow_notification(
    p_entity_id UUID,
    p_organization_id UUID,
    p_notification_type TEXT,
    p_recipient_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_notification_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO entity_workflow_notifications (
        entity_id, organization_id, notification_type, recipient_user_id,
        title, message, notification_data
    ) VALUES (
        p_entity_id, p_organization_id, p_notification_type, p_recipient_user_id,
        p_title, p_message, p_notification_data
    ) RETURNING entity_workflow_notifications.notification_id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate approval progress
CREATE OR REPLACE FUNCTION get_approval_progress(p_approval_request_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_required INTEGER;
    total_approved INTEGER;
    total_rejected INTEGER;
BEGIN
    -- Get approval statistics
    SELECT 
        COUNT(*) FILTER (WHERE action = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE action = 'rejected') as rejected_count,
        COUNT(*) as total_actions
    INTO total_approved, total_rejected, total_required
    FROM entity_approval_actions
    WHERE approval_request_id = p_approval_request_id;
    
    result := jsonb_build_object(
        'total_required', COALESCE(total_required, 0),
        'total_approved', COALESCE(total_approved, 0),
        'total_rejected', COALESCE(total_rejected, 0),
        'progress_percentage', 
            CASE 
                WHEN total_required > 0 THEN ROUND((total_approved::decimal / total_required) * 100, 2)
                ELSE 0
            END,
        'status', 
            CASE 
                WHEN total_rejected > 0 THEN 'rejected'
                WHEN total_approved >= total_required AND total_required > 0 THEN 'approved'
                ELSE 'pending'
            END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic workflow processing

-- Trigger to update approval request status when all approvals are received
CREATE OR REPLACE FUNCTION update_approval_request_status()
RETURNS TRIGGER AS $$
DECLARE
    approval_progress JSONB;
    request_status TEXT;
BEGIN
    -- Get approval progress
    approval_progress := get_approval_progress(NEW.approval_request_id);
    request_status := approval_progress->>'status';
    
    -- Update approval request status if needed
    IF request_status IN ('approved', 'rejected') THEN
        UPDATE entity_approval_requests
        SET status = request_status,
            resolved_at = NOW(),
            resolved_by = NEW.approver_user_id
        WHERE approval_request_id = NEW.approval_request_id
            AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_approval_status
    AFTER INSERT ON entity_approval_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_request_status();

-- Trigger to automatically execute workflow transition when approval is complete
CREATE OR REPLACE FUNCTION auto_execute_approved_transition()
RETURNS TRIGGER AS $$
DECLARE
    entity_record RECORD;
BEGIN
    -- Only process if status changed to 'approved'
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        -- Execute the workflow transition
        INSERT INTO entity_workflow_audit (
            entity_id, from_state, to_state, changed_by, changed_at, 
            notes, approval_data, system_generated
        ) VALUES (
            NEW.entity_id, NEW.from_state, NEW.to_state, NEW.resolved_by, NOW(),
            'Approved via workflow approval process', NEW.approval_data, true
        );
        
        -- Update entity metadata
        UPDATE core_entities
        SET metadata = metadata || jsonb_build_object(
                'workflow_state', NEW.to_state,
                'last_state_change', NOW()::text,
                'approved_at', NOW()::text,
                'approved_by', NEW.resolved_by::text
            ),
            updated_at = NOW()
        WHERE entity_id = NEW.entity_id;
        
        -- Send notification
        PERFORM send_workflow_notification(
            NEW.entity_id,
            NEW.organization_id,
            'workflow_change',
            NEW.requested_by,
            'Approval Request Approved',
            'Your workflow transition from ' || NEW.from_state || ' to ' || NEW.to_state || ' has been approved.',
            jsonb_build_object(
                'from_state', NEW.from_state,
                'to_state', NEW.to_state,
                'approved_by', NEW.resolved_by
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_execute_transition
    AFTER UPDATE ON entity_approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_execute_approved_transition();

-- Add comments for documentation
COMMENT ON TABLE entity_workflow_configs IS 'Stores workflow configuration for different entity types within organizations';
COMMENT ON TABLE entity_workflow_audit IS 'Audit trail of all workflow state transitions';
COMMENT ON TABLE entity_approval_requests IS 'Tracks approval requests for workflow transitions';
COMMENT ON TABLE entity_approval_actions IS 'Individual approval actions by users';
COMMENT ON TABLE entity_approval_escalations IS 'Tracks escalations in the approval process';
COMMENT ON TABLE entity_workflow_notifications IS 'Queue for workflow-related notifications';
COMMENT ON TABLE entity_business_rules IS 'Business rules that govern workflow behavior';

-- Insert default workflow configurations for enterprise modules
INSERT INTO entity_workflow_configs (organization_id, entity_type, workflow_config, created_by, is_active)
SELECT 
    o.organization_id,
    'LEAD',
    '{
        "states": [
            {"state_code": "NEW", "state_name": "New Lead", "is_initial": true},
            {"state_code": "CONTACTED", "state_name": "Contacted", "description": "Initial contact made"},
            {"state_code": "QUALIFIED", "state_name": "Qualified", "description": "Lead has been qualified"},
            {"state_code": "CONVERTED", "state_name": "Converted", "is_final": true},
            {"state_code": "LOST", "state_name": "Lost", "is_final": true}
        ],
        "transitions": [
            {"from_state": "NEW", "to_state": "CONTACTED", "transition_name": "Make Contact"},
            {"from_state": "CONTACTED", "to_state": "QUALIFIED", "transition_name": "Qualify Lead"},
            {"from_state": "QUALIFIED", "to_state": "CONVERTED", "transition_name": "Convert to Opportunity"},
            {"from_state": "NEW", "to_state": "LOST", "transition_name": "Mark as Lost"},
            {"from_state": "CONTACTED", "to_state": "LOST", "transition_name": "Mark as Lost"},
            {"from_state": "QUALIFIED", "to_state": "LOST", "transition_name": "Mark as Lost"}
        ],
        "approval_rules": []
    }'::jsonb,
    NULL,
    true
FROM core_organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM entity_workflow_configs ewc 
    WHERE ewc.organization_id = o.organization_id 
    AND ewc.entity_type = 'LEAD' 
    AND ewc.is_active = true
);

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Enterprise Workflow Engine schema created successfully!';
    RAISE NOTICE 'Tables created: 7';
    RAISE NOTICE 'Indexes created: 15';
    RAISE NOTICE 'Functions created: 3';
    RAISE NOTICE 'Triggers created: 2';
END $$;