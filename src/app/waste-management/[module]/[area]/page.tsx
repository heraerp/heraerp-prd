

/**
 * Dynamic Waste Management Industry Area Page
 * Smart Code: HERA.WASTE_MGMT.DYNAMIC.AREA.v1
 * 
 * Universal dynamic page for waste management industry areas from hera-navigation.json
 * Route: /waste-management/[module]/[area] - e.g., /waste-management/routes/scheduling
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalAreaPage } from '@/components/universal/UniversalAreaPage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicWasteManagementAreaPageProps {
  params: {
    module: string
    area: string
  }
}

export default function DynamicWasteManagementAreaPage({ params }: DynamicWasteManagementAreaPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  
  // Get waste management industry configuration
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  if (!wasteConfig) {
    notFound()
  }

  // Find module configuration
  let moduleConfig = wasteConfig.specialized_modules[moduleSlug as keyof typeof wasteConfig.specialized_modules]
  let moduleName = ''

  if (!moduleConfig) {
    // Check base modules
    moduleConfig = navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
    if (!moduleConfig) {
      notFound()
    }
  }

  moduleName = moduleConfig.name

  // Find area configuration within module
  const areaConfig = moduleConfig.areas.find(area => 
    area.code === areaSlug || 
    area.code.replace('_', '-').toLowerCase() === params.area ||
    area.route.endsWith(`/${params.area}`)
  )
  
  if (!areaConfig) {
    notFound()
  }

  return (
    <UniversalAreaPage
      moduleCode={moduleSlug}
      moduleName={moduleName}
      areaConfig={areaConfig}
      industry="Waste Management & Recycling"
      industryTheme={wasteConfig.theme}
    />
  )
}

// Generate static params for waste management areas
export async function generateStaticParams() {
  const params: Array<{ module: string; area: string }> = []
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  
  if (!wasteConfig) return params

  // Specialized modules
  Object.entries(wasteConfig.specialized_modules).forEach(([moduleCode, moduleConfig]) => {
    moduleConfig.areas.forEach(area => {
      const moduleSlug = moduleCode.toLowerCase().replace('_', '-')
      const areaSlug = area.route.split('/').pop() || area.code.toLowerCase().replace('_', '-')
      params.push({
        module: moduleSlug,
        area: areaSlug
      })
    })
  })

  // Base modules with waste management context
  Object.entries(navigationConfig.base_modules).forEach(([moduleCode, moduleConfig]) => {
    moduleConfig.areas.forEach(area => {
      const moduleSlug = moduleCode.toLowerCase()
      const areaSlug = area.route.split('/').pop() || area.code.toLowerCase()
      params.push({
        module: moduleSlug,
        area: areaSlug
      })
    })
  })
  
  return params
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DynamicWasteManagementAreaPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  
  const wasteConfig = navigationConfig.industries.WASTE_MGMT
  if (!wasteConfig) {
    return {
      title: 'Waste Management Area Not Found',
      description: 'The requested waste management area could not be found'
    }
  }

  const moduleConfig = wasteConfig.specialized_modules[moduleSlug as keyof typeof wasteConfig.specialized_modules] ||
                      navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Waste Management Area Not Found',
      description: 'The requested waste management area could not be found'
    }
  }

  const areaConfig = moduleConfig.areas.find(area => 
    area.code === areaSlug || 
    area.code.replace('_', '-').toLowerCase() === params.area ||
    area.route.endsWith(`/${params.area}`)
  )
  
  if (!areaConfig) {
    return {
      title: 'Waste Management Area Not Found',
      description: 'The requested waste management area could not be found'
    }
  }

  return {
    title: `${areaConfig.name} - HERA Waste Management ${moduleConfig.name}`,
    description: `Professional waste management ${areaConfig.name.toLowerCase()} operations with environmental compliance and route optimization`,
    openGraph: {
      title: `${areaConfig.name} - HERA Waste Management`,
      description: `Specialized ${areaConfig.name.toLowerCase()} management for waste management industry`,
      type: 'website'
    }
  }
}