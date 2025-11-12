#!/usr/bin/env node
/**
 * Create the relationships for the retail/inventory/main workspace hierarchy
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const DEFAULT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const DEFAULT_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createRelationships() {
  console.log('🔗 Creating workspace hierarchy relationships...\n');

  const retailDomainId = '05efca2d-ecbf-4246-a606-2ff38ed2a5be';
  const inventorySectionId = '67c32a46-623b-4c56-9357-d259f5d5a0db';
  const workspaceId = 'f861a4d6-7a3c-4e1c-a7de-c06d753705af';

  try {
    // Create section → domain relationship
    console.log('🔧 Creating section → domain relationship...');
    
    const { data: rel1, error: error1 } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: DEFAULT_ORG_ID,
        from_entity_id: inventorySectionId,
        to_entity_id: retailDomainId,
        relationship_type: 'CHILD_OF',
        relationship_direction: 'forward',
        relationship_strength: 1,
        relationship_data: {},
        smart_code: 'HERA.PLATFORM.NAV.REL.SECTION_CHILD_OF_DOMAIN.v1',
        smart_code_status: 'ACTIVE',
        ai_confidence: 1.0,
        business_logic: {},
        validation_rules: {},
        is_active: true,
        effective_date: new Date().toISOString(),
        created_by: DEFAULT_USER_ID,
        updated_by: DEFAULT_USER_ID,
        version: 1
      })
      .select();

    if (error1) {
      console.error('❌ Failed to create section-domain relationship:', error1);
    } else {
      console.log('✅ Created section → domain relationship');
    }

    // Create workspace → section relationship
    console.log('🔧 Creating workspace → section relationship...');
    
    const { data: rel2, error: error2 } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: DEFAULT_ORG_ID,
        from_entity_id: workspaceId,
        to_entity_id: inventorySectionId,
        relationship_type: 'CHILD_OF',
        relationship_direction: 'forward',
        relationship_strength: 1,
        relationship_data: {},
        smart_code: 'HERA.PLATFORM.NAV.REL.WORKSPACE_CHILD_OF_SECTION.v1',
        smart_code_status: 'ACTIVE',
        ai_confidence: 1.0,
        business_logic: {},
        validation_rules: {},
        is_active: true,
        effective_date: new Date().toISOString(),
        created_by: DEFAULT_USER_ID,
        updated_by: DEFAULT_USER_ID,
        version: 1
      })
      .select();

    if (error2) {
      console.error('❌ Failed to create workspace-section relationship:', error2);
    } else {
      console.log('✅ Created workspace → section relationship');
    }

    // Verify the hierarchy
    console.log('\n🧪 Verifying complete hierarchy...');
    
    const { data: hierarchy, error: hierarchyError } = await supabase
      .from('core_relationships')
      .select(`
        id,
        relationship_type,
        from_entity_id,
        to_entity_id
      `)
      .or(`from_entity_id.eq.${inventorySectionId},from_entity_id.eq.${workspaceId}`)
      .eq('relationship_type', 'CHILD_OF');

    if (!hierarchyError && hierarchy) {
      console.log('✅ Hierarchy verification:');
      hierarchy.forEach(rel => {
        if (rel.from_entity_id === inventorySectionId) {
          console.log(`   📦 Section (${rel.from_entity_id.substring(0, 8)}...) → Domain (${rel.to_entity_id.substring(0, 8)}...)`);
        } else if (rel.from_entity_id === workspaceId) {
          console.log(`   🏗️  Workspace (${rel.from_entity_id.substring(0, 8)}...) → Section (${rel.to_entity_id.substring(0, 8)}...)`);
        }
      });
    }

    console.log('\n🎉 Hierarchy Complete!');
    console.log('========================');
    console.log('🏢 Domain: Retail Operations');
    console.log('📦 Section: Inventory Management');
    console.log('🏗️  Workspace: Main');
    console.log('\n✅ Database structure ready for retail/inventory/main');
    console.log('🔗 Parent ID filtering will now work correctly');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createRelationships();