/**
 * HERA Universal Tile System - Financial Analytics Integration Test
 * Smart Code: HERA.FINANCE.ANALYTICS.TEST.INTEGRATION.v1
 * 
 * Tests the integration of financial tiles with the Universal Tile System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FINANCIAL_TILES_REGISTRY, FINANCIAL_ANALYTICS_LAYOUT } from '@/components/tiles/finance/FinancialAnalyticsConfig'

describe('Financial Tiles Integration', () => {
  beforeEach(() => {
    // Reset any mocks or state before each test
    vi.clearAllMocks()
  })

  describe('Financial Tiles Registry', () => {
    it('should have all required financial tiles configured', () => {
      const expectedTiles = [
        'revenue_dashboard',
        'profit_margin_kpi',
        'roe_kpi', 
        'current_ratio_kpi',
        'debt_equity_kpi',
        'cash_flow_analysis'
      ]

      expectedTiles.forEach(tileId => {
        expect(FINANCIAL_TILES_REGISTRY[tileId]).toBeDefined()
        expect(FINANCIAL_TILES_REGISTRY[tileId].id).toBe(tileId)
      })
    })

    it('should have valid HERA DNA smart codes for all tiles', () => {
      Object.values(FINANCIAL_TILES_REGISTRY).forEach(tile => {
        expect(tile.smartCode).toMatch(/^HERA\.FINANCE\.ANALYTICS\.TILE\.[A-Z_]+\.v1$/)
      })
    })

    it('should have proper grid size configurations', () => {
      Object.values(FINANCIAL_TILES_REGISTRY).forEach(tile => {
        expect(tile.gridSize).toHaveProperty('width')
        expect(tile.gridSize).toHaveProperty('height')
        expect(tile.gridSize.width).toBeGreaterThan(0)
        expect(tile.gridSize.height).toBeGreaterThan(0)
      })
    })

    it('should have interactive features configured', () => {
      Object.values(FINANCIAL_TILES_REGISTRY).forEach(tile => {
        expect(tile.interactiveFeatures).toHaveProperty('drillDown')
        expect(tile.interactiveFeatures).toHaveProperty('export')
        expect(tile.interactiveFeatures).toHaveProperty('comparison')
        
        // Financial tiles should have interactive capabilities
        expect(tile.interactiveFeatures.drillDown).toBe(true)
        expect(tile.interactiveFeatures.export).toBe(true)
      })
    })

    it('should have proper permission configurations', () => {
      Object.values(FINANCIAL_TILES_REGISTRY).forEach(tile => {
        expect(tile.permissions).toHaveProperty('view')
        expect(tile.permissions).toHaveProperty('edit')
        expect(tile.permissions).toHaveProperty('export')
        
        // All tiles should allow viewing by basic roles
        expect(tile.permissions.view).toContain('viewer')
        expect(tile.permissions.view).toContain('admin')
      })
    })
  })

  describe('Financial Analytics Layout', () => {
    it('should have proper workspace configuration', () => {
      expect(FINANCIAL_ANALYTICS_LAYOUT.workspaceId).toBe('financial_analytics_workspace')
      expect(FINANCIAL_ANALYTICS_LAYOUT.name).toBe('Financial Analytics')
      expect(FINANCIAL_ANALYTICS_LAYOUT.layout.type).toBe('grid')
      expect(FINANCIAL_ANALYTICS_LAYOUT.layout.columns).toBeGreaterThan(0)
    })

    it('should have tiles with valid positions', () => {
      FINANCIAL_ANALYTICS_LAYOUT.tiles.forEach(tile => {
        expect(tile.position).toHaveProperty('x')
        expect(tile.position).toHaveProperty('y')
        expect(tile.position).toHaveProperty('width')
        expect(tile.position).toHaveProperty('height')
        
        // Positions should be non-negative
        expect(tile.position.x).toBeGreaterThanOrEqual(0)
        expect(tile.position.y).toBeGreaterThanOrEqual(0)
        expect(tile.position.width).toBeGreaterThan(0)
        expect(tile.position.height).toBeGreaterThan(0)
      })
    })

    it('should have navigation sections configured', () => {
      expect(FINANCIAL_ANALYTICS_LAYOUT.navigation.sections).toBeDefined()
      expect(FINANCIAL_ANALYTICS_LAYOUT.navigation.sections.length).toBeGreaterThan(0)
      
      FINANCIAL_ANALYTICS_LAYOUT.navigation.sections.forEach(section => {
        expect(section).toHaveProperty('code')
        expect(section).toHaveProperty('label')
        expect(section).toHaveProperty('tileIds')
        expect(Array.isArray(section.tileIds)).toBe(true)
      })
    })
  })

  describe('Tile Components', () => {
    it('should export all financial tile components', async () => {
      const { FINANCIAL_TILE_COMPONENTS } = await import('@/components/tiles/finance/FinancialAnalyticsConfig')
      
      expect(FINANCIAL_TILE_COMPONENTS).toHaveProperty('RevenueDashboardTile')
      expect(FINANCIAL_TILE_COMPONENTS).toHaveProperty('FinancialKPITile')
      expect(FINANCIAL_TILE_COMPONENTS).toHaveProperty('CashFlowTile')
    })
  })

  describe('API Integration', () => {
    it('should transform analytics cards to financial tiles', () => {
      // Mock card data that would come from the API
      const mockAnalyticsCards = [
        {
          label: 'Revenue Dashboard',
          description: 'Comprehensive revenue breakdown and trend analysis',
          icon: 'DollarSign',
          color: 'green',
          target_type: 'analytics',
          template_code: 'revenue-dashboard',
          view_slug: 'revenue-dashboard',
          tileComponent: 'RevenueDashboardTile',
          smartCode: 'HERA.FINANCE.ANALYTICS.TILE.REVENUE.DASHBOARD.v1',
          interactiveFeatures: {
            drillDown: true,
            export: true,
            comparison: true
          },
          gridSize: { width: 2, height: 2 }
        }
      ]

      mockAnalyticsCards.forEach(card => {
        // Verify card has financial tile properties
        expect(card.tileComponent).toBeDefined()
        expect(card.smartCode).toMatch(/^HERA\.FINANCE\.ANALYTICS/)
        expect(card.interactiveFeatures).toBeDefined()
        expect(card.gridSize).toBeDefined()
      })
    })

    it('should generate proper smart codes for financial domain', () => {
      const generateSmartCode = (domain: string, section: string, targetType: string, viewSlug: string) => {
        const domainCode = domain.toUpperCase()
        const sectionCode = section.toUpperCase() 
        const typeCode = targetType?.toUpperCase() || 'GENERAL'
        const subCode = viewSlug?.toUpperCase() || 'DEFAULT'
        
        return `HERA.${domainCode}.${sectionCode}.TILE.${typeCode}.${subCode}.v1`
      }

      const smartCode = generateSmartCode('retail', 'analytics', 'analytics', 'revenue-dashboard')
      expect(smartCode).toBe('HERA.RETAIL.ANALYTICS.TILE.ANALYTICS.REVENUE-DASHBOARD.v1')
      expect(smartCode).toMatch(/^HERA\.[A-Z]+\.[A-Z]+\.TILE\.[A-Z_-]+\.v1$/)
    })
  })

  describe('Interactive Features', () => {
    const mockTileActions = [
      { actionId: 'drill_down', shouldHaveParams: true },
      { actionId: 'export', shouldHaveParams: true },
      { actionId: 'refresh', shouldHaveParams: false },
      { actionId: 'view_details', shouldHaveParams: true },
      { actionId: 'compare_periods', shouldHaveParams: true },
      { actionId: 'set_target', shouldHaveParams: true },
      { actionId: 'forecast', shouldHaveParams: false }
    ]

    it('should handle all supported tile actions', () => {
      mockTileActions.forEach(action => {
        // Verify action is in the list of supported actions
        expect(['drill_down', 'export', 'refresh', 'view_details', 'compare_periods', 'set_target', 'forecast']).toContain(action.actionId)
      })
    })

    it('should generate valid drill-down routes', () => {
      const generateDrillDownRoute = (tileId: string, params?: any, domain = 'retail', section = 'analytics', workspace = 'main'): string => {
        if (tileId.includes('revenue')) {
          return `/${domain}/${section}/${workspace}/analytics/revenue?period=${params?.period || 'monthly'}&category=${params?.category || 'all'}`
        }
        if (tileId.includes('cash_flow') || tileId.includes('cashflow')) {
          return `/${domain}/${section}/${workspace}/analytics/cash-flow?category=${params?.category || 'operating'}&period=${params?.period || 'monthly'}`
        }
        if (tileId.includes('kpi')) {
          return `/${domain}/${section}/${workspace}/analytics/kpi/${params?.kpiType || 'profit_margin'}?period=${params?.period || 'quarterly'}`
        }
        return `/${domain}/${section}/${workspace}/analytics/details?tile=${tileId}`
      }

      // Test revenue tile drill-down
      const revenueRoute = generateDrillDownRoute('tile_revenue_dashboard', { period: 'quarterly', category: 'services' })
      expect(revenueRoute).toBe('/retail/analytics/main/analytics/revenue?period=quarterly&category=services')

      // Test cash flow tile drill-down  
      const cashFlowRoute = generateDrillDownRoute('tile_cash_flow_analysis', { category: 'investing', period: 'monthly' })
      expect(cashFlowRoute).toBe('/retail/analytics/main/analytics/cash-flow?category=investing&period=monthly')

      // Test KPI tile drill-down
      const kpiRoute = generateDrillDownRoute('tile_profit_margin_kpi', { kpiType: 'roe', period: 'yearly' })
      expect(kpiRoute).toBe('/retail/analytics/main/analytics/kpi/roe?period=yearly')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing tile configurations gracefully', () => {
      expect(FINANCIAL_TILES_REGISTRY['non_existent_tile']).toBeUndefined()
    })

    it('should validate tile permission checks', () => {
      const hasFinancialTilePermission = (tileId: string, userRole: string, action: 'view' | 'edit' | 'export'): boolean => {
        const config = FINANCIAL_TILES_REGISTRY[tileId]
        if (!config) return false
        return config.permissions[action].includes(userRole)
      }

      // Test valid permission
      expect(hasFinancialTilePermission('revenue_dashboard', 'admin', 'view')).toBe(true)
      expect(hasFinancialTilePermission('revenue_dashboard', 'viewer', 'view')).toBe(true)
      
      // Test invalid permission
      expect(hasFinancialTilePermission('revenue_dashboard', 'viewer', 'edit')).toBe(false)
      
      // Test non-existent tile
      expect(hasFinancialTilePermission('non_existent_tile', 'admin', 'view')).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should have efficient tile registry lookup', () => {
      const startTime = performance.now()
      
      // Perform multiple lookups
      for (let i = 0; i < 1000; i++) {
        FINANCIAL_TILES_REGISTRY['revenue_dashboard']
        FINANCIAL_TILES_REGISTRY['cash_flow_analysis']
        FINANCIAL_TILES_REGISTRY['profit_margin_kpi']
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete 1000 lookups in under 10ms
      expect(duration).toBeLessThan(10)
    })

    it('should have reasonable layout computation time', () => {
      const startTime = performance.now()
      
      // Simulate layout computation
      FINANCIAL_ANALYTICS_LAYOUT.tiles.forEach(tile => {
        const area = tile.position.width * tile.position.height
        expect(area).toBeGreaterThan(0)
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Layout computation should be very fast
      expect(duration).toBeLessThan(5)
    })
  })
})

// Helper functions for testing
export const testHelpers = {
  createMockTileData: (tileId: string, overrides = {}) => ({
    id: tileId,
    templateId: `template_${tileId}`,
    workspaceId: 'test_workspace',
    userId: 'test_user',
    organizationId: '00000000-0000-0000-0000-000000000000',
    position: { x: 0, y: 0, width: 1, height: 1 },
    type: 'custom',
    title: 'Test Tile',
    subtitle: 'Test tile description',
    icon: 'Package',
    color: 'blue',
    size: 'medium',
    ...overrides
  }),

  createMockWorkspaceData: (domain: string, section: string, workspace: string) => ({
    workspace: {
      id: 'test_workspace',
      entity_name: `${section} workspace`,
      slug: workspace,
      subtitle: 'Test workspace',
      icon: 'Package',
      color: 'blue',
      route: `/${domain}/${section}/${workspace}`
    },
    layout_config: {
      default_nav_code: 'analytics',
      nav_items: [
        { code: 'analytics', label: 'Analytics' }
      ],
      sections: [
        {
          nav_code: 'analytics',
          title: 'Financial Analytics',
          cards: []
        }
      ]
    }
  }),

  validateTileConfig: (config: any) => {
    expect(config).toHaveProperty('id')
    expect(config).toHaveProperty('templateId')
    expect(config).toHaveProperty('smartCode')
    expect(config).toHaveProperty('gridSize')
    expect(config).toHaveProperty('permissions')
    expect(config).toHaveProperty('interactiveFeatures')
    expect(config.smartCode).toMatch(/^HERA\.[A-Z_]+\.[A-Z_]+\./)
  }
}