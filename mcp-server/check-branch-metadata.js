const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local from parent directory
const envPath = '../.env.local';
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBranchMetadata() {
  console.log('🔍 Checking branch metadata...\n');

  const orgId = envVars.DEFAULT_ORGANIZATION_ID;
  
  // Get branches directly from database
  const { data: branches, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, metadata')
    .eq('organization_id', orgId)
    .eq('entity_type', 'branch');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!branches || branches.length === 0) {
    console.log('⚠️ No branches found for organization:', orgId);
    return;
  }

  console.log(`✅ Found ${branches.length} branch(es):\n`);
  
  branches.forEach((branch, index) => {
    console.log(`Branch ${index + 1}:`);
    console.log(`  ID: ${branch.id}`);
    console.log(`  Name: ${branch.entity_name}`);
    console.log(`  Code: ${branch.entity_code || 'N/A'}`);
    console.log(`  Has metadata: ${!!branch.metadata}`);
    console.log(`  Metadata:`, JSON.stringify(branch.metadata, null, 2));
    console.log(`  Has operating_hours: ${!!(branch.metadata?.operating_hours)}`);
    if (branch.metadata?.operating_hours) {
      console.log(`  Operating hours:`, JSON.stringify(branch.metadata.operating_hours, null, 2));
    }
    console.log('');
  });
}

checkBranchMetadata().catch(console.error);
