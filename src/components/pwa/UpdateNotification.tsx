'use client'

import React, { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { APP_VERSION } from '@/lib/constants/version'
import { useServiceWorker } from './ServiceWorkerProvider'

export function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker()
  const [showNotification, setShowNotification] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date())

  // Check for version updates via API
  const checkForUpdates = async () => {
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
        const serverVersion = data.version
        const currentVersion = APP_VERSION.current
        
        console.log(`[Update Check] Current: ${currentVersion}, Server: ${serverVersion}`)
        
        if (serverVersion !== currentVersion) {
          setShowNotification(true)
          
          // Also trigger service worker update
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' })
          }
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

    // Check every 30 seconds
    const interval = setInterval(checkForUpdates, 30 * 1000)

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

  const handleUpdate = () => {
    if (isUpdateAvailable) {
      // Use service worker update if available
      updateServiceWorker()
    } else {
      // Force reload with cache bypass
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        }).then(() => {
          window.location.reload()
        })
      } else {
        window.location.reload()
      }
    }
  }

  // Show notification if either condition is true
  const shouldShowNotification = isUpdateAvailable || showNotification

  if (!shouldShowNotification) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-2xl p-4 z-50 animate-pulse">
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
            Current: v{APP_VERSION.current} • Last check: {lastCheckTime.toLocaleTimeString()}
          </p>
          <div className="mt-3 flex items-center space-x-3">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors shadow-md"
            >
              Update Now
            </button>
            <button
              onClick={() => {
                setShowNotification(false)
                // Re-check in 5 minutes
                setTimeout(checkForUpdates, 5 * 60 * 1000)
              }}
              className="text-sm font-medium text-white hover:text-blue-100 transition-colors"
            >
              Remind Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="ml-2 text-white hover:text-blue-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}