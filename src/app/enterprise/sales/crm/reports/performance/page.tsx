'use client'

/**
 * CRM Performance Reports
 * Smart Code: HERA.ENTERPRISE.CRM.REPORTS.PERFORMANCE.v1
 * 
 * Sales team performance analytics and reporting
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  Award,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Star,
  Trophy,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Activity,
  Phone,
  Mail,
  CheckCircle
} from 'lucide-react'

export default function CRMPerformanceReportsPage() {
  const performanceData = {
    moduleTitle: "Performance Reports",
    breadcrumb: "Sales & Distribution → CRM → Reports → Performance",
    overview: {
      title: "Sales Team Performance Analytics",
      subtitle: "Individual & Team Performance Metrics",
      kpis: [
        {
          title: "Top Performer",
          value: "Sarah Wilson",
          subtitle: "142% of quota achieved",
          trend: "up" as const,
          trendValue: "+28% vs last quarter",
          icon: Trophy
        },
        {
          title: "Team Quota Achievement",
          value: "118",
          unit: "%",
          subtitle: "Above target this quarter",
          trend: "up" as const,
          trendValue: "+12%",
          icon: Target
        },
        {
          title: "Avg Deal Size",
          value: "$127K",
          subtitle: "Per closed opportunity",
          trend: "up" as const,
          trendValue: "+15.2%",
          icon: DollarSign
        },
        {
          title: "Sales Velocity",
          value: "32",
          unit: " days",
          subtitle: "Average deal cycle",
          trend: "down" as const,
          trendValue: "-8 days faster",
          icon: Clock
        },
        {
          title: "Conversion Rate",
          value: "24.8",
          unit: "%",
          subtitle: "Lead to customer",
          trend: "up" as const,
          trendValue: "+3.2%",
          icon: Star
        },
        {
          title: "Activity Score",
          value: "87",
          unit: "/100",
          subtitle: "Team activity index",
          trend: "up" as const,
          trendValue: "+5 points",
          icon: Activity
        }
      ]
    },
    sections: [
      {
        title: "Individual Performance",
        items: [
          {
            title: "Sales Rep Scorecards",
            subtitle: "Individual performance metrics",
            icon: Award,
            href: "/enterprise/sales/crm/reports/performance/scorecards"
          },
          {
            title: "Quota vs Achievement",
            subtitle: "Target performance tracking",
            icon: Target,
            href: "/enterprise/sales/crm/reports/performance/quota"
          },
          {
            title: "Revenue by Rep",
            subtitle: "Individual revenue contribution",
            icon: DollarSign,
            href: "/enterprise/sales/crm/reports/performance/revenue"
          },
          {
            title: "Activity Analysis",
            subtitle: "Calls, emails, meetings per rep",
            icon: Activity,
            href: "/enterprise/sales/crm/reports/performance/activities"
          },
          {
            title: "Deal Velocity by Rep",
            subtitle: "Individual sales cycle speed",
            icon: Clock,
            href: "/enterprise/sales/crm/reports/performance/velocity"
          },
          {
            title: "Win Rate Analysis",
            subtitle: "Success rates by rep",
            icon: Trophy,
            href: "/enterprise/sales/crm/reports/performance/winrate"
          }
        ]
      },
      {
        title: "Team Performance",
        items: [
          {
            title: "Team Leaderboards",
            subtitle: "Ranking and competitions",
            icon: Trophy,
            href: "/enterprise/sales/crm/reports/performance/leaderboards"
          },
          {
            title: "Territory Performance",
            subtitle: "Geographic performance analysis",
            icon: Target,
            href: "/enterprise/sales/crm/reports/performance/territories"
          },
          {
            title: "Team Metrics Dashboard",
            subtitle: "Overall team KPIs",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/performance/dashboard"
          },
          {
            title: "Collaboration Analysis",
            subtitle: "Team interaction metrics",
            icon: Users,
            href: "/enterprise/sales/crm/reports/performance/collaboration"
          },
          {
            title: "Performance Trends",
            subtitle: "Historical performance patterns",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/performance/trends"
          },
          {
            title: "Goal Tracking",
            subtitle: "Team objectives progress",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/reports/performance/goals"
          }
        ]
      },
      {
        title: "Performance Analytics",
        items: [
          {
            title: "Predictive Performance",
            subtitle: "AI-powered performance forecasting",
            icon: Zap,
            href: "/enterprise/sales/crm/reports/performance/predictive"
          },
          {
            title: "Performance Benchmarks",
            subtitle: "Industry and internal benchmarks",
            icon: Star,
            href: "/enterprise/sales/crm/reports/performance/benchmarks"
          },
          {
            title: "Coaching Insights",
            subtitle: "Performance improvement suggestions",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/reports/performance/coaching"
          },
          {
            title: "Performance Correlation",
            subtitle: "Activity-to-outcome analysis",
            icon: BarChart3,
            href: "/enterprise/sales/crm/reports/performance/correlation"
          },
          {
            title: "Time-based Analysis",
            subtitle: "Performance by time periods",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/performance/temporal"
          },
          {
            title: "Performance Exports",
            subtitle: "Data export and sharing",
            icon: PieChart,
            href: "/enterprise/sales/crm/reports/performance/exports"
          }
        ]
      },
      {
        title: "Communication Performance",
        items: [
          {
            title: "Call Performance",
            subtitle: "Phone activity and outcomes",
            icon: Phone,
            href: "/enterprise/sales/crm/reports/performance/calls"
          },
          {
            title: "Email Performance",
            subtitle: "Email activity and response rates",
            icon: Mail,
            href: "/enterprise/sales/crm/reports/performance/emails"
          },
          {
            title: "Meeting Effectiveness",
            subtitle: "Meeting outcomes and success",
            icon: Calendar,
            href: "/enterprise/sales/crm/reports/performance/meetings"
          },
          {
            title: "Follow-up Performance",
            subtitle: "Response time and consistency",
            icon: Clock,
            href: "/enterprise/sales/crm/reports/performance/followup"
          },
          {
            title: "Customer Engagement",
            subtitle: "Customer interaction quality",
            icon: Users,
            href: "/enterprise/sales/crm/reports/performance/engagement"
          },
          {
            title: "Communication ROI",
            subtitle: "Activity to revenue correlation",
            icon: DollarSign,
            href: "/enterprise/sales/crm/reports/performance/communication-roi"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.reports"]}>
      <ModuleHomePage
        moduleTitle={performanceData.moduleTitle}
        breadcrumb={performanceData.breadcrumb}
        overview={performanceData.overview}
        sections={performanceData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}