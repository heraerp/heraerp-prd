/**
 * HERA Workspace API - Legacy Third Layer Data Provider
 * Smart Code: HERA.API.V2.WORKSPACE.PROVIDER.LEGACY.v1
 * 
 * Legacy endpoint for backward compatibility
 * Redirects to new universal API structure
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = await params

  console.log(`🔄 Legacy workspace API called: ${domain}/${section}/${workspace} - redirecting to new API`)

  // Redirect to new universal API endpoint
  const newApiUrl = `/api/v2/${domain}/${section}/${workspace}`
  
  try {
    const response = await fetch(new URL(newApiUrl, request.url), {
      method: request.method,
      headers: request.headers
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Legacy Workspace API Error:', error)
    return NextResponse.json(
      { error: 'Failed to load workspace data' },
      { status: 500 }
    )
  }
}

async function getWorkspaceData(domain: string, section: string, workspace: string) {
  // For retail/inventory/main - return inventory-specific workspace
  if (domain === 'retail' && section === 'inventory' && workspace === 'main') {
    return {
      workspace: {
        id: 'retail-inventory-main',
        entity_name: 'Inventory Management',
        entity_code: 'INV-MAIN',
        slug: 'inventory-main',
        subtitle: 'Manage stock levels, batch tracking, and inventory analytics',
        icon: 'Package',
        color: 'blue',
        persona_label: 'Inventory Manager',
        visible_roles: ['inventory_manager', 'store_manager', 'admin'],
        route: '/apps/retail/inventory/main'
      },
      layout_config: {
        default_nav_code: 'master-data',
        nav_items: [
          { code: 'master-data', label: 'Master Data' },
          { code: 'workflow', label: 'Workflow' },
          { code: 'transactions', label: 'Transactions' }
        ],
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
                view_slug: 'inventory-list',
                metrics: {
                  value: 247,
                  unit: 'items',
                  label: 'Total Items',
                  trend: 'up',
                  change: '+12 this week'
                },
                status: 'active',
                priority: 'high',
                lastUpdated: new Date().toISOString(),
                quickActions: [
                  { label: 'Add Item', icon: 'Plus', action: 'create' },
                  { label: 'Low Stock', icon: 'AlertTriangle', action: 'filter-low-stock' }
                ]
              },
              {
                label: 'Add Inventory Item',
                description: 'Create new inventory entries',
                icon: 'PlusCircle',
                color: 'green',
                target_type: 'create',
                template_code: 'inventory-create',
                view_slug: 'inventory-create',
                status: 'active',
                priority: 'medium',
                lastUpdated: new Date().toISOString()
              },
              {
                label: 'Categories',
                description: 'Manage product categories',
                icon: 'Tags',
                color: 'purple',
                target_type: 'view',
                template_code: 'category-list',
                view_slug: 'categories',
                metrics: {
                  value: 18,
                  unit: 'categories',
                  label: 'Categories'
                },
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
                view_slug: 'stock-adjustments',
                metrics: {
                  value: 5,
                  unit: 'pending',
                  label: 'Pending Adjustments',
                  trend: 'down'
                },
                status: 'warning',
                priority: 'high',
                lastUpdated: new Date().toISOString()
              },
              {
                label: 'Reorder Workflow',
                description: 'Automated reordering when stock is low',
                icon: 'RefreshCw',
                color: 'blue',
                target_type: 'workflow',
                template_code: 'reorder-workflow',
                view_slug: 'reorder',
                status: 'active',
                priority: 'medium'
              },
              {
                label: 'Batch Tracking',
                description: 'Track product batches and expiry dates',
                icon: 'Clock',
                color: 'yellow',
                target_type: 'workflow',
                template_code: 'batch-tracking',
                view_slug: 'batch-tracking',
                metrics: {
                  value: 12,
                  unit: 'expiring soon',
                  label: 'Items Expiring'
                },
                status: 'warning',
                priority: 'high'
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
                view_slug: 'stock-movements',
                metrics: {
                  value: 89,
                  unit: 'today',
                  label: 'Movements Today',
                  trend: 'up',
                  change: '+15 vs yesterday'
                },
                status: 'active',
                priority: 'medium',
                lastUpdated: new Date().toISOString()
              },
              {
                label: 'Stock Takes',
                description: 'Physical inventory counts and reconciliation',
                icon: 'ClipboardCheck',
                color: 'purple',
                target_type: 'list',
                template_code: 'stock-takes',
                view_slug: 'stock-takes',
                status: 'active',
                priority: 'medium'
              },
              {
                label: 'Inventory Analytics',
                description: 'Detailed analytics and reporting',
                icon: 'BarChart3',
                color: 'indigo',
                target_type: 'analytics',
                template_code: 'inventory-analytics',
                view_slug: 'analytics',
                status: 'active',
                priority: 'low'
              }
            ]
          }
        ]
      }
    }
  }

  // For retail/pos/main - return POS-specific workspace
  if (domain === 'retail' && section === 'pos' && workspace === 'main') {
    return {
      workspace: {
        id: 'retail-pos-main',
        entity_name: 'Point of Sale',
        entity_code: 'POS-MAIN',
        slug: 'pos-main',
        subtitle: 'Complete POS operations with inventory integration',
        icon: 'ShoppingCart',
        color: 'green',
        persona_label: 'Store Cashier',
        visible_roles: ['cashier', 'sales_associate', 'store_manager', 'admin'],
        route: '/apps/retail/pos/main'
      },
      layout_config: {
        default_nav_code: 'transactions',
        nav_items: [
          { code: 'master-data', label: 'Master Data' },
          { code: 'workflow', label: 'Workflow' },
          { code: 'transactions', label: 'Transactions' }
        ],
        sections: [
          {
            nav_code: 'master-data',
            title: 'POS Master Data',
            cards: [
              {
                label: 'Products',
                description: 'Manage products and pricing',
                icon: 'Package',
                color: 'blue',
                target_type: 'view',
                template_code: 'product-list',
                view_slug: 'products',
                metrics: {
                  value: 156,
                  unit: 'products',
                  label: 'Active Products'
                },
                status: 'active',
                priority: 'high'
              },
              {
                label: 'Customers',
                description: 'Customer management and loyalty',
                icon: 'Users',
                color: 'purple',
                target_type: 'view',
                template_code: 'customer-list',
                view_slug: 'customers',
                metrics: {
                  value: 1247,
                  unit: 'customers',
                  label: 'Total Customers'
                },
                status: 'active',
                priority: 'medium'
              },
              {
                label: 'Suppliers',
                description: 'Supplier information and contacts',
                icon: 'Building2',
                color: 'orange',
                target_type: 'view',
                template_code: 'supplier-list',
                view_slug: 'suppliers',
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
                view_slug: 'sales-workflow',
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
                view_slug: 'returns',
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
                view_slug: 'new-sale',
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
                view_slug: 'sales-history',
                metrics: {
                  value: 47,
                  unit: 'today',
                  label: 'Sales Today'
                },
                status: 'active',
                priority: 'medium'
              },
              {
                label: 'Daily Reports',
                description: 'Sales analytics and reporting',
                icon: 'BarChart3',
                color: 'indigo',
                target_type: 'analytics',
                template_code: 'sales-analytics',
                view_slug: 'reports',
                status: 'active',
                priority: 'low'
              }
            ]
          }
        ]
      }
    }
  }

  // Default fallback for other domains/sections
  return {
    workspace: {
      id: `${domain}-${section}-${workspace}`,
      entity_name: `${section.charAt(0).toUpperCase()}${section.slice(1)} ${workspace.charAt(0).toUpperCase()}${workspace.slice(1)}`,
      entity_code: `${section.toUpperCase()}-${workspace.toUpperCase()}`,
      slug: `${section}-${workspace}`,
      subtitle: `Manage ${section} operations`,
      icon: 'Box',
      color: 'blue',
      persona_label: 'Manager',
      visible_roles: ['manager', 'admin'],
      route: `/apps/${domain}/${section}/${workspace}`
    },
    layout_config: {
      default_nav_code: 'master-data',
      nav_items: [
        { code: 'master-data', label: 'Master Data' },
        { code: 'workflow', label: 'Workflow' },
        { code: 'transactions', label: 'Transactions' }
      ],
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
              view_slug: 'list',
              status: 'active',
              priority: 'medium'
            }
          ]
        },
        {
          nav_code: 'workflow',
          title: 'Workflow',
          cards: []
        },
        {
          nav_code: 'transactions',
          title: 'Transactions',
          cards: []
        }
      ]
    }
  }
}