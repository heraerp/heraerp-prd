/**
 * Services Loading Skeleton
 */

import { LUXE_COLORS } from '@/lib/constants/salon'

export default function ServicesLoading() {
  const pulseStyle = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }
  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div 
            className="h-8 w-40 rounded "
            style={{ backgroundColor: `${LUXE_COLORS.gold}30`, ...pulseStyle }}
          />
          <div 
            className="h-10 w-32 rounded-lg "
            style={{ backgroundColor: `${LUXE_COLORS.emerald}20`, ...pulseStyle }}
          />
        </div>

        {/* Categories Filter */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="h-8 w-20 rounded-full  flex-shrink-0"
              style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}60`, ...pulseStyle }}
            />
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="h-56 rounded-2xl "
              style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80`, ...pulseStyle }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}