/**
 * HERA Finance DNA - Daily Sales Posting API
 * 
 * POST /api/finance/daily-post
 * Creates balanced GL journals from daily POS sales aggregation
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeSalesByBranchDay, buildDailyJournalPayload, postDailySalesJournal } from '@/lib/finance/dailySales';
import { getSalesPostingPolicy } from '@/lib/finance/policy';

interface DailyPostRequest {
  organization_id: string;
  branch_id: string;
  day: string; // YYYY-MM-DD format
}

export async function POST(request: NextRequest) {
  try {
    const body: DailyPostRequest = await request.json();
    
    // Validate request
    if (!body.organization_id || !body.branch_id || !body.day) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: organization_id, branch_id, day'
      }, { status: 400 });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.day)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      }, { status: 400 });
    }

    // Get sales posting policy
    const policy = await getSalesPostingPolicy(body.organization_id);
    if (!policy) {
      return NextResponse.json({
        success: false,
        error: 'Sales posting policy not configured. Please configure account mappings first.'
      }, { status: 400 });
    }

    // Create day boundaries (Europe/London timezone as specified)
    const dayStart = body.day + 'T00:00:00.000Z';
    const dayEnd = body.day + 'T23:59:59.999Z';

    // Summarize sales for the day
    const summary = await summarizeSalesByBranchDay({
      organization_id: body.organization_id,
      branch_id: body.branch_id,
      dayStart,
      dayEnd
    });

    // Check if there are any sales to post
    const hasSales = Object.values(summary.totals).some(amount => amount > 0);
    if (!hasSales) {
      return NextResponse.json({
        success: false,
        error: 'No sales found for the specified day and branch'
      }, { status: 400 });
    }

    // Build journal payload using Europe/London 23:59 as posting time
    const postingDateTime = body.day + 'T23:59:00.000Z';
    const journalPayload = buildDailyJournalPayload(summary, policy, postingDateTime);

    // Post to GL
    const result = await postDailySalesJournal(journalPayload);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          transaction_id: result.transaction_id,
          summary: {
            day: summary.day,
            branch_id: summary.branch_id,
            currency: summary.currency,
            transaction_count: summary.transactionCount,
            totals: summary.totals,
            journal_total: journalPayload.header.total_amount,
            line_count: journalPayload.lines.length
          }
        },
        message: `Daily sales journal created successfully for ${body.day}`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to post daily sales journal'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in daily post API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 });
  }
}

// GET method for checking posting status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');
    const branch_id = searchParams.get('branch_id');
    const day = searchParams.get('day');

    if (!organization_id || !branch_id || !day) {
      return NextResponse.json({
        success: false,
        error: 'Missing required query parameters: organization_id, branch_id, day'
      }, { status: 400 });
    }

    // Create day boundaries
    const dayStart = day + 'T00:00:00.000Z';
    const dayEnd = day + 'T23:59:59.999Z';

    // Get summary (without posting)
    const summary = await summarizeSalesByBranchDay({
      organization_id,
      branch_id,
      dayStart,
      dayEnd
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          day: summary.day,
          branch_id: summary.branch_id,
          currency: summary.currency,
          transaction_count: summary.transactionCount,
          totals: summary.totals,
          total_amount: Object.values(summary.totals).reduce((sum, val) => sum + val, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error in daily post status API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}