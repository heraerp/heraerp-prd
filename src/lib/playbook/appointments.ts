// ============================================================================
// HERA • Playbook Appointments Extended API
// ============================================================================

import { KanbanCard, KanbanStatus } from '@/schemas/kanban';

export interface AppointmentData {
  id: string;
  organization_id: string;
  branch_id: string;
  customer_id: string;
  customer_name: string;
  service_id: string;
  service_name: string;
  staff_id?: string;
  staff_name?: string;
  start: string; // ISO
  end: string;   // ISO
  status: KanbanStatus;
  notes?: string;
  metadata?: any;
}

// Extended API for appointments with DRAFT support and reschedule
export async function listAppointmentsForKanban(params: {
  organization_id: string;
  branch_id: string;
  date: string; // YYYY-MM-DD
}): Promise<KanbanCard[]> {
  const { organization_id, branch_id, date } = params;
  
  try {
    // Query both draft and posted appointments for the date
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;
    
    // Mock implementation - replace with actual API calls
    const response = await fetch('/api/v1/universal_transactions?' + new URLSearchParams({
      organization_id,
      transaction_type: 'appointment',
      'metadata.branch_id': branch_id,
      'when_ts.gte': startOfDay,
      'when_ts.lte': endOfDay,
      'status.in': 'draft,posted'
    }));
    
    if (!response.ok) throw new Error('Failed to fetch appointments');
    
    const transactions = await response.json();
    
    // Hydrate status and rank from dynamic data
    const cards: KanbanCard[] = [];
    
    for (const txn of transactions.data) {
      // Determine status
      let status: KanbanStatus = 'BOOKED';
      if (txn.status === 'draft') {
        status = 'DRAFT';
      } else {
        // Check dynamic data for current status
        const statusDD = await getDynamicData({
          entity_id: txn.id,
          field_name: 'appointment_status',
          smart_code: 'HERA.SALON.APPOINTMENT.STATUS.V1'
        });
        if (statusDD?.field_value_text) {
          status = statusDD.field_value_text as KanbanStatus;
        }
      }
      
      // Get rank from dynamic data
      const rankDD = await getDynamicData({
        entity_id: txn.id,
        field_name: 'kanban_rank',
        smart_code: 'HERA.UI.KANBAN.RANK.V1',
        metadata: { branch_id, date }
      });
      
      cards.push({
        id: txn.id,
        organization_id: txn.organization_id,
        branch_id,
        date,
        status,
        rank: rankDD?.field_value_text || `h${txn.metadata.start.slice(11, 13)}m${txn.metadata.start.slice(14, 16)}`,
        start: txn.metadata.start,
        end: txn.metadata.end,
        customer_name: txn.metadata.customer_name,
        service_name: txn.metadata.service_name,
        stylist_name: txn.metadata.staff_name,
        flags: {
          vip: txn.metadata.vip,
          new: txn.metadata.new_customer,
          late: false // Calculate based on current time
        },
        metadata: txn.metadata
      });
    }
    
    return cards.sort((a, b) => a.rank.localeCompare(b.rank));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export async function postStatusChange(params: {
  organization_id: string;
  appointment_id: string;
  from_status: KanbanStatus;
  to_status: KanbanStatus;
  changed_by: string;
  reason?: string;
}): Promise<boolean> {
  try {
    // Create status change event
    const response = await fetch('/api/v1/universal_transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: params.organization_id,
        transaction_type: 'status_change',
        smart_code: 'HERA.SALON.APPOINTMENT.STATUS_CHANGE.V1',
        reference_entity_id: params.appointment_id,
        when_ts: new Date().toISOString(),
        metadata: {
          from_status: params.from_status,
          to_status: params.to_status,
          changed_by: params.changed_by,
          reason: params.reason
        }
      })
    });
    
    if (!response.ok) throw new Error('Failed to post status change');
    
    // Update status dynamic data
    await upsertDynamicData({
      entity_id: params.appointment_id,
      field_name: 'appointment_status',
      field_value_text: params.to_status,
      smart_code: 'HERA.SALON.APPOINTMENT.STATUS.V1',
      metadata: {
        updated_by: params.changed_by,
        updated_at: new Date().toISOString(),
        reason: params.reason
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error posting status change:', error);
    return false;
  }
}

export async function updateAppointment(id: string, patch: {
  when_ts?: string;
  branch_id?: string;
  metadata?: {
    start?: string;
    end?: string;
    staff_id?: string;
    service_id?: string;
    notes?: string;
  };
}): Promise<boolean> {
  try {
    const response = await fetch(`/api/v1/universal_transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating appointment:', error);
    return false;
  }
}

export async function postReschedule(params: {
  organization_id: string;
  appointment_id: string;
  reason?: string;
  from: {
    start: string;
    end: string;
    branch_id: string;
    staff_id?: string;
  };
  to: {
    start: string;
    end: string;
    branch_id: string;
    staff_id?: string;
  };
}): Promise<boolean> {
  try {
    // Post reschedule audit event
    const response = await fetch('/api/v1/universal_transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: params.organization_id,
        transaction_type: 'reschedule',
        smart_code: 'HERA.SALON.APPOINTMENT.RESCHEDULE.V1',
        reference_entity_id: params.appointment_id,
        when_ts: new Date().toISOString(),
        metadata: {
          from: params.from,
          to: params.to,
          reason: params.reason
        }
      })
    });
    
    if (!response.ok) throw new Error('Failed to post reschedule event');
    
    // Keep status as BOOKED (or current non-terminal status)
    await upsertDynamicData({
      entity_id: params.appointment_id,
      field_name: 'appointment_status',
      field_value_text: 'BOOKED',
      smart_code: 'HERA.SALON.APPOINTMENT.STATUS.V1',
      metadata: {
        updated_at: new Date().toISOString()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error posting reschedule:', error);
    return false;
  }
}

export async function confirmDraft(params: {
  organization_id: string;
  appointment_id: string;
  confirmed_by: string;
}): Promise<boolean> {
  try {
    // 1) Post status change event
    await postStatusChange({
      organization_id: params.organization_id,
      appointment_id: params.appointment_id,
      from_status: 'DRAFT',
      to_status: 'BOOKED',
      changed_by: params.confirmed_by
    });
    
    // 2) Patch header status to posted
    const patchResponse = await fetch(`/api/v1/universal_transactions/${params.appointment_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'posted'
      })
    });
    
    if (!patchResponse.ok) throw new Error('Failed to update header status');
    
    // 3) Update status DD to BOOKED
    await upsertDynamicData({
      entity_id: params.appointment_id,
      field_name: 'appointment_status',
      field_value_text: 'BOOKED',
      smart_code: 'HERA.SALON.APPOINTMENT.STATUS.V1',
      metadata: {
        updated_by: params.confirmed_by,
        updated_at: new Date().toISOString()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error confirming draft:', error);
    return false;
  }
}

export async function upsertKanbanRank(params: {
  appointment_id: string;
  column: KanbanStatus;
  rank: string;
  branch_id: string;
  date: string;
  organization_id: string;
}): Promise<boolean> {
  try {
    await upsertDynamicData({
      entity_id: params.appointment_id,
      field_name: 'kanban_rank',
      field_value_text: params.rank,
      smart_code: 'HERA.UI.KANBAN.RANK.V1',
      metadata: {
        column: params.column,
        branch_id: params.branch_id,
        date: params.date
      }
    });
    return true;
  } catch (error) {
    console.error('Error upserting kanban rank:', error);
    return false;
  }
}

// Helper functions for dynamic data
async function getDynamicData(params: {
  entity_id: string;
  field_name: string;
  smart_code: string;
  metadata?: any;
}): Promise<any> {
  // Mock implementation - replace with actual API call
  return null;
}

async function upsertDynamicData(params: {
  entity_id: string;
  field_name: string;
  field_value_text?: string;
  field_value_number?: number;
  smart_code: string;
  metadata?: any;
}): Promise<boolean> {
  // Mock implementation - replace with actual API call
  return true;
}