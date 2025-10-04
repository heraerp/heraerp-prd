// ============================================================================
// HERA • Kanban Playbook Hook with DRAFT support
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { KanbanCard, KanbanStatus, ALLOWED_TRANSITIONS, CANCELLABLE_STATES } from '@/schemas/kanban'
import * as playbook from '@/lib/playbook/appointments'
import { between } from '@/lib/kanban/rank'

export function useKanbanPlaybook(params: {
  organization_id: string
  branch_id?: string
  date: string
  dateFrom?: Date
  dateTo?: Date
  userId: string
}) {
  const { organization_id, branch_id, date, dateFrom, dateTo, userId } = params
  const { toast } = useToast()
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [loading, setLoading] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  // Load appointments
  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const appointments = await playbook.listAppointmentsForKanban({
        organization_id,
        branch_id,
        date,
        dateFrom,
        dateTo
      })
      setCards(appointments)
    } catch (error) {
      console.error('Failed to load appointments:', error)
      toast({
        title: 'Error loading appointments',
        description: 'Please refresh the page to try again',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [organization_id, branch_id, date, toast])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Validate status transition
  const canTransition = useCallback((from: KanbanStatus, to: KanbanStatus): boolean => {
    const allowed = ALLOWED_TRANSITIONS[from]?.includes(to) || false
    if (!allowed) {
      console.log(
        `🔄 Invalid transition: ${from} → ${to} (allowed: ${ALLOWED_TRANSITIONS[from]?.join(', ') || 'none'})`
      )
    }
    return allowed
  }, [])

  // Move card between columns
  const moveCard = useCallback(
    async (cardId: string, targetColumn: KanbanStatus, targetIndex: number) => {
      const card = cards.find(c => c.id === cardId)
      if (!card) {
        console.error('❌ Card not found:', cardId)
        return
      }

      console.log(`🎯 Moving ${card.customer_name} from ${card.status} to ${targetColumn}`)

      // Validate transition
      if (!canTransition(card.status, targetColumn)) {
        console.error(`❌ Invalid transition: ${card.status} → ${targetColumn}`)
        toast({
          title: 'Invalid move',
          description: `Cannot move from ${card.status} to ${targetColumn}`,
          variant: 'destructive'
        })
        return
      }

      setIsMoving(true)

      // Optimistically update UI
      const targetCards = cards.filter(c => c.status === targetColumn)
      const leftRank = targetIndex > 0 ? targetCards[targetIndex - 1].rank : undefined
      const rightRank = targetIndex < targetCards.length ? targetCards[targetIndex].rank : undefined
      const newRank = between(leftRank, rightRank)

      setCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, status: targetColumn, rank: newRank } : c))
      )

      try {
        // Special handling for DRAFT → BOOKED
        if (card.status === 'DRAFT' && targetColumn === 'BOOKED') {
          const success = await playbook.confirmDraft({
            organization_id,
            appointment_id: cardId,
            confirmed_by: userId
          })
          if (!success) throw new Error('Failed to confirm draft')

          toast({
            title: 'Appointment confirmed',
            description: 'Draft appointment has been confirmed and booked'
          })
        } else {
          // Regular status change
          const success = await playbook.postStatusChange({
            organization_id,
            appointment_id: cardId,
            from_status: card.status,
            to_status: targetColumn,
            changed_by: userId
          })
          if (!success) throw new Error('Failed to update status')

          // Show success message for regular transitions
          const statusDisplay = targetColumn.replace('_', ' ').toLowerCase()
          toast({
            title: 'Status updated',
            description: `${card.customer_name} moved to ${statusDisplay}`
          })

          // Special handling for TO_PAY status - redirect to POS
          if (targetColumn === 'TO_PAY') {
            setTimeout(() => {
              const posUrl = `/salon/pos?customer_id=${card.metadata?.customer_id || ''}&customer_name=${encodeURIComponent(card.customer_name)}&appointment_id=${card.id}&service=${encodeURIComponent(card.service_name)}&amount=${card.metadata?.price || 0}`

              toast({
                title: 'Redirecting to POS',
                description: 'Processing payment for ' + card.customer_name
              })

              // Open POS in new tab to maintain kanban context
              window.open(posUrl, '_blank')
            }, 1500) // Small delay to show the status update first
          }
        }

        // Update rank
        await playbook.upsertKanbanRank({
          appointment_id: cardId,
          column: targetColumn,
          rank: newRank,
          branch_id,
          date,
          organization_id
        })
      } catch (error) {
        console.error('Failed to move card:', error)
        toast({
          title: 'Failed to update appointment',
          description: 'Refreshing to restore correct state...',
          variant: 'destructive'
        })
        // Rollback by reloading
        await loadAppointments()
      } finally {
        setIsMoving(false)
      }
    },
    [cards, canTransition, organization_id, branch_id, date, userId, toast, loadAppointments]
  )

  // Create draft appointment
  const createDraft = useCallback(
    async (data: {
      customer_id: string
      customer_name: string
      service_id: string
      service_name: string
      staff_id?: string
      staff_name?: string
      start: string
      end: string
    }) => {
      console.log('📝 Creating draft appointment:', data)

      try {
        const response = await fetch('/api/v1/salon/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: organization_id,
            clientName: data.customer_name,
            clientPhone: '',
            clientEmail: '',
            serviceId: data.service_id,
            serviceName: data.service_name,
            servicePrice: 0,
            stylistId: data.staff_id,
            stylistName: data.staff_name,
            date: new Date(data.start).toISOString().split('T')[0],
            time: new Date(data.start).toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit'
            }),
            duration: Math.round(
              (new Date(data.end).getTime() - new Date(data.start).getTime()) / (1000 * 60)
            ),
            notes: 'Draft appointment'
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to create draft:', errorText)
          throw new Error('Failed to create draft')
        }

        const result = await response.json()
        console.log('✅ Draft appointment created:', result)

        // Get the appointment ID from the response
        const appointmentId = result.appointment?.id
        if (!appointmentId) {
          throw new Error('No appointment ID returned')
        }

        // Set initial status as DRAFT by updating the appointment status
        const updateResponse = await fetch(`/api/v1/salon/appointments`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: appointmentId,
            status: 'draft',
            organizationId: organization_id,
            userId: userId
          })
        })

        if (!updateResponse.ok) {
          console.warn('Failed to set draft status, but appointment was created')
        }

        toast({
          title: 'Draft created',
          description: 'Appointment saved as draft. Confirm when ready.'
        })

        // Reload appointments to show the new draft
        await loadAppointments()
        return appointmentId
      } catch (error) {
        console.error('Failed to create draft:', error)
        toast({
          title: 'Failed to create draft',
          variant: 'destructive'
        })
        return null
      }
    },
    [organization_id, branch_id, date, userId, cards, toast, loadAppointments]
  )

  // Cancel appointment
  const cancelAppointment = useCallback(
    async (cardId: string, reason?: string) => {
      const card = cards.find(c => c.id === cardId)
      if (!card) return false

      // Check if appointment can be cancelled
      if (!CANCELLABLE_STATES.includes(card.status)) {
        toast({
          title: 'Cannot cancel',
          description: `Cannot cancel appointment in ${card.status} status`,
          variant: 'destructive'
        })
        return false
      }

      setIsMoving(true)

      // Optimistically update UI
      setCards(prev => prev.map(c => (c.id === cardId ? { ...c, status: 'CANCELLED' } : c)))

      try {
        // Post status change to CANCELLED
        const success = await playbook.postStatusChange({
          organization_id,
          appointment_id: cardId,
          from_status: card.status,
          to_status: 'CANCELLED',
          changed_by: userId,
          reason: reason || 'Cancelled by staff'
        })

        if (!success) throw new Error('Failed to cancel appointment')

        // Update rank in CANCELLED column
        const cancelledCards = cards.filter(c => c.status === 'CANCELLED')
        const newRank = between(undefined, cancelledCards[0]?.rank)

        await playbook.upsertKanbanRank({
          appointment_id: cardId,
          column: 'CANCELLED',
          rank: newRank,
          branch_id,
          date,
          organization_id
        })

        toast({
          title: 'Appointment cancelled',
          description: 'The appointment has been successfully cancelled'
        })

        return true
      } catch (error) {
        console.error('Failed to cancel appointment:', error)
        toast({
          title: 'Failed to cancel appointment',
          description: 'Refreshing to restore correct state...',
          variant: 'destructive'
        })
        // Rollback by reloading
        await loadAppointments()
        return false
      } finally {
        setIsMoving(false)
      }
    },
    [cards, organization_id, branch_id, date, userId, toast, loadAppointments]
  )

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const groups: Record<KanbanStatus, KanbanCard[]> = {
      DRAFT: [],
      BOOKED: [],
      CHECKED_IN: [],
      IN_SERVICE: [],
      TO_PAY: [],
      REVIEW: [],
      DONE: [],
      NO_SHOW: [],
      CANCELLED: []
    }

    cards.forEach(card => {
      if (groups[card.status]) {
        groups[card.status].push(card)
      }
    })

    // Sort each column by rank
    Object.keys(groups).forEach(status => {
      groups[status as KanbanStatus].sort((a, b) => a.rank.localeCompare(b.rank))
    })

    return groups
  }, [cards])

  return {
    cards,
    cardsByColumn,
    loading,
    isMoving,
    moveCard,
    createDraft,
    cancelAppointment,
    reload: loadAppointments,
    canTransition
  }
}
