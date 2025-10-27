'use client'

/**
 * Sales Module Home Page
 * Smart Code: HERA.SALES.HOME.v1
 * 
 * SAP Fiori-inspired Sales module dashboard
 */

import React from 'react'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { 
  ShoppingCart,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Package,
  FileText,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Phone,
  Mail,
  Calendar,
  Award,
  Zap,
  Briefcase,
  UserPlus
} from 'lucide-react'

export default function SalesHomePage() {
  
  const salesData = {
    moduleTitle: "Sales",
    breadcrumb: "Sales & Distribution (SD)",
    overview: {
      title: "My Sales Overview",
      subtitle: "Detailed Analysis",
      kpis: [
        {
          title: "Sales Volume",
          value: "₹35.6M",
          unit: "USD",
          subtitle: "2019: ₹35.6M USD, 2018: ₹10.8M USD, 2017: ₹4.6M USD",
          trend: "up" as const,
          trendValue: "+11.4%",
          icon: DollarSign
        },
        {
          title: "Sales Orders",
          value: "2.04",
          unit: "K",
          subtitle: "Confirmed as Requested",
          trend: "up" as const,
          trendValue: "20 min. ago",
          icon: ShoppingCart
        },
        {
          title: "Sales Inquiries",
          value: "8",
          subtitle: "Active Inquiries",
          trend: "neutral" as const,
          trendValue: "20 min. ago",
          icon: FileText
        },
        {
          title: "Sales Quotations",
          value: "1.09",
          unit: "K",
          subtitle: "Pending Quotes",
          trend: "up" as const,
          trendValue: "20 min. ago",
          icon: Target
        },
        {
          title: "Credit Memo Requests",
          value: "28",
          subtitle: "Processing",
          trend: "neutral" as const,
          trendValue: "Stable",
          icon: AlertTriangle
        },
        {
          title: "Debit Memo Requests",
          value: "9",
          subtitle: "Under Review",
          trend: "down" as const,
          trendValue: "-15%",
          icon: CheckCircle
        }
      ]
    },
    sections: [
      {
        title: "Sales Documents",
        items: [
          {
            title: "Manage Sales Orders",
            subtitle: "Order Processing",
            icon: ShoppingCart,
            href: "/enterprise/sales/orders/manage",
            badge: "2.04K"
          },
          {
            title: "Manage Sales Inquiries",
            subtitle: "Customer Inquiries",
            icon: FileText,
            href: "/enterprise/sales/inquiries",
            badge: "8"
          },
          {
            title: "Manage Sales Quotations",
            subtitle: "Quote Management",
            icon: Target,
            href: "/enterprise/sales/quotations",
            badge: "1.09K"
          },
          {
            title: "Manage Credit Memo Requests",
            subtitle: "Credit Processing",
            icon: AlertTriangle,
            href: "/enterprise/sales/credit-memos",
            badge: "28"
          },
          {
            title: "Manage Debit Memo Requests",
            subtitle: "Debit Processing",
            icon: CheckCircle,
            href: "/enterprise/sales/debit-memos",
            badge: "9"
          },
          {
            title: "List Incomplete Sales Documents",
            subtitle: "Pending Documents",
            icon: Clock,
            href: "/enterprise/sales/incomplete",
            badge: "17"
          }
        ]
      },
      {
        title: "Sales Master Data",
        items: [
          {
            title: "Manage Sales Contracts",
            subtitle: "Contract Management",
            icon: FileText,
            href: "/enterprise/sales/master/contracts",
            badge: "15"
          },
          {
            title: "Manage Sales Item Proposals",
            subtitle: "Product Proposals",
            icon: Package,
            href: "/enterprise/sales/master/proposals"
          },
          {
            title: "Customer Master",
            subtitle: "Create/Change/Display",
            icon: Users,
            href: "/enterprise/sales/master/customers"
          },
          {
            title: "Manage Customer Materials",
            subtitle: "Customer-specific Products",
            icon: Package,
            href: "/enterprise/sales/master/materials"
          },
          {
            title: "Sales Analytics",
            subtitle: "Performance Reports",
            icon: BarChart3,
            href: "/enterprise/sales/analytics"
          },
          {
            title: "Price Management",
            subtitle: "Pricing & Conditions",
            icon: DollarSign,
            href: "/enterprise/sales/master/pricing"
          }
        ]
      },
      {
        title: "CRM & Lead Management",
        items: [
          {
            title: "Lead Pipeline",
            subtitle: "Opportunity Management",
            icon: Target,
            href: "/demo-org/00000000-0000-0000-0000-000000000001/crm-sales/dashboard",
            badge: "Hot"
          },
          {
            title: "Lead Management",
            subtitle: "Lead qualification & nurturing",
            icon: UserPlus,
            href: "/enterprise/sales/crm/leads"
          },
          {
            title: "Opportunity Tracking",
            subtitle: "Sales pipeline management",
            icon: Target,
            href: "/enterprise/sales/crm/opportunities"
          },
          {
            title: "Customer Database",
            subtitle: "Customer relationship mgmt",
            icon: Users,
            href: "/enterprise/sales/crm/customers"
          },
          {
            title: "Sales Activities",
            subtitle: "Calls, Meetings, Tasks",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities"
          },
          {
            title: "Campaign Management",
            subtitle: "Marketing Campaigns",
            icon: Mail,
            href: "/enterprise/sales/crm/campaigns"
          },
          {
            title: "Customer Insights",
            subtitle: "AI-Powered Analytics",
            icon: Zap,
            href: "/enterprise/sales/crm/insights"
          }
        ]
      },
      {
        title: "Services",
        items: [
          {
            title: "My Inbox",
            subtitle: "All Items",
            icon: FileText,
            href: "/enterprise/sales/services/inbox",
            badge: "0"
          },
          {
            title: "Monitor Product Availability",
            subtitle: "Stock Status",
            icon: Package,
            href: "/enterprise/sales/services/availability"
          },
          {
            title: "Track Sales Orders",
            subtitle: "Order Status",
            icon: ShoppingCart,
            href: "/enterprise/sales/orders/track"
          },
          {
            title: "Schedule Sales Document Output",
            subtitle: "Document Processing",
            icon: Clock,
            href: "/enterprise/sales/services/output"
          },
          {
            title: "Sales Forecasting",
            subtitle: "Predictive Analytics",
            icon: TrendingUp,
            href: "/enterprise/sales/services/forecasting"
          },
          {
            title: "Commission Calculation",
            subtitle: "Sales Commissions",
            icon: DollarSign,
            href: "/enterprise/sales/services/commissions"
          }
        ]
      }
    ]
  }

  return (
    <ModuleHomePage
      moduleTitle={salesData.moduleTitle}
      breadcrumb={salesData.breadcrumb}
      overview={salesData.overview}
      sections={salesData.sections}
      onBack={() => window.history.back()}
    />
  )
}