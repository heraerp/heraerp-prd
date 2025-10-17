#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function updateNetworkData() {
  console.log('🔄 Updating Kerala Vision Network Data...\n');

  // Update the network metrics with more detailed data
  const { data: existing } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'network_metrics')
    .single();

  if (existing) {
    const { error } = await supabase
      .from('core_entities')
      .update({
        metadata: {
          regions: [
            { 
              name: 'Thiruvananthapuram', 
              code: 'TVM', 
              uptime: 99.8, 
              subscribers: 18000,
              towers: 45,
              bandwidth_utilization: 72,
              peak_hours: '8PM-11PM',
              avg_latency_ms: 12
            },
            { 
              name: 'Kochi', 
              code: 'COK', 
              uptime: 99.7, 
              subscribers: 15000,
              towers: 38,
              bandwidth_utilization: 68,
              peak_hours: '7PM-10PM',
              avg_latency_ms: 14
            },
            { 
              name: 'Kozhikode', 
              code: 'CCJ', 
              uptime: 99.9, 
              subscribers: 12832,
              towers: 32,
              bandwidth_utilization: 65,
              peak_hours: '8PM-11PM',
              avg_latency_ms: 11
            }
          ],
          overall_uptime: 99.8,
          total_bandwidth_gbps: 400,
          peak_utilization: 78,
          total_towers: 115,
          active_connections: 42156,
          service_tickets: 23,
          infrastructure: {
            core_servers: 12,
            network_switches: 156,
            access_points: 523,
            bgp_sessions: 8
          }
        }
      })
      .eq('id', existing.id);

    if (!error) {
      console.log('✅ Network data updated successfully!');
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('❌ Network metrics entity not found');
  }
}

updateNetworkData();