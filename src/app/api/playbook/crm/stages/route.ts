import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { OrgIdQuerySchema, LookupListSchema } from '../_schemas'

export async function GET(req: NextRequest) {
  const parsed = OrgIdQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const orgId = parsed.data.orgId
  const supabase = createServerClient()
  // Try reading defined CRM stages as entities
  const { data, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', orgId)
    .eq('entity_type', 'crm_stage')
    .order('entity_name', { ascending: true })

  if (error) {
    return NextResponse.json({ items: [] })
  }
  const items = (data || []).map(r => ({
    id: r.entity_code || r.entity_name || r.id,
    name: r.entity_name
  }))
  const ok = LookupListSchema.safeParse({ items })
  if (!ok.success) return NextResponse.json({ error: ok.error.flatten() }, { status: 500 })
  return NextResponse.json({ items })
}
