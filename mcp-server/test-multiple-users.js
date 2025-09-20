const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMultipleUsers() {
  console.log('🔍 Checking for multiple demo users...');
  
  const { data: users, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .eq('entity_type', 'user')
    .eq('metadata->>supabase_user_id', 'demo|salon-receptionist');
  
  console.log('Users found:', users?.length || 0);
  
  if (users) {
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user.id,
        entity_name: user.entity_name,
        created_at: user.created_at,
        metadata: user.metadata
      });
    });
  }
  
  if (error) {
    console.error('Error:', error);
  }
}

checkMultipleUsers().catch(console.error);