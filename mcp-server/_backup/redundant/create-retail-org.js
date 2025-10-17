import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createRetailOrg() {
  // First check if we have a client_id to reference
  const { data: clients } = await supabase
    .from('core_clients')
    .select('*')
    .limit(1)
  
  let clientId = clients && clients[0] ? clients[0].id : null
  
  // If no client exists, create one first
  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from('core_clients')
      .insert({
        client_name: 'HERA Demo Enterprises',
        client_code: 'HERA-DEMO',
        client_type: 'enterprise',
        industry: 'multi_industry',
        status: 'active'
      })
      .select()
      .single()
      
    if (clientError) {
      console.error('Error creating client:', clientError)
      return
    }
    
    clientId = newClient.id
    console.log('Created client:', newClient.client_name, 'ID:', clientId)
  }
  
  // Create retail organization
  const retailOrg = {
    organization_name: 'HERA Retail CRM Demo',
    organization_code: 'RETAIL-CRM',
    organization_type: 'subsidiary',
    industry: 'retail',
    business_size: 'medium',
    email: 'crm@heraretail.com',
    phone: '+1-800-HERA-CRM',
    website: 'https://retail.heraerp.com',
    status: 'active',
    subscription_tier: 'professional',
    client_id: clientId,
    legal_entity_name: 'HERA Retail CRM Demo LLC',
    country_code: 'US',
    region: 'North America',
    functional_currency: 'USD',
    reporting_currency: 'USD',
    settings: {
      crm_enabled: true,
      features: ['contacts', 'accounts', 'opportunities', 'activities'],
      ui_theme: 'sap_fiori'
    }
  }
  
  const { data: newOrg, error } = await supabase
    .from('core_organizations')
    .insert(retailOrg)
    .select()
    .single()
    
  if (error) {
    console.error('Error creating retail organization:', error)
    return
  }
  
  console.log('✅ Created retail organization:')
  console.log('Name:', newOrg.organization_name)
  console.log('Code:', newOrg.organization_code)
  console.log('ID:', newOrg.id)
  console.log('')
  console.log('🔧 To use this organization, update your .env file:')
  console.log('DEFAULT_ORGANIZATION_ID=' + newOrg.id)
  console.log('NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=' + newOrg.id)
  
  return newOrg.id
}

createRetailOrg().catch(console.error)