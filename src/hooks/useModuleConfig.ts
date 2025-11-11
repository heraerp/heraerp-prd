'use client'

/**
 * Module Configuration Hook
 * Smart Code: HERA.UNIVERSAL.CONFIG.MODULE.v1
 * 
 * React hook for managing module configurations from Supabase database
 * Provides typed access to base modules and industry-specific modules
 */

import { useMemo, useEffect, useState } from 'react'
import { getCachedNavigationConfig, type NavigationConfig, type NavigationModule, type NavigationArea, type NavigationOperation } from '@/services/NavigationService'

// Use types from NavigationService
type ModuleConfig = NavigationModule
type AreaConfig = NavigationArea
type OperationConfig = NavigationOperation

interface UseModuleConfigOptions {
  industry?: 'JEWELRY' | 'WASTE_MGMT' | null
  moduleCode?: string
  areaCode?: string
}

interface ModuleConfigResult {
  // Base module access
  baseModules: Record<string, ModuleConfig>
  getBaseModule: (code: string) => ModuleConfig | null
  
  // Industry module access
  industryModules: Record<string, ModuleConfig>
  getIndustryModule: (code: string) => ModuleConfig | null
  
  // Combined module access (industry-aware)
  getAllModules: () => Record<string, ModuleConfig>
  getModule: (code: string) => ModuleConfig | null
  
  // Area and operation access
  getArea: (moduleCode: string, areaCode: string) => AreaConfig | null
  getOperation: (moduleCode: string, areaCode: string, operationCode: string) => OperationConfig | null
  
  // Navigation helpers
  getModuleBreadcrumbs: (moduleCode: string, areaCode?: string, operationCode?: string) => Array<{
    label: string
    href: string
    icon?: string
  }>
  
  // Validation helpers
  isValidModule: (code: string) => boolean
  isValidArea: (moduleCode: string, areaCode: string) => boolean
  isValidOperation: (moduleCode: string, areaCode: string, operationCode: string) => boolean
  
  // Current context
  currentModule: ModuleConfig | null
  currentArea: AreaConfig | null
  industry: string | null
  
  // Loading state
  isLoading: boolean
  error: string | null
}

export function useModuleConfig(options: UseModuleConfigOptions = {}): ModuleConfigResult {
  const { industry, moduleCode, areaCode } = options
  
  // State for navigation configuration
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load navigation configuration from database
  useEffect(() => {
    let mounted = true
    
    const loadConfig = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const config = await getCachedNavigationConfig()
        
        if (mounted) {
          setNavigationConfig(config)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load navigation configuration')
          setIsLoading(false)
        }
      }
    }
    
    loadConfig()
    
    return () => {
      mounted = false
    }
  }, [])

  // Get base modules
  const baseModules = useMemo(() => {
    return navigationConfig?.base_modules || {}
  }, [navigationConfig])

  // Get industry-specific modules
  const industryModules = useMemo(() => {
    if (!industry || !navigationConfig?.industries?.[industry]) {
      return {}
    }
    
    const industryConfig = navigationConfig.industries[industry]
    return industryConfig.specialized_modules || {}
  }, [industry, navigationConfig])

  // Module access functions
  const getBaseModule = useMemo(() => (code: string): ModuleConfig | null => {
    const moduleKey = code.toUpperCase()
    return baseModules[moduleKey] || null
  }, [baseModules])

  const getIndustryModule = useMemo(() => (code: string): ModuleConfig | null => {
    const moduleKey = code.toUpperCase()
    return industryModules[moduleKey] || null
  }, [industryModules])

  const getAllModules = useMemo(() => (): Record<string, ModuleConfig> => {
    return { ...baseModules, ...industryModules }
  }, [baseModules, industryModules])

  const getModule = useMemo(() => (code: string): ModuleConfig | null => {
    // First check industry-specific modules, then base modules
    return getIndustryModule(code) || getBaseModule(code)
  }, [getIndustryModule, getBaseModule])

  // Area and operation access
  const getArea = useMemo(() => (moduleCode: string, areaCode: string): AreaConfig | null => {
    const module = getModule(moduleCode)
    if (!module) return null
    
    const areaKey = areaCode.toUpperCase()
    return module.areas.find(area => 
      area.code === areaKey || 
      area.code.replace('_', '-').toLowerCase() === areaCode.toLowerCase() ||
      area.route.endsWith(`/${areaCode.toLowerCase()}`)
    ) || null
  }, [getModule])

  const getOperation = useMemo(() => (
    moduleCode: string, 
    areaCode: string, 
    operationCode: string
  ): OperationConfig | null => {
    const area = getArea(moduleCode, areaCode)
    if (!area) return null
    
    const operationKey = operationCode.toUpperCase()
    return area.operations.find(operation => 
      operation.code === operationKey || 
      operation.code.replace('_', '-').toLowerCase() === operationCode.toLowerCase() ||
      operation.route.endsWith(`/${operationCode.toLowerCase()}`)
    ) || null
  }, [getArea])

  // Navigation helpers
  const getModuleBreadcrumbs = useMemo(() => (
    moduleCode: string, 
    areaCode?: string, 
    operationCode?: string
  ) => {
    const breadcrumbs = [
      { label: 'Home', href: '/apps', icon: 'home' }
    ]

    const module = getModule(moduleCode)
    if (!module) return breadcrumbs

    // Add module breadcrumb
    const routePrefix = industry ? `/${industry.toLowerCase().replace('_', '-')}` : '/enterprise'
    breadcrumbs.push({
      label: module.name,
      href: `${routePrefix}/${moduleCode.toLowerCase()}`,
      icon: module.icon
    })

    // Add area breadcrumb if provided
    if (areaCode && module) {
      const area = getArea(moduleCode, areaCode)
      if (area) {
        breadcrumbs.push({
          label: area.name,
          href: `${routePrefix}/${moduleCode.toLowerCase()}/${areaCode.toLowerCase()}`,
          icon: area.icon
        })

        // Add operation breadcrumb if provided
        if (operationCode) {
          const operation = getOperation(moduleCode, areaCode, operationCode)
          if (operation) {
            breadcrumbs.push({
              label: operation.name,
              href: `${routePrefix}/${moduleCode.toLowerCase()}/${areaCode.toLowerCase()}/${operationCode.toLowerCase()}`
            })
          }
        }
      }
    }

    return breadcrumbs
  }, [getModule, getArea, getOperation, industry])

  // Validation helpers
  const isValidModule = useMemo(() => (code: string): boolean => {
    return getModule(code) !== null
  }, [getModule])

  const isValidArea = useMemo(() => (moduleCode: string, areaCode: string): boolean => {
    return getArea(moduleCode, areaCode) !== null
  }, [getArea])

  const isValidOperation = useMemo(() => (
    moduleCode: string, 
    areaCode: string, 
    operationCode: string
  ): boolean => {
    return getOperation(moduleCode, areaCode, operationCode) !== null
  }, [getOperation])

  // Current context
  const currentModule = useMemo(() => {
    return moduleCode ? getModule(moduleCode) : null
  }, [moduleCode, getModule])

  const currentArea = useMemo(() => {
    return moduleCode && areaCode ? getArea(moduleCode, areaCode) : null
  }, [moduleCode, areaCode, getArea])

  return {
    // Base module access
    baseModules,
    getBaseModule,
    
    // Industry module access
    industryModules,
    getIndustryModule,
    
    // Combined module access
    getAllModules,
    getModule,
    
    // Area and operation access
    getArea,
    getOperation,
    
    // Navigation helpers
    getModuleBreadcrumbs,
    
    // Validation helpers
    isValidModule,
    isValidArea,
    isValidOperation,
    
    // Current context
    currentModule,
    currentArea,
    industry: industry || null,
    
    // Loading state
    isLoading,
    error
  }
}

// Export types for use in components
export type { ModuleConfig, AreaConfig, OperationConfig, UseModuleConfigOptions, ModuleConfigResult }