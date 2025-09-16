'use client'

import { UniversalLayout } from '@/src/components/layout/UniversalLayout'
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Calculator,
  PieChart,
  FileText,
  CreditCard,
  Wallet,
  Building,
  Users
} from 'lucide-react'
import { getModuleTheme } from '@/src/lib/theme/module-themes'

const theme = getModuleTheme('finance')

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <PieChart className="w-5 h-5" />,
    href: '/financial',
    color: 'hover:bg-green-100'
  },
  {
    id: 'accounts',
    label: 'Chart of Accounts',
    icon: <Calculator className="w-5 h-5" />,
    href: '/financial/accounts',
    color: 'hover:bg-emerald-100'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: <Receipt className="w-5 h-5" />,
    href: '/financial/transactions',
    badge: 'New',
    color: 'hover:bg-green-100'
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: <FileText className="w-5 h-5" />,
    href: '/financial/invoices',
    color: 'hover:bg-emerald-100'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: <CreditCard className="w-5 h-5" />,
    href: '/financial/payments',
    color: 'hover:bg-green-100'
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: <Wallet className="w-5 h-5" />,
    href: '/financial/expenses',
    badge: '5',
    color: 'hover:bg-emerald-100'
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <Users className="w-5 h-5" />,
    href: '/financial/customers',
    color: 'hover:bg-green-100'
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: <Building className="w-5 h-5" />,
    href: '/financial/vendors',
    color: 'hover:bg-emerald-100'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '/financial/reports',
    color: 'hover:bg-green-100'
  }
]

const quickActions = [
  {
    id: 'new-invoice',
    label: 'Create Invoice',
    icon: <FileText className="w-5 h-5" />,
    href: '/financial/invoices?action=new',
    color: 'hover:bg-green-100',
    description: 'Generate a new sales invoice'
  },
  {
    id: 'new-expense',
    label: 'Record Expense',
    icon: <Wallet className="w-5 h-5" />,
    href: '/financial/expenses?action=new',
    color: 'hover:bg-emerald-100',
    description: 'Log a business expense'
  },
  {
    id: 'new-payment',
    label: 'Receive Payment',
    icon: <CreditCard className="w-5 h-5" />,
    href: '/financial/payments?action=new',
    color: 'hover:bg-green-100',
    description: 'Record customer payment'
  },
  {
    id: 'journal-entry',
    label: 'Journal Entry',
    icon: <Calculator className="w-5 h-5" />,
    href: '/financial/journal?action=new',
    color: 'hover:bg-emerald-100',
    description: 'Create manual journal entry'
  },
  {
    id: 'bank-reconciliation',
    label: 'Bank Reconciliation',
    icon: <Building className="w-5 h-5" />,
    href: '/financial/reconciliation',
    color: 'hover:bg-green-100',
    description: 'Reconcile bank accounts'
  },
  {
    id: 'financial-reports',
    label: 'Financial Reports',
    icon: <PieChart className="w-5 h-5" />,
    href: '/financial/reports',
    color: 'hover:bg-emerald-100',
    description: 'View P&L, Balance Sheet'
  }
]

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  return (
    <UniversalLayout
      title="Finance Pro"
      subtitle="Accounting"
      icon={DollarSign}
      sidebarItems={sidebarItems}
      quickActions={quickActions}
      brandGradient={theme.brandGradient}
      accentGradient={theme.accentGradient}
      backgroundGradient={theme.backgroundGradient}
      baseUrl="/financial"
    >
      {children}
    </UniversalLayout>
  )
}
