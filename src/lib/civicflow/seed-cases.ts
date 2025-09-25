/**
 * CivicFlow Cases Seed Data
 * Creates demo cases with realistic data that integrates with existing entities
 */

import { createClient } from '@supabase/supabase-js'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CaseSeedData {
  entity_name: string
  description: string
  status: string
  priority: string
  rag: string
  owner: string
  due_date: string
  tags: string[]
  category: string
  sla_days?: number
  program_name?: string
  subject_name?: string
  subject_type?: 'constituent' | 'ps_org'
  attachments?: Array<{ name: string; type: string }>
}

const caseTemplates: CaseSeedData[] = [
  // Infrastructure Cases
  {
    entity_name: 'Pothole Repair - Al Manara Street',
    description:
      'Multiple potholes reported on Al Manara Street near the community center. Residents have complained about vehicle damage and safety concerns.',
    status: 'active',
    priority: 'high',
    rag: 'A',
    owner: 'Ahmed Hassan',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
    tags: ['infrastructure', 'roads', 'safety'],
    category: 'Public Works',
    sla_days: 5,
    program_name: 'Infrastructure Maintenance Program',
    subject_name: 'Dubai Municipality',
    subject_type: 'ps_org'
  },
  {
    entity_name: 'Street Light Outage - Business Bay',
    description:
      'Street lights on Bay Avenue have been out for a week. Area is dark and poses security risk for pedestrians.',
    status: 'in_review',
    priority: 'medium',
    rag: 'A',
    owner: 'Fatima Al Rashid',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
    tags: ['infrastructure', 'lighting', 'safety'],
    category: 'Public Works',
    sla_days: 10,
    program_name: 'Infrastructure Maintenance Program'
  },

  // Healthcare Cases
  {
    entity_name: 'Medical Equipment Request - Al Barsha Health Center',
    description:
      'Request for new X-ray machine and ultrasound equipment to serve growing population in Al Barsha district.',
    status: 'new',
    priority: 'high',
    rag: 'G',
    owner: 'Dr. Mohammed Ali',
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
    tags: ['healthcare', 'equipment', 'procurement'],
    category: 'Healthcare Services',
    sla_days: 30,
    program_name: 'Healthcare Access Program',
    subject_name: 'Ministry of Health',
    subject_type: 'ps_org'
  },
  {
    entity_name: 'Vaccination Campaign - Senior Citizens',
    description:
      'Organizing flu vaccination campaign for senior citizens in Dubai Marina area. Need to coordinate with 3 community centers.',
    status: 'active',
    priority: 'critical',
    rag: 'G',
    owner: 'Sarah Johnson',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days
    tags: ['healthcare', 'vaccination', 'seniors'],
    category: 'Healthcare Services',
    sla_days: 7,
    program_name: 'Healthcare Access Program'
  },

  // Social Services Cases
  {
    entity_name: 'Emergency Housing Assistance - Family of 5',
    description:
      'Family displaced due to building fire requires temporary housing assistance. Currently staying with relatives.',
    status: 'breach',
    priority: 'critical',
    rag: 'R',
    owner: 'Khalid Al Maktoum',
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago (overdue)
    tags: ['housing', 'emergency', 'social-services'],
    category: 'Social Services',
    sla_days: 1,
    program_name: 'Housing First Initiative',
    subject_name: 'Hamdan Al Rasheed',
    subject_type: 'constituent',
    attachments: [
      { name: 'fire_incident_report.pdf', type: 'document' },
      { name: 'family_assessment.pdf', type: 'document' }
    ]
  },
  {
    entity_name: 'Senior Citizen Support - Meal Delivery',
    description:
      'Request for meal delivery service for elderly resident unable to shop for groceries due to mobility issues.',
    status: 'active',
    priority: 'medium',
    rag: 'G',
    owner: 'Amina Khalifa',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days
    tags: ['seniors', 'meals', 'social-services'],
    category: 'Social Services',
    sla_days: 3,
    program_name: 'Senior Services',
    subject_name: 'Mariam Abdullah',
    subject_type: 'constituent'
  },

  // Environmental Cases
  {
    entity_name: 'Illegal Dumping Report - Industrial Area',
    description:
      'Construction waste illegally dumped near residential area. Environmental hazard and health concerns raised by residents.',
    status: 'on_hold',
    priority: 'high',
    rag: 'A',
    owner: 'Environmental Inspector Team',
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days
    tags: ['environment', 'waste', 'enforcement'],
    category: 'Environmental Services',
    sla_days: 14,
    attachments: [
      { name: 'site_photos.zip', type: 'evidence' },
      { name: 'resident_complaints.pdf', type: 'document' }
    ]
  },

  // Closed Cases (for metrics)
  {
    entity_name: 'Park Maintenance - Zabeel Park',
    description: 'Routine maintenance and landscaping work completed successfully.',
    status: 'closed',
    priority: 'low',
    rag: 'G',
    owner: 'Parks Department',
    due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    tags: ['parks', 'maintenance', 'completed'],
    category: 'Parks & Recreation',
    sla_days: 14
  },
  {
    entity_name: 'Business License Renewal - ABC Trading',
    description: 'Annual business license renewal processed and approved.',
    status: 'closed',
    priority: 'medium',
    rag: 'G',
    owner: 'Business Licensing Dept',
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    tags: ['business', 'licensing', 'completed'],
    category: 'Business Services',
    sla_days: 5,
    subject_name: 'ABC Trading LLC',
    subject_type: 'ps_org'
  }
]

export async function seedCivicFlowCases() {
  console.log('🌱 Seeding CivicFlow cases...')

  try {
    // First, check if we already have cases
    const { data: existingCases } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', CIVICFLOW_ORG_ID)
      .eq('entity_type', 'case')
      .limit(1)

    if (existingCases && existingCases.length > 0) {
      console.log('✅ Cases already exist, skipping seed')
      return
    }

    const createdCases = []

    for (const caseData of caseTemplates) {
      const caseNumber = `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // Create case entity
      const { data: newCase, error: caseError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: CIVICFLOW_ORG_ID,
          entity_type: 'case',
          entity_code: caseNumber,
          entity_name: caseData.entity_name,
          smart_code: 'HERA.PUBLICSECTOR.CRM.CASE.STANDARD.V1',
          status: 'active',
          created_at:
            caseData.status === 'closed'
              ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
              : new Date().toISOString()
        })
        .select()
        .single()

      if (caseError) {
        console.error(`Failed to create case: ${caseData.entity_name}`, caseError)
        continue
      }

      // Insert dynamic fields
      const dynamicFields = [
        { field_name: 'status', field_value_text: caseData.status },
        { field_name: 'priority', field_value_text: caseData.priority },
        { field_name: 'rag', field_value_text: caseData.rag },
        { field_name: 'due_date', field_value_date: caseData.due_date },
        { field_name: 'owner', field_value_text: caseData.owner },
        { field_name: 'description', field_value_text: caseData.description },
        { field_name: 'tags', field_value_json: caseData.tags },
        { field_name: 'category', field_value_text: caseData.category },
        { field_name: 'sla_days', field_value_number: caseData.sla_days },
        { field_name: 'program_name', field_value_text: caseData.program_name },
        { field_name: 'subject_name', field_value_text: caseData.subject_name },
        { field_name: 'subject_type', field_value_text: caseData.subject_type },
        { field_name: 'attachments', field_value_json: caseData.attachments || [] }
      ].filter(
        field =>
          field.field_value_text !== undefined ||
          field.field_value_date !== undefined ||
          field.field_value_json !== undefined ||
          field.field_value_number !== undefined
      )

      if (dynamicFields.length > 0) {
        await supabase.from('core_dynamic_data').insert(
          dynamicFields.map(field => ({
            organization_id: CIVICFLOW_ORG_ID,
            entity_id: newCase.id,
            smart_code: `HERA.PUBLICSECTOR.CRM.CASE.${field.field_name.toUpperCase()}.V1`,
            ...field
          }))
        )
      }

      // Create initial transaction for audit trail
      const txnCode = `TXN-${caseNumber}`
      await supabase.from('universal_transactions').insert({
        organization_id: CIVICFLOW_ORG_ID,
        transaction_type: 'case_created',
        transaction_code: txnCode,
        transaction_date: newCase.created_at,
        smart_code: 'HERA.PUBLICSECTOR.CRM.CASE.CREATED.V1',
        total_amount: 0,
        currency_code: 'AED',
        reference_entity_id: newCase.id,
        metadata: {
          case_id: newCase.id,
          case_number: caseNumber,
          created_by: caseData.owner,
          initial_status: caseData.status,
          category: caseData.category
        },
        status: 'completed'
      })

      // For closed cases, create closure transaction
      if (caseData.status === 'closed') {
        const closedAt = new Date(
          Date.now() - Math.floor(Math.random() * 5 + 1) * 24 * 60 * 60 * 1000
        )

        await supabase.from('universal_transactions').insert({
          organization_id: CIVICFLOW_ORG_ID,
          transaction_type: 'case_closed',
          transaction_code: `${txnCode}-CLOSE`,
          transaction_date: closedAt.toISOString(),
          smart_code: 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.CLOSE.V1',
          total_amount: 0,
          currency_code: 'AED',
          reference_entity_id: newCase.id,
          source_entity_id: newCase.id, // Used for timeline queries
          metadata: {
            case_id: newCase.id,
            case_number: caseNumber,
            closed_by: caseData.owner,
            resolution: 'completed',
            outcome: 'resolved'
          },
          status: 'completed'
        })

        // Update resolved_at field
        await supabase.from('core_dynamic_data').insert({
          organization_id: CIVICFLOW_ORG_ID,
          entity_id: newCase.id,
          field_name: 'resolved_at',
          field_value_date: closedAt.toISOString(),
          smart_code: 'HERA.PUBLICSECTOR.CRM.CASE.RESOLVED_AT.V1'
        })
      }

      createdCases.push({
        id: newCase.id,
        case_number: caseNumber,
        title: caseData.entity_name,
        status: caseData.status
      })

      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Created ${createdCases.length} demo cases`)

    // Log summary
    const statusSummary = createdCases.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log('📊 Case Status Summary:', statusSummary)

    return createdCases
  } catch (error) {
    console.error('❌ Error seeding cases:', error)
    throw error
  }
}

// Function to add timeline events to existing cases
export async function addCaseTimelineEvents(caseId: string) {
  const events = [
    {
      type: 'comment',
      description: 'Initial assessment completed. Case assigned to relevant department.',
      metadata: { author: 'System Admin', department: 'Intake' }
    },
    {
      type: 'status_change',
      description: 'Status changed from New to In Review',
      metadata: { from_status: 'new', to_status: 'in_review', changed_by: 'Ahmed Hassan' }
    },
    {
      type: 'attachment_added',
      description: 'Supporting documentation uploaded',
      metadata: { filename: 'supporting_docs.pdf', size: '2.4MB' }
    }
  ]

  for (const event of events) {
    await supabase.from('universal_transactions').insert({
      organization_id: CIVICFLOW_ORG_ID,
      transaction_type: `case_${event.type}`,
      transaction_code: `TXN-EVENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transaction_date: new Date().toISOString(),
      smart_code: `HERA.PUBLICSECTOR.CRM.CASE.EVENT.${event.type.toUpperCase()}.V1`,
      total_amount: 0,
      currency_code: 'AED',
      reference_entity_id: caseId,
      source_entity_id: caseId,
      metadata: {
        ...event.metadata,
        description: event.description,
        case_id: caseId
      },
      status: 'completed'
    })
  }
}

// Function to clear all cases (useful for testing)
export async function clearCivicFlowCases() {
  console.log('🧹 Clearing CivicFlow cases...')

  // Get all case entities
  const { data: cases } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', CIVICFLOW_ORG_ID)
    .eq('entity_type', 'case')

  if (!cases || cases.length === 0) {
    console.log('No cases to clear')
    return
  }

  const caseIds = cases.map(c => c.id)

  // Delete transactions
  await supabase
    .from('universal_transactions')
    .delete()
    .eq('organization_id', CIVICFLOW_ORG_ID)
    .in('reference_entity_id', caseIds)

  // Delete dynamic data
  await supabase
    .from('core_dynamic_data')
    .delete()
    .eq('organization_id', CIVICFLOW_ORG_ID)
    .in('entity_id', caseIds)

  // Delete entities
  await supabase
    .from('core_entities')
    .delete()
    .eq('organization_id', CIVICFLOW_ORG_ID)
    .eq('entity_type', 'case')

  console.log(`✅ Cleared ${cases.length} cases`)
}
