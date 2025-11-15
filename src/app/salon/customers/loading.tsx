import React from 'react'
/**
 * Customers Loading Skeleton
 */

import { LUXE_COLORS } from '@/lib/constants/salon'

export default function CustomersLoading() {
  const pulseStyle = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }
  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header with search */}
        <div className="flex items-center justify-between gap-4">
          <div 
            className="h-8 w-40 rounded"
            style={{ backgroundColor: `${LUXE_COLORS.gold}30`, ...pulseStyle }}
          />
          <div className="flex gap-3">
            <div 
              className="h-10 w-64 rounded-lg "
              style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}60`, ...pulseStyle }}
            />
            <div 
              className="h-10 w-32 rounded-lg "
              style={{ backgroundColor: `${LUXE_COLORS.emerald}20`, ...pulseStyle }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="h-24 rounded-xl "
              style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80`, ...pulseStyle }}
            />
          ))}
        </div>

        {/* Table Skeleton */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}60`, ...pulseStyle }}
        >
          {/* Table Header */}
          <div className="p-4 border-b" style={{ borderColor: `${LUXE_COLORS.bronze}20` }}>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="h-4 rounded "
                  style={{ backgroundColor: `${LUXE_COLORS.bronze}30`, ...pulseStyle }}
                />
              ))}
            </div>
          </div>
          
          {/* Table Rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 border-b" style={{ borderColor: `${LUXE_COLORS.bronze}10` }}>
              <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, j) => (
                  <div 
                    key={j}
                    className="h-4 rounded "
                    style={{ backgroundColor: `${LUXE_COLORS.champagne}20`, ...pulseStyle }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}