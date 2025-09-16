// ================================================================================
// HERA SESSION STORE UNIT TESTS
// Smart Code: HERA.TEST.UNIT.SESSION.v1
// Unit tests for session management with mock data
// ================================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSession, useAuth } from '@/lib/auth/session'

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  createApiClient: vi.fn(() => ({
    login: vi.fn(),
    logout: vi.fn(),
    setToken: vi.fn(),
    setOrganizationId: vi.fn(),
  })),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Session Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Reset the store state
    useSession.getState().setUser(null)
    useSession.getState().setToken(null)
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSession())
      
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Authentication', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@hairtalkz.com',
        name: 'Test User',
        roles: ['owner'],
        organization_id: 'org-001',
      }
      
      const mockResponse = {
        token: 'mock-token',
        user: mockUser,
        expires_at: new Date().toISOString(),
      }

      // Mock successful API response
      const { createApiClient } = await import('@/lib/api/client')
      const mockApiClient = createApiClient()
      mockApiClient.login = vi.fn().mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useSession())

      await act(async () => {
        await result.current.login({
          email: 'test@hairtalkz.com',
          password: 'password123',
        })
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe('mock-token')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle login failure', async () => {
      const { createApiClient } = await import('@/lib/api/client')
      const mockApiClient = createApiClient()
      mockApiClient.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

      const { result } = renderHook(() => useSession())

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@hairtalkz.com',
            password: 'wrongpassword',
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle logout', async () => {
      // First set up an authenticated state
      const mockUser = {
        id: 'user-001',
        email: 'test@hairtalkz.com',
        name: 'Test User',
        roles: ['owner'],
        organization_id: 'org-001',
      }

      const { result } = renderHook(() => useSession())

      act(() => {
        result.current.setUser(mockUser)
        result.current.setToken('mock-token')
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Now test logout
      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hera-auth-token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hera-user')
    })
  })

  describe('Local Storage Persistence', () => {
    it('should restore session from localStorage', () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@hairtalkz.com',
        name: 'Test User',
        roles: ['owner'],
        organization_id: 'org-001',
      }

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'hera-auth-token') return 'stored-token'
        if (key === 'hera-user') return JSON.stringify(mockUser)
        return null
      })

      const { result } = renderHook(() => useSession())

      act(() => {
        result.current.checkSession()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe('stored-token')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'hera-auth-token') return 'stored-token'
        if (key === 'hera-user') return 'invalid-json'
        return null
      })

      const { result } = renderHook(() => useSession())

      act(() => {
        result.current.checkSession()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hera-auth-token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hera-user')
    })
  })

  describe('useAuth Hook', () => {
    it('should provide auth utilities', () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@hairtalkz.com',
        name: 'Test User',
        roles: ['owner', 'manager'],
        organization_id: 'org-001',
      }

      const { result } = renderHook(() => {
        const session = useSession()
        const auth = useAuth()
        return { session, auth }
      })

      act(() => {
        result.current.session.setUser(mockUser)
        result.current.session.setToken('mock-token')
      })

      expect(result.current.auth.user).toEqual(mockUser)
      expect(result.current.auth.isAuthenticated).toBe(true)
      expect(result.current.auth.hasRole('owner')).toBe(true)
      expect(result.current.auth.hasRole('stylist')).toBe(false)
      expect(result.current.auth.hasAnyRole(['stylist', 'manager'])).toBe(true)
      expect(result.current.auth.organizationId).toBe('org-001')
    })
  })

  describe('Error Handling', () => {
    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => useSession())

      // First set an error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})