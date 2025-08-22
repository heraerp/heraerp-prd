import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler, APIError, validationError } from '@/lib/api-error-handler'
import { validatePOSTransaction, type POSTransaction } from '@/lib/validations/pos-transaction'
import type { UniversalTransactions } from '@/types/hera-database.types'
import { rateLimiters } from '@/lib/rate-limiter'
import { posLogger } from '@/lib/logger'

// Initialize Supabase client with production-grade error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Database configuration error')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Exchange rates (in production, fetch from API or database)
const exchangeRates: Record<string, number> = {
  'USD': 3.6725,  // USD to AED
  'EUR': 4.0000,  // EUR to AED
  'GBP': 4.6500,  // GBP to AED
  'SAR': 0.9800,  // SAR to AED
  'AED': 1.0000   // AED to AED
}

function getExchangeRate(currency: string): number {
  return exchangeRates[currency] || 1.0000
}

// Production-grade POST handler with error handling wrapper
export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now()
  const requestId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Apply rate limiting for POS transactions
  await rateLimiters.pos.check(request)
  
  posLogger.info('Starting POS transaction', { requestId })
  
  // Parse and validate request body
  const body = await request.json()
  
  // Validate input data with production-grade validation
  const validation = validatePOSTransaction(body)
  if (!validation.success) {
    const firstError = validation.errors?.errors[0]
    posLogger.error('Validation failed', firstError, { requestId })
    throw validationError(
      firstError?.path.join('.') || 'unknown',
      firstError?.message || 'Invalid input data'
    )
  }

  const validatedData = validation.data as POSTransaction
  posLogger.debug('Validation passed', { requestId })
  const { 
    organizationId, 
    customerId, 
    items, 
    paymentSplits, 
    subtotal, 
    vatAmount, 
    totalAmount,
    discountAmount,
    currencyCode = 'AED',
    notes,
    metadata
  } = validatedData

    // Generate document number with proper format
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const timestamp = Date.now()
    const docNumber = `INV-${year}${month}${day}-${timestamp.toString().slice(-6)}`

    // Get salon/branch entity ID (in production, this would come from organization settings)
    const salonEntityId = null // TODO: Get from organization's default location entity
    
    // Create sale transaction with enhanced fields
    const transactionData = {
      organization_id: organizationId,
      transaction_type: 'sale',
      transaction_code: docNumber, // Use document number as unique transaction code
      transaction_date: now.toISOString(),
      source_entity_id: customerId || null, // Customer (null for walk-in)
      target_entity_id: salonEntityId, // Salon/branch entity
      total_amount: totalAmount, // Gross amount including VAT
      transaction_status: 'posted', // Use 'posted' instead of 'completed' for accounting
      reference_number: docNumber,
      external_reference: paymentSplits[0]?.reference || null, // Payment gateway reference
      smart_code: `POS-SALE-${year}-${month}-${day}-${timestamp.toString().slice(-6)}`,
      smart_code_status: 'POSTED',
      ai_confidence: 1.0,
      ai_classification: 'RETAIL_SALON_SERVICE',
      ai_insights: {},
      business_context: {
        location: 'Dubai, UAE',
        tax_regime: 'UAE VAT 5%',
        pos_terminal: 'salon_main',
        cashier: 'current_user', // In real app, get from auth
        payment_methods: paymentSplits.map(p => p.method).join(','),
        customer_type: customerId ? 'registered' : 'walk-in'
      },
      metadata: {
        subtotal,
        vat_amount: vatAmount,
        vat_rate: 0.05,
        discount_amount: discountAmount,
        payment_splits: paymentSplits,
        items_count: items.length,
        note: customerId ? 'Registered customer' : 'Walk-in customer',
        channel: 'In-Store',
        // Store complete line item details here for now
        line_items: items.map((item: any, index: number) => ({
          line_number: index + 1,
          entity_id: item.id,
          item_name: item.name,
          item_type: item.type,
          quantity: item.quantity,
          unit_price: item.price,
          line_amount: item.price * item.quantity,
          discount_amount: item.discountAmount || 0,
          vat_amount: item.vatAmount || 0,
          net_amount: (item.price * item.quantity) - (item.discountAmount || 0) + (item.vatAmount || 0),
          staff: item.staff || null,
          duration: item.duration || null,
          sku: item.sku || null,
          category: item.category || item.type
        }))
      },
      // Currency and fiscal period fields
      transaction_currency_code: currencyCode,
      base_currency_code: 'AED', // Base currency is always AED for UAE
      exchange_rate: currencyCode === 'AED' ? 1.0000 : getExchangeRate(currencyCode),
      exchange_rate_date: now.toISOString().split('T')[0],
      exchange_rate_type: currencyCode === 'AED' ? 'FIXED' : 'DAILY',
      fiscal_year: year,
      fiscal_period: now.getMonth() + 1,
      posting_period_code: `${year}-${month}`
    }

    // Create sale transaction directly with Supabase
    posLogger.info('Creating main transaction', { 
      requestId, 
      documentNumber: docNumber,
      organizationId,
      totalAmount 
    })
    
    const { data: transaction, error: transactionError } = await supabase
      .from('universal_transactions')
      .insert(transactionData)
      .select()
      .single()
    
    if (transactionError || !transaction) {
      posLogger.error('Transaction creation failed', transactionError, { requestId })
      throw new APIError(
        `Failed to create transaction: ${transactionError?.message || 'Unknown error'}`,
        500,
        'TRANSACTION_CREATE_ERROR',
        { error: transactionError, requestId }
      )
    }
    
    posLogger.info('Main transaction created successfully', { 
      requestId, 
      transactionId: transaction.id 
    })

    // Skip transaction lines creation due to schema issues
    // All line item details are stored in the main transaction metadata
    
    /*
    // Create transaction lines with proper error handling
    if (false && lineItems.length > 0) {
      posLogger.info('Creating transaction lines', { 
        requestId, 
        transactionId: transaction.id,
        lineCount: lineItems.length 
      })
      
      const { error: linesError } = await supabase
        .from('universal_transaction_lines')
        .insert(lineItems)
      
      if (linesError) {
        posLogger.error('Failed to create transaction lines', linesError, { 
          requestId,
          transactionId: transaction.id
        })
        
        // Attempt to rollback the main transaction
        posLogger.warn('Attempting to rollback main transaction due to line creation failure', { 
          requestId,
          transactionId: transaction.id 
        })
        
        const { error: rollbackError } = await supabase
          .from('universal_transactions')
          .delete()
          .eq('id', transaction.id)
        
        if (rollbackError) {
          posLogger.error('Failed to rollback transaction', rollbackError, { 
            requestId,
            transactionId: transaction.id 
          })
        }
        
        throw new APIError(
          `Failed to create transaction lines: ${linesError.message}`,
          500,
          'TRANSACTION_LINES_ERROR',
          { error: linesError, requestId }
        )
      }
      
      posLogger.info('Transaction lines created successfully', { 
        requestId,
        transactionId: transaction.id,
        lineCount: lineItems.length 
      })
    }
    */

    // Create payment records for each split
    for (const payment of paymentSplits) {
      const paymentData = {
        organization_id: organizationId,
        transaction_type: 'payment',
        transaction_code: `${docNumber}-PAY-${payment.method.toUpperCase()}`,
        transaction_date: now.toISOString(),
        source_entity_id: customerId || null, // Customer who made the payment
        target_entity_id: salonEntityId, // Salon receiving the payment
        total_amount: payment.amount,
        transaction_status: 'posted',
        reference_number: `${docNumber}-PAY-${payment.method}`,
        external_reference: payment.reference || null,
        smart_code: `POS-PAY-${year}-${month}-${day}-${Date.now().toString().slice(-6)}-${payment.method.toUpperCase()}`,
        smart_code_status: 'POSTED',
        ai_confidence: 1.0,
        ai_classification: 'PAYMENT_RECEIPT',
        ai_insights: {},
        business_context: {
          payment_method: payment.method,
          terminal_id: 'salon_main',
          related_sale: transaction.id
        },
        metadata: {
          payment_method: payment.method,
          reference: payment.reference,
          sale_transaction_id: transaction.id,
          sale_document_number: docNumber,
          channel: 'In-Store'
        },
        // Currency fields
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0000,
        exchange_rate_date: now.toISOString().split('T')[0],
        exchange_rate_type: 'FIXED',
        fiscal_year: year,
        fiscal_period: now.getMonth() + 1,
        posting_period_code: `${year}-${month}`
      }

      const { error: paymentError } = await supabase
        .from('universal_transactions')
        .insert(paymentData)
      
      if (paymentError) {
        posLogger.error('Failed to create payment transaction', paymentError, { 
          requestId,
          paymentMethod: payment.method,
          amount: payment.amount
        })
      }
    }

    // Update inventory for products
    const productItems = items.filter((item: any) => item.type === 'product')
    for (const product of productItems) {
      // Create inventory movement
      const movementData = {
        organization_id: organizationId,
        transaction_type: 'inventory_movement',
        transaction_date: now.toISOString(),
        transaction_code: `INV-${year}${month}${day}-${Date.now().toString().slice(-6)}`,
        reference_number: `${docNumber}-INV`,
        smart_code: 'HERA.SALON.INV.SALE.OUT.v1',
        total_amount: -(product.quantity * product.price), // Negative for outgoing
        source_entity_id: product.id, // Product entity
        target_entity_id: null, // Could be the store location entity
        transaction_status: 'completed',
        metadata: {
          movement_type: 'sale',
          quantity: -product.quantity, // Negative for reduction
          unit_price: product.price,
          location: 'main_store',
          sale_transaction_id: transaction.id,
          sale_document_number: docNumber
        }
      }

      const { error: movementError } = await supabase
        .from('universal_transactions')
        .insert(movementData)
      
      if (movementError) {
        posLogger.error('Failed to create inventory movement', movementError, { 
          requestId,
          productId: product.id,
          quantity: product.quantity
        })
      }
    }

    // Generate receipt data
    const receipt = {
      transactionId: transaction.id,
      transactionCode: transaction.transaction_code,
      date: transaction.transaction_date,
      items,
      subtotal,
      vatAmount,
      totalAmount,
      discountAmount,
      paymentSplits,
      customer: customerId ? { id: customerId } : null,
      organization: {
        name: 'Luxury Salon & Spa',
        address: 'Dubai Mall, Downtown Dubai',
        phone: '+971 4 123 4567',
        taxNumber: 'TRN: 100123456789003'
      }
    }

    const processingTime = Date.now() - startTime
    
    // Log performance metrics
    posLogger.metric('pos_transaction_processing_time', processingTime, 'ms', {
      requestId,
      organizationId,
      transactionId: transaction.id
    })
    
    const response = {
      success: true,
      message: `Transaction ${docNumber} created successfully`,
      requestId,
      processingTime,
      transaction: {
        id: transaction.id,
        transaction_code: transaction.transaction_code,
        reference_number: transaction.reference_number,
        total_amount: transaction.total_amount,
        transaction_date: transaction.transaction_date,
        transaction_status: transaction.transaction_status
      },
      receipt
    }
    
    // Log success metrics
    posLogger.info('POS transaction completed successfully', {
      requestId,
      transactionId: transaction.id,
      documentNumber: docNumber,
      totalAmount: totalAmount,
      paymentMethods: paymentSplits.map(p => p.method),
      itemCount: items.length,
      processingTime,
      organizationId
    })
    
    return NextResponse.json(response)

})

// GET endpoint for fetching POS data (services, products, customers)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  const dataType = searchParams.get('type') // services, products, customers

  if (!organizationId) {
    throw validationError('organization_id', 'Organization ID is required')
  }

  if (!dataType || !['services', 'products', 'customers'].includes(dataType)) {
    throw validationError('type', 'Type must be one of: services, products, customers')
  }

    switch (dataType) {
      case 'services':
        const { data: services, error: servicesError } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'salon_service')
          .eq('status', 'active')
        
        if (servicesError) {
          throw new APIError(
            'Failed to fetch services',
            500,
            'SERVICES_FETCH_ERROR',
            { error: servicesError }
          )
        }
        
        return NextResponse.json({ services: services || [] })

      case 'products':
        const { data: products, error: productsError } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'salon_product_item')
          .eq('status', 'active')
        
        if (productsError) {
          throw new APIError(
            'Failed to fetch products',
            500,
            'PRODUCTS_FETCH_ERROR',
            { error: productsError }
          )
        }
        
        // Get current stock levels
        for (const product of products || []) {
          const { data: stockData } = await supabase
            .from('core_dynamic_data')
            .select('field_name, field_value_number')
            .eq('entity_id', product.id)
            .eq('field_name', 'current_stock')
            .single()
          
          product.stock = stockData?.field_value_number || 0
        }
        
        return NextResponse.json({ products: products || [] })

      case 'customers':
        const { data: customers, error: customersError } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'customer')
          .eq('status', 'active')
        
        if (customersError) {
          throw new APIError(
            'Failed to fetch customers',
            500,
            'CUSTOMERS_FETCH_ERROR',
            { error: customersError }
          )
        }
        
        // Get customer tier and visit count
        for (const customer of customers || []) {
          const { data: dynamicData } = await supabase
            .from('core_dynamic_data')
            .select('field_name, field_value_text, field_value_number')
            .eq('entity_id', customer.id)
            .in('field_name', ['loyalty_tier', 'visit_count'])
          
          customer.tier = dynamicData?.find(f => f.field_name === 'loyalty_tier')?.field_value_text || 'Bronze'
          customer.visits = dynamicData?.find(f => f.field_name === 'visit_count')?.field_value_number || 0
        }
        
        return NextResponse.json({ customers: customers || [] })

      default:
        throw validationError('type', 'Invalid data type')
    }
})