'use client'

import { HERADevelopmentDashboard } from '@/components/development/HERADevelopmentDashboard'
import { DualAuthProvider } from '@/components/auth/DualAuthProvider'

export default function DevelopmentDashboardPage() {
  return (
    <DualAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <HERADevelopmentDashboard />
      </div>
    </DualAuthProvider>
  )
}