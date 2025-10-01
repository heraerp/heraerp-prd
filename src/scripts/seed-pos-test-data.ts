/**
 * Seed data script for POS integration testing
 * Creates test entities needed for POS transaction testing
 */

import { universalApi } from '@/lib/universal-api-v2'
import { heraCode } from '@/lib/smart-codes'

export interface PosTestData {
  serviceId: string
  customerId: string
  stylistId: string
  organizationId: string
}

export async function seedPosTestData(organizationId: string): Promise<PosTestData> {
  try {
    universalApi.setOrganizationId(organizationId)

    // Create test service entity with price $150
    const serviceResult = await universalApi.createEntity({
      entity_type: 'service',
      entity_name: 'Test Hair Color Service',
      entity_code: 'TEST-HAIR-COLOR',
      smart_code: heraCode('HERA.SALON.SVC.SERVICE.HAIR.COLOR.V1'),
      organization_id: organizationId,
      metadata: {
        price: 150,
        duration_minutes: 90,
        category: 'hair_color',
        service_type: 'standard',
        currency: 'USD',
        is_active: true
      }
    })

    if (!serviceResult.success || !serviceResult.data) {
      throw new Error('Failed to create test service')
    }

    const serviceId = serviceResult.data.id

    // Set additional service fields via dynamic data
    await universalApi.setDynamicField(serviceId, 'base_price', 150)
    await universalApi.setDynamicField(serviceId, 'category', 'hair_color')
    await universalApi.setDynamicField(serviceId, 'commission_rate', 35)
    await universalApi.setDynamicField(serviceId, 'requires_stylist', true)

    // Create test customer entity
    const customerResult = await universalApi.createEntity({
      entity_type: 'customer',
      entity_name: 'Test Customer Jane',
      entity_code: 'TEST-CUSTOMER-001',
      smart_code: heraCode('HERA.CRM.CUSTOMER.PROFILE.RETAIL.V1'),
      organization_id: organizationId,
      metadata: {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@test.com',
        phone: '+1-555-0123',
        vip_status: 'regular'
      }
    })

    if (!customerResult.success || !customerResult.data) {
      throw new Error('Failed to create test customer')
    }

    const customerId = customerResult.data.id

    // Set customer dynamic fields
    await universalApi.setDynamicField(customerId, 'email', 'jane.doe@test.com')
    await universalApi.setDynamicField(customerId, 'phone', '+1-555-0123')
    await universalApi.setDynamicField(customerId, 'total_visits', 5)
    await universalApi.setDynamicField(customerId, 'total_spent', 750)

    // Create test employee (stylist) entity
    const stylistResult = await universalApi.createEntity({
      entity_type: 'employee',
      entity_name: 'Test Stylist Maria',
      entity_code: 'TEST-STYLIST-001',
      smart_code: heraCode('HERA.HR.EMPLOYEE.PROFILE.STYLIST.V1'),
      organization_id: organizationId,
      metadata: {
        first_name: 'Maria',
        last_name: 'Garcia',
        role: 'stylist',
        employee_code: 'STY001',
        is_active: true
      }
    })

    if (!stylistResult.success || !stylistResult.data) {
      throw new Error('Failed to create test stylist')
    }

    const stylistId = stylistResult.data.id

    // Set stylist dynamic fields
    await universalApi.setDynamicField(stylistId, 'role', 'stylist')
    await universalApi.setDynamicField(stylistId, 'commission_rate', 35)
    await universalApi.setDynamicField(stylistId, 'specialties', 'hair_color,highlights,balayage')
    await universalApi.setDynamicField(stylistId, 'is_active', true)
    await universalApi.setDynamicField(stylistId, 'chair_number', 3)

    console.log('POS test data seeded successfully:', {
      serviceId,
      customerId,
      stylistId,
      organizationId
    })

    return {
      serviceId,
      customerId,
      stylistId,
      organizationId
    }
  } catch (error) {
    console.error('Error seeding POS test data:', error)
    throw error
  }
}

// Cleanup function for test data
export async function cleanupPosTestData(testData: PosTestData) {
  try {
    // In a real implementation, you would soft-delete or mark as inactive
    // For now, just log cleanup
    console.log('Cleaning up test data:', testData)

    // Mark entities as inactive
    await universalApi.setDynamicField(testData.serviceId, 'is_active', false)
    await universalApi.setDynamicField(testData.customerId, 'is_active', false)
    await universalApi.setDynamicField(testData.stylistId, 'is_active', false)
  } catch (error) {
    console.error('Error cleaning up POS test data:', error)
  }
}

// Run if executed directly
if (require.main === module) {
  const testOrgId = process.env.TEST_ORGANIZATION_ID || 'test-org-123'

  seedPosTestData(testOrgId)
    .then(data => {
      console.log('Test data created:', data)
      process.exit(0)
    })
    .catch(error => {
      console.error('Failed to seed test data:', error)
      process.exit(1)
    })
}
