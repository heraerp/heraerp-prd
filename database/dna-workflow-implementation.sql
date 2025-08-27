-- ================================================================================
-- HERA DNA WORKFLOW SYSTEM IMPLEMENTATION
-- ================================================================================
-- Adds Universal Workflow DNA to the HERA DNA Component Library
-- Smart Code: HERA.DNA.WORKFLOW.SYSTEM.IMPLEMENTATION.v1
-- ================================================================================

-- ================================================================================
-- STEP 1: ADD WORKFLOW DNA COMPONENTS
-- ================================================================================

DO $$
DECLARE
  dna_org_id UUID;
  
  -- Component IDs for workflow system
  workflow_engine_id UUID;
  workflow_tracker_id UUID;
  workflow_analytics_id UUID;
  workflow_templates_id UUID;
  
BEGIN
  -- Get DNA organization ID
  SELECT id INTO dna_org_id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS';
  
  IF dna_org_id IS NULL THEN
    RAISE EXCEPTION 'DNA System Organization not found. Run dna-system-implementation.sql first.';
  END IF;
  
  -- ================================================================================
  -- 1. WORKFLOW ENGINE DNA
  -- ================================================================================
  
  INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_description,
    smart_code,
    metadata,
    ai_insights,
    status
  ) VALUES (
    dna_org_id,
    'dna_component',
    'Universal Workflow Engine',
    'DNA-WORKFLOW-ENGINE',
    'Complete workflow management engine using only relationships table for status tracking',
    'HERA.DNA.WORKFLOW.ENGINE.v1',
    '{
      "component_type": "business_module",
      "category": "workflow_management",
      "implementation": {
        "file_path": "/src/lib/universal-workflow.ts",
        "class_name": "UniversalWorkflow",
        "methods": [
          "createWorkflowTemplate",
          "assignWorkflow",
          "transitionStatus",
          "getCurrentStatus",
          "getWorkflowHistory",
          "getAvailableTransitions"
        ]
      },
      "features": [
        "Status tracking via relationships",
        "Workflow templates",
        "Automatic transitions",
        "Approval workflows",
        "Complete audit trail",
        "Multi-tenant support"
      ],
      "dependencies": ["universal-api"]
    }',
    '{
      "innovation": "Zero schema changes - uses existing 6-table architecture",
      "reusability": "Works with any transaction type",
      "scalability": "Handles unlimited workflows and statuses"
    }',
    'active'
  ) RETURNING id INTO workflow_engine_id;
  
  -- ================================================================================
  -- 2. WORKFLOW TRACKER UI DNA
  -- ================================================================================
  
  INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_description,
    smart_code,
    metadata,
    ai_insights,
    status
  ) VALUES (
    dna_org_id,
    'dna_component',
    'Universal Workflow Tracker UI',
    'DNA-WORKFLOW-TRACKER',
    'React component for displaying and managing workflow status with full UI',
    'HERA.DNA.WORKFLOW.TRACKER.UI.v1',
    '{
      "component_type": "ui_component",
      "category": "workflow_management",
      "implementation": {
        "file_path": "/src/components/workflow/UniversalWorkflowTracker.tsx",
        "component_name": "UniversalWorkflowTracker",
        "props": {
          "transactionId": "string",
          "organizationId": "string",
          "userId": "string",
          "onStatusChange": "function",
          "compact": "boolean"
        }
      },
      "features": [
        "Status display with color coding",
        "Transition dropdown menu",
        "History timeline",
        "Compact and full views",
        "Transition dialog with reason",
        "Loading states"
      ],
      "ui_patterns": ["shadcn/ui", "lucide-icons"],
      "dependencies": ["UniversalWorkflow", "shadcn-components"]
    }',
    '{
      "user_experience": "Intuitive workflow visualization",
      "flexibility": "Works in tables or detail views",
      "accessibility": "WCAG compliant status indicators"
    }',
    'active'
  ) RETURNING id INTO workflow_tracker_id;
  
  -- ================================================================================
  -- 3. WORKFLOW ANALYTICS DNA
  -- ================================================================================
  
  INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_description,
    smart_code,
    metadata,
    ai_insights,
    status
  ) VALUES (
    dna_org_id,
    'dna_component',
    'Workflow Analytics Engine',
    'DNA-WORKFLOW-ANALYTICS',
    'Analytics engine for workflow performance and bottleneck detection',
    'HERA.DNA.WORKFLOW.ANALYTICS.v1',
    '{
      "component_type": "analytics_module",
      "category": "workflow_management",
      "implementation": {
        "patterns": [
          "Status distribution analysis",
          "Average time in status",
          "Bottleneck identification",
          "Success rate tracking",
          "Abandonment analysis"
        ],
        "queries": {
          "status_count": "SELECT COUNT(*) FROM core_relationships WHERE to_entity_id = ? AND relationship_type = ''has_workflow_status''",
          "avg_duration": "Calculate time between created_at and relationship_data->ended_at",
          "conversion_rate": "Final status count / Total started"
        }
      },
      "metrics": [
        "Workflow completion time",
        "Status transition velocity",
        "Approval bottlenecks",
        "Process efficiency"
      ]
    }',
    '{
      "business_value": "Identify process improvements",
      "real_time": "Live metrics without batch processing",
      "actionable": "Direct insights for optimization"
    }',
    'active'
  ) RETURNING id INTO workflow_analytics_id;
  
  -- ================================================================================
  -- 4. WORKFLOW TEMPLATE LIBRARY DNA
  -- ================================================================================
  
  INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_description,
    smart_code,
    metadata,
    ai_insights,
    status
  ) VALUES (
    dna_org_id,
    'dna_component',
    'Workflow Template Library',
    'DNA-WORKFLOW-TEMPLATES',
    'Pre-built workflow templates for common business processes',
    'HERA.DNA.WORKFLOW.TEMPLATES.v1',
    '{
      "component_type": "configuration_library",
      "category": "workflow_management",
      "templates": {
        "SALES_ORDER": {
          "stages": ["Draft", "Submitted", "Approved", "Processing", "Shipped", "Delivered", "Cancelled"],
          "auto_transitions": ["Approved->Processing"],
          "approval_required": ["Submitted->Approved"]
        },
        "APPOINTMENT": {
          "stages": ["Scheduled", "Confirmed", "Reminded", "Checked In", "In Service", "Completed", "Paid", "Cancelled", "No Show"],
          "auto_transitions": ["Confirmed->Reminded"],
          "time_based": true
        },
        "INVOICE": {
          "stages": ["Draft", "Sent", "Viewed", "Partially Paid", "Paid", "Overdue", "Void"],
          "auto_transitions": ["Sent->Viewed"],
          "overdue_rules": true
        },
        "PURCHASE_ORDER": {
          "stages": ["Draft", "Submitted", "Approved", "Ordered", "Received", "Completed", "Cancelled"],
          "approval_required": ["Submitted->Approved"],
          "goods_receipt": true
        }
      },
      "extensibility": "Add custom templates for any industry"
    }',
    '{
      "coverage": "Handles 80%+ of business workflows",
      "customizable": "Easy to modify for specific needs",
      "best_practices": "Based on industry standards"
    }',
    'active'
  ) RETURNING id INTO workflow_templates_id;
  
  -- ================================================================================
  -- STEP 2: ADD WORKFLOW DYNAMIC DATA (DNA SPECIFICATIONS)
  -- ================================================================================
  
  -- Workflow Engine specifications
  INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    smart_code,
    field_order
  ) VALUES
  (dna_org_id, workflow_engine_id, 'implementation_code', 'code', 
  'import { universalApi } from ''@/lib/universal-api''

export class UniversalWorkflow {
  private organizationId: string
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
  }
  
  async createWorkflowTemplate(config: WorkflowTemplate) {
    const workflow = await universalApi.createEntity({
      entity_type: ''workflow_template'',
      entity_name: config.name,
      entity_code: config.code,
      smart_code: `HERA.WORKFLOW.TEMPLATE.${config.code}.v1`,
      organization_id: this.organizationId,
      metadata: config
    })
    
    // Create statuses and transitions
    for (const stage of config.stages) {
      await this.createWorkflowStatus(workflow.id, stage)
    }
    
    return workflow
  }
  
  async assignWorkflow(transactionId: string, workflowTemplateId: string) {
    const initialStatus = await this.getInitialStatus(workflowTemplateId)
    
    await universalApi.createRelationship({
      from_entity_id: transactionId,
      to_entity_id: initialStatus.id,
      relationship_type: ''has_workflow_status'',
      relationship_data: {
        workflow_template_id: workflowTemplateId,
        started_at: new Date().toISOString(),
        is_active: true
      }
    })
    
    return initialStatus
  }
}',
  'HERA.DNA.WORKFLOW.ENGINE.CODE.v1', 1),
  
  -- Workflow Tracker UI code
  (dna_org_id, workflow_tracker_id, 'component_code', 'code',
  'export function UniversalWorkflowTracker({ 
  transactionId, 
  organizationId,
  userId,
  onStatusChange,
  compact = false
}: WorkflowTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState(null)
  const [availableTransitions, setAvailableTransitions] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  
  const workflow = new UniversalWorkflow(organizationId)
  
  const handleTransition = async (newStatusId: string) => {
    await workflow.transitionStatus(transactionId, newStatusId, {
      userId,
      reason: transitionReason
    })
    
    await loadWorkflowData()
    onStatusChange?.(newStatusId)
  }
  
  if (compact) {
    return (
      <Badge style={{ backgroundColor: currentStatus?.metadata?.color }}>
        {currentStatus?.entity_name}
      </Badge>
    )
  }
  
  return (
    <Card>
      <CardContent>
        <WorkflowStatus current={currentStatus} />
        <WorkflowTransitions 
          transitions={availableTransitions}
          onTransition={handleTransition}
        />
        <WorkflowHistory history={history} />
      </CardContent>
    </Card>
  )
}',
  'HERA.DNA.WORKFLOW.TRACKER.CODE.v1', 1),
  
  -- Workflow integration patterns
  (dna_org_id, workflow_engine_id, 'integration_pattern', 'text',
  '// Auto-assign workflow on transaction creation
universalApi.on(''transaction:created'', async (transaction) => {
  const workflowTemplate = await getWorkflowForType(transaction.transaction_type)
  if (workflowTemplate) {
    await workflow.assignWorkflow(transaction.id, workflowTemplate.id)
  }
})

// Add to any transaction view
<UniversalWorkflowTracker
  transactionId={transaction.id}
  organizationId={organizationId}
  userId={userId}
/>',
  'HERA.DNA.WORKFLOW.INTEGRATION.v1', 2);
  
  -- ================================================================================
  -- STEP 3: CREATE WORKFLOW RELATIONSHIPS IN DNA
  -- ================================================================================
  
  -- Link workflow components together
  INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    relationship_data
  ) VALUES
  -- Engine uses Templates
  (dna_org_id, workflow_engine_id, workflow_templates_id, 'uses', 
   'HERA.DNA.WORKFLOW.ENGINE.USES.TEMPLATES.v1',
   '{"dependency_type": "configuration", "required": true}'),
  
  -- Tracker uses Engine
  (dna_org_id, workflow_tracker_id, workflow_engine_id, 'uses',
   'HERA.DNA.WORKFLOW.TRACKER.USES.ENGINE.v1',
   '{"dependency_type": "core", "required": true}'),
  
  -- Analytics uses Engine
  (dna_org_id, workflow_analytics_id, workflow_engine_id, 'uses',
   'HERA.DNA.WORKFLOW.ANALYTICS.USES.ENGINE.v1',
   '{"dependency_type": "data_source", "required": true}');
  
  RAISE NOTICE 'Universal Workflow DNA components created successfully!';
  
END $$;

-- ================================================================================
-- STEP 4: CREATE USAGE EXAMPLES
-- ================================================================================

INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  entity_description,
  smart_code,
  metadata,
  status
) VALUES
(
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'dna_example',
  'Salon Appointment Workflow Integration',
  'EXAMPLE-SALON-WORKFLOW',
  'Complete example of workflow integration in salon appointment system',
  'HERA.DNA.EXAMPLE.SALON.WORKFLOW.v1',
  '{
    "example_type": "implementation",
    "industry": "salon",
    "files": [
      "/src/app/salon/appointments/AppointmentWorkflow.tsx",
      "/mcp-server/setup-salon-workflow.js",
      "/mcp-server/demo-appointment-workflow.js"
    ],
    "features_demonstrated": [
      "Automatic workflow assignment",
      "Status transitions",
      "Customer journey tracking",
      "UI integration"
    ],
    "code_snippet": "// In appointment creation\nconst appointment = await createAppointment(data)\nconst workflow = new UniversalWorkflow(orgId)\nawait workflow.assignWorkflow(appointment.id, workflowTemplateId)\n\n// In appointment view\n<UniversalWorkflowTracker\n  transactionId={appointment.id}\n  organizationId={organizationId}\n  userId={userId}\n/>"
  }',
  'active'
);

-- ================================================================================
-- VERIFICATION QUERY
-- ================================================================================

-- Check that workflow DNA was created
SELECT 
  entity_name,
  entity_code,
  smart_code,
  metadata->>'component_type' as component_type
FROM core_entities
WHERE organization_id = (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS')
  AND entity_code LIKE 'DNA-WORKFLOW-%'
ORDER BY created_at DESC;