'use client'

/**
 * Module Home Page Template
 * Smart Code: HERA.MODULE.HOME.TEMPLATE.v1
 * 
 * Reusable SAP Fiori-inspired module home page template
 */

import React from 'react'
import { EnterpriseNavbar } from '@/components/sap/EnterpriseNavbar'
import { ProtectedSection } from '@/components/rbac/ProtectedPage'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { LucideIcon } from 'lucide-react'

interface KPICard {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: LucideIcon
  href?: string
}

interface QuickAction {
  title: string
  subtitle: string
  icon: LucideIcon
  href: string
  badge?: string | number
  requiredPermissions?: string[]
  requiredRoles?: string[]
}

interface ModuleSection {
  title: string
  items: QuickAction[]
  requiredPermissions?: string[]
  requiredRoles?: string[]
}

interface ModuleHomePageProps {
  moduleTitle: string
  breadcrumb: string
  userInitials?: string
  overview: {
    title: string
    subtitle: string
    kpis: KPICard[]
  }
  sections: ModuleSection[]
  onBack?: () => void
}

export function ModuleHomePage({
  moduleTitle,
  breadcrumb,
  userInitials = "JD",
  overview,
  sections,
  onBack
}: ModuleHomePageProps) {
  const { user } = useHERAAuth()
  const userId = user?.id || 'demo-user'
  const { hasPermission, hasRole } = useAccessControl({ userId })

  const KPIWidget = ({ kpi }: { kpi: KPICard }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-light text-gray-900">{kpi.value}</span>
            {kpi.unit && <span className="text-lg text-gray-500">{kpi.unit}</span>}
          </div>
          {kpi.subtitle && (
            <p className="text-sm text-gray-500 mt-1">{kpi.subtitle}</p>
          )}
          {kpi.trend && kpi.trendValue && (
            <div className={`flex items-center mt-2 text-sm ${
              kpi.trend === 'up' ? 'text-green-600' : 
              kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <span className="mr-1">
                {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'}
              </span>
              {kpi.trendValue}
            </div>
          )}
        </div>
        {kpi.icon && (
          <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
            <kpi.icon className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  )

  const ActionTile = ({ action }: { action: QuickAction }) => (
    <ProtectedSection
      requiredPermissions={action.requiredPermissions}
      requiredRoles={action.requiredRoles}
      showPlaceholder={false}
    >
      <a
        href={action.href}
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 block group"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-base font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {action.title}
            </h4>
            <p className="text-sm text-gray-600">{action.subtitle}</p>
          </div>
          <div className="flex items-center space-x-3">
            {action.badge && (
              <div className="flex items-center justify-center min-w-[40px]">
                <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                  <span className="text-lg font-light text-gray-700">{action.badge}</span>
                </div>
              </div>
            )}
            <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <action.icon className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
            </div>
          </div>
        </div>
      </a>
    </ProtectedSection>
  )

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <EnterpriseNavbar 
        title="HERA" 
        breadcrumb={breadcrumb}
        showBack={true}
        userInitials={userInitials}
        showSearch={true}
        onBack={onBack}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)]">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          
          {/* Module Overview Section */}
          <section>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h1 className="text-xl font-medium text-gray-900 mb-2">{overview.title}</h1>
              <p className="text-sm text-gray-600">{overview.subtitle}</p>
            </div>
            
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {overview.kpis.map((kpi, index) => (
                <KPIWidget key={index} kpi={kpi} />
              ))}
            </div>
          </section>

          {/* Module Sections */}
          {sections.map((section, sectionIndex) => (
            <ProtectedSection
              key={sectionIndex}
              requiredPermissions={section.requiredPermissions}
              requiredRoles={section.requiredRoles}
              showPlaceholder={false}
            >
              <section>
                <h2 className="text-lg font-medium text-gray-900 mb-4">{section.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((action, actionIndex) => (
                    <ActionTile key={actionIndex} action={action} />
                  ))}
                </div>
              </section>
            </ProtectedSection>
          ))}

          {/* Quick Links */}
          <section className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Quick Access</h3>
                <p className="text-sm text-blue-700">
                  Common tasks and frequently used functions
                </p>
              </div>
              <div className="flex space-x-2">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Resolve Payment Card Issues
                </a>
                <span className="text-blue-400">•</span>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Schedule Job
                </a>
                <span className="text-blue-400">•</span>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Compliance Information
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}