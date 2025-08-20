const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRelationships() {
  const { data, error } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('organization_id', '3df8cc52-3d81-42d5-b088-7736ae26cc7c')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} relationships for Mario's Restaurant:`);
  data.forEach((rel, i) => {
    console.log(`\n${i + 1}. ${rel.relationship_type}`);
    console.log(`   ID: ${rel.id}`);
    console.log(`   From: ${rel.from_entity_id}`);
    console.log(`   To: ${rel.to_entity_id}`);
    console.log(`   Data:`, rel.relationship_data);
  });
}

checkRelationships();