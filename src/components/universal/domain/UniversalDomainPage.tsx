/**
 * Universal Domain Page Component
 * Smart Code: HERA.UNIVERSAL.DOMAIN.PAGE.v1
 *
 * Single source of truth for all HERA app domain pages (Retail, Agro, Waste, Salon, etc.)
 * Eliminates 95% code duplication between app-specific domain pages
 *
 * Data Flow:
 * 1. Accept DomainConfig prop with app-specific settings
 * 2. Fetch APP_DOMAIN and APP_SECTION entities from platform org
 * 3. Render universal 3-column enterprise layout
 * 4. Apply app-specific theme, colors, icons, and content
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Home,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sprout
} from 'lucide-react'

// Import domain-specific components
import DomainNewsPanel from '@/components/retail/domain/DomainNewsPanel'
import DynamicSectionModules from '@/components/retail/domain/DynamicSectionModules'
import DomainAppsTab from '@/components/retail/domain/DomainAppsTab'
import DomainInsightsTiles from '@/components/retail/domain/DomainInsightsTiles'
import DomainHERAAssistant from '@/components/retail/domain/DomainHERAAssistant'

import { DomainConfig } from './types'

interface UniversalDomainPageProps {
  config: DomainConfig
  domainSlug: string
}

export function UniversalDomainPage({ config, domainSlug }: UniversalDomainPageProps) {
  const router = useRouter()
  const { organization, user, isAuthenticated } = useHERAAuth()

  // State for domain info
  const [domainEntity, setDomainEntity] = useState<any>(null)

  // Fetch all APP_DOMAIN entities to find the matching one
  const { entities: domainEntities, isLoading: domainsLoading } = useUniversalEntityV1({
    entity_type: 'APP_DOMAIN',
    organizationId: '00000000-0000-0000-0000-000000000000', // Platform org
    filters: {
      limit: 50,
      include_dynamic: false,
      include_relationships: false
    }
  })

  // Fetch all APP_SECTION entities to filter by parent_entity_id
  const { entities: sectionEntities, isLoading: sectionsLoading, refetch: refetchSections } = useUniversalEntityV1({
    entity_type: 'APP_SECTION',
    organizationId: '00000000-0000-0000-0000-000000000000', // Platform org
    filters: {
      limit: 100,
      include_dynamic: false,
      include_relationships: false  // parent_entity_id is a direct field, not relationship
    }
  })

  // Find domain entity using 3-stage matching algorithm
  useEffect(() => {
    if (!domainsLoading && domainEntities) {
      console.log('🔍 Universal Domain: Processing domain entity', {
        domainSlug,
        appCode: config.appCode,
        totalDomains: domainEntities.length
      })

      // Find the APP_DOMAIN entity matching the domain slug
      let matchedDomain = null

      // Stage 1: Try metadata slug first (most reliable)
      matchedDomain = domainEntities.find(d => {
        if (d.metadata?.slug) {
          return d.metadata.slug === domainSlug
        }
        return false
      })

      // Stage 2: Extract from entity_code (NAV-DOM-PLANNING → planning)
      if (!matchedDomain) {
        matchedDomain = domainEntities.find(d => {
          if (d.entity_code?.startsWith('NAV-DOM-')) {
            let codeSlug = d.entity_code.replace('NAV-DOM-', '').toLowerCase()

            // Handle special cases to match dashboard routing
            if (codeSlug === 'inventorywh') codeSlug = 'inventory'
            if (codeSlug === 'merchandising') codeSlug = 'merchandising'

            if (codeSlug === domainSlug || codeSlug === domainSlug.replace('-', '')) {
              return true
            }
          }
          return false
        })
      }

      // Stage 3: Extract from smart_code (HERA.PLATFORM.NAV.APPDOMAIN.PLANNING.v1 → planning)
      if (!matchedDomain) {
        matchedDomain = domainEntities.find(d => {
          if (d.smart_code) {
            const smartCodeParts = d.smart_code.split('.')
            let smartCodeDomain = smartCodeParts[4]?.toLowerCase()

            // Handle special cases
            if (smartCodeDomain === 'inventorywh') smartCodeDomain = 'inventory'

            if (smartCodeDomain === domainSlug || smartCodeDomain === domainSlug.replace('-', '')) {
              return true
            }
          }
          return false
        })
      }

      if (matchedDomain) {
        console.log('✅ Found domain entity:', {
          id: matchedDomain.id,
          name: matchedDomain.entity_name,
          code: matchedDomain.entity_code,
          slug: domainSlug,
          app: config.appCode
        })
        setDomainEntity(matchedDomain)
      } else {
        console.warn('❌ Domain not found:', domainSlug)
        setDomainEntity(null)
      }
    }
  }, [domainSlug, domainsLoading, domainEntities, config.appCode])

  // Refresh function for all components
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered for', config.appCode)
    refetchSections()
  }

  const isLoading = domainsLoading || sectionsLoading

  // Get brand icon if specified (e.g., Sprout for Agro)
  const BrandIcon = config.theme.brandIcon === 'Sprout' ? Sprout : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      <div className={`md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b ${config.theme.borderColorClass}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(config.navigation.dashboardRoute)}>
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              {BrandIcon && <BrandIcon className="w-5 h-5 text-slate-600" />}
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {domainEntity?.entity_name || domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
                </h1>
                <p className="text-xs text-slate-500">{config.navigation.subtitleText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className={`hidden md:block bg-white/80 backdrop-blur-xl border-b ${config.theme.borderColorClass} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <button onClick={() => router.push(config.navigation.dashboardRoute)} className="hover:text-slate-900 transition-colors">
              <Home className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => router.push(config.navigation.dashboardRoute)} className="hover:text-slate-900 transition-colors">
              {config.appName}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{domainEntity?.entity_name || domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {BrandIcon && <BrandIcon className="w-6 h-6 text-slate-600" />}
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {domainEntity?.entity_name || domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
                </h1>
                <p className="text-slate-600">
                  {domainEntity?.metadata?.subtitle || domainEntity?.entity_description || 'Comprehensive domain overview with enterprise capabilities'}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive 3-Column Layout */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">

          {/* Left Column - News (Mobile: Full width, Desktop: 25%) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <DomainNewsPanel
              domain={domainSlug}
              config={config}
              className="h-fit"
            />
          </div>

          {/* Center Column - Dynamic Content (Mobile: Full width, Desktop: 50%) */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-4 md:space-y-6">

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4 md:space-y-6">
                <div className="animate-pulse">
                  <div className="h-6 md:h-8 bg-gray-200 rounded mb-3 md:mb-4 w-1/2 md:w-1/3"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-200 rounded-xl h-40 md:h-48"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error State - Domain Not Found */}
            {!isLoading && !domainEntity && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Domain "{domainSlug}" not found. <Button variant="link" onClick={() => router.push(config.navigation.dashboardRoute)} className="text-red-600 underline p-0 h-auto">Go back</Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Main Content When Loaded */}
            {!isLoading && domainEntity && (
              <>
                {/* Dynamic Section Modules */}
                <DynamicSectionModules
                  domain={domainSlug}
                  domainEntity={domainEntity}
                  sectionEntities={sectionEntities || []}
                  isLoading={sectionsLoading}
                  onRefresh={handleRefresh}
                  config={config}
                  className=""
                />

                {/* Domain Apps Tab - Hidden on mobile, shown on tablet+ */}
                <div className="hidden sm:block">
                  <DomainAppsTab
                    domain={domainSlug}
                    config={config}
                    className=""
                  />
                </div>

                {/* Domain Insights Tiles */}
                <DomainInsightsTiles
                  domain={domainSlug}
                  config={config}
                  className=""
                />
              </>
            )}
          </div>

          {/* Right Column - HERA Assistant (Mobile: Full width, Desktop: 25%) */}
          <div className="lg:col-span-1 order-3">
            <div className="lg:sticky lg:top-6">
              <DomainHERAAssistant
                domain={domainSlug}
                config={config}
                className="h-fit"
              />
            </div>
          </div>
        </div>

        {/* Mobile-Only Bottom Action Bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => alert('Quick Actions for mobile')}
            >
              🚀 Quick Actions
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => alert('Mobile apps menu')}
            >
              📱 Apps
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleRefresh}
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Bottom spacing for mobile action bar */}
        <div className="h-20 sm:h-0"></div>
      </div>
    </div>
  )
}
