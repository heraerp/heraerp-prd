import {
  ServiceResponse,
  ProductResponse,
  CustomerResponse,
  ListQuery,
  ServiceCreate,
  ServiceUpdate,
  ProductCreate,
  ProductUpdate,
  CustomerCreate,
  CustomerUpdate
} from '@/app/api/playbook/salon/pos/_schemas'

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ErrorResponse {
  error: string
  details?: any
}

export class SalonPOSApi {
  private baseUrl: string
  private orgId: string
  private actorUserId?: string

  constructor(orgId: string, actorUserId?: string, baseUrl = '/api/playbook/salon/pos') {
    this.baseUrl = baseUrl
    this.orgId = orgId
    this.actorUserId = actorUserId
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse
      throw new Error(error.error || 'Request failed')
    }
    return response.json()
  }

  // Service operations
  async createService(service: ServiceCreate['service']): Promise<ServiceResponse> {
    const response = await fetch(`${this.baseUrl}/service/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: this.orgId,
        smart_code: 'HERA.SALON.POS.SERVICE.CREATE.v1',
        actor_user_id: this.actorUserId,
        service
      })
    })
    return this.handleResponse<ServiceResponse>(response)
  }

  async listServices(params: Partial<ListQuery> = {}): Promise<ListResponse<ServiceResponse>> {
    const queryParams = new URLSearchParams({
      orgId: this.orgId,
      ...Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    })
    const response = await fetch(`${this.baseUrl}/service/list?${queryParams}`)
    return this.handleResponse<ListResponse<ServiceResponse>>(response)
  }

  async updateService(
    id: string,
    updates: Omit<ServiceUpdate['service'], 'id'>
  ): Promise<ServiceResponse> {
    const response = await fetch(`${this.baseUrl}/service/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: this.orgId,
        smart_code: 'HERA.SALON.POS.SERVICE.UPDATE.v1',
        actor_user_id: this.actorUserId,
        service: { id, ...updates }
      })
    })
    return this.handleResponse<ServiceResponse>(response)
  }

  async deleteService(id: string): Promise<{ id: string; deleted: boolean }> {
    const response = await fetch(`${this.baseUrl}/service/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: this.orgId,
        smart_code: 'HERA.SALON.POS.SERVICE.DELETE.v1',
        actor_user_id: this.actorUserId,
        service: { id }
      })
    })
    return this.handleResponse(response)
  }

  async searchServices(query: string): Promise<ServiceResponse[]> {
    const result = await this.listServices({ q: query, status: 'active' })
    return result.items
  }

  // Product operations
  async createProduct(product: ProductCreate['product']): Promise<ProductResponse> {
    const response = await fetch(`${this.baseUrl}/product/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: this.orgId,
        smart_code: 'HERA.SALON.POS.PRODUCT.CREATE.v1',
        actor_user_id: this.actorUserId,
        product
      })
    })
    return this.handleResponse<ProductResponse>(response)
  }

  async listProducts(params: Partial<ListQuery> = {}): Promise<ListResponse<ProductResponse>> {
    const queryParams = new URLSearchParams({
      orgId: this.orgId,
      ...Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    })
    const response = await fetch(`${this.baseUrl}/product/list?${queryParams}`)
    return this.handleResponse<ListResponse<ProductResponse>>(response)
  }

  async searchProducts(query: string): Promise<ProductResponse[]> {
    const result = await this.listProducts({ q: query, status: 'active' })
    return result.items
  }

  // Customer operations
  async createCustomer(customer: CustomerCreate['customer']): Promise<CustomerResponse> {
    const response = await fetch(`${this.baseUrl}/customer/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: this.orgId,
        smart_code: 'HERA.SALON.POS.CUSTOMER.CREATE.v1',
        actor_user_id: this.actorUserId,
        customer
      })
    })
    return this.handleResponse<CustomerResponse>(response)
  }

  async searchCustomers(query: string): Promise<CustomerResponse[]> {
    const queryParams = new URLSearchParams({
      orgId: this.orgId,
      q: query
    })
    const response = await fetch(`${this.baseUrl}/customer/search?${queryParams}`)
    const result = await this.handleResponse<ListResponse<CustomerResponse>>(response)
    return result.items
  }

  // Ticket operations (placeholders for now)
  async createTicket(workstationId: string = 'main-1'): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/ticket/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: this.orgId,
        smart_code: 'HERA.SALON.POS.TICKET.CREATE.v1',
        workstationId
      })
    })
    return this.handleResponse(response)
  }

  async addLineToTicket(
    ticketId: string,
    line: { kind: 'SERVICE' | 'PRODUCT'; entity_id: string; qty: number; unit_amount: number }
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/ticket/add-line`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: this.orgId,
        smart_code: 'HERA.SALON.POS.TICKET.ADD_LINE.v1',
        ticketId,
        line
      })
    })
    return this.handleResponse(response)
  }
}

// Factory function for easy initialization
export function createSalonPOSApi(orgId: string, actorUserId?: string): SalonPOSApi {
  return new SalonPOSApi(orgId, actorUserId)
}
