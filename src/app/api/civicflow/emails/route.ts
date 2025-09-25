import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo-guard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type EmailFolder = 'inbox' | 'outbox' | 'drafts' | 'sent' | 'trash';

// GET - List emails by folder
export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id');
    const { searchParams } = new URL(req.url);
    
    const folder = searchParams.get('folder') as EmailFolder || 'inbox';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Build filter conditions based on folder
    let statusFilter: string[] = [];
    let directionFilter: string | null = null;

    switch (folder) {
      case 'inbox':
        directionFilter = 'in';
        statusFilter = ['delivered', 'read', 'unread'];
        break;
      case 'outbox':
        directionFilter = 'out';
        statusFilter = ['queued'];
        break;
      case 'drafts':
        statusFilter = ['draft'];
        break;
      case 'sent':
        directionFilter = 'out';
        statusFilter = ['sent', 'delivered'];
        break;
      case 'trash':
        statusFilter = ['deleted'];
        break;
    }

    // Query comm_message entities
    let query = supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        created_at,
        updated_at,
        core_dynamic_data!inner(
          field_name,
          field_value_text,
          field_value_boolean,
          field_value_json
        )
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_message')
      .order('created_at', { ascending: false });

    const { data: emailEntities, error: queryError } = await query
      .range(offset, offset + limit - 1);

    if (queryError) {
      throw queryError;
    }

    // Transform entities into email format
    const emails = emailEntities?.map(entity => {
      const dynamicData = entity.core_dynamic_data || [];
      const getField = (fieldName: string) => {
        const field = dynamicData.find((d: any) => d.field_name === fieldName);
        return field?.field_value_text || field?.field_value_json || field?.field_value_boolean;
      };

      const direction = getField('direction') as 'in' | 'out';
      const status = getField('status') || 'unread';
      
      // Apply folder filters
      if (directionFilter && direction !== directionFilter) return null;
      if (statusFilter.length > 0 && !statusFilter.includes(status)) return null;

      // Apply search filter
      const subject = getField('subject') || '';
      const bodyText = getField('body_text') || '';
      const from = getField('from') || '';
      if (search && ![subject, bodyText, from].some(field => 
        field.toLowerCase().includes(search.toLowerCase())
      )) {
        return null;
      }

      return {
        id: entity.id,
        subject: getField('subject') || '(no subject)',
        from: getField('from') || '',
        to: getField('to') || [],
        cc: getField('cc') || [],
        bcc: getField('bcc') || [],
        body_html: getField('body_html') || '',
        body_text: getField('body_text') || '',
        direction,
        status,
        priority: getField('priority') || 'normal',
        thread_id: getField('thread_id'),
        tags: getField('tags') || [],
        has_attachments: getField('has_attachments') === true,
        is_starred: getField('is_starred') === true,
        created_at: entity.created_at,
        updated_at: entity.updated_at
      };
    }).filter(Boolean) || [];

    // Get total count for pagination
    const { count } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_message');


    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      demo_mode: isDemoMode(organizationId)
    });

  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create/Send email
export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id');
    const body = await req.json();
    
    const {
      to,
      cc = [],
      bcc = [],
      subject,
      body_html = '',
      body_text,
      priority = 'normal',
      tags = [],
      is_draft = false,
      thread_id = null
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!is_draft) {
      if (!to || to.length === 0) {
        return NextResponse.json(
          { error: 'Recipients are required for sending email' },
          { status: 400 }
        );
      }
    }

    // Create comm_message entity
    const { data: messageEntity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'comm_message',
        entity_name: subject || '(no subject)',
        entity_code: `MSG-${Date.now()}`,
        smart_code: is_draft 
          ? 'HERA.PUBLICSECTOR.COMM.MESSAGE.DRAFT.CREATED.V1'
          : 'HERA.PUBLICSECTOR.COMM.MESSAGE.SENT.V1',
        status: is_draft ? 'draft' : 'active'
      })
      .select()
      .single();

    if (entityError) {
      throw entityError;
    }

    // Store email data in core_dynamic_data
    const emailFields = [
      { field_name: 'subject', field_value_text: subject },
      { field_name: 'body_html', field_value_text: body_html },
      { field_name: 'body_text', field_value_text: body_text },
      { field_name: 'direction', field_value_text: 'out' },
      { field_name: 'status', field_value_text: is_draft ? 'draft' : 'queued' },
      { field_name: 'priority', field_value_text: priority },
      { field_name: 'to', field_value_json: to },
      { field_name: 'cc', field_value_json: cc },
      { field_name: 'bcc', field_value_json: bcc },
      { field_name: 'tags', field_value_json: tags },
      { field_name: 'thread_id', field_value_text: thread_id },
      { field_name: 'has_attachments', field_value_boolean: false }
    ].filter(field => field.field_value_text !== undefined || 
                     field.field_value_json !== undefined || 
                     field.field_value_boolean !== undefined);

    const dynamicDataInserts = emailFields.map(field => ({
      organization_id: organizationId,
      entity_id: messageEntity.id,
      field_name: field.field_name,
      field_value_text: field.field_value_text,
      field_value_json: field.field_value_json,
      field_value_boolean: field.field_value_boolean,
      smart_code: `HERA.PUBLICSECTOR.COMM.MESSAGE.FIELD.${field.field_name.toUpperCase()}.V1`
    }));

    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicDataInserts);

    if (dynamicError) {
      throw dynamicError;
    }

    // Log transaction
    const transactionType = is_draft ? 'draft_created' : 'email_queued';
    const smartCode = is_draft 
      ? 'HERA.PUBLICSECTOR.COMM.MESSAGE.DRAFT.SAVED.V1'
      : 'HERA.PUBLICSECTOR.COMM.MESSAGE.QUEUED.V1';

    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: transactionType,
        transaction_code: `EMAIL-${Date.now()}`,
        smart_code: smartCode,
        reference_entity_id: messageEntity.id,
        total_amount: 0,
        metadata: {
          message_id: messageEntity.id,
          subject,
          recipients_count: to.length,
          is_draft,
          timestamp: new Date().toISOString()
        }
      });

    // If not a draft, attempt to send via Resend
    if (!is_draft && !isDemoMode(organizationId)) {
      try {
        const sendResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/integrations/resend/multitenant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': organizationId
          },
          body: JSON.stringify({
            to,
            cc,
            bcc,
            subject,
            html: body_html,
            text: body_text,
            tags: tags.map((tag: string) => ({ name: 'tag', value: tag }))
          })
        });

        if (sendResponse.ok) {
          const sendResult = await sendResponse.json();
          
          // Update status to sent
          await supabase
            .from('core_dynamic_data')
            .update({ field_value_text: 'sent' })
            .eq('entity_id', messageEntity.id)
            .eq('field_name', 'status');

          // Log sent transaction
          await supabase
            .from('universal_transactions')
            .insert({
              organization_id: organizationId,
              transaction_type: 'email_sent',
              transaction_code: `EMAIL-SENT-${Date.now()}`,
              smart_code: 'HERA.PUBLICSECTOR.COMM.MESSAGE.SENT.V1',
              reference_entity_id: messageEntity.id,
              total_amount: 0,
              metadata: {
                message_id: messageEntity.id,
                resend_message_id: sendResult.messageId,
                timestamp: new Date().toISOString()
              }
            });
        }
      } catch (sendError) {
        console.error('Failed to send email via Resend:', sendError);
        // Update status to failed
        await supabase
          .from('core_dynamic_data')
          .update({ field_value_text: 'failed' })
          .eq('entity_id', messageEntity.id)
          .eq('field_name', 'status');
      }
    }

    return NextResponse.json({
      success: true,
      message_id: messageEntity.id,
      status: is_draft ? 'draft_saved' : 'queued'
    });

  } catch (error: any) {
    console.error('Error creating email:', error);
    return NextResponse.json(
      { error: 'Failed to create email', details: error.message },
      { status: 500 }
    );
  }
}