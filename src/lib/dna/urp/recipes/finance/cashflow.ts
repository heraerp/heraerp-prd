import type { ReportRecipe } from '../index'

export const cashflowRecipe: ReportRecipe = {
  name: 'HERA.URP.RECIPE.FINANCE.CASHFLOW.V1',
  description: 'Cashflow statement with operating, investing, and financing activities',
  smartCode: 'HERA.URP.RECIPE.FINANCE.CASHFLOW.V1',
  category: 'finance',
  parameters: [],
  steps: [],
  cacheTTL: 300
}
