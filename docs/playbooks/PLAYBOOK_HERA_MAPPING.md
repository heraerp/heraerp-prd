# Playbook Domain → HERA Universal Architecture Mapping

## 1. Core Object Mappings

### 1.1 Playbook Definition → `core_entities`

Each playbook definition is stored as a row in `core_entities`:

```typescript
{
  entity_type: 'playbook_definition',
  entity_name: 'Customer Onboarding Playbook',
  entity_code: 'PLAYBOOK-CUSTOMER-ONBOARDING',
  smart_code: 'HERA.GENERAL.PLAYBOOK.DEF.CUSTOMER_ONBOARDING.V1',
  organization_id: 'org_uuid',
  metadata: {
    status: 'published', // draft | published | archived
    version: 1,
    owner: 'user_entity_id',
    description: 'Complete customer onboarding workflow',
    tags: ['onboarding', 'customer', 'critical'],
    created_at: '2024-01-01T00:00:00Z',
    published_at: '2024-01-15T00:00:00Z'
  }
}
```

**Extended properties in `core_dynamic_data`:**
- `input_schema`: JSON schema for playbook inputs
- `output_schema`: JSON schema for expected outputs
- `policies`: Business rules and constraints
- `sla_hours`: Overall SLA for playbook completion
- `permissions_required`: List of permissions needed to execute
- `ai_enabled`: Whether AI workers can be assigned
- `retry_policy`: Global retry configuration
- `cost_estimate`: Estimated cost per execution

### 1.2 Playbook Step Definition → `core_entities`

Each step within a playbook is also stored in `core_entities`:

```typescript
{
  entity_type: 'playbook_step_definition',
  entity_name: 'Verify Customer Identity',
  entity_code: 'STEP-VERIFY-IDENTITY',
  smart_code: 'HERA.GENERAL.PLAYBOOK.STEP.DEF.CUSTOMER_ONBOARDING.VERIFY_IDENTITY.V1',
  organization_id: 'org_uuid',
  metadata: {
    playbook_id: 'playbook_entity_id',
    sequence: 1,
    description: 'Verify customer identity documents',
    critical: true,
    parallel_allowed: false
  }
}
```

**Extended properties in `core_dynamic_data`:**
- `worker_type`: 'human' | 'ai' | 'system' | 'external'
- `service_endpoint`: URL for system/external workers
- `input_contract`: JSON schema for step inputs
- `output_contract`: JSON schema for step outputs
- `retry_policy`: Step-specific retry configuration
- `sla_seconds`: Time limit for step completion
- `permissions_required`: Step-specific permissions
- `idempotency_key_rule`: Rule for generating idempotency keys
- `cost_per_execution`: Estimated cost per step run
- `ai_model_preference`: Preferred AI model for AI workers
- `human_skills_required`: Skills needed for human workers

### 1.3 Playbook Versioning → `core_relationships`

Version relationships are tracked in `core_relationships`:

```typescript
{
  relationship_type: 'playbook_version',
  from_entity_id: 'canonical_playbook_id',
  to_entity_id: 'version_2_playbook_id',
  smart_code: 'HERA.PLAYBOOK.REL.VERSION.V1',
  metadata: {
    version_number: 2,
    change_reason: 'Added compliance check step',
    backwards_compatible: true
  }
}
```

## 1.2 Relationships (WHY)

Use `core_relationships` with smart codes for all playbook relationships:

### Playbook Target Relationships
```typescript
{
  relationship_type: 'playbook_target',
  from_entity_id: 'playbook_def_id',
  to_entity_id: 'target_entity_type_id', // e.g., entity representing "Grant Application" type
  smart_code: 'HERA.PLAYBOOK.TARGET.V1',
  metadata: {
    target_entity_type: 'grant_application',
    required_fields: ['applicant_name', 'grant_amount', 'project_description']
  }
}
```

### Playbook Has Step Relationships
```typescript
{
  relationship_type: 'playbook_has_step',
  from_entity_id: 'playbook_def_id',
  to_entity_id: 'step_def_id',
  smart_code: 'HERA.PLAYBOOK.HAS_STEP.V1',
  metadata: {
    sequence: 1,
    required: true,
    conditional: false
  }
}
```

### Version Relationships
```typescript
{
  relationship_type: 'version_of',
  from_entity_id: 'playbook_def_v2_id',
  to_entity_id: 'playbook_canonical_id',
  smart_code: 'HERA.PLAYBOOK.VERSION_OF.V1',
  metadata: {
    version_number: 2,
    change_summary: 'Added compliance step',
    compatible_with_v1: true
  }
}
```

### Run Relationships
```typescript
{
  relationship_type: 'run_of',
  from_entity_id: 'playbook_run_txn_id',
  to_entity_id: 'playbook_def_version_id',
  smart_code: 'HERA.PLAYBOOK.RUN_OF.V1',
  metadata: {
    initiated_by: 'user_entity_id',
    initiated_at: '2024-01-01T10:00:00Z'
  }
}
```

### Step Execution Relationships
```typescript
{
  relationship_type: 'step_executes',
  from_entity_id: 'step_execution_line_id',
  to_entity_id: 'step_def_version_id',
  smart_code: 'HERA.PLAYBOOK.STEP.EXECUTES.V1',
  metadata: {
    execution_context: 'playbook_run_id',
    execution_order: 1
  }
}
```

## 2. Execution Mappings

### 2.1 Playbook Run → `universal_transactions`

Each playbook execution creates a transaction:

```typescript
{
  transaction_type: 'playbook_run',
  transaction_code: 'RUN-20240101-0001',
  smart_code: 'HERA.GENERAL.PLAYBOOK.RUN.CUSTOMER_ONBOARDING.V1',
  organization_id: 'org_uuid',
  reference_entity_id: 'playbook_definition_id',
  subject_entity_id: 'customer_entity_id', // Optional: the business object being processed
  total_amount: 25.00, // Total cost of execution
  status: 'in_progress', // queued | in_progress | blocked | completed | failed | cancelled
  metadata: {
    inputs: { customer_id: 'cust_123', priority: 'high' },
    started_at: '2024-01-01T10:00:00Z',
    blocked_reason: null,
    error: null,
    ai_confidence: 0.95,
    ai_insights: 'All steps executing normally'
  }
}
```

### 2.2 Step Executions → `universal_transaction_lines`

Each step execution is a transaction line:

```typescript
{
  transaction_id: 'playbook_run_id',
  line_number: 1,
  line_entity_id: 'step_definition_id',
  smart_code: 'HERA.GENERAL.PLAYBOOK.STEP.EXEC.VERIFY_IDENTITY.V1',
  quantity: 1,
  unit_price: 5.00, // Cost per execution
  line_amount: 5.00,
  metadata: {
    inputs: { document_type: 'passport', document_id: 'P123456' },
    outputs: { verified: true, confidence: 0.98 },
    status: 'completed', // queued | in_progress | completed | failed | skipped
    attempt: 1,
    error: null,
    latency_ms: 1234,
    worker_id: 'user_or_system_id',
    assignee: 'john.doe@company.com',
    started_at: '2024-01-01T10:01:00Z',
    completed_at: '2024-01-01T10:01:01.234Z',
    due_at: '2024-01-01T10:05:00Z',
    ai_confidence: 0.98,
    ai_insights: 'Document verified with high confidence'
  }
}
```

## 3. Smart Code Patterns

### 3.1 Definition Smart Codes

```
# Playbook Definitions
HERA.{INDUSTRY}.PLAYBOOK.DEF.{PLAYBOOK_NAME}.V{n}
HERA.GENERAL.PLAYBOOK.DEF.CUSTOMER_ONBOARDING.V1
HERA.FINANCE.PLAYBOOK.DEF.INVOICE_APPROVAL.V2
HERA.HR.PLAYBOOK.DEF.EMPLOYEE_TERMINATION.V1

# Step Definitions
HERA.{INDUSTRY}.PLAYBOOK.STEP.DEF.{PLAYBOOK}.{STEP_NAME}.V{n}
HERA.GENERAL.PLAYBOOK.STEP.DEF.CUSTOMER_ONBOARDING.VERIFY_IDENTITY.V1
HERA.FINANCE.PLAYBOOK.STEP.DEF.INVOICE_APPROVAL.CHECK_BUDGET.V1
```

### 3.2 Execution Smart Codes

```
# Playbook Runs
HERA.{INDUSTRY}.PLAYBOOK.RUN.{PLAYBOOK}.V{DEF_VERSION}
HERA.GENERAL.PLAYBOOK.RUN.CUSTOMER_ONBOARDING.V1
HERA.FINANCE.PLAYBOOK.RUN.INVOICE_APPROVAL.V2

# Step Executions
HERA.{INDUSTRY}.PLAYBOOK.STEP.EXEC.{STEP_NAME}.V{STEP_VERSION}
HERA.GENERAL.PLAYBOOK.STEP.EXEC.VERIFY_IDENTITY.V1
HERA.FINANCE.PLAYBOOK.STEP.EXEC.CHECK_BUDGET.V1
```

### 3.3 Relationship Smart Codes

```
# Core Relationships (no industry prefix)
HERA.PLAYBOOK.TARGET.V1
HERA.PLAYBOOK.HAS_STEP.V1
HERA.PLAYBOOK.VERSION_OF.V1
HERA.PLAYBOOK.RUN_OF.V1
HERA.PLAYBOOK.STEP.EXECUTES.V1

# Additional Relationships
HERA.PLAYBOOK.STEP.DEPENDS_ON.V1
HERA.PLAYBOOK.STEP.TRIGGERS.V1
HERA.PLAYBOOK.RUN.ASSIGNED_TO.V1
HERA.PLAYBOOK.RUN.BLOCKED_BY.V1
```

## 4. Extended Properties via `core_dynamic_data`

### 4.1 Playbook Definition Properties

| Field Name | Field Type | Smart Code | Description |
|------------|------------|------------|-------------|
| input_schema | text | HERA.GENERAL.PLAYBOOK.DYN.INPUT_SCHEMA.V1 | JSON schema for inputs |
| output_schema | text | HERA.GENERAL.PLAYBOOK.DYN.OUTPUT_SCHEMA.V1 | JSON schema for outputs |
| policies | text | HERA.GENERAL.PLAYBOOK.DYN.POLICIES.V1 | Business rules JSON |
| sla_hours | number | HERA.GENERAL.PLAYBOOK.DYN.SLA_HOURS.V1 | Overall SLA in hours |
| permissions_required | text | HERA.GENERAL.PLAYBOOK.DYN.PERMISSIONS.V1 | JSON array of permissions |
| ai_enabled | text | HERA.GENERAL.PLAYBOOK.DYN.AI_ENABLED.V1 | 'true' or 'false' |
| retry_policy | text | HERA.GENERAL.PLAYBOOK.DYN.RETRY_POLICY.V1 | Retry configuration JSON |
| cost_estimate | number | HERA.GENERAL.PLAYBOOK.DYN.COST_ESTIMATE.V1 | Estimated cost per run |

### 4.2 Step Definition Properties

| Field Name | Field Type | Smart Code | Description |
|------------|------------|------------|-------------|
| worker_type | text | HERA.GENERAL.PLAYBOOK.DYN.WORKER_TYPE.V1 | human/ai/system/external |
| service_endpoint | text | HERA.GENERAL.PLAYBOOK.DYN.SERVICE_ENDPOINT.V1 | URL for system workers |
| input_contract | text | HERA.GENERAL.PLAYBOOK.DYN.INPUT_CONTRACT.V1 | Step input JSON schema |
| output_contract | text | HERA.GENERAL.PLAYBOOK.DYN.OUTPUT_CONTRACT.V1 | Step output JSON schema |
| retry_policy | text | HERA.GENERAL.PLAYBOOK.DYN.STEP_RETRY.V1 | Step-specific retry config |
| sla_seconds | number | HERA.GENERAL.PLAYBOOK.DYN.SLA_SECONDS.V1 | Step time limit |
| permissions_required | text | HERA.GENERAL.PLAYBOOK.DYN.STEP_PERMISSIONS.V1 | Step permissions JSON |
| idempotency_key_rule | text | HERA.GENERAL.PLAYBOOK.DYN.IDEMPOTENCY_RULE.V1 | Key generation rule |
| cost_per_execution | number | HERA.GENERAL.PLAYBOOK.DYN.STEP_COST.V1 | Cost per execution |
| ai_model_preference | text | HERA.GENERAL.PLAYBOOK.DYN.AI_MODEL.V1 | Preferred AI model |
| human_skills_required | text | HERA.GENERAL.PLAYBOOK.DYN.HUMAN_SKILLS.V1 | Required skills JSON |

## 5. Query Patterns

### 5.1 Get All Playbooks

```sql
SELECT 
  e.*,
  e.metadata->>'status' as status,
  e.metadata->>'version' as version
FROM core_entities e
WHERE e.organization_id = $1
  AND e.entity_type = 'playbook_definition'
  AND e.metadata->>'status' = 'published'
ORDER BY e.created_at DESC;
```

### 5.2 Get Playbook with Steps

```sql
SELECT 
  p.*,
  s.entity_name as step_name,
  s.metadata->>'sequence' as sequence
FROM core_entities p
LEFT JOIN core_relationships r ON r.from_entity_id = p.id
  AND r.relationship_type = 'playbook_has_step'
  AND r.smart_code = 'HERA.PLAYBOOK.HAS_STEP.V1'
LEFT JOIN core_entities s ON s.id = r.to_entity_id
WHERE p.id = $1
ORDER BY (s.metadata->>'sequence')::int;
```

### 5.3 Get Running Playbooks

```sql
SELECT 
  t.*,
  e.entity_name as playbook_name,
  se.entity_name as subject_name
FROM universal_transactions t
JOIN core_entities e ON e.id = t.reference_entity_id
LEFT JOIN core_entities se ON se.id = t.subject_entity_id
WHERE t.organization_id = $1
  AND t.transaction_type = 'playbook_run'
  AND t.status IN ('queued', 'in_progress', 'blocked')
ORDER BY t.created_at DESC;
```

## 6. Benefits of This Mapping

1. **Zero Schema Changes**: All playbook functionality uses existing 6 sacred tables
2. **Perfect Multi-Tenancy**: organization_id isolation at every level
3. **Complete Audit Trail**: Every execution tracked in universal_transactions
4. **AI-Native**: ai_confidence and ai_insights fields available throughout
5. **Flexible Extensibility**: core_dynamic_data allows unlimited custom fields
6. **Smart Code Intelligence**: Business context preserved in every operation
7. **Version Control**: Built-in versioning through relationships
8. **Cost Tracking**: Financial integration via transaction amounts
9. **Universal Patterns**: Same patterns work for any industry playbook
10. **No Custom Tables**: Honors HERA's sacred 6-table principle