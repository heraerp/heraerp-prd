/**
 * HERA V2 API - Base HTTP Client
 * Simple HTTP client for V2 API endpoints
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export interface ApiResponse<T = any> {
  success?: boolean
  api_version?: string
  data?: T
  error?: string
  [key: string]: any
}

export async function post<TRequest = any, TResponse = any>(
  endpoint: string,
  payload: TRequest
): Promise<TResponse> {
  const url = `${BASE_URL}${endpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.success === false) {
    throw new Error(result.error || 'API request failed')
  }

  return result
}

export async function get<TResponse = any>(
  endpoint: string,
  params?: Record<string, string>
): Promise<TResponse> {
  let url = `${BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.success === false) {
    throw new Error(result.error || 'API request failed')
  }

  return result
}
