/**
 * Client Navigation Test Component
 * Helps diagnose if client-side navigation is working properly
 */

'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { NavLink } from './NavLink'

export function ClientNavigationTest() {
  const [navigationCount, setNavigationCount] = useState(0)
  const [lastNavigation, setLastNavigation] = useState<string>('')
  const pathname = usePathname()

  useEffect(() => {
    setNavigationCount(prev => prev + 1)
    setLastNavigation(new Date().toLocaleTimeString())
  }, [pathname])

  const testRoutes = [
    '/salon/dashboard',
    '/salon/appointments', 
    '/salon/customers',
    '/salon/services'
  ]

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
      <div className="font-bold mb-2">Navigation Test</div>
      <div>Count: {navigationCount}</div>
      <div>Last: {lastNavigation}</div>
      <div>Path: {pathname}</div>
      <div className="flex gap-2 mt-2">
        {testRoutes.map(route => (
          <NavLink
            key={route}
            href={route}
            className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-500"
            activeClassName="bg-green-600"
          >
            {route.split('/').pop()}
          </NavLink>
        ))}
      </div>
    </div>
  )
}