import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/universal/supabase';
import { DynamicDeleteBody } from '@/lib/universal/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = DynamicDeleteBody.parse(await req.json());
    const sb = serverSupabase();
    const { data, error } = await sb.rpc('hera_dynamic_data_delete_v1', body as any);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}