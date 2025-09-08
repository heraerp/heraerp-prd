'use client'

import React from 'react'
import { LeaveManagementDashboard } from '@/components/salon/leave/LeaveManagementDashboard'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function SalonLeavePage() {
  const { isAuthenticated, contextLoading, currentOrganization } = useMultiOrgAuth()

  // Layer 1: Authentication Check
  if (!isAuthenticated) {
    return (
      <Alert variant="destructive" className="m-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          Please log in to access the leave management system.
        </AlertDescription>
      </Alert>
    )
  }

  // Layer 2: Context Loading Check
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Layer 3: Organization Check
  if (!currentOrganization) {
    return (
      <Alert variant="destructive" className="m-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Organization Context</AlertTitle>
        <AlertDescription>
          Please select an organization to access the leave management system.
        </AlertDescription>
      </Alert>
    )
  }

  return <LeaveManagementDashboard />
}