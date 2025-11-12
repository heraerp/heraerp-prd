#!/usr/bin/env node
/**
 * Debug workspace matching logic
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ralywraqvuqgdezttfde.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w'
);

async function debugWorkspaceMatching() {
  console.log('🔍 Debug Workspace Matching Logic\n');
  
  // Test parameters
  const domain = 'retail';
  const section = 'inventory';
  const workspace = 'main';
  
  console.log(`Testing: ${domain}/${section}/${workspace}\n`);

  try {
    // Step 1: Get all APP_WORKSPACE entities
    const { data: allWorkspaces } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_WORKSPACE')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');

    console.log(`Found ${allWorkspaces?.length || 0} total workspaces`);
    
    // Step 2: Test workspace matching logic
    console.log('\n🎯 Testing workspace matching for "main":');
    console.log('==========================================');
    
    const matchingWorkspaces = allWorkspaces?.filter(w => {
      console.log(`\nTesting workspace: ${w.entity_name}`);
      console.log(`  Smart Code: ${w.smart_code}`);
      console.log(`  Entity Code: ${w.entity_code}`);
      console.log(`  Metadata: ${w.metadata ? JSON.stringify(w.metadata) : 'N/A'}`);
      
      // Test each matching condition
      const metadataSlugMatch = w.metadata?.slug === workspace;
      const entityNameMatch = w.entity_name?.toLowerCase().includes(workspace.toLowerCase());
      const entityCodeMatch = w.entity_code?.toLowerCase().includes(workspace.toLowerCase());
      
      let smartCodeMatch = false;
      if (w.smart_code) {
        const parts = w.smart_code.toLowerCase().split('.');
        smartCodeMatch = parts.includes(workspace.toLowerCase());
      }
      
      console.log(`  ✓ Metadata slug match: ${metadataSlugMatch}`);
      console.log(`  ✓ Entity name match: ${entityNameMatch}`);
      console.log(`  ✓ Entity code match: ${entityCodeMatch}`);
      console.log(`  ✓ Smart code match: ${smartCodeMatch}`);
      
      const matches = metadataSlugMatch || entityNameMatch || entityCodeMatch || smartCodeMatch;
      console.log(`  🎯 MATCHES: ${matches ? 'YES' : 'NO'}`);
      
      return matches;
    }) || [];

    console.log(`\n📊 Found ${matchingWorkspaces.length} workspaces matching '${workspace}':`);
    matchingWorkspaces.forEach(w => {
      console.log(`  - ${w.entity_name} (${w.id})`);
    });

    // Step 3: For each matching workspace, check hierarchy
    console.log('\n🏗️  Testing hierarchy verification:');
    console.log('===================================');
    
    for (const workspaceEntity of matchingWorkspaces) {
      console.log(`\nTesting workspace: ${workspaceEntity.entity_name}`);
      console.log(`Parent Entity ID: ${workspaceEntity.parent_entity_id}`);
      
      if (!workspaceEntity.parent_entity_id) {
        console.log('❌ No parent_entity_id - checking relationships...');
        
        const { data: workspaceRels } = await supabase
          .from('core_relationships')
          .select('to_entity_id')
          .eq('from_entity_id', workspaceEntity.id)
          .in('relationship_type', ['CHILD_OF', 'BELONGS_TO', 'PART_OF']);
          
        console.log(`Found ${workspaceRels?.length || 0} relationships`);
        workspaceRels?.forEach(rel => console.log(`  - to_entity_id: ${rel.to_entity_id}`));
      } else {
        // Check the section via parent_entity_id
        console.log('✅ Has parent_entity_id - checking section...');
        
        const { data: sectionEntity } = await supabase
          .from('core_entities')
          .select('*')
          .eq('entity_type', 'APP_SECTION')
          .eq('id', workspaceEntity.parent_entity_id)
          .single();
          
        if (sectionEntity) {
          console.log(`   📦 Section: ${sectionEntity.entity_name}`);
          console.log(`   Section Code: ${sectionEntity.entity_code}`);
          console.log(`   Section Smart Code: ${sectionEntity.smart_code}`);
          console.log(`   Section Parent ID: ${sectionEntity.parent_entity_id}`);
          
          // Test section matching
          const sectionMatches = 
            sectionEntity.metadata?.slug === section ||
            sectionEntity.entity_name?.toLowerCase().includes(section.toLowerCase()) ||
            sectionEntity.entity_code?.toLowerCase().includes(section.toLowerCase()) ||
            (sectionEntity.smart_code && sectionEntity.smart_code.toLowerCase().includes(section.toLowerCase()));
            
          console.log(`   🎯 Section matches '${section}': ${sectionMatches ? 'YES' : 'NO'}`);
          
          if (sectionMatches && sectionEntity.parent_entity_id) {
            // Check domain
            const { data: domainEntity } = await supabase
              .from('core_entities')
              .select('*')
              .eq('entity_type', 'APP_DOMAIN')
              .eq('id', sectionEntity.parent_entity_id)
              .single();
              
            if (domainEntity) {
              console.log(`   🏢 Domain: ${domainEntity.entity_name}`);
              console.log(`   Domain Code: ${domainEntity.entity_code}`);
              console.log(`   Domain Smart Code: ${domainEntity.smart_code}`);
              
              const domainMatches = 
                domainEntity.metadata?.slug === domain ||
                domainEntity.entity_name?.toLowerCase().includes(domain.toLowerCase()) ||
                domainEntity.entity_code?.toLowerCase().includes(domain.toLowerCase()) ||
                (domainEntity.smart_code && domainEntity.smart_code.toLowerCase().includes(domain.toLowerCase()));
                
              console.log(`   🎯 Domain matches '${domain}': ${domainMatches ? 'YES' : 'NO'}`);
              
              if (domainMatches) {
                console.log(`   🎉 COMPLETE MATCH FOUND!`);
                console.log(`   Hierarchy: ${domainEntity.entity_name} → ${sectionEntity.entity_name} → ${workspaceEntity.entity_name}`);
              }
            } else {
              console.log(`   ❌ No domain found for section parent_entity_id: ${sectionEntity.parent_entity_id}`);
            }
          }
        } else {
          console.log(`   ❌ No section found for parent_entity_id: ${workspaceEntity.parent_entity_id}`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

debugWorkspaceMatching();