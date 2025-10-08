import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v2/auth/introspect/route'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

jest.mock('@/lib/supabase-service')
jest.mock('@/lib/auth/verify-auth')

describe('GET /api/v2/auth/introspect', () => {
  const mockAuth = {
    id: 'user-uuid-123',
    email: 'owner@example.com',
    organizationId: 'org-uuid-456',
    roles: [],
    permissions: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockAuth)
  })

  it('returns resolved server payload with roles and permissions', async () => {
    const mockSupabase = {
      from: (table: string) => {
        if (table === 'core_entities') {
          return {
            select: () => ({
              in: () => ({
                contains: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: 'entity-user-1',
                        organization_id: 'org-uuid-456',
                        entity_type: 'USER',
                        metadata: { auth_user_id: mockAuth.id }
                      }
                    ],
                    error: null
                  })
              })
            })
          }
        }
        if (table === 'core_dynamic_data') {
          return {
            select: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: [
                      {
                        field_name: 'salon_role',
                        field_type: 'text',
                        field_value_text: 'owner'
                      },
                      {
                        field_name: 'permissions',
                        field_type: 'json',
                        field_value_json: ['salon:admin:full', 'salon:read:all']
                      }
                    ],
                    error: null
                  })
              })
            })
          }
        }
        throw new Error('Unexpected table: ' + table)
      }
    }
    ;(getSupabaseService as jest.Mock).mockReturnValue(mockSupabase)

    const req = new NextRequest('http://localhost:3000/api/v2/auth/introspect', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' }
    })

    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.user_id).toBe(mockAuth.id)
    expect(json.organization_id).toBe(mockAuth.organizationId)
    expect(json.roles).toEqual(['owner'])
    expect(json.permissions).toEqual(['salon:admin:full', 'salon:read:all'])
    expect(json.source).toBe('server')
  })

  it('returns minimal payload when DB returns an error', async () => {
    const mockSupabase = {
      from: (table: string) => {
        if (table === 'core_entities') {
          return {
            select: () => ({
              in: () => ({
                contains: () => Promise.resolve({ data: null, error: { message: 'db error' } })
              })
            })
          }
        }
        throw new Error('Unexpected table')
      }
    }
    ;(getSupabaseService as jest.Mock).mockReturnValue(mockSupabase)

    const req = new NextRequest('http://localhost:3000/api/v2/auth/introspect', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' }
    })

    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user_id).toBe(mockAuth.id)
    expect(json.organization_id).toBe(mockAuth.organizationId)
    expect(Array.isArray(json.roles)).toBe(true)
    expect(Array.isArray(json.permissions)).toBe(true)
    expect(json.source).toBe('server|minimal')
  })

  it('returns 401 when unauthorized', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/v2/auth/introspect', {
      method: 'GET'
    })

    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

