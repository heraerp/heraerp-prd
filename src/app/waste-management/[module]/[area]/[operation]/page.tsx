

/**
 * Dynamic Waste Management Industry Operation Page
 * Smart Code: HERA.WASTE_MGMT.DYNAMIC.OPERATION.v1
 * 
 * Universal dynamic page for waste management industry operations from hera-navigation.json
 * Route: /waste-management/[module]/[area]/[operation] - e.g., /waste-management/routes/scheduling/plan
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalOperationPage } from '@/components/universal/UniversalOperationPage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicWasteManagementOperationPageProps {
  params: {
    module: string
    area: string
    operation: string
  }
}

export default function DynamicWasteManagementOperationPage({ params }: DynamicWasteManagementOperationPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  const operationSlug = params.operation.replace('-', '_').toUpperCase()
  
  // Get waste management industry configuration
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  if (!wasteConfig) {
    notFound()
  }

  // Find module configuration
  let moduleConfig = wasteConfig.specialized_modules[moduleSlug as keyof typeof wasteConfig.specialized_modules]
  
  if (!moduleConfig) {
    // Check base modules
    moduleConfig = navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
    if (!moduleConfig) {
      notFound()
    }
  }

  // Find area configuration within module
  const areaConfig = moduleConfig.areas.find(area => 
    area.code === areaSlug || 
    area.code.replace('_', '-').toLowerCase() === params.area ||
    area.route.endsWith(`/${params.area}`)
  )
  
  if (!areaConfig) {
    notFound()
  }

  // Find operation configuration within area
  const operationConfig = areaConfig.operations.find(operation => 
    operation.code === operationSlug || 
    operation.code.replace('_', '-').toLowerCase() === params.operation ||
    operation.route.endsWith(`/${params.operation}`)
  )
  
  if (!operationConfig) {
    notFound()
  }

  return (
    <UniversalOperationPage
      moduleCode={moduleSlug}
      moduleName={moduleConfig.name}
      areaCode={areaConfig.code}
      areaName={areaConfig.name}
      operationConfig={operationConfig}
      industry="Waste Management & Recycling"
      industryTheme={wasteConfig.theme}
    />
  )
}

// Generate static params for waste management operations
export async function generateStaticParams() {
  const params: Array<{ module: string; area: string; operation: string }> = []
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  
  if (!wasteConfig) return params

  // Specialized modules
  Object.entries(wasteConfig.specialized_modules).forEach(([moduleCode, moduleConfig]) => {
    moduleConfig.areas.forEach(area => {
      const moduleSlug = moduleCode.toLowerCase().replace('_', '-')
      const areaSlug = area.route.split('/').pop() || area.code.toLowerCase().replace('_', '-')
      
      area.operations.forEach(operation => {
        const operationSlug = operation.route.split('/').pop() || operation.code.toLowerCase().replace('_', '-')
        
        params.push({
          module: moduleSlug,
          area: areaSlug,
          operation: operationSlug
        })
      })
    })
  })

  // Base modules with waste management context
  Object.entries(navigationConfig.base_modules).forEach(([moduleCode, moduleConfig]) => {
    moduleConfig.areas.forEach(area => {
      const moduleSlug = moduleCode.toLowerCase()
      const areaSlug = area.route.split('/').pop() || area.code.toLowerCase()
      
      area.operations.forEach(operation => {
        const operationSlug = operation.route.split('/').pop() || operation.code.toLowerCase()
        
        params.push({
          module: moduleSlug,
          area: areaSlug,
          operation: operationSlug
        })
      })
    })
  })
  
  return params
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DynamicWasteManagementOperationPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  const operationSlug = params.operation.replace('-', '_').toUpperCase()
  
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  if (!wasteConfig) {
    return {
      title: 'Waste Management Operation Not Found',
      description: 'The requested waste management operation could not be found'
    }
  }

  const moduleConfig = wasteConfig.specialized_modules[moduleSlug as keyof typeof wasteConfig.specialized_modules] ||
                      navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Waste Management Operation Not Found',
      description: 'The requested waste management operation could not be found'
    }
  }

  const areaConfig = moduleConfig.areas.find(area => 
    area.code === areaSlug || 
    area.code.replace('_', '-').toLowerCase() === params.area ||
    area.route.endsWith(`/${params.area}`)
  )
  
  if (!areaConfig) {
    return {
      title: 'Waste Management Operation Not Found',
      description: 'The requested waste management operation could not be found'
    }
  }

  const operationConfig = areaConfig.operations.find(operation => 
    operation.code === operationSlug || 
    operation.code.replace('_', '-').toLowerCase() === params.operation ||
    operation.route.endsWith(`/${params.operation}`)
  )
  
  if (!operationConfig) {
    return {
      title: 'Waste Management Operation Not Found',
      description: 'The requested waste management operation could not be found'
    }
  }

  return {
    title: `${operationConfig.name} - HERA Waste Management ${areaConfig.name}`,
    description: `Professional waste management ${operationConfig.name.toLowerCase()} for ${areaConfig.name.toLowerCase()} with environmental compliance and route optimization`,
    openGraph: {
      title: `${operationConfig.name} - HERA Waste Management`,
      description: `Specialized ${operationConfig.name.toLowerCase()} operations for waste management industry`,
      type: 'website'
    }
  }
}