/**
 * Case actions API - Handle approve, vary, waive, breach, close actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { 
  CaseActionApprovePayload,
  CaseActionVaryPayload,
  CaseActionWaivePayload,
  CaseActionBreachPayload,
  CaseActionClosePayload,
  CaseActionType 
} from '@/types/cases';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: CaseActionType } }
) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const orgId = request.headers.get('X-Organization-Id') || DEMO_ORG_ID;
    const { id: caseId, action } = params;
    const payload = await request.json();

    // Validate action type
    const validActions: CaseActionType[] = ['approve', 'vary', 'waive', 'breach', 'close'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }

    // Build smart code and metadata based on action
    let smartCode = '';
    let metadata: Record<string, any> = {};
    let statusUpdate: string | null = null;
    let dynamicUpdates: Record<string, any> = {};

    switch (action) {
      case 'approve':
        const approveData = payload as ActionApproveInput;
        smartCode = 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.APPROVE.V1';
        metadata = {
          approved: approveData.approved,
          comments: approveData.comments,
          approved_at: new Date().toISOString()
        };
        if (approveData.approved) {
          statusUpdate = 'active';
        }
        break;

      case 'vary':
        const varyData = payload as ActionVaryInput;
        smartCode = 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.VARY.V1';
        metadata = {
          change_type: varyData.change_type,
          description: varyData.description,
          justification: varyData.justification,
          new_dates: varyData.new_dates,
          budget_delta: varyData.budget_delta,
          varied_at: new Date().toISOString()
        };
        // Update due date if provided
        if (varyData.new_dates?.due_date) {
          dynamicUpdates['HERA.PUBLICSECTOR.CRM.CASE.DUE_DATE.V1'] = varyData.new_dates.due_date;
        }
        break;

      case 'waive':
        const waiveData = payload as ActionWaiveInput;
        smartCode = 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.WAIVE.V1';
        metadata = {
          rule: waiveData.rule,
          justification: waiveData.justification,
          waiver_period: waiveData.waiver_period,
          waived_at: new Date().toISOString()
        };
        break;

      case 'breach':
        const breachData = payload as ActionBreachInput;
        smartCode = 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.BREACH.V1';
        metadata = {
          category: breachData.category,
          severity: breachData.severity,
          occurred_at: breachData.occurred_at,
          narrative: breachData.narrative,
          impact: breachData.impact,
          remediation: breachData.remediation,
          recorded_at: new Date().toISOString()
        };
        statusUpdate = 'breach';
        dynamicUpdates['HERA.PUBLICSECTOR.CRM.CASE.RAG.V1'] = 'R';
        break;

      case 'close':
        const closeData = payload as ActionCloseInput;
        smartCode = 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.CLOSE.V1';
        metadata = {
          outcome: closeData.outcome,
          closure_reason: closeData.closure_reason,
          closed_at: closeData.closed_at || new Date().toISOString(),
          final_report: closeData.final_report,
          lessons_learned: closeData.lessons_learned
        };
        statusUpdate = 'closed';
        dynamicUpdates['HERA.PUBLICSECTOR.CRM.CASE.CLOSED_AT.V1'] = 
          closeData.closed_at || new Date().toISOString();
        break;
    }

    // Update case status if needed
    if (statusUpdate || Object.keys(dynamicUpdates).length > 0) {
      const updatePayload: any = {
        organization_id: orgId,
        entity_id: caseId,
        entity_type: 'case'
      };

      if (statusUpdate) {
        updatePayload.status = statusUpdate;
      }

      if (Object.keys(dynamicUpdates).length > 0) {
        updatePayload.dynamic_data = dynamicUpdates;
      }

      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/v2/universal/entity-upsert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': orgId
          },
          body: JSON.stringify(updatePayload)
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update case');
      }
    }

    // Log action event
    const eventPayload = {
      organization_id: orgId,
      transaction_type: 'case_action',
      smart_code: smartCode,
      source_entity_id: caseId,
      metadata: {
        ...metadata,
        action_type: action,
        performed_by: 'current_user' // TODO: Get from auth context
      }
    };

    const eventResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/v2/universal/txn-emit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify(eventPayload)
      }
    );

    if (!eventResponse.ok) {
      throw new Error('Failed to log action event');
    }

    return NextResponse.json({ 
      success: true,
      action,
      message: `Case ${action} action completed successfully`
    });
  } catch (error) {
    console.error(`Error performing case ${params.action}:`, error);
    return NextResponse.json(
      { error: `Failed to ${params.action} case` },
      { status: 500 }
    );
  }
}