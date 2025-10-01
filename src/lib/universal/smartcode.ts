export const SMARTCODE_REGEX = /^HERA(?:\.[A-Z0-9]+){3,}\.V[0-9]+$/

export function normalizeSmartCode(sc: string) {
  if (!sc) throw new Error('smart_code required')
  // force version suffix to uppercase (… .v1 -> .V1)
  const normalized = sc.replace(/\.v(\d+)$/, (_m, d) => `.V${d}`)
  return normalized
}

export function assertSmartCode(sc: string) {
  const n = normalizeSmartCode(sc)
  if (!SMARTCODE_REGEX.test(n)) {
    throw new Error(`Invalid smart_code: ${n}. Expected pattern like HERA.JEWELRY.TXN.SALE.POS.V1`)
  }
  return n
}