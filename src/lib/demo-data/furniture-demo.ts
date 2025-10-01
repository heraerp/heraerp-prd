/**
 * HERA Furniture Manufacturing Demo Data
 * Creates sample furniture manufacturing data for new organizations
 */

import { universalApi } from '@/lib/universal-api'

export async function createFurnitureDemoData(organizationId: string) {
  try {
    // 1. Create Product Categories
    const categories = [
      { name: 'Office Furniture', code: 'CAT-OFFICE', type: 'product_category' },
      { name: 'Home Furniture', code: 'CAT-HOME', type: 'product_category' },
      { name: 'Educational Furniture', code: 'CAT-EDU', type: 'product_category' },
      { name: 'Raw Materials', code: 'CAT-RM', type: 'material_category' },
      { name: 'Hardware & Fittings', code: 'CAT-HW', type: 'material_category' }
    ]

    for (const cat of categories) {
      await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'category',
        entity_name: cat.name,
        entity_code: cat.code,
        smart_code: `HERA.FURNITURE.MASTER.CATEGORY.${cat.type.toUpperCase()}.v1`,
        metadata: { category_type: cat.type }
      })
    }

    // 2. Create Finished Goods Products
    const finishedGoods = [
      {
        name: 'Standard Classroom Desk',
        code: 'DESK-STD-001',
        hsn: '9403',
        gst_rate: 0.18,
        price: 3500,
        specs: { width: '120cm', height: '75cm', depth: '60cm', material: 'Teak & Steel' }
      },
      {
        name: 'Executive Office Chair',
        code: 'CHAIR-EXE-001',
        hsn: '9401',
        gst_rate: 0.18,
        price: 12000,
        specs: { type: 'Revolving', material: 'Leather & Chrome', warranty: '3 years' }
      },
      {
        name: 'Modular Conference Table',
        code: 'TABLE-CONF-001',
        hsn: '9403',
        gst_rate: 0.18,
        price: 45000,
        specs: { length: '300cm', width: '120cm', seats: '10', finish: 'Walnut Veneer' }
      }
    ]

    const productIds: Record<string, string> = {}

    for (const product of finishedGoods) {
      const result = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'product',
        entity_name: product.name,
        entity_code: product.code,
        smart_code: 'HERA.FURNITURE.MASTER.PRODUCT.FINISHED_GOOD.V1',
        metadata: {
          product_type: 'FINISHED_GOOD',
          hsn_code: product.hsn,
          gst_rate: product.gst_rate,
          list_price: product.price,
          specifications: product.specs
        }
      })

      if (result.id) {
        productIds[product.code] = result.id

        // Add pricing
        await universalApi.setDynamicField(result.id, 'list_price', product.price.toString())
        await universalApi.setDynamicField(result.id, 'hsn_code', product.hsn)
      }
    }

    // 3. Create Raw Materials
    const rawMaterials = [
      {
        name: 'Teak Wood Plank 2x4',
        code: 'RM-WOOD-001',
        hsn: '4407',
        gst_rate: 0.12,
        unit: 'sq.ft',
        price: 150
      },
      {
        name: 'MDF Board 18mm',
        code: 'RM-MDF-001',
        hsn: '4411',
        gst_rate: 0.18,
        unit: 'sheet',
        price: 800
      },
      {
        name: 'Wood Polish - Glossy',
        code: 'RM-POL-001',
        hsn: '3405',
        gst_rate: 0.18,
        unit: 'liter',
        price: 450
      },
      {
        name: 'Drawer Slide 18"',
        code: 'HW-SLIDE-001',
        hsn: '8302',
        gst_rate: 0.18,
        unit: 'pair',
        price: 250
      },
      {
        name: 'Furniture Handle - Chrome',
        code: 'HW-HANDLE-001',
        hsn: '8302',
        gst_rate: 0.18,
        unit: 'piece',
        price: 120
      }
    ]

    const materialIds: Record<string, string> = {}

    for (const material of rawMaterials) {
      const result = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'product',
        entity_name: material.name,
        entity_code: material.code,
        smart_code: 'HERA.FURNITURE.MASTER.PRODUCT.RAW_MATERIAL.V1',
        metadata: {
          product_type: 'RAW_MATERIAL',
          hsn_code: material.hsn,
          gst_rate: material.gst_rate,
          unit_of_measure: material.unit,
          cost_per_unit: material.price
        }
      })

      if (result.id) {
        materialIds[material.code] = result.id
      }
    }

    // 4. Create Bill of Materials (BOM)
    if (productIds['DESK-STD-001'] && materialIds['RM-WOOD-001']) {
      // BOM for Standard Classroom Desk
      const bomItems = [
        { material: 'RM-WOOD-001', quantity: 12, unit: 'sq.ft' },
        { material: 'RM-MDF-001', quantity: 0.5, unit: 'sheet' },
        { material: 'RM-POL-001', quantity: 0.5, unit: 'liter' },
        { material: 'HW-HANDLE-001', quantity: 2, unit: 'piece' }
      ]

      for (const item of bomItems) {
        await universalApi.createRelationship({
          organization_id: organizationId,
          from_entity_id: productIds['DESK-STD-001'],
          to_entity_id: materialIds[item.material],
          relationship_type: 'HAS_COMPONENT',
          smart_code: 'HERA.FURNITURE.BOM.COMPONENT.V1',
          metadata: {
            quantity: item.quantity,
            unit_of_measure: item.unit
          }
        })
      }
    }

    // 5. Create Work Centers
    const workCenters = [
      { name: 'Wood Cutting Station', code: 'WC-CUT-001', capacity: 8 },
      { name: 'Assembly Station A', code: 'WC-ASM-001', capacity: 6 },
      { name: 'Polishing Station', code: 'WC-POL-001', capacity: 4 },
      { name: 'Quality Check Station', code: 'WC-QC-001', capacity: 2 }
    ]

    for (const wc of workCenters) {
      await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'work_center',
        entity_name: wc.name,
        entity_code: wc.code,
        smart_code: 'HERA.FURNITURE.MASTER.WORK_CENTER.v1',
        metadata: {
          capacity_hours_per_day: wc.capacity,
          status: 'active'
        }
      })
    }

    // 6. Create Sample Customers
    const customers = [
      { name: 'Kerala Govt. Model School', code: 'CUST-GOVT-001', gstin: '32AAAGK1234F1Z5' },
      { name: 'Marriott Hotel Kochi', code: 'CUST-HOTEL-001', gstin: '32AAACM5678G1Z6' },
      { name: 'TCS Infopark Campus', code: 'CUST-CORP-001', gstin: '32AAACT9012H1Z7' }
    ]

    for (const customer of customers) {
      const result = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'customer',
        entity_name: customer.name,
        entity_code: customer.code,
        smart_code: 'HERA.FURNITURE.MASTER.CUSTOMER.V1',
        metadata: {
          customer_type: 'B2B',
          gstin: customer.gstin,
          state_code: '32' // Kerala
        }
      })

      if (result.id) {
        await universalApi.setDynamicField(result.id, 'gstin', customer.gstin)
        await universalApi.setDynamicField(result.id, 'credit_limit', '500000')
        await universalApi.setDynamicField(result.id, 'payment_terms', '30')
      }
    }

    // 7. Create Sample Vendors
    const vendors = [
      { name: 'Premium Wood Suppliers', code: 'VEND-WOOD-001', gstin: '32AAAPW1234K1Z5' },
      { name: 'Hardware Plus Industries', code: 'VEND-HW-001', gstin: '32AAAHP5678L1Z6' },
      { name: 'MDF Boards Kerala', code: 'VEND-MDF-001', gstin: '32AAAMB9012M1Z7' }
    ]

    for (const vendor of vendors) {
      const result = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'vendor',
        entity_name: vendor.name,
        entity_code: vendor.code,
        smart_code: 'HERA.FURNITURE.MASTER.VENDOR.V1',
        metadata: {
          vendor_type: 'material_supplier',
          gstin: vendor.gstin,
          state_code: '32'
        }
      })

      if (result.id) {
        await universalApi.setDynamicField(result.id, 'gstin', vendor.gstin)
        await universalApi.setDynamicField(result.id, 'payment_terms', '45')
      }
    }

    // 8. Create Sample Employees with PF/ESI
    const employees = [
      { name: 'Rajesh Kumar', code: 'EMP-001', role: 'Production Manager', salary: 45000 },
      { name: 'Priya Nair', code: 'EMP-002', role: 'Quality Inspector', salary: 35000 },
      { name: 'Mohammed Ali', code: 'EMP-003', role: 'Carpenter', salary: 25000 },
      { name: 'Deepa Menon', code: 'EMP-004', role: 'Polisher', salary: 22000 }
    ]

    for (const emp of employees) {
      const result = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'employee',
        entity_name: emp.name,
        entity_code: emp.code,
        smart_code: 'HERA.FURNITURE.MASTER.EMPLOYEE.V1',
        metadata: {
          role: emp.role,
          department: 'Production',
          basic_salary: emp.salary
        }
      })

      if (result.id) {
        // Add PF/ESI details
        await universalApi.setDynamicField(result.id, 'pf_number', `KN/KOC/12345/${emp.code}`)
        await universalApi.setDynamicField(
          result.id,
          'esi_number',
          `31001234560000${emp.code.slice(-3)}`
        )
        await universalApi.setDynamicField(result.id, 'basic_salary', emp.salary.toString())
      }
    }

    console.log('✅ Furniture demo data created successfully')
    return { success: true }
  } catch (error) {
    console.error('Error creating furniture demo data:', error)
    return { success: false, error }
  }
}
