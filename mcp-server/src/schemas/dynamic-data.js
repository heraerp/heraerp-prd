const { z } = require('zod')
const { SmartCode } = require('./smart-code')

const DynamicData = z.object({
  smart_code: SmartCode,
  rows: z.array(
    z.object({
      entity_slug: z.string(),
      key_slug: z.string(),
      value: z.any(),
      value_type: z.enum(['text', 'number', 'boolean', 'date', 'json']),
      validation_code: z.string().optional(),
    })
  ),
})

module.exports = {
  DynamicData,
}

