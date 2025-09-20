import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { universalApi } from '@/lib/universal-api-v2'
import { isPlaybookModeEnabled, runPlaybook } from '@/lib/playbook-adapter'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const idemKey = headersList.get('Idempotency-Key') ?? undefined
    const body = await request.json()
    const { appointment_id, organization_id, idempotency_key, customer_id, stylist_id, chair_slug, dynamic } = body
    
    // Use header idempotency key if not in body
    const finalIdemKey = idemKey || idempotency_key
    
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Feature flag gate
    const usePlaybook = await isPlaybookModeEnabled('pos_cart', organization_id)

    // ---- Playbook path (Hair Talkz canary) ----
    if (usePlaybook) {
      // Map legacy payload → universal header.create
      const payload = {
        organization_id,
        header_smart_code: 'HERA.SALON.POS.CART.ACTIVE.V1',
        // Relationships are optional; include when available so Step 1 links remain intact
        relationships: {
          ...(appointment_id ? { ORIGINATES_FROM: { type: 'appointment', id: appointment_id } } : {}),
          ...(customer_id ? { BILLS_TO: { type: 'customer', id: customer_id } } : {}),
          ...(stylist_id ? { PERFORMED_BY: { type: 'staff', id: stylist_id } } : {}),
        },
        dynamic: {
          ...(dynamic ?? {}),
          chair_slug: chair_slug ?? (dynamic?.chair_slug ?? null),
          source: 'POS_UI',
          appointment_id,
        },
      }

      try {
        const out = await runPlaybook('HERA.UNIV.TXN.HEADER.CREATE.V1', payload, { 
          idempotencyKey: finalIdemKey 
        })
        
        console.log('Playbook response:', JSON.stringify(out, null, 2))
        
        // Normalize response to legacy shape expected by UI
        // The playbook returns { success, data: { transaction: {...} } }
        const transaction = out?.data?.transaction
        const cartId = transaction?.id
        const cartMetadata = transaction?.metadata ?? {}
        
        if (!cartId) {
          console.error('Full playbook output:', out)
          throw new Error('No cart ID returned from playbook')
        }
        
        return NextResponse.json({
          cart: {
            id: cartId,
            appointment_id: appointment_id ?? cartMetadata?.appointment_id ?? null,
            status: 'active',
            items: [],
            totals: { subtotal: 0, discount: 0, total: 0 },
            metadata: cartMetadata,
          },
          _mode: 'playbook',
        })
      } catch (e: any) {
        console.error('Playbook cart creation failed:', e)
        return NextResponse.json(
          { error: e?.message ?? 'Cart create failed (playbook)' },
          { status: 422 },
        )
      }
    }

    // ---- Legacy path (default) ----
    // [Keep all existing code below unchanged]
    
    // For appointment-based cart creation, keep existing logic
    if (!appointment_id) {
      return NextResponse.json(
        { error: 'appointment_id is required for legacy path' },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(organization_id)

    // Check for existing cart with idempotency key
    if (idempotency_key) {
      const existingCartResult = await universalApi.read('universal_transactions', {
        organization_id,
        transaction_type: 'pos_cart',
        metadata: { idempotency_key }
      })
      
      if (existingCartResult.data?.length) {
        // Return existing cart
        const existingCart = existingCartResult.data[0]
        return NextResponse.json({
          cart: await buildCartResponse(existingCart.id, organization_id)
        })
      }
    }

    // Fetch appointment details
    const appointmentResult = await universalApi.read('universal_transactions', {
      id: appointment_id,
      organization_id,
      smart_code: 'HERA.SALON.APT.TXN.BOOKING.V1'
    })

    if (!appointmentResult.success || !appointmentResult.data?.length) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const appointment = appointmentResult.data[0]
    console.log('Appointment data:', appointment)
    
    // Check appointment status - only allow SCHEDULED or IN_PROGRESS
    const appointmentStatus = appointment.metadata?.status || 'SCHEDULED'
    if (!['SCHEDULED', 'IN_PROGRESS'].includes(appointmentStatus)) {
      return NextResponse.json(
        { error: `Cannot create cart for appointment in ${appointmentStatus} status` },
        { status: 400 }
      )
    }

    // Create POS cart transaction
    const cartCode = `CART-${Date.now()}`
    const cartResult = await universalApi.createTransaction({
      transaction_type: 'sale',
      transaction_code: cartCode,
      smart_code: 'HERA.SALON.POS.TXN.CART.V1',
      organization_id,
      source_entity_id: appointment.source_entity_id, // Customer
      target_entity_id: appointment.target_entity_id, // Salon/Branch
      total_amount: 0, // Will be calculated from lines
      transaction_date: new Date().toISOString(),
      metadata: {
        appointment_id,
        customer_id: appointment.source_entity_id,
        stylist_id: appointment.metadata?.stylist_id,
        chair_id: appointment.metadata?.chair_id,
        state: 'ACTIVE',
        idempotency_key,
        ai_confidence: 0.95,
        ai_insights: 'Cart created from appointment booking'
      }
    }, { skipValidation: true })

    if (!cartResult.success || !cartResult.data) {
      console.error('Cart creation failed:', cartResult.error)
      throw new Error(`Failed to create cart transaction: ${cartResult.error || 'Unknown error'}`)
    }

    const cart = cartResult.data

    // Create relationship: CART ORIGINATES_FROM APPOINTMENT
    await universalApi.createRelationship({
      from_entity_id: cart.id,
      to_entity_id: appointment_id,
      relationship_type: 'ORIGINATES_FROM',
      smart_code: 'HERA.SALON.POS.REL.CART_FROM_APPT.V1',
      organization_id,
      metadata: {
        created_at: new Date().toISOString()
      }
    })

    // Create relationship: CART BILLS_TO CUSTOMER
    if (appointment.from_entity_id) {
      await universalApi.createRelationship({
        from_entity_id: cart.id,
        to_entity_id: appointment.from_entity_id,
        relationship_type: 'BILLS_TO',
        smart_code: 'HERA.SALON.POS.REL.CART_BILLS_CUSTOMER.V1',
        organization_id,
        metadata: {
          created_at: new Date().toISOString()
        }
      })
    }

    // Fetch appointment lines to map to cart
    const appointmentLinesResult = await universalApi.read('universal_transaction_lines', {
      transaction_id: appointment_id,
      organization_id
    })

    const appointmentLines = appointmentLinesResult.data || []
    let subtotal = 0

    // Create cart lines from appointment services
    for (const appointmentLine of appointmentLines) {
      const lineAmount = appointmentLine.unit_price * appointmentLine.quantity
      subtotal += lineAmount

      const cartLineResult = await universalApi.createTransactionLine({
        transaction_id: cart.id,
        line_entity_id: appointmentLine.line_entity_id,
        line_number: appointmentLine.line_number,
        quantity: appointmentLine.quantity,
        unit_price: appointmentLine.unit_price,
        line_amount: lineAmount,
        smart_code: appointmentLine.smart_code || 'HERA.SALON.SVC.LINE.STANDARD.V1',
        organization_id,
        metadata: {
          appointment_line_id: appointmentLine.id,
          duration_min: appointmentLine.metadata?.duration || 30,
          source: 'APPOINTMENT',
          staff_split: appointmentLine.metadata?.staff_split || [{ 
            staff_id: appointment.metadata?.stylist_id, 
            pct: 100 
          }],
          service_name: appointmentLine.metadata?.service_name
        }
      })

      // Create relationship: LINE PERFORMED_BY STAFF
      if (appointment.metadata?.stylist_id && cartLineResult.data) {
        await universalApi.createRelationship({
          from_entity_id: cartLineResult.data.id,
          to_entity_id: appointment.metadata.stylist_id,
          relationship_type: 'PERFORMED_BY',
          smart_code: 'HERA.SALON.POS.REL.LINE_PERFORMED_BY_STAFF.V1',
          organization_id,
          metadata: {
            percentage: 100
          }
        })
      }
    }

    // Calculate pricing summary
    const taxRate = 0.2 // 20% VAT
    const tax = subtotal * taxRate
    const total = subtotal + tax

    // Update cart with totals
    await universalApi.updateTransaction(cart.id, {
      total_amount: total,
      metadata: {
        ...cart.metadata,
        pricing_summary: {
          subtotal,
          discounts: 0,
          tax,
          tip: 0,
          total
        }
      }
    })

    // Update appointment status to IN_PROGRESS if it was SCHEDULED
    if (appointmentStatus === 'SCHEDULED') {
      await universalApi.createTransaction({
        transaction_type: 'status_update',
        transaction_code: `STATUS-${Date.now()}`,
        smart_code: 'HERA.SALON.APPT.STATUS.UPDATE.V1',
        organization_id,
        reference_entity_id: appointment_id,
        metadata: {
          from: 'SCHEDULED',
          to: 'IN_PROGRESS',
          reason: 'POS cart created',
          updated_by: 'system'
        }
      })

      // Update appointment metadata
      await universalApi.updateTransaction(appointment_id, {
        metadata: {
          ...appointment.metadata,
          status: 'IN_PROGRESS',
          cart_id: cart.id
        }
      })
    }

    // Build response
    const response = await buildCartResponse(cart.id, organization_id)
    return NextResponse.json({
      ...response,
      _mode: 'legacy'
    })

  } catch (error) {
    console.error('Error creating POS cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to build cart response
async function buildCartResponse(cartId: string, organizationId: string) {
  universalApi.setOrganizationId(organizationId)
  
  const cartResult = await universalApi.read('universal_transactions', {
    id: cartId,
    organization_id: organizationId
  })

  if (!cartResult.data?.length) {
    throw new Error('Cart not found')
  }

  const cart = cartResult.data[0]
  
  // Fetch cart lines
  const linesResult = await universalApi.read('universal_transaction_lines', {
    transaction_id: cartId,
    organization_id: organizationId
  })

  const lines = linesResult.data || []

  // Map lines with service details
  const mappedLines = await Promise.all(
    lines.map(async (line) => {
      let serviceName = line.metadata?.service_name || 'Service'
      
      if (line.line_entity_id) {
        const serviceResult = await universalApi.read('core_entities', {
          id: line.line_entity_id,
          organization_id: organizationId
        })
        if (serviceResult.data?.length) {
          serviceName = serviceResult.data[0].entity_name
        }
      }

      return {
        line_id: line.id,
        entity_ref: line.line_entity_id,
        name: serviceName,
        smart_code: line.smart_code,
        qty: line.quantity,
        unit_price: line.unit_price,
        staff_split: line.metadata?.staff_split || [],
        dynamic: {
          appointment_line_id: line.metadata?.appointment_line_id,
          duration_min: line.metadata?.duration_min,
          source: line.metadata?.source
        }
      }
    })
  )

  // Fetch relationships
  const relationshipsResult = await universalApi.read('core_relationships', {
    from_entity_id: cartId,
    organization_id: organizationId
  })

  const relationships: any = {}
  if (relationshipsResult.data) {
    relationshipsResult.data.forEach(rel => {
      relationships[rel.relationship_type] = rel.to_entity_id
    })
  }

  return {
    cart: {
      id: cart.id,
      smart_code: cart.smart_code,
      organization_id: cart.organization_id,
      appointment_id: cart.metadata?.appointment_id,
      relationships,
      lines: mappedLines,
      pricing_summary: cart.metadata?.pricing_summary || {
        subtotal: cart.total_amount,
        discounts: 0,
        tax: 0,
        tip: 0,
        total: cart.total_amount
      },
      dynamic: {
        state: cart.metadata?.state || 'ACTIVE'
      }
    }
  }
}