#!/usr/bin/env node

/**
 * 🚀 Kerala Vision ISP - Dashboard Data Setup
 * 
 * This script creates real-time dashboard data for the ISP app
 * using the existing Kerala Vision organization setup
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

async function setupISPDashboardData() {
  console.log('🚀 Setting up ISP Dashboard Data...\n');

  try {
    // Step 1: Create real-time metrics entity
    console.log('📊 Creating real-time metrics...');
    await createRealtimeMetrics();

    // Step 2: Create additional subscribers
    console.log('\n👥 Creating subscriber base...');
    await createSubscriberBase();

    // Step 3: Create revenue transactions
    console.log('\n💰 Creating revenue transactions...');
    await createRevenueTransactions();

    // Step 4: Create network performance data
    console.log('\n🌐 Creating network performance data...');
    await createNetworkPerformanceData();

    // Step 5: Create agent performance metrics
    console.log('\n👨‍💼 Creating agent performance metrics...');
    await createAgentPerformanceData();

    // Display summary
    console.log('\n✅ ISP Dashboard Data Setup Complete!\n');
    await displaySummary();

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function createRealtimeMetrics() {
  const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
    p_org_id: KERALA_VISION_ORG_ID,
    p_entity_type: 'dashboard_metrics',
    p_entity_name: 'ISP Real-time Metrics',
    p_entity_code: 'METRICS-REALTIME',
    p_smart_code: 'HERA.TELECOM.ANALYTICS.METRICS.REALTIME.v1',
    p_metadata: {
      total_subscribers: 45832,
      active_subscribers: 42156,
      new_this_month: 1245,
      churn_rate: 2.3,
      monthly_revenue: 42000000, // 4.2 Cr
      arpu: 916,
      network_uptime: 99.8,
      revenue_streams: {
        broadband: 60,
        cable_tv: 24,
        advertisement: 10,
        leased_lines: 6
      },
      network_status: 'operational',
      last_updated: new Date().toISOString()
    }
  });

  if (!error) {
    console.log('  ✓ Real-time metrics configured');
  }
}

async function createSubscriberBase() {
  // Create different types of subscribers
  const subscriberTypes = [
    { 
      type: 'enterprise', 
      count: 500, 
      avgRevenue: 15000,
      plans: ['Enterprise 200 Mbps', 'Enterprise 500 Mbps', 'Leased Line']
    },
    { 
      type: 'business', 
      count: 2500, 
      avgRevenue: 3500,
      plans: ['Business 100 Mbps', 'Business 200 Mbps']
    },
    { 
      type: 'retail', 
      count: 42832, 
      avgRevenue: 850,
      plans: ['Home 50 Mbps', 'Home 100 Mbps', 'Cable TV Basic', 'Cable TV Premium']
    }
  ];

  for (const subType of subscriberTypes) {
    // Create sample subscriber entity
    const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'subscriber_segment',
      p_entity_name: `${subType.type} Subscribers`,
      p_entity_code: `SEG-${subType.type.toUpperCase()}`,
      p_smart_code: `HERA.TELECOM.SEGMENT.${subType.type.toUpperCase()}.v1`,
      p_metadata: {
        subscriber_count: subType.count,
        average_revenue: subType.avgRevenue,
        total_monthly_revenue: subType.count * subType.avgRevenue,
        available_plans: subType.plans,
        churn_rate: subType.type === 'enterprise' ? 0.5 : subType.type === 'business' ? 1.5 : 3.2,
        growth_rate: subType.type === 'enterprise' ? 8.5 : subType.type === 'business' ? 12.3 : 15.7
      }
    });

    if (!error) {
      console.log(`  ✓ Created ${subType.type} subscriber segment`);
    }
  }
}

async function createRevenueTransactions() {
  // Create monthly revenue data for charts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const baseRevenue = 38000000;
  const baseSubscribers = 42000;
  
  for (let i = 0; i < months.length; i++) {
    const revenue = baseRevenue + (i * 1500000) + Math.random() * 1000000;
    const subscribers = baseSubscribers + (i * 800) + Math.floor(Math.random() * 400);
    
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
          cable_revenue: revenue * 0.24,
          advertisement_revenue: revenue * 0.1,
          leased_line_revenue: revenue * 0.06,
          new_connections: 1200 + Math.floor(Math.random() * 300),
          disconnections: 300 + Math.floor(Math.random() * 100)
        }
      });

    if (!error) {
      console.log(`  ✓ Created revenue data for ${months[i]} 2024`);
    }
  }
}

async function createNetworkPerformanceData() {
  const regions = [
    { name: 'Thiruvananthapuram', code: 'TVM', uptime: 99.8, subscribers: 18000, towers: 45 },
    { name: 'Kochi', code: 'COK', uptime: 99.7, subscribers: 15000, towers: 38 },
    { name: 'Kozhikode', code: 'CCJ', uptime: 99.9, subscribers: 12832, towers: 32 }
  ];

  for (const region of regions) {
    const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'network_region',
      p_entity_name: `${region.name} Network`,
      p_entity_code: `NET-${region.code}`,
      p_smart_code: 'HERA.TELECOM.NETWORK.REGION.PERFORMANCE.v1',
      p_metadata: {
        region_name: region.name,
        region_code: region.code,
        uptime_percentage: region.uptime,
        subscriber_count: region.subscribers,
        tower_count: region.towers,
        bandwidth_utilization: 65 + Math.random() * 20,
        peak_usage_time: '8:00 PM - 11:00 PM',
        service_tickets_open: Math.floor(Math.random() * 20),
        average_latency_ms: 10 + Math.random() * 5,
        packet_loss_percentage: 0.01 + Math.random() * 0.02
      }
    });

    if (!error) {
      console.log(`  ✓ Created network performance data for ${region.name}`);
    }
  }
}

async function createAgentPerformanceData() {
  // Create top performing agents
  const topAgents = [
    { name: 'Rajesh Kumar', region: 'TVM', newConnections: 89, commission: 125000 },
    { name: 'Priya Nair', region: 'COK', newConnections: 76, commission: 108000 },
    { name: 'Mohammed Ali', region: 'CCJ', newConnections: 71, commission: 98000 },
    { name: 'Anjali Menon', region: 'TVM', newConnections: 68, commission: 92000 },
    { name: 'Suresh Babu', region: 'COK', newConnections: 65, commission: 88000 }
  ];

  for (const agent of topAgents) {
    const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'agent_performance',
      p_entity_name: agent.name,
      p_entity_code: `AGENT-PERF-${agent.name.split(' ')[0].toUpperCase()}`,
      p_smart_code: 'HERA.TELECOM.AGENT.PERFORMANCE.MONTHLY.v1',
      p_metadata: {
        agent_name: agent.name,
        region: agent.region,
        new_connections_mtd: agent.newConnections,
        commission_earned: agent.commission,
        target_achievement: 92 + Math.random() * 8,
        customer_satisfaction: 4.3 + Math.random() * 0.5,
        active_leads: 20 + Math.floor(Math.random() * 30),
        conversion_rate: 15 + Math.random() * 10
      }
    });

    if (!error) {
      console.log(`  ✓ Created performance data for agent ${agent.name}`);
    }
  }

  // Create overall agent network summary
  const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
    p_org_id: KERALA_VISION_ORG_ID,
    p_entity_type: 'agent_network_summary',
    p_entity_name: 'Agent Network Performance',
    p_entity_code: 'AGENT-NETWORK-SUMMARY',
    p_smart_code: 'HERA.TELECOM.AGENT.NETWORK.SUMMARY.v1',
    p_metadata: {
      total_agents: 3000,
      active_agents: 2850,
      new_activations_today: 245,
      target_achievement: 92,
      total_commission_mtd: 8500000,
      average_conversion_rate: 18.5,
      top_performing_region: 'Thiruvananthapuram',
      growth_rate: 15
    }
  });

  if (!error) {
    console.log('  ✓ Created agent network summary');
  }
}

async function displaySummary() {
  console.log('📊 ISP Dashboard Data Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Real-time metrics configured');
  console.log('✅ Subscriber segments created (Enterprise, Business, Retail)');
  console.log('✅ 6 months of revenue data created');
  console.log('✅ Network performance data for 3 regions');
  console.log('✅ Agent performance metrics created');
  console.log('\n🚀 Next Steps:');
  console.log('1. Run the ISP app: npm run dev');
  console.log('2. Navigate to: http://localhost:3000/isp');
  console.log('3. View real-time dashboard with live data');
  console.log('4. Explore subscriber management');
  console.log('5. Check network performance metrics');
}

// Run the setup
setupISPDashboardData();