import type { ReportRecipe } from '../index'

export const customerAgingRecipe: ReportRecipe = {
  name: 'HERA.URP.RECIPE.SALES.CUSTOMER.AGING.v1',
  description: 'Customer aging report with outstanding balances by age',
  smartCode: 'HERA.URP.RECIPE.SALES.CUSTOMER.AGING.v1',
  category: 'sales',
  parameters: [],
  steps: [],
  cacheTTL: 300
}
