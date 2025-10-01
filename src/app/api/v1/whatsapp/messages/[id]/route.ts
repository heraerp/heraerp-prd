import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const organizationId =
    process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
  const resolvedParams = await params
  const messageId = resolvedParams.id

  try {
    const body = await request.json()
    const { action, value } = body

    switch (action) {
      case 'star':
        // Create star relationship
        await supabase.from('core_relationships').insert({
          organization_id: organizationId,
          from_entity_id: messageId,
          to_entity_id: messageId,
          relationship_type: 'starred_message',
          smart_code: 'HERA.WHATSAPP.MSG.STARRED.V1',
          metadata: { starred_at: new Date().toISOString() }
        })
        break

      case 'unstar':
        // Remove star relationship
        await supabase
          .from('core_relationships')
          .delete()
          .eq('from_entity_id', messageId)
          .eq('relationship_type', 'starred_message')
          .eq('organization_id', organizationId)
        break

      case 'markRead':
        // Update message status to read
        const { data: message } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('id', messageId)
          .eq('organization_id', organizationId)
          .single()

        if (message) {
          await supabase
            .from('universal_transactions')
            .update({
              metadata: {
                ...message.metadata,
                status: 'read',
                read_at: new Date().toISOString(),
                status_history: [
                  ...((message.metadata as any)?.status_history || []),
                  {
                    status: 'read',
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            })
            .eq('id', messageId)
            .eq('organization_id', organizationId)
        }
        break

      case 'delete':
        // Soft delete by updating metadata
        await supabase
          .from('universal_transactions')
          .update({
            metadata: {
              deleted: true,
              deleted_at: new Date().toISOString()
            }
          })
          .eq('id', messageId)
          .eq('organization_id', organizationId)
        break
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const organizationId =
    process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
  const resolvedParams = await params
  const messageId = resolvedParams.id

  try {
    // Hard delete message
    await supabase
      .from('universal_transactions')
      .delete()
      .eq('id', messageId)
      .eq('organization_id', organizationId)

    // Also delete any related relationships
    await supabase
      .from('core_relationships')
      .delete()
      .or(`from_entity_id.eq.${messageId},to_entity_id.eq.${messageId}`)
      .eq('organization_id', organizationId)

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
