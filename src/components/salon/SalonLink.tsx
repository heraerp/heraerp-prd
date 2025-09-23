'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSalonContext } from '@/app/salon/SalonProvider'

interface SalonLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  prefetch?: boolean
}

/**
 * Custom Link component for salon navigation that preserves auth state
 */
export function SalonLink({ href, children, className, onClick, prefetch = true }: SalonLinkProps) {
  const router = useRouter()
  const { isAuthenticated, organizationId } = useSalonContext()
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If not authenticated, prevent navigation
    if (!isAuthenticated) {
      e.preventDefault()
      console.warn('Navigation blocked - not authenticated')
      return
    }
    
    // Store current auth state before navigation
    if (organizationId) {
      localStorage.setItem('organizationId', organizationId)
    }
    
    // Call custom onClick if provided
    if (onClick) {
      onClick()
    }
    
    // Use client-side navigation to preserve state
    e.preventDefault()
    router.push(href)
  }
  
  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}