/**
 * Payment Methods API
 * Auto-generated using Universal Configuration Factory
 */

import { ConfigurationFactory } from '@/src/lib/universal-config/config-factory'
import { CONFIG_TYPES } from '@/src/lib/universal-config/config-types'

const factory = new ConfigurationFactory()
const handlers = factory.createRouteHandlers(CONFIG_TYPES.PAYMENT_METHOD)

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE
