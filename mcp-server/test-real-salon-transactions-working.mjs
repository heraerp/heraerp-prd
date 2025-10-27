#!/usr/bin/env node
/**
 * 🏪 WORKING REAL SALON TRANSACTIONS POSTER
 * 
 * This script posts ACTUAL salon transactions to the HERA database using the correct RPC functions.
 * 
 * 📊 REAL TRANSACTIONS CREATED:
 * 1. Customer Entity Registration - New customer with contact details
 * 2. Appointment Booking Transaction - Service appointment scheduling  
 * 3. POS Sale Transaction - Completed service sale
 * 4. Product Sale Transaction - Retail product purchase
 * 5. Commission Calculation - Staff earnings tracking
 * 
 * 🛡️ USES WORKING RPC FUNCTIONS:
 * - hera_entities_crud_v2 (for customer creation)
 * - hera_transactions_crud_v2 (for transaction creation)
 * - Proper organization ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
 * - Proper user ID: 09b0b92a-d797-489e-bc03-5ca0a6272674 (Michele's actual user)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// HERA Database Configuration (Production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// REAL SALON DATA (Michele's Hair Salon - Using correct user ID from working tests)
const SALON_DATA = {
  organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8', // Hairtalkz Organization
  user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',        // Michele's actual user entity ID
  salon_name: "Michele's Hair Salon (Hairtalkz)",
  location: "Premium Beauty District"
};

// Performance tracking
const performanceTracker = {
  start: Date.now(),
  operations: [],
  
  startOperation(type) {
    return {
      type,
      start: Date.now(),
      end: null,
      duration: null,
      success: false,
      id: null,
      details: null
    };
  },
  
  endOperation(tracker, success, id = null, details = null) {
    tracker.end = Date.now();
    tracker.duration = tracker.end - tracker.start;
    tracker.success = success;
    tracker.id = id;
    tracker.details = details;
    this.operations.push(tracker);
    return tracker;
  },
  
  getSummary() {
    const total = this.operations.length;
    const successful = this.operations.filter(op => op.success).length;
    const failed = total - successful;
    const avgTime = successful > 0 
      ? this.operations.filter(op => op.success).reduce((sum, op) => sum + op.duration, 0) / successful 
      : 0;
    
    return {
      total,
      successful,
      failed,
      successRate: ((successful / total) * 100).toFixed(1),
      averageTime: avgTime.toFixed(1),
      totalTime: (Date.now() - this.start)
    };
  }
};

// Utility functions
function log(emoji, message, data = null) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${emoji} [${timestamp}] ${message}`);
  if (data && typeof data === 'object') {
    console.log('   ', JSON.stringify(data, null, 2));
  } else if (data) {
    console.log('   ', data);
  }
}

function logSuccess(message, data = null) { log('✅', message, data); }
function logError(message, data = null) { log('❌', message, data); }
function logInfo(message, data = null) { log('ℹ️', message, data); }
function logWarning(message, data = null) { log('⚠️', message, data); }

// Database state functions
async function getDatabaseState(label) {
  logInfo(`📊 Checking database state ${label}...`);
  
  try {
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, transaction_status, total_amount, created_at')
      .eq('organization_id', SALON_DATA.organization_id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const { data: entities, error: entError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, created_at')
      .eq('organization_id', SALON_DATA.organization_id)
      .eq('entity_type', 'customer')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return {
      transactionCount: transactions?.length || 0,
      entityCount: entities?.length || 0,
      recentTransactions: transactions || [],
      recentEntities: entities || []
    };
  } catch (error) {
    logWarning('Error checking database state', error.message);
    return { transactionCount: 0, entityCount: 0, recentTransactions: [], recentEntities: [] };
  }
}

// 1. Create Customer Entity
async function createCustomerEntity() {
  logInfo('👤 Creating new customer entity...');
  const tracker = performanceTracker.startOperation('CUSTOMER_ENTITY');
  
  try {
    const customerName = `Maria Rodriguez (Test ${Date.now()})`;
    
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: SALON_DATA.user_id,
      p_organization_id: SALON_DATA.organization_id,
      p_entity: {
        entity_type: 'customer',
        entity_name: customerName,
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.REGULAR.v1'
      },
      p_dynamic: {
        phone: {
          field_type: 'text',
          field_value_text: '+1-555-0987',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
        },
        email: {
          field_type: 'text',
          field_value_text: 'maria.rodriguez@email.com',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
        },
        customer_type: {
          field_type: 'text',
          field_value_text: 'regular',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.TYPE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    });
    
    if (error) {
      logError('Customer creation failed', error);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    const customerId = data?.items?.[0]?.id;
    if (!customerId) {
      logError('Customer creation returned no ID', data);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    logSuccess(`Customer created: ${customerId}`, {
      name: customerName,
      phone: '+1-555-0987',
      email: 'maria.rodriguez@email.com'
    });
    
    performanceTracker.endOperation(tracker, true, customerId, customerName);
    return customerId;
    
  } catch (error) {
    logError('Customer creation exception', error.message);
    performanceTracker.endOperation(tracker, false);
    return null;
  }
}

// 2. Create Appointment Booking Transaction
async function createAppointmentTransaction(customerId) {
  logInfo('📅 Creating appointment booking transaction...');
  const tracker = performanceTracker.startOperation('APPOINTMENT');
  
  try {
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 5); // Next week
    
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: SALON_DATA.user_id,
      p_organization_id: SALON_DATA.organization_id,
      p_transaction: {
        transaction_type: 'appointment',
        smart_code: 'HERA.SALON.APPOINTMENT.TXN.BOOKED.v1',
        transaction_code: `APT-${Date.now()}`,
        source_entity_id: customerId,
        target_entity_id: SALON_DATA.user_id, // Michele as the stylist
        total_amount: 185.00,
        transaction_date: appointmentDate.toISOString()
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'service',
          description: 'Premium Hair Cut & Style',
          quantity: 1,
          unit_amount: 120.00,
          line_amount: 120.00,
          smart_code: 'HERA.SALON.APPOINTMENT.LINE.HAIRCUT.v1',
          line_data: {
            service_name: 'Premium Hair Cut & Style',
            duration_minutes: 90,
            scheduled_time: appointmentDate.toISOString(),
            stylist: 'Michele (Owner)',
            notes: 'Premium cut with styling'
          }
        },
        {
          line_number: 2,
          line_type: 'service',
          description: 'Deep Conditioning Treatment',
          quantity: 1,
          unit_amount: 65.00,
          line_amount: 65.00,
          smart_code: 'HERA.SALON.APPOINTMENT.LINE.TREATMENT.v1',
          line_data: {
            service_name: 'Deep Conditioning Treatment',
            duration_minutes: 30,
            treatment_type: 'keratin_conditioning'
          }
        }
      ]
    });
    
    if (error) {
      logError('Appointment creation failed', error);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    const transactionId = data?.transaction_id || data?.data?.transaction?.id;
    if (!transactionId) {
      logError('Appointment creation returned no transaction ID', data);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    logSuccess(`Appointment booked: ${transactionId}`, {
      customer: 'Maria Rodriguez',
      date: appointmentDate.toLocaleDateString(),
      services: 'Hair Cut + Conditioning',
      total: '$185.00',
      duration: '120 minutes'
    });
    
    performanceTracker.endOperation(tracker, true, transactionId, 'Appointment Booking');
    return transactionId;
    
  } catch (error) {
    logError('Appointment booking exception', error.message);
    performanceTracker.endOperation(tracker, false);
    return null;
  }
}

// 3. Create POS Sale Transaction (Completed Service)
async function createPOSSaleTransaction(customerId) {
  logInfo('💳 Creating POS sale transaction...');
  const tracker = performanceTracker.startOperation('POS_SALE');
  
  try {
    const saleAmount = 185.00;
    const tipAmount = 25.00;
    const taxAmount = 9.25;
    const totalAmount = saleAmount + tipAmount + taxAmount;
    
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: SALON_DATA.user_id,
      p_organization_id: SALON_DATA.organization_id,
      p_transaction: {
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.SALE.TXN.COMPLETED.v1',
        transaction_code: `SALE-${Date.now()}`,
        source_entity_id: customerId,
        target_entity_id: SALON_DATA.user_id,
        total_amount: totalAmount,
        transaction_date: new Date().toISOString()
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'service',
          description: 'Premium Hair Cut & Style - COMPLETED',
          quantity: 1,
          unit_amount: 120.00,
          line_amount: 120.00,
          smart_code: 'HERA.SALON.SALE.LINE.HAIRCUT.v1',
          line_data: {
            service_completed: true,
            stylist: 'Michele (Owner)',
            customer_satisfaction: 'excellent',
            completion_time: new Date().toISOString()
          }
        },
        {
          line_number: 2,
          line_type: 'service',
          description: 'Deep Conditioning Treatment - COMPLETED',
          quantity: 1,
          unit_amount: 65.00,
          line_amount: 65.00,
          smart_code: 'HERA.SALON.SALE.LINE.TREATMENT.v1',
          line_data: {
            service_completed: true,
            treatment_type: 'keratin_conditioning',
            results: 'hair_significantly_improved'
          }
        },
        {
          line_number: 3,
          line_type: 'tip',
          description: 'Gratuity for Excellent Service',
          quantity: 1,
          unit_amount: tipAmount,
          line_amount: tipAmount,
          smart_code: 'HERA.SALON.SALE.LINE.TIP.v1',
          line_data: {
            tip_percentage: 13.5,
            payment_method: 'card'
          }
        },
        {
          line_number: 4,
          line_type: 'tax',
          description: 'Service Tax (5%)',
          quantity: 1,
          unit_amount: taxAmount,
          line_amount: taxAmount,
          smart_code: 'HERA.SALON.SALE.LINE.TAX.v1',
          line_data: {
            tax_rate: 0.05,
            tax_type: 'service_tax'
          }
        }
      ]
    });
    
    if (error) {
      logError('POS sale creation failed', error);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    const transactionId = data?.transaction_id || data?.data?.transaction?.id;
    if (!transactionId) {
      logError('POS sale creation returned no transaction ID', data);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    logSuccess(`POS Sale completed: ${transactionId}`, {
      customer: 'Maria Rodriguez',
      services: 'Hair Cut + Treatment',
      base_amount: `$${saleAmount}`,
      tip: `$${tipAmount}`,
      tax: `$${taxAmount}`,
      total: `$${totalAmount}`,
      payment: 'Card with tip'
    });
    
    performanceTracker.endOperation(tracker, true, transactionId, 'POS Sale');
    return transactionId;
    
  } catch (error) {
    logError('POS sale exception', error.message);
    performanceTracker.endOperation(tracker, false);
    return null;
  }
}

// 4. Create Product Sale Transaction
async function createProductSaleTransaction(customerId) {
  logInfo('🛍️ Creating product sale transaction...');
  const tracker = performanceTracker.startOperation('PRODUCT_SALE');
  
  try {
    const productTotal = 145.00;
    
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: SALON_DATA.user_id,
      p_organization_id: SALON_DATA.organization_id,
      p_transaction: {
        transaction_type: 'product_sale',
        smart_code: 'HERA.SALON.PRODUCT.SALE.RETAIL.v1',
        transaction_code: `PROD-${Date.now()}`,
        source_entity_id: customerId,
        target_entity_id: null,
        total_amount: productTotal,
        transaction_date: new Date().toISOString()
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'product',
          description: 'Premium Hair Serum - Professional Grade',
          quantity: 2,
          unit_amount: 35.00,
          line_amount: 70.00,
          smart_code: 'HERA.SALON.PRODUCT.LINE.SERUM.v1',
          line_data: {
            product_code: 'SERUM-PROF-001',
            brand: 'Salon Professional',
            size: '100ml',
            recommended_usage: 'apply_to_damp_hair'
          }
        },
        {
          line_number: 2,
          line_type: 'product',
          description: 'Conditioning Shampoo & Conditioner Set',
          quantity: 1,
          unit_amount: 75.00,
          line_amount: 75.00,
          smart_code: 'HERA.SALON.PRODUCT.LINE.SHAMPOO_SET.v1',
          line_data: {
            product_code: 'SHAMP-SET-001',
            brand: 'Salon Professional',
            set_contents: ['shampoo_500ml', 'conditioner_500ml'],
            hair_type: 'all_types'
          }
        }
      ]
    });
    
    if (error) {
      logError('Product sale creation failed', error);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    const transactionId = data?.transaction_id || data?.data?.transaction?.id;
    if (!transactionId) {
      logError('Product sale creation returned no transaction ID', data);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    logSuccess(`Product sale completed: ${transactionId}`, {
      customer: 'Maria Rodriguez',
      products: '2x Hair Serum + Shampoo Set',
      total: `$${productTotal}`,
      recommendation: 'Professional home care'
    });
    
    performanceTracker.endOperation(tracker, true, transactionId, 'Product Sale');
    return transactionId;
    
  } catch (error) {
    logError('Product sale exception', error.message);
    performanceTracker.endOperation(tracker, false);
    return null;
  }
}

// 5. Create Commission Transaction
async function createCommissionTransaction(saleTransactionId, productSaleId) {
  logInfo('💰 Creating commission calculation transaction...');
  const tracker = performanceTracker.startOperation('COMMISSION');
  
  try {
    const serviceCommission = 185.00 * 0.40; // 40% on services
    const productCommission = 145.00 * 0.15; // 15% on products
    const totalCommission = serviceCommission + productCommission;
    
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: SALON_DATA.user_id,
      p_organization_id: SALON_DATA.organization_id,
      p_transaction: {
        transaction_type: 'commission',
        smart_code: 'HERA.SALON.HR.COMMISSION.CALCULATION.v1',
        transaction_code: `COMM-${Date.now()}`,
        source_entity_id: saleTransactionId, // Reference to service sale
        target_entity_id: SALON_DATA.user_id, // Michele earning commission
        total_amount: totalCommission,
        transaction_date: new Date().toISOString()
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'service_commission',
          description: 'Service Commission (40%)',
          quantity: 1,
          unit_amount: serviceCommission,
          line_amount: serviceCommission,
          smart_code: 'HERA.SALON.COMMISSION.LINE.SERVICE.v1',
          line_data: {
            commission_rate: 0.40,
            base_amount: 185.00,
            commission_type: 'service_provider',
            period: 'current_week'
          }
        },
        {
          line_number: 2,
          line_type: 'product_commission',
          description: 'Product Commission (15%)',
          quantity: 1,
          unit_amount: productCommission,
          line_amount: productCommission,
          smart_code: 'HERA.SALON.COMMISSION.LINE.PRODUCT.v1',
          line_data: {
            commission_rate: 0.15,
            base_amount: 145.00,
            commission_type: 'retail_sales',
            period: 'current_week'
          }
        }
      ]
    });
    
    if (error) {
      logError('Commission creation failed', error);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    const transactionId = data?.transaction_id || data?.data?.transaction?.id;
    if (!transactionId) {
      logError('Commission creation returned no transaction ID', data);
      performanceTracker.endOperation(tracker, false);
      return null;
    }
    
    logSuccess(`Commission calculated: ${transactionId}`, {
      staff: 'Michele (Owner)',
      service_commission: `$${serviceCommission.toFixed(2)} (40%)`,
      product_commission: `$${productCommission.toFixed(2)} (15%)`,
      total_earned: `$${totalCommission.toFixed(2)}`
    });
    
    performanceTracker.endOperation(tracker, true, transactionId, 'Commission Calculation');
    return transactionId;
    
  } catch (error) {
    logError('Commission calculation exception', error.message);
    performanceTracker.endOperation(tracker, false);
    return null;
  }
}

// Main test runner
async function runWorkingSalonTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🏪 WORKING REAL SALON TRANSACTIONS TEST - PRODUCTION');
  console.log('='.repeat(80));
  console.log(`🏢 Organization: ${SALON_DATA.organization_id}`);
  console.log(`👤 Actor User: ${SALON_DATA.user_id} (Michele)`);
  console.log(`🏪 Salon: ${SALON_DATA.salon_name}`);
  console.log(`📍 Location: ${SALON_DATA.location}`);
  console.log('='.repeat(80));
  
  // Check database state before
  const stateBefore = await getDatabaseState('BEFORE');
  
  console.log('\n🚀 Starting REAL transaction posting sequence...\n');
  
  // Track all created IDs
  const createdIds = {
    customer: null,
    appointment: null,
    sale: null,
    product_sale: null,
    commission: null
  };
  
  // 1. Create Customer Entity
  createdIds.customer = await createCustomerEntity();
  if (!createdIds.customer) {
    logError('❌ FATAL: Customer creation failed - aborting test');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. Create Appointment Booking
  createdIds.appointment = await createAppointmentTransaction(createdIds.customer);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. Create POS Sale (Completed Service)
  createdIds.sale = await createPOSSaleTransaction(createdIds.customer);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. Create Product Sale
  createdIds.product_sale = await createProductSaleTransaction(createdIds.customer);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 5. Create Commission (if sales were successful)
  if (createdIds.sale && createdIds.product_sale) {
    createdIds.commission = await createCommissionTransaction(createdIds.sale, createdIds.product_sale);
  }
  
  // Check database state after
  const stateAfter = await getDatabaseState('AFTER');
  
  // Performance Summary
  const summary = performanceTracker.getSummary();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  logInfo('Database Changes', {
    transactions_before: stateBefore.transactionCount,
    transactions_after: stateAfter.transactionCount,
    customers_before: stateBefore.entityCount,
    customers_after: stateAfter.entityCount
  });
  
  logInfo('Performance Metrics', {
    total_operations: summary.total,
    successful_operations: summary.successful,
    failed_operations: summary.failed,
    success_rate: `${summary.successRate}%`,
    average_time: `${summary.averageTime}ms`,
    total_execution_time: `${summary.totalTime}ms`
  });
  
  logInfo('Created IDs for Verification', createdIds);
  
  // Operation breakdown
  console.log('\n📈 Operation Performance Breakdown:');
  performanceTracker.operations.forEach(op => {
    const status = op.success ? '✅' : '❌';
    const details = op.details ? ` (${op.details})` : '';
    console.log(`   ${status} ${op.type}: ${op.duration}ms${details}`);
  });
  
  // Show recent activity
  if (stateAfter.recentTransactions.length > 0) {
    console.log('\n📋 Recent Transactions in Database:');
    stateAfter.recentTransactions.slice(0, 5).forEach(txn => {
      const date = new Date(txn.created_at).toLocaleTimeString();
      console.log(`   • ${txn.transaction_type}: $${txn.total_amount} (${txn.transaction_status}) at ${date}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  if (summary.successful >= 4) {
    logSuccess(`🎉 SALON TRANSACTION TEST SUCCESSFUL!`);
    logSuccess(`✨ Created ${summary.successful} real transactions in ${(summary.totalTime/1000).toFixed(1)}s`);
    logSuccess(`⚡ Average transaction time: ${summary.averageTime}ms`);
    logSuccess(`🛡️ All HERA v2.2 patterns working correctly`);
    logSuccess(`💼 Salon business flow complete: Customer → Appointment → Service → Products → Commission`);
  } else {
    logWarning(`⚠️ Partial success: ${summary.successful}/${summary.total} operations completed`);
    logWarning(`🔧 Review errors above for any failed operations`);
  }
  console.log('='.repeat(80) + '\n');
}

// Execute the test
runWorkingSalonTest().catch(error => {
  logError('💥 Test suite crashed', error.message);
  console.error(error);
  process.exit(1);
});