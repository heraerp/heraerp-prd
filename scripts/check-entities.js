#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HO_ORG_ID = "30cbd9d1-7610-4e6a-9694-ea259dc6b23a";

async function checkEntities() {
  const { data: entities } = await supabase
    .from('core_entities')
    .select('entity_code, entity_type, smart_code')
    .eq('organization_id', HO_ORG_ID)
    .order('entity_code');
  
  console.log('Current entities in HO:');
  console.table(entities);
}

checkEntities();