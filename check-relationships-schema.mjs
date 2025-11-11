#!/usr/bin/env node
/**
 * Check the correct schema for core_relationships table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSchema() {
  try {
    // Check relationships table structure
    console.log('🔍 Checking core_relationships table structure...');
    
    const { data: sampleRels, error } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('📊 Sample relationships:');
      console.log(JSON.stringify(sampleRels, null, 2));
      
      if (sampleRels && sampleRels.length > 0) {
        console.log('\n📋 Schema fields:');
        Object.keys(sampleRels[0]).forEach(field => {
          console.log(`   • ${field}: ${typeof sampleRels[0][field]}`);
        });
      }
    }

    // Check for any relationships involving our entities
    const retailDomainId = '05efca2d-ecbf-4246-a606-2ff38ed2a5be';
    const inventorySectionId = 'c14b5c32-07b0-44c1-8e89-7453f3fe3874';

    console.log('\n🔍 Looking for relationships with our entities...');
    
    const { data: rels1, error: e1 } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', retailDomainId)
      .limit(5);
      
    const { data: rels2, error: e2 } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('to_entity_id', retailDomainId)
      .limit(5);

    if (!e1 && rels1) {
      console.log(`📊 Found ${rels1.length} relationships FROM retail domain`);
      rels1.forEach(rel => console.log(`   • ${rel.relationship_type}: ${rel.from_entity_id} → ${rel.to_entity_id}`));
    }

    if (!e2 && rels2) {
      console.log(`📊 Found ${rels2.length} relationships TO retail domain`);
      rels2.forEach(rel => console.log(`   • ${rel.relationship_type}: ${rel.from_entity_id} → ${rel.to_entity_id}`));
    }

    // Let's also check what workspaces might be related to retail
    console.log('\n🏗️  Checking for workspace-related relationships...');
    
    const { data: workspaceRels, error: wError } = await supabase
      .from('core_relationships')
      .select('*')
      .ilike('relationship_type', '%CHILD%')
      .limit(10);

    if (!wError && workspaceRels) {
      console.log(`📊 Found ${workspaceRels.length} CHILD relationships:`);
      workspaceRels.forEach(rel => {
        console.log(`   • ${rel.relationship_type}: ${rel.from_entity_id} → ${rel.to_entity_id}`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkSchema();