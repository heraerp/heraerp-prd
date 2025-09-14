#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function verifyAgentData() {
  console.log('🔍 Verifying Kerala Vision Agent Data...\n');

  // Fetch agent entities
  const { data: agentEntities, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'field_agent');

  if (error) {
    console.error('❌ Error fetching agents:', error.message);
    return;
  }

  console.log(`✅ Found ${agentEntities?.length || 0} agents in Supabase:\n`);

  if (agentEntities && agentEntities.length > 0) {
    agentEntities.forEach((agent, index) => {
      console.log(`Agent ${index + 1}:`);
      console.log(`  Name: ${agent.entity_name}`);
      console.log(`  Code: ${agent.entity_code}`);
      console.log(`  Region: ${agent.metadata?.region}`);
      console.log(`  Performance: ${agent.metadata?.performance_score}%`);
      console.log(`  Customers: ${agent.metadata?.active_customers}`);
      console.log(`  Collections: ₹${agent.metadata?.monthly_collections}`);
      console.log(`  Commission: ₹${agent.metadata?.commission_earned}`);
      console.log('---');
    });
  }

  // Also check agent commission transactions
  const { data: commissions, error: commError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('transaction_type', 'agent_commission')
    .order('transaction_date', { ascending: false })
    .limit(3);

  if (commissions && commissions.length > 0) {
    console.log('\n📊 Recent Agent Commission Transactions:');
    commissions.forEach(comm => {
      console.log(`  ${comm.metadata?.month} 2024: ₹${(comm.total_amount / 100000).toFixed(1)}L for ${comm.metadata?.agent_count} agents`);
    });
  }
}

verifyAgentData();