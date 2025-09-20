'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { UCRRuleManager } from '@/components/furniture/UCRRuleManager'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'


export default function UCRSettingsPage() {
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  
  // Three-layer authorization pattern
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6">
        <Alert className="max-w-md bg-[var(--color-body)]/50 border-[var(--color-border)]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access UCR settings.</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }
  
  if (!currentOrganization?.id) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6">
        <Alert className="max-w-md bg-[var(--color-body)]/50 border-[var(--color-border)]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found. Please select an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)] p-6">
      <div className="max-w-7xl mx-auto">
        <UCRRuleManager organizationId={currentOrganization.id} />
      </div>
      </div>
    )
}
