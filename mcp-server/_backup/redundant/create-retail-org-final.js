import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createRetailOrg() {
  // Create retail organization using actual schema
  const retailOrg = {
    organization_name: 'HERA Retail CRM Demo',
    organization_code: 'RETAIL-CRM',
    organization_type: 'subsidiary',
    industry_classification: 'Retail & E-commerce',
    status: 'active',
    settings: {
      crm_enabled: true,
      features: ['contacts', 'accounts', 'opportunities', 'activities'],
      ui_theme: 'sap_fiori',
      contact_email: 'crm@heraretail.com',
      phone: '+1-800-HERA-CRM',
      website: 'https://retail.heraerp.com'
    },
    ai_insights: {
      business_description: 'Retail organization for demonstrating HERA CRM capabilities',
      primary_use_cases: ['contact_management', 'lead_tracking', 'opportunity_pipeline', 'customer_relationships']
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