import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/universal/supabase'
import { RelationshipUpsertBody, RelationshipBatchBody } from '@/lib/universal/schemas'

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const sb = serverSupabase()
    if (Array.isArray(json)) {
      const body = RelationshipBatchBody.parse({
        p_organization_id: json[0].p_organization_id,
        p_rows: json
      })
      const { data, error } = await sb.rpc('hera_relationship_upsert_batch_v1', body as any)
      if (error) throw error
      return NextResponse.json({ data })
    } else {
      const body = RelationshipUpsertBody.parse(json)
      const { data, error } = await sb.rpc('hera_relationship_upsert_v1', body as any)
      if (error) throw error
      return NextResponse.json({ relationship_id: data })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
