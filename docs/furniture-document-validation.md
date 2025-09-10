# Furniture Document Upload & Validation System

## Overview
The HERA Furniture module includes an intelligent document upload and analysis system that validates invoices to ensure they are furniture-related before processing. This prevents unrelated expenses from contaminating the furniture business data.

## Key Features

### 1. Smart Document Validation
- **Furniture-Related Detection**: Uses keyword analysis to determine if invoices are furniture-related
- **Supplier Management**: Automatically creates new suppliers or links to existing ones
- **Business Categorization**: Categorizes invoices into raw materials, hardware, fabric, etc.
- **Rejection Logic**: Identifies non-furniture invoices (food, medical, software, etc.)

### 2. Database Column Usage (CRITICAL)

#### Core Dynamic Data
```javascript
// CORRECT - Use field_value_json for JSON data
{
  entity_id: documentId,
  organization_id: organizationId,
  field_name: 'document_analysis',
  field_value_json: {  // ✅ Correct column
    analysis_data: {...},
    metadata: {...}
  },
  smart_code: 'HERA.FURNITURE.DOCUMENT.ANALYSIS.v1'
}

// WRONG - Don't use metadata column (doesn't exist)
{
  metadata: {...}  // ❌ Column doesn't exist
}
```

#### Universal Transactions
```javascript
// CORRECT - Use source_entity_id/target_entity_id
{
  source_entity_id: documentId,     // ✅ Link to document
  target_entity_id: supplierId,     // ✅ Link to supplier
  metadata: {...},                  // ✅ Transaction metadata
  business_context: {...}           // ✅ Additional context
}

// WRONG - Don't use reference_entity_id
{
  reference_entity_id: documentId  // ❌ Column doesn't exist
}
```

### 3. Validation Rules

#### Furniture Keywords (Accepted)
- **Wood/Timber**: wood, timber, plywood, veneer, lumber, mdf, particle board
- **Hardware**: hinge, drawer, handle, screw, nail, bracket
- **Fabric**: fabric, upholstery, foam, cushion, textile, leather
- **Finishing**: polish, varnish, paint, coating, finish, stain
- **Tools**: adhesive, glue, sandpaper, saw, drill

#### Non-Furniture Keywords (Rejected)
- **Food**: restaurant, food, beverage, grocery, meal
- **Medical**: medical, pharma, hospital, clinic, doctor
- **Technology**: software, technology, consulting, service
- **Other**: travel, hotel, telecom, insurance, bank

### 4. API Endpoints

#### Upload Document
```
POST /api/v1/furniture/documents/upload
```

Required fields:
- `file`: The document file (PDF, JPG, PNG, HEIC)
- `organizationId`: Organization ID
- `documentType`: Type of document (default: 'furniture_invoice')

#### Analyze Document
```
POST /api/v1/furniture/documents/analyze
```

Required fields:
- `fileId`: ID of uploaded document
- `fileName`: Original filename
- `organizationId`: Organization ID

### 5. Validation Flow

1. **Upload Document** → Creates entity in `core_entities`
2. **Analyze Document** → Extracts vendor/invoice data
3. **Validate Business Relevance**:
   - If furniture-related → Process normally
   - If not furniture-related → Suggest general expense entry
4. **Supplier Check**:
   - If exists → Link to existing supplier
   - If new → Create supplier automatically
5. **Store Analysis** → Save in `core_dynamic_data` with proper columns

### 6. Example Responses

#### Valid Furniture Invoice
```json
{
  "success": true,
  "data": {
    "analysis": {
      "vendor_name": "Premium Wood Suppliers",
      "is_furniture_related": true,
      "category": "raw_materials",
      "validation": {
        "isValid": true,
        "supplierExists": false,
        "message": "New furniture supplier detected"
      }
    },
    "journalEntry": {
      "debits": [{
        "account": "Raw Materials - Wood & Timber",
        "amount": 25000
      }],
      "credits": [{
        "account": "Trade Payables - Suppliers",
        "amount": 25000
      }]
    }
  }
}
```

#### Non-Furniture Invoice (Rejected)
```json
{
  "success": true,
  "message": "Document analyzed - Not furniture related",
  "data": {
    "analysis": {
      "vendor_name": "Dominos Pizza",
      "is_furniture_related": false,
      "suggested_action": "general_expense"
    },
    "journalEntry": {
      "debits": [{
        "account": "General Operating Expenses",
        "amount": 500
      }],
      "credits": [{
        "account": "Trade Payables",
        "amount": 500
      }]
    },
    "warning": "This invoice does not appear to be furniture-related. Consider recording as a general business expense."
  }
}
```

### 7. Testing

Use the provided test scripts:

```bash
# Test validation logic
node test-furniture-document-validation.js

# Test database column usage
node test-furniture-api-columns.js
```

### 8. Smart Codes Used

- `HERA.FURNITURE.DOCUMENT.INVOICE.v1` - Invoice document entity
- `HERA.FURNITURE.DOCUMENT.URL.v1` - Document URL storage
- `HERA.FURNITURE.DOCUMENT.UPLOAD.TXN.v1` - Upload transaction
- `HERA.FURNITURE.DOCUMENT.ANALYSIS.v1` - Analysis results
- `HERA.FURNITURE.DOCUMENT.ANALYSIS.TXN.v1` - Analysis transaction
- `HERA.FURNITURE.VENDOR.{CATEGORY}.v1` - Vendor categories

### 9. Best Practices

1. **Always validate invoices** before processing to maintain data integrity
2. **Use correct column names** to avoid database errors
3. **Check supplier existence** before creating duplicates
4. **Store complete analysis** for audit trail
5. **Provide clear feedback** when rejecting non-furniture invoices

### 10. Error Handling

Common errors and solutions:

1. **Foreign key constraint violation**
   - Ensure organization_id exists in core_organizations
   - Check that entity_id references exist before linking

2. **Column not found errors**
   - Use `field_value_json` instead of `metadata` in core_dynamic_data
   - Use `source_entity_id/target_entity_id` instead of `reference_entity_id`

3. **Validation failures**
   - Check keyword lists are comprehensive
   - Test edge cases with ambiguous vendors
   - Provide clear categorization suggestions