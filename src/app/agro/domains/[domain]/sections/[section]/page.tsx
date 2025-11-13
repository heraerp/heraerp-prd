/**
 * HERA Level 3 Section Workspace Page - Agro
 * Smart Code: HERA.AGRO.SECTION.WORKSPACE.v1
 *
 * Universal SAP-style workspace interface for agro operations
 * Route: /agro/domains/[domain]/sections/[section] → e.g., /agro/domains/production/sections/factory_floor
 *
 * Data Flow:
 * 1. Extract domain and section from URL params
 * 2. Load universal workspace via database-driven API
 * 3. Display SAP Fiori-style interface with enterprise features
 */

'use client'

import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Home,
  ChevronRight,
  Sprout,
  Package,
  Settings,
  BarChart3
} from 'lucide-react'

interface PageProps {
  params: Promise<{
    domain: string
    section: string
  }>
}

export default function AgroSectionWorkspacePage({ params }: PageProps) {
  const router = useRouter()
  const { domain, section } = use(params)
  const { organization, user, isAuthenticated, contextLoading } = useHERAAuth()

  // Show loading state
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login?app=agro')
    return null
  }

  // Show organization context error
  if (!organization?.id) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              No organization context available. Please select an organization.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button onClick={() => router.push('/agro/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  console.log('🚀 Rendering Agro Section Workspace:', { domain, section })

  // TODO: Replace with UniversalSAPWorkspace component when available
  // For now, render a placeholder workspace interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-green-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/agro/domains/${domain}`)}>
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {section.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h1>
              <p className="text-xs text-slate-500">Agro • {domain.charAt(0).toUpperCase() + domain.slice(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white/80 backdrop-blur-xl border-b border-green-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <button onClick={() => router.push('/agro/dashboard')} className="hover:text-slate-900 transition-colors">
              <Home className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => router.push('/agro/dashboard')} className="hover:text-slate-900 transition-colors">
              HERA Agro
            </button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => router.push(`/agro/domains/${domain}`)} className="hover:text-slate-900 transition-colors">
              {domain.charAt(0).toUpperCase() + domain.slice(1)}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">
              {section.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sprout className="h-6 w-6 text-green-600" />
                {section.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h1>
              <p className="text-slate-600">
                Workspace for {domain} domain
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Placeholder Workspace */}
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">

          {/* Workspace Info Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8 text-center mb-6">
            <Sprout className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Universal Workspace Loading</h2>
            <p className="text-gray-700 mb-4">
              This is the {section.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} workspace for {domain} domain.
            </p>
            <div className="flex gap-2 justify-center">
              <Badge variant="outline" className="bg-white">Domain: {domain}</Badge>
              <Badge variant="outline" className="bg-white">Section: {section}</Badge>
              <Badge variant="outline" className="bg-white">Workspace: main</Badge>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder Card 1 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Master Data</h3>
                <Package className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Entity management and CRUD operations will appear here when the Universal Workspace component is implemented.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            {/* Placeholder Card 2 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Real-time analytics and insights will be displayed here.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            {/* Placeholder Card 3 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Workflows</h3>
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Workflow automation and process management tools.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </div>

          {/* Technical Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 Technical Information</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Route:</strong> /agro/domains/{domain}/sections/{section}</div>
              <div><strong>Organization:</strong> {organization.entity_name} ({organization.id})</div>
              <div><strong>User:</strong> {user?.email}</div>
              <div><strong>Component:</strong> TODO: Implement UniversalSAPWorkspace</div>
            </div>
          </div>
        </div>

        {/* Bottom spacing for mobile */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  )
}
