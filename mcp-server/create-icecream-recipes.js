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

async function createIceCreamRecipes() {
  console.log('🍦 Creating ice cream recipes...\n');

  try {
    // Fetch products
    const { data: products } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'product');

    // Fetch raw materials
    const { data: rawMaterials } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'raw_material');

    console.log(`Found ${products.length} products and ${rawMaterials.length} raw materials\n`);

    // Helper function to find material by name
    const findMaterial = (name) => rawMaterials.find(m => 
      m.entity_name.toLowerCase().includes(name.toLowerCase())
    );

    // Recipe definitions
    const recipes = [
      {
        productName: 'Vanilla Supreme',
        recipeName: 'Premium Vanilla Bean Ice Cream Recipe',
        category: 'Premium',
        batchSize: 100,
        prepTime: 60,
        yield: 95,
        ingredients: [
          { material: 'Full Cream Milk', quantity: 40, unit: 'liters' },
          { material: 'Heavy Cream', quantity: 25, unit: 'liters' },
          { material: 'Sugar', quantity: 18, unit: 'kg' },
          { material: 'Vanilla Extract', quantity: 0.5, unit: 'liters' },
          { material: 'Stabilizer', quantity: 0.3, unit: 'kg' },
          { material: 'Milk Powder', quantity: 3, unit: 'kg' }
        ],
        processSteps: [
          'Heat milk to 65°C while stirring constantly',
          'Mix dry ingredients (sugar, milk powder, stabilizer)',
          'Add dry mix to heated milk gradually',
          'Add cream and heat to 80°C for pasteurization',
          'Cool rapidly to 4°C',
          'Add vanilla extract during cooling',
          'Age mixture for 4-12 hours at 4°C',
          'Churn in continuous freezer at -5°C',
          'Package and harden at -25°C'
        ],
        qualityParameters: {
          overrun: '65-70%',
          serving_temperature: '-12°C',
          texture: 'Smooth and creamy',
          shelf_life_months: 12
        }
      },
      {
        productName: 'Belgian Chocolate',
        recipeName: 'Belgian Dark Chocolate Ice Cream Recipe',
        category: 'Premium',
        batchSize: 100,
        prepTime: 75,
        yield: 94,
        ingredients: [
          { material: 'Full Cream Milk', quantity: 35, unit: 'liters' },
          { material: 'Heavy Cream', quantity: 30, unit: 'liters' },
          { material: 'Sugar', quantity: 16, unit: 'kg' },
          { material: 'Cocoa Powder', quantity: 8, unit: 'kg' },
          { material: 'Dark Chocolate Chips', quantity: 12, unit: 'kg' },
          { material: 'Stabilizer', quantity: 0.4, unit: 'kg' },
          { material: 'Milk Powder', quantity: 2, unit: 'kg' }
        ],
        processSteps: [
          'Melt chocolate chips in double boiler at 45°C',
          'Heat milk and cream to 65°C',
          'Mix cocoa powder with sugar',
          'Add dry mix to heated dairy',
          'Incorporate melted chocolate slowly',
          'Pasteurize at 82°C for 25 seconds',
          'Cool to 4°C rapidly',
          'Age for 6-8 hours',
          'Churn at -6°C for rich texture',
          'Package and freeze at -25°C'
        ],
        qualityParameters: {
          cocoa_content: '22%',
          overrun: '60-65%',
          texture: 'Dense and velvety',
          melting_point: '-14°C'
        }
      },
      {
        productName: 'Mango Family Pack',
        recipeName: 'Alphonso Mango Sorbet Recipe',
        category: 'Seasonal',
        batchSize: 100,
        prepTime: 45,
        yield: 97,
        ingredients: [
          { material: 'Mango Pulp', quantity: 50, unit: 'kg' },
          { material: 'Sugar', quantity: 20, unit: 'kg' },
          { material: 'Citric Acid', quantity: 0.2, unit: 'kg' },
          { material: 'Stabilizer', quantity: 0.2, unit: 'kg' },
          { material: 'Natural Mango Flavor', quantity: 0.1, unit: 'liters' }
        ],
        processSteps: [
          'Prepare sugar syrup at 65°Brix',
          'Cool syrup to room temperature',
          'Blend mango pulp until smooth',
          'Mix pulp with cooled syrup',
          'Add citric acid for balance',
          'Incorporate stabilizer',
          'Mix thoroughly for 10 minutes',
          'Age at 4°C for 2 hours',
          'Churn at -8°C',
          'Quick freeze at -30°C'
        ],
        qualityParameters: {
          fruit_content: '50%',
          brix_level: '28-30°',
          ph_level: '3.8-4.0',
          overrun: '25-30%'
        }
      },
      {
        productName: 'Sugar-Free Vanilla',
        recipeName: 'Sugar-Free Vanilla Ice Cream Recipe',
        category: 'Classic',
        batchSize: 100,
        prepTime: 65,
        yield: 93,
        ingredients: [
          { material: 'Full Cream Milk', quantity: 45, unit: 'liters' },
          { material: 'Heavy Cream', quantity: 20, unit: 'liters' },
          { material: 'Stevia Extract', quantity: 0.8, unit: 'kg' },
          { material: 'Vanilla Extract', quantity: 0.4, unit: 'liters' },
          { material: 'Stabilizer', quantity: 0.5, unit: 'kg' },
          { material: 'Milk Powder', quantity: 4, unit: 'kg' },
          { material: 'Natural Flavor Enhancer', quantity: 0.2, unit: 'kg' }
        ],
        processSteps: [
          'Heat milk to 60°C',
          'Dissolve stevia extract completely',
          'Add milk powder and stabilizer',
          'Heat to 78°C for pasteurization',
          'Add cream at 70°C',
          'Cool to 4°C',
          'Add vanilla extract',
          'Age for 8 hours minimum',
          'Churn at -4°C slowly',
          'Package with care to prevent crystallization'
        ],
        qualityParameters: {
          calories_per_100g: '120',
          sweetness_level: 'Equivalent to 14% sugar',
          texture: 'Creamy with no aftertaste',
          diabetic_friendly: 'Yes'
        }
      },
      {
        productName: 'Kesar Pista Kulfi',
        recipeName: 'Kesar Pista Kulfi Recipe',
        category: 'Classic',
        batchSize: 100,
        prepTime: 90,
        yield: 85,
        ingredients: [
          { material: 'Full Cream Milk', quantity: 60, unit: 'liters' },
          { material: 'Sugar', quantity: 15, unit: 'kg' },
          { material: 'Milk Powder', quantity: 8, unit: 'kg' },
          { material: 'Pistachio Nuts', quantity: 3, unit: 'kg' },
          { material: 'Cardamom Powder', quantity: 0.1, unit: 'kg' },
          { material: 'Saffron', quantity: 0.01, unit: 'kg' }
        ],
        processSteps: [
          'Reduce milk by 50% through slow boiling',
          'Soak saffron in warm milk',
          'Blanch and slice pistachios',
          'Add sugar to reduced milk',
          'Mix in milk powder gradually',
          'Add cardamom and saffron milk',
          'Cool to room temperature',
          'Add pistachio pieces',
          'Pour into kulfi molds',
          'Freeze at -18°C for 6 hours'
        ],
        qualityParameters: {
          density: 'High (no overrun)',
          texture: 'Dense and crystalline',
          traditional_score: '95%',
          serving_style: 'On stick or sliced'
        }
      },
      {
        productName: 'Choco Bar',
        recipeName: 'Cookies & Cream Ice Cream Recipe',
        category: 'Classic',
        batchSize: 100,
        prepTime: 50,
        yield: 96,
        ingredients: [
          { material: 'Full Cream Milk', quantity: 38, unit: 'liters' },
          { material: 'Heavy Cream', quantity: 28, unit: 'liters' },
          { material: 'Sugar', quantity: 17, unit: 'kg' },
          { material: 'Chocolate Cookies', quantity: 10, unit: 'kg' },
          { material: 'Vanilla Extract', quantity: 0.3, unit: 'liters' },
          { material: 'Stabilizer', quantity: 0.35, unit: 'kg' },
          { material: 'Milk Powder', quantity: 3, unit: 'kg' }
        ],
        processSteps: [
          'Crush cookies into varied sizes',
          'Heat milk and cream to 65°C',
          'Mix sugar, milk powder, and stabilizer',
          'Add dry ingredients to dairy',
          'Pasteurize at 80°C',
          'Cool to 4°C',
          'Add vanilla extract',
          'Age for 4 hours',
          'Churn at -5°C',
          'Fold in cookie pieces at end of churning',
          'Package and freeze'
        ],
        qualityParameters: {
          cookie_distribution: 'Even throughout',
          chunk_size: '5-15mm pieces',
          overrun: '70%',
          kids_appeal: 'Very High'
        }
      },
      {
        productName: 'Butterscotch Family Pack',
        recipeName: 'Butterscotch Crunch Ice Cream Recipe',
        category: 'Classic',
        batchSize: 100,
        prepTime: 55,
        yield: 95,
        ingredients: [
          { material: 'Full Cream Milk', quantity: 37, unit: 'liters' },
          { material: 'Heavy Cream', quantity: 27, unit: 'liters' },
          { material: 'Sugar', quantity: 14, unit: 'kg' },
          { material: 'Brown Sugar', quantity: 4, unit: 'kg' },
          { material: 'Butterscotch Chips', quantity: 8, unit: 'kg' },
          { material: 'Stabilizer', quantity: 0.35, unit: 'kg' },
          { material: 'Milk Powder', quantity: 3, unit: 'kg' },
          { material: 'Natural Caramel Flavor', quantity: 0.2, unit: 'liters' }
        ],
        processSteps: [
          'Caramelize brown sugar carefully',
          'Heat dairy to 65°C',
          'Add caramelized sugar to hot dairy',
          'Mix remaining dry ingredients',
          'Pasteurize at 80°C',
          'Cool rapidly',
          'Add butterscotch flavor',
          'Age for 6 hours',
          'Churn at -5°C',
          'Add butterscotch chips during last minute',
          'Freeze at -25°C'
        ],
        qualityParameters: {
          caramel_notes: 'Rich and balanced',
          crunch_texture: 'Maintained in frozen state',
          color: 'Golden brown',
          sweetness: 'Medium-high'
        }
      }
    ];

    // Create recipes
    for (const recipeData of recipes) {
      const product = products.find(p => p.entity_name === recipeData.productName);
      if (!product) {
        console.log(`⚠️ Product not found: ${recipeData.productName}`);
        continue;
      }

      // Create recipe entity
      const { data: recipe, error: recipeError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'recipe',
          entity_name: recipeData.recipeName,
          entity_code: `RECIPE-${product.entity_code}`,
          smart_code: 'HERA.MFG.RECIPE.ICECREAM.v1',
          metadata: {
            product_id: product.id,
            product_name: product.entity_name,
            batch_size: recipeData.batchSize,
            prep_time: recipeData.prepTime,
            yield: recipeData.yield,
            category: recipeData.category,
            unit: 'liters',
            process_steps: recipeData.processSteps,
            quality_parameters: recipeData.qualityParameters
          }
        })
        .select()
        .single();

      if (recipeError) {
        console.error(`Failed to create recipe for ${recipeData.productName}:`, recipeError);
        continue;
      }

      console.log(`✅ Created recipe: ${recipe.entity_name}`);

      // Create relationship to product
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: ORG_ID,
          from_entity_id: recipe.id,
          to_entity_id: product.id,
          relationship_type: 'recipe_for',
          smart_code: 'HERA.MFG.REL.RECIPE.PRODUCT.v1'
        });

      // Add ingredients
      let totalCost = 0;
      for (const ing of recipeData.ingredients) {
        const material = findMaterial(ing.material);
        if (!material) {
          console.log(`  ⚠️ Material not found: ${ing.material}`);
          continue;
        }

        const costPerUnit = material.metadata?.cost_per_unit || 0;
        const ingredientCost = costPerUnit * ing.quantity;
        totalCost += ingredientCost;

        // Create recipe component relationship
        const { error: relError } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: ORG_ID,
            from_entity_id: recipe.id,
            to_entity_id: material.id,
            relationship_type: 'recipe_component',
            smart_code: 'HERA.MFG.REL.RECIPE.COMPONENT.v1',
            relationship_data: {
              quantity: ing.quantity,
              unit: ing.unit,
              material_name: material.entity_name,
              cost_per_unit: costPerUnit,
              total_cost: ingredientCost
            }
          });

        if (!relError) {
          console.log(`  ✅ Added ingredient: ${material.entity_name} - ${ing.quantity} ${ing.unit}`);
        }
      }

      // Update recipe with total cost
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...recipe.metadata,
            total_batch_cost: totalCost,
            cost_per_liter: totalCost / recipeData.batchSize
          }
        })
        .eq('id', recipe.id);

      console.log(`  💰 Total batch cost: ₹${totalCost.toFixed(2)} (₹${(totalCost / recipeData.batchSize).toFixed(2)}/L)\n`);
    }

    console.log('✅ Recipe creation completed!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
createIceCreamRecipes();