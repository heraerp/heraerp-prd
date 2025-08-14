'use client'

import React, { ReactNode } from 'react'
import { UniversalProgressiveProvider, UniversalModuleConfig } from '@/components/auth/UniversalProgressiveProvider'
import { UniversalProgressiveSidebar } from './UniversalProgressiveSidebar'
import { UniversalProgressiveBanner } from '@/components/auth/UniversalProgressiveBanner'
import { UniversalDataStatusIndicator } from '@/components/auth/UniversalProgressivePrompts'

interface UniversalProgressiveLayoutProps {
  children: ReactNode
  module: UniversalModuleConfig
  showSidebar?: boolean
  showBanner?: boolean
  showDataStatus?: boolean
  className?: string
  customHeader?: ReactNode
  customActions?: ReactNode
}

export function UniversalProgressiveLayout({
  children,
  module,
  showSidebar = true,
  showBanner = true,
  showDataStatus = true,
  className = '',
  customHeader,
  customActions
}: UniversalProgressiveLayoutProps) {
  return (
    <UniversalProgressiveProvider module={module}>
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-${module.primaryColor.split('-')[0]}-50 to-white ${className}`}>
        {/* Universal Progressive Sidebar */}
        {showSidebar && <UniversalProgressiveSidebar />}
        
        <div className={showSidebar ? 'ml-16' : ''}>
          {/* Universal Progressive Banner */}
          {showBanner && <UniversalProgressiveBanner />}
          
          {/* Header */}
          <header className="border-b bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${module.gradientColors} shadow-lg`}>
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      HERA {module.title}
                    </h1>
                    <p className="text-sm text-slate-600">
                      {module.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {customHeader}
                  {customActions}
                  {showDataStatus && <UniversalDataStatusIndicator />}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </UniversalProgressiveProvider>
  )
}

// Preset layout configurations for common patterns
export function FinancialProgressiveLayout({ children, ...props }: Omit<UniversalProgressiveLayoutProps, 'module'>) {
  const { UNIVERSAL_MODULE_CONFIGS } = require('@/components/auth/UniversalProgressiveProvider')
  return (
    <UniversalProgressiveLayout module={UNIVERSAL_MODULE_CONFIGS.financial} {...props}>
      {children}
    </UniversalProgressiveLayout>
  )
}

export function CRMProgressiveLayout({ children, ...props }: Omit<UniversalProgressiveLayoutProps, 'module'>) {
  const { UNIVERSAL_MODULE_CONFIGS } = require('@/components/auth/UniversalProgressiveProvider')
  return (
    <UniversalProgressiveLayout module={UNIVERSAL_MODULE_CONFIGS.crm} {...props}>
      {children}
    </UniversalProgressiveLayout>
  )
}

export function InventoryProgressiveLayout({ children, ...props }: Omit<UniversalProgressiveLayoutProps, 'module'>) {
  const { UNIVERSAL_MODULE_CONFIGS } = require('@/components/auth/UniversalProgressiveProvider')
  return (
    <UniversalProgressiveLayout module={UNIVERSAL_MODULE_CONFIGS.inventory} {...props}>
      {children}
    </UniversalProgressiveLayout>
  )
}

export function JewelryProgressiveLayout({ children, ...props }: Omit<UniversalProgressiveLayoutProps, 'module'>) {
  const { UNIVERSAL_MODULE_CONFIGS } = require('@/components/auth/UniversalProgressiveProvider')
  return (
    <UniversalProgressiveLayout module={UNIVERSAL_MODULE_CONFIGS.jewelry} {...props}>
      {children}
    </UniversalProgressiveLayout>
  )
}

export function RestaurantProgressiveLayout({ children, ...props }: Omit<UniversalProgressiveLayoutProps, 'module'>) {
  const { UNIVERSAL_MODULE_CONFIGS } = require('@/components/auth/UniversalProgressiveProvider')
  return (
    <UniversalProgressiveLayout module={UNIVERSAL_MODULE_CONFIGS.restaurant} {...props}>
      {children}
    </UniversalProgressiveLayout>
  )
}

export function HealthcareProgressiveLayout({ children, ...props }: Omit<UniversalProgressiveLayoutProps, 'module'>) {
  const { UNIVERSAL_MODULE_CONFIGS } = require('@/components/auth/UniversalProgressiveProvider')
  return (
    <UniversalProgressiveLayout module={UNIVERSAL_MODULE_CONFIGS.healthcare} {...props}>
      {children}
    </UniversalProgressiveLayout>
  )
}