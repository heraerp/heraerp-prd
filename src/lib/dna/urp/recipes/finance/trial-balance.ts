import type { ReportRecipe } from '../index'

export const trialBalanceRecipe: ReportRecipe = {
  name: 'HERA.URP.RECIPE.FINANCE.TRIAL.BALANCE.v1',
  description: 'Trial balance with debit/credit totals',
  smartCode: 'HERA.URP.RECIPE.FINANCE.TRIAL.BALANCE.v1',
  category: 'finance',
  parameters: [],
  steps: [],
  cacheTTL: 300
}
