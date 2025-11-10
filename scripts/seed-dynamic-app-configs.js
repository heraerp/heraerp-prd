#!/usr/bin/env node

/**
 * HERA Dynamic App Configuration Seeder
 * Smart Code: HERA.PLATFORM.SEEDER.APP_CONFIGS.v1
 * 
 * Migrates hardcoded industry templates to Supabase for dynamic resolution
 * This transforms the Universal App Builder from static to dynamic architecture
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Use a regular organization for testing (from MCP test script)
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

// Use the actual user entity ID from the test data  
const TEST_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

// Industry template configurations (migrated from hardcoded TypeScript)
const INDUSTRY_TEMPLATES = {
  'fish-exports': {
    app_id: 'fish-exports',
    name: 'Fish Exports Management',
    description: 'Complete seafood processing and export management system',
    industry: 'fish_exports',
    version: '1.0.0',
    metadata: {
      name: 'Fish Exports Management',
      description: 'Complete seafood processing and export management system',
      module: 'fish_exports',
      icon: 'Ship',
      category: 'industry_specific',
      tags: ['seafood', 'export', 'processing', 'quality'],
      author: 'HERA Platform',
      created_at: new Date().toISOString()
    },
    entities: [
      {
        entity_type: 'VESSEL',
        smart_code_prefix: 'HERA.FISH_EXPORTS.VESSEL',
        display_name: 'Fishing Vessel',
        display_name_plural: 'Fishing Vessels',
        icon: 'Ship',
        color: '#0ea5e9',
        master_data: {
          is_master: true,
          has_code: true,
          code_pattern: '^[A-Z]{2}-[A-Z]{2}-[0-9]{4}$',
          has_hierarchy: false,
          supports_versioning: false
        },
        fields: [
          {
            field_name: 'vessel_name',
            display_label: 'Vessel Name',
            field_type: 'text',
            is_required: true,
            is_searchable: true,
            field_order: 1,
            validation: {
              min_length: 2,
              max_length: 100,
              error_message: 'Vessel name must be between 2 and 100 characters'
            },
            ui_hints: {
              placeholder: 'Enter vessel name',
              input_type: 'text'
            }
          },
          {
            field_name: 'registration_number',
            display_label: 'Registration Number',
            field_type: 'text',
            is_required: true,
            is_unique: true,
            is_searchable: true,
            field_order: 2,
            validation: {
              pattern: '^[A-Z]{2}-[A-Z]{2}-[0-9]{4}$',
              error_message: 'Registration number must follow format: XX-XX-0000'
            },
            ui_hints: {
              placeholder: 'KL-FB-1234',
              input_type: 'text'
            }
          },
          {
            field_name: 'capacity_tons',
            display_label: 'Capacity (Tons)',
            field_type: 'number',
            is_required: true,
            field_order: 3,
            validation: {
              min: 0.1,
              max: 1000,
              error_message: 'Capacity must be between 0.1 and 1000 tons'
            },
            ui_hints: {
              placeholder: '25.5',
              input_type: 'number',
              format: '0.00'
            }
          },
          {
            field_name: 'captain_name',
            display_label: 'Captain Name',
            field_type: 'text',
            is_required: true,
            field_order: 4,
            validation: {
              min_length: 2,
              max_length: 100,
              error_message: 'Captain name must be between 2 and 100 characters'
            },
            ui_hints: {
              placeholder: 'Captain Raghavan',
              input_type: 'text'
            }
          },
          {
            field_name: 'crew_size',
            display_label: 'Crew Size',
            field_type: 'number',
            is_required: false,
            field_order: 5,
            validation: {
              min: 1,
              max: 50,
              error_message: 'Crew size must be between 1 and 50'
            },
            ui_hints: {
              placeholder: '8',
              input_type: 'number'
            }
          }
        ],
        relationships: [
          {
            relationship_type: 'OWNS',
            to_entity_type: 'CATCH',
            cardinality: 'one_to_many',
            is_required: false,
            display_name: 'Vessel Catches'
          }
        ]
      },
      {
        entity_type: 'CATCH',
        smart_code_prefix: 'HERA.FISH_EXPORTS.CATCH',
        display_name: 'Fish Catch',
        display_name_plural: 'Fish Catches',
        icon: 'Fish',
        color: '#10b981',
        master_data: {
          is_master: true,
          has_code: true,
          code_pattern: '^CATCH-[0-9]{6}$',
          has_hierarchy: false,
          supports_versioning: false
        },
        fields: [
          {
            field_name: 'species',
            display_label: 'Fish Species',
            field_type: 'text',
            is_required: true,
            is_searchable: true,
            field_order: 1,
            ui_hints: {
              input_type: 'select',
              options: [
                { value: 'tuna', label: 'Tuna', color: '#3b82f6' },
                { value: 'sardine', label: 'Sardine', color: '#10b981' },
                { value: 'mackerel', label: 'Mackerel', color: '#f59e0b' },
                { value: 'kingfish', label: 'Kingfish', color: '#8b5cf6' }
              ]
            }
          },
          {
            field_name: 'catch_date',
            display_label: 'Catch Date',
            field_type: 'date',
            is_required: true,
            field_order: 2,
            validation: {
              max_date: new Date().toISOString().split('T')[0],
              error_message: 'Catch date cannot be in the future'
            },
            ui_hints: {
              input_type: 'date'
            }
          },
          {
            field_name: 'quantity_kg',
            display_label: 'Quantity (KG)',
            field_type: 'number',
            is_required: true,
            field_order: 3,
            validation: {
              min: 0.1,
              max: 50000,
              error_message: 'Quantity must be between 0.1 and 50,000 KG'
            },
            ui_hints: {
              input_type: 'number',
              format: '0.00'
            }
          },
          {
            field_name: 'quality_grade',
            display_label: 'Quality Grade',
            field_type: 'text',
            is_required: true,
            field_order: 4,
            ui_hints: {
              input_type: 'select',
              options: [
                { value: 'premium', label: 'Premium', color: '#10b981' },
                { value: 'standard', label: 'Standard', color: '#3b82f6' },
                { value: 'commercial', label: 'Commercial', color: '#f59e0b' }
              ]
            }
          },
          {
            field_name: 'vessel_id',
            display_label: 'Vessel',
            field_type: 'entity_reference',
            is_required: true,
            field_order: 5,
            ui_hints: {
              input_type: 'entity_lookup'
            }
          }
        ]
      },
      {
        entity_type: 'BUYER',
        smart_code_prefix: 'HERA.FISH_EXPORTS.BUYER',
        display_name: 'Export Buyer',
        display_name_plural: 'Export Buyers',
        icon: 'Building2',
        color: '#8b5cf6',
        master_data: {
          is_master: true,
          has_code: true,
          code_pattern: '^BUYER-[A-Z]{2}-[0-9]{4}$',
          has_hierarchy: false,
          supports_versioning: false
        },
        fields: [
          {
            field_name: 'company_name',
            display_label: 'Company Name',
            field_type: 'text',
            is_required: true,
            is_searchable: true,
            field_order: 1,
            validation: {
              min_length: 2,
              max_length: 200,
              error_message: 'Company name must be between 2 and 200 characters'
            },
            ui_hints: {
              placeholder: 'Dubai Fish Trading LLC',
              input_type: 'text'
            }
          },
          {
            field_name: 'contact_person',
            display_label: 'Contact Person',
            field_type: 'text',
            is_required: true,
            field_order: 2,
            ui_hints: {
              placeholder: 'Ahmed Al-Rashid',
              input_type: 'text'
            }
          },
          {
            field_name: 'country',
            display_label: 'Country',
            field_type: 'text',
            is_required: true,
            is_searchable: true,
            field_order: 3,
            ui_hints: {
              input_type: 'select',
              options: [
                { value: 'UAE', label: 'United Arab Emirates' },
                { value: 'USA', label: 'United States' },
                { value: 'UK', label: 'United Kingdom' },
                { value: 'JPN', label: 'Japan' },
                { value: 'SGP', label: 'Singapore' }
              ]
            }
          },
          {
            field_name: 'credit_limit',
            display_label: 'Credit Limit',
            field_type: 'number',
            is_required: false,
            field_order: 4,
            validation: {
              min: 0,
              max: 10000000,
              error_message: 'Credit limit must be between 0 and 10,000,000'
            },
            ui_hints: {
              input_type: 'number',
              format: '0.00',
              currency: 'USD'
            }
          }
        ]
      }
    ],
    transactions: [
      {
        transaction_type: 'EXPORT_ORDER',
        smart_code_prefix: 'HERA.FISH_EXPORTS.TXN.EXPORT_ORDER',
        display_name: 'Export Order',
        display_name_plural: 'Export Orders',
        icon: 'Package',
        color: '#f59e0b',
        header_fields: [
          {
            field_name: 'order_number',
            display_label: 'Order Number',
            field_type: 'text',
            is_required: true,
            is_unique: true,
            field_order: 1,
            validation: {
              pattern: '^EO-[0-9]{4}-[0-9]{3}$',
              error_message: 'Order number must follow format: EO-YYYY-000'
            },
            ui_hints: {
              placeholder: 'EO-2025-001',
              input_type: 'text'
            }
          },
          {
            field_name: 'buyer_id',
            display_label: 'Buyer',
            field_type: 'entity_reference',
            is_required: true,
            field_order: 2,
            ui_hints: {
              input_type: 'entity_lookup'
            }
          },
          {
            field_name: 'ship_date',
            display_label: 'Ship Date',
            field_type: 'date',
            is_required: true,
            field_order: 3,
            validation: {
              min_date: new Date().toISOString().split('T')[0],
              error_message: 'Ship date cannot be in the past'
            },
            ui_hints: {
              input_type: 'date'
            }
          },
          {
            field_name: 'destination_port',
            display_label: 'Destination Port',
            field_type: 'text',
            is_required: true,
            field_order: 4,
            ui_hints: {
              input_type: 'select',
              options: [
                { value: 'dubai_port', label: 'Dubai Port' },
                { value: 'mumbai_port', label: 'Mumbai Port' },
                { value: 'singapore_port', label: 'Singapore Port' },
                { value: 'tokyo_port', label: 'Tokyo Port' }
              ]
            }
          }
        ],
        line_fields: [
          {
            field_name: 'catch_id',
            display_label: 'Fish Catch',
            field_type: 'entity_reference',
            is_required: true,
            field_order: 1,
            ui_hints: {
              input_type: 'entity_lookup'
            }
          },
          {
            field_name: 'quantity_kg',
            display_label: 'Quantity (KG)',
            field_type: 'number',
            is_required: true,
            field_order: 2,
            validation: {
              min: 0.1,
              max: 10000,
              error_message: 'Quantity must be between 0.1 and 10,000 KG'
            },
            ui_hints: {
              input_type: 'number',
              format: '0.00'
            }
          },
          {
            field_name: 'unit_price',
            display_label: 'Unit Price (USD)',
            field_type: 'number',
            is_required: true,
            field_order: 3,
            validation: {
              min: 0.01,
              max: 1000,
              error_message: 'Unit price must be between 0.01 and 1,000 USD'
            },
            ui_hints: {
              input_type: 'number',
              format: '0.00',
              currency: 'USD'
            }
          },
          {
            field_name: 'processing_type',
            display_label: 'Processing Type',
            field_type: 'text',
            is_required: true,
            field_order: 4,
            ui_hints: {
              input_type: 'select',
              options: [
                { value: 'fresh_frozen', label: 'Fresh Frozen' },
                { value: 'fresh_chilled', label: 'Fresh Chilled' },
                { value: 'dried', label: 'Dried' },
                { value: 'smoked', label: 'Smoked' }
              ]
            }
          }
        ],
        state_machine: {
          initial_state: 'draft',
          states: [
            { name: 'draft', color: '#64748b', actions: ['edit', 'submit'], display_label: 'Draft' },
            { name: 'submitted', color: '#3b82f6', actions: ['approve', 'reject'], display_label: 'Submitted' },
            { name: 'approved', color: '#10b981', actions: ['ship'], display_label: 'Approved' },
            { name: 'shipped', color: '#8b5cf6', actions: ['complete'], display_label: 'Shipped' },
            { name: 'completed', color: '#10b981', actions: [], display_label: 'Completed' },
            { name: 'rejected', color: '#ef4444', actions: ['edit'], display_label: 'Rejected' }
          ],
          transitions: [
            { from: 'draft', to: 'submitted', action: 'submit', display_label: 'Submit for Approval' },
            { from: 'submitted', to: 'approved', action: 'approve', display_label: 'Approve' },
            { from: 'submitted', to: 'rejected', action: 'reject', display_label: 'Reject' },
            { from: 'approved', to: 'shipped', action: 'ship', display_label: 'Ship Order' },
            { from: 'shipped', to: 'completed', action: 'complete', display_label: 'Mark Complete' },
            { from: 'rejected', to: 'draft', action: 'edit', display_label: 'Edit and Resubmit' }
          ]
        }
      }
    ],
    screens: [
      {
        screen_id: 'vessel_list',
        screen_type: 'entity_list',
        entity_type: 'VESSEL',
        display_name: 'Vessels',
        icon: 'Ship',
        columns: [
          { field_name: 'vessel_name', display_label: 'Vessel Name', sortable: true, width: '200px' },
          { field_name: 'registration_number', display_label: 'Registration', sortable: true, width: '150px' },
          { field_name: 'capacity_tons', display_label: 'Capacity', sortable: true, width: '120px', render: 'number', align: 'right' },
          { field_name: 'captain_name', display_label: 'Captain', sortable: true, width: '180px' }
        ],
        filters: [
          { field_name: 'capacity_tons', display_label: 'Capacity Range', filter_type: 'range', min: 0, max: 1000 },
          { field_name: 'registration_number', display_label: 'Registration', filter_type: 'text' }
        ],
        actions: [
          { action_id: 'create', display_label: 'New Vessel', icon: 'Plus', primary: true },
          { action_id: 'edit', display_label: 'Edit', icon: 'Edit' },
          { action_id: 'delete', display_label: 'Delete', icon: 'Trash2', confirm: true }
        ]
      }
    ],
    navigation: {
      main_menu: [
        { id: 'vessels', label: 'Vessels', icon: 'Ship', path: '/fish-exports/vessel' },
        { id: 'catches', label: 'Catches', icon: 'Fish', path: '/fish-exports/catch' },
        { id: 'buyers', label: 'Buyers', icon: 'Building2', path: '/fish-exports/buyer' },
        { id: 'export_orders', label: 'Export Orders', icon: 'Package', path: '/fish-exports/export-order' }
      ],
      quick_actions: [
        { id: 'new_catch', label: 'Record Catch', icon: 'Plus', path: '/fish-exports/catch/new', color: '#10b981' },
        { id: 'new_order', label: 'New Export Order', icon: 'Package', path: '/fish-exports/export-order/new', color: '#f59e0b' }
      ],
      dashboards: [
        {
          dashboard_id: 'main',
          name: 'Fish Exports Dashboard',
          layout: 'grid',
          widgets: [
            { widget_id: 'daily_catch', type: 'metric', title: 'Daily Catch (KG)', size: 'small', data_source: 'catch', config: { aggregate: 'SUM', field: 'quantity_kg', period: 'today' } },
            { widget_id: 'active_orders', type: 'metric', title: 'Active Orders', size: 'small', data_source: 'export_order', config: { aggregate: 'COUNT', filter: { status: 'approved' } } },
            { widget_id: 'revenue_chart', type: 'chart', title: 'Monthly Revenue', size: 'large', data_source: 'export_order', config: { chart_type: 'line', period: 'month', field: 'total_amount' } }
          ]
        }
      ]
    },
    ui_theme: {
      primary_color: '#0ea5e9',
      secondary_color: '#64748b',
      accent_color: '#f1f5f9'
    }
  },

  'retail': {
    app_id: 'retail',
    name: 'Retail Management System',
    description: 'Point-of-sale and inventory management system',
    industry: 'retail',
    version: '1.0.0',
    metadata: {
      name: 'Retail Management System',
      description: 'Point-of-sale and inventory management system',
      module: 'retail',
      icon: 'ShoppingCart',
      category: 'business_management',
      tags: ['pos', 'inventory', 'retail', 'sales'],
      author: 'HERA Platform',
      created_at: new Date().toISOString()
    },
    entities: [
      {
        entity_type: 'PRODUCT',
        smart_code_prefix: 'HERA.RETAIL.PRODUCT',
        display_name: 'Product',
        display_name_plural: 'Products',
        icon: 'Package',
        color: '#10b981',
        master_data: {
          is_master: true,
          has_code: true,
          code_pattern: '^[A-Z0-9]{6,12}$',
          has_hierarchy: true,
          supports_versioning: false
        },
        fields: [
          {
            field_name: 'product_name',
            display_label: 'Product Name',
            field_type: 'text',
            is_required: true,
            is_searchable: true,
            field_order: 1,
            ui_hints: {
              placeholder: 'Enter product name',
              input_type: 'text'
            }
          },
          {
            field_name: 'sku',
            display_label: 'SKU',
            field_type: 'text',
            is_required: true,
            is_unique: true,
            is_searchable: true,
            field_order: 2,
            validation: {
              pattern: '^[A-Z0-9]{6,12}$',
              error_message: 'SKU must be 6-12 alphanumeric characters'
            },
            ui_hints: {
              placeholder: 'SKU123456',
              input_type: 'text'
            }
          },
          {
            field_name: 'price',
            display_label: 'Price',
            field_type: 'number',
            is_required: true,
            field_order: 3,
            validation: {
              min: 0.01,
              max: 100000,
              error_message: 'Price must be between 0.01 and 100,000'
            },
            ui_hints: {
              input_type: 'number',
              format: '0.00',
              currency: 'USD'
            }
          },
          {
            field_name: 'category',
            display_label: 'Category',
            field_type: 'text',
            is_required: true,
            is_searchable: true,
            field_order: 4,
            ui_hints: {
              input_type: 'select',
              options: [
                { value: 'electronics', label: 'Electronics' },
                { value: 'clothing', label: 'Clothing' },
                { value: 'food', label: 'Food & Beverage' },
                { value: 'books', label: 'Books' },
                { value: 'home', label: 'Home & Garden' }
              ]
            }
          },
          {
            field_name: 'stock_quantity',
            display_label: 'Stock Quantity',
            field_type: 'number',
            is_required: false,
            field_order: 5,
            validation: {
              min: 0,
              max: 100000,
              error_message: 'Stock quantity must be between 0 and 100,000'
            },
            ui_hints: {
              input_type: 'number'
            }
          }
        ]
      },
      {
        entity_type: 'CUSTOMER',
        smart_code_prefix: 'HERA.RETAIL.CUSTOMER',
        display_name: 'Customer',
        display_name_plural: 'Customers',
        icon: 'Users',
        color: '#3b82f6',
        master_data: {
          is_master: true,
          has_code: true,
          code_pattern: '^CUST[0-9]{6}$',
          has_hierarchy: false,
          supports_versioning: false
        },
        fields: [
          {
            field_name: 'customer_name',
            display_label: 'Customer Name',
            field_type: 'text',
            is_required: true,
            is_searchable: true,
            field_order: 1,
            ui_hints: {
              placeholder: 'John Doe',
              input_type: 'text'
            }
          },
          {
            field_name: 'email',
            display_label: 'Email',
            field_type: 'text',
            is_required: false,
            is_searchable: true,
            field_order: 2,
            validation: {
              pattern: '^[^@]+@[^@]+\\.[^@]+$',
              error_message: 'Please enter a valid email address'
            },
            ui_hints: {
              placeholder: 'john@example.com',
              input_type: 'email'
            }
          },
          {
            field_name: 'phone',
            display_label: 'Phone',
            field_type: 'text',
            is_required: false,
            field_order: 3,
            ui_hints: {
              placeholder: '+1-555-123-4567',
              input_type: 'tel'
            }
          },
          {
            field_name: 'loyalty_points',
            display_label: 'Loyalty Points',
            field_type: 'number',
            is_required: false,
            field_order: 4,
            validation: {
              min: 0,
              max: 1000000,
              error_message: 'Loyalty points must be between 0 and 1,000,000'
            },
            ui_hints: {
              input_type: 'number'
            }
          }
        ]
      }
    ],
    transactions: [
      {
        transaction_type: 'SALE',
        smart_code_prefix: 'HERA.RETAIL.TXN.SALE',
        display_name: 'Sale',
        display_name_plural: 'Sales',
        icon: 'ShoppingCart',
        color: '#f59e0b',
        header_fields: [
          {
            field_name: 'sale_number',
            display_label: 'Sale Number',
            field_type: 'text',
            is_required: true,
            is_unique: true,
            field_order: 1,
            validation: {
              pattern: '^SALE-[0-9]{8}$',
              error_message: 'Sale number must follow format: SALE-00000000'
            },
            ui_hints: {
              placeholder: 'SALE-00000001',
              input_type: 'text'
            }
          },
          {
            field_name: 'customer_id',
            display_label: 'Customer',
            field_type: 'entity_reference',
            is_required: false,
            field_order: 2,
            ui_hints: {
              input_type: 'entity_lookup'
            }
          },
          {
            field_name: 'sale_date',
            display_label: 'Sale Date',
            field_type: 'date',
            is_required: true,
            field_order: 3,
            ui_hints: {
              input_type: 'datetime'
            }
          },
          {
            field_name: 'payment_method',
            display_label: 'Payment Method',
            field_type: 'text',
            is_required: true,
            field_order: 4,
            ui_hints: {
              input_type: 'select',
              options: [
                { value: 'cash', label: 'Cash' },
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'debit_card', label: 'Debit Card' },
                { value: 'mobile_payment', label: 'Mobile Payment' }
              ]
            }
          }
        ],
        line_fields: [
          {
            field_name: 'product_id',
            display_label: 'Product',
            field_type: 'entity_reference',
            is_required: true,
            field_order: 1,
            ui_hints: {
              input_type: 'entity_lookup'
            }
          },
          {
            field_name: 'quantity',
            display_label: 'Quantity',
            field_type: 'number',
            is_required: true,
            field_order: 2,
            validation: {
              min: 1,
              max: 1000,
              error_message: 'Quantity must be between 1 and 1,000'
            },
            ui_hints: {
              input_type: 'number'
            }
          },
          {
            field_name: 'unit_price',
            display_label: 'Unit Price',
            field_type: 'number',
            is_required: true,
            field_order: 3,
            ui_hints: {
              input_type: 'number',
              format: '0.00',
              currency: 'USD'
            }
          },
          {
            field_name: 'discount',
            display_label: 'Discount %',
            field_type: 'number',
            is_required: false,
            field_order: 4,
            validation: {
              min: 0,
              max: 100,
              error_message: 'Discount must be between 0 and 100%'
            },
            ui_hints: {
              input_type: 'number',
              format: '0.00'
            }
          }
        ]
      }
    ],
    screens: [],
    navigation: {
      main_menu: [
        { id: 'products', label: 'Products', icon: 'Package', path: '/retail/product' },
        { id: 'customers', label: 'Customers', icon: 'Users', path: '/retail/customer' },
        { id: 'sales', label: 'Sales', icon: 'ShoppingCart', path: '/retail/sale' }
      ],
      quick_actions: [
        { id: 'new_sale', label: 'New Sale', icon: 'Plus', path: '/retail/sale/new', color: '#f59e0b' },
        { id: 'new_product', label: 'Add Product', icon: 'Package', path: '/retail/product/new', color: '#10b981' }
      ],
      dashboards: [
        {
          dashboard_id: 'main',
          name: 'Retail Dashboard',
          layout: 'grid',
          widgets: [
            { widget_id: 'daily_sales', type: 'metric', title: 'Daily Sales', size: 'small', data_source: 'sale', config: {} },
            { widget_id: 'top_products', type: 'table', title: 'Top Products', size: 'medium', data_source: 'product', config: {} }
          ]
        }
      ]
    },
    ui_theme: {
      primary_color: '#10b981',
      secondary_color: '#64748b',
      accent_color: '#f1f5f9'
    }
  }
}

async function seedAppConfigurations() {
  console.log('🌱 HERA Dynamic App Configuration Seeder Starting...')
  
  // Initialize Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let successCount = 0
  let errorCount = 0

  for (const [industryKey, config] of Object.entries(INDUSTRY_TEMPLATES)) {
    try {
      console.log(`🔄 Seeding configuration for ${config.name}...`)

      // Create app configuration entity using hera_entities_crud_v1
      const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_entity: {
          entity_type: 'APP_CONFIG',
          entity_code: config.app_id,
          entity_name: config.name,
          smart_code: `HERA.PLATFORM.CONFIG.APP.${config.app_id.toUpperCase().replace(/-/g, '_')}.v1`
        },
        p_dynamic: [
          {
            field_name: 'app_definition',
            field_type: 'json',
            field_value_json: config,
            smart_code: `HERA.PLATFORM.CONFIG.APP.${config.app_id.toUpperCase().replace(/-/g, '_')}.DATA.v1`
          },
          {
            field_name: 'industry',
            field_type: 'text',
            field_value_text: config.industry,
            smart_code: `HERA.PLATFORM.CONFIG.APP.${config.app_id.toUpperCase().replace(/-/g, '_')}.INDUSTRY.v1`
          },
          {
            field_name: 'version',
            field_type: 'text',
            field_value_text: config.version,
            smart_code: `HERA.PLATFORM.CONFIG.APP.${config.app_id.toUpperCase().replace(/-/g, '_')}.VERSION.v1`
          },
          {
            field_name: 'category',
            field_type: 'text',
            field_value_text: config.metadata.category,
            smart_code: `HERA.PLATFORM.CONFIG.APP.${config.app_id.toUpperCase().replace(/-/g, '_')}.CATEGORY.v1`
          }
        ],
        p_relationships: [],
        p_options: {
          validate_schema: true,
          emit_events: true
        }
      })

      if (error) {
        console.error(`❌ Error seeding ${config.name}:`, JSON.stringify(error, null, 2))
        errorCount++
      } else {
        console.log(`✅ Successfully seeded ${config.name}`)
        console.log(`   Data returned:`, JSON.stringify(data, null, 2))
        successCount++
      }

    } catch (error) {
      console.error(`💥 Exception seeding ${config.name}:`, error)
      errorCount++
    }
  }

  console.log('\n🎯 Seeding Summary:')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📊 Total: ${successCount + errorCount}`)

  if (successCount > 0) {
    console.log('\n🚀 Dynamic app configurations are now available via:')
    console.log('   - HERA Config Service: heraConfigService.loadConfig()')
    console.log('   - API v2 Gateway: POST /functions/v1/api-v2/app-config')
    console.log('   - Supabase Queries: core_entities where entity_type = APP_CONFIG')
  }

  console.log('\n✨ HERA Dynamic App Configuration Seeder Complete!')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAppConfigurations().catch(console.error)
}

export {
  seedAppConfigurations,
  INDUSTRY_TEMPLATES,
  TEST_ORG_ID,
  TEST_USER_ID
}