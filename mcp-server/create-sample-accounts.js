import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleAccounts() {
  const orgId = '6e1954fe-e34a-4056-84f4-745e5b8378ec'
  
  const sampleAccounts = [
    {
      entity_name: 'Acme Corporation',
      entity_type: 'ACCOUNT',
      smart_code: 'HERA.CRM.ACCOUNT.ENTITY.COMPANY.V1',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'enterprise', tier: 'gold' }
    },
    {
      entity_name: 'Global Manufacturing Inc',
      entity_type: 'ACCOUNT',
      smart_code: 'HERA.CRM.ACCOUNT.ENTITY.COMPANY.V1',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'enterprise', tier: 'platinum' }
    },
    {
      entity_name: 'TechStartup Inc',
      entity_type: 'ACCOUNT', 
      smart_code: 'HERA.CRM.ACCOUNT.ENTITY.COMPANY.V1',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'startup', tier: 'silver' }
    }
  ]
  
  console.log('Creating sample accounts for retail CRM demo...')
  
  for (const [index, account] of sampleAccounts.entries()) {
    const { data: entity, error } = await supabase
      .from('core_entities')
      .insert(account)
      .select()
      .single()
      
    if (error) {
      console.error('Error creating account:', error)
      continue
    }
    
    console.log(`${index + 1}. Created account: ${entity.entity_name} (ID: ${entity.id})`)
    
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
        smart_code: `HERA.CRM.ACCOUNT.DYN.COMPANY.V1${fieldName.toUpperCase()}.V1`
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
  console.log('✅ Sample Accounts created successfully!')
  console.log('🌐 Visit http://localhost:3001/accounts to view them')
}

const sampleDynamicData = {
  'Acme Corporation': {
    industry: 'Technology',
    website: 'https://acme.com',
    employees: 500,
    revenue: 50000000,
    owner: 'Sarah Wilson'
  },
  'Global Manufacturing Inc': {
    industry: 'Manufacturing',
    website: 'https://globalmanuf.com',
    employees: 1200,
    revenue: 120000000,
    owner: 'Mike Johnson'
  },
  'TechStartup Inc': {
    industry: 'Technology',
    website: 'https://techstartup.io',
    employees: 25,
    revenue: 2500000,
    owner: 'Alex Chen'
  }
}

createSampleAccounts().catch(console.error)