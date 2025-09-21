// ============================================================================
// HERA • Kanban Playbook Hook with DRAFT support
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { KanbanCard, KanbanStatus, ALLOWED_TRANSITIONS } from '@/schemas/kanban';
import * as playbook from '@/lib/playbook/appointments';
import { between } from '@/lib/kanban/rank';

export function useKanbanPlaybook(params: {
  organization_id: string;
  branch_id: string;
  date: string;
  userId: string;
}) {
  const { organization_id, branch_id, date, userId } = params;
  const { toast } = useToast();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const appointments = await playbook.listAppointmentsForKanban({
        organization_id,
        branch_id,
        date
      });
      setCards(appointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast({
        title: 'Error loading appointments',
        description: 'Please refresh the page to try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [organization_id, branch_id, date, toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Validate status transition
  const canTransition = useCallback((from: KanbanStatus, to: KanbanStatus): boolean => {
    return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
  }, []);

  // Move card between columns
  const moveCard = useCallback(async (
    cardId: string,
    targetColumn: KanbanStatus,
    targetIndex: number
  ) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Validate transition
    if (!canTransition(card.status, targetColumn)) {
      toast({
        title: 'Invalid move',
        description: `Cannot move from ${card.status} to ${targetColumn}`,
        variant: 'destructive'
      });
      return;
    }

    setIsMoving(true);

    // Optimistically update UI
    const targetCards = cards.filter(c => c.status === targetColumn);
    const leftRank = targetIndex > 0 ? targetCards[targetIndex - 1].rank : undefined;
    const rightRank = targetIndex < targetCards.length ? targetCards[targetIndex].rank : undefined;
    const newRank = between(leftRank, rightRank);

    setCards(prev => prev.map(c => 
      c.id === cardId 
        ? { ...c, status: targetColumn, rank: newRank }
        : c
    ));

    try {
      // Special handling for DRAFT → BOOKED
      if (card.status === 'DRAFT' && targetColumn === 'BOOKED') {
        const success = await playbook.confirmDraft({
          organization_id,
          appointment_id: cardId,
          confirmed_by: userId
        });
        if (!success) throw new Error('Failed to confirm draft');
        
        toast({
          title: 'Appointment confirmed',
          description: 'Draft appointment has been confirmed and booked'
        });
      } else {
        // Regular status change
        const success = await playbook.postStatusChange({
          organization_id,
          appointment_id: cardId,
          from_status: card.status,
          to_status: targetColumn,
          changed_by: userId
        });
        if (!success) throw new Error('Failed to update status');
      }

      // Update rank
      await playbook.upsertKanbanRank({
        appointment_id: cardId,
        column: targetColumn,
        rank: newRank,
        branch_id,
        date,
        organization_id
      });

    } catch (error) {
      console.error('Failed to move card:', error);
      toast({
        title: 'Failed to update appointment',
        description: 'Refreshing to restore correct state...',
        variant: 'destructive'
      });
      // Rollback by reloading
      await loadAppointments();
    } finally {
      setIsMoving(false);
    }
  }, [cards, canTransition, organization_id, branch_id, date, userId, toast, loadAppointments]);

  // Create draft appointment
  const createDraft = useCallback(async (data: {
    customer_id: string;
    customer_name: string;
    service_id: string;
    service_name: string;
    staff_id?: string;
    staff_name?: string;
    start: string;
    end: string;
  }) => {
    try {
      const response = await fetch('/api/v1/universal_transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id,
          transaction_type: 'appointment',
          smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
          status: 'draft',
          when_ts: data.start,
          reference_entity_id: data.customer_id,
          metadata: {
            branch_id,
            ...data
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create draft');

      const appointment = await response.json();

      // Set initial status DD as DRAFT
      await playbook.upsertDynamicData({
        entity_id: appointment.id,
        field_name: 'appointment_status',
        field_value_text: 'DRAFT',
        smart_code: 'HERA.SALON.APPOINTMENT.STATUS.V1',
        metadata: {
          created_by: userId,
          created_at: new Date().toISOString()
        }
      });

      // Set initial rank in DRAFT column
      const draftCards = cards.filter(c => c.status === 'DRAFT');
      const firstRank = draftCards.length > 0 ? draftCards[0].rank : undefined;
      const newRank = between(undefined, firstRank);

      await playbook.upsertKanbanRank({
        appointment_id: appointment.id,
        column: 'DRAFT',
        rank: newRank,
        branch_id,
        date,
        organization_id
      });

      toast({
        title: 'Draft created',
        description: 'Appointment saved as draft. Confirm when ready.'
      });

      await loadAppointments();
      return appointment.id;
    } catch (error) {
      console.error('Failed to create draft:', error);
      toast({
        title: 'Failed to create draft',
        variant: 'destructive'
      });
      return null;
    }
  }, [organization_id, branch_id, date, userId, cards, toast, loadAppointments]);

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
    };

    cards.forEach(card => {
      if (groups[card.status]) {
        groups[card.status].push(card);
      }
    });

    // Sort each column by rank
    Object.keys(groups).forEach(status => {
      groups[status as KanbanStatus].sort((a, b) => a.rank.localeCompare(b.rank));
    });

    return groups;
  }, [cards]);

  return {
    cards,
    cardsByColumn,
    loading,
    isMoving,
    moveCard,
    createDraft,
    reload: loadAppointments,
    canTransition
  };
}