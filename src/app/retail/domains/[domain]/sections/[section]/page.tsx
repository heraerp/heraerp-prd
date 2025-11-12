/**
 * HERA Level 3 Section Workspace Page
 * Smart Code: HERA.RETAIL.SECTION.WORKSPACE.v1
 * 
 * Universal SAP-style workspace interface
 * Route: /retail/domains/[domain]/sections/[section] → e.g., /retail/domains/inventory/sections/overview
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
import UniversalSAPWorkspace from '@/components/retail/workspace/UniversalSAPWorkspace'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{
    domain: string
    section: string
  }>
}

export default function SectionWorkspacePage({ params }: PageProps) {
  const router = useRouter()
  const { domain, section } = use(params)
  const { organization, user, isAuthenticated, contextLoading } = useHERAAuth()

  // Show loading state
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/retail/login')
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
            <Button onClick={() => router.push('/retail/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  console.log('🚀 Rendering Universal SAP Workspace:', { domain, section })

  // Render the universal SAP workspace
  return (
    <UniversalSAPWorkspace 
      domain={domain}
      section={section}
      workspace="main"
    />
  )
}