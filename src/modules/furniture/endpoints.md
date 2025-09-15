# HERA Furniture Module REST Endpoints

## Base URL

`/api/v1/furniture`

## Sales Endpoints

### Proforma Management

- `POST /sales/proforma` - Create proforma invoice
- `GET /sales/proforma/{id}` - Retrieve proforma details
- `PUT /sales/proforma/{id}` - Update proforma
- `POST /sales/proforma/{id}/convert` - Convert to sales order

### Sales Order Management

- `POST /sales/sales-orders` - Create sales order
- `GET /sales/sales-orders/{id}` - Retrieve sales order
- `PUT /sales/sales-orders/{id}` - Update sales order
- `POST /sales/sales-orders/{id}/confirm` - Confirm sales order
- `POST /sales/sales-orders/{id}/advance` - Record advance payment

### Invoice Management

- `POST /sales/invoices` - Create tax invoice
- `GET /sales/invoices/{id}` - Retrieve invoice
- `POST /sales/invoices/{id}/gst-return` - GST return data

### Dispatch Management

- `POST /sales/dispatch` - Create dispatch/delivery note
- `GET /sales/dispatch/{id}` - Retrieve dispatch details
- `POST /sales/dispatch/{id}/confirm` - Confirm delivery

## Production Endpoints

### Production Order Management

- `POST /production/orders` - Create production order
- `GET /production/orders/{id}` - Retrieve production order
- `PUT /production/orders/{id}` - Update production order
- `POST /production/orders/{id}/release` - Release for execution
- `GET /production/orders/{id}/materials` - Get material requirements
- `GET /production/orders/{id}/operations` - Get operations list

### Operation Execution

- `POST /production/operations/start` - Start operation
- `POST /production/operations/complete` - Complete operation
- `POST /production/operations/{id}/pause` - Pause operation
- `GET /production/operations/{id}/status` - Get operation status

### Inventory Movements

- `POST /production/fg-receipts` - Record finished goods receipt
- `POST /production/material-issue` - Issue materials to production
- `POST /production/scrap` - Record scrap/wastage
- `POST /production/rework` - Record rework

### Cutting List

- `POST /production/cutting-list` - Generate cutting list
- `GET /production/cutting-list/{id}` - Retrieve cutting list

## Finance Endpoints

### Posting Simulation

- `POST /finance/simulate-postings` - Simulate GL postings
- `POST /finance/validate-postings` - Validate posting rules

### GL Posting

- `POST /finance/postings` - Execute GL postings
- `GET /finance/postings/{transaction_id}` - Get postings for transaction
- `POST /finance/postings/reverse` - Reverse postings

### GST Processing

- `POST /finance/gst/calculate` - Calculate GST
- `GET /finance/gst/returns/{period}` - GST return data
- `POST /finance/gst/file-return` - File GST return

## HR Endpoints

### Payroll Processing

- `POST /hr/payroll-runs` - Execute payroll run
- `GET /hr/payroll-runs/{id}` - Get payroll run details
- `POST /hr/payroll-runs/{id}/approve` - Approve payroll
- `POST /hr/payroll-runs/{id}/disburse` - Process bank disbursement

### PF Management

- `POST /hr/pf-remittance` - Process PF remittance
- `GET /hr/pf-remittance/{month}` - Get PF remittance details
- `POST /hr/pf-ecr` - Generate ECR file
- `GET /hr/pf-challan/{month}` - Generate PF challan

### ESI Management

- `POST /hr/esi-remittance` - Process ESI remittance
- `GET /hr/esi-remittance/{month}` - Get ESI remittance details
- `POST /hr/esi-challan` - Generate ESI challan
- `GET /hr/esi-return/{period}` - ESI return data

## Common Query Parameters

- `organization_id` (required) - Organization context
- `from_date` - Start date filter
- `to_date` - End date filter
- `status` - Transaction status filter
- `page` - Page number for pagination
- `limit` - Records per page

## Response Format

All endpoints return responses in the format:

```json
{
  "success": true,
  "data": {},
  "metadata": {
    "total_records": 100,
    "page": 1,
    "limit": 20
  },
  "smart_code": "HERA.MANUFACTURING.FURNITURE.*.v1"
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": []
  }
}
```
