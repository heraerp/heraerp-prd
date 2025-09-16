# Restaurant Management System - HERA Universal Architecture Mapping

## How Restaurant Concepts Map to HERA's 6 Universal Tables

### 1. **core_organizations** - Restaurant Locations

**Restaurant Use**: Multi-location restaurant chains, franchises

```sql
-- Example: Mario's Italian Bistro chain
organization_id: "org_marios_downtown"
organization_name: "Mario's Italian Bistro - Downtown"
organization_type: "restaurant"
```

### 2. **core_entities** - Everything in Your Restaurant

**Restaurant Use**: Menu items, customers, employees, suppliers, tables, equipment

```sql
-- Menu Items
entity_type: "menu_item"
entity_name: "Margherita Pizza"
entity_code: "PIZZA_MARG"

-- Customers
entity_type: "customer"
entity_name: "John Smith"
entity_code: "CUST_001"

-- Staff
entity_type: "employee"
entity_name: "Sarah Johnson"
entity_code: "EMP_CHEF_01"

-- Tables
entity_type: "table"
entity_name: "Table 5"
entity_code: "TBL_05"

-- Suppliers
entity_type: "supplier"
entity_name: "Fresh Produce Co"
entity_code: "SUPP_PRODUCE"
```

### 3. **core_dynamic_data** - Custom Restaurant Properties

**Restaurant Use**: Menu pricing, dietary info, customer preferences, staff roles

```sql
-- Menu Item Properties
entity_id: pizza_margherita_id
field_name: "price" | field_value: "18.50"
field_name: "ingredients" | field_value: "Tomato, Mozzarella, Basil"
field_name: "dietary_tags" | field_value: "vegetarian,gluten_free_option"
field_name: "prep_time" | field_value: "12"
field_name: "category" | field_value: "pizza"

-- Customer Properties
entity_id: customer_john_id
field_name: "phone" | field_value: "+1-555-123-4567"
field_name: "allergies" | field_value: "nuts,shellfish"
field_name: "preferred_table" | field_value: "window_seat"
field_name: "loyalty_points" | field_value: "450"

-- Staff Properties
entity_id: employee_sarah_id
field_name: "role" | field_value: "head_chef"
field_name: "hourly_rate" | field_value: "28.50"
field_name: "shift_preference" | field_value: "evening"
field_name: "certifications" | field_value: "food_safety,wine_sommelier"
```

### 4. **core_relationships** - Restaurant Connections

**Restaurant Use**: Recipe ingredients, customer favorites, staff assignments

```sql
-- Recipe Relationships (Pizza -> Ingredients)
parent_entity_id: pizza_margherita_id
child_entity_id: mozzarella_cheese_id
relationship_type: "recipe_ingredient"
relationship_data: '{"quantity": "200g", "preparation": "fresh_sliced"}'

-- Customer Favorites
parent_entity_id: customer_john_id
child_entity_id: pizza_margherita_id
relationship_type: "customer_favorite"
relationship_data: '{"order_frequency": 8, "last_ordered": "2024-01-15"}'

-- Staff Table Assignments
parent_entity_id: employee_sarah_id
child_entity_id: table_5_id
relationship_type: "server_assignment"
relationship_data: '{"shift": "dinner", "primary": true}'
```

### 5. **universal_transactions** - All Restaurant Business Events

**Restaurant Use**: Orders, payments, inventory purchases, payroll

```sql
-- Customer Order
transaction_type: "order"
transaction_date: "2024-01-20 19:30:00"
reference_number: "ORD-2024-001"
total_amount: 67.50
transaction_data: '{"table_number": 5, "server": "Sarah", "payment_method": "card"}'

-- Supplier Purchase
transaction_type: "purchase"
transaction_date: "2024-01-20 08:00:00"
reference_number: "PUR-2024-018"
total_amount: 247.80
transaction_data: '{"supplier": "Fresh Produce Co", "delivery_date": "2024-01-20"}'

-- Staff Payment
transaction_type: "payroll"
transaction_date: "2024-01-19 23:59:59"
reference_number: "PAY-2024-003"
total_amount: 1247.50
transaction_data: '{"pay_period": "2024-01-06_to_2024-01-19", "hours": 43.75}'
```

### 6. **universal_transaction_lines** - Detailed Breakdown

**Restaurant Use**: Order items, ingredient purchases, payroll details

```sql
-- Order Line Items
transaction_id: order_transaction_id
line_type: "order_item"
entity_id: pizza_margherita_id
quantity: 1
unit_price: 18.50
line_total: 18.50
line_data: '{"special_instructions": "extra_basil", "modification": "gluten_free_crust"}'

-- Purchase Line Items
transaction_id: purchase_transaction_id
line_type: "purchase_item"
entity_id: mozzarella_cheese_id
quantity: 10
unit_price: 12.50
line_total: 125.00
line_data: '{"expiry_date": "2024-02-15", "storage": "refrigerated"}'

-- Payroll Line Items
transaction_id: payroll_transaction_id
line_type: "pay_component"
entity_id: employee_sarah_id
quantity: 43.75
unit_price: 28.50
line_total: 1246.87
line_data: '{"component": "regular_hours", "overtime_hours": 3.75}'
```

## Restaurant Business Logic Examples

### Taking an Order (Universal Transaction Pattern)

1. **Create Transaction**: New record in `universal_transactions` with type "order"
2. **Add Line Items**: Each menu item goes to `universal_transaction_lines`
3. **Link Entities**: Connect to customer, table, server via entity relationships
4. **Custom Data**: Store special instructions, modifications in dynamic_data

### Menu Management (Universal Entity Pattern)

1. **Create Menu Item**: New record in `core_entities` with type "menu_item"
2. **Add Properties**: Price, ingredients, dietary info in `core_dynamic_data`
3. **Recipe Links**: Connect ingredients via `core_relationships`
4. **Categorization**: Menu categories stored as entity relationships

### Customer Loyalty (Universal Relationship Pattern)

1. **Track Orders**: All customer orders linked via `core_relationships`
2. **Calculate Points**: Dynamic field in `core_dynamic_data` tracks loyalty points
3. **Preferences**: Store favorite dishes, allergies as dynamic data
4. **History**: Transaction history provides complete customer journey

## Benefits of Universal Architecture for Restaurants

### 🔄 **Flexibility**

- Add new menu categories without database changes
- Custom fields for dietary restrictions, prep instructions
- Easily adapt for different restaurant types (fast food, fine dining, etc.)

### 📊 **Unified Reporting**

- Single query across all business data
- Real-time analytics on sales, inventory, staff performance
- Cross-reference any business elements (customer preferences vs. inventory)

### 🚀 **Scalability**

- Same structure works for single restaurant or 1000+ locations
- Add new business concepts without schema migrations
- Handle seasonal menus, special events, catering orders

### 🤖 **AI-Ready**

- Universal structure perfect for machine learning
- Predict customer orders, optimize inventory, schedule staff
- Pattern recognition across all business data

This restaurant system demonstrates how HERA's 6 universal tables can handle the complete complexity of restaurant operations without requiring industry-specific database schemas.
