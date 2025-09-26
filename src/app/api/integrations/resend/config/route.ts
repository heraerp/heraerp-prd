import { NextRequest, NextResponse } from 'next/server'
import { encryptedConfigService } from '@/lib/security/encrypted-config-service'
import { multiTenantResendService } from '@/lib/services/multitenant-resend-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get current configuration (without sensitive data)
export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get connector configuration
    const connector = await multiTenantResendService.getOrganizationConnector(organizationId)

    if (!connector) {
      return NextResponse.json({
        configured: false,
        setup_required: true
      })
    }

    // Check if API key is configured (without returning the key)
    const hasApiKey = (await encryptedConfigService.getResendApiKey(organizationId)) !== null

    return NextResponse.json({
      configured: true,
      connector: {
        id: connector.id,
        status: connector.status,
        from_email: connector.from_email,
        rate_limit: connector.rate_limit,
        encryption_enabled: connector.encryption_enabled
      },
      api_key_configured: hasApiKey,
      setup_complete: connector.status === 'active' && hasApiKey
    })
  } catch (error: any) {
    console.error('Error getting configuration:', error)
    return NextResponse.json(
      { error: 'Failed to get configuration', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Update configuration
export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const { api_key, from_email, rate_limit, activate = true } = body

    // Validate API key format
    if (api_key && !api_key.startsWith('re_')) {
      return NextResponse.json(
        { error: 'Invalid Resend API key format. Keys should start with "re_"' },
        { status: 400 }
      )
    }

    // Validate email format
    if (from_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(from_email)) {
        return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
      }
    }

    // Get existing connector
    const connector = await multiTenantResendService.getOrganizationConnector(organizationId)

    if (!connector) {
      return NextResponse.json(
        { error: 'Resend connector not found. Please run setup first.' },
        { status: 404 }
      )
    }

    // Store encrypted API key if provided
    if (api_key) {
      await encryptedConfigService.storeResendApiKey(organizationId, api_key)

      // Invalidate cached client to force re-initialization
      await multiTenantResendService.invalidateClient(organizationId)
    }

    // Update dynamic configuration
    const updates: any[] = []

    if (from_email) {
      updates.push({
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'from_email',
        field_value_text: from_email,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.FROM_EMAIL.V1'
      })
    }

    if (rate_limit !== undefined) {
      updates.push({
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'rate_limit_per_hour',
        field_value_number: rate_limit,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.RATE_LIMIT.V1'
      })
    }

    // Update status if activating
    if (activate && api_key) {
      // Test the API key first
      const testResult = await multiTenantResendService.testConnection(organizationId)

      if (!testResult.success) {
        return NextResponse.json(
          {
            error: 'API key test failed',
            details: testResult.details,
            api_key_saved: !!api_key // API key was saved but connection failed
          },
          { status: 400 }
        )
      }

      // Update connector status
      await supabase.from('core_entities').update({ status: 'active' }).eq('id', connector.id)

      updates.push({
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'status',
        field_value_text: 'active',
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.STATUS.V1'
      })
    }

    // Apply dynamic data updates
    if (updates.length > 0) {
      await supabase.from('core_dynamic_data').upsert(updates)
    }

    // Clear cache to ensure fresh data
    await multiTenantResendService.invalidateClient(organizationId)

    // Log configuration event
    await supabase.from('universal_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'config_update',
      transaction_code: `RESEND-CONFIG-${Date.now()}`,
      smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.UPDATE.V1',
      reference_entity_id: connector.id,
      total_amount: 0,
      metadata: {
        connector_type: 'resend',
        fields_updated: updates.map(u => u.field_name),
        activated: activate && api_key,
        timestamp: new Date().toISOString()
      }
    })

    // Get updated configuration
    const updatedConnector = await multiTenantResendService.getOrganizationConnector(organizationId)

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      connector: {
        id: updatedConnector?.id,
        status: updatedConnector?.status,
        from_email: updatedConnector?.from_email,
        rate_limit: updatedConnector?.rate_limit
      },
      api_key_configured:
        !!api_key || (await encryptedConfigService.getResendApiKey(organizationId)) !== null
    })
  } catch (error: any) {
    console.error('Error updating configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove configuration and deactivate
export async function DELETE(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get connector
    const connector = await multiTenantResendService.getOrganizationConnector(organizationId)

    if (!connector) {
      return NextResponse.json({ error: 'Resend connector not found' }, { status: 404 })
    }

    // Delete encrypted API key
    await encryptedConfigService.deleteConfig(organizationId, 'RESEND_API_KEY')

    // Update connector status to inactive
    await supabase.from('core_entities').update({ status: 'inactive' }).eq('id', connector.id)

    // Update status in dynamic data
    await supabase.from('core_dynamic_data').upsert({
      organization_id: organizationId,
      entity_id: connector.id,
      field_name: 'status',
      field_value_text: 'inactive',
      smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.STATUS.V1'
    })

    // Clear cached client
    await multiTenantResendService.invalidateClient(organizationId)

    // Log deactivation event
    await supabase.from('universal_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'config_delete',
      transaction_code: `RESEND-DEACTIVATE-${Date.now()}`,
      smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.DELETE.V1',
      reference_entity_id: connector.id,
      total_amount: 0,
      metadata: {
        connector_type: 'resend',
        action: 'deactivated',
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Resend connector deactivated and API key removed'
    })
  } catch (error: any) {
    console.error('Error deleting configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete configuration', details: error.message },
      { status: 500 }
    )
  }
}
