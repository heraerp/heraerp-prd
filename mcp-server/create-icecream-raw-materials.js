#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ice cream organization ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';

async function createRawMaterials() {
  console.log('🥛 Creating raw materials for ice cream production...\n');

  const rawMaterials = [
    // Dairy Products
    {
      name: 'Full Cream Milk',
      code: 'RM-MILK-001',
      category: 'Dairy',
      unit: 'liters',
      cost_per_unit: 55,
      min_stock: 500,
      supplier: 'Kerala Dairy Co-op'
    },
    {
      name: 'Heavy Cream',
      code: 'RM-CREAM-001',
      category: 'Dairy',
      unit: 'liters',
      cost_per_unit: 120,
      min_stock: 300,
      supplier: 'Premium Dairy Suppliers'
    },
    {
      name: 'Milk Powder',
      code: 'RM-MILKPOW-001',
      category: 'Dairy',
      unit: 'kg',
      cost_per_unit: 380,
      min_stock: 50,
      supplier: 'Amul Industries'
    },
    
    // Sweeteners
    {
      name: 'Sugar',
      code: 'RM-SUGAR-001',
      category: 'Sweetener',
      unit: 'kg',
      cost_per_unit: 45,
      min_stock: 200,
      supplier: 'South India Sugars'
    },
    {
      name: 'Brown Sugar',
      code: 'RM-BSUGAR-001',
      category: 'Sweetener',
      unit: 'kg',
      cost_per_unit: 55,
      min_stock: 50,
      supplier: 'Organic Sweeteners Ltd'
    },
    {
      name: 'Stevia Extract',
      code: 'RM-STEVIA-001',
      category: 'Sweetener',
      unit: 'kg',
      cost_per_unit: 2500,
      min_stock: 5,
      supplier: 'Natural Sweeteners India'
    },
    
    // Flavorings
    {
      name: 'Vanilla Extract',
      code: 'RM-VANILLA-001',
      category: 'Flavoring',
      unit: 'liters',
      cost_per_unit: 850,
      min_stock: 10,
      supplier: 'Kerala Spice Company'
    },
    {
      name: 'Cocoa Powder',
      code: 'RM-COCOA-001',
      category: 'Flavoring',
      unit: 'kg',
      cost_per_unit: 450,
      min_stock: 30,
      supplier: 'Cocoa Imports Ltd'
    },
    {
      name: 'Natural Mango Flavor',
      code: 'RM-MANGO-FL-001',
      category: 'Flavoring',
      unit: 'liters',
      cost_per_unit: 600,
      min_stock: 5,
      supplier: 'Fruit Essence Co'
    },
    {
      name: 'Natural Caramel Flavor',
      code: 'RM-CARAMEL-001',
      category: 'Flavoring',
      unit: 'liters',
      cost_per_unit: 500,
      min_stock: 5,
      supplier: 'Flavor Masters'
    },
    
    // Fruits and Nuts
    {
      name: 'Mango Pulp',
      code: 'RM-MANGO-001',
      category: 'Fruit',
      unit: 'kg',
      cost_per_unit: 120,
      min_stock: 100,
      supplier: 'Alphonso Exports'
    },
    {
      name: 'Strawberry Pulp',
      code: 'RM-STRAW-001',
      category: 'Fruit',
      unit: 'kg',
      cost_per_unit: 180,
      min_stock: 50,
      supplier: 'Berry Fresh Ltd'
    },
    {
      name: 'Pistachio Nuts',
      code: 'RM-PISTA-001',
      category: 'Nuts',
      unit: 'kg',
      cost_per_unit: 1200,
      min_stock: 10,
      supplier: 'Premium Dry Fruits'
    },
    {
      name: 'Cashew Nuts',
      code: 'RM-CASHEW-001',
      category: 'Nuts',
      unit: 'kg',
      cost_per_unit: 800,
      min_stock: 10,
      supplier: 'Kerala Cashew Corp'
    },
    
    // Chocolates and Confections
    {
      name: 'Dark Chocolate Chips',
      code: 'RM-CHOCCHIP-001',
      category: 'Chocolate',
      unit: 'kg',
      cost_per_unit: 650,
      min_stock: 50,
      supplier: 'Belgian Chocolate Co'
    },
    {
      name: 'Chocolate Cookies',
      code: 'RM-COOKIES-001',
      category: 'Confection',
      unit: 'kg',
      cost_per_unit: 250,
      min_stock: 30,
      supplier: 'Cookie Factory'
    },
    {
      name: 'Butterscotch Chips',
      code: 'RM-BUTTER-001',
      category: 'Confection',
      unit: 'kg',
      cost_per_unit: 350,
      min_stock: 20,
      supplier: 'Sweet Treats Ltd'
    },
    
    // Additives and Stabilizers
    {
      name: 'Stabilizer',
      code: 'RM-STAB-001',
      category: 'Additive',
      unit: 'kg',
      cost_per_unit: 1500,
      min_stock: 10,
      supplier: 'Food Tech Solutions'
    },
    {
      name: 'Citric Acid',
      code: 'RM-CITRIC-001',
      category: 'Additive',
      unit: 'kg',
      cost_per_unit: 150,
      min_stock: 5,
      supplier: 'Chemical Foods Ltd'
    },
    {
      name: 'Natural Flavor Enhancer',
      code: 'RM-ENHANCE-001',
      category: 'Additive',
      unit: 'kg',
      cost_per_unit: 2000,
      min_stock: 5,
      supplier: 'Natural Ingredients Co'
    },
    {
      name: 'Cardamom Powder',
      code: 'RM-CARDAM-001',
      category: 'Spice',
      unit: 'kg',
      cost_per_unit: 3500,
      min_stock: 2,
      supplier: 'Kerala Spice Company'
    },
    {
      name: 'Saffron',
      code: 'RM-SAFFRON-001',
      category: 'Spice',
      unit: 'kg',
      cost_per_unit: 250000,
      min_stock: 0.1,
      supplier: 'Kashmir Saffron'
    }
  ];

  try {
    for (const material of rawMaterials) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'raw_material',
          entity_name: material.name,
          entity_code: material.code,
          smart_code: 'HERA.MFG.RAW.MATERIAL.v1',
          metadata: {
            category: material.category,
            unit: material.unit,
            cost_per_unit: material.cost_per_unit,
            min_stock_level: material.min_stock,
            preferred_supplier: material.supplier,
            storage_temp: material.category === 'Dairy' ? '2-4°C' : 'Room Temperature',
            shelf_life_days: material.category === 'Dairy' ? 7 : 365
          }
        })
        .select();

      if (error) {
        console.error(`❌ Failed to create ${material.name}:`, error.message);
      } else {
        console.log(`✅ Created: ${material.name} (${material.code}) - ₹${material.cost_per_unit}/${material.unit}`);
      }
    }

    console.log('\n✅ All raw materials created successfully!');
    console.log(`📊 Total raw materials: ${rawMaterials.length}`);

  } catch (error) {
    console.error('Error creating raw materials:', error);
  }
}

// Run the script
createRawMaterials();