#!/usr/bin/env node

/**
 * 🚀 Kerala Vision ISP - Create Demo Data
 * 
 * Creates real ISP data using the universal API
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Kerala Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function createISPDemoData() {
  console.log('🚀 Creating Kerala Vision ISP Demo Data...\n');

  // Step 1: Create dashboard metrics entity
  console.log('📊 Creating real-time metrics entity...');
  const { data: metricsEntity, error: metricsError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: KERALA_VISION_ORG_ID,
      entity_type: 'dashboard_metrics',
      entity_name: 'ISP Real-time Metrics',
      entity_code: 'METRICS-REALTIME',
      smart_code: 'HERA.TELECOM.METRICS.DASHBOARD.REALTIME.v1',
      metadata: {
        total_subscribers: 45832,
        active_subscribers: 42156,
        new_this_month: 1245,
        churn_rate: 2.3,
        monthly_revenue: 42000000,
        arpu: 916,
        network_uptime: 99.8,
        revenue_streams: {
          broadband: 60,
          cable_tv: 24,
          advertisement: 10,
          leased_lines: 6
        }
      }
    })
    .select();

  if (!metricsError) {
    console.log('  ✓ Real-time metrics configured');
  } else {
    console.error('  ❌ Metrics error:', metricsError.message);
  }

  // Step 2: Create subscriber segments
  console.log('\n👥 Creating subscriber segments...');
  const segments = [
    { type: 'ENTERPRISE', count: 500, avgRevenue: 15000 },
    { type: 'BUSINESS', count: 2500, avgRevenue: 3500 },
    { type: 'RETAIL', count: 42832, avgRevenue: 850 }
  ];

  for (const segment of segments) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'subscriber_segment',
        entity_name: `${segment.type} Subscribers`,
        entity_code: `SEG-${segment.type}`,
        smart_code: `HERA.TELECOM.SEGMENT.SUBSCRIBER.${segment.type}.v1`,
        metadata: {
          subscriber_count: segment.count,
          average_revenue: segment.avgRevenue,
          total_monthly_revenue: segment.count * segment.avgRevenue
        }
      });

    if (!error) {
      console.log(`  ✓ Created ${segment.type} subscriber segment`);
    } else {
      console.error(`  ❌ ${segment.type} error:`, error.message);
    }
  }

  // Step 3: Create revenue transactions
  console.log('\n💰 Creating revenue transactions...');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const baseRevenue = 38000000;
  
  for (let i = 0; i < months.length; i++) {
    const revenue = baseRevenue + (i * 1500000);
    const subscribers = 42000 + (i * 800);
    
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'monthly_revenue',
        transaction_code: `REV-2024-${String(i + 1).padStart(2, '0')}`,
        transaction_date: new Date(2024, i, 1).toISOString(),
        total_amount: revenue,
        smart_code: 'HERA.TELECOM.REVENUE.MONTHLY.SUMMARY.v1',
        metadata: {
          month: months[i],
          subscriber_count: subscribers,
          broadband_revenue: revenue * 0.6,
          cable_revenue: revenue * 0.24
        }
      });

    if (!error) {
      console.log(`  ✓ Created revenue data for ${months[i]}`);
    } else {
      console.error(`  ❌ ${months[i]} error:`, error.message);
    }
  }

  // Step 4: Create network regions
  console.log('\n🌐 Creating network regions...');
  const regions = [
    { name: 'Thiruvananthapuram', code: 'TVM', uptime: 99.8, subscribers: 18000 },
    { name: 'Kochi', code: 'COK', uptime: 99.7, subscribers: 15000 },
    { name: 'Kozhikode', code: 'CCJ', uptime: 99.9, subscribers: 12832 }
  ];

  for (const region of regions) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'network_region',
        entity_name: `${region.name} Network`,
        entity_code: `NET-${region.code}`,
        smart_code: 'HERA.TELECOM.NETWORK.REGION.PERFORMANCE.v1',
        metadata: {
          region_name: region.name,
          region_code: region.code,
          uptime_percentage: region.uptime,
          subscriber_count: region.subscribers
        }
      });

    if (!error) {
      console.log(`  ✓ Created ${region.name} network region`);
    } else {
      console.error(`  ❌ ${region.name} error:`, error.message);
    }
  }

  // Step 5: Create agents
  console.log('\n👨‍💼 Creating sample agents...');
  const agents = [
    { name: 'Rajesh Kumar', region: 'TVM', performance: 95, customers: 250 },
    { name: 'Priya Nair', region: 'COK', performance: 92, customers: 180 },
    { name: 'Mohammed Ali', region: 'CCJ', performance: 88, customers: 150 }
  ];

  for (const agent of agents) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'field_agent',
        entity_name: agent.name,
        entity_code: `AGENT-${agent.name.split(' ')[0].toUpperCase()}`,
        smart_code: 'HERA.TELECOM.AGENT.FIELD.SALES.v1',
        metadata: {
          region: agent.region,
          performance_score: agent.performance,
          active_customers: agent.customers
        }
      });

    if (!error) {
      console.log(`  ✓ Created agent ${agent.name}`);
    } else {
      console.error(`  ❌ ${agent.name} error:`, error.message);
    }
  }

  console.log('\n✅ ISP Demo Data Created Successfully!');
  console.log('\n📊 Summary:');
  console.log('- Dashboard metrics configured');
  console.log('- 3 subscriber segments created');
  console.log('- 6 months of revenue data');
  console.log('- 3 network regions configured');
  console.log('- 3 sample agents created');
  console.log('\n🚀 Visit http://localhost:3000/isp to see the live dashboard!');
}

createISPDemoData();