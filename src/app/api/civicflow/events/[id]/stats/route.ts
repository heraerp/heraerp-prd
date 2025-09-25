import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { EventStats } from '@/types/events';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const eventId = params.id;
    
    // Get all invites for this event
    const { data: invites, error } = await supabase
      .from('core_entities')
      .select(`
        id,
        core_dynamic_data!inner(field_name, field_value_text),
        core_relationships!from_entity_id(
          to_entity_id
        )
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'event_invite')
      .eq('core_relationships.to_entity_id', eventId)
      .eq('core_relationships.relationship_type', 'invite_to_event');
    
    if (error) {
      throw error;
    }
    
    // Count by status
    let invitedCount = 0;
    let registeredCount = 0;
    let attendedCount = 0;
    let noShowCount = 0;
    let cancelledCount = 0;
    
    (invites || []).forEach(invite => {
      const statusField = invite.core_dynamic_data?.find(
        (d: any) => d.field_name === 'status'
      );
      const status = statusField?.field_value_text || 'invited';
      
      switch (status) {
        case 'invited':
          invitedCount++;
          break;
        case 'registered':
          registeredCount++;
          break;
        case 'attended':
          attendedCount++;
          break;
        case 'no_show':
          noShowCount++;
          break;
        case 'cancelled':
        case 'declined':
          cancelledCount++;
          break;
      }
    });
    
    const totalInvites = invites?.length || 0;
    
    const stats: EventStats = {
      invited_count: invitedCount,
      registered_count: registeredCount,
      attended_count: attendedCount,
      no_show_count: noShowCount,
      cancelled_count: cancelledCount,
      registration_rate: totalInvites > 0 
        ? (registeredCount / totalInvites) * 100 
        : 0,
      attendance_rate: registeredCount > 0
        ? (attendedCount / registeredCount) * 100
        : 0,
      no_show_rate: registeredCount > 0
        ? (noShowCount / registeredCount) * 100
        : 0,
      capacity_filled: 0, // Will be calculated if event has capacity
    };
    
    // Get event capacity
    const { data: event } = await supabase
      .from('core_entities')
      .select(`
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'event')
      .single();
    
    if (event) {
      const capacityField = event.core_dynamic_data?.find(
        (d: any) => d.field_name === 'capacity'
      );
      const capacity = capacityField?.field_value_number;
      
      if (capacity && capacity > 0) {
        stats.capacity_filled = (registeredCount / capacity) * 100;
      }
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event statistics' },
      { status: 500 }
    );
  }
}