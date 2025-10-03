'use client'

import React, { useTransition, useCallback, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface EnterpriseLinkProps {
  href: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  prefetch?: boolean
  showLoadingOverlay?: boolean
}

export function EnterpriseLink({
  href,
  children,
  className,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  prefetch = true,
  showLoadingOverlay = false,
  ...props
}: EnterpriseLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isNavigating, setIsNavigating] = React.useState(false)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call any custom onClick handler
      if (onClick) {
        onClick(e)
      }

      // Don't prevent default if it's an external link or has special keys pressed
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return
      }

      // Prevent default navigation
      e.preventDefault()

      // Set navigating state
      setIsNavigating(true)

      // Use transition for smooth navigation
      startTransition(() => {
        router.push(href)

        // Reset navigation state after a delay
        setTimeout(() => {
          setIsNavigating(false)
        }, 300)
      })
    },
    [href, router, onClick]
  )

  return (
    <>
      <Link
        href={href}
        className={cn(className, (isPending || isNavigating) && 'pointer-events-none opacity-70')}
        style={style}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        prefetch={prefetch}
        {...props}
      >
        {children}
      </Link>

      {/* Global loading overlay for navigation */}
      {showLoadingOverlay && (isPending || isNavigating) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Loading...</span>
          </div>
        </div>
      )}
    </>
  )
}

// Hook for programmatic navigation with loading states
export function useEnterpriseNavigation() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isNavigating, setIsNavigating] = React.useState(false)

  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      setIsNavigating(true)

      startTransition(() => {
        if (options?.replace) {
          router.replace(href)
        } else {
          router.push(href)
        }

        setTimeout(() => {
          setIsNavigating(false)
        }, 300)
      })
    },
    [router]
  )

  return {
    navigate,
    isNavigating: isPending || isNavigating
  }
}
