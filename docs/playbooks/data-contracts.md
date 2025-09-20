# HERA Playbooks Data Contracts

This document describes the comprehensive data contracts system for HERA Playbooks, including JSON Schema validation, runtime enforcement, and policy management through dynamic data storage.

## 1. Data Contracts Architecture

### 1.1 Contract Storage Pattern

All contracts are stored in `core_dynamic_data` using standardized smart codes:

```typescript
// Contract storage pattern
{
  entity_id: "playbook_or_step_id",
  field_name: "contract_type",
  field_value_text: JSON.stringify(schema),
  smart_code: "HERA.PLAYBOOK.CONTRACT.{TYPE}.{SCOPE}.V1",
  organization_id: "org_123",
  metadata: {
    version: "1.0.0",
    created_by: "system_architect",
    validated_at: "2025-01-15T10:00:00Z",
    checksum: "sha256_hash"
  }
}
```

### 1.2 Contract Types

| Contract Type | Smart Code Pattern | Purpose |
|---------------|-------------------|---------|
| **Playbook Input** | `HERA.PLAYBOOK.CONTRACT.INPUT.SCHEMA.V1` | Validate run initialization data |
| **Playbook Output** | `HERA.PLAYBOOK.CONTRACT.OUTPUT.SCHEMA.V1` | Validate final run results |
| **Step Input** | `HERA.PLAYBOOK.CONTRACT.STEP.INPUT.V1` | Validate step execution inputs |
| **Step Output** | `HERA.PLAYBOOK.CONTRACT.STEP.OUTPUT.V1` | Validate step execution outputs |
| **Policies** | `HERA.PLAYBOOK.POLICY.{TYPE}.V1` | Enforce business rules and constraints |

## 2. Playbook-Level Contracts

### 2.1 Playbook Input Contract

**Storage Pattern**: Attached to playbook definition entity

```typescript
// Stored in core_dynamic_data
{
  entity_id: "pb_grants_intake_v1",
  field_name: "input_contract",
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Grants Intake Playbook Input Contract",
    type: "object",
    required: ["organization_id", "program", "amount_requested", "applicant_name"],
    properties: {
      organization_id: {
        type: "string",
        format: "uuid",
        description: "Organization context for multi-tenant isolation"
      },
      program: {
        type: "string",
        enum: ["STEM-Youth-2025", "Healthcare-Innovation-2025", "Environment-Sustainability-2025"],
        description: "Grant program identifier"
      },
      amount_requested: {
        type: "number",
        minimum: 5000,
        maximum: 100000,
        description: "Grant amount requested in USD"
      },
      applicant_name: {
        type: "string",
        minLength: 2,
        maxLength: 100,
        pattern: "^[a-zA-Z0-9\\s\\-\\.]+$",
        description: "Legal name of applying organization"
      },
      applicant_type: {
        type: "string",
        enum: ["nonprofit", "educational", "municipal", "tribal"],
        description: "Type of applying organization"
      },
      project_title: {
        type: "string",
        minLength: 10,
        maxLength: 200,
        description: "Descriptive project title"
      },
      project_description: {
        type: "string",
        minLength: 100,
        maxLength: 5000,
        description: "Detailed project description"
      },
      project_duration_months: {
        type: "integer",
        minimum: 6,
        maximum: 36,
        description: "Project duration in months"
      },
      contact_email: {
        type: "string",
        format: "email",
        description: "Primary contact email address"
      },
      tax_id: {
        type: "string",
        pattern: "^\\d{2}-\\d{7}$",
        description: "Federal tax identification number"
      },
      established_year: {
        type: "integer",
        minimum: 1900,
        maximum: 2025,
        description: "Year organization was established"
      },
      previous_grants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            grant_id: { type: "string" },
            amount: { type: "number" },
            year: { type: "integer" },
            outcome: { type: "string", enum: ["successful", "partial", "unsuccessful"] }
          }
        },
        description: "History of previous grants received"
      },
      budget_breakdown: {
        type: "object",
        required: ["personnel", "equipment", "supplies", "indirect"],
        properties: {
          personnel: { type: "number", minimum: 0 },
          equipment: { type: "number", minimum: 0 },
          supplies: { type: "number", minimum: 0 },
          travel: { type: "number", minimum: 0 },
          indirect: { type: "number", minimum: 0 }
        },
        description: "Detailed budget breakdown by category"
      },
      letters_of_support: {
        type: "array",
        minItems: 1,
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            organization: { type: "string" },
            contact_name: { type: "string" },
            document_id: { type: "string" }
          }
        },
        description: "Letters of support from partner organizations"
      }
    },
    additionalProperties: false,
    // Custom validation rules
    allOf: [
      {
        // Budget total must equal amount requested
        properties: {
          budget_breakdown: {
            properties: {
              total_budget: {
                const: { $data: "2/amount_requested" }
              }
            }
          }
        }
      }
    ]
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.INPUT.SCHEMA.V1",
  organization_id: "org_123"
}
```

### 2.2 Playbook Output Contract

```typescript
// Stored in core_dynamic_data
{
  entity_id: "pb_grants_intake_v1",
  field_name: "output_contract",
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Grants Intake Playbook Output Contract",
    type: "object",
    required: ["application_id", "award_status", "final_score", "decision_rationale"],
    properties: {
      application_id: {
        type: "string",
        pattern: "^APP-[A-Z]+-\\d{4}-\\d{4}$",
        description: "Unique application identifier"
      },
      award_status: {
        type: "string",
        enum: ["awarded", "denied", "deferred", "withdrawn"],
        description: "Final award decision status"
      },
      award_amount: {
        type: "number",
        minimum: 0,
        maximum: 100000,
        description: "Awarded amount (0 if denied)"
      },
      final_score: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: "Final weighted score"
      },
      ai_score: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: "AI-generated proposal score"
      },
      committee_score: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: "Committee consensus score"
      },
      decision_rationale: {
        type: "string",
        minLength: 50,
        maxLength: 1000,
        description: "Detailed rationale for award decision"
      },
      conditions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            condition_type: { 
              type: "string", 
              enum: ["reporting", "compliance", "milestone", "financial"] 
            },
            description: { type: "string" },
            due_date: { type: "string", format: "date-time" }
          }
        },
        description: "Award conditions and requirements"
      },
      next_steps: {
        type: "object",
        properties: {
          grant_execution_meeting: { type: "string", format: "date-time" },
          first_report_due: { type: "string", format: "date-time" },
          funds_disbursement_date: { type: "string", format: "date-time" }
        },
        description: "Post-award next steps and timeline"
      },
      review_timeline: {
        type: "object",
        properties: {
          submitted_at: { type: "string", format: "date-time" },
          eligibility_completed_at: { type: "string", format: "date-time" },
          ai_scoring_completed_at: { type: "string", format: "date-time" },
          committee_review_completed_at: { type: "string", format: "date-time" },
          decision_made_at: { type: "string", format: "date-time" },
          total_review_hours: { type: "number", minimum: 0 }
        },
        description: "Complete review timeline and metrics"
      },
      performance_metrics: {
        type: "object",
        properties: {
          processing_cost: { type: "number", minimum: 0 },
          sla_compliance: { type: "boolean" },
          quality_score: { type: "number", minimum: 0, maximum: 100 },
          reviewer_satisfaction: { type: "number", minimum: 1, maximum: 5 }
        },
        description: "Process performance metrics"
      }
    },
    additionalProperties: false,
    // Conditional requirements
    if: {
      properties: { award_status: { const: "awarded" } }
    },
    then: {
      required: ["award_amount", "conditions", "next_steps"],
      properties: {
        award_amount: { minimum: 1 }
      }
    },
    else: {
      properties: {
        award_amount: { const: 0 }
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.OUTPUT.SCHEMA.V1",
  organization_id: "org_123"
}
```

## 3. Step-Level Contracts

### 3.1 Step Input Contracts

Each step definition has its own input/output contracts:

#### RegisterApplication Step Input Contract

```typescript
{
  entity_id: "step_register_app",
  field_name: "input_contract",
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Register Application Step Input Contract",
    type: "object",
    required: ["program", "amount_requested", "applicant_name"],
    properties: {
      // Inherits from playbook input but validates specific fields needed for this step
      program: { type: "string" },
      amount_requested: { type: "number", minimum: 5000, maximum: 100000 },
      applicant_name: { type: "string", minLength: 2, maxLength: 100 },
      applicant_type: { type: "string", enum: ["nonprofit", "educational", "municipal", "tribal"] },
      project_title: { type: "string", minLength: 10, maxLength: 200 },
      project_description: { type: "string", minLength: 100, maxLength: 5000 },
      contact_email: { type: "string", format: "email" },
      tax_id: { type: "string", pattern: "^\\d{2}-\\d{7}$" },
      budget_breakdown: {
        type: "object",
        required: ["personnel", "equipment", "supplies", "indirect"],
        properties: {
          personnel: { type: "number", minimum: 0 },
          equipment: { type: "number", minimum: 0 },
          supplies: { type: "number", minimum: 0 },
          travel: { type: "number", minimum: 0 },
          indirect: { type: "number", minimum: 0 }
        }
      }
    },
    additionalProperties: false
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.STEP.INPUT.V1",
  organization_id: "org_123"
}
```

#### RegisterApplication Step Output Contract

```typescript
{
  entity_id: "step_register_app",
  field_name: "output_contract", 
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Register Application Step Output Contract",
    type: "object",
    required: ["application_id", "applicant_profile", "proposal_summary"],
    properties: {
      application_id: {
        type: "string",
        pattern: "^APP-[A-Z]+-\\d{4}-\\d{4}$",
        description: "Generated unique application identifier"
      },
      applicant_profile: {
        type: "object",
        required: ["organization_id", "type", "established_year", "previous_grants"],
        properties: {
          organization_id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["nonprofit", "educational", "municipal", "tribal"] },
          tax_id: { type: "string", pattern: "^\\d{2}-\\d{7}$" },
          established_year: { type: "integer", minimum: 1900, maximum: 2025 },
          previous_grants: { type: "integer", minimum: 0 },
          total_previous_funding: { type: "number", minimum: 0 },
          success_rate: { type: "number", minimum: 0, maximum: 1 }
        }
      },
      proposal_summary: {
        type: "object",
        required: ["title", "description", "innovation_score"],
        properties: {
          title: { type: "string", minLength: 10, maxLength: 200 },
          description: { type: "string", minLength: 50, maxLength: 500 },
          target_beneficiaries: { type: "integer", minimum: 1 },
          duration_months: { type: "integer", minimum: 6, maximum: 36 },
          innovation_score: { type: "number", minimum: 0, maximum: 10 },
          sector: { type: "string", enum: ["education", "healthcare", "technology", "environment"] },
          keywords: { type: "array", items: { type: "string" } }
        }
      },
      documentation_status: {
        type: "object",
        required: ["application_form", "budget_details", "organizational_documents"],
        properties: {
          application_form: { type: "string", enum: ["complete", "incomplete", "missing"] },
          budget_details: { type: "string", enum: ["complete", "incomplete", "missing"] },
          organizational_documents: { type: "string", enum: ["complete", "incomplete", "missing"] },
          project_narrative: { type: "string", enum: ["complete", "incomplete", "missing"] },
          letters_of_support: { type: "integer", minimum: 0, maximum: 10 }
        }
      },
      data_quality_score: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: "Computed data quality score based on completeness and validation"
      }
    },
    additionalProperties: false
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.STEP.OUTPUT.V1",
  organization_id: "org_123"
}
```

#### EligibilityScreen Step Contracts

```typescript
// Input Contract
{
  entity_id: "step_eligibility_screen",
  field_name: "input_contract",
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Eligibility Screen Step Input Contract",
    type: "object",
    required: ["application_id", "amount_requested", "applicant_profile"],
    properties: {
      application_id: { type: "string", pattern: "^APP-[A-Z]+-\\d{4}-\\d{4}$" },
      amount_requested: { type: "number", minimum: 5000, maximum: 100000 },
      applicant_profile: {
        type: "object",
        required: ["type"],
        properties: {
          type: { type: "string", enum: ["nonprofit", "educational", "municipal", "tribal"] },
          established_year: { type: "integer" },
          previous_grants: { type: "integer" }
        }
      },
      proposal_summary: {
        type: "object",
        properties: {
          sector: { type: "string" }
        }
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.STEP.INPUT.V1"
}

// Output Contract
{
  entity_id: "step_eligibility_screen",
  field_name: "output_contract",
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Eligibility Screen Step Output Contract",
    type: "object",
    required: ["eligibility_status", "eligibility_reasons", "rules_evaluated"],
    properties: {
      eligibility_status: {
        type: "string",
        enum: ["eligible", "ineligible", "conditional"],
        description: "Final eligibility determination"
      },
      eligibility_reasons: {
        type: "array",
        minItems: 1,
        items: { type: "string" },
        description: "List of reasons supporting eligibility decision"
      },
      next_steps: {
        type: "string",
        enum: ["proceed_to_scoring", "reject_application", "request_additional_info"],
        description: "Recommended next action"
      },
      rules_evaluated: {
        type: "object",
        properties: {
          amount_limits: {
            type: "object",
            properties: {
              passed: { type: "boolean" },
              value: { type: "number" },
              min_threshold: { type: "number" },
              max_threshold: { type: "number" }
            }
          },
          organization_type: {
            type: "object", 
            properties: {
              passed: { type: "boolean" },
              value: { type: "string" },
              allowed: { type: "array", items: { type: "string" } }
            }
          },
          sector: {
            type: "object",
            properties: {
              passed: { type: "boolean" },
              value: { type: "string" },
              allowed: { type: "array", items: { type: "string" } }
            }
          }
        }
      },
      screening_confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence in eligibility determination"
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.STEP.OUTPUT.V1"
}
```

#### ScoreProposal Step Contracts

```typescript
// AI Scoring Input Contract
{
  entity_id: "step_score_proposal",
  field_name: "input_contract",
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Score Proposal Step Input Contract",
    type: "object",
    required: ["application_id", "proposal_summary", "budget_breakdown"],
    properties: {
      application_id: { type: "string", pattern: "^APP-[A-Z]+-\\d{4}-\\d{4}$" },
      proposal_summary: {
        type: "object",
        required: ["title", "description", "innovation_score"],
        properties: {
          title: { type: "string" },
          description: { type: "string", minLength: 100 },
          innovation_score: { type: "number", minimum: 0, maximum: 10 },
          sector: { type: "string" },
          target_beneficiaries: { type: "integer", minimum: 1 }
        }
      },
      budget_breakdown: {
        type: "object",
        required: ["personnel", "equipment", "supplies", "indirect"],
        properties: {
          personnel: { type: "number", minimum: 0 },
          equipment: { type: "number", minimum: 0 },
          supplies: { type: "number", minimum: 0 },
          travel: { type: "number", minimum: 0 },
          indirect: { type: "number", minimum: 0 }
        }
      },
      applicant_profile: {
        type: "object",
        properties: {
          previous_grants: { type: "integer" },
          success_rate: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.STEP.INPUT.V1"
}

// AI Scoring Output Contract
{
  entity_id: "step_score_proposal",
  field_name: "output_contract",
  field_value_text: JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Score Proposal Step Output Contract",
    type: "object",
    required: ["total_score", "criteria_scores", "ai_rationale"],
    properties: {
      total_score: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: "Final weighted total score"
      },
      criteria_scores: {
        type: "object",
        required: ["innovation", "impact", "feasibility", "budget", "sustainability"],
        properties: {
          innovation: {
            type: "object",
            required: ["score", "weight", "weighted"],
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              weight: { type: "number", minimum: 0, maximum: 1 },
              weighted: { type: "number", minimum: 0, maximum: 100 }
            }
          },
          impact: {
            type: "object",
            required: ["score", "weight", "weighted"],
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              weight: { type: "number", minimum: 0, maximum: 1 },
              weighted: { type: "number", minimum: 0, maximum: 100 }
            }
          },
          feasibility: {
            type: "object",
            required: ["score", "weight", "weighted"],
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              weight: { type: "number", minimum: 0, maximum: 1 },
              weighted: { type: "number", minimum: 0, maximum: 100 }
            }
          },
          budget: {
            type: "object",
            required: ["score", "weight", "weighted"],
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              weight: { type: "number", minimum: 0, maximum: 1 },
              weighted: { type: "number", minimum: 0, maximum: 100 }
            }
          },
          sustainability: {
            type: "object",
            required: ["score", "weight", "weighted"],
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              weight: { type: "number", minimum: 0, maximum: 1 },
              weighted: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        },
        additionalProperties: false
      },
      ai_rationale: {
        type: "string",
        minLength: 100,
        maxLength: 2000,
        description: "Detailed AI explanation of scoring rationale"
      },
      risk_assessment: {
        type: "object",
        required: ["technical_risk", "financial_risk", "timeline_risk"],
        properties: {
          technical_risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
          financial_risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
          timeline_risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
          sustainability_risk: { type: "string", enum: ["low", "medium", "high", "critical"] }
        }
      },
      recommendations: {
        type: "array",
        items: { type: "string" },
        description: "AI-generated recommendations for improvement"
      },
      model_metadata: {
        type: "object",
        required: ["model_version", "confidence_score"],
        properties: {
          model_version: { type: "string" },
          confidence_score: { type: "number", minimum: 0, maximum: 1 },
          processing_time_ms: { type: "number", minimum: 0 },
          token_usage: {
            type: "object",
            properties: {
              prompt: { type: "integer", minimum: 0 },
              completion: { type: "integer", minimum: 0 },
              total: { type: "integer", minimum: 0 }
            }
          }
        }
      }
    },
    additionalProperties: false
  }),
  smart_code: "HERA.PLAYBOOK.CONTRACT.STEP.OUTPUT.V1"
}
```

## 4. Policy Contracts

### 4.1 SLA Policy

```typescript
{
  entity_id: "pb_grants_intake_v1",
  field_name: "sla_policy",
  field_value_text: JSON.stringify({
    policy_type: "sla",
    version: "1.0.0",
    effective_date: "2025-01-01T00:00:00Z",
    rules: {
      playbook_sla: {
        total_duration_hours: 72,
        business_hours_only: true,
        escalation_thresholds: [
          { threshold_hours: 48, action: "notify_supervisor" },
          { threshold_hours: 60, action: "escalate_to_manager" },
          { threshold_hours: 72, action: "breach_notification" }
        ]
      },
      step_slas: {
        "RegisterApplication": {
          duration_hours: 2,
          business_hours_only: false,
          critical: false
        },
        "EligibilityScreen": {
          duration_minutes: 5,
          business_hours_only: false,
          critical: true
        },
        "ScoreProposal": {
          duration_minutes: 30,
          business_hours_only: false,
          critical: true
        },
        "CommitteeReview": {
          duration_hours: 48,
          business_hours_only: true,
          critical: false,
          quorum_required: true
        },
        "AwardDecision": {
          duration_minutes: 15,
          business_hours_only: false,
          critical: true
        }
      },
      monitoring: {
        check_interval_minutes: 15,
        notification_channels: ["email", "slack", "dashboard"],
        metrics_retention_days: 365
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.POLICY.SLA.V1",
  organization_id: "org_123"
}
```

### 4.2 Retry Policy

```typescript
{
  entity_id: "pb_grants_intake_v1",
  field_name: "retry_policy",
  field_value_text: JSON.stringify({
    policy_type: "retry",
    version: "1.0.0",
    effective_date: "2025-01-01T00:00:00Z",
    rules: {
      default_retry: {
        max_attempts: 3,
        backoff_strategy: "exponential",
        initial_delay_seconds: 60,
        max_delay_seconds: 3600,
        jitter: true
      },
      step_specific_retry: {
        "EligibilityScreen": {
          max_attempts: 5,
          backoff_strategy: "linear",
          delay_seconds: 30,
          retry_on_errors: ["timeout", "service_unavailable", "rate_limit"]
        },
        "ScoreProposal": {
          max_attempts: 2,
          backoff_strategy: "exponential",
          initial_delay_seconds: 300,
          retry_on_errors: ["model_timeout", "insufficient_confidence"],
          escalate_after_max_attempts: true
        },
        "AwardDecision": {
          max_attempts: 1,
          no_retry_on_errors: ["validation_error", "business_rule_violation"],
          manual_intervention_required: true
        }
      },
      error_handling: {
        log_all_attempts: true,
        notify_on_max_attempts: true,
        create_incident_ticket: true,
        preserve_context: true
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.POLICY.RETRY.V1",
  organization_id: "org_123"
}
```

### 4.3 Quorum Policy

```typescript
{
  entity_id: "pb_grants_intake_v1",
  field_name: "quorum_policy",
  field_value_text: JSON.stringify({
    policy_type: "quorum",
    version: "1.0.0",
    effective_date: "2025-01-01T00:00:00Z",
    rules: {
      committee_review: {
        minimum_voters: 3,
        maximum_voters: 7,
        voting_window_hours: 48,
        consensus_threshold: 0.67, // 67% agreement required
        conflict_resolution: {
          tie_breaking_method: "senior_member",
          escalation_required: true,
          additional_review_if_split: true
        },
        voter_qualification: {
          required_roles: ["committee_member"],
          conflict_of_interest_check: true,
          expertise_matching: true
        }
      },
      approval_thresholds: {
        low_risk: {
          amount_ceiling: 25000,
          required_approvers: 2,
          approval_level: "manager"
        },
        medium_risk: {
          amount_ceiling: 75000,
          required_approvers: 3,
          approval_level: "director"
        },
        high_risk: {
          amount_ceiling: 100000,
          required_approvers: 5,
          approval_level: "executive",
          additional_review_required: true
        }
      },
      delegation: {
        temporary_delegation_allowed: true,
        delegation_duration_hours: 72,
        delegation_approval_required: true,
        audit_trail_required: true
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.POLICY.QUORUM.V1",
  organization_id: "org_123"
}
```

### 4.4 Segregation of Duties Policy

```typescript
{
  entity_id: "pb_grants_intake_v1", 
  field_name: "segregation_policy",
  field_value_text: JSON.stringify({
    policy_type: "segregation_of_duties",
    version: "1.0.0",
    effective_date: "2025-01-01T00:00:00Z",
    rules: {
      role_separation: {
        "RegisterApplication": {
          allowed_roles: ["intake_specialist", "grants_coordinator"],
          prohibited_combinations: [
            ["applicant_representative", "intake_specialist"],
            ["committee_member", "intake_specialist"]
          ]
        },
        "ScoreProposal": {
          allowed_roles: ["ai_system"],
          human_override_roles: ["scoring_supervisor", "grants_director"],
          audit_required: true
        },
        "CommitteeReview": {
          allowed_roles: ["committee_member"],
          minimum_role_diversity: 2,
          prohibited_combinations: [
            ["applicant_representative", "committee_member"],
            ["scoring_supervisor", "committee_member"]
          ]
        },
        "AwardDecision": {
          allowed_roles: ["system", "grants_director"],
          requires_different_user_from: ["RegisterApplication", "CommitteeReview"],
          approval_chain_required: true
        }
      },
      conflict_detection: {
        relationship_checks: {
          financial_interest: "prohibited",
          family_relationship: "prohibited", 
          business_partnership: "prohibited",
          employment_history: "review_required"
        },
        geographic_conflicts: {
          same_region_bonus_review: true,
          local_knowledge_advantage_flag: true
        },
        expertise_conflicts: {
          competing_research_area: "review_required",
          intellectual_property_conflict: "prohibited"
        }
      },
      monitoring: {
        real_time_checking: true,
        violation_alerts: ["immediate", "daily_summary"],
        audit_frequency: "quarterly",
        compliance_reporting: true
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.POLICY.SEGREGATION.V1",
  organization_id: "org_123"
}
```

### 4.5 Approval Thresholds Policy

```typescript
{
  entity_id: "pb_grants_intake_v1",
  field_name: "approval_policy",
  field_value_text: JSON.stringify({
    policy_type: "approval_thresholds",
    version: "1.0.0",
    effective_date: "2025-01-01T00:00:00Z",
    rules: {
      amount_based_approval: {
        tier_1: {
          min_amount: 0,
          max_amount: 10000,
          required_approvals: 1,
          approval_roles: ["program_manager"],
          auto_approval_if_score_above: 90,
          expedited_processing: true
        },
        tier_2: {
          min_amount: 10001,
          max_amount: 50000,
          required_approvals: 2,
          approval_roles: ["program_manager", "grants_director"],
          committee_review_required: true,
          ai_score_weight: 0.4,
          committee_score_weight: 0.6
        },
        tier_3: {
          min_amount: 50001,
          max_amount: 100000,
          required_approvals: 3,
          approval_roles: ["program_manager", "grants_director", "executive_director"],
          enhanced_due_diligence: true,
          external_review_option: true,
          board_notification_required: true
        }
      },
      risk_based_approval: {
        low_risk: {
          criteria: {
            ai_confidence: { min: 0.85 },
            applicant_history: { min_previous_grants: 2, min_success_rate: 0.8 },
            proposal_clarity: { min_score: 80 }
          },
          approval_fast_track: true,
          reduced_documentation: true
        },
        medium_risk: {
          criteria: {
            ai_confidence: { min: 0.7, max: 0.84 },
            proposal_clarity: { min_score: 60 }
          },
          standard_process: true,
          additional_review_points: 2
        },
        high_risk: {
          criteria: {
            ai_confidence: { max: 0.69 },
            new_applicant: true,
            innovative_but_unproven: true
          },
          enhanced_review: true,
          expert_consultation_required: true,
          pilot_funding_consideration: true
        }
      },
      special_circumstances: {
        emergency_expedited: {
          criteria: ["natural_disaster", "public_health_emergency", "critical_infrastructure"],
          approval_timeline_hours: 24,
          reduced_documentation_allowed: true,
          post_award_verification_required: true
        },
        strategic_priority: {
          criteria: ["government_mandate", "board_priority", "matching_funds_deadline"],
          enhanced_approval_authority: true,
          expedited_committee_process: true
        },
        resubmission: {
          previous_application_required: true,
          improvement_documentation_required: true,
          original_reviewer_input_preferred: true,
          accelerated_process_if_minor_changes: true
        }
      }
    }
  }),
  smart_code: "HERA.PLAYBOOK.POLICY.APPROVAL.V1",
  organization_id: "org_123"
}
```

## 5. Runtime Contract Validation

### 5.1 Validation Service Implementation

```typescript
// Contract validation service
export class ContractValidationService {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: false,
      addUsedSchema: false
    });
    
    // Add custom formats
    addFormats(this.ajv);
    
    // Add custom keywords for business logic
    this.ajv.addKeyword({
      keyword: "businessRule",
      type: "object",
      compile: this.compileBusinessRule.bind(this)
    });
  }

  /**
   * Validate data against contract schema
   */
  async validateContract(
    entityId: string,
    contractType: 'input' | 'output',
    data: any,
    organizationId: string
  ): Promise<ValidationResult> {
    try {
      // Get contract from dynamic data
      const contract = await this.getContract(entityId, contractType, organizationId);
      
      if (!contract) {
        return {
          valid: false,
          errors: [{ message: `No ${contractType} contract found for entity ${entityId}` }]
        };
      }

      // Parse schema
      const schema = JSON.parse(contract.field_value_text);
      
      // Validate against schema
      const validate = this.ajv.compile(schema);
      const valid = validate(data);
      
      if (valid) {
        return {
          valid: true,
          validatedData: data,
          contractVersion: contract.metadata?.version,
          validatedAt: new Date().toISOString()
        };
      } else {
        return {
          valid: false,
          errors: validate.errors?.map(error => ({
            path: error.instancePath,
            message: error.message || 'Validation error',
            value: error.data,
            schema: error.schema
          })) || [],
          contractVersion: contract.metadata?.version
        };
      }
      
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: `Contract validation failed: ${error.message}` }]
      };
    }
  }

  /**
   * Validate policy compliance
   */
  async validatePolicy(
    playbookId: string,
    policyType: string,
    context: any,
    organizationId: string
  ): Promise<PolicyValidationResult> {
    try {
      const policy = await this.getPolicy(playbookId, policyType, organizationId);
      
      if (!policy) {
        return {
          compliant: true, // No policy means no restrictions
          message: `No ${policyType} policy defined`
        };
      }

      const policyRules = JSON.parse(policy.field_value_text);
      
      // Validate based on policy type
      switch (policyType) {
        case 'sla':
          return this.validateSLAPolicy(policyRules, context);
        case 'retry':
          return this.validateRetryPolicy(policyRules, context);
        case 'quorum':
          return this.validateQuorumPolicy(policyRules, context);
        case 'segregation':
          return this.validateSegregationPolicy(policyRules, context);
        case 'approval':
          return this.validateApprovalPolicy(policyRules, context);
        default:
          return {
            compliant: false,
            message: `Unknown policy type: ${policyType}`
          };
      }
      
    } catch (error) {
      return {
        compliant: false,
        message: `Policy validation failed: ${error.message}`
      };
    }
  }

  private async getContract(
    entityId: string,
    contractType: string,
    organizationId: string
  ): Promise<any> {
    const fieldName = `${contractType}_contract`;
    
    return await universalApi.getDynamicField(entityId, fieldName, organizationId);
  }

  private async getPolicy(
    playbookId: string,
    policyType: string,
    organizationId: string
  ): Promise<any> {
    const fieldName = `${policyType}_policy`;
    
    return await universalApi.getDynamicField(playbookId, fieldName, organizationId);
  }

  private validateSLAPolicy(policy: any, context: any): PolicyValidationResult {
    const { stepName, startTime, currentTime } = context;
    const stepSLA = policy.rules.step_slas[stepName];
    
    if (!stepSLA) {
      return { compliant: true, message: "No SLA defined for step" };
    }

    const elapsedMs = new Date(currentTime).getTime() - new Date(startTime).getTime();
    const elapsedMinutes = elapsedMs / (1000 * 60);
    
    let allowedMinutes: number;
    if (stepSLA.duration_hours) {
      allowedMinutes = stepSLA.duration_hours * 60;
    } else if (stepSLA.duration_minutes) {
      allowedMinutes = stepSLA.duration_minutes;
    } else {
      return { compliant: true, message: "No time limit defined" };
    }

    const compliant = elapsedMinutes <= allowedMinutes;
    
    return {
      compliant,
      message: compliant 
        ? `Step within SLA (${elapsedMinutes.toFixed(1)}/${allowedMinutes} minutes)`
        : `Step exceeds SLA (${elapsedMinutes.toFixed(1)}/${allowedMinutes} minutes)`,
      metrics: {
        elapsed_minutes: elapsedMinutes,
        allowed_minutes: allowedMinutes,
        compliance_percentage: (allowedMinutes / elapsedMinutes) * 100
      }
    };
  }

  private validateQuorumPolicy(policy: any, context: any): PolicyValidationResult {
    const { stepName, voters, votingWindowStart } = context;
    
    if (stepName !== 'CommitteeReview') {
      return { compliant: true, message: "Quorum policy not applicable" };
    }

    const quorumRules = policy.rules.committee_review;
    const voterCount = voters?.length || 0;
    
    // Check minimum voters
    if (voterCount < quorumRules.minimum_voters) {
      return {
        compliant: false,
        message: `Insufficient voters: ${voterCount}/${quorumRules.minimum_voters} required`
      };
    }

    // Check voting window
    const elapsedHours = (Date.now() - new Date(votingWindowStart).getTime()) / (1000 * 60 * 60);
    if (elapsedHours > quorumRules.voting_window_hours) {
      return {
        compliant: false,
        message: `Voting window expired: ${elapsedHours.toFixed(1)}/${quorumRules.voting_window_hours} hours`
      };
    }

    return {
      compliant: true,
      message: `Quorum requirements met: ${voterCount} voters within ${elapsedHours.toFixed(1)} hours`
    };
  }

  // Additional policy validation methods...
  
  private compileBusinessRule(schema: any): (data: any) => boolean {
    return (data: any) => {
      // Custom business rule validation logic
      return true;
    };
  }
}

// Type definitions
interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path?: string;
    message: string;
    value?: any;
    schema?: any;
  }>;
  validatedData?: any;
  contractVersion?: string;
  validatedAt?: string;
}

interface PolicyValidationResult {
  compliant: boolean;
  message: string;
  metrics?: Record<string, any>;
  recommendations?: string[];
}
```

### 5.2 Orchestrator Integration

```typescript
// Enhanced orchestrator with contract validation
export class ContractAwareOrchestrator extends PlaybookOrchestrator {
  private validationService: ContractValidationService;

  constructor(organizationId: string) {
    super(organizationId);
    this.validationService = new ContractValidationService();
  }

  /**
   * Execute step with input/output contract validation
   */
  protected async executeStepWithValidation(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    const startTime = Date.now();

    try {
      // 1. Validate input contract
      const inputValidation = await this.validationService.validateContract(
        stepDef.id,
        'input',
        inputs,
        this.organizationId
      );

      if (!inputValidation.valid) {
        return {
          status: 'failed',
          error: `Input validation failed: ${inputValidation.errors?.map(e => e.message).join(', ')}`,
          duration_ms: Date.now() - startTime,
          ai_confidence: 0.1,
          ai_insights: 'Step failed due to input contract validation errors'
        };
      }

      // 2. Validate applicable policies
      const policyChecks = await this.validatePolicies(stepDef, inputs);
      
      if (!policyChecks.every(check => check.compliant)) {
        const violations = policyChecks.filter(check => !check.compliant);
        return {
          status: 'failed',
          error: `Policy violations: ${violations.map(v => v.message).join(', ')}`,
          duration_ms: Date.now() - startTime,
          ai_confidence: 0.1,
          ai_insights: 'Step blocked by policy violations'
        };
      }

      // 3. Execute step logic
      const result = await super.executeStep(runId, stepId, stepDef, inputValidation.validatedData);

      if (result.status === 'completed' && result.outputs) {
        // 4. Validate output contract
        const outputValidation = await this.validationService.validateContract(
          stepDef.id,
          'output',
          result.outputs,
          this.organizationId
        );

        if (!outputValidation.valid) {
          return {
            status: 'failed',
            error: `Output validation failed: ${outputValidation.errors?.map(e => e.message).join(', ')}`,
            duration_ms: result.duration_ms,
            ai_confidence: 0.2,
            ai_insights: 'Step execution successful but output contract validation failed'
          };
        }

        // Update result with validated outputs
        result.outputs = outputValidation.validatedData;
        result.contract_compliance = {
          input_validation: inputValidation,
          output_validation: outputValidation,
          policy_checks: policyChecks
        };
      }

      return result;

    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.1,
        ai_insights: `Contract validation error: ${error.message}`
      };
    }
  }

  private async validatePolicies(stepDef: any, context: any): Promise<PolicyValidationResult[]> {
    const playbookId = stepDef.metadata.playbook_id;
    const results: PolicyValidationResult[] = [];

    // Check SLA policy
    const slaResult = await this.validationService.validatePolicy(
      playbookId,
      'sla',
      {
        stepName: stepDef.metadata.step_name,
        startTime: context.step_started_at || new Date().toISOString(),
        currentTime: new Date().toISOString()
      },
      this.organizationId
    );
    results.push(slaResult);

    // Check quorum policy (if applicable)
    if (stepDef.metadata.worker_type === 'human' && stepDef.metadata.step_name === 'CommitteeReview') {
      const quorumResult = await this.validationService.validatePolicy(
        playbookId,
        'quorum',
        {
          stepName: stepDef.metadata.step_name,
          voters: context.voters || [],
          votingWindowStart: context.voting_started_at
        },
        this.organizationId
      );
      results.push(quorumResult);
    }

    // Check segregation policy
    const segregationResult = await this.validationService.validatePolicy(
      playbookId,
      'segregation',
      {
        stepName: stepDef.metadata.step_name,
        currentUser: context.current_user,
        previousStepUsers: context.previous_step_users || []
      },
      this.organizationId
    );
    results.push(segregationResult);

    return results;
  }
}
```

## 6. Benefits of Data Contracts

### 6.1 Runtime Safety
- **Input Validation**: Prevents invalid data from entering steps
- **Output Validation**: Ensures consistent data quality across workflow
- **Type Safety**: JSON Schema provides compile-time and runtime type checking
- **Business Rules**: Custom validation for domain-specific requirements

### 6.2 Policy Enforcement
- **SLA Compliance**: Automatic monitoring and alerting for time violations
- **Quorum Requirements**: Ensures proper governance and decision-making
- **Segregation of Duties**: Prevents conflicts of interest and fraud
- **Approval Thresholds**: Enforces proper authorization levels

### 6.3 API Evolution
- **Backward Compatibility**: Schema versioning allows gradual migration
- **Breaking Change Detection**: Automated validation of schema changes
- **Documentation**: Self-documenting APIs through schema definitions
- **Client Generation**: Automatic client code generation from contracts

### 6.4 Compliance & Audit
- **Regulatory Compliance**: Ensures adherence to government regulations
- **Audit Trail**: Complete record of contract validation and policy enforcement
- **Quality Assurance**: Consistent data quality across all workflows
- **Risk Management**: Proactive identification of compliance violations

## 7. Implementation Notes

### 7.1 Performance Considerations
- **Schema Caching**: Cache compiled schemas to avoid repeated parsing
- **Lazy Loading**: Load contracts only when needed for validation
- **Batch Validation**: Validate multiple items in single operation
- **Async Validation**: Non-blocking validation for better user experience

### 7.2 Error Handling
- **Graceful Degradation**: Continue operation with warnings when possible
- **Detailed Error Messages**: Provide actionable feedback for validation failures
- **Error Recovery**: Automatic retry with corrected data when feasible
- **Escalation Procedures**: Clear escalation path for policy violations

### 7.3 Monitoring & Metrics
- **Contract Compliance Rate**: Track percentage of successful validations
- **Policy Violation Frequency**: Monitor policy compliance trends
- **Performance Metrics**: Track validation latency and throughput
- **Business Impact**: Measure quality improvements from contract enforcement

The data contracts system transforms HERA Playbooks into a bulletproof, policy-aware workflow engine that ensures data quality, regulatory compliance, and business rule enforcement while maintaining the flexibility of the universal 6-table architecture.