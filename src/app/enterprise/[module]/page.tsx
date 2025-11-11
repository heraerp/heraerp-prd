/**
 * Dynamic Module Page
 * Smart Code: HERA.ENTERPRISE.DYNAMIC.MODULE.v1
 * 
 * Universal dynamic page that generates module pages from hera-navigation.json
 * Route: /enterprise/[module] - e.g., /enterprise/finance, /enterprise/procurement
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalModulePage } from '@/components/universal/UniversalModulePage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicModulePageProps {
  params: Promise<{
    module: string
  }>
}

export default async function DynamicModulePage({ params }: DynamicModulePageProps) {
  const { module } = await params
  const moduleCode = module.toUpperCase()
  
  // Find module configuration in JSON
  const moduleConfig = navigationConfig.base_modules[moduleCode as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    notFound()
  }

  return (
    <UniversalModulePage
      moduleCode={moduleCode}
      moduleConfig={moduleConfig}
      industry="Enterprise"
    />
  )
}

// Generate static params for known modules (optional optimization)
export async function generateStaticParams() {
  const modules = Object.keys(navigationConfig.base_modules).map(code => ({
    module: code.toLowerCase()
  }))
  
  return modules
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DynamicModulePageProps) {
  const { module } = await params
  const moduleCode = module.toUpperCase()
  const moduleConfig = navigationConfig.base_modules[moduleCode as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Module Not Found',
      description: 'The requested module could not be found'
    }
  }

  return {
    title: `HERA ${moduleConfig.name} - Enterprise ERP`,
    description: `HERA ${moduleConfig.name} module for enterprise resource planning and business operations`,
    openGraph: {
      title: `HERA ${moduleConfig.name}`,
      description: `Comprehensive ${moduleConfig.name.toLowerCase()} management for enterprise operations`,
      type: 'website'
    }
  }
}