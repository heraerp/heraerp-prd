/**
 * PrefetchLink - Hover-to-prefetch for instant navigation
 * Preloads routes on hover for sub-100ms navigation
 */

'use client'

import React from 'react'

import { useRouter } from 'next/navigation'
import { ReactNode, useRef } from 'react'

interface PrefetchLinkProps {
  href: string
  children: ReactNode
  className?: string
  prefetchDelay?: number
  onClick?: () => void
}

export function PrefetchLink({ 
  href, 
  children, 
  className = '',
  prefetchDelay = 100,
  onClick
}: PrefetchLinkProps) {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Prefetch after a small delay to avoid unnecessary prefetches
    timeoutRef.current = setTimeout(() => {
      router.prefetch(href)
    }, prefetchDelay)
  }

  const handleMouseLeave = () => {
    // Cancel prefetch if user leaves quickly
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
    router.push(href)
  }

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}

/**
 * Enhanced NavLink with prefetch capabilities
 */
interface PrefetchNavLinkProps extends PrefetchLinkProps {
  active?: boolean
  activeClassName?: string
}

export function PrefetchNavLink({ 
  active = false,
  activeClassName = 'font-semibold',
  className = '',
  ...props 
}: PrefetchNavLinkProps) {
  const combinedClassName = `${className} ${active ? activeClassName : ''}`
  
  return (
    <PrefetchLink {...props} className={combinedClassName} />
  )
}