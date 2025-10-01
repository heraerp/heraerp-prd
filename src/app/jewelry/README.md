# HERA Jewelry Domain

HERA Jewelry is a comprehensive jewelry retail management system built on the Universal 6-Table Architecture.

## Domain Assumptions

### Business Model

- **Retail jewelry store** with precious metals (gold, silver) and stones
- **Weight-based pricing** with purity factors and making charges
- **GST compliance** with 0% or 3% slabs based on item type
- **Old gold exchange** capabilities for trade-ins
- **Job work operations** for custom manufacturing
- **Hallmark compliance** for gold jewelry above 18K

### Key Entities

- **Items**: Retail jewelry pieces with weights, purity, and pricing
- **Collections**: Product groupings (necklaces, bangles, rings, etc.)
- **Price Lists**: Gold rates, diamond rates with effective dates
- **Customers**: Retail customers with KYC requirements
- **Vendors**: Karigars (craftsmen) and suppliers
- **Branches**: Showroom locations

### Core Processes

1. **POS Sales**: Item selection, pricing, GST calculation, payment
2. **Old Gold Exchange**: Assay, valuation, adjustment against new purchase
3. **Job Work**: Issue materials to karigars, receive finished goods
4. **Inventory Management**: Stock tracking, melting/scrap operations
5. **Compliance**: GST reporting, KYC, AML checks

## Smart Code Map

### Entities

| Entity Type          | Smart Code                                | Purpose                          |
| -------------------- | ----------------------------------------- | -------------------------------- |
| Item (Retail)        | `HERA.JEWELRY.ITEM.RETAIL.V1`             | Finished jewelry pieces for sale |
| Collection           | `HERA.JEWELRY.COLLECTION.V1`              | Product category groupings       |
| Metal                | `HERA.JEWELRY.METAL.V1`                   | Raw materials (gold, silver)     |
| Stone                | `HERA.JEWELRY.STONE.V1`                   | Precious/semi-precious stones    |
| Price List (Gold)    | `HERA.JEWELRY.PRICE_LIST.GOLD_RATE.V1`    | Gold rate schedules              |
| Price List (Diamond) | `HERA.JEWELRY.PRICE_LIST.DIAMOND_RATE.V1` | Diamond rate schedules           |
| Vendor (Karigar)     | `HERA.JEWELRY.VENDOR.KARIGAR.V1`          | Craftsmen for job work           |
| Customer (Retail)    | `HERA.JEWELRY.CUSTOMER.RETAIL.V1`         | End customers                    |
| Branch (Showroom)    | `HERA.JEWELRY.BRANCH.SHOWROOM.V1`         | Retail locations                 |
| Tax Profile (GST)    | `HERA.JEWELRY.TAX_PROFILE.GST.V1`         | GST configuration                |

### Transactions

| Transaction Type    | Smart Code                         | Purpose                        |
| ------------------- | ---------------------------------- | ------------------------------ |
| Sale (POS)          | `HERA.JEWELRY.SALE.POS.V1`         | Point of sale transactions     |
| Return (POS)        | `HERA.JEWELRY.RETURN.POS.V1`       | Customer returns               |
| Exchange (Old Gold) | `HERA.JEWELRY.EXCHANGE.OLDGOLD.V1` | Old gold trade-ins             |
| Approval Memo       | `HERA.JEWELRY.APPROVAL.MEMO.V1`    | Items on approval              |
| Purchase (GRN)      | `HERA.JEWELRY.PURCHASE.GRN.V1`     | Goods receipt notes            |
| Job Work Issue      | `HERA.JEWELRY.JOBWORK.ISSUE.V1`    | Materials to karigars          |
| Job Work Receipt    | `HERA.JEWELRY.JOBWORK.RECEIPT.V1`  | Finished goods from karigars   |
| Melt/Scrap          | `HERA.JEWELRY.MELT.SCRAP.V1`       | Convert items to raw materials |
| Stock Transfer      | `HERA.JEWELRY.STOCK.TRANSFER.V1`   | Inter-branch transfers         |
| Inventory Count     | `HERA.JEWELRY.INVENTORY.COUNT.V1`  | Physical stock verification    |
| Repair Intake       | `HERA.JEWELRY.REPAIR.INTAKE.V1`    | Customer repair requests       |
| Repair Delivery     | `HERA.JEWELRY.REPAIR.DELIVERY.V1`  | Completed repairs              |

### Transaction Lines

| Line Type             | Smart Code                                 | Purpose                 |
| --------------------- | ------------------------------------------ | ----------------------- |
| Item (Retail)         | `HERA.JEWELRY.LINE.ITEM.RETAIL.V1`         | Jewelry item line       |
| Making Charge         | `HERA.JEWELRY.LINE.MAKING.CHARGE.V1`       | Craftsmanship charges   |
| Stone Value           | `HERA.JEWELRY.LINE.STONE.VALUE.V1`         | Stone component pricing |
| Tax (GST)             | `HERA.JEWELRY.LINE.TAX.GST.V1`             | GST calculations        |
| Exchange (Old Gold)   | `HERA.JEWELRY.LINE.EXCHANGE.OLDGOLD.V1`    | Old gold adjustment     |
| Adjustment (Rounding) | `HERA.JEWELRY.LINE.ADJUSTMENT.ROUNDING.V1` | Invoice rounding        |

### Relationships

| Relationship Type     | Smart Code                                  | Purpose             |
| --------------------- | ------------------------------------------- | ------------------- |
| BOM Component         | `HERA.JEWELRY.REL.BOM.COMPONENT.V1`         | Item composition    |
| Price List Assignment | `HERA.JEWELRY.REL.PRICE_LIST.ASSIGNMENT.V1` | Rate applicability  |
| Job Work Assignment   | `HERA.JEWELRY.REL.JOBWORK.ASSIGNMENT.V1`    | Karigar work orders |

## Field Specifications

### Item Dynamic Fields

```typescript
{
  gross_weight: number,        // Total weight including stones
  stone_weight: number,        // Weight of stones only
  net_weight: number,          // Metal weight (gross - stone)
  purity_karat: 10|14|18|22|24, // Gold purity
  purity_factor: number,       // Calculated as karat/24
  making_charge_type: 'per_gram'|'fixed'|'percent',
  making_charge_rate: number,  // Rate based on type
  gst_slab: 0|3,              // GST percentage
  hsn_code: string,           // Must start with '711'
  hallmark_no?: string,       // BIS certification
  stone_details: Array<{      // Stone specifications
    type: string,
    weight: number,
    clarity: string,
    rate_per_carat: number
  }>
}
```

### Validation Rules

- **Weights**: `gross_weight = stone_weight + net_weight` (±0.005g tolerance)
- **Purity**: Only standard karat values (10, 14, 18, 22, 24)
- **HSN Code**: Must start with '711' for jewelry
- **GST Slab**: Only 0% or 3% allowed
- **Making Charge**: Must specify type and rate
- **Hallmark**: Required for 18K+ gold items

### Financial Integration

- **Metal Value**: `gold_rate_per_gram × net_weight × purity_factor`
- **Making Charges**: Applied per making_charge_type
- **Stone Value**: Separate line item with stone rates
- **GST**: CGST+SGST (intra-state) or IGST (inter-state)
- **Old Gold**: Negative adjustment line

## API Usage

### Create Item

```typescript
import { apiV2 } from '@/lib/universal/v2/client'
import { JewelrySmartCodes } from '@/lib/ucr/jewelry'

const item = await apiV2.post('/entities', {
  entity_type: 'jewelry_item',
  entity_name: 'Gold Necklace 22K',
  smart_code: JewelrySmartCodes.ITEM_RETAIL(),
  organization_id: orgId,
  dynamic_fields: {
    gross_weight: { value: 25.5, type: 'number', smart_code: '...' },
    stone_weight: { value: 2.1, type: 'number', smart_code: '...' },
    net_weight: { value: 23.4, type: 'number', smart_code: '...' },
    purity_karat: { value: 22, type: 'number', smart_code: '...' }
    // ... other fields
  }
})
```

### Process POS Sale

```typescript
const sale = await apiV2.post('/transactions', {
  organization_id: orgId,
  transaction_type: 'jewelry_sale',
  smart_code: JewelrySmartCodes.SALE_POS(),
  lines: [
    {
      line_entity_id: itemId,
      quantity: 1,
      unit_price: 85000,
      line_amount: 85000,
      smart_code: JewelrySmartCodes.ITEM_RETAIL_LINE()
    },
    {
      line_number: 2,
      line_amount: 2550, // GST amount
      smart_code: JewelrySmartCodes.TAX_GST()
    }
  ]
})
```

## Development Guidelines

1. **Use Universal Hooks**: Import from `/src/lib/universal/v2/hooks`
2. **Leverage Form Presets**: Use configurations from `/src/presets/jewelry/ui`
3. **Apply Business Rules**: Rules pack validates all operations
4. **Financial Integration**: Finance DNA handles GL posting automatically
5. **Compliance First**: All transactions pass through compliance checks

## File Structure

```
src/
├── lib/jewelry/
│   ├── rulesPack.ts          # Business validation rules
│   ├── compliance.ts         # GST/KYC/AML checks
│   └── rates.ts              # Gold rate management
├── lib/ucr/jewelry.ts        # Smart code utilities
├── presets/jewelry/ui.ts     # Form configurations
├── app/jewelry/              # UI pages
├── components/jewelry/       # Domain components
└── lib/financeDNA/packs/jewelry.ts  # GL posting rules
```

This architecture ensures jewelry operations follow HERA principles while providing domain-specific functionality through configuration rather than custom tables.
