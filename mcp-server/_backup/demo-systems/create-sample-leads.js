import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleLeads() {
  const orgId = '6e1954fe-e34a-4056-84f4-745e5b8378ec'
  
  const sampleLeads = [
    
  ]
  
  console.log('Creating sample leads for retail CRM demo...')
  
  for (const [index, lead] of sampleLeads.entries()) {
    const { data: entity, error } = await supabase
      .from('core_entities')
      .insert(lead)
      .select()
      .single()
      
    if (error) {
      console.error('Error creating lead:', error)
      continue
    }
    
    console.log(`${index + 1}. Created lead: ${entity.entity_name} (ID: ${entity.id})`)
    
    // Add dynamic fields
    const fieldsData = sampleDynamicData[entity.entity_name]
    if (!fieldsData) continue
    
    const dynamicFields = []
    for (const [fieldName, fieldValue] of Object.entries(fieldsData)) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: entity.id,
        field_name: fieldName,
        field_type: typeof fieldValue === 'number' ? 'number' : 'text',
        field_value_text: typeof fieldValue === 'number' ? null : fieldValue,
        field_value_number: typeof fieldValue === 'number' ? fieldValue : null,
        smart_code: `HERA.CRM.LEAD.DYN.PROSPECT.V1${fieldName.toUpperCase()}.V1`
      })
    }
    
    const { error: dynError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicFields)
      
    if (dynError) {
      console.error(`Error creating dynamic fields for ${entity.entity_name}:`, dynError)
    } else {
      console.log(`   ✅ Added dynamic fields: ${Object.keys(fieldsData).join(', ')}`)
    }
  }
  
  console.log('')
  console.log('✅ Sample Leads created successfully!')
  console.log('🌐 Visit http://localhost:3001/leads to view them')
}

const sampleDynamicData = {
  
}

createSampleLeads().catch(console.error)