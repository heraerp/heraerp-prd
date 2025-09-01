#!/usr/bin/env node

/**
 * Test script for HERA P2P DNA Module
 * Validates complete procure-to-pay cycle on 6 universal tables
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = process.env.DEFAULT_ORGANIZATION_ID

async function testP2PCycle() {
  console.log('🚀 Testing HERA P2P DNA Module')
  console.log('================================\n')

  try {
    // 1. Create test entities
    console.log('1️⃣ Creating test entities...')
    
    // Create supplier
    const { data: supplier } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'supplier',
        entity_name: 'Test Supplier Inc',
        entity_code: 'SUP-TEST-001',
        smart_code: 'HERA.P2P.SUPPLIER.MASTER.v1',
        metadata: {
          status: 'active',
          payment_terms: 'NET30',
          contact_email: 'supplier@test.com'
        }
      })
      .select()
      .single()

    // Create product
    const { data: product } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'product',
        entity_name: 'Office Laptop',
        entity_code: 'PROD-LAPTOP-001',
        smart_code: 'HERA.P2P.PRODUCT.MASTER.v1',
        metadata: {
          category: 'IT Equipment',
          unit_price: 1500
        }
      })
      .select()
      .single()

    // Create employee (requester)
    const { data: employee } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'employee',
        entity_name: 'John Doe',
        entity_code: 'EMP-001',
        smart_code: 'HERA.P2P.EMPLOYEE.MASTER.v1',
        metadata: {
          department: 'IT',
          approval_limit: 5000
        }
      })
      .select()
      .single()

    console.log('✅ Entities created\n')

    // 2. Create Purchase Requisition
    console.log('2️⃣ Creating Purchase Requisition...')
    
    const { data: pr } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'purchase_requisition',
        transaction_code: `PR-${Date.now()}`,
        smart_code: 'HERA.P2P.PR.CREATE.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: employee.id,
        total_amount: 3000,
        metadata: {
          status: 'pending_approval',
          justification: 'New laptops for development team',
          department: 'IT'
        }
      })
      .select()
      .single()

    // Add line items
    await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: pr.id,
        line_number: 1,
        line_entity_id: product.id,
        quantity: 2,
        unit_price: 1500,
        line_amount: 3000,
        smart_code: 'HERA.P2P.PR.LINE.v1',
        metadata: {
          description: 'Development team laptops',
          urgency: 'high'
        }
      })

    console.log(`✅ PR created: ${pr.transaction_code}\n`)

    // 3. Approve PR
    console.log('3️⃣ Approving Purchase Requisition...')
    
    // Update PR status
    await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...pr.metadata,
          status: 'approved',
          approved_by: employee.id,
          approved_at: new Date().toISOString()
        }
      })
      .eq('id', pr.id)

    // Create approval relationship
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: ORG_ID,
        from_entity_id: pr.id,
        to_entity_id: employee.id,
        relationship_type: 'approved_by',
        smart_code: 'HERA.P2P.PR.APPROVAL.v1',
        metadata: {
          approved_at: new Date().toISOString(),
          comments: 'Approved for IT department upgrade'
        }
      })

    console.log('✅ PR approved\n')

    // 4. Create Purchase Order
    console.log('4️⃣ Creating Purchase Order from PR...')
    
    const { data: po } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'purchase_order',
        transaction_code: `PO-${Date.now()}`,
        smart_code: 'HERA.P2P.PO.CREATE.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: ORG_ID,
        to_entity_id: supplier.id,
        reference_entity_id: pr.id,
        total_amount: 3000,
        metadata: {
          status: 'sent',
          pr_reference: pr.transaction_code,
          delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms: 'NET30'
        }
      })
      .select()
      .single()

    console.log(`✅ PO created: ${po.transaction_code}\n`)

    // 5. Create Goods Receipt
    console.log('5️⃣ Processing Goods Receipt...')
    
    const { data: gr } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'goods_receipt',
        transaction_code: `GR-${Date.now()}`,
        smart_code: 'HERA.P2P.GR.CREATE.v1',
        transaction_date: new Date().toISOString(),
        reference_entity_id: po.id,
        metadata: {
          po_reference: po.transaction_code,
          received_by: employee.id,
          location: 'Main Warehouse',
          quality_check: 'passed'
        }
      })
      .select()
      .single()

    console.log(`✅ GR created: ${gr.transaction_code}\n`)

    // 6. Process Invoice
    console.log('6️⃣ Processing Supplier Invoice...')
    
    const { data: invoice } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'supplier_invoice',
        transaction_code: `INV-${Date.now()}`,
        smart_code: 'HERA.P2P.INV.CREATE.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: supplier.id,
        to_entity_id: ORG_ID,
        reference_entity_id: po.id,
        total_amount: 3000,
        metadata: {
          status: 'pending_payment',
          po_reference: po.transaction_code,
          three_way_match: 'passed',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
      .select()
      .single()

    console.log(`✅ Invoice created: ${invoice.transaction_code}\n`)

    // 7. Process Payment
    console.log('7️⃣ Processing Payment...')
    
    const { data: payment } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'payment',
        transaction_code: `PAY-${Date.now()}`,
        smart_code: 'HERA.P2P.PAY.CREATE.v1',
        transaction_date: new Date().toISOString(),
        reference_entity_id: invoice.id,
        total_amount: 3000,
        metadata: {
          payment_method: 'bank_transfer',
          status: 'completed',
          invoice_reference: invoice.transaction_code,
          bank_reference: 'TRF123456789'
        }
      })
      .select()
      .single()

    console.log(`✅ Payment created: ${payment.transaction_code}\n`)

    // 8. Summary
    console.log('🎉 P2P Cycle Complete!')
    console.log('======================')
    console.log(`PR: ${pr.transaction_code}`)
    console.log(`PO: ${po.transaction_code}`)
    console.log(`GR: ${gr.transaction_code}`)
    console.log(`Invoice: ${invoice.transaction_code}`)
    console.log(`Payment: ${payment.transaction_code}`)
    console.log('\n✨ All on just 6 universal tables!')

    // Calculate cycle time
    const cycleTime = new Date() - new Date(pr.created_at)
    console.log(`\n⏱️  Cycle time: ${Math.round(cycleTime / 1000 / 60)} minutes`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run test
testP2PCycle()