/**
 * HERA Progressive Manufacturing Template
 * Complete manufacturing management system with production planning and quality control
 * Smart Code: HERA.PROGRESSIVE.TEMPLATE.MANUFACTURING.v1
 */

export interface ManufacturingBusinessRequirements {
  business_name: string
  manufacturing_type: 'discrete' | 'process' | 'batch' | 'continuous' | 'hybrid'
  industry_sector: 'automotive' | 'electronics' | 'food_beverage' | 'pharmaceuticals' | 'textiles' | 'machinery' | 'chemicals'
  production_capacity: 'small' | 'medium' | 'large' | 'enterprise'
  daily_production_units?: number
  quality_standards?: ('ISO9001' | 'ISO14001' | 'FDA' | 'GMP' | 'Six_Sigma')[]
  automation_level?: 'manual' | 'semi_automated' | 'fully_automated'
  location?: {
    address: string
    city: string
    state: string
    zip: string
    facility_size_sqft?: number
  }
}

export interface ManufacturingProduct {
  id: string
  part_number: string
  name: string
  description: string
  product_type: 'finished_good' | 'semi_finished' | 'raw_material' | 'component'
  category: string
  unit_of_measure: string
  standard_cost: number
  selling_price?: number
  lead_time_days: number
  safety_stock_level: number
  reorder_point: number
  bill_of_materials?: BOMComponent[]
  routing_operations?: RoutingOperation[]
  quality_specs?: QualitySpecification[]
}

export interface BOMComponent {
  component_id: string
  component_name: string
  quantity_required: number
  unit_of_measure: string
  scrap_factor: number
  cost_per_unit: number
  supplier_id?: string
  lead_time_days: number
}

export interface RoutingOperation {
  operation_number: number
  operation_name: string
  work_center_id: string
  setup_time_minutes: number
  run_time_per_unit: number
  labor_rate: number
  overhead_rate: number
  quality_check_required: boolean
}

export interface ProductionOrder {
  id: string
  order_number: string
  product_id: string
  quantity_planned: number
  quantity_completed: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'planned' | 'released' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  start_date_planned: Date
  end_date_planned: Date
  start_date_actual?: Date
  end_date_actual?: Date
  work_orders: WorkOrder[]
  material_requirements: MaterialRequirement[]
}

export interface WorkOrder {
  id: string
  work_order_number: string
  operation_id: string
  work_center_id: string
  quantity_to_produce: number
  quantity_completed: number
  status: 'waiting' | 'setup' | 'running' | 'completed' | 'paused'
  operator_id?: string
  actual_start_time?: Date
  actual_end_time?: Date
  quality_results?: QualityResult[]
}

export interface MaterialRequirement {
  material_id: string
  quantity_required: number
  quantity_allocated: number
  quantity_issued: number
  status: 'planned' | 'allocated' | 'issued' | 'completed'
}

export interface QualityResult {
  inspection_id: string
  characteristic: string
  measured_value: number
  specification_min: number
  specification_max: number
  result: 'pass' | 'fail' | 'rework'
  inspector_id: string
  inspection_date: Date
}

export class ManufacturingTemplate {
  
  /**
   * Generate comprehensive manufacturing demo data
   */
  static generateDemoData(requirements: ManufacturingBusinessRequirements): any {
    const organizationId = crypto.randomUUID()
    
    return {
      organization: this.createManufacturingOrganization(organizationId, requirements),
      entities: [
        ...this.generateProducts(organizationId, requirements.industry_sector),
        ...this.generateWorkCenters(organizationId),
        ...this.generateEmployees(organizationId),
        ...this.generateSuppliers(organizationId),
        ...this.generateCustomers(organizationId),
        ...this.generateQualityStandards(organizationId)
      ],
      transactions: [
        ...this.generateProductionOrders(organizationId, requirements.daily_production_units || 100),
        ...this.generateMaterialPurchases(organizationId),
        ...this.generateQualityInspections(organizationId),
        ...this.generateMaintenanceRecords(organizationId)
      ],
      relationships: this.generateRelationships(organizationId),
      dynamicData: this.generateDynamicData(organizationId)
    }
  }

  /**
   * Create manufacturing organization entity
   */
  private static createManufacturingOrganization(id: string, requirements: ManufacturingBusinessRequirements): any {
    return {
      id,
      organization_name: requirements.business_name,
      organization_code: `MFG-${requirements.business_name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}`,
      organization_type: 'manufacturing',
      industry_classification: requirements.industry_sector,
      ai_insights: {
        manufacturing_type: requirements.manufacturing_type,
        industry_sector: requirements.industry_sector,
        automation_level: requirements.automation_level || 'semi_automated',
        daily_capacity: requirements.daily_production_units || 100,
        efficiency_score: 75 + Math.random() * 20,
        quality_score: 85 + Math.random() * 15,
        oee_target: 85, // Overall Equipment Effectiveness
        growth_potential: 'high'
      },
      settings: {
        operating_schedule: {
          shifts_per_day: requirements.production_capacity === 'large' ? 3 : 2,
          hours_per_shift: 8,
          working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          maintenance_windows: ['sunday_morning']
        },
        production_settings: {
          planning_horizon_days: 30,
          safety_stock_days: 7,
          quality_check_frequency: 'every_batch',
          auto_release_orders: false,
          material_planning_method: 'mrp'
        },
        quality_settings: {
          quality_standards: requirements.quality_standards || ['ISO9001'],
          inspection_frequency: 'statistical_sampling',
          defect_tracking: true,
          corrective_action_required: true
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Generate manufacturing products with BOMs
   */
  private static generateProducts(organizationId: string, industrySector: string): any[] {
    const productTemplates = {
      automotive: [
        {
          name: 'Brake Pad Assembly', part_number: 'BPA-001', category: 'Safety Components',
          standard_cost: 25.50, selling_price: 45.00, lead_time: 5, unit: 'each'
        },
        {
          name: 'Engine Mount', part_number: 'EM-002', category: 'Engine Components',
          standard_cost: 18.75, selling_price: 32.50, lead_time: 7, unit: 'each'
        },
        {
          name: 'Brake Rotor', part_number: 'BR-003', category: 'Safety Components',
          standard_cost: 35.00, selling_price: 65.00, lead_time: 6, unit: 'each'
        }
      ],
      electronics: [
        {
          name: 'Circuit Board PCB', part_number: 'PCB-001', category: 'Electronic Components',
          standard_cost: 12.25, selling_price: 28.00, lead_time: 10, unit: 'each'
        },
        {
          name: 'Power Supply Unit', part_number: 'PSU-002', category: 'Power Components',
          standard_cost: 45.00, selling_price: 85.00, lead_time: 8, unit: 'each'
        },
        {
          name: 'LED Display Module', part_number: 'LED-003', category: 'Display Components',
          standard_cost: 22.50, selling_price: 48.00, lead_time: 12, unit: 'each'
        }
      ],
      food_beverage: [
        {
          name: 'Organic Energy Bar', part_number: 'OEB-001', category: 'Nutrition Bars',
          standard_cost: 1.25, selling_price: 3.49, lead_time: 2, unit: 'each'
        },
        {
          name: 'Protein Shake Mix', part_number: 'PSM-002', category: 'Beverages',
          standard_cost: 3.50, selling_price: 12.99, lead_time: 3, unit: 'container'
        },
        {
          name: 'Vitamin Supplement', part_number: 'VIT-003', category: 'Supplements',
          standard_cost: 2.75, selling_price: 8.99, lead_time: 5, unit: 'bottle'
        }
      ]
    }

    const baseProducts = productTemplates[industrySector] || productTemplates.electronics
    
    return baseProducts.map(product => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'manufactured_product',
      entity_name: product.name,
      entity_code: product.part_number,
      smart_code: `HERA.MFG.PRODUCT.${product.category.toUpperCase().replace(/\s+/g, '_')}.v1`,
      metadata: {
        part_number: product.part_number,
        product_type: 'finished_good',
        category: product.category,
        unit_of_measure: product.unit,
        standard_cost: product.standard_cost,
        selling_price: product.selling_price,
        lead_time_days: product.lead_time,
        safety_stock_level: 50,
        reorder_point: 25,
        bill_of_materials: this.generateBOM(product.part_number),
        routing_operations: this.generateRouting(product.part_number),
        quality_specifications: this.generateQualitySpecs(),
        inventory: {
          on_hand: 150 + Math.floor(Math.random() * 200),
          allocated: Math.floor(Math.random() * 50),
          available: 100 + Math.floor(Math.random() * 150),
          last_movement: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        },
        costing: {
          material_cost: product.standard_cost * 0.6,
          labor_cost: product.standard_cost * 0.25,
          overhead_cost: product.standard_cost * 0.15,
          profit_margin: ((product.selling_price - product.standard_cost) / product.selling_price * 100).toFixed(1)
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate Bill of Materials for products
   */
  private static generateBOM(partNumber: string): BOMComponent[] {
    const bomTemplates = {
      'BPA-001': [
        { name: 'Friction Material', quantity: 2, unit: 'pieces', cost: 8.50 },
        { name: 'Steel Backing Plate', quantity: 2, unit: 'pieces', cost: 6.00 },
        { name: 'Adhesive', quantity: 0.1, unit: 'kg', cost: 3.00 }
      ],
      'PCB-001': [
        { name: 'Fiberglass Substrate', quantity: 1, unit: 'pieces', cost: 4.25 },
        { name: 'Copper Traces', quantity: 0.05, unit: 'kg', cost: 2.50 },
        { name: 'Solder Mask', quantity: 0.02, unit: 'liters', cost: 1.50 }
      ],
      'OEB-001': [
        { name: 'Organic Oats', quantity: 0.3, unit: 'kg', cost: 0.45 },
        { name: 'Protein Powder', quantity: 0.1, unit: 'kg', cost: 0.35 },
        { name: 'Natural Sweetener', quantity: 0.05, unit: 'kg', cost: 0.25 }
      ]
    }

    const template = bomTemplates[partNumber] || bomTemplates['PCB-001']
    
    return template.map(component => ({
      component_id: crypto.randomUUID(),
      component_name: component.name,
      quantity_required: component.quantity,
      unit_of_measure: component.unit,
      scrap_factor: 0.02 + Math.random() * 0.03,
      cost_per_unit: component.cost,
      supplier_id: crypto.randomUUID(),
      lead_time_days: 3 + Math.floor(Math.random() * 7)
    }))
  }

  /**
   * Generate routing operations for products
   */
  private static generateRouting(partNumber: string): RoutingOperation[] {
    const routingTemplates = {
      'BPA-001': [
        { name: 'Material Preparation', setup: 15, run_time: 2.5, labor_rate: 18.50 },
        { name: 'Assembly', setup: 10, run_time: 5.0, labor_rate: 22.00 },
        { name: 'Quality Inspection', setup: 5, run_time: 1.5, labor_rate: 25.00 }
      ],
      'PCB-001': [
        { name: 'Board Preparation', setup: 20, run_time: 3.0, labor_rate: 24.00 },
        { name: 'Component Placement', setup: 30, run_time: 8.0, labor_rate: 28.00 },
        { name: 'Soldering', setup: 15, run_time: 12.0, labor_rate: 26.50 },
        { name: 'Testing', setup: 10, run_time: 4.0, labor_rate: 30.00 }
      ],
      'OEB-001': [
        { name: 'Ingredient Mixing', setup: 10, run_time: 0.5, labor_rate: 16.00 },
        { name: 'Forming', setup: 15, run_time: 0.3, labor_rate: 18.00 },
        { name: 'Packaging', setup: 5, run_time: 0.2, labor_rate: 15.50 }
      ]
    }

    const template = routingTemplates[partNumber] || routingTemplates['PCB-001']
    
    return template.map((operation, index) => ({
      operation_number: (index + 1) * 10,
      operation_name: operation.name,
      work_center_id: crypto.randomUUID(),
      setup_time_minutes: operation.setup,
      run_time_per_unit: operation.run_time,
      labor_rate: operation.labor_rate,
      overhead_rate: operation.labor_rate * 0.4,
      quality_check_required: operation.name.includes('Inspection') || operation.name.includes('Testing')
    }))
  }

  /**
   * Generate quality specifications
   */
  private static generateQualitySpecs(): any[] {
    return [
      {
        characteristic: 'Dimensional Tolerance',
        target_value: 100,
        lower_limit: 99.5,
        upper_limit: 100.5,
        measurement_unit: 'mm'
      },
      {
        characteristic: 'Surface Finish',
        target_value: 1.6,
        lower_limit: 0.8,
        upper_limit: 3.2,
        measurement_unit: 'Ra'
      },
      {
        characteristic: 'Hardness',
        target_value: 45,
        lower_limit: 40,
        upper_limit: 50,
        measurement_unit: 'HRC'
      }
    ]
  }

  /**
   * Generate work centers
   */
  private static generateWorkCenters(organizationId: string): any[] {
    const workCenters = [
      { name: 'Machining Center 1', type: 'machining', capacity: 16, efficiency: 85 },
      { name: 'Assembly Line A', type: 'assembly', capacity: 8, efficiency: 92 },
      { name: 'Quality Control Lab', type: 'inspection', capacity: 4, efficiency: 98 },
      { name: 'Packaging Station', type: 'packaging', capacity: 12, efficiency: 88 },
      { name: 'Material Preparation', type: 'preparation', capacity: 6, efficiency: 90 },
      { name: 'Heat Treatment', type: 'treatment', capacity: 24, efficiency: 80 }
    ]

    return workCenters.map(wc => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'work_center',
      entity_name: wc.name,
      smart_code: 'HERA.MFG.WORKCENTER.PRODUCTION.v1',
      metadata: {
        work_center_type: wc.type,
        capacity_hours_per_day: wc.capacity,
        efficiency_percentage: wc.efficiency,
        operating_cost_per_hour: 45 + Math.random() * 30,
        maintenance_schedule: {
          preventive_maintenance: 'weekly',
          last_maintenance: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          next_maintenance: new Date(Date.now() + (7 - Math.random() * 3) * 24 * 60 * 60 * 1000)
        },
        current_status: 'operational',
        utilization_rate: 70 + Math.random() * 25,
        quality_rating: 95 + Math.random() * 5
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate manufacturing employees
   */
  private static generateEmployees(organizationId: string): any[] {
    const employees = [
      { name: 'John Mitchell', role: 'production_manager', hourly_rate: 32.50, department: 'production' },
      { name: 'Sarah Kim', role: 'quality_engineer', hourly_rate: 28.75, department: 'quality' },
      { name: 'Mike Rodriguez', role: 'machine_operator', hourly_rate: 22.00, department: 'production' },
      { name: 'Lisa Chen', role: 'assembly_technician', hourly_rate: 19.50, department: 'production' },
      { name: 'David Thompson', role: 'maintenance_tech', hourly_rate: 24.25, department: 'maintenance' },
      { name: 'Anna Petrov', role: 'quality_inspector', hourly_rate: 21.75, department: 'quality' },
      { name: 'Carlos Garcia', role: 'material_handler', hourly_rate: 17.50, department: 'warehouse' },
      { name: 'Jennifer Adams', role: 'production_planner', hourly_rate: 26.00, department: 'planning' }
    ]

    return employees.map(emp => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'employee',
      entity_name: emp.name,
      smart_code: 'HERA.MFG.EMPLOYEE.WORKER.v1',
      metadata: {
        employee_id: `EMP-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        role: emp.role,
        department: emp.department,
        employment_details: {
          hire_date: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000),
          hourly_rate: emp.hourly_rate,
          status: 'active',
          shift: Math.random() > 0.5 ? 'day' : 'night',
          certifications: this.getEmployeeCertifications(emp.role),
          safety_training: {
            completed: true,
            last_training: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            next_training: new Date(Date.now() + (365 - Math.random() * 30) * 24 * 60 * 60 * 1000)
          }
        },
        performance: {
          productivity_score: 85 + Math.random() * 15,
          quality_score: 90 + Math.random() * 10,
          safety_incidents: Math.floor(Math.random() * 3),
          attendance_rate: 95 + Math.random() * 5
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
   * Get employee certifications based on role
   */
  private static getEmployeeCertifications(role: string): string[] {
    const certifications = {
      'machine_operator': ['Machine Safety', 'CNC Operation'],
      'quality_engineer': ['Six Sigma Green Belt', 'ISO 9001 Lead Auditor'],
      'quality_inspector': ['Measurement Systems', 'Statistical Process Control'],
      'maintenance_tech': ['Electrical Safety', 'Hydraulics'],
      'production_manager': ['Lean Manufacturing', 'Production Planning']
    }
    
    return certifications[role] || ['General Safety']
  }

  /**
   * Generate production orders
   */
  private static generateProductionOrders(organizationId: string, dailyUnits: number): any[] {
    const orders = []
    
    // Generate production orders for next 14 days
    for (let day = -7; day < 7; day++) {
      const orderDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000)
      const ordersForDay = Math.floor((dailyUnits / 50) * (0.8 + Math.random() * 0.4))
      
      for (let i = 0; i < ordersForDay; i++) {
        const quantity = 25 + Math.floor(Math.random() * 100)
        const priority = ['normal', 'normal', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 5)]
        const status = day < 0 ? 'completed' : day === 0 ? 'in_progress' : 'planned'
        
        orders.push({
          id: crypto.randomUUID(),
          organization_id: organizationId,
          transaction_type: 'production_order',
          transaction_number: `PO-${String(orders.length + 1).padStart(5, '0')}`,
          transaction_date: orderDate,
          smart_code: 'HERA.MFG.PRODUCTION.ORDER.v1',
          description: `Production order for ${quantity} units`,
          total_amount: quantity * (25 + Math.random() * 50), // Estimated value
          currency_code: 'USD',
          status: status === 'completed' ? 'confirmed' : 'pending',
          metadata: {
            product_id: crypto.randomUUID(),
            quantity_planned: quantity,
            quantity_completed: status === 'completed' ? quantity : Math.floor(quantity * Math.random()),
            priority: priority,
            production_status: status,
            start_date_planned: orderDate,
            end_date_planned: new Date(orderDate.getTime() + (2 + Math.random() * 3) * 24 * 60 * 60 * 1000),
            customer_order: Math.random() > 0.3 ? `SO-${Math.floor(Math.random() * 10000)}` : 'Stock',
            material_requirements: this.generateMaterialRequirements(),
            work_orders: this.generateWorkOrders(quantity),
            estimated_cost: quantity * (15 + Math.random() * 20)
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
   * Generate material requirements for production orders
   */
  private static generateMaterialRequirements(): any[] {
    return [
      {
        material_id: crypto.randomUUID(),
        material_name: 'Steel Sheet',
        quantity_required: 50,
        quantity_allocated: 50,
        quantity_issued: 45,
        unit_cost: 12.50,
        status: 'issued'
      },
      {
        material_id: crypto.randomUUID(),
        material_name: 'Electronic Components',
        quantity_required: 100,
        quantity_allocated: 100,
        quantity_issued: 100,
        unit_cost: 3.25,
        status: 'completed'
      }
    ]
  }

  /**
   * Generate work orders for production orders
   */
  private static generateWorkOrders(quantity: number): any[] {
    return [
      {
        work_order_number: `WO-${Math.floor(Math.random() * 100000)}`,
        operation_name: 'Machining',
        work_center: 'Machining Center 1',
        quantity_to_produce: quantity,
        quantity_completed: Math.floor(quantity * (0.7 + Math.random() * 0.3)),
        status: 'in_progress',
        estimated_hours: quantity * 0.25,
        actual_hours: quantity * 0.22
      },
      {
        work_order_number: `WO-${Math.floor(Math.random() * 100000)}`,
        operation_name: 'Assembly',
        work_center: 'Assembly Line A',
        quantity_to_produce: quantity,
        quantity_completed: 0,
        status: 'waiting',
        estimated_hours: quantity * 0.15,
        actual_hours: 0
      }
    ]
  }

  /**
   * Generate material purchases
   */
  private static generateMaterialPurchases(organizationId: string): any[] {
    const purchases = []
    
    // Generate weekly material purchases
    for (let week = 0; week < 8; week++) {
      const purchaseDate = new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000)
      
      purchases.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'material_purchase',
        transaction_number: `MP-${String(week + 1).padStart(4, '0')}`,
        transaction_date: purchaseDate,
        smart_code: 'HERA.MFG.PURCHASE.MATERIAL.v1',
        description: 'Weekly material purchase',
        total_amount: 5000 + Math.random() * 3000,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          supplier: 'Industrial Materials Inc.',
          items_purchased: 8 + Math.floor(Math.random() * 6),
          delivery_date: new Date(purchaseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
          inspection_required: true,
          payment_terms: 'Net 30'
        },
        created_at: purchaseDate,
        updated_at: purchaseDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return purchases
  }

  /**
   * Generate quality inspections
   */
  private static generateQualityInspections(organizationId: string): any[] {
    const inspections = []
    
    // Generate daily quality inspections
    for (let day = 0; day < 14; day++) {
      const inspectionDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000 + Math.random() * 8 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000)
      
      inspections.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'quality_inspection',
        transaction_number: `QI-${String(inspections.length + 1).padStart(5, '0')}`,
        transaction_date: inspectionDate,
        smart_code: 'HERA.MFG.QUALITY.INSPECTION.v1',
        description: 'Quality inspection - incoming materials',
        total_amount: 0, // No direct cost
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          inspection_type: 'incoming_inspection',
          lot_number: `LOT-${Math.floor(Math.random() * 100000)}`,
          sample_size: 5 + Math.floor(Math.random() * 10),
          results: {
            pass: Math.floor(Math.random() * 8) + 2,
            fail: Math.floor(Math.random() * 2),
            rework: Math.floor(Math.random() * 1)
          },
          inspector_id: crypto.randomUUID(),
          defect_types: Math.random() > 0.8 ? ['Dimensional variance'] : [],
          corrective_action_required: Math.random() > 0.9
        },
        created_at: inspectionDate,
        updated_at: inspectionDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return inspections
  }

  /**
   * Generate maintenance records
   */
  private static generateMaintenanceRecords(organizationId: string): any[] {
    const records = []
    
    // Generate weekly maintenance activities
    for (let week = 0; week < 8; week++) {
      const maintenanceDate = new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000)
      
      records.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'maintenance',
        transaction_number: `MT-${String(week + 1).padStart(4, '0')}`,
        transaction_date: maintenanceDate,
        smart_code: 'HERA.MFG.MAINTENANCE.PREVENTIVE.v1',
        description: 'Preventive maintenance - production equipment',
        total_amount: 500 + Math.random() * 1000,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          maintenance_type: 'preventive',
          equipment_id: crypto.randomUUID(),
          technician_id: crypto.randomUUID(),
          duration_hours: 2 + Math.random() * 4,
          parts_replaced: Math.random() > 0.7 ? ['Filter', 'Seal'] : [],
          downtime_hours: Math.random() * 2,
          next_maintenance: new Date(maintenanceDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        created_at: maintenanceDate,
        updated_at: maintenanceDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return records
  }

  /**
   * Generate suppliers
   */
  private static generateSuppliers(organizationId: string): any[] {
    const suppliers = [
      { name: 'Industrial Materials Inc.', category: 'raw_materials', contact: 'orders@indmaterials.com', phone: '555-4001' },
      { name: 'Precision Components Ltd.', category: 'components', contact: 'sales@precisioncomp.com', phone: '555-4002' },
      { name: 'Chemical Supply Co.', category: 'chemicals', contact: 'info@chemsupply.com', phone: '555-4003' },
      { name: 'Tool & Die Works', category: 'tooling', contact: 'service@toolanddie.com', phone: '555-4004' }
    ]

    return suppliers.map(supplier => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'supplier',
      entity_name: supplier.name,
      smart_code: 'HERA.MFG.SUPPLIER.VENDOR.v1',
      metadata: {
        category: supplier.category,
        contact_info: {
          email: supplier.contact,
          phone: supplier.phone
        },
        terms: {
          payment_terms: 'Net 30',
          lead_time_days: 5 + Math.floor(Math.random() * 10),
          minimum_order: 1000.00,
          quality_rating: 'A'
        },
        certifications: ['ISO 9001', 'AS9100'].filter(() => Math.random() > 0.5),
        performance: {
          on_time_delivery_rate: 88 + Math.random() * 12,
          quality_rating: 4.2 + Math.random() * 0.8,
          cost_competitiveness: 'good'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate customers
   */
  private static generateCustomers(organizationId: string): any[] {
    const customers = [
      { name: 'Automotive Systems Corp', industry: 'automotive', annual_volume: 50000 },
      { name: 'Tech Innovations Ltd', industry: 'electronics', annual_volume: 25000 },
      { name: 'Aerospace Dynamics', industry: 'aerospace', annual_volume: 15000 },
      { name: 'Consumer Products Inc', industry: 'consumer_goods', annual_volume: 75000 }
    ]

    return customers.map(customer => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'customer',
      entity_name: customer.name,
      smart_code: 'HERA.MFG.CUSTOMER.INDUSTRIAL.v1',
      metadata: {
        industry: customer.industry,
        annual_volume: customer.annual_volume,
        relationship_length: 2 + Math.floor(Math.random() * 8),
        payment_terms: 'Net 30',
        quality_requirements: ['ISO 9001', 'Statistical documentation'],
        delivery_preferences: {
          frequency: 'weekly',
          preferred_day: 'friday',
          packaging_requirements: 'standard'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate quality standards
   */
  private static generateQualityStandards(organizationId: string): any[] {
    const standards = [
      { name: 'ISO 9001:2015', type: 'quality_management', description: 'Quality Management Systems' },
      { name: 'AS9100D', type: 'aerospace_quality', description: 'Aerospace Quality Management' },
      { name: 'Six Sigma', type: 'process_improvement', description: 'Process Improvement Methodology' }
    ]

    return standards.map(standard => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'quality_standard',
      entity_name: standard.name,
      smart_code: 'HERA.MFG.QUALITY.STANDARD.v1',
      metadata: {
        standard_type: standard.type,
        description: standard.description,
        implementation_date: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000),
        certification_status: 'certified',
        next_audit: new Date(Date.now() + (365 - Math.random() * 60) * 24 * 60 * 60 * 1000),
        compliance_score: 90 + Math.random() * 10
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate relationships between entities
   */
  private static generateRelationships(organizationId: string): any[] {
    return []
  }

  /**
   * Generate dynamic data fields
   */
  private static generateDynamicData(organizationId: string): any[] {
    return []
  }

  /**
   * Generate manufacturing-specific component structure
   */
  static generateComponentStructure(): any {
    return {
      pages: [
        {
          name: 'ManufacturingDashboard',
          path: '/dashboard',
          components: ['GlassPanel', 'ProductionKPIs', 'OEEChart', 'QualityMetrics', 'MaintenanceAlerts']
        },
        {
          name: 'ProductionPlanning',
          path: '/planning',
          components: ['GlassPanel', 'ProductionSchedule', 'MaterialRequirements', 'CapacityPlanning', 'OrderPriority']
        },
        {
          name: 'WorkOrderManagement',
          path: '/work-orders',
          components: ['GlassPanel', 'WorkOrderList', 'OperationTracking', 'LaborReporting', 'MaterialIssue']
        },
        {
          name: 'QualityControl',
          path: '/quality',
          components: ['GlassPanel', 'InspectionPlans', 'QualityResults', 'DefectTracking', 'CorrectiveActions']
        },
        {
          name: 'InventoryManagement',
          path: '/inventory',
          components: ['GlassPanel', 'MaterialTracking', 'BOMManagement', 'StockLevels', 'PurchaseRequisitions']
        },
        {
          name: 'MaintenanceManagement',
          path: '/maintenance',
          components: ['GlassPanel', 'MaintenanceSchedule', 'EquipmentStatus', 'WorkRequests', 'PreventiveMaintenance']
        },
        {
          name: 'ProductionReports',
          path: '/reports',
          components: ['GlassPanel', 'ProductionAnalytics', 'CostAnalysis', 'EfficiencyReports', 'QualityReports']
        }
      ],
      specialized_components: [
        'ProductionSchedule',
        'WorkOrderList',
        'OperationTracking',
        'MaterialRequirements',
        'InspectionPlans',
        'QualityResults',
        'BOMManagement',
        'EquipmentStatus',
        'OEEChart',
        'CapacityPlanning',
        'DefectTracking',
        'MaintenanceSchedule'
      ]
    }
  }
}

/**
 * Manufacturing template factory function
 */
export function createManufacturingTemplate(requirements: ManufacturingBusinessRequirements): any {
  return {
    demoData: ManufacturingTemplate.generateDemoData(requirements),
    componentStructure: ManufacturingTemplate.generateComponentStructure(),
    businessLogic: {
      productionWorkflow: ['planned', 'released', 'in_progress', 'completed'],
      materialPlanningMRP: true,
      qualityManagement: true,
      maintenanceScheduling: true,
      costAccounting: true,
      shopFloorControl: true,
      bomManagement: true,
      routingManagement: true,
      workCenterScheduling: true
    },
    smartCodes: [
      'HERA.MFG.PRODUCT.v1',
      'HERA.MFG.PRODUCTION.ORDER.v1',
      'HERA.MFG.WORKCENTER.PRODUCTION.v1',
      'HERA.MFG.QUALITY.INSPECTION.v1',
      'HERA.MFG.PURCHASE.MATERIAL.v1',
      'HERA.MFG.MAINTENANCE.PREVENTIVE.v1',
      'HERA.MFG.EMPLOYEE.WORKER.v1',
      'HERA.MFG.SUPPLIER.VENDOR.v1'
    ]
  }
}