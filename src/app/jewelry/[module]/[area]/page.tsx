

/**
 * Dynamic Jewelry Industry Area Page
 * Smart Code: HERA.JEWELRY.DYNAMIC.AREA.v1
 * 
 * Universal dynamic page for jewelry industry areas from hera-navigation.json
 * Route: /jewelry/[module]/[area] - e.g., /jewelry/precious-metals/pricing
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalAreaPage } from '@/components/universal/UniversalAreaPage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicJewelryAreaPageProps {
  params: {
    module: string
    area: string
  }
}

export default function DynamicJewelryAreaPage({ params }: DynamicJewelryAreaPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  
  // Get jewelry industry configuration
  const jewelryConfig = navigationConfig.industries.JEWELRY
  if (!jewelryConfig) {
    notFound()
  }

  // Find module configuration
  let moduleConfig = jewelryConfig.specialized_modules[moduleSlug as keyof typeof jewelryConfig.specialized_modules]
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
      industry="Jewelry & Precious Metals"
      industryTheme={jewelryConfig.theme}
    />
  )
}

// Generate static params for jewelry areas
export async function generateStaticParams() {
  const params: Array<{ module: string; area: string }> = []
  const jewelryConfig = navigationConfig.industries.JEWELRY
  
  if (!jewelryConfig) return params

  // Specialized modules
  Object.entries(jewelryConfig.specialized_modules).forEach(([moduleCode, moduleConfig]) => {
    moduleConfig.areas.forEach(area => {
      const moduleSlug = moduleCode.toLowerCase().replace('_', '-')
      const areaSlug = area.route.split('/').pop() || area.code.toLowerCase().replace('_', '-')
      params.push({
        module: moduleSlug,
        area: areaSlug
      })
    })
  })

  // Base modules with jewelry context
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
export async function generateMetadata({ params }: DynamicJewelryAreaPageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const areaSlug = params.area.replace('-', '_').toUpperCase()
  
  const jewelryConfig = navigationConfig.industries.JEWELRY
  if (!jewelryConfig) {
    return {
      title: 'Jewelry Area Not Found',
      description: 'The requested jewelry area could not be found'
    }
  }

  const moduleConfig = jewelryConfig.specialized_modules[moduleSlug as keyof typeof jewelryConfig.specialized_modules] ||
                      navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Jewelry Area Not Found',
      description: 'The requested jewelry area could not be found'
    }
  }

  const areaConfig = moduleConfig.areas.find(area => 
    area.code === areaSlug || 
    area.code.replace('_', '-').toLowerCase() === params.area ||
    area.route.endsWith(`/${params.area}`)
  )
  
  if (!areaConfig) {
    return {
      title: 'Jewelry Area Not Found',
      description: 'The requested jewelry area could not be found'
    }
  }

  return {
    title: `${areaConfig.name} - HERA Jewelry ${moduleConfig.name}`,
    description: `Professional jewelry industry ${areaConfig.name.toLowerCase()} operations with precious metals and gemstone expertise`,
    openGraph: {
      title: `${areaConfig.name} - HERA Jewelry`,
      description: `Specialized ${areaConfig.name.toLowerCase()} management for jewelry industry`,
      type: 'website'
    }
  }
}