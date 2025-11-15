'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Zap,
  Navigation,
  Sparkles,
  Clock,
  Target
} from 'lucide-react'
import { usePartnerJourney } from '@/lib/partner-journey'

/**
 * Seamless Partner Navigation
 * Steve Jobs-Inspired Contextual Guidance
 *
 * "The best interface is no interface." - But when you need one,
 * it should feel magical and inevitable.
 */

interface NavigationState {
  currentStep: string
  progress: number
  nextAction: string
  encouragement: string
  timeRemaining?: string
  canGoBack: boolean
  canGoForward: boolean
}

interface SeamlessNavigationProps {
  partnerId?: string
  className?: string
}

export default function SeamlessNavigation({
  partnerId = 'demo-partner',
  className = ''
}: SeamlessNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const journey = usePartnerJourney(partnerId)

  const [navState, setNavState] = useState<NavigationState>({
    currentStep: 'discover',
    progress: 0,
    nextAction: 'Start your journey',
    encouragement: 'Ready to change the world?',
    canGoBack: false,
    canGoForward: true
  })

  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    // Calculate progress based on pathname only
    const stepMap: Record<string, number> = {
      '/partner': 0,
      '/partners': 20,
      '/partner-system/register': 40,
      '/partner-system/training': 60,
      '/partner-system/dashboard': 80
    }

    const currentProgress = stepMap[pathname] || 0

    // Get step name from pathname
    const getStepName = (path: string) => {
      if (path === '/partner') return 'Discover the Revolution'
      if (path === '/partners') return 'Envision Your Success'
      if (path.includes('/register')) return 'Join the Movement'
      if (path.includes('/training')) return 'Master Modern Sales'
      if (path.includes('/dashboard')) return 'Thrive & Scale'
      return 'Discover the Revolution'
    }

    // Get encouragement based on progress
    const getEncouragement = (progress: number) => {
      if (progress === 0) return 'Ready to change the world?'
      if (progress <= 20) return 'See your potential earnings!'
      if (progress <= 40) return 'Join the revolution today!'
      if (progress <= 60) return 'Master the modern sales approach!'
      return 'Welcome to your success story!'
    }

    // Get next action
    const getNextAction = (progress: number) => {
      if (progress === 0) return 'Explore Partnership'
      if (progress <= 20) return 'Calculate Earnings'
      if (progress <= 40) return 'Complete Registration'
      if (progress <= 60) return 'Start Training'
      return 'View Dashboard'
    }

    const currentStep = getStepName(pathname)
    const encouragement = getEncouragement(currentProgress)
    const nextAction = getNextAction(currentProgress)

    setNavState({
      currentStep,
      progress: currentProgress,
      nextAction,
      encouragement,
      canGoBack: currentProgress > 0,
      canGoForward: true
    })

    // Show navigation after slight delay for smooth entrance
    const showTimer = setTimeout(() => setIsVisible(true), 500)

    // Auto-minimize on dashboard (user is actively working)
    let minimizeTimer: NodeJS.Timeout | undefined
    if (pathname.includes('/dashboard')) {
      minimizeTimer = setTimeout(() => setIsMinimized(true), 3000)
    }

    return () => {
      clearTimeout(showTimer)
      if (minimizeTimer) clearTimeout(minimizeTimer)
    }
  }, [pathname])

  const handleNext = () => {
    // Get next route based on current pathname
    const getNextRoute = (currentPath: string) => {
      if (currentPath === '/partner') return '/partners'
      if (currentPath === '/partners') return '/partner-system/register'
      if (currentPath.includes('/register')) return '/partner-system/training'
      if (currentPath.includes('/training')) return '/partner-system/dashboard'
      return '/partner-system/dashboard'
    }

    const nextRoute = getNextRoute(pathname)

    // Smooth transition
    setTimeout(() => {
      router.push(nextRoute)
    }, 300)
  }

  const handleBack = () => {
    // Simple back navigation with style
    router.back()
  }

  const getStepIcon = (step: string) => {
    const icons: Record<string, any> = {
      'Discover the Revolution': Lightbulb,
      'Envision Your Success': Target,
      'Join the Movement': Zap,
      'Master Modern Sales': Sparkles,
      'Thrive & Scale': CheckCircle
    }
    return icons[step] || Navigation
  }

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-red-500'
    if (progress < 50) return 'bg-amber-500'
    if (progress < 75) return 'bg-blue-500'
    return 'bg-emerald-500'
  }

  if (!isVisible) return null

  const StepIcon = getStepIcon(navState.currentStep)

  return (
    <div className={`${className}`}>
      {/* Floating Navigation Bar */}
      <div
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
          isMinimized ? 'scale-75 opacity-70 hover:scale-100 hover:opacity-100' : ''
        }`}
      >
        <div className="bg-background/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/20 px-6 py-4 max-w-md">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StepIcon className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">{navState.currentStep}</span>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
              {navState.progress}% Complete
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={navState.progress} className={`h-2 transition-all duration-1000`} />
            <div className="flex justify-between text-xs ink-muted mt-1">
              <span>Journey Progress</span>
              <span>{navState.progress}/100</span>
            </div>
          </div>

          {/* Encouragement */}
          <div className="text-center mb-4">
            <p className="ink font-medium">{navState.encouragement}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={!navState.canGoBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {/* Dashboard Quick Access - Show on all pages except dashboard */}
            {!pathname.includes('/dashboard') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/partner-system/dashboard')}
                className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Target className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              disabled={!navState.canGoForward}
              className="flex-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
            >
              {navState.nextAction}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Time Estimate */}
          {navState.timeRemaining && (
            <div className="flex items-center justify-center gap-1 mt-3 text-xs ink-muted">
              <Clock className="h-3 w-3" />
              <span>{navState.timeRemaining} remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* Contextual Hints */}
      {pathname === '/partners' && (
        <div className="fixed top-6 right-6 z-40">
          <div className="bg-emerald-500 text-foreground px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Try the earnings calculator!</span>
            </div>
          </div>
        </div>
      )}

      {pathname.includes('/register') && navState.progress < 100 && (
        <div className="fixed top-6 left-6 z-40">
          <div className="bg-blue-500 text-foreground px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-semibold">
                Just {4 - Math.floor(navState.progress / 25)} steps left!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Moments */}
      {navState.progress === 100 && (
        <div className="fixed inset-0 pointer-events-none z-30">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 animate-pulse" />
          <div className="flex items-center justify-center h-full">
            <div className="bg-background rounded-2xl shadow-2xl p-8 text-center animate-bounce">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Congratulations! 🎉</h3>
              <p className="text-muted-foreground">You've completed your partner journey!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Smart Context Provider
export function withSeamlessNavigation<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const pathname = usePathname()
    const isPartnerPath = pathname.includes('/partner')

    if (!isPartnerPath) {
      return <Component {...props} />
    }

    return (
      <>
        <Component {...props} />
        <SeamlessNavigation />
      </>
    )
  }
}
