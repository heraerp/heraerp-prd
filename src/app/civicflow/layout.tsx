'use client'

import { useEffect } from 'react'
import { useOrgStore } from '@/state/org'
import { setOrgId } from '@/lib/api-client'
import { DemoBanner } from '@/components/civicflow/DemoBanner'
import { CivicFlowThemeProvider } from '@/components/civicflow/CivicFlowThemeProvider'
import { CivicFlowThemeSwitcher } from '@/components/civicflow/CivicFlowThemeSwitcher'
import { CivicFlowGlow } from '@/components/civicflow/CivicFlowGlow'
import { CivicFlowSidebar } from '@/components/civicflow/CivicFlowSidebar'
import { CivicFlowAuthGuard } from '@/components/civicflow/CivicFlowAuthGuard'
import { ToastProvider } from '@/components/ui/use-toast'
import '@/styles/civicflow-theme.css'

const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export default function CivicFlowLayout({ children }: { children: React.ReactNode }) {
  const { currentOrgId, setCurrentOrgId } = useOrgStore()

  useEffect(() => {
    // Set demo org if no org is currently selected
    if (!currentOrgId) {
      setCurrentOrgId(DEMO_ORG_ID)
      setOrgId(DEMO_ORG_ID)
    } else {
      // Sync api-client with Zustand store
      setOrgId(currentOrgId)
    }
  }, [currentOrgId, setCurrentOrgId])

  // For demo purposes, show banner when viewing demo org
  const isDemoMode = currentOrgId === DEMO_ORG_ID

  return (
    <CivicFlowThemeProvider defaultTheme="dark">
      <ToastProvider>
        <CivicFlowAuthGuard>
          <div className="min-h-screen flex bg-bg relative overflow-hidden">
            <CivicFlowGlow />

            {/* Sidebar */}
            <CivicFlowSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative z-10">
              {isDemoMode && <DemoBanner orgName="CivicFlow Demo Org" />}
              <main className="flex-1 overflow-auto">{children}</main>
            </div>

            {/* Theme Switcher - positioned fixed in bottom right */}
            <div className="fixed bottom-4 right-4 z-50">
              <CivicFlowThemeSwitcher />
            </div>
          </div>
        </CivicFlowAuthGuard>
      </ToastProvider>
    </CivicFlowThemeProvider>
  )
}
