'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

// List of public page routes that should be dark-only
export const PUBLIC_ROUTES = [
  '/',
  '/demo',
  '/pricing-request',
  '/blog',
  '/docs',
  '/contact',
  '/partners',
  '/solutions',
  '/features',
  '/terms',
  '/policy',
  '/whatsapp-desktop',
  '/discover',
  '/how-it-works',
  '/pricing',
  '/get-started',
  '/book-a-meeting',
  '/about',
  '/auth/login'
]

export function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })
}

export default function PublicPageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicPage = isPublicRoute(pathname)

  useEffect(() => {
    if (isPublicPage) {
      // Force dark mode for public pages
      const root = document.documentElement
      root.classList.remove('light')
      root.classList.add('dark')

      // Add public-page class to body for public routes
      document.body.classList.add('public-page')

      // Override theme storage for public pages
      const originalGetItem = localStorage.getItem.bind(localStorage)
      const originalSetItem = localStorage.setItem.bind(localStorage)

      localStorage.getItem = function (key: string) {
        if (key === 'theme') {
          return 'dark'
        }
        return originalGetItem(key)
      }

      localStorage.setItem = function (key: string, value: string) {
        if (key === 'theme') {
          // Ignore theme changes on public pages
          return
        }
        return originalSetItem(key, value)
      }

      // Watch for class changes and force dark mode
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const root = document.documentElement
            if (!root.classList.contains('dark')) {
              root.classList.remove('light')
              root.classList.add('dark')
            }
          }
        })
      })

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })

      return () => {
        observer.disconnect()
        // Remove public-page class when leaving public routes
        document.body.classList.remove('public-page')
        // Restore original localStorage methods
        localStorage.getItem = originalGetItem
        localStorage.setItem = originalSetItem
      }
    } else {
      // Remove public-page class for non-public routes
      document.body.classList.remove('public-page')
    }
  }, [pathname, isPublicPage])

  return (
    <>
      {isPublicPage && <Navbar />}
      {children}
      {isPublicPage && <Footer showGradient={true} />}
    </>
  )
}
