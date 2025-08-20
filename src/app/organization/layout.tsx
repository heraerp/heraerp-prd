'use client'

import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { OrganizationSidebar } from '@/components/organization/OrganizationSidebar'

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuth()
  const { organizationId, loading: contextLoading } = useUserContext()

  // Layer 1: Authentication Check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access organization settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Layer 2: Context Loading Check
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    )
  }

  // Layer 3: Organization Check
  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization found. Please select or create an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <OrganizationSidebar />
      <div className="flex-1 ml-16">
        {children}
      </div>
    </div>
  )
}