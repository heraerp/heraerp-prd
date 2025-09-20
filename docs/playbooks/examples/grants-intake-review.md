# GRANTS Intake & Review Example

This document demonstrates a complete end-to-end example of HERA Playbooks in action, showing how a public sector grants intake and review process maps to HERA's 6 sacred tables and executes through the orchestration engine.

## 1. Playbook Definition

### Industry Context: PUBLICSECTOR.GRANTS

**Smart Code**: `HERA.PUBLICSECTOR.PLAYBOOK.DEF.GRANTSINTAKE.V1`

```typescript
// Playbook stored in core_entities
{
  id: "pb_grants_intake_v1",
  entity_type: "playbook_definition",
  entity_name: "Grants Intake & Review",
  entity_code: "PLAYBOOK-GRANTS-INTAKE",
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.DEF.GRANTSINTAKE.V1",
  organization_id: "org_123",
  metadata: {
    status: "published",
    version: "V1",
    industry: "PUBLICSECTOR",
    module: "GRANTS",
    owner: "grants_program_manager",
    description: "Complete grants intake, screening, scoring, review, and award decision process",
    input_schema: {
      program: { type: "string", required: true },
      amount_requested: { type: "number", required: true },
      applicant_id: { type: "string", required: false },
      deadline: { type: "string", format: "date", required: false }
    },
    output_schema: {
      application_id: { type: "string" },
      award_status: { type: "string", enum: ["awarded", "denied", "deferred"] },
      award_amount: { type: "number" },
      decision_rationale: { type: "string" }
    },
    sla_hours: 72,
    estimated_cost: 45.00,
    success_rate: 0.94
  },
  ai_confidence: 0.91,
  ai_insights: "Well-structured grants process with clear decision points. Success rate above industry average (82%). Consider parallel processing for steps 2-3 to reduce timeline by 8 hours."
}
```

### Extended Properties (core_dynamic_data)
```typescript
[
  {
    entity_id: "pb_grants_intake_v1",
    field_name: "eligibility_rules",
    field_value_text: JSON.stringify({
      min_amount: 5000,
      max_amount: 100000,
      eligible_sectors: ["education", "healthcare", "technology", "environment"],
      geographic_restrictions: ["state_residents_only"],
      organization_types: ["nonprofit", "educational", "municipal"]
    }),
    smart_code: "HERA.PUBLICSECTOR.GRANTS.CONFIG.ELIGIBILITY.V1"
  },
  {
    entity_id: "pb_grants_intake_v1", 
    field_name: "scoring_criteria",
    field_value_text: JSON.stringify({
      innovation: { weight: 0.25, max_score: 100 },
      impact: { weight: 0.30, max_score: 100 },
      feasibility: { weight: 0.20, max_score: 100 },
      budget: { weight: 0.15, max_score: 100 },
      sustainability: { weight: 0.10, max_score: 100 }
    }),
    smart_code: "HERA.PUBLICSECTOR.GRANTS.CONFIG.SCORING.V1"
  },
  {
    entity_id: "pb_grants_intake_v1",
    field_name: "committee_config",
    field_value_text: JSON.stringify({
      required_votes: 3,
      minimum_score_threshold: 70,
      conflict_of_interest_checks: true,
      voting_window_hours: 48
    }),
    smart_code: "HERA.PUBLICSECTOR.GRANTS.CONFIG.COMMITTEE.V1"
  }
]
```

## 2. Step Definitions

Each step is stored as a `core_entities` row linked to the playbook via relationships:

### Step 1: RegisterApplication (Human)
```typescript
{
  id: "step_register_app",
  entity_type: "playbook_step_definition",
  entity_name: "Register Application", 
  entity_code: "STEP-GRANTS-REGISTER",
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.DEF.GRANTSINTAKE.REGISTER.V1",
  organization_id: "org_123",
  metadata: {
    playbook_id: "pb_grants_intake_v1",
    sequence: 1,
    worker_type: "human",
    description: "Capture applicant information and grant proposal details",
    required_inputs: ["program", "amount_requested"],
    expected_outputs: ["application_id", "applicant_profile", "proposal_summary"],
    permissions_required: ["grants:application:create"],
    sla_seconds: 3600, // 1 hour
    estimated_duration_seconds: 1800 // 30 minutes
  },
  ai_confidence: 0.95,
  ai_insights: "High-confidence step with clear data collection requirements. Historical completion rate: 98.5%"
}
```

### Step 2: EligibilityScreen (System)
```typescript
{
  id: "step_eligibility_screen",
  entity_type: "playbook_step_definition",
  entity_name: "Eligibility Screen",
  entity_code: "STEP-GRANTS-ELIGIBILITY", 
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.DEF.GRANTSINTAKE.ELIGIBILITY.V1",
  organization_id: "org_123",
  metadata: {
    playbook_id: "pb_grants_intake_v1",
    sequence: 2,
    worker_type: "system",
    description: "Automated eligibility screening using rules engine",
    required_inputs: ["application_id", "amount_requested", "applicant_profile"],
    expected_outputs: ["eligibility_status", "eligibility_reasons", "next_steps"],
    rules_engine_config: "eligibility_rules", // References dynamic data
    auto_advance: true,
    estimated_duration_seconds: 60 // 1 minute
  },
  ai_confidence: 0.89,
  ai_insights: "Rules-based automation with 12% rejection rate. Common rejections: amount limits (45%), geographic restrictions (32%), organization type (23%)"
}
```

### Step 3: ScoreProposal (AI)
```typescript
{
  id: "step_score_proposal",
  entity_type: "playbook_step_definition", 
  entity_name: "Score Proposal",
  entity_code: "STEP-GRANTS-SCORING",
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.DEF.GRANTSINTAKE.SCORE.V1",
  organization_id: "org_123", 
  metadata: {
    playbook_id: "pb_grants_intake_v1",
    sequence: 3,
    worker_type: "ai",
    description: "AI model analyzes proposal and returns score with detailed rationale",
    required_inputs: ["application_id", "proposal_summary", "budget_details"],
    expected_outputs: ["total_score", "criteria_scores", "ai_rationale", "risk_assessment"],
    ai_model: "grants-scoring-v2.1",
    scoring_criteria_config: "scoring_criteria", // References dynamic data
    confidence_threshold: 0.75,
    estimated_duration_seconds: 300 // 5 minutes
  },
  ai_confidence: 0.82,
  ai_insights: "AI scoring shows 87% correlation with final committee decisions. Model confidence typically ranges 0.72-0.94. Low confidence cases (<0.75) flagged for enhanced human review."
}
```

### Step 4: CommitteeReview (Human)
```typescript
{
  id: "step_committee_review",
  entity_type: "playbook_step_definition",
  entity_name: "Committee Review",
  entity_code: "STEP-GRANTS-COMMITTEE",
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.DEF.GRANTSINTAKE.COMMITTEE.V1", 
  organization_id: "org_123",
  metadata: {
    playbook_id: "pb_grants_intake_v1",
    sequence: 4,
    worker_type: "human",
    description: "Committee members review proposal and AI analysis, cast votes",
    required_inputs: ["application_id", "total_score", "ai_rationale"],
    expected_outputs: ["committee_votes", "consensus_score", "review_notes"],
    permissions_required: ["grants:committee:vote"],
    committee_config: "committee_config", // References dynamic data
    sla_seconds: 172800, // 48 hours
    estimated_duration_seconds: 7200 // 2 hours
  },
  ai_confidence: 0.76,
  ai_insights: "Committee review is the most variable step (CV: 0.34). 18% of applications receive split votes requiring additional discussion. AI score correlation with committee score: 0.87"
}
```

### Step 5: AwardDecision (System)
```typescript
{
  id: "step_award_decision",
  entity_type: "playbook_step_definition",
  entity_name: "Award Decision",
  entity_code: "STEP-GRANTS-DECISION",
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.DEF.GRANTSINTAKE.DECISION.V1",
  organization_id: "org_123",
  metadata: {
    playbook_id: "pb_grants_intake_v1", 
    sequence: 5,
    worker_type: "system",
    description: "Consolidate scoring and votes, make final award decision, send notifications",
    required_inputs: ["application_id", "consensus_score", "committee_votes"],
    expected_outputs: ["award_status", "award_amount", "decision_rationale", "notification_sent"],
    decision_logic: "weighted_average", // AI: 40%, Committee: 60%
    notification_templates: "award_notifications",
    auto_advance: true,
    estimated_duration_seconds: 180 // 3 minutes
  },
  ai_confidence: 0.94,
  ai_insights: "Highly reliable final step with deterministic decision logic. 99.2% successful completion rate. Average processing time: 2.3 minutes."
}
```

## 3. Step Relationships

Each step is linked to the playbook via `core_relationships`:

```typescript
[
  {
    from_entity_id: "pb_grants_intake_v1",
    to_entity_id: "step_register_app", 
    relationship_type: "playbook_has_step",
    smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.HAS_STEP.V1",
    organization_id: "org_123",
    metadata: { sequence: 1 }
  },
  {
    from_entity_id: "pb_grants_intake_v1",
    to_entity_id: "step_eligibility_screen",
    relationship_type: "playbook_has_step", 
    smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.HAS_STEP.V1",
    organization_id: "org_123",
    metadata: { sequence: 2 }
  },
  {
    from_entity_id: "pb_grants_intake_v1",
    to_entity_id: "step_score_proposal",
    relationship_type: "playbook_has_step",
    smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.HAS_STEP.V1", 
    organization_id: "org_123",
    metadata: { sequence: 3 }
  },
  {
    from_entity_id: "pb_grants_intake_v1",
    to_entity_id: "step_committee_review",
    relationship_type: "playbook_has_step",
    smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.HAS_STEP.V1",
    organization_id: "org_123", 
    metadata: { sequence: 4 }
  },
  {
    from_entity_id: "pb_grants_intake_v1",
    to_entity_id: "step_award_decision",
    relationship_type: "playbook_has_step",
    smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.HAS_STEP.V1",
    organization_id: "org_123",
    metadata: { sequence: 5 }
  }
]
```

## 4. Sample Run Execution

### 4.1 Start Run Request

```json
{
  "organization_id": "org_123",
  "playbook_id": "pb_grants_intake_v1", 
  "subject_entity_id": "entity_grant_app_456",
  "inputs": {
    "program": "STEM-Youth-2025",
    "amount_requested": 50000,
    "applicant_name": "Metro Science Academy",
    "applicant_type": "educational",
    "project_title": "AI-Powered STEM Learning Lab",
    "project_duration_months": 24
  },
  "correlation_id": "corr-grants-2025-001",
  "priority": "normal"
}
```

### 4.2 Run Transaction Creation

This creates a `universal_transactions` header:

```typescript
{
  id: "run_grants_abc123",
  transaction_type: "playbook_run",
  transaction_code: "GRANTS-RUN-2025-001",
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.RUN.GRANTSINTAKE.V1",
  organization_id: "org_123",
  reference_entity_id: "pb_grants_intake_v1", // Points to playbook
  subject_entity_id: "entity_grant_app_456", // Grant application entity
  transaction_date: "2025-01-15T09:00:00Z",
  status: "queued",
  total_amount: 50000, // Amount requested
  metadata: {
    correlation_id: "corr-grants-2025-001",
    priority: "normal",
    created_by: "grants_intake_specialist",
    started_at: "2025-01-15T09:00:00Z",
    estimated_completion: "2025-01-18T09:00:00Z",
    inputs: {
      program: "STEM-Youth-2025",
      amount_requested: 50000,
      applicant_name: "Metro Science Academy",
      applicant_type: "educational", 
      project_title: "AI-Powered STEM Learning Lab",
      project_duration_months: 24
    },
    current_step: 1,
    step_statuses: {
      "1": "pending",
      "2": "not_started", 
      "3": "not_started",
      "4": "not_started",
      "5": "not_started"
    }
  },
  ai_confidence: 0.88,
  ai_insights: "Standard grants intake run. Estimated completion: 3 days. Risk factors: amount near upper threshold (50k vs 100k max), educational sector has 91% approval rate for STEM programs."
}
```

### 4.3 Step Execution Lines

As the run progresses, each step creates a `universal_transaction_lines` entry:

#### Step 1: RegisterApplication (Human)
```typescript
{
  id: "line_step1_abc123",
  transaction_id: "run_grants_abc123",
  line_entity_id: "step_register_app",
  line_number: 1,
  quantity: 1,
  unit_price: 25.00, // Estimated cost
  line_amount: 25.00,
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.EXEC.REGISTER.V1",
  metadata: {
    sequence: 1,
    step_name: "RegisterApplication",
    worker_type: "human",
    status: "completed",
    assigned_to: "grants_intake_specialist",
    started_at: "2025-01-15T09:00:00Z",
    completed_at: "2025-01-15T09:28:00Z",
    duration_seconds: 1680,
    inputs: {
      program: "STEM-Youth-2025",
      amount_requested: 50000,
      applicant_name: "Metro Science Academy"
    },
    outputs: {
      application_id: "APP-STEM-2025-0847",
      applicant_profile: {
        organization_id: "org_metro_science",
        type: "educational",
        tax_id: "12-3456789", 
        established_year: 2018,
        previous_grants: 2,
        total_previous_funding: 125000
      },
      proposal_summary: {
        title: "AI-Powered STEM Learning Lab",
        description: "Comprehensive STEM education program leveraging AI tutoring systems",
        target_students: 200,
        grade_levels: "6-12",
        innovation_score: 8.5
      }
    },
    worker_notes: "Complete application package received. All required documents present. Applicant has strong track record with previous grants."
  },
  ai_confidence: 0.95,
  ai_insights: "Excellent completion with comprehensive data collection. All required fields captured. Previous grant history indicates high success probability."
}
```

#### Step 2: EligibilityScreen (System) 
```typescript
{
  id: "line_step2_abc123",
  transaction_id: "run_grants_abc123", 
  line_entity_id: "step_eligibility_screen",
  line_number: 2,
  quantity: 1,
  unit_price: 2.00,
  line_amount: 2.00,
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.EXEC.ELIGIBILITY.V1",
  metadata: {
    sequence: 2,
    step_name: "EligibilityScreen", 
    worker_type: "system",
    status: "completed",
    started_at: "2025-01-15T09:28:00Z",
    completed_at: "2025-01-15T09:28:45Z",
    duration_seconds: 45,
    inputs: {
      application_id: "APP-STEM-2025-0847",
      amount_requested: 50000,
      applicant_type: "educational"
    },
    outputs: {
      eligibility_status: "eligible",
      eligibility_reasons: [
        "Amount within limits: $50,000 ≤ $100,000 ✓",
        "Organization type 'educational' is eligible ✓", 
        "STEM program matches eligible sectors ✓",
        "No geographic restrictions violated ✓"
      ],
      next_steps: "proceed_to_scoring",
      rules_evaluated: {
        "min_amount": { passed: true, value: 50000, threshold: 5000 },
        "max_amount": { passed: true, value: 50000, threshold: 100000 },
        "organization_type": { passed: true, value: "educational", allowed: ["nonprofit", "educational", "municipal"] },
        "sector": { passed: true, value: "education", allowed: ["education", "healthcare", "technology", "environment"] }
      }
    },
    system_processing: {
      rules_engine_version: "v2.3.1",
      processing_time_ms: 45,
      rules_checked: 8,
      rules_passed: 8
    }
  },
  ai_confidence: 0.99,
  ai_insights: "Perfect eligibility screening. All rules passed decisively. No edge cases or borderline conditions detected."
}
```

#### Step 3: ScoreProposal (AI)
```typescript
{
  id: "line_step3_abc123",
  transaction_id: "run_grants_abc123",
  line_entity_id: "step_score_proposal", 
  line_number: 3,
  quantity: 1,
  unit_price: 8.00,
  line_amount: 8.00,
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.EXEC.SCORE.V1",
  metadata: {
    sequence: 3,
    step_name: "ScoreProposal",
    worker_type: "ai",
    status: "completed",
    started_at: "2025-01-15T09:29:00Z",
    completed_at: "2025-01-15T09:34:15Z",
    duration_seconds: 315,
    inputs: {
      application_id: "APP-STEM-2025-0847",
      proposal_summary: {
        title: "AI-Powered STEM Learning Lab",
        description: "Comprehensive STEM education program leveraging AI tutoring systems"
      },
      budget_details: {
        total_amount: 50000,
        equipment: 30000,
        software: 8000,
        training: 7000,
        admin: 5000
      }
    },
    outputs: {
      total_score: 84.2,
      criteria_scores: {
        innovation: { score: 88, weight: 0.25, weighted: 22.0 },
        impact: { score: 92, weight: 0.30, weighted: 27.6 },
        feasibility: { score: 78, weight: 0.20, weighted: 15.6 },
        budget: { score: 85, weight: 0.15, weighted: 12.75 },
        sustainability: { score: 67, weight: 0.10, weighted: 6.7 }
      },
      ai_rationale: "Strong proposal with innovative AI integration and high potential impact. Feasibility is good but sustainability plan could be stronger. Budget allocation is reasonable with 60% for direct program costs.",
      risk_assessment: {
        technical_risk: "medium",
        financial_risk: "low", 
        timeline_risk: "low",
        sustainability_risk: "medium"
      },
      recommendations: [
        "Consider developing revenue model for post-grant sustainability",
        "Partner with local businesses for ongoing support",
        "Plan for equipment maintenance and software licensing costs"
      ]
    },
    ai_processing: {
      model_used: "grants-scoring-v2.1",
      confidence_score: 0.87,
      processing_time_ms: 3200,
      token_usage: {
        prompt: 1240,
        completion: 580,
        total: 1820
      }
    }
  },
  ai_confidence: 0.87,
  ai_insights: "High-quality AI analysis with strong score (84.2/100). Model confidence high at 0.87. Score aligns with successful grant profiles in STEM education sector."
}
```

#### Step 4: CommitteeReview (Human)
```typescript
{
  id: "line_step4_abc123", 
  transaction_id: "run_grants_abc123",
  line_entity_id: "step_committee_review",
  line_number: 4,
  quantity: 1,
  unit_price: 15.00,
  line_amount: 15.00,
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.EXEC.COMMITTEE.V1",
  metadata: {
    sequence: 4,
    step_name: "CommitteeReview",
    worker_type: "human",
    status: "completed",
    started_at: "2025-01-15T09:35:00Z",
    completed_at: "2025-01-16T14:22:00Z",
    duration_seconds: 104820, // ~29 hours
    inputs: {
      application_id: "APP-STEM-2025-0847", 
      total_score: 84.2,
      ai_rationale: "Strong proposal with innovative AI integration and high potential impact..."
    },
    outputs: {
      committee_votes: [
        {
          member_id: "committee_member_1",
          name: "Dr. Sarah Chen",
          vote: "approve",
          score: 86,
          notes: "Excellent integration of AI technology with proven educational impact. Budget is realistic and well-planned."
        },
        {
          member_id: "committee_member_2", 
          name: "Prof. Michael Rodriguez",
          vote: "approve",
          score: 82,
          notes: "Strong proposal but sustainability concerns remain. Suggest requiring detailed post-grant funding plan."
        },
        {
          member_id: "committee_member_3",
          name: "Janet Wilson",
          vote: "approve", 
          score: 87,
          notes: "Metro Science Academy has excellent track record. Project addresses real need in underserved community."
        }
      ],
      consensus_score: 85.0,
      review_notes: "Unanimous committee approval with strong scores (82-87 range). All members noted innovative approach and strong potential impact. Sustainability plan should be strengthened as condition of award.",
      voting_summary: {
        total_votes: 3,
        approve_votes: 3,
        deny_votes: 0,
        abstain_votes: 0,
        consensus_reached: true
      }
    },
    committee_processing: {
      voting_opened: "2025-01-15T10:00:00Z",
      voting_closed: "2025-01-16T14:00:00Z", 
      discussion_duration_hours: 2.5,
      conflicts_of_interest: 0,
      additional_materials_requested: 0
    }
  },
  ai_confidence: 0.79,
  ai_insights: "Strong committee consensus with all approvals. Average committee score (85.0) aligns well with AI score (84.2). Sustainability concerns noted by multiple members - consistent with AI risk assessment."
}
```

#### Step 5: AwardDecision (System)
```typescript
{
  id: "line_step5_abc123",
  transaction_id: "run_grants_abc123",
  line_entity_id: "step_award_decision",
  line_number: 5,
  quantity: 1,
  unit_price: 3.00,
  line_amount: 3.00,
  smart_code: "HERA.PUBLICSECTOR.PLAYBOOK.STEP.EXEC.DECISION.V1",
  metadata: {
    sequence: 5,
    step_name: "AwardDecision", 
    worker_type: "system",
    status: "completed",
    started_at: "2025-01-16T14:22:00Z",
    completed_at: "2025-01-16T14:25:30Z",
    duration_seconds: 210,
    inputs: {
      application_id: "APP-STEM-2025-0847",
      consensus_score: 85.0,
      committee_votes: [
        { vote: "approve", score: 86 },
        { vote: "approve", score: 82 },
        { vote: "approve", score: 87 }
      ]
    },
    outputs: {
      award_status: "awarded",
      award_amount: 50000, // Full amount approved
      decision_rationale: "Application approved with unanimous committee support (85.0 consensus score). Strong innovation score (88) and impact potential (92) with reasonable budget allocation. Award conditional on submission of enhanced sustainability plan within 30 days of grant execution.",
      notification_sent: {
        applicant_email: "grants@metroscience.edu",
        sent_at: "2025-01-16T14:26:00Z", 
        template_used: "award_approval_conditional",
        cc_recipients: ["program_manager@grants.gov", "grants_team@metroscience.edu"]
      },
      next_steps: {
        sustainability_plan_due: "2025-02-15T23:59:59Z",
        grant_execution_meeting: "2025-01-23T10:00:00Z", 
        reporting_schedule: "quarterly"
      }
    },
    decision_processing: {
      decision_algorithm: "weighted_average_with_consensus",
      ai_weight: 0.40,
      committee_weight: 0.60,
      final_calculated_score: 84.72, // (84.2 * 0.4) + (85.0 * 0.6)
      approval_threshold: 70.0,
      automatic_conditions_applied: ["sustainability_plan_required"],
      processing_time_ms: 180
    }
  },
  ai_confidence: 0.96,
  ai_insights: "Successful award decision with high confidence. All scoring metrics exceeded thresholds. Conditional approval appropriately addresses sustainability concerns raised in review process."
}
```

## 5. Final Run Status Update

After all steps complete, the run transaction is updated:

```typescript
{
  id: "run_grants_abc123",
  // ... other fields remain same
  status: "completed",
  metadata: {
    // ... previous metadata
    completed_at: "2025-01-16T14:25:30Z",
    total_duration_seconds: 105330, // ~29.25 hours
    step_statuses: {
      "1": "completed",
      "2": "completed", 
      "3": "completed",
      "4": "completed",
      "5": "completed"
    },
    final_outputs: {
      application_id: "APP-STEM-2025-0847",
      award_status: "awarded",
      award_amount: 50000,
      decision_rationale: "Application approved with unanimous committee support..."
    },
    performance_metrics: {
      total_cost: 53.00,
      actual_vs_estimated_time: 1.216, // 21.6% longer than estimated
      step_efficiency: {
        "1": 0.933, // 6.7% faster than estimated
        "2": 1.500, // 50% longer (45s vs 60s estimated)
        "3": 1.050, // 5% longer
        "4": 1.454, // 45.4% longer
        "5": 1.167  // 16.7% longer
      }
    }
  },
  ai_confidence: 0.92,
  ai_insights: "Successful grants intake completion with positive outcome. Timeline 21.6% longer than estimated primarily due to extended committee deliberation (29h vs 2h estimated). All stakeholders satisfied with thorough review process."
}
```

## 6. Cross-Reference Data Writes

This single grants intake run creates the following writes across HERA's 6 sacred tables:

### core_entities
- 1 playbook definition
- 5 step definitions  
- 1 grant application entity (subject)
- 1 applicant organization entity
- 3 committee member entities

### core_relationships
- 5 playbook-to-step relationships
- Various entity relationships (applicant-to-organization, etc.)

### core_dynamic_data
- Playbook configuration (eligibility rules, scoring criteria, committee config)
- Step inputs/outputs for complex data structures
- Application details and documents

### universal_transactions  
- 1 playbook run transaction header
- Additional transactions for notifications, audit events

### universal_transaction_lines
- 5 step execution lines (one per step)
- Granular cost and time tracking per step

### Total Data Impact
- **11 entity records** across core_entities
- **8 relationship records** in core_relationships  
- **25+ dynamic data records** for extended properties
- **1 main transaction** + auxiliary transactions
- **5 transaction line records** for step executions

**Every record includes organization_id for perfect multi-tenant isolation and smart codes for intelligent business context.**

## 7. Key Benefits Demonstrated

1. **Complete Auditability**: Every decision, timing, and data point tracked
2. **AI Integration**: Native AI scoring with confidence metrics and explanations  
3. **Flexible Configuration**: Rules, scoring, and committee settings stored as data
4. **Multi-Worker Support**: Human, system, and AI workers in single workflow
5. **Real-time Insights**: AI analysis at playbook, run, and step levels
6. **Perfect Multi-tenancy**: Organization isolation throughout the process
7. **Universal Patterns**: Same 6-table structure handles complex government processes

This example proves HERA's universal architecture can handle sophisticated public sector workflows with full compliance, audit trails, and intelligent automation while maintaining the sacred 6-table constraint.