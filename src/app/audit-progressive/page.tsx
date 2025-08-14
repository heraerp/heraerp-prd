'use client'

import { AuditDashboard } from '@/components/audit/AuditDashboard'
import { Toaster } from 'sonner'

export default function AuditProgressivePage() {
  // Public audit dashboard - no authentication required
  const publicUser = {
    id: 'public-user',
    name: 'Guest User',
    email: 'guest@audit.com',
    organization_id: 'public-org',
    organization_name: 'Public Demo'
  }

  return (
    <div className="p-6">
      <AuditDashboard user={publicUser} />
      <Toaster 
        position="top-right"
        richColors
        closeButton
      />
    </div>
  )
}