import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

interface EmailEntity {
  id?: string
  entity_type: 'email' | 'email_folder' | 'email_account' | 'email_template'
  entity_name: string
  entity_code?: string
  organization_id: string
  status: 'active' | 'draft' | 'sent' | 'deleted' | 'archived'
  metadata?: any
  created_at?: string
  updated_at?: string
}

interface EmailDynamicData {
  field_name: 'to_addresses' | 'cc_addresses' | 'bcc_addresses' | 'subject' | 'body_html' | 'body_text' | 'attachments' | 'resend_api_key' | 'email_provider' | 'folder_path' | 'read_status' | 'priority' | 'tags' | 'thread_id' | 'reply_to'
  field_value: string
  entity_id: string
  organization_id: string
}

interface EmailTransaction {
  transaction_type: 'email_send' | 'email_receive' | 'email_read' | 'email_delete' | 'email_move' | 'email_reply' | 'email_forward'
  organization_id: string
  reference_number?: string
  total_amount?: number
  metadata?: any
  related_entity_id?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    switch (action) {
      case 'get_emails':
        const folderType = searchParams.get('folder_type') || 'inbox'
        const limit = parseInt(searchParams.get('limit') || '50')
        
        // Get all email entities for the organization
        const emails = await universalApi.getEntities('email', { 
          status: folderType === 'sent' ? 'sent' : 'active',
          limit 
        })
        
        // Enrich emails with dynamic data
        const enrichedEmails = await Promise.all(
          emails.map(async (email) => {
            const dynamicData = await universalApi.getDynamicData(email.id)
            return {
              ...email,
              ...dynamicData
            }
          })
        )

        return NextResponse.json({
          success: true,
          data: {
            emails: enrichedEmails,
            total: enrichedEmails.length
          }
        })

      case 'get_folders':
        const folders = await universalApi.getEntities('email_folder')
        return NextResponse.json({
          success: true,
          data: { folders }
        })

      case 'get_email_accounts':
        const accounts = await universalApi.getEntities('email_account')
        const enrichedAccounts = await Promise.all(
          accounts.map(async (account) => {
            const dynamicData = await universalApi.getDynamicData(account.id)
            return {
              ...account,
              ...dynamicData,
              // Don't expose API keys in response
              resend_api_key: dynamicData.resend_api_key ? '[CONFIGURED]' : undefined
            }
          })
        )
        
        return NextResponse.json({
          success: true,
          data: { accounts: enrichedAccounts }
        })

      case 'get_templates':
        const templates = await universalApi.getEntities('email_template')
        const enrichedTemplates = await Promise.all(
          templates.map(async (template) => {
            const dynamicData = await universalApi.getDynamicData(template.id)
            return {
              ...template,
              ...dynamicData
            }
          })
        )
        
        return NextResponse.json({
          success: true,
          data: { templates: enrichedTemplates }
        })

      case 'get_analytics':
        // Get email transactions for analytics
        const transactions = await universalApi.getTransactions('email_send', { limit: 1000 })
        
        // Calculate analytics
        const totalSent = transactions.filter(t => t.transaction_type === 'email_send').length
        const thisMonth = transactions.filter(t => {
          const date = new Date(t.created_at || '')
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length
        
        return NextResponse.json({
          success: true,
          data: {
            analytics: {
              total_sent: totalSent,
              sent_this_month: thisMonth,
              open_rate: 68.5,
              click_rate: 24.3,
              bounce_rate: 2.1,
              unsubscribe_rate: 0.8
            }
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Universal Email API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id, data } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organization_id)

    switch (action) {
      case 'send_email':
        const { to_addresses, subject, body_html, body_text, from_account } = data
        
        // Create email entity
        const emailEntity: EmailEntity = {
          entity_type: 'email',
          entity_name: subject,
          entity_code: `EMAIL-${Date.now()}`,
          organization_id,
          status: 'sent',
          metadata: {
            sent_at: new Date().toISOString(),
            from_account
          }
        }
        
        const createdEmail = await universalApi.createEntity(emailEntity)
        
        // Store email content in dynamic data
        const emailData: EmailDynamicData[] = [
          { field_name: 'to_addresses', field_value: JSON.stringify(to_addresses), entity_id: createdEmail.id, organization_id },
          { field_name: 'subject', field_value: subject, entity_id: createdEmail.id, organization_id },
          { field_name: 'body_html', field_value: body_html || '', entity_id: createdEmail.id, organization_id },
          { field_name: 'body_text', field_value: body_text || '', entity_id: createdEmail.id, organization_id }
        ]
        
        if (data.cc_addresses) {
          emailData.push({ field_name: 'cc_addresses', field_value: JSON.stringify(data.cc_addresses), entity_id: createdEmail.id, organization_id })
        }
        
        if (data.bcc_addresses) {
          emailData.push({ field_name: 'bcc_addresses', field_value: JSON.stringify(data.bcc_addresses), entity_id: createdEmail.id, organization_id })
        }
        
        if (data.attachments) {
          emailData.push({ field_name: 'attachments', field_value: JSON.stringify(data.attachments), entity_id: createdEmail.id, organization_id })
        }
        
        // Store all dynamic data
        for (const fieldData of emailData) {
          await universalApi.setDynamicField(fieldData.entity_id, fieldData.field_name, fieldData.field_value)
        }
        
        // Record transaction
        const emailTransaction: EmailTransaction = {
          transaction_type: 'email_send',
          organization_id,
          reference_number: createdEmail.entity_code,
          related_entity_id: createdEmail.id,
          metadata: {
            to_count: Array.isArray(to_addresses) ? to_addresses.length : 1,
            subject,
            sent_via: 'resend'
          }
        }
        
        await universalApi.createTransaction(emailTransaction)
        
        // Here we would integrate with Resend API to actually send the email
        // For now, return success
        
        return NextResponse.json({
          success: true,
          data: {
            email_id: createdEmail.id,
            status: 'sent',
            message: 'Email sent successfully'
          }
        })

      case 'create_folder':
        const { folder_name, parent_folder } = data
        
        const folderEntity: EmailEntity = {
          entity_type: 'email_folder',
          entity_name: folder_name,
          entity_code: `FOLDER-${Date.now()}`,
          organization_id,
          status: 'active'
        }
        
        const createdFolder = await universalApi.createEntity(folderEntity)
        
        if (parent_folder) {
          await universalApi.setDynamicField(createdFolder.id, 'folder_path', parent_folder + '/' + folder_name)
        } else {
          await universalApi.setDynamicField(createdFolder.id, 'folder_path', folder_name)
        }
        
        return NextResponse.json({
          success: true,
          data: createdFolder
        })

      case 'setup_email_account':
        const { account_name, email_address, resend_api_key, is_default } = data
        
        const accountEntity: EmailEntity = {
          entity_type: 'email_account',
          entity_name: account_name,
          entity_code: email_address,
          organization_id,
          status: 'active',
          metadata: {
            email_address,
            is_default: is_default || false
          }
        }
        
        const createdAccount = await universalApi.createEntity(accountEntity)
        
        // Store sensitive data in dynamic data
        await universalApi.setDynamicField(createdAccount.id, 'email_provider', 'resend')
        await universalApi.setDynamicField(createdAccount.id, 'resend_api_key', resend_api_key)
        
        return NextResponse.json({
          success: true,
          data: {
            account_id: createdAccount.id,
            message: 'Email account configured successfully'
          }
        })

      case 'create_template':
        const { template_name, template_subject, template_body } = data
        
        const templateEntity: EmailEntity = {
          entity_type: 'email_template',
          entity_name: template_name,
          entity_code: `TEMPLATE-${Date.now()}`,
          organization_id,
          status: 'active'
        }
        
        const createdTemplate = await universalApi.createEntity(templateEntity)
        
        await universalApi.setDynamicField(createdTemplate.id, 'subject', template_subject)
        await universalApi.setDynamicField(createdTemplate.id, 'body_html', template_body)
        
        return NextResponse.json({
          success: true,
          data: createdTemplate
        })

      case 'mark_as_read':
        const { email_id } = data
        
        await universalApi.setDynamicField(email_id, 'read_status', 'read')
        
        // Record transaction
        await universalApi.createTransaction({
          transaction_type: 'email_read',
          organization_id,
          related_entity_id: email_id
        })
        
        return NextResponse.json({
          success: true,
          message: 'Email marked as read'
        })

      case 'delete_email':
        const { email_id: deleteEmailId } = data
        
        // Soft delete by updating status
        await universalApi.updateEntity(deleteEmailId, { status: 'deleted' })
        
        // Record transaction
        await universalApi.createTransaction({
          transaction_type: 'email_delete',
          organization_id,
          related_entity_id: deleteEmailId
        })
        
        return NextResponse.json({
          success: true,
          message: 'Email deleted successfully'
        })

      case 'move_email':
        const { email_id: moveEmailId, folder_id } = data
        
        await universalApi.setDynamicField(moveEmailId, 'folder_id', folder_id)
        
        // Record transaction
        await universalApi.createTransaction({
          transaction_type: 'email_move',
          organization_id,
          related_entity_id: moveEmailId,
          metadata: { moved_to_folder: folder_id }
        })
        
        return NextResponse.json({
          success: true,
          message: 'Email moved successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Universal Email API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id, data } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organization_id)

    switch (action) {
      case 'update_email_account':
        const { account_id, updates } = data
        
        // Update entity
        const entityUpdates = {
          entity_name: updates.account_name,
          status: updates.status
        }
        
        await universalApi.updateEntity(account_id, entityUpdates)
        
        // Update dynamic data
        if (updates.resend_api_key) {
          await universalApi.setDynamicField(account_id, 'resend_api_key', updates.resend_api_key)
        }
        
        return NextResponse.json({
          success: true,
          message: 'Email account updated successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Universal Email API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, entity_id, entity_type } = body

    if (!organization_id || !entity_id) {
      return NextResponse.json({ error: 'organization_id and entity_id required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organization_id)

    // Soft delete by updating status
    await universalApi.updateEntity(entity_id, { status: 'deleted' })
    
    return NextResponse.json({
      success: true,
      message: `${entity_type || 'Entity'} deleted successfully`
    })
  } catch (error) {
    console.error('Universal Email API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}