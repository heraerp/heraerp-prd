/**
 * Dynamic Area Page
 * Smart Code: HERA.ENTERPRISE.DYNAMIC.AREA.v1
 * 
 * Universal dynamic page that generates area pages from hera-navigation.json
 * Route: /enterprise/[module]/[area] - e.g., /enterprise/finance/gl, /enterprise/procurement/po
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalAreaPage } from '@/components/universal/UniversalAreaPage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicAreaPageProps {
  params: Promise<{
    module: string
    area: string
  }>
}

export default async function DynamicAreaPage({ params }: DynamicAreaPageProps) {
  const { module, area } = await params
  const moduleCode = module.toUpperCase()
  const areaCode = area.toUpperCase()
  
  // Find module configuration in JSON
  const moduleConfig = navigationConfig.base_modules[moduleCode as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    notFound()
  }

  // Find area configuration within module
  const areaConfig = moduleConfig.areas.find(areaItem => 
    areaItem.code === areaCode || areaItem.route.endsWith(`/${area}`)
  )
  
  if (!areaConfig) {
    notFound()
  }

  return (
    <UniversalAreaPage
      moduleCode={moduleCode}
      moduleName={moduleConfig.name}
      areaConfig={areaConfig}
      industry="Enterprise"
    />
  )
}

// Generate static params for known modules and areas
export async function generateStaticParams() {
  const params: Array<{ module: string; area: string }> = []
  
  Object.entries(navigationConfig.base_modules).forEach(([moduleCode, moduleConfig]) => {
    moduleConfig.areas.forEach(area => {
      // Extract area code from route
      const areaSlug = area.route.split('/').pop() || area.code.toLowerCase()
      params.push({
        module: moduleCode.toLowerCase(),
        area: areaSlug
      })
    })
  })
  
  return params
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DynamicAreaPageProps) {
  const { module, area } = await params
  const moduleCode = module.toUpperCase()
  const areaCode = area.toUpperCase()
  
  const moduleConfig = navigationConfig.base_modules[moduleCode as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Area Not Found',
      description: 'The requested area could not be found'
    }
  }

  const areaConfig = moduleConfig.areas.find(areaItem => 
    areaItem.code === areaCode || areaItem.route.endsWith(`/${area}`)
  )
  
  if (!areaConfig) {
    return {
      title: 'Area Not Found',
      description: 'The requested area could not be found'
    }
  }

  return {
    title: `${areaConfig.name} - HERA ${moduleConfig.name}`,
    description: `${areaConfig.name} operations within HERA ${moduleConfig.name} module for comprehensive business management`,
    openGraph: {
      title: `${areaConfig.name} - HERA ${moduleConfig.name}`,
      description: `Manage ${areaConfig.name.toLowerCase()} operations with HERA's enterprise-grade ${moduleConfig.name.toLowerCase()} module`,
      type: 'website'
    }
  }
}