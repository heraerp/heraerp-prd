import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Get all playbooks for the organization
    const { data: playbooks, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'playbook');

    if (error) {
      throw error;
    }

    // Calculate KPIs
    const kpis = {
      active: 0,
      draft: 0,
      archived: 0,
      total_runs: 0,
      avg_duration_hours: 0,
      success_rate: 0,
    };

    let totalDuration = 0;
    let totalRuns = 0;
    let successfulRuns = 0;

    playbooks.forEach((playbook: any) => {
      // Count by status
      if (playbook.status === 'active') kpis.active++;
      else if (playbook.status === 'draft') kpis.draft++;
      else if (playbook.status === 'archived') kpis.archived++;

      // Aggregate run statistics
      if (playbook.metadata?.total_runs) {
        totalRuns += playbook.metadata.total_runs;
        kpis.total_runs += playbook.metadata.total_runs;
      }

      if (playbook.metadata?.successful_runs) {
        successfulRuns += playbook.metadata.successful_runs;
      }

      if (playbook.metadata?.avg_duration_minutes) {
        totalDuration += playbook.metadata.avg_duration_minutes;
      }
    });

    // Calculate averages
    if (totalRuns > 0) {
      kpis.success_rate = Math.round((successfulRuns / totalRuns) * 100);
    }

    if (playbooks.length > 0) {
      const avgDurationMinutes = totalDuration / playbooks.length;
      kpis.avg_duration_hours = Math.round(avgDurationMinutes / 60 * 10) / 10; // Round to 1 decimal
    }

    return NextResponse.json(kpis);

  } catch (error) {
    console.error('Error fetching playbook KPIs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch playbook KPIs' },
      { status: 500 }
    );
  }
}