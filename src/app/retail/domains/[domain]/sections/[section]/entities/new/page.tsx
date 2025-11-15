/**
 * Retail Universal Entity Creation Page
 * Smart Code: HERA.RETAIL.UNIVERSAL.ENTITY_CREATION.v1
 * 
 * Universal route for creating any entity type in retail workspaces
 * Route: /retail/domains/[domain]/sections/[section]/entities/new
 * 
 * Query Parameters:
 * - type: Entity type to create (optional, shows selector if not provided)
 * - app: Micro-app code (optional, auto-detected if not provided)
 */

'use client'

import React from 'react'
import { use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import UniversalEntityCreator from '@/components/micro-apps/UniversalEntityCreator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface PageProps {
  params: Promise<{
    domain: string
    section: string
  }>
}

export default function RetailUniversalEntityCreationPage({ params }: PageProps) {
  const { domain, section } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get optional query parameters
  const entityType = searchParams.get('type') || undefined
  const appCode = searchParams.get('app') || undefined
  const workspaceId = searchParams.get('workspace') || 'main'

  // Validate required parameters
  if (!domain || !section) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Invalid route parameters. Domain and section are required.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Prepare workspace context with retail app prefix
  const workspaceContext = {
    domain,
    section,
    workspace: workspaceId,
    organization_id: '', // Will be populated by UniversalEntityCreator from auth context
    ui_customizations: {
      app_code: appCode,
      app_prefix: 'retail'
    }
  }

  // Handle successful entity creation
  const handleEntityCreationSuccess = (result: any) => {
    console.log('✅ Retail entity created successfully:', result)
    
    // Show success message and redirect back to workspace
    setTimeout(() => {
      router.push(`/retail/domains/${domain}/sections/${section}`)
    }, 2000)
  }

  // Back URL for navigation
  const backUrl = `/retail/domains/${domain}/sections/${section}`

  return (
    <UniversalEntityCreator
      workspaceContext={workspaceContext}
      entityType={entityType}
      backUrl={backUrl}
      onSuccess={handleEntityCreationSuccess}
    />
  )
}