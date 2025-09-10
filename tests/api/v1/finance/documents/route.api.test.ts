/**
 * Tests for HERA Financial Documents API
 * Tests document listing with advanced filtering
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createMockSupabase, mockSuccessfulQuery, mockErrorQuery, type MockChain } from '@/test/helpers'

describe('Financial Documents API', () => {
  let mockSupabase: any
  let mockChain: MockChain

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up mocks using helper
    const mocks = createMockSupabase()
    mockSupabase = mocks.mockSupabase
    mockChain = mocks.mockChain
    
    // Make sure the chain methods return the chain for chaining
    mockChain.select.mockReturnThis()
    mockChain.eq.mockReturnThis()
    mockChain.order.mockReturnThis()
    mockChain.ilike.mockReturnThis()
    mockChain.gte.mockReturnThis()
    mockChain.lte.mockReturnThis()
    
    // Mock the createClient to return our mock
    const { createClient } = require('@supabase/supabase-js')
    createClient.mockReturnValue(mockSupabase)
  })

  describe('GET - List Documents', () => {
    const mockTransactions = [
      {
        id: 'tx-1',
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
        fiscal_year: 2024,
        fiscal_period: '01',
        metadata: {
          status: 'posted',
          posted_at: '2024-01-15T10:30:00Z'
        },
        universal_transaction_lines: [
          {
            id: 'line-1',
            line_number: 1,
            entity_id: 'gl-rent-expense',
            description: 'Rent expense',
            line_amount: 5000,
            metadata: {
              account_code: '6100',
              account_name: 'Rent Expense',
              debit: 5000
            }
          },
          {
            id: 'line-2',
            line_number: 2,
            entity_id: 'gl-cash',
            description: 'Cash payment',
            line_amount: -5000,
            metadata: {
              account_code: '1000',
              account_name: 'Cash',
              credit: 5000
            }
          }
        ]
      }
    ]

    it('should fetch documents with organization filter', async () => {
      // Mock successful response - ensure limit returns the data
      mockChain.limit.mockResolvedValue({ data: mockTransactions, error: null })

      const request = new NextRequest('http://localhost/api/v1/finance/documents?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      // Debug logging
      if (data.documents?.length === 0 || !data.documents) {
        console.log('Response data:', JSON.stringify(data, null, 2))
      }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.documents).toHaveLength(1)
      expect(data.documents[0].transaction_code).toBe('JE-2024-001')
      expect(mockSupabase.from).toHaveBeenCalledWith('universal_transactions')
      expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-123')
    })

    it('should require organization ID', async () => {
      const request = new NextRequest('http://localhost/api/v1/finance/documents', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Organization ID is required')
    })

    it('should filter by document number', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const request = new NextRequest(
        'http://localhost/api/v1/finance/documents?organizationId=org-123&documentNumber=JE-2024',
        { method: 'GET' }
      )

      await GET(request)

      expect(mockChain.ilike).toHaveBeenCalledWith('transaction_code', '%JE-2024%')
    })

    it('should filter by fiscal year', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const request = new NextRequest(
        'http://localhost/api/v1/finance/documents?organizationId=org-123&fiscalYear=2024',
        { method: 'GET' }
      )

      await GET(request)

      expect(mockChain.gte).toHaveBeenCalledWith('transaction_date', '2024-01-01')
      expect(mockChain.lte).toHaveBeenCalledWith('transaction_date', '2024-12-31')
    })

    it('should filter by date range', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const request = new NextRequest(
        'http://localhost/api/v1/finance/documents?organizationId=org-123&dateFrom=2024-01-01&dateTo=2024-01-31',
        { method: 'GET' }
      )

      await GET(request)

      expect(mockChain.gte).toHaveBeenCalledWith('transaction_date', '2024-01-01')
      expect(mockChain.lte).toHaveBeenCalledWith('transaction_date', '2024-01-31')
    })

    it('should filter by document type', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const request = new NextRequest(
        'http://localhost/api/v1/finance/documents?organizationId=org-123&documentType=journal_entry',
        { method: 'GET' }
      )

      await GET(request)

      expect(mockChain.eq).toHaveBeenCalledWith('transaction_type', 'journal_entry')
    })

    it('should filter by amount range', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const request = new NextRequest(
        'http://localhost/api/v1/finance/documents?organizationId=org-123&minAmount=1000&maxAmount=10000',
        { method: 'GET' }
      )

      await GET(request)

      expect(mockChain.gte).toHaveBeenCalledWith('total_amount', 1000)
      expect(mockChain.lte).toHaveBeenCalledWith('total_amount', 10000)
    })

    it('should filter by status', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const request = new NextRequest(
        'http://localhost/api/v1/finance/documents?organizationId=org-123&status=posted',
        { method: 'GET' }
      )

      await GET(request)

      expect(mockChain.eq).toHaveBeenCalledWith('metadata->status', 'posted')
    })

    it('should transform transaction lines correctly', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const request = new NextRequest('http://localhost/api/v1/finance/documents?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      const document = data.documents[0]
      expect(document.lines).toHaveLength(2)
      expect(document.lines[0].debit_amount).toBe(5000)
      expect(document.lines[0].credit_amount).toBe(0)
      expect(document.lines[1].debit_amount).toBe(0)
      expect(document.lines[1].credit_amount).toBe(5000)
    })

    it('should handle database errors gracefully', async () => {
      mockErrorQuery(mockChain, 'Database connection failed')

      const request = new NextRequest('http://localhost/api/v1/finance/documents?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch documents')
    })

    it('should handle empty results', async () => {
      mockSuccessfulQuery(mockChain, [])

      const request = new NextRequest('http://localhost/api/v1/finance/documents?organizationId=org-123', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.documents).toEqual([])
      expect(data.count).toBe(0)
    })

    it('should apply all filters combined', async () => {
      mockSuccessfulQuery(mockChain, mockTransactions)

      const params = new URLSearchParams({
        organizationId: 'org-123',
        documentNumber: 'JE',
        fiscalYear: '2024',
        documentType: 'journal_entry',
        minAmount: '1000',
        maxAmount: '10000',
        status: 'posted'
      })

      const request = new NextRequest(`http://localhost/api/v1/finance/documents?${params}`, {
        method: 'GET'
      })

      await GET(request)

      // Verify all filters were applied
      expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockChain.ilike).toHaveBeenCalledWith('transaction_code', '%JE%')
      expect(mockChain.eq).toHaveBeenCalledWith('transaction_type', 'journal_entry')
      expect(mockChain.eq).toHaveBeenCalledWith('metadata->status', 'posted')
      expect(mockSupabase.from().order).toHaveBeenCalledWith('transaction_date', { ascending: false })
    })
  })
})