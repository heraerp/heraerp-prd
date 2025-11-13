/**
 * HERA Retail Dashboard Configuration
 * App-specific settings for the Retail dashboard
 */

import { DashboardConfig } from '@/components/universal/dashboard/types'

export const retailDashboardConfig: DashboardConfig = {
  appCode: 'RETAIL',
  appName: 'HERA Retail',

  theme: {
    primaryColor: 'indigo-600',
    logoBgClass: 'bg-indigo-600',
    accentColor: '#3B82F6'
  },

  navItems: [
    'Cash Management',
    'General Ledger',
    'Accounts Payable',
    'Store Operations'
  ],

  insightsTiles: [
    {
      id: 'cfo-sales',
      iconName: 'TrendingUp',
      iconColor: 'text-indigo-600',
      title: 'CFO Sales Dashboard',
      value: '4.56M',
      subtitle: 'new USD'
    },
    {
      id: 'predictive-accounting',
      iconName: 'CheckCircle',
      iconColor: 'text-green-600',
      title: 'Monitor Predictive Accounting',
      value: '0%',
      subtitle: 'Predictive Quality'
    },
    {
      id: 'supplier-invoices',
      iconName: 'FileText',
      iconColor: 'text-blue-600',
      title: 'Supplier Invoices List',
      value: '60',
      subtitle: 'Pending invoices'
    },
    {
      id: 'sales-accounting',
      iconName: 'BarChart3',
      iconColor: 'text-purple-600',
      title: 'Sales Accounting Overview',
      value: 'View',
      subtitle: 'Accounting dashboard'
    },
    {
      id: 'sales-volume',
      iconName: 'DollarSign',
      iconColor: 'text-emerald-600',
      title: 'Sales Volume',
      value: '4.51M',
      subtitle: 'USD'
    },
    {
      id: 'cash-flow',
      iconName: 'TrendingUp',
      iconColor: 'text-cyan-600',
      title: 'Cash Flow Analyzer',
      value: 'Analyze',
      subtitle: 'Cash management'
    },
    {
      id: 'manage-banks',
      iconName: 'Building',
      iconColor: 'text-slate-600',
      title: 'Manage Banks',
      value: 'Setup',
      subtitle: 'Cash Management'
    }
  ],

  insightsCards: [
    {
      id: 'profit-margin',
      type: 'bar',
      title: 'Profit Margin',
      description: 'By Month',
      data: [
        { month: 'Jan', value: 38.2, netValue: 1.8 },
        { month: 'Feb', value: 45.1, netValue: 2.5 },
        { month: 'Mar', value: 41.8, netValue: 2.1 },
        { month: 'Apr', value: 43.8, netValue: 1.9 }
      ],
      config: {
        dataKeys: ['value'],
        xAxisKey: 'month',
        colors: ['#3B82F6']
      }
    },
    {
      id: 'stock-value',
      type: 'donut',
      title: 'Stock Value by Stock Type',
      description: 'Total Value USD',
      data: [
        { name: 'Raw Materials', value: 18.2, color: '#3B82F6' },
        { name: 'Finished Goods', value: 26.33, color: '#EF4444' }
      ],
      config: {
        innerRadius: 30,
        outerRadius: 60
      }
    },
    {
      id: 'dead-stock',
      type: 'line',
      title: 'Dead Stock Analysis',
      description: 'US Plants',
      data: [
        { month: 'Jan', value: 2.4 },
        { month: 'Feb', value: 1.8 },
        { month: 'Mar', value: 3.1 },
        { month: 'Apr', value: 2.2 },
        { month: 'May', value: 1.9 },
        { month: 'Jun', value: 2.7 }
      ],
      config: {
        dataKeys: ['value'],
        xAxisKey: 'month',
        colors: ['#3B82F6']
      }
    },
    {
      id: 'gl-changes',
      type: 'table',
      title: 'G/L Item Changes',
      description: 'Most Recent',
      data: [
        {
          entry: '4000000223',
          field: 'Reversal Org',
          oldValue: 'CB988000030',
          newValue: '2024',
          date: 'NOV 29, 2024',
          status: 'Updated'
        },
        {
          entry: '4000000223',
          field: 'Reversal Ref',
          oldValue: 'CB988000030',
          newValue: '4000000655',
          date: 'NOV 29, 2024',
          status: 'Updated'
        },
        {
          entry: '4000000223',
          field: 'ReversalRefTran',
          oldValue: 'CB988000030',
          newValue: 'MKPF',
          date: 'NOV 29, 2024',
          status: 'Updated'
        }
      ]
    }
  ],

  aiGreeting: 'Hi! I\'m your HERA AI assistant. Ask me about invoices, payments, or inventory management.',

  newsItems: [
    {
      id: 'featured-1',
      type: 'featured',
      title: 'New Merchandise Planning Features',
      description: 'Enhanced assortment planning tools now available with AI-powered demand forecasting.',
      timestamp: '2 hours ago'
    },
    {
      id: 'news-1',
      type: 'standard',
      title: 'Q4 Financial Close Reminder',
      description: 'All departments must complete period-end activities by December 31st.',
      timestamp: '1 day ago',
      borderColor: 'border-blue-500'
    },
    {
      id: 'news-2',
      type: 'standard',
      title: 'Inventory Optimization Update',
      description: 'New stock replenishment algorithms deployed across all warehouses.',
      timestamp: '3 days ago',
      borderColor: 'border-green-500'
    },
    {
      id: 'news-3',
      type: 'standard',
      title: 'POS System Enhancement',
      description: 'Faster checkout experience with updated payment processing.',
      timestamp: '1 week ago',
      borderColor: 'border-purple-500'
    }
  ]
}
