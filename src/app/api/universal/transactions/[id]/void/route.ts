import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/universal/supabase';
import { UuidZ } from '@/lib/universal/guardrails';
import { z } from 'zod';

const VoidBody = z.object({
  p_reason: z.string().min(1),
  p_user_id: UuidZ
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transactionId = UuidZ.parse(params.id);
    const orgId = req.headers.get('x-organization-id');
    if (!orgId || !UuidZ.safeParse(orgId).success) {
      return NextResponse.json({ error: 'Missing or invalid organization ID' }, { status: 400 });
    }
    
    const body = VoidBody.parse(await req.json());
    const sb = serverSupabase();
    
    const { data, error } = await sb.rpc('hera_txn_void_v1', {
      p_organization_id: orgId,
      p_transaction_id: transactionId,
      ...body
    } as any);
    
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}