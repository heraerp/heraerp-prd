/**
 * Dynamic Jewelry Industry Module Page
 * Smart Code: HERA.JEWELRY.DYNAMIC.MODULE.v1
 * 
 * Universal dynamic page for jewelry industry modules from hera-navigation.json
 * Route: /jewelry/[module] - e.g., /jewelry/precious-metals, /jewelry/gemstones
 */

import React from 'react'
import { notFound } from 'next/navigation'
import { UniversalModulePage } from '@/components/universal/UniversalModulePage'
import navigationConfig from '@/config/hera-navigation.json'

interface DynamicJewelryModulePageProps {
  params: {
    module: string
  }
}

export default function DynamicJewelryModulePage({ params }: DynamicJewelryModulePageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  
  // Get jewelry industry configuration
  const jewelryConfig = navigationConfig.industries.JEWELRY
  if (!jewelryConfig) {
    notFound()
  }

  // Find specialized module configuration
  const moduleConfig = jewelryConfig.specialized_modules[moduleSlug as keyof typeof jewelryConfig.specialized_modules]
  
  if (!moduleConfig) {
    // Check if it's a base module with jewelry overlay
    const baseModuleConfig = navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
    if (baseModuleConfig) {
      return (
        <UniversalModulePage
          moduleCode={moduleSlug}
          moduleConfig={baseModuleConfig}
          industry="Jewelry & Precious Metals"
          industryTheme={jewelryConfig.theme}
        />
      )
    }
    notFound()
  }

  return (
    <UniversalModulePage
      moduleCode={moduleSlug}
      moduleConfig={moduleConfig}
      industry="Jewelry & Precious Metals"
      industryTheme={jewelryConfig.theme}
    />
  )
}

// Generate static params for jewelry modules
export async function generateStaticParams() {
  const jewelryConfig = navigationConfig.industries.JEWELRY
  if (!jewelryConfig) return []

  const modules = Object.keys(jewelryConfig.specialized_modules).map(code => ({
    module: code.toLowerCase().replace('_', '-')
  }))
  
  // Add base modules with jewelry context
  const baseModules = Object.keys(navigationConfig.base_modules).map(code => ({
    module: code.toLowerCase()
  }))
  
  return [...modules, ...baseModules]
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DynamicJewelryModulePageProps) {
  const moduleSlug = params.module.replace('-', '_').toUpperCase()
  const jewelryConfig = navigationConfig.industries.JEWELRY
  
  if (!jewelryConfig) {
    return {
      title: 'Jewelry Module Not Found',
      description: 'The requested jewelry module could not be found'
    }
  }

  const moduleConfig = jewelryConfig.specialized_modules[moduleSlug as keyof typeof jewelryConfig.specialized_modules] ||
                      navigationConfig.base_modules[moduleSlug as keyof typeof navigationConfig.base_modules]
  
  if (!moduleConfig) {
    return {
      title: 'Jewelry Module Not Found',
      description: 'The requested jewelry module could not be found'
    }
  }

  return {
    title: `${moduleConfig.name} - HERA Jewelry ERP`,
    description: `Professional jewelry industry ${moduleConfig.name.toLowerCase()} management with precious metals and gemstone expertise`,
    openGraph: {
      title: `HERA Jewelry - ${moduleConfig.name}`,
      description: `Specialized jewelry industry ERP for ${moduleConfig.name.toLowerCase()} operations`,
      type: 'website'
    }
  }
}