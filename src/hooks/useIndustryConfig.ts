'use client'

/**
 * Industry Configuration Hook
 * Smart Code: HERA.UNIVERSAL.CONFIG.INDUSTRY.v1
 * 
 * React hook for managing industry-specific configurations from hera-navigation.json
 * Provides typed access to industry themes, permissions, and specialized modules
 */

import { useMemo } from 'react'
import navigationConfig from '@/config/hera-navigation.json'

interface IndustryTheme {
  primary_color: string
  secondary_color: string
  hero_background: string
}

interface IndustryConfig {
  name: string
  code: string
  route_prefix: string
  theme: IndustryTheme
  specialized_modules: Record<string, any>
}

interface PermissionConfig {
  code: string
  description: string
}

interface UseIndustryConfigOptions {
  industryCode?: 'JEWELRY' | 'WASTE_MGMT' | null
}

interface IndustryConfigResult {
  // Industry access
  industries: Record<string, IndustryConfig>
  getIndustry: (code: string) => IndustryConfig | null
  
  // Current industry context
  currentIndustry: IndustryConfig | null
  industryTheme: IndustryTheme | null
  
  // Permission management
  getPermissions: (industryCode?: string) => PermissionConfig[]
  getIndustryPermissions: (industryCode: string) => PermissionConfig[]
  getBasePermissions: () => PermissionConfig[]
  hasPermission: (permissionCode: string, userPermissions: string[]) => boolean
  
  // Theme helpers
  getCSSVariables: (theme?: IndustryTheme) => Record<string, string>
  getThemeClasses: (theme?: IndustryTheme) => string
  
  // Route helpers
  getIndustryRoute: (industryCode: string, path?: string) => string
  getModuleRoute: (industryCode: string, moduleCode: string) => string
  getAreaRoute: (industryCode: string, moduleCode: string, areaCode: string) => string
  getOperationRoute: (
    industryCode: string, 
    moduleCode: string, 
    areaCode: string, 
    operationCode: string
  ) => string
  
  // Navigation context
  getNavigationContext: () => {
    isIndustrySpecific: boolean
    industryName: string | null
    routePrefix: string
    themeConfig: IndustryTheme | null
  }
  
  // Validation helpers
  isValidIndustry: (code: string) => boolean
  isIndustryRoute: (path: string) => boolean
  getIndustryFromRoute: (path: string) => string | null
  
  // Industry comparison
  compareIndustries: (code1: string, code2: string) => boolean
  getAvailableIndustries: () => Array<{ code: string; name: string; theme: IndustryTheme }>
}

export function useIndustryConfig(options: UseIndustryConfigOptions = {}): IndustryConfigResult {
  const { industryCode } = options

  // Get all industries
  const industries = useMemo(() => {
    return navigationConfig.industries as Record<string, IndustryConfig>
  }, [])

  // Industry access functions
  const getIndustry = useMemo(() => (code: string): IndustryConfig | null => {
    const industryKey = code.toUpperCase()
    return industries[industryKey] || null
  }, [industries])

  // Current industry context
  const currentIndustry = useMemo(() => {
    return industryCode ? getIndustry(industryCode) : null
  }, [industryCode, getIndustry])

  const industryTheme = useMemo(() => {
    return currentIndustry?.theme || null
  }, [currentIndustry])

  // Permission management
  const getBasePermissions = useMemo(() => (): PermissionConfig[] => {
    return navigationConfig.security?.permission_sets || []
  }, [])

  const getIndustryPermissions = useMemo(() => (industryCode: string): PermissionConfig[] => {
    const industry = getIndustry(industryCode)
    if (!industry) return []
    
    // Filter industry-specific permissions
    const industryPerms = navigationConfig.security?.industry_permissions?.filter(
      perm => perm.code.startsWith(`${industryCode}.`)
    ) || []
    
    return industryPerms
  }, [getIndustry])

  const getPermissions = useMemo(() => (industryCode?: string): PermissionConfig[] => {
    const basePermissions = getBasePermissions()
    if (!industryCode) return basePermissions
    
    const industryPermissions = getIndustryPermissions(industryCode)
    return [...basePermissions, ...industryPermissions]
  }, [getBasePermissions, getIndustryPermissions])

  const hasPermission = useMemo(() => (
    permissionCode: string, 
    userPermissions: string[]
  ): boolean => {
    return userPermissions.includes(permissionCode)
  }, [])

  // Theme helpers
  const getCSSVariables = useMemo(() => (theme?: IndustryTheme): Record<string, string> => {
    if (!theme) return {}
    
    return {
      '--industry-primary': theme.primary_color,
      '--industry-secondary': theme.secondary_color,
      '--industry-background': theme.hero_background
    }
  }, [])

  const getThemeClasses = useMemo(() => (theme?: IndustryTheme): string => {
    if (!theme) return ''
    
    // Convert theme to Tailwind classes
    const classes = []
    
    // Background gradient
    if (theme.hero_background.includes('gradient')) {
      classes.push('bg-gradient-to-br')
    }
    
    return classes.join(' ')
  }, [])

  // Route helpers
  const getIndustryRoute = useMemo(() => (industryCode: string, path?: string): string => {
    const industry = getIndustry(industryCode)
    if (!industry) return '/apps'
    
    const basePath = industry.route_prefix
    return path ? `${basePath}${path}` : basePath
  }, [getIndustry])

  const getModuleRoute = useMemo(() => (industryCode: string, moduleCode: string): string => {
    const industry = getIndustry(industryCode)
    if (!industry) return '/apps'
    
    return `${industry.route_prefix}/${moduleCode.toLowerCase()}`
  }, [getIndustry])

  const getAreaRoute = useMemo(() => (
    industryCode: string, 
    moduleCode: string, 
    areaCode: string
  ): string => {
    const moduleRoute = getModuleRoute(industryCode, moduleCode)
    return `${moduleRoute}/${areaCode.toLowerCase()}`
  }, [getModuleRoute])

  const getOperationRoute = useMemo(() => (
    industryCode: string, 
    moduleCode: string, 
    areaCode: string, 
    operationCode: string
  ): string => {
    const areaRoute = getAreaRoute(industryCode, moduleCode, areaCode)
    return `${areaRoute}/${operationCode.toLowerCase()}`
  }, [getAreaRoute])

  // Navigation context
  const getNavigationContext = useMemo(() => () => {
    return {
      isIndustrySpecific: !!currentIndustry,
      industryName: currentIndustry?.name || null,
      routePrefix: currentIndustry?.route_prefix || '/enterprise',
      themeConfig: industryTheme
    }
  }, [currentIndustry, industryTheme])

  // Validation helpers
  const isValidIndustry = useMemo(() => (code: string): boolean => {
    return getIndustry(code) !== null
  }, [getIndustry])

  const isIndustryRoute = useMemo(() => (path: string): boolean => {
    const industryPrefixes = Object.values(industries).map(industry => industry.route_prefix)
    return industryPrefixes.some(prefix => path.startsWith(prefix))
  }, [industries])

  const getIndustryFromRoute = useMemo(() => (path: string): string | null => {
    for (const [code, industry] of Object.entries(industries)) {
      if (path.startsWith(industry.route_prefix)) {
        return code
      }
    }
    return null
  }, [industries])

  // Industry comparison
  const compareIndustries = useMemo(() => (code1: string, code2: string): boolean => {
    return code1.toUpperCase() === code2.toUpperCase()
  }, [])

  const getAvailableIndustries = useMemo(() => (): Array<{ 
    code: string; 
    name: string; 
    theme: IndustryTheme 
  }> => {
    return Object.entries(industries).map(([code, config]) => ({
      code,
      name: config.name,
      theme: config.theme
    }))
  }, [industries])

  return {
    // Industry access
    industries,
    getIndustry,
    
    // Current industry context
    currentIndustry,
    industryTheme,
    
    // Permission management
    getPermissions,
    getIndustryPermissions,
    getBasePermissions,
    hasPermission,
    
    // Theme helpers
    getCSSVariables,
    getThemeClasses,
    
    // Route helpers
    getIndustryRoute,
    getModuleRoute,
    getAreaRoute,
    getOperationRoute,
    
    // Navigation context
    getNavigationContext,
    
    // Validation helpers
    isValidIndustry,
    isIndustryRoute,
    getIndustryFromRoute,
    
    // Industry comparison
    compareIndustries,
    getAvailableIndustries
  }
}

// Export types for use in components
export type { 
  IndustryConfig, 
  IndustryTheme, 
  PermissionConfig, 
  UseIndustryConfigOptions, 
  IndustryConfigResult 
}