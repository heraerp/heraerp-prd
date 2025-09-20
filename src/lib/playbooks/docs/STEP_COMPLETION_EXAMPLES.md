# HERA Playbook Step Completion Examples

This document provides comprehensive examples for completing steps in HERA Playbook runs, covering various worker types, scenarios, and error conditions.

## Table of Contents

1. [Complete Step API](#complete-step-api)
2. [Step Completion Variants by Worker Type](#step-completion-variants)
3. [Advanced Completion Scenarios](#advanced-completion-scenarios)
4. [Error Scenarios](#error-scenarios)
5. [Integration Examples](#integration-examples)

## Complete Step API

### Basic Step Completion

**Endpoint**: `POST /api/v1/playbooks/runs/{run_id}/steps/{step_id}/complete`

**Headers**:
```http
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
X-Organization-ID: <organization-uuid>
```

**Request Payload**:
```json
{
  "outputs": {
    "application_id": "APP-2025-00042"
  },
  "ai_confidence": 0.98,
  "ai_insights": "Validated required fields and deduped applicant profile."
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "step": {
      "id": "step_123e4567-e89b-12d3-a456-426614174000",
      "run_id": "run_987f6543-e21b-12d3-a456-426614174000",
      "template_step_id": "validate_application",
      "status": "completed",
      "completed_at": "2025-01-19T10:30:45Z",
      "outputs": {
        "application_id": "APP-2025-00042"
      },
      "execution_metadata": {
        "ai_confidence": 0.98,
        "ai_insights": "Validated required fields and deduped applicant profile.",
        "duration_ms": 1523
      }
    },
    "run": {
      "id": "run_987f6543-e21b-12d3-a456-426614174000",
      "status": "in_progress",
      "progress": 0.25,
      "completed_steps": 2,
      "total_steps": 8
    },
    "next_steps": [
      {
        "id": "step_234e5678-e89b-12d3-a456-426614174000",
        "template_step_id": "credit_check",
        "status": "ready"
      }
    ]
  }
}
```

**cURL Command**:
```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks/runs/run_987f6543-e21b-12d3-a456-426614174000/steps/step_123e4567-e89b-12d3-a456-426614174000/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Organization-ID: org_456f7890-e21b-12d3-a456-426614174000" \
  -d '{
    "outputs": {
      "application_id": "APP-2025-00042"
    },
    "ai_confidence": 0.98,
    "ai_insights": "Validated required fields and deduped applicant profile."
  }'
```

## Step Completion Variants

### 1. Human Steps

**Approval Decision**:
```json
{
  "outputs": {
    "decision": "approved",
    "approval_amount": 50000,
    "conditions": ["employment_verification", "income_documentation"]
  },
  "user_id": "user_789a1234-e89b-12d3-a456-426614174000",
  "comments": "Approved with conditions. Require employment verification within 30 days.",
  "attachments": [
    {
      "file_id": "file_abc123",
      "filename": "approval_memo.pdf",
      "mime_type": "application/pdf",
      "size": 245678
    }
  ]
}
```

**Document Review**:
```json
{
  "outputs": {
    "review_status": "needs_clarification",
    "issues_found": ["missing_signature", "expired_document"],
    "reviewed_documents": ["doc_123", "doc_456"]
  },
  "user_id": "user_789a1234-e89b-12d3-a456-426614174000",
  "review_duration_seconds": 180,
  "review_notes": "Customer needs to re-submit signed documents"
}
```

### 2. System Steps

**Successful API Call**:
```json
{
  "outputs": {
    "credit_score": 750,
    "credit_report_id": "CR-2025-98765",
    "risk_assessment": "low"
  },
  "system_metadata": {
    "service": "credit_bureau_api",
    "endpoint": "https://api.creditbureau.com/v2/check",
    "response_time_ms": 456,
    "status_code": 200
  }
}
```

**With Retry Information**:
```json
{
  "outputs": {
    "payment_processed": true,
    "transaction_id": "TXN-2025-123456",
    "amount_charged": 1250.00
  },
  "system_metadata": {
    "service": "payment_gateway",
    "retry_count": 2,
    "retry_reasons": ["timeout", "gateway_busy"],
    "final_attempt_duration_ms": 1823
  },
  "warnings": [
    "Payment gateway experienced delays, consider backup provider"
  ]
}
```

**With Error Recovery**:
```json
{
  "outputs": {
    "email_sent": true,
    "message_id": "MSG-2025-789012",
    "fallback_used": true
  },
  "system_metadata": {
    "primary_service_error": "Primary SMTP server unavailable",
    "fallback_service": "sendgrid",
    "error_handled": true
  }
}
```

### 3. AI Steps

**Document Analysis**:
```json
{
  "outputs": {
    "document_type": "bank_statement",
    "extracted_data": {
      "account_number": "****5678",
      "period": "2024-12",
      "average_balance": 15230.45,
      "total_deposits": 8500.00
    },
    "validation_status": "valid"
  },
  "ai_metadata": {
    "model": "gpt-4-vision",
    "confidence": 0.95,
    "processing_time_ms": 2340,
    "tokens_used": {
      "prompt": 1250,
      "completion": 450,
      "total": 1700
    }
  },
  "ai_insights": "Document appears authentic with consistent formatting and valid bank identifiers"
}
```

**Text Generation**:
```json
{
  "outputs": {
    "generated_text": "Dear valued customer, your application has been approved...",
    "template_used": "approval_notification",
    "personalization_applied": true
  },
  "ai_metadata": {
    "model": "claude-3-sonnet",
    "temperature": 0.7,
    "max_tokens": 500,
    "actual_tokens": 245,
    "confidence": 0.92
  },
  "ai_insights": "Generated professional approval message with appropriate tone"
}
```

### 4. External Steps

**Webhook Response**:
```json
{
  "outputs": {
    "webhook_received": true,
    "external_status": "completed",
    "external_reference": "EXT-REF-2025-001"
  },
  "external_metadata": {
    "source": "partner_api",
    "webhook_id": "wh_123abc",
    "signature_verified": true,
    "received_at": "2025-01-19T10:35:22Z",
    "raw_payload": {
      "status": "success",
      "data": {"verification": "passed"}
    }
  }
}
```

**API Integration with Rate Limiting**:
```json
{
  "outputs": {
    "data_synced": true,
    "records_processed": 150,
    "sync_id": "SYNC-2025-456"
  },
  "external_metadata": {
    "api_endpoint": "https://partner.com/api/sync",
    "rate_limit_remaining": 45,
    "rate_limit_reset": "2025-01-19T11:00:00Z",
    "batch_size": 50,
    "total_batches": 3
  }
}
```

## Advanced Completion Scenarios

### 1. Partial Completion with Checkpoint

```json
{
  "outputs": {
    "processed_count": 1000,
    "total_count": 5000,
    "last_processed_id": "rec_1000"
  },
  "checkpoint_data": {
    "resume_token": "eyJ0eXBlIjoicmVzdW1lIiwib2Zmc2V0IjoxMDAwfQ==",
    "state": {
      "batch_number": 2,
      "errors_encountered": 3,
      "skipped_records": 15
    }
  },
  "partial_completion": true,
  "continue_processing": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "step": {
      "status": "in_progress",
      "checkpoint_saved": true,
      "progress": 0.2
    },
    "continuation": {
      "scheduled_at": "2025-01-19T10:40:00Z",
      "estimated_completion": "2025-01-19T11:00:00Z"
    }
  }
}
```

### 2. Completion with Validation Errors

```json
{
  "outputs": {
    "validation_performed": true,
    "valid_records": 95,
    "invalid_records": 5
  },
  "validation_errors": [
    {
      "record_id": "rec_101",
      "field": "email",
      "error": "Invalid email format",
      "value": "john.doe@"
    },
    {
      "record_id": "rec_205",
      "field": "phone",
      "error": "Invalid phone number",
      "value": "123"
    }
  ],
  "require_manual_review": true
}
```

### 3. Conditional Next Steps

```json
{
  "outputs": {
    "risk_score": 85,
    "risk_category": "high",
    "requires_additional_review": true
  },
  "conditional_routing": {
    "trigger_condition": "risk_score > 80",
    "next_step_override": "manual_underwriting",
    "skip_steps": ["auto_approval", "instant_decision"]
  }
}
```

**Response includes routing decisions**:
```json
{
  "success": true,
  "data": {
    "routing_applied": true,
    "next_steps": [
      {
        "template_step_id": "manual_underwriting",
        "reason": "High risk score requires manual review"
      }
    ],
    "skipped_steps": ["auto_approval", "instant_decision"]
  }
}
```

### 4. Escalation Required

```json
{
  "outputs": {
    "review_result": "exception_found",
    "exception_type": "unusual_transaction_pattern"
  },
  "escalation": {
    "required": true,
    "level": "supervisor",
    "reason": "Suspicious activity detected requiring supervisor approval",
    "priority": "high",
    "sla_hours": 4
  },
  "hold_further_processing": true
}
```

### 5. Bulk Step Completion

**Endpoint**: `POST /api/v1/playbooks/runs/{run_id}/steps/bulk-complete`

```json
{
  "completions": [
    {
      "step_id": "step_001",
      "outputs": {
        "check_passed": true
      }
    },
    {
      "step_id": "step_002",
      "outputs": {
        "verification_status": "verified"
      }
    },
    {
      "step_id": "step_003",
      "outputs": {
        "score": 95
      },
      "ai_confidence": 0.99
    }
  ],
  "atomic": true  // All or nothing
}
```

## Error Scenarios

### 1. Invalid Step State

**Request**:
```json
{
  "outputs": {
    "result": "completed"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STEP_STATE",
    "message": "Cannot complete step in current state",
    "details": {
      "step_id": "step_123",
      "current_status": "completed",
      "allowed_statuses": ["in_progress", "ready"]
    }
  }
}
```

### 2. Missing Required Outputs

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_OUTPUTS",
    "message": "Required outputs not provided",
    "details": {
      "missing_fields": ["approval_decision", "approval_amount"],
      "contract_requirements": {
        "approval_decision": {
          "type": "string",
          "enum": ["approved", "rejected", "pending"]
        },
        "approval_amount": {
          "type": "number",
          "minimum": 0
        }
      }
    }
  }
}
```

### 3. Contract Validation Failure

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "CONTRACT_VALIDATION_FAILED",
    "message": "Output does not match step contract",
    "details": {
      "validation_errors": [
        {
          "field": "credit_score",
          "expected": "number between 300-850",
          "received": "1200"
        },
        {
          "field": "risk_category",
          "expected": "one of: low, medium, high",
          "received": "very_high"
        }
      ]
    }
  }
}
```

### 4. Permission Denied

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "User does not have permission to complete this step",
    "details": {
      "required_role": "approver",
      "user_roles": ["viewer", "analyst"],
      "step_type": "human",
      "assigned_to": "user_456"
    }
  }
}
```

### 5. Concurrent Modification

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_MODIFICATION",
    "message": "Step was modified by another process",
    "details": {
      "step_version": 3,
      "expected_version": 2,
      "modified_by": "system_process_scheduler",
      "modified_at": "2025-01-19T10:30:44Z"
    }
  }
}
```

## Integration Examples

### 1. Orchestrator Processing Completion

When a step is completed, the orchestrator:

```typescript
// Orchestrator processing flow
async function processStepCompletion(stepCompletion: StepCompletion) {
  // 1. Validate completion
  const validation = await validateCompletion(stepCompletion);
  if (!validation.valid) {
    throw new ValidationError(validation.errors);
  }

  // 2. Update step status
  await updateStepStatus(stepCompletion.stepId, 'completed', {
    outputs: stepCompletion.outputs,
    completedAt: new Date(),
    executionMetadata: stepCompletion.metadata
  });

  // 3. Check completion conditions
  const conditions = await evaluateConditions(stepCompletion);
  
  // 4. Determine next steps
  const nextSteps = await determineNextSteps(
    stepCompletion.runId,
    stepCompletion.stepId,
    conditions
  );

  // 5. Activate next steps
  for (const step of nextSteps) {
    await activateStep(step.id);
  }

  // 6. Update run progress
  await updateRunProgress(stepCompletion.runId);

  // 7. Send notifications
  await sendCompletionNotifications(stepCompletion);

  return {
    step: stepCompletion,
    nextSteps,
    runProgress: await getRunProgress(stepCompletion.runId)
  };
}
```

### 2. Automatic Next Step Triggering

```json
// Step completion triggers next step
{
  "step_completed": {
    "id": "step_123",
    "template_step_id": "credit_check",
    "outputs": {
      "credit_score": 780,
      "risk_category": "low"
    }
  },
  "triggered_steps": [
    {
      "id": "step_124",
      "template_step_id": "auto_approval",
      "triggered_by": {
        "condition": "credit_score > 750 AND risk_category = 'low'",
        "matched": true
      },
      "scheduled_start": "2025-01-19T10:31:00Z"
    }
  ]
}
```

### 3. Run Progress Update

After step completion, the run progress is automatically updated:

```json
{
  "run_update": {
    "id": "run_987",
    "previous_progress": 0.125,
    "new_progress": 0.25,
    "completed_steps": 2,
    "total_steps": 8,
    "estimated_completion": "2025-01-19T11:30:00Z",
    "milestone_reached": "application_validated"
  }
}
```

### 4. Notification Examples

**Email Notification**:
```json
{
  "notification_type": "email",
  "recipients": ["supervisor@company.com"],
  "subject": "Approval Required - Application APP-2025-00042",
  "body": {
    "template": "step_escalation",
    "data": {
      "application_id": "APP-2025-00042",
      "step_name": "High Risk Review",
      "reason": "Credit score below threshold",
      "sla": "4 hours"
    }
  }
}
```

**Webhook Notification**:
```json
{
  "notification_type": "webhook",
  "endpoint": "https://partner.com/webhooks/playbook",
  "event": "step.completed",
  "data": {
    "run_id": "run_987",
    "step_id": "step_123",
    "step_type": "credit_check",
    "outputs": {
      "credit_score": 780
    },
    "timestamp": "2025-01-19T10:30:45Z"
  },
  "signature": "sha256=abcd1234..."
}
```

### 5. Complex Orchestration Example

```typescript
// Example: Loan approval with multiple paths
async function completeLoanReviewStep(completion: StepCompletion) {
  const { outputs } = completion;
  
  // Different paths based on loan amount and risk
  if (outputs.loan_amount > 100000 && outputs.risk_score > 70) {
    // Requires executive approval
    await createDynamicStep({
      template_id: 'executive_approval',
      assigned_to: 'executive_team',
      priority: 'high',
      data: {
        loan_details: outputs,
        escalation_reason: 'High value, high risk'
      }
    });
  } else if (outputs.risk_score > 85) {
    // Requires additional documentation
    await createDynamicStep({
      template_id: 'document_request',
      data: {
        required_documents: [
          'tax_returns_3years',
          'bank_statements_6months',
          'employment_verification'
        ]
      }
    });
  } else {
    // Standard approval flow
    await activateStep('standard_approval');
  }
  
  // Update customer
  await sendCustomerUpdate({
    application_id: outputs.application_id,
    status: 'under_review',
    next_action: 'Awaiting internal review'
  });
}
```

## Best Practices

1. **Always include required outputs** as defined in the step contract
2. **Use appropriate metadata** for your worker type (ai_metadata, system_metadata, etc.)
3. **Handle errors gracefully** and provide meaningful error context
4. **Include timing information** when relevant (duration, processing time)
5. **Validate data before submission** to avoid contract validation errors
6. **Use atomic operations** for bulk completions when consistency is critical
7. **Implement proper retry logic** for system and external steps
8. **Track performance metrics** through metadata for optimization
9. **Maintain audit trail** with user IDs and timestamps
10. **Follow security best practices** with proper authentication and authorization

## Additional Resources

- [Playbook Templates Documentation](./PLAYBOOK_TEMPLATES.md)
- [Step Contracts Guide](./STEP_CONTRACTS.md)
- [Orchestration Patterns](./ORCHESTRATION_PATTERNS.md)
- [API Reference](./API_REFERENCE.md)