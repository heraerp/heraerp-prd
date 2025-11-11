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

async function checkMembers() {
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hairtalkz

  console.log('Organization ID:', orgId);
  console.log('\n=== Checking Organization Members ===\n');

  // Check MEMBER_OF relationships
  const { data: memberships, error: membError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('to_entity_id', orgId)
    .eq('relationship_type', 'MEMBER_OF');

  if (membError) {
    console.error('❌ Error querying memberships:', membError.message);
    return;
  }

  console.log(`👥 Total members: ${memberships.length}\n`);

  if (memberships.length === 0) {
    console.log('⚠️  NO members found for this organization!');
    console.log('   This means NO users can perform operations on this org.\n');
    return;
  }

  // For each member, get their user details
  for (const [i, membership] of memberships.entries()) {
    const userId = membership.from_entity_id;

    // Get user entity details
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.log(`${i+1}. User ID: ${userId.substring(0, 12)}... (entity not found)`);
      continue;
    }

    console.log(`${i+1}. User: ${userEntity.entity_name || 'Unknown'}`);
    console.log(`   Entity ID: ${userId}`);
    console.log(`   Relationship: ${membership.relationship_type}`);
    console.log(`   Status: ${membership.status || 'active'}`);
    console.log(`   Role: ${membership.relationship_data?.role || 'N/A'}`);
    console.log('');
  }

  // Check recent sales to see who's actually making transactions
  console.log('\n=== Recent Sales Actors ===\n');

  const { data: sales, error: salesError } = await supabase
    .from('universal_transactions')
    .select('id, created_by, transaction_date, total_amount')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'SALE')
    .order('created_at', { ascending: false })
    .limit(5);

  if (salesError) {
    console.error('❌ Error fetching sales:', salesError.message);
    return;
  }

  console.log(`💰 Recent sales actors (${sales.length} transactions):\n`);

  for (const [i, sale] of sales.entries()) {
    const actorId = sale.created_by;
    const isMember = memberships.some(m => m.from_entity_id === actorId);

    console.log(`${i+1}. Amount: ${sale.total_amount} | Actor: ${actorId?.substring(0, 12) || 'NULL'}... | Member: ${isMember ? '✅' : '❌'}`);
  }
}

checkMembers().then(() => process.exit(0)).catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
