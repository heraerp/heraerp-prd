import { describe, it, expect } from '@jest/globals'

const BASE_URL = process.env.HERA_BASE_URL || 'http://localhost:3000'
const ORG = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

describe('API v2 – Salon Appointment Events (guardrail smoke)', () => {
  it('rejects missing organization_id', async () => {
    const res = await fetch(`${BASE_URL}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('rejects invalid smart_code pattern', async () => {
    const res = await fetch(`${BASE_URL}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: ORG,
        smart_code: 'INVALID.CODE',
        transaction_type: 'appointment',
        transaction_date: new Date().toISOString(),
        lines: []
      })
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('rejects when lines are missing', async () => {
    const res = await fetch(`${BASE_URL}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: ORG,
        smart_code: 'HERA.SALON.APPT.BOOK.CREATE.v1',
        transaction_type: 'appointment',
        transaction_date: new Date().toISOString()
      })
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})

// Optional happy path tests – require real IDs and a running DB/proc.
// Set RUN_V2_API_TESTS=true and provide V2_CUSTOMER_ID, V2_STYLIST_ID, V2_SERVICE_ID.
const RUN = process.env.RUN_V2_API_TESTS === 'true'
const CUSTOMER = process.env.V2_CUSTOMER_ID
const STYLIST = process.env.V2_STYLIST_ID
const SERVICE = process.env.V2_SERVICE_ID

(RUN ? describe : describe.skip)('API v2 – Salon Appointment Events (happy path)', () => {
  it('creates an appointment (book)', async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 90 * 60 * 1000).toISOString()

    const res = await fetch(`${BASE_URL}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: ORG,
        smart_code: 'HERA.SALON.APPT.BOOK.CREATE.v1',
        transaction_type: 'appointment',
        transaction_date: new Date().toISOString(),
        source_entity_id: CUSTOMER,
        target_entity_id: STYLIST,
        business_context: {
          start_time: start,
          end_time: end,
          status: 'booked',
          stylist_id: STYLIST,
          service_ids: [SERVICE]
        },
        lines: [
          {
            line_type: 'service',
            smart_code: 'HERA.SALON.SERVICE.HAIRCUT.LADIES.v1',
            entity_id: SERVICE,
            quantity: 1,
            unit_amount: 10
          }
        ]
      })
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.transaction_id).toBeDefined()
  })
})

