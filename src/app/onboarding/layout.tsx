'use client'

import React from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Rocket, Users, Settings, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * HERA Onboarding Layout - Universal container for onboarding pages
 * 
 * Features:
 * - Mobile-first responsive design with glassmorphism
 * - HERAAuth integration with three-layer validation
 * - Progressive navigation for onboarding flow
 * - Touch-optimized interface with 44px targets
 * - Role-based access control
 */

interface OnboardingLayoutProps {
  children: React.ReactNode
}

interface OnboardingNavItem {
  id: string
  label: string
  path: string
  icon: React.ReactNode
  description: string
  completed?: boolean
  current?: boolean
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { user, organization, isAuthenticated, contextLoading, sessionType } = useHERAAuth()

  // Three-layer authentication check (MANDATORY)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal to-black flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the onboarding system.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal to-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-champagne">Loading onboarding context...</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal to-black flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found. Please select an organization to continue.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Onboarding navigation items
  const navigationItems: OnboardingNavItem[] = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      path: '/onboarding/getting-started',
      icon: <Rocket className="w-5 h-5" />,
      description: 'Welcome & business setup'
    },
    {
      id: 'setup',
      label: 'Setup',
      path: '/onboarding/setup',
      icon: <Settings className="w-5 h-5" />,
      description: 'Configure your applications'
    },
    {
      id: 'launch',
      label: 'Launch',
      path: '/onboarding/launch',
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Go-live preparation'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal to-black">
      {/* iOS-style status bar spacer - MANDATORY on mobile */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile app header - MANDATORY */}
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {/* Rounded app icon */}
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-gold" />
            </div>
            {/* Title and subtitle */}
            <div>
              <h1 className="text-lg font-bold text-champagne">Onboarding</h1>
              <p className="text-xs text-bronze">{organization.organization_name}</p>
            </div>
          </div>
          {/* User indicator */}
          <div className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-gold" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Desktop Sidebar Navigation (hidden on mobile) */}
        <div className="hidden md:flex md:flex-col md:w-80 bg-black/20 backdrop-blur-md border-r border-gold/20">
          <div className="p-6 border-b border-gold/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-champagne">Onboarding</h2>
                <p className="text-sm text-bronze">{organization.organization_name}</p>
              </div>
            </div>
            
            {sessionType === 'demo' && (
              <div className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300 font-medium">Demo Mode</p>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={item.path}
                  className={cn(
                    "block p-4 rounded-xl transition-all duration-200 group",
                    "hover:bg-gold/10 hover:border-gold/30",
                    "border border-transparent",
                    "min-h-[60px]" // Touch-friendly height
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-champagne font-medium group-hover:text-gold transition-colors">
                        {item.label}
                      </p>
                      <p className="text-sm text-bronze mt-1">
                        {item.description}
                      </p>
                    </div>
                    {item.completed && (
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* Mobile Bottom Navigation (shown on mobile only) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-charcoal border-t border-gold/20">
          <div className="flex items-center justify-around py-2">
            {navigationItems.map((item) => (
              <a
                key={item.id}
                href={item.path}
                className="flex flex-col items-center gap-1 p-2 min-w-[60px] min-h-[60px] justify-center rounded-lg active:scale-95 transition-transform"
              >
                <div className="text-gold">
                  {item.icon}
                </div>
                <span className="text-xs text-champagne font-medium">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 md:overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 md:h-0" />
    </div>
  )
}