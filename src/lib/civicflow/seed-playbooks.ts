import { createServiceClient } from '@/lib/supabase/service-client'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Demo playbook data
const demoPlaybooks = [
  {
    name: 'Constituent Intake Process',
    description:
      'Standard workflow for registering new constituents and assessing their eligibility for various programs',
    category: 'constituent',
    status: 'active',
    steps: [
      {
        sequence: 1,
        name: 'Initial Contact Form',
        description: 'Collect basic information from the constituent',
        step_type: 'form',
        config: {
          fields: ['name', 'email', 'phone', 'address', 'date_of_birth']
        }
      },
      {
        sequence: 2,
        name: 'Identity Verification',
        description: 'Verify constituent identity using ID documents',
        step_type: 'approval',
        config: {
          approver_role: 'case_worker',
          documents_required: ['photo_id', 'proof_of_address']
        }
      },
      {
        sequence: 3,
        name: 'Eligibility Assessment',
        description: 'Determine eligibility for various programs',
        step_type: 'action',
        config: {
          action: 'assess_eligibility',
          programs: ['medicaid', 'snap', 'housing_assistance']
        }
      },
      {
        sequence: 4,
        name: 'Welcome Email',
        description: 'Send welcome email with program information',
        step_type: 'notification',
        config: {
          template: 'constituent_welcome',
          channel: 'email'
        }
      },
      {
        sequence: 5,
        name: 'Case Assignment',
        description: 'Assign constituent to appropriate case worker',
        step_type: 'action',
        config: {
          action: 'assign_case_worker',
          assignment_method: 'round_robin'
        }
      }
    ]
  },
  {
    name: 'Services Eligibility Assessment',
    description:
      'Comprehensive assessment workflow to determine constituent eligibility for multiple government services',
    category: 'service',
    status: 'active',
    steps: [
      {
        sequence: 1,
        name: 'Income Verification',
        description: 'Verify household income and employment status',
        step_type: 'form',
        config: {
          fields: ['employment_status', 'monthly_income', 'household_size']
        }
      },
      {
        sequence: 2,
        name: 'Document Collection',
        description: 'Collect required supporting documents',
        step_type: 'action',
        config: {
          documents: ['pay_stubs', 'tax_returns', 'bank_statements']
        }
      },
      {
        sequence: 3,
        name: 'Benefits Calculation',
        description: 'Calculate eligible benefits based on income and household',
        step_type: 'action',
        config: {
          calculator: 'benefits_calculator_v2',
          include_programs: ['snap', 'wic', 'tanf', 'medicaid']
        }
      },
      {
        sequence: 4,
        name: 'Supervisor Review',
        description: 'Supervisor reviews and approves eligibility determination',
        step_type: 'approval',
        config: {
          approver_role: 'supervisor',
          review_threshold: 'high_value'
        }
      },
      {
        sequence: 5,
        name: 'Decision Notification',
        description: 'Notify constituent of eligibility decision',
        step_type: 'notification',
        config: {
          channels: ['email', 'sms', 'portal'],
          include_appeal_info: true
        }
      },
      {
        sequence: 6,
        name: 'Enrollment Support',
        description: 'Provide enrollment assistance for approved programs',
        step_type: 'action',
        config: {
          action: 'schedule_enrollment_appointment'
        }
      }
    ]
  },
  {
    name: 'Grants Intake and Processing',
    description: 'End-to-end workflow for grant applications from submission to award',
    category: 'grants',
    status: 'active',
    steps: [
      {
        sequence: 1,
        name: 'Pre-Application Review',
        description: 'Initial review of grant application for completeness',
        step_type: 'action',
        config: {
          checklist: ['organization_info', 'project_narrative', 'budget', 'timeline']
        }
      },
      {
        sequence: 2,
        name: 'Eligibility Check',
        description: 'Verify organization meets grant requirements',
        step_type: 'condition',
        config: {
          conditions: ['501c3_status', 'service_area', 'past_performance']
        }
      },
      {
        sequence: 3,
        name: 'Technical Review',
        description: 'Subject matter expert reviews proposal',
        step_type: 'approval',
        config: {
          reviewer_pool: 'technical_reviewers',
          scoring_rubric: 'standard_grant_rubric'
        }
      },
      {
        sequence: 4,
        name: 'Budget Analysis',
        description: 'Financial team reviews budget proposal',
        step_type: 'approval',
        config: {
          approver_role: 'finance_analyst',
          budget_caps: true
        }
      },
      {
        sequence: 5,
        name: 'Award Decision',
        description: 'Final award decision and amount determination',
        step_type: 'approval',
        config: {
          approver_role: 'grant_committee',
          decision_options: ['approve_full', 'approve_partial', 'deny']
        }
      }
    ]
  },
  {
    name: 'Case Lifecycle Management',
    description: 'Complete workflow for managing constituent cases from opening to resolution',
    category: 'case',
    status: 'active',
    steps: [
      {
        sequence: 1,
        name: 'Case Creation',
        description: 'Create new case with initial details',
        step_type: 'form',
        config: {
          case_types: ['complaint', 'service_request', 'inquiry', 'emergency']
        }
      },
      {
        sequence: 2,
        name: 'Priority Assignment',
        description: 'Determine case priority based on type and urgency',
        step_type: 'action',
        config: {
          priority_matrix: 'standard',
          factors: ['case_type', 'constituent_tier', 'sla_requirements']
        }
      },
      {
        sequence: 3,
        name: 'Case Worker Assignment',
        description: 'Assign case to appropriate worker based on expertise',
        step_type: 'action',
        config: {
          assignment_method: 'skill_based',
          load_balancing: true
        }
      },
      {
        sequence: 4,
        name: 'Progress Updates',
        description: 'Regular updates on case progress',
        step_type: 'notification',
        config: {
          frequency: 'milestone_based',
          channels: ['portal', 'email']
        }
      },
      {
        sequence: 5,
        name: 'Resolution Review',
        description: 'Review case resolution before closing',
        step_type: 'approval',
        config: {
          approver: 'case_supervisor',
          quality_check: true
        }
      },
      {
        sequence: 6,
        name: 'Satisfaction Survey',
        description: 'Send constituent satisfaction survey',
        step_type: 'form',
        config: {
          survey_type: 'case_closure',
          optional: true
        }
      }
    ]
  },
  {
    name: 'Outreach Notification Campaign',
    description: 'Workflow for planning and executing constituent outreach campaigns',
    category: 'outreach',
    status: 'active',
    steps: [
      {
        sequence: 1,
        name: 'Campaign Planning',
        description: 'Define campaign goals and target audience',
        step_type: 'form',
        config: {
          fields: ['campaign_name', 'objectives', 'target_segments', 'budget']
        }
      },
      {
        sequence: 2,
        name: 'Audience Selection',
        description: 'Select constituents based on criteria',
        step_type: 'action',
        config: {
          filters: ['location', 'program_enrollment', 'demographics'],
          expected_reach: 'calculate'
        }
      },
      {
        sequence: 3,
        name: 'Content Approval',
        description: 'Review and approve campaign content',
        step_type: 'approval',
        config: {
          approvers: ['communications_manager', 'program_director'],
          review_items: ['messaging', 'visuals', 'call_to_action']
        }
      },
      {
        sequence: 4,
        name: 'Send Notifications',
        description: 'Execute campaign across selected channels',
        step_type: 'notification',
        config: {
          channels: ['email', 'sms', 'push', 'mail'],
          scheduling: 'batch_optimized'
        }
      },
      {
        sequence: 5,
        name: 'Track Engagement',
        description: 'Monitor campaign engagement metrics',
        step_type: 'action',
        config: {
          metrics: ['open_rate', 'click_rate', 'response_rate'],
          reporting_frequency: 'real_time'
        }
      }
    ]
  },
  {
    name: 'Emergency Response Coordination',
    description: 'Rapid response workflow for emergency situations affecting constituents',
    category: 'service',
    status: 'draft',
    steps: [
      {
        sequence: 1,
        name: 'Emergency Alert',
        description: 'Receive and validate emergency alert',
        step_type: 'form',
        config: {
          alert_types: ['natural_disaster', 'public_health', 'infrastructure']
        }
      },
      {
        sequence: 2,
        name: 'Impact Assessment',
        description: 'Assess affected areas and populations',
        step_type: 'action',
        config: {
          data_sources: ['gis', 'constituent_database', 'infrastructure_systems']
        }
      },
      {
        sequence: 3,
        name: 'Resource Mobilization',
        description: 'Activate emergency resources and personnel',
        step_type: 'action',
        config: {
          resources: ['shelters', 'emergency_supplies', 'response_teams']
        }
      },
      {
        sequence: 4,
        name: 'Mass Notification',
        description: 'Send emergency notifications to affected constituents',
        step_type: 'notification',
        config: {
          priority: 'urgent',
          channels: ['sms', 'phone', 'email', 'mobile_app'],
          message_type: 'emergency_alert'
        }
      }
    ]
  }
]

export async function seedCivicFlowPlaybooks() {
  console.log('🌱 Starting CivicFlow playbooks seed...')
  console.log('🌱 Organization ID:', CIVICFLOW_ORG_ID)
  console.log('🌱 Number of playbooks to create:', demoPlaybooks.length)

  // Create service client with elevated permissions
  const supabase = createServiceClient()

  try {
    // Test the Supabase connection first
    const { data: testQuery, error: testError } = await supabase
      .from('core_entities')
      .select('count')
      .eq('organization_id', CIVICFLOW_ORG_ID)
      .single()

    console.log('🌱 Test query result:', { testQuery, testError })

    const createdPlaybooks = []

    for (const playbook of demoPlaybooks) {
      console.log(`🌱 Creating playbook: ${playbook.name}`)
      // Create playbook entity
      const { data: playbookEntity, error: playbookError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: CIVICFLOW_ORG_ID,
          entity_type: 'playbook',
          entity_name: playbook.name,
          entity_code: `PLAYBOOK-${playbook.name.replace(/\s+/g, '-').toUpperCase()}`,
          smart_code: `HERA.CIVICFLOW.PLAYBOOK.${playbook.category.toUpperCase()}.ENTITY.CONFIG.v1`,
          status: playbook.status,
          metadata: {
            description: playbook.description,
            category: playbook.category,
            steps_count: playbook.steps.length,
            version: '1.0.0'
          }
        })
        .select()
        .single()

      if (playbookError) {
        console.error(`❌ Error creating playbook ${playbook.name}:`, playbookError)
        console.error('Full error:', JSON.stringify(playbookError, null, 2))
        continue
      }

      if (!playbookEntity) {
        console.error(`❌ No data returned for playbook ${playbook.name}`)
        continue
      }

      console.log(`✅ Created playbook: ${playbook.name}`, playbookEntity.id)

      // Create playbook steps as related entities
      for (const step of playbook.steps) {
        const { data: stepEntity, error: stepError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: CIVICFLOW_ORG_ID,
            entity_type: 'playbook_step',
            entity_name: step.name,
            entity_code: `STEP-${playbookEntity.id}-${step.sequence}`,
            smart_code: `HERA.CIVICFLOW.PLAYBOOK.STEP.${step.step_type.toUpperCase()}.CONFIG.v1`,
            status: 'active',
            metadata: {
              ...step,
              playbook_id: playbookEntity.id
            }
          })
          .select()
          .single()

        if (stepError) {
          console.error(`Error creating step ${step.name}:`, stepError)
          continue
        }

        // Create relationship between playbook and step
        await supabase.from('core_relationships').insert({
          organization_id: CIVICFLOW_ORG_ID,
          from_entity_id: playbookEntity.id,
          to_entity_id: stepEntity.id,
          relationship_type: 'has_step',
          smart_code: 'HERA.CIVICFLOW.RELATIONSHIP.PLAYBOOK.STEP.CONFIG.V1',
          metadata: {
            sequence: step.sequence
          }
        })
      }

      // Add some demo run history for active playbooks
      if (playbook.status === 'active' && Math.random() > 0.3) {
        const runCount = Math.floor(Math.random() * 20) + 5
        const successCount = Math.floor(runCount * (0.7 + Math.random() * 0.25))

        // Update playbook metadata with run statistics
        await supabase
          .from('core_entities')
          .update({
            metadata: {
              ...playbookEntity.metadata,
              total_runs: runCount,
              successful_runs: successCount,
              success_rate: Math.round((successCount / runCount) * 100),
              last_run_at: new Date(
                Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              avg_duration_minutes: Math.floor(Math.random() * 120) + 30
            }
          })
          .eq('id', playbookEntity.id)
      }

      createdPlaybooks.push(playbookEntity)
    }

    console.log(`✅ Successfully created ${createdPlaybooks.length} demo playbooks`)
    return createdPlaybooks
  } catch (error) {
    console.error('❌ Error seeding playbooks:', error)
    throw error
  }
}

export async function clearCivicFlowPlaybooks() {
  console.log('🗑️ Clearing CivicFlow playbooks...')

  // Create service client with elevated permissions
  const supabase = createServiceClient()

  try {
    // Delete playbook steps first
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', CIVICFLOW_ORG_ID)
      .eq('entity_type', 'playbook_step')

    // Delete playbooks
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', CIVICFLOW_ORG_ID)
      .eq('entity_type', 'playbook')

    console.log('✅ Successfully cleared all playbooks')
  } catch (error) {
    console.error('❌ Error clearing playbooks:', error)
    throw error
  }
}
