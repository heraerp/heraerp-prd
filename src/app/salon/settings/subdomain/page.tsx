'use client'

/**
 * HERA Salon Subdomain Settings Page
 * Smart Code: HERA.SALON.SETTINGS.SUBDOMAIN.v1
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import SubdomainSettingsForm from '@/components/org/SubdomainSettingsForm'
import { updateOrgSubdomainAction } from '@/app/actions/updateOrgSubdomain'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function SalonSubdomainSettingsPage() {
  const router = useRouter()
  const { currentOrganization, isLoading, isLoadingOrgs } = useMultiOrgAuth()
  const contextLoading = isLoading || isLoadingOrgs
  
  // For subdomain access, try to get organization directly from subdomain
  const [subdomainOrg, setSubdomainOrg] = useState<any>(null)
  const [loadingSubdomainOrg, setLoadingSubdomainOrg] = useState(false)
  
  const getSubdomain = () => {
    if (typeof window === 'undefined') return null
    const hostname = window.location.hostname
    if (hostname.endsWith('.lvh.me')) {
      return hostname.split('.')[0]
    }
    return null
  }
  
  // Load organization by subdomain if no auth context
  useEffect(() => {
    const subdomain = getSubdomain()
    if (subdomain && !currentOrganization && !contextLoading) {
      setLoadingSubdomainOrg(true)
      fetch(`/api/v1/organizations/by-subdomain?subdomain=${subdomain}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.organization) {
            setSubdomainOrg(data.organization)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSubdomainOrg(false))
    }
  }, [currentOrganization, contextLoading])
  
  const organization = currentOrganization || subdomainOrg

  // Loading state
  if (loadingSubdomainOrg || (!organization && contextLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        <SalonProductionSidebar />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="!text-gray-600 dark:!text-gray-300">Loading organization...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        <SalonProductionSidebar />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="text-center">
            <p className="!text-gray-600 dark:!text-gray-300">Organization not found</p>
          </div>
        </div>
      </div>
    )
  }

  // Get current salon configuration
  const currentConfig = {
    subdomain: organization.settings?.subdomain || organization.organization_code?.toLowerCase(),
    domains: organization.settings?.domains || [],
    previewBase: process.env.NODE_ENV === 'production' ? 'heraerp.com' : 'lvh.me:3000',
    organizationName: organization.organization_name || 'Your Salon'
  }

  // Handle save with salon-specific context
  async function handleSave(payload: { slug: string; subdomain: string; domains: string[] }) {
    return updateOrgSubdomainAction({
      slug: organization.settings?.subdomain || organization.organization_code?.toLowerCase() || 'salon',
      subdomain: payload.subdomain,
      domains: payload.domains
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon/settings')}
              className="mb-4 !text-gray-900 dark:!text-gray-100"
            >
              <ChevronLeft className="w-4 h-4 mr-2 !text-gray-900 dark:!text-gray-100" />
              Back to Settings
            </Button>
            
            <div className="mb-4">
              <h1 className="text-3xl font-bold !text-gray-900 dark:!text-gray-100 mb-2">
                Subdomain Settings
              </h1>
              <p className="!text-gray-600 dark:!text-gray-300 text-lg">
                Configure your salon's custom subdomain and professional URLs
              </p>
            </div>

            {/* Salon-specific info banner */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-800">
              <h3 className="font-medium !text-purple-900 dark:!text-purple-200 mb-2">Professional Salon Branding</h3>
              <p className="!text-purple-700 dark:!text-purple-300 text-sm">
                Set up a custom subdomain like <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded !text-purple-900 dark:!text-purple-200">yoursalon.heraerp.com</code> 
                {' '}for professional access to your salon management system. Your clients and staff will access 
                your salon at a branded URL that reflects your business identity.
              </p>
            </div>
          </div>

          {/* Subdomain Settings Form */}
          <SubdomainSettingsForm
            slug={organization.settings?.subdomain || organization.organization_code?.toLowerCase() || 'salon'}
            current={currentConfig}
            onSave={handleSave}
          />

          {/* Salon-specific tips */}
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium !text-blue-900 dark:!text-blue-200 mb-3">Salon URL Best Practices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm !text-blue-800 dark:!text-blue-300">
              <div>
                <strong>Good examples:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code>hair-talkz-dubai</code></li>
                  <li><code>salon-elegance</code></li>
                  <li><code>beauty-lounge-marina</code></li>
                </ul>
              </div>
              <div>
                <strong>Avoid:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Special characters (!@#$%)</li>
                  <li>Spaces or underscores</li>
                  <li>Very long names (&gt;30 chars)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}