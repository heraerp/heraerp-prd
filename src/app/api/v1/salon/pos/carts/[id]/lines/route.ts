import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { isPlaybookModeEnabled } from '@/lib/playbook-adapter'
import { runPlaybook } from '@/lib/playbook-adapter'
// import { legacyAddLine } from '@/lib/legacy/pos-lines' // existing legacy

type Body = {
  organization_id: string
  line_type: 'SERVICE' | 'RETAIL' | 'ADJUSTMENT'
  entity_id: string
  quantity: number
  unit_price?: number
  staff_id?: string
  staff_split?: Array<{ staff_id: string; pct: number }>
  metadata?: Record<string, any>
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const headersList = await headers()
    const idemKey = headersList.get('Idempotency-Key') ?? undefined
    const orgId = headersList.get('Organization-Id')
    const body = (await req.json()) as Body
    const { id: cartId } = await params

    const { organization_id } = body
    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const usePlaybook = await isPlaybookModeEnabled('pos_lines', organization_id)

    if (usePlaybook) {
      // Derive the line smart code family from type
      const lineSmart =
        body.line_type === 'SERVICE'
          ? 'HERA.SALON.SVC.LINE.STANDARD.V1'
          : body.line_type === 'RETAIL'
            ? 'HERA.SALON.PRODUCT.LINE.RETAIL.V1'
            : 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1'

      const payload = {
        organization_id,
        transaction_id: cartId,
        line_smart_code: lineSmart,
        entity_id: body.entity_id,
        qty: body.quantity,
        unit_price: body.unit_price, // ignored if profile says server-priced
        dynamic: {
          staff_id: body.staff_id ?? null,
          staff_split: body.staff_split ?? [],
          ...(body.metadata ?? {}),
          source: 'POS_UI'
        }
      }

      try {
        const out = await runPlaybook('HERA.UNIV.TXN.LINE.ADD.V1', payload, {
          idempotencyKey: idemKey,
          organizationId: organization_id
        })

        // Auto-reprice after line add to keep totals fresh
        // await runPlaybook('HERA.SALON.POS.CART.REPRICE.V1', {
        //   organization_id,
        //   transaction_id: cartId
        // })

        return NextResponse.json({
          line: out.data?.line ?? out,
          cart_updated: true,
          _mode: 'playbook',
          ...out
        })
      } catch (e: any) {
        return NextResponse.json(
          {
            error: e?.message ?? 'Line add failed (playbook)',
            _mode: 'playbook',
            details: e
          },
          { status: 422 }
        )
      }
    }

    // Legacy path - fallback for organizations without playbook mode
    // const legacy = await legacyAddLine(cartId, body, { idemKey })
    // return NextResponse.json({ line: legacy.line, _mode: 'legacy' })

    // For now, return a simple success for legacy mode
    return NextResponse.json(
      {
        error: 'Legacy mode not implemented yet',
        _mode: 'legacy'
      },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error adding line to cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
