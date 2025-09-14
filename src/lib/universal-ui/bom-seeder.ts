/**
 * BOM Seeder - Creates demo furniture BOM data in the universal tables
 * Demonstrates how complex manufacturing data fits in the 6-table schema
 */

import { universalApi } from '@/lib/universal-api'

export interface BOMSeedResult {
  products: any[]
  components: any[]
  relationships: any[]
  transactions: any[]
  success: boolean
  error?: string
}

export class BOMSeeder {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  async seedBOMData(): Promise<BOMSeedResult> {
    try {
      universalApi.setOrganizationId(this.organizationId)

      // 1. Create workflow status entities
      const statuses = await this.createWorkflowStatuses()

      // 2. Create raw material components
      const rawMaterials = await this.createRawMaterials()

      // 3. Create sub-assembly components
      const subAssemblies = await this.createSubAssemblies(rawMaterials)

      // 4. Create finished products with complete BOMs
      const products = await this.createProducts(subAssemblies, rawMaterials)

      // 5. Create revision history transactions
      const transactions = await this.createRevisionHistory(products)

      return {
        products,
        components: [...rawMaterials, ...subAssemblies],
        relationships: [], // Would be populated from relationship creation
        transactions,
        success: true
      }
    } catch (error: any) {
      console.error('BOM seeding failed:', error)
      return {
        products: [],
        components: [],
        relationships: [],
        transactions: [],
        success: false,
        error: error.message
      }
    }
  }

  private async createWorkflowStatuses() {
    const statuses = [
      { code: 'DRAFT', name: 'Draft', color: '#6B7280' },
      { code: 'IN_REVIEW', name: 'In Review', color: '#F59E0B' },
      { code: 'RELEASED', name: 'Released', color: '#10B981' },
      { code: 'SUPERSEDED', name: 'Superseded', color: '#EF4444' },
      { code: 'ARCHIVED', name: 'Archived', color: '#6B7280' }
    ]

    const created = []
    for (const status of statuses) {
      const result = await universalApi.createEntity({
        entity_type: 'workflow_status',
        entity_name: `${status.name} Status`,
        entity_code: `STATUS-${status.code}`,
        smart_code: `HERA.WORKFLOW.STATUS.${status.code}.v1`,
        metadata: {
          color: status.color,
          sequence: statuses.indexOf(status) + 1
        }
      })
      created.push(result.data)
    }
    return created
  }

  private async createRawMaterials() {
    const materials = [
      {
        name: 'Oak Wood Panel',
        code: 'MAT-OAK-001',
        unit_cost: 45.00,
        unit_of_measure: 'sqft',
        lead_time_days: 7,
        supplier: 'Premium Wood Suppliers'
      },
      {
        name: 'Pine Wood Panel',
        code: 'MAT-PINE-001',
        unit_cost: 25.00,
        unit_of_measure: 'sqft',
        lead_time_days: 5,
        supplier: 'Budget Wood Co'
      },
      {
        name: 'Steel Bracket',
        code: 'HW-BRACKET-001',
        unit_cost: 2.50,
        unit_of_measure: 'piece',
        lead_time_days: 3,
        supplier: 'Industrial Hardware Inc'
      },
      {
        name: 'Wood Screw 2"',
        code: 'HW-SCREW-002',
        unit_cost: 0.10,
        unit_of_measure: 'piece',
        lead_time_days: 1,
        supplier: 'FastFix Hardware'
      },
      {
        name: 'Wood Glue',
        code: 'ADH-GLUE-001',
        unit_cost: 8.00,
        unit_of_measure: 'bottle',
        lead_time_days: 2,
        supplier: 'Adhesive Solutions'
      },
      {
        name: 'Sandpaper 120 Grit',
        code: 'FIN-SAND-120',
        unit_cost: 1.50,
        unit_of_measure: 'sheet',
        lead_time_days: 1,
        supplier: 'Finishing Supplies Ltd'
      },
      {
        name: 'Wood Stain - Walnut',
        code: 'FIN-STAIN-WAL',
        unit_cost: 15.00,
        unit_of_measure: 'quart',
        lead_time_days: 3,
        supplier: 'ColorCraft Finishes'
      },
      {
        name: 'Polyurethane Finish',
        code: 'FIN-POLY-001',
        unit_cost: 20.00,
        unit_of_measure: 'quart',
        lead_time_days: 3,
        supplier: 'ProFinish Corp'
      }
    ]

    const created = []
    for (const material of materials) {
      const result = await universalApi.createEntity({
        entity_type: 'component',
        entity_name: material.name,
        entity_code: material.code,
        smart_code: 'HERA.FURN.BOM.COMPONENT.RAW_MATERIAL.v1',
        metadata: {
          unit_cost: material.unit_cost,
          unit_of_measure: material.unit_of_measure,
          lead_time_days: material.lead_time_days,
          supplier_name: material.supplier,
          minimum_order_quantity: 10,
          reorder_point: 50,
          component_type: 'raw_material'
        }
      })
      created.push(result.data)
    }
    return created
  }

  private async createSubAssemblies(rawMaterials: any[]) {
    const subAssemblies = [
      {
        name: 'Table Leg Assembly',
        code: 'SA-LEG-001',
        components: [
          { material: 'Oak Wood Panel', quantity: 2 },
          { material: 'Wood Screw 2"', quantity: 8 },
          { material: 'Wood Glue', quantity: 0.25 }
        ]
      },
      {
        name: 'Drawer Box',
        code: 'SA-DRAWER-001',
        components: [
          { material: 'Pine Wood Panel', quantity: 5 },
          { material: 'Wood Screw 2"', quantity: 16 },
          { material: 'Wood Glue', quantity: 0.5 }
        ]
      },
      {
        name: 'Cabinet Door',
        code: 'SA-DOOR-001',
        components: [
          { material: 'Oak Wood Panel', quantity: 4 },
          { material: 'Steel Bracket', quantity: 2 }
        ]
      }
    ]

    const created = []
    for (const assembly of subAssemblies) {
      // Create sub-assembly entity
      const result = await universalApi.createEntity({
        entity_type: 'component',
        entity_name: assembly.name,
        entity_code: assembly.code,
        smart_code: 'HERA.FURN.BOM.COMPONENT.SUB_ASSEMBLY.v1',
        metadata: {
          unit_cost: 0, // Will be calculated from components
          unit_of_measure: 'assembly',
          lead_time_days: 2,
          component_type: 'sub_assembly',
          labor_hours: 1.5,
          labor_cost_per_hour: 25.00
        }
      })
      
      // Create relationships to raw materials
      for (const comp of assembly.components) {
        const material = rawMaterials.find(m => m.entity_name === comp.material)
        if (material) {
          await universalApi.createRelationship({
            from_entity_id: result.data.id,
            to_entity_id: material.id,
            relationship_type: 'has_component',
            smart_code: 'HERA.FURN.BOM.REL.COMPONENT.v1',
            metadata: {
              quantity: comp.quantity,
              unit_of_measure: material.metadata.unit_of_measure
            }
          })
        }
      }
      
      created.push(result.data)
    }
    return created
  }

  private async createProducts(subAssemblies: any[], rawMaterials: any[]) {
    const products = [
      {
        name: 'Executive Desk',
        code: 'PROD-DESK-001',
        revision: 'B',
        description: 'Premium executive desk with drawers',
        components: [
          { name: 'Oak Wood Panel', quantity: 20, type: 'raw' },
          { name: 'Drawer Box', quantity: 3, type: 'sub' },
          { name: 'Steel Bracket', quantity: 8, type: 'raw' },
          { name: 'Wood Screw 2"', quantity: 48, type: 'raw' },
          { name: 'Wood Stain - Walnut', quantity: 0.5, type: 'raw' },
          { name: 'Polyurethane Finish', quantity: 0.5, type: 'raw' }
        ]
      },
      {
        name: 'Conference Table',
        code: 'PROD-TABLE-001',
        revision: 'A',
        description: 'Large conference table for 8 people',
        components: [
          { name: 'Oak Wood Panel', quantity: 30, type: 'raw' },
          { name: 'Table Leg Assembly', quantity: 4, type: 'sub' },
          { name: 'Steel Bracket', quantity: 12, type: 'raw' },
          { name: 'Wood Screw 2"', quantity: 64, type: 'raw' },
          { name: 'Wood Stain - Walnut', quantity: 1, type: 'raw' },
          { name: 'Polyurethane Finish', quantity: 1, type: 'raw' }
        ]
      },
      {
        name: 'Storage Cabinet',
        code: 'PROD-CAB-001',
        revision: 'C',
        description: 'Multi-purpose storage cabinet with doors',
        components: [
          { name: 'Pine Wood Panel', quantity: 25, type: 'raw' },
          { name: 'Cabinet Door', quantity: 2, type: 'sub' },
          { name: 'Drawer Box', quantity: 2, type: 'sub' },
          { name: 'Steel Bracket', quantity: 16, type: 'raw' },
          { name: 'Wood Screw 2"', quantity: 80, type: 'raw' },
          { name: 'Polyurethane Finish', quantity: 0.75, type: 'raw' }
        ]
      }
    ]

    const created = []
    for (const product of products) {
      // Create product entity
      const result = await universalApi.createEntity({
        entity_type: 'product',
        entity_name: product.name,
        entity_code: product.code,
        smart_code: 'HERA.FURN.BOM.ITEM.PRODUCT.v1',
        metadata: {
          description: product.description,
          revision: product.revision,
          unit_cost: 0, // Will be calculated
          retail_price: 0, // Will be calculated with markup
          lead_time_days: 14,
          minimum_order_quantity: 1,
          product_category: 'office_furniture',
          has_bom: true
        }
      })
      
      // Create component relationships
      let totalCost = 0
      for (const comp of product.components) {
        const componentList = comp.type === 'sub' ? subAssemblies : rawMaterials
        const component = componentList.find(c => c.entity_name === comp.name)
        
        if (component) {
          await universalApi.createRelationship({
            from_entity_id: result.data.id,
            to_entity_id: component.id,
            relationship_type: 'has_component',
            smart_code: 'HERA.FURN.BOM.REL.COMPONENT.v1',
            metadata: {
              quantity: comp.quantity,
              unit_of_measure: component.metadata.unit_of_measure,
              component_type: comp.type
            }
          })
          
          // Calculate cost
          const unitCost = component.metadata.unit_cost || 0
          totalCost += unitCost * comp.quantity
        }
      }
      
      // Assign status (Released)
      const statusEntity = await universalApi.getEntityBySmartCode('HERA.WORKFLOW.STATUS.RELEASED.v1')
      if (statusEntity.data) {
        await universalApi.createRelationship({
          from_entity_id: result.data.id,
          to_entity_id: statusEntity.data.id,
          relationship_type: 'has_status',
          smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1'
        })
      }
      
      created.push(result.data)
    }
    return created
  }

  private async createRevisionHistory(products: any[]) {
    const transactions = []
    
    for (const product of products) {
      // Initial creation
      const createTxn = await universalApi.createTransaction({
        transaction_type: 'bom_revision',
        reference_entity_id: product.id,
        smart_code: 'HERA.FURN.BOM.TXN.CREATE.v1',
        transaction_code: `BOM-${Date.now()}-CREATE`,
        description: 'Initial BOM creation',
        metadata: {
          action: 'create',
          revision: 'A',
          user_name: 'John Smith',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
      transactions.push(createTxn.data)
      
      // Revision update
      if (product.metadata.revision !== 'A') {
        const revisionTxn = await universalApi.createTransaction({
          transaction_type: 'bom_revision',
          reference_entity_id: product.id,
          smart_code: 'HERA.FURN.BOM.TXN.REVISE.v1',
          transaction_code: `BOM-${Date.now()}-REVISE`,
          description: 'Updated component quantities',
          metadata: {
            action: 'revise',
            revision: product.metadata.revision,
            previous_revision: 'A',
            user_name: 'Jane Doe',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
        transactions.push(revisionTxn.data)
      }
      
      // Release
      const releaseTxn = await universalApi.createTransaction({
        transaction_type: 'bom_revision',
        reference_entity_id: product.id,
        smart_code: 'HERA.FURN.BOM.TXN.RELEASE.v1',
        transaction_code: `BOM-${Date.now()}-RELEASE`,
        description: 'Released for production',
        metadata: {
          action: 'release',
          revision: product.metadata.revision,
          user_name: 'Mike Johnson',
          approved_by: 'Sarah Wilson',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
      transactions.push(releaseTxn.data)
    }
    
    return transactions
  }

  async cleanupBOMData() {
    try {
      // In a real implementation, this would delete the seeded data
      // For safety, we'll just log what would be deleted
      console.log('Cleanup would remove BOM demo data for organization:', this.organizationId)
      return { success: true }
    } catch (error: any) {
      console.error('Cleanup failed:', error)
      return { success: false, error: error.message }
    }
  }
}