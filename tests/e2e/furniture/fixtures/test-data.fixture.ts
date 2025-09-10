/**
 * Test data fixtures for Furniture Module tests
 */

export const testProducts = {
  chair: {
    name: 'Executive Office Chair',
    code: 'CHAIR-EXEC-001',
    category: 'seating',
    description: 'Ergonomic executive chair with lumbar support',
    price: 499.99,
    cost: 250.00,
    sku: 'SKU-CHAIR-001'
  },
  
  desk: {
    name: 'Standing Desk Pro',
    code: 'DESK-STAND-001',
    category: 'desks',
    description: 'Height-adjustable standing desk with memory settings',
    price: 899.99,
    cost: 450.00,
    sku: 'SKU-DESK-001'
  },
  
  cabinet: {
    name: 'Filing Cabinet 4-Drawer',
    code: 'CAB-FILE-001',
    category: 'storage',
    description: 'Heavy-duty filing cabinet with lock',
    price: 299.99,
    cost: 150.00,
    sku: 'SKU-CAB-001'
  }
};

export const testComponents = {
  wood: {
    name: 'Oak Wood Board',
    code: 'MAT-WOOD-OAK',
    quantity: 2,
    unit: 'pieces',
    unitCost: 25.00
  },
  
  metal: {
    name: 'Steel Frame',
    code: 'MAT-METAL-STEEL',
    quantity: 1,
    unit: 'pieces',
    unitCost: 75.00
  },
  
  fabric: {
    name: 'Premium Fabric',
    code: 'MAT-FABRIC-001',
    quantity: 3,
    unit: 'yards',
    unitCost: 15.00
  },
  
  foam: {
    name: 'High-Density Foam',
    code: 'MAT-FOAM-HD',
    quantity: 2,
    unit: 'pieces',
    unitCost: 20.00
  },
  
  screws: {
    name: 'Wood Screws',
    code: 'HARD-SCREW-001',
    quantity: 50,
    unit: 'pieces',
    unitCost: 0.10
  }
};

export const testOperations = {
  cutting: {
    name: 'Wood Cutting',
    workstation: 'Cutting Station A',
    setupTime: 15,
    runTime: 30,
    laborCost: 25.00,
    overheadCost: 10.00,
    description: 'Cut wood pieces to specification'
  },
  
  assembly: {
    name: 'Frame Assembly',
    workstation: 'Assembly Line 1',
    setupTime: 20,
    runTime: 45,
    laborCost: 30.00,
    overheadCost: 15.00,
    description: 'Assemble frame components'
  },
  
  finishing: {
    name: 'Surface Finishing',
    workstation: 'Finishing Station',
    setupTime: 10,
    runTime: 60,
    laborCost: 35.00,
    overheadCost: 20.00,
    description: 'Sand and apply finish'
  },
  
  quality: {
    name: 'Quality Inspection',
    workstation: 'QC Station',
    setupTime: 5,
    runTime: 15,
    laborCost: 20.00,
    overheadCost: 5.00,
    description: 'Final quality check'
  },
  
  packaging: {
    name: 'Packaging',
    workstation: 'Packing Station',
    setupTime: 5,
    runTime: 20,
    laborCost: 15.00,
    overheadCost: 5.00,
    description: 'Package for shipping'
  }
};

export const testCustomers = {
  corporate: {
    name: 'Tech Solutions Inc.',
    code: 'CUST-TECH-001',
    type: 'corporate',
    email: 'purchasing@techsolutions.com',
    phone: '+1-555-0123',
    creditLimit: 50000
  },
  
  retail: {
    name: 'Office Supplies Plus',
    code: 'CUST-RETAIL-001',
    type: 'retail',
    email: 'orders@officesuppliesplus.com',
    phone: '+1-555-0456',
    creditLimit: 25000
  }
};

export const testSalesOrder = {
  customerCode: 'CUST-TECH-001',
  orderDate: new Date().toISOString().split('T')[0],
  deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [
    {
      productCode: 'CHAIR-EXEC-001',
      quantity: 10,
      unitPrice: 499.99,
      discount: 10 // percentage
    },
    {
      productCode: 'DESK-STAND-001',
      quantity: 5,
      unitPrice: 899.99,
      discount: 15
    }
  ],
  shippingAddress: {
    line1: '123 Tech Street',
    line2: 'Suite 200',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA'
  }
};

export const testProductionOrder = {
  productCode: 'CHAIR-EXEC-001',
  quantity: 20,
  priority: 'high',
  startDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  workOrderType: 'standard'
};

export const testUCRRules = {
  minimumOrderQuantity: {
    name: 'Minimum Order Quantity',
    condition: 'quantity >= 5',
    message: 'Minimum order quantity is 5 units',
    severity: 'error'
  },
  
  discountLimit: {
    name: 'Maximum Discount',
    condition: 'discount <= 20',
    message: 'Maximum discount allowed is 20%',
    severity: 'warning'
  },
  
  creditCheck: {
    name: 'Credit Limit Check',
    condition: 'orderTotal <= customer.creditLimit',
    message: 'Order exceeds customer credit limit',
    severity: 'error'
  }
};

/**
 * Generate random test data
 */
export function generateRandomProduct() {
  const timestamp = Date.now();
  return {
    name: `Test Product ${timestamp}`,
    code: `PROD-${timestamp}`,
    category: 'test',
    price: Math.floor(Math.random() * 1000) + 100,
    cost: Math.floor(Math.random() * 500) + 50,
    sku: `SKU-${timestamp}`
  };
}

/**
 * Generate BOM CSV content
 */
export function generateBOMCSV(components: any[]) {
  const headers = ['Component Name', 'Component Code', 'Quantity', 'Unit', 'Unit Cost'];
  const rows = components.map(c => [c.name, c.code, c.quantity, c.unit, c.unitCost]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Generate routing CSV content
 */
export function generateRoutingCSV(operations: any[]) {
  const headers = ['Operation Name', 'Workstation', 'Setup Time', 'Run Time', 'Labor Cost', 'Overhead Cost'];
  const rows = operations.map(o => [o.name, o.workstation, o.setupTime, o.runTime, o.laborCost, o.overheadCost || 0]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}