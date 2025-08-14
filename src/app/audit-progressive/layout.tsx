'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { AuditSidebar } from '@/components/audit/AuditSidebar'

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Pages that should not show the sidebar (login and onboarding pages)
  const noSidebarPages = [
    '/audit/login',
    '/audit/client-portal/login',
    '/audit/onboarding'
  ]
  
  const shouldShowSidebar = !noSidebarPages.includes(pathname)
  
  // Get user info from localStorage
  const [user, setUser] = React.useState<any>(null)
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    // Only check auth if we should show sidebar
    if (!shouldShowSidebar) return
    
    // Check if it's a client or auditor
    const clientData = localStorage.getItem('gspu_client')
    const auditorData = localStorage.getItem('gspu_user')

    if (clientData) {
      const parsedClient = JSON.parse(clientData)
      setUser({
        name: parsedClient.contactPerson || parsedClient.company,
        role: 'Client',
        company: parsedClient.company
      })
      setIsClient(true)
    } else if (auditorData) {
      const parsedAuditor = JSON.parse(auditorData)
      setUser({
        name: parsedAuditor.name,
        role: parsedAuditor.role
      })
      setIsClient(false)
    } else {
      // Default public user for demo purposes
      setUser({
        name: 'Demo User',
        role: 'Auditor',
        company: 'GSPU Demo'
      })
      setIsClient(false)
    }
  }, [shouldShowSidebar])

  // If it's a login page, render without sidebar
  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  // Render with sidebar for authenticated pages
  return (
    <div className="flex h-screen bg-gray-50">
      <AuditSidebar isClient={isClient} user={user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}