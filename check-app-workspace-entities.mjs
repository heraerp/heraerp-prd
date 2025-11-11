#!/usr/bin/env node
/**
 * Check existing APP_WORKSPACE entities in database
 * To understand the current workspace hierarchy
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkWorkspaceEntities() {
  console.log('🔍 Checking APP_WORKSPACE entities in database...\n');

  try {
    // First check APP_DOMAIN entities
    const { data: domains, error: domainError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_DOMAIN')
      .order('entity_name');

    if (domainError) {
      console.error('❌ Error fetching APP_DOMAIN:', domainError);
    } else {
      console.log(`📋 Found ${domains?.length || 0} APP_DOMAIN entities:`);
      domains?.forEach(domain => {
        console.log(`   • ${domain.entity_name} (${domain.entity_code}) - ID: ${domain.id}`);
        console.log(`     Metadata: ${JSON.stringify(domain.metadata, null, 2)}`);
      });
    }

    // Check APP_SECTION entities  
    const { data: sections, error: sectionError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_SECTION')
      .order('entity_name');

    if (sectionError) {
      console.error('❌ Error fetching APP_SECTION:', sectionError);
    } else {
      console.log(`\n📋 Found ${sections?.length || 0} APP_SECTION entities:`);
      sections?.forEach(section => {
        console.log(`   • ${section.entity_name} (${section.entity_code}) - ID: ${section.id}`);
        console.log(`     Metadata: ${JSON.stringify(section.metadata, null, 2)}`);
      });
    }

    // Check APP_WORKSPACE entities
    const { data: workspaces, error: workspaceError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_WORKSPACE')
      .order('entity_name');

    if (workspaceError) {
      console.error('❌ Error fetching APP_WORKSPACE:', workspaceError);
    } else {
      console.log(`\n📋 Found ${workspaces?.length || 0} APP_WORKSPACE entities:`);
      if (workspaces && workspaces.length > 0) {
        workspaces.forEach(workspace => {
          console.log(`   • ${workspace.entity_name} (${workspace.entity_code}) - ID: ${workspace.id}`);
          console.log(`     Metadata: ${JSON.stringify(workspace.metadata, null, 2)}`);
          console.log(`     Smart Code: ${workspace.smart_code}`);
        });
      } else {
        console.log('   ⚠️  No APP_WORKSPACE entities found - this explains the hardcoding!');
      }
    }

    // Check relationships to understand hierarchy
    console.log('\n🔗 Checking relationships between domains/sections/workspaces...');
    
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select(`
        id,
        relationship_type,
        source_entity_id,
        target_entity_id,
        source_entity:source_entity_id(entity_name, entity_type, entity_code),
        target_entity:target_entity_id(entity_name, entity_type, entity_code)
      `)
      .or('source_entity_id.in.(${[...domains?.map(d => d.id) || [], ...sections?.map(s => s.id) || [], ...workspaces?.map(w => w.id) || []].join(',')}),target_entity_id.in.(${[...domains?.map(d => d.id) || [], ...sections?.map(s => s.id) || [], ...workspaces?.map(w => w.id) || []].join(',')})')
      .limit(50);

    if (relError) {
      console.error('❌ Error fetching relationships:', relError);
    } else {
      console.log(`📋 Found ${relationships?.length || 0} relevant relationships:`);
      relationships?.forEach(rel => {
        console.log(`   • ${rel.source_entity?.entity_name} (${rel.source_entity?.entity_type}) → ${rel.target_entity?.entity_name} (${rel.target_entity?.entity_type})`);
        console.log(`     Type: ${rel.relationship_type}`);
      });
    }

    // Check if retail/inventory/main exists as entities
    console.log('\n🔍 Checking for retail/inventory/main specific entities...');
    
    const retailDomain = domains?.find(d => 
      d.entity_code?.toLowerCase().includes('retail') || 
      d.entity_name?.toLowerCase().includes('retail')
    );
    
    const inventorySection = sections?.find(s => 
      s.entity_code?.toLowerCase().includes('inventory') || 
      s.entity_name?.toLowerCase().includes('inventory')
    );

    if (retailDomain) {
      console.log(`✅ Found retail domain: ${retailDomain.entity_name} (ID: ${retailDomain.id})`);
    } else {
      console.log('❌ No retail domain found');
    }

    if (inventorySection) {
      console.log(`✅ Found inventory section: ${inventorySection.entity_name} (ID: ${inventorySection.id})`);
    } else {
      console.log('❌ No inventory section found');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the check
checkWorkspaceEntities();