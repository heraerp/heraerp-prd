// ================================================================================
// HERA MOCK API CLIENT - DEVELOPMENT & TESTING
// Smart Code: HERA.API.MOCK.CLIENT.V1
// Mock implementation for development and testing without backend coupling
// ================================================================================

import { ApiClient, ApiOptions } from './client'
import type { LoginResponse, DashboardMetrics, User } from '../schemas/universal'

export class MockApiClient extends ApiClient {
  private mockData = new Map<string, any>()
  private currentUser: User | null = null

  constructor(opts: ApiOptions) {
    super(opts)
    this.seedMockData()
  }

  private seedMockData() {
    // Mock users
    const mockUser: User = {
      id: 'user-001',
      email: 'owner@hairtalkz.com',
      name: 'Sarah Johnson',
      roles: ['owner'],
      organization_id: 'org-hairtalkz-001',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    }

    this.mockData.set('users', [
      mockUser,
      {
        id: 'user-002',
        email: 'manager@hairtalkz.com',
        name: 'Emma Rodriguez',
        roles: ['manager'],
        organization_id: 'org-hairtalkz-001'
      },
      {
        id: 'user-003',
        email: 'stylist@hairtalkz.com',
        name: 'Lisa Chen',
        roles: ['stylist'],
        organization_id: 'org-hairtalkz-001'
      }
    ])

    // Mock dashboard metrics
    this.mockData.set('dashboard-metrics', {
      todaysSales: {
        amount: 3250.75,
        currency: 'AED',
        change: 18.5
      },
      upcomingAppointments: {
        count: 8,
        next: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      },
      lowStock: {
        count: 3,
        items: ['Shampoo - Moisturizing', 'Hair Color - Blonde #7', 'Nail Polish - Red']
      },
      organization_id: 'org-hairtalkz-001'
    })
  }

  // Override parent methods with mock implementations
  async post<T>(path: string, body: unknown): Promise<T> {
    // Simulate network delay
    await this.mockDelay()

    if (path.includes('/auth/login')) {
      return this.handleMockLogin(body) as T
    }

    if (path.includes('/auth/logout')) {
      return this.handleMockLogout() as T
    }

    // Default to parent implementation for other requests
    return super.post(path, body)
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    // Simulate network delay
    await this.mockDelay()

    if (path.includes('/dashboard/metrics')) {
      return this.handleMockDashboardMetrics(params) as T
    }

    // Default to parent implementation for other requests
    return super.get(path, params)
  }

  private async handleMockLogin(body: any): Promise<LoginResponse> {
    const { email, password } = body as { email: string; password: string }

    // Simulate authentication logic
    const users = this.mockData.get('users') as User[]
    const user = users.find(u => u.email === email)

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Mock password validation (accept any password for demo)
    if (password.length < 6) {
      throw new Error('Invalid email or password')
    }

    // Generate mock token
    const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    this.currentUser = user
    this.setToken(token)
    this.setOrganizationId(user.organization_id)

    return {
      token,
      user,
      expires_at: expiresAt
    }
  }

  private async handleMockLogout(): Promise<void> {
    this.currentUser = null
    this.setToken('')
    this.setOrganizationId('')
    return Promise.resolve()
  }

  private async handleMockDashboardMetrics(
    params?: Record<string, any>
  ): Promise<DashboardMetrics> {
    const orgId = params?.organization_id || this.currentUser?.organization_id

    if (!orgId) {
      throw new Error('Organization ID required')
    }

    const metrics = this.mockData.get('dashboard-metrics') as DashboardMetrics

    // Simulate some variance in the data
    const variance = () => (Math.random() - 0.5) * 0.1 // ±5% variance

    return {
      ...metrics,
      todaysSales: {
        ...metrics.todaysSales,
        amount: metrics.todaysSales.amount * (1 + variance()),
        change: metrics.todaysSales.change! * (1 + variance())
      },
      upcomingAppointments: {
        ...metrics.upcomingAppointments,
        count: Math.max(0, metrics.upcomingAppointments.count + Math.floor(variance() * 10))
      },
      lowStock: {
        ...metrics.lowStock,
        count: Math.max(0, metrics.lowStock.count + Math.floor(variance() * 5))
      },
      organization_id: orgId
    }
  }

  private async mockDelay(min = 100, max = 300): Promise<void> {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  // Test utilities for development
  getCurrentUser(): User | null {
    return this.currentUser
  }

  setMockData(key: string, data: any): void {
    this.mockData.set(key, data)
  }

  getMockData(key: string): any {
    return this.mockData.get(key)
  }

  // Simulate different response scenarios for testing
  simulateError(path: string, error: Error): void {
    // Could be extended to simulate specific errors for testing
    console.warn(`Mock API: Simulating error for ${path}:`, error)
  }

  // Reset mock state for testing
  reset(): void {
    this.currentUser = null
    this.seedMockData()
  }
}

// Factory function for mock client
export function createMockApiClient(options: Partial<ApiOptions> = {}): MockApiClient {
  const baseUrl = 'http://localhost:3000' // Mock doesn't actually make requests
  return new MockApiClient({ baseUrl, ...options })
}
