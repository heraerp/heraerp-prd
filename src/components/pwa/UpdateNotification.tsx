'use client'

import React, { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { APP_VERSION } from '@/lib/constants/version'
import { useServiceWorker } from './ServiceWorkerProvider'

// Helper function to compare version strings
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }
  
  return 0
}

export function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker()
  const [showNotification, setShowNotification] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date())
  const [serverVersion, setServerVersion] = useState<string | null>(null)

  // Check for version updates via API
  const checkForUpdates = async () => {
    // Don't check if we're already checking
    if (isChecking) return
    
    setIsChecking(true)
    try {
      const response = await fetch('/api/v1/version', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const newServerVersion = data.version
        const currentVersion = APP_VERSION.current
        
        console.log(`[Update Check] Current: ${currentVersion}, Server: ${newServerVersion}`)
        
        // Get dismissed version from localStorage
        const dismissedVersion = localStorage.getItem('hera-dismissed-version')
        
        // Compare versions properly
        const isNewerVersion = compareVersions(newServerVersion, currentVersion) > 0
        
        // Only show notification if:
        // 1. Server version is newer than current version
        // 2. Server version hasn't been dismissed already
        // 3. We haven't already shown notification for this version
        if (isNewerVersion && 
            newServerVersion !== dismissedVersion &&
            newServerVersion !== serverVersion) {
          setServerVersion(newServerVersion)
          setShowNotification(true)
          
          // Also trigger service worker update
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' })
          }
        } else {
          // If versions match or current is newer, hide notification
          setShowNotification(false)
        }
      }
    } catch (error) {
      console.error('[Update Check] Failed:', error)
    } finally {
      setIsChecking(false)
      setLastCheckTime(new Date())
    }
  }

  useEffect(() => {
    // Check immediately on mount
    checkForUpdates()

    // Check every 2 minutes (was 30 seconds)
    const interval = setInterval(checkForUpdates, 2 * 60 * 1000)

    // Check when window regains focus
    const handleFocus = () => checkForUpdates()
    window.addEventListener('focus', handleFocus)

    // Check when document becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleUpdate = async () => {
    try {
      // Show updating status
      setShowNotification(false)
      
      // Clear all caches first
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        console.log('[Update] Cleared all caches')
      }
      
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
        console.log('[Update] Unregistered all service workers')
      }
      
      // Clear session storage
      sessionStorage.clear()
      
      // Clear local storage version info
      localStorage.removeItem('hera-version')
      localStorage.removeItem('last-update-check')
      localStorage.removeItem('hera-dismissed-version')
      
      // Force hard reload with timestamp to bypass any remaining cache
      const timestamp = new Date().getTime()
      window.location.href = `${window.location.origin}${window.location.pathname}?v=${timestamp}`
    } catch (error) {
      console.error('[Update] Error during update:', error)
      // Fallback to simple reload
      window.location.reload()
    }
  }

  // Show notification if either condition is true
  const shouldShowNotification = isUpdateAvailable || showNotification

  // No auto-dismiss - let user decide when to update or dismiss
  
  if (!shouldShowNotification) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-2xl p-4 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <RefreshCw className={`h-6 w-6 text-white ${isChecking ? 'animate-spin' : ''}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-white">
            New Update Available!
          </h3>
          <p className="mt-1 text-sm text-blue-100">
            A new version of HERA has been released with exciting features and improvements.
          </p>
          <p className="mt-1 text-xs text-blue-200">
            Current: v{APP_VERSION.current} {serverVersion && `• New: v${serverVersion}`}
          </p>
          <div className="mt-3 flex items-center space-x-3">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors shadow-md"
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Update Now'}
            </button>
            <button
              onClick={() => {
                setShowNotification(false)
                // Store dismissed version
                if (serverVersion) {
                  localStorage.setItem('hera-dismissed-version', serverVersion)
                }
              }}
              className="text-sm font-medium text-white hover:text-blue-100 transition-colors"
            >
              Remind Later
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setShowNotification(false)
            // Store dismissed version
            if (serverVersion) {
              localStorage.setItem('hera-dismissed-version', serverVersion)
            }
          }}
          className="ml-2 text-white hover:text-blue-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}