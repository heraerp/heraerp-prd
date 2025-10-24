import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStaffBranchRelationships() {
  console.log('🔍 Checking staff-branch relationships in database...\n');

  // Get a sample staff member
  const { data: staffList, error: staffError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, status')
    .eq('entity_type', 'STAFF')
    .limit(3);

  if (staffError) {
    console.error('Error fetching staff:', staffError);
    return;
  }

  if (!staffList || staffList.length === 0) {
    console.log('No staff members found in database');
    return;
  }

  console.log('📊 Sample Staff Members:');
  staffList.forEach(s => console.log(`  - ${s.entity_name} (${s.id}) - Status: ${s.status}`));

  const staff = staffList[0];

  // Check for STAFF_MEMBER_OF relationships
  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', staff.id)
    .eq('relationship_type', 'STAFF_MEMBER_OF');

  console.log('\n🔗 STAFF_MEMBER_OF relationships found:', relationships?.length || 0);
  if (relationships && relationships.length > 0) {
    console.log('Sample relationship:', relationships[0]);
  }

  // Check all relationship types for this staff
  const { data: allRels, error: allRelsError } = await supabase
    .from('core_relationships')
    .select('relationship_type, to_entity_id, smart_code')
    .eq('from_entity_id', staff.id);

  console.log('\n📋 All relationship types for this staff:');
  if (allRels) {
    const grouped = {};
    allRels.forEach(rel => {
      if (!grouped[rel.relationship_type]) {
        grouped[rel.relationship_type] = [];
      }
      grouped[rel.relationship_type].push(rel.to_entity_id);
    });
    console.log(JSON.stringify(grouped, null, 2));
  }

  // Check branches
  const { data: branches, error: branchError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('entity_type', 'BRANCH')
    .limit(3);

  console.log('\n🏢 Branches in database:', branches?.length || 0);
  if (branches && branches.length > 0) {
    branches.forEach(b => console.log(`  - ${b.entity_name} (${b.id})`));
  }

  // Test archive operation
  console.log('\n🗄️  Testing archive operation on:', staff.entity_name);
  console.log('Current status:', staff.status);

  // Check if we can query archived staff
  const { data: archivedStaff, error: archivedError } = await supabase
    .from('core_entities')
    .select('id, entity_name, status')
    .eq('entity_type', 'STAFF')
    .eq('status', 'archived')
    .limit(3);

  console.log('\n📦 Archived staff in database:', archivedStaff?.length || 0);
  if (archivedStaff && archivedStaff.length > 0) {
    archivedStaff.forEach(s => console.log(`  - ${s.entity_name} (${s.id}) - ${s.status}`));
  }
}

checkStaffBranchRelationships().catch(console.error);
