'use client'

/**
 * Finance Module Home Page
 * Smart Code: HERA.FINANCE.HOME.v2
 * 
 * HERA Finance module dashboard using ModuleHomePage template
 */

import React from 'react'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { 
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  Calculator,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Wallet,
  Receipt,
  Banknote,
  CircleDollarSign,
  Target,
  BookOpen,
  Shield,
  Briefcase
} from 'lucide-react'

export default function FinanceHomePage() {
  
  const financeData = {
    moduleTitle: "Finance",
    breadcrumb: "Enterprise → Finance → Financial Management",
    overview: {
      title: "HERA Finance Management",
      subtitle: "AI-Powered Financial Operations & Analytics",
      kpis: [
        {
          title: "Total Revenue",
          value: "₹42.8M",
          subtitle: "Current Quarter",
          trend: "up" as const,
          trendValue: "+8.3%",
          icon: DollarSign
        },
        {
          title: "Outstanding Receivables",
          value: "₹12.4M",
          subtitle: "Aging Analysis",
          trend: "down" as const,
          trendValue: "-3.2%",
          icon: CreditCard
        },
        {
          title: "Payables Due",
          value: "₹8.7M",
          subtitle: "Next 30 Days",
          trend: "neutral" as const,
          trendValue: "Stable",
          icon: Receipt
        },
        {
          title: "Cash Position",
          value: "₹18.9M",
          subtitle: "Available Funds",
          trend: "up" as const,
          trendValue: "+12.1%",
          icon: Wallet
        },
        {
          title: "Monthly P&L",
          value: "₹3.2M",
          subtitle: "Net Profit",
          trend: "up" as const,
          trendValue: "+5.7%",
          icon: TrendingUp
        },
        {
          title: "Budget Variance",
          value: "2.4%",
          subtitle: "Under Budget",
          trend: "up" as const,
          trendValue: "Favorable",
          icon: Target
        }
      ]
    },
    sections: [
      {
        title: "Core Finance Modules",
        requiredPermissions: ["finance.read"],
        items: [
          {
            title: "Financial Planning & Analysis",
            subtitle: "AI-powered planning & forecasting",
            icon: BarChart3,
            href: "/enterprise/finance/planning",
            badge: "New",
            requiredPermissions: ["finance.planning"]
          },
          {
            title: "Accounting & Financial Close",
            subtitle: "General ledger & automated close",
            icon: BookOpen,
            href: "/enterprise/finance/accounting",
            badge: "87%",
            requiredPermissions: ["finance.accounting"]
          },
          {
            title: "Accounts Receivable",
            subtitle: "Customer payments & collections",
            icon: CreditCard,
            href: "/enterprise/finance/ar",
            badge: "18",
            requiredPermissions: ["finance.ar"]
          },
          {
            title: "Accounts Payable",
            subtitle: "Vendor payments & automation",
            icon: Receipt,
            href: "/enterprise/finance/ap",
            badge: "24",
            requiredPermissions: ["finance.ap"]
          },
          {
            title: "Treasury Management",
            subtitle: "Cash & liquidity management",
            icon: Wallet,
            href: "/enterprise/finance/treasury",
            requiredPermissions: ["finance.treasury"]
          },
          {
            title: "Compliance & Tax",
            subtitle: "Regulatory compliance & tax",
            icon: Shield,
            href: "/enterprise/finance/compliance",
            badge: "Updated",
            requiredPermissions: ["finance.compliance"]
          }
        ]
      },
      {
        title: "Financial Operations",
        items: [
          {
            title: "Process Invoices",
            subtitle: "Automated invoice processing",
            icon: FileText,
            href: "/enterprise/finance/ap/invoices",
            badge: "24",
            requiredPermissions: ["finance.invoices"]
          },
          {
            title: "Customer Payments",
            subtitle: "Payment tracking & collection",
            icon: Banknote,
            href: "/enterprise/finance/ar/payments",
            badge: "18",
            requiredPermissions: ["finance.payments"]
          },
          {
            title: "Journal Entries",
            subtitle: "Manual journal postings",
            icon: Calculator,
            href: "/enterprise/finance/gl/journals",
            badge: "7",
            requiredRoles: ["finance_manager"]
          },
          {
            title: "Bank Reconciliation",
            subtitle: "Automated bank matching",
            icon: Building2,
            href: "/enterprise/finance/cash/reconciliation",
            badge: "3",
            requiredRoles: ["finance_manager"]
          },
          {
            title: "Expense Reports",
            subtitle: "Employee expense processing",
            icon: Receipt,
            href: "/enterprise/finance/expenses",
            badge: "12"
          },
          {
            title: "Asset Management",
            subtitle: "Fixed asset depreciation",
            icon: Building2,
            href: "/enterprise/finance/assets",
            badge: "156",
            requiredPermissions: ["finance.assets"]
          }
        ]
      },
      {
        title: "Analytics & Reporting",
        items: [
          {
            title: "Financial Statements",
            subtitle: "P&L, Balance Sheet, Cash Flow",
            icon: BarChart3,
            href: "/enterprise/finance/reports/statements"
          },
          {
            title: "Budget Analysis",
            subtitle: "Budget vs Actual analytics",
            icon: PieChart,
            href: "/enterprise/finance/reports/budget"
          },
          {
            title: "Cash Flow Forecasting",
            subtitle: "AI-powered cash predictions",
            icon: TrendingUp,
            href: "/enterprise/finance/reports/cashflow"
          },
          {
            title: "Cost Center Reports",
            subtitle: "Department-wise analysis",
            icon: Target,
            href: "/enterprise/finance/reports/cost-centers"
          },
          {
            title: "Aging Reports",
            subtitle: "Receivables & Payables aging",
            icon: Clock,
            href: "/enterprise/finance/reports/aging"
          },
          {
            title: "Tax Reports",
            subtitle: "GST & compliance reporting",
            icon: FileText,
            href: "/enterprise/finance/reports/tax"
          }
        ]
      },
      {
        title: "Master Data & Configuration",
        items: [
          {
            title: "Chart of Accounts",
            subtitle: "Account structure & hierarchy",
            icon: Calculator,
            href: "/enterprise/finance/master/accounts"
          },
          {
            title: "Vendor Master",
            subtitle: "Supplier information & terms",
            icon: Users,
            href: "/enterprise/finance/master/vendors"
          },
          {
            title: "Customer Master",
            subtitle: "Customer credit & terms",
            icon: Users,
            href: "/enterprise/finance/master/customers"
          },
          {
            title: "Cost Centers",
            subtitle: "Organization cost structure",
            icon: Building2,
            href: "/enterprise/finance/master/cost-centers"
          },
          {
            title: "Tax Configuration",
            subtitle: "Tax codes & rates",
            icon: FileText,
            href: "/enterprise/finance/master/tax-codes"
          },
          {
            title: "Payment Terms",
            subtitle: "Terms & conditions setup",
            icon: CreditCard,
            href: "/enterprise/finance/master/payment-terms"
          }
        ]
      },
      {
        title: "Automation & Services",
        items: [
          {
            title: "Period End Close",
            subtitle: "Automated monthly closing",
            icon: CheckCircle,
            href: "/enterprise/finance/services/period-close"
          },
          {
            title: "Bank Integration",
            subtitle: "Real-time bank feeds",
            icon: Building2,
            href: "/enterprise/finance/services/bank-integration"
          },
          {
            title: "Workflow Management",
            subtitle: "Approval workflows",
            icon: CheckCircle,
            href: "/enterprise/finance/services/workflow"
          },
          {
            title: "Currency Management",
            subtitle: "Foreign exchange handling",
            icon: CircleDollarSign,
            href: "/enterprise/finance/services/currency"
          },
          {
            title: "AI Analytics",
            subtitle: "Predictive insights",
            icon: Briefcase,
            href: "/enterprise/finance/ai/analytics"
          },
          {
            title: "Compliance Monitoring",
            subtitle: "Real-time compliance tracking",
            icon: Shield,
            href: "/enterprise/finance/compliance/monitoring"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="finance" requiredPermissions={["finance.read"]}>
      <ModuleHomePage
        moduleTitle={financeData.moduleTitle}
        breadcrumb={financeData.breadcrumb}
        overview={financeData.overview}
        sections={financeData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}