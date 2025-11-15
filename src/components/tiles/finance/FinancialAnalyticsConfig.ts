/**
 * HERA Universal Tile System - Financial Analytics Configuration
 * Smart Code: HERA.FINANCE.ANALYTICS.CONFIG.TILES.v1
 * 
 * Configuration for financial analytics tiles with interactive features
 */

import { RevenueDashboardTile } from './RevenueDashboardTile'
import { FinancialKPITile } from './FinancialKPITile'
import { CashFlowTile } from './CashFlowTile'

export interface FinancialTileConfig {
  id: string
  templateId: string
  component: React.ComponentType<any>
  title: string
  subtitle: string
  type: 'revenue' | 'kpi' | 'cashflow' | 'profitability' | 'liquidity'
  category: 'performance' | 'analysis' | 'forecasting' | 'reporting'
  smartCode: string
  defaultProps: Record<string, any>
  gridSize: {
    width: number
    height: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
  }
  permissions: {
    view: string[]
    edit: string[]
    export: string[]
  }
  interactiveFeatures: {
    drillDown: boolean
    export: boolean
    comparison: boolean
    forecasting: boolean
    alerts: boolean
  }
}

/**
 * Financial Analytics Tile Registry
 * Maps tile types to their configurations and components
 */
export const FINANCIAL_TILES_REGISTRY: Record<string, FinancialTileConfig> = {
  // Revenue Dashboard Tile
  'revenue_dashboard': {
    id: 'revenue_dashboard',
    templateId: 'template_revenue_dashboard',
    component: RevenueDashboardTile,
    title: 'Revenue Dashboard',
    subtitle: 'Revenue breakdown and trend analysis',
    type: 'revenue',
    category: 'performance',
    smartCode: 'HERA.FINANCE.ANALYTICS.TILE.REVENUE.DASHBOARD.v1',
    defaultProps: {
      period: 'monthly',
      showBreakdown: true,
      showTrends: true
    },
    gridSize: {
      width: 2,
      height: 2,
      minWidth: 2,
      minHeight: 2,
      maxWidth: 4,
      maxHeight: 3
    },
    permissions: {
      view: ['viewer', 'analyst', 'manager', 'admin'],
      edit: ['manager', 'admin'],
      export: ['analyst', 'manager', 'admin']
    },
    interactiveFeatures: {
      drillDown: true,
      export: true,
      comparison: true,
      forecasting: false,
      alerts: true
    }
  },

  // Financial KPI Tiles
  'profit_margin_kpi': {
    id: 'profit_margin_kpi',
    templateId: 'template_financial_kpi',
    component: FinancialKPITile,
    title: 'Profit Margin',
    subtitle: 'Net profit as percentage of revenue',
    type: 'kpi',
    category: 'performance',
    smartCode: 'HERA.FINANCE.ANALYTICS.TILE.KPI.PROFIT_MARGIN.v1',
    defaultProps: {
      kpiType: 'profit_margin',
      showTarget: true,
      showTrend: true,
      period: 'quarterly'
    },
    gridSize: {
      width: 1,
      height: 1,
      minWidth: 1,
      minHeight: 1,
      maxWidth: 2,
      maxHeight: 1
    },
    permissions: {
      view: ['viewer', 'analyst', 'manager', 'admin'],
      edit: ['manager', 'admin'],
      export: ['analyst', 'manager', 'admin']
    },
    interactiveFeatures: {
      drillDown: true,
      export: true,
      comparison: true,
      forecasting: false,
      alerts: true
    }
  },

  'roe_kpi': {
    id: 'roe_kpi',
    templateId: 'template_financial_kpi',
    component: FinancialKPITile,
    title: 'Return on Equity',
    subtitle: 'Net income relative to shareholder equity',
    type: 'kpi',
    category: 'performance',
    smartCode: 'HERA.FINANCE.ANALYTICS.TILE.KPI.ROE.v1',
    defaultProps: {
      kpiType: 'roe',
      showTarget: true,
      showTrend: true,
      period: 'quarterly'
    },
    gridSize: {
      width: 1,
      height: 1,
      minWidth: 1,
      minHeight: 1,
      maxWidth: 2,
      maxHeight: 1
    },
    permissions: {
      view: ['viewer', 'analyst', 'manager', 'admin'],
      edit: ['manager', 'admin'],
      export: ['analyst', 'manager', 'admin']
    },
    interactiveFeatures: {
      drillDown: true,
      export: true,
      comparison: true,
      forecasting: false,
      alerts: true
    }
  },

  'current_ratio_kpi': {
    id: 'current_ratio_kpi',
    templateId: 'template_financial_kpi',
    component: FinancialKPITile,
    title: 'Current Ratio',
    subtitle: 'Current assets to current liabilities ratio',
    type: 'kpi',
    category: 'analysis',
    smartCode: 'HERA.FINANCE.ANALYTICS.TILE.KPI.CURRENT_RATIO.v1',
    defaultProps: {
      kpiType: 'current_ratio',
      showTarget: true,
      showTrend: true,
      period: 'monthly'
    },
    gridSize: {
      width: 1,
      height: 1,
      minWidth: 1,
      minHeight: 1,
      maxWidth: 2,
      maxHeight: 1
    },
    permissions: {
      view: ['viewer', 'analyst', 'manager', 'admin'],
      edit: ['manager', 'admin'],
      export: ['analyst', 'manager', 'admin']
    },
    interactiveFeatures: {
      drillDown: true,
      export: true,
      comparison: true,
      forecasting: false,
      alerts: true
    }
  },

  'debt_equity_kpi': {
    id: 'debt_equity_kpi',
    templateId: 'template_financial_kpi',
    component: FinancialKPITile,
    title: 'Debt-to-Equity',
    subtitle: 'Total debt relative to total equity',
    type: 'kpi',
    category: 'analysis',
    smartCode: 'HERA.FINANCE.ANALYTICS.TILE.KPI.DEBT_EQUITY.v1',
    defaultProps: {
      kpiType: 'debt_equity',
      showTarget: true,
      showTrend: true,
      period: 'quarterly'
    },
    gridSize: {
      width: 1,
      height: 1,
      minWidth: 1,
      minHeight: 1,
      maxWidth: 2,
      maxHeight: 1
    },
    permissions: {
      view: ['viewer', 'analyst', 'manager', 'admin'],
      edit: ['manager', 'admin'],
      export: ['analyst', 'manager', 'admin']
    },
    interactiveFeatures: {
      drillDown: true,
      export: true,
      comparison: true,
      forecasting: false,
      alerts: true
    }
  },

  // Cash Flow Analysis Tile
  'cash_flow_analysis': {
    id: 'cash_flow_analysis',
    templateId: 'template_cash_flow',
    component: CashFlowTile,
    title: 'Cash Flow Analysis',
    subtitle: 'Operating, investing, and financing cash flows',
    type: 'cashflow',
    category: 'analysis',
    smartCode: 'HERA.FINANCE.ANALYTICS.TILE.CASHFLOW.OVERVIEW.v1',
    defaultProps: {
      period: 'monthly',
      showBreakdown: true
    },
    gridSize: {
      width: 2,
      height: 2,
      minWidth: 2,
      minHeight: 2,
      maxWidth: 3,
      maxHeight: 3
    },
    permissions: {
      view: ['viewer', 'analyst', 'manager', 'admin'],
      edit: ['manager', 'admin'],
      export: ['analyst', 'manager', 'admin']
    },
    interactiveFeatures: {
      drillDown: true,
      export: true,
      comparison: true,
      forecasting: true,
      alerts: true
    }
  }
}

/**
 * Financial Analytics Workspace Layout
 * Predefined layout for financial analytics workspace
 */
export const FINANCIAL_ANALYTICS_LAYOUT = {
  workspaceId: 'financial_analytics_workspace',
  name: 'Financial Analytics',
  description: 'Comprehensive financial performance dashboard',
  layout: {
    type: 'grid',
    columns: 4,
    rows: 4,
    gap: 16
  },
  tiles: [
    // Row 1: Revenue Dashboard + KPIs
    {
      ...FINANCIAL_TILES_REGISTRY.revenue_dashboard,
      position: { x: 0, y: 0, width: 2, height: 2 }
    },
    {
      ...FINANCIAL_TILES_REGISTRY.profit_margin_kpi,
      position: { x: 2, y: 0, width: 1, height: 1 }
    },
    {
      ...FINANCIAL_TILES_REGISTRY.roe_kpi,
      position: { x: 3, y: 0, width: 1, height: 1 }
    },
    
    // Row 2: Liquidity KPIs + Cash Flow
    {
      ...FINANCIAL_TILES_REGISTRY.current_ratio_kpi,
      position: { x: 2, y: 1, width: 1, height: 1 }
    },
    {
      ...FINANCIAL_TILES_REGISTRY.debt_equity_kpi,
      position: { x: 3, y: 1, width: 1, height: 1 }
    },
    {
      ...FINANCIAL_TILES_REGISTRY.cash_flow_analysis,
      position: { x: 0, y: 2, width: 2, height: 2 }
    }
  ],
  navigation: {
    sections: [
      {
        code: 'performance',
        label: 'Performance',
        tileIds: ['revenue_dashboard', 'profit_margin_kpi', 'roe_kpi']
      },
      {
        code: 'analysis',
        label: 'Analysis',
        tileIds: ['current_ratio_kpi', 'debt_equity_kpi', 'cash_flow_analysis']
      }
    ]
  }
}

/**
 * Utility function to create financial tile configurations
 */
export function createFinancialTileConfig(
  tileId: string,
  overrides: Partial<FinancialTileConfig> = {}
): FinancialTileConfig | null {
  const baseConfig = FINANCIAL_TILES_REGISTRY[tileId]
  if (!baseConfig) {
    console.error(`Financial tile configuration not found: ${tileId}`)
    return null
  }

  return {
    ...baseConfig,
    ...overrides,
    defaultProps: {
      ...baseConfig.defaultProps,
      ...overrides.defaultProps
    },
    gridSize: {
      ...baseConfig.gridSize,
      ...overrides.gridSize
    },
    permissions: {
      ...baseConfig.permissions,
      ...overrides.permissions
    },
    interactiveFeatures: {
      ...baseConfig.interactiveFeatures,
      ...overrides.interactiveFeatures
    }
  }
}

/**
 * Utility function to validate financial tile permissions
 */
export function hasFinancialTilePermission(
  tileId: string,
  userRole: string,
  action: 'view' | 'edit' | 'export'
): boolean {
  const config = FINANCIAL_TILES_REGISTRY[tileId]
  if (!config) return false

  return config.permissions[action].includes(userRole)
}

/**
 * Utility function to get tiles by category
 */
export function getFinancialTilesByCategory(
  category: 'performance' | 'analysis' | 'forecasting' | 'reporting'
): FinancialTileConfig[] {
  return Object.values(FINANCIAL_TILES_REGISTRY).filter(
    tile => tile.category === category
  )
}

/**
 * Export all tile components for easy registration
 */
export const FINANCIAL_TILE_COMPONENTS = {
  RevenueDashboardTile,
  FinancialKPITile,
  CashFlowTile
}

export default FINANCIAL_TILES_REGISTRY