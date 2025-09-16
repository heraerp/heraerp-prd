// Universal API client using service role key via API endpoints
// Replaces direct supabaseClient usage to bypass RLS restrictions

interface UniversalDataRequest {
  organizationId: string
  table: string
  entityType?: string
  transactionType?: string
  limit?: number
}

interface UniversalDataResponse {
  success: boolean
  count: number
  data: any[]
  error?: string
}

export class universalApi {
  /**
   * Fetch entities from core_entities table
   */
  async getEntities(organizationId: string, entityType?: string, limit = 50): Promise<any[]> {
    const params = new URLSearchParams({
      org_id: organizationId,
      table: 'core_entities',
      limit: limit.toString()
    })

    if (entityType) {
      params.append('entity_type', entityType)
    }

    const response = await fetch(`/api/universal/data?${params}`)
    const result: UniversalDataResponse = await response.json()

    if (!result.success) {
      console.error('API Error:', result.error)
      return []
    }

    return result.data
  }

  /**
   * Fetch transactions from universal_transactions table
   */
  async getTransactions(
    organizationId: string,
    transactionType?: string,
    limit = 20
  ): Promise<any[]> {
    const params = new URLSearchParams({
      org_id: organizationId,
      table: 'universal_transactions',
      limit: limit.toString()
    })

    if (transactionType) {
      params.append('transaction_type', transactionType)
    }

    const response = await fetch(`/api/universal/data?${params}`)
    const result: UniversalDataResponse = await response.json()

    if (!result.success) {
      console.error('API Error:', result.error)
      return []
    }

    return result.data
  }

  /**
   * Fetch any table data with filters
   */
  async getData(request: UniversalDataRequest): Promise<any[]> {
    const params = new URLSearchParams({
      org_id: request.organizationId,
      table: request.table,
      limit: (request.limit || 100).toString()
    })

    if (request.entityType) {
      params.append('entity_type', request.entityType)
    }

    if (request.transactionType) {
      params.append('transaction_type', request.transactionType)
    }

    const response = await fetch(`/api/universal/data?${params}`)
    const result: UniversalDataResponse = await response.json()

    if (!result.success) {
      console.error('API Error:', result.error)
      return []
    }

    return result.data
  }

  /**
   * Insert data into any table
   */
  async insertData(organizationId: string, table: string, data: any | any[]): Promise<any[]> {
    const response = await fetch('/api/universal/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationId,
        table,
        data
      })
    })

    const result: UniversalDataResponse = await response.json()

    if (!result.success) {
      console.error('API Error:', result.error)
      return []
    }

    return result.data
  }

  /**
   * Get dashboard data for an organization (replaces common queries)
   */
  async getDashboardData(organizationId: string) {
    const [products, customers, transactions, locations] = await Promise.all([
      this.getEntities(organizationId, 'product', 30),
      this.getEntities(organizationId, 'customer', 30),
      this.getTransactions(organizationId, undefined, 15),
      this.getEntities(organizationId, 'location', 15)
    ])

    return {
      products,
      customers,
      transactions,
      locations,
      summary: {
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalTransactions: transactions.length,
        totalLocations: locations.length
      }
    }
  }
}

// Export singleton instance
export const apiClient = new universalApi()
