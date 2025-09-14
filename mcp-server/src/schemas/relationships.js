const { z } = require('zod')
const { SmartCode } = require('./smart-code')

const Relationships = z.object({
  smart_code: SmartCode,
  rows: z.array(
    z.object({
      from_slug: z.string(),
      to_slug: z.string(),
      relationship_type: z.string(), // slug of REL_TYPE
      relationship_data: z.record(z.any()).default({}),
    })
  ),
})

module.exports = {
  Relationships,
}

