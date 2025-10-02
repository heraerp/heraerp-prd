const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function queryFunctionSource() {
  console.log('🔍 Querying hera_entity_upsert_v1 function source...\n');
  
  const { data, error } = await supabase.rpc('pg_get_functiondef', {
    funcid: (await supabase.rpc('to_regprocedure', { 
      text: 'hera_entity_upsert_v1(uuid,text,text,text,uuid,text,text,uuid,text,text[],text,jsonb,jsonb,numeric,text,jsonb,jsonb,uuid)' 
    })).data
  });
  
  if (error) {
    console.log('❌ Error:', error);
    console.log('\n💡 Trying simpler query...');
    
    // Try using pg_proc directly  
    const { data: procData, error: procError } = await supabase
      .from('pg_proc')
      .select('prosrc')
      .eq('proname', 'hera_entity_upsert_v1')
      .single();
      
    if (procError) {
      console.log('❌ Also failed:', procError);
    } else {
      console.log('📜 Function source:');
      console.log(procData.prosrc);
    }
  } else {
    console.log('📜 Function definition:');
    console.log(data);
  }
}

queryFunctionSource().catch(console.error);
