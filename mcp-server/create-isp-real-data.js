#!/usr/bin/env node

/**
 * 🚀 Kerala Vision ISP - Create Real Demo Data
 * 
 * Creates ISP data with properly formatted smart codes
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

async function createISPRealData() {
  console.log('🚀 Creating Kerala Vision ISP Real Data...\n');

  // Step 1: Create dashboard metrics entity
  console.log('📊 Creating real-time metrics entity...');
  const { data: metricsEntity, error: metricsError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: KERALA_VISION_ORG_ID,
      entity_type: 'metrics',
      entity_name: 'ISP Dashboard Metrics',
      entity_code: 'ISP-METRICS-001',
      smart_code: 'HERA.ISP.METRICS.DASHBOARD.REALTIME.v1',
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
        },
        network_status: 'operational',
        last_updated: new Date().toISOString()
      }
    })
    .select();

  if (!metricsError) {
    console.log('  ✓ Real-time metrics configured');
  } else {
    console.error('  ❌ Metrics error:', metricsError.message);
  }

  // Step 2: Create subscriber data entities
  console.log('\n👥 Creating subscriber data...');
  const subscriberData = {
    organization_id: KERALA_VISION_ORG_ID,
    entity_type: 'subscriber_data',
    entity_name: 'Kerala Vision Subscriber Base',
    entity_code: 'ISP-SUBSCRIBERS-001',
    smart_code: 'HERA.ISP.CUSTOMER.SUBSCRIBER.BASE.v1',
    metadata: {
      total_count: 45832,
      segments: {
        enterprise: { count: 500, avg_revenue: 15000 },
        business: { count: 2500, avg_revenue: 3500 },
        retail: { count: 42832, avg_revenue: 850 }
      },
      growth_metrics: {
        new_monthly: 1245,
        churn_monthly: 287,
        net_growth: 958
      }
    }
  };

  const { error: subError } = await supabase
    .from('core_entities')
    .insert(subscriberData);

  if (!subError) {
    console.log('  ✓ Subscriber data created');
  } else {
    console.error('  ❌ Subscriber error:', subError.message);
  }

  // Step 3: Create revenue transactions
  console.log('\n💰 Creating revenue transactions...');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
  const baseRevenue = 38000000;
  
  for (let i = 0; i < months.length; i++) {
    const revenue = baseRevenue + (i * 1500000);
    const subscribers = 42000 + (i * 800);
    
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'revenue',
        transaction_code: `ISP-REV-2024-${String(i + 1).padStart(2, '0')}`,
        transaction_date: new Date(2024, i, 1).toISOString(),
        total_amount: revenue,
        smart_code: 'HERA.ISP.REVENUE.MONTHLY.REPORT.v1',
        metadata: {
          month: months[i],
          year: 2024,
          subscriber_count: subscribers,
          revenue_breakdown: {
            broadband: revenue * 0.6,
            cable_tv: revenue * 0.24,
            advertisement: revenue * 0.1,
            leased_lines: revenue * 0.06
          }
        }
      });

    if (!error) {
      console.log(`  ✓ Created revenue data for ${months[i]} 2024`);
    } else {
      console.error(`  ❌ ${months[i]} error:`, error.message);
    }
  }

  // Step 4: Create network performance data
  console.log('\n🌐 Creating network performance data...');
  const networkData = {
    organization_id: KERALA_VISION_ORG_ID,
    entity_type: 'network_metrics',
    entity_name: 'Kerala Vision Network Performance',
    entity_code: 'ISP-NETWORK-001',
    smart_code: 'HERA.ISP.NETWORK.PERFORMANCE.METRICS.v1',
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
  };

  const { error: netError } = await supabase
    .from('core_entities')
    .insert(networkData);

  if (!netError) {
    console.log('  ✓ Network performance data created');
  } else {
    console.error('  ❌ Network error:', netError.message);
  }

  // Step 5: Create sample billing data
  console.log('\n💳 Creating billing data...');
  for (let i = 0; i < 5; i++) {
    const invoiceAmount = 850 + (Math.random() * 2000);
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'invoice',
        transaction_code: `ISP-INV-2024-${String(1000 + i).padStart(4, '0')}`,
        transaction_date: new Date(2024, 4, i + 1).toISOString(),
        total_amount: invoiceAmount,
        smart_code: 'HERA.ISP.BILLING.INVOICE.CUSTOMER.v1',
        metadata: {
          customer_id: `CUST-${String(i + 1).padStart(4, '0')}`,
          plan_type: i % 3 === 0 ? 'enterprise' : i % 2 === 0 ? 'business' : 'retail',
          due_date: new Date(2024, 4, i + 15).toISOString(),
          status: i === 0 ? 'overdue' : 'paid'
        }
      });

    if (!error) {
      console.log(`  ✓ Created invoice #${1000 + i}`);
    } else {
      console.error(`  ❌ Invoice error:`, error.message);
    }
  }

  console.log('\n✅ ISP Real Data Created Successfully!');
  
  // Verify data
  console.log('\n🔍 Verifying created data...');
  
  const { data: entities, error: verifyError } = await supabase
    .from('core_entities')
    .select('entity_type, entity_name')
    .eq('organization_id', KERALA_VISION_ORG_ID);

  if (entities && entities.length > 0) {
    console.log(`\n✅ Found ${entities.length} entities for Kerala Vision:`);
    entities.forEach(e => console.log(`  - ${e.entity_type}: ${e.entity_name}`));
  }

  const { data: transactions, error: txnError } = await supabase
    .from('universal_transactions')
    .select('transaction_type, transaction_code, total_amount')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .limit(5);

  if (transactions && transactions.length > 0) {
    console.log(`\n✅ Found ${transactions.length} transactions:`);
    transactions.forEach(t => console.log(`  - ${t.transaction_type}: ${t.transaction_code} (₹${(t.total_amount / 100000).toFixed(1)}L)`));
  }

  console.log('\n🚀 Visit http://localhost:3003/isp to see the live dashboard with real data!');
}

createISPRealData();