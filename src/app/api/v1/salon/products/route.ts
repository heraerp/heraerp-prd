/**
 * Salon Products API
 * Auto-generated using Universal Configuration Factory
 */

import { ConfigurationFactory } from '@/lib/universal-config/config-factory'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'

const factory = new ConfigurationFactory()

// Use the standard product configuration from CONFIG_TYPES
const SALON_PRODUCT_CONFIG = CONFIG_TYPES.PRODUCT_ITEM

const handlers = factory.createRouteHandlers(SALON_PRODUCT_CONFIG)

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE