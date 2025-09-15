'use client'

import React from 'react'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rectangle'
  lines?: number
}

export function LoadingSkeleton({
  className = '',
  variant = 'rectangle',
  lines = 1
}: LoadingSkeletonProps) {
  const baseClasses =
    'animate-pulse bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 bg-[length:200%_100%] animate-[shimmer_2s_infinite]'

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 ${baseClasses} rounded ${className} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    )
  }

  if (variant === 'circle') {
    return <div className={`rounded-full ${baseClasses} ${className}`} />
  }

  return <div className={`${baseClasses} rounded ${className}`} />
}

// App Card Skeleton for loading states
export function AppCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <LoadingSkeleton variant="circle" className="w-14 h-14" />
        <div className="space-y-2">
          <LoadingSkeleton className="w-20 h-6" />
          <LoadingSkeleton className="w-16 h-4" />
        </div>
      </div>

      <div className="space-y-2">
        <LoadingSkeleton className="w-3/4 h-5" />
        <LoadingSkeleton variant="text" lines={2} />
      </div>

      <LoadingSkeleton className="w-full h-20" />

      <div className="grid grid-cols-3 gap-2">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-16" />
      </div>

      <div className="flex gap-2">
        <LoadingSkeleton className="flex-1 h-10" />
        <LoadingSkeleton className="w-10 h-10" />
      </div>
    </div>
  )
}
