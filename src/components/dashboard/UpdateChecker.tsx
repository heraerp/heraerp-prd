'use client'

import React, { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_VERSION } from '@/lib/constants/version'

export function UpdateChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkForUpdates = async () => {
    setIsChecking(true)
    try {
      // Check version API
      const response = await fetch('/api/v1/version', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const serverVersion = data.version
        const currentVersion = APP_VERSION.current

        if (serverVersion !== currentVersion) {
          setUpdateAvailable(true)
          // Clear all caches to ensure fresh content
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))
          }
        } else {
          setUpdateAvailable(false)
        }
      }
    } catch (error) {
      console.error('Update check failed:', error)
    } finally {
      setIsChecking(false)
      setLastCheck(new Date())
    }
  }

  const handleUpdate = () => {
    // Force hard reload with cache bypass
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={checkForUpdates}
        disabled={isChecking}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        Check for Updates
      </Button>

      {lastCheck && (
        <span className="text-xs text-muted-foreground">
          Last checked: {lastCheck.toLocaleTimeString()}
        </span>
      )}

      {updateAvailable && (
        <Button
          size="sm"
          onClick={handleUpdate}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse"
        >
          Update Available - Click to Refresh
        </Button>
      )}
    </div>
  )
}
