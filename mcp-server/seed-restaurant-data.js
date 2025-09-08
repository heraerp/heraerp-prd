#!/usr/bin/env node

/**
 * HERA Restaurant Seed Data Generator
 * Creates real restaurant data using Sacred Six Tables
 * Smart Code: HERA.RESTAURANT.FOH.SEED.v1
 */

const { Command } = require('commander');
const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');
const ora = require('ora');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
);

// Restaurant configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Entity smart codes
    MENU_CATEGORY: 'HERA.RESTAURANT.FOH.MENU.CATEGORY.v1',
    MENU_ITEM: 'HERA.RESTAURANT.FOH.MENU.ITEM.v1',
    TABLE: 'HERA.RESTAURANT.FOH.TABLE.v1',
    KITCHEN_STATION: 'HERA.RESTAURANT.FOH.KITCHEN.STATION.v1',
    PAYMENT_METHOD: 'HERA.RESTAURANT.FOH.PAYMENT.METHOD.v1',
    
    // Transaction smart codes  
    SALE: 'HERA.RESTAURANT.FOH.POS.SALE.v1',
    
    // Line item smart codes
    LINE_ITEM: 'HERA.RESTAURANT.FOH.POS.LINE.ITEM.v1',
    LINE_TAX: 'HERA.RESTAURANT.FOH.POS.LINE.TAX.v1',
    LINE_TIP: 'HERA.RESTAURANT.FOH.POS.LINE.TIP.v1',
    
    // Relationship smart codes
    MENU_IN_CATEGORY: 'HERA.RESTAURANT.FOH.REL.MENU_IN_CATEGORY.v1',
    TABLE_TO_ORDER: 'HERA.RESTAURANT.FOH.REL.TABLE_TO_ORDER.v1',
    ORDER_TO_KITCHEN: 'HERA.RESTAURANT.FOH.REL.ORDER_TO_KITCHEN.v1'
  }
};

const program = new Command();

program
  .name('seed-restaurant-data')
  .description('Seed restaurant data for HERA FOH module')
  .version('1.0.0');

// Main seeding command
program
  .command('seed')
  .description('Create complete restaurant seed data')
  .action(async () => {
    console.log(chalk.bold.blue('\n🍽️  HERA Restaurant Data Seeder\n'));
    
    const spinner = ora('Creating restaurant data...').start();
    
    try {
      // 1. Create Menu Categories
      spinner.text = 'Creating menu categories...';
      const categories = await createMenuCategories();
      console.log(chalk.green(`✅ Created ${categories.length} menu categories`));
      
      // 2. Create Menu Items
      spinner.text = 'Creating menu items...';
      const menuItems = await createMenuItems(categories);
      console.log(chalk.green(`✅ Created ${menuItems.length} menu items`));
      
      // 3. Create Tables
      spinner.text = 'Creating tables and floor plan...';
      const tables = await createTables();
      console.log(chalk.green(`✅ Created ${tables.length} tables`));
      
      // 4. Create Kitchen Stations
      spinner.text = 'Creating kitchen stations...';
      const kitchenStations = await createKitchenStations();
      console.log(chalk.green(`✅ Created ${kitchenStations.length} kitchen stations`));
      
      // 5. Create Payment Methods
      spinner.text = 'Creating payment methods...';
      const paymentMethods = await createPaymentMethods();
      console.log(chalk.green(`✅ Created ${paymentMethods.length} payment methods`));
      
      // 6. Create sample orders
      spinner.text = 'Creating sample orders...';
      const orders = await createSampleOrders(tables, menuItems);
      console.log(chalk.green(`✅ Created ${orders.length} sample orders`));
      
      spinner.succeed('Restaurant data seeded successfully!');
      
      console.log(chalk.bold.cyan('\n📊 Summary:'));
      console.log(`  Categories: ${categories.length}`);
      console.log(`  Menu Items: ${menuItems.length}`);
      console.log(`  Tables: ${tables.length}`);
      console.log(`  Kitchen Stations: ${kitchenStations.length}`);
      console.log(`  Payment Methods: ${paymentMethods.length}`);
      console.log(`  Sample Orders: ${orders.length}`);
      
    } catch (error) {
      spinner.fail('Seeding failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function createMenuCategories() {
  const categories = [
    { name: 'Antipasti', code: 'CAT-ANTIPASTI', sort_order: 1 },
    { name: 'Insalate', code: 'CAT-INSALATE', sort_order: 2 },
    { name: 'Pasta', code: 'CAT-PASTA', sort_order: 3 },
    { name: 'Pizza', code: 'CAT-PIZZA', sort_order: 4 },
    { name: 'Secondi Piatti', code: 'CAT-SECONDI', sort_order: 5 },
    { name: 'Dolci', code: 'CAT-DOLCI', sort_order: 6 },
    { name: 'Bevande', code: 'CAT-BEVANDE', sort_order: 7 },
    { name: 'Vino', code: 'CAT-VINO', sort_order: 8 }
  ];
  
  const results = [];
  for (const cat of categories) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: RESTAURANT_CONFIG.organizationId,
        entity_type: 'menu_category',
        entity_name: cat.name,
        entity_code: cat.code,
        smart_code: RESTAURANT_CONFIG.smartCodes.MENU_CATEGORY,
        metadata: { sort_order: cat.sort_order },
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    results.push(data);
  }
  return results;
}

async function createMenuItems(categories) {
  const menuData = {
    'Antipasti': [
      { name: 'Bruschetta al Pomodoro', price: 12, description: 'Toasted bread with fresh tomatoes, garlic, basil' },
      { name: 'Carpaccio di Manzo', price: 18, description: 'Thinly sliced raw beef with arugula, parmesan' },
      { name: 'Calamari Fritti', price: 16, description: 'Golden fried squid with marinara sauce' },
      { name: 'Antipasto Misto', price: 24, description: 'Chef selection of cured meats, cheeses, olives' }
    ],
    'Insalate': [
      { name: 'Insalata Mista', price: 10, description: 'Mixed greens with house vinaigrette' },
      { name: 'Caesar Salad', price: 14, description: 'Romaine, parmesan, croutons, caesar dressing' },
      { name: 'Caprese', price: 16, description: 'Fresh mozzarella, tomatoes, basil, balsamic' }
    ],
    'Pasta': [
      { name: 'Spaghetti Carbonara', price: 22, description: 'Egg, pancetta, pecorino romano' },
      { name: 'Penne Arrabbiata', price: 18, description: 'Spicy tomato sauce with garlic' },
      { name: 'Fettuccine Alfredo', price: 20, description: 'Cream sauce with parmesan' },
      { name: 'Linguine alle Vongole', price: 26, description: 'Fresh clams, white wine, garlic' },
      { name: 'Lasagne Bolognese', price: 24, description: 'Traditional meat sauce, bechamel' }
    ],
    'Pizza': [
      { name: 'Margherita', price: 18, description: 'Tomato, mozzarella, basil' },
      { name: 'Pepperoni', price: 22, description: 'Tomato, mozzarella, pepperoni' },
      { name: 'Quattro Formaggi', price: 24, description: 'Four cheese blend' },
      { name: 'Prosciutto e Funghi', price: 26, description: 'Ham, mushrooms, mozzarella' },
      { name: 'Diavola', price: 24, description: 'Spicy salami, peppers, mozzarella' }
    ],
    'Secondi Piatti': [
      { name: 'Pollo Parmigiana', price: 28, description: 'Breaded chicken, tomato sauce, mozzarella' },
      { name: 'Scaloppine al Limone', price: 32, description: 'Veal with lemon butter sauce' },
      { name: 'Branzino al Sale', price: 36, description: 'Salt-crusted sea bass' },
      { name: 'Bistecca alla Fiorentina', price: 45, description: 'Grilled T-bone steak' }
    ],
    'Dolci': [
      { name: 'Tiramisu', price: 10, description: 'Classic coffee-flavored dessert' },
      { name: 'Panna Cotta', price: 9, description: 'Vanilla cream with berry coulis' },
      { name: 'Gelato', price: 8, description: 'Choice of flavors' }
    ],
    'Bevande': [
      { name: 'Espresso', price: 4, description: 'Italian espresso' },
      { name: 'Cappuccino', price: 6, description: 'Espresso with steamed milk' },
      { name: 'Acqua Minerale', price: 5, description: 'Sparkling or still' },
      { name: 'Soft Drinks', price: 4, description: 'Coke, Sprite, Orange' }
    ]
  };
  
  const results = [];
  let itemCode = 1000;
  
  for (const category of categories) {
    const items = menuData[category.entity_name] || [];
    
    for (const item of items) {
      // Create menu item entity
      const { data: menuItem, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: RESTAURANT_CONFIG.organizationId,
          entity_type: 'menu_item',
          entity_name: item.name,
          entity_code: `ITEM-${itemCode++}`,
          smart_code: RESTAURANT_CONFIG.smartCodes.MENU_ITEM,
          metadata: {
            description: item.description,
            price: item.price,
            category_id: category.id,
            allergens: [],
            nutrition_info: {},
            prep_time_minutes: Math.floor(Math.random() * 20) + 10
          },
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create price in dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: menuItem.id,
          field_name: 'base_price',
          field_value_number: item.price,
          smart_code: 'HERA.RESTAURANT.FOH.DYN.PRICE.v1',
          metadata: { currency: 'USD' }
        });
      
      // Create relationship to category
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: RESTAURANT_CONFIG.organizationId,
          from_entity_id: menuItem.id,
          to_entity_id: category.id,
          relationship_type: 'menu_in_category',
          smart_code: RESTAURANT_CONFIG.smartCodes.MENU_IN_CATEGORY,
          metadata: {},
          status: 'active'
        });
      
      results.push(menuItem);
    }
  }
  return results;
}

async function createTables() {
  const tables = [];
  const sections = [
    { name: 'Main Dining', prefix: 'M', count: 12, seats: 4 },
    { name: 'Patio', prefix: 'P', count: 8, seats: 2 },
    { name: 'Private', prefix: 'PR', count: 2, seats: 8 },
    { name: 'Bar', prefix: 'B', count: 6, seats: 2 }
  ];
  
  for (const section of sections) {
    for (let i = 1; i <= section.count; i++) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: RESTAURANT_CONFIG.organizationId,
          entity_type: 'table',
          entity_name: `Table ${section.prefix}${i}`,
          entity_code: `TABLE-${section.prefix}${i}`,
          smart_code: RESTAURANT_CONFIG.smartCodes.TABLE,
          metadata: {
            section: section.name,
            seats: section.seats,
            position: { x: Math.random() * 100, y: Math.random() * 100 }
          },
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      tables.push(data);
    }
  }
  return tables;
}

async function createKitchenStations() {
  const stations = [
    { name: 'Hot Kitchen', code: 'HOT-KITCHEN', types: ['pasta', 'secondi'] },
    { name: 'Cold Kitchen', code: 'COLD-KITCHEN', types: ['antipasti', 'insalate'] },
    { name: 'Pizza Oven', code: 'PIZZA-OVEN', types: ['pizza'] },
    { name: 'Dessert Station', code: 'DESSERT', types: ['dolci'] },
    { name: 'Bar', code: 'BAR', types: ['bevande', 'vino'] }
  ];
  
  const results = [];
  for (const station of stations) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: RESTAURANT_CONFIG.organizationId,
        entity_type: 'kitchen_station',
        entity_name: station.name,
        entity_code: station.code,
        smart_code: RESTAURANT_CONFIG.smartCodes.KITCHEN_STATION,
        metadata: { handles_types: station.types },
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    results.push(data);
  }
  return results;
}

async function createPaymentMethods() {
  const methods = [
    { name: 'Cash', code: 'CASH', type: 'cash' },
    { name: 'Credit Card', code: 'CREDIT', type: 'card' },
    { name: 'Debit Card', code: 'DEBIT', type: 'card' },
    { name: 'Gift Card', code: 'GIFT', type: 'gift_card' },
    { name: 'Mobile Pay', code: 'MOBILE', type: 'digital' }
  ];
  
  const results = [];
  for (const method of methods) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: RESTAURANT_CONFIG.organizationId,
        entity_type: 'payment_method',
        entity_name: method.name,
        entity_code: method.code,
        smart_code: RESTAURANT_CONFIG.smartCodes.PAYMENT_METHOD,
        metadata: { payment_type: method.type },
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    results.push(data);
  }
  return results;
}

async function createSampleOrders(tables, menuItems) {
  const orders = [];
  const activeTableCount = Math.floor(tables.length * 0.5); // 50% occupancy
  
  for (let i = 0; i < activeTableCount; i++) {
    const table = tables[i];
    const orderItemCount = Math.floor(Math.random() * 4) + 2; // 2-5 items
    const selectedItems = [];
    let subtotal = 0;
    
    // Select random menu items
    for (let j = 0; j < orderItemCount; j++) {
      const item = menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
      const lineTotal = (item.metadata.price || 0) * quantity;
      
      selectedItems.push({
        item,
        quantity,
        unit_price: item.metadata.price || 0,
        line_total: lineTotal
      });
      subtotal += lineTotal;
    }
    
    // Calculate tax and total
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    // Create order transaction
    const { data: order, error: orderError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: RESTAURANT_CONFIG.organizationId,
        transaction_type: 'sale',
        transaction_date: new Date().toISOString(),
        transaction_code: `ORD-${Date.now()}-${i}`,
        smart_code: RESTAURANT_CONFIG.smartCodes.SALE,
        from_entity_id: table.id,
        total_amount: total,
        metadata: {
          table_number: table.entity_name,
          server: 'Demo Server',
          order_time: new Date().toISOString(),
          status: 'active',
          guest_count: Math.floor(Math.random() * table.metadata.seats) + 1
        },
        status: 'active'
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // Create transaction lines
    let lineNumber = 1;
    for (const lineItem of selectedItems) {
      await supabase
        .from('universal_transaction_lines')
        .insert({
          transaction_id: order.id,
          line_number: lineNumber++,
          line_entity_id: lineItem.item.id,
          line_type: 'menu_item',
          smart_code: RESTAURANT_CONFIG.smartCodes.LINE_ITEM,
          quantity: lineItem.quantity,
          unit_price: lineItem.unit_price,
          line_amount: lineItem.line_total,
          metadata: {
            item_name: lineItem.item.entity_name,
            modifiers: []
          },
          status: 'active'
        });
    }
    
    // Add tax line
    await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: order.id,
        line_number: lineNumber++,
        line_type: 'tax',
        smart_code: RESTAURANT_CONFIG.smartCodes.LINE_TAX,
        quantity: 1,
        unit_price: tax,
        line_amount: tax,
        metadata: { tax_rate: 0.08, tax_type: 'sales_tax' },
        status: 'active'
      });
    
    // Create relationship between table and order
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: RESTAURANT_CONFIG.organizationId,
        from_entity_id: table.id,
        to_entity_id: order.id,
        relationship_type: 'table_to_order',
        smart_code: RESTAURANT_CONFIG.smartCodes.TABLE_TO_ORDER,
        metadata: { order_status: 'active' },
        status: 'active'
      });
    
    orders.push(order);
  }
  
  return orders;
}

// Run the program
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}