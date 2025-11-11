/**
 * Platform Navigation API
 * Smart Code: HERA.PLATFORM.API.NAVIGATION.v1
 * 
 * Fetches navigation structure from platform organization
 * Accessible to any authenticated user regardless of organization
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const { domain: domainSlug } = await params

    console.log('🔍 API: Loading domain and sections for:', domainSlug)

    // Mock data for testing - supports all retail domains
    const domainConfigs = {
      retail: {
        domain: {
          id: 'retail-ops',
          entity_name: 'Retail Operations',
          entity_code: 'RETAIL',
          slug: 'retail',
          subtitle: 'Store Management & POS',
          color: '#6366F1'
        },
        sections: [
          {
            id: 'retail-pos',
            entity_name: 'Point of Sale',
            entity_code: 'POS',
            slug: 'pos',
            subtitle: 'Modern POS transactions & payments',
            icon: 'credit-card',
            color: '#10B981',
            persona_label: 'Cashier',
            visible_roles: ['cashier', 'manager'],
            route: '/apps/retail/pos/main',
            order: 1
          },
          {
            id: 'retail-inventory',
            entity_name: 'Store Inventory',
            entity_code: 'INVENTORY', 
            slug: 'inventory',
            subtitle: 'Stock levels & replenishment',
            icon: 'boxes',
            color: '#F59E0B',
            persona_label: 'Store Manager',
            visible_roles: ['store_manager', 'manager'],
            route: '/retail/inventory',
            order: 2
          },
          {
            id: 'retail-customers',
            entity_name: 'Customer Management',
            entity_code: 'CUSTOMERS',
            slug: 'customers', 
            subtitle: 'Customer profiles & history',
            icon: 'users',
            color: '#EF4444',
            persona_label: 'Store Associate',
            visible_roles: ['store_associate', 'manager'],
            route: '/retail/customers',
            order: 3
          },
          {
            id: 'retail-reports',
            entity_name: 'Store Reports',
            entity_code: 'REPORTS',
            slug: 'reports',
            subtitle: 'Sales analytics & performance',
            icon: 'bar-chart-3',
            color: '#8B5CF6',
            persona_label: 'Store Manager',
            visible_roles: ['store_manager'],
            route: '/retail/reports',
            order: 4
          }
        ]
      },
      wholesale: {
        domain: {
          id: 'wholesale-dist',
          entity_name: 'Wholesale Distribution',
          entity_code: 'WHOLESALE',
          slug: 'wholesale',
          subtitle: 'B2B Sales & Distribution',
          color: '#64748B'
        },
        sections: [
          {
            id: 'wholesale-orders',
            entity_name: 'Bulk Orders',
            entity_code: 'ORDERS',
            slug: 'orders',
            subtitle: 'Large volume order management',
            icon: 'shopping-cart',
            color: '#059669',
            persona_label: 'Distributor Manager',
            visible_roles: ['distributor_manager'],
            route: '/wholesale/orders',
            order: 1
          },
          {
            id: 'wholesale-pricing',
            entity_name: 'Bulk Pricing',
            entity_code: 'PRICING',
            slug: 'pricing',
            subtitle: 'Volume discounts & tier pricing',
            icon: 'calculator',
            color: '#DC2626',
            persona_label: 'Sales Manager',
            visible_roles: ['sales_manager'],
            route: '/wholesale/pricing',
            order: 2
          },
          {
            id: 'wholesale-logistics',
            entity_name: 'Logistics Management',
            entity_code: 'LOGISTICS',
            slug: 'logistics',
            subtitle: 'Shipping & delivery coordination',
            icon: 'truck',
            color: '#7C3AED',
            persona_label: 'Logistics Coordinator',
            visible_roles: ['logistics_coordinator'],
            route: '/wholesale/logistics',
            order: 3
          }
        ]
      },
      merchandising: {
        domain: {
          id: 'merchandising',
          entity_name: 'Merchandise & Pricing',
          entity_code: 'MERCHANDISING',
          slug: 'merchandising',
          subtitle: 'Product Catalog & Pricing',
          color: '#F59E0B'
        },
        sections: [
          {
            id: 'merchandising-catalog',
            entity_name: 'Product Catalog',
            entity_code: 'CATALOG',
            slug: 'catalog',
            subtitle: 'Product information management',
            icon: 'box',
            color: '#0EA5E9',
            persona_label: 'Merchandiser',
            visible_roles: ['merchandiser'],
            route: '/merchandising/catalog',
            order: 1
          },
          {
            id: 'merchandising-pricing',
            entity_name: 'Price Management',
            entity_code: 'PRICING',
            slug: 'pricing',
            subtitle: 'Pricing strategies & promotions',
            icon: 'tags',
            color: '#EF4444',
            persona_label: 'Pricing Manager',
            visible_roles: ['pricing_manager'],
            route: '/merchandising/pricing',
            order: 2
          },
          {
            id: 'merchandising-promotions',
            entity_name: 'Promotions',
            entity_code: 'PROMOTIONS',
            slug: 'promotions',
            subtitle: 'Campaign & discount management',
            icon: 'sparkles',
            color: '#10B981',
            persona_label: 'Marketing Manager',
            visible_roles: ['marketing_manager'],
            route: '/merchandising/promotions',
            order: 3
          }
        ]
      },
      inventory: {
        domain: {
          id: 'inventory-wms',
          entity_name: 'Inventory & Warehouse',
          entity_code: 'INVENTORY',
          slug: 'inventory',
          subtitle: 'Stock Management & WMS',
          color: '#14B8A6'
        },
        sections: [
          {
            id: 'inventory-stock',
            entity_name: 'Stock Management',
            entity_code: 'STOCK',
            slug: 'stock',
            subtitle: 'Real-time inventory tracking',
            icon: 'boxes',
            color: '#059669',
            persona_label: 'Warehouse Manager',
            visible_roles: ['warehouse_manager'],
            route: '/inventory/stock',
            order: 1
          },
          {
            id: 'inventory-receiving',
            entity_name: 'Receiving',
            entity_code: 'RECEIVING',
            slug: 'receiving',
            subtitle: 'Inbound goods processing',
            icon: 'clipboard-check',
            color: '#0EA5E9',
            persona_label: 'Warehouse Lead',
            visible_roles: ['warehouse_lead'],
            route: '/inventory/receiving',
            order: 2
          },
          {
            id: 'inventory-picking',
            entity_name: 'Picking & Fulfillment',
            entity_code: 'PICKING',
            slug: 'picking',
            subtitle: 'Order fulfillment operations',
            icon: 'package',
            color: '#7C3AED',
            persona_label: 'Picker',
            visible_roles: ['picker'],
            route: '/inventory/picking',
            order: 3
          },
          {
            id: 'inventory-cycle-count',
            entity_name: 'Cycle Counting',
            entity_code: 'CYCLE_COUNT',
            slug: 'cycle-count',
            subtitle: 'Inventory accuracy management',
            icon: 'refresh-cw',
            color: '#DC2626',
            persona_label: 'Inventory Controller',
            visible_roles: ['inventory_controller'],
            route: '/inventory/cycle-count',
            order: 4
          }
        ]
      },
      planning: {
        domain: {
          id: 'planning-replenishment',
          entity_name: 'Planning & Replenishment',
          entity_code: 'PLANNING',
          slug: 'planning',
          subtitle: 'Demand Planning & Auto-Replenishment',
          color: '#0891B2'
        },
        sections: [
          {
            id: 'planning-demand',
            entity_name: 'Demand Planning',
            entity_code: 'DEMAND',
            slug: 'demand',
            subtitle: 'Forecasting & demand analysis',
            icon: 'area-chart',
            color: '#0EA5E9',
            persona_label: 'Demand Planner',
            visible_roles: ['demand_planner'],
            route: '/planning/demand',
            order: 1
          },
          {
            id: 'planning-replenishment',
            entity_name: 'Auto Replenishment',
            entity_code: 'REPLENISHMENT',
            slug: 'replenishment',
            subtitle: 'Automated stock replenishment',
            icon: 'refresh-cw',
            color: '#10B981',
            persona_label: 'Planner',
            visible_roles: ['planner'],
            route: '/planning/replenishment',
            order: 2
          },
          {
            id: 'planning-allocation',
            entity_name: 'Allocation Planning',
            entity_code: 'ALLOCATION',
            slug: 'allocation',
            subtitle: 'Store allocation strategies',
            icon: 'pie-chart',
            color: '#7C3AED',
            persona_label: 'Allocation Manager',
            visible_roles: ['allocation_manager'],
            route: '/planning/allocation',
            order: 3
          }
        ]
      },
      finance: {
        domain: {
          id: 'finance-controlling',
          entity_name: 'Finance & Controlling',
          entity_code: 'FINANCE',
          slug: 'finance',
          subtitle: 'Accounting & Financial Control',
          color: '#DC2626'
        },
        sections: [
          {
            id: 'finance-gl',
            entity_name: 'General Ledger',
            entity_code: 'GL',
            slug: 'gl',
            subtitle: 'Chart of accounts & journal entries',
            icon: 'file-text',
            color: '#059669',
            persona_label: 'Accountant',
            visible_roles: ['accountant'],
            route: '/finance/gl',
            order: 1
          },
          {
            id: 'finance-ap',
            entity_name: 'Accounts Payable',
            entity_code: 'AP',
            slug: 'ap',
            subtitle: 'Vendor invoices & payments',
            icon: 'credit-card',
            color: '#DC2626',
            persona_label: 'AP Clerk',
            visible_roles: ['ap_clerk'],
            route: '/finance/ap',
            order: 2
          },
          {
            id: 'finance-ar',
            entity_name: 'Accounts Receivable',
            entity_code: 'AR',
            slug: 'ar',
            subtitle: 'Customer invoices & collections',
            icon: 'receipt',
            color: '#0EA5E9',
            persona_label: 'AR Clerk',
            visible_roles: ['ar_clerk'],
            route: '/finance/ar',
            order: 3
          },
          {
            id: 'finance-reports',
            entity_name: 'Financial Reports',
            entity_code: 'REPORTS',
            slug: 'reports',
            subtitle: 'P&L, balance sheet & analytics',
            icon: 'bar-chart-3',
            color: '#7C3AED',
            persona_label: 'CFO',
            visible_roles: ['cfo'],
            route: '/finance/reports',
            order: 4
          }
        ]
      },
      crm: {
        domain: {
          id: 'customer-loyalty',
          entity_name: 'Customer & Loyalty',
          entity_code: 'CRM',
          slug: 'crm',
          subtitle: 'CRM & Loyalty Programs',
          color: '#EC4899'
        },
        sections: [
          {
            id: 'crm-customers',
            entity_name: 'Customer Database',
            entity_code: 'CUSTOMERS',
            slug: 'customers',
            subtitle: 'Customer profiles & segmentation',
            icon: 'users',
            color: '#059669',
            persona_label: 'CRM Specialist',
            visible_roles: ['crm_specialist'],
            route: '/crm/customers',
            order: 1
          },
          {
            id: 'crm-loyalty',
            entity_name: 'Loyalty Programs',
            entity_code: 'LOYALTY',
            slug: 'loyalty',
            subtitle: 'Points & rewards management',
            icon: 'star',
            color: '#F59E0B',
            persona_label: 'Loyalty Manager',
            visible_roles: ['loyalty_manager'],
            route: '/crm/loyalty',
            order: 2
          },
          {
            id: 'crm-campaigns',
            entity_name: 'Marketing Campaigns',
            entity_code: 'CAMPAIGNS',
            slug: 'campaigns',
            subtitle: 'Email & promotional campaigns',
            icon: 'mail',
            color: '#8B5CF6',
            persona_label: 'Marketing Manager',
            visible_roles: ['marketing_manager'],
            route: '/crm/campaigns',
            order: 3
          }
        ]
      },
      analytics: {
        domain: {
          id: 'analytics-dashboards',
          entity_name: 'Analytics & Dashboards',
          entity_code: 'ANALYTICS',
          slug: 'analytics',
          subtitle: 'Business Intelligence & Reports',
          color: '#8B5CF6'
        },
        sections: [
          {
            id: 'analytics-sales',
            entity_name: 'Sales Analytics',
            entity_code: 'SALES',
            slug: 'sales',
            subtitle: 'Revenue & performance analysis',
            icon: 'trending-up',
            color: '#059669',
            persona_label: 'Sales Analyst',
            visible_roles: ['sales_analyst'],
            route: '/analytics/sales',
            order: 1
          },
          {
            id: 'analytics-inventory',
            entity_name: 'Inventory Analytics',
            entity_code: 'INVENTORY',
            slug: 'inventory',
            subtitle: 'Stock performance & trends',
            icon: 'bar-chart-3',
            color: '#0EA5E9',
            persona_label: 'Inventory Analyst',
            visible_roles: ['inventory_analyst'],
            route: '/analytics/inventory',
            order: 2
          },
          {
            id: 'analytics-customer',
            entity_name: 'Customer Analytics',
            entity_code: 'CUSTOMER',
            slug: 'customer',
            subtitle: 'Customer behavior & insights',
            icon: 'users',
            color: '#EC4899',
            persona_label: 'Customer Analyst',
            visible_roles: ['customer_analyst'],
            route: '/analytics/customer',
            order: 3
          },
          {
            id: 'analytics-financial',
            entity_name: 'Financial Analytics',
            entity_code: 'FINANCIAL',
            slug: 'financial',
            subtitle: 'Profitability & cost analysis',
            icon: 'dollar-sign',
            color: '#DC2626',
            persona_label: 'Financial Analyst',
            visible_roles: ['financial_analyst'],
            route: '/analytics/financial',
            order: 4
          }
        ]
      },
      admin: {
        domain: {
          id: 'platform-administration',
          entity_name: 'Platform & Administration',
          entity_code: 'ADMIN',
          slug: 'admin',
          subtitle: 'System Config & User Management',
          color: '#6B7280'
        },
        sections: [
          {
            id: 'admin-users',
            entity_name: 'User Management',
            entity_code: 'USERS',
            slug: 'users',
            subtitle: 'User accounts & permissions',
            icon: 'user-check',
            color: '#059669',
            persona_label: 'System Admin',
            visible_roles: ['system_admin'],
            route: '/admin/users',
            order: 1
          },
          {
            id: 'admin-roles',
            entity_name: 'Role Management',
            entity_code: 'ROLES',
            slug: 'roles',
            subtitle: 'Role-based access control',
            icon: 'shield',
            color: '#0EA5E9',
            persona_label: 'Security Admin',
            visible_roles: ['security_admin'],
            route: '/admin/roles',
            order: 2
          },
          {
            id: 'admin-config',
            entity_name: 'System Configuration',
            entity_code: 'CONFIG',
            slug: 'config',
            subtitle: 'Platform settings & preferences',
            icon: 'settings',
            color: '#7C3AED',
            persona_label: 'System Admin',
            visible_roles: ['system_admin'],
            route: '/admin/config',
            order: 3
          },
          {
            id: 'admin-monitoring',
            entity_name: 'System Monitoring',
            entity_code: 'MONITORING',
            slug: 'monitoring',
            subtitle: 'Performance & health metrics',
            icon: 'activity',
            color: '#DC2626',
            persona_label: 'DevOps',
            visible_roles: ['devops'],
            route: '/admin/monitoring',
            order: 4
          }
        ]
      }
    }

    const mockData = domainConfigs[domainSlug as keyof typeof domainConfigs]

    if (!mockData) {
      return NextResponse.json(
        { error: `Domain "${domainSlug}" not found` },
        { status: 404 }
      )
    }

    console.log('✅ API: Successfully loaded domain and sections')

    return NextResponse.json(mockData)

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}