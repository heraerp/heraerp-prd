#!/usr/bin/env node
/**
 * Add Universal Workflow DNA to HERA DNA System
 * This makes workflow patterns reusable across all HERA applications
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addWorkflowDNA() {
  console.log('🧬 Adding Universal Workflow DNA to HERA System...\n')
  
  try {
    // Get DNA organization
    const { data: dnaOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_code', 'HERA-DNA-SYS')
      .single()
    
    if (orgError || !dnaOrg) {
      console.error('❌ DNA System Organization not found. Creating it now...')
      
      // Create DNA organization
      const { data: newOrg } = await supabase
        .from('core_organizations')
        .insert({
          organization_name: 'HERA DNA Component System',
          organization_code: 'HERA-DNA-SYS',
          organization_type: 'hera_system',
          industry_classification: 'component_development',
          ai_insights: {
            purpose: 'Universal component DNA library',
            reusable_patterns: true,
            design_systems: ['glassmorphism', 'fiori', 'modern']
          },
          settings: {
            auto_evolution: true,
            pattern_learning: true,
            cross_industry_reuse: true
          },
          status: 'active'
        })
        .select()
        .single()
      
      dnaOrgId = newOrg.id
      console.log('✅ Created DNA System Organization')
    } else {
      dnaOrgId = dnaOrg.id
    }
    
    console.log(`DNA Organization ID: ${dnaOrgId}\n`)
    
    // 1. Create Workflow Engine DNA
    const { data: workflowEngine, error: engineError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: dnaOrgId,
        entity_type: 'dna_component',
        entity_name: 'Universal Workflow Engine',
        entity_code: 'DNA-WORKFLOW-ENGINE',
        entity_description: 'Complete workflow management engine using only relationships table for status tracking',
        smart_code: 'HERA.DNA.WORKFLOW.ENGINE.v1',
        metadata: {
          component_type: 'business_module',
          category: 'workflow_management',
          implementation: {
            file_path: '/src/lib/universal-workflow.ts',
            class_name: 'UniversalWorkflow',
            methods: [
              'createWorkflowTemplate',
              'assignWorkflow',
              'transitionStatus',
              'getCurrentStatus',
              'getWorkflowHistory',
              'getAvailableTransitions'
            ]
          },
          features: [
            'Status tracking via relationships',
            'Workflow templates',
            'Automatic transitions',
            'Approval workflows',
            'Complete audit trail',
            'Multi-tenant support'
          ],
          dependencies: ['universal-api']
        },
        ai_insights: {
          innovation: 'Zero schema changes - uses existing 6-table architecture',
          reusability: 'Works with any transaction type',
          scalability: 'Handles unlimited workflows and statuses'
        },
        status: 'active'
      })
      .select()
      .single()
    
    if (engineError) {
      console.error('❌ Failed to create Workflow Engine DNA:', engineError)
    } else {
      console.log('✅ Created Workflow Engine DNA')
    }
    
    // 2. Create Workflow Tracker UI DNA
    const { data: workflowTracker } = await supabase
      .from('core_entities')
      .insert({
        organization_id: dnaOrgId,
        entity_type: 'dna_component',
        entity_name: 'Universal Workflow Tracker UI',
        entity_code: 'DNA-WORKFLOW-TRACKER',
        entity_description: 'React component for displaying and managing workflow status with full UI',
        smart_code: 'HERA.DNA.WORKFLOW.TRACKER.UI.v1',
        metadata: {
          component_type: 'ui_component',
          category: 'workflow_management',
          implementation: {
            file_path: '/src/components/workflow/UniversalWorkflowTracker.tsx',
            component_name: 'UniversalWorkflowTracker',
            props: {
              transactionId: 'string',
              organizationId: 'string',
              userId: 'string',
              onStatusChange: 'function',
              compact: 'boolean'
            }
          },
          features: [
            'Status display with color coding',
            'Transition dropdown menu',
            'History timeline',
            'Compact and full views',
            'Transition dialog with reason',
            'Loading states'
          ],
          ui_patterns: ['shadcn/ui', 'lucide-icons'],
          dependencies: ['UniversalWorkflow', 'shadcn-components']
        },
        ai_insights: {
          user_experience: 'Intuitive workflow visualization',
          flexibility: 'Works in tables or detail views',
          accessibility: 'WCAG compliant status indicators'
        },
        status: 'active'
      })
      .select()
      .single()
    
    console.log('✅ Created Workflow Tracker UI DNA')
    
    // 3. Create Workflow Templates DNA
    const { data: workflowTemplates } = await supabase
      .from('core_entities')
      .insert({
        organization_id: dnaOrgId,
        entity_type: 'dna_component',
        entity_name: 'Workflow Template Library',
        entity_code: 'DNA-WORKFLOW-TEMPLATES',
        entity_description: 'Pre-built workflow templates for common business processes',
        smart_code: 'HERA.DNA.WORKFLOW.TEMPLATES.v1',
        metadata: {
          component_type: 'configuration_library',
          category: 'workflow_management',
          templates: {
            SALES_ORDER: {
              stages: ['Draft', 'Submitted', 'Approved', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
              auto_transitions: ['Approved->Processing'],
              approval_required: ['Submitted->Approved']
            },
            APPOINTMENT: {
              stages: ['Scheduled', 'Confirmed', 'Reminded', 'Checked In', 'In Service', 'Completed', 'Paid', 'Cancelled', 'No Show'],
              auto_transitions: ['Confirmed->Reminded'],
              time_based: true
            },
            INVOICE: {
              stages: ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Void'],
              auto_transitions: ['Sent->Viewed'],
              overdue_rules: true
            },
            PURCHASE_ORDER: {
              stages: ['Draft', 'Submitted', 'Approved', 'Ordered', 'Received', 'Completed', 'Cancelled'],
              approval_required: ['Submitted->Approved'],
              goods_receipt: true
            }
          },
          extensibility: 'Add custom templates for any industry'
        },
        ai_insights: {
          coverage: 'Handles 80%+ of business workflows',
          customizable: 'Easy to modify for specific needs',
          best_practices: 'Based on industry standards'
        },
        status: 'active'
      })
      .select()
      .single()
    
    console.log('✅ Created Workflow Template Library DNA')
    
    // 4. Add implementation examples
    if (workflowEngine) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: dnaOrgId,
          entity_id: workflowEngine.id,
          field_name: 'usage_example',
          field_type: 'code',
          field_value_text: `// 1. Setup workflow templates (one-time)
cd mcp-server && node setup-universal-workflow.js

// 2. Auto-assign workflow to transactions
const appointment = await createAppointment(data)
const workflow = new UniversalWorkflow(orgId)
await workflow.assignWorkflow(appointment.id, 'APPOINTMENT')

// 3. Add UI tracker to any view
<UniversalWorkflowTracker
  transactionId={appointment.id}
  organizationId={organizationId}
  userId={userId}
  onStatusChange={handleStatusChange}
/>

// 4. Programmatic transitions
await workflow.transitionStatus(
  appointmentId,
  confirmedStatusId,
  { userId, reason: 'Customer confirmed' }
)`,
          smart_code: 'HERA.DNA.WORKFLOW.USAGE.EXAMPLE.v1',
          field_order: 1
        })
      
      console.log('✅ Added workflow usage examples')
    }
    
    console.log('\n🎉 Universal Workflow DNA successfully added to HERA!')
    console.log('\n📚 Next steps:')
    console.log('  1. Run setup-universal-workflow.js to create templates')
    console.log('  2. Import UniversalWorkflow in any app')
    console.log('  3. Add UniversalWorkflowTracker to your UI')
    console.log('  4. Workflows automatically track all status changes')
    
    // Show DNA components created
    console.log('\n🧬 DNA Components Created:')
    const { data: dnaComponents } = await supabase
      .from('core_entities')
      .select('entity_name, entity_code, smart_code')
      .eq('organization_id', dnaOrgId)
      .eq('entity_type', 'dna_component')
      .like('entity_code', 'DNA-WORKFLOW-%')
    
    dnaComponents?.forEach(comp => {
      console.log(`  - ${comp.entity_name} (${comp.entity_code})`)
    })
    
  } catch (error) {
    console.error('\n❌ Failed to add Workflow DNA:', error)
    process.exit(1)
  }
}

// Run the script
addWorkflowDNA()