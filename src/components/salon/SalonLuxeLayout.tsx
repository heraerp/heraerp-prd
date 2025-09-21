'use client'

import React, { useState } from 'react'
import SalonLuxeSidebar from './SalonLuxeSidebar'
import { cn } from '@/lib/utils'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface SalonLuxeLayoutProps {
  children: React.ReactNode
}

export default function SalonLuxeLayout({ children }: SalonLuxeLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.black }}>
      {/* Sidebar */}
      <SalonLuxeSidebar onNavigate={() => {}} />
      
      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-0'
        )}
        style={{
          backgroundColor: COLORS.charcoal,
          minHeight: '100vh'
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 80% 20%, ${COLORS.gold}05 0%, transparent 50%),
                         radial-gradient(circle at 20% 80%, ${COLORS.bronze}03 0%, transparent 50%)`,
            position: 'fixed',
            zIndex: 0
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}