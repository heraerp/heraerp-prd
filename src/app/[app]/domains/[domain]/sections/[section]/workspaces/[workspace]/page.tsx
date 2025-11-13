/**
 * HERA Universal Workspace Page (Fully Dynamic)
 * Smart Code: HERA.UNIVERSAL.WORKSPACE.PAGE.v1
 *
 * This route works for ANY app: retail, agro, central, salon, furniture, etc.
 * Route Pattern: /[app]/domains/[domain]/sections/[section]/workspaces/[workspace]
 *
 * Examples:
 * - /retail/domains/analytics/sections/fin/workspaces/main
 * - /agro/domains/farm/sections/crops/workspaces/planning
 * - /central/domains/admin/sections/users/workspaces/main
 * - /salon/domains/operations/sections/appointments/workspaces/calendar
 *
 * Data Flow:
 * 1. Extract app, domain, section, and workspace from URL params
 * 2. Load workspace configuration via database-driven API
 * 3. Display universal SAP Fiori-style interface
 * 4. All navigation and routing is app-aware
 *
 * The workspace dynamically discovers:
 * - Domain entity via APP_HAS_DOMAIN relationship
 * - Section entity via HAS_SECTION relationship
 * - Workspace entity via HAS_WORKSPACE relationship
 * - Layout configuration from core_dynamic_data
 */

'use client'

import React from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import UniversalWorkspace from '@/components/universal/workspace/UniversalWorkspace'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{
    app: string
    domain: string
    section: string
    workspace: string
  }>
}

export default function UniversalWorkspacePage({ params }: PageProps) {
  const router = useRouter()
  const { app, domain, section, workspace } = use(params)
  const { organization, user, isAuthenticated, contextLoading } = useHERAAuth()

  // Show loading state
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading {app} workspace...</p>
          <p className="text-xs text-gray-500 mt-2">
            {domain} › {section} › {workspace}
          </p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push(`/${app}/login`)
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
            <Button onClick={() => router.push(`/${app}/dashboard`)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to {app.charAt(0).toUpperCase() + app.slice(1)} Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  console.log('🚀 Rendering Universal Workspace:', { app, domain, section, workspace })

  // Render the universal workspace with app context
  return (
    <UniversalWorkspace
      app={app}
      domain={domain}
      section={section}
      workspace={workspace}
    />
  )
}
