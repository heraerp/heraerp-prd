/**
 * Restaurant GL Integration - Dave Patel's Business-First Accounting for Restaurants
 * 
 * This service integrates restaurant operations with Universal GL:
 * - Order completion → Automatic sales journal entry
 * - Inventory usage → Automatic COGS posting
 * - Vendor deliveries → Automatic AP entries
 * - Staff payroll → Automatic payroll posting
 * 
 * Principle: "Every restaurant action creates automatic accounting"
 */

import { universalGL, BusinessTransaction } from './UniversalGLService'

export interface RestaurantOrder {
  id: string
  organizationId: string
  customerId?: string
  customerName: string
  orderType: 'dine_in' | 'takeout' | 'delivery' | 'catering'
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  paymentMethod: 'cash' | 'card' | 'mobile' | 'credit'
  status: 'pending' | 'completed' | 'cancelled'
  orderDate: Date
}

export interface OrderItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
}

export interface InventoryAdjustment {
  id: string
  organizationId: string
  itemId: string
  itemName: string
  adjustmentType: 'usage' | 'waste' | 'recount' | 'spoilage'
  quantity: number
  unitCost: number
  totalCost: number
  reason: string
  adjustmentDate: Date
}

export interface VendorDelivery {
  id: string
  organizationId: string
  vendorId: string
  vendorName: string
  invoiceNumber: string
  items: DeliveryItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  deliveryDate: Date
  paymentTerms: string
}

export interface DeliveryItem {
  itemId: string
  itemName: string
  quantity: number
  unitCost: number
  totalCost: number
  category: string
}

export interface StaffPayroll {
  id: string
  organizationId: string
  employeeId: string
  employeeName: string
  payPeriodStart: Date
  payPeriodEnd: Date
  hoursWorked: number
  hourlyRate: number
  grossPay: number
  taxes: number
  netPay: number
  paymentDate: Date
}

export class RestaurantGLIntegration {
  
  /**
   * Record completed restaurant order with automatic GL posting
   * Dave Patel: "Order complete = automatic sales entry, no manual work"
   */
  async recordOrderCompletion(order: RestaurantOrder): Promise<void> {
    console.log('🍕 Recording restaurant order completion with automatic GL posting')
    
    try {
      // Create business transaction for the sale
      const saleTransaction: BusinessTransaction = {
        organizationId: order.organizationId,
        transactionType: 'sale',
        entityId: order.customerId,
        amount: order.totalAmount,
        description: `${order.orderType} order - ${order.customerName}`,
        referenceNumber: `ORDER-${order.id.slice(-6)}`,
        transactionDate: order.orderDate,
        details: {
          customerId: order.customerId,
          items: order.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          taxAmount: order.taxAmount,
          paymentMethod: order.paymentMethod,
          orderType: order.orderType
        },
        metadata: {
          orderId: order.id,
          restaurantIntegration: true,
          itemsCount: order.items.length
        }
      }
      
      // Record with automatic GL posting
      const result = await universalGL.recordBusinessTransaction(saleTransaction)
      
      if (result.success) {
        console.log('✅ Order GL posting completed:', result.journalEntry.referenceNumber)
        
        // Also record COGS for inventory items used
        await this.recordCOGSForOrder(order)
      } else {
        console.error('❌ Failed to record order GL:', result.message)
        throw new Error(`Order GL posting failed: ${result.message}`)
      }
      
    } catch (error) {
      console.error('Restaurant order GL integration error:', error)
      throw error
    }
  }
  
  /**
   * Record cost of goods sold for order items
   * Automatically calculates and posts COGS based on inventory costs
   */
  private async recordCOGSForOrder(order: RestaurantOrder): Promise<void> {
    console.log('📦 Recording COGS for order items')
    
    // Calculate total COGS for all items in the order
    let totalCOGS = 0
    const cogsDetails = []
    
    for (const item of order.items) {
      // In production, this would lookup actual inventory cost
      const estimatedUnitCost = item.unitPrice * 0.35 // Assume 35% food cost
      const itemCOGS = estimatedUnitCost * item.quantity
      totalCOGS += itemCOGS
      
      cogsDetails.push({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitCost: estimatedUnitCost,
        totalCost: itemCOGS
      })
    }
    
    if (totalCOGS > 0) {
      // Create COGS transaction
      const cogsTransaction: BusinessTransaction = {
        organizationId: order.organizationId,
        transactionType: 'expense',
        amount: totalCOGS,
        description: `COGS for order ${order.id.slice(-6)}`,
        referenceNumber: `COGS-${order.id.slice(-6)}`,
        transactionDate: order.orderDate,
        details: {
          relatedOrderId: order.id,
          cogsItems: cogsDetails,
          expenseCategory: 'cost_of_goods_sold'
        },
        metadata: {
          orderId: order.id,
          autoGeneratedCOGS: true
        }
      }
      
      await universalGL.recordBusinessTransaction(cogsTransaction)
      console.log('✅ COGS recorded automatically:', totalCOGS)
    }
  }
  
  /**
   * Record inventory adjustment with automatic GL impact
   * Dave Patel: "Inventory changes = automatic GL updates"
   */
  async recordInventoryAdjustment(adjustment: InventoryAdjustment): Promise<void> {
    console.log('📦 Recording inventory adjustment with GL impact')
    
    try {
      let transactionType: string
      let description: string
      
      switch (adjustment.adjustmentType) {
        case 'usage':
          transactionType = 'expense'
          description = `Inventory usage - ${adjustment.itemName}`
          break
        case 'waste':
          transactionType = 'expense'
          description = `Food waste - ${adjustment.itemName}`
          break
        case 'spoilage':
          transactionType = 'expense'
          description = `Spoilage loss - ${adjustment.itemName}`
          break
        case 'recount':
          transactionType = 'inventory_adjustment'
          description = `Inventory recount adjustment - ${adjustment.itemName}`
          break
        default:
          transactionType = 'inventory_adjustment'
          description = `Inventory adjustment - ${adjustment.itemName}`
      }
      
      const adjustmentTransaction: BusinessTransaction = {
        organizationId: adjustment.organizationId,
        transactionType: transactionType as any,
        amount: Math.abs(adjustment.totalCost),
        description,
        referenceNumber: `ADJ-${adjustment.id.slice(-6)}`,
        transactionDate: adjustment.adjustmentDate,
        details: {
          itemId: adjustment.itemId,
          adjustmentType: adjustment.adjustmentType,
          quantity: adjustment.quantity,
          unitCost: adjustment.unitCost,
          reason: adjustment.reason
        },
        metadata: {
          adjustmentId: adjustment.id,
          inventoryIntegration: true
        }
      }
      
      const result = await universalGL.recordBusinessTransaction(adjustmentTransaction)
      
      if (result.success) {
        console.log('✅ Inventory adjustment GL posted:', result.journalEntry.referenceNumber)
      } else {
        throw new Error(`Inventory GL posting failed: ${result.message}`)
      }
      
    } catch (error) {
      console.error('Inventory adjustment GL integration error:', error)
      throw error
    }
  }
  
  /**
   * Record vendor delivery with automatic AP posting
   * Dave Patel: "Delivery received = automatic payable created"
   */
  async recordVendorDelivery(delivery: VendorDelivery): Promise<void> {
    console.log('🚛 Recording vendor delivery with automatic AP posting')
    
    try {
      const purchaseTransaction: BusinessTransaction = {
        organizationId: delivery.organizationId,
        transactionType: 'purchase',
        entityId: delivery.vendorId,
        amount: delivery.totalAmount,
        description: `Delivery from ${delivery.vendorName}`,
        referenceNumber: delivery.invoiceNumber,
        transactionDate: delivery.deliveryDate,
        details: {
          vendorId: delivery.vendorId,
          invoiceNumber: delivery.invoiceNumber,
          items: delivery.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitCost: item.unitCost
          })),
          paymentTerms: delivery.paymentTerms,
          taxAmount: delivery.taxAmount
        },
        metadata: {
          deliveryId: delivery.id,
          vendorIntegration: true,
          itemsCount: delivery.items.length
        }
      }
      
      const result = await universalGL.recordBusinessTransaction(purchaseTransaction)
      
      if (result.success) {
        console.log('✅ Vendor delivery AP posted:', result.journalEntry.referenceNumber)
      } else {
        throw new Error(`Vendor delivery GL posting failed: ${result.message}`)
      }
      
    } catch (error) {
      console.error('Vendor delivery GL integration error:', error)
      throw error
    }
  }
  
  /**
   * Record staff payroll with automatic payroll posting
   * Dave Patel: "Payroll calculated = automatic GL entries"
   */
  async recordStaffPayroll(payroll: StaffPayroll): Promise<void> {
    console.log('👥 Recording staff payroll with automatic GL posting')
    
    try {
      // Record gross payroll expense
      const payrollExpenseTransaction: BusinessTransaction = {
        organizationId: payroll.organizationId,
        transactionType: 'payroll',
        entityId: payroll.employeeId,
        amount: payroll.grossPay,
        description: `Payroll for ${payroll.employeeName}`,
        referenceNumber: `PAY-${payroll.id.slice(-6)}`,
        transactionDate: payroll.paymentDate,
        details: {
          employeeId: payroll.employeeId,
          payPeriod: `${payroll.payPeriodStart.toISOString().split('T')[0]} to ${payroll.payPeriodEnd.toISOString().split('T')[0]}`,
          hoursWorked: payroll.hoursWorked,
          hourlyRate: payroll.hourlyRate,
          grossPay: payroll.grossPay,
          taxes: payroll.taxes,
          netPay: payroll.netPay
        },
        metadata: {
          payrollId: payroll.id,
          staffIntegration: true
        }
      }
      
      const result = await universalGL.recordBusinessTransaction(payrollExpenseTransaction)
      
      if (result.success) {
        console.log('✅ Staff payroll GL posted:', result.journalEntry.referenceNumber)
        
        // Also record the payroll payment (cash out)
        if (payroll.netPay > 0) {
          await this.recordPayrollPayment(payroll)
        }
      } else {
        throw new Error(`Payroll GL posting failed: ${result.message}`)
      }
      
    } catch (error) {
      console.error('Staff payroll GL integration error:', error)
      throw error
    }
  }
  
  /**
   * Record the actual payroll payment (cash/bank out)
   */
  private async recordPayrollPayment(payroll: StaffPayroll): Promise<void> {
    const paymentTransaction: BusinessTransaction = {
      organizationId: payroll.organizationId,
      transactionType: 'payment',
      entityId: payroll.employeeId,
      amount: payroll.netPay,
      description: `Payroll payment to ${payroll.employeeName}`,
      referenceNumber: `PAYPMT-${payroll.id.slice(-6)}`,
      transactionDate: payroll.paymentDate,
      details: {
        employeeId: payroll.employeeId,
        paymentMethod: 'bank_transfer',
        relatedPayrollId: payroll.id
      },
      metadata: {
        payrollPayment: true
      }
    }
    
    await universalGL.recordBusinessTransaction(paymentTransaction)
    console.log('✅ Payroll payment recorded:', payroll.netPay)
  }
  
  /**
   * Integration helper: Record any restaurant business event
   * This is the main entry point for restaurant operations
   */
  async recordRestaurantEvent(eventType: string, eventData: any): Promise<void> {
    console.log(`🏪 Recording restaurant event: ${eventType}`)
    
    try {
      switch (eventType) {
        case 'order_completed':
          await this.recordOrderCompletion(eventData as RestaurantOrder)
          break
          
        case 'inventory_adjusted':
          await this.recordInventoryAdjustment(eventData as InventoryAdjustment)
          break
          
        case 'vendor_delivery':
          await this.recordVendorDelivery(eventData as VendorDelivery)
          break
          
        case 'staff_payroll':
          await this.recordStaffPayroll(eventData as StaffPayroll)
          break
          
        default:
          console.warn(`Unknown restaurant event type: ${eventType}`)
      }
      
    } catch (error) {
      console.error(`Failed to record restaurant event ${eventType}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const restaurantGL = new RestaurantGLIntegration()

// Helper function to integrate with existing restaurant modules
export async function integrateRestaurantGL(eventType: string, eventData: any) {
  try {
    await restaurantGL.recordRestaurantEvent(eventType, eventData)
  } catch (error) {
    console.error('Restaurant GL integration failed:', error)
    // Don't throw - restaurant operations should continue even if GL fails
  }
}