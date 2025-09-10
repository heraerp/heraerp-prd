/**
 * Universal Report Pattern Recipes
 * Smart Code: HERA.URP.RECIPE.*.v1
 * 
 * Pre-built report definitions using URP primitives
 */

import type { UniversalReportEngine } from '../report-engine'

export interface ReportRecipeStep {
  primitive: 'entityResolver' | 'hierarchyBuilder' | 'transactionFacts' | 'dynamicJoin' | 'rollupBalance' | 'custom'
  config?: Record<string, any>
  outputKey?: string
  handler?: (data: any, engine: UniversalReportEngine, params: Record<string, any>) => Promise<any>
}

export interface ReportRecipe {
  name: string
  description: string
  smartCode: string
  category: string
  parameters: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'date'
    required?: boolean
    default?: any
    description?: string
  }>
  steps: ReportRecipeStep[]
  cacheTTL?: number
  outputSchema?: Record<string, any>
}

// Import specific recipes
import { chartOfAccountsRecipe } from './finance/chart-of-accounts'
import { trialBalanceRecipe } from './finance/trial-balance'
import { balanceSheetRecipe } from './finance/balance-sheet'
import { profitLossRecipe } from './finance/profit-loss'
import { cashflowRecipe } from './finance/cashflow'
import { customerAgingRecipe } from './sales/customer-aging'
import { salesAnalysisRecipe } from './sales/sales-analysis'
import { inventoryLevelsRecipe } from './inventory/stock-levels'
import { productionAnalysisRecipe } from './production/production-analysis'

// Export all recipes
export const reportRecipes: Array<[string, ReportRecipe]> = [
  // Finance recipes
  [chartOfAccountsRecipe.name, chartOfAccountsRecipe],
  [trialBalanceRecipe.name, trialBalanceRecipe],
  [balanceSheetRecipe.name, balanceSheetRecipe],
  [profitLossRecipe.name, profitLossRecipe],
  [cashflowRecipe.name, cashflowRecipe],
  
  // Sales recipes
  [customerAgingRecipe.name, customerAgingRecipe],
  [salesAnalysisRecipe.name, salesAnalysisRecipe],
  
  // Inventory recipes
  [inventoryLevelsRecipe.name, inventoryLevelsRecipe],
  
  // Production recipes
  [productionAnalysisRecipe.name, productionAnalysisRecipe]
]

// Export individual recipes for direct import
export {
  chartOfAccountsRecipe,
  trialBalanceRecipe,
  balanceSheetRecipe,
  profitLossRecipe,
  cashflowRecipe,
  customerAgingRecipe,
  salesAnalysisRecipe,
  inventoryLevelsRecipe,
  productionAnalysisRecipe
}