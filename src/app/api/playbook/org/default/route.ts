import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    const org = data && data[0]
    if (!org) return NextResponse.json({ error: 'No organizations found' }, { status: 404 })
    return NextResponse.json({ id: org.id, name: org.organization_name })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to resolve default org' },
      { status: 500 }
    )
  }
}
