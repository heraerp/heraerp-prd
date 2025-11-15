'use client'

import React, { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface DemoBannerProps {
  orgName?: string
  onDismiss?: () => void
}

export function DemoBanner({ orgName = 'CivicFlow Demo Org', onDismiss }: DemoBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-glow text-accent-fg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="text-sm font-medium">
              You're viewing: <span className="font-bold">{orgName}</span>
              <span className="ml-2 opacity-90">
                Demo mode is active - External communications are disabled
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
