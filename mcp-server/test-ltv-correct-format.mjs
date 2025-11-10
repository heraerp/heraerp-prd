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
    env[match[1].trim()] = match[2].trim().replace(/^["|']|["|']$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLTVUpdateWithCorrectFormat() {
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hairtalkz
  const customerId = '1d1534f4-f10d-4bf1-99c8-bbc35ecccfec'; // Aisha banu
  const actorUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674'; // ✅ WORKING ACTOR from test-customer-crud.mjs

  console.log('🧪 Testing LTV Update with CORRECT Format (Simple Format)\n');
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
    p_dynamic: {},
    p_relationships: {},
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

  // ✅ CORRECT: Extract entity from nested structure
  console.log('DEBUG: Full response:');
  console.log(JSON.stringify(readResult, null, 2));

  const responseData = readResult.data;  // { data: { entity: ..., dynamic_data: [...] } }
  const customer = responseData.entity;
  console.log('DEBUG: Customer:', JSON.stringify(customer, null, 2));
  console.log('✅ Customer found:', customer?.entity_name || 'UNDEFINED');

  // Extract current LTV from dynamic_data array
  let currentLTV = 0;
  const dynamicData = responseData.dynamic_data || [];
  const ltvField = dynamicData.find(f => f.field_name === 'lifetime_value');
  currentLTV = ltvField?.field_value_number || 0;

  console.log('   Current LTV:', currentLTV);
  console.log('   Dynamic fields count:', dynamicData.length);

  // Step 2: Update with CORRECT SIMPLE format
  const testLTV = 452.34; // New test value

  console.log('\n📝 STEP 2: Updating LTV with CORRECT SIMPLE format...');
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
        value: testLTV.toString(),  // ✅ CORRECT: String representation
        type: 'number',              // ✅ CORRECT: Simple format
        smart_code: 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1'
      }
    },
    p_relationships: {},
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
  console.log('   Success:', updateResult.success);
  console.log('   Action:', updateResult.action);

  // Step 3: Verify the update in database
  console.log('\n🔍 STEP 3: Verifying update in database...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_id', customerId)
    .eq('field_name', 'lifetime_value')
    .maybeSingle();

  if (verifyError) {
    console.error('❌ Verification Error:', verifyError);
    return;
  }

  console.log('✅ Database verification:');
  if (verifyData) {
    console.log('   ✅ LTV field EXISTS in core_dynamic_data!');
    console.log('   Value:', verifyData.field_value_number);
    console.log('   Smart Code:', verifyData.smart_code);
    console.log('   Created:', verifyData.created_at);
    console.log('   Updated:', verifyData.updated_at);

    if (verifyData.field_value_number === testLTV) {
      console.log('\n🎉 SUCCESS: LTV value matches exactly!');
    } else {
      console.log('\n⚠️  WARNING: LTV value does not match (expected:', testLTV, 'got:', verifyData.field_value_number, ')');
    }
  } else {
    console.log('   ❌ NO LTV field found in database after update!');
  }

  // Step 4: Read customer again via RPC to confirm
  console.log('\n📖 STEP 4: Reading customer via RPC to confirm...');
  const { data: confirmResult, error: confirmError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_id: customerId
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      include_relationships: false
    }
  });

  if (confirmError) {
    console.error('❌ Confirm READ Error:', confirmError);
    return;
  }

  console.log('✅ Confirmation read successful');
  const confirmData = confirmResult.data;
  const confirmDynamicData = confirmData.dynamic_data || [];
  const confirmLtvField = confirmDynamicData.find(f => f.field_name === 'lifetime_value');

  if (confirmLtvField) {
    console.log('   ✅ LTV field found in dynamic_data array');
    console.log('   Value:', confirmLtvField.field_value_number);
    console.log('   Type:', confirmLtvField.field_type);
    console.log('   Smart Code:', confirmLtvField.smart_code);

    if (confirmLtvField.field_value_number === testLTV) {
      console.log('\n🎊 COMPLETE SUCCESS: LTV update working perfectly!');
      console.log('   ✅ RPC UPDATE succeeded');
      console.log('   ✅ Database has correct value');
      console.log('   ✅ RPC READ returns correct value');
    }
  } else {
    console.log('   ❌ LTV field NOT found in dynamic_data array!');
  }
}

testLTVUpdateWithCorrectFormat().then(() => process.exit(0)).catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
