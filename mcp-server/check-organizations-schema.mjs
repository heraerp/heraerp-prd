#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking core_organizations schema...\n');

// Get table columns
const { data, error } = await supabase
  .from('core_organizations')
  .select('*')
  .limit(1)
  .single();

if (error && error.code !== 'PGRST116') {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ Sample row structure:');
  if (data) {
    Object.keys(data).forEach(key => {
      console.log(`   - ${key}: ${typeof data[key]}`);
    });
  }
}
