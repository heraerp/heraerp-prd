/**
 * HERA Universal API v2 - Domain/Section/Workspace Router
 * Smart Code: HERA.API.V2.UNIVERSAL.WORKSPACE.v1
 * 
 * Universal routing endpoint for all domain/section/workspace combinations
 * Maps to Sacred Six operations with context-aware Smart Code generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiV2 } from '@/lib/client/fetchV2'

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = await params

  console.log(`🔍 Universal Workspace API called:`, { domain, section, workspace })

  // Validate required parameters
  if (!domain || !section || !workspace) {
    console.error('Missing required parameters:', { domain, section, workspace })
    return NextResponse.json(
      { error: 'Missing required parameters: domain, section, or workspace' },
      { status: 400 }
    )
  }

  try {
    const workspaceData = await getUniversalWorkspaceData(domain, section, workspace)
    console.log(`✅ Successfully generated workspace data for ${domain}/${section}/${workspace}`)
    return NextResponse.json(workspaceData)
  } catch (error) {
    console.error('Universal Workspace API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load workspace data',
        details: error instanceof Error ? error.message : 'Unknown error',
        params: { domain, section, workspace }
      },
      { status: 500 }
    )
  }
}

async function getUniversalWorkspaceData(domain: string, section: string, workspace: string) {
  // Generate workspace configuration based on domain/section/workspace context
  const workspaceConfig = generateWorkspaceConfig(domain, section, workspace)
  
  return {
    workspace: {
      id: `${domain}-${section}-${workspace}`,
      entity_name: workspaceConfig.title,
      entity_code: `${domain.toUpperCase()}-${section.toUpperCase()}-${workspace.toUpperCase()}`,
      slug: `${domain}-${section}-${workspace}`,
      subtitle: workspaceConfig.subtitle,
      icon: workspaceConfig.icon,
      color: workspaceConfig.color,
      persona_label: workspaceConfig.personaLabel,
      visible_roles: workspaceConfig.visibleRoles,
      route: `/${domain}/${section}/${workspace}`
    },
    layout_config: {
      default_nav_code: workspaceConfig.defaultNav,
      nav_items: [
        { code: 'master-data', label: 'Master Data' },
        { code: 'workflow', label: 'Workflow' },
        { code: 'transactions', label: 'Transactions' },
        { code: 'relationships', label: 'Relationships' },
        { code: 'analytics', label: 'Analytics' }
      ],
      sections: workspaceConfig.sections
    }
  }
}

function generateWorkspaceConfig(domain: string, section: string, workspace: string) {
  console.log(`🔧 Generating workspace config for:`, { domain, section, workspace })
  
  // Safely handle parameters
  const safeDomain = domain || 'unknown'
  const safeSection = section || 'unknown'  
  const safeWorkspace = workspace || 'main'
  
  // Universal workspace configurations
  const configs = {
    'retail.inventory.main': {
      title: 'Inventory Management',
      subtitle: 'Manage stock levels, batch tracking, and inventory analytics',
      icon: 'Package',
      color: 'blue',
      personaLabel: 'Inventory Manager',
      visibleRoles: ['inventory_manager', 'store_manager', 'admin'],
      defaultNav: 'master-data',
      sections: [
        {
          nav_code: 'master-data',
          title: 'Inventory Master Data',
          cards: [
            {
              label: 'View Inventory',
              description: 'Current stock levels and item details',
              icon: 'Package',
              color: 'blue',
              target_type: 'view',
              template_code: 'inventory-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/inventory`,
              metrics: {
                value: 247,
                unit: 'items',
                label: 'Total Items',
                trend: 'up',
                change: '+12 this week'
              },
              status: 'active',
              priority: 'high',
              lastUpdated: new Date().toISOString()
            },
            {
              label: 'Add Inventory Item',
              description: 'Create new inventory entries',
              icon: 'PlusCircle',
              color: 'green',
              target_type: 'create',
              template_code: 'inventory-create',
              view_slug: `/${domain}/${section}/${workspace}/entities/inventory/create`,
              status: 'active',
              priority: 'medium'
            },
            {
              label: 'Products',
              description: 'Manage product catalog',
              icon: 'Box',
              color: 'purple',
              target_type: 'view',
              template_code: 'product-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/products`,
              status: 'active',
              priority: 'medium'
            },
            {
              label: 'Suppliers',
              description: 'Supplier management',
              icon: 'Building2',
              color: 'orange',
              target_type: 'view',
              template_code: 'supplier-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/suppliers`,
              status: 'active',
              priority: 'low'
            }
          ]
        },
        {
          nav_code: 'workflow',
          title: 'Inventory Workflows',
          cards: [
            {
              label: 'Stock Adjustments',
              description: 'Adjust stock levels and resolve discrepancies',
              icon: 'RotateCcw',
              color: 'orange',
              target_type: 'workflow',
              template_code: 'stock-adjustment',
              view_slug: `/${domain}/${section}/${workspace}/workflows/adjustments`,
              metrics: {
                value: 5,
                unit: 'pending',
                label: 'Pending Adjustments',
                trend: 'down'
              },
              status: 'warning',
              priority: 'high'
            },
            {
              label: 'Reorder Workflow',
              description: 'Automated reordering when stock is low',
              icon: 'RefreshCw',
              color: 'blue',
              target_type: 'workflow',
              template_code: 'reorder-workflow',
              view_slug: `/${domain}/${section}/${workspace}/workflows/reorder`,
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'transactions',
          title: 'Inventory Transactions',
          cards: [
            {
              label: 'Stock Movements',
              description: 'View all inventory movements and transfers',
              icon: 'Activity',
              color: 'green',
              target_type: 'list',
              template_code: 'stock-movements',
              view_slug: `/${domain}/${section}/${workspace}/transactions/movements`,
              metrics: {
                value: 89,
                unit: 'today',
                label: 'Movements Today',
                trend: 'up',
                change: '+15 vs yesterday'
              },
              status: 'active',
              priority: 'medium'
            },
            {
              label: 'Stock Takes',
              description: 'Physical inventory counts',
              icon: 'ClipboardCheck',
              color: 'purple',
              target_type: 'list',
              template_code: 'stock-takes',
              view_slug: `/${domain}/${section}/${workspace}/transactions/stock-takes`,
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'relationships',
          title: 'Inventory Relationships',
          cards: [
            {
              label: 'Product-Supplier Links',
              description: 'Manage product-supplier relationships',
              icon: 'Link',
              color: 'indigo',
              target_type: 'view',
              template_code: 'relationships-view',
              view_slug: `/${domain}/${section}/${workspace}/relationships/product-supplier`,
              status: 'active',
              priority: 'low'
            }
          ]
        },
        {
          nav_code: 'analytics',
          title: 'Inventory Analytics',
          cards: [
            {
              label: 'Inventory Reports',
              description: 'Detailed analytics and reporting',
              icon: 'BarChart3',
              color: 'indigo',
              target_type: 'analytics',
              template_code: 'inventory-analytics',
              view_slug: `/${domain}/${section}/${workspace}/analytics/reports`,
              status: 'active',
              priority: 'low'
            }
          ]
        }
      ]
    },
    'retail.pos.main': {
      title: 'Point of Sale',
      subtitle: 'Complete POS operations with inventory integration',
      icon: 'ShoppingCart',
      color: 'green',
      personaLabel: 'Store Cashier',
      visibleRoles: ['cashier', 'sales_associate', 'store_manager', 'admin'],
      defaultNav: 'transactions',
      sections: [
        {
          nav_code: 'master-data',
          title: 'POS Master Data',
          cards: [
            {
              label: 'Customers',
              description: 'Customer management and loyalty',
              icon: 'Users',
              color: 'purple',
              target_type: 'view',
              template_code: 'customer-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/customers`,
              metrics: {
                value: 1247,
                unit: 'customers',
                label: 'Total Customers'
              },
              status: 'active',
              priority: 'medium'
            },
            {
              label: 'Products',
              description: 'Manage products and pricing',
              icon: 'Package',
              color: 'blue',
              target_type: 'view',
              template_code: 'product-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/products`,
              status: 'active',
              priority: 'high'
            },
            {
              label: 'Suppliers',
              description: 'Supplier information and contacts',
              icon: 'Building2',
              color: 'orange',
              target_type: 'view',
              template_code: 'supplier-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/suppliers`,
              status: 'active',
              priority: 'low'
            }
          ]
        },
        {
          nav_code: 'workflow',
          title: 'POS Workflows',
          cards: [
            {
              label: 'Sales Process',
              description: 'Customer checkout and payment workflow',
              icon: 'CreditCard',
              color: 'green',
              target_type: 'workflow',
              template_code: 'sales-workflow',
              view_slug: `/${domain}/${section}/${workspace}/workflows/checkout`,
              status: 'active',
              priority: 'high'
            },
            {
              label: 'Returns & Exchanges',
              description: 'Handle product returns and exchanges',
              icon: 'RotateCcw',
              color: 'yellow',
              target_type: 'workflow',
              template_code: 'returns-workflow',
              view_slug: `/${domain}/${section}/${workspace}/workflows/returns`,
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'transactions',
          title: 'POS Transactions',
          cards: [
            {
              label: 'New Sale',
              description: 'Process customer purchases',
              icon: 'ShoppingCart',
              color: 'green',
              target_type: 'create',
              template_code: 'pos-sale',
              view_slug: `/${domain}/${section}/${workspace}/transactions/sales/create`,
              status: 'active',
              priority: 'high'
            },
            {
              label: 'Sales History',
              description: 'View all sales transactions',
              icon: 'Receipt',
              color: 'blue',
              target_type: 'list',
              template_code: 'sales-list',
              view_slug: `/${domain}/${section}/${workspace}/transactions/sales`,
              metrics: {
                value: 47,
                unit: 'today',
                label: 'Sales Today'
              },
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'relationships',
          title: 'POS Relationships',
          cards: [
            {
              label: 'Customer Orders',
              description: 'Customer-order relationships',
              icon: 'Link',
              color: 'indigo',
              target_type: 'view',
              template_code: 'relationships-view',
              view_slug: `/${domain}/${section}/${workspace}/relationships/customer-orders`,
              status: 'active',
              priority: 'low'
            }
          ]
        },
        {
          nav_code: 'analytics',
          title: 'POS Analytics',
          cards: [
            {
              label: 'Daily Reports',
              description: 'Sales analytics and reporting',
              icon: 'BarChart3',
              color: 'indigo',
              target_type: 'analytics',
              template_code: 'sales-analytics',
              view_slug: `/${domain}/${section}/${workspace}/analytics/sales`,
              status: 'active',
              priority: 'low'
            }
          ]
        }
      ]
    },
    'wholesale.ordering.main': {
      title: 'Order Management',
      subtitle: 'B2B order processing and bulk order workflows',
      icon: 'ShoppingCart',
      color: 'green',
      personaLabel: 'Order Manager',
      visibleRoles: ['order_manager', 'sales_manager', 'admin'],
      defaultNav: 'master-data',
      sections: [
        {
          nav_code: 'master-data',
          title: 'Order Master Data',
          cards: [
            {
              label: 'View Orders',
              description: 'Current wholesale orders and status',
              icon: 'Receipt',
              color: 'blue',
              target_type: 'view',
              template_code: 'order-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/orders`,
              metrics: {
                value: 89,
                unit: 'orders',
                label: 'Active Orders',
                trend: 'up',
                change: '+12 this week'
              },
              status: 'active',
              priority: 'high',
              lastUpdated: new Date().toISOString()
            },
            {
              label: 'Create Order',
              description: 'New wholesale order entry',
              icon: 'PlusCircle',
              color: 'green',
              target_type: 'create',
              template_code: 'order-create',
              view_slug: `/${domain}/${section}/${workspace}/entities/orders/create`,
              status: 'active',
              priority: 'high'
            },
            {
              label: 'Customers',
              description: 'Wholesale customer accounts',
              icon: 'Users',
              color: 'purple',
              target_type: 'view',
              template_code: 'customer-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/customers`,
              metrics: {
                value: 156,
                unit: 'customers',
                label: 'Active Accounts'
              },
              status: 'active',
              priority: 'medium'
            },
            {
              label: 'Products',
              description: 'Wholesale product catalog',
              icon: 'Package',
              color: 'orange',
              target_type: 'view',
              template_code: 'product-list',
              view_slug: `/${domain}/${section}/${workspace}/entities/products`,
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'workflow',
          title: 'Order Workflows',
          cards: [
            {
              label: 'Order Processing',
              description: 'Process and fulfill wholesale orders',
              icon: 'ClipboardCheck',
              color: 'blue',
              target_type: 'workflow',
              template_code: 'order-processing',
              view_slug: `/${domain}/${section}/${workspace}/workflows/processing`,
              metrics: {
                value: 23,
                unit: 'pending',
                label: 'Pending Processing',
                trend: 'down'
              },
              status: 'active',
              priority: 'high'
            },
            {
              label: 'Bulk Ordering',
              description: 'Bulk order templates and automation',
              icon: 'Grid3x3',
              color: 'purple',
              target_type: 'workflow',
              template_code: 'bulk-ordering',
              view_slug: `/${domain}/${section}/${workspace}/workflows/bulk-orders`,
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'transactions',
          title: 'Order Transactions',
          cards: [
            {
              label: 'Order History',
              description: 'Complete order transaction history',
              icon: 'FileText',
              color: 'indigo',
              target_type: 'list',
              template_code: 'order-history',
              view_slug: `/${domain}/${section}/${workspace}/transactions/orders`,
              metrics: {
                value: 1247,
                unit: 'total',
                label: 'Orders This Month',
                trend: 'up',
                change: '+18% vs last month'
              },
              status: 'active',
              priority: 'medium'
            },
            {
              label: 'Payments',
              description: 'Order payment tracking',
              icon: 'CreditCard',
              color: 'green',
              target_type: 'list',
              template_code: 'payment-tracking',
              view_slug: `/${domain}/${section}/${workspace}/transactions/payments`,
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'relationships',
          title: 'Order Relationships',
          cards: [
            {
              label: 'Customer-Orders',
              description: 'Customer-order relationship mapping',
              icon: 'Link',
              color: 'blue',
              target_type: 'view',
              template_code: 'relationships-view',
              view_slug: `/${domain}/${section}/${workspace}/relationships/customer-orders`,
              status: 'active',
              priority: 'low'
            }
          ]
        },
        {
          nav_code: 'analytics',
          title: 'Order Analytics',
          cards: [
            {
              label: 'Order Reports',
              description: 'Order analytics and performance metrics',
              icon: 'BarChart3',
              color: 'indigo',
              target_type: 'analytics',
              template_code: 'order-analytics',
              view_slug: `/${domain}/${section}/${workspace}/analytics/orders`,
              status: 'active',
              priority: 'low'
            }
          ]
        }
      ]
    }
  }

  // Get specific config or generate default
  const configKey = `${safeDomain}.${safeSection}.${safeWorkspace}`
  console.log(`🔑 Looking for config key: ${configKey}`)
  
  const foundConfig = configs[configKey]
  if (foundConfig) {
    console.log(`✅ Found specific config for ${configKey}`)
    return foundConfig
  } else {
    console.log(`⚡ Using default config for ${configKey}`)
    return generateDefaultConfig(safeDomain, safeSection, safeWorkspace)
  }
}

function generateDefaultConfig(domain: string, section: string, workspace: string) {
  // Safely handle undefined parameters
  const safeDomain = domain || 'unknown'
  const safeSection = section || 'unknown'
  const safeWorkspace = workspace || 'main'
  
  return {
    title: `${safeSection.charAt(0).toUpperCase()}${safeSection.slice(1)} ${safeWorkspace.charAt(0).toUpperCase()}${safeWorkspace.slice(1)}`,
    subtitle: `Manage ${safeSection} operations in ${safeDomain}`,
    icon: 'Box',
    color: 'blue',
    personaLabel: 'Manager',
    visibleRoles: ['manager', 'admin'],
    defaultNav: 'master-data',
    sections: [
      {
        nav_code: 'master-data',
        title: 'Master Data',
        cards: [
          {
            label: 'View Items',
            description: 'View and manage items',
            icon: 'Eye',
            color: 'blue',
            target_type: 'view',
            template_code: 'generic-list',
            view_slug: `/${safeDomain}/${safeSection}/${safeWorkspace}/entities/items`,
            status: 'active',
            priority: 'medium'
          }
        ]
      }
    ]
  }
}