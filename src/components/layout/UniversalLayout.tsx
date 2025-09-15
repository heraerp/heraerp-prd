'use client'

import React from 'react'
import { UniversalSidebar, SidebarItem, QuickAction } from './UniversalSidebar'
import { LucideIcon } from 'lucide-react'

interface UniversalLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  icon: LucideIcon
  sidebarItems: SidebarItem[]
  quickActions?: QuickAction[]
  brandGradient?: string
  accentGradient?: string
  backgroundGradient?: string
  baseUrl?: string
}

export function UniversalLayout({
  children,
  title,
  subtitle,
  icon,
  sidebarItems,
  quickActions,
  brandGradient = 'from-pink-400 to-purple-600',
  accentGradient = 'from-pink-50/90 to-purple-50/90',
  backgroundGradient = 'from-pink-50 via-purple-50 to-white',
  baseUrl
}: UniversalLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundGradient} relative`}>
      <UniversalSidebar
        title={title}
        subtitle={subtitle}
        icon={icon}
        sidebarItems={sidebarItems}
        quickActions={quickActions}
        brandGradient={brandGradient}
        accentGradient={accentGradient}
        baseUrl={baseUrl}
      />

      {/* Main Content Area */}
      <div className="ml-16 min-h-screen relative">
        <main className="relative">{children}</main>
      </div>
    </div>
  )
}
