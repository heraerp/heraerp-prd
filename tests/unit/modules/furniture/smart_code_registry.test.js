const fs = require('fs')
const path = require('path')

describe('Furniture smart code registry', () => {
  const registryPath = path.join(__dirname, '../../../../src/modules/furniture/smart_code_registry.json')
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))

  const SMART_CODE_REGEX = /^HERA\.[A-Z0-9_]+(\.[A-Z0-9_]+)*\.v\d+$/

  test('module code is correct', () => {
    expect(registry.module?.code).toBe('HERA.MANUFACTURING.FURNITURE.MODULE.v1')
    expect(registry.module?.description).toMatch(/Furniture Manufacturing/i)
  })

  test('all smart codes are uppercase and match pattern', () => {
    const skipKeys = new Set(['description', 'version', 'created_at'])
    const collectCodes = (obj, acc = []) => {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && !skipKeys.has(k)) {
          acc.push(v)
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          collectCodes(v, acc)
        }
      }
      return acc
    }

    const codes = collectCodes(registry)
    expect(codes.length).toBeGreaterThan(10)
    for (const code of codes) {
      const base = code.replace(/\.v\d+$/, '')
      expect(base).toEqual(base.toUpperCase())
      expect(SMART_CODE_REGEX.test(code)).toBe(true)
    }
  })

  test('includes key furniture transaction codes', () => {
    expect(registry.sales?.invoice?.header).toBe('HERA.MANUFACTURING.FURNITURE.SALES.INVOICE.HEADER.v1')
    expect(registry.manufacturing?.prod_order?.header).toBe('HERA.MANUFACTURING.FURNITURE.MFG.PROD_ORDER.HEADER.v1')
  })
})
