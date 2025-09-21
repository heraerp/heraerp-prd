# HERA Playbooks API Examples

Complete API reference with copy-paste ready examples for the HERA Playbooks DNA system.

## Table of Contents

- [Authentication](#authentication)
- [Create Playbook with Inlined Steps](#create-playbook-with-inlined-steps)
- [Create Playbook Run](#create-playbook-run)
- [Execute Step Completion](#execute-step-completion)
- [Send Signals to Runs](#send-signals-to-runs)
- [Query Run Timeline](#query-run-timeline)
- [Get Metrics and Analytics](#get-metrics-and-analytics)
- [Real-World Scenarios](#real-world-scenarios)
- [Edge Cases and Validation](#edge-cases-and-validation)

## Authentication

All API calls require JWT authentication with organization context:

```bash
# Headers required for all requests
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## Create Playbook with Inlined Steps

### Request

**POST** `/api/v1/playbooks`

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "Customer Onboarding",
      "description": "Standard workflow for onboarding new enterprise customers",
      "smart_code": "HERA.CRM.PLAYBOOK.CUSTOMER.ONBOARDING.v1",
      "type": "workflow",
      "category": "sales",
      "version": "1.0.0",
      "metadata": {
        "author": "Sales Operations Team",
        "department": "Sales",
        "compliance": ["SOC2", "ISO27001"],
        "sla_hours": 48,
        "estimated_duration_minutes": 240
      },
      "steps": [
        {
          "name": "Initial Contact",
          "description": "Capture initial customer information and requirements",
          "smart_code": "HERA.CRM.STEP.CUSTOMER.INITIAL_CONTACT.v1",
          "step_type": "form",
          "sequence": 1,
          "is_required": true,
          "conditions": {
            "pre": [],
            "post": [
              {
                "field": "customer_type",
                "operator": "in",
                "value": ["enterprise", "mid-market"]
              }
            ]
          },
          "metadata": {
            "form_fields": [
              {
                "name": "company_name",
                "type": "text",
                "required": true,
                "validation": "^[A-Za-z0-9\\s&.-]{2,100}$"
              },
              {
                "name": "contact_email",
                "type": "email",
                "required": true,
                "validation": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
              },
              {
                "name": "estimated_deal_size",
                "type": "number",
                "required": true,
                "min": 10000,
                "max": 10000000
              },
              {
                "name": "customer_type",
                "type": "select",
                "required": true,
                "options": ["enterprise", "mid-market", "smb"]
              }
            ],
            "ui_hints": {
              "icon": "user-plus",
              "color": "blue",
              "estimated_time": "10 minutes"
            }
          }
        },
        {
          "name": "Qualification Review",
          "description": "Sales manager reviews and qualifies the opportunity",
          "smart_code": "HERA.CRM.STEP.CUSTOMER.QUALIFICATION.v1",
          "step_type": "approval",
          "sequence": 2,
          "is_required": true,
          "assignee_roles": ["sales_manager", "sales_director"],
          "timeout_minutes": 240,
          "conditions": {
            "pre": [
              {
                "field": "estimated_deal_size",
                "operator": ">=",
                "value": 50000
              }
            ]
          },
          "metadata": {
            "approval_options": [
              {
                "action": "approve",
                "label": "Qualified - Proceed",
                "next_step": 3
              },
              {
                "action": "reject",
                "label": "Not Qualified",
                "end_playbook": true
              },
              {
                "action": "request_info",
                "label": "Need More Information",
                "return_to_step": 1
              }
            ],
            "escalation": {
              "after_hours": 4,
              "escalate_to": ["sales_director", "vp_sales"]
            }
          }
        },
        {
          "name": "Technical Assessment",
          "description": "Solution architect conducts technical requirements gathering",
          "smart_code": "HERA.CRM.STEP.CUSTOMER.TECH_ASSESSMENT.v1",
          "step_type": "task",
          "sequence": 3,
          "is_required": true,
          "assignee_roles": ["solution_architect", "technical_lead"],
          "timeout_minutes": 1440,
          "parallel_allowed": true,
          "metadata": {
            "task_checklist": [
              "Review current infrastructure",
              "Identify integration points",
              "Assess data migration needs",
              "Document security requirements",
              "Estimate implementation timeline"
            ],
            "required_outputs": [
              {
                "name": "technical_assessment_doc",
                "type": "document",
                "template": "TECH_ASSESSMENT_TEMPLATE_v2"
              },
              {
                "name": "integration_complexity",
                "type": "select",
                "options": ["low", "medium", "high", "very_high"]
              }
            ]
          }
        },
        {
          "name": "Contract Preparation",
          "description": "Legal team prepares customer contract based on deal parameters",
          "smart_code": "HERA.CRM.STEP.CUSTOMER.CONTRACT_PREP.v1",
          "step_type": "automated",
          "sequence": 4,
          "is_required": true,
          "automation_config": {
            "trigger": "on_previous_completion",
            "api_endpoint": "/api/v1/contracts/generate",
            "retry_attempts": 3,
            "timeout_seconds": 300
          },
          "conditions": {
            "pre": [
              {
                "field": "qualification_status",
                "operator": "=",
                "value": "approved"
              }
            ]
          },
          "metadata": {
            "contract_parameters": {
              "template_based_on_deal_size": {
                "under_100k": "STANDARD_CONTRACT_v3",
                "100k_to_500k": "ENTERPRISE_CONTRACT_v3",
                "over_500k": "CUSTOM_CONTRACT_v1"
              },
              "include_clauses": [
                "data_protection",
                "sla_guarantees",
                "payment_terms"
              ]
            }
          }
        },
        {
          "name": "Final Approval",
          "description": "Executive approval for deals over $500k",
          "smart_code": "HERA.CRM.STEP.CUSTOMER.EXEC_APPROVAL.v1",
          "step_type": "approval",
          "sequence": 5,
          "is_required": false,
          "conditions": {
            "pre": [
              {
                "field": "estimated_deal_size",
                "operator": ">",
                "value": 500000
              }
            ]
          },
          "assignee_roles": ["vp_sales", "cfo", "ceo"],
          "timeout_minutes": 2880,
          "metadata": {
            "approval_matrix": {
              "500k_to_1m": ["vp_sales"],
              "1m_to_5m": ["vp_sales", "cfo"],
              "over_5m": ["vp_sales", "cfo", "ceo"]
            },
            "required_documents": [
              "technical_assessment",
              "risk_assessment",
              "financial_impact_analysis"
            ]
          }
        }
      ]
    }
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "playbook_id": "pb_123e4567-e89b-12d3-a456-426614174000",
    "smart_code": "HERA.CRM.PLAYBOOK.CUSTOMER.ONBOARDING.v1",
    "version": "1.0.0",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "created_by": "user_123",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "validation": {
      "smart_code_valid": true,
      "steps_valid": true,
      "conditions_valid": true
    },
    "metrics": {
      "total_steps": 5,
      "required_steps": 4,
      "parallel_steps": 1,
      "automated_steps": 1,
      "estimated_duration_minutes": 240
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Smart code validation failed",
    "details": {
      "field": "steps[0].smart_code",
      "value": "HERA.CRM.STEP.INVALID",
      "reason": "Smart code must end with version suffix (e.g., .v1)"
    }
  }
}
```

## Create Playbook Run

### Request

**POST** `/api/v1/playbook-runs`

```bash
curl -X POST https://api.heraerp.com/api/v1/playbook-runs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "run": {
      "playbook_id": "pb_123e4567-e89b-12d3-a456-426614174000",
      "smart_code": "HERA.CRM.RUN.CUSTOMER.ONBOARDING.v1",
      "context": {
        "entity_type": "customer",
        "entity_id": "cust_987654321",
        "entity_name": "Acme Corporation",
        "triggered_by": "sales_rep_001",
        "priority": "high"
      },
      "initial_data": {
        "company_name": "Acme Corporation",
        "contact_email": "john.doe@acme.com",
        "estimated_deal_size": 750000,
        "customer_type": "enterprise",
        "region": "north_america",
        "industry": "technology"
      },
      "metadata": {
        "source": "crm_system",
        "campaign_id": "Q4_2024_ENTERPRISE",
        "lead_score": 95
      }
    }
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "run_id": "run_456e7890-e89b-12d3-a456-426614174000",
    "playbook_id": "pb_123e4567-e89b-12d3-a456-426614174000",
    "status": "active",
    "current_step": 1,
    "created_at": "2024-01-15T11:00:00Z",
    "started_at": "2024-01-15T11:00:01Z",
    "smart_code": "HERA.CRM.RUN.CUSTOMER.ONBOARDING.v1",
    "steps_status": [
      {
        "step_id": "step_001",
        "sequence": 1,
        "status": "in_progress",
        "assigned_to": "sales_rep_001",
        "started_at": "2024-01-15T11:00:01Z"
      },
      {
        "step_id": "step_002",
        "sequence": 2,
        "status": "pending"
      },
      {
        "step_id": "step_003",
        "sequence": 3,
        "status": "pending"
      },
      {
        "step_id": "step_004",
        "sequence": 4,
        "status": "pending"
      },
      {
        "step_id": "step_005",
        "sequence": 5,
        "status": "pending",
        "is_conditional": true
      }
    ],
    "timeline": [
      {
        "timestamp": "2024-01-15T11:00:00Z",
        "event": "run_created",
        "actor": "sales_rep_001",
        "details": {
          "playbook_name": "Customer Onboarding",
          "entity": "Acme Corporation"
        }
      },
      {
        "timestamp": "2024-01-15T11:00:01Z",
        "event": "step_started",
        "step": 1,
        "actor": "sales_rep_001",
        "details": {
          "step_name": "Initial Contact"
        }
      }
    ]
  }
}
```

## Execute Step Completion

### Request

**POST** `/api/v1/playbook-runs/{run_id}/steps/{step_id}/complete`

```bash
curl -X POST https://api.heraerp.com/api/v1/playbook-runs/run_456e7890/steps/step_001/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "completion": {
      "outcome": "success",
      "completed_by": "sales_rep_001",
      "data": {
        "company_name": "Acme Corporation",
        "contact_email": "john.doe@acme.com",
        "contact_phone": "+1-555-123-4567",
        "estimated_deal_size": 750000,
        "customer_type": "enterprise",
        "additional_contacts": [
          {
            "name": "Jane Smith",
            "role": "CTO",
            "email": "jane.smith@acme.com"
          },
          {
            "name": "Bob Johnson",
            "role": "CFO",
            "email": "bob.johnson@acme.com"
          }
        ],
        "notes": "Very interested in our API integration capabilities. Wants POC by Q2."
      },
      "attachments": [
        {
          "name": "requirements_document.pdf",
          "url": "https://storage.heraerp.com/docs/req_123.pdf",
          "type": "application/pdf",
          "size_bytes": 2457600
        }
      ],
      "next_step_assignments": {
        "step_002": ["sales_manager_002"]
      }
    }
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "step_id": "step_001",
    "status": "completed",
    "completed_at": "2024-01-15T11:30:00Z",
    "completed_by": "sales_rep_001",
    "duration_minutes": 30,
    "outcome": "success",
    "next_steps": [
      {
        "step_id": "step_002",
        "sequence": 2,
        "status": "in_progress",
        "assigned_to": "sales_manager_002",
        "started_at": "2024-01-15T11:30:01Z",
        "due_at": "2024-01-17T11:30:01Z"
      }
    ],
    "run_status": {
      "run_id": "run_456e7890",
      "overall_status": "active",
      "progress_percentage": 20,
      "completed_steps": 1,
      "total_steps": 5
    },
    "timeline_entry": {
      "timestamp": "2024-01-15T11:30:00Z",
      "event": "step_completed",
      "step": 1,
      "actor": "sales_rep_001",
      "details": {
        "step_name": "Initial Contact",
        "duration_minutes": 30,
        "outcome": "success"
      }
    }
  }
}
```

## Send Signals to Runs

### Request - Pause Run

**POST** `/api/v1/playbook-runs/{run_id}/signal`

```bash
curl -X POST https://api.heraerp.com/api/v1/playbook-runs/run_456e7890/signal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signal",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "signal": {
      "type": "pause",
      "reason": "Customer requested to delay process for budget approval",
      "pause_until": "2024-01-20T09:00:00Z",
      "issued_by": "sales_manager_002",
      "metadata": {
        "customer_request": true,
        "expected_resolution": "budget_approval",
        "follow_up_required": true
      }
    }
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "signal_id": "sig_789",
    "run_id": "run_456e7890",
    "signal_type": "pause",
    "previous_status": "active",
    "new_status": "paused",
    "paused_until": "2024-01-20T09:00:00Z",
    "affected_steps": [
      {
        "step_id": "step_002",
        "status": "paused",
        "was_status": "in_progress"
      }
    ],
    "timeline_entry": {
      "timestamp": "2024-01-15T14:00:00Z",
      "event": "run_paused",
      "actor": "sales_manager_002",
      "details": {
        "reason": "Customer requested to delay process for budget approval",
        "resume_date": "2024-01-20T09:00:00Z"
      }
    }
  }
}
```

### Request - Cancel Run

**POST** `/api/v1/playbook-runs/{run_id}/signal`

```bash
curl -X POST https://api.heraerp.com/api/v1/playbook-runs/run_456e7890/signal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signal",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "signal": {
      "type": "cancel",
      "reason": "Customer decided not to proceed with purchase",
      "issued_by": "sales_director_001",
      "metadata": {
        "cancellation_category": "lost_to_competitor",
        "competitor": "CompetitorX",
        "feedback": "Pricing was not competitive"
      }
    }
  }'
```

## Query Run Timeline

### Request

**GET** `/api/v1/playbook-runs/{run_id}/timeline?include_system_events=true`

```bash
curl -X GET "https://api.heraerp.com/api/v1/playbook-runs/run_456e7890/timeline?include_system_events=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response

```json
{
  "success": true,
  "data": {
    "run_id": "run_456e7890",
    "timeline": [
      {
        "timestamp": "2024-01-15T11:00:00Z",
        "event_type": "run_created",
        "actor": "sales_rep_001",
        "actor_type": "user",
        "details": {
          "playbook_name": "Customer Onboarding",
          "entity_type": "customer",
          "entity_name": "Acme Corporation"
        },
        "smart_code": "HERA.PLAYBOOK.EVENT.RUN_CREATED.v1"
      },
      {
        "timestamp": "2024-01-15T11:00:01Z",
        "event_type": "step_started",
        "step_sequence": 1,
        "actor": "sales_rep_001",
        "actor_type": "user",
        "details": {
          "step_name": "Initial Contact",
          "assigned_to": "sales_rep_001"
        },
        "smart_code": "HERA.PLAYBOOK.EVENT.STEP_STARTED.v1"
      },
      {
        "timestamp": "2024-01-15T11:15:00Z",
        "event_type": "data_updated",
        "step_sequence": 1,
        "actor": "sales_rep_001",
        "actor_type": "user",
        "details": {
          "fields_updated": ["contact_phone", "additional_contacts"],
          "update_type": "manual"
        },
        "smart_code": "HERA.PLAYBOOK.EVENT.DATA_UPDATED.v1"
      },
      {
        "timestamp": "2024-01-15T11:30:00Z",
        "event_type": "step_completed",
        "step_sequence": 1,
        "actor": "sales_rep_001",
        "actor_type": "user",
        "details": {
          "step_name": "Initial Contact",
          "outcome": "success",
          "duration_minutes": 30
        },
        "smart_code": "HERA.PLAYBOOK.EVENT.STEP_COMPLETED.v1"
      },
      {
        "timestamp": "2024-01-15T11:30:01Z",
        "event_type": "step_started",
        "step_sequence": 2,
        "actor": "system",
        "actor_type": "system",
        "details": {
          "step_name": "Qualification Review",
          "assigned_to": "sales_manager_002",
          "auto_assigned": true
        },
        "smart_code": "HERA.PLAYBOOK.EVENT.STEP_STARTED.v1"
      },
      {
        "timestamp": "2024-01-15T11:30:02Z",
        "event_type": "notification_sent",
        "actor": "system",
        "actor_type": "system",
        "details": {
          "recipient": "sales_manager_002",
          "notification_type": "step_assignment",
          "channel": "email"
        },
        "smart_code": "HERA.PLAYBOOK.EVENT.NOTIFICATION_SENT.v1",
        "is_system_event": true
      },
      {
        "timestamp": "2024-01-15T14:00:00Z",
        "event_type": "run_paused",
        "actor": "sales_manager_002",
        "actor_type": "user",
        "details": {
          "reason": "Customer requested to delay process for budget approval",
          "resume_date": "2024-01-20T09:00:00Z"
        },
        "smart_code": "HERA.PLAYBOOK.EVENT.RUN_PAUSED.v1"
      }
    ],
    "summary": {
      "total_events": 7,
      "user_events": 5,
      "system_events": 2,
      "time_elapsed_minutes": 180,
      "current_status": "paused"
    }
  }
}
```

## Get Metrics and Analytics

### Request - Playbook Performance Metrics

**GET** `/api/v1/playbooks/{playbook_id}/metrics?period=30d`

```bash
curl -X GET "https://api.heraerp.com/api/v1/playbooks/pb_123e4567/metrics?period=30d" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response

```json
{
  "success": true,
  "data": {
    "playbook_id": "pb_123e4567",
    "playbook_name": "Customer Onboarding",
    "period": "30d",
    "metrics": {
      "execution_stats": {
        "total_runs": 157,
        "completed_runs": 142,
        "active_runs": 8,
        "cancelled_runs": 5,
        "failed_runs": 2,
        "completion_rate": 90.4,
        "average_duration_hours": 48.5,
        "median_duration_hours": 36.0
      },
      "step_performance": [
        {
          "step_sequence": 1,
          "step_name": "Initial Contact",
          "executions": 157,
          "avg_duration_minutes": 25,
          "success_rate": 98.7,
          "bottleneck_score": 0.1
        },
        {
          "step_sequence": 2,
          "step_name": "Qualification Review",
          "executions": 155,
          "avg_duration_minutes": 180,
          "success_rate": 91.6,
          "bottleneck_score": 0.7
        },
        {
          "step_sequence": 3,
          "step_name": "Technical Assessment",
          "executions": 142,
          "avg_duration_minutes": 1440,
          "success_rate": 100,
          "bottleneck_score": 0.9
        }
      ],
      "outcome_distribution": {
        "successful_completion": 142,
        "cancelled_by_customer": 3,
        "cancelled_internal": 2,
        "failed_technical": 2,
        "in_progress": 8
      },
      "sla_compliance": {
        "target_hours": 48,
        "met_sla": 89,
        "missed_sla": 53,
        "compliance_rate": 62.7,
        "average_overrun_hours": 12.5
      },
      "user_performance": [
        {
          "user_id": "sales_rep_001",
          "steps_completed": 45,
          "avg_completion_time": 22,
          "quality_score": 95
        },
        {
          "user_id": "sales_manager_002",
          "steps_completed": 38,
          "avg_completion_time": 150,
          "quality_score": 92
        }
      ]
    }
  }
}
```

### Request - Run Analytics

**POST** `/api/v1/analytics/playbook-runs`

```bash
curl -X POST https://api.heraerp.com/api/v1/analytics/playbook-runs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "filters": {
      "date_range": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-31T23:59:59Z"
      },
      "playbook_ids": ["pb_123e4567"],
      "statuses": ["completed", "cancelled"],
      "entity_types": ["customer"]
    },
    "group_by": ["outcome", "week"],
    "metrics": ["count", "duration", "sla_compliance"]
  }'
```

## Real-World Scenarios

### Healthcare Patient Intake Workflow

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "clinic_789e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "New Patient Intake",
      "description": "Complete intake process for new patients including medical history and insurance",
      "smart_code": "HERA.HEALTHCARE.PLAYBOOK.PATIENT.INTAKE.v1",
      "type": "workflow",
      "category": "clinical",
      "version": "2.0.0",
      "metadata": {
        "compliance": ["HIPAA", "HITECH"],
        "department": "Patient Services",
        "estimated_duration_minutes": 60
      },
      "steps": [
        {
          "name": "Registration",
          "description": "Collect basic patient demographics",
          "smart_code": "HERA.HEALTHCARE.STEP.PATIENT.REGISTRATION.v1",
          "step_type": "form",
          "sequence": 1,
          "is_required": true,
          "metadata": {
            "form_fields": [
              {
                "name": "first_name",
                "type": "text",
                "required": true,
                "validation": "^[A-Za-z-]{2,50}$"
              },
              {
                "name": "last_name",
                "type": "text",
                "required": true,
                "validation": "^[A-Za-z-]{2,50}$"
              },
              {
                "name": "date_of_birth",
                "type": "date",
                "required": true,
                "max": "today"
              },
              {
                "name": "ssn",
                "type": "text",
                "required": true,
                "validation": "^\\d{3}-\\d{2}-\\d{4}$",
                "encrypted": true
              }
            ]
          }
        },
        {
          "name": "Insurance Verification",
          "description": "Verify patient insurance coverage",
          "smart_code": "HERA.HEALTHCARE.STEP.INSURANCE.VERIFICATION.v1",
          "step_type": "automated",
          "sequence": 2,
          "is_required": true,
          "automation_config": {
            "api_endpoint": "/api/v1/insurance/verify",
            "timeout_seconds": 30,
            "fallback_to_manual": true
          }
        },
        {
          "name": "Medical History",
          "description": "Collect comprehensive medical history",
          "smart_code": "HERA.HEALTHCARE.STEP.PATIENT.MEDICAL_HISTORY.v1",
          "step_type": "form",
          "sequence": 3,
          "is_required": true,
          "assignee_roles": ["nurse", "medical_assistant"],
          "metadata": {
            "sections": [
              "current_medications",
              "allergies",
              "past_surgeries",
              "family_history",
              "social_history"
            ]
          }
        },
        {
          "name": "Clinical Review",
          "description": "Provider reviews intake information",
          "smart_code": "HERA.HEALTHCARE.STEP.CLINICAL.REVIEW.v1",
          "step_type": "approval",
          "sequence": 4,
          "is_required": true,
          "assignee_roles": ["physician", "nurse_practitioner"],
          "timeout_minutes": 120
        }
      ]
    }
  }'
```

### Manufacturing Quality Control

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "factory_456e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "Product Quality Inspection",
      "description": "Multi-stage quality control process for manufactured products",
      "smart_code": "HERA.MFG.PLAYBOOK.QC.INSPECTION.v1",
      "type": "workflow",
      "category": "quality",
      "version": "3.0.0",
      "metadata": {
        "standards": ["ISO9001", "Six_Sigma"],
        "product_lines": ["automotive", "aerospace"],
        "critical_process": true
      },
      "steps": [
        {
          "name": "Visual Inspection",
          "description": "Initial visual quality check",
          "smart_code": "HERA.MFG.STEP.QC.VISUAL.v1",
          "step_type": "task",
          "sequence": 1,
          "is_required": true,
          "assignee_roles": ["qc_inspector"],
          "metadata": {
            "inspection_points": [
              "surface_finish",
              "color_consistency",
              "physical_damage",
              "labeling_accuracy"
            ],
            "rejection_criteria": {
              "max_defects": 2,
              "critical_defect_auto_fail": true
            }
          }
        },
        {
          "name": "Dimensional Verification",
          "description": "Measure critical dimensions",
          "smart_code": "HERA.MFG.STEP.QC.DIMENSIONAL.v1",
          "step_type": "task",
          "sequence": 2,
          "is_required": true,
          "assignee_roles": ["qc_technician"],
          "metadata": {
            "measurement_tools": ["caliper", "micrometer", "CMM"],
            "tolerance_specs": "drawing_rev_latest",
            "sample_size": "AQL_2.5"
          }
        },
        {
          "name": "Functional Testing",
          "description": "Test product functionality",
          "smart_code": "HERA.MFG.STEP.QC.FUNCTIONAL.v1",
          "step_type": "automated",
          "sequence": 3,
          "is_required": true,
          "parallel_allowed": true,
          "automation_config": {
            "test_station": "STATION_A7",
            "test_protocol": "FUNC_TEST_v5",
            "data_logging": true
          }
        },
        {
          "name": "QC Approval",
          "description": "Final quality approval",
          "smart_code": "HERA.MFG.STEP.QC.APPROVAL.v1",
          "step_type": "approval",
          "sequence": 4,
          "is_required": true,
          "assignee_roles": ["qc_supervisor"],
          "conditions": {
            "pre": [
              {
                "field": "total_defects",
                "operator": "<=",
                "value": 2
              }
            ]
          }
        }
      ]
    }
  }'
```

### Financial Loan Approval

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "bank_321e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "Commercial Loan Approval",
      "description": "End-to-end commercial loan approval process",
      "smart_code": "HERA.FINANCE.PLAYBOOK.LOAN.COMMERCIAL.v1",
      "type": "workflow",
      "category": "lending",
      "version": "4.2.0",
      "metadata": {
        "regulations": ["BASEL_III", "FDIC"],
        "loan_types": ["term_loan", "line_of_credit", "equipment_financing"],
        "risk_framework": "internal_v7"
      },
      "steps": [
        {
          "name": "Application Submission",
          "description": "Initial loan application and documentation",
          "smart_code": "HERA.FINANCE.STEP.LOAN.APPLICATION.v1",
          "step_type": "form",
          "sequence": 1,
          "is_required": true,
          "metadata": {
            "required_documents": [
              "financial_statements_3years",
              "tax_returns_3years",
              "business_plan",
              "collateral_documentation"
            ]
          }
        },
        {
          "name": "Credit Analysis",
          "description": "Automated credit scoring and analysis",
          "smart_code": "HERA.FINANCE.STEP.LOAN.CREDIT_ANALYSIS.v1",
          "step_type": "automated",
          "sequence": 2,
          "is_required": true,
          "automation_config": {
            "credit_bureaus": ["experian", "equifax", "dun_bradstreet"],
            "scoring_model": "commercial_v5",
            "risk_rating_threshold": 6
          }
        },
        {
          "name": "Underwriting Review",
          "description": "Manual underwriting and risk assessment",
          "smart_code": "HERA.FINANCE.STEP.LOAN.UNDERWRITING.v1",
          "step_type": "task",
          "sequence": 3,
          "is_required": true,
          "assignee_roles": ["underwriter", "senior_underwriter"],
          "metadata": {
            "review_checklist": [
              "debt_service_coverage",
              "loan_to_value",
              "cash_flow_analysis",
              "industry_risk",
              "management_assessment"
            ]
          }
        },
        {
          "name": "Committee Approval",
          "description": "Loan committee decision",
          "smart_code": "HERA.FINANCE.STEP.LOAN.COMMITTEE.v1",
          "step_type": "approval",
          "sequence": 4,
          "is_required": true,
          "conditions": {
            "pre": [
              {
                "field": "loan_amount",
                "operator": ">",
                "value": 1000000
              }
            ]
          },
          "assignee_roles": ["loan_committee"],
          "metadata": {
            "voting_threshold": 0.66,
            "committee_size": 5
          }
        }
      ]
    }
  }'
```

### IT Incident Response

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "it_654e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "Critical System Incident Response",
      "description": "Incident management for P1/P2 system failures",
      "smart_code": "HERA.IT.PLAYBOOK.INCIDENT.CRITICAL.v1",
      "type": "workflow",
      "category": "operations",
      "version": "2.1.0",
      "metadata": {
        "framework": "ITIL_v4",
        "severity_levels": ["P1", "P2"],
        "auto_escalation": true
      },
      "steps": [
        {
          "name": "Incident Detection",
          "description": "Automatic incident detection and classification",
          "smart_code": "HERA.IT.STEP.INCIDENT.DETECTION.v1",
          "step_type": "automated",
          "sequence": 1,
          "is_required": true,
          "automation_config": {
            "monitoring_systems": ["datadog", "pagerduty", "custom_alerts"],
            "classification_model": "ml_incident_classifier_v3",
            "auto_ticket_creation": true
          }
        },
        {
          "name": "Initial Response",
          "description": "First responder assessment",
          "smart_code": "HERA.IT.STEP.INCIDENT.INITIAL_RESPONSE.v1",
          "step_type": "task",
          "sequence": 2,
          "is_required": true,
          "assignee_roles": ["on_call_engineer"],
          "timeout_minutes": 15,
          "metadata": {
            "response_sla": {
              "P1": 15,
              "P2": 30
            },
            "initial_actions": [
              "assess_impact",
              "notify_stakeholders",
              "begin_troubleshooting",
              "create_war_room"
            ]
          }
        },
        {
          "name": "Resolution Implementation",
          "description": "Implement fix or workaround",
          "smart_code": "HERA.IT.STEP.INCIDENT.RESOLUTION.v1",
          "step_type": "task",
          "sequence": 3,
          "is_required": true,
          "assignee_roles": ["on_call_engineer", "subject_matter_expert"],
          "parallel_allowed": true,
          "metadata": {
            "resolution_types": ["permanent_fix", "temporary_workaround", "rollback"],
            "change_control": "emergency_cab"
          }
        },
        {
          "name": "Post-Incident Review",
          "description": "RCA and improvement planning",
          "smart_code": "HERA.IT.STEP.INCIDENT.REVIEW.v1",
          "step_type": "task",
          "sequence": 4,
          "is_required": false,
          "conditions": {
            "pre": [
              {
                "field": "severity",
                "operator": "=",
                "value": "P1"
              }
            ]
          },
          "assignee_roles": ["engineering_manager", "sre_lead"],
          "timeout_minutes": 10080,
          "metadata": {
            "review_template": "5_whys_analysis",
            "deliverables": ["rca_document", "action_items", "process_improvements"]
          }
        }
      ]
    }
  }'
```

## Edge Cases and Validation Examples

### Invalid Smart Code

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "Test Playbook",
      "smart_code": "HERA.CRM.PLAYBOOK.TEST",
      "type": "workflow"
    }
  }'
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "SMART_CODE_INVALID",
    "message": "Smart code validation failed",
    "details": {
      "field": "playbook.smart_code",
      "value": "HERA.CRM.PLAYBOOK.TEST",
      "reason": "Smart code must end with version (e.g., .v1)",
      "valid_pattern": "HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}",
      "example": "HERA.CRM.PLAYBOOK.CUSTOMER.ONBOARDING.v1"
    }
  }
}
```

### Missing Organization ID

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "playbook": {
      "name": "Test Playbook",
      "smart_code": "HERA.CRM.PLAYBOOK.TEST.v1"
    }
  }'
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_REQUIRED",
    "message": "Organization ID is required for all operations",
    "details": {
      "field": "organization_id",
      "reason": "Multi-tenant isolation requires organization context"
    }
  }
}
```

### Contract Validation Failure

```bash
curl -X POST https://api.heraerp.com/api/v1/playbook-runs/run_456e7890/steps/step_002/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "completion": {
      "outcome": "success",
      "data": {
        "approval_amount": 1500000
      }
    }
  }'
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "CONTRACT_VALIDATION_FAILED",
    "message": "Step completion violates contract conditions",
    "details": {
      "step": "step_002",
      "contract_violation": {
        "rule": "approval_limit",
        "condition": "approval_amount <= 1000000",
        "actual_value": 1500000,
        "required_role": "cfo",
        "current_role": "sales_manager"
      },
      "resolution": "User with role 'cfo' or higher must approve amounts over $1M"
    }
  }
}
```

### Policy Violation

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "Fast Track Approval",
      "smart_code": "HERA.FINANCE.PLAYBOOK.FASTTRACK.v1",
      "type": "workflow",
      "steps": [
        {
          "name": "Auto Approve",
          "smart_code": "HERA.FINANCE.STEP.AUTO_APPROVE.v1",
          "step_type": "automated",
          "sequence": 1,
          "automation_config": {
            "auto_approve_limit": 10000000
          }
        }
      ]
    }
  }'
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "POLICY_VIOLATION",
    "message": "Playbook violates organization policies",
    "details": {
      "policy": "financial_controls",
      "violation": "auto_approve_limit_exceeded",
      "max_allowed": 100000,
      "requested": 10000000,
      "policy_id": "pol_fin_controls_v2",
      "remediation": "Automated approvals cannot exceed $100,000 without manual oversight"
    }
  }
}
```

### Circular Step Dependencies

```bash
curl -X POST https://api.heraerp.com/api/v1/playbooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "playbook": {
      "name": "Circular Test",
      "smart_code": "HERA.TEST.PLAYBOOK.CIRCULAR.v1",
      "type": "workflow",
      "steps": [
        {
          "name": "Step A",
          "sequence": 1,
          "conditions": {
            "pre": [{
              "step": 2,
              "status": "completed"
            }]
          }
        },
        {
          "name": "Step B",
          "sequence": 2,
          "conditions": {
            "pre": [{
              "step": 1,
              "status": "completed"
            }]
          }
        }
      ]
    }
  }'
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "CIRCULAR_DEPENDENCY",
    "message": "Playbook contains circular step dependencies",
    "details": {
      "circular_path": [1, 2, 1],
      "steps_involved": ["Step A", "Step B"],
      "resolution": "Remove cyclic dependencies between steps"
    }
  }
}
```

## Common Headers and Authentication

### Required Headers for All Requests

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
X-Organization-ID: org_123e4567-e89b-12d3-a456-426614174000
X-Request-ID: req_unique_identifier
```

### JWT Token Claims

```json
{
  "sub": "user_123",
  "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
  "roles": ["playbook_admin", "sales_manager"],
  "permissions": [
    "playbook:create",
    "playbook:read",
    "playbook:update",
    "playbook:delete",
    "run:create",
    "run:read",
    "run:update",
    "step:complete"
  ],
  "exp": 1705330200,
  "iat": 1705322200
}
```

### Rate Limiting Headers (Response)

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1705323000
```

## Status Codes

- **200 OK** - Successful GET request
- **201 Created** - Successful resource creation
- **202 Accepted** - Request accepted for async processing
- **400 Bad Request** - Invalid request format or validation error
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., duplicate smart code)
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Service temporarily unavailable

## Best Practices

1. **Always include organization_id** - Required for multi-tenant isolation
2. **Use smart codes consistently** - Follow the pattern: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}
3. **Include metadata** - Provide rich context for better analytics and UI rendering
4. **Handle async operations** - Use webhooks or polling for long-running tasks
5. **Implement retry logic** - For network failures and 503 errors
6. **Cache playbook definitions** - They don't change frequently
7. **Use pagination** - When querying large datasets
8. **Include correlation IDs** - For debugging distributed workflows
