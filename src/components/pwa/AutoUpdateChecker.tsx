'use client'

import { useEffect, useState, useCallback } from 'react'
import { APP_VERSION } from '@/lib/constants/version'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshCw, AlertCircle } from 'lucide-react'

export function AutoUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const currentVersion = APP_VERSION.build

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return
    
    setIsChecking(true)
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.version !== currentVersion) {
          console.log(`Update available: ${currentVersion} -> ${data.version}`)
          setUpdateAvailable(true)
          
          // Try to update service worker
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
          }
        }
      }
    } catch (error) {
      console.error('Version check failed:', error)
    } finally {
      setIsChecking(false)
    }
  }, [currentVersion, isChecking])

  const handleUpdate = useCallback(() => {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }

    // Unregister service worker to force fresh install
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister())
      })
    }

    // Force reload with cache bypass
    window.location.reload()
  }, [])

  useEffect(() => {
    // Initial check
    checkForUpdates()

    // Check every 30 seconds
    const interval = setInterval(checkForUpdates, 30000)

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setUpdateAvailable(true)
        }
      })

      // Check for waiting service worker
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setUpdateAvailable(true)
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })
      })
    }

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkForUpdates])

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">
          Update Available
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          A new version of HERA is available. Update now to get the latest features and improvements.
        </AlertDescription>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Now
          </Button>
          <Button
            onClick={() => setUpdateAvailable(false)}
            size="sm"
            variant="outline"
          >
            Later
          </Button>
        </div>
      </Alert>
    </div>
  )
}