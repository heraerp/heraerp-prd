import { NextRequest } from 'next/server'
import { GET, POST, PUT } from '@/app/api/v1/crm-opportunities/route'

describe('CRM Opportunities API (Deals CRUD)', () => {
  describe('GET /api/v1/crm-opportunities', () => {
    it('returns demo opportunities with pipeline aggregates', async () => {
      const req = new NextRequest('http://localhost/api/v1/crm-opportunities?organization_id=org-demo')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.count).toBe(json.data.length)
      expect(typeof json.total_pipeline_value).toBe('number')
      expect(typeof json.weighted_pipeline).toBe('number')
    })
  })

  describe('POST /api/v1/crm-opportunities', () => {
    it('validates required fields', async () => {
      const req = new NextRequest('http://localhost/api/v1/crm-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it('creates a new opportunity (deal)', async () => {
      const payload = {
        organization_id: 'org-demo',
        name: 'Playwright Inc - POC',
        contact: 'Alex Tester',
        stage: 'qualification',
        value: 12000,
        close_date: '2024-12-31',
        probability: 40,
        description: 'Proof of concept'
      }
      const req = new NextRequest('http://localhost/api/v1/crm-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.entity_name).toBe(payload.name)
      expect(json.data.dynamic_fields.stage).toBe(payload.stage)
      expect(json.data.dynamic_fields.deal_value).toBe(payload.value)
    })
  })

  describe('PUT /api/v1/crm-opportunities', () => {
    it('requires an id to update', async () => {
      const req = new NextRequest('http://localhost/api/v1/crm-opportunities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'proposal' })
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it('updates stage/probability/next_action on a deal', async () => {
      const payload = { id: 123, stage: 'proposal', probability: 60, next_action: 'Schedule demo' }
      const req = new NextRequest('http://localhost/api/v1/crm-opportunities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const res = await PUT(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.id).toBe(payload.id)
      expect(json.data.dynamic_fields.stage).toBe(payload.stage)
      expect(json.data.dynamic_fields.probability).toBe(payload.probability)
      expect(json.data.dynamic_fields.next_action).toBe(payload.next_action)
    })
  })
})
