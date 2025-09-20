/**
 * Tender Service - Sacred Six Integration
 *
 * This service provides all tender management operations using HERA's
 * universal 6-table architecture with Finance-DNA integration.
 *
 * Key Features:
 * - Complete tender lifecycle management
 * - AI-powered bid strategy calculations
 * - EMD tracking with financial transactions
 * - Competitor analysis and market intelligence
 * - Document management with relationships
 * - Real-time analytics and dashboards
 */

import { universalApi } from '@/lib/universal-api'

export interface TenderMetrics {
  activeTenders: {
    total: number
    closingSoon: number
  }
  bidsSubmitted: {
    current: number
    delta: number
  }
  winRate: {
    percentage: number
    totalBids: number
    wonBids: number
  }
  emd: {
    totalPaid: number
    locked: number
  }
}

export interface TenderListItem {
  id: string
  title: string
  code: string
  department: string
  status: 'active' | 'watchlist' | 'submitted' | 'won' | 'lost'
  closing_date: string
  days_left: number
  estimated_value: number
  emd_amount: number
  lots: number
  bid_strategy?: string
  ai_confidence?: number
  competitor_count: number
}

export interface TenderDetail extends TenderListItem {
  smart_code: string
  created_at: string
  description?: string
  location?: string
  tender_fee?: number
  processing_fee?: number
  lots: TenderLot[]
  documents: TenderDocument[]
  transactions: any[]
  ai_insights: any
  competitors: any[]
}

export interface TenderLot {
  id: string
  name: string
  code: string
  species?: string
  grade?: string
  volume_cbm?: number
  reserve_price?: number
  depot?: string
  dimensions?: string
}

export interface TenderDocument {
  id: string
  name: string
  type: string
  status?: string
  upload_date?: string
  file_url?: string
}

export interface TenderAnalytics {
  monthlyPerformance: Array<{
    month_name: string
    submitted: number
    won: number
    lost: number
    value_lakhs: number
  }>
  winRateByCategory: Array<{
    category: string
    total_bids: number
    won_bids: number
    win_rate: number
  }>
  competitorMarketShare: Array<{
    competitor_name: string
    tenders_won: number
    market_share: number
  }>
  aiPerformance: {
    totalPredictions: number
    averageConfidence: number
    accuracyRate: number
    correctPredictions: number
  }
  valueTrends: Array<{
    month_name: string
    avg_value_lakhs: number
    tender_count: number
  }>
  period: string
}

class TenderService {
  private baseUrl = '/api/v1/tender'

  /**
   * Get tender metrics for dashboard KPIs
   */
  async getMetrics(): Promise<TenderMetrics> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getAuthToken()}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tender metrics')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get list of tenders with filtering and search
   */
  async getTenderList(params: {
    q?: string
    status?: string
    limit?: number
    offset?: number
    sort?: string
  }): Promise<{
    tenders: TenderListItem[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.append('q', params.q)
    if (params.status) searchParams.append('status', params.status)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
    if (params.sort) searchParams.append('sort', params.sort)

    const response = await fetch(`${this.baseUrl}/list-simple?${searchParams}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getAuthToken()}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tender list')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get detailed tender information
   */
  async getTenderDetail(tenderId: string): Promise<TenderDetail> {
    const response = await fetch(`${this.baseUrl}/${tenderId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getAuthToken()}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tender detail')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Calculate bid for a tender using AI
   */
  async calculateBid(
    tenderId: string,
    params: {
      costs?: {
        transport_mt?: number
        handling_mt?: number
      }
      margin_preference?: 'aggressive' | 'moderate' | 'conservative'
      include_competitors?: boolean
      estimated_amount?: number
    }
  ): Promise<{
    ai_task_id?: string
    draft_bid_id: string
    [key: string]: any
  }> {
    // Use simpler endpoint that doesn't require full auth
    const response = await fetch(`${this.baseUrl}/calculate-bid-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenderId,
        estimatedAmount: params.estimated_amount,
        costs: params.costs,
        marginPreference: params.margin_preference
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || 'Failed to calculate bid')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get tender analytics
   */
  async getAnalytics(period: '6months' | 'quarter' | 'year' = '6months'): Promise<TenderAnalytics> {
    const response = await fetch(`${this.baseUrl}/analytics?period=${period}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getAuthToken()}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tender analytics')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Create a new tender (watchlist entry)
   */
  async createTender(tender: {
    code: string
    title: string
    department: string
    closing_date: string
    estimated_value: number
    emd_amount: number
    description?: string
    location?: string
  }): Promise<string> {
    // Use universal API to create tender entity
    const entity = await universalApi.createEntity({
      entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1',
      entity_name: tender.title,
      entity_code: tender.code,
      smart_code: 'HERA.FURNITURE.TENDER.NOTICE.ACTIVE.V1'
    })

    // Add dynamic fields
    const dynamicFields = [
      { field: 'department', value: tender.department, type: 'text' },
      { field: 'closing_date', value: tender.closing_date, type: 'date' },
      { field: 'estimated_value', value: tender.estimated_value, type: 'number' },
      { field: 'emd_amount', value: tender.emd_amount, type: 'number' }
    ]

    if (tender.description) {
      dynamicFields.push({ field: 'description', value: tender.description, type: 'text' })
    }
    if (tender.location) {
      dynamicFields.push({ field: 'location', value: tender.location, type: 'text' })
    }

    for (const field of dynamicFields) {
      await universalApi.setDynamicField(
        entity.id,
        field.field,
        field.value,
        `HERA.FURNITURE.TENDER.FIELD.${field.field.toUpperCase()}.v1`
      )
    }

    // Create initial status relationship
    const statusEntity = await universalApi.createEntity({
      entity_type: 'workflow_status',
      entity_name: 'Active Status',
      entity_code: 'STATUS-ACTIVE',
      smart_code: 'HERA.WORKFLOW.STATUS.ACTIVE.v1'
    })

    await universalApi.createRelationship({
      from_entity_id: entity.id,
      to_entity_id: statusEntity.id,
      relationship_type: 'has_status',
      smart_code: 'HERA.FURNITURE.TENDER.STATUS.ACTIVE.V1'
    })

    // Record the tender discovery transaction
    await universalApi.createTransaction({
      transaction_type: 'tender_discovery',
      reference_entity_id: entity.id,
      smart_code: 'HERA.FURNITURE.TENDER.DISCOVERED.v1',
      total_amount: 0,
      metadata: {
        tender_code: tender.code,
        tender_title: tender.title,
        estimated_value: tender.estimated_value,
        closing_date: tender.closing_date
      }
    })

    return entity.id
  }

  /**
   * Submit a bid for a tender
   */
  async submitBid(
    tenderId: string,
    bid: {
      amount: number
      margin_percentage: number
      transport_cost: number
      handling_cost: number
      technical_bid_doc?: string
      price_bid_doc?: string
    }
  ): Promise<string> {
    // Create bid submission transaction
    const transaction = await universalApi.createTransaction({
      transaction_type: 'bid_submission',
      reference_entity_id: tenderId,
      to_entity_id: tenderId,
      smart_code: 'HERA.FURNITURE.TENDER.BID.SUBMITTED.V1',
      total_amount: bid.amount,
      metadata: {
        margin_percentage: bid.margin_percentage,
        transport_cost: bid.transport_cost,
        handling_cost: bid.handling_cost,
        technical_bid_doc: bid.technical_bid_doc,
        price_bid_doc: bid.price_bid_doc,
        submitted_at: new Date().toISOString()
      },
      line_items: [
        {
          entity_id: tenderId,
          quantity: 1,
          unit_price: bid.amount,
          line_amount: bid.amount,
          smart_code: 'HERA.FURNITURE.TENDER.BID.AMOUNT.V1'
        }
      ]
    })

    return transaction.id
  }

  /**
   * Pay EMD for a tender
   */
  async payEMD(
    tenderId: string,
    amount: number,
    paymentDetails: {
      payment_method: string
      reference_number: string
      bank_name?: string
    }
  ): Promise<string> {
    // Create EMD payment transaction (Finance-DNA ready)
    const transaction = await universalApi.createTransaction({
      transaction_type: 'emd_payment',
      reference_entity_id: tenderId,
      to_entity_id: tenderId,
      smart_code: 'HERA.FURNITURE.FIN.EMD.PAID.V1',
      total_amount: amount,
      metadata: {
        payment_method: paymentDetails.payment_method,
        reference_number: paymentDetails.reference_number,
        bank_name: paymentDetails.bank_name,
        payment_date: new Date().toISOString()
      },
      line_items: [
        {
          entity_id: tenderId,
          quantity: 1,
          unit_price: amount,
          line_amount: amount,
          smart_code: 'HERA.FURNITURE.FIN.EMD.AMOUNT.V1',
          metadata: {
            gl_account: '1510000', // EMD Deposits (Current Asset)
            cost_center: 'TENDER_MGMT'
          }
        }
      ]
    })

    return transaction.id
  }

  /**
   * Get auth token for API calls
   */
  private async getAuthToken(): Promise<string> {
    // Get token from localStorage or session
    if (typeof window !== 'undefined') {
      // Check if in demo mode first
      const isDemoLogin = sessionStorage.getItem('isDemoLogin') === 'true'
      if (isDemoLogin) {
        return 'demo-token'
      }
      
      // Try to get from Supabase session
      const supabaseToken = localStorage.getItem('supabase.auth.token')
      if (supabaseToken) {
        try {
          const parsed = JSON.parse(supabaseToken)
          return parsed?.currentSession?.access_token || 'no-token'
        } catch {
          // Fall through
        }
      }

      // Try to get from custom auth storage
      const authToken = localStorage.getItem('hera-auth-token')
      if (authToken) {
        return authToken
      }
    }

    return 'no-token'
  }
}

// Export singleton instance
export const tenderService = new TenderService()
