#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test organization ID for Furniture Org
const ORGANIZATION_ID = 'd9c27bf6-6e91-4b4d-83f7-aa98d6e9d40e';

async function testDocumentValidation() {
  console.log('🧪 Testing Furniture Document Validation...\n');

  // Test scenarios
  const testCases = [
    {
      name: 'Valid Wood Supplier Invoice',
      vendorName: 'Premium Wood Suppliers Ltd',
      items: [
        { description: 'Teak Wood Planks - 50 sq ft', amount: 25000 },
        { description: 'Plywood Sheets - Grade A', amount: 15000 }
      ],
      expectedResult: 'furniture_related'
    },
    {
      name: 'Valid Hardware Invoice',
      vendorName: 'Hardware Express India',
      items: [
        { description: 'Drawer slides - soft close', amount: 5000 },
        { description: 'Cabinet hinges - brass finish', amount: 3000 }
      ],
      expectedResult: 'furniture_related'
    },
    {
      name: 'Invalid Restaurant Invoice',
      vendorName: 'Dominos Pizza',
      items: [
        { description: 'Large Pizza - Margherita', amount: 500 },
        { description: 'Coca Cola 2L', amount: 100 }
      ],
      expectedResult: 'not_furniture_related'
    },
    {
      name: 'Invalid Medical Invoice',
      vendorName: 'Apollo Pharmacy',
      items: [
        { description: 'Medical supplies', amount: 2000 },
        { description: 'Prescription medicines', amount: 1500 }
      ],
      expectedResult: 'not_furniture_related'
    },
    {
      name: 'Edge Case - Ambiguous Vendor',
      vendorName: 'General Traders',
      items: [
        { description: 'Office supplies', amount: 3000 },
        { description: 'Miscellaneous items', amount: 2000 }
      ],
      expectedResult: 'not_furniture_related'
    }
  ];

  // Check existing vendors
  console.log('📋 Checking existing vendors in the system...');
  const { data: vendors, error: vendorError } = await supabase
    .from('core_entities')
    .select('entity_name, entity_code, metadata')
    .eq('organization_id', ORGANIZATION_ID)
    .eq('entity_type', 'vendor');

  if (!vendorError && vendors) {
    console.log(`Found ${vendors.length} existing vendors:`);
    vendors.slice(0, 5).forEach(v => {
      console.log(`  - ${v.entity_name} (${v.entity_code})`);
    });
    console.log('\n');
  }

  // Test each scenario
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`Vendor: ${testCase.vendorName}`);
    console.log(`Items: ${testCase.items.map(i => i.description).join(', ')}`);
    
    // Simulate the validation logic
    const allText = `${testCase.vendorName} ${testCase.items.map(i => i.description).join(' ')}`.toLowerCase();
    
    const furnitureKeywords = ['wood', 'timber', 'plywood', 'hardware', 'hinge', 'drawer', 'cabinet', 'furniture'];
    const nonFurnitureKeywords = ['pizza', 'food', 'medical', 'pharmacy', 'restaurant', 'software'];
    
    let isFurnitureRelated = false;
    let detectedCategory = 'unknown';
    
    // Check non-furniture first
    for (const keyword of nonFurnitureKeywords) {
      if (allText.includes(keyword)) {
        isFurnitureRelated = false;
        detectedCategory = keyword;
        break;
      }
    }
    
    // If not non-furniture, check for furniture keywords
    if (detectedCategory === 'unknown') {
      for (const keyword of furnitureKeywords) {
        if (allText.includes(keyword)) {
          isFurnitureRelated = true;
          detectedCategory = keyword;
          break;
        }
      }
    }
    
    const result = isFurnitureRelated ? 'furniture_related' : 'not_furniture_related';
    const passed = result === testCase.expectedResult;
    
    console.log(`Expected: ${testCase.expectedResult}`);
    console.log(`Actual: ${result}`);
    console.log(`Detected Category: ${detectedCategory}`);
    console.log(`Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (isFurnitureRelated) {
      console.log(`Suggested Action: Process as furniture invoice`);
    } else {
      console.log(`Suggested Action: Record as general business expense`);
    }
  }

  console.log('\n\n✨ Testing complete!');
}

// Run tests
testDocumentValidation().catch(console.error);