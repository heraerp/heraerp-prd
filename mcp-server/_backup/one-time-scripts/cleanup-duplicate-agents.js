#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function cleanupDuplicateAgents() {
  console.log('🧹 Cleaning up duplicate agents...\n');

  // Fetch all agents
  const { data: agentEntities, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'field_agent')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching agents:', error.message);
    return;
  }

  // Group by entity_code to find duplicates
  const agentsByCode = {};
  agentEntities.forEach(agent => {
    const code = agent.entity_code;
    if (!agentsByCode[code]) {
      agentsByCode[code] = [];
    }
    agentsByCode[code].push(agent);
  });

  // Delete duplicates (keep the first one)
  let deleteCount = 0;
  for (const code in agentsByCode) {
    const agents = agentsByCode[code];
    if (agents.length > 1) {
      console.log(`Found ${agents.length} duplicates for ${agents[0].entity_name} (${code})`);
      
      // Delete all but the first one
      for (let i = 1; i < agents.length; i++) {
        const { error: deleteError } = await supabase
          .from('core_entities')
          .delete()
          .eq('id', agents[i].id);
        
        if (!deleteError) {
          deleteCount++;
          console.log(`  ✓ Deleted duplicate with id: ${agents[i].id}`);
        } else {
          console.error(`  ❌ Error deleting duplicate:`, deleteError.message);
        }
      }
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deleteCount} duplicate agents.`);

  // Verify final count
  const { data: finalAgents } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'field_agent');

  console.log(`\nFinal agent count: ${finalAgents?.length || 0}`);
}

cleanupDuplicateAgents();