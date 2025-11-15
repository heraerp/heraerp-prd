/**
 * HERA Universal Tile System - TileStatsDisplay Unit Tests
 * Comprehensive test suite for the TileStatsDisplay component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TileStatsDisplay } from '@/components/tiles/TileStatsDisplay'
import { ResolvedTileConfig } from '@/lib/tiles/resolved-tile-config'
import { useTileStats } from '@/lib/tiles/use-tile-stats'

// Mock hooks
vi.mock('@/lib/tiles/use-tile-stats')

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

// Test data
const mockTile: ResolvedTileConfig = {
  tileId: 'test-stats-tile',
  workspaceId: 'test-workspace',
  templateId: 'analytics-template',
  tileType: 'ANALYTICS',
  operationCategory: 'reporting',
  enabled: true,
  
  ui: {
    title: 'Sales Analytics',
    subtitle: 'Revenue and performance metrics',
    icon: 'BarChart3',
    color: '#10B981'
  },
  
  layout: {
    size: 'medium',
    position: 1
  },
  
  conditions: [],
  
  stats: [
    {
      statId: 'total-revenue',
      label: 'Total Revenue',
      query: {
        table: 'universal_transactions',
        operation: 'sum',
        field: 'total_amount',
        conditions: [
          { field: 'transaction_type', operator: 'equals', value: 'SALE' }
        ]
      },
      format: 'currency',
      isPrivate: true
    },
    {
      statId: 'transaction-count',
      label: 'Transactions',
      query: {
        table: 'universal_transactions',
        operation: 'count',
        conditions: [
          { field: 'transaction_type', operator: 'equals', value: 'SALE' }
        ]
      },
      format: 'number',
      isPrivate: false
    },
    {
      statId: 'conversion-rate',
      label: 'Conversion Rate',
      query: {
        table: 'core_entities',
        operation: 'custom',
        customQuery: 'conversion_rate_calculation'
      },
      format: 'percentage',
      isPrivate: false
    }
  ],
  
  actions: []
}

const mockStatsData = [
  {
    statId: 'total-revenue',
    value: 125000.50,
    formattedValue: '$125,000.50',
    label: 'Total Revenue',
    format: 'currency',
    executionTime: 89,
    error: null,
    trend: {
      direction: 'up' as const,
      percentage: 15.3,
      previousValue: 108500
    }
  },
  {
    statId: 'transaction-count',
    value: 1847,
    formattedValue: '1,847',
    label: 'Transactions',
    format: 'number',
    executionTime: 42,
    error: null,
    trend: {
      direction: 'up' as const,
      percentage: 8.2,
      previousValue: 1706
    }
  },
  {
    statId: 'conversion-rate',
    value: 0.234,
    formattedValue: '23.4%',
    label: 'Conversion Rate',
    format: 'percentage',
    executionTime: 156,
    error: null,
    trend: {
      direction: 'down' as const,
      percentage: 2.1,
      previousValue: 0.239
    }
  }
]

const mockStatsWithError = [
  ...mockStatsData.slice(0, 2),
  {
    statId: 'conversion-rate',
    value: 0,
    formattedValue: 'Error',
    label: 'Conversion Rate',
    format: 'percentage',
    executionTime: 0,
    error: {
      code: 'QUERY_TIMEOUT',
      message: 'Query execution timed out'
    },
    trend: null
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

describe('TileStatsDisplay Component', () => {
  const defaultProps = {
    tile: mockTile,
    organizationId: 'test-org'
  }

  const mockUseTileStats = vi.mocked(useTileStats)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation
    mockUseTileStats.mockReturnValue({
      stats: mockStatsData,
      isLoading: false,
      isError: false,
      error: null,
      refresh: vi.fn(),
      isRefreshing: false
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Layout Variants', () => {
    it('renders compact layout correctly', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} layout="compact" />
        </TestWrapper>
      )

      // Compact layout shows first 4 stats in 2x2 grid
      expect(screen.getByText('$125,000.50')).toBeInTheDocument()
      expect(screen.getByText('1,847')).toBeInTheDocument()
      expect(screen.getByText('23.4%')).toBeInTheDocument()
      
      // Should have grid layout
      const gridContainer = screen.getByText('$125,000.50').closest('.grid')
      expect(gridContainer).toHaveClass('grid-cols-2')
    })

    it('renders standard layout with primary and secondary stats', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} layout="standard" />
        </TestWrapper>
      )

      // Primary stat (first one marked as private or with 'total'/'primary' in statId)
      expect(screen.getByText('$125,000.50')).toBeInTheDocument()
      
      // Secondary stats
      expect(screen.getByText('1,847')).toBeInTheDocument()
      expect(screen.getByText('23.4%')).toBeInTheDocument()
    })

    it('renders detailed layout with execution times', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} layout="detailed" />
        </TestWrapper>
      )

      // Should show execution times
      expect(screen.getByText('Executed in 89ms')).toBeInTheDocument()
      expect(screen.getByText('Executed in 42ms')).toBeInTheDocument()
      expect(screen.getByText('Executed in 156ms')).toBeInTheDocument()
    })
  })

  describe('Controls and Interactions', () => {
    it('renders time range selector', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Week')).toBeInTheDocument()
      expect(screen.getByText('Month')).toBeInTheDocument()
    })

    it('handles time range selection', async () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} />
        </TestWrapper>
      )

      const weekButton = screen.getByText('Week')
      fireEvent.click(weekButton)

      // useTileStats should be called again with new context
      await waitFor(() => {
        expect(mockUseTileStats).toHaveBeenCalledWith(
          expect.objectContaining({
            context: { timeRange: 'week' }
          })
        )
      })
    })

    it('handles refresh button click', async () => {
      const refreshMock = vi.fn()
      const onRefreshMock = vi.fn()
      
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
          <TileStatsDisplay {...defaultProps} onRefresh={onRefreshMock} />
        </TestWrapper>
      )

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(refreshMock).toHaveBeenCalled()
        expect(onRefreshMock).toHaveBeenCalled()
      })
    })

    it('shows refresh button when enabled', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showRefresh={true} />
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('hides refresh button when disabled', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showRefresh={false} />
        </TestWrapper>
      )

      expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument()
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
          <TileStatsDisplay {...defaultProps} />
        </TestWrapper>
      )

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeDisabled()
      
      // Should have spinning icon
      const spinIcon = refreshButton.querySelector('.animate-spin')
      expect(spinIcon).toBeInTheDocument()
    })
  })

  describe('Trend Indicators', () => {
    it('displays trend indicators when showTrends is true', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showTrends={true} />
        </TestWrapper>
      )

      // Should show trend percentages
      expect(screen.getByText('15.3%')).toBeInTheDocument()
      expect(screen.getByText('8.2%')).toBeInTheDocument()
      expect(screen.getByText('2.1%')).toBeInTheDocument()
    })

    it('hides trend indicators when showTrends is false', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showTrends={false} />
        </TestWrapper>
      )

      // Trend percentages should not be visible
      expect(screen.queryByText('15.3%')).not.toBeInTheDocument()
      expect(screen.queryByText('8.2%')).not.toBeInTheDocument()
    })

    it('shows correct trend direction styles', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showTrends={true} />
        </TestWrapper>
      )

      // Up trends should have green styling
      const upTrend = screen.getByText('15.3%').closest('div')
      expect(upTrend).toHaveClass('text-green-700', 'bg-green-100')

      // Down trends should have red styling
      const downTrend = screen.getByText('2.1%').closest('div')
      expect(downTrend).toHaveClass('text-red-700', 'bg-red-100')
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton when data is loading', () => {
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
          <TileStatsDisplay {...defaultProps} layout="compact" />
        </TestWrapper>
      )

      // Should show skeleton loading state
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('shows correct loading skeleton count based on stats length', () => {
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
          <TileStatsDisplay {...defaultProps} layout="compact" />
        </TestWrapper>
      )

      // Compact layout should show up to 4 skeleton items
      const gridContainer = document.querySelector('.grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('shows error state when data loading fails', () => {
      mockUseTileStats.mockReturnValue({
        stats: [],
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch stats'),
        refresh: vi.fn(),
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showErrors={true} />
        </TestWrapper>
      )

      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch stats')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })

    it('shows individual stat errors when some stats fail', () => {
      mockUseTileStats.mockReturnValue({
        stats: mockStatsWithError,
        isLoading: false,
        isError: false,
        error: null,
        refresh: vi.fn(),
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} layout="detailed" showErrors={true} />
        </TestWrapper>
      )

      // Should show error indicator for failed stat
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('shows error indicator when some stats have errors', () => {
      mockUseTileStats.mockReturnValue({
        stats: mockStatsWithError,
        isLoading: false,
        isError: false,
        error: null,
        refresh: vi.fn(),
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showErrors={true} />
        </TestWrapper>
      )

      expect(screen.getByText('1 stat failed to load')).toBeInTheDocument()
    })

    it('handles retry from error state', async () => {
      const refreshMock = vi.fn()
      
      mockUseTileStats.mockReturnValue({
        stats: [],
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch stats'),
        refresh: refreshMock,
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showErrors={true} />
        </TestWrapper>
      )

      const retryButton = screen.getByText('Try again')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(refreshMock).toHaveBeenCalled()
      })
    })
  })

  describe('Stat Limits and Filtering', () => {
    it('limits stats when maxStats is specified', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} maxStats={2} />
        </TestWrapper>
      )

      expect(screen.getByText('$125,000.50')).toBeInTheDocument()
      expect(screen.getByText('1,847')).toBeInTheDocument()
      expect(screen.queryByText('23.4%')).not.toBeInTheDocument()
    })

    it('handles stat click events', async () => {
      const onStatClickMock = vi.fn()

      render(
        <TestWrapper>
          <TileStatsDisplay 
            {...defaultProps} 
            layout="detailed"
            onStatClick={onStatClickMock}
          />
        </TestWrapper>
      )

      // Click on a stat card
      const statCard = screen.getByText('Total Revenue').closest('div')
      if (statCard) {
        fireEvent.click(statCard)
      }

      await waitFor(() => {
        expect(onStatClickMock).toHaveBeenCalledWith(mockStatsData[0])
      })
    })
  })

  describe('Auto-refresh Configuration', () => {
    it('enables auto-refresh by default', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} autoRefresh={true} />
        </TestWrapper>
      )

      expect(mockUseTileStats).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchInterval: 60000
        })
      )
    })

    it('disables auto-refresh when specified', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} autoRefresh={false} />
        </TestWrapper>
      )

      expect(mockUseTileStats).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchInterval: undefined
        })
      )
    })

    it('uses custom refresh interval', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay 
            {...defaultProps} 
            autoRefresh={true}
            refreshInterval={30000}
          />
        </TestWrapper>
      )

      expect(mockUseTileStats).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchInterval: 30000
        })
      )
    })
  })

  describe('Format-Specific Display', () => {
    it('shows correct icons for different stat formats', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} layout="detailed" />
        </TestWrapper>
      )

      // Each stat format should have its corresponding icon
      // Note: Icons are rendered as SVG elements, exact testing depends on icon implementation
      const statCards = screen.getAllByText(/Total Revenue|Transactions|Conversion Rate/)
      expect(statCards).toHaveLength(3)
    })

    it('applies correct colors for different stat formats', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} layout="primary" />
        </TestWrapper>
      )

      // Currency stats should have green coloring
      const revenueIcon = screen.getByText('Total Revenue').closest('div')?.querySelector('[class*="text-green-600"]')
      expect(revenueIcon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Statistics')).toBeInTheDocument()
    })

    it('provides accessible refresh button', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showRefresh={true} />
        </TestWrapper>
      )

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toHaveAttribute('title')
    })

    it('provides accessible time range buttons', () => {
      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} />
        </TestWrapper>
      )

      const timeRangeButtons = screen.getAllByRole('button', { name: /Today|Week|Month/ })
      expect(timeRangeButtons).toHaveLength(3)
      timeRangeButtons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty stats array', () => {
      mockUseTileStats.mockReturnValue({
        stats: [],
        isLoading: false,
        isError: false,
        error: null,
        refresh: vi.fn(),
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} />
        </TestWrapper>
      )

      // Should still show header and controls
      expect(screen.getByText('Statistics')).toBeInTheDocument()
    })

    it('handles stats without trends', () => {
      const statsWithoutTrends = mockStatsData.map(stat => ({
        ...stat,
        trend: null
      }))

      mockUseTileStats.mockReturnValue({
        stats: statsWithoutTrends,
        isLoading: false,
        isError: false,
        error: null,
        refresh: vi.fn(),
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} showTrends={true} />
        </TestWrapper>
      )

      // Should show stats without trend indicators
      expect(screen.getByText('$125,000.50')).toBeInTheDocument()
      expect(screen.queryByText('15.3%')).not.toBeInTheDocument()
    })

    it('handles very long stat labels gracefully', () => {
      const statsWithLongLabels = [{
        ...mockStatsData[0],
        label: 'This is a very long stat label that should be truncated properly to avoid layout issues'
      }]

      mockUseTileStats.mockReturnValue({
        stats: statsWithLongLabels,
        isLoading: false,
        isError: false,
        error: null,
        refresh: vi.fn(),
        isRefreshing: false
      })

      render(
        <TestWrapper>
          <TileStatsDisplay {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText(/This is a very long stat label/)).toBeInTheDocument()
    })
  })
})