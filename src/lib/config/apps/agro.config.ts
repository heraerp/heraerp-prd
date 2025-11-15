/**
 * HERA Agro Dashboard Configuration
 * App-specific settings for the Agro dashboard
 */

import { DashboardConfig } from '@/components/universal/dashboard/types'

export const agroDashboardConfig: DashboardConfig = {
  appCode: 'AGRO',
  appName: 'HERA Agro',

  theme: {
    primaryColor: 'green-600',
    logoBgClass: 'bg-green-600',
    accentColor: '#10B981'
  },

  navItems: [
    'Production',
    'Quality Control',
    'Inventory',
    'Farmer Management'
  ],

  insightsTiles: [
    {
      id: 'crop-production',
      iconName: 'Factory',
      iconColor: 'text-emerald-600',
      title: 'Crop Production',
      value: '67 MT',
      subtitle: '↑ 12% vs last month',
      subtitleColor: 'text-green-600'
    },
    {
      id: 'quality-monitor',
      iconName: 'CheckCircle',
      iconColor: 'text-green-600',
      title: 'Quality Monitor',
      value: '96%',
      subtitle: 'Pass rate this week',
      subtitleColor: 'text-gray-500'
    },
    {
      id: 'farmer-payments',
      iconName: 'DollarSign',
      iconColor: 'text-indigo-600',
      title: 'Farmer Payments',
      value: '₹4.2L',
      subtitle: '3 pending',
      subtitleColor: 'text-orange-600'
    },
    {
      id: 'inventory-levels',
      iconName: 'Warehouse',
      iconColor: 'text-teal-600',
      title: 'Inventory Levels',
      value: '₹12.4L',
      subtitle: 'Optimal levels',
      subtitleColor: 'text-green-600'
    },
    {
      id: 'processing-efficiency',
      iconName: 'Activity',
      iconColor: 'text-blue-600',
      title: 'Processing Efficiency',
      value: '89%',
      subtitle: '↑ 5% improvement',
      subtitleColor: 'text-green-600'
    },
    {
      id: 'shipment-tracking',
      iconName: 'Truck',
      iconColor: 'text-amber-600',
      title: 'Shipment Tracking',
      value: '12',
      subtitle: 'In transit',
      subtitleColor: 'text-gray-500'
    },
    {
      id: 'sustainability-score',
      iconName: 'Leaf',
      iconColor: 'text-rose-600',
      title: 'Sustainability Score',
      value: 'A+',
      subtitle: 'ESG compliant',
      subtitleColor: 'text-green-600'
    }
  ],

  insightsCards: [
    {
      id: 'production-volume',
      type: 'bar',
      title: 'Production Volume by Crop',
      description: 'Last 6 months (MT)',
      data: [
        { month: 'Jan', cashew: 45, coconut: 30, spices: 15 },
        { month: 'Feb', cashew: 52, coconut: 28, spices: 18 },
        { month: 'Mar', cashew: 48, coconut: 32, spices: 22 },
        { month: 'Apr', cashew: 61, coconut: 35, spices: 20 },
        { month: 'May', cashew: 55, coconut: 38, spices: 25 },
        { month: 'Jun', cashew: 67, coconut: 40, spices: 28 }
      ],
      config: {
        dataKeys: ['cashew'],
        xAxisKey: 'month',
        colors: ['#10B981']
      }
    },
    {
      id: 'stock-distribution',
      type: 'donut',
      title: 'Stock Distribution',
      description: 'By processing stage',
      data: [
        { name: 'Raw Material', value: 35, color: '#F59E0B' },
        { name: 'Processing', value: 25, color: '#3B82F6' },
        { name: 'Finished Goods', value: 30, color: '#10B981' },
        { name: 'Packing', value: 10, color: '#EF4444' }
      ],
      config: {
        innerRadius: 30,
        outerRadius: 60
      }
    },
    {
      id: 'quality-trends',
      type: 'line',
      title: 'Quality Score Trends',
      description: 'Monthly performance',
      data: [
        { month: 'Jan', score: 94 },
        { month: 'Feb', score: 95 },
        { month: 'Mar', score: 96 },
        { month: 'Apr', score: 95 },
        { month: 'May', score: 97 },
        { month: 'Jun', score: 96 }
      ],
      config: {
        dataKeys: ['score'],
        xAxisKey: 'month',
        yAxisDomain: [90, 100],
        colors: ['#10B981']
      }
    },
    {
      id: 'farmer-transactions',
      type: 'table',
      title: 'Recent Farmer Transactions',
      description: 'Last 4 payments',
      data: [
        {
          farmer: 'Ravi Kumar',
          amount: '₹45,000',
          date: '2024-06-15',
          status: 'Paid'
        },
        {
          farmer: 'Sunita Devi',
          amount: '₹32,000',
          date: '2024-06-14',
          status: 'Pending'
        },
        {
          farmer: 'Mohan Singh',
          amount: '₹28,500',
          date: '2024-06-13',
          status: 'Paid'
        },
        {
          farmer: 'Lakshmi Bai',
          amount: '₹51,200',
          date: '2024-06-12',
          status: 'Paid'
        }
      ]
    }
  ],

  aiGreeting: 'Hello! I can help you with batch traceability, production planning, quality compliance, and farmer payments. What would you like to know?',

  newsItems: [
    {
      id: 'featured-1',
      type: 'featured',
      title: 'New Sustainability Certification Available',
      description: 'Apply now for organic and fair-trade certifications to boost exports.',
      timestamp: '2 hours ago'
    },
    {
      id: 'news-1',
      type: 'standard',
      title: 'Harvest Season Planning Tools Released',
      description: 'New AI-powered crop forecasting module now available.',
      timestamp: '1 day ago',
      borderColor: 'border-green-500'
    },
    {
      id: 'news-2',
      type: 'standard',
      title: 'Quality Standards Update',
      description: 'Updated export compliance guidelines for Q3 2024.',
      timestamp: '3 days ago',
      borderColor: 'border-blue-500'
    },
    {
      id: 'news-3',
      type: 'standard',
      title: 'Farmer Portal Enhancement',
      description: 'Mobile app for farmers to track payments and deliveries.',
      timestamp: '1 week ago',
      borderColor: 'border-purple-500'
    }
  ]
}
