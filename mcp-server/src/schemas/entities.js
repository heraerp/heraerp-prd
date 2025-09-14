const { z } = require('zod')
const { SmartCode } = require('./smart-code')

const Entities = z.object({
  smart_code: SmartCode, // HERA.SYSTEM.ENTITY_CATALOG.{NAME}.v1
  items: z.array(
    z.object({
      slug: z.string(), // lower_snake
      entity_type: z.enum(['ENTITY', 'ENTITY_TYPE', 'TRANSACTION_TYPE', 'LINE_TYPE', 'REL_TYPE']),
      name: z.string(),
      metadata: z.record(z.any()).default({}),
      business_rules: z.record(z.any()).default({}),
    })
  ),
})

module.exports = {
  Entities,
}

