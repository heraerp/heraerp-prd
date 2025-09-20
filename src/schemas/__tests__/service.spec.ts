import { ServiceFormSchema } from '../service'

describe('ServiceFormSchema', () => {
  it('validates a complete valid service', () => {
    const valid = {
      name: 'Premium Cut & Style',
      code: 'SVC001',
      duration_mins: 45,
      category: 'Hair',
      price: 120,
      currency: 'AED',
      tax_rate: 5,
      commission_type: 'percent',
      commission_value: 20,
      description: 'Professional haircut with styling',
      requires_equipment: false,
    }

    const result = ServiceFormSchema.parse(valid)
    expect(result).toEqual(valid)
  })

  it('validates minimal required fields', () => {
    const minimal = {
      name: 'Basic Cut',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
    }

    const result = ServiceFormSchema.parse(minimal)
    expect(result.name).toBe('Basic Cut')
    expect(result.duration_mins).toBe(30)
    expect(result.price).toBe(50)
  })

  it('rejects negative price', () => {
    const invalid = {
      name: 'Test Service',
      duration_mins: 30,
      price: -50,
      currency: 'AED',
    }

    expect(() => ServiceFormSchema.parse(invalid)).toThrow()
  })

  it('rejects duration less than 5 minutes', () => {
    const invalid = {
      name: 'Test Service',
      duration_mins: 3,
      price: 50,
      currency: 'AED',
    }

    expect(() => ServiceFormSchema.parse(invalid)).toThrow()
  })

  it('rejects duration more than 480 minutes', () => {
    const invalid = {
      name: 'Test Service',
      duration_mins: 500,
      price: 50,
      currency: 'AED',
    }

    expect(() => ServiceFormSchema.parse(invalid)).toThrow()
  })

  it('rejects name shorter than 2 characters', () => {
    const invalid = {
      name: 'A',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
    }

    expect(() => ServiceFormSchema.parse(invalid)).toThrow('Name is too short')
  })

  it('rejects invalid service code format', () => {
    const invalid = {
      name: 'Test Service',
      code: 'SVC 001', // Space not allowed
      duration_mins: 30,
      price: 50,
      currency: 'AED',
    }

    expect(() => ServiceFormSchema.parse(invalid)).toThrow('Letters, numbers, - or _ only')
  })

  it('accepts empty service code', () => {
    const valid = {
      name: 'Test Service',
      code: '',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
    }

    const result = ServiceFormSchema.parse(valid)
    expect(result.code).toBe('')
  })

  it('validates tax rate range', () => {
    expect(() => ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
      tax_rate: -1,
    })).toThrow()

    expect(() => ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
      tax_rate: 101,
    })).toThrow()

    const valid = ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
      tax_rate: 50,
    })
    expect(valid.tax_rate).toBe(50)
  })

  it('validates commission type and value', () => {
    const percent = ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
      commission_type: 'percent',
      commission_value: 20,
    })
    expect(percent.commission_type).toBe('percent')
    expect(percent.commission_value).toBe(20)

    const flat = ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'AED',
      commission_type: 'flat',
      commission_value: 15,
    })
    expect(flat.commission_type).toBe('flat')
    expect(flat.commission_value).toBe(15)
  })

  it('validates currency code length', () => {
    expect(() => ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'US', // Too short
    })).toThrow()

    expect(() => ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'USDD', // Too long
    })).toThrow()

    const valid = ServiceFormSchema.parse({
      name: 'Test',
      duration_mins: 30,
      price: 50,
      currency: 'USD',
    })
    expect(valid.currency).toBe('USD')
  })
})