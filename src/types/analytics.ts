// Types for CivicFlow Analytics and KPI Attribution

export interface KPI {
  id: string;
  entity_code: string;
  entity_name: string;
  smart_code: string;
  organization_id: string;
  // Dynamic data fields
  definition: KPIDefinition;
  window: KPIWindow;
  calculation: KPICalculation;
  attribution_rules: AttributionRule[];
  current_value?: number;
  target_value?: number;
  unit?: string;
  direction?: 'increase' | 'decrease' | 'maintain';
  last_updated?: string;
  created_at: string;
  updated_at: string;
}

export interface KPIDefinition {
  name: string;
  description: string;
  category: 'deliverability' | 'engagement' | 'attendance' | 'journey' | 'financial' | 'social' | 'operational';
  tags?: string[];
  owner?: string;
  reporting_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface KPIWindow {
  type: 'rolling' | 'fixed' | 'cumulative';
  duration?: number; // days
  start_date?: string;
  end_date?: string;
}

export interface KPICalculation {
  method: 'sum' | 'average' | 'count' | 'percentage' | 'ratio' | 'custom';
  numerator?: string; // SQL expression or field
  denominator?: string; // For percentage/ratio
  aggregation?: string; // SQL aggregation function
  filters?: Record<string, any>;
}

export interface AttributionRule {
  source: 'communication' | 'event' | 'advocacy' | 'journey' | 'transaction';
  weight: number; // 0-1
  conditions?: Record<string, any>;
  time_decay?: boolean;
  window_days?: number;
}

export interface AnalyticsPanelData {
  deliverability: DeliverabilityMetrics;
  engagement_funnel: EngagementFunnelMetrics;
  event_attendance: EventAttendanceMetrics;
  journey_progression: JourneyProgressionMetrics;
  kpi_contribution: KPIContributionMetrics;
}

export interface DeliverabilityMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  trend: TimeSeriesData[];
}

export interface EngagementFunnelMetrics {
  stages: {
    stage_name: string;
    count: number;
    percentage: number;
    conversion_rate: number;
  }[];
  total_journeys: number;
  avg_time_to_convert: number;
  trend: TimeSeriesData[];
}

export interface EventAttendanceMetrics {
  total_events: number;
  total_invited: number;
  total_registered: number;
  total_attended: number;
  attendance_rate: number;
  no_show_rate: number;
  events_by_type: {
    type: string;
    count: number;
    attendance_rate: number;
  }[];
  trend: TimeSeriesData[];
}

export interface JourneyProgressionMetrics {
  active_journeys: number;
  completed_journeys: number;
  avg_journey_duration: number;
  stage_distribution: {
    stage_name: string;
    count: number;
    avg_score: number;
  }[];
  score_distribution: {
    range: string;
    count: number;
  }[];
  trend: TimeSeriesData[];
}

export interface KPIContributionMetrics {
  kpis: {
    kpi_id: string;
    kpi_name: string;
    current_value: number;
    target_value: number;
    achievement_rate: number;
    contributors: {
      source: string;
      contribution: number;
      percentage: number;
    }[];
  }[];
  total_impact: number;
  trend: TimeSeriesData[];
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsFilters {
  program_ids?: string[];
  date_from?: string;
  date_to?: string;
  tags?: string[];
  channels?: string[];
  segment?: string;
}

export interface KPITrend {
  kpi: KPI;
  series: TimeSeriesData[];
  attribution_breakdown: {
    source: string;
    contribution: number;
    percentage: number;
    details: Record<string, any>;
  }[];
  related_activities: {
    type: string;
    count: number;
    impact: number;
  }[];
}

export interface KPIUpdateRequest {
  kpi_id: string;
  current_value: number;
  attribution_data?: Record<string, any>;
  computation_metadata?: {
    start_time: string;
    end_time: string;
    records_processed: number;
    computation_version?: string;
  };
}

// Predefined KPI templates
export const KPI_TEMPLATES = {
  FLOWS_OF_FINANCE: {
    name: 'Flows of Finance',
    smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.FLOWS_OF_FINANCE.v1',
    definition: {
      name: 'Flows of Finance',
      description: 'Track financial resource allocation and distribution across programs',
      category: 'financial' as const,
      reporting_frequency: 'monthly' as const,
    },
    calculation: {
      method: 'sum' as const,
      aggregation: 'SUM(transaction_amount)',
      filters: {
        transaction_type: ['grant', 'payment', 'allocation'],
      },
    },
    attribution_rules: [
      { source: 'transaction' as const, weight: 0.7 },
      { source: 'communication' as const, weight: 0.2, conditions: { type: 'grant_notification' } },
      { source: 'event' as const, weight: 0.1, conditions: { type: 'funding_workshop' } },
    ],
  },
  UNDERSERVED_ENGAGEMENT: {
    name: 'Underserved Engagement',
    smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.UNDERSERVED_ENGAGEMENT.v1',
    definition: {
      name: 'Underserved Engagement',
      description: 'Measure engagement levels with underserved communities',
      category: 'engagement' as const,
      reporting_frequency: 'weekly' as const,
    },
    calculation: {
      method: 'percentage' as const,
      numerator: 'engaged_underserved_count',
      denominator: 'total_underserved_count',
    },
    attribution_rules: [
      { source: 'journey' as const, weight: 0.4 },
      { source: 'event' as const, weight: 0.3, conditions: { tags: ['underserved', 'community'] } },
      { source: 'communication' as const, weight: 0.3, time_decay: true, window_days: 30 },
    ],
  },
  PROGRAM_EFFECTIVENESS: {
    name: 'Program Effectiveness',
    smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.PROGRAM_EFFECTIVENESS.v1',
    definition: {
      name: 'Program Effectiveness',
      description: 'Measure the overall effectiveness of programs in achieving objectives',
      category: 'operational' as const,
      reporting_frequency: 'quarterly' as const,
    },
    calculation: {
      method: 'ratio' as const,
      numerator: 'successful_outcomes',
      denominator: 'total_participants',
    },
    attribution_rules: [
      { source: 'advocacy' as const, weight: 0.5 },
      { source: 'journey' as const, weight: 0.3 },
      { source: 'event' as const, weight: 0.2 },
    ],
  },
};