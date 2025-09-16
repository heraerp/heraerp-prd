'use client'

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react'
import React from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw, Loader2 } from 'lucide-react'

// Types
export interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
  refreshIndicatorHeight?: number
  disabled?: boolean
  className?: string
  indicatorClassName?: string
  indicatorStyle?: 'circular' | 'linear' | 'custom'
  customIndicator?: (state: PullState, progress: number) => ReactNode
  messages?: {
    pull?: string
    release?: string
    refreshing?: string
  }
  onPull?: (progress: number) => void
  onRelease?: () => void
  onRefreshStart?: () => void
  onRefreshEnd?: () => void
}

export type PullState = 'idle' | 'pulling' | 'readyToRefresh' | 'refreshing'

interface TouchPosition {
  x: number
  y: number
  timestamp: number
}

// Default messages
const DEFAULT_MESSAGES = {
  pull: 'Pull to refresh',
  release: 'Release to refresh',
  refreshing: 'Refreshing...'
}

// Helper to detect if we're on a touch device
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Main Component
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 150,
  refreshIndicatorHeight = 60,
  disabled = false,
  className,
  indicatorClassName,
  indicatorStyle = 'circular',
  customIndicator,
  messages = DEFAULT_MESSAGES,
  onPull,
  onRelease,
  onRefreshStart,
  onRefreshEnd
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [pullState, setPullState] = useState<PullState>('idle')
  const [pullDistance, setPullDistance] = useState(0)
  const [isScrolledToTop, setIsScrolledToTop] = useState(true)
  
  const touchStartRef = useRef<TouchPosition | null>(null)
  const isRefreshingRef = useRef(false)
  const animationFrameRef = useRef<number | null>(null)

  // Merged messages
  const finalMessages = { ...DEFAULT_MESSAGES, ...messages }

  // Calculate pull progress (0-1)
  const pullProgress = Math.min(pullDistance / threshold, 1)

  // Check if container is scrolled to top
  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return true
    const { scrollTop } = containerRef.current
    return scrollTop <= 0
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshingRef.current) return
    
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
    
    setIsScrolledToTop(checkScrollPosition())
  }, [disabled, checkScrollPosition])

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshingRef.current || !touchStartRef.current || !isScrolledToTop) return

    const touch = e.touches[0]
    const deltaY = touch.clientY - touchStartRef.current.y
    
    // Only handle downward pull when scrolled to top
    if (deltaY > 0) {
      e.preventDefault()
      
      // Apply resistance for more natural feel
      const resistance = 0.5
      const adjustedDelta = deltaY * resistance
      const newPullDistance = Math.min(adjustedDelta, maxPull)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setPullDistance(newPullDistance)
        
        // Update pull state
        if (newPullDistance >= threshold) {
          setPullState('readyToRefresh')
        } else if (newPullDistance > 0) {
          setPullState('pulling')
        }
        
        // Trigger onPull callback
        onPull?.(newPullDistance / threshold)
      })
    }
  }, [disabled, isScrolledToTop, maxPull, threshold, onPull])

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshingRef.current || !touchStartRef.current) return

    touchStartRef.current = null
    onRelease?.()

    if (pullDistance >= threshold) {
      // Trigger refresh
      isRefreshingRef.current = true
      setPullState('refreshing')
      onRefreshStart?.()
      
      try {
        await onRefresh()
      } finally {
        isRefreshingRef.current = false
        setPullState('idle')
        setPullDistance(0)
        onRefreshEnd?.()
      }
    } else {
      // Reset to idle
      setPullState('idle')
      setPullDistance(0)
    }
  }, [disabled, pullDistance, threshold, onRefresh, onRelease, onRefreshStart, onRefreshEnd])

  // Programmatic refresh
  const refresh = useCallback(async () => {
    if (isRefreshingRef.current || disabled) return
    
    isRefreshingRef.current = true
    setPullState('refreshing')
    setPullDistance(refreshIndicatorHeight)
    onRefreshStart?.()
    
    try {
      await onRefresh()
    } finally {
      isRefreshingRef.current = false
      setPullState('idle')
      setPullDistance(0)
      onRefreshEnd?.()
    }
  }, [disabled, refreshIndicatorHeight, onRefresh, onRefreshStart, onRefreshEnd])

  // Handle scroll
  const handleScroll = useCallback(() => {
    setIsScrolledToTop(checkScrollPosition())
  }, [checkScrollPosition])

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container || !isTouchDevice()) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('scroll', handleScroll)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll])

  // Expose refresh method via ref
  React.useImperativeHandle(
    React.useRef(null),
    () => ({
      refresh
    }),
    [refresh]
  )

  // Render indicator based on style
  const renderIndicator = () => {
    if (customIndicator) {
      return customIndicator(pullState, pullProgress)
    }

    switch (indicatorStyle) {
      case 'linear':
        return <LinearIndicator state={pullState} progress={pullProgress} messages={finalMessages} />
      case 'circular':
      default:
        return <CircularIndicator state={pullState} progress={pullProgress} messages={finalMessages} />
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-full w-full overflow-auto overscroll-y-none',
        className
      )}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 top-0 z-10 flex items-center justify-center overflow-hidden bg-background transition-all duration-300',
          indicatorClassName
        )}
        style={{
          height: `${refreshIndicatorHeight}px`,
          transform: `translateY(${pullDistance - refreshIndicatorHeight}px)`,
          opacity: pullDistance > 10 ? 1 : 0
        }}
      >
        {renderIndicator()}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative"
        style={{
          transform: pullState === 'refreshing' 
            ? `translateY(${refreshIndicatorHeight}px)` 
            : `translateY(${pullDistance}px)`,
          transition: pullState === 'idle' || pullState === 'refreshing' 
            ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Circular Indicator Component
function CircularIndicator({ 
  state, 
  progress, 
  messages 
}: { 
  state: PullState
  progress: number
  messages: typeof DEFAULT_MESSAGES 
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative h-10 w-10">
        {/* Background circle */}
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 40 40"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/20"
          />
          {state !== 'refreshing' && (
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress * 113} 113`}
              className="text-primary transition-all"
            />
          )}
        </svg>
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {state === 'refreshing' ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <RefreshCw 
              className="h-5 w-5 text-primary transition-transform"
              style={{
                transform: `rotate(${progress * 180}deg)`
              }}
            />
          )}
        </div>
      </div>
      
      <span className="text-xs font-medium text-muted-foreground">
        {state === 'refreshing' 
          ? messages.refreshing 
          : state === 'readyToRefresh'
          ? messages.release
          : messages.pull
        }
      </span>
    </div>
  )
}

// Linear Indicator Component
function LinearIndicator({ 
  state, 
  progress, 
  messages 
}: { 
  state: PullState
  progress: number
  messages: typeof DEFAULT_MESSAGES 
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2 px-4">
      <span className="text-xs font-medium text-muted-foreground">
        {state === 'refreshing' 
          ? messages.refreshing 
          : state === 'readyToRefresh'
          ? messages.release
          : messages.pull
        }
      </span>
      
      <div className="relative h-1 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        {state === 'refreshing' ? (
          <div className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-primary" />
        ) : (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

// Hook for programmatic control
export function usePullToRefresh(ref: React.RefObject<{ refresh: () => Promise<void> }>) {
  const refresh = useCallback(async () => {
    await ref.current?.refresh()
  }, [ref])

  return { refresh }
}