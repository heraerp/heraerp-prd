import { createServerClient } from '@/lib/supabase/server'

async function ensureIdempotent(orgId: string, idempotencyKey: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, metadata')
    .eq('organization_id', orgId)
    .eq('transaction_code', idempotencyKey)
    .limit(1)
  if (error) return null
  return data && data[0] ? data[0] : null
}

async function insertAudit(orgId: string, smart_code: string, idempotencyKey: string, actor_user_id: string, payload: any) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'crm_event',
      transaction_code: idempotencyKey,
      smart_code,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      metadata: {
        ...payload,
        actor_user_id,
        idempotency_key: idempotencyKey
      }
    })
    .select()
    .single()
  if (error) throw error
  return data
}

async function upsertDynamic(orgId: string, entityId: string, key: string, value: string | number) {
  const supabase = createServerClient()
  // Try update if exists
  const { data } = await supabase
    .from('core_dynamic_data')
    .select('id')
    .eq('organization_id', orgId)
    .eq('entity_id', entityId)
    .eq('field_name', key)
    .limit(1)
  if (data && data[0]) {
    await supabase
      .from('core_dynamic_data')
      .update({ field_value_text: String(value) })
      .eq('id', data[0].id)
    return
  }
  await supabase.from('core_dynamic_data').insert({
    organization_id: orgId,
    entity_id: entityId,
    field_name: key,
    field_type: 'text',
    field_value_text: String(value)
  })
}

export async function updateOpportunityStage(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; opportunity_id: string; to_stage: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  await upsertDynamic(input.orgId, input.opportunity_id, 'stage', input.to_stage)
  return await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, {
    event: 'OPPORTUNITY_STAGE_CHANGED', opportunity_id: input.opportunity_id, to_stage: input.to_stage
  })
}

export async function updateOpportunityOwner(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; opportunity_id: string; owner_id: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  await upsertDynamic(input.orgId, input.opportunity_id, 'owner_id', input.owner_id)
  return await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, {
    event: 'OPPORTUNITY_OWNER_CHANGED', opportunity_id: input.opportunity_id, owner_id: input.owner_id
  })
}

export async function updateOpportunityProbability(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; opportunity_id: string; probability: number }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  await upsertDynamic(input.orgId, input.opportunity_id, 'probability', input.probability)
  return await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, {
    event: 'OPPORTUNITY_PROBABILITY_CHANGED', opportunity_id: input.opportunity_id, probability: input.probability
  })
}

export async function createLead(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; lead_name: string; source?: string; owner_id?: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  const supabase = createServerClient()
  // Create entity via core_entities
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: input.orgId,
      entity_type: 'lead',
      entity_name: input.lead_name,
      smart_code: input.smart_code
    })
    .select()
    .single()
  if (error) throw error
  const leadId = data.id as string
  if (input.source) await upsertDynamic(input.orgId, leadId, 'source', input.source)
  if (input.owner_id) await upsertDynamic(input.orgId, leadId, 'owner_id', input.owner_id)
  await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, { event: 'LEAD_CREATED', lead_id: leadId })
  return { id: leadId }
}

export async function createAccount(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; account_name: string; industry?: string; segment?: string; website?: string; revenue?: number; employees?: number; status?: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: input.orgId,
      entity_type: 'account',
      entity_name: input.account_name,
      smart_code: input.smart_code
    })
    .select()
    .single()
  if (error) throw error
  const accountId = data.id as string
  if (input.industry) await upsertDynamic(input.orgId, accountId, 'industry', input.industry)
  if (input.segment) await upsertDynamic(input.orgId, accountId, 'segment', input.segment)
  if (input.website) await upsertDynamic(input.orgId, accountId, 'website', input.website)
  if (input.revenue !== undefined) await upsertDynamic(input.orgId, accountId, 'revenue', input.revenue)
  if (input.employees !== undefined) await upsertDynamic(input.orgId, accountId, 'employees', input.employees)
  if (input.status) await upsertDynamic(input.orgId, accountId, 'status', input.status)
  await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, { event: 'ACCOUNT_CREATED', account_id: accountId })
  return { id: accountId }
}

export async function updateAccount(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; account_id: string; account_name?: string; industry?: string; segment?: string; website?: string; revenue?: number; employees?: number; status?: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  const supabase = createServerClient()
  if (input.account_name) {
    await supabase.from('core_entities').update({ entity_name: input.account_name }).eq('id', input.account_id)
  }
  if (input.industry !== undefined) await upsertDynamic(input.orgId, input.account_id, 'industry', input.industry)
  if (input.segment !== undefined) await upsertDynamic(input.orgId, input.account_id, 'segment', input.segment)
  if (input.website !== undefined) await upsertDynamic(input.orgId, input.account_id, 'website', input.website)
  if (input.revenue !== undefined) await upsertDynamic(input.orgId, input.account_id, 'revenue', input.revenue)
  if (input.employees !== undefined) await upsertDynamic(input.orgId, input.account_id, 'employees', input.employees)
  if (input.status !== undefined) await upsertDynamic(input.orgId, input.account_id, 'status', input.status)
  return await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, {
    event: 'ACCOUNT_UPDATED', account_id: input.account_id
  })
}

export async function deleteAccount(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; account_id: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  const supabase = createServerClient()
  await supabase.from('core_entities').delete().eq('id', input.account_id).eq('organization_id', input.orgId)
  return await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, {
    event: 'ACCOUNT_DELETED', account_id: input.account_id
  })
}

export async function qualifyLead(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; lead_id: string; opportunity_name: string; amount?: number; close_date?: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  const supabase = createServerClient()
  const { data: opp, error } = await supabase
    .from('core_entities')
    .insert({ organization_id: input.orgId, entity_type: 'opportunity', entity_name: input.opportunity_name, smart_code: input.smart_code })
    .select()
    .single()
  if (error) throw error
  const oppId = opp.id as string
  if (input.amount !== undefined) await upsertDynamic(input.orgId, oppId, 'amount', input.amount)
  if (input.close_date) await upsertDynamic(input.orgId, oppId, 'close_date', input.close_date)
  await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, { event: 'LEAD_QUALIFIED', lead_id: input.lead_id, opportunity_id: oppId })
  return { id: oppId }
}

export async function logActivity(input: { orgId: string; smart_code: string; idempotency_key: string; actor_user_id: string; activity_type: string; subject: string; opportunity_id?: string; account_id?: string; contact_id?: string; due_at?: string; status?: string }) {
  const existing = await ensureIdempotent(input.orgId, input.idempotency_key)
  if (existing) return existing
  // For this pass, just audit; activities may be entities later
  return await insertAudit(input.orgId, input.smart_code, input.idempotency_key, input.actor_user_id, { event: 'ACTIVITY_LOGGED', ...input })
}
