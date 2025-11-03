/**
 * HERA API Integration for Jewelry1 ERP
 * 
 * Provides HERA Sacred Six compliant API calls for jewelry business operations
 * Uses RPC functions for all CRUD operations with proper organization isolation
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// HERA Smart Code Templates for Jewelry1
export const JEWELRY1_SMART_CODES = {
  CUSTOMER: 'HERA.JEWELRY1.CUSTOMER.ENTITY.v1',
  PRODUCT: 'HERA.JEWELRY1.PRODUCT.ENTITY.v1',
  STAFF: 'HERA.JEWELRY1.STAFF.ENTITY.v1',
  VENDOR: 'HERA.JEWELRY1.VENDOR.ENTITY.v1',
  SALE_TRANSACTION: 'HERA.JEWELRY1.TXN.SALE.v1',
  PURCHASE_TRANSACTION: 'HERA.JEWELRY1.TXN.PURCHASE.v1',
  INVENTORY_ADJUSTMENT: 'HERA.JEWELRY1.TXN.INVENTORY_ADJ.v1'
}

// Field Smart Codes
export const JEWELRY1_FIELD_CODES = {
  CUSTOMER: {
    PHONE: 'HERA.JEWELRY1.CUSTOMER.FIELD.PHONE.v1',
    EMAIL: 'HERA.JEWELRY1.CUSTOMER.FIELD.EMAIL.v1',
    CREDIT_LIMIT: 'HERA.JEWELRY1.CUSTOMER.FIELD.CREDIT_LIMIT.v1',
    CATEGORY: 'HERA.JEWELRY1.CUSTOMER.FIELD.CATEGORY.v1'
  },
  PRODUCT: {
    PRICE: 'HERA.JEWELRY1.PRODUCT.FIELD.PRICE.v1',
    COST_PRICE: 'HERA.JEWELRY1.PRODUCT.FIELD.COST_PRICE.v1',
    CATEGORY: 'HERA.JEWELRY1.PRODUCT.FIELD.CATEGORY.v1',
    GOLD_WEIGHT: 'HERA.JEWELRY1.PRODUCT.FIELD.GOLD_WEIGHT.v1',
    PURITY: 'HERA.JEWELRY1.PRODUCT.FIELD.PURITY.v1',
    STOCK_QUANTITY: 'HERA.JEWELRY1.PRODUCT.FIELD.STOCK_QTY.v1',
    MIN_STOCK_LEVEL: 'HERA.JEWELRY1.PRODUCT.FIELD.MIN_STOCK.v1'
  }
}

export interface Jewelry1Customer {
  id?: string
  entity_name: string
  phone: string
  email?: string
  credit_limit?: number
  category: 'retail' | 'wholesale' | 'premium' | 'vip'
  city?: string
  aadhar_number?: string
  pan_number?: string
}

export interface Jewelry1Product {
  id?: string
  entity_name: string
  sku: string
  category: string
  price: number
  cost_price?: number
  stock_quantity: number
  min_stock_level: number
  gold_weight?: number
  purity?: string
  supplier?: string
}

export interface Jewelry1SaleTransaction {
  customer_id?: string
  total_amount: number
  currency_code: string
  transaction_date: string
  payment_method: 'cash' | 'card' | 'upi' | 'credit'
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    line_amount: number
  }>
}

export class Jewelry1API {
  private organizationId: string
  private actorUserId: string

  constructor(organizationId: string, actorUserId: string) {
    this.organizationId = organizationId
    this.actorUserId = actorUserId
  }

  /**
   * Create a new customer in HERA
   */
  async createCustomer(customerData: Jewelry1Customer) {
    try {
      const result = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: {
          entity_type: 'CUSTOMER',
          entity_name: customerData.entity_name,
          smart_code: JEWELRY1_SMART_CODES.CUSTOMER
        },
        p_dynamic: {
          phone: {
            field_type: 'phone',
            field_value_text: customerData.phone,
            smart_code: JEWELRY1_FIELD_CODES.CUSTOMER.PHONE,
            is_required: true,
            is_pii: true
          },
          email: customerData.email ? {
            field_type: 'email',
            field_value_text: customerData.email,
            smart_code: JEWELRY1_FIELD_CODES.CUSTOMER.EMAIL,
            is_pii: true
          } : undefined,
          credit_limit: {
            field_type: 'number',
            field_value_number: customerData.credit_limit || 50000,
            smart_code: JEWELRY1_FIELD_CODES.CUSTOMER.CREDIT_LIMIT
          },
          category: {
            field_type: 'text',
            field_value_text: customerData.category,
            smart_code: JEWELRY1_FIELD_CODES.CUSTOMER.CATEGORY,
            is_required: true
          },
          city: customerData.city ? {
            field_type: 'text',
            field_value_text: customerData.city,
            smart_code: 'HERA.JEWELRY1.CUSTOMER.FIELD.CITY.v1'
          } : undefined
        },
        p_relationships: [],
        p_options: {}
      })

      return { success: !result.error, data: result.data, error: result.error }
    } catch (error) {
      console.error('Error creating customer:', error)
      return { success: false, error: error }
    }
  }

  /**
   * Create a new product in HERA
   */
  async createProduct(productData: Jewelry1Product) {
    try {
      const result = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: {
          entity_type: 'PRODUCT',
          entity_name: productData.entity_name,
          entity_code: productData.sku,
          smart_code: JEWELRY1_SMART_CODES.PRODUCT
        },
        p_dynamic: {
          price: {
            field_type: 'number',
            field_value_number: productData.price,
            smart_code: JEWELRY1_FIELD_CODES.PRODUCT.PRICE,
            is_required: true
          },
          cost_price: productData.cost_price ? {
            field_type: 'number',
            field_value_number: productData.cost_price,
            smart_code: JEWELRY1_FIELD_CODES.PRODUCT.COST_PRICE
          } : undefined,
          category: {
            field_type: 'text',
            field_value_text: productData.category,
            smart_code: JEWELRY1_FIELD_CODES.PRODUCT.CATEGORY,
            is_required: true
          },
          stock_quantity: {
            field_type: 'number',
            field_value_number: productData.stock_quantity,
            smart_code: JEWELRY1_FIELD_CODES.PRODUCT.STOCK_QUANTITY,
            is_required: true
          },
          min_stock_level: {
            field_type: 'number',
            field_value_number: productData.min_stock_level,
            smart_code: JEWELRY1_FIELD_CODES.PRODUCT.MIN_STOCK_LEVEL
          },
          gold_weight: productData.gold_weight ? {
            field_type: 'number',
            field_value_number: productData.gold_weight,
            smart_code: JEWELRY1_FIELD_CODES.PRODUCT.GOLD_WEIGHT
          } : undefined,
          purity: productData.purity ? {
            field_type: 'text',
            field_value_text: productData.purity,
            smart_code: JEWELRY1_FIELD_CODES.PRODUCT.PURITY
          } : undefined,
          supplier: productData.supplier ? {
            field_type: 'text',
            field_value_text: productData.supplier,
            smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.SUPPLIER.v1'
          } : undefined
        },
        p_relationships: [],
        p_options: {}
      })

      return { success: !result.error, data: result.data, error: result.error }
    } catch (error) {
      console.error('Error creating product:', error)
      return { success: false, error: error }
    }
  }

  /**
   * Process a sale transaction in HERA
   */
  async processSale(saleData: Jewelry1SaleTransaction) {
    try {
      const result = await supabase.rpc('hera_txn_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_transaction: {
          transaction_type: 'SALE',
          smart_code: JEWELRY1_SMART_CODES.SALE_TRANSACTION,
          source_entity_id: saleData.customer_id,
          total_amount: saleData.total_amount,
          transaction_currency_code: saleData.currency_code,
          transaction_date: saleData.transaction_date,
          transaction_status: 'COMPLETED'
        },
        p_lines: saleData.items.map((item, index) => ({
          line_number: index + 1,
          line_type: 'PRODUCT',
          entity_id: item.product_id,
          quantity: item.quantity,
          unit_amount: item.unit_price,
          line_amount: item.line_amount,
          smart_code: 'HERA.JEWELRY1.TXN.SALE.LINE.v1'
        })),
        p_options: {
          payment_method: saleData.payment_method
        }
      })

      return { success: !result.error, data: result.data, error: result.error }
    } catch (error) {
      console.error('Error processing sale:', error)
      return { success: false, error: error }
    }
  }

  /**
   * Get customers with filtering
   */
  async getCustomers(filters?: { search?: string; category?: string; limit?: number }) {
    try {
      const result = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: {
          entity_type: 'CUSTOMER'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {
          limit: filters?.limit || 100,
          include_dynamic: true,
          search_term: filters?.search,
          filter_category: filters?.category
        }
      })

      return { success: !result.error, data: result.data, error: result.error }
    } catch (error) {
      console.error('Error fetching customers:', error)
      return { success: false, error: error }
    }
  }

  /**
   * Get products with filtering
   */
  async getProducts(filters?: { search?: string; category?: string; limit?: number }) {
    try {
      const result = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: {
          entity_type: 'PRODUCT'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {
          limit: filters?.limit || 100,
          include_dynamic: true,
          search_term: filters?.search,
          filter_category: filters?.category
        }
      })

      return { success: !result.error, data: result.data, error: result.error }
    } catch (error) {
      console.error('Error fetching products:', error)
      return { success: false, error: error }
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(dateRange?: { start: string; end: string }) {
    try {
      const result = await supabase.rpc('hera_txn_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_transaction: {
          transaction_type: 'SALE'
        },
        p_lines: [],
        p_options: {
          include_lines: true,
          date_from: dateRange?.start,
          date_to: dateRange?.end,
          aggregate: true
        }
      })

      return { success: !result.error, data: result.data, error: result.error }
    } catch (error) {
      console.error('Error fetching sales analytics:', error)
      return { success: false, error: error }
    }
  }
}

/**
 * Hook to get Jewelry1 API instance with current auth context
 */
export function useJewelry1API() {
  // This would use the HERA auth context to get org and user IDs
  const organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const actorUserId = 'demo-user-001' // This should come from auth context

  return new Jewelry1API(organizationId, actorUserId)
}

export default Jewelry1API