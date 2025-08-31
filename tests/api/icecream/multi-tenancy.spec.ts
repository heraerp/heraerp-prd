import { test, expect } from '../../fixtures/api-fixtures'
import { ENTITY_TYPES, TRANSACTION_TYPES, SALON_ORG_ID } from '../../helpers/test-constants'

test.describe('Multi-Tenancy Isolation Tests', () => {
  let iceCreanEntityId: string
  let salonEntityId: string
  
  test('should prevent cross-organization entity access', async ({ supabaseClient, organizationId, testIds }) => {
    // Create entity in ice cream org
    const iceCreanEntity = await supabaseClient.insert('core_entities', {
      organization_id: organizationId,
      entity_type: ENTITY_TYPES.CUSTOMER,
      entity_name: `Ice Cream Customer ${testIds.uniqueId}`,
      entity_code: `ICE-${testIds.uniqueId}`,
    })
    
    iceCreanEntityId = iceCreanEntity.data[0].id
    
    // Create entity in salon org
    const salonEntity = await supabaseClient.insert('core_entities', {
      organization_id: SALON_ORG_ID,
      entity_type: ENTITY_TYPES.CUSTOMER,
      entity_name: `Salon Customer ${testIds.uniqueId}`,
      entity_code: `SALON-${testIds.uniqueId}`,
    })
    
    salonEntityId = salonEntity.data[0].id
    
    // Query ice cream org - should only see ice cream entities
    const { data: iceCreanData } = await supabaseClient.query('core_entities', {
      organization_id: organizationId,
      entity_type: ENTITY_TYPES.CUSTOMER,
    })
    
    const iceCreanEntityCodes = iceCreanData.map(e => e.entity_code)
    expect(iceCreanEntityCodes).toContain(`ICE-${testIds.uniqueId}`)
    expect(iceCreanEntityCodes).not.toContain(`SALON-${testIds.uniqueId}`)
    
    // Query salon org - should only see salon entities
    const { data: salonData } = await supabaseClient.query('core_entities', {
      organization_id: SALON_ORG_ID,
      entity_type: ENTITY_TYPES.CUSTOMER,
    })
    
    const salonEntityCodes = salonData.map(e => e.entity_code)
    expect(salonEntityCodes).toContain(`SALON-${testIds.uniqueId}`)
    expect(salonEntityCodes).not.toContain(`ICE-${testIds.uniqueId}`)
  })
  
  test('should prevent cross-organization transaction access', async ({ supabaseClient, organizationId, testIds }) => {
    // Create transaction in ice cream org
    const iceCreanTxn = await supabaseClient.insert('universal_transactions', {
      organization_id: organizationId,
      transaction_type: TRANSACTION_TYPES.POS_SALE,
      transaction_code: `ICE-TXN-${testIds.uniqueId}`,
      transaction_date: new Date().toISOString(),
      total_amount: 1000,
    })
    
    // Create transaction in salon org
    const salonTxn = await supabaseClient.insert('universal_transactions', {
      organization_id: SALON_ORG_ID,
      transaction_type: TRANSACTION_TYPES.POS_SALE,
      transaction_code: `SALON-TXN-${testIds.uniqueId}`,
      transaction_date: new Date().toISOString(),
      total_amount: 2000,
    })
    
    // Query transactions by org
    const { data: iceCreanTxns } = await supabaseClient.query('universal_transactions', {
      organization_id: organizationId,
    })
    
    const iceCreanTxnCodes = iceCreanTxns.map(t => t.transaction_code)
    expect(iceCreanTxnCodes).toContain(`ICE-TXN-${testIds.uniqueId}`)
    expect(iceCreanTxnCodes).not.toContain(`SALON-TXN-${testIds.uniqueId}`)
    
    // Cleanup
    await supabaseClient.delete('universal_transactions', iceCreanTxn.data[0].id)
    await supabaseClient.delete('universal_transactions', salonTxn.data[0].id)
  })
  
  test('should prevent cross-organization relationship access', async ({ supabaseClient, organizationId, testIds }) => {
    // Create relationship in ice cream org
    const iceCreanRel = await supabaseClient.insert('core_relationships', {
      organization_id: organizationId,
      from_entity_id: iceCreanEntityId,
      to_entity_id: iceCreanEntityId,
      relationship_type: 'self_reference',
      smart_code: `HERA.TEST.REL.ICE.${testIds.uniqueId}`,
    })
    
    // Query relationships - should only see own org
    const { data: relationships } = await supabaseClient.query('core_relationships', {
      organization_id: organizationId,
    })
    
    const relSmartCodes = relationships.map(r => r.smart_code)
    expect(relSmartCodes).toContain(`HERA.TEST.REL.ICE.${testIds.uniqueId}`)
    
    // Cleanup
    await supabaseClient.delete('core_relationships', iceCreanRel.data[0].id)
  })
  
  test('should prevent cross-organization dynamic data access', async ({ supabaseClient, organizationId, testIds }) => {
    // Add dynamic data to ice cream entity
    const iceCreanDyn = await supabaseClient.insert('core_dynamic_data', {
      organization_id: organizationId,
      entity_id: iceCreanEntityId,
      field_name: 'test_field',
      field_value_text: `Ice Cream Data ${testIds.uniqueId}`,
    })
    
    // Add dynamic data to salon entity
    const salonDyn = await supabaseClient.insert('core_dynamic_data', {
      organization_id: SALON_ORG_ID,
      entity_id: salonEntityId,
      field_name: 'test_field',
      field_value_text: `Salon Data ${testIds.uniqueId}`,
    })
    
    // Query dynamic data by org
    const { data: iceCreanDynData } = await supabaseClient.query('core_dynamic_data', {
      organization_id: organizationId,
    })
    
    const iceCreanValues = iceCreanDynData.map(d => d.field_value_text)
    expect(iceCreanValues).toContain(`Ice Cream Data ${testIds.uniqueId}`)
    expect(iceCreanValues).not.toContain(`Salon Data ${testIds.uniqueId}`)
    
    // Cleanup
    await supabaseClient.delete('core_dynamic_data', iceCreanDyn.data[0].id)
    await supabaseClient.delete('core_dynamic_data', salonDyn.data[0].id)
  })
  
  test.afterAll(async ({ supabaseClient }) => {
    // Clean up test entities
    if (iceCreanEntityId) await supabaseClient.delete('core_entities', iceCreanEntityId)
    if (salonEntityId) await supabaseClient.delete('core_entities', salonEntityId)
  })
})