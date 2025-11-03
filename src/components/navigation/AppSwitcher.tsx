/**
 * AppSwitcher Component
 * Dynamic app navigation based on installed apps from database
 * No hardcoded app list - works with ANY app registered in HERA
 */

'use client'

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useRouter } from 'next/navigation'

export function AppSwitcher() {
  const { availableApps, currentApp } = useHERAAuth()
  const router = useRouter()

  if (availableApps.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No apps installed
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {availableApps.map(app => (
        <button
          key={app.code}
          onClick={() => {
            const appPath = `/${app.code.toLowerCase()}/dashboard`
            console.log(`🚀 Switching to ${app.name} (${app.code}) -> ${appPath}`)
            router.push(appPath)
          }}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${
              currentApp === app.code
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-sm'
            }
          `}
        >
          {app.name}
        </button>
      ))}
    </div>
  )
}

/**
 * Compact version for mobile/sidebar
 */
export function AppSwitcherCompact() {
  const { availableApps, currentApp } = useHERAAuth()
  const router = useRouter()

  if (availableApps.length === 0) return null

  return (
    <select
      value={currentApp || ''}
      onChange={(e) => {
        if (e.target.value) {
          router.push(`/${e.target.value.toLowerCase()}/dashboard`)
        }
      }}
      className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select App...</option>
      {availableApps.map(app => (
        <option key={app.code} value={app.code}>
          {app.name}
        </option>
      ))}
    </select>
  )
}
