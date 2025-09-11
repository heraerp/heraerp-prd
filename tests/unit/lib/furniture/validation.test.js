const { validateFurnitureInvoice } = require('../../../src/lib/furniture/validation.ts')

describe('Furniture Validation - basic', () => {
  const ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || 'f0af4ced-9d12-4a55-a649-b484368db249'

  test('flags furniture-related invoice with raw materials', async () => {
    const vendor = 'ErgoFurniture Co.'
    const items = [
      { description: 'Premium oak wood boards' },
      { description: 'Box of hinges' },
    ]

    const result = await validateFurnitureInvoice(vendor, items, ORG_ID)

    expect(result.isValid).toBe(true)
    expect(result.isFurnitureRelated).toBe(true)
    expect(result.supplierExists).toBe(false)
    expect([
      'raw_materials',
      'hardware',
      'fabric',
      'finishing',
      'tools',
      'transport',
      'general_furniture',
    ]).toContain(result.suggestedCategory)
  })

  test('rejects clearly non-furniture invoice', async () => {
    const vendor = 'Generic Services Ltd'
    const items = [
      { description: 'Monthly internet broadband charges' },
      { description: 'Telecom service fee' },
    ]

    const result = await validateFurnitureInvoice(vendor, items, ORG_ID)

    expect(result.isValid).toBe(false)
    expect(result.isFurnitureRelated).toBe(false)
    expect(result.suggestedCategory).toBe('general_expense')
  })
})
