# Ice Cream Manufacturing Chart of Accounts Guide

## Overview

HERA's Universal Chart of Accounts (COA) DNA has been customized for ice cream manufacturing businesses, providing a comprehensive accounting framework that handles the unique requirements of cold chain operations, multi-channel sales, and seasonal business patterns.

## 🍦 Industry-Specific Features

### 1. **Cold Chain Management**
- Dedicated accounts for refrigeration costs
- Cold chain wastage tracking
- Temperature excursion write-offs
- Freezer placement program costs

### 2. **Multi-Channel Revenue Tracking**
- Retail store sales
- Wholesale distribution
- Food service (restaurants, cafes)
- Online/delivery channels
- Separate tracking for Kulfi (12% GST) vs Ice Cream (18% GST)

### 3. **Inventory Categories**
- **Raw Materials**: Dairy, sweeteners, flavors, stabilizers, inclusions, packaging
- **Work in Process**: Ice cream base, churning stage
- **Finished Goods**: Cups/tubs, bars/sticks, cones, bulk, Kulfi

### 4. **Production Costing**
- Material usage variance tracking
- Yield variance accounts
- Batch-level costing
- Seasonal production adjustments

## 📊 Account Structure

### Assets (1000-1999)

#### Current Assets
- **1111**: Petty Cash
- **1112**: Cash in Bank - Operating
- **1113**: Cash in Bank - GST

#### Receivables
- **1210**: Trade Receivables - Retail
- **1211**: Trade Receivables - Wholesale
- **1212**: Trade Receivables - Food Service

#### Inventory - Raw Materials
- **1311**: Raw Materials - Dairy Products
- **1312**: Raw Materials - Sugar & Sweeteners
- **1313**: Raw Materials - Flavoring & Colors
- **1314**: Raw Materials - Stabilizers & Emulsifiers
- **1315**: Raw Materials - Inclusions (nuts, chips, fruits)
- **1316**: Packaging Materials

#### Inventory - WIP
- **1321**: WIP - Ice Cream Base
- **1322**: WIP - Churning & Freezing

#### Inventory - Finished Goods
- **1331**: FG - Ice Cream Cups/Tubs
- **1332**: FG - Ice Cream Bars/Sticks
- **1333**: FG - Ice Cream Cones
- **1334**: FG - Bulk Ice Cream
- **1335**: FG - Kulfi Products

#### Fixed Assets
- **1610**: Production Equipment
- **1620**: Freezing & Cold Storage Equipment
- **1630**: Delivery Vehicles - Refrigerated

### Revenue (4000-4999)

#### Sales Channels
- **4110**: Ice Cream Sales - Retail Stores (18% GST)
- **4111**: Ice Cream Sales - Wholesale (18% GST)
- **4112**: Ice Cream Sales - Food Service (18% GST)
- **4113**: Ice Cream Sales - Online/Delivery (18% GST)
- **4114**: Kulfi Sales - All Channels (12% GST)

### Cost of Goods Sold (5000-5999)

#### Direct Materials
- **5110**: Dairy Products Cost
- **5111**: Sugar & Sweeteners Cost
- **5112**: Flavoring & Colors Cost
- **5113**: Inclusions Cost
- **5114**: Packaging Materials Cost

#### Direct Labor
- **5210**: Production Wages
- **5211**: Production Overtime

#### Manufacturing Overhead
- **5310**: Factory Electricity - Refrigeration
- **5311**: Equipment Maintenance
- **5312**: Quality Control & Testing
- **5313**: Cold Chain Maintenance

#### Variances
- **5410**: Material Usage Variance
- **5411**: Yield Variance
- **5412**: Cold Chain Wastage

### Operating Expenses (6000-6999)

#### Sales & Distribution
- **6110**: Delivery Vehicle Fuel
- **6111**: Delivery Vehicle Maintenance
- **6112**: Sales Commissions
- **6113**: Trade Promotions & Discounts
- **6114**: Freezer Placement Program

#### Administrative
- **6210**: Office Salaries
- **6211**: Office Rent
- **6212**: Insurance - Product Liability
- **6213**: Food License & Certifications

## 🤖 Auto-Journal Rules

### 1. **Retail Ice Cream Sale**
```
DR: Cash/Bank (1112)
DR: Trade Receivables (1210)
    CR: Ice Cream Sales - Retail (4110)
    CR: GST Output - 18% (2210)
```

### 2. **Raw Material Purchase**
```
DR: Raw Materials - Dairy (1311)
DR: GST Input (1410)
    CR: Accounts Payable (2111)
```

### 3. **Production Completion**
```
DR: Finished Goods (1331)
    CR: Work in Process (1321)
    CR: Material Costs (5110)
    CR: Labor Costs (5210)
    CR: Overhead Costs (5310)
```

### 4. **Cold Chain Wastage**
```
DR: Cold Chain Wastage (5412)
    CR: Finished Goods (1331)
```

## 💡 Implementation Guide

### Step 1: Setup COA
```typescript
// Call the setup API endpoint
const response = await fetch('/api/v1/icecream-manager/setup-coa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId: 'your-org-id',
    organizationName: 'Your Ice Cream Company',
    country: 'IN' // or your country code
  })
})
```

### Step 2: Configure GST Rates
- Ice Cream Products: 18% GST
- Kulfi Products: 12% GST
- Input credits available on all purchases

### Step 3: Setup Cost Centers
Recommended cost centers for ice cream business:
- Production Plant
- Cold Storage
- Distribution Center
- Retail Outlets
- Quality Control Lab

### Step 4: Enable Features
- Batch tracking for production
- Expiry date management
- Temperature compliance tracking
- Multi-location inventory
- Seasonal variance analysis

## 📈 Key Metrics & Reports

### Daily Monitoring
- Cold chain temperature compliance
- Production yield variance
- Wastage percentage
- Sales by channel

### Weekly Analysis
- Inventory turnover by SKU
- Channel-wise margins
- Freezer utilization rates
- Route optimization savings

### Monthly Reporting
- Product profitability analysis
- Seasonal trend analysis
- Cold chain cost per unit
- Channel performance comparison

## 🌡️ Temperature Compliance Integration

The COA integrates with temperature monitoring systems:
- Automatic wastage entries for temperature excursions
- Real-time cold chain cost tracking
- Compliance reporting for audits
- Insurance claim documentation

## 🎯 Best Practices

1. **Daily Reconciliation**
   - Match physical inventory with system
   - Verify cold chain compliance
   - Update production yields

2. **Cost Control**
   - Monitor electricity costs (major expense)
   - Track delivery route efficiency
   - Analyze channel profitability

3. **Seasonal Planning**
   - Build inventory before summer
   - Plan production capacity
   - Adjust pricing strategies

4. **Quality Assurance**
   - Regular product testing costs
   - Certification maintenance
   - Recall provision accounting

## 🔄 Integration with Ice Cream Manager

The COA seamlessly integrates with the Ice Cream Manager chat interface:
- Automatic journal entries for all transactions
- Real-time profitability analysis
- Instant financial reporting
- AI-powered insights on cost optimization

## 📋 Compliance Features

### Food Safety
- FSSAI license tracking
- ISO certification costs
- Lab testing expenses
- Recall provisions

### GST Compliance
- Automatic GST calculations
- Input credit tracking
- E-way bill integration
- Monthly return preparation

### Environmental
- Carbon footprint tracking
- Refrigerant management costs
- Waste disposal accounting

---

*This Chart of Accounts is specifically designed for ice cream manufacturing businesses, capturing the unique aspects of cold chain operations, seasonal demand patterns, and multi-channel distribution requirements.*