import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { assertOrgSmart, badRequest, serverError } from '../_guard'

const BaseWrite = z.object({
  orgId: z.string().uuid(),
  smart_code: z.string().regex(/^HERA\.CRM\.[A-Z0-9._]+\.v\d+$/i),
  idempotency_key: z.string().min(8).optional(),
  actor_user_id: z.string().uuid().optional(),
})

const AccountCreate = BaseWrite.extend({
  account: z.object({
    entity_name: z.string().min(2),
    website: z.string().url().optional(),
    phone: z.string().optional(),
    industry: z.string().optional(),
    owner_id: z.string().uuid().optional(),
  }),
})

const AccountUpdate = BaseWrite.extend({
  account: z
    .object({
      id: z.string().uuid(),
      entity_name: z.string().min(2).optional(),
      website: z.string().url().optional(),
      phone: z.string().optional(),
      industry: z.string().optional(),
      owner_id: z.string().uuid().optional(),
      status: z.enum(['active', 'archived']).optional(),
    })
    .refine(o => Object.keys(o).length > 1, { message: 'No-op update' }),
})

const Query = z.object({
  orgId: z.string().uuid(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = Query.parse(Object.fromEntries(url.searchParams))
    const db = createServerClient()

    if (q.id) {
      const { data, error } = await db
        .from('core_entities')
        .select('id, entity_name, status, smart_code')
        .eq('organization_id', q.orgId)
        .eq('entity_type', 'account')
        .eq('id', q.id)
        .single()
      if (error) return serverError(error.message)
      return NextResponse.json({ items: [data], page: 1, pageSize: 1, total: 1 })
    }

    const from = (q.page - 1) * q.pageSize
    const to = from + q.pageSize - 1
    let sel = db
      .from('core_entities')
      .select('id, entity_name, status, smart_code', { count: 'exact' })
      .eq('organization_id', q.orgId)
      .eq('entity_type', 'account')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (q.q) sel = sel.ilike('entity_name', `%${q.q}%`)

    const { data, count, error } = await sel
    if (error) return serverError(error.message)
    return NextResponse.json({ items: data ?? [], page: q.page, pageSize: q.pageSize, total: count ?? 0 })
  } catch (e) {
    return badRequest(String(e))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = AccountCreate.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.flatten())
    assertOrgSmart(parsed.data)

    const { orgId, smart_code, account } = parsed.data
    const db = createServerClient()

    const { data: ent, error: e1 } = await db
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'account',
        entity_name: account.entity_name,
        smart_code,
        status: 'active',
      })
      .select()
      .single()
    if (e1) return serverError(e1.message)

    const dynBase = [
      account.website && { field_name: 'website', field_type: 'text', field_value_text: account.website },
      account.phone && { field_name: 'phone', field_type: 'text', field_value_text: account.phone },
      account.industry && { field_name: 'industry', field_type: 'text', field_value_text: account.industry },
      account.owner_id && { field_name: 'owner_id', field_type: 'text', field_value_text: account.owner_id },
    ].filter(Boolean) as Array<{ field_name: string; field_type: string; field_value_text: string }>

    if (dynBase.length) {
      const dynRows = dynBase.map(r => ({ ...r, organization_id: orgId, entity_id: ent.id, smart_code }))
      const { error: e2 } = await db.from('core_dynamic_data').insert(dynRows as any)
      if (e2) return serverError(e2.message)
    }

    await db.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'CRM_EVENT',
      transaction_status: 'completed',
      smart_code,
      source_entity_id: account.owner_id ?? null,
      target_entity_id: ent.id,
      total_amount: 0,
    })

    return NextResponse.json({ id: ent.id, entity_name: ent.entity_name }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = AccountUpdate.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.flatten())
    assertOrgSmart(parsed.data)

    const { orgId, smart_code, account } = parsed.data
    const db = createServerClient()

    if (account.entity_name || account.status) {
      const { error } = await db
        .from('core_entities')
        .update({
          ...(account.entity_name ? { entity_name: account.entity_name } : {}),
          ...(account.status ? { status: account.status } : {}),
          smart_code,
        })
        .eq('organization_id', orgId)
        .eq('id', account.id)
        .eq('entity_type', 'account')
      if (error) return serverError(error.message)
    }

    const dynUpserts = (
      [
        account.website && { field_name: 'website', field_type: 'text', field_value_text: account.website },
        account.phone && { field_name: 'phone', field_type: 'text', field_value_text: account.phone },
        account.industry && { field_name: 'industry', field_type: 'text', field_value_text: account.industry },
        account.owner_id && { field_name: 'owner_id', field_type: 'text', field_value_text: account.owner_id },
      ].filter(Boolean) as Array<{ field_name: string; field_type: string; field_value_text: string }>
    ).map(r => ({ ...r, organization_id: orgId, entity_id: account.id, smart_code }))

    for (const row of dynUpserts) {
      // emulate upsert: delete existing field for entity+org, then insert
      await db
        .from('core_dynamic_data')
        .delete()
        .eq('organization_id', orgId)
        .eq('entity_id', account.id)
        .eq('field_name', row.field_name)
      await db.from('core_dynamic_data').insert(row as any)
    }

    await db.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'CRM_EVENT',
      transaction_status: 'completed',
      smart_code,
      target_entity_id: account.id,
      total_amount: 0,
    })

    return NextResponse.json({ id: account.id, updated: true })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = BaseWrite.extend({ id: z.string().uuid() }).safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.flatten())
    assertOrgSmart(parsed.data)

    const { orgId, smart_code, id } = parsed.data
    const db = createServerClient()
    const { error } = await db
      .from('core_entities')
      .update({ status: 'archived', smart_code })
      .eq('organization_id', orgId)
      .eq('entity_type', 'account')
      .eq('id', id)
    if (error) return serverError(error.message)

    await db.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'CRM_EVENT',
      transaction_status: 'completed',
      smart_code,
      target_entity_id: id,
      total_amount: 0,
    })
    return NextResponse.json({ id, deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
