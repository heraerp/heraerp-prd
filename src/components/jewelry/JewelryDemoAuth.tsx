'use client'

import React from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export function JewelryDemoAuth() {
  const { isAuthenticated, currentOrganization } = useHERAAuth()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Jewelry Demo Authentication
          </h2>
          <p className="text-gray-600">
            Please log in with HERA to access Jewelry demo features.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Jewelry Demo Dashboard
        </h2>
        <p className="text-gray-600 mb-4">
          Authenticated as organization: {currentOrganization?.organization_name}
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">
            Jewelry demo features are available here. This component now uses HERA v2.2 authentication.
          </p>
        </div>
      </div>
    </div>
  )
}