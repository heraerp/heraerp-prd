import type { ReportRecipe } from '../index'

export const balanceSheetRecipe: ReportRecipe = {
  name: 'HERA.URP.RECIPE.FINANCE.BALANCE.SHEET.V1',
  description: 'Balance sheet with assets, liabilities, and equity',
  smartCode: 'HERA.URP.RECIPE.FINANCE.BALANCE.SHEET.V1',
  category: 'finance',
  parameters: [],
  steps: [],
  cacheTTL: 300
}
