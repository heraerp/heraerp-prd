/**
 * Dashboard Loading Skeleton - Instant Navigation
 * Server Component compatible - no client-side features
 */

import { LUXE_COLORS } from '@/lib/constants/salon'

export default function DashboardLoading() {
  const pulseStyle = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Header Skeleton */}
      <div 
        className="sticky top-0 z-30 mb-8"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Org Icon Skeleton */}
              <div 
                className="p-4 rounded-xl"
                style={{ 
                  backgroundColor: `${LUXE_COLORS.gold}20`,
                  ...pulseStyle
                }}
              />
              {/* Title Skeleton */}
              <div>
                <div 
                  className="h-8 w-64 rounded mb-2"
                  style={{ 
                    backgroundColor: `${LUXE_COLORS.gold}30`,
                    ...pulseStyle
                  }}
                />
                <div 
                  className="h-4 w-48 rounded"
                  style={{ 
                    backgroundColor: `${LUXE_COLORS.bronze}30`,
                    ...pulseStyle
                  }}
                />
              </div>
            </div>
            
            {/* User Info Skeleton */}
            <div className="flex items-center gap-4">
              <div 
                className="h-12 w-48 rounded-xl"
                style={{ 
                  backgroundColor: `${LUXE_COLORS.charcoalDark}80`,
                  ...pulseStyle
                }}
              />
              <div 
                className="h-10 w-24 rounded-xl"
                style={{ 
                  backgroundColor: `${LUXE_COLORS.emerald}20`,
                  ...pulseStyle
                }}
              />
              <div 
                className="h-10 w-20 rounded-xl"
                style={{ 
                  backgroundColor: `${LUXE_COLORS.ruby}20`,
                  ...pulseStyle
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div 
        className="sticky top-[120px] z-20 mb-6"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}F0 0%, ${LUXE_COLORS.charcoal}F0 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}15`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ 
                  backgroundColor: `${LUXE_COLORS.gold}20`,
                  ...pulseStyle
                }}
              />
              <div 
                className="h-6 w-32 rounded"
                style={{ 
                  backgroundColor: `${LUXE_COLORS.champagne}30`,
                  ...pulseStyle
                }}
              />
            </div>
            
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="h-10 w-20 rounded-lg"
                  style={{ 
                    backgroundColor: `${LUXE_COLORS.charcoalLight}60`,
                    ...pulseStyle
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="h-32 rounded-2xl"
              style={{ 
                backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
                ...pulseStyle
              }}
            />
          ))}
        </div>

        {/* Large Analytics Panel */}
        <div 
          className="h-64 rounded-2xl"
          style={{ 
            backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
            ...pulseStyle
          }}
        />

        {/* Revenue Trends */}
        <div 
          className="h-64 rounded-2xl"
          style={{ 
            backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
            ...pulseStyle
          }}
        />

        {/* Staff Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div 
              key={i}
              className="h-48 rounded-2xl"
              style={{ 
                backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
                ...pulseStyle
              }}
            />
          ))}
        </div>

        {/* Customer Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="h-40 rounded-2xl"
              style={{ 
                backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
                ...pulseStyle
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}