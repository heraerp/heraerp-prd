/**
 * HERA Retail Domain Configuration
 * Domain-specific settings for Retail domain pages
 */

import { DomainConfig } from '@/components/universal/domain/types'

export const retailDomainConfig: DomainConfig = {
  appCode: 'RETAIL',
  appName: 'HERA Retail',

  theme: {
    primaryColor: 'indigo-600',
    accentColor: '#3B82F6',
    borderColorClass: 'border-slate-200/50'
  },

  navigation: {
    dashboardRoute: '/retail/dashboard',
    subtitleText: 'Retail • Enterprise Overview'
  },

  // Section icon mapping (entity_code → icon name)
  sectionIconMap: {
    // Planning domain sections
    'demand': 'TrendingUp',
    'forecast': 'TrendingUp',
    'replenishment': 'RefreshCw',
    'planning': 'Calendar',
    'allocation': 'PieChart',

    // Inventory domain sections
    'stock': 'Warehouse',
    'inventory': 'Warehouse',
    'receiving': 'ClipboardCheck',
    'inbound': 'ClipboardCheck',
    'picking': 'Package',
    'outbound': 'Truck',
    'cycle': 'Activity',
    'count': 'Activity',
    'movement': 'TrendingUp',
    'transfer': 'Truck',
    'transfers': 'Truck',
    'adjustment': 'Settings',
    'catalog': 'Tag',

    // Merchandising domain sections
    'catalog': 'Tag',
    'pricing': 'DollarSign',
    'promotion': 'Star',
    'promotions': 'Star',
    'assortment': 'Package',
    'category': 'Folder',
    'categories': 'Folder',
    'attribute': 'FileText',
    'attributes': 'FileText',

    // Finance domain sections
    'ledger': 'Calculator',
    'gl': 'Calculator',
    'accounts': 'Calculator',
    'payable': 'CreditCard',
    'receivable': 'Receipt',
    'budget': 'PieChart',
    'cost': 'DollarSign',
    'profit': 'TrendingUp',

    // Customer domain sections
    'customer': 'Users',
    'customers': 'Users',
    'loyalty': 'Star',
    'rewards': 'Zap',
    'profile': 'User',
    'profiles': 'User',
    'segment': 'Target',
    'segments': 'Target',

    // Operations domain sections
    'pos': 'ShoppingBag',
    'checkout': 'ShoppingBag',
    'store': 'Store',
    'stores': 'Store',
    'fulfillment': 'Package',
    'shipping': 'Truck',
    'returns': 'RefreshCw',
    'exchange': 'RefreshCw',

    // Analytics domain sections
    'sales': 'BarChart3',
    'performance': 'TrendingUp',
    'analytics': 'BarChart3',
    'dashboard': 'BarChart3',
    'reports': 'FileText',
    'insights': 'Zap',

    // System domain sections
    'settings': 'Settings',
    'admin': 'Shield',
    'users': 'Users',
    'permissions': 'Shield',
    'audit': 'Eye',
    'logs': 'Activity',

    // Default fallback
    'default': 'Package'
  }
}
