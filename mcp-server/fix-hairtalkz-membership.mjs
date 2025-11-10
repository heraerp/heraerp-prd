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

async function fixMembership() {
  const actorId = '001a2eb9-b14c-4dda-ae8c-595fb377a982'; // Hairtalkz Owner
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hairtalkz org

  console.log('🔧 Fixing Membership for Hairtalkz Owner\n');
  console.log('User Entity ID:', actorId);
  console.log('Organization ID:', orgId);

  // Check if membership already exists
  const { data: existing } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', actorId)
    .eq('to_entity_id', orgId)
    .eq('relationship_type', 'MEMBER_OF')
    .maybeSingle();

  if (existing) {
    console.log('\n✅ Membership already exists!');
    console.log('   Status:', existing.status);
    return;
  }

  console.log('\n📝 Creating MEMBER_OF relationship...');

  // Create membership relationship
  const { data: relationship, error } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: actorId,
      to_entity_id: orgId,
      relationship_type: 'MEMBER_OF',
      organization_id: orgId,
      smart_code: 'HERA.PLATFORM.REL.MEMBER_OF.USER.v1',
      relationship_data: {
        role: 'owner',
        label: 'owner'
      },
      status: 'active',
      created_by: actorId,
      updated_by: actorId
    })
    .select()
    .single();

  if (error) {
    console.error('\n❌ Error creating membership:', error.message);
    console.error('   Details:', error.details);
    return;
  }

  console.log('\n✅ Membership created successfully!');
  console.log('   Relationship ID:', relationship.id);
  console.log('   Status:', relationship.status);
  console.log('   Role:', relationship.relationship_data?.role);

  // Verify it works now
  console.log('\n🧪 Testing LTV update with fixed membership...');

  const customerId = '1d1534f4-f10d-4bf1-99c8-bbc35ecccfec'; // Aisha banu
  const testLTV = 301.875;

  // Read customer first
  const { data: readResult, error: readError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: actorId,
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
    console.error('❌ Read Error:', readError);
    return;
  }

  const customer = readResult.data;

  // Try UPDATE now
  const { data: updateResult, error: updateError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_entity: {
      entity_id: customerId,
      entity_name: customer.entity_name
    },
    p_dynamic: {
      lifetime_value: {
        value: testLTV.toString(),
        type: 'number',
        smart_code: 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1'
      }
    },
    p_relationships: [],
    p_options: {}
  });

  if (updateError) {
    console.error('\n❌ Update still failing:', updateError);
    return;
  }

  if (!updateResult?.success) {
    console.error('\n❌ Update failed:', updateResult);
    return;
  }

  console.log('\n✅✅✅ LTV UPDATE SUCCESSFUL!');
  console.log('   Customer:', customer.entity_name);
  console.log('   New LTV:', testLTV);

  // Verify in database
  const { data: verifyData } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_id', customerId)
    .eq('field_name', 'lifetime_value')
    .single();

  if (verifyData) {
    console.log('\n✅ Database verification:');
    console.log('   Field exists in core_dynamic_data!');
    console.log('   Value:', verifyData.field_value_number);
    console.log('   Smart Code:', verifyData.smart_code);
  }
}

fixMembership().then(() => process.exit(0)).catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
