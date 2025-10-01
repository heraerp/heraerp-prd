import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/universal/supabase'
import { DynamicSetBody, DynamicBatchBody } from '@/lib/universal/schemas'
import { requireOrg } from '@/lib/universal/guardrails'

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const isBatch = !!json.p_items
    const sb = serverSupabase()
    if (isBatch) {
      const body = DynamicBatchBody.parse(json)
      requireOrg(body.p_organization_id)
      const { data, error } = await sb.rpc('hera_dynamic_data_batch_v1', body as any)
      if (error) throw error
      return NextResponse.json({ data })
    } else {
      const body = DynamicSetBody.parse(json)
      requireOrg(body.p_organization_id)
      const { data, error } = await sb.rpc('hera_dynamic_data_set_v1', body as any)
      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
