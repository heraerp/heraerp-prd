import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

// Furniture product master data
const FURNITURE_PRODUCTS = [
  {
    entity_code: 'DESK-EXE-001',
    entity_name: 'Executive Office Desk - Premium Teak',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Office Furniture',
      sub_category: 'Desks',
      hsn_code: '940330',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Premium Teak Wood',
      finish: 'Natural Polish',
      length_cm: 180,
      width_cm: 90,
      height_cm: 75,
      weight_kg: 85,
      assembly_time_hrs: 2.5,
      warranty_years: 5,
      unit_cost: 35000,
      selling_price: 55000,
      min_order_qty: 1
    }
  },
  {
    entity_code: 'CHAIR-ERG-001',
    entity_name: 'Ergonomic High-Back Office Chair',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Office Furniture',
      sub_category: 'Chairs',
      hsn_code: '940130',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Mesh Back, Leather Seat',
      finish: 'Black',
      seat_height_cm: '45-55',
      weight_capacity_kg: 150,
      features: 'Lumbar Support, Adjustable Arms, Tilt Lock',
      warranty_years: 3,
      unit_cost: 12000,
      selling_price: 18500,
      min_order_qty: 2
    }
  },
  {
    entity_code: 'TABLE-CONF-008',
    entity_name: 'Conference Table 8-Seater Oval',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Conference Room',
      sub_category: 'Tables',
      hsn_code: '940360',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Engineered Wood with Veneer',
      finish: 'Walnut',
      length_cm: 300,
      width_cm: 120,
      height_cm: 75,
      seating_capacity: 8,
      cable_management: 'Integrated',
      unit_cost: 68000,
      selling_price: 95000,
      min_order_qty: 1
    }
  },
  {
    entity_code: 'WORK-MOD-001',
    entity_name: 'Modular Workstation 4-Person Cluster',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Office Furniture',
      sub_category: 'Workstations',
      hsn_code: '940330',
      uom: 'SET'
    },
    dynamic_fields: {
      material: 'Particle Board, Aluminum Frame',
      finish: 'Oak Pattern',
      configuration: '4-Person Cluster',
      includes: 'Desks, Privacy Panels, Cable Trays, CPU Holders',
      power_outlets: 8,
      unit_cost: 85000,
      selling_price: 125000,
      min_order_qty: 1
    }
  },
  {
    entity_code: 'CAB-FILE-002',
    entity_name: 'Vertical Filing Cabinet 4-Drawer',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Storage',
      sub_category: 'Cabinets',
      hsn_code: '940310',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Steel',
      finish: 'Powder Coated Grey',
      drawers: 4,
      lock_type: 'Central Locking',
      weight_per_drawer_kg: 40,
      unit_cost: 8500,
      selling_price: 12500,
      min_order_qty: 2
    }
  },
  {
    entity_code: 'SOFA-REC-003',
    entity_name: 'Reception Sofa 3-Seater Premium',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Reception',
      sub_category: 'Sofas',
      hsn_code: '940140',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Leather Upholstery, Hardwood Frame',
      color: 'Tan Brown',
      seating_capacity: 3,
      cushion_density: '35D',
      fire_retardant: true,
      unit_cost: 45000,
      selling_price: 68000,
      min_order_qty: 1
    }
  }
]

// Raw materials
const RAW_MATERIALS = [
  {
    entity_code: 'RM-WOOD-TEAK',
    entity_name: 'Teak Wood - Grade A',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.RAW_MATERIAL.v1',
    metadata: { category: 'Wood', uom: 'CFT', hsn_code: '440399' },
    dynamic_fields: { cost_per_unit: 8500, min_stock: 100, reorder_qty: 200 }
  },
  {
    entity_code: 'RM-PLY-18MM',
    entity_name: 'Plywood 18mm Commercial',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.RAW_MATERIAL.v1',
    metadata: { category: 'Board', uom: 'SQ.FT', hsn_code: '441213' },
    dynamic_fields: { cost_per_unit: 65, min_stock: 500, reorder_qty: 1000 }
  },
  {
    entity_code: 'RM-FOAM-35D',
    entity_name: 'Foam Sheet 35 Density',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.RAW_MATERIAL.v1',
    metadata: { category: 'Foam', uom: 'SHEET', hsn_code: '392190' },
    dynamic_fields: { cost_per_unit: 450, min_stock: 50, reorder_qty: 100 }
  }
]

// Work centers
const WORK_CENTERS = [
  {
    entity_code: 'WC-CUT-01',
    entity_name: 'Cutting Station 1',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.WORK_CENTER.v1',
    metadata: { type: 'Cutting', capacity_per_shift: 50 }
  },
  {
    entity_code: 'WC-ASM-01',
    entity_name: 'Assembly Line 1',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.WORK_CENTER.v1',
    metadata: { type: 'Assembly', capacity_per_shift: 20 }
  },
  {
    entity_code: 'WC-FIN-01',
    entity_name: 'Finishing Bay 1',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.WORK_CENTER.v1',
    metadata: { type: 'Finishing', capacity_per_shift: 30 }
  }
]

// Sample customers
const CUSTOMERS = [
  {
    entity_code: 'CUST-MAR-001',
    entity_name: 'Marriott Hotels India',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1',
    metadata: { 
      industry: 'Hospitality',
      segment: 'Enterprise'
    },
    dynamic_fields: {
      gst_number: '29AABCM1234E1Z5',
      pan_number: 'AABCM1234E',
      credit_limit: 5000000,
      payment_terms: 30,
      contact_person: 'Rajesh Kumar',
      contact_email: 'rajesh.kumar@marriott.com',
      contact_phone: '+91-9876543210'
    }
  },
  {
    entity_code: 'CUST-ITC-001',
    entity_name: 'ITC Hotels Ltd',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1',
    metadata: { 
      industry: 'Hospitality',
      segment: 'Enterprise'
    },
    dynamic_fields: {
      gst_number: '29AAACI1234F1Z6',
      pan_number: 'AAACI1234F',
      credit_limit: 8000000,
      payment_terms: 45,
      contact_person: 'Priya Sharma',
      contact_email: 'priya.sharma@itchotels.com',
      contact_phone: '+91-9876543211'
    }
  },
  {
    entity_code: 'CUST-TM-001',
    entity_name: 'Tech Mahindra Limited',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1',
    metadata: { 
      industry: 'IT Services',
      segment: 'Enterprise'
    },
    dynamic_fields: {
      gst_number: '29AAACT1234G1Z7',
      pan_number: 'AAACT1234G',
      credit_limit: 10000000,
      payment_terms: 60,
      contact_person: 'Amit Patel',
      contact_email: 'amit.patel@techmahindra.com',
      contact_phone: '+91-9876543212'
    }
  }
]

export async function POST(request: NextRequest) {
  try {
    // Get organization from request or use default
    const body = await request.json().catch(() => ({}))
    const organizationId = body.organization_id || process.env.DEFAULT_ORGANIZATION_ID || ''
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required or DEFAULT_ORGANIZATION_ID must be set' },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(organizationId)

    // Seed Products
    const productResults = []
    for (const product of FURNITURE_PRODUCTS) {
      // Create entity
      const entity = await universalApi.createEntity({
        entity_type: 'product',
        entity_code: product.entity_code,
        entity_name: product.entity_name,
        smart_code: product.smart_code,
        metadata: product.metadata
      })

      // Add dynamic fields
      for (const [field, value] of Object.entries(product.dynamic_fields)) {
        await universalApi.setDynamicField(entity.id, field, value)
      }

      productResults.push(entity)
    }

    // Seed Raw Materials
    const materialResults = []
    for (const material of RAW_MATERIALS) {
      const entity = await universalApi.createEntity({
        entity_type: 'raw_material',
        entity_code: material.entity_code,
        entity_name: material.entity_name,
        smart_code: material.smart_code,
        metadata: material.metadata
      })

      // Add dynamic fields
      for (const [field, value] of Object.entries(material.dynamic_fields)) {
        await universalApi.setDynamicField(entity.id, field, value)
      }

      materialResults.push(entity)
    }

    // Seed Work Centers
    const workCenterResults = []
    for (const wc of WORK_CENTERS) {
      const entity = await universalApi.createEntity({
        entity_type: 'work_center',
        entity_code: wc.entity_code,
        entity_name: wc.entity_name,
        smart_code: wc.smart_code,
        metadata: wc.metadata
      })

      workCenterResults.push(entity)
    }

    // Seed Customers
    const customerResults = []
    for (const customer of CUSTOMERS) {
      const entity = await universalApi.createEntity({
        entity_type: 'customer',
        entity_code: customer.entity_code,
        entity_name: customer.entity_name,
        smart_code: customer.smart_code,
        metadata: customer.metadata
      })

      // Add dynamic fields
      for (const [field, value] of Object.entries(customer.dynamic_fields)) {
        await universalApi.setDynamicField(entity.id, field, value)
      }

      customerResults.push(entity)
    }

    // Create sample BOM for Executive Desk
    if (productResults.length > 0 && materialResults.length > 0) {
      const desk = productResults[0]
      const teak = materialResults.find(m => m.entity_code === 'RM-WOOD-TEAK')
      const plywood = materialResults.find(m => m.entity_code === 'RM-PLY-18MM')

      if (desk && teak) {
        await universalApi.createRelationship({
          from_entity_id: desk.id,
          to_entity_id: teak.id,
          relationship_type: 'bom_component',
          smart_code: 'HERA.MANUFACTURING.FURNITURE.BOM.COMPONENT.v1',
          metadata: {
            quantity: 12,
            uom: 'CFT',
            scrap_percentage: 5
          }
        })
      }

      if (desk && plywood) {
        await universalApi.createRelationship({
          from_entity_id: desk.id,
          to_entity_id: plywood.id,
          relationship_type: 'bom_component',
          smart_code: 'HERA.MANUFACTURING.FURNITURE.BOM.COMPONENT.v1',
          metadata: {
            quantity: 50,
            uom: 'SQ.FT',
            scrap_percentage: 3
          }
        })
      }
    }
    
    // Create some sample sales orders
    const salesOrders = []
    if (customerResults.length > 0 && productResults.length > 0) {
      // Order 1: Marriott Hotels - Executive Desk Order
      const marriott = customerResults[0]
      const desk = productResults[0]
      const chair = productResults[1]
      
      const order1 = await universalApi.createTransaction({
        transaction_type: 'sales_order',
        transaction_code: 'SO-FRN-2025-0001',
        transaction_date: new Date().toISOString(),
        source_entity_id: marriott.id,
        smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
        metadata: {
          customer_po: 'MH-PO-2025-1234',
          delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms: 30,
          status: 'confirmed'
        }
      })
      
      // Add line items
      await universalApi.createTransactionLine({
        transaction_id: order1.id,
        line_number: 1,
        entity_id: desk.id,
        quantity: '10',
        unit_amount: 55000,
        line_amount: 550000,
        smart_code: 'HERA.FURNITURE.SALES.ORDER.LINE.v1',
        metadata: {
          discount_percent: 0,
          tax_rate: 18,
          delivery_location: 'Mumbai'
        }
      })
      
      await universalApi.createTransactionLine({
        transaction_id: order1.id,
        line_number: 2,
        entity_id: chair.id,
        quantity: '20',
        unit_amount: 18500,
        line_amount: 370000,
        smart_code: 'HERA.FURNITURE.SALES.ORDER.LINE.v1',
        metadata: {
          discount_percent: 5,
          tax_rate: 18,
          delivery_location: 'Mumbai'
        }
      })
      
      // Update order total
      await universalApi.updateTransaction(order1.id, {
        total_amount: 920000
      })
      
      salesOrders.push(order1)
      
      // Order 2: ITC Hotels - Conference Table
      if (customerResults[1] && productResults[2]) {
        const itc = customerResults[1]
        const confTable = productResults[2]
        
        const order2 = await universalApi.createTransaction({
          transaction_type: 'sales_order',
          transaction_code: 'SO-FRN-2025-0002',
          transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          source_entity_id: itc.id,
          smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
          metadata: {
            customer_po: 'ITC-PO-2025-5678',
            delivery_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            payment_terms: 45,
            status: 'in_production'
          }
        })
        
        await universalApi.createTransactionLine({
          transaction_id: order2.id,
          line_number: 1,
          entity_id: confTable.id,
          quantity: '5',
          unit_amount: 95000,
          line_amount: 475000,
          smart_code: 'HERA.FURNITURE.SALES.ORDER.LINE.v1'
        })
        
        await universalApi.updateTransaction(order2.id, {
          total_amount: 475000
        })
        
        salesOrders.push(order2)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        products: productResults.length,
        raw_materials: materialResults.length,
        work_centers: workCenterResults.length,
        customers: customerResults.length,
        sales_orders: salesOrders.length
      },
      message: 'Furniture module seed data created successfully'
    })

  } catch (error: any) {
    console.error('Furniture seed error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed furniture data' },
      { status: 500 }
    )
  }
}