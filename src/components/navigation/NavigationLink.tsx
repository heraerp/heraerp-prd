'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigationLoading } from './NavigationLoadingProvider'

interface NavigationLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
  onClick?: () => void
  disabled?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export function NavigationLink({ 
  href, 
  children, 
  className = '', 
  activeClassName = '',
  onClick,
  disabled = false,
  icon: Icon
}: NavigationLinkProps) {
  const [isClicked, setIsClicked] = useState(false)
  const { setNavigating, isNavigating, navigationTarget } = useNavigationLoading()
  const pathname = usePathname()
  
  const isActive = pathname === href
  const isThisLinkNavigating = navigationTarget === href
  
  const handleClick = () => {
    if (disabled || isNavigating) return
    
    setIsClicked(true)
    setNavigating(true, href)
    onClick?.()
    
    // Reset clicked state after a delay
    setTimeout(() => setIsClicked(false), 200)
  }

  return (
    <Link 
      href={href}
      onClick={handleClick}
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
        'hover:bg-white/10 hover:backdrop-blur-sm',
        isActive && 'bg-white/20 text-white shadow-lg',
        isActive && activeClassName,
        (disabled || isNavigating) && 'opacity-50 cursor-not-allowed pointer-events-none',
        isClicked && 'scale-95 bg-white/30',
        isThisLinkNavigating && 'bg-white/30 animate-pulse',
        className
      )}
    >
      {/* Loading spinner for this specific link */}
      {isThisLinkNavigating ? (
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      ) : (
        Icon && <Icon className="w-5 h-5" />
      )}
      
      <span className={cn(
        'font-medium transition-opacity',
        isThisLinkNavigating && 'opacity-70'
      )}>
        {children}
      </span>
      
      {/* Subtle loading indicator */}
      {isThisLinkNavigating && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}
    </Link>
  )
}