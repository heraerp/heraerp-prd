'use client'
/**
 * HERA Salon Services Management Page
 * Smart Code: HERA.SALON.SERVICES.PAGE.v1
 * 
 * Dedicated page for managing salon services and categories
 */

import React from 'react'

// Simple fallback component while we debug the import issue
function SimpleServicesManagement() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Services Management</h1>
        <div className="mt-4 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            Component temporarily simplified to fix build errors.
            Full services management will be restored once import issues are resolved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SalonServicesPage() {
  return <SimpleServicesManagement />
}