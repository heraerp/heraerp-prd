#!/usr/bin/env node

// Seed kitchen order data for Mario's Restaurant
const organizationId = '6f591f1a-ea86-493e-8ae4-639d28a7e3c8'

console.log(`
Run these commands in mcp-server directory to create kitchen orders:

# Create orders with kitchen-specific metadata
DEFAULT_ORGANIZATION_ID=${organizationId} node hera-cli.js create-transaction sale 45.50
DEFAULT_ORGANIZATION_ID=${organizationId} node hera-cli.js create-transaction sale 78.25
DEFAULT_ORGANIZATION_ID=${organizationId} node hera-cli.js create-transaction sale 32.00
DEFAULT_ORGANIZATION_ID=${organizationId} node hera-cli.js create-transaction sale 56.75

# To update order metadata (replace transaction-id with actual IDs):
# node hera-cli.js update-transaction <transaction-id> --metadata '{"table_number":"1","status":"new","priority":"normal"}'

# Example metadata for kitchen orders:
{
  "table_number": "1",
  "server_name": "Maria",
  "order_type": "dine-in",
  "special_instructions": "Nut allergy at table",
  "priority": "normal",
  "status": "new"
}

# Create some order line items (replace transaction-id):
# node hera-cli.js create-transaction-line <transaction-id> --line-number 1 --quantity 2 --metadata '{"item_name":"Margherita Pizza","station":"STATION-PIZZA"}'
# node hera-cli.js create-transaction-line <transaction-id> --line-number 2 --quantity 1 --metadata '{"item_name":"Caesar Salad","station":"STATION-COLD","modifiers":["Extra dressing","No croutons"]}'
`)

console.log('\nNote: After creating transactions, get their IDs and update with kitchen metadata')
console.log('The kitchen display will show orders based on their status and station assignment')