#!/usr/bin/env node
/**
 * Create the missing retail/inventory/main workspace structure
 * Following the database-driven approach with proper parent-child relationships
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const DEFAULT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const DEFAULT_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createRetailInventoryWorkspace() {
  console.log('🏗️  Creating retail/inventory/main workspace structure...\n');

  try {
    // Get existing entities
    const retailDomainId = '05efca2d-ecbf-4246-a606-2ff38ed2a5be'; // Retail Operations
    
    console.log('🔍 Step 1: Check if inventory section exists under retail...');
    
    // First, check if there's already an inventory section under retail
    const { data: existingSectionRel, error: existingError } = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        from_entity:from_entity_id(entity_name, entity_code, entity_type, metadata)
      `)
      .eq('to_entity_id', retailDomainId)
      .in('relationship_type', ['CHILD_OF', 'BELONGS_TO']);

    console.log(`Found ${existingSectionRel?.length || 0} sections under retail domain`);
    
    let inventorySectionId = null;
    
    // Look for existing inventory section
    if (existingSectionRel) {
      const inventorySection = existingSectionRel.find(rel => {
        const entity = rel.from_entity;
        return entity.entity_name?.toLowerCase().includes('inventory') ||
               entity.entity_code?.toLowerCase().includes('inventory') ||
               entity.entity_name?.toLowerCase().includes('stock');
      });
      
      if (inventorySection) {
        inventorySectionId = inventorySection.from_entity_id;
        console.log(`✅ Found existing inventory section: ${inventorySection.from_entity.entity_name} (${inventorySectionId})`);
      }
    }
    
    // Create inventory section if it doesn't exist
    if (!inventorySectionId) {
      console.log('🔧 Creating new inventory section...');
      
      const createSectionResult = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: DEFAULT_USER_ID,
        p_organization_id: DEFAULT_ORG_ID,
        p_entity: {
          entity_type: 'APP_SECTION',
          entity_name: 'Inventory Management',
          entity_code: 'NAV-SEC-RETAIL-INVENTORY',
          smart_code: 'HERA.PLATFORM.NAV.APPSECTION.RETAIL.INVENTORY.v1'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      });

      if (createSectionResult.error) {
        console.error('❌ Failed to create inventory section:', createSectionResult.error);
        return;
      }

      inventorySectionId = createSectionResult.data?.items?.[0]?.id || createSectionResult.data?.entity_id;
      console.log(`✅ Created inventory section: ${inventorySectionId}`);

      // Create relationship: section CHILD_OF domain
      const sectionRelResult = await supabase.rpc('hera_relationships_upsert_v1', {
        p_actor_user_id: DEFAULT_USER_ID,
        p_organization_id: DEFAULT_ORG_ID,
        p_from_entity_id: inventorySectionId,
        p_to_entity_id: retailDomainId,
        p_relationship_type: 'CHILD_OF',
        p_relationship_data: {},
        p_smart_code: 'HERA.PLATFORM.NAV.REL.SECTION_CHILD_OF_DOMAIN.v1',
        p_options: {}
      });

      if (sectionRelResult.error) {
        console.error('❌ Failed to create section-domain relationship:', sectionRelResult.error);
      } else {
        console.log('✅ Created section → domain relationship');
      }
    }

    console.log('🔍 Step 2: Check if main workspace exists...');
    
    // Check for existing workspace under this section
    const { data: existingWorkspaceRel, error: workspaceRelError } = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        from_entity:from_entity_id(entity_name, entity_code, entity_type, metadata)
      `)
      .eq('to_entity_id', inventorySectionId)
      .in('relationship_type', ['CHILD_OF', 'BELONGS_TO']);

    let workspaceId = null;
    
    if (existingWorkspaceRel) {
      const mainWorkspace = existingWorkspaceRel.find(rel => {
        const entity = rel.from_entity;
        return entity.entity_name?.toLowerCase().includes('main') ||
               entity.entity_code?.toLowerCase().includes('main') ||
               entity.entity_type === 'APP_WORKSPACE';
      });
      
      if (mainWorkspace) {
        workspaceId = mainWorkspace.from_entity_id;
        console.log(`✅ Found existing workspace: ${mainWorkspace.from_entity.entity_name} (${workspaceId})`);
      }
    }

    // Create main workspace if it doesn't exist
    if (!workspaceId) {
      console.log('🔧 Creating main workspace...');
      
      const createWorkspaceResult = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: DEFAULT_USER_ID,
        p_organization_id: DEFAULT_ORG_ID,
        p_entity: {
          entity_type: 'APP_WORKSPACE',
          entity_name: 'Inventory Management Workspace',
          entity_code: 'NAV-WORK-RETAIL-INVENTORY-MAIN',
          smart_code: 'HERA.PLATFORM.NAV.APPWORKSPACE.RETAIL.INVENTORY.MAIN.v1'
        },
        p_dynamic: {
          subtitle: {
            field_type: 'text',
            field_value_text: 'Manage stock levels, batch tracking, and inventory analytics',
            smart_code: 'HERA.PLATFORM.NAV.FIELD.SUBTITLE.v1'
          },
          icon: {
            field_type: 'text',
            field_value_text: 'Package',
            smart_code: 'HERA.PLATFORM.NAV.FIELD.ICON.v1'
          },
          color: {
            field_type: 'text',
            field_value_text: 'blue',
            smart_code: 'HERA.PLATFORM.NAV.FIELD.COLOR.v1'
          },
          persona_label: {
            field_type: 'text',
            field_value_text: 'Inventory Manager',
            smart_code: 'HERA.PLATFORM.NAV.FIELD.PERSONA.v1'
          },
          default_nav: {
            field_type: 'text',
            field_value_text: 'master-data',
            smart_code: 'HERA.PLATFORM.NAV.FIELD.DEFAULT_NAV.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      });

      if (createWorkspaceResult.error) {
        console.error('❌ Failed to create workspace:', createWorkspaceResult.error);
        return;
      }

      workspaceId = createWorkspaceResult.data?.items?.[0]?.id || createWorkspaceResult.data?.entity_id;
      console.log(`✅ Created workspace: ${workspaceId}`);

      // Create relationship: workspace CHILD_OF section
      const workspaceRelResult = await supabase.rpc('hera_relationships_upsert_v1', {
        p_actor_user_id: DEFAULT_USER_ID,
        p_organization_id: DEFAULT_ORG_ID,
        p_from_entity_id: workspaceId,
        p_to_entity_id: inventorySectionId,
        p_relationship_type: 'CHILD_OF',
        p_relationship_data: {},
        p_smart_code: 'HERA.PLATFORM.NAV.REL.WORKSPACE_CHILD_OF_SECTION.v1',
        p_options: {}
      });

      if (workspaceRelResult.error) {
        console.error('❌ Failed to create workspace-section relationship:', workspaceRelResult.error);
      } else {
        console.log('✅ Created workspace → section relationship');
      }
    }

    console.log('\n🎉 Retail Inventory Workspace Structure Complete!');
    console.log('=====================================');
    console.log(`Domain: Retail Operations (${retailDomainId})`);
    console.log(`Section: Inventory Management (${inventorySectionId})`);
    console.log(`Workspace: Main (${workspaceId})`);
    console.log(`\n🔗 Hierarchy: retail → inventory → main`);
    console.log(`📊 Database-driven workspace configuration is now ready!`);

    // Test the hierarchy by fetching the workspace via relationships
    console.log('\n🧪 Testing the hierarchy...');
    
    const testResult = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        to_entity_id,
        relationship_type,
        from_entity:from_entity_id(entity_name, entity_type),
        to_entity:to_entity_id(entity_name, entity_type)
      `)
      .eq('from_entity_id', workspaceId);

    if (testResult.data && testResult.data.length > 0) {
      console.log('✅ Workspace relationships verified:');
      testResult.data.forEach(rel => {
        console.log(`   ${rel.from_entity.entity_name} (${rel.from_entity.entity_type}) → ${rel.to_entity.entity_name} (${rel.to_entity.entity_type})`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createRetailInventoryWorkspace();