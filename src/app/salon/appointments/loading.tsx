/**
 * Appointments Loading Skeleton
 */

import { LUXE_COLORS } from '@/lib/constants/salon'

export default function AppointmentsLoading() {
  const pulseStyle = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }
  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div 
            className="h-8 w-48 rounded"
            style={{ backgroundColor: `${LUXE_COLORS.gold}30`, ...pulseStyle }}
          />
          <div 
            className="h-10 w-32 rounded-lg"
            style={{ backgroundColor: `${LUXE_COLORS.emerald}20`, ...pulseStyle }}
          />
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-4 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="h-10 w-24 rounded-lg"
              style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}60`, ...pulseStyle }}
            />
          ))}
        </div>

        {/* Appointments Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i}
              className="h-48 rounded-2xl"
              style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80`, ...pulseStyle }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}