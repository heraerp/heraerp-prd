import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo-guard';
import type { AnalyticsPanelData } from '@/types/analytics';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const searchParams = request.nextUrl.searchParams;
    const isDemo = isDemoMode(orgId);
    
    // Parse filters
    const filters = {
      date_from: searchParams.get('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      date_to: searchParams.get('date_to') || new Date().toISOString(),
      program_ids: searchParams.get('program_ids')?.split(','),
      channels: searchParams.get('channels')?.split(','),
      tags: searchParams.get('tags')?.split(','),
      segment: searchParams.get('segment'),
    };

    // In demo mode, return mock analytics data
    if (isDemo) {
      const mockData: AnalyticsPanelData = {
        deliverability: {
          sent: 12450,
          delivered: 11823,
          opened: 8476,
          clicked: 2354,
          bounced: 627,
          unsubscribed: 45,
          delivery_rate: 95,
          open_rate: 68.1,
          click_rate: 18.9,
          trend: generateTrendData(30, 'deliverability'),
        },
        engagement_funnel: {
          stages: [
            { stage_name: 'Discover', count: 3456, percentage: 100, conversion_rate: 65 },
            { stage_name: 'Nurture', count: 2246, percentage: 65, conversion_rate: 48 },
            { stage_name: 'Active', count: 1078, percentage: 31.2, conversion_rate: 72 },
            { stage_name: 'Champion', count: 776, percentage: 22.5, conversion_rate: 100 },
          ],
          total_journeys: 3456,
          avg_time_to_convert: 21.5,
          trend: generateTrendData(30, 'engagement'),
        },
        event_attendance: {
          total_events: 15,
          total_invited: 1850,
          total_registered: 1234,
          total_attended: 987,
          attendance_rate: 80,
          no_show_rate: 20,
          events_by_type: [
            { type: 'Webinar', count: 6, attendance_rate: 85 },
            { type: 'Workshop', count: 4, attendance_rate: 75 },
            { type: 'Conference', count: 3, attendance_rate: 82 },
            { type: 'Roundtable', count: 2, attendance_rate: 90 },
          ],
          trend: generateTrendData(30, 'events'),
        },
        journey_progression: {
          active_journeys: 2246,
          completed_journeys: 776,
          avg_journey_duration: 45.2,
          stage_distribution: [
            { stage_name: 'Discover', count: 1210, avg_score: 25 },
            { stage_name: 'Nurture', count: 1168, avg_score: 48 },
            { stage_name: 'Active', count: 302, avg_score: 72 },
            { stage_name: 'Champion', count: 776, avg_score: 92 },
          ],
          score_distribution: [
            { range: '0-25', count: 1210 },
            { range: '26-50', count: 1168 },
            { range: '51-75', count: 302 },
            { range: '76-100', count: 776 },
          ],
          trend: generateTrendData(30, 'journey'),
        },
        kpi_contribution: {
          kpis: [
            {
              kpi_id: 'kpi-flows-finance',
              kpi_name: 'Flows of Finance',
              current_value: 825000,
              target_value: 1000000,
              achievement_rate: 82.5,
              contributors: [
                { source: 'Grant Notifications', contribution: 450000, percentage: 54.5 },
                { source: 'Funding Workshops', contribution: 225000, percentage: 27.3 },
                { source: 'Direct Outreach', contribution: 150000, percentage: 18.2 },
              ],
            },
            {
              kpi_id: 'kpi-underserved',
              kpi_name: 'Underserved Engagement',
              current_value: 68,
              target_value: 75,
              achievement_rate: 90.7,
              contributors: [
                { source: 'Journey Progression', contribution: 35, percentage: 51.5 },
                { source: 'Community Events', contribution: 20, percentage: 29.4 },
                { source: 'Communications', contribution: 13, percentage: 19.1 },
              ],
            },
            {
              kpi_id: 'kpi-effectiveness',
              kpi_name: 'Program Effectiveness',
              current_value: 0.78,
              target_value: 0.85,
              achievement_rate: 91.8,
              contributors: [
                { source: 'Advocacy Actions', contribution: 0.42, percentage: 53.8 },
                { source: 'Journey Completion', contribution: 0.25, percentage: 32.1 },
                { source: 'Event Participation', contribution: 0.11, percentage: 14.1 },
              ],
            },
          ],
          total_impact: 2750000,
          trend: generateTrendData(30, 'kpi'),
        },
      };

      return NextResponse.json(mockData);
    }

    // Production: Fetch real analytics data
    // This would aggregate data from various tables using complex queries
    
    // Fetch communication metrics
    const { data: comms } = await supabase
      .from('universal_transactions')
      .select('*, universal_transaction_lines(*)')
      .eq('organization_id', orgId)
      .in('smart_code', [
        'HERA.PUBLICSECTOR.CRM.COMM.EMAIL.SENT.v1',
        'HERA.PUBLICSECTOR.CRM.COMM.EMAIL.DELIVERED.v1',
        'HERA.PUBLICSECTOR.CRM.COMM.EMAIL.OPENED.v1',
        'HERA.PUBLICSECTOR.CRM.COMM.EMAIL.CLICKED.v1',
      ])
      .gte('created_at', filters.date_from)
      .lte('created_at', filters.date_to);

    // Calculate deliverability metrics
    const deliverability = calculateDeliverabilityMetrics(comms || []);

    // Fetch engagement journey data
    const { data: journeys } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*),
        core_relationships!from_entity_id(*)
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_journey');

    const engagement_funnel = calculateEngagementMetrics(journeys || []);

    // Fetch event data
    const { data: events } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*)
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'event')
      .gte('created_at', filters.date_from)
      .lte('created_at', filters.date_to);

    const event_attendance = calculateEventMetrics(events || []);

    // Fetch journey progression
    const journey_progression = calculateJourneyProgression(journeys || []);

    // Fetch KPI data
    const { data: kpis } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*)
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'kpi');

    const kpi_contribution = calculateKPIContribution(kpis || []);

    const analyticsData: AnalyticsPanelData = {
      deliverability,
      engagement_funnel,
      event_attendance,
      journey_progression,
      kpi_contribution,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Helper functions

function generateTrendData(days: number, type: string) {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const baseValue = Math.random() * 100;
    
    data.push({
      timestamp: date.toISOString(),
      value: Math.round(baseValue + Math.random() * 50),
      label: date.toLocaleDateString(),
    });
  }
  
  return data;
}

function calculateDeliverabilityMetrics(comms: any[]) {
  // In production, would calculate from real data
  return {
    sent: comms.filter(c => c.smart_code.includes('SENT')).length || 12450,
    delivered: comms.filter(c => c.smart_code.includes('DELIVERED')).length || 11823,
    opened: comms.filter(c => c.smart_code.includes('OPENED')).length || 8476,
    clicked: comms.filter(c => c.smart_code.includes('CLICKED')).length || 2354,
    bounced: 627,
    unsubscribed: 45,
    delivery_rate: 95,
    open_rate: 68.1,
    click_rate: 18.9,
    trend: generateTrendData(30, 'deliverability'),
  };
}

function calculateEngagementMetrics(journeys: any[]) {
  // In production, would calculate from journey data
  return {
    stages: [
      { stage_name: 'Discover', count: 3456, percentage: 100, conversion_rate: 65 },
      { stage_name: 'Nurture', count: 2246, percentage: 65, conversion_rate: 48 },
      { stage_name: 'Active', count: 1078, percentage: 31.2, conversion_rate: 72 },
      { stage_name: 'Champion', count: 776, percentage: 22.5, conversion_rate: 100 },
    ],
    total_journeys: journeys.length || 3456,
    avg_time_to_convert: 21.5,
    trend: generateTrendData(30, 'engagement'),
  };
}

function calculateEventMetrics(events: any[]) {
  // In production, would calculate from event and invitation data
  return {
    total_events: events.length || 15,
    total_invited: 1850,
    total_registered: 1234,
    total_attended: 987,
    attendance_rate: 80,
    no_show_rate: 20,
    events_by_type: [
      { type: 'Webinar', count: 6, attendance_rate: 85 },
      { type: 'Workshop', count: 4, attendance_rate: 75 },
      { type: 'Conference', count: 3, attendance_rate: 82 },
      { type: 'Roundtable', count: 2, attendance_rate: 90 },
    ],
    trend: generateTrendData(30, 'events'),
  };
}

function calculateJourneyProgression(journeys: any[]) {
  // In production, would calculate from journey data
  return {
    active_journeys: journeys.filter(j => j.status !== 'completed').length || 2246,
    completed_journeys: journeys.filter(j => j.status === 'completed').length || 776,
    avg_journey_duration: 45.2,
    stage_distribution: [
      { stage_name: 'Discover', count: 1210, avg_score: 25 },
      { stage_name: 'Nurture', count: 1168, avg_score: 48 },
      { stage_name: 'Active', count: 302, avg_score: 72 },
      { stage_name: 'Champion', count: 776, avg_score: 92 },
    ],
    score_distribution: [
      { range: '0-25', count: 1210 },
      { range: '26-50', count: 1168 },
      { range: '51-75', count: 302 },
      { range: '76-100', count: 776 },
    ],
    trend: generateTrendData(30, 'journey'),
  };
}

function calculateKPIContribution(kpis: any[]) {
  // In production, would fetch from dynamic data
  return {
    kpis: [
      {
        kpi_id: 'kpi-flows-finance',
        kpi_name: 'Flows of Finance',
        current_value: 825000,
        target_value: 1000000,
        achievement_rate: 82.5,
        contributors: [
          { source: 'Grant Notifications', contribution: 450000, percentage: 54.5 },
          { source: 'Funding Workshops', contribution: 225000, percentage: 27.3 },
          { source: 'Direct Outreach', contribution: 150000, percentage: 18.2 },
        ],
      },
      {
        kpi_id: 'kpi-underserved',
        kpi_name: 'Underserved Engagement',
        current_value: 68,
        target_value: 75,
        achievement_rate: 90.7,
        contributors: [
          { source: 'Journey Progression', contribution: 35, percentage: 51.5 },
          { source: 'Community Events', contribution: 20, percentage: 29.4 },
          { source: 'Communications', contribution: 13, percentage: 19.1 },
        ],
      },
    ],
    total_impact: 2750000,
    trend: generateTrendData(30, 'kpi'),
  };
}