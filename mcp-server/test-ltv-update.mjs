import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^[|"]|["|']$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLTVUpdate() {
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hairtalkz
  const customerId = '1d1534f4-f10d-4bf1-99c8-bbc35ecccfec'; // Aisha banu
  const actorUserId = '7ca5620e-19f5-446c-9af5-8a71f9de6b6a'; // Assuming this is a valid actor

  console.log('🧪 Testing LTV Update with CORRECTED Format\n');
  console.log('Customer:', customerId.substring(0, 12), '(Aisha banu)');
  console.log('Organization:', orgId.substring(0, 12));
  console.log('Actor:', actorUserId.substring(0, 12));

  // Step 1: Read customer to get current data
  console.log('\n📖 STEP 1: Reading customer entity...');
  const { data: readResult, error: readError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_id: customerId
    },
    p_options: {
      include_dynamic: true,
      include_relationships: false
    }
  });

  if (readError) {
    console.error('❌ READ Error:', readError);
    return;
  }

  if (!readResult?.success) {
    console.error('❌ READ Failed:', readResult);
    return;
  }

  const customer = readResult.data;
  console.log('✅ Customer found:', customer.entity_name);
  console.log('   Current LTV:', customer.lifetime_value || 0);
  console.log('   Dynamic fields count:', customer.dynamic_fields?.length || 0);

  // Step 2: Update with CORRECT format
  const testLTV = 301.875; // Sum of 2 sales (150.9375 each)

  console.log('\n📝 STEP 2: Updating LTV with CORRECTED format...');
  console.log('   New LTV value:', testLTV);
  console.log('   Format: { value: string, type: "number", smart_code: string }');

  const { data: updateResult, error: updateError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_id: customerId,
      entity_name: customer.entity_name
    },
    p_dynamic: {
      lifetime_value: {
        value: testLTV.toString(), // ✅ String representation
        type: 'number',             // ✅ Correct property name
        smart_code: 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1'
      }
    },
    p_relationships: [],
    p_options: {}
  });

  if (updateError) {
    console.error('\n❌ UPDATE Error:', updateError);
    console.error('   Message:', updateError.message);
    console.error('   Details:', updateError.details);
    console.error('   Hint:', updateError.hint);
    console.error('   Code:', updateError.code);
    return;
  }

  if (!updateResult?.success) {
    console.error('\n❌ UPDATE Failed:');
    console.error(JSON.stringify(updateResult, null, 2));
    return;
  }

  console.log('\n✅ UPDATE Successful!');
  console.log('   Result:', JSON.stringify(updateResult, null, 2));

  // Step 3: Verify the update
  console.log('\n🔍 STEP 3: Verifying update...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_id', customerId)
    .eq('field_name', 'lifetime_value');

  if (verifyError) {
    console.error('❌ Verification Error:', verifyError);
    return;
  }

  console.log('✅ Database verification:');
  if (verifyData && verifyData.length > 0) {
    console.log('   LTV field exists in core_dynamic_data!');
    console.log('   Value:', verifyData[0].field_value_number);
    console.log('   Smart Code:', verifyData[0].smart_code);
    console.log('   Created:', verifyData[0].created_at);
  } else {
    console.log('   ⚠️  NO LTV field found in database after update!');
  }
}

testLTVUpdate().then(() => process.exit(0)).catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
