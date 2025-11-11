'use client'

/**
 * Navigation Configuration Hook
 * Smart Code: HERA.UNIVERSAL.CONFIG.NAVIGATION.v1
 * 
 * Combined navigation hook that integrates module and industry configurations
 * Provides complete navigation management for HERA's dynamic page system
 */

import { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useModuleConfig, type ModuleConfig, type AreaConfig, type OperationConfig } from './useModuleConfig'
import { useIndustryConfig, type IndustryConfig, type IndustryTheme } from './useIndustryConfig'

interface NavigationContext {
  // Current route analysis
  currentPath: string
  routeSegments: string[]
  isEnterpriseRoute: boolean
  isIndustryRoute: boolean
  
  // Current navigation state
  industryCode: string | null
  moduleCode: string | null
  areaCode: string | null
  operationCode: string | null
  
  // Current configurations
  currentIndustry: IndustryConfig | null
  currentModule: ModuleConfig | null
  currentArea: AreaConfig | null
  currentOperation: OperationConfig | null
  
  // Theme and styling
  currentTheme: IndustryTheme | null
  themeVariables: Record<string, string>
  
  // Navigation helpers
  navigateToModule: (moduleCode: string) => void
  navigateToArea: (moduleCode: string, areaCode: string) => void
  navigateToOperation: (moduleCode: string, areaCode: string, operationCode: string) => void
  
  // Breadcrumb generation
  breadcrumbs: Array<{
    label: string
    href: string
    icon?: string
    isActive?: boolean
  }>
  
  // Route validation
  isValidRoute: boolean
  routeError: string | null
  
  // Page metadata
  pageTitle: string
  pageDescription: string
  
  // Navigation structure
  availableModules: Record<string, ModuleConfig>
  availableAreas: AreaConfig[]
  availableOperations: OperationConfig[]
}

export function useNavigationConfig(): NavigationContext {
  const router = useRouter()
  const pathname = usePathname()

  // Parse current route
  const routeAnalysis = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Determine route type and extract codes
    let industryCode: string | null = null
    let moduleCode: string | null = null
    let areaCode: string | null = null
    let operationCode: string | null = null
    
    const isEnterpriseRoute = segments[0] === 'enterprise'
    const isIndustryRoute = segments[0] === 'jewelry' || segments[0] === 'waste-management'
    
    if (isEnterpriseRoute && segments.length >= 2) {
      moduleCode = segments[1]
      areaCode = segments[2] || null
      operationCode = segments[3] || null
    } else if (isIndustryRoute && segments.length >= 2) {
      industryCode = segments[0] === 'jewelry' ? 'JEWELRY' : 'WASTE_MGMT'
      moduleCode = segments[1]
      areaCode = segments[2] || null
      operationCode = segments[3] || null
    }
    
    return {
      currentPath: pathname,
      routeSegments: segments,
      isEnterpriseRoute,
      isIndustryRoute,
      industryCode,
      moduleCode,
      areaCode,
      operationCode
    }
  }, [pathname])

  // Initialize configuration hooks
  const moduleConfig = useModuleConfig({
    industry: routeAnalysis.industryCode as 'JEWELRY' | 'WASTE_MGMT' | null,
    moduleCode: routeAnalysis.moduleCode || undefined,
    areaCode: routeAnalysis.areaCode || undefined
  })

  const industryConfig = useIndustryConfig({
    industryCode: routeAnalysis.industryCode as 'JEWELRY' | 'WASTE_MGMT' | null
  })

  // Current configurations
  const currentIndustry = industryConfig.currentIndustry
  const currentModule = moduleConfig.currentModule
  const currentArea = moduleConfig.currentArea
  
  const currentOperation = useMemo(() => {
    if (!routeAnalysis.moduleCode || !routeAnalysis.areaCode || !routeAnalysis.operationCode) {
      return null
    }
    
    return moduleConfig.getOperation(
      routeAnalysis.moduleCode,
      routeAnalysis.areaCode,
      routeAnalysis.operationCode
    )
  }, [moduleConfig, routeAnalysis])

  // Theme and styling
  const currentTheme = industryConfig.industryTheme
  const themeVariables = industryConfig.getCSSVariables(currentTheme || undefined)

  // Navigation helpers
  const navigateToModule = useMemo(() => (moduleCode: string) => {
    const routePrefix = currentIndustry?.route_prefix || '/enterprise'
    router.push(`${routePrefix}/${moduleCode.toLowerCase()}`)
  }, [router, currentIndustry])

  const navigateToArea = useMemo(() => (moduleCode: string, areaCode: string) => {
    const routePrefix = currentIndustry?.route_prefix || '/enterprise'
    router.push(`${routePrefix}/${moduleCode.toLowerCase()}/${areaCode.toLowerCase()}`)
  }, [router, currentIndustry])

  const navigateToOperation = useMemo(() => (
    moduleCode: string, 
    areaCode: string, 
    operationCode: string
  ) => {
    const routePrefix = currentIndustry?.route_prefix || '/enterprise'
    router.push(`${routePrefix}/${moduleCode.toLowerCase()}/${areaCode.toLowerCase()}/${operationCode.toLowerCase()}`)
  }, [router, currentIndustry])

  // Breadcrumb generation
  const breadcrumbs = useMemo(() => {
    const crumbs = moduleConfig.getModuleBreadcrumbs(
      routeAnalysis.moduleCode || '',
      routeAnalysis.areaCode || undefined,
      routeAnalysis.operationCode || undefined
    )

    // Mark the last breadcrumb as active
    return crumbs.map((crumb, index) => ({
      ...crumb,
      isActive: index === crumbs.length - 1
    }))
  }, [moduleConfig, routeAnalysis])

  // Route validation
  const routeValidation = useMemo(() => {
    let isValid = true
    let error: string | null = null

    // Validate industry if present
    if (routeAnalysis.industryCode && !industryConfig.isValidIndustry(routeAnalysis.industryCode)) {
      isValid = false
      error = `Invalid industry: ${routeAnalysis.industryCode}`
    }

    // Validate module if present
    if (routeAnalysis.moduleCode && !moduleConfig.isValidModule(routeAnalysis.moduleCode)) {
      isValid = false
      error = `Invalid module: ${routeAnalysis.moduleCode}`
    }

    // Validate area if present
    if (routeAnalysis.moduleCode && routeAnalysis.areaCode && 
        !moduleConfig.isValidArea(routeAnalysis.moduleCode, routeAnalysis.areaCode)) {
      isValid = false
      error = `Invalid area: ${routeAnalysis.areaCode} in module ${routeAnalysis.moduleCode}`
    }

    // Validate operation if present
    if (routeAnalysis.moduleCode && routeAnalysis.areaCode && routeAnalysis.operationCode &&
        !moduleConfig.isValidOperation(routeAnalysis.moduleCode, routeAnalysis.areaCode, routeAnalysis.operationCode)) {
      isValid = false
      error = `Invalid operation: ${routeAnalysis.operationCode} in area ${routeAnalysis.areaCode}`
    }

    return { isValid, error }
  }, [routeAnalysis, moduleConfig, industryConfig])

  // Page metadata
  const pageMetadata = useMemo(() => {
    let title = 'HERA'
    let description = 'Enterprise Resource Planning'

    if (currentIndustry) {
      title = `HERA ${currentIndustry.name}`
      description = `${currentIndustry.name} industry solutions`
    }

    if (currentModule) {
      title = `${currentModule.name} - ${title}`
      description = `${currentModule.name} module for ${description.toLowerCase()}`
    }

    if (currentArea) {
      title = `${currentArea.name} - ${title}`
      description = `${currentArea.name} operations within ${description.toLowerCase()}`
    }

    if (currentOperation) {
      title = `${currentOperation.name} - ${title}`
      description = `${currentOperation.name} operation for ${description.toLowerCase()}`
    }

    return { title, description }
  }, [currentIndustry, currentModule, currentArea, currentOperation])

  // Navigation structure
  const availableModules = moduleConfig.getAllModules()
  
  const availableAreas = useMemo(() => {
    return currentModule?.areas || []
  }, [currentModule])

  const availableOperations = useMemo(() => {
    return currentArea?.operations || []
  }, [currentArea])

  return {
    // Current route analysis
    currentPath: routeAnalysis.currentPath,
    routeSegments: routeAnalysis.routeSegments,
    isEnterpriseRoute: routeAnalysis.isEnterpriseRoute,
    isIndustryRoute: routeAnalysis.isIndustryRoute,
    
    // Current navigation state
    industryCode: routeAnalysis.industryCode,
    moduleCode: routeAnalysis.moduleCode,
    areaCode: routeAnalysis.areaCode,
    operationCode: routeAnalysis.operationCode,
    
    // Current configurations
    currentIndustry,
    currentModule,
    currentArea,
    currentOperation,
    
    // Theme and styling
    currentTheme,
    themeVariables,
    
    // Navigation helpers
    navigateToModule,
    navigateToArea,
    navigateToOperation,
    
    // Breadcrumb generation
    breadcrumbs,
    
    // Route validation
    isValidRoute: routeValidation.isValid,
    routeError: routeValidation.error,
    
    // Page metadata
    pageTitle: pageMetadata.title,
    pageDescription: pageMetadata.description,
    
    // Navigation structure
    availableModules,
    availableAreas,
    availableOperations
  }
}

// Export the type for external use
export type { NavigationContext }