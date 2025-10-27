'use client'

/**
 * CRM Forecasting Reports
 * Smart Code: HERA.ENTERPRISE.CRM.REPORTS.FORECASTING.v1
 * 
 * Sales forecasting and predictive analytics
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
  Zap,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Users,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react'

export default function CRMForecastingReportsPage() {
  const forecastingData = {
    moduleTitle: "Sales Forecasting",
    breadcrumb: "Sales & Distribution → CRM → Reports → Forecasting",
    overview: {
      title: "AI-Powered Sales Forecasting",
      subtitle: "Predictive Revenue & Performance Analytics",
      kpis: [
        {
          title: "Q4 Forecast",
          value: "$3.2M",
          subtitle: "Predicted revenue",
          trend: "up" as const,
          trendValue: "95% confidence",
          icon: Target
        },
        {
          title: "Forecast Accuracy",
          value: "92.4",
          unit: "%",
          subtitle: "Historical accuracy",
          trend: "up" as const,
          trendValue: "+2.1% improved",
          icon: Star
        },
        {
          title: "Pipeline Coverage",
          value: "3.2x",
          subtitle: "Pipeline to quota ratio",
          trend: "up" as const,
          trendValue: "Above recommended 3x",
          icon: BarChart3
        },
        {
          title: "Commit Forecast",
          value: "$2.8M",
          subtitle: "High-confidence deals",
          trend: "up" as const,
          trendValue: "87% of quota",
          icon: CheckCircle
        },
        {
          title: "Best Case",
          value: "$3.8M",
          subtitle: "Optimistic scenario",
          trend: "up" as const,
          trendValue: "118% of quota",
          icon: ArrowUp
        },
        {
          title: "Risk Assessment",
          value: "Low",
          subtitle: "Forecast risk level",
          trend: "neutral" as const,
          trendValue: "Stable indicators",
          icon: AlertTriangle
        }
      ]
    },
    sections: [
      {
        title: "Revenue Forecasting",
        items: [
          {
            title: "AI Revenue Forecast",
            subtitle: "Machine learning predictions",
            icon: Brain,
            href: "/enterprise/sales/crm/reports/forecasting/ai-revenue"
          },
          {
            title: "Quarterly Forecasts",
            subtitle: "Quarter-end projections",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/forecasting/quarterly"
          },
          {
            title: "Monthly Forecasts",
            subtitle: "Month-end predictions",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/forecasting/monthly"
          },
          {
            title: "Rolling Forecasts",
            subtitle: "Dynamic 12-month outlook",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/forecasting/rolling"
          },
          {
            title: "Scenario Planning",
            subtitle: "Best/worst/likely cases",
            icon: Activity,
            href: "/enterprise/sales/crm/reports/forecasting/scenarios"
          },
          {
            title: "Forecast Accuracy",
            subtitle: "Historical accuracy tracking",
            icon: Star,
            href: "/enterprise/sales/crm/reports/forecasting/accuracy"
          }
        ]
      },
      {
        title: "Predictive Analytics",
        items: [
          {
            title: "Deal Probability Scoring",
            subtitle: "AI-powered win probability",
            icon: Zap,
            href: "/enterprise/sales/crm/reports/forecasting/probability"
          },
          {
            title: "Close Date Predictions",
            subtitle: "Expected close date analysis",
            icon: Clock,
            href: "/enterprise/sales/crm/reports/forecasting/close-dates"
          },
          {
            title: "Pipeline Velocity Forecast",
            subtitle: "Deal progression predictions",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/forecasting/velocity"
          },
          {
            title: "Churn Risk Forecasting",
            subtitle: "Customer retention predictions",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/reports/forecasting/churn"
          },
          {
            title: "Upsell Opportunity Forecast",
            subtitle: "Expansion revenue predictions",
            icon: ArrowUp,
            href: "/enterprise/sales/crm/reports/forecasting/upsell"
          },
          {
            title: "Market Trend Analysis",
            subtitle: "External factor impacts",
            icon: Eye,
            href: "/enterprise/sales/crm/reports/forecasting/market-trends"
          }
        ]
      },
      {
        title: "Team Forecasting",
        items: [
          {
            title: "Rep Performance Forecast",
            subtitle: "Individual performance predictions",
            icon: Users,
            href: "/enterprise/sales/crm/reports/forecasting/rep-performance"
          },
          {
            title: "Territory Forecasts",
            subtitle: "Geographic performance outlook",
            icon: Target,
            href: "/enterprise/sales/crm/reports/forecasting/territory"
          },
          {
            title: "Quota Attainment Forecast",
            subtitle: "Quota achievement predictions",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/reports/forecasting/quota"
          },
          {
            title: "Capacity Planning",
            subtitle: "Resource requirement forecasts",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/forecasting/capacity"
          },
          {
            title: "Hiring Impact Analysis",
            subtitle: "New hire performance modeling",
            icon: Users,
            href: "/enterprise/sales/crm/reports/forecasting/hiring"
          },
          {
            title: "Team Goal Tracking",
            subtitle: "Progress toward team objectives",
            icon: Star,
            href: "/enterprise/sales/crm/reports/forecasting/team-goals"
          }
        ]
      },
      {
        title: "Advanced Forecasting",
        items: [
          {
            title: "Machine Learning Models",
            subtitle: "Custom ML forecast models",
            icon: Brain,
            href: "/enterprise/sales/crm/reports/forecasting/ml-models"
          },
          {
            title: "Forecast Confidence Intervals",
            subtitle: "Statistical confidence bands",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/forecasting/confidence"
          },
          {
            title: "Multi-variable Forecasting",
            subtitle: "Complex factor analysis",
            icon: Activity,
            href: "/enterprise/sales/crm/reports/forecasting/multi-variable"
          },
          {
            title: "Seasonal Adjustments",
            subtitle: "Seasonality-adjusted forecasts",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/forecasting/seasonal"
          },
          {
            title: "External Data Integration",
            subtitle: "Market data enhanced forecasts",
            icon: Eye,
            href: "/enterprise/sales/crm/reports/forecasting/external"
          },
          {
            title: "Forecast Model Comparison",
            subtitle: "Model performance analysis",
            icon: PieChart,
            href: "/enterprise/sales/crm/reports/forecasting/model-comparison"
          }
        ]
      },
      {
        title: "Forecast Management",
        items: [
          {
            title: "Forecast Submission",
            subtitle: "Submit manager forecasts",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/reports/forecasting/submission"
          },
          {
            title: "Forecast Adjustments",
            subtitle: "Manual forecast overrides",
            icon: Target,
            href: "/enterprise/sales/crm/reports/forecasting/adjustments"
          },
          {
            title: "Forecast Reviews",
            subtitle: "Review and approval workflow",
            icon: Star,
            href: "/enterprise/sales/crm/reports/forecasting/reviews"
          },
          {
            title: "Forecast Collaboration",
            subtitle: "Team forecast discussions",
            icon: Users,
            href: "/enterprise/sales/crm/reports/forecasting/collaboration"
          },
          {
            title: "Forecast Exports",
            subtitle: "Export forecasts for analysis",
            icon: DollarSign,
            href: "/enterprise/sales/crm/reports/forecasting/exports"
          },
          {
            title: "Forecast Alerts",
            subtitle: "Automated forecast notifications",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/reports/forecasting/alerts"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.forecasting"]}>
      <ModuleHomePage
        moduleTitle={forecastingData.moduleTitle}
        breadcrumb={forecastingData.breadcrumb}
        overview={forecastingData.overview}
        sections={forecastingData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}