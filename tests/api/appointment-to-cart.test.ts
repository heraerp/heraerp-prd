import { describe, it, expect, beforeEach } from '@jest/globals'

describe('Appointment to Cart API Flow', () => {
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  const baseUrl = 'http://localhost:3000'
  
  describe('GET /api/v1/salon/appointments/:id', () => {
    it('should fetch appointment with expanded data', async () => {
      const appointmentId = 'apt_123'
      const response = await fetch(
        `${baseUrl}/api/v1/salon/appointments/${appointmentId}?` +
        `organization_id=${organizationId}&` +
        `expand=planned_services,customer,staff,deposits,packages`
      )
      
      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.appointment).toMatchObject({
        id: expect.any(String),
        code: expect.any(String),
        smart_code: expect.stringMatching(/HERA\.SALON\.APPT/),
        organization_id: organizationId,
        status: expect.stringMatching(/SCHEDULED|IN_PROGRESS/),
        planned_services: expect.arrayContaining([
          expect.objectContaining({
            appointment_line_id: expect.any(String),
            entity_id: expect.any(String),
            name: expect.any(String),
            duration_min: expect.any(Number),
            price: expect.any(Number),
            assigned_staff: expect.any(Array)
          })
        ])
      })
    })
    
    it('should return 404 for non-existent appointment', async () => {
      const response = await fetch(
        `${baseUrl}/api/v1/salon/appointments/non-existent?organization_id=${organizationId}`
      )
      
      expect(response.status).toBe(404)
    })
    
    it('should return 400 without organization_id', async () => {
      const response = await fetch(
        `${baseUrl}/api/v1/salon/appointments/apt_123`
      )
      
      expect(response.status).toBe(400)
    })
  })
  
  describe('POST /api/v1/salon/pos/carts', () => {
    it('should create cart from appointment', async () => {
      const appointmentId = 'apt_123'
      const idempotencyKey = `test-cart-${Date.now()}`
      
      const response = await fetch(`${baseUrl}/api/v1/salon/pos/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          organization_id: organizationId
        })
      })
      
      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.cart).toMatchObject({
        id: expect.any(String),
        smart_code: 'HERA.SALON.POS.CART.ACTIVE.V1',
        organization_id: organizationId,
        appointment_id: appointmentId,
        relationships: expect.objectContaining({
          ORIGINATES_FROM: appointmentId,
          BILLS_TO: expect.any(String)
        }),
        lines: expect.any(Array),
        pricing_summary: expect.objectContaining({
          subtotal: expect.any(Number),
          tax: expect.any(Number),
          total: expect.any(Number)
        })
      })
      
      // Test line mapping
      data.cart.lines.forEach((line: any) => {
        expect(line).toMatchObject({
          line_id: expect.any(String),
          entity_ref: expect.any(String),
          name: expect.any(String),
          qty: expect.any(Number),
          unit_price: expect.any(Number),
          staff_split: expect.any(Array),
          dynamic: expect.objectContaining({
            appointment_line_id: expect.any(String),
            duration_min: expect.any(Number),
            source: 'APPOINTMENT'
          })
        })
      })
    })
    
    it('should respect idempotency key', async () => {
      const appointmentId = 'apt_123'
      const idempotencyKey = `test-idempotent-${Date.now()}`
      
      // First request
      const response1 = await fetch(`${baseUrl}/api/v1/salon/pos/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          organization_id: organizationId
        })
      })
      
      const data1 = await response1.json()
      const cartId1 = data1.cart.id
      
      // Second request with same idempotency key
      const response2 = await fetch(`${baseUrl}/api/v1/salon/pos/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          organization_id: organizationId
        })
      })
      
      const data2 = await response2.json()
      const cartId2 = data2.cart.id
      
      // Should return same cart ID
      expect(cartId2).toBe(cartId1)
    })
    
    it('should reject cancelled appointments', async () => {
      const cancelledAppointmentId = 'apt_cancelled'
      
      const response = await fetch(`${baseUrl}/api/v1/salon/pos/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointment_id: cancelledAppointmentId,
          organization_id: organizationId
        })
      })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/Cannot create cart for appointment in CANCELLED status/)
    })
  })
  
  describe('GET /api/v1/salon/pos/carts/:id', () => {
    it('should retrieve cart with full details', async () => {
      const cartId = 'cart_987'
      
      const response = await fetch(
        `${baseUrl}/api/v1/salon/pos/carts/${cartId}?organization_id=${organizationId}`
      )
      
      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.cart).toMatchObject({
        id: cartId,
        code: expect.any(String),
        smart_code: expect.any(String),
        organization_id: organizationId,
        status: 'ACTIVE',
        relationships: expect.any(Object),
        lines: expect.any(Array),
        pricing_summary: expect.objectContaining({
          subtotal: expect.any(Number),
          discounts: expect.any(Number),
          tax: expect.any(Number),
          tip: expect.any(Number),
          total: expect.any(Number)
        }),
        metadata: expect.objectContaining({
          customer_id: expect.any(String),
          stylist_id: expect.any(String),
          created_at: expect.any(String),
          updated_at: expect.any(String)
        })
      })
    })
    
    it('should include customer details in BILLS_TO relationship', async () => {
      const cartId = 'cart_987'
      
      const response = await fetch(
        `${baseUrl}/api/v1/salon/pos/carts/${cartId}?organization_id=${organizationId}`
      )
      
      const data = await response.json()
      
      expect(data.cart.relationships.BILLS_TO_DETAILS).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        code: expect.any(String)
      })
    })
  })
})