'use client'

/**
 * Enterprise CRM Lead Management
 * Smart Code: HERA.ENTERPRISE.CRM.LEADS.v1
 * 
 * Enterprise-integrated lead management following ModuleHomePage pattern
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  UserPlus,
  Target,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Filter,
  Plus,
  BarChart3,
  PieChart
} from 'lucide-react'

export default function EnterpriseCRMLeadsPage() {
  const leadsData = {
    moduleTitle: "Lead Management",
    breadcrumb: "Sales & Distribution → CRM → Lead Management",
    overview: {
      title: "Lead Pipeline Overview",
      subtitle: "AI-Powered Lead Qualification",
      kpis: [
        {
          title: "Active Leads",
          value: "247",
          subtitle: "Across all sources",
          trend: "up" as const,
          trendValue: "+12.5%",
          icon: Users
        },
        {
          title: "Qualified Leads",
          value: "89",
          subtitle: "Ready for conversion",
          trend: "up" as const,
          trendValue: "+8.2%",
          icon: CheckCircle
        },
        {
          title: "Lead Score Avg",
          value: "78",
          unit: "/100",
          subtitle: "AI qualification score",
          trend: "up" as const,
          trendValue: "+5.4%",
          icon: Star
        },
        {
          title: "Conversion Rate",
          value: "24.8",
          unit: "%",
          subtitle: "Lead to customer",
          trend: "up" as const,
          trendValue: "+2.1%",
          icon: Target
        },
        {
          title: "New This Week",
          value: "18",
          subtitle: "Fresh prospects",
          trend: "neutral" as const,
          trendValue: "Stable",
          icon: UserPlus
        },
        {
          title: "Needs Follow-up",
          value: "12",
          subtitle: "Action required",
          trend: "down" as const,
          trendValue: "-3 from yesterday",
          icon: AlertCircle
        }
      ]
    },
    sections: [
      {
        title: "Lead Qualification",
        items: [
          {
            title: "AI Lead Scoring",
            subtitle: "Machine learning qualification",
            icon: Star,
            href: "/enterprise/sales/crm/leads/scoring",
            badge: "Smart"
          },
          {
            title: "Manual Qualification",
            subtitle: "Sales rep review process",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/leads/qualify"
          },
          {
            title: "Lead Assignment Rules",
            subtitle: "Automatic routing setup",
            icon: Filter,
            href: "/enterprise/sales/crm/leads/assignment"
          },
          {
            title: "Qualification Workflows",
            subtitle: "Automated processes",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/leads/workflows"
          }
        ]
      },
      {
        title: "Lead Management",
        items: [
          {
            title: "All Leads",
            subtitle: "Complete lead database",
            icon: Users,
            href: "/demo-org/00000000-0000-0000-0000-000000000001/crm-sales/leads",
            badge: "247"
          },
          {
            title: "Create New Lead",
            subtitle: "Add prospect manually",
            icon: Plus,
            href: "/enterprise/sales/crm/leads/create"
          },
          {
            title: "Import Leads",
            subtitle: "Bulk import from CSV/Excel",
            icon: UserPlus,
            href: "/enterprise/sales/crm/leads/import"
          },
          {
            title: "Lead Sources",
            subtitle: "Manage acquisition channels",
            icon: Target,
            href: "/enterprise/sales/crm/leads/sources"
          },
          {
            title: "Lead Nurturing",
            subtitle: "Email campaigns & sequences",
            icon: Mail,
            href: "/enterprise/sales/crm/leads/nurturing"
          },
          {
            title: "Call Lists",
            subtitle: "Outbound calling queues",
            icon: Phone,
            href: "/enterprise/sales/crm/leads/calls"
          }
        ]
      },
      {
        title: "Lead Analytics",
        items: [
          {
            title: "Lead Conversion Funnel",
            subtitle: "Stage progression analysis",
            icon: BarChart3,
            href: "/enterprise/sales/crm/leads/analytics/funnel"
          },
          {
            title: "Source Performance",
            subtitle: "Channel effectiveness",
            icon: PieChart,
            href: "/enterprise/sales/crm/leads/analytics/sources"
          },
          {
            title: "Lead Scoring Analysis",
            subtitle: "AI model performance",
            icon: Star,
            href: "/enterprise/sales/crm/leads/analytics/scoring"
          },
          {
            title: "Sales Rep Performance",
            subtitle: "Lead conversion by rep",
            icon: Users,
            href: "/enterprise/sales/crm/leads/analytics/reps"
          },
          {
            title: "Lead Quality Trends",
            subtitle: "Score distribution over time",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/leads/analytics/quality"
          },
          {
            title: "ROI by Source",
            subtitle: "Lead acquisition costs",
            icon: Target,
            href: "/enterprise/sales/crm/leads/analytics/roi"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.leads"]}>
      <ModuleHomePage
        moduleTitle={leadsData.moduleTitle}
        breadcrumb={leadsData.breadcrumb}
        overview={leadsData.overview}
        sections={leadsData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}