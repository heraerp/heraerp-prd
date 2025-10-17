import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleContacts() {
  const orgId = '6e1954fe-e34a-4056-84f4-745e5b8378ec'
  
  const sampleContacts = [
    {
      entity_name: 'John Smith',
      entity_type: 'CONTACT', 
      smart_code: 'HERA.CRM.CONTACT.ENTITY.PERSON.V1',
      status: 'active',
      organization_id: orgId,
      metadata: { contact_type: 'business', source: 'direct' }
    },
    {
      entity_name: 'Maria Rodriguez',
      entity_type: 'CONTACT',
      smart_code: 'HERA.CRM.CONTACT.ENTITY.PERSON.V1', 
      status: 'active',
      organization_id: orgId,
      metadata: { contact_type: 'business', source: 'referral' }
    },
    {
      entity_name: 'David Chen',
      entity_type: 'CONTACT',
      smart_code: 'HERA.CRM.CONTACT.ENTITY.PERSON.V1',
      status: 'active',
      organization_id: orgId,
      metadata: { contact_type: 'lead', source: 'website' }
    },
    {
      entity_name: 'Lisa Park',
      entity_type: 'CONTACT',
      smart_code: 'HERA.CRM.CONTACT.ENTITY.PERSON.V1',
      status: 'active',
      organization_id: orgId,
      metadata: { contact_type: 'business', source: 'trade_show' }
    },
    {
      entity_name: 'Robert Johnson',
      entity_type: 'CONTACT',
      smart_code: 'HERA.CRM.CONTACT.ENTITY.PERSON.V1',
      status: 'active',
      organization_id: orgId,
      metadata: { contact_type: 'executive', source: 'cold_outreach' }
    }
  ]
  
  console.log('Creating sample contacts for retail CRM demo...')
  
  for (const [index, contact] of sampleContacts.entries()) {
    const { data: entity, error } = await supabase
      .from('core_entities')
      .insert(contact)
      .select()
      .single()
      
    if (error) {
      console.error('Error creating contact:', error)
      continue
    }
    
    console.log(`${index + 1}. Created contact: ${entity.entity_name} (ID: ${entity.id})`)
    
    // Add dynamic fields for each contact
    const contactDynamicFields = {
      'John Smith': {
        email: 'john.smith@acme.com',
        phone: '+1-555-0123',
        title: 'VP of Sales',
        account: 'Acme Corporation',
        department: 'Sales',
        owner: 'Sarah Wilson'
      },
      'Maria Rodriguez': {
        email: 'maria.r@globalmanuf.com', 
        phone: '+1-555-0456',
        title: 'Chief Technology Officer',
        account: 'Global Manufacturing Inc',
        department: 'Technology',
        owner: 'Mike Johnson'
      },
      'David Chen': {
        email: 'dchen@healthcaresol.com',
        phone: '+1-555-0789', 
        title: 'Director of Operations',
        account: 'Healthcare Solutions LLC',
        department: 'Operations',
        owner: 'Alex Chen'
      },
      'Lisa Park': {
        email: 'lisa.park@retailchain.com',
        phone: '+1-555-0321',
        title: 'Marketing Manager', 
        account: 'Retail Chain Co',
        department: 'Marketing',
        owner: 'Sarah Wilson'
      },
      'Robert Johnson': {
        email: 'rjohnson@techstartup.io',
        phone: '+1-555-0654',
        title: 'Founder & CEO',
        account: 'TechStartup Inc', 
        department: 'Executive',
        owner: 'Mike Johnson'
      }
    }
    
    const fieldsData = contactDynamicFields[contact.entity_name]
    if (!fieldsData) continue
    
    const dynamicFields = []
    for (const [fieldName, fieldValue] of Object.entries(fieldsData)) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: entity.id,
        field_name: fieldName,
        field_type: 'text',
        field_value_text: fieldValue,
        smart_code: `HERA.CRM.CONTACT.DYN.${fieldName.toUpperCase()}.V1`
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
  console.log('✅ Sample CRM contacts created successfully!')
  console.log('🌐 Visit http://localhost:3001/crm/contacts to view them')
}

createSampleContacts().catch(console.error)