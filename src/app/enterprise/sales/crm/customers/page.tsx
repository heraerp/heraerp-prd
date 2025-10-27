'use client'

/**
 * Enterprise CRM Customer Management
 * Smart Code: HERA.ENTERPRISE.CRM.CUSTOMERS.v1
 * 
 * Enterprise-integrated customer management following ModuleHomePage pattern
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  Users,
  Building2,
  UserPlus,
  TrendingUp,
  DollarSign,
  Star,
  Heart,
  Award,
  Clock,
  Phone,
  Mail,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react'

export default function EnterpriseCRMCustomersPage() {
  const customersData = {
    moduleTitle: "Customer Management",
    breadcrumb: "Sales & Distribution → CRM → Customers",
    overview: {
      title: "Customer Relationship Overview",
      subtitle: "360° Customer Intelligence",
      kpis: [
        {
          title: "Total Customers",
          value: "1,247",
          subtitle: "Active customer base",
          trend: "up" as const,
          trendValue: "+15.2%",
          icon: Users
        },
        {
          title: "Customer Lifetime Value",
          value: "$45K",
          subtitle: "Average CLV",
          trend: "up" as const,
          trendValue: "+8.7%",
          icon: DollarSign
        },
        {
          title: "Customer Satisfaction",
          value: "4.8",
          unit: "/5.0",
          subtitle: "Average rating",
          trend: "up" as const,
          trendValue: "+0.2",
          icon: Heart
        },
        {
          title: "Retention Rate",
          value: "94.2",
          unit: "%",
          subtitle: "12-month retention",
          trend: "up" as const,
          trendValue: "+2.1%",
          icon: Award
        },
        {
          title: "New This Month",
          value: "28",
          subtitle: "New acquisitions",
          trend: "up" as const,
          trendValue: "+12 vs last month",
          icon: UserPlus
        },
        {
          title: "At Risk",
          value: "15",
          subtitle: "Churn risk indicators",
          trend: "down" as const,
          trendValue: "-5 improved",
          icon: Clock
        }
      ]
    },
    sections: [
      {
        title: "Customer Database",
        items: [
          {
            title: "All Customers",
            subtitle: "Complete customer directory",
            icon: Users,
            href: "/demo-org/00000000-0000-0000-0000-000000000001/crm-sales/customers",
            badge: "1,247"
          },
          {
            title: "Enterprise Accounts",
            subtitle: "High-value business customers",
            icon: Building2,
            href: "/enterprise/sales/crm/customers/enterprise",
            badge: "156"
          },
          {
            title: "Individual Customers",
            subtitle: "Personal accounts",
            icon: UserPlus,
            href: "/enterprise/sales/crm/customers/individual",
            badge: "1,091"
          },
          {
            title: "VIP Customers",
            subtitle: "Premium tier management",
            icon: Star,
            href: "/enterprise/sales/crm/customers/vip",
            badge: "24"
          },
          {
            title: "Recent Customers",
            subtitle: "Last 30 days",
            icon: Clock,
            href: "/enterprise/sales/crm/customers/recent",
            badge: "28"
          },
          {
            title: "Customer Segments",
            subtitle: "Behavioral groupings",
            icon: Target,
            href: "/enterprise/sales/crm/customers/segments"
          }
        ]
      },
      {
        title: "Customer Management",
        items: [
          {
            title: "Add New Customer",
            subtitle: "Create customer record",
            icon: UserPlus,
            href: "/enterprise/sales/crm/customers/create"
          },
          {
            title: "Customer Import",
            subtitle: "Bulk import from files",
            icon: Users,
            href: "/enterprise/sales/crm/customers/import"
          },
          {
            title: "Merge Customers",
            subtitle: "Duplicate consolidation",
            icon: Building2,
            href: "/enterprise/sales/crm/customers/merge"
          },
          {
            title: "Customer Hierarchy",
            subtitle: "Parent-child relationships",
            icon: Target,
            href: "/enterprise/sales/crm/customers/hierarchy"
          },
          {
            title: "Contact Management",
            subtitle: "Customer contact persons",
            icon: Phone,
            href: "/enterprise/sales/crm/customers/contacts"
          },
          {
            title: "Communication Log",
            subtitle: "Interaction history",
            icon: Mail,
            href: "/enterprise/sales/crm/customers/communications"
          }
        ]
      },
      {
        title: "Customer Intelligence",
        items: [
          {
            title: "Customer 360 View",
            subtitle: "Complete customer profile",
            icon: Users,
            href: "/enterprise/sales/crm/customers/360"
          },
          {
            title: "Purchase History",
            subtitle: "Transaction records",
            icon: FileText,
            href: "/enterprise/sales/crm/customers/history"
          },
          {
            title: "Customer Health Score",
            subtitle: "Relationship strength",
            icon: Heart,
            href: "/enterprise/sales/crm/customers/health"
          },
          {
            title: "Satisfaction Surveys",
            subtitle: "Feedback collection",
            icon: Star,
            href: "/enterprise/sales/crm/customers/surveys"
          },
          {
            title: "Churn Prediction",
            subtitle: "AI-powered risk analysis",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/customers/churn"
          },
          {
            title: "Upsell Opportunities",
            subtitle: "Cross-sell identification",
            icon: Award,
            href: "/enterprise/sales/crm/customers/upsell"
          }
        ]
      },
      {
        title: "Customer Analytics",
        items: [
          {
            title: "Customer Lifetime Value",
            subtitle: "CLV analysis & trends",
            icon: DollarSign,
            href: "/enterprise/sales/crm/customers/analytics/clv"
          },
          {
            title: "Retention Analysis",
            subtitle: "Churn rates & patterns",
            icon: Award,
            href: "/enterprise/sales/crm/customers/analytics/retention"
          },
          {
            title: "Customer Segmentation",
            subtitle: "Behavioral analysis",
            icon: PieChart,
            href: "/enterprise/sales/crm/customers/analytics/segmentation"
          },
          {
            title: "Acquisition Trends",
            subtitle: "New customer patterns",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/customers/analytics/acquisition"
          },
          {
            title: "Geographic Distribution",
            subtitle: "Location-based insights",
            icon: Target,
            href: "/enterprise/sales/crm/customers/analytics/geography"
          },
          {
            title: "Customer Journey",
            subtitle: "Touchpoint analysis",
            icon: BarChart3,
            href: "/enterprise/sales/crm/customers/analytics/journey"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.customers"]}>
      <ModuleHomePage
        moduleTitle={customersData.moduleTitle}
        breadcrumb={customersData.breadcrumb}
        overview={customersData.overview}
        sections={customersData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}