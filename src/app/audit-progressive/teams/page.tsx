'use client'

// No authentication required for public audit demo
import { TeamManagement } from '@/components/audit/TeamManagement'
import { Toaster } from 'sonner'

export default function AuditTeamsPage() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <TeamManagement />
        <Toaster 
          position="top-right"
          richColors
          expand={true}
          duration={4000}
        />
      </div>
    </>
  )
}