#!/usr/bin/env node
/**
 * Setup Salon Service Lifecycle Workflow
 * Creates workflow for managing salon services from draft to discontinued
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

// Service Lifecycle Workflow Definition
const SERVICE_WORKFLOW = {
  name: 'Service Lifecycle Workflow',
  code: 'SERVICE-LIFECYCLE',
  stages: [
    { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true, color: '#6B7280', icon: 'file' },
    { code: 'ACTIVE', name: 'Active', order: 2, color: '#10B981', icon: 'check-circle' },
    { code: 'POPULAR', name: 'Popular', order: 3, color: '#F59E0B', icon: 'trending-up' },
    { code: 'SEASONAL', name: 'Seasonal', order: 4, color: '#8B5CF6', icon: 'calendar' },
    { code: 'PROMO', name: 'Promotional', order: 5, color: '#EC4899', icon: 'tag' },
    { code: 'DISCONTINUED', name: 'Discontinued', order: 6, isFinal: true, color: '#EF4444', icon: 'x-circle' }
  ],
  transitions: [
    { from: 'DRAFT', to: 'ACTIVE' },
    { from: 'ACTIVE', to: 'POPULAR', automatic: true, condition: 'bookings > 50/month' },
    { from: 'ACTIVE', to: 'SEASONAL' },
    { from: 'ACTIVE', to: 'PROMO' },
    { from: 'ACTIVE', to: 'DISCONTINUED' },
    { from: 'POPULAR', to: 'PROMO' },
    { from: 'POPULAR', to: 'DISCONTINUED' },
    { from: 'SEASONAL', to: 'ACTIVE' },
    { from: 'SEASONAL', to: 'DISCONTINUED' },
    { from: 'PROMO', to: 'ACTIVE' },
    { from: 'PROMO', to: 'DISCONTINUED' }
  ]
}

// Staff Lifecycle Workflow Definition
const STAFF_WORKFLOW = {
  name: 'Staff Lifecycle Workflow',
  code: 'STAFF-LIFECYCLE',
  stages: [
    { code: 'APPLIED', name: 'Applied', order: 1, isInitial: true, color: '#6B7280', icon: 'user-plus' },
    { code: 'INTERVIEWED', name: 'Interviewed', order: 2, color: '#3B82F6', icon: 'message-circle' },
    { code: 'HIRED', name: 'Hired', order: 3, color: '#10B981', icon: 'check' },
    { code: 'TRAINING', name: 'In Training', order: 4, color: '#F59E0B', icon: 'book-open' },
    { code: 'ACTIVE', name: 'Active', order: 5, color: '#10B981', icon: 'user-check' },
    { code: 'ON_LEAVE', name: 'On Leave', order: 6, color: '#8B5CF6', icon: 'pause-circle' },
    { code: 'TERMINATED', name: 'Terminated', order: 7, isFinal: true, color: '#EF4444', icon: 'user-x' }
  ],
  transitions: [
    { from: 'APPLIED', to: 'INTERVIEWED' },
    { from: 'INTERVIEWED', to: 'HIRED', requiresApproval: true },
    { from: 'INTERVIEWED', to: 'TERMINATED', reason: 'Not selected' },
    { from: 'HIRED', to: 'TRAINING' },
    { from: 'TRAINING', to: 'ACTIVE' },
    { from: 'ACTIVE', to: 'ON_LEAVE' },
    { from: 'ON_LEAVE', to: 'ACTIVE' },
    { from: 'ACTIVE', to: 'TERMINATED', requiresApproval: true },
    { from: 'HIRED', to: 'TERMINATED' },
    { from: 'TRAINING', to: 'TERMINATED' }
  ]
}

async function setupWorkflow(orgId, workflow) {
  console.log(`\n📋 Setting up ${workflow.name}...\n`)
  
  try {
    // Check if workflow already exists
    const { data: existingWorkflow } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_template')
      .eq('entity_code', workflow.code)
      .single()
    
    if (existingWorkflow) {
      console.log(`  ✓ ${workflow.name} already exists`)
      return existingWorkflow.id
    }
    
    // Create workflow template
    const { data: workflowEntity, error: workflowError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'workflow_template',
        entity_name: workflow.name,
        entity_code: workflow.code,
        smart_code: `HERA.SALON.WORKFLOW.${workflow.code}.v1`,
        status: 'active',
        metadata: {
          transitions: workflow.transitions,
          auto_assign: true
        }
      })
      .select()
      .single()
    
    if (workflowError) throw workflowError
    console.log(`  ✅ Created ${workflow.name}`)
    
    // Create status entities
    const statusMap = {}
    
    for (const stage of workflow.stages) {
      const { data: status, error: statusError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'workflow_status',
          entity_name: stage.name,
          entity_code: `STATUS-${workflow.code}-${stage.code}`,
          smart_code: `HERA.SALON.STATUS.${workflow.code}.${stage.code}.v1`,
          status: 'active',
          metadata: {
            color: stage.color,
            icon: stage.icon,
            order: stage.order,
            is_initial: stage.isInitial || false,
            is_final: stage.isFinal || false
          }
        })
        .select()
        .single()
      
      if (statusError) throw statusError
      statusMap[stage.code] = status.id
      console.log(`  ✅ Created status: ${stage.name}`)
      
      // Link status to workflow
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: workflowEntity.id,
          to_entity_id: status.id,
          relationship_type: 'has_stage',
          smart_code: 'HERA.WORKFLOW.STAGE.LINK.v1',
          relationship_data: {
            order: stage.order,
            is_initial: stage.isInitial,
            is_final: stage.isFinal
          }
        })
    }
    
    // Create transitions
    for (const transition of workflow.transitions) {
      const fromId = statusMap[transition.from]
      const toId = statusMap[transition.to]
      
      if (!fromId || !toId) continue
      
      const { error: transitionError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: fromId,
          to_entity_id: toId,
          relationship_type: 'can_transition_to',
          smart_code: 'HERA.WORKFLOW.TRANSITION.v1',
          relationship_data: {
            requires_approval: transition.requiresApproval || false,
            automatic: transition.automatic || false,
            condition: transition.condition,
            reason: transition.reason
          }
        })
      
      if (transitionError) {
        console.error(`  ⚠️ Failed to create transition ${transition.from} → ${transition.to}`)
      } else {
        console.log(`  ✅ Created transition: ${transition.from} → ${transition.to}`)
      }
    }
    
    return workflowEntity.id
  } catch (error) {
    console.error(`  ❌ Error setting up workflow:`, error.message)
    throw error
  }
}

async function createSampleServices(orgId) {
  console.log('\n💇 Creating sample services...\n')
  
  const sampleServices = [
    { name: 'Premium Haircut', price: 65, duration: 45, category: 'Hair', status: 'ACTIVE' },
    { name: 'Hair Color & Highlights', price: 150, duration: 120, category: 'Hair', status: 'POPULAR' },
    { name: 'Luxury Spa Manicure', price: 55, duration: 60, category: 'Nails', status: 'ACTIVE' },
    { name: 'Summer Beach Waves', price: 85, duration: 90, category: 'Hair', status: 'SEASONAL' },
    { name: 'Student Discount Cut', price: 35, duration: 30, category: 'Hair', status: 'PROMO' }
  ]
  
  for (const serviceData of sampleServices) {
    try {
      // Create service entity
      const { data: service } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'service',
          entity_name: serviceData.name,
          entity_code: `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: 'HERA.SALON.SERVICE.v1',
          status: 'active',
          metadata: {
            price: serviceData.price,
            duration_minutes: serviceData.duration,
            category: serviceData.category
          }
        })
        .select()
        .single()
      
      if (!service) continue
      
      // Assign workflow status
      const { data: statusEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `STATUS-SERVICE-LIFECYCLE-${serviceData.status}`)
        .single()
      
      if (statusEntity) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: orgId,
            from_entity_id: service.id,
            to_entity_id: statusEntity.id,
            relationship_type: 'has_workflow_status',
            smart_code: 'HERA.WORKFLOW.SERVICE.STATUS.v1',
            relationship_data: {
              workflow_template_id: 'SERVICE-LIFECYCLE',
              assigned_at: new Date().toISOString(),
              is_active: true
            }
          })
        
        console.log(`  ✅ Created ${serviceData.name} ($${serviceData.price}) - ${serviceData.status}`)
      }
    } catch (error) {
      console.error(`  ❌ Failed to create ${serviceData.name}:`, error.message)
    }
  }
}

async function createSampleStaff(orgId) {
  console.log('\n👥 Creating sample staff members...\n')
  
  const sampleStaff = [
    { name: 'Maria Rodriguez', role: 'Senior Stylist', status: 'ACTIVE' },
    { name: 'John Chen', role: 'Stylist', status: 'ACTIVE' },
    { name: 'Emily Johnson', role: 'Junior Stylist', status: 'TRAINING' },
    { name: 'David Park', role: 'Nail Technician', status: 'ACTIVE' },
    { name: 'Sarah Williams', role: 'Receptionist', status: 'ON_LEAVE' }
  ]
  
  for (const staffData of sampleStaff) {
    try {
      // Create staff entity
      const { data: staff } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'employee',
          entity_name: staffData.name,
          entity_code: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: 'HERA.SALON.EMPLOYEE.v1',
          status: 'active',
          metadata: {
            role: staffData.role,
            hire_date: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (!staff) continue
      
      // Assign workflow status
      const { data: statusEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `STATUS-STAFF-LIFECYCLE-${staffData.status}`)
        .single()
      
      if (statusEntity) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: orgId,
            from_entity_id: staff.id,
            to_entity_id: statusEntity.id,
            relationship_type: 'has_workflow_status',
            smart_code: 'HERA.WORKFLOW.STAFF.STATUS.v1',
            relationship_data: {
              workflow_template_id: 'STAFF-LIFECYCLE',
              assigned_at: new Date().toISOString(),
              is_active: true
            }
          })
        
        console.log(`  ✅ Created ${staffData.name} (${staffData.role}) - ${staffData.status}`)
      }
    } catch (error) {
      console.error(`  ❌ Failed to create ${staffData.name}:`, error.message)
    }
  }
}

async function main() {
  console.log('🏪 Salon Service & Staff Workflow Setup\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    // Setup workflows
    await setupWorkflow(orgId, SERVICE_WORKFLOW)
    await setupWorkflow(orgId, STAFF_WORKFLOW)
    
    // Create sample data
    await createSampleServices(orgId)
    await createSampleStaff(orgId)
    
    console.log('\n✅ Service & Staff workflows setup complete!')
    console.log('\n🚀 Next steps:')
    console.log('  1. View services and staff in the salon app')
    console.log('  2. Manage service lifecycle (Draft → Active → Popular)')
    console.log('  3. Track staff journey (Applied → Hired → Active)')
    console.log('  4. Use workflow transitions for business decisions')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
main()