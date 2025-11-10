/**
 * Layer 3 Workspace API - APP_WORKSPACE data for SAP-style workspaces
 * Smart Code: HERA.PLATFORM.API.WORKSPACE.v1
 * 
 * Fetches workspace configuration from platform organization
 * Route: /api/v2/platform/workspace/[domain]/[section]/[workspace]
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const [domain, section, workspace] = params.path

    console.log('🔍 API: Loading workspace for path:', { domain, section, workspace })

    // Mock workspace data based on your SQL template
    const workspaceConfigs = {
      'retail/pos/main': {
        workspace: {
          id: 'nav-work-retail-pos-main',
          entity_name: 'Retail POS Workspace',
          entity_code: 'NAV-WORK-RETAIL-POS-MAIN',
          slug: 'main',
          subtitle: 'Point-of-Sale Cockpit',
          icon: 'layout-dashboard',
          color: '#6366F1',
          persona_label: 'Store Mgr • Cashier',
          visible_roles: ['store_manager', 'cashier', 'retail_head'],
          route: '/apps/retail/pos/main'
        },
        layout_config: {
          default_nav_code: 'OVERVIEW',
          nav_items: [
            { code: 'OVERVIEW', label: 'Overview' },
            { code: 'MASTER_DATA', label: 'Master Data' },
            { code: 'TRANSACTIONS', label: 'Transactions' },
            { code: 'RELATIONSHIPS', label: 'Relationships' },
            { code: 'WORKFLOWS', label: 'Workflows' }
          ],
          sections: [
            {
              nav_code: 'OVERVIEW',
              title: 'Today at a Glance',
              cards: [
                {
                  label: 'Store Overview',
                  subtitle: 'Sales, items, payments',
                  icon: 'activity',
                  view_slug: 'overview',
                  target_type: 'DASHBOARD',
                  template_code: 'HERA.RETAIL.UI.DASHBOARD.POS.OVERVIEW.V1',
                  metrics: {
                    value: '₹47.2K',
                    label: 'Today\'s Revenue',
                    trend: 'up',
                    change: '+12.5%'
                  },
                  status: 'active',
                  priority: 'high',
                  lastUpdated: '2 min ago',
                  quickActions: [
                    { label: 'Refresh', icon: 'refresh-cw', action: 'refresh' },
                    { label: 'Export', icon: 'external-link', action: 'export' }
                  ]
                },
                {
                  label: 'Quick Sale',
                  subtitle: 'Start new transaction',
                  icon: 'shopping-cart',
                  view_slug: 'quick-sale',
                  target_type: 'TRANSACTION_FORM',
                  template_code: 'HERA.RETAIL.UI.FORM.QUICKSALE.V1',
                  metrics: {
                    value: 23,
                    label: 'Transactions Today',
                    trend: 'up',
                    change: '+8'
                  },
                  status: 'active',
                  priority: 'high',
                  quickActions: [
                    { label: 'New Sale', icon: 'plus-circle', action: 'create' }
                  ]
                },
                {
                  label: 'Today\'s Sales',
                  subtitle: 'Revenue & transaction count',
                  icon: 'bar-chart-3',
                  view_slug: 'todays-sales',
                  target_type: 'DASHBOARD',
                  template_code: 'HERA.RETAIL.UI.DASHBOARD.DAILYSALES.V1',
                  metrics: {
                    value: '₹2.1K',
                    label: 'Avg Transaction',
                    trend: 'up',
                    change: '+5.2%'
                  },
                  status: 'active',
                  priority: 'medium',
                  lastUpdated: '5 min ago'
                },
                {
                  label: 'Cash Register',
                  subtitle: 'Opening & closing balance',
                  icon: 'calculator',
                  view_slug: 'cash-register',
                  target_type: 'DASHBOARD',
                  template_code: 'HERA.RETAIL.UI.DASHBOARD.CASHREGISTER.V1',
                  metrics: {
                    value: '₹18.5K',
                    label: 'Cash Balance',
                    trend: 'neutral',
                    change: 'Balanced'
                  },
                  status: 'warning',
                  priority: 'medium',
                  lastUpdated: '1 min ago',
                  quickActions: [
                    { label: 'Cash Count', icon: 'calculator', action: 'count' }
                  ]
                }
              ]
            },
            {
              nav_code: 'MASTER_DATA',
              title: 'Master Data',
              cards: [
                {
                  label: 'Products',
                  subtitle: 'Manage product master',
                  icon: 'box',
                  view_slug: 'products',
                  target_type: 'ENTITY_LIST',
                  entity_type: 'PRODUCT',
                  default_mode: 'RUD',
                  template_code: 'HERA.RETAIL.UI.LIST.PRODUCT.V1',
                  metrics: {
                    value: 1247,
                    label: 'Products',
                    trend: 'up',
                    change: '+15 today'
                  },
                  status: 'active',
                  priority: 'medium',
                  lastUpdated: '10 min ago',
                  quickActions: [
                    { label: 'Add Product', icon: 'plus-circle', action: 'create' },
                    { label: 'Import', icon: 'external-link', action: 'import' }
                  ]
                },
                {
                  label: 'New Product',
                  subtitle: 'Create product master',
                  icon: 'plus-circle',
                  view_slug: 'product-create',
                  target_type: 'ENTITY_FORM',
                  entity_type: 'PRODUCT',
                  default_mode: 'CREATE',
                  template_code: 'HERA.RETAIL.UI.FORM.PRODUCT.V1',
                  status: 'active',
                  priority: 'high',
                  lastUpdated: 'Now',
                  quickActions: [
                    { label: 'Quick Add', icon: 'zap', action: 'quick-create' },
                    { label: 'Template', icon: 'edit-3', action: 'template' }
                  ]
                },
                {
                  label: 'Customers',
                  subtitle: 'Customer master data',
                  icon: 'user-circle-2',
                  view_slug: 'customers',
                  target_type: 'ENTITY_LIST',
                  entity_type: 'CUSTOMER',
                  default_mode: 'RUD',
                  template_code: 'HERA.RETAIL.UI.LIST.CUSTOMER.V1',
                  metrics: {
                    value: 892,
                    label: 'Customers',
                    trend: 'up',
                    change: '+5 today'
                  },
                  status: 'active',
                  priority: 'medium',
                  lastUpdated: '15 min ago',
                  quickActions: [
                    { label: 'New Customer', icon: 'plus-circle', action: 'create' },
                    { label: 'Export', icon: 'external-link', action: 'export' }
                  ]
                },
                {
                  label: 'Categories',
                  subtitle: 'Product categories',
                  icon: 'tags',
                  view_slug: 'categories',
                  target_type: 'ENTITY_LIST',
                  entity_type: 'CATEGORY',
                  default_mode: 'CRUD',
                  template_code: 'HERA.RETAIL.UI.LIST.CATEGORY.V1',
                  metrics: {
                    value: 24,
                    label: 'Categories',
                    trend: 'neutral'
                  },
                  status: 'active',
                  priority: 'low',
                  lastUpdated: '1 hr ago',
                  quickActions: [
                    { label: 'Manage', icon: 'edit-3', action: 'manage' }
                  ]
                }
              ]
            },
            {
              nav_code: 'TRANSACTIONS',
              title: 'Transactions',
              cards: [
                {
                  label: 'Sales Receipts',
                  subtitle: 'Create and manage POS bills',
                  icon: 'receipt',
                  view_slug: 'sales-receipts',
                  target_type: 'TRANSACTION_LIST',
                  transaction_smart_code: 'HERA.RETAIL.TXN.POS.SALESRECEIPT.V1',
                  template_code: 'HERA.RETAIL.UI.LIST.SALESRECEIPT.V1',
                  metrics: {
                    value: '₹47.2K',
                    label: 'Today\'s Sales',
                    trend: 'up',
                    change: '+12.5%'
                  },
                  status: 'active',
                  priority: 'high',
                  lastUpdated: '2 min ago',
                  quickActions: [
                    { label: 'New Sale', icon: 'plus-circle', action: 'create' },
                    { label: 'View All', icon: 'external-link', action: 'view-all' }
                  ]
                },
                {
                  label: 'Returns',
                  subtitle: 'Handle sales returns',
                  icon: 'rotate-ccw',
                  view_slug: 'sales-returns',
                  target_type: 'TRANSACTION_LIST',
                  transaction_smart_code: 'HERA.RETAIL.TXN.POS.RETURN.V1',
                  template_code: 'HERA.RETAIL.UI.LIST.SALESRETURN.V1',
                  metrics: {
                    value: 3,
                    label: 'Returns Today',
                    trend: 'down',
                    change: '-2'
                  },
                  status: 'warning',
                  priority: 'medium',
                  lastUpdated: '15 min ago',
                  quickActions: [
                    { label: 'Process Return', icon: 'rotate-ccw', action: 'process' }
                  ]
                },
                {
                  label: 'Payments',
                  subtitle: 'Payment methods & history',
                  icon: 'credit-card',
                  view_slug: 'payments',
                  target_type: 'TRANSACTION_LIST',
                  template_code: 'HERA.RETAIL.UI.LIST.PAYMENTS.V1',
                  metrics: {
                    value: '₹45.8K',
                    label: 'Payments Today',
                    trend: 'up',
                    change: '+8.2%'
                  },
                  status: 'active',
                  priority: 'medium',
                  lastUpdated: '5 min ago',
                  quickActions: [
                    { label: 'View Details', icon: 'external-link', action: 'view' }
                  ]
                },
                {
                  label: 'Discounts',
                  subtitle: 'Applied discounts & promotions',
                  icon: 'percent',
                  view_slug: 'discounts',
                  target_type: 'TRANSACTION_LIST',
                  template_code: 'HERA.RETAIL.UI.LIST.DISCOUNTS.V1',
                  metrics: {
                    value: '₹2.4K',
                    label: 'Discounts Given',
                    trend: 'up',
                    change: '+1.8%'
                  },
                  status: 'active',
                  priority: 'low',
                  lastUpdated: '20 min ago'
                }
              ]
            },
            {
              nav_code: 'RELATIONSHIPS',
              title: 'Relationships',
              cards: [
                {
                  label: 'Product–Store Mapping',
                  subtitle: 'Assortments & listings',
                  icon: 'squares-2x2',
                  view_slug: 'product-store-relations',
                  target_type: 'RELATION_GRAPH',
                  relation_smart_code: 'HERA.RETAIL.REL.PRODUCT.STORE.V1',
                  template_code: 'HERA.RETAIL.UI.RELATION.PRODUCTSTORE.V1'
                },
                {
                  label: 'Customer Loyalty',
                  subtitle: 'Customer tier relationships',
                  icon: 'users',
                  view_slug: 'customer-loyalty',
                  target_type: 'RELATION_GRAPH',
                  template_code: 'HERA.RETAIL.UI.RELATION.CUSTOMERLOYALTY.V1'
                }
              ]
            },
            {
              nav_code: 'WORKFLOWS',
              title: 'Workflows',
              cards: [
                {
                  label: 'Price Change Approvals',
                  subtitle: 'Approve POS price changes',
                  icon: 'clipboard-check',
                  view_slug: 'price-change-approvals',
                  target_type: 'WORKFLOW_BOARD',
                  workflow_smart_code: 'HERA.RETAIL.WF.PRICECHANGE.V1',
                  template_code: 'HERA.RETAIL.UI.WORKFLOW.PRICECHANGE.V1'
                },
                {
                  label: 'End of Day Process',
                  subtitle: 'Daily closing procedures',
                  icon: 'clock',
                  view_slug: 'end-of-day',
                  target_type: 'WORKFLOW_BOARD',
                  template_code: 'HERA.RETAIL.UI.WORKFLOW.ENDOFDAY.V1'
                }
              ]
            }
          ]
        }
      }
    }

    const workspacePath = `${domain}/${section}/${workspace}`
    const workspaceData = workspaceConfigs[workspacePath]

    if (!workspaceData) {
      return NextResponse.json(
        { error: `Workspace "${workspacePath}" not found` },
        { status: 404 }
      )
    }

    console.log('✅ API: Successfully loaded workspace data')

    return NextResponse.json(workspaceData)

  } catch (error) {
    console.error('❌ Workspace API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}