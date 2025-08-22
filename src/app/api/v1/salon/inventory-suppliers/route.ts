/**
 * Inventory Suppliers API
 * Auto-generated using Universal Configuration Factory
 */

import { ConfigurationFactory, CONFIG_TYPES } from '@/lib/universal-config/config-factory'

const factory = new ConfigurationFactory()
const handlers = factory.createRouteHandlers(CONFIG_TYPES.INVENTORY_SUPPLIER)

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE