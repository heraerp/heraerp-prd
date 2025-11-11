'use client'

import React, { useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Building2, ChevronDown, Check, Users } from 'lucide-react'

interface OrganizationSelectorProps {
  className?: string
  showFullName?: boolean
  showId?: boolean
}

export function OrganizationSelector({ 
  className = '', 
  showFullName = true, 
  showId = true 
}: OrganizationSelectorProps) {
  const { user, organization, organizations = [] } = useHERAAuth()
  const [isOpen, setIsOpen] = useState(false)

  // If there's only one organization or no organizations, show as info display
  if (!organizations || organizations.length <= 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200 ${className}`}>
        <Building2 size={14} className="text-blue-600" />
        {organization && (
          <>
            {showFullName && (
              <span className="text-xs font-medium text-blue-700">{organization.name}</span>
            )}
            {showId && (
              <span className="text-xs text-blue-500">({organization.id.slice(-8)})</span>
            )}
          </>
        )}
        {!organization && (
          <span className="text-xs text-blue-600">No organization selected</span>
        )}
      </div>
    )
  }

  // Multiple organizations - show selector
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-200 transition-colors"
      >
        <Building2 size={14} className="text-blue-600" />
        {organization && (
          <>
            {showFullName && (
              <span className="text-xs font-medium text-blue-700">{organization.name}</span>
            )}
            {showId && (
              <span className="text-xs text-blue-500">({organization.id.slice(-8)})</span>
            )}
          </>
        )}
        <ChevronDown size={12} className={`text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-2 py-1 border-b border-gray-100 mb-1">
                Select Organization
              </div>
              
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    // TODO: Implement organization switching
                    console.log('Switch to organization:', org.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-2 py-2 text-left rounded-md transition-colors ${
                    organization?.id === org.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{org.name}</span>
                      {organization?.id === org.id && (
                        <Check size={14} className="text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">ID: {org.id.slice(-8)}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* User info footer */}
            {user && (
              <div className="border-t border-gray-100 p-2">
                <div className="flex items-center gap-2 px-2 py-1">
                  <Users size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Logged in as {user.email}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default OrganizationSelector