#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function createIPOData() {
  console.log('📈 Creating Kerala Vision IPO Preparation Data...\n');

  // Create IPO preparation entity
  console.log('💼 Creating IPO preparation entity...');
  const { data: ipoEntity, error: ipoError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: KERALA_VISION_ORG_ID,
      entity_type: 'ipo_preparation',
      entity_name: 'Kerala Vision IPO Readiness',
      entity_code: 'IPO-PREP-001',
      smart_code: 'HERA.ISP.IPO.PREPARATION.STATUS.v1',
      metadata: {
        readiness_score: 73,
        target_valuation: 2500000000, // 2500 Cr in rupees
        current_valuation: 1850000000, // 1850 Cr in rupees
        target_year: 2024,
        ipo_status: 'preparation',
        financial_metrics: {
          revenue_annual: 540000000, // 540 Cr
          ebitda: 162000000, // 162 Cr
          net_profit: 108000000, // 108 Cr
          debt_equity_ratio: 0.8,
          roce: 22
        },
        compliance_status: {
          sebi_compliance: 85,
          corporate_governance: 75,
          financial_audit: 90,
          legal_clearance: 80
        },
        investor_metrics: {
          market_share: 18,
          customer_retention: 92,
          arpu_growth: 15,
          network_coverage: 85,
          digital_adoption: 78,
          brand_value_score: 82
        }
      }
    })
    .select();

  if (!ipoError) {
    console.log('  ✓ IPO preparation entity created');
  } else {
    console.error('  ❌ IPO error:', ipoError.message);
  }

  // Create IPO milestone transactions
  console.log('\n📊 Creating IPO milestone transactions...');
  const milestones = [
    {
      transaction_code: 'IPO-MILESTONE-001',
      transaction_date: new Date('2023-03-15').toISOString(),
      total_amount: 150000000, // 150 Cr funding
      smart_code: 'HERA.ISP.IPO.MILESTONE.FUNDING.v1',
      metadata: {
        milestone: 'Series B Funding',
        valuation: 1200000000,
        investors: ['Matrix Partners', 'Sequoia Capital'],
        equity_diluted: 12.5
      }
    },
    {
      transaction_code: 'IPO-MILESTONE-002',
      transaction_date: new Date('2023-12-20').toISOString(),
      total_amount: 45832, // Subscriber count
      smart_code: 'HERA.ISP.IPO.MILESTONE.SUBSCRIBERS.v1',
      metadata: {
        milestone: 'Crossed 45K Subscribers',
        growth_rate: 22.5,
        market_penetration: 18
      }
    },
    {
      transaction_code: 'IPO-MILESTONE-003',
      transaction_date: new Date('2022-06-30').toISOString(),
      total_amount: 25, // EBITDA percentage
      smart_code: 'HERA.ISP.IPO.MILESTONE.PROFITABILITY.v1',
      metadata: {
        milestone: 'EBITDA Positive',
        ebitda_margin: 25,
        path_to_profitability: 'achieved'
      }
    }
  ];

  for (const milestone of milestones) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'ipo_milestone',
        ...milestone
      });

    if (!error) {
      console.log(`  ✓ Created milestone: ${milestone.metadata.milestone}`);
    } else {
      console.error(`  ❌ Milestone error:`, error.message);
    }
  }

  // Create valuation history
  console.log('\n💰 Creating valuation history...');
  const valuationHistory = [
    { year: 2020, valuation: 320000000, revenue: 320000000 },
    { year: 2021, valuation: 480000000, revenue: 380000000 },
    { year: 2022, valuation: 850000000, revenue: 450000000 },
    { year: 2023, valuation: 1200000000, revenue: 540000000 },
    { year: 2024, valuation: 1850000000, revenue: 650000000 }, // Projected
  ];

  for (const record of valuationHistory) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'valuation',
        transaction_code: `VAL-${record.year}`,
        transaction_date: new Date(`${record.year}-12-31`).toISOString(),
        total_amount: record.valuation,
        smart_code: 'HERA.ISP.IPO.VALUATION.ANNUAL.v1',
        metadata: {
          year: record.year,
          revenue: record.revenue,
          pe_ratio: record.valuation / (record.revenue * 0.2), // Assuming 20% net margin
          growth_rate: record.year > 2020 ? 
            ((record.revenue - valuationHistory[valuationHistory.indexOf(record) - 1].revenue) / 
             valuationHistory[valuationHistory.indexOf(record) - 1].revenue * 100).toFixed(1) : 0
        }
      });

    if (!error) {
      console.log(`  ✓ Created valuation for ${record.year}`);
    } else {
      console.error(`  ❌ Valuation error:`, error.message);
    }
  }

  console.log('\n✅ IPO preparation data created successfully!');
  console.log('\n🚀 Visit http://localhost:3003/isp/ipo to see the IPO readiness dashboard!');
}

createIPOData();