import type { ReportRecipe } from '../index'

export const inventoryLevelsRecipe: ReportRecipe = {
  name: 'HERA.URP.RECIPE.INVENTORY.STOCK.LEVELS.v1',
  description: 'Current inventory stock levels by location and product',
  smartCode: 'HERA.URP.RECIPE.INVENTORY.STOCK.LEVELS.v1',
  category: 'inventory',
  parameters: [],
  steps: [],
  cacheTTL: 300
}