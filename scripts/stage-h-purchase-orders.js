#!/usr/bin/env node

/**
 * HERA Stage H - Purchase Orders & Initial Inventory
 * 
 * This script handles:
 * 1. Supplier creation
 * 2. Purchase order creation for initial inventory
 * 3. Purchase order approval workflow
 * 4. Integration with Finance DNA for PO commitment accounting
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz organization ID
const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

// Supplier data
const SUPPLIERS = [
  {
    entity_name: 'Beauty Supply Wholesale LLC',
    entity_code: 'SUPP-BEAUTY-001',
    smart_code: 'HERA.SALON.VENDOR.ENT.SUPPLIER.v1',
    contact_name: 'Ahmed Hassan',
    contact_email: 'ahmed@beautysupply.ae',
    contact_phone: '+971-4-555-0101',
    payment_terms: 'NET30',
    credit_limit: 50000,
    tax_id: 'TRN100123456789'
  },
  {
    entity_name: 'Professional Hair Products Dubai',
    entity_code: 'SUPP-HAIR-001',
    smart_code: 'HERA.SALON.VENDOR.ENT.SUPPLIER.v1',
    contact_name: 'Fatima Al-Rashid',
    contact_email: 'fatima@prohair.ae',
    contact_phone: '+971-4-555-0202',
    payment_terms: 'NET45',
    credit_limit: 75000,
    tax_id: 'TRN100234567890'
  },
  {
    entity_name: 'Nail & Spa Essentials',
    entity_code: 'SUPP-NAIL-001',
    smart_code: 'HERA.SALON.VENDOR.ENT.SUPPLIER.v1',
    contact_name: 'Sarah Ibrahim',
    contact_email: 'sarah@nailspa.ae',
    contact_phone: '+971-4-555-0303',
    payment_terms: 'NET15',
    credit_limit: 25000,
    tax_id: 'TRN100345678901'
  }
]

// Purchase orders with product allocations
const PURCHASE_ORDERS = [
  {
    supplier: 'Beauty Supply Wholesale LLC',
    po_number: 'PO-2025-001',
    items: [
      { product: 'Hair Color - Blonde', quantity: 50, unit_price: 45.00 },
      { product: 'Hair Color - Brown', quantity: 60, unit_price: 45.00 },
      { product: 'Developer 20 Vol', quantity: 5000, unit_price: 0.015 }, // per ml
      { product: 'Color Protection Mask', quantity: 3000, unit_price: 0.028 }, // per ml
    ]
  },
  {
    supplier: 'Professional Hair Products Dubai',
    po_number: 'PO-2025-002',
    items: [
      { product: 'Keratin Treatment', quantity: 2000, unit_price: 0.085 }, // per ml
      { product: 'Hair Mask', quantity: 3000, unit_price: 0.025 }, // per ml
      { product: 'Argan Oil', quantity: 1500, unit_price: 0.035 }, // per ml
      { product: 'Hair Spray', quantity: 2000, unit_price: 0.012 }, // per ml
      { product: 'Styling Gel', quantity: 1500, unit_price: 0.010 }, // per ml
      { product: 'Heat Protectant', quantity: 1000, unit_price: 0.018 }, // per ml
    ]
  },
  {
    supplier: 'Nail & Spa Essentials',
    po_number: 'PO-2025-003',
    items: [
      { product: 'Nail Polish', quantity: 100, unit_price: 8.00 },
      { product: 'Base Coat', quantity: 60, unit_price: 10.00 },
      { product: 'Top Coat', quantity: 60, unit_price: 10.00 },
      { product: 'Cuticle Oil', quantity: 500, unit_price: 0.012 }, // per ml
      { product: 'Foot Cream', quantity: 1000, unit_price: 0.015 }, // per ml
    ]
  }
]

/**
 * Step 1: Create suppliers
 */
async function createSuppliers() {
  console.log('\n👥 Creating Suppliers...\n')

  const supplierMap = new Map()

  for (const supplier of SUPPLIERS) {
    try {
      // Check if supplier exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID)
        .eq('entity_code', supplier.entity_code)
        .single()

      if (existing) {
        console.log(`  ⚠️  Supplier already exists: ${supplier.entity_name}`)
        supplierMap.set(supplier.entity_name, existing)
        continue
      }

      // Create supplier entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'vendor',
          entity_name: supplier.entity_name,
          entity_code: supplier.entity_code,
          smart_code: supplier.smart_code,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (entityError) throw entityError

      supplierMap.set(supplier.entity_name, entity)

      // Create dynamic data
      const dynamicData = [
        { field_name: 'contact_name', field_value_text: supplier.contact_name },
        { field_name: 'contact_email', field_value_text: supplier.contact_email },
        { field_name: 'contact_phone', field_value_text: supplier.contact_phone },
        { field_name: 'payment_terms', field_value_text: supplier.payment_terms },
        { field_name: 'credit_limit', field_value_number: supplier.credit_limit },
        { field_name: 'tax_id', field_value_text: supplier.tax_id },
        { field_name: 'supplier_rating', field_value_number: 5 }, // Default 5-star rating
        { field_name: 'active_since', field_value_date: new Date().toISOString() }
      ]

      for (const field of dynamicData) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: ORGANIZATION_ID,
            entity_id: entity.id,
            field_name: field.field_name,
            field_value_text: field.field_value_text,
            field_value_number: field.field_value_number,
            field_value_date: field.field_value_date,
            smart_code: `HERA.SALON.VENDOR.DYN.${field.field_name.toUpperCase().substring(0,4)}.v1`,
            created_at: new Date().toISOString()
          })
      }

      console.log(`  ✅ Created supplier: ${supplier.entity_name}`)
      console.log(`     Contact: ${supplier.contact_name} (${supplier.contact_email})`)
      console.log(`     Terms: ${supplier.payment_terms} | Credit Limit: ${supplier.credit_limit} AED`)

    } catch (error) {
      console.error(`  ❌ Error creating supplier ${supplier.entity_name}:`, error.message)
    }
  }

  return supplierMap
}

/**
 * Step 2: Create purchase orders
 */
async function createPurchaseOrders(supplierMap) {
  console.log('\n📋 Creating Purchase Orders...\n')

  // Get products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .eq('entity_type', 'product')

  const productMap = new Map()
  products?.forEach(p => productMap.set(p.entity_name, p))

  let totalPOValue = 0

  for (const po of PURCHASE_ORDERS) {
    try {
      const supplier = supplierMap.get(po.supplier)
      if (!supplier) {
        console.log(`  ⚠️  Supplier not found: ${po.supplier}`)
        continue
      }

      // Calculate PO total
      let poTotal = 0
      const validItems = []

      for (const item of po.items) {
        const product = productMap.get(item.product)
        if (!product) {
          console.log(`    ⚠️  Product not found: ${item.product}`)
          continue
        }

        const lineTotal = item.quantity * item.unit_price
        poTotal += lineTotal
        validItems.push({
          ...item,
          product_id: product.id,
          line_total: lineTotal
        })
      }

      // Add 5% VAT
      const vatAmount = poTotal * 0.05
      const totalWithVAT = poTotal + vatAmount

      // Create purchase order transaction
      const { data: poTxn, error: poError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORGANIZATION_ID,
          transaction_type: 'purchase_order',
          transaction_code: po.po_number,
          transaction_date: new Date().toISOString(),
          source_entity_id: supplier.id,
          total_amount: totalWithVAT,
          smart_code: 'HERA.SALON.PUR.TXN.ORDER.v1',
          metadata: {
            supplier_name: po.supplier,
            supplier_code: supplier.entity_code,
            po_status: 'draft',
            subtotal: poTotal,
            vat_amount: vatAmount,
            vat_rate: 0.05,
            delivery_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            payment_terms: 'NET30'
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (poError) throw poError

      // Create PO lines
      let lineNumber = 1
      for (const item of validItems) {
        await supabase
          .from('universal_transaction_lines')
          .insert({
            organization_id: ORGANIZATION_ID,
            transaction_id: poTxn.id,
            line_number: lineNumber++,
            entity_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_amount: item.line_total,
            smart_code: 'HERA.SALON.PUR.LINE.ITEM.v1',
            metadata: {
              product_name: item.product,
              delivery_status: 'pending'
            },
            created_at: new Date().toISOString()
          })
      }

      totalPOValue += totalWithVAT

      console.log(`  ✅ Created PO: ${po.po_number} - ${po.supplier}`)
      console.log(`     Items: ${validItems.length} | Subtotal: ${poTotal.toFixed(2)} AED`)
      console.log(`     VAT (5%): ${vatAmount.toFixed(2)} AED | Total: ${totalWithVAT.toFixed(2)} AED`)

    } catch (error) {
      console.error(`  ❌ Error creating PO ${po.po_number}:`, error.message)
    }
  }

  console.log(`\n💰 Total PO Value: ${totalPOValue.toFixed(2)} AED`)
  return totalPOValue
}

/**
 * Step 3: Create PO approval workflow
 */
async function createApprovalWorkflow() {
  console.log('\n✅ Creating PO Approval Workflow...\n')

  try {
    // Get all draft POs
    const { data: draftPOs } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'purchase_order')
      .filter('metadata->>po_status', 'eq', 'draft')

    console.log(`Found ${draftPOs?.length || 0} draft POs for approval`)

    for (const po of draftPOs || []) {
      // Simulate approval process
      const approvalSteps = [
        { role: 'purchase_manager', status: 'approved', approver: 'Hassan Ali' },
        { role: 'finance_manager', status: 'approved', approver: 'Aisha Mohammed' }
      ]

      // Update PO status to approved
      const { error } = await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...po.metadata,
            po_status: 'approved',
            approval_history: approvalSteps,
            approved_date: new Date().toISOString(),
            approved_by: 'Aisha Mohammed'
          }
        })
        .eq('id', po.id)

      if (!error) {
        console.log(`  ✅ Approved: ${po.transaction_code} (${po.total_amount.toFixed(2)} AED)`)
      }
    }

  } catch (error) {
    console.error('❌ Error in approval workflow:', error.message)
  }
}

/**
 * Step 4: Create PO commitment journal entries
 */
async function createPOCommitments() {
  console.log('\n📊 Creating PO Commitment Accounting...\n')

  try {
    // Get approved POs without commitment entries
    const { data: approvedPOs } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'purchase_order')
      .filter('metadata->>po_status', 'eq', 'approved')
      .filter('metadata->>commitment_posted', 'is', null)

    for (const po of approvedPOs || []) {
      // Create commitment journal entry
      const commitmentJournal = {
        organization_id: ORGANIZATION_ID,
        transaction_type: 'journal_entry',
        transaction_date: po.transaction_date,
        transaction_code: `COMMIT-${po.transaction_code}`,
        reference_transaction_id: po.id,
        total_amount: po.total_amount,
        smart_code: 'HERA.FIN.GL.TXN.JE.COMMIT.v1',
        metadata: {
          journal_type: 'po_commitment',
          source_document: po.transaction_code,
          auto_generated: true,
          description: `Purchase Order Commitment - ${po.transaction_code}`
        },
        created_at: new Date().toISOString()
      }

      const { data: journal, error: journalError } = await supabase
        .from('universal_transactions')
        .insert(commitmentJournal)
        .select()
        .single()

      if (journalError) {
        console.error(`  ❌ Error creating commitment for ${po.transaction_code}:`, journalError.message)
        continue
      }

      // Create journal lines
      const journalLines = [
        // Debit: Purchase Commitments (Off-balance sheet)
        {
          organization_id: ORGANIZATION_ID,
          transaction_id: journal.id,
          line_number: 1,
          entity_id: '9100', // Purchase Commitments
          line_amount: po.total_amount,
          line_type: 'debit',
          smart_code: 'HERA.FIN.GL.LINE.JE.DEBIT.v1',
          metadata: {
            gl_account: '9100',
            description: 'Purchase Order Commitments'
          },
          created_at: new Date().toISOString()
        },
        // Credit: Purchase Obligations (Off-balance sheet)
        {
          organization_id: ORGANIZATION_ID,
          transaction_id: journal.id,
          line_number: 2,
          entity_id: '9200', // Purchase Obligations
          line_amount: po.total_amount,
          line_type: 'credit',
          smart_code: 'HERA.FIN.GL.LINE.JE.CREDIT.v1',
          metadata: {
            gl_account: '9200',
            description: 'Future Purchase Obligations'
          },
          created_at: new Date().toISOString()
        }
      ]

      await supabase
        .from('universal_transaction_lines')
        .insert(journalLines)

      // Mark PO as commitment posted
      await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...po.metadata,
            commitment_posted: true,
            commitment_journal_id: journal.id
          }
        })
        .eq('id', po.id)

      console.log(`  ✅ Commitment posted for ${po.transaction_code}: ${po.total_amount.toFixed(2)} AED`)
    }

  } catch (error) {
    console.error('❌ Error creating commitments:', error.message)
  }
}

/**
 * Step 5: Generate PO summary report
 */
async function generatePOSummary() {
  console.log('\n📊 Purchase Order Summary Report\n')
  console.log('=' .repeat(80))

  try {
    // Get all POs
    const { data: allPOs } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        supplier:core_entities!source_entity_id(entity_name, entity_code)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'purchase_order')
      .order('transaction_date', { ascending: false })

    if (!allPOs || allPOs.length === 0) {
      console.log('No purchase orders found.')
      return
    }

    console.log('PO Number       Supplier                         Status      Amount (AED)  Delivery')
    console.log('-'.repeat(80))

    let totalDraft = 0
    let totalApproved = 0
    let totalCount = 0

    for (const po of allPOs) {
      const status = po.metadata?.po_status || 'draft'
      const deliveryDate = po.metadata?.delivery_date || 'TBD'
      
      console.log(
        `${po.transaction_code.padEnd(15)} ${po.supplier?.entity_name.padEnd(30)} ` +
        `${status.padEnd(10)} ${po.total_amount.toFixed(2).padStart(12)} ${deliveryDate}`
      )

      totalCount++
      if (status === 'draft') totalDraft += po.total_amount
      else if (status === 'approved') totalApproved += po.total_amount
    }

    console.log('-'.repeat(80))
    console.log(`Total POs: ${totalCount}`)
    console.log(`Draft Amount: ${totalDraft.toFixed(2)} AED`)
    console.log(`Approved Amount: ${totalApproved.toFixed(2)} AED`)
    console.log(`Total Value: ${(totalDraft + totalApproved).toFixed(2)} AED`)

    // Show supplier summary
    console.log('\n📊 Supplier Summary:')
    console.log('-'.repeat(60))

    const supplierTotals = {}
    for (const po of allPOs) {
      const supplierName = po.supplier?.entity_name || 'Unknown'
      supplierTotals[supplierName] = (supplierTotals[supplierName] || 0) + po.total_amount
    }

    for (const [supplier, total] of Object.entries(supplierTotals)) {
      console.log(`${supplier.padEnd(40)} ${total.toFixed(2).padStart(15)} AED`)
    }

  } catch (error) {
    console.error('❌ Error generating summary:', error.message)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HERA Stage H - Purchase Orders & Initial Inventory')
  console.log('=' .repeat(60))
  console.log(`Organization: Hair Talkz Ladies Salon`)
  console.log(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
  console.log('=' .repeat(60))

  // Step 1: Create suppliers
  const supplierMap = await createSuppliers()

  // Step 2: Create purchase orders
  await createPurchaseOrders(supplierMap)

  // Step 3: Approve POs
  await createApprovalWorkflow()

  // Step 4: Create commitment entries
  await createPOCommitments()

  // Step 5: Generate summary
  await generatePOSummary()

  console.log('\n✅ Stage H - Purchase Orders Complete!')
}

// Run the script
main().catch(console.error)