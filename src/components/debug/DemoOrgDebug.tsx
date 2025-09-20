'use client'

import React, { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export function DemoOrgDebug() {
  const { user, currentOrganization, organizations, isAuthenticated, isLoading } = useMultiOrgAuth()
  const [pathname, setPathname] = useState<string>('')
  
  useEffect(() => {
    // Only access window after component mounts
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
    }
  }, [])
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-md">
      <h3 className="font-bold mb-2">🔧 Demo Org Debug</h3>
      <div className="space-y-1">
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user?.name || 'None'} ({user?.email || 'No email'})</p>
        <p><strong>Current Org:</strong> {currentOrganization?.name || 'None'}</p>
        <p><strong>Org ID:</strong> {currentOrganization?.id || 'None'}</p>
        <p><strong>Total Orgs:</strong> {organizations.length}</p>
        <p><strong>Pathname:</strong> {pathname || 'Loading...'}</p>
      </div>
    </div>
  )
}