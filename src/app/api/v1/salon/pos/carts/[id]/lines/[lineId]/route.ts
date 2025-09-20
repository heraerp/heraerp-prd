import { NextRequest, NextResponse } from 'next/server'
import { runPlaybook, isPlaybookModeEnabled } from '@/lib/playbook-adapter'
import { headers } from 'next/headers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const headersList = await headers()
    const orgId = headersList.get('Organization-Id')
    const idem = headersList.get('Idempotency-Key') ?? undefined
    const body = await req.json()

    if (!orgId) {
      return NextResponse.json({ error: 'Organization-Id header required' }, { status: 400 })
    }

    const usePB = await isPlaybookModeEnabled('pos_lines', orgId)
    if (!usePB) {
      return NextResponse.json({ error: 'pos_lines disabled for org' }, { status: 404 })
    }

    const { id: cartId, lineId } = await params

    const payload = {
      organization_id: orgId,
      transaction_id: cartId,
      line_id: lineId,
      patch: {
        quantity: body.quantity,
        unit_price: body.unit_price,
        dynamic: body.dynamic || body.metadata
      }
    }

    const out = await runPlaybook('HERA.UNIV.TXN.LINE.UPDATE.V1', payload, {
      idempotencyKey: idem,
      organizationId: orgId
    })

    if (out.success) {
      return NextResponse.json({
        _mode: 'playbook',
        line: out.data?.line,
        cart_updated: true,
        ...out
      })
    } else {
      return NextResponse.json(
        {
          error: out.error?.message || 'Failed to update line',
          _mode: 'playbook',
          details: out.error
        },
        { status: 422 }
      )
    }
  } catch (error) {
    console.error('Error updating line:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const headersList = await headers()
    const orgId = headersList.get('Organization-Id')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization-Id header required' }, { status: 400 })
    }

    const usePB = await isPlaybookModeEnabled('pos_lines', orgId)
    if (!usePB) {
      return NextResponse.json({ error: 'pos_lines disabled for org' }, { status: 404 })
    }

    const { id: cartId, lineId } = await params

    const payload = {
      organization_id: orgId,
      transaction_id: cartId,
      line_id: lineId
    }

    const out = await runPlaybook('HERA.UNIV.TXN.LINE.REMOVE.V1', payload, {
      organizationId: orgId
    })

    if (out.success) {
      return NextResponse.json({
        _mode: 'playbook',
        removed: true,
        cart_updated: true,
        ...out
      })
    } else {
      return NextResponse.json(
        {
          error: out.error?.message || 'Failed to remove line',
          _mode: 'playbook',
          details: out.error
        },
        { status: 422 }
      )
    }
  } catch (error) {
    console.error('Error removing line:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
