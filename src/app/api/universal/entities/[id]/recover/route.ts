import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/universal/supabase';

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const body = await req.json();
    const p_organization_id = body.p_organization_id as string;
    const p_actor_user_id = body.p_actor_user_id as string | undefined;
    const sb = serverSupabase();
    const { data, error } = await sb.rpc('hera_entity_recover_v1', {
      p_organization_id,
      p_entity_id: ctx.params.id,
      p_set_status: 'active',
      p_actor_user_id
    });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}