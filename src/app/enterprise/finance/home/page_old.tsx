'use client'

/**
 * Finance Module Home Page
 * Smart Code: HERA.FINANCE.HOME.v1
 * 
 * SAP Fiori-inspired Finance module dashboard
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
  Target
} from 'lucide-react'

export default function FinanceHomePage() {
  
  const financeData = {
    moduleTitle: "Finance",
    breadcrumb: "Financial Accounting (FI)",
    overview: {
      title: "My Finance Overview",
      subtitle: "Detailed Analysis",
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
        title: "Financial Documents",
        requiredPermissions: ["finance.invoices"],
        items: [
          {
            title: "Process Invoices",
            subtitle: "Accounts Payable",
            icon: FileText,
            href: "/enterprise/finance/ap/invoices",
            badge: "24",
            requiredPermissions: ["finance.invoices"]
          },
          {
            title: "Customer Payments",
            subtitle: "Accounts Receivable",
            icon: Banknote,
            href: "/enterprise/finance/ar/payments",
            badge: "18",
            requiredPermissions: ["finance.payments"]
          },
          {
            title: "Journal Entries",
            subtitle: "General Ledger",
            icon: Calculator,
            href: "/enterprise/finance/gl/journals",
            badge: "7",
            requiredRoles: ["finance_manager"]
          },
          {
            title: "Bank Reconciliation",
            subtitle: "Cash Management",
            icon: Building2,
            href: "/enterprise/finance/cash/reconciliation",
            badge: "3",
            requiredRoles: ["finance_manager"]
          },
          {
            title: "Expense Reports",
            subtitle: "Employee Expenses",
            icon: Receipt,
            href: "/enterprise/finance/expenses",
            badge: "12"
          },
          {
            title: "Asset Depreciation",
            subtitle: "Fixed Assets",
            icon: Building2,
            href: "/finance1/fixed-assets",
            badge: "156",
            requiredPermissions: ["finance.assets"]
          }
        ]
      },
      {
        title: "Financial Reporting",
        items: [
          {
            title: "Financial Statements",
            subtitle: "P&L, Balance Sheet, Cash Flow",
            icon: BarChart3,
            href: "/enterprise/finance/reports/statements"
          },
          {
            title: "Budget Analysis",
            subtitle: "Budget vs Actual",
            icon: PieChart,
            href: "/enterprise/finance/reports/budget"
          },
          {
            title: "Cost Center Reports",
            subtitle: "Department-wise Analysis",
            icon: Target,
            href: "/enterprise/finance/reports/cost-centers"
          },
          {
            title: "Aging Reports",
            subtitle: "Receivables & Payables",
            icon: Clock,
            href: "/enterprise/finance/reports/aging"
          },
          {
            title: "Tax Reports",
            subtitle: "GST & Income Tax",
            icon: FileText,
            href: "/enterprise/finance/reports/tax"
          },
          {
            title: "Cash Flow Analysis",
            subtitle: "Liquidity Management",
            icon: TrendingUp,
            href: "/enterprise/finance/reports/cashflow"
          }
        ]
      },
      {
        title: "Master Data",
        items: [
          {
            title: "Chart of Accounts",
            subtitle: "Account Structure",
            icon: Calculator,
            href: "/enterprise/finance/master/accounts"
          },
          {
            title: "Vendor Master",
            subtitle: "Supplier Information",
            icon: Users,
            href: "/enterprise/finance/master/vendors"
          },
          {
            title: "Customer Master",
            subtitle: "Customer Data",
            icon: Users,
            href: "/enterprise/finance/master/customers"
          },
          {
            title: "Cost Centers",
            subtitle: "Organization Structure",
            icon: Building2,
            href: "/enterprise/finance/master/cost-centers"
          },
          {
            title: "Tax Codes",
            subtitle: "Tax Configuration",
            icon: FileText,
            href: "/enterprise/finance/master/tax-codes"
          },
          {
            title: "Payment Terms",
            subtitle: "Terms & Conditions",
            icon: CreditCard,
            href: "/enterprise/finance/master/payment-terms"
          }
        ]
      },
      {
        title: "Services",
        items: [
          {
            title: "Period End Close",
            subtitle: "Monthly Closing",
            icon: CheckCircle,
            href: "/enterprise/finance/services/period-close"
          },
          {
            title: "Bank Integration",
            subtitle: "Automatic Bank Feeds",
            icon: Building2,
            href: "/enterprise/finance/services/bank-integration"
          },
          {
            title: "Currency Revaluation",
            subtitle: "Foreign Exchange",
            icon: CircleDollarSign,
            href: "/enterprise/finance/services/currency"
          },
          {
            title: "Workflow Approval",
            subtitle: "Document Approval",
            icon: CheckCircle,
            href: "/enterprise/finance/services/workflow"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="finance" requiredPermissions={["finance.invoices"]}>
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