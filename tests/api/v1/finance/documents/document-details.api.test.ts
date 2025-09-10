/**
 * Tests for HERA Financial Document Details API
 * Tests retrieving detailed document with audit trail
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createMockSupabase, mockSuccessfulQuery, mockErrorQuery, createMockSupabaseChain, type MockChain } from '@/test/helpers'

describe('Financial Document Details API', () => {
  let mockSupabase: any
  let mockChain: MockChain

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up mocks using helper
    const mocks = createMockSupabase()
    mockSupabase = mocks.mockSupabase
    mockChain = mocks.mockChain
    
    // Mock the createClient to return our mock
    const { createClient } = require('@supabase/supabase-js')
    createClient.mockReturnValue(mockSupabase)
  })

  describe('GET - Document Details', () => {
    const mockDocument = {
      id: 'tx-123',
      transaction_code: 'JE-2024-001',
      transaction_type: 'journal_entry',
      transaction_date: '2024-01-15',
      total_amount: 5000,
      transaction_currency_code: 'USD',
      description: 'Monthly rent payment',
      reference_number: 'REF-001',
      smart_code: 'HERA.FIN.GL.JE.v1',
      created_by: 'user-123',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      fiscal_year: 2024,
      fiscal_period: '01',
      metadata: {
        status: 'posted',
        posted_at: '2024-01-15T10:30:00Z',
        notes: 'Regular monthly rent'
      },
      source_entity: {
        id: 'entity-123',
        entity_name: 'Main Office',
        entity_code: 'MAIN-001',
        entity_type: 'cost_center'
      },
      target_entity: {
        id: 'entity-456',
        entity_name: 'Property Management Co',
        entity_code: 'VENDOR-001',
        entity_type: 'vendor'
      },
      universal_transaction_lines: [
        {
          id: 'line-1',
          line_number: 1,
          entity_id: 'gl-rent-expense',
          line_type: 'debit',
          description: 'Office rent expense',
          quantity: 1,
          unit_amount: 5000,
          line_amount: 5000,
          discount_amount: 0,
          tax_amount: 0,
          metadata: {
            account_code: '6100',
            account_name: 'Rent Expense',
            cost_center: 'MAIN-001',
            debit: 5000,
            credit: 0
          },
          smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'line-2',
          line_number: 2,
          entity_id: 'gl-cash',
          line_type: 'credit',
          description: 'Cash payment',
          quantity: 1,
          unit_amount: 5000,
          line_amount: -5000,
          discount_amount: 0,
          tax_amount: 0,
          metadata: {
            account_code: '1000',
            account_name: 'Cash',
            debit: 0,
            credit: 5000
          },
          smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ]
    }

    const mockAccounts = [
      {
        id: 'gl-rent-expense',
        entity_code: '6100',
        entity_name: 'Rent Expense',
        metadata: { account_type: 'expense' }
      },
      {
        id: 'gl-cash',
        entity_code: '1000',
        entity_name: 'Cash',
        metadata: { account_type: 'asset' }
      }
    ]

    const mockAuditTrail = [
      {
        id: 'audit-1',
        transaction_type: 'audit_log',
        transaction_code: 'AUDIT-001',
        created_at: '2024-01-15T10:30:00Z',
        metadata: {
          action: 'posted',
          user: 'John Doe',
          changes: { status: { from: 'draft', to: 'posted' } }
        }
      }
    ]

    it('should fetch document details with all related data', async () => {
      // Set up different chains for different tables
      const transactionsChain = createMockSupabaseChain()
      const entitiesChain = createMockSupabaseChain()
      const auditChain = createMockSupabaseChain()
      
      // Mock successful queries
      mockSuccessfulQuery(transactionsChain, mockDocument)
      entitiesChain.eq.mockResolvedValue({ data: mockAccounts, error: null })
      auditChain.order.mockResolvedValue({ data: mockAuditTrail, error: null })
      
      // Override from to return appropriate chain
      let callIndex = 0
      mockSupabase.from = jest.fn((table) => {
        if (table === 'universal_transactions' && callIndex === 0) {
          callIndex++
          return transactionsChain
        } else if (table === 'core_entities') {
          return entitiesChain
        } else if (table === 'universal_transactions' && callIndex > 0) {
          return auditChain
        }
        return mockChain
      })

      const params = { id: 'tx-123' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/tx-123?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.document).toBeDefined()
      expect(data.document.id).toBe('tx-123')
      expect(data.document.transaction_code).toBe('JE-2024-001')
      expect(data.document.lines).toHaveLength(2)
      expect(data.document.audit_trail).toHaveLength(1)
    })

    it('should require organization ID', async () => {
      const params = { id: 'tx-123' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/tx-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Organization ID is required')
    })

    it('should handle document not found', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Document not found' }
      })

      const params = { id: 'non-existent' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/non-existent?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Document not found')
    })

    it('should properly format line items with GL account details', async () => {
      mockSupabase.from().eq().eq().single.mockResolvedValue({
        data: mockDocument,
        error: null
      })

      const accountsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockAccounts,
          error: null
        })
      }
      mockSupabase.from = jest.fn((table) => {
        if (table === 'core_entities') {
          return accountsQuery
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          }),
          single: jest.fn()
        }
      })

      const params = { id: 'tx-123' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/tx-123?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      const lines = data.document.lines
      expect(lines[0].account_code).toBe('6100')
      expect(lines[0].account_name).toBe('Rent Expense')
      expect(lines[0].debit_amount).toBe(5000)
      expect(lines[0].credit_amount).toBe(0)
      expect(lines[0].cost_center).toBe('MAIN-001')

      expect(lines[1].account_code).toBe('1000')
      expect(lines[1].account_name).toBe('Cash')
      expect(lines[1].debit_amount).toBe(0)
      expect(lines[1].credit_amount).toBe(5000)
    })

    it('should handle missing GL account data gracefully', async () => {
      mockSupabase.from().eq().eq().single.mockResolvedValue({
        data: mockDocument,
        error: null
      })

      // Mock empty GL accounts response
      const accountsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      mockSupabase.from = jest.fn(() => accountsQuery)

      const params = { id: 'tx-123' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/tx-123?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should fall back to metadata values
      expect(data.document.lines[0].account_code).toBe('6100')
      expect(data.document.lines[0].account_name).toBe('Rent Expense')
    })

    it('should format audit trail properly', async () => {
      mockSupabase.from().eq().eq().single.mockResolvedValue({
        data: mockDocument,
        error: null
      })

      const auditQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAuditTrail,
          error: null
        })
      }

      mockSupabase.from = jest.fn((table) => {
        if (table === 'universal_transactions' && !table.includes('audit')) {
          return {
            ...auditQuery,
            single: jest.fn()
          }
        }
        return auditQuery
      })

      const params = { id: 'tx-123' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/tx-123?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.document.audit_trail).toHaveLength(1)
      expect(data.document.audit_trail[0].action).toBe('posted')
      expect(data.document.audit_trail[0].user).toBe('John Doe')
      expect(data.document.audit_trail[0].changes).toEqual({ status: { from: 'draft', to: 'posted' } })
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().eq().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const params = { id: 'tx-123' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/tx-123?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should include all document metadata fields', async () => {
      mockSupabase.from().eq().eq().single.mockResolvedValue({
        data: mockDocument,
        error: null
      })

      const accountsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      mockSupabase.from = jest.fn(() => accountsQuery)

      const params = { id: 'tx-123' }
      const request = new NextRequest('http://localhost/api/v1/finance/documents/tx-123?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request, { params })
      const data = await response.json()

      const doc = data.document
      expect(doc.description).toBe('Monthly rent payment')
      expect(doc.reference_number).toBe('REF-001')
      expect(doc.smart_code).toBe('HERA.FIN.GL.JE.v1')
      expect(doc.fiscal_year).toBe(2024)
      expect(doc.fiscal_period).toBe('01')
      expect(doc.posting_date).toBe('2024-01-15T10:30:00Z')
      expect(doc.source_entity).toBeDefined()
      expect(doc.target_entity).toBeDefined()
      expect(doc.metadata).toBeDefined()
    })
  })
})