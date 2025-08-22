'use client'

import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentOrganization, isLoading } = useMultiOrgAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            Please select an organization to continue.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <SalonProductionSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}