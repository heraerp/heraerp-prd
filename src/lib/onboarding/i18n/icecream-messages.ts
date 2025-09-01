/**
 * Ice Cream Manufacturing - Onboarding Messages
 * 
 * i18n messages for ice cream ERP tours
 */

export const iceCreamMessages: Record<string, string> = {
  // Dashboard Tour
  'ui.onboard.icecream.dashboard.welcome.title': 'Welcome to Kochi Ice Cream ERP',
  'ui.onboard.icecream.dashboard.welcome.body': 'This is your manufacturing command center. From here, you can monitor production, track inventory, and manage your entire ice cream operation. Let\'s explore the key features!',
  
  'ui.onboard.icecream.dashboard.stats.title': 'Real-Time Production Metrics',
  'ui.onboard.icecream.dashboard.stats.body': 'These cards show your key performance indicators at a glance: total products, active production batches, quality control status, and outlet performance. Click any card for detailed insights.',
  
  'ui.onboard.icecream.dashboard.production.title': 'Production Status Monitor',
  'ui.onboard.icecream.dashboard.production.body': 'Track your active production batches in real-time. See which flavors are being made, batch sizes, and production efficiency. Green indicators mean everything is running smoothly!',
  
  'ui.onboard.icecream.dashboard.inventory.title': 'Inventory Levels',
  'ui.onboard.icecream.dashboard.inventory.body': 'Monitor your raw materials and finished products. Low stock items are highlighted in red. The system automatically calculates reorder points based on your production patterns.',
  
  'ui.onboard.icecream.dashboard.sidebar.title': 'Navigation Menu',
  'ui.onboard.icecream.dashboard.sidebar.body': 'Access all ERP modules from here: Production, Inventory, Quality Control, Distribution, and more. The badge numbers show pending tasks in each module.',
  
  // Production Tour
  'ui.onboard.icecream.production.overview.title': 'Production Management',
  'ui.onboard.icecream.production.overview.body': 'This is where you manage your ice cream manufacturing. Create batches, track progress, and monitor efficiency. All production follows HACCP standards automatically.',
  
  'ui.onboard.icecream.production.batch.title': 'Create New Batch',
  'ui.onboard.icecream.production.batch.body': 'Start a new production batch by clicking this button. Select the recipe, specify quantity, and the system will calculate required ingredients and expected output.',
  
  'ui.onboard.icecream.production.status.title': 'Active Batches',
  'ui.onboard.icecream.production.status.body': 'View all batches currently in production. Each card shows the flavor, progress, temperature monitoring, and estimated completion time. Click a batch to see detailed information.',
  
  // Inventory Tour
  'ui.onboard.icecream.inventory.overview.title': 'Inventory Management',
  'ui.onboard.icecream.inventory.overview.body': 'Complete visibility of your raw materials and finished products. The system tracks everything from milk and cream to packaging materials, with automatic low-stock alerts.',
  
  'ui.onboard.icecream.inventory.materials.title': 'Raw Materials',
  'ui.onboard.icecream.inventory.materials.body': 'Track all ingredients: dairy products, sugars, flavoring agents, and stabilizers. Each item shows current stock, usage rate, and days until reorder. Temperature-sensitive items are monitored 24/7.',
  
  'ui.onboard.icecream.inventory.products.title': 'Finished Products',
  'ui.onboard.icecream.inventory.products.body': 'View your ready-to-sell ice cream inventory by flavor and size. The system automatically updates quantities when production completes or sales occur.',
  
  // POS Tour
  'ui.onboard.icecream.pos.intro.title': 'Point of Sale Terminal',
  'ui.onboard.icecream.pos.intro.body': 'Process retail sales quickly and efficiently. This touch-optimized interface works on tablets and supports multiple payment methods. All sales sync instantly with inventory.',
  
  'ui.onboard.icecream.pos.products.title': 'Product Selection',
  'ui.onboard.icecream.pos.products.body': 'Tap any product to add it to the cart. Products are organized by category (cones, cups, family packs). Out-of-stock items are automatically grayed out.',
  
  'ui.onboard.icecream.pos.cart.title': 'Shopping Cart',
  'ui.onboard.icecream.pos.cart.body': 'Review the order, apply discounts, and process payment. The system calculates taxes automatically and can print or email receipts. Loyalty points are applied instantly.',
  
  // Quality Control Tour
  'ui.onboard.icecream.quality.intro.title': 'Quality Control Center',
  'ui.onboard.icecream.quality.intro.body': 'Ensure product safety and quality with systematic checks. Every batch requires quality approval before distribution. Track temperature logs, lab results, and compliance certificates.',
  
  'ui.onboard.icecream.quality.pending.title': 'Pending Quality Checks',
  'ui.onboard.icecream.quality.pending.body': 'Batches awaiting quality inspection appear here. Priority is given to temperature-sensitive products. Click any batch to perform quality tests and record results.',
  
  'ui.onboard.icecream.quality.actions.title': 'Quality Actions',
  'ui.onboard.icecream.quality.actions.body': 'Approve batches that pass all tests, reject non-conforming products, or quarantine items for further testing. All actions are logged for compliance auditing.',
};