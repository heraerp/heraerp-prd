

/**
 * Dynamic Waste Management Industry Module Page
 * Smart Code: HERA.WASTE_MGMT.DYNAMIC.MODULE.v1
 * 
 * Universal dynamic page for waste management industry modules from hera-navigation.json
 * Route: /waste-management/[module] - e.g., /waste-management/routes, /waste-management/compliance
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalModulePage } from '@/components/universal/UniversalModulePage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicWasteManagementModulePageProps {
  params: {
    module: string
  }
}

export default function DynamicWasteManagementModulePage({ params }: DynamicWasteManagementModulePageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  
  // Get waste management industry configuration
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  if (!wasteConfig) {
    notFound()
  }

  // Find specialized module configuration
  const moduleConfig = wasteConfig.specialized_modules[moduleSlug as keyof typeof wasteConfig.specialized_modules]
  
  if (!moduleConfig) {
    // Check if it's a base module with waste management overlay
    const baseModuleConfig = navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
    if (baseModuleConfig) {
      return (
        <UniversalModulePage
          moduleCode={moduleSlug}
          moduleConfig={baseModuleConfig}
          industry="Waste Management & Recycling"
          industryTheme={wasteConfig.theme}
        />
      )
    }
    notFound()
  }

  return (
    <UniversalModulePage
      moduleCode={moduleSlug}
      moduleConfig={moduleConfig}
      industry="Waste Management & Recycling"
      industryTheme={wasteConfig.theme}
    />
  )
}

// Generate static params for waste management modules
export async function generateStaticParams() {
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  if (!wasteConfig) return []

  const modules = Object.keys(wasteConfig.specialized_modules).map(code => ({
    module: code.toLowerCase().replace('_', '-')
  }))
  
  // Add base modules with waste management context
  const baseModules = Object.keys(navigationConfig.base_modules).map(code => ({
    module: code.toLowerCase()
  }))
  
  return [...modules, ...baseModules]
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DynamicWasteManagementModulePageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  
  if (!wasteConfig) {
    return {
      title: 'Waste Management Module Not Found',
      description: 'The requested waste management module could not be found'
    }
  }

  const moduleConfig = wasteConfig.specialized_modules[moduleSlug as keyof typeof wasteConfig.specialized_modules] ||
                      navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Waste Management Module Not Found',
      description: 'The requested waste management module could not be found'
    }
  }

  return {
    title: `${moduleConfig.name} - HERA Waste Management ERP`,
    description: `Professional waste management industry ${moduleConfig.name.toLowerCase()} with environmental compliance and route optimization`,
    openGraph: {
      title: `HERA Waste Management - ${moduleConfig.name}`,
      description: `Specialized waste management ERP for ${moduleConfig.name.toLowerCase()} operations`,
      type: 'website'
    }
  }
}