const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCategory() {
  const { data, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', '7dd1b1e2-b2cd-443d-baa9-23c93ef64534')
    .single();
    
  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ Category created successfully:');
    console.log(JSON.stringify(data, null, 2));
  }
}

verifyCategory();
