/**
 * Smart NavLink component for instant client-side navigation
 * Prevents full page reloads and highlights active state
 */

'use client'

import React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface NavLinkProps {
  href: string
  children: ReactNode
  className?: string
  activeClassName?: string
  exact?: boolean
  prefetch?: boolean
}

export function NavLink({ 
  href, 
  children, 
  className = '', 
  activeClassName = 'font-semibold', 
  exact = false,
  prefetch = true 
}: NavLinkProps) {
  const pathname = usePathname()
  
  const isActive = exact 
    ? pathname === href 
    : pathname === href || pathname.startsWith(href + '/')
  
  return (
    <Link 
      href={href} 
      prefetch={prefetch}
      className={clsx(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  )
}

/**
 * Utility for creating styled nav links with common patterns
 */
export function createNavLink(baseClassName: string, activeClassName: string = 'font-semibold') {
  return function StyledNavLink({ href, children, className = '', exact = false }: Omit<NavLinkProps, 'activeClassName'>) {
    return (
      <NavLink
        href={href}
        className={clsx(baseClassName, className)}
        activeClassName={activeClassName}
        exact={exact}
      >
        {children}
      </NavLink>
    )
  }
}