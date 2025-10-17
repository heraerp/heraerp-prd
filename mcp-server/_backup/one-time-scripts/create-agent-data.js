#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function createAgentData() {
  console.log('👥 Creating Kerala Vision Agent Data...\n');

  const agents = [
    {
      name: 'Ravi Chandran',
      region: 'Thiruvananthapuram',
      performance_score: 93,
      active_customers: 285,
      monthly_collections: 242250,
      target_achievement: 98
    },
    {
      name: 'Lakshmi Iyer',
      region: 'Kochi',
      performance_score: 96,
      active_customers: 310,
      monthly_collections: 263500,
      target_achievement: 102
    },
    {
      name: 'Abdul Rahman',
      region: 'Kozhikode',
      performance_score: 89,
      active_customers: 225,
      monthly_collections: 191250,
      target_achievement: 94
    },
    {
      name: 'Sreeja Nambiar',
      region: 'Thiruvananthapuram',
      performance_score: 87,
      active_customers: 198,
      monthly_collections: 168300,
      target_achievement: 91
    },
    {
      name: 'Thomas Joseph',
      region: 'Kochi',
      performance_score: 94,
      active_customers: 267,
      monthly_collections: 226950,
      target_achievement: 99
    },
    {
      name: 'Fatima Begum',
      region: 'Kozhikode',
      performance_score: 91,
      active_customers: 245,
      monthly_collections: 208250,
      target_achievement: 96
    },
    {
      name: 'Vineeth Kumar',
      region: 'Thiruvananthapuram',
      performance_score: 82,
      active_customers: 175,
      monthly_collections: 148750,
      target_achievement: 85
    },
    {
      name: 'Divya Prakash',
      region: 'Kochi',
      performance_score: 88,
      active_customers: 210,
      monthly_collections: 178500,
      target_achievement: 92
    },
    {
      name: 'Khalid Ahmed',
      region: 'Kozhikode',
      performance_score: 95,
      active_customers: 298,
      monthly_collections: 253300,
      target_achievement: 101
    }
  ];

  let successCount = 0;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'field_agent',
        entity_name: agent.name,
        entity_code: `AGT-${String(i + 10).padStart(3, '0')}`,
        smart_code: 'HERA.ISP.AGENT.FIELD.SALES.v1',
        metadata: {
          ...agent,
          commission_rate: 10,
          commission_earned: agent.monthly_collections * 0.1,
          join_date: new Date(2022 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
          status: 'active',
          certifications: ['Basic Sales', 'Customer Service', 'Network Basics'],
          territory_pins: Math.floor(Math.random() * 5) + 3
        }
      });

    if (!error) {
      successCount++;
      console.log(`  ✓ Created agent: ${agent.name}`);
    } else {
      console.error(`  ❌ Error creating ${agent.name}:`, error.message);
    }
  }

  // Create agent performance transactions
  console.log('\n📊 Creating agent performance transactions...');
  
  for (let month = 0; month < 6; month++) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'agent_commission',
        transaction_code: `COMM-2024-${String(month + 1).padStart(2, '0')}`,
        transaction_date: new Date(2024, month, 28).toISOString(),
        total_amount: 2500000 + (month * 100000), // Total commissions paid
        smart_code: 'HERA.ISP.AGENT.COMMISSION.MONTHLY.v1',
        metadata: {
          month: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'][month],
          agent_count: 3000 + (month * 50),
          total_collections: 25000000 + (month * 1000000),
          avg_commission: 8333 + (month * 200)
        }
      });

    if (!error) {
      console.log(`  ✓ Created commission data for month ${month + 1}`);
    }
  }

  console.log(`\n✅ Agent data creation complete! Created ${successCount} agents.`);
}

createAgentData();