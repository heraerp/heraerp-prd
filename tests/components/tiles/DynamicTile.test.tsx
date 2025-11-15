/**
 * HERA Universal Tile System - DynamicTile Unit Tests
 * Comprehensive test suite for the core DynamicTile component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DynamicTile } from '@/components/tiles/DynamicTile'
import { ResolvedTileConfig } from '@/lib/tiles/resolved-tile-config'
import { useTileStats } from '@/lib/tiles/use-tile-stats'
import { useTileActions } from '@/lib/tiles/use-tile-actions'
import { useTileTelemetry } from '@/lib/tiles/tile-telemetry'

// Mock hooks
vi.mock('@/lib/tiles/use-tile-stats')
vi.mock('@/lib/tiles/use-tile-actions')
vi.mock('@/lib/tiles/tile-telemetry')

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

// Test data
const mockTile: ResolvedTileConfig = {
  tileId: 'test-tile-1',
  workspaceId: 'test-workspace',
  templateId: 'entities-template',
  tileType: 'ENTITIES',
  operationCategory: 'data_management',
  enabled: true,
  
  ui: {
    title: 'Customer Entities',
    subtitle: 'Manage customer records',
    icon: 'Database',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600'
  },
  
  layout: {
    size: 'medium',
    position: 1
  },
  
  conditions: [],
  
  stats: [
    {
      statId: 'total-customers',
      label: 'Total Customers',
      query: {
        table: 'core_entities',
        operation: 'count',
        conditions: [
          { field: 'entity_type', operator: 'equals', value: 'CUSTOMER' }
        ]
      },
      format: 'number',
      isPrivate: false
    }
  ],
  
  actions: [
    {
      actionId: 'view-customers',
      label: 'View All',
      icon: 'Eye',
      actionType: 'NAVIGATE',
      isPrimary: true,
      requiresConfirmation: false,
      requiresPermission: false,
      route: '/customers',
      parameters: {}
    },
    {
      actionId: 'create-customer',
      label: 'Create New',
      icon: 'Plus',
      actionType: 'NAVIGATE',
      isPrimary: false,
      requiresConfirmation: false,
      requiresPermission: true,
      route: '/customers/new',
      parameters: {}
    }
  ]
}

const mockStatsData = [
  {
    statId: 'total-customers',
    value: 1250,
    formattedValue: '1,250',
    label: 'Total Customers',
    format: 'number',
    executionTime: 45,
    error: null,
    trend: {
      direction: 'up' as const,
      percentage: 12.5,
      previousValue: 1111
    }
  }
]

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('DynamicTile Component', () => {
  const defaultProps = {
    tile: mockTile,
    organizationId: 'test-org',
    actorUserId: 'test-user',
    workspacePath: '/workspaces/test-workspace'
  }

  const mockUseTileStats = vi.mocked(useTileStats)
  const mockUseTileActions = vi.mocked(useTileActions)
  const mockUseTileTelemetry = vi.mocked(useTileTelemetry)

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUseTileStats.mockReturnValue({
      stats: mockStatsData,
      isLoading: false,
      isError: false,
      error: null,
      refresh: vi.fn(),
      isRefreshing: false
    })
    
    mockUseTileActions.mockReturnValue({
      executeAction: vi.fn(),
      isExecuting: false,
      lastExecution: null,
      confirmPendingAction: vi.fn(),
      cancelPendingAction: vi.fn()
    })
    
    mockUseTileTelemetry.mockReturnValue({
      trackAction: vi.fn(),
      trackStats: vi.fn(),
      trackError: vi.fn(),
      trackPerformance: vi.fn(),
      client: {} as any
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Rendering', () => {
    it('renders tile with basic information', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Customer Entities')).toBeInTheDocument()
      expect(screen.getByText('Manage customer records')).toBeInTheDocument()
      expect(screen.getByText('ENTITIES')).toBeInTheDocument()
      expect(screen.getByText('data_management')).toBeInTheDocument()
    })

    it('applies correct size classes', () => {
      const { rerender } = render(
        <TestWrapper>
          <DynamicTile {...defaultProps} size="small" />
        </TestWrapper>
      )

      let tileElement = screen.getByText('Customer Entities').closest('.relative')
      expect(tileElement).toHaveClass('min-h-[200px]')

      rerender(
        <TestWrapper>
          <DynamicTile {...defaultProps} size="large" />
        </TestWrapper>
      )

      tileElement = screen.getByText('Customer Entities').closest('.relative')
      expect(tileElement).toHaveClass('min-h-[360px]')
    })

    it('renders gradient background when specified', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} />
        </TestWrapper>
      )

      const gradientElement = screen.getByText('Customer Entities')
        .closest('.relative')
        ?.querySelector('.absolute.inset-0')
      
      expect(gradientElement).toHaveClass('bg-gradient-to-br', 'from-blue-500', 'to-blue-600')
    })

    it('conditionally renders stats section', () => {
      const { rerender } = render(
        <TestWrapper>
          <DynamicTile {...defaultProps} showStats={true} />
        </TestWrapper>
      )

      expect(screen.getByText('1,250')).toBeInTheDocument()

      rerender(
        <TestWrapper>
          <DynamicTile {...defaultProps} showStats={false} />
        </TestWrapper>
      )

      expect(screen.queryByText('1,250')).not.toBeInTheDocument()
    })

    it('conditionally renders actions section', () => {
      const { rerender } = render(
        <TestWrapper>
          <DynamicTile {...defaultProps} showActions={true} />
        </TestWrapper>
      )

      expect(screen.getByText('View All')).toBeInTheDocument()

      rerender(
        <TestWrapper>
          <DynamicTile {...defaultProps} showActions={false} />
        </TestWrapper>
      )

      expect(screen.queryByText('View All')).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('handles tile click when interactive', async () => {
      const onClickMock = vi.fn()
      const trackActionMock = vi.fn()
      
      mockUseTileTelemetry.mockReturnValue({
        trackAction: trackActionMock,
        trackStats: vi.fn(),
        trackError: vi.fn(),
        trackPerformance: vi.fn(),
        client: {} as any
      })

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} interactive={true} onClick={onClickMock} />
        </TestWrapper>
      )

      const tileElement = screen.getByText('Customer Entities').closest('.relative')
      if (tileElement) {
        fireEvent.click(tileElement)
      }

      await waitFor(() => {
        expect(trackActionMock).toHaveBeenCalledWith({
          tileId: 'test-tile-1',
          actionId: 'tile_click',
          organizationId: 'test-org',
          actorUserId: 'test-user',
          executionTime: 0,
          status: 'success',
          parameters: { tileType: 'ENTITIES' }
        })
        expect(onClickMock).toHaveBeenCalledWith(mockTile)
      })
    })

    it('does not handle tile click when not interactive', () => {
      const onClickMock = vi.fn()

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} interactive={false} onClick={onClickMock} />
        </TestWrapper>
      )

      const tileElement = screen.getByText('Customer Entities').closest('.relative')
      if (tileElement) {
        fireEvent.click(tileElement)
      }

      expect(onClickMock).not.toHaveBeenCalled()
    })

    it('handles quick action clicks', async () => {
      const executeActionMock = vi.fn()
      const onActionExecuteMock = vi.fn()
      
      mockUseTileActions.mockReturnValue({
        executeAction: executeActionMock,
        isExecuting: false,
        lastExecution: null,
        confirmPendingAction: vi.fn(),
        cancelPendingAction: vi.fn()
      })

      render(
        <TestWrapper>
          <DynamicTile 
            {...defaultProps} 
            showActions={true}
            onActionExecute={onActionExecuteMock}
          />
        </TestWrapper>
      )

      const viewButton = screen.getByText('View All')
      fireEvent.click(viewButton)

      await waitFor(() => {
        expect(executeActionMock).toHaveBeenCalledWith('view-customers')
      })
    })

    it('handles stats refresh', async () => {
      const refreshMock = vi.fn()
      const onStatsRefreshMock = vi.fn()
      
      mockUseTileStats.mockReturnValue({
        stats: mockStatsData,
        isLoading: false,
        isError: false,
        error: null,
        refresh: refreshMock,
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <DynamicTile 
            {...defaultProps} 
            showStats={true}
            onStatsRefresh={onStatsRefreshMock}
          />
        </TestWrapper>
      )

      const refreshButton = screen.getByText('Refresh')
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(refreshMock).toHaveBeenCalled()
        expect(onStatsRefreshMock).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('displays loading skeleton when stats are loading', () => {
      mockUseTileStats.mockReturnValue({
        stats: [],
        isLoading: true,
        isError: false,
        error: null,
        refresh: vi.fn(),
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} showStats={true} />
        </TestWrapper>
      )

      // Check for loading skeleton elements
      const skeletons = screen.getAllByRole('generic')
      const hasLoadingSkeleton = skeletons.some(el => 
        el.className.includes('animate-pulse') || 
        el.className.includes('bg-gray-200')
      )
      expect(hasLoadingSkeleton).toBe(true)
    })

    it('shows refreshing state', () => {
      mockUseTileStats.mockReturnValue({
        stats: mockStatsData,
        isLoading: false,
        isError: false,
        error: null,
        refresh: vi.fn(),
        isRefreshing: true
      })

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} showStats={true} />
        </TestWrapper>
      )

      const refreshButton = screen.getByText('Refreshing...')
      expect(refreshButton).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('tracks errors when tile click fails', async () => {
      const trackErrorMock = vi.fn()
      const onClickMock = vi.fn().mockImplementation(() => {
        throw new Error('Click failed')
      })
      
      mockUseTileTelemetry.mockReturnValue({
        trackAction: vi.fn(),
        trackStats: vi.fn(),
        trackError: trackErrorMock,
        trackPerformance: vi.fn(),
        client: {} as any
      })

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} interactive={true} onClick={onClickMock} />
        </TestWrapper>
      )

      const tileElement = screen.getByText('Customer Entities').closest('.relative')
      if (tileElement) {
        fireEvent.click(tileElement)
      }

      await waitFor(() => {
        expect(trackErrorMock).toHaveBeenCalledWith({
          tileId: 'test-tile-1',
          organizationId: 'test-org',
          actorUserId: 'test-user',
          error: expect.any(Error),
          context: { action: 'tile_click' }
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('has correct accessibility attributes for interactive tiles', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} interactive={true} />
        </TestWrapper>
      )

      const tileElement = screen.getByText('Customer Entities').closest('.relative')
      expect(tileElement).toHaveClass('cursor-pointer')
    })

    it('has correct accessibility attributes for non-interactive tiles', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} interactive={false} />
        </TestWrapper>
      )

      const tileElement = screen.getByText('Customer Entities').closest('.relative')
      expect(tileElement).not.toHaveClass('cursor-pointer')
    })

    it('action buttons have proper labels and states', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} showActions={true} />
        </TestWrapper>
      )

      const viewButton = screen.getByText('View All')
      expect(viewButton.closest('button')).toBeInTheDocument()
      expect(viewButton.closest('button')).not.toBeDisabled()
    })

    it('disables action buttons when executing', () => {
      mockUseTileActions.mockReturnValue({
        executeAction: vi.fn(),
        isExecuting: true,
        lastExecution: null,
        confirmPendingAction: vi.fn(),
        cancelPendingAction: vi.fn()
      })

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} showActions={true} />
        </TestWrapper>
      )

      const viewButton = screen.getByText('View All')
      expect(viewButton.closest('button')).toBeDisabled()
    })
  })

  describe('Telemetry Integration', () => {
    it('initializes telemetry with correct parameters', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} />
        </TestWrapper>
      )

      expect(mockUseTileTelemetry).toHaveBeenCalledWith({
        tileId: 'test-tile-1',
        organizationId: 'test-org',
        actorUserId: 'test-user',
        workspaceId: 'test-workspace'
      })
    })

    it('tracks tile view on mount', () => {
      const trackActionMock = vi.fn()
      
      mockUseTileTelemetry.mockReturnValue({
        trackAction: trackActionMock,
        trackStats: vi.fn(),
        trackError: vi.fn(),
        trackPerformance: vi.fn(),
        client: {} as any
      })

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} />
        </TestWrapper>
      )

      // Note: The actual view tracking happens in useTileTelemetry hook
      // This test ensures the hook is called with correct parameters
      expect(mockUseTileTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          tileId: 'test-tile-1',
          organizationId: 'test-org',
          actorUserId: 'test-user'
        })
      )
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} className="custom-tile-class" />
        </TestWrapper>
      )

      const tileElement = screen.getByText('Customer Entities').closest('.relative')
      expect(tileElement).toHaveClass('custom-tile-class')
    })

    it('applies color styling from tile config', () => {
      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} />
        </TestWrapper>
      )

      const iconContainer = screen.getByText('ENTITIES').closest('span')?.parentElement
      expect(iconContainer).toHaveStyle({ color: '#3B82F6' })
    })
  })

  describe('Edge Cases', () => {
    it('handles tile without actions', () => {
      const tileWithoutActions = {
        ...mockTile,
        actions: []
      }

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} tile={tileWithoutActions} showActions={true} />
        </TestWrapper>
      )

      expect(screen.queryByText('View All')).not.toBeInTheDocument()
    })

    it('handles tile without stats', () => {
      const tileWithoutStats = {
        ...mockTile,
        stats: []
      }

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} tile={tileWithoutStats} showStats={true} />
        </TestWrapper>
      )

      expect(screen.queryByText('1,250')).not.toBeInTheDocument()
    })

    it('handles tile without subtitle', () => {
      const tileWithoutSubtitle = {
        ...mockTile,
        ui: {
          ...mockTile.ui,
          subtitle: undefined
        }
      }

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} tile={tileWithoutSubtitle} />
        </TestWrapper>
      )

      expect(screen.getByText('Customer Entities')).toBeInTheDocument()
      expect(screen.queryByText('Manage customer records')).not.toBeInTheDocument()
    })

    it('handles missing size in tile config', () => {
      const tileWithoutSize = {
        ...mockTile,
        layout: {
          ...mockTile.layout,
          size: undefined
        }
      }

      render(
        <TestWrapper>
          <DynamicTile {...defaultProps} tile={tileWithoutSize as any} />
        </TestWrapper>
      )

      const tileElement = screen.getByText('Customer Entities').closest('.relative')
      expect(tileElement).toHaveClass('min-h-[280px]') // Default medium size
    })
  })
})