const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createOrg() {
  const { data, error } = await supabase
    .from('core_organizations')
    .insert({
      id: '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77',
      organization_name: 'CivicFlow Demo Organization',
      organization_code: 'CIVICFLOW-DEMO'
    })
    .single();
    
  if (error) {
    console.error('Error creating organization:', error.message);
  } else {
    console.log('Organization created successfully');
  }
}

createOrg();
