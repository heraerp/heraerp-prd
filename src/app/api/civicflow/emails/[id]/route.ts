import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get individual email by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = req.headers.get('x-organization-id');
    const emailId = params.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }


    // Get email entity with dynamic data
    const { data: emailEntity, error: queryError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        entity_code,
        created_at,
        updated_at,
        core_dynamic_data(
          field_name,
          field_value_text,
          field_value_boolean,
          field_value_json
        )
      `)
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_message')
      .single();

    if (queryError || !emailEntity) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Transform entity into email format
    const dynamicData = emailEntity.core_dynamic_data || [];
    const getField = (fieldName: string) => {
      const field = dynamicData.find((d: any) => d.field_name === fieldName);
      return field?.field_value_text || field?.field_value_json || field?.field_value_boolean;
    };

    const email = {
      id: emailEntity.id,
      subject: getField('subject') || emailEntity.entity_name || '(no subject)',
      from: getField('from') || '',
      to: getField('to') || [],
      cc: getField('cc') || [],
      bcc: getField('bcc') || [],
      body_html: getField('body_html') || '',
      body_text: getField('body_text') || '',
      direction: getField('direction') as 'in' | 'out',
      status: getField('status') || 'unread',
      priority: getField('priority') || 'normal',
      thread_id: getField('thread_id'),
      tags: getField('tags') || [],
      has_attachments: getField('has_attachments') === true,
      is_starred: getField('is_starred') === true,
      created_at: emailEntity.created_at,
      updated_at: emailEntity.updated_at
    };

    // Mark as read if it was unread
    if (email.status === 'unread' && email.direction === 'in') {
      await supabase
        .from('core_dynamic_data')
        .update({ field_value_text: 'read' })
        .eq('entity_id', emailId)
        .eq('field_name', 'status');

      // Log read transaction
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'email_read',
          transaction_code: `EMAIL-READ-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.COMM.MESSAGE.READ.V1',
          reference_entity_id: emailId,
          total_amount: 0,
          metadata: {
            message_id: emailId,
            timestamp: new Date().toISOString()
          }
        });

      email.status = 'read';
    }

    return NextResponse.json({
      email
    });

  } catch (error: any) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update email (move, star, flag, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = req.headers.get('x-organization-id');
    const emailId = params.id;
    const body = await req.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const {
      status,
      is_starred,
      is_flagged,
      tags,
      priority,
      folder
    } = body;

    // Verify email exists
    const { data: emailEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_message')
      .single();

    if (!emailEntity) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Prepare updates
    const updates: Array<{
      field_name: string;
      field_value_text?: string;
      field_value_boolean?: boolean;
      field_value_json?: any;
    }> = [];

    if (status !== undefined) {
      updates.push({
        field_name: 'status',
        field_value_text: status
      });
    }

    if (is_starred !== undefined) {
      updates.push({
        field_name: 'is_starred',
        field_value_boolean: is_starred
      });
    }

    if (is_flagged !== undefined) {
      updates.push({
        field_name: 'is_flagged',
        field_value_boolean: is_flagged
      });
    }

    if (tags !== undefined) {
      updates.push({
        field_name: 'tags',
        field_value_json: tags
      });
    }

    if (priority !== undefined) {
      updates.push({
        field_name: 'priority',
        field_value_text: priority
      });
    }

    // Apply updates
    for (const update of updates) {
      await supabase
        .from('core_dynamic_data')
        .upsert({
          organization_id: organizationId,
          entity_id: emailId,
          field_name: update.field_name,
          field_value_text: update.field_value_text,
          field_value_boolean: update.field_value_boolean,
          field_value_json: update.field_value_json,
          smart_code: `HERA.PUBLICSECTOR.COMM.MESSAGE.FIELD.${update.field_name.toUpperCase()}.V1`
        });
    }

    // Log update transaction
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'email_updated',
        transaction_code: `EMAIL-UPDATE-${Date.now()}`,
        smart_code: 'HERA.PUBLICSECTOR.COMM.MESSAGE.UPDATED.V1',
        reference_entity_id: emailId,
        total_amount: 0,
        metadata: {
          message_id: emailId,
          updates: Object.keys(body),
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Failed to update email', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete email (move to trash)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = req.headers.get('x-organization-id');
    const emailId = params.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify email exists
    const { data: emailEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_message')
      .single();

    if (!emailEntity) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Move to trash (update status)
    await supabase
      .from('core_dynamic_data')
      .upsert({
        organization_id: organizationId,
        entity_id: emailId,
        field_name: 'status',
        field_value_text: 'deleted',
        smart_code: 'HERA.PUBLICSECTOR.COMM.MESSAGE.FIELD.STATUS.V1'
      });

    // Log deletion transaction
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'email_deleted',
        transaction_code: `EMAIL-DELETE-${Date.now()}`,
        smart_code: 'HERA.PUBLICSECTOR.COMM.MESSAGE.DELETED.V1',
        reference_entity_id: emailId,
        total_amount: 0,
        metadata: {
          message_id: emailId,
          action: 'moved_to_trash',
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Email moved to trash'
    });

  } catch (error: any) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: 'Failed to delete email', details: error.message },
      { status: 500 }
    );
  }
}