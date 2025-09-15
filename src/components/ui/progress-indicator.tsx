'use client'

import React from 'react'

interface ProgressIndicatorProps {
  message?: string
  className?: string
}

export function ProgressIndicator({
  message = 'Loading progressive apps...',
  className = ''
}: ProgressIndicatorProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      {/* Animated Progress Bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full animate-pulse bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
      </div>

      {/* Loading Dots */}
      <div className="flex space-x-2 mb-4">
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
      </div>

      {/* Message */}
      <p className="text-muted-foreground font-medium text-center">{message}</p>

      {/* Optional subtext */}
      <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
        Setting up your enterprise application showcase...
      </p>
    </div>
  )
}

// Minimal loading indicator for smaller spaces
export function MiniLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}
