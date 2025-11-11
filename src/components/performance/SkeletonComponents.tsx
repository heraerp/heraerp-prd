/**
 * Enterprise Skeleton Components
 * Smart Code: HERA.PERFORMANCE.SKELETON.COMPONENTS.v1
 * 
 * Lightning-fast loading states that beat SAP's perceived performance
 */

'use client'

import React from 'react'

// Base skeleton animation classes
const skeletonBase = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded"

/**
 * SAP-style header skeleton
 */
export function HeaderSkeleton() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`${skeletonBase} h-6 w-12`} />
            <div className="flex items-center gap-4">
              <div className={`${skeletonBase} h-4 w-8`} />
              <div className={`${skeletonBase} h-4 w-24`} />
              <div className={`${skeletonBase} h-4 w-32`} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`${skeletonBase} h-8 w-24`} />
            <div className={`${skeletonBase} h-8 w-48`} />
            <div className={`${skeletonBase} h-6 w-6 rounded-full`} />
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Navigation breadcrumb skeleton
 */
export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`${skeletonBase} h-4 w-16`} />
      <div className="text-gray-400">→</div>
      <div className={`${skeletonBase} h-4 w-20`} />
      <div className="text-gray-400">→</div>
      <div className={`${skeletonBase} h-4 w-24`} />
    </div>
  )
}

/**
 * Universal tile grid skeleton for retail pages
 */
export function TileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${skeletonBase} h-32 rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`${skeletonBase} h-6 w-6 rounded-lg`} />
            <div className={`${skeletonBase} h-4 w-4`} />
          </div>
          <div className={`${skeletonBase} h-5 w-24 mb-2`} />
          <div className={`${skeletonBase} h-3 w-32`} />
        </div>
      ))}
    </div>
  )
}

/**
 * Three-column layout skeleton (News | Tiles | Assistant)
 */
export function ThreeColumnLayoutSkeleton() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column - News Skeleton */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`${skeletonBase} h-6 w-16`} />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg">
                <div className={`${skeletonBase} h-32 rounded-t-lg`} />
                <div className="p-4 space-y-2">
                  <div className={`${skeletonBase} h-4 w-full`} />
                  <div className={`${skeletonBase} h-3 w-3/4`} />
                  <div className={`${skeletonBase} h-3 w-16`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Header */}
          <div className="space-y-2">
            <div className={`${skeletonBase} h-6 w-48`} />
            <TileGridSkeleton count={6} />
          </div>

          {/* Apps Section */}
          <div className="space-y-4">
            <div className={`${skeletonBase} h-6 w-16`} />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div className={`${skeletonBase} h-16 rounded p-3`}>
                    <div className="flex items-center space-x-3">
                      <div className={`${skeletonBase} h-8 w-8 rounded`} />
                      <div className="space-y-1">
                        <div className={`${skeletonBase} h-3 w-20`} />
                        <div className={`${skeletonBase} h-2 w-24`} />
                      </div>
                    </div>
                  </div>
                  <div className={`${skeletonBase} h-16 rounded p-3`}>
                    <div className="flex items-center space-x-3">
                      <div className={`${skeletonBase} h-8 w-8 rounded`} />
                      <div className="space-y-1">
                        <div className={`${skeletonBase} h-3 w-20`} />
                        <div className={`${skeletonBase} h-2 w-24`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights Tiles */}
          <div className="space-y-4">
            <div className={`${skeletonBase} h-6 w-24`} />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`border rounded p-4 space-y-3`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className={`${skeletonBase} h-4 w-20`} />
                      <div className={`${skeletonBase} h-3 w-16`} />
                    </div>
                    <div className={`${skeletonBase} h-4 w-4`} />
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <div className={`${skeletonBase} h-8 w-12`} />
                    <div className={`${skeletonBase} h-4 w-6`} />
                  </div>
                  <div className={`${skeletonBase} h-3 w-24`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Assistant Skeleton */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="border rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`${skeletonBase} h-8 w-8 rounded-lg`} />
                <div className="space-y-1">
                  <div className={`${skeletonBase} h-5 w-24`} />
                  <div className={`${skeletonBase} h-3 w-12`} />
                </div>
              </div>
              
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className={`${skeletonBase} h-4 w-20`} />
                    <div className={`${skeletonBase} h-3 w-full`} />
                    <div className={`${skeletonBase} h-3 w-3/4`} />
                  </div>
                ))}
              </div>

              <div className={`${skeletonBase} h-10 w-full rounded`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * SAP-style workspace skeleton
 */
export function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderSkeleton />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar Skeleton */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`${skeletonBase} w-10 h-10 rounded-lg`} />
              <div className="space-y-2">
                <div className={`${skeletonBase} h-4 w-24`} />
                <div className={`${skeletonBase} h-3 w-20`} />
              </div>
            </div>
          </div>

          <div className="p-2 space-y-4">
            <div className="space-y-1">
              <div className={`${skeletonBase} h-8 w-full rounded`} />
            </div>

            <nav className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`${skeletonBase} h-8 w-full rounded`} />
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Content Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center space-y-1">
                      <div className={`${skeletonBase} h-6 w-12`} />
                      <div className={`${skeletonBase} h-3 w-16`} />
                    </div>
                  ))}
                </div>
                <div className={`${skeletonBase} h-3 w-24`} />
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className={`${skeletonBase} h-6 w-32`} />
                  <div className={`${skeletonBase} h-4 w-48`} />
                </div>
                <div className="flex items-center gap-4">
                  <div className={`${skeletonBase} h-10 w-48`} />
                  <div className={`${skeletonBase} h-10 w-24`} />
                  <div className={`${skeletonBase} h-10 w-32`} />
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`${skeletonBase} h-56 rounded-lg`}>
                  <div className="p-6 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`${skeletonBase} w-12 h-12 rounded-lg`} />
                        <div className={`${skeletonBase} h-5 w-16 rounded`} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`${skeletonBase} h-5 w-3/4`} />
                        <div className={`${skeletonBase} h-4 w-full`} />
                      </div>

                      <div className="rounded-lg p-3 space-y-2 border">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className={`${skeletonBase} h-6 w-16`} />
                            <div className={`${skeletonBase} h-3 w-20`} />
                          </div>
                          <div className={`${skeletonBase} h-4 w-8`} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`${skeletonBase} h-3 w-24`} />
                      <div className={`${skeletonBase} h-5 w-12 rounded`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Progressive skeleton that adapts to content
 */
interface ProgressiveSkeletonProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
}

export function ProgressiveSkeleton({ 
  isLoading, 
  children, 
  skeleton 
}: ProgressiveSkeletonProps) {
  return (
    <div className="relative">
      {isLoading && (
        <div className="animate-in fade-in duration-300">
          {skeleton || <ThreeColumnLayoutSkeleton />}
        </div>
      )}
      
      <div className={`${isLoading ? 'opacity-0 absolute inset-0' : 'animate-in fade-in duration-500'}`}>
        {children}
      </div>
    </div>
  )
}

/**
 * Micro-interaction skeleton for individual cards
 */
export function CardSkeleton({ width = 'w-full', height = 'h-56' }: { width?: string; height?: string }) {
  return (
    <div className={`${skeletonBase} ${width} ${height} rounded-lg animate-pulse`}>
      <div className="p-6 h-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className={`${skeletonBase} w-12 h-12 rounded-lg bg-gray-300`} />
            <div className={`${skeletonBase} h-5 w-16 rounded bg-gray-300`} />
          </div>
          
          <div className="space-y-2">
            <div className={`${skeletonBase} h-5 w-3/4 bg-gray-300`} />
            <div className={`${skeletonBase} h-4 w-full bg-gray-300`} />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className={`${skeletonBase} h-3 w-24 bg-gray-300`} />
          <div className={`${skeletonBase} h-5 w-12 rounded bg-gray-300`} />
        </div>
      </div>
    </div>
  )
}

/**
 * Instant loading overlay for route transitions
 */
export function RouteTransitionSkeleton() {
  return (
    <div className="fixed inset-0 bg-white z-40 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <div className={`${skeletonBase} h-4 w-32 mx-auto`} />
        <div className="text-xs text-gray-500">Loading with lightning speed...</div>
      </div>
    </div>
  )
}