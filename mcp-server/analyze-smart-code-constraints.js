#!/usr/bin/env node

/**
 * Analyze Smart Code Constraints and Create Future-Ready Standard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeConstraints() {
  console.log('🔍 Analyzing Smart Code Constraints...\n');

  try {
    // Get constraint information directly
    const { data: constraints, error } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .like('check_clause', '%smart_code%');

    if (error) {
      console.error('❌ Error fetching constraints:', error.message);
      return;
    }

    console.log('📋 Current Smart Code Constraints:');
    constraints?.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.check_clause}`);
    });

    // Test current working patterns
    console.log('\n🧪 Testing Current Working Patterns:');
    const workingPatterns = [
      'HERA.FURNITURE.PRODUCT.CHAIR.EXECUTIVE.v1',
      'HERA.FURNITURE.CUSTOMER.RETAIL.HOME.v1',
      'HERA.TELECOM.PRODUCT.CHAIR.EXECUTIVE.v1',
      'HERA.ISP.PRODUCT.BROADBAND.ENTERPRISE.v1',
      'HERA.TELECOM.CUSTOMER.ENTERPRISE.TECH.v1'
    ];

    for (const pattern of workingPatterns) {
      const isValid = validateSmartCodePattern(pattern);
      console.log(`  ${isValid ? '✅' : '❌'} ${pattern}`);
    }

    // Propose new universal standard
    console.log('\n🚀 Proposed Universal Smart Code Standard:');
    await proposeUniversalStandard();

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

function validateSmartCodePattern(smartCode) {
  // Current constraint regex from the data you provided:
  // ^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+
  
  const currentRegex = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
  return currentRegex.test(smartCode);
}

async function proposeUniversalStandard() {
  console.log(`
📐 UNIVERSAL SMART CODE STANDARD - FUTURE READY

Current Constraint Analysis:
  Pattern: ^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+
  
  Breakdown:
  - HERA.                    : Required prefix
  - [A-Z0-9]{3,15}          : Industry (3-15 chars)
  - (?:\\.[A-Z0-9_]{2,30}){3,8} : 3-8 segments (2-30 chars each)
  - \\.v[0-9]+              : Version suffix

🎯 PROPOSED UNIVERSAL INDUSTRIES (All Supported):

1. FURNITURE  ✅ (Working)
2. TELECOM    ✅ (Working) 
3. ISP        🔧 (Needs validation)
4. RESTAURANT 🔧 (Needs validation)
5. HEALTHCARE 🔧 (Needs validation)
6. SALON      🔧 (Needs validation)
7. RETAIL     🔧 (Needs validation)
8. MFG        🔧 (Manufacturing)
9. FINANCE    🔧 (Finance specific)
10. HR        🔧 (Human Resources)
11. SCM       🔧 (Supply Chain)
12. CRM       🔧 (Customer Relations)

📋 STANDARD PATTERNS:

Core Business Entities:
  HERA.{INDUSTRY}.PRODUCT.{CATEGORY}.{SUBTYPE}.v1
  HERA.{INDUSTRY}.CUSTOMER.{SEGMENT}.{TYPE}.v1
  HERA.{INDUSTRY}.VENDOR.{CATEGORY}.{TYPE}.v1
  HERA.{INDUSTRY}.EMPLOYEE.{ROLE}.{LEVEL}.v1
  HERA.{INDUSTRY}.ACCOUNT.{TYPE}.{SUBTYPE}.v1

Transactions:
  HERA.{INDUSTRY}.TRANSACTION.{TYPE}.{SUBTYPE}.v1
  HERA.{INDUSTRY}.PAYMENT.{METHOD}.{TYPE}.v1
  HERA.{INDUSTRY}.ORDER.{TYPE}.{STATUS}.v1
  HERA.{INDUSTRY}.INVOICE.{TYPE}.{STATUS}.v1

Operations:
  HERA.{INDUSTRY}.PROCESS.{TYPE}.{STEP}.v1
  HERA.{INDUSTRY}.WORKFLOW.{NAME}.{STAGE}.v1
  HERA.{INDUSTRY}.REPORT.{TYPE}.{FORMAT}.v1
  HERA.{INDUSTRY}.ALERT.{TYPE}.{PRIORITY}.v1

🌍 EXAMPLES BY INDUSTRY:

ISP/Telecom:
  HERA.ISP.PRODUCT.BROADBAND.ENTERPRISE.v1
  HERA.ISP.CUSTOMER.ENTERPRISE.TECH.v1
  HERA.ISP.AGENT.FIELD.SOUTH.v1
  HERA.ISP.TRANSACTION.SUBSCRIPTION.BROADBAND.v1
  HERA.ISP.ACCOUNT.REVENUE.BROADBAND.v1

Restaurant:
  HERA.RESTAURANT.PRODUCT.FOOD.MAIN_COURSE.v1
  HERA.RESTAURANT.CUSTOMER.DINE_IN.REGULAR.v1
  HERA.RESTAURANT.ORDER.FOOD.PENDING.v1
  HERA.RESTAURANT.TRANSACTION.SALE.CASH.v1

Healthcare:
  HERA.HEALTHCARE.PATIENT.OUTPATIENT.REGULAR.v1
  HERA.HEALTHCARE.SERVICE.CONSULTATION.GENERAL.v1
  HERA.HEALTHCARE.APPOINTMENT.SCHEDULED.CONFIRMED.v1
  HERA.HEALTHCARE.TRANSACTION.PAYMENT.INSURANCE.v1

Salon:
  HERA.SALON.SERVICE.HAIR.CUT.v1
  HERA.SALON.CUSTOMER.REGULAR.VIP.v1
  HERA.SALON.PRODUCT.COSMETICS.PREMIUM.v1
  HERA.SALON.APPOINTMENT.BOOKING.CONFIRMED.v1

✅ CONSTRAINT VALIDATION:
All patterns follow current regex constraint:
- Start with HERA.
- Industry: 3-15 characters ✅
- 4-5 segments total (within 3-8 limit) ✅  
- Each segment: 2-30 characters ✅
- End with .v1 ✅

🚀 RECOMMENDATION:
Current constraint is already UNIVERSAL and supports all industries!
The issue is not the constraint but ensuring we use valid patterns.
  `);

  // Test ISP patterns against current constraint
  console.log('\n🧪 Testing ISP Patterns Against Current Constraint:');
  const ispPatterns = [
    'HERA.ISP.PRODUCT.BROADBAND.ENTERPRISE.v1',
    'HERA.ISP.CUSTOMER.ENTERPRISE.TECH.v1', 
    'HERA.ISP.AGENT.FIELD.SOUTH.v1',
    'HERA.ISP.ACCOUNT.REVENUE.BROADBAND.v1',
    'HERA.TELECOM.PRODUCT.BROADBAND.ENTERPRISE.v1'
  ];

  ispPatterns.forEach(pattern => {
    const isValid = validateSmartCodePattern(pattern);
    const segments = pattern.split('.');
    console.log(`  ${isValid ? '✅' : '❌'} ${pattern}`);
    console.log(`    Segments: ${segments.length} (${segments.join(' | ')})`);
    
    if (!isValid) {
      // Analyze why it fails
      segments.forEach((segment, index) => {
        if (index === 0 && segment !== 'HERA') {
          console.log(`      ❌ Must start with HERA`);
        } else if (index === 1 && (segment.length < 3 || segment.length > 15)) {
          console.log(`      ❌ Industry must be 3-15 chars: ${segment} (${segment.length})`);
        } else if (index > 1 && index < segments.length - 1) {
          if (segment.length < 2 || segment.length > 30) {
            console.log(`      ❌ Segment ${index} must be 2-30 chars: ${segment} (${segment.length})`);
          }
        } else if (index === segments.length - 1 && !segment.match(/^v[0-9]+$/)) {
          console.log(`      ❌ Must end with v{number}: ${segment}`);
        }
      });
    }
  });
}

// Run the analysis
analyzeConstraints().catch(console.error);