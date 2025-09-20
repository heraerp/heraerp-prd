/**
 * HERA Playbooks Grants Application Seed Data
 * 
 * Creates a comprehensive grants application playbook demonstrating
 * all features including human tasks, approvals, system integrations,
 * and complex workflows.
 */
import { universalApi } from '@/lib/universal-api';
import { PlaybookSmartCodes } from '../smart-codes/playbook-smart-codes';

export interface GrantsPlaybookSeedResult {
  playbook_id: string;
  playbook_name: string;
  steps: Array<{
    step_id: string;
    step_name: string;
    step_type: string;
  }>;
  contracts: {
    input_contract_id: string;
    output_contract_id: string;
  };
  policies: {
    sla_policy_id: string;
    approval_policy_id: string;
    segregation_policy_id: string;
  };
}

export async function seedGrantsPlaybook(organizationId: string): Promise<GrantsPlaybookSeedResult> {
  console.log('Seeding Grants Application playbook...');
  
  // Set organization context
  universalApi.setOrganizationId(organizationId);
  
  // 1. Create the playbook definition entity
  const playbookSmartCode = PlaybookSmartCodes.forPlaybookDefinition('PUBLICSECTOR', 'GRANTS_APPLICATION', '1');
  
  const playbook = await universalApi.createEntity({
    entity_type: 'playbook',
    entity_name: 'Federal Grants Application Process',
    entity_code: 'GRANTS_APP_V1',
    smart_code: playbookSmartCode,
    metadata: {
      industry: 'PUBLICSECTOR',
      module: 'GRANTS',
      description: 'Complete workflow for federal grant applications including eligibility, submission, review, and award processing',
      version: '1.0',
      status: 'active',
      tags: ['grants', 'federal', 'application', 'compliance'],
      estimated_duration_hours: 168, // 7 days
      complexity_score: 85,
      compliance_frameworks: ['2 CFR 200', 'FAR', 'FFATA'],
      automation_level: 'semi_automated'
    }
  });
  
  // 2. Create input contract
  const inputContract = await universalApi.createEntity({
    entity_type: 'contract',
    entity_name: 'Grants Application Input Contract',
    entity_code: 'GRANTS_INPUT_V1',
    smart_code: PlaybookSmartCodes.forContract('input', '1'),
    metadata: {
      playbook_id: playbook.id,
      contract_type: 'input',
      value_json: {
        type: 'object',
        required: [
          'organization_name',
          'ein',
          'grant_opportunity_number',
          'project_title',
          'project_abstract',
          'requested_amount',
          'project_duration_months'
        ],
        properties: {
          organization_name: {
            type: 'string',
            minLength: 3,
            maxLength: 200
          },
          ein: {
            type: 'string',
            pattern: '^\\d{2}-\\d{7}$',
            description: 'Employer Identification Number'
          },
          duns_number: {
            type: 'string',
            pattern: '^\\d{9}$',
            description: 'DUNS Number (required for federal grants)'
          },
          grant_opportunity_number: {
            type: 'string',
            pattern: '^[A-Z0-9-]+$'
          },
          project_title: {
            type: 'string',
            minLength: 10,
            maxLength: 200
          },
          project_abstract: {
            type: 'string',
            minLength: 100,
            maxLength: 5000
          },
          requested_amount: {
            type: 'number',
            minimum: 10000,
            maximum: 10000000
          },
          project_duration_months: {
            type: 'integer',
            minimum: 1,
            maximum: 60
          },
          principal_investigator: {
            type: 'object',
            required: ['name', 'email', 'phone'],
            properties: {
              name: { type: 'string' },
              title: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' }
            }
          },
          budget_narrative: {
            type: 'string',
            minLength: 200
          },
          supporting_documents: {
            type: 'array',
            items: {
              type: 'object',
              required: ['document_type', 'file_url'],
              properties: {
                document_type: {
                  type: 'string',
                  enum: ['budget_justification', 'organization_chart', 'letters_of_support', 'resumes', 'other']
                },
                file_url: { type: 'string', format: 'uri' },
                file_name: { type: 'string' }
              }
            }
          }
        }
      }
    }
  });
  
  // 3. Create output contract
  const outputContract = await universalApi.createEntity({
    entity_type: 'contract',
    entity_name: 'Grants Application Output Contract',
    entity_code: 'GRANTS_OUTPUT_V1',
    smart_code: PlaybookSmartCodes.forContract('output', '1'),
    metadata: {
      playbook_id: playbook.id,
      contract_type: 'output',
      value_json: {
        type: 'object',
        required: ['application_number', 'submission_status', 'submission_timestamp'],
        properties: {
          application_number: {
            type: 'string',
            description: 'System-generated application tracking number'
          },
          submission_status: {
            type: 'string',
            enum: ['submitted', 'under_review', 'approved', 'rejected', 'withdrawn']
          },
          submission_timestamp: {
            type: 'string',
            format: 'date-time'
          },
          review_results: {
            type: 'object',
            properties: {
              eligibility_score: { type: 'number', minimum: 0, maximum: 100 },
              technical_score: { type: 'number', minimum: 0, maximum: 100 },
              budget_score: { type: 'number', minimum: 0, maximum: 100 },
              overall_score: { type: 'number', minimum: 0, maximum: 100 },
              recommendation: {
                type: 'string',
                enum: ['fund', 'fund_with_conditions', 'do_not_fund', 'needs_revision']
              },
              reviewer_comments: { type: 'string' }
            }
          },
          award_details: {
            type: 'object',
            properties: {
              award_amount: { type: 'number' },
              award_date: { type: 'string', format: 'date' },
              project_start_date: { type: 'string', format: 'date' },
              project_end_date: { type: 'string', format: 'date' },
              terms_and_conditions: { type: 'string' }
            }
          },
          compliance_checks: {
            type: 'object',
            properties: {
              sam_registration: { type: 'boolean' },
              debarment_check: { type: 'boolean' },
              audit_clearance: { type: 'boolean' },
              risk_assessment: {
                type: 'string',
                enum: ['low', 'medium', 'high']
              }
            }
          }
        }
      }
    }
  });
  
  // 4. Create SLA Policy
  const slaPolicy = await universalApi.createEntity({
    entity_type: 'policy',
    entity_name: 'Grants Application SLA Policy',
    entity_code: 'GRANTS_SLA_V1',
    smart_code: PlaybookSmartCodes.forPolicy('sla', '1'),
    metadata: {
      playbook_id: playbook.id,
      policy_type: 'sla',
      value_json: {
        overall_sla_hours: 168, // 7 days
        step_slas: {
          eligibility_check: 4, // 4 hours
          document_validation: 8, // 8 hours
          compliance_review: 24, // 1 day
          technical_review: 48, // 2 days
          budget_review: 24, // 1 day
          final_approval: 24, // 1 day
          award_processing: 8 // 8 hours
        },
        escalation_rules: [
          {
            threshold_percent: 80,
            action: 'notify_supervisor'
          },
          {
            threshold_percent: 100,
            action: 'escalate_to_director'
          }
        ]
      }
    }
  });
  
  // 5. Create Approval Policy
  const approvalPolicy = await universalApi.createEntity({
    entity_type: 'policy',
    entity_name: 'Grants Approval Policy',
    entity_code: 'GRANTS_APPROVAL_V1',
    smart_code: PlaybookSmartCodes.forPolicy('approval', '1'),
    metadata: {
      playbook_id: playbook.id,
      policy_type: 'approval',
      value_json: {
        approval_levels: [
          {
            amount_threshold: 100000,
            required_role: 'grants_officer',
            approval_type: 'single'
          },
          {
            amount_threshold: 500000,
            required_role: 'grants_manager',
            approval_type: 'sequential'
          },
          {
            amount_threshold: 1000000,
            required_role: 'grants_director',
            approval_type: 'sequential'
          },
          {
            amount_threshold: null, // Above 1M
            required_role: 'executive_director',
            approval_type: 'sequential'
          }
        ]
      }
    }
  });
  
  // 6. Create Segregation of Duties Policy
  const segregationPolicy = await universalApi.createEntity({
    entity_type: 'policy',
    entity_name: 'Grants Segregation of Duties',
    entity_code: 'GRANTS_SEGREGATION_V1',
    smart_code: PlaybookSmartCodes.forPolicy('segregation', '1'),
    metadata: {
      playbook_id: playbook.id,
      policy_type: 'segregation',
      value_json: {
        incompatible_roles: [
          {
            role_a: 'application_preparer',
            role_b: 'application_reviewer',
            rule: 'cannot_be_same_user'
          },
          {
            role_a: 'technical_reviewer',
            role_b: 'budget_reviewer',
            rule: 'can_be_same_user'
          },
          {
            role_a: 'reviewer',
            role_b: 'approver',
            rule: 'cannot_be_same_user'
          }
        ]
      }
    }
  });
  
  // 7. Create playbook steps
  const steps = [];
  
  // Step 1: Eligibility Pre-Check (System)
  const step1 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Eligibility Pre-Check',
    entity_code: 'ELIGIBILITY_CHECK',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'ELIGIBILITY_CHECK', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 1,
      step_type: 'system',
      worker_type: 'system',
      description: 'Automated eligibility verification against grant requirements',
      estimated_duration_minutes: 5,
      permissions_required: ['GRANTS_ELIGIBILITY_CHECK'],
      business_rules: [
        'Organization must be registered in SAM.gov',
        'Organization must not be debarred',
        'Organization type must match grant eligibility criteria',
        'Requested amount must be within grant limits'
      ],
      input_schema: {
        required: ['organization_name', 'ein', 'grant_opportunity_number']
      },
      output_schema: {
        required: ['eligibility_status', 'eligibility_reasons']
      },
      retry_policy: {
        max_retries: 3,
        retry_delay_seconds: 60
      }
    }
  });
  steps.push(step1);
  
  // Step 2: Document Collection (Human)
  const step2 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Document Collection & Preparation',
    entity_code: 'DOCUMENT_COLLECTION',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'DOCUMENT_COLLECTION', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 2,
      step_type: 'human',
      worker_type: 'human',
      description: 'Collect and prepare all required grant application documents',
      estimated_duration_minutes: 480, // 8 hours
      permissions_required: ['GRANTS_DOCUMENT_PREPARE'],
      required_roles: ['grants_specialist'],
      business_rules: [
        'All required documents must be in PDF format',
        'Budget narrative must match budget spreadsheet',
        'Letters of support must be dated within 6 months'
      ],
      ui_config: {
        form_type: 'document_upload',
        required_documents: [
          'budget_justification',
          'organization_chart',
          'project_narrative',
          'evaluation_plan'
        ]
      }
    }
  });
  steps.push(step2);
  
  // Step 3: Document Validation (AI)
  const step3 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'AI Document Validation',
    entity_code: 'DOCUMENT_VALIDATION',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'DOCUMENT_VALIDATION', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 3,
      step_type: 'ai',
      worker_type: 'ai',
      description: 'AI-powered validation of document completeness and quality',
      estimated_duration_minutes: 30,
      permissions_required: ['GRANTS_AI_VALIDATION'],
      ai_config: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.3,
        prompts: {
          completeness_check: 'Verify all required sections are present in the grant narrative',
          quality_assessment: 'Assess the clarity and persuasiveness of the project description',
          budget_validation: 'Check if budget items align with project activities'
        }
      },
      business_rules: [
        'All required sections must be present',
        'Budget must sum correctly',
        'No prohibited content detected'
      ]
    }
  });
  steps.push(step3);
  
  // Step 4: Compliance Review (Human)
  const step4 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Compliance Review',
    entity_code: 'COMPLIANCE_REVIEW',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'COMPLIANCE_REVIEW', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 4,
      step_type: 'human',
      worker_type: 'human',
      description: 'Review application for regulatory compliance',
      estimated_duration_minutes: 120, // 2 hours
      permissions_required: ['GRANTS_COMPLIANCE_REVIEW'],
      required_roles: ['compliance_officer'],
      business_rules: [
        'Verify 2 CFR 200 compliance',
        'Check cost principles adherence',
        'Validate indirect cost rate application'
      ],
      checklist: [
        'SAM.gov registration active',
        'Audit findings resolved',
        'Cost sharing requirements met',
        'Conflict of interest forms completed'
      ]
    }
  });
  steps.push(step4);
  
  // Step 5: Technical Review Panel (Human - Quorum)
  const step5 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Technical Review Panel',
    entity_code: 'TECHNICAL_REVIEW',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'TECHNICAL_REVIEW', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 5,
      step_type: 'human',
      worker_type: 'human',
      description: 'Technical merit review by subject matter experts',
      estimated_duration_minutes: 1440, // 24 hours
      permissions_required: ['GRANTS_TECHNICAL_REVIEW'],
      required_roles: ['technical_reviewer'],
      quorum_policy: {
        minimum_reviewers: 3,
        scoring_method: 'average',
        consensus_required: false
      },
      scoring_rubric: {
        technical_approach: { weight: 0.4, max_score: 100 },
        innovation: { weight: 0.2, max_score: 100 },
        feasibility: { weight: 0.2, max_score: 100 },
        impact: { weight: 0.2, max_score: 100 }
      }
    }
  });
  steps.push(step5);
  
  // Step 6: Budget Review (Human)
  const step6 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Budget Review',
    entity_code: 'BUDGET_REVIEW',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'BUDGET_REVIEW', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 6,
      step_type: 'human',
      worker_type: 'human',
      description: 'Detailed budget analysis and cost reasonableness review',
      estimated_duration_minutes: 240, // 4 hours
      permissions_required: ['GRANTS_BUDGET_REVIEW'],
      required_roles: ['budget_analyst'],
      business_rules: [
        'Personnel costs must not exceed 65% of total',
        'Indirect costs must use approved rate',
        'Cost sharing must be documented',
        'All costs must be allowable under 2 CFR 200'
      ]
    }
  });
  steps.push(step6);
  
  // Step 7: Risk Assessment (System)
  const step7 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Automated Risk Assessment',
    entity_code: 'RISK_ASSESSMENT',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'RISK_ASSESSMENT', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 7,
      step_type: 'system',
      worker_type: 'system',
      description: 'System-generated risk score based on multiple factors',
      estimated_duration_minutes: 10,
      permissions_required: ['GRANTS_RISK_ASSESSMENT'],
      risk_factors: [
        { factor: 'organization_size', weight: 0.2 },
        { factor: 'previous_grant_performance', weight: 0.3 },
        { factor: 'audit_findings', weight: 0.3 },
        { factor: 'project_complexity', weight: 0.2 }
      ],
      output_schema: {
        risk_score: { type: 'number', minimum: 0, maximum: 100 },
        risk_level: { enum: ['low', 'medium', 'high'] },
        mitigation_recommendations: { type: 'array' }
      }
    }
  });
  steps.push(step7);
  
  // Step 8: Executive Approval (Human)
  const step8 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Executive Approval',
    entity_code: 'EXECUTIVE_APPROVAL',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'EXECUTIVE_APPROVAL', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 8,
      step_type: 'human',
      worker_type: 'human',
      description: 'Final approval by authorized executives based on amount',
      estimated_duration_minutes: 480, // 8 hours
      permissions_required: ['GRANTS_EXECUTIVE_APPROVAL'],
      required_roles: ['grants_director', 'executive_director'],
      approval_matrix: {
        use_policy: 'GRANTS_APPROVAL_V1' // References approval policy
      }
    }
  });
  steps.push(step8);
  
  // Step 9: Award Letter Generation (System)
  const step9 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Award Letter Generation',
    entity_code: 'AWARD_GENERATION',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'AWARD_GENERATION', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 9,
      step_type: 'system',
      worker_type: 'system',
      description: 'Generate official award letter and terms',
      estimated_duration_minutes: 15,
      permissions_required: ['GRANTS_AWARD_GENERATION'],
      template_id: 'federal_grant_award_template_v1',
      business_rules: [
        'Award amount must not exceed approved amount',
        'Terms must include all compliance requirements',
        'Performance period must be specified'
      ]
    }
  });
  steps.push(step9);
  
  // Step 10: Notification & Portal Update (External)
  const step10 = await universalApi.createEntity({
    entity_type: 'playbook_step',
    entity_name: 'Grants.gov Submission',
    entity_code: 'GRANTS_GOV_SUBMISSION',
    smart_code: PlaybookSmartCodes.forStepDefinition('PUBLICSECTOR', 'GRANTS_GOV_SUBMISSION', '1'),
    metadata: {
      playbook_id: playbook.id,
      step_number: 10,
      step_type: 'external',
      worker_type: 'external',
      description: 'Submit application to Grants.gov and update status',
      estimated_duration_minutes: 30,
      permissions_required: ['GRANTS_EXTERNAL_SUBMISSION'],
      external_config: {
        endpoint: 'https://api.grants.gov/v2/submissions',
        method: 'POST',
        authentication: {
          type: 'oauth2',
          token_endpoint: 'https://api.grants.gov/oauth/token'
        },
        retry_policy: {
          max_attempts: 5,
          backoff_strategy: 'exponential'
        }
      }
    }
  });
  steps.push(step10);
  
  // 8. Create step relationships (dependencies)
  // All steps depend on previous step completion (sequential workflow)
  for (let i = 1; i < steps.length; i++) {
    await universalApi.createRelationship({
      from_entity_id: steps[i].id,
      to_entity_id: steps[i-1].id,
      relationship_type: 'depends_on',
      smart_code: 'HERA.PLAYBOOK.STEP.DEPENDS.ON.V1',
      metadata: {
        dependency_type: 'completion',
        description: `Step ${i+1} depends on completion of Step ${i}`
      }
    });
  }
  
  // Add conditional dependency: Step 9 (Award Generation) only runs if Step 8 approval is positive
  await universalApi.createRelationship({
    from_entity_id: step9.id,
    to_entity_id: step8.id,
    relationship_type: 'depends_on',
    smart_code: 'HERA.PLAYBOOK.STEP.CONDITIONAL.DEPENDS.V1',
    metadata: {
      dependency_type: 'conditional',
      condition: {
        field: 'approval_status',
        operator: 'equals',
        value: 'approved'
      },
      description: 'Award generation only proceeds if executive approval is granted'
    }
  });
  
  // 9. Link contracts and policies to playbook
  await universalApi.createRelationship({
    from_entity_id: playbook.id,
    to_entity_id: inputContract.id,
    relationship_type: 'has_contract',
    smart_code: 'HERA.PLAYBOOK.HAS.CONTRACT.INPUT.V1'
  });
  
  await universalApi.createRelationship({
    from_entity_id: playbook.id,
    to_entity_id: outputContract.id,
    relationship_type: 'has_contract',
    smart_code: 'HERA.PLAYBOOK.HAS.CONTRACT.OUTPUT.V1'
  });
  
  await universalApi.createRelationship({
    from_entity_id: playbook.id,
    to_entity_id: slaPolicy.id,
    relationship_type: 'has_policy',
    smart_code: 'HERA.PLAYBOOK.HAS.POLICY.SLA.V1'
  });
  
  await universalApi.createRelationship({
    from_entity_id: playbook.id,
    to_entity_id: approvalPolicy.id,
    relationship_type: 'has_policy',
    smart_code: 'HERA.PLAYBOOK.HAS.POLICY.APPROVAL.V1'
  });
  
  await universalApi.createRelationship({
    from_entity_id: playbook.id,
    to_entity_id: segregationPolicy.id,
    relationship_type: 'has_policy',
    smart_code: 'HERA.PLAYBOOK.HAS.POLICY.SEGREGATION.V1'
  });
  
  console.log('Grants playbook seeded successfully');
  
  return {
    playbook_id: playbook.id,
    playbook_name: playbook.entity_name,
    steps: steps.map((s, i) => ({
      step_id: s.id,
      step_name: s.entity_name,
      step_type: s.metadata?.step_type || 'unknown'
    })),
    contracts: {
      input_contract_id: inputContract.id,
      output_contract_id: outputContract.id
    },
    policies: {
      sla_policy_id: slaPolicy.id,
      approval_policy_id: approvalPolicy.id,
      segregation_policy_id: segregationPolicy.id
    }
  };
}