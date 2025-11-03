/**
 * HERA v3.0 Organization Switcher
 * In-app dropdown for switching between organizations
 * 
 * Used in the main navigation header for users with multiple organization memberships
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuthV3 } from '@/components/auth/HERAAuthProviderV3'
import { 
  getIndustryConfig,
  type IndustryType 
} from '@/lib/platform/constants'
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Settings,
  ExternalLink,
  Sparkles,
  Truck,
  ChefHat,
  Heart,
  ShoppingBag,
  Hammer,
  LogOut
} from 'lucide-react'

const INDUSTRY_ICONS = {
  waste_management: Truck,
  salon_beauty: Sparkles,
  restaurant: ChefHat,
  healthcare: Heart,
  retail: ShoppingBag,
  construction: Hammer,
  generic_business: Building2
}

interface OrganizationSwitcherProps {
  className?: string
  showCreateNew?: boolean
  showSettings?: boolean
}

export function OrganizationSwitcher({ 
  className = '',
  showCreateNew = true,
  showSettings = true
}: OrganizationSwitcherProps) {
  const router = useRouter()
  const { 
    organization, 
    availableOrganizations, 
    switchOrganization,
    currentMembership,
    logout
  } = useHERAAuthV3()

  const [isOpen, setIsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSwitchOrganization = async (orgId: string) => {
    if (isSwitching || orgId === organization?.id) return

    setIsSwitching(true)
    setSwitchingOrgId(orgId)
    
    try {
      const success = await switchOrganization(orgId)
      if (success) {
        setIsOpen(false)
        // Optionally refresh the page to apply new organization context
        window.location.reload()
      } else {
        console.error('Failed to switch organization')
      }
    } catch (error) {
      console.error('Error switching organization:', error)
    } finally {
      setIsSwitching(false)
      setSwitchingOrgId(null)
    }
  }

  const handleCreateNew = () => {
    setIsOpen(false)
    router.push('/setup/organization')
  }

  const handleSettings = () => {
    setIsOpen(false)
    router.push('/settings/organization')
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
  }

  if (!organization) {
    return null
  }

  const industryConfig = getIndustryConfig(organization.industry)
  const IconComponent = INDUSTRY_ICONS[organization.industry] || Building2

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        disabled={isSwitching}
      >
        {/* Organization Icon */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: industryConfig.primaryColor }}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Organization Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {organization.name}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {industryConfig.name}
            {currentMembership && (
              <span className="ml-1 capitalize">• {currentMembership.role}</span>
            )}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`
          w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0
          ${isOpen ? 'transform rotate-180' : ''}
          ${isSwitching ? 'animate-spin' : ''}
        `} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 min-w-80">
          {/* Current Organization Header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Current Organization
            </div>
          </div>

          {/* Current Organization */}
          <div className="px-4 py-3 bg-blue-50">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: industryConfig.primaryColor }}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{organization.name}</div>
                <div className="text-sm text-gray-600">{industryConfig.name}</div>
              </div>
              <Check className="w-4 h-4 text-blue-500" />
            </div>
          </div>

          {/* Other Organizations */}
          {availableOrganizations.length > 1 && (
            <>
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Switch To
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {availableOrganizations
                  .filter(org => org.id !== organization.id)
                  .map((org) => {
                    const orgIndustryConfig = getIndustryConfig(org.industry)
                    const OrgIconComponent = INDUSTRY_ICONS[org.industry] || Building2
                    const isCurrentlySwitching = switchingOrgId === org.id

                    return (
                      <button
                        key={org.id}
                        onClick={() => handleSwitchOrganization(org.id)}
                        disabled={isSwitching}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: orgIndustryConfig.primaryColor }}
                        >
                          <OrgIconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-600">{orgIndustryConfig.name}</div>
                        </div>
                        {isCurrentlySwitching && (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        )}
                      </button>
                    )
                  })}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="border-t border-gray-100 mt-2">
            {showCreateNew && (
              <button
                onClick={handleCreateNew}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Create New Organization</div>
                  <div className="text-sm text-gray-600">Set up a new workspace</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {showSettings && (
              <button
                onClick={handleSettings}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Organization Settings</div>
                  <div className="text-sm text-gray-600">Manage this workspace</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-left transition-colors"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-red-900">Sign Out</div>
                <div className="text-sm text-red-600">End your session</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact Organization Switcher for mobile or tight spaces
 */
export function CompactOrganizationSwitcher({ className = '' }: { className?: string }) {
  const { organization, availableOrganizations } = useHERAAuthV3()
  const [isOpen, setIsOpen] = useState(false)

  if (!organization) return null

  const industryConfig = getIndustryConfig(organization.industry)
  const IconComponent = INDUSTRY_ICONS[organization.industry] || Building2

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div 
          className="w-6 h-6 rounded flex items-center justify-center text-white"
          style={{ backgroundColor: industryConfig.primaryColor }}
        >
          <IconComponent className="w-3 h-3" />
        </div>
        <span className="font-medium text-sm truncate max-w-32">
          {organization.name}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-48">
          {availableOrganizations.map((org) => {
            const orgIndustryConfig = getIndustryConfig(org.industry)
            const OrgIconComponent = INDUSTRY_ICONS[org.industry] || Building2
            const isActive = org.id === organization.id

            return (
              <button
                key={org.id}
                className={`
                  w-full px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors text-sm
                  ${isActive ? 'bg-blue-50' : ''}
                `}
              >
                <div 
                  className="w-5 h-5 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: orgIndustryConfig.primaryColor }}
                >
                  <OrgIconComponent className="w-3 h-3" />
                </div>
                <span className="truncate">{org.name}</span>
                {isActive && <Check className="w-3 h-3 text-blue-500 ml-auto" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}