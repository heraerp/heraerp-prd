'use client'

/**
 * CRM Pipeline Reports
 * Smart Code: HERA.ENTERPRISE.CRM.REPORTS.PIPELINE.v1
 * 
 * Sales pipeline analytics and stage analysis
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Users,
  Filter,
  ArrowRight,
  Layers,
  Zap,
  AlertTriangle,
  CheckCircle,
  Star,
  Award,
  Activity
} from 'lucide-react'

export default function CRMPipelineReportsPage() {
  const pipelineData = {
    moduleTitle: "Pipeline Reports",
    breadcrumb: "Sales & Distribution → CRM → Reports → Pipeline",
    overview: {
      title: "Sales Pipeline Analytics",
      subtitle: "Stage Analysis & Conversion Insights",
      kpis: [
        {
          title: "Total Pipeline Value",
          value: "$2.4M",
          subtitle: "Active opportunities",
          trend: "up" as const,
          trendValue: "+18.5%",
          icon: DollarSign
        },
        {
          title: "Weighted Pipeline",
          value: "$1.6M",
          subtitle: "Probability-adjusted value",
          trend: "up" as const,
          trendValue: "+22.3%",
          icon: Target
        },
        {
          title: "Stage Conversion",
          value: "68.4",
          unit: "%",
          subtitle: "Overall conversion rate",
          trend: "up" as const,
          trendValue: "+5.2%",
          icon: TrendingUp
        },
        {
          title: "Average Deal Size",
          value: "$125K",
          subtitle: "Per opportunity",
          trend: "up" as const,
          trendValue: "+8.7%",
          icon: Award
        },
        {
          title: "Velocity",
          value: "45",
          unit: " days",
          subtitle: "Average sales cycle",
          trend: "down" as const,
          trendValue: "-12 days faster",
          icon: Clock
        },
        {
          title: "Win Rate",
          value: "24.8",
          unit: "%",
          subtitle: "Closed-won percentage",
          trend: "up" as const,
          trendValue: "+3.1%",
          icon: CheckCircle
        }
      ]
    },
    sections: [
      {
        title: "Pipeline Overview",
        items: [
          {
            title: "Pipeline Snapshot",
            subtitle: "Current pipeline state",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/pipeline/snapshot"
          },
          {
            title: "Pipeline by Stage",
            subtitle: "Opportunities per stage",
            icon: Layers,
            href: "/enterprise/sales/crm/reports/pipeline/stages"
          },
          {
            title: "Pipeline Value Trends",
            subtitle: "Historical pipeline value",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/pipeline/trends"
          },
          {
            title: "Weighted Pipeline",
            subtitle: "Probability-adjusted analysis",
            icon: Target,
            href: "/enterprise/sales/crm/reports/pipeline/weighted"
          },
          {
            title: "Pipeline Health Score",
            subtitle: "Overall pipeline quality",
            icon: Star,
            href: "/enterprise/sales/crm/reports/pipeline/health"
          },
          {
            title: "Pipeline Velocity",
            subtitle: "Deal progression speed",
            icon: Clock,
            href: "/enterprise/sales/crm/reports/pipeline/velocity"
          }
        ]
      },
      {
        title: "Stage Analysis",
        items: [
          {
            title: "Stage Conversion Rates",
            subtitle: "Conversion between stages",
            icon: ArrowRight,
            href: "/enterprise/sales/crm/reports/pipeline/conversion"
          },
          {
            title: "Stage Duration Analysis",
            subtitle: "Time spent in each stage",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/pipeline/duration"
          },
          {
            title: "Stage Drop-off Analysis",
            subtitle: "Where deals are lost",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/reports/pipeline/dropoff"
          },
          {
            title: "Stage Bottlenecks",
            subtitle: "Identify pipeline blockages",
            icon: Filter,
            href: "/enterprise/sales/crm/reports/pipeline/bottlenecks"
          },
          {
            title: "Win/Loss by Stage",
            subtitle: "Outcome analysis per stage",
            icon: PieChart,
            href: "/enterprise/sales/crm/reports/pipeline/winloss"
          },
          {
            title: "Stage Performance Trends",
            subtitle: "Historical stage metrics",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/pipeline/stage-trends"
          }
        ]
      },
      {
        title: "Pipeline Forecasting",
        items: [
          {
            title: "Revenue Forecasting",
            subtitle: "Predicted revenue by period",
            icon: Zap,
            href: "/enterprise/sales/crm/reports/pipeline/forecasting"
          },
          {
            title: "Close Date Predictions",
            subtitle: "AI-powered close date estimates",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/pipeline/predictions"
          },
          {
            title: "Quarterly Projections",
            subtitle: "Quarter-end pipeline analysis",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/pipeline/quarterly"
          },
          {
            title: "Pipeline Coverage",
            subtitle: "Pipeline vs quota analysis",
            icon: Target,
            href: "/enterprise/sales/crm/reports/pipeline/coverage"
          },
          {
            title: "Risk Analysis",
            subtitle: "At-risk deals identification",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/reports/pipeline/risk"
          },
          {
            title: "Scenario Planning",
            subtitle: "Best/worst case scenarios",
            icon: Activity,
            href: "/enterprise/sales/crm/reports/pipeline/scenarios"
          }
        ]
      },
      {
        title: "Advanced Analytics",
        items: [
          {
            title: "Pipeline Cohort Analysis",
            subtitle: "Deal progression patterns",
            icon: Users,
            href: "/enterprise/sales/crm/reports/pipeline/cohort"
          },
          {
            title: "Seasonal Pipeline Trends",
            subtitle: "Time-based pipeline patterns",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/pipeline/seasonal"
          },
          {
            title: "Pipeline Quality Scoring",
            subtitle: "Deal quality assessment",
            icon: Star,
            href: "/enterprise/sales/crm/reports/pipeline/quality"
          },
          {
            title: "Competitive Analysis",
            subtitle: "Pipeline vs competitors",
            icon: Award,
            href: "/enterprise/sales/crm/reports/pipeline/competitive"
          },
          {
            title: "Pipeline Segmentation",
            subtitle: "Pipeline by customer segments",
            icon: Filter,
            href: "/enterprise/sales/crm/reports/pipeline/segmentation"
          },
          {
            title: "Pipeline ROI Analysis",
            subtitle: "Return on pipeline investment",
            icon: DollarSign,
            href: "/enterprise/sales/crm/reports/pipeline/roi"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.reports"]}>
      <ModuleHomePage
        moduleTitle={pipelineData.moduleTitle}
        breadcrumb={pipelineData.breadcrumb}
        overview={pipelineData.overview}
        sections={pipelineData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}