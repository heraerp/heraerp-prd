# BUSINESS MODULE DNA REFERENCE

## 🧬 Universal + Industry-Specific Business Patterns

### **Standard Inventory Module - HERA.INV.STANDARD.MODULE.v1**

**Purpose**: Universal inventory management that works across all industries

**Core Entities**:
```json
{
  "inventory_item": "Core product/item with universal properties",
  "stock_location": "Physical or logical storage location", 
  "stock_movement": "All inventory transactions (in/out/transfer)",
  "reorder_point": "Automatic reordering rules and thresholds",
  "supplier": "Vendor/supplier relationship management",
  "category": "Hierarchical item categorization"
}
```

**Standard Transactions**:
```json
{
  "stock_receipt": "Receiving inventory from suppliers",
  "stock_issue": "Issuing inventory for use/sale", 
  "stock_transfer": "Moving between locations",
  "stock_adjustment": "Corrections and cycle counts",
  "purchase_order": "Ordering from suppliers", 
  "sales_order": "Customer orders requiring inventory"
}
```

**UI Components**:
- Inventory dashboard with KPI glass panels
- Item list table with glassmorphism styling
- Stock movement forms with Fiori structure
- Reorder alerts with modern notifications
- Inventory charts with micro chart integration

### **Restaurant Inventory Specialization - HERA.REST.INV.SPECIALIZATION.v1**

**Extends**: HERA.INV.STANDARD.MODULE.v1
**Industry Focus**: Restaurant menu management and cost control

**Specialized Entities**:
```json
{
  "menu_item": "Customer-facing menu items with pricing",
  "recipe": "Recipe definitions with ingredient lists", 
  "ingredient": "Raw ingredients with supplier info",
  "portion_control": "Standard serving sizes and yields",
  "waste_tracking": "Food waste monitoring and costing",
  "menu_category": "Menu organization and promotions"
}
```

**Specialized Transactions**:
```json
{
  "ingredient_purchase": "Buying raw ingredients from suppliers",
  "menu_preparation": "Converting ingredients to menu items",
  "customer_order": "Orders that consume menu items", 
  "waste_disposal": "Tracking and costing waste/spoilage",
  "recipe_costing": "Calculating true cost of menu items",
  "menu_engineering": "Analyzing profitability and popularity"
}
```

**Restaurant-Specific UI**:
- Menu builder with drag-drop glassmorphism interface
- Recipe calculator with real-time costing
- Cost analysis dashboards with Fiori charts
- Waste tracking with visual indicators
- Supplier portal with modern glass design

### **Healthcare Inventory Specialization - HERA.HLTH.INV.SPECIALIZATION.v1**

**Extends**: HERA.INV.STANDARD.MODULE.v1  
**Industry Focus**: Medical supply management and compliance

**Specialized Entities**:
```json
{
  "medical_supply": "Medical devices and pharmaceuticals",
  "lot_tracking": "Batch numbers and expiration dates",
  "regulatory_compliance": "FDA/regulatory requirements", 
  "sterilization_cycle": "Equipment sterilization tracking",
  "patient_assignment": "Supply allocation to patients",
  "controlled_substance": "Narcotic and controlled drug management"
}
```

### **Manufacturing Inventory Specialization - HERA.MFG.INV.SPECIALIZATION.v1**

**Extends**: HERA.INV.STANDARD.MODULE.v1
**Industry Focus**: Materials resource planning and production

**Specialized Entities**:
```json
{
  "raw_material": "Manufacturing input materials",
  "work_in_process": "Partially completed products",
  "finished_goods": "Completed products ready for sale",
  "bill_of_materials": "Product composition and requirements",
  "production_order": "Manufacturing work orders",
  "quality_control": "Quality testing and certification"
}
```

## 🔄 Using Business Module DNA

### **Load Universal Module**:
```sql
SELECT claude_get_component_dna('HERA.INV.STANDARD.MODULE.v1');
```

### **Load Industry Specialization**:
```sql  
SELECT claude_get_component_dna('HERA.REST.INV.SPECIALIZATION.v1');
```

### **Apply to New Industry**:
Claude CLI can adapt existing patterns to new industries:
- Start with universal foundation
- Add industry-specific entities and transactions
- Apply appropriate UI specializations
- Store new patterns for future reuse

### **Cross-Industry Learning**:
Improvements made in one industry automatically benefit others:
- Better inventory algorithms from manufacturing help restaurants
- Restaurant waste tracking insights improve healthcare supply management
- Healthcare compliance patterns enhance manufacturing quality control