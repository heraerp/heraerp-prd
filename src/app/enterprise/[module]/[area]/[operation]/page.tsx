/**
 * Dynamic Operation Page
 * Smart Code: HERA.ENTERPRISE.DYNAMIC.OPERATION.v1
 * 
 * Universal dynamic page that generates operation pages from hera-navigation.json
 * Route: /enterprise/[module]/[area]/[operation] - e.g., /enterprise/finance/gl/create
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalOperationPage } from '@/components/universal/UniversalOperationPage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicOperationPageProps {
  params: Promise<{
    module: string
    area: string
    operation: string
  }>
}

export default async function DynamicOperationPage({ params }: DynamicOperationPageProps) {
  const { module, area, operation } = await params
  const moduleCode = module.toUpperCase()
  const areaCode = area.toUpperCase()
  const operationCode = operation.toUpperCase()
  
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

  // Find operation configuration within area
  const operationConfig = areaConfig.operations.find(operationItem => 
    operationItem.code === operationCode || operationItem.route.endsWith(`/${operation}`)
  )
  
  if (!operationConfig) {
    notFound()
  }

  return (
    <UniversalOperationPage
      moduleCode={moduleCode}
      moduleName={moduleConfig.name}
      areaCode={areaConfig.code}
      areaName={areaConfig.name}
      operationConfig={operationConfig}
      industry="Enterprise"
    />
  )
}

// Generate static params for known modules, areas, and operations
export async function generateStaticParams() {
  const params: Array<{ module: string; area: string; operation: string }> = []
  
  Object.entries(navigationConfig.base_modules).forEach(([moduleCode, moduleConfig]) => {
    moduleConfig.areas.forEach(area => {
      // Extract area code from route
      const areaSlug = area.route.split('/').pop() || area.code.toLowerCase()
      
      area.operations.forEach(operation => {
        // Extract operation code from route
        const operationSlug = operation.route.split('/').pop() || operation.code.toLowerCase()
        
        params.push({
          module: moduleCode.toLowerCase(),
          area: areaSlug,
          operation: operationSlug
        })
      })
    })
  })
  
  return params
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DynamicOperationPageProps) {
  const { module, area, operation } = await params
  const moduleCode = module.toUpperCase()
  const areaCode = area.toUpperCase()
  const operationCode = operation.toUpperCase()
  
  const moduleConfig = navigationConfig.base_modules[moduleCode as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Operation Not Found',
      description: 'The requested operation could not be found'
    }
  }

  const areaConfig = moduleConfig.areas.find(areaItem => 
    areaItem.code === areaCode || areaItem.route.endsWith(`/${area}`)
  )
  
  if (!areaConfig) {
    return {
      title: 'Operation Not Found',
      description: 'The requested operation could not be found'
    }
  }

  const operationConfig = areaConfig.operations.find(operationItem => 
    operationItem.code === operationCode || operationItem.route.endsWith(`/${operation}`)
  )
  
  if (!operationConfig) {
    return {
      title: 'Operation Not Found',
      description: 'The requested operation could not be found'
    }
  }

  return {
    title: `${operationConfig.name} - ${areaConfig.name} - HERA ${moduleConfig.name}`,
    description: `${operationConfig.name} operation for ${areaConfig.name} in HERA ${moduleConfig.name} module`,
    openGraph: {
      title: `${operationConfig.name} - ${areaConfig.name}`,
      description: `Execute ${operationConfig.name.toLowerCase()} operations for ${areaConfig.name.toLowerCase()} management`,
      type: 'website'
    }
  }
}