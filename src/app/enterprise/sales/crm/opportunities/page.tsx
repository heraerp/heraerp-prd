'use client'

/**
 * Enterprise CRM Opportunity Management
 * Smart Code: HERA.ENTERPRISE.CRM.OPPORTUNITIES.v1
 * 
 * Enterprise-integrated opportunity management following ModuleHomePage pattern
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Star,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  PieChart,
  Award,
  AlertTriangle
} from 'lucide-react'

export default function EnterpriseCRMOpportunitiesPage() {
  const opportunitiesData = {
    moduleTitle: "Opportunity Management",
    breadcrumb: "Sales & Distribution → CRM → Opportunities",
    overview: {
      title: "Sales Pipeline Overview",
      subtitle: "Revenue Opportunities Tracking",
      kpis: [
        {
          title: "Pipeline Value",
          value: "$2.4M",
          subtitle: "Total open opportunities",
          trend: "up" as const,
          trendValue: "+18.5%",
          icon: DollarSign
        },
        {
          title: "Open Opportunities",
          value: "38",
          subtitle: "Active deals",
          trend: "up" as const,
          trendValue: "+5 this week",
          icon: Target
        },
        {
          title: "Win Probability",
          value: "68",
          unit: "%",
          subtitle: "Weighted average",
          trend: "up" as const,
          trendValue: "+12%",
          icon: Star
        },
        {
          title: "Avg Deal Size",
          value: "$125K",
          subtitle: "Per opportunity",
          trend: "up" as const,
          trendValue: "+8.2%",
          icon: Award
        },
        {
          title: "Closing This Quarter",
          value: "14",
          subtitle: "Expected closes",
          trend: "neutral" as const,
          trendValue: "On track",
          icon: Calendar
        },
        {
          title: "Overdue Follow-ups",
          value: "6",
          subtitle: "Need attention",
          trend: "down" as const,
          trendValue: "-2 resolved",
          icon: AlertTriangle
        }
      ]
    },
    sections: [
      {
        title: "Pipeline Management",
        items: [
          {
            title: "Sales Pipeline",
            subtitle: "Kanban board view",
            icon: Target,
            href: "/demo-org/00000000-0000-0000-0000-000000000001/crm-sales/opportunities",
            badge: "Hot"
          },
          {
            title: "Pipeline Stages",
            subtitle: "Configure sales stages",
            icon: BarChart3,
            href: "/enterprise/sales/crm/opportunities/stages"
          },
          {
            title: "Probability Settings",
            subtitle: "Stage win probabilities",
            icon: Star,
            href: "/enterprise/sales/crm/opportunities/probability"
          },
          {
            title: "Stage Automation",
            subtitle: "Automated progression rules",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/opportunities/automation"
          }
        ]
      },
      {
        title: "Opportunity Actions",
        items: [
          {
            title: "Create Opportunity",
            subtitle: "New sales opportunity",
            icon: Target,
            href: "/enterprise/sales/crm/opportunities/create"
          },
          {
            title: "Convert from Lead",
            subtitle: "Lead to opportunity",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/opportunities/convert"
          },
          {
            title: "Bulk Updates",
            subtitle: "Mass opportunity changes",
            icon: Users,
            href: "/enterprise/sales/crm/opportunities/bulk"
          },
          {
            title: "Opportunity Templates",
            subtitle: "Predefined deal structures",
            icon: FileText,
            href: "/enterprise/sales/crm/opportunities/templates"
          },
          {
            title: "Follow-up Tasks",
            subtitle: "Activity management",
            icon: Clock,
            href: "/enterprise/sales/crm/opportunities/tasks"
          },
          {
            title: "Close Management",
            subtitle: "Win/loss processing",
            icon: Award,
            href: "/enterprise/sales/crm/opportunities/close"
          }
        ]
      },
      {
        title: "Forecasting & Analytics",
        items: [
          {
            title: "Sales Forecasting",
            subtitle: "Revenue predictions",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/opportunities/forecasting"
          },
          {
            title: "Pipeline Analytics",
            subtitle: "Stage conversion rates",
            icon: BarChart3,
            href: "/enterprise/sales/crm/opportunities/analytics"
          },
          {
            title: "Win/Loss Analysis",
            subtitle: "Deal outcome insights",
            icon: PieChart,
            href: "/enterprise/sales/crm/opportunities/winloss"
          },
          {
            title: "Deal Velocity",
            subtitle: "Sales cycle analysis",
            icon: Clock,
            href: "/enterprise/sales/crm/opportunities/velocity"
          },
          {
            title: "Rep Performance",
            subtitle: "Individual metrics",
            icon: Users,
            href: "/enterprise/sales/crm/opportunities/performance"
          },
          {
            title: "Territory Analysis",
            subtitle: "Geographic performance",
            icon: Target,
            href: "/enterprise/sales/crm/opportunities/territory"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.opportunities"]}>
      <ModuleHomePage
        moduleTitle={opportunitiesData.moduleTitle}
        breadcrumb={opportunitiesData.breadcrumb}
        overview={opportunitiesData.overview}
        sections={opportunitiesData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}