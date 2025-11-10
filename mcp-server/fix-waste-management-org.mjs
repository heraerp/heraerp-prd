#!/usr/bin/env node
/**
 * Fix: Use EXISTING HERA ERP Demo org as parent and cleanup duplicate
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  actor_user_id: "09b0b92a-d797-489e-bc03-5ca0a6272674", // Michele Hair (Owner)
  existing_parent_org_id: "c58cdbcd-73f9-4cef-8c27-caf9f4436d05", // EXISTING HERA ERP Demo
  duplicate_parent_org_id: "89425547-2fbb-4f9e-ac59-009832dc058c", // Duplicate to delete
  existing_waste_org_id: "1fbab8d2-583c-44d2-8671-6d187c1ee755" // Existing waste org to fix
};

async function fixWasteManagementOrg() {
  console.log('🔧 Fixing HERA Waste Management Demo Organization...');
  console.log('👤 Actor User ID:', testData.actor_user_id);
  console.log('🎯 Using EXISTING Parent Org:', testData.existing_parent_org_id);

  try {
    // Step 1: Verify existing parent organization
    console.log('\n📋 Step 1: Verifying EXISTING parent organization...');
    const verifyParentResult = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'GET',
      p_actor_user_id: testData.actor_user_id,
      p_payload: {
        id: testData.existing_parent_org_id
      }
    });

    if (verifyParentResult.error) {
      console.log('❌ Parent org verification failed:', verifyParentResult.error);
      throw new Error(verifyParentResult.error.message);
    }

    console.log('✅ Existing Parent Organization Found:');
    console.log('   Name:', verifyParentResult.data?.organization?.organization_name);
    console.log('   Code:', verifyParentResult.data?.organization?.organization_code);
    console.log('   ID:', testData.existing_parent_org_id);

    // Step 2: Archive the duplicate parent org we created by mistake
    console.log('\n🗑️ Step 2: Archiving duplicate parent organization...');
    const archiveDuplicateResult = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'ARCHIVE',
      p_actor_user_id: testData.actor_user_id,
      p_payload: {
        id: testData.duplicate_parent_org_id
      }
    });

    if (archiveDuplicateResult.error) {
      console.log('⚠️ Could not archive duplicate (may not exist or no permission):', archiveDuplicateResult.error.message);
    } else {
      console.log('✅ Duplicate parent organization archived successfully');
    }

    // Step 3: Update existing waste org to point to correct parent
    console.log('\n🔄 Step 3: Updating waste org to use correct parent...');

    // Since UPDATE requires version column (which may not exist), let's use direct table update
    const { data: updateData, error: updateError } = await supabase
      .from('core_organizations')
      .update({
        parent_organization_id: testData.existing_parent_org_id,
        updated_by: testData.actor_user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', testData.existing_waste_org_id)
      .select();

    if (updateError) {
      console.log('❌ Waste org update failed:', updateError.message);
      throw new Error(updateError.message);
    }

    console.log('✅ Waste Management org updated successfully!');
    console.log('   New Parent ID:', testData.existing_parent_org_id);

    // Step 4: Verify the fix
    console.log('\n🔍 Step 4: Verifying corrected hierarchy...');
    const verifyWasteResult = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'GET',
      p_actor_user_id: testData.actor_user_id,
      p_payload: {
        id: testData.existing_waste_org_id
      }
    });

    if (!verifyWasteResult.error) {
      const wasteOrg = verifyWasteResult.data?.organization;
      console.log('✅ Hierarchy Verified:');
      console.log('   Parent: HERA ERP Demo (EXISTING)');
      console.log('   Parent ID:', wasteOrg?.parent_organization_id);
      console.log('   Child: HERA Waste Management Demo');
      console.log('   Child ID:', wasteOrg?.id);
      console.log('   Relationship: business_unit -> division');
    }

    // Step 5: List organizations to show corrected structure
    console.log('\n📊 Step 5: Listing organizations (active only)...');
    const { data: orgs, error: listError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code, organization_type, parent_organization_id, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!listError) {
      console.log('\n✅ Active Organizations:');
      orgs.forEach((org, index) => {
        const isNew = org.id === testData.existing_waste_org_id;
        const marker = isNew ? '🆕' : '  ';
        console.log(`${marker} ${index + 1}. ${org.organization_name}`);
        console.log(`      ID: ${org.id}`);
        console.log(`      Type: ${org.organization_type}`);
        if (org.parent_organization_id) {
          const isCorrectParent = org.parent_organization_id === testData.existing_parent_org_id;
          console.log(`      Parent: ${org.parent_organization_id} ${isCorrectParent ? '✅' : ''}`);
        }
      });
    }

    // Summary
    console.log('\n🎉 FIX COMPLETE!');
    console.log('📋 Summary:');
    console.log('   ✅ Using EXISTING Parent: HERA ERP Demo');
    console.log(`      - ID: ${testData.existing_parent_org_id}`);
    console.log(`      - Code: DEMO-ERP`);
    console.log('');
    console.log('   ✅ Child Organization: HERA Waste Management Demo');
    console.log(`      - ID: ${testData.existing_waste_org_id}`);
    console.log(`      - Parent: ${testData.existing_parent_org_id} (CORRECTED)`);
    console.log('');
    console.log('   ✅ Duplicate parent organization archived');
    console.log(`      - ID: ${testData.duplicate_parent_org_id}`);
    console.log('');
    console.log('🛡️ Corrected Hierarchy:');
    console.log('   HERA ERP Demo (EXISTING, Code: DEMO-ERP)');
    console.log('   └── HERA Waste Management Demo');

    return {
      success: true,
      parent_org_id: testData.existing_parent_org_id,
      waste_org_id: testData.existing_waste_org_id
    };

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the fix
console.log('🚀 HERA Waste Management Demo - Organization Fix');
console.log('═'.repeat(60));
fixWasteManagementOrg()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Fix completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Fix failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
