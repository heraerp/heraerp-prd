const { z } = require('zod')

// Smart Code regex and helpers (case-sensitive)
const SMART_CODE_REGEX = /^(HERA)\.[A-Z0-9_]{2,30}(?:\.[A-Z0-9_]{2,30}){3,8}\.v(0|[1-9][0-9]*)$/

const SmartCode = z.string().regex(SMART_CODE_REGEX, 'SMART_CODE_INVALID')

module.exports = {
  SMART_CODE_REGEX,
  SmartCode,
}

