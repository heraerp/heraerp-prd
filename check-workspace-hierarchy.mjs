#!/usr/bin/env node
/**
 * Check the parent-child relationships for APP_WORKSPACE hierarchy
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkHierarchy() {
  console.log('🔍 Checking APP workspace hierarchy...\n');

  try {
    // Get retail domain
    const retailDomainId = '05efca2d-ecbf-4246-a606-2ff38ed2a5be';
    const inventorySectionId = 'c14b5c32-07b0-44c1-8e89-7453f3fe3874';
    
    console.log('🏢 Retail Domain ID:', retailDomainId);
    console.log('📦 Inventory Section ID:', inventorySectionId);

    // Check relationships from section to domain
    const { data: sectionToDomain, error: secError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('source_entity_id', inventorySectionId)
      .eq('target_entity_id', retailDomainId);

    console.log('\n🔗 Section → Domain relationships:');
    if (secError) {
      console.error('❌ Error:', secError);
    } else {
      console.log('📊 Found:', sectionToDomain?.length || 0, 'relationships');
      sectionToDomain?.forEach(rel => {
        console.log(`   • Type: ${rel.relationship_type}`);
      });
    }

    // Check what workspaces belong to the inventory section
    const { data: workspaceToSection, error: workError } = await supabase
      .from('core_relationships')
      .select(`
        *,
        source_entity:source_entity_id(id, entity_name, entity_code, entity_type, metadata)
      `)
      .eq('target_entity_id', inventorySectionId)
      .eq('relationship_type', 'CHILD_OF');

    console.log('\n🏗️  Workspaces belonging to Inventory section:');
    if (workError) {
      console.error('❌ Error:', workError);
    } else {
      console.log('📊 Found:', workspaceToSection?.length || 0, 'child workspaces');
      workspaceToSection?.forEach(rel => {
        const workspace = rel.source_entity;
        console.log(`   • ${workspace.entity_name} (${workspace.entity_code})`);
        console.log(`     Type: ${workspace.entity_type}`);
        console.log(`     ID: ${workspace.id}`);
        console.log(`     Metadata: ${JSON.stringify(workspace.metadata, null, 2)}`);
      });
    }

    // Check for specific retail/inventory/main pattern
    console.log('\n🔍 Looking for retail/inventory/main workspace...');
    
    // Look for workspace that has both retail and inventory context
    const { data: allWorkspaces, error: allError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_WORKSPACE');

    if (!allError && allWorkspaces) {
      const retailInventoryWorkspaces = allWorkspaces.filter(workspace => {
        const name = workspace.entity_name?.toLowerCase() || '';
        const code = workspace.entity_code?.toLowerCase() || '';
        const smartCode = workspace.smart_code?.toLowerCase() || '';
        
        return (name.includes('inventory') || code.includes('inventory') || 
                name.includes('stock') || code.includes('stock')) && 
               (name.includes('retail') || code.includes('retail') || smartCode.includes('retail'));
      });

      console.log(`📋 Found ${retailInventoryWorkspaces.length} retail+inventory workspaces:`);
      retailInventoryWorkspaces.forEach(workspace => {
        console.log(`   • ${workspace.entity_name} (${workspace.entity_code})`);
        console.log(`     ID: ${workspace.id}`);
        console.log(`     Smart Code: ${workspace.smart_code}`);
        console.log(`     Metadata: ${JSON.stringify(workspace.metadata, null, 2)}`);
      });

      // Check relationships for the retail POS workspace as example
      const retailPOSWorkspace = allWorkspaces.find(w => w.entity_code === 'NAV-WORK-RETAIL-POS-MAIN');
      if (retailPOSWorkspace) {
        console.log(`\n🔍 Checking relationships for ${retailPOSWorkspace.entity_name}:`);
        
        const { data: posRels, error: posError } = await supabase
          .from('core_relationships')
          .select(`
            *,
            target_entity:target_entity_id(entity_name, entity_type, entity_code)
          `)
          .eq('source_entity_id', retailPOSWorkspace.id);

        if (!posError && posRels) {
          console.log(`📊 Found ${posRels.length} relationships:`);
          posRels.forEach(rel => {
            console.log(`   • → ${rel.target_entity.entity_name} (${rel.target_entity.entity_type})`);
            console.log(`     Relationship: ${rel.relationship_type}`);
          });
        }
      }
    }

    // Now let's see what we need to create for retail/inventory/main
    console.log('\n💡 Required for retail/inventory/main:');
    console.log('   1. Domain: Retail Operations ✅ EXISTS');
    console.log('   2. Section: Should be inventory section under retail ❓ CHECKING...');
    
    // Check if there's an inventory section under retail
    const { data: retailSections, error: retailSecError } = await supabase
      .from('core_relationships')
      .select(`
        *,
        source_entity:source_entity_id(id, entity_name, entity_code, entity_type, metadata)
      `)
      .eq('target_entity_id', retailDomainId)
      .eq('relationship_type', 'CHILD_OF');

    if (!retailSecError && retailSections) {
      console.log(`\n📦 Sections under Retail domain:`);
      retailSections.forEach(rel => {
        const section = rel.source_entity;
        console.log(`   • ${section.entity_name} (${section.entity_code})`);
        if (section.entity_name?.toLowerCase().includes('inventory') || 
            section.entity_code?.toLowerCase().includes('inventory')) {
          console.log(`     ✅ This looks like our inventory section!`);
        }
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkHierarchy();