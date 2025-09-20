// ================================================================================
// HERA UNIVERSAL PAGE LAYOUT
// Smart Code: HERA.UI.COMPONENTS.PAGE_LAYOUT.v1
// Consistent page layout with luxury theme
// ================================================================================

'use client'

import React from 'react'
import { LUXURY_COLORS } from '@/lib/theme/luxuryTheme'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXURY_COLORS.black }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Subtle gradient overlay for depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, ${LUXURY_COLORS.gold}08 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${LUXURY_COLORS.bronze}05 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, ${LUXURY_COLORS.plum}03 0%, transparent 50%)
            `
          }} 
        />
        
        {/* Content container */}
        <div 
          className={`container mx-auto px-6 py-8 relative ${className}`}
          style={{ 
            backgroundColor: LUXURY_COLORS.charcoal,
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// Export a simple page wrapper that combines layout and header
export function PageWrapper({
  children,
  title,
  breadcrumbs,
  actions,
  className = ''
}: {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string; isActive?: boolean }>
  actions?: React.ReactNode
  className?: string
}) {
  // Dynamically import to avoid circular dependencies
  const [PageHeader, setPageHeader] = React.useState<any>(null)
  
  React.useEffect(() => {
    import('./PageHeader').then(module => {
      setPageHeader(() => module.PageHeader)
    })
  }, [])

  return (
    <PageLayout className={className}>
      {title && PageHeader && (
        <PageHeader 
          title={title}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
      )}
      {children}
    </PageLayout>
  )
}