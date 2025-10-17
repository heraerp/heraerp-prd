#!/usr/bin/env node

/**
 * HERA Universal Cashflow System Demonstration
 * 
 * This demonstrates HERA's revolutionary cashflow tracking system that works
 * across all business types using the universal 6-table architecture.
 * 
 * Usage: node cashflow-demo.js [industry]
 * 
 * Industries: salon, restaurant, healthcare, manufacturing, services
 */

const industry = process.argv[2] || 'salon';

console.log('💰 HERA UNIVERSAL CASHFLOW SYSTEM DEMONSTRATION\n');

// Industry-specific cashflow patterns
const industryPatterns = {
  salon: {
    name: 'Hair Salon & Beauty Services',
    operatingCashMargin: 97.8,
    averageTransaction: 162,
    cashCycle: 0, // Immediate payment
    seasonalityFactor: 1.25, // Q4 peak
    keyActivities: {
      operating: [
        'Service revenue (haircuts, coloring, styling)',
        'Product sales (professional hair care)',
        'Staff payments (stylists, therapists)', 
        'Rent and utilities',
        'Supply purchases (hair products, tools)'
      ],
      investing: [
        'Salon chair purchases',
        'Equipment upgrades (dryers, sinks)',
        'Renovation and fixtures'
      ],
      financing: [
        'Owner contributions',
        'Equipment financing',
        'Business loan payments'
      ]
    },
    smartCodes: [
      'HERA.SALON.SVC.TXN.HAIRCUT.v1 → Service Revenue (+)',
      'HERA.SALON.HR.PAY.STYLIST.v1 → Staff Payments (-)',
      'HERA.SALON.EQP.PUR.CHAIR.v1 → Equipment Purchase (-)',
      'HERA.SALON.FIN.LOAN.REPAY.v1 → Loan Payment (-)'
    ]
  },
  
  restaurant: {
    name: 'Restaurant & Food Service',
    operatingCashMargin: 85.2,
    averageTransaction: 45,
    cashCycle: 1, // Next-day processing
    seasonalityFactor: 1.2, // Holiday season
    keyActivities: {
      operating: [
        'Food and beverage sales',
        'Ingredient purchases',
        'Staff wages (kitchen, service)',
        'Rent and utilities',
        'Marketing and promotions'
      ],
      investing: [
        'Kitchen equipment',
        'Restaurant renovations',
        'POS system upgrades'
      ],
      financing: [
        'Restaurant loans',
        'Owner investments',
        'Lease payments'
      ]
    },
    smartCodes: [
      'HERA.REST.POS.TXN.SALE.v1 → Food Sales (+)',
      'HERA.REST.PUR.INGREDIENTS.v1 → Food Costs (-)',
      'HERA.REST.EQP.PUR.KITCHEN.v1 → Equipment Purchase (-)',
      'HERA.REST.HR.PAY.CHEF.v1 → Staff Payments (-)'
    ]
  },
  
  healthcare: {
    name: 'Healthcare & Medical Services',
    operatingCashMargin: 78.5,
    averageTransaction: 350,
    cashCycle: 45, // Insurance delays
    seasonalityFactor: 1.1, // Q1 flu season
    keyActivities: {
      operating: [
        'Patient payments and copays',
        'Insurance reimbursements',
        'Medical staff salaries',
        'Medical supplies',
        'Facility costs'
      ],
      investing: [
        'Medical equipment',
        'Technology systems',
        'Facility improvements'
      ],
      financing: [
        'Practice loans',
        'Partner contributions',
        'Equipment financing'
      ]
    },
    smartCodes: [
      'HERA.HLTH.PAT.PAYMENT.v1 → Patient Payments (+)',
      'HERA.HLTH.INS.REIMBURSEMENT.v1 → Insurance Revenue (+)',
      'HERA.HLTH.HR.PAY.DOCTOR.v1 → Medical Staff (-)',
      'HERA.HLTH.EQP.PUR.MEDICAL.v1 → Equipment Purchase (-)'
    ]
  },
  
  manufacturing: {
    name: 'Manufacturing & Production',
    operatingCashMargin: 72.8,
    averageTransaction: 2500,
    cashCycle: 60, // B2B payment terms
    seasonalityFactor: 1.15, // Q3 peak production
    keyActivities: {
      operating: [
        'Product sales revenue',
        'Raw material purchases',
        'Production labor costs',
        'Factory overhead',
        'Distribution expenses'
      ],
      investing: [
        'Manufacturing equipment',
        'Factory expansion',
        'Technology upgrades'
      ],
      financing: [
        'Working capital loans',
        'Equipment financing',
        'Capital investments'
      ]
    },
    smartCodes: [
      'HERA.MFG.SALE.FINISHED.v1 → Product Sales (+)',
      'HERA.MFG.PUR.RAW.MATERIALS.v1 → Raw Materials (-)',
      'HERA.MFG.HR.PAY.PRODUCTION.v1 → Labor Costs (-)',
      'HERA.MFG.EQP.PUR.MACHINE.v1 → Equipment Purchase (-)'
    ]
  },
  
  services: {
    name: 'Professional Services',
    operatingCashMargin: 89.3,
    averageTransaction: 1250,
    cashCycle: 30, // Professional billing terms
    seasonalityFactor: 1.05, // Minimal seasonality
    keyActivities: {
      operating: [
        'Professional fees',
        'Staff salaries',
        'Office rent',
        'Technology costs',
        'Marketing expenses'
      ],
      investing: [
        'Office equipment',
        'Technology systems',
        'Acquisitions'
      ],
      financing: [
        'Business loans',
        'Partner distributions',
        'Office lease payments'
      ]
    },
    smartCodes: [
      'HERA.PROF.TIME.BILLING.v1 → Professional Fees (+)',
      'HERA.PROF.HR.PAY.CONSULTANT.v1 → Staff Salaries (-)',
      'HERA.PROF.EQP.PUR.OFFICE.v1 → Equipment Purchase (-)',
      'HERA.PROF.FIN.PARTNER.DISTRIB.v1 → Partner Distribution (-)'
    ]
  }
};

function demonstrateIndustryCashflow(industryKey) {
  const pattern = industryPatterns[industryKey];
  if (!pattern) {
    console.log(`❌ Unknown industry: ${industryKey}`);
    console.log('Available industries: salon, restaurant, healthcare, manufacturing, services');
    return;
  }

  console.log(`🏢 ${pattern.name.toUpperCase()}`);
  console.log('='.repeat(pattern.name.length + 4));
  
  console.log(`\n📊 Key Performance Metrics:`);
  console.log(`   - Operating Cash Margin: ${pattern.operatingCashMargin}%`);
  console.log(`   - Average Transaction: $${pattern.averageTransaction}`);
  console.log(`   - Cash Collection Cycle: ${pattern.cashCycle} days`);
  console.log(`   - Seasonal Peak Factor: ${(pattern.seasonalityFactor * 100).toFixed(0)}%`);
  
  console.log(`\n💰 OPERATING ACTIVITIES (Primary Business):`);
  pattern.keyActivities.operating.forEach((activity, index) => {
    console.log(`   ${index + 1}. ${activity}`);
  });
  
  console.log(`\n🏗️ INVESTING ACTIVITIES (Asset Changes):`);
  pattern.keyActivities.investing.forEach((activity, index) => {
    console.log(`   ${index + 1}. ${activity}`);
  });
  
  console.log(`\n💳 FINANCING ACTIVITIES (Capital & Funding):`);
  pattern.keyActivities.financing.forEach((activity, index) => {
    console.log(`   ${index + 1}. ${activity}`);
  });
  
  console.log(`\n🧠 Smart Code Examples:`);
  pattern.smartCodes.forEach(code => {
    console.log(`   ${code}`);
  });
}

function showUniversalBenefits() {
  console.log('\n\n🧬 HERA UNIVERSAL CASHFLOW SYSTEM BENEFITS');
  console.log('==========================================');
  
  console.log('\n🚀 Revolutionary Capabilities:');
  console.log('   ✅ IFRS/GAAP Compliant - Professional financial statements');
  console.log('   ✅ Real-time Updates - Auto-journal integration');
  console.log('   ✅ Smart Classification - Automatic transaction categorization');
  console.log('   ✅ Industry Intelligence - Optimized for each business type');
  console.log('   ✅ Zero Schema Changes - Uses universal 6-table architecture');
  console.log('   ✅ Multi-Currency Ready - Global business support');
  console.log('   ✅ Forecasting & Analytics - 12-month rolling forecasts');
  console.log('   ✅ Both Methods Supported - Direct and indirect cashflow statements');
  
  console.log('\n📊 Cross-Industry Performance:');
  console.log('┌─────────────────────────┬──────────────┬─────────────────┬──────────────┐');
  console.log('│ Industry                │ Cash Margin  │ Avg Transaction │ Cash Cycle   │');
  console.log('├─────────────────────────┼──────────────┼─────────────────┼──────────────┤');
  
  Object.values(industryPatterns).forEach(pattern => {
    const industry = pattern.name.padEnd(23);
    const margin = `${pattern.operatingCashMargin}%`.padStart(12);
    const avgTxn = `$${pattern.averageTransaction}`.padStart(15);
    const cycle = `${pattern.cashCycle} days`.padEnd(12);
    console.log(`│ ${industry} │ ${margin} │ ${avgTxn} │ ${cycle} │`);
  });
  
  console.log('└─────────────────────────┴──────────────┴─────────────────┴──────────────┘');
  
  console.log('\n🎯 Universal Architecture Benefits:');
  console.log('   - Same cashflow engine works for ALL business types');
  console.log('   - Industry-specific intelligence built into smart codes');
  console.log('   - Zero implementation time - works with existing data');
  console.log('   - Automatic compliance with international standards');
  console.log('   - Real-time visibility into cash position and trends');
}

function showUsageExamples() {
  console.log('\n\n🛠️  USING HERA CASHFLOW SYSTEM');
  console.log('===============================');
  
  console.log('\n# Generate live cashflow statement:');
  console.log('node demo-cashflow-hair-talkz.js');
  
  console.log('\n# Setup demo data for different industries:');
  console.log('node setup-cashflow-demo.js --industry restaurant');
  console.log('node setup-cashflow-demo.js --industry healthcare');
  console.log('node setup-cashflow-demo.js --industry manufacturing');
  
  console.log('\n# Analyze existing organizational cashflow:');
  console.log('node analyze-cashflow.js --org-id your-uuid --period 2025-09');
  console.log('node analyze-cashflow.js --org-id your-uuid --forecast 12');
  
  console.log('\n# API Usage Examples:');
  console.log('curl -X POST /api/v1/cashflow/statement \\');
  console.log('  -d \'{"organization_id":"uuid","period":"2025-09","method":"direct"}\'');
  
  console.log('\n# Universal API Integration:');
  console.log('const statement = await universalApi.generateCashflowStatement({');
  console.log('  organizationId: "org-uuid",');
  console.log('  period: "2025-09",');
  console.log('  method: "direct"');
  console.log('})');
}

// Main demonstration
function main() {
  console.log('🎯 Demonstrating HERA\'s Universal Cashflow System');
  console.log('   Professional cashflow statements for any business type\n');
  
  if (process.argv[2] === 'help' || process.argv[2] === '--help') {
    console.log('Usage: node cashflow-demo.js [industry]');
    console.log('\nAvailable industries:');
    Object.keys(industryPatterns).forEach(key => {
      console.log(`  ${key} - ${industryPatterns[key].name}`);
    });
    console.log('\nExample: node cashflow-demo.js restaurant');
    return;
  }
  
  if (process.argv[2] === 'all') {
    Object.keys(industryPatterns).forEach((industryKey, index) => {
      if (index > 0) console.log('\n' + '─'.repeat(80) + '\n');
      demonstrateIndustryCashflow(industryKey);
    });
  } else {
    demonstrateIndustryCashflow(industry);
  }
  
  showUniversalBenefits();
  showUsageExamples();
  
  console.log('\n\n✅ DEMONSTRATION COMPLETE');
  console.log('=========================');
  console.log('🧬 HERA\'s Universal Cashflow System is production-ready');
  console.log('🚀 Works immediately with existing transaction data');
  console.log('🌟 Professional IFRS/GAAP compliant statements for any business\n');
}

// Run the demonstration
if (require.main === module) {
  main();
}

module.exports = {
  industryPatterns,
  demonstrateIndustryCashflow,
  showUniversalBenefits
};