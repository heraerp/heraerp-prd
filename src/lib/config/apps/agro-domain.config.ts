/**
 * HERA Agro Domain Configuration
 * Domain-specific settings for Agro domain pages
 */

import { DomainConfig } from '@/components/universal/domain/types'

export const agroDomainConfig: DomainConfig = {
  appCode: 'AGRO',
  appName: 'HERA Agro',

  theme: {
    primaryColor: 'green-600',
    accentColor: '#10B981',
    borderColorClass: 'border-green-200/50',
    brandIcon: 'Sprout'  // Agro-specific brand icon
  },

  navigation: {
    dashboardRoute: '/agro/dashboard',
    subtitleText: 'Agro • Domain Overview'
  },

  // Section icon mapping (entity_code → icon name)
  sectionIconMap: {
    // Production domain sections
    'production': 'Factory',
    'harvest': 'Sprout',
    'planting': 'Seed',
    'cultivation': 'Leaf',
    'farming': 'Tractor',
    'crop': 'Wheat',
    'crops': 'Wheat',
    'field': 'MapPin',
    'fields': 'MapPin',

    // Quality domain sections
    'quality': 'FlaskConical',
    'testing': 'FlaskConical',
    'inspection': 'Search',
    'compliance': 'Shield',
    'certification': 'Award',
    'grading': 'Star',
    'sampling': 'FlaskRound',

    // Inventory domain sections
    'inventory': 'Warehouse',
    'stock': 'Warehouse',
    'storage': 'Warehouse',
    'warehouse': 'Warehouse',
    'receiving': 'ClipboardCheck',
    'dispatch': 'Truck',
    'movement': 'TrendingUp',
    'transfer': 'Truck',
    'transfers': 'Truck',

    // Processing domain sections
    'processing': 'Factory',
    'manufacturing': 'Factory',
    'packaging': 'Package',
    'labeling': 'Tag',
    'sorting': 'Filter',
    'cleaning': 'Droplet',
    'drying': 'Sun',

    // Farmer Management domain sections
    'farmer': 'Users',
    'farmers': 'Users',
    'payment': 'DollarSign',
    'payments': 'DollarSign',
    'contract': 'FileText',
    'contracts': 'FileText',
    'procurement': 'ShoppingCart',
    'collection': 'Truck',
    'collections': 'Truck',

    // Supply Chain domain sections
    'logistics': 'Truck',
    'shipping': 'Ship',
    'tracking': 'MapPin',
    'delivery': 'Package',
    'distribution': 'Network',
    'route': 'Map',
    'routes': 'Map',

    // Traceability domain sections
    'traceability': 'QrCode',
    'batch': 'Tag',
    'batches': 'Tag',
    'lot': 'Package',
    'lots': 'Package',
    'genealogy': 'Network',
    'provenance': 'Shield',

    // Analytics domain sections
    'analytics': 'BarChart3',
    'reports': 'FileText',
    'dashboard': 'BarChart3',
    'insights': 'Lightbulb',
    'forecast': 'TrendingUp',
    'yield': 'TrendingUp',

    // Sustainability domain sections
    'sustainability': 'Leaf',
    'carbon': 'Cloud',
    'water': 'Droplet',
    'energy': 'Zap',
    'waste': 'Trash2',
    'recycling': 'RefreshCw',
    'environment': 'TreePine',

    // Finance domain sections
    'finance': 'DollarSign',
    'accounting': 'Calculator',
    'ledger': 'BookOpen',
    'budget': 'PieChart',
    'cost': 'DollarSign',
    'revenue': 'TrendingUp',

    // Compliance domain sections
    'regulation': 'Shield',
    'audit': 'Eye',
    'standard': 'CheckCircle',
    'standards': 'CheckCircle',
    'policy': 'FileText',
    'policies': 'FileText',

    // System domain sections
    'settings': 'Settings',
    'admin': 'Shield',
    'users': 'Users',
    'permissions': 'Lock',
    'logs': 'Activity',

    // Default fallback
    'default': 'Package'
  }
}
