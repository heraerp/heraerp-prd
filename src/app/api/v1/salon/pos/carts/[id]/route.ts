import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api-v2'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(organizationId)

    // Fetch cart transaction
    const cartResult = await universalApi.read('universal_transactions', {
      id: params.id,
      organization_id: organizationId,
      transaction_type: 'pos_cart'
    })

    if (!cartResult.success || !cartResult.data?.length) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    const cart = cartResult.data[0]
    
    // Fetch cart lines
    const linesResult = await universalApi.read('universal_transaction_lines', {
      transaction_id: params.id,
      organization_id: organizationId
    })

    const lines = linesResult.data || []

    // Map lines with service details
    const mappedLines = await Promise.all(
      lines.map(async (line) => {
        let serviceName = line.metadata?.service_name || 'Service'
        let serviceCode = ''
        let serviceDuration = line.metadata?.duration_min || 30
        
        if (line.line_entity_id) {
          const serviceResult = await universalApi.read('core_entities', {
            id: line.line_entity_id,
            organization_id: organizationId
          })
          if (serviceResult.data?.length) {
            const service = serviceResult.data[0]
            serviceName = service.entity_name
            serviceCode = service.entity_code
            serviceDuration = service.metadata?.duration || serviceDuration
          }
        }

        return {
          line_id: line.id,
          entity_ref: line.line_entity_id,
          name: serviceName,
          code: serviceCode,
          smart_code: line.smart_code,
          qty: line.quantity,
          unit_price: line.unit_price,
          line_total: line.line_amount,
          staff_split: line.metadata?.staff_split || [],
          dynamic: {
            appointment_line_id: line.metadata?.appointment_line_id,
            duration_min: serviceDuration,
            source: line.metadata?.source || 'MANUAL'
          }
        }
      })
    )

    // Fetch relationships
    const relationshipsResult = await universalApi.read('core_relationships', {
      from_entity_id: params.id,
      organization_id: organizationId
    })

    const relationships: any = {}
    if (relationshipsResult.data) {
      for (const rel of relationshipsResult.data) {
        relationships[rel.relationship_type] = rel.to_entity_id
        
        // Fetch entity details for BILLS_TO relationship
        if (rel.relationship_type === 'BILLS_TO' && rel.to_entity_id) {
          const customerResult = await universalApi.read('core_entities', {
            id: rel.to_entity_id,
            organization_id: organizationId
          })
          if (customerResult.data?.length) {
            const customer = customerResult.data[0]
            relationships['BILLS_TO_DETAILS'] = {
              id: customer.id,
              name: customer.entity_name,
              code: customer.entity_code,
              phone: customer.metadata?.phone,
              email: customer.metadata?.email
            }
          }
        }
      }
    }

    // Build response
    const response = {
      cart: {
        id: cart.id,
        code: cart.transaction_code,
        smart_code: cart.smart_code,
        organization_id: cart.organization_id,
        appointment_id: cart.metadata?.appointment_id,
        status: cart.metadata?.state || 'ACTIVE',
        relationships,
        lines: mappedLines,
        pricing_summary: cart.metadata?.pricing_summary || {
          subtotal: cart.total_amount,
          discounts: 0,
          tax: 0,
          tip: 0,
          total: cart.total_amount
        },
        metadata: {
          customer_id: cart.metadata?.customer_id,
          stylist_id: cart.metadata?.stylist_id,
          chair_id: cart.metadata?.chair_id,
          created_at: cart.created_at,
          updated_at: cart.updated_at
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}