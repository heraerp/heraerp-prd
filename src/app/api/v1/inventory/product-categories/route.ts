/**
 * Product Categories API
 * Auto-generated using Universal Configuration Factory
 * Enterprise-grade configuration for inventory management
 */

import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { createSafeRouteHandlers } from '@/lib/universal-config/safe-config-factory'

// Create handlers using the safe wrapper
const handlers = createSafeRouteHandlers(CONFIG_TYPES.PRODUCT_CATEGORY)

// Export HTTP methods
export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE