/**
 * HERA App Configuration Index
 * Central export for all app-specific dashboard and domain configurations
 */

import { retailDashboardConfig } from './retail.config'
import { agroDashboardConfig } from './agro.config'
import { retailDomainConfig } from './retail-domain.config'
import { agroDomainConfig } from './agro-domain.config'
import { DashboardConfig } from '@/components/universal/dashboard/types'
import { DomainConfig } from '@/components/universal/domain/types'

// Dashboard configuration map
export const appConfigs: Record<string, DashboardConfig> = {
  'RETAIL': retailDashboardConfig,
  'AGRO': agroDashboardConfig
}

// Domain configuration map
export const domainConfigs: Record<string, DomainConfig> = {
  'RETAIL': retailDomainConfig,
  'AGRO': agroDomainConfig
}

// Helper function to get app dashboard configuration
export function getAppConfig(appCode: string): DashboardConfig {
  const config = appConfigs[appCode.toUpperCase()]
  if (!config) {
    throw new Error(`Dashboard configuration not found for app: ${appCode}`)
  }
  return config
}

// Helper function to get domain configuration
export function getDomainConfig(appCode: string): DomainConfig {
  const config = domainConfigs[appCode.toUpperCase()]
  if (!config) {
    throw new Error(`Domain configuration not found for app: ${appCode}`)
  }
  return config
}

// Named exports for direct imports
export {
  retailDashboardConfig,
  agroDashboardConfig,
  retailDomainConfig,
  agroDomainConfig
}
