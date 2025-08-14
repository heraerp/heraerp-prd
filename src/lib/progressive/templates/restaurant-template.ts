/**
 * HERA Progressive Restaurant Template
 * Complete restaurant management system with advanced features
 * Smart Code: HERA.PROGRESSIVE.TEMPLATE.RESTAURANT.v1
 */

export interface RestaurantBusinessRequirements {
  business_name: string
  cuisine_type: string
  service_types: ('dine_in' | 'takeout' | 'delivery' | 'catering')[]
  table_count?: number
  avg_daily_orders?: number
  special_features?: ('bar' | 'pizza_oven' | 'outdoor_seating' | 'private_dining')[]
  location?: {
    address: string
    city: string
    state: string
    zip: string
  }
}

export interface RestaurantMenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  cost: number
  ingredients: string[]
  allergens: string[]
  prep_time: number
  image_url?: string
  availability: 'available' | 'out_of_stock' | 'seasonal'
  spice_level?: 1 | 2 | 3 | 4 | 5
  dietary_tags: ('vegetarian' | 'vegan' | 'gluten_free' | 'keto' | 'halal' | 'kosher')[]
  nutritional_info?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface RestaurantOrder {
  id: string
  order_number: string
  customer_id?: string
  order_type: 'dine_in' | 'takeout' | 'delivery' | 'catering'
  table_number?: number
  items: OrderItem[]
  subtotal: number
  tax: number
  tip?: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  special_instructions?: string
  estimated_ready_time?: Date
  actual_ready_time?: Date
  customer_info?: {
    name: string
    phone: string
    email?: string
    delivery_address?: string
  }
  payment_info?: {
    method: 'cash' | 'card' | 'online'
    status: 'pending' | 'paid' | 'refunded'
    transaction_id?: string
  }
}

export interface OrderItem {
  menu_item_id: string
  quantity: number
  unit_price: number
  line_total: number
  modifications?: string[]
  cooking_instructions?: string
}

export class RestaurantTemplate {
  
  /**
   * Generate comprehensive restaurant demo data
   */
  static generateDemoData(requirements: RestaurantBusinessRequirements): any {
    const organizationId = crypto.randomUUID()
    
    return {
      organization: this.createRestaurantOrganization(organizationId, requirements),
      entities: [
        ...this.generateMenuItems(organizationId, requirements.cuisine_type),
        ...this.generateCustomers(organizationId),
        ...this.generateStaff(organizationId),
        ...this.generateTables(organizationId, requirements.table_count || 15),
        ...this.generateInventoryItems(organizationId),
        ...this.generateSuppliers(organizationId)
      ],
      transactions: [
        ...this.generateOrders(organizationId, requirements.avg_daily_orders || 50),
        ...this.generateInventoryTransactions(organizationId),
        ...this.generatePayrollTransactions(organizationId)
      ],
      relationships: this.generateRelationships(organizationId),
      dynamicData: this.generateDynamicData(organizationId)
    }
  }

  /**
   * Create restaurant organization entity
   */
  private static createRestaurantOrganization(id: string, requirements: RestaurantBusinessRequirements): any {
    return {
      id,
      organization_name: requirements.business_name,
      organization_code: `REST-${requirements.business_name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}`,
      organization_type: 'restaurant',
      industry_classification: 'food_service',
      ai_insights: {
        cuisine_type: requirements.cuisine_type,
        service_types: requirements.service_types,
        predicted_daily_revenue: requirements.avg_daily_orders * 25, // $25 avg order
        growth_potential: 'high'
      },
      settings: {
        operating_hours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '22:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '21:00' }
        },
        service_settings: {
          table_count: requirements.table_count || 15,
          delivery_radius: 5,
          delivery_fee: 2.99,
          tax_rate: 0.0875,
          tip_suggestions: [15, 18, 20, 25]
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Generate comprehensive menu items based on cuisine type
   */
  private static generateMenuItems(organizationId: string, cuisineType: string): any[] {
    const menuTemplates = {
      italian: [
        {
          name: 'Margherita Pizza',
          description: 'Fresh mozzarella, basil, and tomato sauce on wood-fired crust',
          category: 'Pizza',
          price: 16.99,
          cost: 4.50,
          ingredients: ['pizza dough', 'mozzarella', 'tomato sauce', 'fresh basil', 'olive oil'],
          prep_time: 12,
          dietary_tags: ['vegetarian']
        },
        {
          name: 'Spaghetti Carbonara',
          description: 'Classic Roman pasta with eggs, pancetta, and pecorino cheese',
          category: 'Pasta',
          price: 18.99,
          cost: 5.25,
          ingredients: ['spaghetti', 'pancetta', 'eggs', 'pecorino cheese', 'black pepper'],
          prep_time: 15,
          dietary_tags: []
        },
        {
          name: 'Osso Buco',
          description: 'Braised veal shanks with vegetables in wine sauce',
          category: 'Main Course',
          price: 32.99,
          cost: 12.00,
          ingredients: ['veal shanks', 'carrots', 'celery', 'onions', 'white wine', 'tomatoes'],
          prep_time: 25,
          dietary_tags: []
        },
        {
          name: 'Tiramisu',
          description: 'Classic Italian dessert with espresso-soaked ladyfingers',
          category: 'Dessert',
          price: 8.99,
          cost: 2.25,
          ingredients: ['ladyfingers', 'espresso', 'mascarpone', 'eggs', 'cocoa powder'],
          prep_time: 8,
          dietary_tags: ['vegetarian']
        }
      ],
      mexican: [
        {
          name: 'Carne Asada Tacos',
          description: 'Grilled beef with onions, cilantro, and lime on corn tortillas',
          category: 'Tacos',
          price: 12.99,
          cost: 3.75,
          ingredients: ['carne asada', 'corn tortillas', 'white onions', 'cilantro', 'lime'],
          prep_time: 10,
          dietary_tags: ['gluten_free']
        },
        {
          name: 'Chicken Enchiladas',
          description: 'Rolled tortillas with chicken, covered in red sauce and cheese',
          category: 'Entrees',
          price: 15.99,
          cost: 4.50,
          ingredients: ['chicken', 'flour tortillas', 'enchilada sauce', 'cheese', 'onions'],
          prep_time: 18,
          dietary_tags: []
        }
      ],
      american: [
        {
          name: 'Classic Burger',
          description: 'Quarter-pound beef patty with lettuce, tomato, and pickles',
          category: 'Burgers',
          price: 14.99,
          cost: 4.25,
          ingredients: ['ground beef', 'burger bun', 'lettuce', 'tomato', 'pickles', 'onions'],
          prep_time: 12,
          dietary_tags: []
        },
        {
          name: 'Buffalo Wings',
          description: 'Crispy chicken wings tossed in spicy buffalo sauce',
          category: 'Appetizers',
          price: 11.99,
          cost: 3.50,
          ingredients: ['chicken wings', 'buffalo sauce', 'celery', 'blue cheese'],
          prep_time: 15,
          dietary_tags: []
        }
      ]
    }

    const baseItems = menuTemplates[cuisineType] || menuTemplates.american
    
    return baseItems.map((item, index) => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'menu_item',
      entity_name: item.name,
      entity_description: item.description,
      smart_code: `HERA.REST.MENU.ITEM.${item.category.toUpperCase().replace(/\s+/g, '_')}.v1`,
      metadata: {
        category: item.category,
        price: item.price,
        cost: item.cost,
        ingredients: item.ingredients,
        prep_time: item.prep_time,
        dietary_tags: item.dietary_tags,
        allergens: this.inferAllergens(item.ingredients),
        popularity_rank: index + 1,
        profit_margin: ((item.price - item.cost) / item.price * 100).toFixed(1)
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate realistic customer entities
   */
  private static generateCustomers(organizationId: string): any[] {
    const customers = [
      { name: 'Sarah Johnson', phone: '555-0123', email: 'sarah.j@email.com', loyalty_points: 450 },
      { name: 'Mike Rodriguez', phone: '555-0234', email: 'mike.r@email.com', loyalty_points: 320 },
      { name: 'Emily Chen', phone: '555-0345', email: 'emily.c@email.com', loyalty_points: 780 },
      { name: 'David Williams', phone: '555-0456', email: 'david.w@email.com', loyalty_points: 156 },
      { name: 'Lisa Thompson', phone: '555-0567', email: 'lisa.t@email.com', loyalty_points: 623 },
      { name: 'James Miller', phone: '555-0678', email: 'james.m@email.com', loyalty_points: 234 },
      { name: 'Anna Garcia', phone: '555-0789', email: 'anna.g@email.com', loyalty_points: 891 },
      { name: 'Robert Davis', phone: '555-0890', email: 'robert.d@email.com', loyalty_points: 445 }
    ]

    return customers.map(customer => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'customer',
      entity_name: customer.name,
      smart_code: 'HERA.REST.CUSTOMER.PROFILE.v1',
      metadata: {
        contact_info: {
          phone: customer.phone,
          email: customer.email
        },
        loyalty_program: {
          points: customer.loyalty_points,
          tier: customer.loyalty_points > 500 ? 'gold' : customer.loyalty_points > 200 ? 'silver' : 'bronze',
          member_since: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        },
        preferences: {
          dietary_restrictions: Math.random() > 0.7 ? ['vegetarian'] : [],
          favorite_items: [],
          preferred_contact: 'phone'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate restaurant orders with realistic patterns
   */
  private static generateOrders(organizationId: string, dailyOrderCount: number): any[] {
    const orders = []
    const orderStatuses = ['completed', 'completed', 'completed', 'preparing', 'ready', 'pending']
    const orderTypes = ['dine_in', 'takeout', 'delivery', 'dine_in']
    
    // Generate orders for last 7 days
    for (let day = 0; day < 7; day++) {
      const ordersForDay = Math.floor(dailyOrderCount * (0.8 + Math.random() * 0.4))
      
      for (let i = 0; i < ordersForDay; i++) {
        const orderDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000 + Math.random() * 24 * 60 * 60 * 1000)
        const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)]
        const status = day === 0 ? orderStatuses[Math.floor(Math.random() * orderStatuses.length)] : 'completed'
        
        const itemCount = 1 + Math.floor(Math.random() * 4)
        const subtotal = 15 + Math.random() * 45
        const tax = subtotal * 0.0875
        const tip = status === 'completed' ? subtotal * (0.15 + Math.random() * 0.1) : 0
        
        orders.push({
          id: crypto.randomUUID(),
          organization_id: organizationId,
          transaction_type: 'sale',
          transaction_number: `ORD-${String(orders.length + 1).padStart(4, '0')}`,
          transaction_date: orderDate,
          smart_code: 'HERA.REST.ORDER.TRANSACTION.v1',
          description: `${orderType.replace('_', ' ')} order - ${itemCount} items`,
          total_amount: subtotal + tax + tip,
          currency_code: 'USD',
          status: status === 'completed' ? 'confirmed' : 'pending',
          metadata: {
            order_type: orderType,
            table_number: orderType === 'dine_in' ? Math.floor(Math.random() * 15) + 1 : null,
            item_count: itemCount,
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            tip: Math.round(tip * 100) / 100,
            order_status: status,
            prep_time_minutes: 15 + Math.floor(Math.random() * 20),
            special_instructions: Math.random() > 0.8 ? 'Extra spicy' : null
          },
          created_at: orderDate,
          updated_at: orderDate,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    return orders
  }

  /**
   * Generate restaurant staff entities
   */
  private static generateStaff(organizationId: string): any[] {
    const staff = [
      { name: 'Mario Rossi', role: 'owner', hourly_rate: 0, hire_date: '2020-01-01' },
      { name: 'Sofia Martinez', role: 'head_chef', hourly_rate: 28.50, hire_date: '2020-03-15' },
      { name: 'Alex Thompson', role: 'sous_chef', hourly_rate: 22.00, hire_date: '2021-06-01' },
      { name: 'Isabella Davis', role: 'server', hourly_rate: 15.00, hire_date: '2022-02-14' },
      { name: 'Carlos Lopez', role: 'server', hourly_rate: 15.50, hire_date: '2021-11-20' },
      { name: 'Maya Patel', role: 'host', hourly_rate: 14.00, hire_date: '2023-01-08' },
      { name: 'Jake Wilson', role: 'dishwasher', hourly_rate: 13.50, hire_date: '2023-03-22' }
    ]

    return staff.map(person => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'employee',
      entity_name: person.name,
      smart_code: 'HERA.REST.STAFF.EMPLOYEE.v1',
      metadata: {
        role: person.role,
        employment_details: {
          hire_date: person.hire_date,
          hourly_rate: person.hourly_rate,
          status: 'active',
          schedule: {
            availability: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            preferred_shifts: person.role === 'server' ? ['dinner', 'lunch'] : ['all']
          }
        },
        contact_info: {
          phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          emergency_contact: 'Available on file'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate table entities for restaurant
   */
  private static generateTables(organizationId: string, tableCount: number): any[] {
    const tables = []
    
    for (let i = 1; i <= tableCount; i++) {
      const capacity = i <= 4 ? 2 : i <= 10 ? 4 : i <= 14 ? 6 : 8
      const section = i <= 5 ? 'front' : i <= 10 ? 'middle' : 'back'
      
      tables.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        entity_type: 'table',
        entity_name: `Table ${i}`,
        smart_code: 'HERA.REST.TABLE.SEATING.v1',
        metadata: {
          table_number: i,
          capacity: capacity,
          section: section,
          features: i > 12 ? ['window_view'] : i === 8 ? ['private_booth'] : [],
          current_status: 'available'
        },
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return tables
  }

  /**
   * Generate inventory items
   */
  private static generateInventoryItems(organizationId: string): any[] {
    const inventory = [
      { name: 'Tomatoes', category: 'produce', unit: 'lbs', cost_per_unit: 2.50, current_stock: 45, reorder_point: 20 },
      { name: 'Mozzarella Cheese', category: 'dairy', unit: 'lbs', cost_per_unit: 4.25, current_stock: 25, reorder_point: 10 },
      { name: 'Ground Beef', category: 'meat', unit: 'lbs', cost_per_unit: 6.50, current_stock: 30, reorder_point: 15 },
      { name: 'Pizza Dough', category: 'prepared', unit: 'portions', cost_per_unit: 0.85, current_stock: 150, reorder_point: 50 },
      { name: 'Olive Oil', category: 'condiments', unit: 'bottles', cost_per_unit: 8.99, current_stock: 12, reorder_point: 5 },
      { name: 'Fresh Basil', category: 'herbs', unit: 'bunches', cost_per_unit: 1.75, current_stock: 8, reorder_point: 5 },
      { name: 'Flour', category: 'dry_goods', unit: 'lbs', cost_per_unit: 1.20, current_stock: 75, reorder_point: 25 }
    ]

    return inventory.map(item => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'inventory_item',
      entity_name: item.name,
      smart_code: 'HERA.REST.INVENTORY.INGREDIENT.v1',
      metadata: {
        category: item.category,
        unit_of_measure: item.unit,
        cost_per_unit: item.cost_per_unit,
        current_stock: item.current_stock,
        reorder_point: item.reorder_point,
        supplier: 'Primary Food Supplier',
        shelf_life_days: item.category === 'produce' ? 7 : item.category === 'dairy' ? 14 : 90,
        storage_requirements: item.category === 'meat' || item.category === 'dairy' ? 'refrigerated' : 'dry_storage'
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate supplier entities
   */
  private static generateSuppliers(organizationId: string): any[] {
    const suppliers = [
      { name: 'Fresh Farm Produce Co.', category: 'produce', contact: 'supplier1@email.com', phone: '555-1000' },
      { name: 'Metro Dairy Distributors', category: 'dairy', contact: 'orders@metrodairy.com', phone: '555-2000' },
      { name: 'Premium Meat Supply', category: 'meat', contact: 'sales@premiummeat.com', phone: '555-3000' },
      { name: 'Restaurant Supply Plus', category: 'general', contact: 'info@restsupply.com', phone: '555-4000' }
    ]

    return suppliers.map(supplier => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'supplier',
      entity_name: supplier.name,
      smart_code: 'HERA.REST.SUPPLIER.VENDOR.v1',
      metadata: {
        category: supplier.category,
        contact_info: {
          email: supplier.contact,
          phone: supplier.phone
        },
        terms: {
          payment_terms: 'Net 30',
          delivery_schedule: 'Weekly',
          minimum_order: 250.00
        },
        rating: 4 + Math.random()
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate inventory transactions
   */
  private static generateInventoryTransactions(organizationId: string): any[] {
    const transactions = []
    
    // Generate weekly inventory purchases
    for (let week = 0; week < 4; week++) {
      const purchaseDate = new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000)
      
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'purchase',
        transaction_number: `PUR-${String(week + 1).padStart(4, '0')}`,
        transaction_date: purchaseDate,
        smart_code: 'HERA.REST.PURCHASE.INVENTORY.v1',
        description: 'Weekly inventory restock',
        total_amount: 800 + Math.random() * 400,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          supplier: 'Fresh Farm Produce Co.',
          items_count: 8 + Math.floor(Math.random() * 5),
          delivery_date: new Date(purchaseDate.getTime() + 24 * 60 * 60 * 1000),
          payment_method: 'invoice'
        },
        created_at: purchaseDate,
        updated_at: purchaseDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return transactions
  }

  /**
   * Generate payroll transactions
   */
  private static generatePayrollTransactions(organizationId: string): any[] {
    const transactions = []
    
    // Generate bi-weekly payroll
    for (let period = 0; period < 4; period++) {
      const payrollDate = new Date(Date.now() - period * 14 * 24 * 60 * 60 * 1000)
      
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'payroll',
        transaction_number: `PAY-${String(period + 1).padStart(4, '0')}`,
        transaction_date: payrollDate,
        smart_code: 'HERA.REST.PAYROLL.BIWEEKLY.v1',
        description: 'Bi-weekly staff payroll',
        total_amount: 3200 + Math.random() * 800,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          pay_period: {
            start: new Date(payrollDate.getTime() - 14 * 24 * 60 * 60 * 1000),
            end: payrollDate
          },
          employees_count: 7,
          total_hours: 560 + Math.floor(Math.random() * 120)
        },
        created_at: payrollDate,
        updated_at: payrollDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return transactions
  }

  /**
   * Generate relationships between entities
   */
  private static generateRelationships(organizationId: string): any[] {
    // This would create relationships between menu items and ingredients,
    // customers and orders, staff and roles, etc.
    return []
  }

  /**
   * Generate dynamic data fields
   */
  private static generateDynamicData(organizationId: string): any[] {
    // This would add custom fields like nutrition info, customer preferences, etc.
    return []
  }

  /**
   * Infer allergens from ingredients
   */
  private static inferAllergens(ingredients: string[]): string[] {
    const allergens = []
    const allergenMap = {
      'eggs': ['eggs'],
      'milk': ['dairy'],
      'cheese': ['dairy'],
      'mozzarella': ['dairy'],
      'wheat': ['gluten'],
      'flour': ['gluten'],
      'soy': ['soy'],
      'nuts': ['tree_nuts'],
      'shellfish': ['shellfish'],
      'fish': ['fish']
    }
    
    ingredients.forEach(ingredient => {
      const lower = ingredient.toLowerCase()
      Object.keys(allergenMap).forEach(key => {
        if (lower.includes(key)) {
          allergens.push(...allergenMap[key])
        }
      })
    })
    
    return [...new Set(allergens)]
  }

  /**
   * Generate restaurant-specific component structure
   */
  static generateComponentStructure(): any {
    return {
      pages: [
        {
          name: 'RestaurantDashboard',
          path: '/dashboard',
          components: ['GlassPanel', 'KPICards', 'OrderSummaryChart', 'TodaysSales']
        },
        {
          name: 'MenuManagement',
          path: '/menu',
          components: ['GlassPanel', 'EnterpriseTable', 'MenuItemForm', 'PhotoUpload']
        },
        {
          name: 'OrderManagement',
          path: '/orders',
          components: ['GlassPanel', 'OrderQueue', 'KitchenDisplay', 'DeliveryTracking']
        },
        {
          name: 'POSSystem',
          path: '/pos',
          components: ['GlassPanel', 'MenuGrid', 'OrderCart', 'PaymentProcessor']
        },
        {
          name: 'TableReservations',
          path: '/reservations',
          components: ['GlassPanel', 'TableLayout', 'ReservationCalendar', 'WaitList']
        },
        {
          name: 'InventoryManagement',
          path: '/inventory',
          components: ['GlassPanel', 'EnterpriseTable', 'StockAlerts', 'SupplierOrders']
        },
        {
          name: 'CustomerManagement',
          path: '/customers',
          components: ['GlassPanel', 'CustomerList', 'LoyaltyProgram', 'OrderHistory']
        },
        {
          name: 'Reports',
          path: '/reports',
          components: ['GlassPanel', 'SalesCharts', 'PopularItems', 'ProfitAnalysis']
        }
      ],
      specialized_components: [
        'KitchenDisplay',
        'MenuGrid',
        'OrderCart',
        'TableLayout',
        'ReservationCalendar',
        'DeliveryTracking',
        'PhotoUpload',
        'PaymentProcessor'
      ]
    }
  }
}

/**
 * Restaurant template factory function
 */
export function createRestaurantTemplate(requirements: RestaurantBusinessRequirements): any {
  return {
    demoData: RestaurantTemplate.generateDemoData(requirements),
    componentStructure: RestaurantTemplate.generateComponentStructure(),
    businessLogic: {
      orderWorkflow: ['pending', 'confirmed', 'preparing', 'ready', 'completed'],
      inventoryTracking: true,
      loyaltyProgram: true,
      reservationSystem: true,
      deliveryTracking: true,
      posIntegration: true
    },
    smartCodes: [
      'HERA.REST.MENU.ITEM.v1',
      'HERA.REST.ORDER.TRANSACTION.v1',
      'HERA.REST.CUSTOMER.PROFILE.v1',
      'HERA.REST.INVENTORY.INGREDIENT.v1',
      'HERA.REST.STAFF.EMPLOYEE.v1',
      'HERA.REST.TABLE.SEATING.v1',
      'HERA.REST.SUPPLIER.VENDOR.v1'
    ]
  }
}