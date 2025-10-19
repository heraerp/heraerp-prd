import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStaffSmartCode() {
  console.log('Fixing staff smart_code from lowercase v1 to uppercase V1...');
  
  const { data, error } = await supabase
    .from('core_entities')
    .update({ smart_code: 'HERA.GENERIC.IDENTITY.ENTITY.PERSON.V1' })
    .eq('id', 'e20ca737-c273-45ac-97b0-f40c07f4d441')
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Fixed staff smart_code:', data);
  }
}

fixStaffSmartCode().then(() => process.exit(0));
