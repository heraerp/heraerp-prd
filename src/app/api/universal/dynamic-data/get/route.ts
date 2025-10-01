import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/universal/supabase'
import { DynamicGetQuery } from '@/lib/universal/schemas'

export async function GET(req: NextRequest) {
  try {
    const q = Object.fromEntries(new URL(req.url).searchParams.entries())
    const params = DynamicGetQuery.parse(q)
    const sb = serverSupabase()
    const { data, error } = await sb.rpc('hera_dynamic_data_get_v1', params as any)
    if (error) throw error
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
