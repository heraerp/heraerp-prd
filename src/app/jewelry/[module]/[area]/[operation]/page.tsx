

/**
 * Dynamic Jewelry Industry Operation Page
 * Smart Code: HERA.JEWELRY.DYNAMIC.OPERATION.v1
 * 
 * Universal dynamic page for jewelry industry operations from hera-navigation.json
 * Route: /jewelry/[module]/[area]/[operation] - e.g., /jewelry/precious-metals/pricing/monitor
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalOperationPage } from '@/components/universal/UniversalOperationPage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicJewelryOperationPageProps {
  params: {
    module: string
    area: string
    operation: string
  }
}

export default function DynamicJewelryOperationPage({ params }: DynamicJewelryOperationPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  const operationSlug = params.operation.replace('-', '_').toUpperCase()
  
  // Get jewelry industry configuration
  const jewelryConfig = navigationConfig.industries.JEWELRY
  if (!jewelryConfig) {
    notFound()
  }

  // Find module configuration
  let moduleConfig = jewelryConfig.specialized_modules[moduleSlug as keyof typeof jewelryConfig.specialized_modules]
  
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
      industry="Jewelry & Precious Metals"
      industryTheme={jewelryConfig.theme}
    />
  )
}

// Generate static params for jewelry operations
export async function generateStaticParams() {
  const params: Array<{ module: string; area: string; operation: string }> = []
  const jewelryConfig = navigationConfig.industries.JEWELRY
  
  if (!jewelryConfig) return params

  // Specialized modules
  Object.entries(jewelryConfig.specialized_modules).forEach(([moduleCode, moduleConfig]) => {
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

  // Base modules with jewelry context
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
export async function generateMetadata({ params }: DynamicJewelryOperationPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  const operationSlug = params.operation.replace('-', '_').toUpperCase()
  
  const jewelryConfig = navigationConfig.industries.JEWELRY
  if (!jewelryConfig) {
    return {
      title: 'Jewelry Operation Not Found',
      description: 'The requested jewelry operation could not be found'
    }
  }

  const moduleConfig = jewelryConfig.specialized_modules[moduleSlug as keyof typeof jewelryConfig.specialized_modules] ||
                      navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Jewelry Operation Not Found',
      description: 'The requested jewelry operation could not be found'
    }
  }

  const areaConfig = moduleConfig.areas.find(area => 
    area.code === areaSlug || 
    area.code.replace('_', '-').toLowerCase() === params.area ||
    area.route.endsWith(`/${params.area}`)
  )
  
  if (!areaConfig) {
    return {
      title: 'Jewelry Operation Not Found',
      description: 'The requested jewelry operation could not be found'
    }
  }

  const operationConfig = areaConfig.operations.find(operation => 
    operation.code === operationSlug || 
    operation.code.replace('_', '-').toLowerCase() === params.operation ||
    operation.route.endsWith(`/${params.operation}`)
  )
  
  if (!operationConfig) {
    return {
      title: 'Jewelry Operation Not Found',
      description: 'The requested jewelry operation could not be found'
    }
  }

  return {
    title: `${operationConfig.name} - HERA Jewelry ${areaConfig.name}`,
    description: `Professional jewelry industry ${operationConfig.name.toLowerCase()} for ${areaConfig.name.toLowerCase()} with precious metals and gemstone expertise`,
    openGraph: {
      title: `${operationConfig.name} - HERA Jewelry`,
      description: `Specialized ${operationConfig.name.toLowerCase()} operations for jewelry industry`,
      type: 'website'
    }
  }
}