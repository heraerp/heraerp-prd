const { validateTransactionBundle } = require('../validators/db-universal')

async function guardAndNormalizeTx({ header, lines, compat = true }) {
  const { header: H, lines: L, warnings } = validateTransactionBundle(header, lines, { compat })
  return { header: H, lines: L, warnings }
}

module.exports = { guardAndNormalizeTx }

