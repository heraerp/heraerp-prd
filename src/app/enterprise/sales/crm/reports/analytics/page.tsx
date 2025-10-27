'use client'

/**
 * CRM Advanced Analytics
 * Smart Code: HERA.ENTERPRISE.CRM.REPORTS.ANALYTICS.v1
 * 
 * Advanced CRM analytics and business intelligence
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Brain,
  Target,
  Users,
  DollarSign,
  Zap,
  Eye,
  Activity,
  Star,
  Filter,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  Database
} from 'lucide-react'

export default function CRMAdvancedAnalyticsPage() {
  const analyticsData = {
    moduleTitle: "Advanced Analytics",
    breadcrumb: "Sales & Distribution → CRM → Reports → Advanced Analytics",
    overview: {
      title: "CRM Business Intelligence",
      subtitle: "Deep Insights & Advanced Analytics",
      kpis: [
        {
          title: "Data Points Analyzed",
          value: "2.4M",
          subtitle: "Customer touchpoints",
          trend: "up" as const,
          trendValue: "+150K this month",
          icon: Database
        },
        {
          title: "Predictive Accuracy",
          value: "94.2",
          unit: "%",
          subtitle: "AI model accuracy",
          trend: "up" as const,
          trendValue: "+2.3% improved",
          icon: Brain
        },
        {
          title: "Customer Insights",
          value: "847",
          subtitle: "Actionable insights generated",
          trend: "up" as const,
          trendValue: "+67 this week",
          icon: Eye
        },
        {
          title: "ROI Optimization",
          value: "23.8",
          unit: "%",
          subtitle: "Process improvement",
          trend: "up" as const,
          trendValue: "+5.2% efficiency gain",
          icon: TrendingUp
        },
        {
          title: "Anomaly Detection",
          value: "12",
          subtitle: "Patterns identified",
          trend: "neutral" as const,
          trendValue: "4 resolved",
          icon: AlertTriangle
        },
        {
          title: "Analytics Score",
          value: "89",
          unit: "/100",
          subtitle: "Overall analytics health",
          trend: "up" as const,
          trendValue: "+7 points",
          icon: Star
        }
      ]
    },
    sections: [
      {
        title: "Customer Analytics",
        items: [
          {
            title: "Customer Lifetime Value",
            subtitle: "CLV modeling and analysis",
            icon: DollarSign,
            href: "/enterprise/sales/crm/reports/analytics/clv"
          },
          {
            title: "Customer Segmentation",
            subtitle: "AI-powered customer grouping",
            icon: Filter,
            href: "/enterprise/sales/crm/reports/analytics/segmentation"
          },
          {
            title: "Churn Analysis",
            subtitle: "Customer retention insights",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/reports/analytics/churn"
          },
          {
            title: "Customer Journey Mapping",
            subtitle: "Touchpoint analysis",
            icon: Activity,
            href: "/enterprise/sales/crm/reports/analytics/journey"
          },
          {
            title: "Customer Health Scoring",
            subtitle: "Relationship strength metrics",
            icon: Star,
            href: "/enterprise/sales/crm/reports/analytics/health"
          },
          {
            title: "Purchase Behavior Analysis",
            subtitle: "Buying pattern insights",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/analytics/behavior"
          }
        ]
      },
      {
        title: "Sales Intelligence",
        items: [
          {
            title: "Win/Loss Analysis",
            subtitle: "Deep dive into deal outcomes",
            icon: Award,
            href: "/enterprise/sales/crm/reports/analytics/winloss"
          },
          {
            title: "Sales Pattern Recognition",
            subtitle: "Identify successful patterns",
            icon: Eye,
            href: "/enterprise/sales/crm/reports/analytics/patterns"
          },
          {
            title: "Competitive Analysis",
            subtitle: "Market position insights",
            icon: Target,
            href: "/enterprise/sales/crm/reports/analytics/competitive"
          },
          {
            title: "Product Performance",
            subtitle: "Product sales analytics",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/analytics/products"
          },
          {
            title: "Sales Cycle Analysis",
            subtitle: "Deal progression insights",
            icon: Clock,
            href: "/enterprise/sales/crm/reports/analytics/cycle"
          },
          {
            title: "Cross-sell/Upsell Analytics",
            subtitle: "Revenue expansion opportunities",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/analytics/expansion"
          }
        ]
      },
      {
        title: "Predictive Analytics",
        items: [
          {
            title: "AI-Powered Insights",
            subtitle: "Machine learning predictions",
            icon: Brain,
            href: "/enterprise/sales/crm/reports/analytics/ai-insights"
          },
          {
            title: "Predictive Lead Scoring",
            subtitle: "ML-based lead qualification",
            icon: Zap,
            href: "/enterprise/sales/crm/reports/analytics/lead-scoring"
          },
          {
            title: "Next Best Action",
            subtitle: "AI-recommended actions",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/reports/analytics/next-action"
          },
          {
            title: "Anomaly Detection",
            subtitle: "Unusual pattern identification",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/reports/analytics/anomalies"
          },
          {
            title: "Trend Forecasting",
            subtitle: "Future trend predictions",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/analytics/trends"
          },
          {
            title: "Risk Assessment",
            subtitle: "Business risk analysis",
            icon: Target,
            href: "/enterprise/sales/crm/reports/analytics/risk"
          }
        ]
      },
      {
        title: "Performance Analytics",
        items: [
          {
            title: "Team Performance Analytics",
            subtitle: "Advanced team metrics",
            icon: Users,
            href: "/enterprise/sales/crm/reports/analytics/team"
          },
          {
            title: "Activity Effectiveness",
            subtitle: "Communication impact analysis",
            icon: Activity,
            href: "/enterprise/sales/crm/reports/analytics/activity"
          },
          {
            title: "Territory Analytics",
            subtitle: "Geographic performance insights",
            icon: Target,
            href: "/enterprise/sales/crm/reports/analytics/territory"
          },
          {
            title: "Pipeline Analytics",
            subtitle: "Advanced pipeline insights",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/analytics/pipeline"
          },
          {
            title: "Revenue Attribution",
            subtitle: "Revenue source analysis",
            icon: DollarSign,
            href: "/enterprise/sales/crm/reports/analytics/attribution"
          },
          {
            title: "Conversion Funnel Analysis",
            subtitle: "Stage conversion insights",
            icon: Filter,
            href: "/enterprise/sales/crm/reports/analytics/funnel"
          }
        ]
      },
      {
        title: "Data Science & BI",
        items: [
          {
            title: "Custom Analytics Models",
            subtitle: "Build custom ML models",
            icon: Brain,
            href: "/enterprise/sales/crm/reports/analytics/custom-models"
          },
          {
            title: "Data Mining",
            subtitle: "Deep data exploration",
            icon: Database,
            href: "/enterprise/sales/crm/reports/analytics/data-mining"
          },
          {
            title: "Statistical Analysis",
            subtitle: "Advanced statistical insights",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/analytics/statistics"
          },
          {
            title: "Cohort Analysis",
            subtitle: "Customer behavior cohorts",
            icon: Users,
            href: "/enterprise/sales/crm/reports/analytics/cohort"
          },
          {
            title: "A/B Testing Analytics",
            subtitle: "Experiment result analysis",
            icon: Eye,
            href: "/enterprise/sales/crm/reports/analytics/ab-testing"
          },
          {
            title: "Real-time Analytics",
            subtitle: "Live data streaming insights",
            icon: Activity,
            href: "/enterprise/sales/crm/reports/analytics/realtime"
          }
        ]
      },
      {
        title: "Executive Insights",
        items: [
          {
            title: "Executive Dashboard",
            subtitle: "C-level analytics overview",
            icon: Star,
            href: "/enterprise/sales/crm/reports/analytics/executive"
          },
          {
            title: "Business Intelligence Reports",
            subtitle: "Strategic business insights",
            icon: Eye,
            href: "/enterprise/sales/crm/reports/analytics/bi-reports"
          },
          {
            title: "KPI Analytics",
            subtitle: "Key performance indicators",
            icon: Target,
            href: "/enterprise/sales/crm/reports/analytics/kpi"
          },
          {
            title: "ROI Analysis",
            subtitle: "Return on investment metrics",
            icon: DollarSign,
            href: "/enterprise/sales/crm/reports/analytics/roi"
          },
          {
            title: "Market Intelligence",
            subtitle: "External market insights",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/analytics/market"
          },
          {
            title: "Strategic Planning Analytics",
            subtitle: "Long-term planning insights",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/analytics/strategic"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.reports", "crm.admin"]}>
      <ModuleHomePage
        moduleTitle={analyticsData.moduleTitle}
        breadcrumb={analyticsData.breadcrumb}
        overview={analyticsData.overview}
        sections={analyticsData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}