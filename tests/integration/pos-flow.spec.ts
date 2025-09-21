import { describe, it, expect, beforeAll } from 'vitest'
import { postEventWithBranch } from '@/lib/playbook/pos-event-with-branch'
import { universalApi } from '@/lib/universal-api-v2'
import { heraCode } from '@/lib/smart-codes'

// Test organization and branch IDs (you'll need to set these)
const ORG = process.env.TEST_ORGANIZATION_ID || 'test-org-id'
const BRANCH = process.env.TEST_BRANCH_ID || 'test-branch-id'

describe('POS integration hardening', () => {
  beforeAll(() => {
    // Set up API context
    universalApi.setOrganizationId(ORG)
  })

  it('creates a POS sale with split payments that balances to zero', async () => {
    const ticket = {
      id: 'T-150-5-' + Date.now(), // Unique for each test run
      total: 157.5,
      taxTotal: 7.5,
      items: [{ name: 'Service A', qty: 1, price: 150, type: 'SERVICE' as const, stylist_entity_id: 'test-stylist-main', stylist_name: 'Main Stylist' }],
      payments: [{ method: 'Cash', amount: 100 }, { method: 'Card', amount: 57.5 }],
      customer_entity_id: null,
    }
    
    const txn = await postEventWithBranch(ORG, BRANCH, ticket)
    expect(txn.transaction_type).toBe('POS_SALE')
    expect(txn.total_amount).toBe(157.5)
    
    // Fetch lines and assert sums
    const linesResponse = await universalApi.getTransactionLines({
      filters: { transaction_id: txn.id }
    })
    
    expect(linesResponse.success).toBe(true)
    const lines = linesResponse.data || []
    
    // Calculate totals
    const nonPayment = lines
      .filter(l => l.line_type !== 'PAYMENT')
      .reduce((s, l) => s + (l.line_amount || 0), 0)
    const payment = lines
      .filter(l => l.line_type === 'PAYMENT')
      .reduce((s, l) => s + (l.line_amount || 0), 0)
    
    // Assert balances
    expect(nonPayment).toBeCloseTo(157.5, 2)
    expect(payment).toBeCloseTo(-157.5, 2)
    
    // Check all smart codes use lowercase v
    lines.forEach(l => {
      expect(l.smart_code).toBeDefined()
      expect(/\.v\d+$/.test(l.smart_code)).toBe(true)
      expect(/\.V\d+$/.test(l.smart_code)).toBe(false)
    })
    
    // Verify line types
    const lineTypes = lines.map(l => l.line_type)
    expect(lineTypes).toContain('SERVICE')
    expect(lineTypes).toContain('TAX')
    expect(lineTypes).toContain('PAYMENT')
  })

  it('is idempotent: same ticket id returns the same header', async () => {
    const ticket = {
      id: 'T-IDEM-' + Date.now(),
      total: 157.5,
      taxTotal: 7.5,
      items: [{ name: 'Service A', qty: 1, price: 150, type: 'SERVICE' as const, stylist_entity_id: 'test-stylist-idem', stylist_name: 'Idem Stylist' }],
      payments: [{ method: 'Cash', amount: 157.5 }],
    }
    
    // First call creates the transaction
    const a = await postEventWithBranch(ORG, BRANCH, ticket)
    expect(a.id).toBeDefined()
    expect(a.transaction_type).toBe('POS_SALE')
    
    // Second call should return the same transaction
    const b = await postEventWithBranch(ORG, BRANCH, ticket)
    expect(b.id).toBe(a.id)
    expect(b.transaction_code).toBe(a.transaction_code)
    
    // Verify only one set of lines was created
    const linesResponse = await universalApi.getTransactionLines({
      filters: { transaction_id: a.id }
    })
    const lines = linesResponse.data || []
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.length).toBeLessThan(10) // Should not have duplicate lines
  })

  it('requires a stylist when a service is present', async () => {
    const ticket = {
      id: 'T-SVC-NO-STYLIST-' + Date.now(),
      total: 100,
      taxTotal: 0,
      items: [{ name: 'Service A', qty: 1, price: 100, type: 'SERVICE' as const }],
      payments: [{ method: 'Cash', amount: 100 }],
    }
    await expect(postEventWithBranch(ORG, BRANCH, ticket)).rejects.toThrow(
      /must have at least one service line with assigned stylist/i
    )
  })

  it('passes when service includes stylist', async () => {
    const ticket = {
      id: 'T-SVC-WITH-STYLIST-' + Date.now(),
      total: 100,
      taxTotal: 0,
      items: [{
        name: 'Service A', qty: 1, price: 100, type: 'SERVICE' as const,
        stylist_entity_id: 'test-stylist-123', stylist_name: 'Alex'
      }],
      payments: [{ method: 'Cash', amount: 100 }],
    }
    const tx = await postEventWithBranch(ORG, BRANCH, ticket)
    expect(tx.transaction_type).toBe('POS_SALE')
  })

  it('allows product-only sales without stylist', async () => {
    const ticket = {
      id: 'T-PRODUCT-ONLY-' + Date.now(),
      total: 50,
      taxTotal: 0,
      items: [
        { name: 'Hair Gel', qty: 1, price: 25, type: 'PRODUCT' as const },
        { name: 'Shampoo', qty: 1, price: 25, type: 'PRODUCT' as const }
      ],
      payments: [{ method: 'Card', amount: 50 }],
    }
    const tx = await postEventWithBranch(ORG, BRANCH, ticket)
    expect(tx.transaction_type).toBe('POS_SALE')
    expect(tx.total_amount).toBe(50)
  })

  it('handles complex multi-item, multi-payment scenarios', async () => {
    const ticket = {
      id: 'T-COMPLEX-' + Date.now(),
      total: 285.75,
      taxTotal: 13.75,
      items: [
        { name: 'Premium Cut', qty: 1, price: 150, entity_id: 'srv-001', type: 'SERVICE' as const, stylist_entity_id: 'test-stylist-1', stylist_name: 'Sarah' },
        { name: 'Hair Color', qty: 1, price: 80, entity_id: 'srv-002', type: 'SERVICE' as const, stylist_entity_id: 'test-stylist-2', stylist_name: 'Mike' },
        { name: 'Styling Product', qty: 2, price: 21, entity_id: 'prd-001', type: 'PRODUCT' as const }
      ],
      payments: [
        { method: 'Cash', amount: 200 },
        { method: 'Card', amount: 50 },
        { method: 'Voucher', amount: 35.75 }
      ],
      customer_entity_id: 'cust-vip-001',
    }
    
    const txn = await postEventWithBranch(ORG, BRANCH, ticket)
    expect(txn.total_amount).toBe(285.75)
    expect(txn.external_reference).toBe(`pos:${ticket.id}`)
    
    // Verify currency fields are populated
    expect(txn.transaction_currency_code).toBeDefined()
    expect(txn.base_currency_code).toBeDefined()
    expect(txn.exchange_rate).toBeDefined()
    
    // Check lines
    const linesResponse = await universalApi.getTransactionLines({
      filters: { transaction_id: txn.id }
    })
    const lines = linesResponse.data || []
    
    // Should have 3 items + 1 tax + 3 payments = 7 lines
    expect(lines.length).toBe(7)
    
    // Verify line numbers are sequential
    const lineNumbers = lines.map(l => l.line_number).sort((a, b) => a - b)
    expect(lineNumbers).toEqual([1, 2, 3, 4, 5, 6, 7])
    
    // Verify balance
    const total = lines.reduce((sum, line) => sum + (line.line_amount || 0), 0)
    expect(Math.abs(total)).toBeLessThan(0.01) // Should balance to zero
  })
})