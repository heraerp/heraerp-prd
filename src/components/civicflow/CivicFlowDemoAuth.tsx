'use client'

import React from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export function CivicFlowDemoAuth() {
  const { isAuthenticated, currentOrganization } = useHERAAuth()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            CivicFlow Authentication
          </h2>
          <p className="text-gray-600">
            Please log in with HERA to access CivicFlow features.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          CivicFlow Dashboard
        </h2>
        <p className="text-gray-600 mb-4">
          Authenticated as organization: {currentOrganization?.organization_name}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">
            CivicFlow features are available here. This component now uses HERA v2.2 authentication.
          </p>
        </div>
      </div>
    </div>
  )
}