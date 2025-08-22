/**
 * Product Categories API
 * Auto-generated using Universal Configuration Factory
 * Enterprise-grade configuration for inventory management
 */

import { ConfigurationFactory, CONFIG_TYPES } from '@/lib/universal-config/config-factory'

// Initialize factory
const factory = new ConfigurationFactory()

// Create handlers using the factory
const handlers = factory.createRouteHandlers(CONFIG_TYPES.PRODUCT_CATEGORY)

// Export HTTP methods
export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE