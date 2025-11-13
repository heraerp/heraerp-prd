/**
 * HERA App Configuration Index
 * Central export for all app-specific dashboard configurations
 */

import { retailDashboardConfig } from './retail.config'
import { agroDashboardConfig } from './agro.config'
import { DashboardConfig } from '@/components/universal/dashboard/types'

// App configuration map
export const appConfigs: Record<string, DashboardConfig> = {
  'RETAIL': retailDashboardConfig,
  'AGRO': agroDashboardConfig
}

// Helper function to get app configuration
export function getAppConfig(appCode: string): DashboardConfig {
  const config = appConfigs[appCode.toUpperCase()]
  if (!config) {
    throw new Error(`Dashboard configuration not found for app: ${appCode}`)
  }
  return config
}

// Named exports for direct imports
export { retailDashboardConfig, agroDashboardConfig }
