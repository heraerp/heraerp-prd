/**
 * HERA Jewelry Actions Map
 * Domain-focused action configurations
 */

import type { ActionConfig } from '@/lib/ui-binder/types'

export const actions = {
  SellItem: {
    smart_code: 'HERA.JEWELRY.TXN.SALE.POS.V1',
    buildPayload: (ctx: any) => ({
      organization_id: ctx.orgId,
      transaction_type: 'sale',
      smart_code: 'HERA.JEWELRY.TXN.SALE.POS.V1',
      transaction_date: new Date().toISOString(),
      business_context: {
        customer_id: ctx.customerId,
        payment_method: ctx.paymentMethod || 'cash',
        place_of_supply: ctx.placeOfSupply || '07',
        gold_rate_per_gram: ctx.goldRate
      },
      lines: [
        {
          line_number: 1,
          line_type: 'ITEM',
          smart_code: 'HERA.JEWELRY.LINE.ITEM.RETAIL.V1',
          entity_id: ctx.itemId,
          quantity: 1,
          unit_price: ctx.itemPrice,
          line_amount: ctx.itemPrice,
          line_data: {
            net_weight: ctx.netWeight,
            purity_karat: ctx.purityK,
            gold_rate_per_gram: ctx.goldRate,
            making_charge_type: ctx.makingType,
            making_charge_rate: ctx.makingRate,
            stone_value: ctx.stoneValue || 0
          }
        },
        {
          line_number: 2,
          line_type: 'TAX',
          smart_code: 'HERA.JEWELRY.LINE.TAX.GST.V1',
          line_amount: ctx.gstAmount || 0,
          line_data: {
            gst_slab: ctx.gstSlab || 3,
            gst_mode: ctx.gstMode || 'CGST_SGST',
            place_of_supply: ctx.placeOfSupply || '07'
          }
        }
      ]
    })
  } as ActionConfig,

  ExchangeOldGold: {
    smart_code: 'HERA.JEWELRY.TXN.SALE.POS.V1',
    buildPayload: (ctx: any) => ({
      organization_id: ctx.orgId,
      transaction_type: 'sale',
      smart_code: 'HERA.JEWELRY.TXN.SALE.POS.V1',
      transaction_date: new Date().toISOString(),
      business_context: {
        customer_id: ctx.customerId,
        payment_method: ctx.paymentMethod || 'cash',
        place_of_supply: ctx.placeOfSupply || '07',
        gold_rate_per_gram: ctx.goldRate
      },
      lines: [
        {
          line_number: 1,
          line_type: 'ITEM',
          smart_code: 'HERA.JEWELRY.LINE.ITEM.RETAIL.V1',
          entity_id: ctx.itemId,
          quantity: 1,
          unit_price: ctx.itemPrice,
          line_amount: ctx.itemPrice,
          line_data: {
            net_weight: ctx.netWeight,
            purity_karat: ctx.purityK,
            gold_rate_per_gram: ctx.goldRate,
            making_charge_type: ctx.makingType,
            making_charge_rate: ctx.makingRate
          }
        },
        {
          line_number: 2,
          line_type: 'EXCHANGE',
          smart_code: 'HERA.JEWELRY.LINE.EXCHANGE.OLDGOLD.V1',
          line_amount: -Math.abs(ctx.exchangeValue),
          line_data: {
            assayed_weight: ctx.exchangeWeight,
            purity_karat: ctx.exchangePurity,
            old_gold_rate: ctx.oldGoldRate || ctx.goldRate * 0.95, // 5% deduction typical
            exchange_method: 'ASSAY'
          }
        },
        {
          line_number: 3,
          line_type: 'TAX',
          smart_code: 'HERA.JEWELRY.LINE.TAX.GST.V1',
          line_amount: ctx.gstAmount || 0,
          line_data: {
            gst_slab: ctx.gstSlab || 3,
            gst_mode: ctx.gstMode || 'CGST_SGST',
            place_of_supply: ctx.placeOfSupply || '07'
          }
        }
      ]
    })
  } as ActionConfig,

  PurchaseItem: {
    smart_code: 'HERA.JEWELRY.TXN.PURCHASE.GRN.V1',
    buildPayload: (ctx: any) => ({
      organization_id: ctx.orgId,
      transaction_type: 'purchase',
      smart_code: 'HERA.JEWELRY.TXN.PURCHASE.GRN.V1',
      transaction_date: new Date().toISOString(),
      business_context: {
        vendor_id: ctx.vendorId,
        payment_method: ctx.paymentMethod || 'cash',
        place_of_supply: ctx.placeOfSupply || '07'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'ITEM',
          smart_code: 'HERA.JEWELRY.LINE.ITEM.RETAIL.V1',
          entity_id: ctx.itemId,
          quantity: ctx.quantity || 1,
          unit_price: ctx.unitPrice,
          line_amount: (ctx.quantity || 1) * ctx.unitPrice,
          line_data: {
            net_weight: ctx.netWeight,
            purity_karat: ctx.purityK,
            supplier_rate: ctx.supplierRate
          }
        },
        {
          line_number: 2,
          line_type: 'TAX',
          smart_code: 'HERA.JEWELRY.LINE.TAX.GST.V1',
          line_amount: ctx.gstAmount || 0,
          line_data: {
            gst_slab: ctx.gstSlab || 3,
            gst_mode: ctx.gstMode || 'CGST_SGST'
          }
        }
      ]
    })
  } as ActionConfig,

  JobWorkIssue: {
    smart_code: 'HERA.JEWELRY.TXN.JOBWORK.ISSUE.V1',
    buildPayload: (ctx: any) => ({
      organization_id: ctx.orgId,
      transaction_type: 'job_work_issue',
      smart_code: 'HERA.JEWELRY.TXN.JOBWORK.ISSUE.V1',
      transaction_date: new Date().toISOString(),
      business_context: {
        karigar_id: ctx.karigarId,
        expected_completion: ctx.expectedCompletion,
        work_order_number: ctx.workOrderNumber
      },
      lines: [
        {
          line_number: 1,
          line_type: 'MATERIAL',
          smart_code: 'HERA.JEWELRY.LINE.ITEM.RETAIL.V1',
          entity_id: ctx.materialId,
          quantity: ctx.quantity || 1,
          unit_price: ctx.materialValue,
          line_amount: ctx.materialValue,
          line_data: {
            net_weight: ctx.netWeight,
            purity_karat: ctx.purityK,
            issue_type: 'RAW_MATERIAL'
          }
        }
      ]
    })
  } as ActionConfig,

  JobWorkReceipt: {
    smart_code: 'HERA.JEWELRY.TXN.JOBWORK.RECEIPT.V1',
    buildPayload: (ctx: any) => ({
      organization_id: ctx.orgId,
      transaction_type: 'job_work_receipt',
      smart_code: 'HERA.JEWELRY.TXN.JOBWORK.RECEIPT.V1',
      transaction_date: new Date().toISOString(),
      business_context: {
        karigar_id: ctx.karigarId,
        work_order_number: ctx.workOrderNumber,
        completion_date: new Date().toISOString()
      },
      lines: [
        {
          line_number: 1,
          line_type: 'FINISHED_ITEM',
          smart_code: 'HERA.JEWELRY.LINE.ITEM.RETAIL.V1',
          entity_id: ctx.finishedItemId,
          quantity: 1,
          unit_price: ctx.finishedValue,
          line_amount: ctx.finishedValue,
          line_data: {
            net_weight: ctx.finishedWeight,
            purity_karat: ctx.purityK,
            receipt_type: 'FINISHED_GOODS'
          }
        },
        {
          line_number: 2,
          line_type: 'LABOR_CHARGE',
          smart_code: 'HERA.JEWELRY.LINE.MAKING.CHARGE.V1',
          line_amount: ctx.laborCharges,
          line_data: {
            labor_type: 'JOB_WORK',
            labor_rate: ctx.laborRate,
            working_hours: ctx.workingHours
          }
        }
      ]
    })
  } as ActionConfig,

  MeltScrap: {
    smart_code: 'HERA.JEWELRY.TXN.MELT.SCRAP.V1',
    buildPayload: (ctx: any) => ({
      organization_id: ctx.orgId,
      transaction_type: 'melt_scrap',
      smart_code: 'HERA.JEWELRY.TXN.MELT.SCRAP.V1',
      transaction_date: new Date().toISOString(),
      business_context: {
        melt_reason: ctx.meltReason || 'SCRAP_RECOVERY',
        melt_location: ctx.meltLocation || 'MAIN_WORKSHOP'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'SCRAP_INPUT',
          smart_code: 'HERA.JEWELRY.LINE.ITEM.RETAIL.V1',
          entity_id: ctx.scrapItemId,
          quantity: 1,
          unit_price: ctx.scrapValue,
          line_amount: ctx.scrapValue,
          line_data: {
            net_weight: ctx.scrapWeight,
            purity_karat: ctx.scrapPurity,
            condition: 'SCRAP'
          }
        },
        {
          line_number: 2,
          line_type: 'BULLION_OUTPUT',
          smart_code: 'HERA.JEWELRY.LINE.METAL.V1',
          line_amount: ctx.bullionValue,
          line_data: {
            recovered_weight: ctx.recoveredWeight,
            purity_karat: ctx.bullionPurity || 24,
            recovery_rate: (ctx.recoveredWeight / ctx.scrapWeight) * 100
          }
        }
      ]
    })
  } as ActionConfig
}

// Helper to get action by key
export function getJewelryAction(actionKey: keyof typeof actions): ActionConfig {
  return actions[actionKey]
}

// Export action keys for type safety
export type JewelryActionKey = keyof typeof actions