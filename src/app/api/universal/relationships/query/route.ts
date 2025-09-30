import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/universal/supabase';
import { RelationshipQuery } from '@/lib/universal/schemas';

export async function GET(req: NextRequest) {
  try {
    const q = Object.fromEntries(new URL(req.url).searchParams.entries());
    const params = RelationshipQuery.parse(q);
    const sb = serverSupabase();
    const { data, error } = await sb.rpc('hera_relationship_query_v1', params as any);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}