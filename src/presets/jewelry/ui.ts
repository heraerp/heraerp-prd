/**
 * HERA Jewelry UI Presets
 * Field configurations for jewelry domain forms
 */

export interface JewelryFormField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'array'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string | number; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    step?: number
  }
  smartCode?: string
}

export interface JewelryFormPreset {
  name: string
  description: string
  fields: JewelryFormField[]
  sections?: Array<{
    title: string
    fields: string[]
  }>
}

/**
 * Jewelry Item Form Preset
 */
export const jewelryItemFormPreset: JewelryFormPreset = {
  name: 'Jewelry Item',
  description: 'Form configuration for jewelry retail items',
  fields: [
    {
      name: 'entity_name',
      label: 'Item Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Gold Necklace 22K',
      smartCode: 'HERA.JEWELRY.ITEM.NAME.V1'
    },
    {
      name: 'entity_code',
      label: 'Item Code',
      type: 'text',
      required: true,
      placeholder: 'e.g., GN22K001',
      smartCode: 'HERA.JEWELRY.ITEM.CODE.V1'
    },
    {
      name: 'gross_weight',
      label: 'Gross Weight (g)',
      type: 'number',
      required: true,
      validation: { min: 0, step: 0.001 },
      smartCode: 'HERA.JEWELRY.ITEM.WEIGHT.GROSS.V1'
    },
    {
      name: 'stone_weight',
      label: 'Stone Weight (g)',
      type: 'number',
      validation: { min: 0, step: 0.001 },
      smartCode: 'HERA.JEWELRY.ITEM.WEIGHT.STONE.V1'
    },
    {
      name: 'net_weight',
      label: 'Net Weight (g)',
      type: 'number',
      required: true,
      validation: { min: 0, step: 0.001 },
      smartCode: 'HERA.JEWELRY.ITEM.WEIGHT.NET.V1'
    },
    {
      name: 'purity_karat',
      label: 'Purity (Karat)',
      type: 'select',
      required: true,
      options: [
        { value: 10, label: '10K' },
        { value: 14, label: '14K' },
        { value: 18, label: '18K' },
        { value: 22, label: '22K' },
        { value: 24, label: '24K' }
      ],
      smartCode: 'HERA.JEWELRY.ITEM.PURITY.KARAT.V1'
    },
    {
      name: 'making_charge_type',
      label: 'Making Charge Type',
      type: 'select',
      required: true,
      options: [
        { value: 'per_gram', label: 'Per Gram' },
        { value: 'fixed', label: 'Fixed Amount' },
        { value: 'percent', label: 'Percentage' }
      ],
      smartCode: 'HERA.JEWELRY.ITEM.MAKING.TYPE.V1'
    },
    {
      name: 'making_charge_rate',
      label: 'Making Charge Rate',
      type: 'number',
      required: true,
      validation: { min: 0, step: 0.01 },
      smartCode: 'HERA.JEWELRY.ITEM.MAKING.RATE.V1'
    },
    {
      name: 'gst_slab',
      label: 'GST Slab (%)',
      type: 'select',
      required: true,
      options: [
        { value: 0, label: '0%' },
        { value: 3, label: '3%' }
      ],
      smartCode: 'HERA.JEWELRY.ITEM.GST.SLAB.V1'
    },
    {
      name: 'hsn_code',
      label: 'HSN Code',
      type: 'text',
      required: true,
      placeholder: '71131900',
      validation: { pattern: '^711\\d{5}$' },
      smartCode: 'HERA.JEWELRY.ITEM.HSN.CODE.V1'
    },
    {
      name: 'hallmark_no',
      label: 'Hallmark Number',
      type: 'text',
      placeholder: 'BIS certification number',
      smartCode: 'HERA.JEWELRY.ITEM.HALLMARK.NO.V1'
    },
    {
      name: 'stone_details',
      label: 'Stone Details',
      type: 'array',
      smartCode: 'HERA.JEWELRY.ITEM.STONE.DETAILS.V1'
    }
  ],
  sections: [
    {
      title: 'Basic Information',
      fields: ['entity_name', 'entity_code']
    },
    {
      title: 'Weight & Purity',
      fields: ['gross_weight', 'stone_weight', 'net_weight', 'purity_karat']
    },
    {
      title: 'Pricing & Charges',
      fields: ['making_charge_type', 'making_charge_rate']
    },
    {
      title: 'Tax & Compliance',
      fields: ['gst_slab', 'hsn_code', 'hallmark_no']
    },
    {
      title: 'Stone Information',
      fields: ['stone_details']
    }
  ]
}

/**
 * POS Sale Form Preset
 */
export const jewelryPOSFormPreset: JewelryFormPreset = {
  name: 'POS Sale',
  description: 'Form configuration for jewelry POS sales',
  fields: [
    {
      name: 'customer_id',
      label: 'Customer',
      type: 'select',
      required: true,
      smartCode: 'HERA.JEWELRY.SALE.CUSTOMER.V1'
    },
    {
      name: 'payment_method',
      label: 'Payment Method',
      type: 'select',
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card' },
        { value: 'upi', label: 'UPI' },
        { value: 'mixed', label: 'Mixed' }
      ],
      smartCode: 'HERA.JEWELRY.SALE.PAYMENT.METHOD.V1'
    },
    {
      name: 'gold_rate_per_gram',
      label: 'Gold Rate (per gram)',
      type: 'number',
      required: true,
      validation: { min: 0, step: 0.01 },
      smartCode: 'HERA.JEWELRY.SALE.GOLD.RATE.V1'
    },
    {
      name: 'place_of_supply',
      label: 'Place of Supply',
      type: 'text',
      required: true,
      placeholder: 'State code (e.g., 07 for Delhi)',
      smartCode: 'HERA.JEWELRY.SALE.PLACE.SUPPLY.V1'
    },
    {
      name: 'old_gold_exchange',
      label: 'Old Gold Exchange',
      type: 'checkbox',
      smartCode: 'HERA.JEWELRY.SALE.OLD.GOLD.EXCHANGE.V1'
    },
    {
      name: 'old_gold_weight',
      label: 'Old Gold Weight (g)',
      type: 'number',
      validation: { min: 0, step: 0.001 },
      smartCode: 'HERA.JEWELRY.SALE.OLD.GOLD.WEIGHT.V1'
    },
    {
      name: 'old_gold_purity',
      label: 'Old Gold Purity (K)',
      type: 'select',
      options: [
        { value: 10, label: '10K' },
        { value: 14, label: '14K' },
        { value: 18, label: '18K' },
        { value: 22, label: '22K' },
        { value: 24, label: '24K' }
      ],
      smartCode: 'HERA.JEWELRY.SALE.OLD.GOLD.PURITY.V1'
    },
    {
      name: 'old_gold_rate',
      label: 'Old Gold Rate (per gram)',
      type: 'number',
      validation: { min: 0, step: 0.01 },
      smartCode: 'HERA.JEWELRY.SALE.OLD.GOLD.RATE.V1'
    }
  ],
  sections: [
    {
      title: 'Sale Details',
      fields: ['customer_id', 'payment_method', 'gold_rate_per_gram', 'place_of_supply']
    },
    {
      title: 'Old Gold Exchange',
      fields: ['old_gold_exchange', 'old_gold_weight', 'old_gold_purity', 'old_gold_rate']
    }
  ]
}

/**
 * Export all presets
 */
export const jewelryFormPresets = {
  item: jewelryItemFormPreset,
  pos: jewelryPOSFormPreset
}

export default jewelryFormPresets