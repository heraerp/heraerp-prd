/**
 * HERA Universal Tile System - Tile Actions API Integration Tests
 * End-to-end testing of tile action execution and permission handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/v2/tiles/[tileId]/actions/[actionId]/route'

// Mock data
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_TILE_ID = '00000000-0000-0000-0000-000000000002'
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000003'

const mockTileConfig = {
  tileId: MOCK_TILE_ID,
  workspaceId: 'workspace-1',
  templateId: 'template-1',
  tileType: 'ENTITIES',
  operationCategory: 'data_management',
  enabled: true,
  
  ui: {
    title: 'Customer Management',
    subtitle: 'Manage customer records',
    icon: 'Database',
    color: '#3B82F6'
  },
  
  layout: {
    size: 'medium',
    position: 1
  },
  
  conditions: [
    {
      field: 'user.role',
      operator: 'in',
      value: ['admin', 'manager']
    }
  ],
  
  stats: [],
  
  actions: [
    {
      actionId: 'navigate-customers',
      label: 'View All Customers',
      icon: 'Eye',
      actionType: 'NAVIGATE',
      isPrimary: true,
      requiresConfirmation: false,
      requiresPermission: true,
      route: '/customers',
      parameters: {
        view: 'grid',
        filters: {
          status: '$user.preferred_status'
        }
      },
      visibilityConditions: [
        {
          field: 'user.permissions',
          operator: 'contains',
          value: 'customers.read'
        }
      ]
    },
    {
      actionId: 'create-customer',
      label: 'Create Customer',
      icon: 'Plus',
      actionType: 'MODAL',
      isPrimary: false,
      requiresConfirmation: false,
      requiresPermission: true,
      route: '',
      parameters: {
        modalType: 'customer-form',
        mode: 'create',
        defaultValues: {
          organization_id: '$organization.organization_id'
        }
      },
      visibilityConditions: [
        {
          field: 'user.permissions',
          operator: 'contains',
          value: 'customers.create'
        }
      ]
    },
    {
      actionId: 'export-customers',
      label: 'Export Data',
      icon: 'Download',
      actionType: 'API_CALL',
      isPrimary: false,
      requiresConfirmation: true,
      requiresPermission: true,
      route: '/api/exports/customers',
      parameters: {
        format: 'csv',
        filters: {
          organization_id: '$organization.organization_id'
        },
        columns: ['name', 'email', 'status', 'created_at']
      },
      visibilityConditions: [
        {
          field: 'user.permissions',
          operator: 'contains',
          value: 'customers.export'
        }
      ],
      confirmationConfig: {
        title: 'Export Customer Data',
        message: 'This will export all customer data. Continue?',
        confirmText: 'Export',
        cancelText: 'Cancel'
      }
    },
    {
      actionId: 'delete-customer',
      label: 'Delete Customer',
      icon: 'Trash2',
      actionType: 'API_CALL',
      isPrimary: false,
      requiresConfirmation: true,
      requiresPermission: true,
      route: '/api/customers/{{entityId}}',
      parameters: {
        method: 'DELETE'
      },
      visibilityConditions: [
        {
          field: 'user.role',
          operator: 'equals',
          value: 'admin'
        }
      ],
      confirmationConfig: {
        title: 'Delete Customer',
        message: 'This action cannot be undone. Delete customer?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'destructive'
      }
    }
  ]
}

const mockEvaluationContext = {
  user: {
    user_id: MOCK_USER_ID,
    role: 'admin',
    permissions: ['customers.read', 'customers.create', 'customers.export'],
    preferred_status: 'active'
  },
  organization: {
    organization_id: MOCK_ORG_ID,
    name: 'Test Corp'
  },
  entity: {
    entityId: 'customer-123'
  },
  variables: {}
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: MOCK_USER_ID } },
      error: null
    })
  }
}

// Mock modules
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabase)
}))

vi.mock('@/lib/tiles/use-resolved-tiles', () => ({
  getResolvedTileConfig: vi.fn().mockResolvedValue(mockTileConfig)
}))

vi.mock('@/lib/tiles/dsl-evaluator', () => ({
  DSLEvaluator: vi.fn().mockImplementation(() => ({
    evaluateConditions: vi.fn().mockReturnValue(true),
    resolveValue: vi.fn().mockImplementation((value, context) => {
      if (value === '$user.preferred_status') return context.user.preferred_status
      if (value === '$organization.organization_id') return context.organization.organization_id
      if (value === '{{entityId}}') return context.entity.entityId
      return value
    })
  }))
}))

// Mock external API calls
global.fetch = vi.fn()

// Mock request helper
function createMockRequest(
  params: { tileId: string; actionId: string },
  body: any = {},
  headers: Record<string, string> = {}
): NextRequest {
  const url = new URL(`http://localhost/api/v2/tiles/${params.tileId}/actions/${params.actionId}`)

  const defaultHeaders = {
    'authorization': `Bearer mock-jwt-token`,
    'x-organization-id': MOCK_ORG_ID,
    'content-type': 'application/json',
    ...headers
  }

  return new NextRequest(url, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body)
  })
}

describe('Tile Actions API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('POST /api/v2/tiles/[tileId]/actions/[actionId]', () => {
    describe('Navigation Actions', () => {
      it('successfully executes navigation action with template resolution', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.actionType).toBe('NAVIGATE')
        expect(data.route).toBe('/customers')
        expect(data.parameters.view).toBe('grid')
        expect(data.parameters.filters.status).toBe('active') // Resolved from user context
        expect(typeof data.executionTime).toBe('number')
      })

      it('blocks navigation when user lacks permissions', async () => {
        const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
        const mockEvaluator = new DSLEvaluator()
        
        // Mock permission check failure
        vi.mocked(mockEvaluator.evaluateConditions).mockReturnValue(false)

        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: {
              ...mockEvaluationContext,
              user: {
                ...mockEvaluationContext.user,
                permissions: [] // No permissions
              }
            }
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('INSUFFICIENT_PERMISSIONS')
      })
    })

    describe('Modal Actions', () => {
      it('successfully executes modal action with parameter resolution', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'create-customer' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'create-customer' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.actionType).toBe('MODAL')
        expect(data.parameters.modalType).toBe('customer-form')
        expect(data.parameters.mode).toBe('create')
        expect(data.parameters.defaultValues.organization_id).toBe(MOCK_ORG_ID)
      })
    })

    describe('API Call Actions', () => {
      it('successfully executes API call without confirmation', async () => {
        // Create action that doesn't require confirmation
        const noConfirmAction = {
          ...mockTileConfig.actions[2],
          actionId: 'sync-customers',
          requiresConfirmation: false
        }

        const modifiedTile = {
          ...mockTileConfig,
          actions: [...mockTileConfig.actions, noConfirmAction]
        }

        const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
        vi.mocked(getResolvedTileConfig).mockResolvedValue(modifiedTile)

        vi.mocked(fetch).mockResolvedValue(
          new Response(JSON.stringify({ success: true, synced: 150 }), { 
            status: 200,
            headers: { 'content-type': 'application/json' }
          })
        )

        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'sync-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'sync-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.actionType).toBe('API_CALL')
        expect(data.result).toEqual({ success: true, synced: 150 })
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/exports/customers'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'content-type': 'application/json'
            })
          })
        )
      })

      it('handles API call failures gracefully', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

        const noConfirmAction = {
          ...mockTileConfig.actions[2],
          actionId: 'sync-customers',
          requiresConfirmation: false
        }

        const modifiedTile = {
          ...mockTileConfig,
          actions: [...mockTileConfig.actions, noConfirmAction]
        }

        const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
        vi.mocked(getResolvedTileConfig).mockResolvedValue(modifiedTile)

        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'sync-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'sync-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('API_CALL_FAILED')
        expect(data.error.message).toContain('Network error')
      })
    })

    describe('Confirmation Workflow', () => {
      it('returns confirmation request for actions requiring confirmation', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'export-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'export-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.requiresConfirmation).toBe(true)
        expect(data.confirmation).toBeDefined()
        expect(data.confirmation.title).toBe('Export Customer Data')
        expect(data.confirmation.message).toBe('This will export all customer data. Continue?')
        expect(data.confirmation.confirmText).toBe('Export')
        expect(data.confirmation.cancelText).toBe('Cancel')
        expect(data.confirmation.token).toBeDefined()
      })

      it('executes action after confirmation provided', async () => {
        // Mock confirmation token storage (would be Redis in production)
        const confirmationToken = 'conf_' + Date.now()
        
        vi.mocked(fetch).mockResolvedValue(
          new Response(JSON.stringify({ exportId: 'exp_123', status: 'processing' }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
          })
        )

        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'export-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext,
            confirmationToken: confirmationToken
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'export-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.requiresConfirmation).toBe(false)
        expect(data.result).toEqual({ exportId: 'exp_123', status: 'processing' })
        expect(fetch).toHaveBeenCalled()
      })

      it('rejects invalid confirmation tokens', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'export-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext,
            confirmationToken: 'invalid-token'
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'export-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('INVALID_CONFIRMATION_TOKEN')
      })
    })

    describe('Template Resolution', () => {
      it('resolves route templates with entity context', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'delete-customer' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'delete-customer' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.requiresConfirmation).toBe(true)
        
        // Route template should be resolved
        expect(data.confirmation.resolvedRoute).toBe('/api/customers/customer-123')
      })

      it('resolves complex parameter templates', async () => {
        const complexAction = {
          actionId: 'send-notification',
          label: 'Send Notification',
          icon: 'Mail',
          actionType: 'API_CALL',
          isPrimary: false,
          requiresConfirmation: false,
          requiresPermission: false,
          route: '/api/notifications/send',
          parameters: {
            recipients: ['$user.email'],
            subject: 'Update from {{organization.name}}',
            body: 'Hello $user.name, this is an update from your organization.',
            metadata: {
              sender_id: '$user.user_id',
              organization_id: '$organization.organization_id',
              timestamp: '{{current_time}}'
            }
          }
        }

        const modifiedTile = {
          ...mockTileConfig,
          actions: [...mockTileConfig.actions, complexAction]
        }

        const complexContext = {
          user: {
            user_id: MOCK_USER_ID,
            name: 'John Doe',
            email: 'john@example.com'
          },
          organization: {
            organization_id: MOCK_ORG_ID,
            name: 'Test Corporation'
          },
          entity: {},
          variables: {
            current_time: '2024-01-20T15:30:00Z'
          }
        }

        const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
        vi.mocked(getResolvedTileConfig).mockResolvedValue(modifiedTile)

        const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
        const mockEvaluator = new DSLEvaluator()
        vi.mocked(mockEvaluator.resolveValue).mockImplementation((value) => {
          if (value === '$user.email') return 'john@example.com'
          if (value === '$user.name') return 'John Doe'
          if (value === '$user.user_id') return MOCK_USER_ID
          if (value === '$organization.organization_id') return MOCK_ORG_ID
          if (value === '{{organization.name}}') return 'Test Corporation'
          if (value === '{{current_time}}') return '2024-01-20T15:30:00Z'
          return value
        })

        vi.mocked(fetch).mockResolvedValue(
          new Response(JSON.stringify({ messageId: 'msg_123' }), { status: 200 })
        )

        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'send-notification' },
          {
            organization_id: MOCK_ORG_ID,
            context: complexContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'send-notification' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        
        // Check that fetch was called with resolved parameters
        expect(fetch).toHaveBeenCalledWith(
          '/api/notifications/send',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              recipients: ['john@example.com'],
              subject: 'Update from Test Corporation',
              body: 'Hello John Doe, this is an update from your organization.',
              metadata: {
                sender_id: MOCK_USER_ID,
                organization_id: MOCK_ORG_ID,
                timestamp: '2024-01-20T15:30:00Z'
              }
            })
          })
        )
      })
    })

    describe('Error Handling', () => {
      it('returns 404 when tile not found', async () => {
        const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
        vi.mocked(getResolvedTileConfig).mockResolvedValue(null)

        const request = createMockRequest(
          { tileId: 'nonexistent-tile', actionId: 'some-action' },
          { organization_id: MOCK_ORG_ID }
        )

        const response = await POST(request, {
          params: { tileId: 'nonexistent-tile', actionId: 'some-action' }
        })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('TILE_NOT_FOUND')
      })

      it('returns 404 when action not found', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'nonexistent-action' },
          { organization_id: MOCK_ORG_ID }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'nonexistent-action' }
        })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('ACTION_NOT_FOUND')
      })

      it('returns 400 when organization_id is missing', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' },
          {} // Missing organization_id
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('MISSING_ORGANIZATION_ID')
      })

      it('handles tile condition failures', async () => {
        const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
        const mockEvaluator = new DSLEvaluator()
        
        // Mock tile-level condition failure
        let evaluationCall = 0
        vi.mocked(mockEvaluator.evaluateConditions).mockImplementation(() => {
          evaluationCall++
          return evaluationCall > 1 // Fail tile conditions, pass action conditions
        })

        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('TILE_CONDITIONS_NOT_MET')
      })
    })

    describe('Telemetry Integration', () => {
      it('logs action execution telemetry', async () => {
        mockSupabase.from.mockImplementation(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis()
        }))

        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' }
        })

        expect(response.status).toBe(200)
        
        // Should log telemetry
        expect(mockSupabase.from).toHaveBeenCalledWith('universal_transactions')
      })

      it('includes execution metadata in response', async () => {
        const request = createMockRequest(
          { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' },
          {
            organization_id: MOCK_ORG_ID,
            context: mockEvaluationContext
          }
        )

        const response = await POST(request, {
          params: { tileId: MOCK_TILE_ID, actionId: 'navigate-customers' }
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.metadata).toBeDefined()
        expect(data.metadata.tileId).toBe(MOCK_TILE_ID)
        expect(data.metadata.actionId).toBe('navigate-customers')
        expect(data.metadata.organizationId).toBe(MOCK_ORG_ID)
        expect(typeof data.metadata.executionTime).toBe('number')
        expect(data.metadata.actionType).toBe('NAVIGATE')
      })
    })
  })
})