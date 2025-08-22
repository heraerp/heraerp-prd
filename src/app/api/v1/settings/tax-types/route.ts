/**
 * Tax Types API
 * Auto-generated using Universal Configuration Factory
 */

import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { createSafeRouteHandlers } from '@/lib/universal-config/safe-config-factory'

const handlers = createSafeRouteHandlers(CONFIG_TYPES.TAX_TYPE)

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE