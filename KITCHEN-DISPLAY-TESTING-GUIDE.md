# 🍽️ Kitchen Display System - Production Testing Guide

## Overview
This guide shows how to test the production Kitchen Display System using HERA's MCP tools and universal architecture.

## Prerequisites
1. Set up environment variables in `.env`:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key (optional)
DEFAULT_ORGANIZATION_ID=your-org-id
```

2. Install MCP server dependencies:
```bash
cd mcp-server
npm install
```

## 🚀 Step-by-Step Testing Process

### Step 1: Check/Create Organization
```bash
# Check existing organizations
node hera-cli.js query core_organizations

# Create a new restaurant organization if needed
node hera-cli.js create-entity organization "Mario's Kitchen Test"

# Note the organization ID and update .env
DEFAULT_ORGANIZATION_ID=<org-id-from-above>
```

### Step 2: Create Menu Items as Entities
```bash
# Create menu items with metadata including station assignments
node hera-cli.js create-entity menu_item "Grilled Salmon"
node hera-cli.js set-field <entity-id> price 24.00
node hera-cli.js set-field <entity-id> cost 5.31
node hera-cli.js set-field <entity-id> station "grill"
node hera-cli.js set-field <entity-id> prep_time 12
node hera-cli.js set-field <entity-id> allergens '["fish"]'

node hera-cli.js create-entity menu_item "Caesar Salad"
node hera-cli.js set-field <entity-id> price 9.00
node hera-cli.js set-field <entity-id> cost 2.00
node hera-cli.js set-field <entity-id> station "salad"
node hera-cli.js set-field <entity-id> prep_time 5

node hera-cli.js create-entity menu_item "Truffle Pasta"
node hera-cli.js set-field <entity-id> price 25.00
node hera-cli.js set-field <entity-id> cost 3.23
node hera-cli.js set-field <entity-id> station "grill"
node hera-cli.js set-field <entity-id> prep_time 15

node hera-cli.js create-entity menu_item "Chocolate Lava Cake"
node hera-cli.js set-field <entity-id> price 9.00
node hera-cli.js set-field <entity-id> cost 2.10
node hera-cli.js set-field <entity-id> station "dessert"
node hera-cli.js set-field <entity-id> prep_time 2
```

### Step 3: Create Status Workflow Entities
Following HERA's pattern - NO STATUS COLUMNS! Use relationships instead.

```bash
# Create status entities
node hera-cli.js create-entity order_status "New Order"
node hera-cli.js create-entity order_status "Acknowledged"
node hera-cli.js create-entity order_status "Preparing"
node hera-cli.js create-entity order_status "Ready for Service"
node hera-cli.js create-entity order_status "Served"
node hera-cli.js create-entity order_status "Completed"

# Note the status entity IDs for later use
```

### Step 4: Create Kitchen Orders as Transactions
```bash
# Create a dine-in order
node hera-cli.js create-transaction kitchen_order 33.00
# Note the transaction ID

# Add metadata to the order
node hera-cli.js query universal_transactions --limit 1
# Use the transaction ID to update metadata directly in the database
```

### Step 5: Create Order Line Items
For each order, create line items in `universal_transaction_lines`:

```bash
# This would need to be done via direct database access or API
# Line items link orders to menu items with quantities
```

### Step 6: Assign Order Status via Relationships
```bash
# Create relationship between order and status
# This follows the status-workflow-example.js pattern
node status-workflow-example.js

# The relationship links:
# from_entity_id = order (transaction) ID
# to_entity_id = status entity ID
# relationship_type = 'has_status'
```

### Step 7: Verify the Setup
```bash
# Check all data
node hera-query.js summary

# View entities (menu items and statuses)
node hera-query.js entities

# View transactions (orders)
node hera-query.js transactions

# View relationships (status assignments)
node hera-query.js relationships
```

## 📊 Data Structure in HERA Tables

### 1. **core_organizations**
- Restaurant organization with settings

### 2. **core_entities**
- Menu items (entity_type: 'menu_item')
- Order statuses (entity_type: 'order_status')
- Each with metadata for kitchen-specific properties

### 3. **universal_transactions**
- Kitchen orders (transaction_type: 'kitchen_order')
- Contains order metadata (type, table, customer, etc.)
- NO STATUS COLUMN - status via relationships

### 4. **universal_transaction_lines**
- Order line items linking to menu entities
- Quantities, modifiers, special instructions
- Station assignments for routing

### 5. **core_relationships**
- Order-to-status relationships (current status)
- relationship_type: 'has_status'
- Maintains complete status history

### 6. **core_dynamic_data**
- Additional menu item properties
- Custom fields for special requirements

## 🔄 Testing the Kitchen Display

1. **Start the application**:
```bash
npm run dev
```

2. **Navigate to Kitchen Display**:
- Go to `/restaurant/kitchen` route
- Or use the integrated dashboard at `/restaurant`

3. **Verify order display**:
- Orders should appear with correct stations
- Status workflows should function
- Time tracking should be accurate

4. **Test status updates**:
- Click buttons to change order status
- Verify relationships update in database
- Check that no status columns are used

## 🎯 Key Testing Scenarios

### Scenario 1: New Order Flow
1. Create order as 'new' status
2. Acknowledge order (status change via relationship)
3. Start preparing (update items)
4. Mark items ready
5. Complete order

### Scenario 2: Multi-Station Order
1. Create order with items for different stations
2. Verify station filtering works
3. Test item-level status updates
4. Ensure order completes when all items ready

### Scenario 3: Priority Orders
1. Create VIP/Rush orders with priority metadata
2. Verify visual indicators
3. Test time-based urgency colors
4. Validate sort order

## 🐛 Troubleshooting

### Issue: Orders not appearing
- Check organization_id matches
- Verify transaction_type is 'kitchen_order'
- Ensure workflow_state is set

### Issue: Status not updating
- Verify relationships are created correctly
- Check from_entity_id and to_entity_id
- Ensure relationship_type is 'has_status'

### Issue: Connection errors
- Verify Supabase credentials in .env
- Check network connectivity
- Try using hardcoded values for testing

## 📝 Smart Codes Used

```javascript
// Order Types
'HERA.REST.ORDER.DINE_IN.v1'
'HERA.REST.ORDER.TAKEOUT.v1'
'HERA.REST.ORDER.DELIVERY.v1'

// Menu Items
'HERA.REST.MENU.ITEM.{CATEGORY}.v1'

// Order Lines
'HERA.REST.ORDER.LINE.MAIN.v1'
'HERA.REST.ORDER.LINE.APPETIZER.v1'
'HERA.REST.ORDER.LINE.DESSERT.v1'

// Status Workflow
'HERA.REST.STATUS.{STATUS}.v1'
'HERA.REST.WORKFLOW.STATUS.ASSIGN.v1'
```

## ✅ Success Criteria

Your Kitchen Display System is working correctly when:

1. **Orders display** with all details (type, table/customer, items)
2. **Station filtering** shows relevant orders per station
3. **Status updates** work via relationship changes
4. **Time tracking** shows elapsed and remaining time
5. **Priority indicators** highlight rush/VIP orders
6. **Progress bars** track item completion
7. **NO STATUS COLUMNS** are used anywhere
8. **All data** follows HERA's 6-table architecture

## 🚀 Next Steps

After successful testing:

1. **Add real-time updates** via Supabase subscriptions
2. **Implement printer integration** for kitchen tickets
3. **Add performance metrics** tracking
4. **Create station-specific views** for different screens
5. **Build reporting** on kitchen efficiency
6. **Integrate with POS** for automatic order flow

## 📚 Related Documentation

- [HERA Universal Architecture](./CLAUDE.md)
- [Status Workflow Pattern](./mcp-server/status-workflow-example.js)
- [Universal API Guide](./src/lib/universal-api.ts)
- [MCP Server Tools](./mcp-server/README.md)