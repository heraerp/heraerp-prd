export interface Paginated<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

export interface ListQueryParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  status: number
  message: string
  details?: any
}

export interface RequestHeaders {
  'Content-Type'?: string
  'x-organization-id'?: string
  'x-idempotency-key'?: string
  Authorization?: string
}
