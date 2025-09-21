import { createClient } from '@supabase/supabase-js'

// Use server-side supabase client
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

export async function getOrgSettings(organizationId: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('core_organizations')
    .select('settings')
    .eq('id', organizationId)
    .maybeSingle()
  if (error) {
    console.warn('getOrgSettings error', error)
    return null
  }
  return data?.settings ?? null
}

// Try to resolve today's fiscal period entity → return a minimal stamp
export async function getTodayFiscalStamp(organizationId: string) {
  const supabase = getSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('core_entities')
    .select('id, entity_code, metadata')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'fiscal_period')
    .lte('metadata->>start_date', today)
    .gte('metadata->>end_date', today)
    .maybeSingle()
  if (error || !data) return null
  // Expect metadata like { year: 2025, period: 9, code: "2025-09" }
  const md: any = data.metadata || {}
  return {
    year: Number(md.year) || null,
    period: Number(md.period) || null,
    code: md.code ?? data.entity_code ?? null,
  }
}