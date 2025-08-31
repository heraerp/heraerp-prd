import { APIRequestContext, request } from '@playwright/test'

export class SupabaseTestClient {
  private context: APIRequestContext | null = null
  private baseURL: string
  private anonKey: string
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    if (!this.baseURL || !this.anonKey) {
      throw new Error('Supabase environment variables not set')
    }
  }
  
  async getContext(): Promise<APIRequestContext> {
    if (!this.context) {
      this.context = await request.newContext({
        baseURL: this.baseURL,
        extraHTTPHeaders: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      })
    }
    return this.context
  }
  
  async query(table: string, filters: Record<string, any> = {}) {
    const context = await this.getContext()
    let url = `/rest/v1/${table}?select=*`
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      url += `&${key}=eq.${value}`
    })
    
    const response = await context.get(url)
    const data = await response.json()
    
    return {
      data,
      error: response.status() >= 400 ? data : null,
      status: response.status(),
    }
  }
  
  async insert(table: string, data: any) {
    const context = await this.getContext()
    const response = await context.post(`/rest/v1/${table}`, {
      data: Array.isArray(data) ? data : [data],
    })
    
    const responseData = await response.json()
    
    return {
      data: responseData,
      error: response.status() >= 400 ? responseData : null,
      status: response.status(),
    }
  }
  
  async update(table: string, id: string, data: any) {
    const context = await this.getContext()
    const response = await context.patch(`/rest/v1/${table}?id=eq.${id}`, {
      data,
    })
    
    const responseData = await response.json()
    
    return {
      data: responseData,
      error: response.status() >= 400 ? responseData : null,
      status: response.status(),
    }
  }
  
  async delete(table: string, id: string) {
    const context = await this.getContext()
    const response = await context.delete(`/rest/v1/${table}?id=eq.${id}`)
    
    return {
      error: response.status() >= 400 ? await response.json() : null,
      status: response.status(),
    }
  }
  
  async rpc(functionName: string, params: any = {}) {
    const context = await this.getContext()
    const response = await context.post(`/rest/v1/rpc/${functionName}`, {
      data: params,
    })
    
    const data = await response.json()
    
    return {
      data,
      error: response.status() >= 400 ? data : null,
      status: response.status(),
    }
  }
}