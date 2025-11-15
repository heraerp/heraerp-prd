/**
 * LazyPanel - Intersection Observer Loading
 * Only loads content when scrolled into view for performance
 */

'use client'

import React, { useEffect, useState } from 'react'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface LazyPanelProps {
  children: ReactNode
  onVisible: () => void
  fallback?: ReactNode
  rootMargin?: string
  triggerOnce?: boolean
  className?: string
}

export function LazyPanel({ 
  children, 
  onVisible, 
  fallback = null,
  rootMargin = '200px',
  triggerOnce = true,
  className = ''
}: LazyPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!ref.current || (triggerOnce && hasTriggered)) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setHasTriggered(true)
          onVisible()
          
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { 
        rootMargin,
        threshold: 0.1
      }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [onVisible, rootMargin, triggerOnce, hasTriggered])

  return (
    <div ref={ref} className={className}>
      {(isVisible || hasTriggered) ? children : fallback}
    </div>
  )
}

/**
 * LazyPanelWithSkeleton - Convenience wrapper with built-in skeleton
 */
interface LazyPanelWithSkeletonProps extends Omit<LazyPanelProps, 'fallback'> {
  skeletonHeight?: string
  skeletonClassName?: string
}

export function LazyPanelWithSkeleton({
  children,
  onVisible,
  skeletonHeight = 'h-48',
  skeletonClassName = '',
  ...props
}: LazyPanelWithSkeletonProps) {
  const fallback = (
    <div 
      className={`animate-pulse rounded-2xl bg-zinc-900 ${skeletonHeight} ${skeletonClassName}`}
    />
  )

  return (
    <LazyPanel {...props} onVisible={onVisible} fallback={fallback}>
      {children}
    </LazyPanel>
  )
}

/**
 * useIntersectionObserver hook for custom implementations
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<HTMLElement>(null)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!ref.current || hasTriggered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasTriggered(true)
          callback()
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [callback, hasTriggered, options])

  return { ref, hasTriggered }
}