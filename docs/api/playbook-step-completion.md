# HERA Playbooks Step Completion API

## Overview

The Step Completion API allows external systems and workers to mark playbook run steps as completed with output data and AI insights. This endpoint handles step completion with the exact payload format specified, validates outputs against contracts, and triggers orchestrator workflows.

## Endpoint

```
POST /api/v1/playbook-runs/{runId}/complete-step/{stepId}
```

## Authentication

Requires valid JWT token with:
- Organization ID context
- `PLAYBOOK_RUN_COMPLETE` permission
- Optional `PLAYBOOK_STEP_OVERRIDE` for completing steps assigned to other users

## Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `runId` | string | The ID of the playbook run |
| `stepId` | string | The ID of the specific step to complete |

## Request Body

```json
{
  "outputs": {
    "application_id": "APP-2025-00042"
  },
  "ai_confidence": 0.98,
  "ai_insights": "Validated required fields and deduped applicant profile."
}
```

### Schema

```typescript
interface StepCompletionPayload {
  outputs?: Record<string, any>;        // Step output data (default: {})
  ai_confidence?: number;               // AI confidence score 0-1
  ai_insights?: string;                 // AI-generated insights
}
```

## Response

### Success Response (200)

```json
{
  "success": true,
  "message": "Step step-validate-application completed successfully",
  "data": {
    "run_id": "run_01234567-89ab-cdef-0123-456789abcdef",
    "step_id": "step-validate-application",
    "step_sequence": 3,
    "status": "completed",
    "outputs": {
      "application_id": "APP-2025-00042"
    },
    "ai_confidence": 0.98,
    "ai_insights": "Validated required fields and deduped applicant profile.",
    "completed_at": "2025-01-19T12:34:56.789Z",
    "actual_duration_minutes": 15,
    "completion_event_id": "event_01234567-89ab-cdef-0123-456789abcdef",
    "next_steps": [
      {
        "step_id": "step-approval-review",
        "step_sequence": 4,
        "step_name": "Approval Review",
        "step_type": "human",
        "status": "ready_to_activate"
      }
    ],
    "orchestrator_notified": true
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Permission denied to complete steps in this run"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Step step-id not found in run run-id"
}
```

#### 400 Bad Request - Invalid Status
```json
{
  "success": false,
  "error": "Step cannot be completed from status: completed. Must be one of: in_progress, waiting_for_input, waiting_for_signal, ready"
}
```

#### 400 Bad Request - Output Validation
```json
{
  "success": false,
  "error": "Output validation failed",
  "details": "Missing required output field: application_id"
}
```

#### 409 Conflict - Already Completed
```json
{
  "success": false,
  "error": "Step is already in terminal state: completed"
}
```

## Features

### 1. Input Validation
- Validates payload against Zod schema
- Checks AI confidence score range (0-1)
- Ensures proper data types

### 2. Step State Validation
- Verifies step is in completable state
- Prevents duplicate completions
- Validates step belongs to specified run

### 3. Output Contract Validation
- Validates outputs against step's output contract (if defined)
- Checks required fields
- Validates field types (string, number, boolean)

### 4. Permission Checks
- Organization-level access control
- Step-specific permission validation
- Human task assignment verification with override capability

### 5. Orchestrator Integration
- Automatically triggers next step activation
- Updates run progress and statistics
- Handles dependency resolution
- Notifies orchestrator daemon

### 6. Audit Trail
- Creates completion event transaction
- Records AI insights and confidence scores
- Tracks completion duration
- Logs completion user and timestamp

### 7. Progress Tracking
- Updates run progress percentage
- Calculates completion statistics
- Determines final run status
- Triggers run completion events

## Workflow Integration

1. **Step Validation** - Validates step exists and is completable
2. **Permission Check** - Ensures user can complete the step
3. **Output Validation** - Validates outputs against contracts
4. **Step Update** - Marks step as completed with outputs and AI data
5. **Event Creation** - Creates audit trail transaction
6. **Orchestrator Notification** - Triggers next step processing
7. **Progress Update** - Updates overall run progress
8. **Response** - Returns completion confirmation with next steps

## AI Integration

The endpoint supports AI worker integration through:

- **AI Confidence Scores** - 0-1 confidence ratings for AI decisions
- **AI Insights** - Natural language explanations of AI processing
- **Output Validation** - Ensures AI outputs meet step requirements
- **Audit Trail** - Records AI decision-making for compliance

## Security Considerations

- **Multi-tenant Isolation** - Organization ID filtering prevents data leakage
- **Permission-based Access** - Granular permission checking
- **Step Assignment** - Respects human task assignments with override capability
- **Output Validation** - Prevents invalid data from progressing workflow
- **Audit Logging** - Complete audit trail for compliance requirements

## Example Usage

### Complete a Human Review Step
```bash
curl -X POST \
  /api/v1/playbook-runs/run_123/complete-step/step-human-review \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "outputs": {
      "decision": "approved",
      "comments": "Application meets all criteria"
    },
    "ai_confidence": 0.95,
    "ai_insights": "Automated review found no issues with application data"
  }'
```

### Complete an AI Processing Step
```bash
curl -X POST \
  /api/v1/playbook-runs/run_456/complete-step/step-ai-validation \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "outputs": {
      "validation_result": "passed",
      "risk_score": 0.12,
      "processed_count": 1247
    },
    "ai_confidence": 0.98,
    "ai_insights": "High confidence validation with automated risk assessment"
  }'
```

## Integration Notes

- Endpoint works with both human and AI workers
- Orchestrator daemon automatically picks up changes
- Support for complex dependency resolution
- Real-time progress tracking and notifications
- Complete integration with HERA's universal architecture

## Related APIs

- `GET /api/v1/playbook-runs/{runId}` - Get run details
- `GET /api/v1/playbook-runs/{runId}/steps/{stepId}` - Get step details
- `POST /api/v1/playbook-runs/{runId}/signal` - Send signals to waiting steps
- `GET /api/v1/playbook-runs/{runId}/timeline` - Get run timeline