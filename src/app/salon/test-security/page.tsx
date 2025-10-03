'use client'

import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { LUXE_COLORS } from '@/lib/constants/salon'

export default function TestSecurityPage() {
  const { salonRole, organizationId, isAuthenticated, userId } = useSecuredSalonContext()
  const router = useRouter()
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div 
          className="rounded-xl shadow-lg p-6"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
            border: `1px solid ${LUXE_COLORS.gold}20`
          }}
        >
          <h1 className="text-2xl font-bold mb-4" style={{ color: LUXE_COLORS.gold }}>
            Security Context Test
          </h1>
          
          <div className="space-y-2 text-sm" style={{ color: LUXE_COLORS.lightText }}>
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>Salon Role:</strong> {salonRole}</p>
            <p><strong>Organization ID:</strong> {organizationId}</p>
            <p><strong>User ID:</strong> {userId}</p>
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button
              onClick={() => router.push('/salon/dashboard')}
              style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}
            >
              Go to Dashboard
            </Button>
            
            <Button
              onClick={() => router.push('/salon/service-categories')}
              style={{ backgroundColor: LUXE_COLORS.bronze, color: LUXE_COLORS.black }}
            >
              Go to Service Categories
            </Button>
            
            <Button
              onClick={() => router.push('/salon/pos')}
              style={{ backgroundColor: LUXE_COLORS.emerald, color: LUXE_COLORS.black }}
            >
              Go to POS
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}