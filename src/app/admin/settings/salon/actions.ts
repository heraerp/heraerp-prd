'use server'

import { universalApi } from '@/lib/universal-api-v2'
import { assertOwnerOrAdmin } from '@/lib/auth/assert-permissions'
import { revalidatePath } from 'next/cache'

const COOLDOWN_SEC = 30

async function assertNoRapidToggle(organizationId: string) {
  // Check for recent commission toggle events
  universalApi.setOrganizationId(organizationId)

  const recentEvents = await universalApi.read('universal_transactions')

  if (recentEvents.success && recentEvents.data) {
    // Filter for recent toggle events
    const toggleEvents = recentEvents.data
      .filter(
        (t: any) =>
          t.organization_id === organizationId &&
          t.transaction_type === 'analytics_event' &&
          t.smart_code === 'HERA.SALON.ANALYTICS.COMMISSION.TOGGLE.V1'
      )
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (toggleEvents.length > 0) {
      const lastToggle = new Date(toggleEvents[0].created_at)
      const timeSinceLastToggle = Date.now() - lastToggle.getTime()

      if (timeSinceLastToggle < COOLDOWN_SEC * 1000) {
        const remainingSeconds = Math.ceil((COOLDOWN_SEC * 1000 - timeSinceLastToggle) / 1000)
        throw new Error(
          `Please wait ${remainingSeconds} seconds before toggling again to prevent accidental changes.`
        )
      }
    }
  }
}

export async function toggleCommissionsAction(
  organizationId: string,
  enabled: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Ensure only Owner/Admin can toggle commissions
    const { user } = await assertOwnerOrAdmin()

    // Prevent rapid toggling
    await assertNoRapidToggle(organizationId)

    universalApi.setOrganizationId(organizationId)

    // Get current organization data
    const orgResponse = await universalApi.getEntity(organizationId)
    if (!orgResponse.success || !orgResponse.data) {
      throw new Error('Failed to load organization data')
    }

    const currentSettings = orgResponse.data.settings || {}
    const updatedSettings = {
      ...currentSettings,
      salon: {
        ...currentSettings.salon,
        commissions: {
          ...currentSettings.salon?.commissions,
          enabled
        }
      }
    }

    // Update organization settings
    const updateResponse = await universalApi.updateEntity(organizationId, {
      settings: updatedSettings
    })

    if (!updateResponse.success) {
      throw new Error(updateResponse.error || 'Failed to update settings')
    }

    // Log the change for audit trail with enriched analytics event
    try {
      await universalApi.createTransaction({
        transaction_type: 'analytics_event',
        smart_code: 'HERA.SALON.ANALYTICS.COMMISSION.TOGGLE.V1',
        total_amount: 0,
        from_entity_id: user.id, // Actor who made the change
        metadata: {
          event_type: 'commission_toggle',
          actor_user_id: user.id,
          actor_email: user.email || user.user_metadata?.email,
          source: 'admin/settings/salon',
          business_context: {
            prev_enabled: !enabled,
            new_enabled: enabled,
            reason: reason || 'No reason provided'
          }
        }
      })
    } catch (analyticsError) {
      console.error('Failed to log analytics event:', analyticsError)
      // Don't fail the operation if analytics fails
    }

    // Revalidate relevant paths
    revalidatePath('/admin/settings')
    revalidatePath('/pos')

    return {
      success: true,
      message: enabled
        ? 'Commissions enabled. Full commission tracking is now active.'
        : 'Commissions disabled. POS is now in Simple mode.'
    }
  } catch (error) {
    console.error('Error toggling commissions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update commission settings'
    }
  }
}
