/**
 * HERA v3.0 Organization Selector
 * Multi-tenant organization selection interface
 * 
 * Used when users have multiple organization memberships
 * or when new users need to create/join organizations
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuthV3 } from '@/components/auth/HERAAuthProviderV3'
import { 
  INDUSTRY_CONFIG,
  getIndustryConfig,
  type IndustryType 
} from '@/lib/platform/constants'
import {
  Building2,
  Plus,
  ArrowRight,
  Clock,
  Users,
  CheckCircle,
  Sparkles,
  Truck,
  ChefHat,
  Heart,
  ShoppingBag,
  Hammer
} from 'lucide-react'

interface OrganizationSelectorProps {
  mode?: 'select' | 'create' | 'join'
  onSelect?: (orgId: string) => void
  onCreateNew?: () => void
}

const INDUSTRY_ICONS = {
  waste_management: Truck,
  salon_beauty: Sparkles,
  restaurant: ChefHat,
  healthcare: Heart,
  retail: ShoppingBag,
  construction: Hammer,
  generic_business: Building2
}

export function OrganizationSelector({ 
  mode = 'select',
  onSelect,
  onCreateNew 
}: OrganizationSelectorProps) {
  const router = useRouter()
  const { 
    user, 
    availableOrganizations, 
    selectOrganization,
    status,
    isLoading 
  } = useHERAAuthV3()

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  // Auto-select if only one organization
  useEffect(() => {
    if (availableOrganizations.length === 1 && mode === 'select') {
      const org = availableOrganizations[0]
      setSelectedOrgId(org.id)
      handleSelectOrganization(org.id)
    }
  }, [availableOrganizations, mode])

  const handleSelectOrganization = async (orgId: string) => {
    if (isSelecting) return
    
    setIsSelecting(true)
    try {
      if (onSelect) {
        onSelect(orgId)
      } else {
        await selectOrganization(orgId)
      }
    } catch (error) {
      console.error('Failed to select organization:', error)
    } finally {
      setIsSelecting(false)
    }
  }

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew()
    } else {
      router.push('/setup/organization')
    }
  }

  if (isLoading || status === 'resolving') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Organizations
          </h3>
          <p className="text-gray-600">
            Setting up your workspace...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
              <p className="text-blue-100">Select an organization to continue</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Organization List */}
          {availableOrganizations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Organizations
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableOrganizations.map((org) => {
                  const industryConfig = getIndustryConfig(org.industry)
                  const IconComponent = INDUSTRY_ICONS[org.industry] || Building2
                  const isSelected = selectedOrgId === org.id
                  
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        setSelectedOrgId(org.id)
                        handleSelectOrganization(org.id)
                      }}
                      disabled={isSelecting}
                      className={`
                        relative p-6 rounded-xl border-2 text-left transition-all duration-200 group
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-102'
                        }
                        ${isSelecting ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                      `}
                      style={{
                        '--primary-color': industryConfig.primaryColor
                      } as React.CSSProperties}
                    >
                      {/* Organization Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: industryConfig.primaryColor }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>

                      {/* Organization Info */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {org.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {industryConfig.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-1 text-xs font-medium rounded-full text-white"
                            style={{ backgroundColor: industryConfig.primaryColor }}
                          >
                            {industryConfig.name}
                          </span>
                        </div>
                      </div>

                      {/* Organization Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Recently used</span>
                        </div>
                      </div>

                      {/* Loading State */}
                      {isSelecting && selectedOrgId === org.id && (
                        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="text-sm font-medium text-blue-600">
                              Switching...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Hover Arrow */}
                      <ArrowRight className={`
                        absolute top-6 right-6 w-5 h-5 text-gray-400 transition-all duration-200
                        ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}
                      `} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Create New Organization */}
          <div className="pt-6 border-t border-gray-200">
            <div className="text-center">
              <button
                onClick={handleCreateNew}
                disabled={isSelecting}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Create New Organization</div>
                  <div className="text-sm opacity-90">Set up a new workspace</div>
                </div>
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Need to join an existing organization? Contact your administrator.
            </p>
          </div>

          {/* No Organizations State */}
          {availableOrganizations.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Organizations Found
              </h3>
              <p className="text-gray-600 mb-6">
                You don't have access to any organizations yet. Create your first one to get started.
              </p>
              
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Organization
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Organization Card Component for reuse
 */
interface OrganizationCardProps {
  organization: any
  isSelected?: boolean
  isLoading?: boolean
  onClick: () => void
  disabled?: boolean
}

export function OrganizationCard({
  organization: org,
  isSelected = false,
  isLoading = false,
  onClick,
  disabled = false
}: OrganizationCardProps) {
  const industryConfig = getIndustryConfig(org.industry)
  const IconComponent = INDUSTRY_ICONS[org.industry] || Building2

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative p-4 rounded-lg border text-left transition-all duration-200 w-full
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: industryConfig.primaryColor }}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {org.name}
          </h3>
          <p className="text-sm text-gray-500">
            {industryConfig.name}
          </p>
        </div>

        {isSelected && (
          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
        )}
        
        {isLoading && (
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0"></div>
        )}
      </div>
    </button>
  )
}