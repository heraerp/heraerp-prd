import { useOrgStore } from '@/state/org'
import { api } from '@/lib/api-client'
import type { OrgId } from '@/types/common'

const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

interface DemoGuardResult {
  isDemoMode: boolean
  blockExternalComm: (action: string, target: string) => Promise<void>
}

export function useDemoGuard(): DemoGuardResult {
  const { currentOrgId } = useOrgStore()

  // Check if current org is the demo org
  const isDemoMode = currentOrgId === DEMO_ORG_ID

  const blockExternalComm = async (action: string, target: string) => {
    if (!isDemoMode || !currentOrgId) return

    // Log the blocked attempt to universal_transactions
    try {
      await api.transactions.create({
        transaction_type: 'demo_block',
        smart_code: 'HERA.PUBLICSECTOR.CRM.OUTBOUND.DEMO_BLOCK.v1' as any,
        transaction_code: `DEMO_BLOCK_${Date.now()}`,
        organization_id: currentOrgId as OrgId,
        total_amount: 0,
        metadata: {
          action,
          target,
          blocked_at: new Date().toISOString(),
          reason: 'Demo mode active - external communications disabled'
        },
        ai_insights: `Blocked ${action} to ${target} due to demo mode`
      })

      console.warn(`[DEMO MODE] Blocked ${action} to ${target}`)
    } catch (error) {
      console.error('[DEMO MODE] Failed to log blocked communication:', error)
    }
  }

  return {
    isDemoMode,
    blockExternalComm
  }
}
