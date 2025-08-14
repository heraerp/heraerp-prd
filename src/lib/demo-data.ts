/**
 * HERA Demo Data Generator
 * Creates realistic business data for demo purposes
 * Similar to SAP's IDES demo company
 */

import { v4 as uuidv4 } from 'uuid'

// Demo organization ID
export const DEMO_ORG_ID = 'demo-org-001'
export const DEMO_USER_ID = 'demo-user-001'

// Helper to generate consistent IDs
const generateId = (prefix: string) => `demo-${prefix}-${uuidv4().slice(0, 8)}`

// Date helpers
const today = new Date()
const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), 1)

/**
 * Chart of Accounts - Restaurant/Retail focused
 */
export const demoChartOfAccounts = [
  // Assets (1000-1999)
  { code: '1000', name: 'Cash', type: 'asset', subtype: 'current_asset', balance: 45280.50 },
  { code: '1010', name: 'Cash Register Till', type: 'asset', subtype: 'current_asset', balance: 2500.00 },
  { code: '1100', name: 'Business Checking Account', type: 'asset', subtype: 'bank', balance: 128650.75 },
  { code: '1200', name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset', balance: 18900.00 },
  { code: '1300', name: 'Food Inventory', type: 'asset', subtype: 'current_asset', balance: 12500.00 },
  { code: '1310', name: 'Beverage Inventory', type: 'asset', subtype: 'current_asset', balance: 8200.00 },
  { code: '1320', name: 'Supplies Inventory', type: 'asset', subtype: 'current_asset', balance: 3400.00 },
  { code: '1400', name: 'Prepaid Expenses', type: 'asset', subtype: 'current_asset', balance: 4800.00 },
  { code: '1500', name: 'Kitchen Equipment', type: 'asset', subtype: 'fixed_asset', balance: 85000.00 },
  { code: '1510', name: 'Accumulated Depreciation - Kitchen', type: 'asset', subtype: 'fixed_asset', balance: -15000.00 },
  { code: '1600', name: 'Furniture & Fixtures', type: 'asset', subtype: 'fixed_asset', balance: 45000.00 },
  { code: '1610', name: 'Accumulated Depreciation - Furniture', type: 'asset', subtype: 'fixed_asset', balance: -8000.00 },
  { code: '1700', name: 'POS System', type: 'asset', subtype: 'fixed_asset', balance: 15000.00 },
  { code: '1800', name: 'Leasehold Improvements', type: 'asset', subtype: 'fixed_asset', balance: 120000.00 },
  
  // Liabilities (2000-2999)
  { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability', balance: -24500.00 },
  { code: '2100', name: 'Credit Card Payable', type: 'liability', subtype: 'current_liability', balance: -3200.00 },
  { code: '2200', name: 'Sales Tax Payable', type: 'liability', subtype: 'current_liability', balance: -4850.00 },
  { code: '2300', name: 'Payroll Liabilities', type: 'liability', subtype: 'current_liability', balance: -12400.00 },
  { code: '2400', name: 'Gift Cards Outstanding', type: 'liability', subtype: 'current_liability', balance: -8900.00 },
  { code: '2500', name: 'Equipment Loan', type: 'liability', subtype: 'long_term_liability', balance: -45000.00 },
  { code: '2600', name: 'SBA Loan', type: 'liability', subtype: 'long_term_liability', balance: -125000.00 },
  
  // Equity (3000-3999)
  { code: '3000', name: 'Owner\'s Capital', type: 'equity', subtype: 'equity', balance: -200000.00 },
  { code: '3100', name: 'Owner\'s Draw', type: 'equity', subtype: 'equity', balance: 65000.00 },
  { code: '3200', name: 'Retained Earnings', type: 'equity', subtype: 'equity', balance: -156780.25 },
  
  // Revenue (4000-4999)
  { code: '4000', name: 'Food Sales', type: 'revenue', subtype: 'sales', balance: -1250000.00 },
  { code: '4100', name: 'Beverage Sales', type: 'revenue', subtype: 'sales', balance: -425000.00 },
  { code: '4200', name: 'Catering Revenue', type: 'revenue', subtype: 'sales', balance: -185000.00 },
  { code: '4300', name: 'Delivery & Service Fees', type: 'revenue', subtype: 'other_income', balance: -28000.00 },
  { code: '4400', name: 'Gift Card Sales', type: 'revenue', subtype: 'other_income', balance: -45000.00 },
  
  // COGS (5000-5999)
  { code: '5000', name: 'Food Cost', type: 'expense', subtype: 'cogs', balance: 425000.00 },
  { code: '5100', name: 'Beverage Cost', type: 'expense', subtype: 'cogs', balance: 106250.00 },
  { code: '5200', name: 'Catering Supplies', type: 'expense', subtype: 'cogs', balance: 55500.00 },
  
  // Operating Expenses (6000-7999)
  { code: '6000', name: 'Wages & Salaries', type: 'expense', subtype: 'expense', balance: 480000.00 },
  { code: '6100', name: 'Payroll Taxes', type: 'expense', subtype: 'expense', balance: 72000.00 },
  { code: '6200', name: 'Employee Benefits', type: 'expense', subtype: 'expense', balance: 48000.00 },
  { code: '6300', name: 'Rent Expense', type: 'expense', subtype: 'expense', balance: 120000.00 },
  { code: '6400', name: 'Utilities', type: 'expense', subtype: 'expense', balance: 36000.00 },
  { code: '6500', name: 'Insurance', type: 'expense', subtype: 'expense', balance: 24000.00 },
  { code: '6600', name: 'Marketing & Advertising', type: 'expense', subtype: 'expense', balance: 48000.00 },
  { code: '6700', name: 'Repairs & Maintenance', type: 'expense', subtype: 'expense', balance: 18000.00 },
  { code: '6800', name: 'Supplies', type: 'expense', subtype: 'expense', balance: 24000.00 },
  { code: '6900', name: 'Professional Fees', type: 'expense', subtype: 'expense', balance: 12000.00 },
  { code: '7000', name: 'Credit Card Processing', type: 'expense', subtype: 'expense', balance: 38000.00 },
  { code: '7100', name: 'Delivery Service Fees', type: 'expense', subtype: 'expense', balance: 42000.00 },
  { code: '7200', name: 'Licenses & Permits', type: 'expense', subtype: 'expense', balance: 5000.00 },
  { code: '7300', name: 'Depreciation Expense', type: 'expense', subtype: 'expense', balance: 23000.00 },
  { code: '7400', name: 'Bank Fees', type: 'expense', subtype: 'expense', balance: 3600.00 },
  { code: '7500', name: 'Interest Expense', type: 'expense', subtype: 'expense', balance: 8500.00 },
  { code: '7900', name: 'Miscellaneous Expense', type: 'expense', subtype: 'expense', balance: 4200.00 }
]

/**
 * Customers with credit history
 */
export const demoCustomers = [
  {
    id: generateId('customer'),
    name: 'Hilton Hotels - Downtown',
    code: 'CUST-001',
    type: 'business',
    email: 'events@hiltondowntown.com',
    phone: '(555) 123-4567',
    creditLimit: 50000,
    balance: 12500,
    status: 'active',
    address: '123 Main Street, Downtown, NY 10001',
    contactPerson: 'Sarah Johnson',
    paymentTerms: 'NET30',
    taxId: '12-3456789',
    notes: 'Preferred catering partner. Weekly orders for conference events.'
  },
  {
    id: generateId('customer'),
    name: 'Tech Startup Inc.',
    code: 'CUST-002',
    type: 'business',
    email: 'orders@techstartup.com',
    phone: '(555) 234-5678',
    creditLimit: 25000,
    balance: 3200,
    status: 'active',
    address: '456 Innovation Blvd, Tech Park, NY 10002',
    contactPerson: 'Mike Chen',
    paymentTerms: 'NET15',
    taxId: '98-7654321',
    notes: 'Daily lunch orders for 50+ employees. Prefers healthy options.'
  },
  {
    id: generateId('customer'),
    name: 'City Hospital',
    code: 'CUST-003',
    type: 'business',
    email: 'cafeteria@cityhospital.org',
    phone: '(555) 345-6789',
    creditLimit: 75000,
    balance: 18900,
    status: 'active',
    address: '789 Medical Center Dr, Uptown, NY 10003',
    contactPerson: 'Dr. Patricia White',
    paymentTerms: 'NET45',
    taxId: '45-6789012',
    notes: 'Catering for medical conferences. Special dietary requirements.'
  },
  {
    id: generateId('customer'),
    name: 'Johnson Family',
    code: 'CUST-004',
    type: 'individual',
    email: 'robert.johnson@email.com',
    phone: '(555) 456-7890',
    creditLimit: 5000,
    balance: 0,
    status: 'active',
    address: '321 Oak Street, Suburbs, NY 10004',
    contactPerson: 'Robert Johnson',
    paymentTerms: 'COD',
    notes: 'Regular weekend diner. Birthday party bookings.'
  },
  {
    id: generateId('customer'),
    name: 'Elite Corporate Events',
    code: 'CUST-005',
    type: 'business',
    email: 'bookings@eliteevents.com',
    phone: '(555) 567-8901',
    creditLimit: 100000,
    balance: 45000,
    status: 'active',
    address: '555 Prestige Plaza, Financial District, NY 10005',
    contactPerson: 'Amanda Richards',
    paymentTerms: 'NET60',
    taxId: '67-8901234',
    notes: 'High-end corporate catering. Premium service expected.'
  }
]

/**
 * Vendors/Suppliers
 */
export const demoVendors = [
  {
    id: generateId('vendor'),
    name: 'Fresh Produce Direct',
    code: 'VEND-001',
    email: 'orders@freshproduce.com',
    phone: '(555) 111-2222',
    creditLimit: 50000,
    balance: -8500,
    status: 'active',
    address: '100 Market Street, Wholesale District, NY 10010',
    contactPerson: 'Tony Martinez',
    paymentTerms: 'NET30',
    taxId: '11-1111111',
    category: 'Food Supplier',
    notes: 'Primary produce supplier. Delivers Mon/Wed/Fri at 6 AM.'
  },
  {
    id: generateId('vendor'),
    name: 'Premium Meats Co.',
    code: 'VEND-002',
    email: 'sales@premiummeats.com',
    phone: '(555) 222-3333',
    creditLimit: 75000,
    balance: -12400,
    status: 'active',
    address: '200 Butcher Lane, Meatpacking District, NY 10011',
    contactPerson: 'Frank Russo',
    paymentTerms: 'NET15',
    taxId: '22-2222222',
    category: 'Meat Supplier',
    notes: 'USDA Prime beef supplier. Weekly deliveries.'
  },
  {
    id: generateId('vendor'),
    name: 'Sysco Food Services',
    code: 'VEND-003',
    email: 'orders@sysco.com',
    phone: '(555) 333-4444',
    creditLimit: 100000,
    balance: -18900,
    status: 'active',
    address: '300 Distribution Way, Industrial Park, NY 10012',
    contactPerson: 'Lisa Wong',
    paymentTerms: 'NET45',
    taxId: '33-3333333',
    category: 'General Supplier',
    notes: 'Dry goods, frozen items, and specialty ingredients.'
  },
  {
    id: generateId('vendor'),
    name: 'Wine & Spirits Distributors',
    code: 'VEND-004',
    email: 'orders@winespirits.com',
    phone: '(555) 444-5555',
    creditLimit: 40000,
    balance: -6200,
    status: 'active',
    address: '400 Vineyard Road, Wine Country, NY 10013',
    contactPerson: 'Philippe Dubois',
    paymentTerms: 'COD',
    taxId: '44-4444444',
    category: 'Beverage Supplier',
    notes: 'Premium wines and spirits. Special import selections.'
  },
  {
    id: generateId('vendor'),
    name: 'Restaurant Supply Depot',
    code: 'VEND-005',
    email: 'sales@restaurantsupply.com',
    phone: '(555) 555-6666',
    creditLimit: 25000,
    balance: -3200,
    status: 'active',
    address: '500 Equipment Blvd, Commercial Zone, NY 10014',
    contactPerson: 'David Kim',
    paymentTerms: 'NET30',
    taxId: '55-5555555',
    category: 'Equipment & Supplies',
    notes: 'Kitchen equipment, smallwares, and cleaning supplies.'
  }
]

/**
 * Products/Menu Items
 */
export const demoProducts = [
  // Appetizers
  {
    id: generateId('product'),
    code: 'APP-001',
    name: 'Bruschetta Trio',
    category: 'Appetizers',
    price: 12.99,
    cost: 3.50,
    unit: 'portion',
    stockLevel: 50,
    reorderPoint: 20,
    description: 'Three varieties of our famous bruschetta',
    isActive: true,
    tags: ['vegetarian', 'popular'],
    nutritionInfo: { calories: 280, protein: 8, carbs: 32, fat: 14 }
  },
  {
    id: generateId('product'),
    code: 'APP-002',
    name: 'Calamari Fritti',
    category: 'Appetizers',
    price: 14.99,
    cost: 4.20,
    unit: 'portion',
    stockLevel: 30,
    reorderPoint: 15,
    description: 'Crispy fried calamari with marinara sauce',
    isActive: true,
    tags: ['seafood'],
    nutritionInfo: { calories: 420, protein: 24, carbs: 28, fat: 22 }
  },
  
  // Main Courses
  {
    id: generateId('product'),
    code: 'MAIN-001',
    name: 'Chicken Parmigiana',
    category: 'Main Courses',
    price: 24.99,
    cost: 7.50,
    unit: 'portion',
    stockLevel: 40,
    reorderPoint: 20,
    description: 'Classic breaded chicken with marinara and mozzarella',
    isActive: true,
    tags: ['signature', 'popular'],
    nutritionInfo: { calories: 680, protein: 42, carbs: 48, fat: 32 }
  },
  {
    id: generateId('product'),
    code: 'MAIN-002',
    name: 'Seafood Risotto',
    category: 'Main Courses',
    price: 32.99,
    cost: 11.00,
    unit: 'portion',
    stockLevel: 25,
    reorderPoint: 10,
    description: 'Creamy risotto with shrimp, scallops, and lobster',
    isActive: true,
    tags: ['seafood', 'gluten-free', 'premium'],
    nutritionInfo: { calories: 520, protein: 28, carbs: 58, fat: 18 }
  },
  {
    id: generateId('product'),
    code: 'MAIN-003',
    name: 'Osso Buco',
    category: 'Main Courses',
    price: 38.99,
    cost: 14.00,
    unit: 'portion',
    stockLevel: 20,
    reorderPoint: 8,
    description: 'Braised veal shanks in rich tomato sauce',
    isActive: true,
    tags: ['signature', 'premium'],
    nutritionInfo: { calories: 720, protein: 56, carbs: 32, fat: 38 }
  },
  
  // Pasta
  {
    id: generateId('product'),
    code: 'PASTA-001',
    name: 'Spaghetti Carbonara',
    category: 'Pasta',
    price: 18.99,
    cost: 4.80,
    unit: 'portion',
    stockLevel: 60,
    reorderPoint: 30,
    description: 'Traditional carbonara with pancetta and egg',
    isActive: true,
    tags: ['traditional'],
    nutritionInfo: { calories: 580, protein: 22, carbs: 68, fat: 24 }
  },
  {
    id: generateId('product'),
    code: 'PASTA-002',
    name: 'Linguine alle Vongole',
    category: 'Pasta',
    price: 22.99,
    cost: 7.20,
    unit: 'portion',
    stockLevel: 35,
    reorderPoint: 15,
    description: 'Linguine with fresh clams in white wine sauce',
    isActive: true,
    tags: ['seafood'],
    nutritionInfo: { calories: 480, protein: 28, carbs: 62, fat: 12 }
  },
  
  // Beverages
  {
    id: generateId('product'),
    code: 'BEV-001',
    name: 'House Red Wine',
    category: 'Beverages',
    price: 8.99,
    cost: 3.00,
    unit: 'glass',
    stockLevel: 200,
    reorderPoint: 50,
    description: 'Italian Chianti, medium body',
    isActive: true,
    tags: ['wine', 'alcohol'],
    abv: 13.5
  },
  {
    id: generateId('product'),
    code: 'BEV-002',
    name: 'Craft Beer Selection',
    category: 'Beverages',
    price: 6.99,
    cost: 2.50,
    unit: 'bottle',
    stockLevel: 150,
    reorderPoint: 60,
    description: 'Rotating selection of local craft beers',
    isActive: true,
    tags: ['beer', 'alcohol', 'local'],
    abv: 5.5
  },
  
  // Desserts
  {
    id: generateId('product'),
    code: 'DES-001',
    name: 'Tiramisu',
    category: 'Desserts',
    price: 9.99,
    cost: 2.80,
    unit: 'portion',
    stockLevel: 40,
    reorderPoint: 20,
    description: 'Classic Italian tiramisu made fresh daily',
    isActive: true,
    tags: ['signature', 'popular'],
    nutritionInfo: { calories: 380, protein: 6, carbs: 42, fat: 22 }
  },
  {
    id: generateId('product'),
    code: 'DES-002',
    name: 'Panna Cotta',
    category: 'Desserts',
    price: 8.99,
    cost: 2.20,
    unit: 'portion',
    stockLevel: 35,
    reorderPoint: 15,
    description: 'Vanilla panna cotta with berry coulis',
    isActive: true,
    tags: ['gluten-free'],
    nutritionInfo: { calories: 280, protein: 4, carbs: 32, fat: 16 }
  }
]

/**
 * Demo Transactions
 */
export const generateDemoTransactions = () => {
  const transactions = []
  
  // Recent sales transactions
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const items = Math.floor(Math.random() * 4) + 1
    const subtotal = Math.random() * 200 + 50
    const tax = subtotal * 0.08875 // NYC tax rate
    const total = subtotal + tax
    
    transactions.push({
      id: generateId('trans'),
      type: 'sale',
      number: `INV-2024-${String(1000 + i).padStart(4, '0')}`,
      date: date.toISOString(),
      customerId: demoCustomers[Math.floor(Math.random() * demoCustomers.length)].id,
      status: i < 5 ? 'open' : 'paid',
      subtotal,
      tax,
      total,
      items,
      paymentMethod: ['cash', 'credit', 'check'][Math.floor(Math.random() * 3)],
      notes: i % 5 === 0 ? 'Large party reservation' : null
    })
  }
  
  // Purchase orders
  for (let i = 0; i < 15; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i * 2)
    
    const subtotal = Math.random() * 3000 + 500
    const total = subtotal
    
    transactions.push({
      id: generateId('trans'),
      type: 'purchase',
      number: `PO-2024-${String(500 + i).padStart(4, '0')}`,
      date: date.toISOString(),
      vendorId: demoVendors[Math.floor(Math.random() * demoVendors.length)].id,
      status: i < 3 ? 'pending' : 'received',
      subtotal,
      tax: 0,
      total,
      items: Math.floor(Math.random() * 10) + 5,
      notes: 'Weekly supply order'
    })
  }
  
  return transactions
}

/**
 * Key Performance Indicators
 */
export const generateDemoKPIs = () => {
  return {
    revenue: {
      today: 8456.32,
      yesterday: 7892.45,
      thisWeek: 42281.60,
      lastWeek: 39876.22,
      thisMonth: 168925.40,
      lastMonth: 155432.18,
      thisYear: 1933000.00,
      lastYear: 1785000.00
    },
    customers: {
      total: 1847,
      new30Days: 142,
      activeToday: 89,
      repeatRate: 0.68
    },
    operations: {
      avgOrderValue: 94.85,
      tablesOccupied: 18,
      tablesTotal: 25,
      occupancyRate: 0.72,
      avgServiceTime: '1h 12m',
      kitchenEfficiency: 0.89
    },
    inventory: {
      totalValue: 24100.00,
      lowStockAlerts: 8,
      expiringAlerts: 3,
      turnoverRate: 12.5
    },
    staff: {
      onDuty: 14,
      scheduled: 16,
      laborCost: 0.285,
      productivityScore: 0.92
    },
    financial: {
      cashOnHand: 2500.00,
      bankBalance: 128650.75,
      accountsReceivable: 18900.00,
      accountsPayable: 24500.00,
      grossMargin: 0.68,
      netMargin: 0.15
    }
  }
}

/**
 * Initialize demo data in memory
 */
export const initializeDemoData = () => {
  if (typeof window !== 'undefined') {
    // Store demo data in sessionStorage for persistence during demo
    const demoData = {
      organization: {
        id: DEMO_ORG_ID,
        name: "Mario's Italian Restaurant",
        type: 'restaurant',
        address: '789 Bella Vista Lane, Little Italy, NY 10013',
        phone: '(555) 999-8888',
        email: 'info@mariosrestaurant.com',
        website: 'www.mariosrestaurant.com',
        taxId: '12-3456789',
        established: '2015-03-15'
      },
      chartOfAccounts: demoChartOfAccounts,
      customers: demoCustomers,
      vendors: demoVendors,
      products: demoProducts,
      transactions: generateDemoTransactions(),
      kpis: generateDemoKPIs(),
      settings: {
        fiscalYearStart: '01-01',
        currency: 'USD',
        timezone: 'America/New_York',
        businessHours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '23:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '12:00', close: '21:00' }
        }
      }
    }
    
    sessionStorage.setItem('hera-demo-data', JSON.stringify(demoData))
    return demoData
  }
  return null
}

/**
 * Get demo data from session storage
 */
export const getDemoData = () => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('hera-demo-data')
    if (stored) {
      return JSON.parse(stored)
    }
  }
  return initializeDemoData()
}

/**
 * Clear demo data
 */
export const clearDemoData = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('hera-demo-data')
  }
}