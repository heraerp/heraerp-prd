import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/universal/supabase';
import { TxnEmitBody, TxnBatchBody } from '@/lib/universal/schemas';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const sb = serverSupabase();
    
    if (Array.isArray(json)) {
      // Batch transaction creation
      const body = TxnBatchBody.parse({ 
        p_organization_id: json[0].p_organization_id, 
        p_transactions: json 
      });
      const { data, error } = await sb.rpc('hera_txn_emit_batch_v1', body as any);
      if (error) throw error;
      return NextResponse.json({ data });
    } else {
      // Single transaction creation
      const body = TxnEmitBody.parse(json);
      const { data, error } = await sb.rpc('hera_txn_emit_v1', body as any);
      if (error) throw error;
      return NextResponse.json({ transaction_id: data });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}