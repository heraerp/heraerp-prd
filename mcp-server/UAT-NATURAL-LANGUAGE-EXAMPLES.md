# HERA MCP UAT Natural Language Command Examples

## Overview
This guide provides comprehensive natural language command examples for UAT testing across different business scenarios. These commands can be used with the enhanced MCP server to test complete business workflows.

## Table of Contents
1. [POS & Sales Operations](#pos--sales-operations)
2. [Inventory Management](#inventory-management)
3. [Appointment Scheduling](#appointment-scheduling)
4. [Customer Management](#customer-management)
5. [Payment Processing](#payment-processing)
6. [Reporting & Analytics](#reporting--analytics)
7. [Return & Exchange](#return--exchange)
8. [Staff Management](#staff-management)
9. [Multi-Location Operations](#multi-location-operations)
10. [Complex Workflows](#complex-workflows)

## POS & Sales Operations

### Basic Sales
```
"Create a sale for 2 haircuts at $45 each"
"Ring up 3 pizzas and 2 sodas for table 5"
"Process sale: 1 iPhone case $29.99 and screen protector $19.99"
"Checkout 5 t-shirts at $15 each with 10% discount"
"Bill customer for oil change service $79.99"
```

### Sales with Customer
```
"Create sale for John Smith: 2 products totaling $150"
"Ring up hair color service for Sarah Johnson"
"Process order for customer ID 12345: 3 items"
"Charge Maria Garcia for dental cleaning"
"Bill corporate account ACME Inc for consulting services $5000"
```

### Sales with Payment Details
```
"Create sale for $125.50, customer paying with card ending in 1234"
"Ring up $75 purchase, split payment $50 cash and rest on card"
"Process $200 sale with check number 5678"
"Charge $45.99 to customer's account on file"
"Complete sale $350, customer wants to pay with 2 different cards"
```

### Sales with Tax
```
"Create taxable sale for $100 plus 8.5% sales tax"
"Ring up tax-exempt sale for nonprofit customer"
"Process sale with custom tax rate 7.25%"
"Apply restaurant tax 10% to food order $85"
"Calculate tax for mixed items: taxable goods $50, non-taxable $30"
```

## Inventory Management

### Stock Adjustments
```
"Add 50 units of shampoo to inventory"
"Remove 10 damaged items from stock"
"Adjust inventory: found 5 extra hair dryers during count"
"Reduce stock by 3 units due to theft"
"Correct inventory count for product SKU-12345 to 100 units"
```

### Stock Transfers
```
"Transfer 20 hair conditioners from main store to downtown location"
"Move 15 pizzas from freezer to kitchen prep area"
"Relocate 10 laptops from warehouse to showroom"
"Ship 25 items to branch store #2"
"Transfer entire stock of seasonal items to clearance section"
```

### Stock Receiving
```
"Receive shipment: 100 bottles of shampoo from vendor"
"Process incoming inventory: 50 t-shirts assorted sizes"
"Add new product line: 25 units each of 5 SKUs"
"Receive partial order: 30 of 50 items ordered"
"Process return to vendor: 10 defective units"
```

### Inventory Queries
```
"Show current stock level for all hair products"
"Check inventory for items below reorder point"
"List products with zero stock"
"Show inventory value by category"
"Display stock movement for last 7 days"
```

## Appointment Scheduling

### Creating Appointments
```
"Book John Smith for haircut tomorrow at 2pm"
"Schedule Maria for color treatment next Tuesday 10am with stylist Sarah"
"Create appointment for dental cleaning Monday 9am"
"Book massage therapy session for 90 minutes this Friday"
"Schedule car service appointment for oil change tomorrow morning"
```

### Checking Availability
```
"Show available slots for haircuts this week"
"What times are free tomorrow for a 1-hour service?"
"Check Sarah's availability for next Monday"
"Find next available appointment for root canal"
"Show all open slots for massage therapy this month"
```

### Managing Appointments
```
"Reschedule John's appointment to next Wednesday 3pm"
"Cancel tomorrow's 2pm appointment"
"Move all of today's appointments to tomorrow"
"Block out 2-4pm next Friday for staff meeting"
"Mark John Smith as no-show for today's appointment"
```

### Appointment Queries
```
"Show all appointments for today"
"List tomorrow's schedule for stylist Maria"
"Display this week's bookings"
"Show appointments for customer John Smith"
"Find all cancelled appointments this month"
```

## Customer Management

### Creating Customers
```
"Create new customer John Smith, phone 555-1234, email john@email.com"
"Add customer Maria Garcia with birthday January 15"
"Register new client: ABC Company, tax ID 12-3456789"
"Create VIP customer Sarah Johnson with 20% discount"
"Add walk-in customer with phone 555-9999"
```

### Updating Customers
```
"Update John Smith's email to newemail@domain.com"
"Change customer phone number to 555-5678"
"Add note to customer: allergic to certain products"
"Set customer preferred stylist to Maria"
"Mark customer as inactive"
```

### Customer Queries
```
"Find customer by phone 555-1234"
"Search customers named Smith"
"Show all VIP customers"
"List customers with birthdays this month"
"Display top 10 customers by revenue"
```

### Customer History
```
"Show purchase history for John Smith"
"List all appointments for customer ID 12345"
"Display last 5 transactions for this customer"
"Show customer's favorite products"
"Calculate customer lifetime value"
```

## Payment Processing

### Single Payment Methods
```
"Process payment $125.50 with cash"
"Charge $89.99 to card ending in 1234"
"Accept check payment for $500, check number 789"
"Process debit card payment $67.50"
"Apply store credit $25 to purchase"
```

### Split Payments
```
"Split payment: $50 cash, $75 on card"
"Divide $200 bill equally between 2 cards"
"Process $150: $100 gift card, rest cash"
"Split check 3 ways for table of 3"
"Pay $80 with $30 cash, $30 debit, $20 credit"
```

### Payment with Tips
```
"Process $100 payment with 20% tip"
"Add 15% gratuity to $85 bill"
"Charge $50 plus $10 tip on card 1234"
"Calculate suggested tips for $75 bill"
"Process payment $120 including 18% service charge"
```

### Refunds & Adjustments
```
"Refund $50 to customer's original payment method"
"Process partial refund of $25 on transaction 12345"
"Issue store credit for returned item $35"
"Void transaction from earlier today"
"Adjust payment: customer was overcharged $10"
```

## Reporting & Analytics

### Sales Reports
```
"Show today's sales summary"
"Generate sales report for last week"
"Display monthly revenue by category"
"Show hourly sales breakdown for today"
"Compare this month's sales to last month"
```

### Inventory Reports
```
"Generate current inventory valuation report"
"Show products below reorder point"
"List slow-moving inventory items"
"Display stock turnover report"
"Show inventory aging analysis"
```

### Customer Reports
```
"Generate top customers report by revenue"
"Show new customers added this month"
"List customers who haven't visited in 60 days"
"Display customer retention metrics"
"Show customer segmentation analysis"
```

### Financial Reports
```
"Show profit margin analysis by product"
"Generate cash flow report for this quarter"
"Display outstanding invoices aging"
"Show tax collected this month"
"Generate P&L statement for year-to-date"
```

### Staff Reports
```
"Show sales by employee for today"
"Generate staff productivity report"
"Display appointment utilization by stylist"
"Show commission calculations for this pay period"
"List staff hours worked this week"
```

## Return & Exchange

### Simple Returns
```
"Process return for transaction 12345"
"Return blue shirt purchased yesterday"
"Customer returning unopened shampoo bottle"
"Process defective item return with receipt"
"Return without receipt for store credit only"
```

### Exchanges
```
"Exchange size M shirt for size L"
"Swap damaged product for new one"
"Exchange red item for blue, same price"
"Trade in old model for new version with price difference"
"Exchange gift for different item"
```

### Complex Returns
```
"Return 2 of 5 items from yesterday's purchase"
"Process return and repurchase with discount"
"Return online order in store"
"Exchange defective item ordered 2 months ago"
"Return gift without receipt for lowest price"
```

## Staff Management

### Staff Operations
```
"Add new employee Maria Rodriguez, stylist"
"Set John as manager with admin access"
"Deactivate former employee account"
"Update staff member's commission rate to 45%"
"Assign Sarah to downtown location"
```

### Scheduling
```
"Set Maria's schedule: Monday-Friday 9am-5pm"
"Block John's calendar next Tuesday"
"Add overtime shift for this Saturday"
"Copy this week's schedule to next week"
"Show who's working tomorrow"
```

### Performance
```
"Show Maria's sales for this month"
"Calculate commission for all staff"
"Display appointment completion rate by stylist"
"Show staff utilization report"
"Track retail sales by employee"
```

## Multi-Location Operations

### Location Management
```
"Transfer John Smith to downtown store"
"Show inventory at all locations"
"Compare sales between stores"
"Check product availability at nearby locations"
"Route order to closest store with stock"
```

### Cross-Location Operations
```
"Customer wants to return downtown purchase at uptown store"
"Check if customer has appointments at other locations"
"Transfer inventory between 3 stores to balance stock"
"Generate consolidated report for all locations"
"Apply promotion to specific locations only"
```

## Complex Workflows

### Restaurant Service
```
"Create order for table 5: 2 appetizers, 3 entrees, 1 bottle wine"
"Add dessert to existing table 5 order"
"Split check for table 5: 2 separate bills"
"Apply happy hour pricing to bar orders"
"Close out tab for customer at bar seat 3"
```

### Salon Package Services
```
"Book bridal package: hair, makeup, nails for 3pm"
"Create package deal: haircut, color, and style for $150"
"Schedule recurring appointment every 6 weeks"
"Book group appointment for 5 people"
"Process package payment in 3 installments"
```

### Healthcare Workflow
```
"Schedule new patient consultation with intake forms"
"Book follow-up appointment in 2 weeks"
"Process insurance copay $25 for today's visit"
"Generate superbill for insurance claim"
"Send appointment reminder for tomorrow's patients"
```

### Retail Scenarios
```
"Process buy 2 get 1 free promotion"
"Apply loyalty points to reduce purchase price"
"Handle price match request from competitor"
"Process layaway payment installment"
"Generate rain check for out-of-stock item"
```

### Service Business
```
"Create work order for computer repair"
"Update repair status to ready for pickup"
"Process deposit for custom order"
"Schedule on-site service call"
"Generate invoice for completed project"
```

## Error Handling Examples

### Common Errors
```
"Customer doesn't exist" → "Would you like me to create a new customer?"
"Product not found" → "Here are similar products..."
"Insufficient stock" → "Only 5 units available, proceed?"
"Invalid payment amount" → "Amount exceeds total, please verify"
"Time slot unavailable" → "Here are alternative times..."
```

### Recovery Flows
```
"Retry failed payment with different card"
"Override price for manager approval"
"Force completion despite warning"
"Skip validation for this transaction"
"Undo last operation"
```

## Best Practices

### Clear Commands
- Be specific about quantities: "2 items" not "a couple items"
- Include identifiers when known: "customer ID 123" or "John Smith"
- Specify payment methods clearly: "cash", "card ending 1234"
- Use standard date/time formats: "tomorrow 2pm", "next Monday"

### Efficient Workflows
- Batch similar operations: "add 10 products to inventory"
- Use customer on file: "for existing customer John Smith"
- Reference previous transactions: "same as last order"
- Apply templates: "use standard service package"

### Testing Edge Cases
- Test maximum quantities: "order 9999 items"
- Test zero/negative values: "refund $0"
- Test invalid inputs: "book appointment yesterday"
- Test system limits: "create 1000 customers"

## Conclusion

These natural language examples demonstrate the flexibility and power of HERA's MCP server for UAT testing. By using conversational commands, testers can validate complex business workflows without needing to understand technical APIs or database structures.

The enhanced MCP server interprets these commands and executes the appropriate operations while maintaining HERA's universal architecture principles and multi-tenant security.