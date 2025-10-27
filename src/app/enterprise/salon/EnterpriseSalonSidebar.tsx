'use client'

/**
 * Enterprise Salon Sidebar
 * Enterprise-compatible version of salon sidebar
 */

import React from 'react'
import { useSecuredSalonContext } from './EnterpriseSecuredSalonProvider'

export default function EnterpriseSalonSidebar() {
  try {
    const { salonRole, organizationId, isLoading } = useSecuredSalonContext()

    if (isLoading) {
      return (
        <div className="w-20 h-full bg-gray-900 border-r border-gray-800 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )
    }

    // Simple sidebar for enterprise salon
    return (
      <div className="w-20 h-full bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">ES</span>
        </div>
        
        <div className="w-full border-t border-gray-700 my-2"></div>
        
        <div className="text-xs text-gray-400 text-center">
          <div>Enterprise</div>
          <div>Salon</div>
        </div>
      </div>
    )
  } catch (error) {
    // Fallback if context fails
    return null
  }
}