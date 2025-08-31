import { test, expect } from '../../fixtures/api-fixtures'
import { ENTITY_TYPES, SMART_CODES, TEST_DATA } from '../../helpers/test-constants'

test.describe('Ice Cream Module - Entity CRUD Operations', () => {
  test.describe('Customer Management', () => {
    let customerId: string
    
    test('should create a new ice cream customer', async ({ supabaseClient, organizationId, testIds }) => {
      const customerData = {
        ...TEST_DATA.customer,
        organization_id: organizationId,
        entity_code: `CUST-${testIds.uniqueId}`,
        entity_name: `${TEST_DATA.customer.entity_name} ${testIds.uniqueId}`,
        smart_code: SMART_CODES.CUSTOMER_RETAIL,
      }
      
      const { data, error, status } = await supabaseClient.insert('core_entities', customerData)
      
      expect(error).toBeNull()
      expect(status).toBe(201)
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        entity_type: ENTITY_TYPES.CUSTOMER,
        organization_id: organizationId,
      })
      
      customerId = data[0].id
    })
    
    test('should update customer credit limit via dynamic data', async ({ supabaseClient, organizationId }) => {
      expect(customerId).toBeDefined()
      
      const dynamicData = {
        organization_id: organizationId,
        entity_id: customerId,
        field_name: 'credit_limit',
        field_value_number: 75000,
        smart_code: 'HERA.CRM.CUST.DYN.CREDIT.v1',
      }
      
      const { error, status } = await supabaseClient.insert('core_dynamic_data', dynamicData)
      
      expect(error).toBeNull()
      expect(status).toBe(201)
    })
    
    test('should query customer with dynamic data', async ({ supabaseClient, organizationId }) => {
      // Query customer
      const { data: customers } = await supabaseClient.query('core_entities', {
        id: customerId,
        organization_id: organizationId,
      })
      
      expect(customers).toHaveLength(1)
      
      // Query dynamic data
      const { data: dynamicData } = await supabaseClient.query('core_dynamic_data', {
        entity_id: customerId,
        field_name: 'credit_limit',
      })
      
      expect(dynamicData).toHaveLength(1)
      expect(dynamicData[0].field_value_number).toBe(75000)
    })
    
    test('should delete test customer', async ({ supabaseClient }) => {
      expect(customerId).toBeDefined()
      
      const { error, status } = await supabaseClient.delete('core_entities', customerId)
      
      expect(error).toBeNull()
      expect(status).toBe(204)
    })
  })
  
  test.describe('Product Management', () => {
    let productId: string
    
    test('should create ice cream product with temperature requirements', async ({ supabaseClient, organizationId, testIds }) => {
      const productData = {
        ...TEST_DATA.product,
        organization_id: organizationId,
        entity_code: `PROD-${testIds.uniqueId}`,
        entity_name: `${TEST_DATA.product.entity_name} ${testIds.uniqueId}`,
        smart_code: SMART_CODES.PRODUCT_ICECREAM,
      }
      
      const { data, error } = await supabaseClient.insert('core_entities', productData)
      
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      productId = data[0].id
      
      // Add temperature requirements as dynamic data
      const tempRequirement = {
        organization_id: organizationId,
        entity_id: productId,
        field_name: 'storage_temperature',
        field_value_number: -18,
        field_value_text: 'Freezer storage required',
        smart_code: 'HERA.INV.PROD.DYN.TEMP.v1',
      }
      
      const { error: tempError } = await supabaseClient.insert('core_dynamic_data', tempRequirement)
      expect(tempError).toBeNull()
    })
    
    test('should create product batch tracking relationship', async ({ supabaseClient, organizationId }) => {
      const relationship = {
        organization_id: organizationId,
        from_entity_id: productId,
        to_entity_id: productId, // Self-reference for batch tracking
        relationship_type: 'requires_batch_tracking',
        smart_code: 'HERA.INV.REL.BATCH.v1',
        metadata: {
          batch_size: 100,
          expiry_days: 180,
        },
      }
      
      const { error, status } = await supabaseClient.insert('core_relationships', relationship)
      
      expect(error).toBeNull()
      expect(status).toBe(201)
    })
    
    test.cleanup(async ({ supabaseClient }) => {
      if (productId) {
        await supabaseClient.delete('core_entities', productId)
      }
    })
  })
  
  test.describe('Recipe Management', () => {
    let recipeId: string
    let milkId: string
    let creamId: string
    
    test('should create recipe with ingredients', async ({ supabaseClient, organizationId, testIds }) => {
      // Create recipe entity
      const recipeData = {
        ...TEST_DATA.recipe,
        organization_id: organizationId,
        entity_code: `RECIPE-${testIds.uniqueId}`,
        entity_name: `${TEST_DATA.recipe.entity_name} ${testIds.uniqueId}`,
        smart_code: SMART_CODES.RECIPE_VANILLA,
      }
      
      const { data: recipeResult } = await supabaseClient.insert('core_entities', recipeData)
      recipeId = recipeResult[0].id
      
      // Create ingredient entities
      const milkData = {
        organization_id: organizationId,
        entity_type: 'raw_material',
        entity_name: 'Fresh Milk',
        entity_code: `MILK-${testIds.uniqueId}`,
        smart_code: 'HERA.INV.RAW.ENT.DAIRY.v1',
      }
      
      const creamData = {
        organization_id: organizationId,
        entity_type: 'raw_material',
        entity_name: 'Heavy Cream',
        entity_code: `CREAM-${testIds.uniqueId}`,
        smart_code: 'HERA.INV.RAW.ENT.DAIRY.v1',
      }
      
      const { data: milkResult } = await supabaseClient.insert('core_entities', milkData)
      const { data: creamResult } = await supabaseClient.insert('core_entities', creamData)
      
      milkId = milkResult[0].id
      creamId = creamResult[0].id
      
      // Create recipe-ingredient relationships
      const relationships = [
        {
          organization_id: organizationId,
          from_entity_id: recipeId,
          to_entity_id: milkId,
          relationship_type: 'recipe_ingredient',
          smart_code: 'HERA.MFG.REL.INGREDIENT.v1',
          metadata: { quantity: 120, unit: 'liters' },
        },
        {
          organization_id: organizationId,
          from_entity_id: recipeId,
          to_entity_id: creamId,
          relationship_type: 'recipe_ingredient',
          smart_code: 'HERA.MFG.REL.INGREDIENT.v1',
          metadata: { quantity: 40, unit: 'liters' },
        },
      ]
      
      for (const rel of relationships) {
        const { error } = await supabaseClient.insert('core_relationships', rel)
        expect(error).toBeNull()
      }
    })
    
    test('should query recipe with ingredients', async ({ supabaseClient, organizationId }) => {
      // Query recipe relationships
      const { data: relationships } = await supabaseClient.query('core_relationships', {
        from_entity_id: recipeId,
        relationship_type: 'recipe_ingredient',
      })
      
      expect(relationships).toHaveLength(2)
      expect(relationships[0].metadata.quantity).toBeDefined()
    })
    
    test.cleanup(async ({ supabaseClient }) => {
      // Clean up in reverse order
      if (recipeId) await supabaseClient.delete('core_entities', recipeId)
      if (milkId) await supabaseClient.delete('core_entities', milkId)
      if (creamId) await supabaseClient.delete('core_entities', creamId)
    })
  })
})