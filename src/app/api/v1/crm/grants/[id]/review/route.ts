import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ReviewGrantRequest, GrantApplicationDetail } from '@/types/crm-grants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Demo organization fallback
const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

function getOrgId(request: NextRequest): string {
  return request.headers.get('X-Organization-Id') || DEMO_ORG_ID;
}

// POST /api/crm/grants/[id]/review - Review grant application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = getOrgId(request);
    const applicationId = params.id;
    const body: ReviewGrantRequest = await request.json();

    // Get the current application
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', applicationId)
      .eq('entity_type', 'grant_application')
      .single();

    if (entityError || !entity) {
      return NextResponse.json(
        { error: 'Grant application not found' },
        { status: 404 }
      );
    }

    // Determine new status based on action
    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      award: 'awarded',
    };
    const newStatus = statusMap[body.action];

    // Prepare updated metadata
    const updatedMetadata = {
      ...entity.metadata,
      last_action_at: new Date().toISOString(),
      review_action: body.action,
      review_notes: body.notes,
    };

    // Add amount_awarded for award action
    if (body.action === 'award' && body.amount_awarded !== undefined) {
      updatedMetadata.amount_awarded = body.amount_awarded;
    }

    // Update the entity status and metadata
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        status: newStatus,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', orgId)
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating grant application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update grant application' },
        { status: 500 }
      );
    }

    // Store award amount in dynamic data if provided
    if (body.action === 'award' && body.amount_awarded !== undefined) {
      await supabase.from('core_dynamic_data').upsert({
        organization_id: orgId,
        entity_id: applicationId,
        field_name: 'amount_awarded',
        field_value_number: body.amount_awarded,
        smart_code: `${entity.smart_code}.AMOUNT_AWARDED`,
      });
    }

    // Store review notes in dynamic data if provided
    if (body.notes) {
      await supabase.from('core_dynamic_data').upsert({
        organization_id: orgId,
        entity_id: applicationId,
        field_name: 'review_notes',
        field_value_text: body.notes,
        smart_code: `${entity.smart_code}.REVIEW_NOTES`,
      });
    }

    // Log the review transaction
    const reviewTransactionCode = `GRANT-REVIEW-${Date.now()}`;
    await supabase.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'grant_application_reviewed',
      transaction_code: reviewTransactionCode,
      smart_code: `${entity.smart_code}.REVIEW`,
      subject_entity_id: applicationId,
      total_amount: body.amount_awarded || entity.metadata?.amount_requested || 0,
      metadata: {
        action: body.action,
        notes: body.notes,
        amount_awarded: body.amount_awarded,
        previous_status: entity.status,
        new_status: newStatus,
        reviewed_at: new Date().toISOString(),
      }
    });

    // If awarding, create a transaction line for the award amount
    if (body.action === 'award' && body.amount_awarded !== undefined) {
      await supabase.from('universal_transaction_lines').insert({
        organization_id: orgId,
        transaction_code: reviewTransactionCode,
        line_number: 1,
        line_amount: body.amount_awarded,
        smart_code: `${entity.smart_code}.AWARD_LINE`,
        metadata: {
          line_type: 'grant_award',
          applicant_id: entity.metadata?.applicant_id,
          round_id: entity.metadata?.round_id,
        }
      });
    }

    // Get the updated application to return
    const { data: updatedEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', applicationId)
      .single();

    // Get relationships for applicant and round details
    const { data: relationships } = await supabase
      .from('core_relationships')
      .select(`
        relationship_type,
        to_entity_id,
        core_entities!core_relationships_to_entity_id_fkey (
          id,
          entity_name,
          entity_code,
          entity_type,
          metadata
        )
      `)
      .eq('organization_id', orgId)
      .eq('from_entity_id', applicationId)
      .in('relationship_type', ['has_applicant', 'belongs_to_round']);

    const applicantRel = relationships?.find(r => r.relationship_type === 'has_applicant');
    const roundRel = relationships?.find(r => r.relationship_type === 'belongs_to_round');

    // Build the updated application response
    const application: GrantApplicationDetail = {
      id: updatedEntity?.id || applicationId,
      applicant: {
        id: applicantRel?.core_entities?.id || updatedEntity?.metadata?.applicant_id || '',
        type: updatedEntity?.metadata?.applicant_type || 'constituent',
        name: applicantRel?.core_entities?.entity_name || updatedEntity?.metadata?.applicant_name || `${updatedEntity?.metadata?.applicant_type} - ${updatedEntity?.metadata?.applicant_id}`,
      },
      round: {
        id: roundRel?.core_entities?.id || updatedEntity?.metadata?.round_id || '',
        round_code: roundRel?.core_entities?.entity_code || updatedEntity?.metadata?.round_code || `ROUND-${updatedEntity?.metadata?.round_id}`,
      },
      program: {
        id: updatedEntity?.metadata?.program_id || 'program-id',
        title: updatedEntity?.metadata?.program_title || 'Program Title',
        code: updatedEntity?.metadata?.program_code || 'PROG-CODE',
      },
      status: newStatus as any,
      amount_requested: updatedEntity?.metadata?.amount_requested,
      amount_awarded: updatedEntity?.metadata?.amount_awarded,
      score: updatedEntity?.metadata?.score,
      last_action_at: updatedEntity?.metadata?.last_action_at,
      summary: updatedEntity?.metadata?.summary,
      documents: updatedEntity?.metadata?.documents || [],
      tags: updatedEntity?.metadata?.tags || [],
      scoring: updatedEntity?.metadata?.scoring,
      pending_step: updatedEntity?.metadata?.pending_step,
      smart_code: updatedEntity?.smart_code || entity.smart_code,
      created_at: updatedEntity?.created_at || entity.created_at,
    };

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error reviewing grant application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}