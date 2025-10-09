import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreRelationshipsPlan() {
  console.log('🔄 RELATIONSHIPS RESTORATION PLAN');
  console.log('=' .repeat(60) + '\n');

  const targetOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

  try {
    console.log('📋 WHAT WAS LOST:');
    console.log('The Finance DNA V2 cleanup deleted ALL relationships because:');
    console.log('- Step 3g in the cleanup script deleted relationships where');
    console.log('- from_entity_id or to_entity_id referenced entities with "non-compliant" smart codes');
    console.log('- This affected ALL business relationships, not just Finance DNA ones\n');

    console.log('🎯 CRITICAL RELATIONSHIPS TO RESTORE:\n');

    // 1. User-Organization Relationships
    console.log('1. USER-ORGANIZATION MEMBERSHIPS:');
    const { data: users, error: usersError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000') // Platform org
      .eq('entity_type', 'user');

    if (!usersError && users.length > 0) {
      console.log('   Found users in platform org:');
      users.forEach((user, i) => {
        console.log(`     ${i+1}. ${user.entity_name} (${user.entity_code})`);
      });
      console.log(`   ⚠️  Need to create user_member_of_org relationships to target org`);
    } else {
      console.log('   ❌ No users found in platform org');
    }

    // 2. Account Hierarchies  
    console.log('\n2. CHART OF ACCOUNTS HIERARCHY:');
    const { data: accounts, error: accountsError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, metadata')
      .eq('organization_id', targetOrgId)
      .eq('entity_type', 'gl_account');

    if (!accountsError && accounts.length > 0) {
      console.log(`   Found ${accounts.length} GL accounts in target org`);
      console.log('   ⚠️  Need to restore parent_of/child_of relationships for account hierarchy');
      
      // Group by account type to suggest hierarchy
      const accountTypes = {};
      accounts.forEach(acc => {
        const type = acc.metadata?.account_type || 'UNKNOWN';
        if (!accountTypes[type]) accountTypes[type] = [];
        accountTypes[type].push(acc);
      });
      
      console.log('   Account types found:');
      Object.keys(accountTypes).forEach(type => {
        console.log(`     ${type}: ${accountTypes[type].length} accounts`);
      });
    }

    // 3. Status Workflows
    console.log('\n3. STATUS WORKFLOW RELATIONSHIPS:');
    console.log('   ⚠️  Need to restore has_status relationships for:');
    console.log('   - Appointment statuses (draft, confirmed, completed, cancelled)');
    console.log('   - Customer statuses (active, inactive, vip)');
    console.log('   - Service statuses (available, unavailable)');
    console.log('   - Transaction statuses (pending, approved, posted)');

    // 4. Business Entity Relationships
    console.log('\n4. BUSINESS ENTITY RELATIONSHIPS:');
    console.log('   ⚠️  Need to restore business relationships like:');
    console.log('   - Customer-appointment assignments');
    console.log('   - Service-staff assignments');
    console.log('   - Product-category assignments');
    console.log('   - Inventory-location assignments');

    // Check what entities exist to determine what relationships we can restore
    console.log('\n📊 CURRENT ENTITY INVENTORY:');
    const { data: entityTypes } = await supabase
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', targetOrgId);

    if (entityTypes) {
      const typeCounts = {};
      entityTypes.forEach(e => {
        typeCounts[e.entity_type] = (typeCounts[e.entity_type] || 0) + 1;
      });

      console.log('   Entity types in target organization:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
    }

    console.log('\n🔧 RESTORATION STRATEGY:\n');
    
    console.log('PHASE 1: SYSTEM RELATIONSHIPS');
    console.log('- Create user_member_of_org relationships for users');
    console.log('- Create default status entities (draft, active, inactive, etc.)');
    console.log('- Link users to their default roles\n');

    console.log('PHASE 2: BUSINESS STRUCTURE');
    console.log('- Restore chart of accounts hierarchy relationships');
    console.log('- Create parent-child relationships for account groups');
    console.log('- Set up account classification relationships\n');

    console.log('PHASE 3: OPERATIONAL WORKFLOWS');
    console.log('- Restore entity status relationships (has_status)');
    console.log('- Create workflow transition relationships');
    console.log('- Set up business process relationships\n');

    console.log('PHASE 4: DATA INTEGRITY');
    console.log('- Create entity categorization relationships');
    console.log('- Set up validation relationships');
    console.log('- Establish audit trail relationships\n');

    console.log('💾 RESTORATION SCRIPTS TO CREATE:');
    console.log('1. restore-user-memberships.js');
    console.log('2. restore-account-hierarchy.js');
    console.log('3. restore-status-workflows.js');
    console.log('4. restore-business-relationships.js');
    console.log('5. validate-restoration.js');

    console.log('\n⚠️  IMMEDIATE ACTIONS NEEDED:');
    console.log('1. Create user_member_of_org relationship for main user');
    console.log('2. Create basic status entities and relationships');
    console.log('3. Restore chart of accounts hierarchy');
    console.log('4. Validate that user can access the organization');
    console.log('5. Test that basic workflows function properly');

  } catch (error) {
    console.error('Error creating restoration plan:', error);
  }
}

restoreRelationshipsPlan();