'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Intercept all clicks on links to ensure smooth client-side navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (!link) return

      const href = link.getAttribute('href')
      if (!href || !href.startsWith('/')) return

      // Don't intercept external links or special key combinations
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      // Prevent default navigation
      e.preventDefault()

      // Use Next.js router for smooth client-side navigation
      if (href !== pathname) {
        router.push(href)
      }
    }

    // Add event listener to document
    document.addEventListener('click', handleClick, true)

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [router, pathname])

  return <>{children}</>
}
