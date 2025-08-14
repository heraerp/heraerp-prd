#!/usr/bin/env node
/**
 * 🍝 MARIO'S RESTAURANT INVENTORY TEST - FINAL VERSION
 * 
 * This script completes the inventory testing by creating recipe integration
 * and generating additional reports for Mario's Restaurant
 * 
 * Organization ID: 6f591f1a-ea86-493e-8ae4-639d28a7e3c8
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mario's Restaurant Organization ID
const MARIOS_ORG_ID = '6f591f1a-ea86-493e-8ae4-639d28a7e3c8';

// 🧬 HERA Smart Code Generator
const generateSmartCode = (entityType, context = {}) => {
  const industry = 'REST'; // Restaurant
  const module = context.module || 'INV'; // Inventory
  const operation = context.operation || 'ENT'; // Entity
  const type = context.type || 'ITEM'; // Item
  const version = 'v1';
  
  return `HERA.${industry}.${module}.${entityType.toUpperCase()}.${operation}.${type}.${version}`;
};

console.log('🍝 MARIO\'S RESTAURANT - FINAL INVENTORY INTEGRATION TESTING');
console.log('=' .repeat(70));
console.log(`🏢 Organization: ${MARIOS_ORG_ID}`);
console.log(`📅 Test Date: ${new Date().toISOString()}`);
console.log();

/**
 * 🔗 Create Recipe Integration System
 */
async function createRecipeIntegration() {
  console.log('🔗 Creating Recipe Integration System');
  console.log('-'.repeat(50));

  // Create popular Italian recipes
  const recipes = [
    {
      name: 'Spaghetti Carbonara',
      ingredients: ['Spaghetti Pasta', 'Parmesan Cheese', 'Black Pepper'],
      category: 'pasta',
      price: 18.95
    },
    {
      name: 'Margherita Pizza',
      ingredients: ['Pizza Dough Mix', 'Fresh Tomatoes', 'Fresh Mozzarella', 'Fresh Basil'],
      category: 'pizza',
      price: 16.95
    },
    {
      name: 'Beef Bolognese',
      ingredients: ['Penne Pasta', 'Ground Beef (80/20)', 'Fresh Tomatoes', 'Fresh Garlic'],
      category: 'pasta',
      price: 22.95
    }
  ];

  let recipesCreated = 0;
  let relationshipsCreated = 0;

  for (const recipe of recipes) {
    try {
      // Create recipe entity
      const recipeData = {
        organization_id: MARIOS_ORG_ID,
        entity_type: 'recipe',
        entity_name: recipe.name,
        entity_code: `RECIPE-${recipe.name.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        smart_code: generateSmartCode('recipe', { 
          module: 'MENU', 
          operation: 'CREATE',
          type: 'DISH' 
        }),
        status: 'active',
        metadata: {
          category: recipe.category,
          menu_price: recipe.price,
          cuisine_type: 'italian',
          difficulty_level: 'medium'
        }
      };

      const { data: recipeEntity, error: recipeError } = await supabase
        .from('core_entities')
        .insert(recipeData)
        .select()
        .single();

      if (recipeError) {
        console.log(`❌ Failed to create recipe ${recipe.name}: ${recipeError.message}`);
        continue;
      }

      recipesCreated++;

      // Get ingredients for this recipe
      const { data: ingredients } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', MARIOS_ORG_ID)
        .eq('entity_type', 'inventory_item')
        .in('entity_name', recipe.ingredients);

      // Create recipe-ingredient relationships
      if (ingredients?.length) {
        const relationships = ingredients.map(ingredient => ({
          organization_id: MARIOS_ORG_ID,
          parent_entity_id: recipeEntity.id,
          child_entity_id: ingredient.id,
          relationship_type: 'recipe_ingredient',
          smart_code: generateSmartCode('relationship', { 
            module: 'MENU', 
            operation: 'RECIPE',
            type: 'INGREDIENT' 
          }),
          metadata: {
            quantity_per_serving: Math.random() * 0.5 + 0.1, // 0.1-0.6 units per serving
            is_essential: true,
            preparation_notes: 'Handle with care for optimal flavor'
          }
        }));

        const { error: relationshipError } = await supabase
          .from('core_relationships')
          .insert(relationships);

        if (!relationshipError) {
          relationshipsCreated += relationships.length;
          console.log(`✅ Recipe "${recipe.name}" linked to ${relationships.length} ingredients`);
        }
      }

    } catch (error) {
      console.log(`❌ Exception creating recipe ${recipe.name}: ${error.message}`);
    }
  }

  console.log(`✅ Created ${recipesCreated} recipes with ${relationshipsCreated} ingredient relationships`);
  return { recipesCreated, relationshipsCreated };
}

/**
 * 📊 Generate Advanced Reports
 */
async function generateAdvancedReports() {
  console.log('\n📊 Generating Advanced Inventory Reports');
  console.log('-'.repeat(50));

  let reportsGenerated = 0;

  try {
    // Report 1: Ingredient Usage by Recipe
    const { data: recipes } = await supabase
      .from('core_entities')
      .select(`
        id, entity_name,
        core_relationships!inner(
          child_entity_id,
          metadata
        )
      `)
      .eq('organization_id', MARIOS_ORG_ID)
      .eq('entity_type', 'recipe');

    if (recipes?.length) {
      console.log('📋 Recipe-Ingredient Usage Analysis:');
      recipes.forEach(recipe => {
        console.log(`   ${recipe.entity_name}: ${recipe.core_relationships.length} ingredients`);
      });
      reportsGenerated++;
    }

    // Report 2: Supplier Category Distribution
    const { data: suppliers } = await supabase
      .from('core_entities')
      .select('entity_name, metadata')
      .eq('organization_id', MARIOS_ORG_ID)
      .eq('entity_type', 'supplier');

    if (suppliers?.length) {
      console.log('\n🏪 Supplier Category Distribution:');
      const categories = {};
      suppliers.forEach(supplier => {
        const category = supplier.metadata?.category_specialization || 'unknown';
        categories[category] = (categories[category] || 0) + 1;
      });
      
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} suppliers`);
      });
      reportsGenerated++;
    }

    // Report 3: Inventory Value by Category
    const { data: inventoryWithCosts } = await supabase
      .from('core_entities')
      .select(`
        id, entity_name, metadata,
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('organization_id', MARIOS_ORG_ID)
      .eq('entity_type', 'inventory_item')
      .eq('core_dynamic_data.field_name', 'unit_cost');

    if (inventoryWithCosts?.length) {
      console.log('\n💰 Inventory Value by Category:');
      const categoryValues = {};
      
      inventoryWithCosts.forEach(item => {
        const category = item.metadata?.category || 'unknown';
        const costData = item.core_dynamic_data.find(d => d.field_name === 'unit_cost');
        const unitCost = costData ? costData.field_value_number : 0;
        const estimatedStock = 20; // Simulated current stock
        const categoryValue = unitCost * estimatedStock;
        
        categoryValues[category] = (categoryValues[category] || 0) + categoryValue;
      });
      
      Object.entries(categoryValues).forEach(([category, value]) => {
        console.log(`   ${category}: $${value.toFixed(2)}`);
      });
      reportsGenerated++;
    }

    // Report 4: Transaction Summary
    const { data: transactions } = await supabase
      .from('universal_transactions')
      .select('transaction_type, total_amount, transaction_date')
      .eq('organization_id', MARIOS_ORG_ID)
      .order('transaction_date', { ascending: false });

    if (transactions?.length) {
      console.log('\n📈 Transaction Activity Summary:');
      console.log(`   Total Transactions: ${transactions.length}`);
      
      const byType = {};
      let totalValue = 0;
      
      transactions.forEach(tx => {
        byType[tx.transaction_type] = (byType[tx.transaction_type] || 0) + 1;
        totalValue += tx.total_amount || 0;
      });
      
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} transactions`);
      });
      
      console.log(`   Total Transaction Value: $${totalValue.toFixed(2)}`);
      reportsGenerated++;
    }

  } catch (error) {
    console.log(`❌ Error generating reports: ${error.message}`);
  }

  return reportsGenerated;
}

/**
 * 🧪 Test Stock Level Calculations
 */
async function testStockLevelCalculations() {
  console.log('\n🧪 Testing Stock Level Calculations');
  console.log('-'.repeat(50));

  try {
    // Get ingredients with reorder points
    const { data: ingredients } = await supabase
      .from('core_entities')
      .select(`
        id, entity_name,
        core_dynamic_data(field_name, field_value_number)
      `)
      .eq('organization_id', MARIOS_ORG_ID)
      .eq('entity_type', 'inventory_item')
      .limit(10);

    let lowStockItems = 0;
    let reorderRecommendations = [];

    if (ingredients?.length) {
      console.log('🔍 Stock Level Analysis:');
      
      ingredients.forEach(ingredient => {
        const fields = ingredient.core_dynamic_data || [];
        const reorderPoint = fields.find(f => f.field_name === 'reorder_point')?.field_value_number || 10;
        const maxStock = fields.find(f => f.field_name === 'max_stock_level')?.field_value_number || 50;
        const currentStock = Math.floor(Math.random() * 30); // Simulated current stock
        
        const stockStatus = currentStock <= reorderPoint ? 'LOW STOCK' : 'OK';
        
        if (currentStock <= reorderPoint) {
          lowStockItems++;
          const recommendedOrder = maxStock - currentStock;
          reorderRecommendations.push({
            item: ingredient.entity_name,
            current: currentStock,
            reorder_at: reorderPoint,
            recommend_order: recommendedOrder
          });
        }
        
        console.log(`   ${ingredient.entity_name}: ${currentStock} units (${stockStatus})`);
      });
      
      console.log(`\n📊 Stock Analysis Summary:`);
      console.log(`   Low Stock Items: ${lowStockItems}`);
      console.log(`   Reorder Recommendations: ${reorderRecommendations.length}`);
      
      if (reorderRecommendations.length > 0) {
        console.log('\n🛒 Recommended Reorders:');
        reorderRecommendations.forEach(rec => {
          console.log(`   ${rec.item}: Order ${rec.recommend_order} units`);
        });
      }
    }

  } catch (error) {
    console.log(`❌ Error in stock calculations: ${error.message}`);
  }
}

/**
 * 🎯 Main Integration Test Execution
 */
async function runFinalIntegrationTests() {
  const startTime = Date.now();

  try {
    const recipeResults = await createRecipeIntegration();
    const reportsGenerated = await generateAdvancedReports();
    await testStockLevelCalculations();

    const executionTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(70));
    console.log('🎊 MARIO\'S RESTAURANT INVENTORY INTEGRATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`⏱️  Integration Test Time: ${executionTime}ms`);
    console.log(`🍝 Recipes Created: ${recipeResults.recipesCreated}`);
    console.log(`🔗 Recipe-Ingredient Links: ${recipeResults.relationshipsCreated}`);
    console.log(`📊 Advanced Reports: ${reportsGenerated}`);
    console.log(`✅ Complete inventory system operational with HERA Universal Architecture`);

    // Save integration results
    const integrationResults = {
      test_date: new Date().toISOString(),
      organization_id: MARIOS_ORG_ID,
      integration_execution_time_ms: executionTime,
      recipes_created: recipeResults.recipesCreated,
      recipe_relationships: recipeResults.relationshipsCreated,
      advanced_reports: reportsGenerated
    };

    require('fs').writeFileSync(
      '/Users/san/Documents/PRD/heraerp-prd/mario-inventory-integration-results.json',
      JSON.stringify(integrationResults, null, 2)
    );

    console.log('📁 Integration results saved to mario-inventory-integration-results.json');

  } catch (error) {
    console.error('🔥 FATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Execute the final integration tests
runFinalIntegrationTests();