/**
 * OrganizationSwitcher Component
 * Dynamic organization navigation based on user memberships
 * No hardcoded organization list - works with ANY organization user has access to
 */

'use client'

import React from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown } from 'lucide-react'

export function OrganizationSwitcher() {
  const { organizations, organization, switchOrganization, availableApps } = useHERAAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (organizations.length === 0) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        No organizations
      </div>
    )
  }

  // Single organization - just show it
  if (organizations.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Building2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {organization?.name || organizations[0].name}
        </span>
      </div>
    )
  }

  const handleOrganizationSwitch = async (orgId: string) => {
    console.log('🏢 Switching organization:', orgId)

    try {
      // ✅ ENTERPRISE: Await organization switch (fetches role for this org)
      await switchOrganization(orgId)

      // Find the organization
      const org = organizations.find(o => o.id === orgId)
      if (!org) {
        console.error('❌ Organization not found:', orgId)
        return
      }

      // Get apps for this organization
      const orgApps = (org as any)?.apps || []

      // Redirect to appropriate app
      if (orgApps.length > 0) {
        const firstApp = orgApps[0]
        const appPath = `/${firstApp.code.toLowerCase()}/dashboard`
        console.log(`🚀 Redirecting to ${firstApp.name} -> ${appPath}`)
        router.push(appPath)
      } else {
        console.warn('⚠️ Organization has no apps, staying on current page')
        // Could redirect to /auth/organizations or show a message
      }

      setIsOpen(false)
    } catch (error) {
      console.error('❌ Error switching organization:', error)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500"
      >
        <Building2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {organization?.name || 'Select Organization'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2 space-y-1">
            {organizations.map(org => {
              const orgApps = (org as any)?.apps || []
              const isActive = organization?.id === org.id

              return (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationSwitch(org.id)}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {org.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {org.type || 'Organization'}
                      </div>
                      {orgApps.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {orgApps.map((app: any) => (
                            <span
                              key={app.code}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {app.code}
                            </span>
                          ))}
                        </div>
                      )}
                      {orgApps.length === 0 && (
                        <div className="text-xs text-gray-400 italic mt-1">
                          No apps installed
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for mobile/sidebar
 */
export function OrganizationSwitcherCompact() {
  const { organizations, organization, switchOrganization } = useHERAAuth()
  const router = useRouter()

  if (organizations.length === 0) return null

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value
    if (!orgId) return

    console.log('🏢 Switching organization (compact):', orgId)

    // Update context
    switchOrganization(orgId)

    // Find the organization
    const org = organizations.find(o => o.id === orgId)
    if (!org) return

    // Get apps and redirect
    const orgApps = (org as any)?.apps || []
    if (orgApps.length > 0) {
      const firstApp = orgApps[0]
      router.push(`/${firstApp.code.toLowerCase()}/dashboard`)
    }
  }

  return (
    <select
      value={organization?.id || ''}
      onChange={handleChange}
      className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 max-w-[200px] truncate"
    >
      <option value="">Select Organization...</option>
      {organizations.map(org => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  )
}
