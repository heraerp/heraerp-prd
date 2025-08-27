/**
 * Salon Products API
 * Auto-generated using Universal Configuration Factory
 */

import { ConfigurationFactory } from '@/lib/universal-config/config-factory'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'

const factory = new ConfigurationFactory()

// Custom product configuration for salon inventory
const SALON_PRODUCT_CONFIG = {
  entityType: 'salon_product_item',
  smartCodePrefix: 'HERA.SALON.PRODUCT',
  displayName: 'Product',
  pluralName: 'Products',
  defaultFields: ['price', 'cost', 'stock_quantity', 'reorder_point', 'supplier']
}

const handlers = factory.createRouteHandlers(SALON_PRODUCT_CONFIG)

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE