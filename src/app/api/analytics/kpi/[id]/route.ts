import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo-guard';
import type { KPITrend } from '@/types/analytics';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const kpiId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const isDemo = isDemoMode(orgId);
    
    const filters = {
      date_from: searchParams.get('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      date_to: searchParams.get('date_to') || new Date().toISOString(),
    };
    
    if (isDemo) {
      // Generate demo trend data
      const mockTrend: KPITrend = {
        kpi: {
          id: kpiId,
          entity_code: 'KPI-DEMO',
          entity_name: 'Demo KPI',
          smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.DEMO.v1',
          organization_id: orgId,
          definition: {
            name: 'Demo KPI',
            description: 'Sample KPI for demonstration',
            category: 'operational',
          },
          window: { type: 'rolling', duration: 30 },
          calculation: { method: 'sum' },
          attribution_rules: [],
          current_value: 85000,
          target_value: 100000,
          unit: 'USD',
          direction: 'increase',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        series: generateTimeSeries(30),
        attribution_breakdown: [
          {
            source: 'Communications',
            contribution: 35000,
            percentage: 41.2,
            details: {
              email_campaigns: 20000,
              sms_outreach: 10000,
              social_media: 5000,
            },
          },
          {
            source: 'Events',
            contribution: 25000,
            percentage: 29.4,
            details: {
              workshops: 15000,
              webinars: 8000,
              conferences: 2000,
            },
          },
          {
            source: 'Journey Progression',
            contribution: 25000,
            percentage: 29.4,
            details: {
              stage_transitions: 18000,
              completed_journeys: 7000,
            },
          },
        ],
        related_activities: [
          { type: 'Emails Sent', count: 4520, impact: 15.2 },
          { type: 'Events Held', count: 12, impact: 28.5 },
          { type: 'Journeys Completed', count: 234, impact: 32.1 },
          { type: 'Advocacy Actions', count: 567, impact: 24.2 },
        ],
      };
      
      return NextResponse.json(mockTrend);
    }
    
    // Fetch real KPI and trend data
    const { data: kpiEntity, error: kpiError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*)
      `)
      .eq('id', kpiId)
      .eq('organization_id', orgId)
      .single();
    
    if (kpiError || !kpiEntity) {
      return NextResponse.json(
        { error: 'KPI not found' },
        { status: 404 }
      );
    }
    
    // Transform entity to KPI type
    const dynamicData = kpiEntity.core_dynamic_data || [];
    const getField = (name: string) => {
      const field = dynamicData.find((f: any) => f.field_name === name);
      return field?.field_value_json || field?.field_value_number || field?.field_value_text;
    };
    
    const kpi = {
      id: kpiEntity.id,
      entity_code: kpiEntity.entity_code,
      entity_name: kpiEntity.entity_name,
      smart_code: kpiEntity.smart_code,
      organization_id: kpiEntity.organization_id,
      definition: getField('definition') || {
        name: kpiEntity.entity_name,
        description: '',
        category: 'operational',
      },
      window: getField('window') || { type: 'rolling', duration: 30 },
      calculation: getField('calculation') || { method: 'count' },
      attribution_rules: getField('attribution_rules') || [],
      current_value: getField('current_value'),
      target_value: getField('target_value'),
      unit: getField('unit'),
      direction: getField('direction'),
      last_updated: getField('last_updated'),
      created_at: kpiEntity.created_at,
      updated_at: kpiEntity.updated_at,
    };
    
    // Fetch historical trend data (would be from a time-series table in production)
    const series = generateTimeSeries(30); // Mock for now
    
    // Get attribution data from latest computation
    const latestAttribution = getField('latest_attribution') || {};
    
    const trend: KPITrend = {
      kpi,
      series,
      attribution_breakdown: latestAttribution.breakdown || [],
      related_activities: latestAttribution.activities || [],
    };
    
    return NextResponse.json(trend);
  } catch (error) {
    console.error('Error fetching KPI trend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI trend' },
      { status: 500 }
    );
  }
}

function generateTimeSeries(days: number) {
  const series = [];
  const now = new Date();
  let currentValue = 50000;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Add some realistic variation
    const dailyChange = (Math.random() - 0.3) * 5000;
    currentValue = Math.max(0, currentValue + dailyChange);
    
    series.push({
      timestamp: date.toISOString(),
      value: Math.round(currentValue),
      label: date.toLocaleDateString(),
      metadata: {
        day_of_week: date.getDay(),
        is_weekend: date.getDay() === 0 || date.getDay() === 6,
      },
    });
  }
  
  return series;
}